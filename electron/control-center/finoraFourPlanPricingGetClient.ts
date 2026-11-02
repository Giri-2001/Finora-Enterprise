import {
  parseFinoraFourPlanPricingResponse,
  type FinoraFourPlanPricingView,
} from "./finoraFourPlanPricingResponseContract.js";

/*
 * FINORA C8-Q
 *
 * Windows privileged-main pricing GET transport.
 *
 * No credential persistence.
 * No renderer-facing key.
 * No PUT, POST or database writes.
 *
 * Caller must supply the previously verified Admin Key
 * from the privileged credential store.
 *
 * Local HTTP requires explicit development opt-in.
 */

export interface FinoraFourPlanPricingGetOptions {
  baseUrl: string;
  adminKey: string;
  scope: "GLOBAL" | "BRANCH";
  branchId: string | null;
  allowLocalTest?: boolean;
  transport?: typeof fetch;
}

function validatedBaseUrl(
  value: unknown,
  allowLocalTest: boolean,
): URL {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048
  ) {
    throw new Error("FINORA_PRICING_URL_INVALID");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("FINORA_PRICING_URL_INVALID");
  }

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("FINORA_PRICING_URL_INVALID");
  }

  const secure = url.protocol === "https:";

  const local =
    url.protocol === "http:" &&
    (url.hostname === "localhost" ||
     url.hostname === "127.0.0.1") &&
    allowLocalTest &&
    process.env.NODE_ENV !== "production";

  if (!secure && !local) {
    throw new Error("FINORA_PRICING_TRANSPORT_INSECURE");
  }

  return url;
}

function validateKey(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 32 ||
    value.length > 4096
  ) {
    throw new Error("FINORA_PRICING_ADMIN_KEY_INVALID");
  }

  return value.trim();
}

export async function loadFinoraFourPlanPricingFromServer(
  options: FinoraFourPlanPricingGetOptions,
): Promise<FinoraFourPlanPricingView> {
  const key = validateKey(options.adminKey);

  const base = validatedBaseUrl(
    options.baseUrl,
    options.allowLocalTest === true,
  );

  const scope = options.scope;
  const branchId = options.branchId;

  if (scope !== "GLOBAL" && scope !== "BRANCH") {
    throw new Error("FINORA_PRICING_SCOPE_INVALID");
  }

  if (
    (scope === "GLOBAL" && branchId !== null) ||
    (
      scope === "BRANCH" &&
      (
        typeof branchId !== "string" ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(branchId)
      )
    )
  ) {
    throw new Error("FINORA_PRICING_BRANCH_INVALID");
  }

  const path =
    scope === "GLOBAL"
      ? "/admin/pricing/plans/global"
      : `/admin/pricing/plans/branch/${branchId}`;

  const url = new URL(path, base);

  const transport = options.transport ?? globalThis.fetch;

  if (typeof transport !== "function") {
    throw new Error("FINORA_PRICING_TRANSPORT_UNAVAILABLE");
  }

  let response: Response;

  try {
    response = await transport(url.toString(), {
      method: "GET",
      headers: {
        "x-finora-admin-key": key,
        accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      credentials: "omit",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("FINORA_PRICING_NETWORK_UNAVAILABLE");
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("FINORA_PRICING_ADMIN_UNAUTHORIZED");
    }

    throw new Error("FINORA_PRICING_SERVER_UNAVAILABLE");
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (
    !/^application\/json(?:\s*;|$)/i.test(contentType)
  ) {
    throw new Error("FINORA_PRICING_CONTENT_TYPE_INVALID");
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("FINORA_PRICING_JSON_INVALID");
  }

  return parseFinoraFourPlanPricingResponse(
    body,
    scope,
    branchId,
  );
}
