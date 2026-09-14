/* ===========================================================
   FINORA ENTERPRISE OS

   ELECTRON CONTROL
   VERIFIED BRANCH ACCESS PACKAGE APPLY SERVICE

   RESPONSIBILITY:

   - Resolve authoritative Control Store installation identity
   - Resolve authoritative native Windows installation binding
   - Verify Control Center signed package with native verifier
   - Require BRANCH_ACCESS purpose and payload version
   - Validate exact signed payload structure
   - Sanitize Branch Access Grant
   - Sanitize optional one-time credential enrollment authority
   - Enforce exact installation / binding / scope identity
   - Forward only verified state to the serialized atomic store

   SECURITY:

   - MAIN PROCESS ONLY.
   - PUBLIC verification only.
   - No private signing material.
   - No credential secret handling.
   - No direct Branch Access persistence bypass.
   - No renderer authority.
   - No IPC authority.
   - No Business Date.

   VERSION : 1.0
   STATUS  : Production Foundation
=========================================================== */

import {
  applyFinoraVerifiedBranchAccessState,
  applyFinoraVerifiedBranchCredentialAuthorizationState,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchAccessGrant,
  FinoraControlStoreResult,
  FinoraVerifiedBranchAccessApplyResult,
} from "./finoraControlStore.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
  FINORA_BRANCH_ACCESS_PAYLOAD_VERSION,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

import {
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

// ============================================================
// BASIC VALIDATION
// ============================================================

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isOptionalString(
  value: unknown,
): value is string | undefined {
  return (
    value === undefined ||
    typeof value === "string"
  );
}

function isTimestamp(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): boolean {
  const allowed =
    new Set<string>([
      ...requiredKeys,
      ...optionalKeys,
    ]);

  const keys =
    Object.keys(value);

  if (
    requiredKeys.some(
      (key) =>
        !Object.prototype.hasOwnProperty.call(
          value,
          key,
        ),
    )
  ) {
    return false;
  }

  return keys.every(
    (key) =>
      allowed.has(key),
  );
}

function failure(
  error: string,
): FinoraControlStoreResult<
  FinoraVerifiedBranchAccessApplyResult
> {
  return {
    success: false,
    error,
  };
}

// ============================================================
// REGISTRATION PAYMENT SANITIZER
// ============================================================

function sanitizeRegistrationPayment(
  value: unknown,
): FinoraControlBranchAccessGrant["registrationPayment"] |
  undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    !hasExactKeys(
      value,
      [
        "amount",
        "currency",
        "paymentMode",
        "paidAt",
        "refundable",
      ],
      [
        "reference",
        "remarks",
      ],
    ) ||
    value.amount !== 2000 ||
    value.currency !== "INR" ||
    (
      value.paymentMode !== "CASH" &&
      value.paymentMode !== "UPI" &&
      value.paymentMode !== "BANK_TRANSFER" &&
      value.paymentMode !== "OTHER"
    ) ||
    !isTimestamp(value.paidAt) ||
    !isOptionalString(value.reference) ||
    !isOptionalString(value.remarks) ||
    value.refundable !== false
  ) {
    return undefined;
  }

  return {
    amount: 2000,
    currency: "INR",
    paymentMode: value.paymentMode,
    paidAt: value.paidAt,

    ...(
      value.reference === undefined
        ? {}
        : {
            reference: value.reference,
          }
    ),

    ...(
      value.remarks === undefined
        ? {}
        : {
            remarks: value.remarks,
          }
    ),

    refundable: false,
  };
}

// ============================================================
// ACCESS GRANT SANITIZER
// ============================================================

