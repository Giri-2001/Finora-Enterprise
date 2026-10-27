/* FINORA_P1_580N_HISTORY_GATE
 * Read-only, authenticated server history.
 * No renderer-selected URL, branch ID or token.
 */
const BASE = process.env.FINORA_LOCAL_WALLET_TEST === "1"
  ? "http://127.0.0.1:3001"
  : "https://api.finoraenterprise.com";

export type WalletHistoryEntry = {
  transactionId: string;
  transactionType: string;
  amountInr: string;
  reference: string | null;
  rechargeRequestId: string | null;
  createdAt: string;
};

export type WalletRechargeEntry = {
  requestId: string;
  amountInr: string;
  paymentMethod: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
  decidedAt: string | null;
  declineReason: string | null;
};

type HistoryResult<T> =
  | { success: true; data: {
      walletId: string;
      currency: "INR";
      entries: T[];
      hasMore: boolean;
    } }
  | { success: false; errorCode: string };

const validMoney = (x: unknown): x is string =>
  typeof x === "string" &&
  /^(0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(x);

const validSignedTransactionMoney = (x: unknown): x is string =>
  typeof x === "string" &&
  /^-?(0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(x) &&
  x !== "-0" &&
  Number(x) !== 0;
function normalizeHistoryAmount(value: string): string {
  const [whole, decimal = ""] = value.split(".");
  return whole + "." + decimal.padEnd(2, "0");
}

const validText = (x: unknown, max = 512): x is string =>
  typeof x === "string" && x.length > 0 && x.length <= max;

const optionalText = (x: unknown, max = 512) =>
  x === null || (typeof x === "string" && x.length <= max);

const validDate = (x: unknown): x is string =>
  validText(x, 50) && Number.isFinite(Date.parse(x));

const optionalDate = (x: unknown) =>
  x === null || validDate(x);

function object(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function transaction(x: unknown): x is WalletHistoryEntry {
  return object(x) &&
    validText(x.transactionId, 128) &&
    validText(x.transactionType, 128) &&
    validSignedTransactionMoney(x.amountInr) &&
    optionalText(x.reference) &&
    optionalText(x.rechargeRequestId, 128) &&
    validDate(x.createdAt);
}

function recharge(x: unknown): x is WalletRechargeEntry {
  return object(x) &&
    validText(x.requestId, 128) &&
    validMoney(x.amountInr) &&
    validText(x.paymentMethod, 64) &&
    (x.status === "PENDING" ||
     x.status === "APPROVED" ||
     x.status === "DECLINED") &&
    validDate(x.createdAt) &&
    optionalDate(x.decidedAt) &&
    optionalText(x.declineReason);
}

export function createFinoraServerWalletHistoryClient(
  transport: typeof fetch = globalThis.fetch,
) {
  async function read<T>(
    token: string,
    kind: "transactions" | "recharges",
    validate: (x: unknown) => x is T,
    page: { limit: number; offset: number } = {
      limit: 50,
      offset: 0,
    },
  ): Promise<HistoryResult<T>> {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return { success: false, errorCode: "UNAUTHORIZED" };
    }

    if (
      !Number.isSafeInteger(page.limit) ||
      page.limit < 1 ||
      page.limit > 100 ||
      !Number.isSafeInteger(page.offset) ||
      page.offset < 0 ||
      page.offset > 10000000
    ) {
      return { success: false, errorCode: "INVALID_REQUEST" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await transport(
        `${BASE}/owner/wallet/${kind}?limit=${page.limit}&offset=${page.offset}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${token}`,
          },
          credentials: "omit",
          redirect: "error",
          cache: "no-store",
          signal: controller.signal,
        },
      );

      // P1-713G: Status-only diagnostic; never log session credentials.
      if (process.env.FINORA_WALLET_DIAGNOSTICS === "1") {
        console.warn("[FINORA HISTORY HTTP]", {
          kind,
          status: response.status,
        });
      }

      if (response.status === 401) {
        return { success: false, errorCode: "UNAUTHORIZED" };
      }
      if (response.status !== 200) {
        return { success: false, errorCode: "SERVER_UNAVAILABLE" };
      }

      if (
        (response.headers.get("content-type") ?? "")
          .split(";")[0].trim().toLowerCase() !== "application/json"
      ) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }

      const data: unknown = await response.json();
      if (!object(data)) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }

      const expectedSource = kind === "transactions"
        ? "POSTGRESQL_WALLET_TRANSACTIONS"
        : "POSTGRESQL_RECHARGE_REQUESTS";
      const rows = data[kind === "transactions" ? "transactions" : "requests"];

      if (
        data.ok !== true ||
        data.source !== expectedSource ||
        !validText(data.walletId, 128) ||
        data.currency !== "INR" ||
        data.limit !== page.limit ||
        data.offset !== page.offset ||
        typeof data.hasMore !== "boolean" ||
        !Array.isArray(rows) ||
        rows.length > page.limit ||
        !rows.every(validate)
      ) {
        return { success: false, errorCode: "INVALID_SERVER_RESPONSE" };
      }

      return {
        success: true,
        data: {
          walletId: data.walletId,
          currency: "INR",
          entries: rows.map(row => {
            const item = row as Record<string, unknown>;
            return {
              ...item,
              amountInr: normalizeHistoryAmount(item.amountInr as string),
            } as T;
          }),
          hasMore: data.hasMore,
        },
      };
    } catch {
      return { success: false, errorCode: "SERVER_UNAVAILABLE" };
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({
    // FINORA_P1_747L_PAGED_HISTORY
    // Same authenticated read(), with server-validated pagination.
    transactionsPage: (
      sessionToken: string,
      page: { limit: number; offset: number },
    ) => read(sessionToken, "transactions", transaction, page),
    rechargesPage: (
      sessionToken: string,
      page: { limit: number; offset: number },
    ) => read(sessionToken, "recharges", recharge, page),
    transactions: (token: string) =>
      read(token, "transactions", transaction),
    recharges: (token: string) =>
      read(token, "recharges", recharge),
  });
}