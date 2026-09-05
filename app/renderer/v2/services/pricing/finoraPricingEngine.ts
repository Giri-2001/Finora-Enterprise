/* ===========================================================
   FINORA ENTERPRISE OS™

   BASE PRICING ENGINE

   MODULE  : Pricing
   LAYER   : Pure Domain Service
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve the current base price for a platform charge
   - Fail closed for disabled / unpriced charge rules
   - Return immutable pricing quotes
   - Keep pricing independent from Wallet persistence

   IMPORTANT:

   - No Wallet mutation.
   - No StorageManager.
   - No browser storage.
   - No Business Date.
   - No registration entitlement logic.
=========================================================== */

import type {
  WalletPlatformChargeCode,
} from "../../types/wallet/wallet.transaction.types";

import type {
  FinoraBasePriceQuote,
  FinoraBasePriceResolution,
  FinoraBasePricingRule,
} from "../../types/pricing/finoraPricing.types";

import {
  FINORA_BASE_PRICING_CATALOG,
} from "./finoraPricingCatalog";

// ============================================================
// RULE LOOKUP
// ============================================================

export function getFinoraBasePricingRule(
  chargeCode:
    WalletPlatformChargeCode,
): FinoraBasePricingRule | undefined {

  const catalog:
    Partial<
      Record<
        WalletPlatformChargeCode,
        FinoraBasePricingRule
      >
    > =
      FINORA_BASE_PRICING_CATALOG;

  return catalog[
    chargeCode
  ];
}

// ============================================================
// RESOLVE BASE PRICE
// ============================================================

export function resolveFinoraBasePrice(
  chargeCode:
    WalletPlatformChargeCode,
): FinoraBasePriceResolution {

  const rule =
    getFinoraBasePricingRule(
      chargeCode,
    );

    if (!rule) {
    return {
      success:
        false,

      chargeCode,

      reason:
        `FINORA platform charge ${chargeCode} is not recognized by the base pricing catalog.`,
    };
  }

  if (!rule.enabled) {
    return {
      success:
        false,

      chargeCode,

      reason:
        `FINORA platform charge ${chargeCode} is not currently enabled for billing.`,
    };
  }

  if (
    rule.pricingModel !==
      "FIXED" ||
    !Number.isFinite(
      rule.amount,
    ) ||
    Number(rule.amount) <= 0
  ) {
    return {
      success:
        false,

      chargeCode,

      reason:
        `FINORA platform charge ${chargeCode} does not have a valid billable base price.`,
    };
  }

  const quote:
    FinoraBasePriceQuote =
      Object.freeze({
        chargeCode:
          rule.chargeCode,

        transactionType:
          rule.transactionType,

        pricingModel:
          rule.pricingModel,

        amount:
          Number(rule.amount),

        currency:
          rule.currency,

        schemaVersion:
          1,
      });

  return {
    success:
      true,

    quote,
  };
}

// ============================================================
// REQUIRE BILLABLE PRICE
// ============================================================

export function requireFinoraBasePrice(
  chargeCode:
    WalletPlatformChargeCode,
): FinoraBasePriceQuote {

  const result =
    resolveFinoraBasePrice(
      chargeCode,
    );

  if (!result.success) {
    throw new Error(
      result.reason,
    );
  }

  return result.quote;
}

// ============================================================
// END
// ============================================================