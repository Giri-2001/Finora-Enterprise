/**
 * FINORA P1-567H
 * Local-test PostgreSQL effective pricing — READ ONLY.
 *
 * This module is main-process only.
 * Admin credentials must be supplied by the secure Electron vault.
 * Never import this module into renderer or preload code.
 */

const LOCAL_FINORA_API = "http://127.0.0.1:3000";

export interface FinoraEffectivePricingIdentity {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface FinoraEffectivePricingCharge {
  chargeCode: string;
  priceKind: string;
  amount: number;
  source: "GLOBAL" | "BRANCH_OVERRIDE";
  pricingRevisionId?: string | null;
  updatedAt?: string | null;
}

export interface FinoraEffectivePricingResult {
  branch: FinoraEffectivePricingIdentity & {
    ownerName: string;
    businessName: string;
    branchName: string;
    status: string;
  };
  pricing: Record<string, FinoraEffectivePricingCharge>;
  complete: boolean;
  missingChargeCodes: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requiredId(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new Error("PRICING_IDENTITY_INVALID");
  }

  return value;
}

function requiredText(value: unknown): string {
  if (typeof value !== "string" || value.length > 500) {
    throw new Error("PRICING_RESPONSE_INVALID");
  }

  return value;
}

export async function loadFinoraServerEffectivePricing(
  adminApiKey: string,
  selected: FinoraEffectivePricingIdentity,
): Promise<FinoraEffectivePricingResult> {
  if (process.env.FINORA_LOCAL_CONTROL_CENTER_DIRECTORY !== "1") {
    throw new Error("PRICING_LOCAL_TEST_DISABLED");
  }

  if (
    typeof adminApiKey !== "string" ||
    adminApiKey.trim().length === 0
  ) {
    throw new Error("PRICING_CREDENTIAL_UNAVAILABLE");
  }

  const expected = {
    ownerId: requiredId(selected?.ownerId),
    businessId: requiredId(selected?.businessId),
    branchId: requiredId(selected?.branchId),
  };

  let response: Response;

  try {
    response = await fetch(
      `${LOCAL_FINORA_API}/admin/pricing/effective/${encodeURIComponent(expected.branchId)}`,
      {
        method: "GET",
        headers: {
          "x-finora-admin-key": adminApiKey,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    throw new Error("PRICING_SERVER_UNAVAILABLE");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("PRICING_ACCESS_DENIED");
  }

  if (!response.ok) {
    throw new Error(`PRICING_SERVER_HTTP_${response.status}`);
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("PRICING_RESPONSE_INVALID");
  }

  if (
    !isRecord(body) ||
    body.ok !== true ||
    !isRecord(body.branch) ||
    !isRecord(body.pricing) ||
    typeof body.complete !== "boolean" ||
    !Array.isArray(body.missingChargeCodes)
  ) {
    throw new Error("PRICING_RESPONSE_INVALID");
  }

  const branch = body.branch;

  const actual = {
    ownerId: requiredId(branch.ownerId),
    businessId: requiredId(branch.businessId),
    branchId: requiredId(branch.branchId),
  };

  // No cross-owner, cross-business or cross-branch display.
  if (
    actual.ownerId !== expected.ownerId ||
    actual.businessId !== expected.businessId ||
    actual.branchId !== expected.branchId
  ) {
    throw new Error("PRICING_IDENTITY_MISMATCH");
  }

  const pricing: Record<string, FinoraEffectivePricingCharge> = {};

  for (const [code, raw] of Object.entries(body.pricing)) {
    if (
      !isRecord(raw) ||
      raw.chargeCode !== code ||
      typeof raw.priceKind !== "string" ||
      !Number.isFinite(raw.amount) ||
      typeof raw.amount !== "number" ||
      raw.amount < 0 ||
      (raw.source !== "GLOBAL" &&
        raw.source !== "BRANCH_OVERRIDE")
    ) {
      throw new Error("PRICING_CHARGE_INVALID");
    }

    pricing[code] = {
      chargeCode: code,
      priceKind: raw.priceKind,
      amount: raw.amount,
      source: raw.source,
      pricingRevisionId:
        typeof raw.pricingRevisionId === "string"
          ? raw.pricingRevisionId
          : null,
      updatedAt:
        typeof raw.updatedAt === "string"
          ? raw.updatedAt
          : null,
    };
  }

  if (
    !body.missingChargeCodes.every(
      (code: unknown) => typeof code === "string",
    ) ||
    body.complete !== (body.missingChargeCodes.length === 0)
  ) {
    throw new Error("PRICING_COMPLETENESS_INVALID");
  }

  return {
    branch: {
      ...actual,
      ownerName: requiredText(branch.ownerName),
      businessName: requiredText(branch.businessName),
      branchName: requiredText(branch.branchName),
      status: requiredText(branch.status),
    },
    pricing,
    complete: body.complete,
    missingChargeCodes: body.missingChargeCodes as string[],
  };
}