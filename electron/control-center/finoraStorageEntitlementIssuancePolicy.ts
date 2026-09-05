// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// STORAGE ENTITLEMENT ISSUANCE POLICY
//
// RESPONSIBILITY:
//
// - Revalidate STORAGE_ENTITLEMENT payloads before signing
// - Enforce Owner / Business / Branch identity binding
// - Enforce exact native installation binding
// - Enforce exact LOCAL / USB storage mode
// - Enforce entitlement lifecycle state
// - Reject malformed / inconsistent issuance requests
//
// SECURITY:
//
// Renderer/domain validation is NOT sufficient authority.
//
// The privileged Control Center signing boundary MUST validate
// the payload again before applying the private signing key.
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
// - USB volume identity is NOT licensing authority.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// TARGET
// ============================================================

export interface FinoraStorageEntitlementIssuanceTarget {

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

export interface FinoraStorageEntitlementIssuanceAccepted {

  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraStorageEntitlementIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraStorageEntitlementIssuancePolicyResult =
  | FinoraStorageEntitlementIssuanceAccepted
  | FinoraStorageEntitlementIssuanceRejected;

// ============================================================
// HELPERS
// ============================================================

function accepted(
  payload:
    Record<string, unknown>,
): FinoraStorageEntitlementIssuanceAccepted {

  return {
    valid:
      true,

    payload,
  };
}

function rejected(
  error:
    string,
): FinoraStorageEntitlementIssuanceRejected {

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

function parseCanonicalTimestamp(
  value:
    unknown,
): {
  canonical:
    string;
  milliseconds:
    number;
} | undefined {

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const milliseconds =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      milliseconds,
    )
  ) {
    return undefined;
  }

  const canonical =
    new Date(
      milliseconds,
    ).toISOString();

  if (canonical !== value) {
    return undefined;
  }

  return {
    canonical,
    milliseconds,
  };
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

function isInstallationBindingIdentityValid(
  bindingKeyId:
    unknown,

  fingerprintAlgorithm:
    unknown,

  publicKeyFingerprint:
    unknown,
): boolean {

  if (
    !isNonEmptyString(
      bindingKeyId,
    ) ||
    fingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
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

function isStorageMode(
  value:
    unknown,
): value is "LOCAL" | "USB" {

  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function isEntitlementStatus(
  value:
    unknown,
): value is
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED" {

  return (
    value ===
      "ACTIVE" ||
    value ===
      "SUSPENDED" ||
    value ===
      "REVOKED"
  );
}

// ============================================================
// VALIDATE
// ============================================================

export function validateFinoraStorageEntitlementIssuance(
  payload:
    unknown,

  target:
    FinoraStorageEntitlementIssuanceTarget,
): FinoraStorageEntitlementIssuancePolicyResult {

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
      "FINORA Storage Entitlement issuance target is incomplete.",
    );
  }

  if (
    !isInstallationBindingIdentityValid(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Storage Entitlement issuance device-binding target is invalid.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  if (!isRecord(payload)) {
    return rejected(
      "FINORA Storage Entitlement payload must be an object.",
    );
  }

  if (
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA Storage Entitlement payload schemaVersion must be 1.",
    );
  }

  const payloadIssuedAt =
    parseCanonicalTimestamp(
      payload.issuedAt,
    );

  if (!payloadIssuedAt) {
    return rejected(
      "FINORA Storage Entitlement payload issuedAt must be a canonical ISO timestamp.",
    );
  }

  const entitlement =
    payload.entitlement;

  if (!isRecord(entitlement)) {
    return rejected(
      "FINORA Storage Entitlement payload entitlement is required.",
    );
  }

  // ----------------------------------------------------------
  // ENTITLEMENT IDENTITY
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      entitlement.entitlementId,
    ) ||
    !isNonEmptyString(
      entitlement.userId,
    ) ||
    !isNonEmptyString(
      entitlement.ownerId,
    ) ||
    !isNonEmptyString(
      entitlement.businessId,
    ) ||
    !isNonEmptyString(
      entitlement.branchId,
    )
  ) {
    return rejected(
      "FINORA Storage Entitlement identity is incomplete.",
    );
  }

  if (
    entitlement.ownerId !==
      target.ownerId ||
    entitlement.businessId !==
      target.businessId ||
    entitlement.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA Storage Entitlement payload identity does not match the signed package target.",
    );
  }

  // ----------------------------------------------------------
  // NATIVE INSTALLATION BINDING
  // ----------------------------------------------------------

  if (
    !isNonEmptyString(
      entitlement.installationId,
    ) ||
    !isInstallationBindingIdentityValid(
      entitlement.bindingKeyId,
      entitlement.fingerprintAlgorithm,
      entitlement.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Storage Entitlement native installation binding is invalid.",
    );
  }

  if (
    entitlement.installationId !==
      target.installationId ||
    entitlement.bindingKeyId !==
      target.bindingKeyId ||
    entitlement.fingerprintAlgorithm !==
      target.fingerprintAlgorithm ||
    entitlement.publicKeyFingerprint !==
      target.publicKeyFingerprint
  ) {
    return rejected(
      "FINORA Storage Entitlement native installation binding does not match the signed package target.",
    );
  }

  // ----------------------------------------------------------
  // STORAGE MODE / STATUS
  // ----------------------------------------------------------

  if (
    !isStorageMode(
      entitlement.storageMode,
    )
  ) {
    return rejected(
      "FINORA Storage Entitlement storageMode must be LOCAL or USB.",
    );
  }

  if (
    !isEntitlementStatus(
      entitlement.status,
    )
  ) {
    return rejected(
      "FINORA Storage Entitlement status must be ACTIVE, SUSPENDED or REVOKED.",
    );
  }

  // ----------------------------------------------------------
  // ENTITLEMENT TIMESTAMPS
  // ----------------------------------------------------------

  const activatedAt =
    parseCanonicalTimestamp(
      entitlement.activatedAt,
    );

  const createdAt =
    parseCanonicalTimestamp(
      entitlement.createdAt,
    );

  const updatedAt =
    parseCanonicalTimestamp(
      entitlement.updatedAt,
    );

  if (
    !activatedAt ||
    !createdAt ||
    !updatedAt
  ) {
    return rejected(
      "FINORA Storage Entitlement timestamps must be canonical ISO timestamps.",
    );
  }

  if (
    createdAt.milliseconds >
      activatedAt.milliseconds ||
    activatedAt.milliseconds >
      updatedAt.milliseconds ||
    updatedAt.milliseconds >
      payloadIssuedAt.milliseconds
  ) {
    return rejected(
      "FINORA Storage Entitlement timestamp order is invalid.",
    );
  }

  if (
    entitlement.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA Storage Entitlement schemaVersion must be 1.",
    );
  }

  // ----------------------------------------------------------
  // ACCEPT
  // ----------------------------------------------------------

  return accepted(
    payload,
  );
}

// ============================================================
// END
// ============================================================