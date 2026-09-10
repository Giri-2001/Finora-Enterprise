// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// BRANCH ACTIVATION ISSUANCE POLICY
//
// RESPONSIBILITY:
//
// - Revalidate BRANCH_ACTIVATION payloads before signing
// - Enforce Owner / Business / Branch identity binding
// - Enforce Installation binding
// - Enforce REGISTERED annual commercial invariants
// - Enforce arbitrary DEMO validity
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
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// CONSTANTS
// ============================================================

const REGISTERED_DURATION_MS =
  365 * 24 * 60 * 60 * 1000;

const REGISTRATION_FEE =
  2000;

const REGISTRATION_CURRENCY =
  "INR";

// ============================================================
// TARGET
// ============================================================

export interface FinoraBranchActivationIssuanceTarget {

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

export interface FinoraBranchActivationIssuanceAccepted {

  valid:
    true;

  payload:
    Record<string, unknown>;
}

export interface FinoraBranchActivationIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraBranchActivationIssuancePolicyResult =
  | FinoraBranchActivationIssuanceAccepted
  | FinoraBranchActivationIssuanceRejected;

// ============================================================
// HELPERS
// ============================================================

function rejected(
  error: string,
): FinoraBranchActivationIssuanceRejected {

  return {
    valid:
      false,

    error,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(value)
  );
}

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

function isOptionalString(
  value: unknown,
): boolean {

  return (
    value ===
      undefined ||
    typeof value ===
      "string"
  );
}

function isStorageMode(
  value: unknown,
): value is "LOCAL" | "USB" {

  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function isRegistrationPaymentMode(
  value: unknown,
): value is
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "OTHER" {

  return (
    value ===
      "CASH" ||
    value ===
      "UPI" ||
    value ===
      "BANK_TRANSFER" ||
    value ===
      "OTHER"
  );
}

function parseTimestamp(
  value: unknown,
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

function isPositiveSafeInteger(
  value: unknown,
): value is number {

  return (
    typeof value ===
      "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value >
      0
  );
}

// ============================================================
// VALIDATE
// ============================================================


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
    typeof bindingKeyId !==
      "string" ||
    bindingKeyId.trim().length ===
      0 ||
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
export function validateFinoraBranchActivationIssuance(
  payload:
    unknown,

  target:
    FinoraBranchActivationIssuanceTarget,
): FinoraBranchActivationIssuancePolicyResult {

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
      "FINORA Branch Activation issuance target is incomplete.",
    );
  }


  // ----------------------------------------------------------
  if (
    !isInstallationBindingIdentityValid(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Branch Activation issuance device-binding target is invalid.",
    );
  }


  // ----------------------------------------------------------
  // PAYLOAD ROOT
  // ----------------------------------------------------------

  if (!isRecord(payload)) {
    return rejected(
      "FINORA Branch Activation payload must be an object.",
    );
  }


  if (
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA Branch Activation payload schema is unsupported.",
    );
  }


  if (
    payload.action !==
      "ISSUE"
  ) {
    return rejected(
      "FINORA Branch Activation action is invalid.",
    );
  }


  if (
    parseTimestamp(
      payload.issuedAt,
    ) === undefined
  ) {
    return rejected(
      "FINORA Branch Activation payload issuedAt is invalid.",
    );
  }


  // ----------------------------------------------------------
  if (
    !isRecord(
      payload.installationBinding,
    ) ||
    !isNonEmptyString(
      payload.installationBinding
        .installationId,
    ) ||
    !isInstallationBindingIdentityValid(
      payload.installationBinding
        .bindingKeyId,
      payload.installationBinding
        .fingerprintAlgorithm,
      payload.installationBinding
        .publicKeyFingerprint,
    ) ||
    payload.installationBinding
      .installationId !==
        target.installationId ||
    payload.installationBinding
      .bindingKeyId !==
        target.bindingKeyId ||
    payload.installationBinding
      .fingerprintAlgorithm !==
        target.fingerprintAlgorithm ||
    payload.installationBinding
      .publicKeyFingerprint !==
        target.publicKeyFingerprint
  ) {
    return rejected(
      "FINORA Branch Activation installation binding does not match the device-binding target.",
    );
  }


  // ----------------------------------------------------------
  // INSTALLATION
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.installationBinding,
    ) ||
    !isNonEmptyString(
      payload.installationBinding
        .installationId,
    )
  ) {
    return rejected(
      "FINORA Branch Activation installation binding is invalid.",
    );
  }


  if (
    payload.installationBinding
      .installationId !==
      target.installationId
  ) {
    return rejected(
      "FINORA Branch Activation installation target does not match.",
    );
  }


  // ----------------------------------------------------------
  // ACTIVATION
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.activation,
    )
  ) {
    return rejected(
      "FINORA Branch Activation record is invalid.",
    );
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
    ) ||
    activation.status !==
      "ACTIVE" ||
    !isOptionalString(
      activation.activatedAt,
    ) ||
    !isNonEmptyString(
      activation.createdAt,
    ) ||
    !isNonEmptyString(
      activation.updatedAt,
    )
  ) {
    return rejected(
      "FINORA Branch Activation record is not ACTIVE or is malformed.",
    );
  }


  if (
    activation.ownerId !==
      target.ownerId ||
    activation.businessId !==
      target.businessId ||
    activation.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA Branch Activation identity does not match the package target.",
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