const FINORA_WALLET_API_BASE =
  process.env.FINORA_LOCAL_WALLET_TEST === "1"
    ? "http://127.0.0.1:3000"
    : "https://api.finoraenterprise.com";
// Main-process client. Never persist tokens or use local wallet fallback.
// Session acquisition and branch association must be enforced by the caller.

const BALANCE_URL =
  `${FINORA_WALLET_API_BASE}/owner/wallet/balance`;

export interface FinoraServerWalletBalance {
  source: "POSTGRESQL_WALLETS";
  walletId: string;
  balanceInr: string;
  currency: "INR";
  updatedAt: string;
}

export type FinoraServerWalletBalanceResult =
  | { success: true; data: FinoraServerWalletBalance }
  | {
      success: false;
      errorCode:
        | "UNAUTHORIZED"
        | "WALLET_NOT_FOUND"
        | "SERVER_UNAVAILABLE"
        | "INVALID_SERVER_RESPONSE";
    };

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function failure(
  errorCode: Extract<
    FinoraServerWalletBalanceResult,
    { success: false }
  >["errorCode"],
): FinoraServerWalletBalanceResult {
  return { success: false, errorCode };
}

// Transport injection is an internal test dependency, never IPC input.
// The destination remains fixed even when transport is injected.
export function createFinoraServerWalletBalanceClient(
  transport: typeof fetch = globalThis.fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("SERVER_WALLET_TRANSPORT_INVALID");
  }

  return async function readServerWalletBalance(
    accessToken: string,
  ): Promise<FinoraServerWalletBalanceResult> {
    if (
      typeof accessToken !== "string" ||
      accessToken.length !== 64 ||
      /[^a-f0-9]/.test(accessToken)
    ) {
      return failure("UNAUTHORIZED");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await transport(BALANCE_URL, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        redirect: "error",
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 401) return failure("UNAUTHORIZED");
      if (response.status === 404) return failure("WALLET_NOT_FOUND");
      if (response.status !== 200) return failure("SERVER_UNAVAILABLE");

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
        return failure("INVALID_SERVER_RESPONSE");
      }

      let body: Record<string, unknown> | null;
      try {
        body = object(await response.json());
      } catch {
        return failure(
          controller.signal.aborted
            ? "SERVER_UNAVAILABLE"
            : "INVALID_SERVER_RESPONSE",
        );
      }

      if (!body) return failure("INVALID_SERVER_RESPONSE");

      const { walletId, balanceInr, updatedAt } = body;

      if (
        body.ok !== true ||
        body.source !== "POSTGRESQL_WALLETS" ||
        body.currency !== "INR" ||
        typeof walletId !== "string" ||
        walletId.length < 8 || walletId.length > 12 ||
        /[^0-9]/.test(walletId) ||
        typeof balanceInr !== "string" ||
        balanceInr.length > 13 ||
        !/^(?:0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(balanceInr) ||
        /[\r\n]/.test(balanceInr) ||
        typeof updatedAt !== "string" ||
        updatedAt.length === 0 || updatedAt.length > 40 ||
        !Number.isFinite(Date.parse(updatedAt))
      ) {
        return failure("INVALID_SERVER_RESPONSE");
      }

      return {
        success: true,
        data: {
          source: "POSTGRESQL_WALLETS",
          walletId,
          balanceInr,
          currency: "INR",
          updatedAt,
        },
      };
    } catch {
      return failure("SERVER_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  };
}