function sanitizeBranchAccessGrant(
  value: unknown,
): FinoraControlBranchAccessGrant |
  undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(
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
        "createdAt",
        "updatedAt",
        "schemaVersion",
      ],
      [
        "registrationPayment",
        "registrationCycle",
        "demoId",
        "demoRemarks",
      ],
    ) ||
    !isNonEmptyString(value.grantId) ||
    !isNonEmptyString(value.userId) ||
    !isNonEmptyString(value.ownerId) ||
    !isNonEmptyString(value.businessId) ||
    !isNonEmptyString(value.branchId) ||
    (
      value.storageMode !== "LOCAL" &&
      value.storageMode !== "USB"
    ) ||
    (
      value.accessType !== "REGISTERED" &&
      value.accessType !== "DEMO"
    ) ||
    (
      value.administrativeStatus !== "ACTIVE" &&
      value.administrativeStatus !== "SUSPENDED" &&
      value.administrativeStatus !== "REVOKED"
    ) ||
    !isRecord(value.validity) ||
    !hasExactKeys(
      value.validity,
      [
        "validFrom",
        "validUntil",
      ],
    ) ||
    !isTimestamp(
      value.validity.validFrom,
    ) ||
    !isTimestamp(
      value.validity.validUntil,
    ) ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    !isOptionalString(value.demoRemarks) ||
    value.schemaVersion !== 1
  ) {
    return undefined;
  }

  const validFrom =
    Date.parse(
      value.validity.validFrom,
    );

  const validUntil =
    Date.parse(
      value.validity.validUntil,
    );

  if (
    validUntil <= validFrom
  ) {
    return undefined;
  }

  if (
    value.accessType === "REGISTERED"
  ) {
    const registrationDuration =
      365 * 24 * 60 * 60 * 1000;

    if (
      validUntil - validFrom !==
        registrationDuration ||
      !Number.isSafeInteger(
        value.registrationCycle,
      ) ||
      (
        value.registrationCycle as number
      ) <= 0 ||
      value.demoId !== undefined
    ) {
      return undefined;
    }

    const registrationPayment =
      sanitizeRegistrationPayment(
        value.registrationPayment,
      );

    if (!registrationPayment) {
      return undefined;
    }

    return {
      grantId: value.grantId,
      userId: value.userId,
      ownerId: value.ownerId,
      businessId: value.businessId,
      branchId: value.branchId,
      storageMode: value.storageMode,
      accessType: "REGISTERED",
      administrativeStatus:
        value.administrativeStatus,

      validity: {
        validFrom:
          value.validity.validFrom,

        validUntil:
          value.validity.validUntil,
      },

      registrationPayment,

      registrationCycle:
        value.registrationCycle as number,

      ...(
        value.demoRemarks === undefined
          ? {}
          : {
              demoRemarks:
                value.demoRemarks,
            }
      ),

      createdAt:
        value.createdAt,

      updatedAt:
        value.updatedAt,

      schemaVersion:
        1,
    };
  }

  if (
    !isNonEmptyString(value.demoId) ||
    value.registrationPayment !== undefined ||
    value.registrationCycle !== undefined
  ) {
    return undefined;
  }

  return {
    grantId: value.grantId,
    userId: value.userId,
    ownerId: value.ownerId,
    businessId: value.businessId,
    branchId: value.branchId,
    storageMode: value.storageMode,
    accessType: "DEMO",
    administrativeStatus:
      value.administrativeStatus,

    validity: {
      validFrom:
        value.validity.validFrom,

      validUntil:
        value.validity.validUntil,
    },

    demoId:
      value.demoId,

    ...(
      value.demoRemarks === undefined
        ? {}
        : {
            demoRemarks:
              value.demoRemarks,
          }
    ),

    createdAt:
      value.createdAt,

    updatedAt:
      value.updatedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// CREDENTIAL ENROLLMENT AUTHORIZATION SANITIZER
// ============================================================

function sanitizeCredentialEnrollmentAuthorization(
  value: unknown,
): FinoraBranchCredentialEnrollmentAuthorization |
  undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(
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
        "method",
        "oneTime",
        "schemaVersion",
      ],
      [
        "demoId",
      ],
    ) ||
    !isNonEmptyString(
      value.authorizationId,
    ) ||
    !isNonEmptyString(
      value.userId,
    ) ||
    !isNonEmptyString(
      value.username,
    ) ||
    !isNonEmptyString(
      value.fullName,
    ) ||
    (
      value.role !== "ADMIN" &&
      value.role !== "MANAGER" &&
      value.role !== "COLLECTOR" &&
      value.role !== "VIEWER"
    ) ||
    !isNonEmptyString(
      value.ownerId,
    ) ||
    !isNonEmptyString(
      value.businessId,
    ) ||
    !isNonEmptyString(
      value.branchId,
    ) ||
    (
      value.storageMode !== "LOCAL" &&
      value.storageMode !== "USB"
    ) ||
    (
      value.dataContext !== "REAL" &&
      value.dataContext !== "DEMO"
    ) ||
    value.method !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    value.oneTime !== true ||
    value.schemaVersion !== 1
  ) {
    return undefined;
  }

  let sanitizedDemoId:
    string |
    undefined;

  if (
    value.dataContext === "REAL"
  ) {
    if (
      value.demoId !== undefined
    ) {
      return undefined;
    }

    sanitizedDemoId =
      undefined;
  }
  else {
    if (
      !isNonEmptyString(
        value.demoId,
      )
    ) {
      return undefined;
    }

    sanitizedDemoId =
      value.demoId;
  }

  return {
    authorizationId:
      value.authorizationId,

    userId:
      value.userId,

    username:
      value.username,

    fullName:
      value.fullName,

    role:
      value.role,

    ownerId:
      value.ownerId,

    businessId:
      value.businessId,

    branchId:
      value.branchId,

    storageMode:
      value.storageMode,

    dataContext:
      value.dataContext,

    ...(
      sanitizedDemoId === undefined
        ? {}
        : {
            demoId:
              sanitizedDemoId,
          }
    ),

    method:
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

    oneTime:
      true,

    schemaVersion:
      1,
  };
}

