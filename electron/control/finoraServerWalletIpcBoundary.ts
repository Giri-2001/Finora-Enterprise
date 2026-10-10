import type { IpcMainInvokeEvent } from "electron";
import type {
  createFinoraServerWalletOnlineAccess,
} from "./finoraServerWalletOnlineAccess.js";

type Service = ReturnType<typeof createFinoraServerWalletOnlineAccess>;
type Credentials = Parameters<Service["signIn"]>[0];

const fail = (errorCode: string) => ({ success: false as const, errorCode });
const errors = new Set([
  "INVALID_REQUEST", "SERVER_REJECTED", "RATE_LIMITED",
  "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
  "WALLET_IDENTITY_UNVERIFIED", "KEY_ENROLLMENT_REQUIRED",
  "WALLET_ACCESS_UNAVAILABLE", "KEY_CONFLICT",
  "UNAUTHORIZED", "WALLET_NOT_FOUND", "STALE_OPERATION",
  "WALLET_NOT_AVAILABLE", "IDEMPOTENCY_CONFLICT",
]);

function safeError(code: unknown): string {
  return typeof code === "string" && errors.has(code)
    ? code : "SERVER_UNAVAILABLE";
}

function credentials(input: unknown): Credentials | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).length !== 3 ||
    !["username", "password", "securityCode"].every(
      field => Object.hasOwn(value, field),
    ) ||
    typeof value.username !== "string" ||
    value.username.length > 128 || value.username.trim().length === 0 ||
    /[\u0000-\u001f\u007f]/.test(value.username) ||
    typeof value.password !== "string" ||
    typeof value.securityCode !== "string" ||
    value.password.length === 0 || value.securityCode.length === 0 ||
    Buffer.byteLength(value.password, "utf8") > 72 ||
    Buffer.byteLength(value.securityCode, "utf8") > 72
  ) return null;

  return {
    username: value.username,
    password: value.password,
    securityCode: value.securityCode,
  };
}

