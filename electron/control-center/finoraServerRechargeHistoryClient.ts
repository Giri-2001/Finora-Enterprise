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
  verifiedPaymentReference: string | null;
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
  ownerMobile: string | null;
}

export interface FinoraRechargeHistoryPage {
  ok: true;
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  requests: FinoraRechargeHistoryRecord[];
  status: "ALL" | "APPROVED" | "DECLINED";
  limit: number;
  offset: number;
  hasMore: boolean;
  totalCount?: number;
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

  return (row.ownerMobile === null ||
      (typeof row.ownerMobile === "string" &&
       row.ownerMobile.length <= 32)) &&
    validMoney(row.amountInr) &&
    validMoney(row.balanceInr) &&
    Number.isFinite(Date.parse(row.createdAt as string)) &&
    Number.isFinite(Date.parse(row.decidedAt as string)) &&
    (row.decidedByActor === null ||
      (typeof row.decidedByActor === "string" &&
       row.decidedByActor.length <= 512)) &&
    (row.declineReason === null ||
      (typeof row.declineReason === "string" &&
       row.declineReason.length <= 1000)) &&
        (row.verifiedPaymentReference === null ||
          (typeof row.verifiedPaymentReference === "string" &&
           row.verifiedPaymentReference.length > 0 &&
           row.verifiedPaymentReference.length <= 256)) &&
        (row.status !== "DECLINED" ||
          row.verifiedPaymentReference === null)
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
    search = "",
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

    if (
      typeof search !== "string" ||
      search.length > 100 ||
      /[\u0000-\u001f\u007f]/.test(search)
    ) {
      throw new Error("INVALID_RECHARGE_HISTORY_SEARCH");
    }

    const searchQuery = search.trim();

    let response: Response;
    try {
      response = await transport(
        `${API_BASE}/admin/wallet/recharges/history?limit=${limit}&offset=${offset}&status=${status}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`,
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

    // FINORA_HF28_CH23_LEGACY_HISTORY_RESPONSE
    // Old deployed API lacks these two fields.
    // Normalize only absent fields; never replace existing values.
    if (page && Array.isArray(page.requests)) {
      page.requests = page.requests.map(value => {
        const row = object(value);
        if (!row) return value;
        return {
          ...row,
          ownerMobile:
            row.ownerMobile === undefined ? null : row.ownerMobile,
          verifiedPaymentReference:
            row.verifiedPaymentReference === undefined
              ? null
              : row.verifiedPaymentReference,
        };
      });
    }
    if (!page ||
        page.ok !== true ||
        page.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
        page.status !== status ||
        page.limit !== limit ||
        page.offset !== offset ||
        typeof page.hasMore !== "boolean" ||
        (page.totalCount !== undefined &&
          (typeof page.totalCount !== "number" ||
           !Number.isSafeInteger(page.totalCount) ||
           page.totalCount < 0)) ||
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