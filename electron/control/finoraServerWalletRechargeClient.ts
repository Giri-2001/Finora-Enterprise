const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";
// Main-process transport only. Caller owns session scope and retry identity.
// Submission success is a request receipt, never proof of a new wallet credit.
const RECHARGE_URL =
  `${FINORA_WALLET_API_BASE}/owner/wallet/recharges`;

type PaymentMethod = "PHONEPE" | "GOOGLE_PAY";
type RequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface FinoraServerWalletRechargeInput {
  amountInr: number;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export interface FinoraServerWalletRechargeReceipt {
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  request: {
    requestId: string;
    walletId: string;
    amountInr: string;
    paymentMethod: PaymentMethod;
    status: RequestStatus;
    createdAt: string;
  };
  replayed: boolean;
}

type ErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "WALLET_NOT_AVAILABLE"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_UNAVAILABLE"
  | "INVALID_SERVER_RESPONSE";

export type FinoraServerWalletRechargeResult =
  | { success: true; data: FinoraServerWalletRechargeReceipt }
  | { success: false; errorCode: ErrorCode };

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function uuid(value: unknown): value is string {
  return typeof value === "string" &&
    value.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function fail(errorCode: ErrorCode): FinoraServerWalletRechargeResult {
  return { success: false, errorCode };
}

// Bound bytes while reading, including responses without Content-Length.
async function readBody(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("INVALID_RESPONSE");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 8192) {
        try { await reader.cancel(); } catch { /* sanitized by caller */ }
        throw new Error("INVALID_RESPONSE");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

// Injection is internal test configuration, never renderer input.
export function createFinoraServerWalletRechargeClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("SERVER_WALLET_TRANSPORT_INVALID");
  }

  return async function submitServerWalletRecharge(
    accessToken: string,
    input: unknown,
  ): Promise<FinoraServerWalletRechargeResult> {
    if (
      typeof accessToken !== "string" ||
      accessToken.length !== 64 ||
      /[^a-f0-9]/.test(accessToken)
    ) return fail("UNAUTHORIZED");

    const candidate = object(input);
    if (
      !candidate ||
      Object.keys(candidate).length !== 3 ||
      !["amountInr", "paymentMethod", "idempotencyKey"].every(
        key => Object.hasOwn(candidate, key),
      )
    ) return fail("INVALID_REQUEST");

    const { amountInr, paymentMethod, idempotencyKey } = candidate;
    if (
      typeof amountInr !== "number" ||
      !Number.isSafeInteger(amountInr) ||
      amountInr < 50 || amountInr > 2000 ||
      (paymentMethod !== "PHONEPE" && paymentMethod !== "GOOGLE_PAY") ||
      !uuid(idempotencyKey)
    ) return fail("INVALID_REQUEST");

    // Snapshot before awaiting transport; never generate a replacement retry key.
    const payload = {
      amountInr,
      paymentMethod,
      idempotencyKey: idempotencyKey.toLowerCase(),
    };
    const expectedAmount = amountInr.toFixed(2);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await transport(RECHARGE_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        redirect: "error",
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 400) return fail("INVALID_REQUEST");
      if (response.status === 401) return fail("UNAUTHORIZED");
      if (response.status === 404) return fail("WALLET_NOT_AVAILABLE");
      if (response.status === 409) return fail("IDEMPOTENCY_CONFLICT");
      if (response.status === 429) return fail("RATE_LIMITED");
      if (response.status !== 200 && response.status !== 201) {
        return fail("SERVER_UNAVAILABLE");
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
        return fail("INVALID_SERVER_RESPONSE");
      }

      let body: Record<string, unknown> | null;
      try {
        body = object(await readBody(response));
      } catch {
        return fail(controller.signal.aborted
          ? "SERVER_UNAVAILABLE"
          : "INVALID_SERVER_RESPONSE");
      }

      const request = object(body?.request);
      if (
        !body || !request ||
        body.ok !== true ||
        body.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
        typeof body.replayed !== "boolean" ||
        (response.status === 201 && body.replayed !== false) ||
        (response.status === 200 && body.replayed !== true) ||
        !uuid(request.requestId) ||
        typeof request.walletId !== "string" ||
        request.walletId.length < 8 || request.walletId.length > 12 ||
        /[^0-9]/.test(request.walletId) ||
        request.amountInr !== expectedAmount ||
        request.paymentMethod !== paymentMethod ||
        (request.status !== "PENDING" &&
          request.status !== "APPROVED" &&
          request.status !== "DECLINED") ||
        (response.status === 201 && request.status !== "PENDING") ||
        typeof request.createdAt !== "string" ||
        request.createdAt.length === 0 || request.createdAt.length > 40 ||
        !Number.isFinite(Date.parse(request.createdAt))
      ) return fail("INVALID_SERVER_RESPONSE");

      return {
        success: true,
        data: {
          source: "POSTGRESQL_RECHARGE_REQUESTS",
          request: {
            requestId: request.requestId,
            walletId: request.walletId,
            amountInr: expectedAmount,
            paymentMethod,
            status: request.status,
            createdAt: request.createdAt,
          },
          replayed: body.replayed,
        },
      };
    } catch {
      return fail("SERVER_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  };
}