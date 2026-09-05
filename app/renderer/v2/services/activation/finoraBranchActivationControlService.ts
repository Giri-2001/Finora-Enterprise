// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// SIGNED BRANCH ACTIVATION CONTROL SERVICE
//
// RESPONSIBILITY:
//
// - Validate BRANCH_ACTIVATION payload identity invariants
// - Validate REGISTERED / DEMO access grant semantics
// - Enforce installation binding
// - Enforce ISSUE / RENEW rules
// - Build canonical activation payloads
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
// - No wallet.
// - No pricing.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraActivation,
} from "../../types/activation/finoraActivation.types";

import type {
  FinoraBranchAccessGrant,
} from "../../types/activation/finoraBranchAccess.types";

import {
  FINORA_BRANCH_ACTIVATION_PAYLOAD_VERSION,
} from "../../types/activation/finoraBranchActivationControl.types";

import type {
  FinoraBranchActivationControlAction,
  FinoraBranchActivationControlPayloadV1,
} from "../../types/activation/finoraBranchActivationControl.types";

import {
  validateFinoraBranchAccessGrant,
} from "./finoraBranchAccessEvaluator";

// ============================================================
// VALIDATION RESULT
// ============================================================

export interface FinoraBranchActivationPayloadValidation {

  valid:
    boolean;

  error?:
    string;
}

// ============================================================
// HELPERS
// ============================================================

