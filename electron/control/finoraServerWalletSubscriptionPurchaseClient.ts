/**
 * FINORA_P1_633U_SECURE_SUBSCRIPTION_CLIENT
 * Electron main-process only.
 * Never expose the bearer token to the renderer.
 * Purchase endpoint is production feature-gated and currently OFF.
 */

export type FinoraSubscriptionPurchaseInput = {
  planMonths: 1 | 3 | 6 | 12;
  idempotencyKey: string;
};

export type FinoraSubscriptionPurchaseResult =
  | {
      success: true;
      data: {
        source: "POSTGRESQL_SUBSCRIPTION_PURCHASE";
        replayed: boolean;
        purchaseId: string;
        subscriptionId: string;
        transactionId: string;
        amountInr: string;
        balanceInr: string | null;
        startsAt: string;
        expiresAt: string;
        status: "ACTIVE";
      };
    }
  | { success: false; errorCode: string };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MONEY = /^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/;

function validInput(value: unknown): value is FinoraSubscriptionPurchaseInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const v = value as Record<string, unknown>;

  return Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(v).length === 2 &&
    [1, 3, 6, 12].includes(v.planMonths as number) &&
    typeof v.idempotencyKey === "string" &&
    UUID.test(v.idempotencyKey);
}

function validReceipt(value: unknown): value is Extract<
  FinoraSubscriptionPurchaseResult,
  { success: true }
>["data"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const v = value as Record<string, unknown>;

  return v.ok === true &&
    v.source === "POSTGRESQL_SUBSCRIPTION_PURCHASE" &&
    typeof v.replayed === "boolean" &&
    typeof v.purchaseId === "string" &&
    UUID.test(v.purchaseId) &&
    typeof v.subscriptionId === "string" &&
    /^[0-9]{10,12}$/.test(v.subscriptionId) &&
    typeof v.transactionId === "string" &&
    /^[0-9]{10,12}$/.test(v.transactionId) &&
    typeof v.amountInr === "string" &&
    MONEY.test(v.amountInr) &&
    Number(v.amountInr) > 0 &&
    (v.balanceInr === null ||
      (typeof v.balanceInr === "string" &&
       MONEY.test(v.balanceInr))) &&
    typeof v.startsAt === "string" &&
    Number.isFinite(Date.parse(v.startsAt)) &&
    typeof v.expiresAt === "string" &&
    Number.isFinite(Date.parse(v.expiresAt)) &&
    Date.parse(v.expiresAt) > Date.parse(v.startsAt) &&
    v.status === "ACTIVE";
}

export function createFinoraServerWalletSubscriptionPurchaseClient(
  transport: typeof fetch = globalThis.fetch,
) {
  return async (
    token: string,
    input: unknown,
  ): Promise<FinoraSubscriptionPurchaseResult> => {
    const fail = (errorCode: string): FinoraSubscriptionPurchaseResult =>
      ({ success: false, errorCode });

    if (!validInput(input)) return fail("INVALID_REQUEST");

    if (
      typeof token !== "string" ||
      token.length < 16 ||
      token.length > 8192
    ) {
      return fail("UNAUTHORIZED");
    }

    if (typeof transport !== "function") {
      return fail("SERVER_UNAVAILABLE");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await transport(
        "https://api.finoraenterprise.com/owner/wallet/subscriptions/purchase",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            planMonths: input.planMonths,
            idempotencyKey: input.idempotencyKey.toLowerCase(),
          }),
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          signal: controller.signal,
        },
      );

      if (response.status === 401) return fail("UNAUTHORIZED");

      if (
        response.headers.get("content-type")
          ?.split(";")[0].trim().toLowerCase() !== "application/json"
      ) {
        return fail("INVALID_SERVER_RESPONSE");
      }

      const body: unknown = await response.json();

      if (!response.ok) {
        if (body && typeof body === "object" && !Array.isArray(body)) {
          const code = (body as Record<string, unknown>).error;
          const allowed = [
            "SUBSCRIPTION_PURCHASE_NOT_ENABLED",
            "INSUFFICIENT_WALLET_BALANCE",
            "IDEMPOTENCY_CONFLICT",
            "ACTIVE_PLAN_RENEWAL_NOT_ENABLED",
            "SUBSCRIPTION_PRICE_UNAVAILABLE",
            "WALLET_NOT_AVAILABLE",
            "UNAUTHORIZED",
            "INVALID_REQUEST",
          ];
          if (typeof code === "string" && allowed.includes(code)) {
            return fail(code);
          }
        }
        return fail("SERVER_UNAVAILABLE");
      }

      if (!validReceipt(body)) {
        return fail("INVALID_SERVER_RESPONSE");
      }

      return {
        success: true,
        data: {
          source: body.source,
          replayed: body.replayed,
          purchaseId: body.purchaseId,
          subscriptionId: body.subscriptionId,
          transactionId: body.transactionId,
          amountInr: body.amountInr,
          balanceInr: body.balanceInr,
          startsAt: body.startsAt,
          expiresAt: body.expiresAt,
          status: body.status,
        },
      };
    } catch {
      // Request outcome may be unknown after a transport timeout.
      // Caller MUST retry with the identical durable idempotency key.
      return fail("SERVER_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
    }
  };
}