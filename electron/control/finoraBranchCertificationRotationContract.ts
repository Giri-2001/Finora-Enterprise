import {
  assertFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationPublicKeyV1,
} from "./finoraBranchCertificationContract.js";

// ============================================================
// BRANCH CERTIFICATION ROTATION CONTRACT
//
// SECURITY MODEL:
//
// - Recovery never reconstructs a lost private key.
// - The replacement private key is generated and retained only
//   on the authenticated owner installation.
// - Control Center signs only public rotation authority.
// - Rotation is bound to:
//   - immutable branch scope,
//   - exact requesting native installation,
//   - exact current Portable Auth state/generation/fingerprint,
//   - exact previous Branch Certification public authority,
//   - exact replacement Branch Certification public authority.
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE =
  "BRANCH_CERTIFICATION_ROTATION" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION =
  1 as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX =
  "FIN-BCR-REQ-" as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON =
  "LEGACY_CERTIFICATION_PRIVATE_KEY_UNAVAILABLE" as const;

export interface FinoraBranchCertificationRotationPayloadV1 {

  payloadVersion:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION;

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

  legacyCertificationAdoption?:
    true;

  previousCertificationPublicKey?:
    FinoraBranchCertificationPublicKeyV1;

  replacementCertificationPublicKey:
    FinoraBranchCertificationPublicKeyV1;

  recoveryReason:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON;

  requestedAt:
    string;

  approvedAt:
    string;
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

function hasExactKeys(
  value:
    Record<string, unknown>,
): boolean {

  const common = [
    "payloadVersion",
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
    "approvedAt",
  ];

  const expected =
    (
      value.legacyCertificationAdoption ===
        true
        ? [
            ...common,
            "legacyCertificationAdoption",
          ]
        : [
            ...common,
            "previousCertificationPublicKey",
          ]
    ).sort();

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

export function assertFinoraBranchCertificationRotationPayload(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationPayloadV1 {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation payload structure is invalid.",
    );
  }

  if (
    value.payloadVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation payload version is unsupported.",
    );
  }

  const legacyCertificationAdoption =
    value.legacyCertificationAdoption ===
      true;

  if (
    legacyCertificationAdoption
      ? value.previousCertificationPublicKey !==
          undefined
      : value.previousCertificationPublicKey ===
          undefined
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation legacy-adoption payload structure is invalid.",
    );
  }

  if (
    !hasText(
      value.requestId,
    ) ||
    !value.requestId.startsWith(
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation requestId is invalid.",
    );
  }

  if (
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
    throw new Error(
      "FINORA Branch Certification Rotation branch scope is invalid.",
    );
  }

  if (
    !hasText(
      value.requestingInstallationId,
    ) ||
    !hasText(
      value.requestingBindingKeyId,
    ) ||
    value.requestingFingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      value.requestingPublicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation requesting installation identity is invalid.",
    );
  }

  const expectedRequestingBindingKeyId =
    `FINORA-BINDING-${value.requestingPublicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    value.requestingBindingKeyId !==
      expectedRequestingBindingKeyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation requesting bindingKeyId does not match its fingerprint.",
    );
  }

  if (
    !hasText(
      value.authStateId,
    ) ||
    !Number.isSafeInteger(
      value.authGeneration,
    ) ||
    (
      value.authGeneration as
        number
    ) <=
      0 ||
    value.portableAuthFingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      value.portableAuthFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation Portable Auth authority binding is invalid.",
    );
  }

  try {
    if (
      !legacyCertificationAdoption
    ) {
      assertFinoraBranchCertificationPublicKey(
        value.previousCertificationPublicKey as
          FinoraBranchCertificationPublicKeyV1,
      );
    }

    assertFinoraBranchCertificationPublicKey(
      value.replacementCertificationPublicKey as
        FinoraBranchCertificationPublicKeyV1,
    );
  }
  catch (
    error
  ) {
    throw new Error(
      error instanceof Error
        ? `FINORA Branch Certification Rotation certification authority is invalid: ${error.message}`
        : "FINORA Branch Certification Rotation certification authority is invalid.",
    );
  }

  if (
    !legacyCertificationAdoption
  ) {
    const previousCertificationPublicKey =
      value.previousCertificationPublicKey as
        FinoraBranchCertificationPublicKeyV1;

    const replacementCertificationPublicKey =
      value.replacementCertificationPublicKey as
        FinoraBranchCertificationPublicKeyV1;

    if (
      previousCertificationPublicKey.keyId ===
        replacementCertificationPublicKey.keyId ||
      previousCertificationPublicKey.publicKeyFingerprint ===
        replacementCertificationPublicKey.publicKeyFingerprint ||
      previousCertificationPublicKey.publicKey ===
        replacementCertificationPublicKey.publicKey
    ) {
      throw new Error(
        "FINORA Branch Certification Rotation replacement authority must differ from the previous authority.",
      );
    }
  }
  if (
    value.recoveryReason !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation recovery reason is invalid.",
    );
  }

  if (
    !isCanonicalTimestamp(
      value.requestedAt,
    ) ||
    !isCanonicalTimestamp(
      value.approvedAt,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation timestamps are invalid.",
    );
  }

  if (
    Date.parse(
      value.approvedAt,
    ) <
      Date.parse(
        value.requestedAt,
      )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation approval precedes the request.",
    );
  }
}