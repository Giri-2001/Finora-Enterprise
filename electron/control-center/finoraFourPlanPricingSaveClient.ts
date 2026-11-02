/*
 * FINORA C8-X42-AG
 * Authenticated 16-price PUT transport.
 *
 * Privileged Electron Main Process only.
 * The renderer must never receive the Admin Key.
 * HTTPS only, fail-closed response verification.
 *
 * Not registered with IPC or production routes yet.
 */

export type FinoraPricingScope = {
  kind: "GLOBAL" | "BRANCH";
  branchId: string | null;
};

export type FinoraPricingPlanInput = {
  months: 1 | 3 | 6 | 12;
  subscriptionPriceInr: string;
  fees: {
    CUSTOMER_CREATE: string;
    LOAN_DISBURSEMENT: string;
    COLLECTION: string;
  };
};

export type FinoraPricingSavePayload = {
  scope: FinoraPricingScope;
  plans: FinoraPricingPlanInput[];
};

export type FinoraPricingSaveResult = {
  ok: true;
  revisionId: string;
  pricesWritten: 16;
};

export type FinoraPricingSaveOptions = {
  baseUrl: string;
  adminKey: string;
  payload: FinoraPricingSavePayload;
  transport?: typeof fetch;
};

const MONTHS = [1, 3, 6, 12] as const;
const CODES = [
  "CUSTOMER_CREATE",
  "LOAN_DISBURSEMENT",
  "COLLECTION",
] as const;

const MONEY = /^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,2})?$/;
const BRANCH = /^[A-Za-z0-9_-]{1,128}$/;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function exactKeys(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  return record(value) &&
    Object.keys(value).length === keys.length &&
    Object.keys(value).every((key) => keys.includes(key));
}

function amountValid(value: unknown): value is string {
  return typeof value === "string" &&
    MONEY.test(value) &&
    Number.isFinite(Number(value)) &&
    Number(value) <= 25000;
}

function validatePayload(payload: unknown): asserts payload is FinoraPricingSavePayload {
  if (!exactKeys(payload, ["scope", "plans"])) {
    throw new Error("FINORA_PRICING_SAVE_PAYLOAD_INVALID");
  }

  const scope = payload.scope;

  if (
    !exactKeys(scope, ["kind", "branchId"]) ||
    (
      scope.kind !== "GLOBAL" &&
      scope.kind !== "BRANCH"
    ) ||
    (
      scope.kind === "GLOBAL" &&
      scope.branchId !== null
    ) ||
    (
      scope.kind === "BRANCH" &&
      (
        typeof scope.branchId !== "string" ||
        !BRANCH.test(scope.branchId)
      )
    )
  ) {
    throw new Error("FINORA_PRICING_SAVE_SCOPE_INVALID");
  }

  if (!Array.isArray(payload.plans) || payload.plans.length !== 4) {
    throw new Error("FINORA_PRICING_SAVE_PLAN_COUNT_INVALID");
  }

  for (let i = 0; i < MONTHS.length; i++) {
    const plan: unknown = payload.plans[i];

    if (
      !exactKeys(plan, ["months", "subscriptionPriceInr", "fees"]) ||
      plan.months !== MONTHS[i] ||
      !amountValid(plan.subscriptionPriceInr) ||
      !exactKeys(plan.fees, [...CODES]) ||
      !CODES.every((code) => amountValid((plan.fees as Record<string, unknown>)[code]))
    ) {
      throw new Error("FINORA_PRICING_SAVE_PLAN_INVALID");
    }
  }
}

export async function saveFinoraFourPlanPricingToServer(
  options: FinoraPricingSaveOptions,
): Promise<FinoraPricingSaveResult> {
  if (
    typeof options.baseUrl !== "string" ||
    options.baseUrl.length === 0 ||
    options.baseUrl.length > 2048
  ) {
    throw new Error("FINORA_PRICING_SAVE_URL_INVALID");
  }

  let base: URL;

  try {
    base = new URL(options.baseUrl);
  } catch {
    throw new Error("FINORA_PRICING_SAVE_URL_INVALID");
  }

  if (
    base.protocol !== "https:" ||
    base.username !== "" ||
    base.password !== "" ||
    base.search !== "" ||
    base.hash !== "" ||
    base.pathname !== "/"
  ) {
    throw new Error("FINORA_PRICING_SAVE_URL_INVALID");
  }

  if (
    typeof options.adminKey !== "string" ||
    options.adminKey.trim().length < 32 ||
    options.adminKey.length > 4096
  ) {
    throw new Error("FINORA_PRICING_SAVE_ADMIN_KEY_INVALID");
  }

  validatePayload(options.payload);

  const { scope } = options.payload;

  const path = scope.kind === "GLOBAL"
    ? "/admin/pricing/plans/global"
    : `/admin/pricing/plans/branch/${scope.branchId}`;

  const url = new URL(path, base);
  const transport = options.transport ?? globalThis.fetch;

  if (typeof transport !== "function") {
    throw new Error("FINORA_PRICING_SAVE_TRANSPORT_UNAVAILABLE");
  }

  let response: Response;

  try {
    response = await transport(url.toString(), {
      method: "PUT",
      headers: {
        "x-finora-admin-key": options.adminKey.trim(),
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(options.payload),
      cache: "no-store",
      redirect: "error",
      credentials: "omit",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("FINORA_PRICING_SAVE_NETWORK_UNAVAILABLE");
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("FINORA_PRICING_SAVE_UNAUTHORIZED");
    }
    throw new Error("FINORA_PRICING_SAVE_SERVER_REJECTED");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new Error("FINORA_PRICING_SAVE_CONTENT_TYPE_INVALID");
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("FINORA_PRICING_SAVE_RESPONSE_INVALID");
  }

  if (
    !record(body) ||
    body.ok !== true ||
    body.pricesWritten !== 16 ||
    typeof body.revisionId !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(body.revisionId)
  ) {
    throw new Error("FINORA_PRICING_SAVE_READBACK_INVALID");
  }

  return {
    ok: true,
    revisionId: body.revisionId,
    pricesWritten: 16,
  };
}
