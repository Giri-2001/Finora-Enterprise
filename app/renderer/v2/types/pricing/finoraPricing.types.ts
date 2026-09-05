/* ===========================================================
   FINORA ENTERPRISE OS™

   BASE PRICING ENGINE

   MODULE  : Pricing
   LAYER   : Domain Contracts
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define FINORA base platform-pricing contracts
   - Reuse the existing canonical Wallet platform charge code
   - Distinguish enabled billable rules from known latent rules
   - Keep pricing independent from Wallet balance mutation

   IMPORTANT:

   - Registration pricing does NOT belong here.
   - Borrower Loan processingFee does NOT belong here.
   - No Wallet debit occurs here.
   - No Business Date authority occurs here.
=========================================================== */

import type {
  WalletPlatformChargeCode,
} from "../wallet/wallet.transaction.types";

import type {
  WalletTransactionType,
} from "../wallet/wallet.types";

// ============================================================
// PRICING CURRENCY
// ============================================================

export type FinoraPricingCurrency =
  "INR";

// ============================================================
// PRICING MODEL
// ============================================================

export type FinoraPricingModel =
  "FIXED";

// ============================================================
// BASE RULE
// ============================================================

export interface FinoraBasePricingRuleBase {
  readonly chargeCode:
    WalletPlatformChargeCode;

  readonly transactionType:
    Exclude<
      WalletTransactionType,
      "WALLET_RECHARGE"
    >;

  readonly pricingModel:
    FinoraPricingModel;

  readonly currency:
    FinoraPricingCurrency;

  readonly schemaVersion:
    1;
}

// ============================================================
// ENABLED BILLABLE RULE
// ============================================================

export interface FinoraEnabledBasePricingRule
  extends FinoraBasePricingRuleBase {

  readonly enabled:
    true;

  /**
   * Enabled base pricing must carry a billable amount.
   * Runtime validation remains authoritative for positivity.
   */
  readonly amount:
    number;
}

// ============================================================
// DISABLED / LATENT RULE
// ============================================================

export interface FinoraDisabledBasePricingRule
  extends FinoraBasePricingRuleBase {

  readonly enabled:
    false;

  /**
   * Disabled platform charges cannot carry a latent amount.
   */
  readonly amount?:
    never;
}

// ============================================================
// BASE PRICING RULE
// ============================================================

export type FinoraBasePricingRule =
  | FinoraEnabledBasePricingRule
  | FinoraDisabledBasePricingRule;

// ============================================================
// PRICE QUOTE
// ============================================================

export interface FinoraBasePriceQuote {
  readonly chargeCode:
    WalletPlatformChargeCode;

  readonly transactionType:
    Exclude<
      WalletTransactionType,
      "WALLET_RECHARGE"
    >;

  readonly pricingModel:
    FinoraPricingModel;

  readonly amount:
    number;

  readonly currency:
    FinoraPricingCurrency;

  readonly schemaVersion:
    1;
}

// ============================================================
// PRICE RESOLUTION RESULT
// ============================================================

export interface FinoraBasePriceResolved {
  readonly success:
    true;

  readonly quote:
    FinoraBasePriceQuote;
}

export interface FinoraBasePriceUnavailable {
  readonly success:
    false;

  readonly chargeCode:
    WalletPlatformChargeCode;

  readonly reason:
    string;
}

export type FinoraBasePriceResolution =
  | FinoraBasePriceResolved
  | FinoraBasePriceUnavailable;

// ============================================================
// END
// ============================================================