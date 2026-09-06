/* ============================================================
   FINORA ENTERPRISE OS™

   EFFECTIVE PRICING AUTHORITY SERVICE™

   RESPONSIBILITY:

   - Read the verified native Pricing Policy for one exact scope
   - Fail closed when the native Control Bridge is unavailable
   - Fail closed when Pricing Policy state cannot be read
   - Delegate pure price resolution to Effective Pricing Engine
   - Return one authoritative runtime-effective quote

   IMPORTANT:

   - READ ONLY.
   - No Pricing Policy mutation.
   - No Control Package apply authority.
   - No signing authority.
   - No Wallet mutation.
   - No persistence.
   - No StorageManager.
   - No Business Date.
   - Actual system/runtime time only.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  getFinoraActivationControlBridge,
} from "../activation/activationControlBridge";

import {
  resolveFinoraEffectivePrice,
} from "./finoraEffectivePricingEngine";

import type {
  FinoraEffectivePriceQuote,
} from "../../types/pricing/finoraEffectivePricing.types";

import type {
  FinoraBasePricingRule,
} from "../../types/pricing/finoraPricing.types";

/* ============================================================
   SCOPE
============================================================ */

export interface FinoraEffectivePricingAuthorityScope {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

/* ============================================================
   INPUT
============================================================ */

export interface ResolveFinoraAuthoritativeEffectivePriceInput {

  chargeCode:
    FinoraBasePricingRule["chargeCode"];

  scope:
    FinoraEffectivePricingAuthorityScope;

  /**
   * Actual runtime clock.
   *
   * Optional only to support deterministic domain verification.
   * Production callers normally omit it.
   */
  now?:
    Date;
}

/* ============================================================
   RESULT
============================================================ */

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

/* ============================================================
   NORMALIZE SCOPE
============================================================ */

function normalizePricingAuthorityScope(
  scope:
    FinoraEffectivePricingAuthorityScope,
): FinoraEffectivePricingAuthorityScope {

  return {
    ownerId:
      String(scope.ownerId ?? "").trim(),

    businessId:
      String(scope.businessId ?? "").trim(),

    branchId:
      String(scope.branchId ?? "").trim(),
  };
}

/* ============================================================
   RESOLVE AUTHORITATIVE EFFECTIVE PRICE
============================================================ */

export async function resolveFinoraAuthoritativeEffectivePrice(
  input:
    ResolveFinoraAuthoritativeEffectivePriceInput,
): Promise<FinoraAuthoritativeEffectivePriceResult> {

  const scope =
    normalizePricingAuthorityScope(
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

  /*
   * A missing native Control Bridge must never silently downgrade
   * commercial pricing to Base Pricing.
   *
   * Otherwise disabling/bypassing the native verified policy
   * boundary could bypass an authoritative Pricing Override.
   */
  const controlBridge =
    getFinoraActivationControlBridge();

  if (!controlBridge) {

    return {
      success:
        false,

      errorCode:
        "CONTROL_BRIDGE_UNAVAILABLE",

      error:
        "FINORA secure Pricing Policy control bridge is unavailable.",
    };
  }

  try {

    const policyResult =
      await controlBridge.findPricingPolicy({
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,
      });

    if (!policyResult.success) {

      return {
        success:
          false,

        errorCode:
          "PRICING_POLICY_READ_FAILED",

        error:
          policyResult.error ??
          "Unable to read the verified FINORA Pricing Policy.",
      };
    }

    /*
     * data === undefined is authoritative "no Pricing Policy".
     *
     * That is distinct from a failed native read and legitimately
     * resolves through immutable Base Pricing.
     */
    const effectiveResult =
      resolveFinoraEffectivePrice({
        chargeCode:
          input.chargeCode,

        overrideSet:
          policyResult.data,

        now:
          input.now,
      });

    if (!effectiveResult.success) {

      return {
        success:
          false,

        errorCode:
          "PRICING_RESOLUTION_FAILED",

        error:
          effectiveResult.reason,
      };
    }

    return {
      success:
        true,

      quote:
        effectiveResult.quote,
    };

  } catch (error) {

    return {
      success:
        false,

      errorCode:
        "PRICING_POLICY_READ_FAILED",

      error:
        error instanceof Error
          ? error.message
          : "Unable to read the verified FINORA Pricing Policy.",
    };
  }
}

/* ============================================================
   END
============================================================ */