// ============================================================
// APPLY
// ============================================================

export async function applyFinoraSignedBranchAccessPackage(
  signedPackage: unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now: Date,

  credentialPortabilityAuthorityProvenance?:
    FinoraBranchCredentialPortabilityAuthorityProvenanceV1,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBranchAccessApplyResult
  >
> {
  // ----------------------------------------------------------
  // AUTHORITATIVE CONTROL STORE INSTALLATION
  // ----------------------------------------------------------

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      storeResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const installation =
    storeResult.data.installation;

  if (!installation) {
    return failure(
      "FINORA installation identity is required before applying Branch Access.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE NATIVE INSTALLATION BINDING
  // ----------------------------------------------------------

  let nativeBinding;

  try {
    nativeBinding =
      await getFinoraWindowsInstallationBinding();
  }
  catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load the FINORA native installation binding.",
    );
  }

  if (!nativeBinding) {
    return failure(
      "FINORA native installation binding is required before applying Branch Access.",
    );
  }

  if (
    nativeBinding.installationId !==
      installation.installationId
  ) {
    return failure(
      "FINORA native installation binding does not match the Control Store installation identity.",
    );
  }

  // ----------------------------------------------------------
  // CRYPTOGRAPHIC VERIFICATION
  // ----------------------------------------------------------

  const verification =
    verifyFinoraSignedControlPackageNative(
      signedPackage,
      trustedKeys,
      {
        ownerId:
          installation.ownerId,

        businessId:
          installation.businessId,

        branchId:
          installation.branchId,

        installationId:
          installation.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      },
      now,
    );

  if (!verification.valid) {
    return failure(
      `${verification.reason}: ${verification.error}`,
    );
  }

  const controlPackage =
    verification.controlPackage;

  // ----------------------------------------------------------
  // PURPOSE / PAYLOAD VERSION
  // ----------------------------------------------------------

  if (
    controlPackage.purpose !==
      "BRANCH_ACCESS"
  ) {
    return failure(
      "FINORA Control Package purpose must be BRANCH_ACCESS.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      FINORA_BRANCH_ACCESS_PAYLOAD_VERSION
  ) {
    return failure(
      "FINORA BRANCH_ACCESS payload version is unsupported.",
    );
  }

  // ----------------------------------------------------------
  // DEFENSE-IN-DEPTH VERIFIED TARGET CHECK
  // ----------------------------------------------------------

  if (
    controlPackage.target.ownerId !==
      installation.ownerId ||
    controlPackage.target.businessId !==
      installation.businessId ||
    controlPackage.target.branchId !==
      installation.branchId ||
    controlPackage.target.installationId !==
      installation.installationId ||
    controlPackage.target.installationId !==
      nativeBinding.installationId ||
    controlPackage.target.bindingKeyId !==
      nativeBinding.bindingKeyId ||
    controlPackage.target.fingerprintAlgorithm !==
      "SHA-256" ||
    controlPackage.target.publicKeyFingerprint !==
      nativeBinding.publicKeyFingerprint
  ) {
    return failure(
      "FINORA BRANCH_ACCESS verified package target does not match this native installation.",
    );
  }

  // ----------------------------------------------------------
  // EXACT DOMAIN PAYLOAD
  // ----------------------------------------------------------

  const payload =
    controlPackage.payload;

  if (
    !isRecord(payload) ||
    !hasExactKeys(
      payload,
      [
        "action",
        "issuedAt",
        "schemaVersion",
      ],
      [
        "accessGrant",
        "credentialEnrollment",
      ],
    ) ||
    (
      payload.action !== "ISSUE" &&
      payload.action !== "RENEW" &&
      payload.action !== "REPLACE" &&
      payload.action !== "SUSPEND" &&
      payload.action !== "RESUME" &&
      payload.action !== "REVOKE" &&
      payload.action !== "AUTHORIZE_CREDENTIAL"
    ) ||
    payload.schemaVersion !== 1 ||
    !isTimestamp(
      payload.issuedAt,
    ) ||
    payload.issuedAt !==
      controlPackage.issuedAt
  ) {
    return failure(
      "FINORA BRANCH_ACCESS payload structure is invalid.",
    );
  }

  if (
    credentialPortabilityAuthorityProvenance !==
      undefined &&
    payload.action !==
      "AUTHORIZE_CREDENTIAL"
  ) {
    return failure(
      "FINORA credential portability authority provenance is valid only for AUTHORIZE_CREDENTIAL.",
    );
  }

  if (
    payload.action ===
      "AUTHORIZE_CREDENTIAL"
  ) {
    if (
      payload.accessGrant !==
        undefined ||
      payload.credentialEnrollment ===
        undefined
    ) {
      return failure(
        "FINORA AUTHORIZE_CREDENTIAL requires credential enrollment authority and no Access Grant snapshot.",
      );
    }

    const credentialAuthorization =
      sanitizeCredentialEnrollmentAuthorization(
        payload.credentialEnrollment,
      );

    if (
      !credentialAuthorization
    ) {
      return failure(
        "FINORA AUTHORIZE_CREDENTIAL credential authorization is invalid.",
      );
    }

    if (
      credentialAuthorization.ownerId !==
        installation.ownerId ||
      credentialAuthorization.businessId !==
        installation.businessId ||
      credentialAuthorization.branchId !==
        installation.branchId
    ) {
      return failure(
        "FINORA AUTHORIZE_CREDENTIAL scope does not match this installation.",
      );
    }

    return applyFinoraVerifiedBranchCredentialAuthorizationState({
      packageId:
        controlPackage.packageId,

      issuerId:
        controlPackage.issuer.issuerId,

      purpose:
        "BRANCH_ACCESS",

      action:
        "AUTHORIZE_CREDENTIAL",

      sequence:
        controlPackage.sequence,

      target: {
        ownerId:
          installation.ownerId,

        businessId:
          installation.businessId,

        branchId:
          installation.branchId,

        installationId:
          installation.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      },

      credentialEnrollmentAuthorization:
        credentialAuthorization,

      verifiedControlSigner: {
        ...verification.verifiedTrustedKey,
      },

      credentialPortabilityAuthorityProvenance,

      appliedAt:
        now.toISOString(),
    });
  }

  if (
    payload.accessGrant ===
      undefined
  ) {
    return failure(
      "FINORA BRANCH_ACCESS lifecycle package requires a signed Access Grant.",
    );
  }

  const accessGrant =
    sanitizeBranchAccessGrant(
      payload.accessGrant,
    );

  if (!accessGrant) {
    return failure(
      "FINORA BRANCH_ACCESS signed Access Grant is invalid.",
    );
  }

  // ----------------------------------------------------------
  // EXACT SIGNED SCOPE
  // ----------------------------------------------------------

  if (
    accessGrant.ownerId !==
      installation.ownerId ||
    accessGrant.businessId !==
      installation.businessId ||
    accessGrant.branchId !==
      installation.branchId
  ) {
    return failure(
      "FINORA BRANCH_ACCESS signed Access Grant scope does not match this installation.",
    );
  }

  // ----------------------------------------------------------
  // OPTIONAL ONE-TIME CREDENTIAL ENROLLMENT AUTHORIZATION
  // ----------------------------------------------------------

  let credentialEnrollmentAuthorization:
    FinoraBranchCredentialEnrollmentAuthorization |
    undefined;

  if (
    payload.credentialEnrollment !==
      undefined
  ) {
    if (
      payload.action !== "ISSUE"
    ) {
      return failure(
        "FINORA credential enrollment authorization is valid only for BRANCH_ACCESS ISSUE.",
      );
    }

    credentialEnrollmentAuthorization =
      sanitizeCredentialEnrollmentAuthorization(
        payload.credentialEnrollment,
      );

    if (
      !credentialEnrollmentAuthorization
    ) {
      return failure(
        "FINORA BRANCH_ACCESS credential enrollment authorization is invalid.",
      );
    }

    const expectedDataContext =
      accessGrant.accessType === "DEMO"
        ? "DEMO"
        : "REAL";

    if (
      credentialEnrollmentAuthorization.userId !==
        accessGrant.userId ||
      credentialEnrollmentAuthorization.ownerId !==
        accessGrant.ownerId ||
      credentialEnrollmentAuthorization.businessId !==
        accessGrant.businessId ||
      credentialEnrollmentAuthorization.branchId !==
        accessGrant.branchId ||
      credentialEnrollmentAuthorization.storageMode !==
        accessGrant.storageMode ||
      credentialEnrollmentAuthorization.dataContext !==
        expectedDataContext ||
      (
        accessGrant.accessType === "DEMO"
          ? credentialEnrollmentAuthorization.demoId !==
              accessGrant.demoId
          : credentialEnrollmentAuthorization.demoId !==
              undefined
      )
    ) {
      return failure(
        "FINORA BRANCH_ACCESS credential enrollment authorization does not match the signed Access Grant.",
      );
    }
  }

  // ----------------------------------------------------------
  // REPLAY-PROTECTED SERIALIZED ATOMIC STORE APPLY
  //
  // Replay, sequence and lifecycle transition authority remain
  // inside the protected Control Store apply boundary.
  // ----------------------------------------------------------

  return applyFinoraVerifiedBranchAccessState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    purpose:
      "BRANCH_ACCESS",

    action:
      payload.action,

    sequence:
      controlPackage.sequence,

    target: {
      ownerId:
        installation.ownerId,

      businessId:
        installation.businessId,

      branchId:
        installation.branchId,

      installationId:
        installation.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,
    },

    accessGrant,

    ...(
      credentialEnrollmentAuthorization ===
        undefined
        ? {}
        : {
            credentialEnrollmentAuthorization,

            verifiedControlSigner: {
              ...verification.verifiedTrustedKey,
            },
          }
    ),

    appliedAt:
      now.toISOString(),
  });
}

// ============================================================
// END
// ============================================================