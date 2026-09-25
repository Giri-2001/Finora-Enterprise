/* ============================================================
   FINORA ENTERPRISE OS™

   AUTHORITATIVE EFFECTIVE PRICING

   PRECEDENCE:
   1. Exact Branch custom release Pricing
   2. FINORA Income release Pricing
   3. Mandatory build fallback

   Missing branch custom price is inheritance, never free pricing.
============================================================ */

import {
  resolveFinoraEffectivePrice,
} from "./finoraEffectivePricingEngine";

import {
  resolveFinoraBranchFixedPrice,
} from "./finoraBranchReleasePricing";

import type {
  FinoraEffectivePriceQuote,
} from "../../types/pricing/finoraEffectivePricing.types";

import type {
  FinoraBasePricingRule,
} from "../../types/pricing/finoraPricing.types";

export interface FinoraEffectivePricingAuthorityScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface ResolveFinoraAuthoritativeEffectivePriceInput {
  chargeCode:
    FinoraBasePricingRule["chargeCode"];

  scope:
    FinoraEffectivePricingAuthorityScope;

  now?:
    Date;
}

export interface FinoraAuthoritativeEffectivePriceSuccess {
  success:
    true;

  quote:
    FinoraEffectivePriceQuote;
}

export interface FinoraAuthoritativeEffectivePriceFailure {
  success:
    false;

  errorCode:
    | "INVALID_SCOPE"
    | "CONTROL_BRIDGE_UNAVAILABLE"
    | "PRICING_POLICY_READ_FAILED"
    | "PRICING_RESOLUTION_FAILED";

  error:
    string;
}

export type FinoraAuthoritativeEffectivePriceResult =
  | FinoraAuthoritativeEffectivePriceSuccess
  | FinoraAuthoritativeEffectivePriceFailure;

function normalizeScope(
  scope:
    FinoraEffectivePricingAuthorityScope,
): FinoraEffectivePricingAuthorityScope {

  return {
    ownerId:
      String(
        scope.ownerId ??
        "",
      ).trim(),

    businessId:
      String(
        scope.businessId ??
        "",
      ).trim(),

    branchId:
      String(
        scope.branchId ??
        "",
      ).trim(),
  };
}

export async function resolveFinoraAuthoritativeEffectivePrice(
  input:
    ResolveFinoraAuthoritativeEffectivePriceInput,
): Promise<FinoraAuthoritativeEffectivePriceResult> {

  const scope =
    normalizeScope(
      input.scope,
    );

  if (
    !scope.ownerId ||
    !scope.businessId ||
    !scope.branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_SCOPE",

      error:
        "Authenticated Owner, Business and Branch are required for FINORA Pricing.",
    };
  }

  const baseResult =
    resolveFinoraEffectivePrice({
      chargeCode:
        input.chargeCode,

      now:
        input.now,
    });

  if (!baseResult.success) {
    return {
      success:
        false,

      errorCode:
        "PRICING_RESOLUTION_FAILED",

      error:
        baseResult.reason,
    };
  }

  const branchAmount =
    resolveFinoraBranchFixedPrice(
      scope,
      input.chargeCode,
    );

  if (branchAmount === undefined) {
    return {
      success:
        true,

      quote:
        baseResult.quote,
    };
  }

  return {
    success:
      true,

    quote:
      Object.freeze({
        ...baseResult.quote,

        amount:
          branchAmount,
      }),
  };
}