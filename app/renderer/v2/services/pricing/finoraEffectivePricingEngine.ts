/* ============================================================
   FINORA ENTERPRISE OS™

   EFFECTIVE PRICING ENGINE™

   RESPONSIBILITY:

   - Resolve canonical Base Pricing first
   - Optionally consume an already-verified Pricing Override Set
   - Use actual runtime time for override validity
   - Apply validFrom inclusive / validUntil exclusive semantics
   - Preserve canonical Wallet transaction type
   - Fail closed when supplied override state is malformed

   IMPORTANT:

   - Pure pricing logic.
   - No persistence.
   - No signing.
   - No trust-store access.
   - No Control Package verification.
   - No StorageManager.
   - No Wallet mutation.
   - No Business Date.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  resolveFinoraBasePrice,
} from "./finoraPricingEngine";

import {
  validateFinoraPricingOverrideSet,
} from "./finoraPricingOverrideControlService";

import {
  FINORA_EFFECTIVE_PRICING_QUOTE_VERSION,
} from "../../types/pricing/finoraEffectivePricing.types";

import type {
  FinoraEffectivePriceQuote,
  FinoraEffectivePriceResolution,
} from "../../types/pricing/finoraEffectivePricing.types";

import type {
  FinoraBasePricingRule,
} from "../../types/pricing/finoraPricing.types";

import type {
  FinoraPricingOverrideSetV1,
} from "../../types/pricing/finoraPricingOverride.types";

/* ============================================================
   INPUT
============================================================ */

export interface ResolveFinoraEffectivePriceInput {

  chargeCode:
    FinoraBasePricingRule["chargeCode"];

  /**
   * Must already originate from the verified Pricing Override
   * state boundary.
   *
   * This pure resolver still revalidates structural/domain
   * invariants defensively before consuming the set.
   */
  overrideSet?:
    FinoraPricingOverrideSetV1;

  /**
   * Actual runtime clock.
   *
   * Business Date must never be supplied here.
   */
  now?:
    Date;
}

/* ============================================================
   RESOLVE
============================================================ */

export function resolveFinoraEffectivePrice(
  input:
    ResolveFinoraEffectivePriceInput,
): FinoraEffectivePriceResolution {

  const baseResult =
    resolveFinoraBasePrice(
      input.chargeCode,
    );

  if (!baseResult.success) {
    return {
      success:
        false,

      chargeCode:
        input.chargeCode,

      reason:
        baseResult.reason,
    };
  }

  const baseQuote =
    baseResult.quote;

  // ----------------------------------------------------------
  // NO OVERRIDE STATE
  // ----------------------------------------------------------

  if (!input.overrideSet) {

    const quote:
      FinoraEffectivePriceQuote =
        Object.freeze({
          chargeCode:
            baseQuote.chargeCode,

          transactionType:
            baseQuote.transactionType,

          pricingModel:
            baseQuote.pricingModel,

          amount:
            baseQuote.amount,

          currency:
            baseQuote.currency,

          source:
            "BASE",

          schemaVersion:
            FINORA_EFFECTIVE_PRICING_QUOTE_VERSION,
        });

    return {
      success:
        true,

      quote,
    };
  }

  // ----------------------------------------------------------
  // DEFENSIVE OVERRIDE-SET VALIDATION
  //
  // Malformed authoritative state is never silently ignored.
  // ----------------------------------------------------------

  const overrideValidation =
    validateFinoraPricingOverrideSet(
      input.overrideSet,
    );

  if (!overrideValidation.valid) {
    return {
      success:
        false,

      chargeCode:
        input.chargeCode,

      reason:
        overrideValidation.error ??
        "FINORA Pricing Override state is invalid.",
    };
  }

  // ----------------------------------------------------------
  // RUNTIME CLOCK
  // ----------------------------------------------------------

  const now =
    input.now ??
    new Date();

  const currentTime =
    now.getTime();

  if (!Number.isFinite(currentTime)) {
    return {
      success:
        false,

      chargeCode:
        input.chargeCode,

      reason:
        "FINORA Pricing runtime clock is invalid.",
    };
  }

  // ----------------------------------------------------------
  // ACTIVE MATCH
  //
  // Domain validation guarantees no overlapping windows for
  // the same charge, therefore at most one rule can match.
  // ----------------------------------------------------------

  const activeOverride =
    input.overrideSet.overrides.find(
      (rule) => {

        if (
          rule.chargeCode !==
            input.chargeCode
        ) {
          return false;
        }

        const validFrom =
          Date.parse(
            rule.validity.validFrom,
          );

        const validUntil =
          Date.parse(
            rule.validity.validUntil,
          );

        return (
          currentTime >=
            validFrom &&
          currentTime <
            validUntil
        );
      },
    );

  // ----------------------------------------------------------
  // BASE FALLBACK
  // ----------------------------------------------------------

  if (!activeOverride) {

    const quote:
      FinoraEffectivePriceQuote =
        Object.freeze({
          chargeCode:
            baseQuote.chargeCode,

          transactionType:
            baseQuote.transactionType,

          pricingModel:
            baseQuote.pricingModel,

          amount:
            baseQuote.amount,

          currency:
            baseQuote.currency,

          source:
            "BASE",

          schemaVersion:
            FINORA_EFFECTIVE_PRICING_QUOTE_VERSION,
        });

    return {
      success:
        true,

      quote,
    };
  }

  // ----------------------------------------------------------
  // OVERRIDE EFFECTIVE QUOTE
  //
  // Transaction type remains owned by canonical Base Pricing.
  // ----------------------------------------------------------

  const quote:
    FinoraEffectivePriceQuote =
      Object.freeze({
        chargeCode:
          baseQuote.chargeCode,

        transactionType:
          baseQuote.transactionType,

        pricingModel:
          baseQuote.pricingModel,

        amount:
          activeOverride.amount,

        currency:
          baseQuote.currency,

        source:
          "PRICING_OVERRIDE",

        overrideSetId:
          input.overrideSet.overrideSetId,

        overrideId:
          activeOverride.overrideId,

        validFrom:
          activeOverride.validity.validFrom,

        validUntil:
          activeOverride.validity.validUntil,

        schemaVersion:
          FINORA_EFFECTIVE_PRICING_QUOTE_VERSION,
      });

  return {
    success:
      true,

    quote,
  };
}

/* ============================================================
   REQUIRED API
============================================================ */

export function requireFinoraEffectivePrice(
  input:
    ResolveFinoraEffectivePriceInput,
): FinoraEffectivePriceQuote {

  const result =
    resolveFinoraEffectivePrice(
      input,
    );

  if (!result.success) {
    throw new Error(
      result.reason,
    );
  }

  return result.quote;
}

/* ============================================================
   END
============================================================ */