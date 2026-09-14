/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   BRANCH ACCESS ISSUANCE POLICY

   RESPONSIBILITY:

   - Validate one BRANCH_ACCESS payload before signing
   - Require exact Owner / Business / Branch target equality
   - Require exact native installation binding
   - Validate REGISTERED / DEMO Branch Access lifecycle
   - Validate optional one-time credential enrollment identity
   - Reject credential enrollment on non-ACTIVE access
   - Reject REAL / DEMO context mismatches

   SECURITY:

   - MAIN PROCESS / CONTROL CENTER ONLY.
   - No signing occurs here.
   - No recipient persistence.
   - No credential secret is accepted.
   - No Business Date authority.
=========================================================== */

import type {
  FinoraBranchAccessGrantPayload,
  FinoraBranchAccessPackageTarget,
  FinoraBranchAccessPayloadV1,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "../control/finoraBranchAccessPackage.types.js";

// ============================================================
// RESULT
// ============================================================

export interface FinoraBranchAccessIssuanceAccepted {

  valid:
    true;

  payload:
    FinoraBranchAccessPayloadV1;
}

export interface FinoraBranchAccessIssuanceRejected {

  valid:
    false;

  error:
    string;
}

export type FinoraBranchAccessIssuancePolicyResult =
  | FinoraBranchAccessIssuanceAccepted
  | FinoraBranchAccessIssuanceRejected;

// ============================================================
// HELPERS
// ============================================================

function accepted(
  payload:
    FinoraBranchAccessPayloadV1,
): FinoraBranchAccessIssuanceAccepted {

  return {
    valid:
      true,

    payload,
  };
}

function rejected(
  error:
    string,
): FinoraBranchAccessIssuanceRejected {

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

function hasOnlyKeys(
  value:
    Record<string, unknown>,

  allowed:
    readonly string[],
): boolean {

  const allowedSet =
    new Set(
      allowed,
    );

  return Object.keys(
    value,
  ).every(
    (key) =>
      allowedSet.has(
        key,
      ),
  );
}

function hasText(
  value:
    unknown,

  maximumLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0 &&
    value.length <=
      maximumLength
  );
}

function isOptionalText(
  value:
    unknown,

  maximumLength:
    number,
): boolean {

  return (
    value ===
      undefined ||
    hasText(
      value,
      maximumLength,
    )
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

  if (
    typeof value !==
      "string"
  ) {
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

  if (
    canonical !==
      value
  ) {
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
    !hasText(
      bindingKeyId,
      128,
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

function isAccessType(
  value:
    unknown,
): value is "REGISTERED" | "DEMO" {

  return (
    value ===
      "REGISTERED" ||
    value ===
      "DEMO"
  );
}

function isBranchAccessAction(
  value:
    unknown,
): value is
  | "ISSUE"
  | "RENEW"
  | "REPLACE"
  | "SUSPEND"
  | "RESUME"
  | "REVOKE"
  | "AUTHORIZE_CREDENTIAL" {

  return (
    value ===
      "ISSUE" ||
    value ===
      "RENEW" ||
    value ===
      "REPLACE" ||
    value ===
      "SUSPEND" ||
    value ===
      "RESUME" ||
    value ===
      "REVOKE" ||
    value ===
      "AUTHORIZE_CREDENTIAL"
  );
}

function isAdministrativeStatus(
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

function isUserRole(
  value:
    unknown,
): value is
  | "ADMIN"
  | "MANAGER"
  | "COLLECTOR"
  | "VIEWER" {

  return (
    value ===
      "ADMIN" ||
    value ===
      "MANAGER" ||
    value ===
      "COLLECTOR" ||
    value ===
      "VIEWER"
  );
}

// ============================================================
// ACCESS GRANT
// ============================================================

function validateAccessGrant(
  value:
    unknown,

  target:
    FinoraBranchAccessPackageTarget,

  payloadIssuedAtMs:
    number,
): FinoraBranchAccessGrantPayload | undefined {

  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "grantId",
        "userId",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
        "accessType",
        "administrativeStatus",
        "validity",
        "registrationPayment",
        "registrationCycle",
        "demoId",
        "demoRemarks",
        "createdAt",
        "updatedAt",
        "schemaVersion",
      ],
    )
  ) {
    return undefined;
  }

  if (
    value.schemaVersion !==
      1 ||
    !hasText(
      value.grantId,
      256,
    ) ||
    !hasText(
      value.userId,
      256,
    ) ||
    !hasText(
      value.ownerId,
      256,
    ) ||
    !hasText(
      value.businessId,
      256,
    ) ||
    !hasText(
      value.branchId,
      256,
    ) ||
    !isStorageMode(
      value.storageMode,
    ) ||
    !isAccessType(
      value.accessType,
    ) ||
    !isAdministrativeStatus(
      value.administrativeStatus,
    ) ||
    !isOptionalText(
      value.demoRemarks,
      1024,
    )
  ) {
    return undefined;
  }

  if (
    value.ownerId !==
      target.ownerId ||
    value.businessId !==
      target.businessId ||
    value.branchId !==
      target.branchId
  ) {
    return undefined;
  }

  if (
    !isRecord(
      value.validity,
    ) ||
    !hasOnlyKeys(
      value.validity,
      [
        "validFrom",
        "validUntil",
      ],
    )
  ) {
    return undefined;
  }

  const validFrom =
    parseCanonicalTimestamp(
      value.validity.validFrom,
    );

  const validUntil =
    parseCanonicalTimestamp(
      value.validity.validUntil,
    );

  const createdAt =
    parseCanonicalTimestamp(
      value.createdAt,
    );

  const updatedAt =
    parseCanonicalTimestamp(
      value.updatedAt,
    );

  if (
    !validFrom ||
    !validUntil ||
    !createdAt ||
    !updatedAt ||
    validUntil.milliseconds <=
      validFrom.milliseconds ||
    createdAt.milliseconds >
      updatedAt.milliseconds ||
    updatedAt.milliseconds >
      payloadIssuedAtMs
  ) {
    return undefined;
  }

  // ----------------------------------------------------------
  // REGISTERED
  // ----------------------------------------------------------

  if (
    value.accessType ===
      "REGISTERED"
  ) {

    const registrationDurationMs =
      365 * 24 * 60 * 60 * 1000;

    if (
      validUntil.milliseconds -
        validFrom.milliseconds !==
          registrationDurationMs ||
      !Number.isSafeInteger(
        value.registrationCycle,
      ) ||
      (
        value.registrationCycle as number
      ) <=
        0 ||
      !isRecord(
        value.registrationPayment,
      ) ||
      value.demoId !==
        undefined
    ) {
      return undefined;
    }

    const payment =
      value.registrationPayment;

    if (
      !hasOnlyKeys(
        payment,
        [
          "amount",
          "currency",
          "paymentMode",
          "paidAt",
          "reference",
          "remarks",
          "refundable",
        ],
      ) ||
      payment.amount !==
        2000 ||
      payment.currency !==
        "INR" ||
      (
        payment.paymentMode !==
          "CASH" &&
        payment.paymentMode !==
          "UPI" &&
        payment.paymentMode !==
          "BANK_TRANSFER" &&
        payment.paymentMode !==
          "OTHER"
      ) ||
      !isOptionalText(
        payment.reference,
        256,
      ) ||
      !isOptionalText(
        payment.remarks,
        1024,
      ) ||
      payment.refundable !==
        false
    ) {
      return undefined;
    }

    const paidAt =
      parseCanonicalTimestamp(
        payment.paidAt,
      );

    if (
      !paidAt ||
      paidAt.milliseconds >
        payloadIssuedAtMs
    ) {
      return undefined;
    }

  } else {

    // --------------------------------------------------------
    // DEMO
    // --------------------------------------------------------

    if (
      !hasText(
        value.demoId,
        256,
      ) ||
      value.registrationPayment !==
        undefined ||
      value.registrationCycle !==
        undefined
    ) {
      return undefined;
    }
  }

  return value as unknown as
    FinoraBranchAccessGrantPayload;
}

// ============================================================
// CREDENTIAL ENROLLMENT
// ============================================================

function validateCredentialEnrollment(
  value:
    unknown,

  accessGrant:
    FinoraBranchAccessGrantPayload,
): FinoraBranchCredentialEnrollmentAuthorization | undefined {

  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "authorizationId",
        "userId",
        "username",
        "fullName",
        "role",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
        "dataContext",
        "demoId",
        "method",
        "oneTime",
        "schemaVersion",
      ],
    )
  ) {
    return undefined;
  }

  if (
    accessGrant.administrativeStatus !==
      "ACTIVE" ||
    !hasText(
      value.authorizationId,
      256,
    ) ||
    !value.authorizationId.startsWith(
      "FINORA-CREDENTIAL-ENROLLMENT-",
    ) ||
    !hasText(
      value.userId,
      256,
    ) ||
    !hasText(
      value.username,
      128,
    ) ||
    !hasText(
      value.fullName,
      256,
    ) ||
    !isUserRole(
      value.role,
    ) ||
    !hasText(
      value.ownerId,
      256,
    ) ||
    !hasText(
      value.businessId,
      256,
    ) ||
    !hasText(
      value.branchId,
      256,
    ) ||
    !isStorageMode(
      value.storageMode,
    ) ||
    (
      value.dataContext !==
        "REAL" &&
      value.dataContext !==
        "DEMO"
    ) ||
    value.method !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    value.oneTime !==
      true ||
    value.schemaVersion !==
      1
  ) {
    return undefined;
  }

  if (
    value.userId !==
      accessGrant.userId ||
    value.ownerId !==
      accessGrant.ownerId ||
    value.businessId !==
      accessGrant.businessId ||
    value.branchId !==
      accessGrant.branchId ||
    value.storageMode !==
      accessGrant.storageMode
  ) {
    return undefined;
  }

  if (
    accessGrant.accessType ===
      "REGISTERED"
  ) {

    if (
      value.dataContext !==
        "REAL" ||
      value.demoId !==
        undefined
    ) {
      return undefined;
    }

  } else {

    if (
      value.dataContext !==
        "DEMO" ||
      value.demoId !==
        accessGrant.demoId
    ) {
      return undefined;
    }
  }

  return value as unknown as
    FinoraBranchCredentialEnrollmentAuthorization;
}

function validateCredentialAuthorizationForTarget(
  value:
    unknown,

  target:
    FinoraBranchAccessPackageTarget,
): FinoraBranchCredentialEnrollmentAuthorization | undefined {

  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "authorizationId",
        "userId",
        "username",
        "fullName",
        "role",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
        "dataContext",
        "demoId",
        "method",
        "oneTime",
        "schemaVersion",
      ],
    ) ||
    !hasText(
      value.authorizationId,
      256,
    ) ||
    !value.authorizationId.startsWith(
      "FINORA-CREDENTIAL-ENROLLMENT-",
    ) ||
    !hasText(
      value.userId,
      256,
    ) ||
    !hasText(
      value.username,
      128,
    ) ||
    !hasText(
      value.fullName,
      256,
    ) ||
    !isUserRole(
      value.role,
    ) ||
    value.ownerId !==
      target.ownerId ||
    value.businessId !==
      target.businessId ||
    value.branchId !==
      target.branchId ||
    !isStorageMode(
      value.storageMode,
    ) ||
    (
      value.dataContext !==
        "REAL" &&
      value.dataContext !==
        "DEMO"
    ) ||
    value.method !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    value.oneTime !==
      true ||
    value.schemaVersion !==
      1
  ) {
    return undefined;
  }

  if (
    value.dataContext ===
      "REAL"
  ) {
    if (
      value.demoId !==
        undefined
    ) {
      return undefined;
    }
  }
  else if (
    !hasText(
      value.demoId,
      256,
    )
  ) {
    return undefined;
  }

  return value as unknown as
    FinoraBranchCredentialEnrollmentAuthorization;
}

