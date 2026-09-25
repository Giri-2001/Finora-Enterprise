/* ============================================================
   FINORA ENTERPRISE OS™

   EXACT-BRANCH RELEASE PRICING

   PRECEDENCE:
   exact Branch custom > FINORA Income release default

   Missing custom price deliberately returns undefined.
   The caller must continue to the global mandatory price.
============================================================ */

import {
  FINORA_BRANCH_PRICING_OVERRIDES,
} from "./finoraIncomePricingDefaults.generated";

export interface FinoraBranchPricingScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export type FinoraBranchCollectionPricingTier =
  | "BELOW_25000"
  | "FROM_25000_TO_50000"
  | "ABOVE_50000";

function scopeKey(
  scope:
    FinoraBranchPricingScope,
): string {

  return [
    String(
      scope.ownerId ??
      "",
    ).trim(),

    String(
      scope.businessId ??
      "",
    ).trim(),

    String(
      scope.branchId ??
      "",
    ).trim(),
  ].join(
    "\u001f",
  );
}

const pricingByScope =
  new Map(
    FINORA_BRANCH_PRICING_OVERRIDES.map(
      (record) => [
        scopeKey(
          record,
        ),
        record,
      ] as const,
    ),
  );

function findRecord(
  scope:
    FinoraBranchPricingScope,
) {

  return pricingByScope.get(
    scopeKey(
      scope,
    ),
  );
}

function positivePrice(
  value:
    number | undefined,
): number | undefined {

  return (
    typeof value === "number" &&
    Number.isFinite(
      value,
    ) &&
    value > 0
  )
    ? value
    : undefined;
}

export function resolveFinoraBranchFixedPrice(
  scope:
    FinoraBranchPricingScope,

  chargeCode:
    string,
): number | undefined {

  const record =
    findRecord(
      scope,
    );

  if (!record) {
    return undefined;
  }

  switch (chargeCode) {

    case "CUSTOMER_NUMBER_GENERATION":
      return positivePrice(
        record.customerCreateFee,
      );

    case "LOAN_DISBURSEMENT":
      return positivePrice(
        record.loanDisbursementFee,
      );

    default:
      return undefined;
  }
}

export function resolveFinoraBranchCollectionPrice(
  scope:
    FinoraBranchPricingScope,

  tier:
    FinoraBranchCollectionPricingTier,
): number | undefined {

  const record =
    findRecord(
      scope,
    );

  if (!record) {
    return undefined;
  }

  switch (tier) {

    case "BELOW_25000":
      return positivePrice(
        record.collectionBelow25000Fee,
      );

    case "FROM_25000_TO_50000":
      return positivePrice(
        record.collection25000To50000Fee,
      );

    case "ABOVE_50000":
      return positivePrice(
        record.collectionAbove50000Fee,
      );
  }
}