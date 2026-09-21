import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION,
  FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE,
  assertFinoraBranchCertificationRotationPayload,
} from "./finoraBranchCertificationRotationContract.js";

import type {
  FinoraBranchCertificationPublicKeyV1,
} from "./finoraBranchCertificationContract.js";

import {
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

import {
  createFinoraPortableBranchAuthFingerprint,
} from "./finoraBranchDeviceTrustAuthority.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// TARGET
// ============================================================

export interface FinoraBranchCertificationRotationExpectedNativeTarget {
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
// INPUT / RESULT
// ============================================================

export interface FinoraBranchCertificationRotationAuthorityVerificationInput {
  signedPackage:
    unknown;

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[];

  expectedTarget:
    FinoraBranchCertificationRotationExpectedNativeTarget;

  pending:
    FinoraBranchCertificationRotationPendingRecordV1;

  currentPortableEnvelope:
    FinoraPortableBranchAuthEnvelopeV1;

  /**
   * Post-CAS crash-recovery only.
   *
   * The production coordinator may supply this only after
   * Password + Security Code decrypt the currently persisted
   * Portable Auth and independently prove that it already carries
   * the exact protected pending replacement certification key.
   *
   * The value itself must still equal the original protected
   * pending Portable Auth fingerprint signed by Control Center.
   */
  expectedPortableAuthFingerprintForRecovery?:
    string;

  now:
    Date;
}

export interface FinoraVerifiedBranchCertificationRotationAuthority {
  requestId:
    string;

  packageId:
    string;

  sequence:
    number;

  approvedAt:
    string;

  currentPortableAuthFingerprint:
    string;

  legacyCertificationAdoption?:
    true;

  previousCertificationPublicKey?:
    FinoraBranchCertificationPublicKeyV1;

  replacementCertificationPublicKey:
    FinoraBranchCertificationPublicKeyV1;

  verifiedTrustedKey:
    FinoraBranchTrustedControlPublicKey;

  schemaVersion:
    1;
}

export type FinoraBranchCertificationRotationAuthorityVerificationResult =
  | {
      success:
        true;

      data:
        FinoraVerifiedBranchCertificationRotationAuthority;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// INTERNAL PAYLOAD VIEW
//
// Runtime structure is first proven by
// assertFinoraBranchCertificationRotationPayload().
// ============================================================

interface RotationPayloadView {
  payloadVersion:
    number;

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
    string;

  requestedAt:
    string;

  approvedAt:
    string;
}

// ============================================================
// DEPENDENCIES
//
// Exported for deterministic executable proof.
// Production defaults always use canonical FINORA authorities.
// ============================================================

export interface FinoraBranchCertificationRotationAuthorityVerifierDependencies {
  verifySignedPackage:
    typeof verifyFinoraSignedControlPackageNative;

  assertRotationPayload:
    (
      value:
        unknown,
    ) => void;

  createPortableAuthFingerprint:
    typeof createFinoraPortableBranchAuthFingerprint;

  toCertificationPublicKey:
    typeof toFinoraBranchCertificationPublicKey;
}

const DEFAULT_DEPENDENCIES:
  FinoraBranchCertificationRotationAuthorityVerifierDependencies = {

    verifySignedPackage:
      verifyFinoraSignedControlPackageNative,

    assertRotationPayload:
      (
        value:
          unknown,
      ) => {
        assertFinoraBranchCertificationRotationPayload(
          value,
        );
      },

    createPortableAuthFingerprint:
      createFinoraPortableBranchAuthFingerprint,

    toCertificationPublicKey:
      toFinoraBranchCertificationPublicKey,
  };

// ============================================================
// HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraBranchCertificationRotationAuthorityVerificationResult {

  return {
    success:
      false,

    error,
  };
}

function certificationPublicKeysEqual(
  left:
    FinoraBranchCertificationPublicKeyV1,

  right:
    FinoraBranchCertificationPublicKeyV1,
): boolean {

  return (
    left.keyId ===
      right.keyId &&
    left.algorithm ===
      right.algorithm &&
    left.publicKeyFormat ===
      right.publicKeyFormat &&
    left.publicKey ===
      right.publicKey &&
    left.fingerprintAlgorithm ===
      right.fingerprintAlgorithm &&
    left.publicKeyFingerprint ===
      right.publicKeyFingerprint &&
    left.createdAt ===
      right.createdAt &&
    left.schemaVersion ===
      right.schemaVersion
  );
}

function pendingTargetMatches(
  pending:
    FinoraBranchCertificationRotationPendingRecordV1,

  expected:
    FinoraBranchCertificationRotationExpectedNativeTarget,
): boolean {

  return (
    pending.ownerId ===
      expected.ownerId &&
    pending.businessId ===
      expected.businessId &&
    pending.branchId ===
      expected.branchId &&
    pending.installationId ===
      expected.installationId &&
    pending.bindingKeyId ===
      expected.bindingKeyId &&
    pending.fingerprintAlgorithm ===
      expected.fingerprintAlgorithm &&
    pending.publicKeyFingerprint ===
      expected.publicKeyFingerprint
  );
}

// ============================================================
// VERIFY
// ============================================================

export function verifyFinoraBranchCertificationRotationAuthority(
  input:
    FinoraBranchCertificationRotationAuthorityVerificationInput,

  dependencies:
    FinoraBranchCertificationRotationAuthorityVerifierDependencies =
      DEFAULT_DEPENDENCIES,
): FinoraBranchCertificationRotationAuthorityVerificationResult {

  if (
    !pendingTargetMatches(
      input.pending,
      input.expectedTarget,
    )
  ) {
    return failure(
      "FINORA Branch Certification Rotation pending request does not belong to the current native installation target.",
    );
  }

  let currentPortableAuthFingerprint:
    string;

  try {
    currentPortableAuthFingerprint =
      dependencies.createPortableAuthFingerprint(
        input.currentPortableEnvelope,
      );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to fingerprint the current FINORA Portable Branch Auth state.",
    );
  }

  if (
    input.expectedPortableAuthFingerprintForRecovery !==
      undefined
  ) {
    if (
      input.expectedPortableAuthFingerprintForRecovery !==
        input.pending.portableAuthFingerprint
    ) {
      return failure(
        "FINORA Branch Certification Rotation recovery fingerprint does not match protected pending evidence.",
      );
    }

    currentPortableAuthFingerprint =
      input.expectedPortableAuthFingerprintForRecovery;
  }

  if (
    input.pending.portableAuthFingerprintAlgorithm !==
      "SHA-256" ||
    currentPortableAuthFingerprint !==
      input.pending.portableAuthFingerprint
  ) {
    return failure(
      "FINORA Branch Certification Rotation pending request does not match the current Portable Branch Auth state.",
    );
  }

  const verification =
    dependencies.verifySignedPackage(
      input.signedPackage,
      input.trustedKeys,
      input.expectedTarget,
      input.now,
    );

  if (
    !verification.valid
  ) {
    return failure(
      `${verification.reason}: ${verification.error}`,
    );
  }

  const controlPackage =
    verification.controlPackage;

  if (
    controlPackage.purpose !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PURPOSE
  ) {
    return failure(
      "FINORA Control Package purpose must be BRANCH_CERTIFICATION_ROTATION.",
    );
  }

  if (
    controlPackage.payloadVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION
  ) {
    return failure(
      "FINORA Branch Certification Rotation payload version is invalid.",
    );
  }

  try {
    dependencies.assertRotationPayload(
      controlPackage.payload,
    );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Branch Certification Rotation payload is invalid.",
    );
  }

  const payload =
    controlPackage.payload as
      unknown as RotationPayloadView;

  let replacementCertificationPublicKey:
    FinoraBranchCertificationPublicKeyV1;

  try {
    replacementCertificationPublicKey =
      dependencies.toCertificationPublicKey(
        input.pending.replacementCertificationKeyMaterial,
      );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA replacement Branch Certification public authority is invalid.",
    );
  }

  if (
    payload.payloadVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PAYLOAD_VERSION ||
    payload.requestId !==
      input.pending.requestId ||
    payload.ownerId !==
      input.pending.ownerId ||
    payload.businessId !==
      input.pending.businessId ||
    payload.branchId !==
      input.pending.branchId ||
    payload.requestingInstallationId !==
      input.pending.installationId ||
    payload.requestingBindingKeyId !==
      input.pending.bindingKeyId ||
    payload.requestingFingerprintAlgorithm !==
      input.pending.fingerprintAlgorithm ||
    payload.requestingPublicKeyFingerprint !==
      input.pending.publicKeyFingerprint ||
    payload.authStateId !==
      input.pending.authStateId ||
    payload.authGeneration !==
      input.pending.authGeneration ||
    payload.portableAuthFingerprintAlgorithm !==
      input.pending.portableAuthFingerprintAlgorithm ||
    payload.portableAuthFingerprint !==
      input.pending.portableAuthFingerprint ||
    payload.recoveryReason !==
      input.pending.recoveryReason ||
    payload.requestedAt !==
      input.pending.requestedAt
  ) {
    return failure(
      "FINORA Branch Certification Rotation authority does not match the exact pending request evidence.",
    );
  }

  if (
    input.pending.previousCertificationKeyId !==
      undefined &&
    (
      payload.legacyCertificationAdoption ===
        true ||
      payload.previousCertificationPublicKey ===
        undefined ||
      payload.previousCertificationPublicKey.keyId !==
        input.pending.previousCertificationKeyId
    )
  ) {
    return failure(
      "FINORA Branch Certification Rotation authority previous certification keyId does not match protected pending evidence.",
    );
  }

  if (
    payload.legacyCertificationAdoption ===
      true &&
    input.pending.previousCertificationKeyId !==
      undefined
  ) {
    return failure(
      "FINORA legacy Branch Certification adoption cannot carry previous certification key evidence.",
    );
  }

  if (
    !certificationPublicKeysEqual(
      payload.replacementCertificationPublicKey,
      replacementCertificationPublicKey,
    )
  ) {
    return failure(
      "FINORA Branch Certification Rotation authority replacement certification key does not match protected pending custody.",
    );
  }

  return {
    success:
      true,

    data: {
      requestId:
        payload.requestId,

      packageId:
        controlPackage.packageId,

      sequence:
        controlPackage.sequence,

      approvedAt:
        payload.approvedAt,

      currentPortableAuthFingerprint,

      ...(
        payload.legacyCertificationAdoption ===
          true
          ? {
              legacyCertificationAdoption:
                true as const,
            }
          : {
              previousCertificationPublicKey: {
                ...payload.previousCertificationPublicKey!,
              },
            }
      ),

      replacementCertificationPublicKey: {
        ...payload.replacementCertificationPublicKey,
      },

      verifiedTrustedKey:
        verification.verifiedTrustedKey,

      schemaVersion:
        1,
    },
  };
}