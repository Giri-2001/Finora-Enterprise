/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA RELEASE PRICING

   GENERATED BEFORE RELEASE BUILD.
   BUILD SOURCE: MANDATORY_DEFAULT
   BRANCH PRICING RECORDS: 0

   PRECEDENCE:
   1. Exact Branch custom
   2. FINORA Income
   3. Mandatory production-safe defaults
============================================================ */

export interface FinoraIncomePricingDefaults {
  customerCreateFee:
    number;

  loanDisbursementFee:
    number;

  collectionBelow25000Fee:
    number;

  collection25000To50000Fee:
    number;

  collectionAbove50000Fee:
    number;
}

export interface FinoraBranchPricingOverride {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  customerCreateFee?:
    number;

  loanDisbursementFee?:
    number;

  collectionBelow25000Fee?:
    number;

  collection25000To50000Fee?:
    number;

  collectionAbove50000Fee?:
    number;
}

export const FINORA_INCOME_PRICING_DEFAULTS:
  Readonly<FinoraIncomePricingDefaults> =
    Object.freeze({

      customerCreateFee:
        30,

      loanDisbursementFee:
        30,

      collectionBelow25000Fee:
        20,

      collection25000To50000Fee:
        25,

      collectionAbove50000Fee:
        30,
    });

export const FINORA_BRANCH_PRICING_OVERRIDES:
  readonly FinoraBranchPricingOverride[] =
    Object.freeze(
      [],
    );
