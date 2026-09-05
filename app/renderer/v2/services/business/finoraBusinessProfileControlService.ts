// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// SIGNED BUSINESS PROFILE CONTROL SERVICE
//
// RESPONSIBILITY:
//
// - Validate BUSINESS_PROFILE payload semantics
// - Reuse canonical installation-binding validation
// - Build canonical BUSINESS_PROFILE payloads
// - Match verified package targets to profile payloads
//
// IMPORTANT:
//
// - Pure domain logic.
// - No signing.
// - No private keys.
// - No persistence.
// - No Electron IPC.
// - No Android plugin.
// - No Business Date.
// - No operational settings mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  FINORA_BUSINESS_PROFILE_PAYLOAD_VERSION,
  FINORA_PROVISIONED_BUSINESS_PROFILE_VERSION,
} from "../../types/business/finoraBusinessProfileControl.types";

import type {
  FinoraBusinessProfileControlAction,
  FinoraBusinessProfileControlPayloadV1,
  FinoraProvisionedBusinessProfileV1,
} from "../../types/business/finoraBusinessProfileControl.types";

import type {
  FinoraInstallationBindingTarget,
} from "../../types/activation/finoraInstallationBinding.types";

import {
  validateFinoraInstallationBindingTarget,
} from "../activation/finoraInstallationBindingValidation";

// ============================================================
// VALIDATION RESULT
// ============================================================

export interface FinoraBusinessProfilePayloadValidation {

  valid:
    boolean;

  error?:
    string;
}

// ============================================================
// HELPERS
// ============================================================

function hasText(
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

function isIsoTimestamp(
  value:
    unknown,
): value is string {

  if (!hasText(value)) {
    return false;
  }

  const timestamp =
    Date.parse(
      value,
    );

  return Number.isFinite(
    timestamp,
  );
}

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

// ============================================================
// PROFILE VALIDATION
// ============================================================

export function validateFinoraProvisionedBusinessProfile(
  value:
    unknown,
): FinoraBusinessProfilePayloadValidation {

  if (!isRecord(value)) {
    return {
      valid:
        false,

      error:
        "FINORA provisioned Business Profile is required.",
    };
  }

  if (
    !hasText(
      value.profileId,
    ) ||
    !hasText(
      value.ownerId,
    ) ||
    !hasText(
      value.businessId,
    ) ||
    !hasText(
      value.branchId,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Business Profile identity is invalid.",
    };
  }

  if (
    !hasText(
      value.businessCode,
    ) ||
    !hasText(
      value.branchCode,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Business / Branch numbering codes are required.",
    };
  }

  if (
    !hasText(
      value.businessName,
    ) ||
    !hasText(
      value.branchName,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Business / Branch names are required.",
    };
  }

  if (
    !isIsoTimestamp(
      value.createdAt,
    ) ||
    !isIsoTimestamp(
      value.updatedAt,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Business Profile audit timestamps are invalid.",
    };
  }

  if (
    Date.parse(
      value.updatedAt,
    ) <
    Date.parse(
      value.createdAt,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Business Profile updatedAt cannot precede createdAt.",
    };
  }

  if (
    value.schemaVersion !==
      FINORA_PROVISIONED_BUSINESS_PROFILE_VERSION
  ) {
    return {
      valid:
        false,

      error:
        "FINORA Business Profile schema version is unsupported.",
    };
  }

  return {
    valid:
      true,
  };
}

// ============================================================
// PAYLOAD VALIDATION
// ============================================================

export function validateFinoraBusinessProfileControlPayload(
  value:
    unknown,
): FinoraBusinessProfilePayloadValidation {

  if (!isRecord(value)) {
    return {
      valid:
        false,

      error:
        "FINORA BUSINESS_PROFILE payload is required.",
    };
  }

  if (
    value.schemaVersion !==
      FINORA_BUSINESS_PROFILE_PAYLOAD_VERSION
  ) {
    return {
      valid:
        false,

      error:
        "FINORA BUSINESS_PROFILE payload schema is unsupported.",
    };
  }

  if (
    value.action !==
      "ISSUE" &&
    value.action !==
      "REPLACE"
  ) {
    return {
      valid:
        false,

      error:
        "FINORA BUSINESS_PROFILE control action is invalid.",
    };
  }

  if (
    !isIsoTimestamp(
      value.issuedAt,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA BUSINESS_PROFILE issuedAt timestamp is invalid.",
    };
  }

  const profileValidation =
    validateFinoraProvisionedBusinessProfile(
      value.profile,
    );

  if (!profileValidation.valid) {
    return profileValidation;
  }

  if (!isRecord(value.installationBinding)) {
    return {
      valid:
        false,

      error:
        "FINORA BUSINESS_PROFILE installation binding is required.",
    };
  }

  const bindingValidationError =
    validateFinoraInstallationBindingTarget(
      value.installationBinding as
        unknown as FinoraInstallationBindingTarget,
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

// ============================================================
// BUILDER INPUT
// ============================================================

export interface CreateFinoraBusinessProfileControlPayloadInput {

  action:
    FinoraBusinessProfileControlAction;

  profile:
    FinoraProvisionedBusinessProfileV1;

  installationBinding:
    FinoraInstallationBindingTarget;

  issuedAt?:
    string;
}

// ============================================================
// BUILDER
// ============================================================

export function createFinoraBusinessProfileControlPayload(
  input:
    CreateFinoraBusinessProfileControlPayloadInput,
): FinoraBusinessProfileControlPayloadV1 {

  const payload:
    FinoraBusinessProfileControlPayloadV1 = {

      action:
        input.action,

      profile:
        input.profile,

      installationBinding:
        input.installationBinding,

      issuedAt:
        input.issuedAt ??
        new Date()
          .toISOString(),

      schemaVersion:
        FINORA_BUSINESS_PROFILE_PAYLOAD_VERSION,
    };

  const validation =
    validateFinoraBusinessProfileControlPayload(
      payload,
    );

  if (!validation.valid) {
    throw new Error(
      validation.error ??
      "FINORA BUSINESS_PROFILE payload is invalid.",
    );
  }

  return payload;
}

// ============================================================
// EXPECTED VERIFIED TARGET
// ============================================================

/**
 * Expected target after the generic signed Control Package has
 * already passed cryptographic verification.
 *
 * The full native binding tuple is deliberately required here.
 */
export interface FinoraBusinessProfileExpectedTarget {

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
    "SHA-256";

  publicKeyFingerprint:
    string;
}

// ============================================================
// PACKAGE TARGET MATCH
// ============================================================

export function doesFinoraBusinessProfilePayloadMatchTarget(
  payload:
    FinoraBusinessProfileControlPayloadV1,

  target:
    FinoraBusinessProfileExpectedTarget,
): boolean {

  const payloadValidation =
    validateFinoraBusinessProfileControlPayload(
      payload,
    );

  if (!payloadValidation.valid) {
    return false;
  }

  const targetBinding:
    FinoraInstallationBindingTarget = {

      installationId:
        target.installationId,

      bindingKeyId:
        target.bindingKeyId,

      fingerprintAlgorithm:
        target.fingerprintAlgorithm,

      publicKeyFingerprint:
        target.publicKeyFingerprint,

      schemaVersion:
        1,
    };

  if (
    validateFinoraInstallationBindingTarget(
      targetBinding,
    ) !==
      null
  ) {
    return false;
  }

  return (
    payload.profile.ownerId ===
      target.ownerId &&
    payload.profile.businessId ===
      target.businessId &&
    payload.profile.branchId ===
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

// ============================================================
// END
// ============================================================