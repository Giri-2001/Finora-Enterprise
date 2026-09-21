import {
  assertFinoraBranchCertificationPublicKey,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationPublicKeyV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
  FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
} from "./finoraBranchCertificationRotationContract.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

// ============================================================
// FINORA ENTERPRISE OS
// BRANCH CERTIFICATION ROTATION PUBLIC REQUEST
//
// SECURITY:
// - This request contains only PUBLIC authority material.
// - Replacement private key material remains exclusively inside
//   the encrypted pending-custody store.
// - Legacy owner installations may not retain the old full
//   Branch Certification public key.
// - previousCertificationKeyId is therefore optional local
//   evidence only.
// - Control Center Registry remains authoritative for the full
//   previous Branch Certification public key.
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FORMAT =
  "FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_V1" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_SCHEMA_VERSION =
  1 as const;

export interface FinoraBranchCertificationRotationPublicRequestV1 {

  requestId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  requestingInstallationId:
    string;

  requestingBindingKeyId:
    string;

  requestingFingerprintAlgorithm:
    "SHA-256";

  requestingPublicKeyFingerprint:
    string;

  authStateId:
    string;

  authGeneration:
    number;

  portableAuthFingerprintAlgorithm:
    "SHA-256";

  portableAuthFingerprint:
    string;

  previousCertificationKeyId?:
    string;

  replacementCertificationPublicKey:
    FinoraBranchCertificationPublicKeyV1;

  recoveryReason:
    FinoraBranchCertificationRotationPendingRecordV1[
      "recoveryReason"
    ];

  requestedAt:
    string;
}

export interface FinoraBranchCertificationRotationRequestFileV1 {

  format:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FORMAT;

  request:
    FinoraBranchCertificationRotationPublicRequestV1;

  schemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_SCHEMA_VERSION;
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

function hasText(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value.length <=
      512 &&
    value.trim() ===
      value
  );
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

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function hasExactRequestKeys(
  value:
    Record<string, unknown>,
): boolean {

  const expected = [
    "requestId",
    "ownerId",
    "businessId",
    "branchId",
    "requestingInstallationId",
    "requestingBindingKeyId",
    "requestingFingerprintAlgorithm",
    "requestingPublicKeyFingerprint",
    "authStateId",
    "authGeneration",
    "portableAuthFingerprintAlgorithm",
    "portableAuthFingerprint",
    "replacementCertificationPublicKey",
    "recoveryReason",
    "requestedAt",
  ];

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "previousCertificationKeyId",
    )
  ) {
    expected.push(
      "previousCertificationKeyId",
    );
  }

  expected.sort();

  const actual =
    Object.keys(
      value,
    ).sort();

  return (
    actual.length ===
      expected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          expected[index],
    )
  );
}

export function assertFinoraBranchCertificationRotationRequestFile(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationRequestFileV1 {

  if (
    !isRecord(
      value,
    ) ||
    Object.keys(
      value,
    ).sort().join(
      "|",
    ) !==
      [
        "format",
        "request",
        "schemaVersion",
      ].sort().join(
        "|",
      ) ||
    value.format !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FORMAT ||
    value.schemaVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_SCHEMA_VERSION ||
    !isRecord(
      value.request,
    ) ||
    !hasExactRequestKeys(
      value.request,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request file structure is invalid.",
    );
  }

  const request =
    value.request;

  if (
    !hasText(
      request.requestId,
    ) ||
    !request.requestId.startsWith(
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation requestId is invalid.",
    );
  }

  if (
    !hasText(
      request.ownerId,
    ) ||
    !hasText(
      request.businessId,
    ) ||
    !hasText(
      request.branchId,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request branch scope is invalid.",
    );
  }

  if (
    !hasText(
      request.requestingInstallationId,
    ) ||
    !hasText(
      request.requestingBindingKeyId,
    ) ||
    request.requestingFingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      request.requestingPublicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request installation identity is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${request.requestingPublicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    request.requestingBindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request bindingKeyId does not match its fingerprint.",
    );
  }

  if (
    !hasText(
      request.authStateId,
    ) ||
    !Number.isSafeInteger(
      request.authGeneration,
    ) ||
    (
      request.authGeneration as
        number
    ) <=
      0 ||
    request.portableAuthFingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      request.portableAuthFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request Portable Auth binding is invalid.",
    );
  }

  if (
    request.previousCertificationKeyId !==
      undefined &&
    (
      typeof request.previousCertificationKeyId !==
        "string" ||
      !/^FINORA-BRANCH-CERT-[0-9A-F]{32}$/.test(
        request.previousCertificationKeyId,
      )
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation request previous certification keyId is invalid.",
    );
  }

  try {
    assertFinoraBranchCertificationPublicKey(
      request.replacementCertificationPublicKey as
        FinoraBranchCertificationPublicKeyV1,
    );
  }
  catch (
    error
  ) {
    throw new Error(
      error instanceof Error
        ? `FINORA Branch Certification Rotation replacement public authority is invalid: ${error.message}`
        : "FINORA Branch Certification Rotation replacement public authority is invalid.",
    );
  }

  const replacement =
    request.replacementCertificationPublicKey as
      FinoraBranchCertificationPublicKeyV1;

  if (
    request.previousCertificationKeyId !==
      undefined &&
    request.previousCertificationKeyId ===
      replacement.keyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation replacement authority must differ from the previous authority.",
    );
  }

  if (
    request.recoveryReason !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation recovery reason is invalid.",
    );
  }

  if (
    !isCanonicalTimestamp(
      request.requestedAt,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation requestedAt is invalid.",
    );
  }
}

export function createFinoraBranchCertificationRotationRequestFile(
  pending:
    FinoraBranchCertificationRotationPendingRecordV1,
): FinoraBranchCertificationRotationRequestFileV1 {

  const replacementCertificationPublicKey =
    toFinoraBranchCertificationPublicKey(
      pending.replacementCertificationKeyMaterial,
    );

  const file:
    FinoraBranchCertificationRotationRequestFileV1 = {

      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_FORMAT,

      request: {
        requestId:
          pending.requestId,

        ownerId:
          pending.ownerId,

        businessId:
          pending.businessId,

        branchId:
          pending.branchId,

        requestingInstallationId:
          pending.installationId,

        requestingBindingKeyId:
          pending.bindingKeyId,

        requestingFingerprintAlgorithm:
          pending.fingerprintAlgorithm,

        requestingPublicKeyFingerprint:
          pending.publicKeyFingerprint,

        authStateId:
          pending.authStateId,

        authGeneration:
          pending.authGeneration,

        portableAuthFingerprintAlgorithm:
          pending.portableAuthFingerprintAlgorithm,

        portableAuthFingerprint:
          pending.portableAuthFingerprint,

        ...(
          pending.previousCertificationKeyId ===
            undefined
            ? {}
            : {
                previousCertificationKeyId:
                  pending.previousCertificationKeyId,
              }
        ),

        replacementCertificationPublicKey: {
          ...replacementCertificationPublicKey,
        },

        recoveryReason:
          pending.recoveryReason,

        requestedAt:
          pending.requestedAt,
      },

      schemaVersion:
        FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_SCHEMA_VERSION,
    };

  assertFinoraBranchCertificationRotationRequestFile(
    file,
  );

  return file;
}