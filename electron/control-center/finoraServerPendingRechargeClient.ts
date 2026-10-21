/*
 * FINORA_P1_590Q_SERVER_PENDING_RECHARGES
 * Electron main-process only.
 * Read-only. No approval, wallet mutation or credential export.
 */

const API_BASE = "https://api.finoraenterprise.com";

export interface FinoraPendingRecharge {
  requestId: string;
  amountInr: string;
  paymentMethod: string;
  status: "PENDING";
  createdAt: string;
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

export interface FinoraPendingRechargePage {
  ok: true;
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  requests: FinoraPendingRecharge[];
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

function validRow(value: unknown): value is FinoraPendingRecharge {
  const row = object(value);
  if (!row || row.status !== "PENDING") return false;

  for (const key of [
    "requestId", "paymentMethod", "createdAt", "walletId",
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
    Number.isFinite(Date.parse(row.createdAt as string));
}

// Injected transport is used only by isolated tests / trusted main-process code.
export function createFinoraServerPendingRechargeClient(
  transport: FetchTransport = fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("PENDING_RECHARGE_TRANSPORT_INVALID");
  }

  return async function fetchPendingRecharges(
    adminApiKey: string,
    limit = 50,
    offset = 0,
  ): Promise<FinoraPendingRechargePage> {
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

    let response: Response;
    try {
      response = await transport(
        `${API_BASE}/admin/wallet/recharges/pending?limit=${limit}&offset=${offset}`,
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
      throw new Error("RECHARGE_PENDING_REQUESTS_UNAVAILABLE");
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new Error("INVALID_PENDING_RECHARGE_RESPONSE");
    }

    const page = object(raw);
    if (!page ||
        page.ok !== true ||
        page.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
        page.limit !== limit ||
        page.offset !== offset ||
        typeof page.hasMore !== "boolean" ||
        !Array.isArray(page.requests) ||
        page.requests.length > limit ||
        !page.requests.every(validRow)) {
      throw new Error("INVALID_PENDING_RECHARGE_RESPONSE");
    }

    return page as unknown as FinoraPendingRechargePage;
  };
}

export const fetchFinoraServerPendingRecharges =
  createFinoraServerPendingRechargeClient();