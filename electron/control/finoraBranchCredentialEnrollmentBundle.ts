import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraSignedBranchControlPackage,
  FinoraSignedBranchScopeControlPackage,
} from "./finoraSignedControlPackageVerifier.js";

export const FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT =
  "FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE" as const;

export interface FinoraBranchCredentialEnrollmentBundleV1 {
  bundleFormat:
    typeof FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT;

  branchAccessPackage:
    FinoraSignedBranchControlPackage;

  branchPortabilityAuthorityPackage:
    FinoraSignedBranchScopeControlPackage;

  schemaVersion:
    1;
}

export interface FinoraBranchCredentialEnrollmentBundleAccepted {
  valid:
    true;

  bundle:
    FinoraBranchCredentialEnrollmentBundleV1;

  sourceAuthorizationId:
    string;
}

export interface FinoraBranchCredentialEnrollmentBundleRejected {
  valid:
    false;

  error:
    string;
}

export type FinoraBranchCredentialEnrollmentBundleValidationResult =
  | FinoraBranchCredentialEnrollmentBundleAccepted
  | FinoraBranchCredentialEnrollmentBundleRejected;

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

function hasExactKeys(
  value:
    Record<string, unknown>,

  expected:
    readonly string[],
): boolean {

  const actual =
    Object.keys(
      value,
    ).sort();

  const canonicalExpected =
    [
      ...expected,
    ].sort();

  return (
    actual.length ===
      canonicalExpected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
        canonicalExpected[index],
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
    (
      key,
    ) =>
      allowedSet.has(
        key,
      ),
  );
}

function hasText(
  value:
    unknown,

  maxLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0 &&
    value.length <=
      maxLength
  );
}