// ============================================================
// VALIDATE
// ============================================================

export function validateFinoraBranchAccessIssuance(
  payload:
    unknown,

  target:
    FinoraBranchAccessPackageTarget,
): FinoraBranchAccessIssuancePolicyResult {

  // ----------------------------------------------------------
  // TARGET
  // ----------------------------------------------------------

  if (
    !hasText(
      target.ownerId,
      256,
    ) ||
    !hasText(
      target.businessId,
      256,
    ) ||
    !hasText(
      target.branchId,
      256,
    ) ||
    !hasText(
      target.installationId,
      256,
    ) ||
    !isInstallationBindingIdentityValid(
      target.bindingKeyId,
      target.fingerprintAlgorithm,
      target.publicKeyFingerprint,
    )
  ) {
    return rejected(
      "FINORA Branch Access issuance target is invalid.",
    );
  }

  // ----------------------------------------------------------
  // ROOT
  // ----------------------------------------------------------

  if (
    !isRecord(
      payload,
    ) ||
    !hasOnlyKeys(
      payload,
      [
        "action",
        "accessGrant",
        "credentialEnrollment",
        "issuedAt",
        "schemaVersion",
      ],
    ) ||
    payload.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA Branch Access payload structure is invalid.",
    );
  }

  const issuedAt =
    parseCanonicalTimestamp(
      payload.issuedAt,
    );

  if (!issuedAt) {
    return rejected(
      "FINORA Branch Access payload issuedAt must be a canonical ISO timestamp.",
    );
  }

  if (
    !isBranchAccessAction(
      payload.action,
    )
  ) {
    return rejected(
      "FINORA Branch Access action is invalid.",
    );
  }

  const action =
    payload.action;

  if (
    action ===
      "AUTHORIZE_CREDENTIAL"
  ) {
    if (
      payload.accessGrant !==
        undefined ||
      payload.credentialEnrollment ===
        undefined
    ) {
      return rejected(
        "FINORA AUTHORIZE_CREDENTIAL requires credential enrollment authority and no Access Grant snapshot.",
      );
    }

    const credentialEnrollment =
      validateCredentialAuthorizationForTarget(
        payload.credentialEnrollment,
        target,
      );

    if (!credentialEnrollment) {
      return rejected(
        "FINORA AUTHORIZE_CREDENTIAL credential authorization is invalid.",
      );
    }

    return accepted({
      action,

      credentialEnrollment,

      issuedAt:
        issuedAt.canonical,

      schemaVersion:
        1,
    });
  }

  const accessGrant =
    validateAccessGrant(
      payload.accessGrant,
      target,
      issuedAt.milliseconds,
    );

  if (!accessGrant) {
    return rejected(
      "FINORA Branch Access Grant payload is invalid.",
    );
  }

  if (
    (
      action ===
        "ISSUE" &&
      accessGrant.administrativeStatus !==
        "ACTIVE"
    ) ||
    (
      action ===
        "SUSPEND" &&
      accessGrant.administrativeStatus !==
        "SUSPENDED"
    ) ||
    (
      action ===
        "RESUME" &&
      accessGrant.administrativeStatus !==
        "ACTIVE"
    ) ||
    (
      action ===
        "REVOKE" &&
      accessGrant.administrativeStatus !==
        "REVOKED"
    )
  ) {
    return rejected(
      "FINORA Branch Access action does not match the target administrative status.",
    );
  }

  if (
    action ===
      "RENEW" &&
    accessGrant.accessType !==
      "REGISTERED"
  ) {
    return rejected(
      "FINORA Branch Access RENEW is valid only for REGISTERED access.",
    );
  }

  let credentialEnrollment:
    FinoraBranchCredentialEnrollmentAuthorization |
    undefined;

  if (
    payload.credentialEnrollment !==
      undefined
  ) {

    if (
      action !==
        "ISSUE"
    ) {
      return rejected(
        "FINORA credential enrollment authorization is permitted only with signed ISSUE or AUTHORIZE_CREDENTIAL actions.",
      );
    }

    credentialEnrollment =
      validateCredentialEnrollment(
        payload.credentialEnrollment,
        accessGrant,
      );

    if (!credentialEnrollment) {
      return rejected(
        "FINORA Branch Access credential-enrollment authorization is invalid.",
      );
    }
  }

  return accepted({
    action,

    accessGrant,

    ...(
      credentialEnrollment ===
        undefined
        ? {}
        : {
            credentialEnrollment,
          }
    ),

    issuedAt:
      issuedAt.canonical,

    schemaVersion:
      1,
  });
}

// ============================================================
// END
// ============================================================