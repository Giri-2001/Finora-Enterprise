import type { IpcMain, WebContents, IpcMainInvokeEvent } from "electron";
import {
  createFinoraWalletRecoveryIpcBoundary,
} from "./finoraWalletRecoveryIpcBoundary.js";
import {
  createFinoraServerWalletSenderGuard,
} from "./finoraServerWalletSenderGuard.js";
import {
  createFinoraServerWalletIpcBoundary,
} from "./finoraServerWalletIpcBoundary.js";

type Service = Parameters<typeof createFinoraServerWalletIpcBoundary>[0]["service"];

export const FINORA_SERVER_WALLET_CHANNELS = Object.freeze({
  enroll: "finora:server-wallet:enroll",
  signIn: "finora:server-wallet:sign-in",
  // FINORA_P565J_PRICING
  pricing: "finora:server-wallet:pricing",
  balance: "finora:server-wallet:balance",
  logout: "finora:server-wallet:logout",
  recharge: "finora:server-wallet:recharge",
  subscriptionPurchase: "finora:server-wallet:subscription-purchase",
  subscriptionPending: "finora:server-wallet:subscription-pending",
  subscriptionResume: "finora:server-wallet:subscription-resume",
});

const registrations = new WeakSet<object>();

// Register once for the exact Owner WebContents.
// Caller must invoke invalidate() before an explicit branch/account switch.
// This registration does not expose a renderer-selected endpoint or scope.
// FINORA_P1_648R_RECEIPT
// Main IPC allowlist: only validated purchase fields leave Main.
function finoraSanitizePurchaseReceipt(raw: unknown) {
  const fail = (errorCode: string) => ({
    success: false as const, errorCode,
  });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fail("PURCHASE_RECONCILIATION_REQUIRED");
  }
  const response = raw as Record<string, unknown>;
  if (response.success === false) {
    const allowed = new Set([
      "UNAUTHORIZED", "INVALID_REQUEST", "STALE_OPERATION",
      "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
      "SERVER_IDENTITY_UNVERIFIED", "PURCHASE_IN_PROGRESS",
      "NO_PENDING_PURCHASE", "IDEMPOTENCY_CONFLICT",
      "PURCHASE_RECONCILIATION_REQUIRED",
      "PURCHASE_INTENT_LOAD_FAILED", "PURCHASE_INTENT_SAVE_FAILED",
      "PURCHASE_INTENT_CLEAR_FAILED",
      "SUBSCRIPTION_PURCHASE_NOT_ENABLED",
      "INSUFFICIENT_WALLET_BALANCE",
      "ACTIVE_PLAN_RENEWAL_NOT_ENABLED",
      "SUBSCRIPTION_PRICE_UNAVAILABLE", "WALLET_NOT_AVAILABLE",
    ]);
    return fail(
      typeof response.errorCode === "string" &&
      allowed.has(response.errorCode)
        ? response.errorCode : "PURCHASE_RECONCILIATION_REQUIRED"
    );
  }
  if (response.success !== true ||
      !response.data || typeof response.data !== "object" ||
      Array.isArray(response.data)) {
    return fail("PURCHASE_RECONCILIATION_REQUIRED");
  }
  const d = response.data as Record<string, unknown>;
  const uuid = (v: unknown) =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  const id = (v: unknown) =>
    typeof v === "string" && /^[0-9]{10,12}$/.test(v);
  const money = (v: unknown) =>
    typeof v === "string" && /^[0-9]{1,12}\.[0-9]{2}$/.test(v);
  const date = (v: unknown) =>
    typeof v === "string" &&
    v.length >= 20 && v.length <= 48 &&
    Number.isFinite(Date.parse(v));

  if (d.source !== "POSTGRESQL_SUBSCRIPTION_PURCHASE" ||
      typeof d.replayed !== "boolean" ||
      !uuid(d.purchaseId) ||
      !id(d.subscriptionId) ||
      !id(d.transactionId) ||
      !money(d.amountInr) || Number(d.amountInr) <= 0 ||
      !(d.balanceInr === null || money(d.balanceInr)) ||
      !date(d.startsAt) || !date(d.expiresAt) ||
      Date.parse(d.expiresAt as string) <= Date.parse(d.startsAt as string) ||
      d.status !== "ACTIVE") {
    return fail("PURCHASE_RECONCILIATION_REQUIRED");
  }
  return {
    success: true as const,
    data: {
      source: d.source,
      replayed: d.replayed,
      purchaseId: d.purchaseId,
      subscriptionId: d.subscriptionId,
      transactionId: d.transactionId,
      amountInr: d.amountInr,
      balanceInr: d.balanceInr,
      startsAt: d.startsAt,
      expiresAt: d.expiresAt,
      status: d.status,
    },
  };
}
export function registerFinoraServerWalletIpc(options: {
  ipc: Pick<IpcMain, "handle" | "removeHandler">;
  owner: WebContents;
  packaged: boolean;
  ownerEntryPath: string;
  service: Service;
  // FINORA_P1_752O_TRUSTED_RECHARGE_SENDER
  rechargeService?: Parameters<
    typeof createFinoraServerWalletIpcBoundary
  >[0]["rechargeService"];
  // FINORA_P1_753L_PENDING_CHANNEL
  rechargePendingService?: () => Promise<unknown>;
  // FINORA_P1_753Y2_RECOVERY_OPTION
  rechargeResumeService?: () => Promise<unknown>;
  historyService?: {
    transactions: () => Promise<unknown>;
    recharges: () => Promise<unknown>;
  };

  // FINORA_P1_633W2_PURCHASE_IPC
  // Trusted Owner Window only; server PROOF token stays in Main.
  purchaseService?: (input: unknown) => Promise<unknown>;
  purchaseStatusService?: () => Promise<unknown>;
  purchaseResumeService?: () => Promise<unknown>;
  // FINORA_P1_588G_RECOVERY_IPC
  recoveryService?: Parameters<
    typeof createFinoraWalletRecoveryIpcBoundary
  >[0]["lookup"];
}) {
  const ipc = options?.ipc;
  const owner = options?.owner;
  if (
    !ipc || typeof ipc.handle !== "function" ||
    typeof ipc.removeHandler !== "function" ||
    !owner || typeof owner.on !== "function" ||
    typeof owner.removeListener !== "function" ||
    typeof owner.isDestroyed !== "function" || owner.isDestroyed()
  ) throw new Error("WALLET_IPC_REGISTRATION_INVALID");

  if (registrations.has(ipc)) {
    throw new Error("WALLET_IPC_ALREADY_REGISTERED");
  }

  let disposed = false;
  const authorize = createFinoraServerWalletSenderGuard({
    getOwnerWebContents: () => disposed ? null : owner,
    packaged: options.packaged,
    ownerEntryPath: options.ownerEntryPath,
  });
  const boundary = createFinoraServerWalletIpcBoundary({
    service: options.service,
    authorize,
    rechargeService: options.rechargeService,
  });
  const recoveryBoundary = options.recoveryService
    ? createFinoraWalletRecoveryIpcBoundary({
        authorize,
        lookup: options.recoveryService,
      })
    : null;

  const installed: string[] = [];

  let historyRevision = 0;

  function invalidate(): void {
    if (!disposed) {
      historyRevision++;
      boundary.invalidate();
      recoveryBoundary?.invalidate();
    }
  }

  function navigation(
    details: { isMainFrame?: boolean; isSameDocument?: boolean },
    _url?: string,
    legacyInPlace?: boolean,
    legacyMainFrame?: boolean,
  ): void {
    const main = typeof details?.isMainFrame === "boolean"
      ? details.isMainFrame : legacyMainFrame;
    const sameDocument = typeof details?.isSameDocument === "boolean"
      ? details.isSameDocument : legacyInPlace;

    // Unknown event shape fails closed.
    if (main === false) return;
    if (main === true && sameDocument === true) return;

    // FINORA_P1_628N_TRUSTED_RELOAD
    // Preserve a valid Main Process Wallet session ONLY when the
    // existing and incoming documents are the same trusted app entry.
    // Never persist Wallet tokens in the renderer or browser storage.
    if (main === true && sameDocument === false) {
      try {
        const current = new URL(owner.getURL());
        const incomingValue =
          typeof details === "object" &&
          details !== null &&
          "url" in details &&
          typeof details.url === "string"
            ? details.url
            : _url;

        if (typeof incomingValue === "string") {
          const incoming = new URL(incomingValue);

          const trusted =
            !current.username &&
            !current.password &&
            !current.search &&
            !incoming.username &&
            !incoming.password &&
            !incoming.search &&
            current.href === incoming.href &&
            (
              options.packaged
                ? current.protocol === "file:" &&
                  current.href.split("#")[0] ===
                    new URL(
                      `file://${options.ownerEntryPath.replace(/\\/g, "/")}`
                    ).href
                : current.protocol === "http:" &&
                  current.hostname === "localhost" &&
                  current.port === "5173" &&
                  current.pathname === "/"
            );

          if (trusted) {
            // UI reload may restart its read operations. The existing
            // server-authorized, time-limited session remains in Main.
            return;
          }
        }
      } catch {
        // Unrecognized navigation: retain existing fail-closed behavior.
      }
    }
    // FINORA_P1_579QZ_NAVIGATION_TRACE
    if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
      console.warn("[FINORA WALLET SESSION CLEAR]", JSON.stringify({
        reason: "MAIN_DOCUMENT_NAVIGATION",
        mainFrame: main === true,
        sameDocument: sameDocument === true,
      }));
    }
    invalidate();
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    try {
      boundary.invalidate();
      recoveryBoundary?.invalidate();
    } finally {
      owner.removeListener("did-start-navigation", navigation);
      owner.removeListener("render-process-gone", invalidate);
      owner.removeListener("destroyed", dispose);
      for (const channel of installed) ipc.removeHandler(channel);
      registrations.delete(ipc);
    }
  }

  registrations.add(ipc);
  try {
    // FINORA_P1_588G_RECOVERY_IPC
    // One UUID argument; exact Owner sender; read-only.
    if (recoveryBoundary) {
      const channel = "finora:server-wallet:usage-recovery";
      ipc.handle(channel, (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        if (disposed) {
          return { success: false as const, errorCode: "UNAUTHORIZED" };
        }
        if (args.length !== 1) {
          return { success: false as const, errorCode: "INVALID_REQUEST" };
        }
        return recoveryBoundary.recovery(event, args[0]);
      });
      installed.push(channel);
    }
    for (const method of ["enroll", "signIn", "balance", "pricing", "logout", "recharge"] as const) {
      const channel = FINORA_SERVER_WALLET_CHANNELS[method];
      ipc.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
        if (disposed) return { success: false, errorCode: "UNAUTHORIZED" };
        const expected = method === "enroll" || method === "signIn" || method === "recharge" ? 1 : 0;
        if (args.length !== expected) {
          return { success: false, errorCode: "INVALID_REQUEST" };
        }
        // FINORA_P1_588O_LOGOUT_RECOVERY_INVALIDATION
        // A valid Owner logout request immediately invalidates in-flight
        // recovery reads, even if server revocation later fails.
        if (method === "logout" && authorize(event)) {
          invalidate();
        }
        return boundary[method](event, args[0]);
      });
      installed.push(channel);
    }

    // FINORA_P1_753Y2_RECOVERY_IPC
    {
      const channel = "finora:server-wallet:recharge-resume";

      ipc.handle(channel, async (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        const fail = (errorCode: string) => ({
          success: false as const,
          errorCode,
        });

        if (
          disposed ||
          !authorize(event) ||
          args.length !== 0 ||
          !options.rechargeResumeService
        ) {
          return fail("UNAUTHORIZED");
        }

        const ticket = historyRevision;

        try {
          const input = await options.rechargeResumeService();

          if (
            disposed ||
            ticket !== historyRevision ||
            !authorize(event)
          ) {
            return fail("STALE_OPERATION");
          }

          if (
            !input ||
            typeof input !== "object" ||
            Array.isArray(input)
          ) {
            return fail("NO_PENDING_RECHARGE");
          }

          // Reuse existing authenticated Recharge IPC boundary:
          // sender validation, request validation, response sanitization.
          // Main's existing Recharge service validates Wallet scope,
          // server response and exact encrypted-intent settlement.
          return await boundary.recharge(event, input);
        } catch {
          return fail("RECHARGE_RECONCILIATION_REQUIRED");
        }
      });

      installed.push(channel);
    }

    // FINORA_P1_753L_PENDING_CHANNEL
    // Read-only. No renderer-selected scope or original UUID.
    {
      const channel = "finora:server-wallet:recharge-pending";
      ipc.handle(channel, async (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        const fail = (errorCode: string) => ({
          success: false as const, errorCode,
        });
        if (disposed || !authorize(event) ||
            args.length !== 0 || !options.rechargePendingService) {
          return fail("UNAUTHORIZED");
        }
        const ticket = historyRevision;
        try {
          const result = await options.rechargePendingService();
          if (disposed || ticket !== historyRevision) {
            return fail("STALE_OPERATION");
          }
          if (!authorize(event)) return fail("UNAUTHORIZED");
          if (!result || typeof result !== "object" ||
              Array.isArray(result)) return fail("SERVER_UNAVAILABLE");
          const value = result as Record<string, unknown>;
          if (value.success !== true) {
            return fail(
              typeof value.errorCode === "string" &&
              ["UNAUTHORIZED", "STALE_OPERATION",
               "RECHARGE_INTENT_LOAD_FAILED"].includes(value.errorCode)
                ? value.errorCode : "SERVER_UNAVAILABLE"
            );
          }
          const data = value.data;
          if (!data || typeof data !== "object" ||
              Array.isArray(data)) return fail("INVALID_SERVER_RESPONSE");
          const status = data as Record<string, unknown>;
          if (typeof status.pending !== "boolean" ||
              !(status.amountInr === null ||
                (Number.isSafeInteger(status.amountInr) &&
                 (status.amountInr as number) >= 50 &&
                 (status.amountInr as number) <= 2000)) ||
              !(status.paymentMethod === null ||
                status.paymentMethod === "PHONEPE" ||
                status.paymentMethod === "GOOGLE_PAY") ||
              (status.pending &&
               (status.amountInr === null ||
                status.paymentMethod === null)) ||
              (!status.pending &&
               (status.amountInr !== null ||
                status.paymentMethod !== null))) {
            return fail("INVALID_SERVER_RESPONSE");
          }
          return {
            success: true as const,
            data: {
              pending: status.pending,
              amountInr: status.amountInr,
              paymentMethod: status.paymentMethod,
            },
          };
        } catch {
          return fail("SERVER_UNAVAILABLE");
        }
      });
      installed.push(channel);
    }

    // FINORA_P1_648B_PENDING_STATUS
    // Zero-argument, trusted Owner only. No UUID or token in response.
    {
      const channel = FINORA_SERVER_WALLET_CHANNELS.subscriptionPending;
      ipc.handle(channel, async (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        const fail = (errorCode: string) => ({
          success: false as const,
          errorCode,
        });

        if (disposed || !authorize(event) ||
            args.length !== 0 || !options.purchaseStatusService) {
          return fail("UNAUTHORIZED");
        }

        const ticket = historyRevision;

        try {
          const result = await options.purchaseStatusService();

          if (disposed || ticket !== historyRevision) {
            return fail("STALE_OPERATION");
          }
          if (!authorize(event)) return fail("UNAUTHORIZED");

          if (!result || typeof result !== "object" ||
              Array.isArray(result)) return fail("SERVER_UNAVAILABLE");

          const value = result as Record<string, unknown>;
          if (value.success !== true) {
            return fail("UNAUTHORIZED");
          }

          const data = value.data;
          if (!data || typeof data !== "object" ||
              Array.isArray(data)) return fail("INVALID_SERVER_RESPONSE");

          const status = data as Record<string, unknown>;

          if (typeof status.pending !== "boolean" ||
              !(status.planMonths === null ||
                [1, 3, 6, 12].includes(status.planMonths as number)) ||
              (status.pending && status.planMonths === null) ||
              (!status.pending && status.planMonths !== null)) {
            return fail("INVALID_SERVER_RESPONSE");
          }

          return {
            success: true as const,
            data: {
              pending: status.pending,
              planMonths: status.planMonths,
            },
          };
        } catch {
          return fail("SERVER_UNAVAILABLE");
        }
      });
      installed.push(channel);
    }

    // FINORA_P1_648E_RESUME
    // Zero arguments: renderer never supplies pending UUID or scope.
    {
      const channel = FINORA_SERVER_WALLET_CHANNELS.subscriptionResume;
      ipc.handle(channel, async (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        const fail = (errorCode: string) => ({
          success: false as const, errorCode,
        });
        if (disposed || !authorize(event) ||
            args.length !== 0 || !options.purchaseResumeService) {
          return fail("UNAUTHORIZED");
        }

        const ticket = historyRevision;
        try {
          const result = await options.purchaseResumeService();
          if (disposed || ticket !== historyRevision) {
            return fail("STALE_OPERATION");
          }
          if (!authorize(event)) return fail("UNAUTHORIZED");

          if (!result || typeof result !== "object" ||
              Array.isArray(result)) return fail("SERVER_UNAVAILABLE");

          return finoraSanitizePurchaseReceipt(result);
        } catch {
          return fail("PURCHASE_RECONCILIATION_REQUIRED");
        }
      });
      installed.push(channel);
    }
    // FINORA_P1_633W2_PURCHASE_HANDLER
    // Separate from legacy Wallet IPC boundary.
    // Never accept renderer-provided ownerId, branchId, token or URL.
    {
      const channel = FINORA_SERVER_WALLET_CHANNELS.subscriptionPurchase;

      ipc.handle(channel, async (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        const fail = (errorCode: string) => ({
          success: false as const,
          errorCode,
        });

        if (
          disposed ||
          !authorize(event) ||
          args.length !== 1 ||
          !options.purchaseService
        ) {
          return fail("UNAUTHORIZED");
        }

        const input = args[0];

        if (
          input === null ||
          typeof input !== "object" ||
          Array.isArray(input) ||
          Object.getPrototypeOf(input) !== Object.prototype
        ) {
          return fail("INVALID_REQUEST");
        }

        const value = input as Record<string, unknown>;

        if (
          Object.keys(value).length !== 2 ||
          ![1, 3, 6, 12].includes(value.planMonths as number) ||
          typeof value.idempotencyKey !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value.idempotencyKey,
          )
        ) {
          return fail("INVALID_REQUEST");
        }

        const ticket = historyRevision;

        try {
          const result = await options.purchaseService({
            planMonths: value.planMonths,
            idempotencyKey: value.idempotencyKey.toLowerCase(),
          });

          if (disposed || historyRevision !== ticket) {
            return fail("STALE_OPERATION");
          }

          return finoraSanitizePurchaseReceipt(result);
        } catch {
          return fail("SERVER_UNAVAILABLE");
        }
      });

      installed.push(channel);
    }

    // FINORA_P1_580O_SECURE_HISTORY_IPC
    // Exact Owner sender, zero arguments, authenticated Proof reads.
    // Never expose the server token or an arbitrary URL.
    for (const kind of ["transactions", "recharges"] as const) {
      const channel = `finora:server-wallet:${kind}`;

      ipc.handle(channel, async (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => {
        const fail = (errorCode: string) => ({
          success: false as const, errorCode,
        });

        if (disposed || args.length !== 0 || !authorize(event)) {
          return fail("UNAUTHORIZED");
        }

        const ticket = historyRevision;

        try {
          const result = await options.historyService?.[kind]();

          if (disposed || ticket !== historyRevision) {
            return fail("STALE_OPERATION");
          }
          if (!authorize(event)) {
            invalidate();
            return fail("UNAUTHORIZED");
          }

          if (!result || typeof result !== "object") {
            return fail("SERVER_UNAVAILABLE");
          }

          const value = result as {
            success?: unknown;
            errorCode?: unknown;
            data?: {
              walletId?: unknown;
              currency?: unknown;
              entries?: unknown;
              hasMore?: unknown;
            };
          };

          if (value.success !== true) {
            const allowed = [
              "UNAUTHORIZED", "STALE_OPERATION",
              "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
              "SERVER_IDENTITY_UNVERIFIED",
            ];
            return fail(
              typeof value.errorCode === "string" &&
              allowed.includes(value.errorCode)
                ? value.errorCode : "SERVER_UNAVAILABLE"
            );
          }

          const data = value.data;
          if (
            !data ||
            typeof data.walletId !== "string" ||
            !/^[0-9]{8,12}$/.test(data.walletId) ||
            data.currency !== "INR" ||
            !Array.isArray(data.entries) ||
            data.entries.length > 50 ||
            typeof data.hasMore !== "boolean"
          ) {
            return fail("INVALID_SERVER_RESPONSE");
          }

          const rows = data.entries.map((entry: unknown) => {
            if (!entry || typeof entry !== "object" ||
                Array.isArray(entry)) return null;

            const e = entry as Record<string, unknown>;
            const text = (x: unknown, max = 512) =>
              typeof x === "string" && x.length > 0 &&
              x.length <= max;
            const optional = (x: unknown, max = 512) =>
              x === null || (typeof x === "string" &&
                x.length <= max);
            const money = (x: unknown) =>
              typeof x === "string" &&
              /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(x);
            const date = (x: unknown) =>
              text(x, 50) &&
              Number.isFinite(Date.parse(x as string));

            // Signed amounts are valid in the transaction ledger.
            // Recharge requests continue to use unsigned money().
            const signedLedgerMoney = (x: unknown) =>
              typeof x === "string" &&
              /^-?(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(x) &&
              Number.isFinite(Number(x));
            if (kind === "transactions") {
              if (!text(e.transactionId, 128) ||
                  !text(e.transactionType, 128) ||
                  !signedLedgerMoney(e.amountInr) ||
                  !optional(e.reference) ||
                  !optional(e.rechargeRequestId, 128) ||
                  !date(e.createdAt)) return null;

              return {
                transactionId: e.transactionId,
                transactionType: e.transactionType,
                amountInr: e.amountInr,
                reference: e.reference,
                rechargeRequestId: e.rechargeRequestId,
                createdAt: e.createdAt,
              };
            }

            if (!text(e.requestId, 128) ||
                !money(e.amountInr) ||
                !text(e.paymentMethod, 64) ||
                !["PENDING","APPROVED","DECLINED"].includes(
                  String(e.status)
                ) ||
                !date(e.createdAt) ||
                !(e.decidedAt === null || date(e.decidedAt)) ||
                !optional(e.declineReason)) return null;

            return {
              requestId: e.requestId,
              amountInr: e.amountInr,
              paymentMethod: e.paymentMethod,
              status: e.status,
              createdAt: e.createdAt,
              decidedAt: e.decidedAt,
              declineReason: e.declineReason,
            };
          });

          if (rows.some(row => row === null)) {
            return fail("INVALID_SERVER_RESPONSE");
          }

          return {
            success: true as const,
            data: {
              walletId: data.walletId,
              currency: "INR" as const,
              entries: rows,
              hasMore: data.hasMore,
            },
          };
        } catch {
          return fail(
            ticket !== historyRevision
              ? "STALE_OPERATION" : "SERVER_UNAVAILABLE"
          );
        }
      });

      installed.push(channel);
    }

    owner.on("did-start-navigation", navigation);
    owner.on("render-process-gone", invalidate);
    owner.on("destroyed", dispose);
  } catch {
    dispose();
    throw new Error("WALLET_IPC_REGISTRATION_FAILED");
  }

  return Object.freeze({ invalidate, dispose });
}