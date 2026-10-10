/**
 * FINORA P1-566BW
 * Central PostgreSQL branch directory client.
 *
 * Main process only.
 * Never passes admin credentials to the renderer.
 * Never reads a local branch registry.
 * Fails closed when server credentials/network are unavailable.
 */

export interface FinoraServerDirectoryBranch {
  owner_id: string;
  owner_name: string;
  business_id: string;
  business_name: string;
  branch_id: string;
  branch_name: string;
  branch_status: string;
  storage_mode: string;
  wallet_id: string | null;
  balance_inr: string | number | null;
  wallet_status: string | null;
  plan_code: string | null;
  subscription_start: string | null;
  subscription_expiry: string | null;
  subscription_status: string | null;
}

export interface FinoraServerDirectoryPage {
  source: "POSTGRESQL_BRANCH_DIRECTORY";
  branches: FinoraServerDirectoryBranch[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface FinoraServerDirectoryQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

type Transport = typeof fetch;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isOptionalString(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    typeof value === "string"
  );
}

function validBranch(
  value: unknown,
): value is FinoraServerDirectoryBranch {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isId(value.owner_id) &&
    typeof value.owner_name === "string" &&
    isId(value.business_id) &&
    typeof value.business_name === "string" &&
    isId(value.branch_id) &&
    typeof value.branch_name === "string" &&
    typeof value.branch_status === "string" &&
    typeof value.storage_mode === "string" &&
    isOptionalString(value.wallet_id) &&
    (
      value.balance_inr === null ||
      typeof value.balance_inr === "string" ||
      (
        typeof value.balance_inr === "number" &&
        Number.isFinite(value.balance_inr)
      )
    ) &&
    isOptionalString(value.wallet_status) &&
    isOptionalString(value.plan_code) &&
    isOptionalString(value.subscription_start) &&
    isOptionalString(value.subscription_expiry) &&
    isOptionalString(value.subscription_status)
  );
}

export async function loadFinoraServerBranchDirectory(
  query: FinoraServerDirectoryQuery = {},
  transport: Transport = globalThis.fetch,
): Promise<FinoraServerDirectoryPage> {
  const limit = query.limit ?? 25;
  const offset = query.offset ?? 0;
  const search = query.search ?? "";

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 99999999 ||
    typeof search !== "string" ||
    search.length > 100
  ) {
    throw new Error("DIRECTORY_QUERY_INVALID");
  }

  const adminKey = process.env.FINORA_ADMIN_API_KEY;

  if (!adminKey) {
    throw new Error("DIRECTORY_ADMIN_AUTH_UNAVAILABLE");
  }

  // Explicit local-test opt-in. Production endpoint must be
  // configured after deployment, TLS and staff auth verification.
  if (
    process.env.FINORA_LOCAL_CONTROL_CENTER_DIRECTORY !== "1"
  ) {
    throw new Error("DIRECTORY_SERVER_CONFIGURATION_REQUIRED");
  }

  if (typeof transport !== "function") {
    throw new Error("DIRECTORY_TRANSPORT_UNAVAILABLE");
  }

  const url = new URL(
    "http://127.0.0.1:3000/admin/branches/directory",
  );

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("search", search);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    12000,
  );

  try {
    const response = await transport(
      url.toString(),
      {
        method: "GET",
        headers: {
          "x-finora-admin-key": adminKey,
          accept: "application/json",
        },
        redirect: "error",
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(
        response.status === 401 ||
        response.status === 403
          ? "DIRECTORY_ACCESS_DENIED"
          : "DIRECTORY_SERVER_UNAVAILABLE",
      );
    }

    if (
      response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    ) {
      throw new Error("DIRECTORY_RESPONSE_INVALID");
    }

    const result: unknown = await response.json();

    if (
      !isRecord(result) ||
      result.ok !== true ||
      result.source !==
        "POSTGRESQL_BRANCH_DIRECTORY" ||
      !Array.isArray(result.branches) ||
      result.branches.length > limit ||
      result.branches.some(
        (branch: unknown) => !validBranch(branch),
      ) ||
      result.limit !== limit ||
      result.offset !== offset ||
      typeof result.hasMore !== "boolean"
    ) {
      throw new Error("DIRECTORY_RESPONSE_INVALID");
    }

    return {
      source: "POSTGRESQL_BRANCH_DIRECTORY",
      branches: result.branches,
      limit,
      offset,
      hasMore: result.hasMore,
    };
  } finally {
    clearTimeout(timer);
  }
}