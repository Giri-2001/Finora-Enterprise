/* ============================================================
   FINORA ENTERPRISE OS™

   COLLECTION PROCESSING BASE PRICING

   RESPONSIBILITY:
   - Own canonical Collection Processing slab boundaries
   - Resolve the fee from the actual Collection payment amount
   - Remain branch-agnostic
   - Never consume Pricing Overrides
   - Perform no Wallet mutation

   IMPORTANT:
   - This is BASE pricing, not a branch override.
   - Slab basis is Collection paymentAmount only.
   - Discounts, Loan outstanding and Loan principal are not the
     slab basis.
   - Boundaries:
       paymentAmount < 25,000      -> BELOW_25000
       25,000 <= amount <= 50,000 -> 25000_TO_50000
       paymentAmount > 50,000      -> ABOVE_50000

   MANDATORY PRODUCTION FALLBACK FEES:
   - BELOW_25000      = ₹20
   - 25000_TO_50000  = ₹25
   - ABOVE_50000      = ₹30

   These values are the fail-safe pricing floor when no valid
   branch-specific signed Pricing Policy is available.
   A valid signed branch policy may replace these fee amounts,
   but missing or invalid policy state must never make the
   Collection Processing charge free.
============================================================ */

import {
  FINORA_INCOME_PRICING_DEFAULTS,
} from "./finoraIncomePricingDefaults.generated";
import {
  resolveFinoraBranchCollectionPrice,
} from "./finoraBranchReleasePricing";

import type {
  FinoraBranchPricingScope,
} from "./finoraBranchReleasePricing";

export const FINORA_COLLECTION_PROCESSING_LOWER_THRESHOLD =
  25_000 as const;

export const FINORA_COLLECTION_PROCESSING_UPPER_THRESHOLD =
  50_000 as const;

export const FINORA_COLLECTION_PROCESSING_DEFAULT_FEES =
  Object.freeze({

    BELOW_25000:
      FINORA_INCOME_PRICING_DEFAULTS.collectionBelow25000Fee,

    FROM_25000_TO_50000:
      FINORA_INCOME_PRICING_DEFAULTS.collection25000To50000Fee,

    ABOVE_50000:
      FINORA_INCOME_PRICING_DEFAULTS.collectionAbove50000Fee,

  } as const);

export type FinoraCollectionProcessingPricingTier =
  | "BELOW_25000"
  | "FROM_25000_TO_50000"
  | "ABOVE_50000";

export interface FinoraCollectionProcessingPriceQuote {

  chargeCode:
    "COLLECTION_PROCESSING";

  transactionType:
    "COLLECTION_PROCESSING_FEE";

  pricingModel:
    "SLAB";

  basis:
    "COLLECTION_PAYMENT_AMOUNT";

  basisAmount:
    number;

  tier:
    FinoraCollectionProcessingPricingTier;

  amount:
    number;

  currency:
    "INR";

  schemaVersion:
    1;
}

export interface FinoraCollectionProcessingPriceResolved {

  success:
    true;

  quote:
    FinoraCollectionProcessingPriceQuote;
}

export interface FinoraCollectionProcessingPriceUnavailable {

  success:
    false;

  error:
    string;
}

export type FinoraCollectionProcessingPriceResolution =
  | FinoraCollectionProcessingPriceResolved
  | FinoraCollectionProcessingPriceUnavailable;

export function resolveFinoraCollectionProcessingPrice(
  paymentAmount:
    number,

  scope?:
    FinoraBranchPricingScope,
): FinoraCollectionProcessingPriceResolution {

  const basisAmount =
    Number(
      paymentAmount,
    );

  if (
    !Number.isFinite(
      basisAmount,
    ) ||
    basisAmount <= 0
  ) {

    return {
      success:
        false,

      error:
        "Collection payment amount must be a positive finite amount before FINORA Collection Processing pricing can be resolved.",
    };
  }

  let tier:
    FinoraCollectionProcessingPricingTier;

  let amount:
    number;

  if (
    basisAmount <
    FINORA_COLLECTION_PROCESSING_LOWER_THRESHOLD
  ) {

    tier =
      "BELOW_25000";

    amount =
      FINORA_COLLECTION_PROCESSING_DEFAULT_FEES
        .BELOW_25000;

  } else if (
    basisAmount <=
    FINORA_COLLECTION_PROCESSING_UPPER_THRESHOLD
  ) {

    tier =
      "FROM_25000_TO_50000";

    amount =
      FINORA_COLLECTION_PROCESSING_DEFAULT_FEES
        .FROM_25000_TO_50000;

  } else {

    tier =
      "ABOVE_50000";

    amount =
      FINORA_COLLECTION_PROCESSING_DEFAULT_FEES
        .ABOVE_50000;
  }

  if (scope) {

    amount =
      resolveFinoraBranchCollectionPrice(
        scope,
        tier,
      ) ??
      amount;
  }
  return {
    success:
      true,

    quote:
      Object.freeze({

        chargeCode:
          "COLLECTION_PROCESSING",

        transactionType:
          "COLLECTION_PROCESSING_FEE",

        pricingModel:
          "SLAB",

        basis:
          "COLLECTION_PAYMENT_AMOUNT",

        basisAmount,

        tier,

        amount,

        currency:
          "INR",

        schemaVersion:
          1,

      }),
  };
}

/* ============================================================
   END
============================================================ */