function isRole(
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

function isStorageMode(
  value:
    unknown,
): value is
  | "LOCAL"
  | "USB" {

  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function isDataContext(
  value:
    unknown,
): value is
  | "REAL"
  | "DEMO" {

  return (
    value ===
      "REAL" ||
    value ===
      "DEMO"
  );
}

function rejected(
  error:
    string,
):
  FinoraBranchCredentialEnrollmentBundleRejected {

  return {
    valid:
      false,

    error,
  };
}

interface FinoraStructurallySignedPackageShell {
  packageId:
    string;

  purpose:
    string;

  issuer: {
    type:
      "FINORA_CONTROL_CENTER";

    issuerId:
      string;

    signingKeyId:
      string;
  };

  target:
    Record<string, unknown>;

  sequence:
    number;

  payloadVersion:
    number;

  payload:
    Record<string, unknown>;

  payloadDigest:
    Record<string, unknown>;

  signature:
    Record<string, unknown>;

  schemaVersion:
    1;
}

function isSignedPackageShell(
  value:
    unknown,
): value is FinoraStructurallySignedPackageShell {

  if (!isRecord(value)) {
    return false;
  }

  return (
    hasText(
      value.packageId,
      256,
    ) &&
    hasText(
      value.purpose,
      128,
    ) &&
    isRecord(
      value.issuer,
    ) &&
    value.issuer.type ===
      "FINORA_CONTROL_CENTER" &&
    hasText(
      value.issuer.issuerId,
      256,
    ) &&
    hasText(
      value.issuer.signingKeyId,
      256,
    ) &&
    isRecord(
      value.target,
    ) &&
    Number.isSafeInteger(
      value.sequence,
    ) &&
    (
      value.sequence as
        number
    ) >
      0 &&
    Number.isSafeInteger(
      value.payloadVersion,
    ) &&
    (
      value.payloadVersion as
        number
    ) >
      0 &&
    isRecord(
      value.payload,
    ) &&
    isRecord(
      value.payloadDigest,
    ) &&
    isRecord(
      value.signature,
    ) &&
    value.schemaVersion ===
      1
  );
}

function isInstallationBoundTarget(
  value:
    unknown,
): value is Record<string, unknown> {

  if (!isRecord(value)) {
    return false;
  }

  return (
    hasExactKeys(
      value,
      [
        "ownerId",
        "businessId",
        "branchId",
        "installationId",
        "bindingKeyId",
        "fingerprintAlgorithm",
        "publicKeyFingerprint",
      ],
    ) &&
    hasText(
      value.ownerId,
      256,
    ) &&
    hasText(
      value.businessId,
      256,
    ) &&
    hasText(
      value.branchId,
      256,
    ) &&
    hasText(
      value.installationId,
      256,
    ) &&
    hasText(
      value.bindingKeyId,
      256,
    ) &&
    value.fingerprintAlgorithm ===
      "SHA-256" &&
    typeof value.publicKeyFingerprint ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value.publicKeyFingerprint,
    )
  );
}

function isBranchOnlyTarget(
  value:
    unknown,
): value is Record<string, unknown> {

  if (!isRecord(value)) {
    return false;
  }

  return (
    hasExactKeys(
      value,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    ) &&
    hasText(
      value.ownerId,
      256,
    ) &&
    hasText(
      value.businessId,
      256,
    ) &&
    hasText(
      value.branchId,
      256,
    )
  );
}

function isCredentialEnrollment(
  value:
    unknown,
): value is Record<string, unknown> {

  if (!isRecord(value)) {
    return false;
  }

  if (
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
    !isRole(
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
    !isDataContext(
      value.dataContext,
    ) ||
    value.method !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    value.oneTime !==
      true ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  if (
    value.dataContext ===
      "REAL"
  ) {
    return (
      value.demoId ===
        undefined
    );
  }

  return hasText(
    value.demoId,
    256,
  );
}

function isPortabilityPayload(
  value:
    unknown,
): value is Record<string, unknown> {

  if (!isRecord(value)) {
    return false;
  }

  if (
    !hasOnlyKeys(
      value,
      [
        "sourceAuthorizationId",
        "userId",
        "username",
        "role",
        "ownerId",
        "businessId",
        "branchId",
        "storageMode",
        "dataContext",
        "demoId",
        "sourceAuthorizationMethod",
        "schemaVersion",
      ],
    ) ||
    !hasText(
      value.sourceAuthorizationId,
      256,
    ) ||
    !value.sourceAuthorizationId.startsWith(
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
    !isRole(
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
    !isDataContext(
      value.dataContext,
    ) ||
    value.sourceAuthorizationMethod !==
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD ||
    value.schemaVersion !==
      1
  ) {
    return false;
  }

  if (
    value.dataContext ===
      "REAL"
  ) {
    return (
      value.demoId ===
        undefined
    );
  }

  return hasText(
    value.demoId,
    256,
  );
}

export function validateFinoraBranchCredentialEnrollmentBundle(
  value:
    unknown,
):
  FinoraBranchCredentialEnrollmentBundleValidationResult {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
      [
        "bundleFormat",
        "branchAccessPackage",
        "branchPortabilityAuthorityPackage",
        "schemaVersion",
      ],
    ) ||
    value.bundleFormat !==
      FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_FORMAT ||
    value.schemaVersion !==
      1
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle wrapper is invalid.",
    );
  }

  const branchAccessPackage =
    value.branchAccessPackage;

  const portabilityPackage =
    value.branchPortabilityAuthorityPackage;

  if (
    !isSignedPackageShell(
      branchAccessPackage,
    ) ||
    !isSignedPackageShell(
      portabilityPackage,
    )
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle must contain exactly two structurally signed child packages.",
    );
  }

  if (
    branchAccessPackage.packageId ===
      portabilityPackage.packageId
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle child package IDs must be distinct.",
    );
  }

  if (
    branchAccessPackage.purpose !==
      "BRANCH_ACCESS" ||
    portabilityPackage.purpose !==
      "BRANCH_PORTABILITY_AUTHORITY"
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle child purposes are invalid.",
    );
  }

  if (
    branchAccessPackage.payloadVersion !==
      1 ||
    portabilityPackage.payloadVersion !==
      1
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle child payload versions are unsupported.",
    );
  }

  if (
    !isInstallationBoundTarget(
      branchAccessPackage.target,
    ) ||
    !isBranchOnlyTarget(
      portabilityPackage.target,
    )
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle child target contracts are invalid.",
    );
  }

  if (
    branchAccessPackage.target.ownerId !==
      portabilityPackage.target.ownerId ||
    branchAccessPackage.target.businessId !==
      portabilityPackage.target.businessId ||
    branchAccessPackage.target.branchId !==
      portabilityPackage.target.branchId
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle child branch scopes do not match.",
    );
  }

  if (
    branchAccessPackage.issuer.issuerId !==
      portabilityPackage.issuer.issuerId
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle children do not share the same Control Center issuer identity.",
    );
  }

  const branchAccessPayload =
    branchAccessPackage.payload;

  const credentialEnrollment =
    branchAccessPayload.credentialEnrollment;

  if (
    branchAccessPayload.action !==
      "AUTHORIZE_CREDENTIAL" ||
    branchAccessPayload.accessGrant !==
      undefined ||
    !isCredentialEnrollment(
      credentialEnrollment,
    )
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle BRANCH_ACCESS child must be AUTHORIZE_CREDENTIAL.",
    );
  }

  if (
    !isPortabilityPayload(
      portabilityPackage.payload,
    )
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle portability payload is invalid.",
    );
  }

  const portabilityPayload =
    portabilityPackage.payload;

  if (
    credentialEnrollment.authorizationId !==
      portabilityPayload.sourceAuthorizationId
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle authorization lineage does not match.",
    );
  }

  if (
    credentialEnrollment.userId !==
      portabilityPayload.userId ||
    credentialEnrollment.username !==
      portabilityPayload.username ||
    credentialEnrollment.role !==
      portabilityPayload.role ||
    credentialEnrollment.ownerId !==
      portabilityPayload.ownerId ||
    credentialEnrollment.businessId !==
      portabilityPayload.businessId ||
    credentialEnrollment.branchId !==
      portabilityPayload.branchId ||
    credentialEnrollment.storageMode !==
      portabilityPayload.storageMode ||
    credentialEnrollment.dataContext !==
      portabilityPayload.dataContext ||
    credentialEnrollment.method !==
      portabilityPayload.sourceAuthorizationMethod ||
    credentialEnrollment.demoId !==
      portabilityPayload.demoId
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle credential lineage fields do not match.",
    );
  }

  if (
    credentialEnrollment.ownerId !==
      branchAccessPackage.target.ownerId ||
    credentialEnrollment.businessId !==
      branchAccessPackage.target.businessId ||
    credentialEnrollment.branchId !==
      branchAccessPackage.target.branchId
  ) {
    return rejected(
      "FINORA Branch Credential Enrollment Bundle credential authorization does not match its signed branch target.",
    );
  }

  const bundle =
    value as unknown as
      FinoraBranchCredentialEnrollmentBundleV1;

  return {
    valid:
      true,

    bundle,

    sourceAuthorizationId:
      credentialEnrollment.authorizationId as
        string,
  };
}