// Main-process boundary only; not registered with ipcMain yet.
// Navigation/reload/window destruction must call invalidate() when wired.
export function createFinoraServerWalletIpcBoundary(options: {
  service: Service;
  authorize: (event: IpcMainInvokeEvent) => boolean;
}) {
  const service = options?.service;
  const authorize = options?.authorize;
  if (
    !service || typeof authorize !== "function" ||
    ["enroll", "signIn", "balance", "logout", "clearLocal"].some(
      method => typeof service[method as keyof Service] !== "function",
    )
  ) throw new Error("WALLET_IPC_DEPENDENCIES_INVALID");

  let revision = 0;

  function trusted(event: IpcMainInvokeEvent): boolean {
    try { return authorize(event) === true; }
    catch { return false; }
  }

  function invalidate(): void {
    revision++;
    service.clearLocal();
  }

  async function invoke(
    kind: "enroll" | "signIn" | "balance" | "logout",
    event: IpcMainInvokeEvent,
    input?: unknown,
  ) {
    if (!trusted(event)) return fail("UNAUTHORIZED");

    const supplied = kind === "enroll" || kind === "signIn"
      ? credentials(input) : null;
    if (
      ((kind === "enroll" || kind === "signIn") && !supplied) ||
      ((kind === "balance" || kind === "logout") && input !== undefined)
    ) return fail("INVALID_REQUEST");

    // A replacement login, enrollment or logout invalidates older replies.
    if (kind !== "balance") revision++;
    const current = revision;

    try {
      const result = kind === "enroll"
        ? await service.enroll(supplied!)
        : kind === "signIn"
          ? await service.signIn(supplied!)
          : kind === "logout"
            ? await service.logout()
            : await service.balance();

      if (current !== revision) return fail("STALE_OPERATION");
      if (!trusted(event)) {
        invalidate();
        return fail("UNAUTHORIZED");
      }

      if (kind === "logout") {
        const outcome = result as {
          localCleared?: unknown; serverStatus?: unknown;
        };
        if (outcome?.localCleared !== true) return fail("SERVER_UNAVAILABLE");
        const statuses = new Set([
          "REVOKED", "NOT_REVOKED", "NO_LOCAL_SESSION",
          "UNAUTHORIZED", "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
        ]);
        return {
          localCleared: true,
          serverStatus: typeof outcome.serverStatus === "string" &&
            statuses.has(outcome.serverStatus)
            ? outcome.serverStatus : "SERVER_UNAVAILABLE",
        };
      }

      const response = result as {
        success?: boolean; errorCode?: unknown;
        data?: Record<string, unknown>;
      };
      if (response?.success !== true) return fail(safeError(response?.errorCode));
      const data = response.data;
      if (!data) return fail("INVALID_SERVER_RESPONSE");

      // Explicit response fields: never serialize the entire service result.
      if (kind === "signIn") {
        if (typeof data.expiresAt !== "string" ||
            !Number.isFinite(Date.parse(data.expiresAt))) {
          return fail("INVALID_SERVER_RESPONSE");
        }
        return { success: true, data: { expiresAt: data.expiresAt } };
      }
      if (kind === "enroll") {
        if (typeof data.keyId !== "string" ||
            typeof data.enrolledAt !== "string" ||
            !Number.isFinite(Date.parse(data.enrolledAt))) {
          return fail("INVALID_SERVER_RESPONSE");
        }
        return {
          success: true,
          data: { keyId: data.keyId, enrolledAt: data.enrolledAt },
        };
      }

      if (
        data.source !== "POSTGRESQL_WALLETS" || data.currency !== "INR" ||
        typeof data.walletId !== "string" ||
        !/^[0-9]{8,12}$/.test(data.walletId) ||
        typeof data.balanceInr !== "string" ||
        !/^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(data.balanceInr) ||
        typeof data.updatedAt !== "string" ||
        !Number.isFinite(Date.parse(data.updatedAt))
      ) return fail("INVALID_SERVER_RESPONSE");

      return {
        success: true,
        data: {
          source: data.source, walletId: data.walletId,
          balanceInr: data.balanceInr, currency: data.currency,
          updatedAt: data.updatedAt,
        },
      };
    } catch {
      return fail(current !== revision ? "STALE_OPERATION" : "SERVER_UNAVAILABLE");
    }
  }

  // FINORA_P565J_PRICING
  // Trusted Owner renderer only. No caller-supplied token or branch.
  async function pricing(
    event: IpcMainInvokeEvent,
    input?: unknown,
  ) {
    if (!trusted(event)) return fail("UNAUTHORIZED");
    if (input !== undefined) return fail("INVALID_REQUEST");

    const current = revision;

    try {
      const result = await service.pricing();

      if (current !== revision) return fail("STALE_OPERATION");

      if (!trusted(event)) {
        invalidate();
        return fail("UNAUTHORIZED");
      }

      if (result?.success !== true) {
        return fail(safeError(result?.errorCode));
      }

      const data = result.data;

      if (
        !data ||
        data.source !== "FINORA_POSTGRESQL_PRICING" ||
        typeof data.branchId !== "string" ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(data.branchId) ||
        !Array.isArray(data.plans) ||
        data.plans.length !== 4
      ) {
        return fail("INVALID_SERVER_RESPONSE");
      }

      const months = [1, 3, 6, 12];
      const serviceCodes = [
        "CUSTOMER_CREATE",
        "LOAN_DISBURSEMENT",
        "COLLECTION_BELOW_25000",
        "COLLECTION_25000_TO_50000",
        "COLLECTION_ABOVE_50000",
      ];

      const money = (value: unknown): value is string =>
        typeof value === "string" &&
        /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(value);

      for (let i = 0; i < months.length; i++) {
        const plan = data.plans[i];

        if (
          !plan ||
          plan.months !== months[i] ||
          !money(plan.regularPriceInr) ||
          !money(plan.offerPriceInr) ||
          !plan.fees ||
          serviceCodes.some(
            code =>
              !money(
                plan.fees[
                  code as keyof typeof plan.fees
                ],
              ),
          )
        ) return fail("INVALID_SERVER_RESPONSE");
      }

      // No session token, keys or credentials are serialized.
      return {
        success: true as const,
        data: {
          source: data.source,
          branchId: data.branchId,
          plans: data.plans.map(plan => ({
            months: plan.months,
            regularPriceInr: plan.regularPriceInr,
            offerPriceInr: plan.offerPriceInr,
            fees: { ...plan.fees },
          })),
          currentSubscription: data.currentSubscription
            ? { ...data.currentSubscription }
            : null,
        },
      };
    } catch {
      return fail(
        current !== revision
          ? "STALE_OPERATION"
          : "SERVER_UNAVAILABLE",
      );
    }
  }
  async function recharge(event: IpcMainInvokeEvent, input: unknown) {
    if (!trusted(event)) return fail("UNAUTHORIZED");
    const current = revision;

    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) {
        return fail("INVALID_REQUEST");
      }
      const value = input as Record<string, unknown>;
      if (
        Object.keys(value).length !== 3 ||
        !["amountInr", "paymentMethod", "idempotencyKey"].every(
          field => Object.hasOwn(value, field),
        )
      ) return fail("INVALID_REQUEST");

      const { amountInr, paymentMethod, idempotencyKey } = value;
      const validUuid = (id: unknown): id is string =>
        typeof id === "string" && id.length === 36 &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (
        typeof amountInr !== "number" ||
        !Number.isSafeInteger(amountInr) ||
        amountInr < 50 || amountInr > 2000 ||
        (paymentMethod !== "PHONEPE" && paymentMethod !== "GOOGLE_PAY") ||
        !validUuid(idempotencyKey)
      ) return fail("INVALID_REQUEST");

      // Snapshot before awaiting; duplicate submissions retain their retry key.
      const result = await service.recharge({
        amountInr, paymentMethod,
        idempotencyKey: idempotencyKey.toLowerCase(),
      });

      if (current !== revision) return fail("STALE_OPERATION");
      if (!trusted(event)) {
        invalidate();
        return fail("UNAUTHORIZED");
      }

      if (result?.success !== true) {
        return fail(safeError(result?.errorCode));
      }

      const data = result.data;
      const request = data?.request;
      if (
        !data || !request ||
        data.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
        typeof data.replayed !== "boolean" ||
        !validUuid(request.requestId) ||
        typeof request.walletId !== "string" ||
        request.walletId.length < 8 || request.walletId.length > 12 ||
        /[^0-9]/.test(request.walletId) ||
        request.amountInr !== amountInr.toFixed(2) ||
        request.paymentMethod !== paymentMethod ||
        !["PENDING", "APPROVED", "DECLINED"].includes(request.status) ||
        (!data.replayed && request.status !== "PENDING") ||
        typeof request.createdAt !== "string" ||
        request.createdAt.length === 0 || request.createdAt.length > 40 ||
        !Number.isFinite(Date.parse(request.createdAt))
      ) return fail("INVALID_SERVER_RESPONSE");

      return {
        success: true as const,
        data: {
          source: data.source,
          request: {
            requestId: request.requestId,
            walletId: request.walletId,
            amountInr: request.amountInr,
            paymentMethod: request.paymentMethod,
            status: request.status,
            createdAt: request.createdAt,
          },
          replayed: data.replayed,
        },
      };
    } catch {
      return fail(current !== revision ? "STALE_OPERATION" : "SERVER_UNAVAILABLE");
    }
  }

  return Object.freeze({
    enroll: (event: IpcMainInvokeEvent, input: unknown) =>
      invoke("enroll", event, input),
    signIn: (event: IpcMainInvokeEvent, input: unknown) =>
      invoke("signIn", event, input),
    balance: (event: IpcMainInvokeEvent, input?: unknown) =>
      invoke("balance", event, input),
    logout: (event: IpcMainInvokeEvent, input?: unknown) =>
      invoke("logout", event, input),
    recharge,
    pricing: (event: IpcMainInvokeEvent, input?: unknown) =>
      pricing(event, input),
    invalidate,
  });
}