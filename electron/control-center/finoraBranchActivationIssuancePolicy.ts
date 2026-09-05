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
      "ISSUE" &&
    payload.action !==
      "RENEW" &&
    payload.action !==
      "REPLACE"
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
      "ACTIVE"
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


  // ----------------------------------------------------------
  // ACCESS GRANT
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload.accessGrant,
    )
  ) {
    return rejected(
      "FINORA Branch Access grant is invalid.",
    );
  }


  const grant =
    payload.accessGrant;


  if (
    grant.schemaVersion !==
      1 ||
    !isNonEmptyString(
      grant.grantId,
    ) ||
    !isNonEmptyString(
      grant.userId,
    ) ||
    !isNonEmptyString(
      grant.ownerId,
    ) ||
    !isNonEmptyString(
      grant.businessId,
    ) ||
    !isNonEmptyString(
      grant.branchId,
    )
  ) {
    return rejected(
      "FINORA Branch Access grant identity is invalid.",
    );
  }


  if (
    grant.ownerId !==
      target.ownerId ||
    grant.businessId !==
      target.businessId ||
    grant.branchId !==
      target.branchId
  ) {
    return rejected(
      "FINORA Branch Access grant identity does not match the package target.",
    );
  }


  if (
    grant.administrativeStatus !==
      "ACTIVE" &&
    grant.administrativeStatus !==
      "SUSPENDED" &&
    grant.administrativeStatus !==
      "REVOKED"
  ) {
    return rejected(
      "FINORA Branch Access administrative status is invalid.",
    );
  }


  if (
    parseTimestamp(
      grant.createdAt,
    ) === undefined ||
    parseTimestamp(
      grant.updatedAt,
    ) === undefined
  ) {
    return rejected(
      "FINORA Branch Access audit timestamps are invalid.",
    );
  }


  // ----------------------------------------------------------
  // VALIDITY
  // ----------------------------------------------------------

  if (
    !isRecord(
      grant.validity,
    )
  ) {
    return rejected(
      "FINORA Branch Access validity is invalid.",
    );
  }


  const validFrom =
    parseTimestamp(
      grant.validity.validFrom,
    );

  const validUntil =
    parseTimestamp(
      grant.validity.validUntil,
    );


  if (
    validFrom === undefined ||
    validUntil === undefined ||
    validUntil <=
      validFrom
  ) {
    return rejected(
      "FINORA Branch Access validity window is invalid.",
    );
  }


  // ----------------------------------------------------------
  // REGISTERED
  // ----------------------------------------------------------

  if (
    grant.accessType ===
      "REGISTERED"
  ) {

    if (
      validUntil -
        validFrom !==
      REGISTERED_DURATION_MS
    ) {
      return rejected(
        "FINORA REGISTERED access must contain exactly 365 days of validity.",
      );
    }


    if (
      !isPositiveSafeInteger(
        grant.registrationCycle,
      )
    ) {
      return rejected(
        "FINORA registration cycle is invalid.",
      );
    }


    if (
      !isRecord(
        grant.registrationPayment,
      )
    ) {
      return rejected(
        "FINORA registration payment is missing.",
      );
    }


    const payment =
      grant.registrationPayment;


    if (
      payment.amount !==
        REGISTRATION_FEE ||
      payment.currency !==
        REGISTRATION_CURRENCY ||
      payment.refundable !==
        false ||
      parseTimestamp(
        payment.paidAt,
      ) === undefined
    ) {
      return rejected(
        "FINORA annual registration payment policy is invalid.",
      );
    }


    if (
      payload.action ===
        "RENEW" &&
      grant.registrationCycle <=
        1
    ) {
      return rejected(
        "FINORA renewal must use a registration cycle greater than 1.",
      );
    }
  }


  // ----------------------------------------------------------
  // DEMO
  // ----------------------------------------------------------

  else if (
    grant.accessType ===
      "DEMO"
  ) {

    if (
      !isNonEmptyString(
        grant.demoId,
      )
    ) {
      return rejected(
        "FINORA Demo ID is required.",
      );
    }


    if (
      payload.action ===
        "RENEW"
    ) {
      return rejected(
        "FINORA Demo access cannot use the RENEW action.",
      );
    }
  }


  // ----------------------------------------------------------
  // UNSUPPORTED ACCESS TYPE
  // ----------------------------------------------------------

  else {

    return rejected(
      "FINORA Branch Access type is unsupported.",
    );
  }


  // ----------------------------------------------------------
  // FINAL CROSS-IDENTITY CHECK
  // ----------------------------------------------------------

  if (
    activation.ownerId !==
      grant.ownerId ||
    activation.businessId !==
      grant.businessId ||
    activation.branchId !==
      grant.branchId
  ) {
    return rejected(
      "FINORA activation and access-grant identities do not match.",
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