function isNonEmptyString(
  value: unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isValidIsoTimestamp(
  value: unknown,
): value is string {

  return (
    isNonEmptyString(
      value,
    ) &&
    Number.isFinite(
      Date.parse(
        value,
      ),
    )
  );
}

function identitiesMatch(
  activation:
    FinoraActivation,

  accessGrant:
    FinoraBranchAccessGrant,
): boolean {

  return (
    activation.ownerId ===
      accessGrant.ownerId &&
    activation.businessId ===
      accessGrant.businessId &&
    activation.branchId ===
      accessGrant.branchId
  );
}

// ============================================================
// VALIDATE
// ============================================================


function isFinoraActivationSha256Fingerprint(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

function isFinoraActivationBindingIdentityValid(
  bindingKeyId:
    unknown,

  fingerprintAlgorithm:
    unknown,

  publicKeyFingerprint:
    unknown,
): boolean {

  if (
    typeof bindingKeyId !==
      "string" ||
    bindingKeyId.trim().length ===
      0 ||
    fingerprintAlgorithm !==
      "SHA-256" ||
    !isFinoraActivationSha256Fingerprint(
      publicKeyFingerprint,
    )
  ) {
    return false;
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  return (
    bindingKeyId ===
      expectedBindingKeyId
  );
}
export function validateFinoraBranchActivationControlPayload(
  payload:
    FinoraBranchActivationControlPayloadV1,
): FinoraBranchActivationPayloadValidation {

  const installationBinding =
    payload.installationBinding as
      unknown;

  if (
    typeof installationBinding !==
      "object" ||
    installationBinding ===
      null
  ) {
    return {
      valid:
        false,

      error:
        "FINORA branch activation native installation binding is required.",
    };
  }

  const installationBindingRecord =
    installationBinding as
      Record<string, unknown>;

  if (
    !isFinoraActivationBindingIdentityValid(
      installationBindingRecord.bindingKeyId,
      installationBindingRecord.fingerprintAlgorithm,
      installationBindingRecord.publicKeyFingerprint,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA branch activation native installation binding is invalid.",
    };
  }

  if (
    payload.schemaVersion !==
      FINORA_BRANCH_ACTIVATION_PAYLOAD_VERSION
  ) {
    return {
      valid:
        false,

      error:
        "FINORA branch activation payload schema is unsupported.",
    };
  }


  if (
    payload.action !==
      "ISSUE" &&
    payload.action !==
      "RENEW" &&
    payload.action !==
      "REPLACE"
  ) {
    return {
      valid:
        false,

      error:
        "FINORA branch activation control action is invalid.",
    };
  }


  if (
    !isValidIsoTimestamp(
      payload.issuedAt,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA branch activation payload issuedAt timestamp is invalid.",
    };
  }


  if (
    !isNonEmptyString(
      payload.installationBinding
        .installationId,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA installation binding is required.",
    };
  }


  const activation =
    payload.activation;


  if (
    activation.schemaVersion !==
      1 ||
    !isNonEmptyString(
      activation.activationId,
    ) ||
    !isNonEmptyString(
      activation.ownerId,
    ) ||
    !isNonEmptyString(
      activation.businessId,
    ) ||
    !isNonEmptyString(
      activation.branchId,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA branch activation identity is invalid.",
    };
  }


  if (
    activation.status !==
      "ACTIVE"
  ) {
    return {
      valid:
        false,

      error:
        "FINORA issued branch access requires an ACTIVE branch activation.",
    };
  }


  const accessValidation =
    validateFinoraBranchAccessGrant(
      payload.accessGrant,
    );


  if (!accessValidation.valid) {
    return {
      valid:
        false,

      error:
        accessValidation.error ??
        "FINORA branch access grant is invalid.",
    };
  }


  if (
    !identitiesMatch(
      activation,
      payload.accessGrant,
    )
  ) {
    return {
      valid:
        false,

      error:
        "FINORA activation and access-grant branch identities do not match.",
    };
  }


  // ----------------------------------------------------------
  // RENEW RULE
  // ----------------------------------------------------------

  if (
    payload.action ===
      "RENEW" &&
    payload.accessGrant.accessType !==
      "REGISTERED"
  ) {
    return {
      valid:
        false,

      error:
        "FINORA RENEW action is valid only for REGISTERED access.",
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

export interface CreateFinoraBranchActivationControlPayloadInput {

  action:
    FinoraBranchActivationControlAction;

  activation:
    FinoraActivation;

  accessGrant:
    FinoraBranchAccessGrant;

  installationId:
    string;

  issuedAt?:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

// ============================================================
// BUILDER
// ============================================================

export function createFinoraBranchActivationControlPayload(
  input:
    CreateFinoraBranchActivationControlPayloadInput,
): FinoraBranchActivationControlPayloadV1 {

  const payload:
    FinoraBranchActivationControlPayloadV1 = {

      action:
        input.action,

      activation:
        input.activation,

      accessGrant:
        input.accessGrant,

      installationBinding: {
      installationId:
        input.installationId,

      bindingKeyId:
        input.bindingKeyId,

      fingerprintAlgorithm:
        input.fingerprintAlgorithm,

      publicKeyFingerprint:
        input.publicKeyFingerprint,
    },

      issuedAt:
        input.issuedAt ??
        new Date()
          .toISOString(),

      schemaVersion:
        FINORA_BRANCH_ACTIVATION_PAYLOAD_VERSION,
    };


  const validation =
    validateFinoraBranchActivationControlPayload(
      payload,
    );


  if (!validation.valid) {
    throw new Error(
      validation.error ??
      "FINORA branch activation payload is invalid.",
    );
  }


  return payload;
}

// ============================================================
// PACKAGE TARGET MATCH
// ============================================================

export interface FinoraBranchActivationExpectedTarget {

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

/**
 * Final domain-level identity guard after cryptographic package
 * verification.
 */
export function doesFinoraBranchActivationPayloadMatchTarget(
  payload:
    FinoraBranchActivationControlPayloadV1,

  target:
    FinoraBranchActivationExpectedTarget,
): boolean {

  if (
    !isFinoraActivationBindingIdentityValid(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    ) ||
    payload.installationBinding.installationId !==
      target.installationId ||
    payload.installationBinding.bindingKeyId !==
      target.bindingKeyId ||
    payload.installationBinding.fingerprintAlgorithm !==
      target.fingerprintAlgorithm ||
    payload.installationBinding.publicKeyFingerprint !==
      target.publicKeyFingerprint
  ) {
    return false;
  }

  return (
    payload.activation.ownerId ===
      target.ownerId &&
    payload.activation.businessId ===
      target.businessId &&
    payload.activation.branchId ===
      target.branchId &&
    payload.accessGrant.ownerId ===
      target.ownerId &&
    payload.accessGrant.businessId ===
      target.businessId &&
    payload.accessGrant.branchId ===
      target.branchId &&
    payload.installationBinding
      .installationId ===
      target.installationId
  );
}

// ============================================================
// END
// ============================================================