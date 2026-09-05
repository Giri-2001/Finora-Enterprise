// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// BUSINESS PROFILE ISSUANCE POLICY
//
// RESPONSIBILITY:
//
// - Revalidate BUSINESS_PROFILE payload before signing
// - Require exact Owner / Business / Branch target identity
// - Require exact native installation binding
// - Validate FINORA-controlled identity/profile fields
// - Reject malformed ISSUE / REPLACE payloads
//
// SECURITY:
//
// Renderer/domain validation is NOT sufficient authority.
//
// The privileged Control Center signing boundary MUST validate
// the payload independently before applying the private key.
//
// IMPORTANT:
//
// - PURE NODE/DOMAIN POLICY.
// - No Electron IPC.
// - No private keys.
// - No signing.
// - No filesystem.
// - No safeStorage.
// - No Business Date.
// - No operational Business / Branch settings.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// TARGET
// ============================================================

export interface FinoraBusinessProfileIssuanceTarget {

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
// RESULT
// ============================================================

export interface FinoraBusinessProfileIssuanceAccepted {

  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraBusinessProfileIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraBusinessProfileIssuancePolicyResult =
  | FinoraBusinessProfileIssuanceAccepted
  | FinoraBusinessProfileIssuanceRejected;

// ============================================================
// HELPERS
// ============================================================

function rejected(
  error:
    string,
): FinoraBusinessProfileIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
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

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : undefined;
}

function isSha256Fingerprint(
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

function bindingKeyMatchesFingerprint(
  bindingKeyId:
    unknown,

  publicKeyFingerprint:
    unknown,
): boolean {

  if (
    !isNonEmptyString(
      bindingKeyId,
    ) ||
    !isSha256Fingerprint(
      publicKeyFingerprint,
    )
  ) {
    return false;
  }

  const expectedBindingKeyId =
    "FINORA-BINDING-" +
    publicKeyFingerprint
      .substring(
        0,
        32,
      )
      .toUpperCase();

  return (
    bindingKeyId ===
      expectedBindingKeyId
  );
}

function isValidBindingIdentity(
  bindingKeyId:
    unknown,

  fingerprintAlgorithm:
    unknown,

  publicKeyFingerprint:
    unknown,
): boolean {

  return (
    fingerprintAlgorithm ===
      "SHA-256" &&
    isSha256Fingerprint(
      publicKeyFingerprint,
    ) &&
    bindingKeyMatchesFingerprint(
      bindingKeyId,
      publicKeyFingerprint,
    )
  );
}

// ============================================================
// VALIDATE
// ============================================================

export function validateFinoraBusinessProfileIssuance(
  payload:
    unknown,

  target:
    FinoraBusinessProfileIssuanceTarget,
): FinoraBusinessProfileIssuancePolicyResult {

  // ----------------------------------------------------------
  // TARGET
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      target.ownerId,
    ) ||
    !isNonEmptyString(
      target.businessId,
    ) ||
    !isNonEmptyString(
      target.branchId,
    ) ||
    !isNonEmptyString(
      target.installationId,
    )
  ) {
    return rejected(
      "FINORA Business Profile issuance target is incomplete.",
    );
  }

  if (
    !isValidBindingIdentity(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Business Profile issuance target installation binding is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  if (!isRecord(payload)) {
    return rejected(
      "FINORA BUSINESS_PROFILE payload is invalid.",
    );
  }

  if (
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE payload schema is unsupported.",
    );
  }

  if (
    payload.action !==
      "ISSUE" &&
    payload.action !==
      "REPLACE"
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE action must be ISSUE or REPLACE.",
    );
  }

  const payloadIssuedAt =
    parseTimestamp(
      payload.issuedAt,
    );

  if (
    payloadIssuedAt ===
      undefined
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE issuedAt timestamp is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PROFILE
  // ----------------------------------------------------------

  if (!isRecord(payload.profile)) {
    return rejected(
      "FINORA provisioned Business Profile is required.",
    );
  }

  const profile =
    payload.profile;

  if (
    !isNonEmptyString(
      profile.profileId,
    ) ||
    !isNonEmptyString(
      profile.ownerId,
    ) ||
    !isNonEmptyString(
      profile.businessId,
    ) ||
    !isNonEmptyString(
      profile.branchId,
    )
  ) {
    return rejected(
      "FINORA Business Profile identity is invalid.",
    );
  }

  if (
    !isNonEmptyString(
      profile.businessCode,
    ) ||
    !isNonEmptyString(
      profile.branchCode,
    )
  ) {
    return rejected(
      "FINORA Business / Branch numbering codes are required.",
    );
  }

  if (
    !isNonEmptyString(
      profile.businessName,
    ) ||
    !isNonEmptyString(
      profile.branchName,
    )
  ) {
    return rejected(
      "FINORA Business / Branch names are required.",
    );
  }

  const profileCreatedAt =
    parseTimestamp(
      profile.createdAt,
    );

  const profileUpdatedAt =
    parseTimestamp(
      profile.updatedAt,
    );

  if (
    profileCreatedAt ===
      undefined ||
    profileUpdatedAt ===
      undefined
  ) {
    return rejected(
      "FINORA Business Profile audit timestamps are invalid.",
    );
  }

  if (
    profileUpdatedAt <
      profileCreatedAt
  ) {
    return rejected(
      "FINORA Business Profile updatedAt cannot precede createdAt.",
    );
  }

  if (
    profile.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA Business Profile schema version is unsupported.",
    );
  }

  // ----------------------------------------------------------
  // PROFILE ↔ PACKAGE TARGET
  // ----------------------------------------------------------

  if (
    profile.ownerId !==
      target.ownerId ||
    profile.businessId !==
      target.businessId ||
    profile.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA Business Profile identity does not match the package target.",
    );
  }

  // ----------------------------------------------------------
  // INSTALLATION BINDING
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.installationBinding,
    )
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE installation binding is required.",
    );
  }

  const installationBinding =
    payload.installationBinding;

  if (
    !isNonEmptyString(
      installationBinding.installationId,
    ) ||
    installationBinding.installationId !==
      target.installationId
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE installationId does not match the package target.",
    );
  }

  if (
    installationBinding.schemaVersion !==
      1 ||
    !isValidBindingIdentity(
      installationBinding.bindingKeyId,
      installationBinding.fingerprintAlgorithm,
      installationBinding.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE installation binding is invalid.",
    );
  }

  if (
    installationBinding.bindingKeyId !==
      target.bindingKeyId ||
    installationBinding.fingerprintAlgorithm !==
      target.fingerprintAlgorithm ||
    installationBinding.publicKeyFingerprint !==
      target.publicKeyFingerprint
  ) {
    return rejected(
      "FINORA BUSINESS_PROFILE installation binding does not match the package target.",
    );
  }

  return {
    valid:
      true,

    payload,
  };
}

// ============================================================
// END
// ============================================================