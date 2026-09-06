/* ============================================================
   FINORA ENTERPRISE OS™

   PRICING OVERRIDE ENGINE™

   DOMAIN CONTRACTS

   RESPONSIBILITY:

   - Define signed Pricing Override payload contracts
   - Preserve canonical base Pricing ownership
   - Define exact Owner / Business / Branch scope
   - Define fixed-price override validity windows
   - Preserve installation binding in the signed payload
   - Support authoritative schedule replacement

   IMPORTANT:

   - No persistence.
   - No signing.
   - No Wallet mutation.
   - No Business Date.
   - No percentage discounts.
   - No zero-fee waiver semantics.
   - No override may enable a base-disabled platform charge.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  FinoraInstallationBindingTarget,
} from "../activation/finoraInstallationBinding.types";

import type {
  FinoraBasePricingRule,
  FinoraPricingCurrency,
} from "./finoraPricing.types";

/* ============================================================
   CONSTANTS
============================================================ */

export const FINORA_PRICING_OVERRIDE_CONTROL_PURPOSE =
  "PRICING_POLICY" as const;

export const FINORA_PRICING_OVERRIDE_PAYLOAD_VERSION =
  1 as const;

export const FINORA_PRICING_OVERRIDE_SET_VERSION =
  1 as const;

export const FINORA_PRICING_OVERRIDE_RULE_VERSION =
  1 as const;

/* ============================================================
   ACTION / MODEL
============================================================ */

export type FinoraPricingOverrideControlAction =
  "REPLACE";

export type FinoraPricingOverrideModel =
  "FIXED_PRICE_OVERRIDE";

/* ============================================================
   CANONICAL CHARGE CODE
============================================================ */

export type FinoraPricingOverrideChargeCode =
  FinoraBasePricingRule["chargeCode"];

/* ============================================================
   SCOPE
============================================================ */

export interface FinoraPricingOverrideScope {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

/* ============================================================
   VALIDITY

   validFrom  = inclusive
   validUntil = exclusive
============================================================ */

export interface FinoraPricingOverrideValidity {

  validFrom:
    string;

  validUntil:
    string;
}

/* ============================================================
   OVERRIDE RULE
============================================================ */

export interface FinoraPricingOverrideRuleV1 {

  /**
   * Stable Control Center identity for this override rule.
   */
  overrideId:
    string;

  chargeCode:
    FinoraPricingOverrideChargeCode;

  model:
    "FIXED_PRICE_OVERRIDE";

  /**
   * Platform fee after override.
   *
   * Zero is deliberately unsupported in Phase 7 because the
   * Wallet Debit Engine requires strictly-positive debits.
   */
  amount:
    number;

  currency:
    FinoraPricingCurrency;

  validity:
    FinoraPricingOverrideValidity;

  schemaVersion:
    1;
}

export type FinoraPricingOverrideRule =
  FinoraPricingOverrideRuleV1;

/* ============================================================
   AUTHORITATIVE OVERRIDE SET
============================================================ */

export interface FinoraPricingOverrideSetV1 {

  /**
   * Stable identity for this signed override-set lineage.
   *
   * Package sequence remains the authoritative replay /
   * monotonic replacement control.
   */
  overrideSetId:
    string;

  scope:
    FinoraPricingOverrideScope;

  /**
   * Entire authoritative schedule.
   *
   * Empty is legal:
   * a signed REPLACE with [] clears all Pricing Overrides and
   * returns the branch to canonical Base Pricing.
   */
  overrides:
    readonly FinoraPricingOverrideRuleV1[];

  schemaVersion:
    1;
}

export type FinoraPricingOverrideSet =
  FinoraPricingOverrideSetV1;

/* ============================================================
   SIGNED DOMAIN PAYLOAD
============================================================ */

export interface FinoraPricingOverrideControlPayloadV1 {

  action:
    FinoraPricingOverrideControlAction;

  overrideSet:
    FinoraPricingOverrideSetV1;

  installationBinding:
    FinoraInstallationBindingTarget;

  /**
   * Must later match the generic Control Package issuedAt
   * exactly at the signed-package application boundary.
   */
  issuedAt:
    string;

  schemaVersion:
    1;
}

export type FinoraPricingOverrideControlPayload =
  FinoraPricingOverrideControlPayloadV1;

/* ============================================================
   EXPECTED VERIFIED TARGET
============================================================ */

export interface FinoraPricingOverrideExpectedTarget {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    FinoraInstallationBindingTarget["fingerprintAlgorithm"];

  publicKeyFingerprint:
    string;
}

/* ============================================================
   END
============================================================ */