/*
 * FINORA_P1_741X_SERVER_RECHARGE_HISTORY
 * Electron main-process only.
 * Read-only. No approval, wallet mutation or credential export.
 */

const API_BASE = "https://api.finoraenterprise.com";

export interface FinoraRechargeHistoryRecord {
  requestId: string;
  amountInr: string;
  paymentMethod: string;
  status: "APPROVED" | "DECLINED";
  createdAt: string;
  decidedAt: string;
  decidedByActor: string | null;
  declineReason: string | null;
  walletId: string;
  balanceInr: string;
  walletStatus: string;
  branchId: string;
  branchName: string;
  branchStatus: string;
  businessId: string;
  businessName: string;
  ownerId: string;
  ownerName: string;
}

export interface FinoraRechargeHistoryPage {
  ok: true;
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  requests: FinoraRechargeHistoryRecord[];
  status: "ALL" | "APPROVED" | "DECLINED";
  limit: number;
  offset: number;
  hasMore: boolean;
}

type FetchTransport = typeof fetch;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
}

function validMoney(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{1,10}(\.\d{1,2})?$/.test(value);
}

function validRow(value: unknown): value is FinoraRechargeHistoryRecord {
  const row = object(value);
  if (!row || !["APPROVED", "DECLINED"].includes(String(row.status))) return false;

  for (const key of [
    "requestId", "paymentMethod", "createdAt", "decidedAt", "walletId",
    "walletStatus", "branchId", "branchName", "branchStatus",
    "businessId", "businessName", "ownerId", "ownerName",
  ]) {
    if (typeof row[key] !== "string" ||
        (row[key] as string).trim().length === 0 ||
        (row[key] as string).length > 512) {
      return false;
    }
  }

  return validMoney(row.amountInr) &&
    validMoney(row.balanceInr) &&
    Number.isFinite(Date.parse(row.createdAt as string)) &&
    Number.isFinite(Date.parse(row.decidedAt as string)) &&
    (row.decidedByActor === null ||
      (typeof row.decidedByActor === "string" &&
       row.decidedByActor.length <= 512)) &&
    (row.declineReason === null ||
      (typeof row.declineReason === "string" &&
       row.declineReason.length <= 1000))
}

// Injected transport is used only by isolated tests / trusted main-process code.
export function createFinoraServerRechargeHistoryClient(
  transport: FetchTransport = fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("RECHARGE_HISTORY_TRANSPORT_INVALID");
  }

  return async function fetchRechargeHistory(
    adminApiKey: string,
    limit = 50,
    offset = 0,
    status: "ALL" | "APPROVED" | "DECLINED" = "ALL",
  ): Promise<FinoraRechargeHistoryPage> {
    if (typeof adminApiKey !== "string" ||
        !adminApiKey.trim() ||
        adminApiKey.length > 4096) {
      throw new Error("FINORA_ADMIN_CREDENTIAL_REQUIRED");
    }

    if (!Number.isSafeInteger(limit) ||
        limit < 1 || limit > 100 ||
        !Number.isSafeInteger(offset) ||
        offset < 0 || offset > 10000000) {
      throw new Error("INVALID_RECHARGE_PAGINATION");
    }

    if (!["ALL", "APPROVED", "DECLINED"].includes(status)) {
      throw new Error("INVALID_RECHARGE_HISTORY_STATUS");
    }

    let response: Response;
    try {
      response = await transport(
        `${API_BASE}/admin/wallet/recharges/history?limit=${limit}&offset=${offset}&status=${status}`,
        {
          method: "GET",
          headers: { "x-finora-admin-key": adminApiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );
    } catch {
      throw new Error("RECHARGE_SERVER_UNAVAILABLE");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("RECHARGE_ADMIN_UNAUTHORIZED");
      }
      throw new Error("RECHARGE_HISTORY_UNAVAILABLE");
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new Error("INVALID_RECHARGE_HISTORY_RESPONSE");
    }

    const page = object(raw);
    if (!page ||
        page.ok !== true ||
        page.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
        page.status !== status ||
        page.limit !== limit ||
        page.offset !== offset ||
        typeof page.hasMore !== "boolean" ||
        !Array.isArray(page.requests) ||
        page.requests.length > limit ||
        !page.requests.every(validRow)) {
      throw new Error("INVALID_RECHARGE_HISTORY_RESPONSE");
    }

    return page as unknown as FinoraRechargeHistoryPage;
  };
}

export const fetchFinoraServerRechargeHistory =
  createFinoraServerRechargeHistoryClient();