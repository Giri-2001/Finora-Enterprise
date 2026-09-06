/* ============================================================
   FINORA ENTERPRISE OS™

   PRICING OVERRIDE ENGINE™

   PURE CONTROL PAYLOAD SERVICE

   RESPONSIBILITY:

   - Validate Pricing Override schedules
   - Reject unsupported / base-disabled charges
   - Reject zero or invalid platform prices
   - Enforce inclusive/exclusive validity windows
   - Reject overlapping windows for the same charge
   - Build immutable REPLACE payloads
   - Match a verified package target exactly

   IMPORTANT:

   - Pure domain logic.
   - No persistence.
   - No signing.
   - No private keys.
   - No Wallet mutation.
   - No StorageManager.
   - No Electron IPC.
   - No Business Date.
   - No runtime precedence guessing.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  FINORA_BASE_PRICING_CATALOG,
} from "./finoraPricingCatalog";

import {
  validateFinoraInstallationBindingTarget,
} from "../activation/finoraInstallationBindingValidation";

import {
  FINORA_PRICING_OVERRIDE_PAYLOAD_VERSION,
  FINORA_PRICING_OVERRIDE_RULE_VERSION,
  FINORA_PRICING_OVERRIDE_SET_VERSION,
} from "../../types/pricing/finoraPricingOverride.types";

import type {
  FinoraPricingOverrideControlPayloadV1,
  FinoraPricingOverrideExpectedTarget,
  FinoraPricingOverrideRuleV1,
  FinoraPricingOverrideSetV1,
} from "../../types/pricing/finoraPricingOverride.types";

import type {
  FinoraInstallationBindingTarget,
} from "../../types/activation/finoraInstallationBinding.types";

import type {
  FinoraBasePricingRule,
} from "../../types/pricing/finoraPricing.types";

/* ============================================================
   VALIDATION RESULT
============================================================ */

export interface FinoraPricingOverrideValidation {

  valid:
    boolean;

  error?:
    string;
}

/* ============================================================
   HELPERS
============================================================ */

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function parseTimestamp(
  value:
    unknown,
): number | undefined {

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function isCanonicalChargeCode(
  value:
    unknown,
): value is FinoraBasePricingRule["chargeCode"] {

  return (
    isNonEmptyString(value) &&
    Object.prototype.hasOwnProperty.call(
      FINORA_BASE_PRICING_CATALOG,
      value,
    )
  );
}

/* ============================================================
   RULE VALIDATION
============================================================ */

export function validateFinoraPricingOverrideRule(
  value:
    unknown,
): FinoraPricingOverrideValidation {

  if (!isRecord(value)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override rule is required.",
    };
  }

  if (
    value.schemaVersion !==
      FINORA_PRICING_OVERRIDE_RULE_VERSION
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override rule schema is unsupported.",
    };
  }

  if (!isNonEmptyString(value.overrideId)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override ID is required.",
    };
  }

  if (!isCanonicalChargeCode(value.chargeCode)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override charge code is invalid.",
    };
  }

  const baseRule =
    FINORA_BASE_PRICING_CATALOG[
      value.chargeCode
    ];

  if (!baseRule.enabled) {
    return {
      valid:
        false,

      error:
        `FINORA Pricing Override cannot enable base-disabled charge ${value.chargeCode}.`,
    };
  }

  if (
    value.model !==
      "FIXED_PRICE_OVERRIDE"
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override model is unsupported.",
    };
  }

  if (
    typeof value.amount !==
      "number" ||
    !Number.isFinite(value.amount) ||
    value.amount <=
      0
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override amount must be a positive finite number.",
    };
  }

  if (value.currency !== "INR") {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override currency must be INR.",
    };
  }

  if (!isRecord(value.validity)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override validity is required.",
    };
  }

  const validFrom =
    parseTimestamp(
      value.validity.validFrom,
    );

  const validUntil =
    parseTimestamp(
      value.validity.validUntil,
    );

  if (
    validFrom === undefined ||
    validUntil === undefined
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override validity timestamps are invalid.",
    };
  }

  if (validUntil <= validFrom) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override expiry must be later than its start timestamp.",
    };
  }

  return {
    valid:
      true,
  };
}

