/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA FEE CHART PRICING

   RESPONSIBILITY:
   - Resolve current release pricing for the active branch
   - Resolve previous release pricing for comparison
   - Preserve release precedence:
       1. Exact Branch custom
       2. FINORA Income release default
   - Presentation-independent pricing data only

   IMPORTANT:
   - No UI hardcoded fee values.
   - No Control Center runtime dependency.
   - Values come only from generated release pricing.
============================================================ */

import {
  FINORA_BRANCH_PRICING_OVERRIDES,
  FINORA_INCOME_PRICING_DEFAULTS,
  FINORA_PREVIOUS_BRANCH_PRICING_OVERRIDES,
  FINORA_PREVIOUS_INCOME_PRICING_DEFAULTS,
} from "./finoraIncomePricingDefaults.generated";

import type {
  FinoraBranchPricingOverride,
  FinoraIncomePricingDefaults,
} from "./finoraIncomePricingDefaults.generated";

/* ============================================================
   TYPES
============================================================ */

export interface FinoraFeeChartScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraFeeChartValue {
  current:
    number;

  previous?:
    number;
}

export interface FinoraFeeChartPricing {
  customerFee:
    FinoraFeeChartValue;

  loanFee:
    FinoraFeeChartValue;

  collectionBelow25000:
    FinoraFeeChartValue;

  collection25000To50000:
    FinoraFeeChartValue;

  collectionAbove50000:
    FinoraFeeChartValue;
}

type PricingKey =
  keyof FinoraIncomePricingDefaults;

/* ============================================================
   HELPERS
============================================================ */

function normalizeIdentity(
  value: string,
): string {
  return value.trim().toLowerCase();
}

function findExactBranchPricing(
  scope: FinoraFeeChartScope,
  records: readonly FinoraBranchPricingOverride[],
): FinoraBranchPricingOverride | undefined {
  const ownerId =
    normalizeIdentity(scope.ownerId);

  const businessId =
    normalizeIdentity(scope.businessId);

  const branchId =
    normalizeIdentity(scope.branchId);

  return records.find(
    (record) =>
      normalizeIdentity(record.ownerId) === ownerId &&
      normalizeIdentity(record.businessId) === businessId &&
      normalizeIdentity(record.branchId) === branchId,
  );
}

function resolveEffectivePrice(
  key: PricingKey,
  globalPricing: Readonly<FinoraIncomePricingDefaults>,
  branchPricing?: FinoraBranchPricingOverride,
): number {
  const branchValue =
    branchPricing?.[key];

  if (
    typeof branchValue === "number" &&
    Number.isFinite(branchValue) &&
    branchValue >= 0
  ) {
    return branchValue;
  }

  return globalPricing[key];
}

function createValue(
  current: number,
  previous?: number,
): FinoraFeeChartValue {
  if (
    typeof previous === "number" &&
    Number.isFinite(previous) &&
    previous !== current
  ) {
    return {
      current,
      previous,
    };
  }

  return {
    current,
  };
}

/* ============================================================
   RESOLVER
============================================================ */

export function resolveFinoraFeeChartPricing(
  scope: FinoraFeeChartScope,
): FinoraFeeChartPricing {
  const currentBranch =
    findExactBranchPricing(
      scope,
      FINORA_BRANCH_PRICING_OVERRIDES,
    );

  const previousGlobal =
    FINORA_PREVIOUS_INCOME_PRICING_DEFAULTS;

  const previousBranch =
    previousGlobal
      ? findExactBranchPricing(
          scope,
          FINORA_PREVIOUS_BRANCH_PRICING_OVERRIDES,
        )
      : undefined;

  function current(
    key: PricingKey,
  ): number {
    return resolveEffectivePrice(
      key,
      FINORA_INCOME_PRICING_DEFAULTS,
      currentBranch,
    );
  }

  function previous(
    key: PricingKey,
  ): number | undefined {
    if (!previousGlobal) {
      return undefined;
    }

    return resolveEffectivePrice(
      key,
      previousGlobal,
      previousBranch,
    );
  }

  return {
    customerFee:
      createValue(
        current("customerCreateFee"),
        previous("customerCreateFee"),
      ),

    loanFee:
      createValue(
        current("loanDisbursementFee"),
        previous("loanDisbursementFee"),
      ),

    collectionBelow25000:
      createValue(
        current("collectionBelow25000Fee"),
        previous("collectionBelow25000Fee"),
      ),

    collection25000To50000:
      createValue(
        current("collection25000To50000Fee"),
        previous("collection25000To50000Fee"),
      ),

    collectionAbove50000:
      createValue(
        current("collectionAbove50000Fee"),
        previous("collectionAbove50000Fee"),
      ),
  };
}