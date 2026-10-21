/**
 * FINORA P1-594F
 * Control Center Dashboard — privileged Electron Main only.
 * Never expose admin credentials to the renderer.
 * Local-test endpoint only; no automatic production fallback.
 */

export interface FinoraServerDashboardView {
  ok: true;
  source: "POSTGRESQL";
  metrics: {
    totalOwners: number;
    totalBranches: number;
    activePlans: number;
    monthlyIncomeInr: number | null;
    monthlyIncomeStatus: string;
  };
  subscriptionMonitor: {
    page: number;
    size: number;
    branches: Array<{
      ownerId: string;
      ownerName: string;
      businessName: string;
      branchId: string;
      branchName: string;
      branchStatus: string;
      planCode: string | null;
      validFrom: string | null;
      validUntil: string | null;
      subscriptionState: string;
    }>;
  };
}

function record(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function nonNegativeInteger(v: unknown): v is number {
  return typeof v === "number" &&
    Number.isSafeInteger(v) && v >= 0;
}

function validDashboard(v: unknown): v is FinoraServerDashboardView {
  if (!record(v) || v.ok !== true || v.source !== "POSTGRESQL") {
    return false;
  }

  if (!record(v.metrics) || !record(v.subscriptionMonitor)) {
    return false;
  }

  const m = v.metrics;
  const s = v.subscriptionMonitor;

  if (
    !nonNegativeInteger(m.totalOwners) ||
    !nonNegativeInteger(m.totalBranches) ||
    !nonNegativeInteger(m.activePlans) ||
    m.activePlans > m.totalBranches ||
    m.monthlyIncomeInr !== null ||
    m.monthlyIncomeStatus !==
      "VERIFIED_BILLING_SOURCE_NOT_CONFIGURED" ||
    !nonNegativeInteger(s.page) ||
    !nonNegativeInteger(s.size) ||
    !Array.isArray(s.branches) ||
    s.branches.length > 100
  ) {
    return false;
  }

  return s.branches.every((value: unknown) => {
    if (!record(value)) return false;

    return [
      "ownerId", "ownerName", "businessName",
      "branchId", "branchName", "branchStatus",
      "subscriptionState",
    ].every(key => typeof value[key] === "string") &&
    ["planCode", "validFrom", "validUntil"].every(
      key => value[key] === null || typeof value[key] === "string"
    );
  });
}

export async function loadFinoraServerDashboard(
  adminKey: string,
  page = 1,
  size = 25,
  transport: typeof fetch = globalThis.fetch,
): Promise<FinoraServerDashboardView> {
  if (
    typeof adminKey !== "string" ||
    adminKey.trim().length === 0
  ) {
    throw new Error("DASHBOARD_ADMIN_AUTH_UNAVAILABLE");
  }

  // P1-631E: Production HTTPS, or explicit local development.
  const localTest =
    process.env.FINORA_LOCAL_CONTROL_CENTER_DIRECTORY === "1" &&
    process.env.NODE_ENV !== "production";

  if (
    !Number.isSafeInteger(page) || page < 1 || page > 100000 ||
    !Number.isSafeInteger(size) || size < 1 || size > 100
  ) {
    throw new Error("DASHBOARD_PAGINATION_INVALID");
  }

  if (typeof transport !== "function") {
    throw new Error("DASHBOARD_TRANSPORT_UNAVAILABLE");
  }

  const url = new URL(
    `${localTest ? "http://127.0.0.1:3000" : "https://api.finoraenterprise.com"}/admin/control-center/dashboard`
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await transport(url.toString(), {
      method: "GET",
      headers: {
        "x-finora-admin-key": adminKey,
        accept: "application/json",
      },
      redirect: "error",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? "DASHBOARD_ACCESS_DENIED"
          : "DASHBOARD_SERVER_UNAVAILABLE"
      );
    }

    if (
      response.headers.get("content-type")
        ?.split(";")[0].trim().toLowerCase() !== "application/json"
    ) {
      throw new Error("DASHBOARD_RESPONSE_INVALID");
    }

    const body: unknown = await response.json();

    if (!validDashboard(body)) {
      throw new Error("DASHBOARD_RESPONSE_INVALID");
    }

    if (
      body.subscriptionMonitor.page !== page ||
      body.subscriptionMonitor.size !== size ||
      body.subscriptionMonitor.branches.length > size
    ) {
      throw new Error("DASHBOARD_PAGINATION_MISMATCH");
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}