/* ============================================================
   OVERRIDE SET VALIDATION
============================================================ */

export function validateFinoraPricingOverrideSet(
  value:
    unknown,
): FinoraPricingOverrideValidation {

  if (!isRecord(value)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override set is required.",
    };
  }

  if (
    value.schemaVersion !==
      FINORA_PRICING_OVERRIDE_SET_VERSION
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override set schema is unsupported.",
    };
  }

  if (!isNonEmptyString(value.overrideSetId)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override set ID is required.",
    };
  }

  if (!isRecord(value.scope)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override scope is required.",
    };
  }

  if (
    !isNonEmptyString(value.scope.ownerId) ||
    !isNonEmptyString(value.scope.businessId) ||
    !isNonEmptyString(value.scope.branchId)
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override Owner, Business and Branch scope is required.",
    };
  }

  if (!Array.isArray(value.overrides)) {
    return {
      valid:
        false,

      error:
        "FINORA Pricing Override schedule is required.",
    };
  }

  const seenOverrideIds =
    new Set<string>();

  const windowsByCharge =
    new Map<
      FinoraBasePricingRule["chargeCode"],
      Array<{
        overrideId:
          string;

        validFrom:
          number;

        validUntil:
          number;
      }>
    >();

  for (const candidate of value.overrides) {

    const validation =
      validateFinoraPricingOverrideRule(
        candidate,
      );

    if (!validation.valid) {
      return validation;
    }

    const rule =
      candidate as
        unknown as
        FinoraPricingOverrideRuleV1;

    if (seenOverrideIds.has(rule.overrideId)) {
      return {
        valid:
          false,

        error:
          `FINORA Pricing Override ID ${rule.overrideId} is duplicated.`,
      };
    }

    seenOverrideIds.add(
      rule.overrideId,
    );

    const validFrom =
      Date.parse(
        rule.validity.validFrom,
      );

    const validUntil =
      Date.parse(
        rule.validity.validUntil,
      );

    const windows =
      windowsByCharge.get(
        rule.chargeCode,
      ) ?? [];

    windows.push({
      overrideId:
        rule.overrideId,

      validFrom,

      validUntil,
    });

    windowsByCharge.set(
      rule.chargeCode,
      windows,
    );
  }

  // ----------------------------------------------------------
  // SAME-CHARGE OVERLAP IS INVALID
  //
  // validUntil is exclusive, therefore:
  //
  // [10:00, 11:00)
  // [11:00, 12:00)
  //
  // is legal and deterministic.
  // ----------------------------------------------------------

  for (
    const [
      chargeCode,
      windows,
    ] of windowsByCharge
  ) {

    const sorted =
      [...windows].sort(
        (left, right) =>
          left.validFrom -
          right.validFrom,
      );

    for (
      let index = 1;
      index < sorted.length;
      index += 1
    ) {

      const previous =
        sorted[index - 1];

      const current =
        sorted[index];

      if (
        !previous ||
        !current
      ) {
        continue;
      }

      if (
        current.validFrom <
          previous.validUntil
      ) {
        return {
          valid:
            false,

          error:
            `FINORA Pricing Override windows overlap for ${chargeCode}: ${previous.overrideId} and ${current.overrideId}.`,
        };
      }
    }
  }

  return {
    valid:
      true,
  };
}

/* ============================================================
   CONTROL PAYLOAD VALIDATION
============================================================ */

