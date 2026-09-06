/* ============================================================
   FINORA ENTERPRISE OS™

   EFFECTIVE PRICING ENGINE™

   DOMAIN CONTRACTS

   RESPONSIBILITY:

   - Represent the final platform price used by runtime callers
   - Distinguish canonical Base Pricing from signed overrides
   - Preserve canonical Wallet transaction type ownership
   - Preserve override identity when an override is effective

   IMPORTANT:

   - No persistence.
   - No signing.
   - No Wallet mutation.
   - No Business Date.
   - No Control Package verification.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  FinoraBasePriceQuote,
  FinoraBasePricingRule,
  FinoraPricingCurrency,
  FinoraPricingModel,
} from "./finoraPricing.types";

/* ============================================================
   CONSTANT
============================================================ */

export const FINORA_EFFECTIVE_PRICING_QUOTE_VERSION =
  1 as const;

/* ============================================================
   SOURCE
============================================================ */

export type FinoraEffectivePricingSource =
  | "BASE"
  | "PRICING_OVERRIDE";

/* ============================================================
   BASE EFFECTIVE QUOTE
============================================================ */

export interface FinoraBaseEffectivePriceQuote {

  chargeCode:
    FinoraBasePricingRule["chargeCode"];

  transactionType:
    FinoraBasePriceQuote["transactionType"];

  pricingModel:
    FinoraPricingModel;

  amount:
    number;

  currency:
    FinoraPricingCurrency;

  source:
    "BASE";

  schemaVersion:
    1;
}

/* ============================================================
   OVERRIDE EFFECTIVE QUOTE
============================================================ */

export interface FinoraOverrideEffectivePriceQuote {

  chargeCode:
    FinoraBasePricingRule["chargeCode"];

  /**
   * Always inherited from canonical Base Pricing.
   *
   * Pricing Overrides never invent Wallet transaction types.
   */
  transactionType:
    FinoraBasePriceQuote["transactionType"];

  pricingModel:
    FinoraPricingModel;

  amount:
    number;

  currency:
    FinoraPricingCurrency;

  source:
    "PRICING_OVERRIDE";

  overrideSetId:
    string;

  overrideId:
    string;

  validFrom:
    string;

  validUntil:
    string;

  schemaVersion:
    1;
}

export type FinoraEffectivePriceQuote =
  | FinoraBaseEffectivePriceQuote
  | FinoraOverrideEffectivePriceQuote;

/* ============================================================
   RESOLUTION
============================================================ */

export interface FinoraEffectivePriceResolutionSuccess {

  success:
    true;

  quote:
    FinoraEffectivePriceQuote;
}

export interface FinoraEffectivePriceResolutionFailure {

  success:
    false;

  chargeCode:
    FinoraBasePricingRule["chargeCode"];

  reason:
    string;
}

export type FinoraEffectivePriceResolution =
  | FinoraEffectivePriceResolutionSuccess
  | FinoraEffectivePriceResolutionFailure;

/* ============================================================
   END
============================================================ */