export function validateFinoraPricingOverrideControlPayload(
  value:
    unknown,
): FinoraPricingOverrideValidation {

  if (!isRecord(value)) {
    return {
      valid:
        false,

      error:
        "FINORA PRICING_OVERRIDE payload is required.",
    };
  }

  if (
    value.schemaVersion !==
      FINORA_PRICING_OVERRIDE_PAYLOAD_VERSION
  ) {
    return {
      valid:
        false,

      error:
        "FINORA PRICING_OVERRIDE payload schema is unsupported.",
    };
  }

  if (value.action !== "REPLACE") {
    return {
      valid:
        false,

      error:
        "FINORA PRICING_OVERRIDE action must be REPLACE.",
    };
  }

  if (
    parseTimestamp(
      value.issuedAt,
    ) === undefined
  ) {
    return {
      valid:
        false,

      error:
        "FINORA PRICING_OVERRIDE issuedAt timestamp is invalid.",
    };
  }

  const overrideSetValidation =
    validateFinoraPricingOverrideSet(
      value.overrideSet,
    );

  if (!overrideSetValidation.valid) {
    return overrideSetValidation;
  }

  if (!isRecord(value.installationBinding)) {
    return {
      valid:
        false,

      error:
        "FINORA PRICING_OVERRIDE installation binding is required.",
    };
  }

  const bindingValidationError =
    validateFinoraInstallationBindingTarget(
      value.installationBinding as
        unknown as
        FinoraInstallationBindingTarget,
    );

  if (bindingValidationError) {
    return {
      valid:
        false,

      error:
        bindingValidationError,
    };
  }

  return {
    valid:
      true,
  };
}

/* ============================================================
   PAYLOAD BUILDER
============================================================ */

export interface CreateFinoraPricingOverrideControlPayloadInput {

  overrideSet:
    FinoraPricingOverrideSetV1;

  installationBinding:
    FinoraInstallationBindingTarget;

  issuedAt?:
    string;
}

export function createFinoraPricingOverrideControlPayload(
  input:
    CreateFinoraPricingOverrideControlPayloadInput,
): FinoraPricingOverrideControlPayloadV1 {

  const overrides =
    input.overrideSet.overrides.map(
      (rule) =>
        Object.freeze({
          ...rule,

          validity:
            Object.freeze({
              ...rule.validity,
            }),
        }),
    );

  const overrideSet =
    Object.freeze({
      ...input.overrideSet,

      scope:
        Object.freeze({
          ...input.overrideSet.scope,
        }),

      overrides:
        Object.freeze(
          overrides,
        ),
    });

  const payload =
    Object.freeze({
      action:
        "REPLACE" as const,

      overrideSet,

      installationBinding:
        Object.freeze({
          ...input.installationBinding,
        }),

      issuedAt:
        input.issuedAt ??
        new Date()
          .toISOString(),

      schemaVersion:
        FINORA_PRICING_OVERRIDE_PAYLOAD_VERSION,
    });

  const validation =
    validateFinoraPricingOverrideControlPayload(
      payload,
    );

  if (!validation.valid) {
    throw new Error(
      validation.error ??
      "FINORA PRICING_OVERRIDE payload is invalid.",
    );
  }

  return payload;
}

/* ============================================================
   VERIFIED PACKAGE TARGET MATCH
============================================================ */

export function doesFinoraPricingOverridePayloadMatchTarget(
  payload:
    FinoraPricingOverrideControlPayloadV1,

  target:
    FinoraPricingOverrideExpectedTarget,
): boolean {

  const validation =
    validateFinoraPricingOverrideControlPayload(
      payload,
    );

  if (!validation.valid) {
    return false;
  }

  return (
    payload.overrideSet.scope.ownerId ===
      target.ownerId &&
    payload.overrideSet.scope.businessId ===
      target.businessId &&
    payload.overrideSet.scope.branchId ===
      target.branchId &&
    payload.installationBinding.installationId ===
      target.installationId &&
    payload.installationBinding.bindingKeyId ===
      target.bindingKeyId &&
    payload.installationBinding.fingerprintAlgorithm ===
      target.fingerprintAlgorithm &&
    payload.installationBinding.publicKeyFingerprint ===
      target.publicKeyFingerprint
  );
}

/* ============================================================
   END
============================================================ */