/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH CERTIFICATION ROTATION APPLY COORDINATOR

   Transaction order:

   1. Verify exact signed Control Center rotation authority.
   2. Re-encrypt Portable Auth with the pending replacement
      certification private key while preserving the existing
      Password/Security-Code factors and verifier lineage.
   3. Compare-and-replace the exact authoritative Portable Auth.
   4. Commit package replay, sequence high-water and current
      certification provenance in one encrypted Control Store write.
   5. Destroy pending replacement private-key custody only after
      both durable authorities above succeed.

   The renderer never receives certification private-key material.
============================================================ */

import {
  verifyFinoraBranchCertificationRotationAuthority,
} from "./finoraBranchCertificationRotationAuthorityVerifier.js";

import type {
  FinoraBranchCertificationRotationExpectedNativeTarget,
} from "./finoraBranchCertificationRotationAuthorityVerifier.js";

import {
  destroyFinoraBranchCertificationRotationPending,
} from "./finoraBranchCertificationRotationPendingStore.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
  reencryptFinoraPortableBranchAuthCertificationV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  applyFinoraBranchCertificationRotationControlState,
} from "./finoraControlStore.js";

// ============================================================
// INPUT / RESULT
// ============================================================

export interface FinoraBranchCertificationRotationApplyInput {
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

  portableStore:
    Pick<
      FinoraPortableBranchAuthStore,
      "replaceExact"
    >;

  storageMode:
    "LOCAL" | "USB";

  password:
    string;

  securityCode:
    string;
}

export interface FinoraBranchCertificationRotationApplySuccess {
  requestId:
    string;

  packageId:
    string;

  sequence:
    number;

  replacementCertificationKeyId:
    string;

  appliedAt:
    string;

  pendingDestroyed:
    true;
}

export type FinoraBranchCertificationRotationApplyResult =
  | {
      success:
        true;

      data:
        FinoraBranchCertificationRotationApplySuccess;
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraBranchCertificationRotationApplyDependencies {
  now:
    () => Date;

  verifyAuthority:
    typeof verifyFinoraBranchCertificationRotationAuthority;

  decryptPortableAuth:
    typeof decryptFinoraPortableBranchAuthEnvelopeV1;

  toCertificationPublicKey:
    typeof toFinoraBranchCertificationPublicKey;

  reencryptPortableAuth:
    typeof reencryptFinoraPortableBranchAuthCertificationV1;

  applyControlState:
    typeof applyFinoraBranchCertificationRotationControlState;

  destroyPending:
    typeof destroyFinoraBranchCertificationRotationPending;
}

const DEFAULT_DEPENDENCIES:
  FinoraBranchCertificationRotationApplyDependencies =
  {
    now:
      () =>
        new Date(),

    verifyAuthority:
      verifyFinoraBranchCertificationRotationAuthority,

    decryptPortableAuth:
      decryptFinoraPortableBranchAuthEnvelopeV1,

    toCertificationPublicKey:
      toFinoraBranchCertificationPublicKey,

    reencryptPortableAuth:
      reencryptFinoraPortableBranchAuthCertificationV1,

    applyControlState:
      applyFinoraBranchCertificationRotationControlState,

    destroyPending:
      destroyFinoraBranchCertificationRotationPending,
  };

// ============================================================
// HELPERS
// ============================================================

function failure(
  error:
    string,
): FinoraBranchCertificationRotationApplyResult {

  return {
    success:
      false,

    error,
  };
}

function hasText(
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

function certificationPublicKeysEqual(
  left:
    ReturnType<
      typeof toFinoraBranchCertificationPublicKey
    >,

  right:
    ReturnType<
      typeof toFinoraBranchCertificationPublicKey
    >,
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

// ============================================================
// APPLY
// ============================================================

export async function applyFinoraBranchCertificationRotationAuthority(
  input:
    FinoraBranchCertificationRotationApplyInput,

  dependencies:
    FinoraBranchCertificationRotationApplyDependencies =
      DEFAULT_DEPENDENCIES,
): Promise<
  FinoraBranchCertificationRotationApplyResult
> {

  if (
    !input ||
    !Array.isArray(
      input.trustedKeys,
    ) ||
    input.trustedKeys.length ===
      0 ||
    !hasText(
      input.password,
    ) ||
    !hasText(
      input.securityCode,
    ) ||
    (
      input.storageMode !==
        "LOCAL" &&
      input.storageMode !==
        "USB"
    )
  ) {
    return failure(
      "A valid FINORA Branch Certification Rotation apply request is required.",
    );
  }

  const appliedAt =
    dependencies
      .now()
      .toISOString();

  // ----------------------------------------------------------
  // 0. AUTHENTICATE CURRENT PORTABLE STATE
  //
  // This is also the crash-recovery discriminator. If the
  // current Portable Auth already carries the exact pending
  // replacement certification key, a prior attempt completed
  // the Portable CAS and we must resume after that boundary.
  // ----------------------------------------------------------

  let currentPayload:
    FinoraPortableBranchAuthPayloadV1;

  try {
    currentPayload =
      await dependencies.decryptPortableAuth(
        input.currentPortableEnvelope,
        input.password,
        input.securityCode,
        {
          expectedScope: {
            ownerId:
              input.pending.ownerId,

            businessId:
              input.pending.businessId,

            branchId:
              input.pending.branchId,
          },
        },
      );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to authenticate current FINORA Portable Branch Auth during certification rotation.",
    );
  }

  if (
    currentPayload.ownerId !==
      input.pending.ownerId ||
    currentPayload.businessId !==
      input.pending.businessId ||
    currentPayload.branchId !==
      input.pending.branchId ||
    currentPayload.storageMode !==
      input.storageMode ||
    currentPayload.authStateId !==
      input.pending.authStateId ||
    currentPayload.authGeneration !==
      input.pending.authGeneration
  ) {
    return failure(
      "Current FINORA Portable Branch Auth lineage does not match protected rotation pending evidence.",
    );
  }

  const pendingReplacementPublicKey =
    dependencies.toCertificationPublicKey(
      input
        .pending
        .replacementCertificationKeyMaterial,
    );

  let postCasRecovery =
    false;

  if (
    currentPayload.branchCertificationKeyMaterial !==
      undefined
  ) {
    const currentCertificationPublicKey =
      dependencies.toCertificationPublicKey(
        currentPayload.branchCertificationKeyMaterial,
      );

    if (
      !certificationPublicKeysEqual(
        currentCertificationPublicKey,
        pendingReplacementPublicKey,
      )
    ) {
      return failure(
        "Current FINORA Portable Branch Auth contains unexpected Branch Certification authority during rotation recovery.",
      );
    }

    postCasRecovery =
      true;
  }

  // ----------------------------------------------------------
  // 1. SIGNED AUTHORITY VERIFICATION
  // ----------------------------------------------------------

  const verification =
    dependencies.verifyAuthority({
      signedPackage:
        input.signedPackage,

      trustedKeys:
        input.trustedKeys,

      expectedTarget:
        input.expectedTarget,

      pending:
        input.pending,

      currentPortableEnvelope:
        input.currentPortableEnvelope,

      ...(
        postCasRecovery
          ? {
              expectedPortableAuthFingerprintForRecovery:
                input.pending.portableAuthFingerprint,
            }
          : {}
      ),

      now:
        new Date(
          appliedAt,
        ),
    });

  if (
    !verification.success
  ) {
    return failure(
      verification.error,
    );
  }

  const authority =
    verification.data;

  const replacementKeyId =
    input
      .pending
      .replacementCertificationKeyMaterial
      .keyId;

  if (
    authority.requestId !==
      input.pending.requestId ||
    authority.replacementCertificationPublicKey.keyId !==
      replacementKeyId
  ) {
    return failure(
      "Verified FINORA Branch Certification Rotation authority does not match pending replacement custody.",
    );
  }

  // ----------------------------------------------------------
  // 2. CERT-ONLY PORTABLE AUTH RE-ENCRYPTION
  // ----------------------------------------------------------

  let controlStatePortableEnvelope =
    input.currentPortableEnvelope;

  if (
    !postCasRecovery
  ) {
    // --------------------------------------------------------
    // 2. CERT-ONLY PORTABLE AUTH RE-ENCRYPTION
    // --------------------------------------------------------

    let replacementEnvelope:
      FinoraPortableBranchAuthEnvelopeV1;

    try {
      replacementEnvelope =
        await dependencies.reencryptPortableAuth({
          currentEnvelope:
            input.currentPortableEnvelope,

          password:
            input.password,

          securityCode:
            input.securityCode,

          branchCertificationKeyMaterial:
            input
              .pending
              .replacementCertificationKeyMaterial,

          updatedAt:
            appliedAt,

          expectedScope: {
            ownerId:
              input.pending.ownerId,

            businessId:
              input.pending.businessId,

            branchId:
              input.pending.branchId,
          },
        });
    }
    catch (
      error
    ) {
      return failure(
        error instanceof Error
          ? error.message
          : "Unable to re-encrypt FINORA Portable Branch Auth for certification rotation.",
      );
    }

    // --------------------------------------------------------
    // 3. EXACT PORTABLE AUTH CAS
    // --------------------------------------------------------

    try {
      await input.portableStore.replaceExact(
        input.storageMode,
        input.currentPortableEnvelope,
        replacementEnvelope,
      );
    }
    catch (
      error
    ) {
      return failure(
        error instanceof Error
          ? error.message
          : "Unable to atomically replace FINORA Portable Branch Auth during certification rotation.",
      );
    }

    controlStatePortableEnvelope =
      replacementEnvelope;
  }
  // ----------------------------------------------------------
  // 4. DURABLE CONTROL STORE EVIDENCE
  //
  // Pending custody is intentionally retained if this step
  // fails. Recovery must never destroy the replacement private
  // key before durable Control Store evidence exists.
  // ----------------------------------------------------------

  const controlState =
    await dependencies.applyControlState({
      packageId:
        authority.packageId,

      issuerId:
        authority
          .verifiedTrustedKey
          .issuerId,

      purpose:
        "BRANCH_CERTIFICATION_ROTATION",

      sequence:
        authority.sequence,

      target: {
        ownerId:
          input.expectedTarget.ownerId,

        businessId:
          input.expectedTarget.businessId,

        branchId:
          input.expectedTarget.branchId,

        installationId:
          input.expectedTarget.installationId,
      },

      storageMode:
        input.storageMode,

      requestId:
        authority.requestId,

      replacementCertificationKeyId:
        replacementKeyId,

      legacyEnrollmentRecovery:
        "legacyNativeBoundMigrationEvidence" in
          currentPayload
            .sourceAuthorizationVerificationEvidence
          ? {
              portableEnvelope:
                controlStatePortableEnvelope,

              payload:
                currentPayload,
            }
          : undefined,

      appliedAt,
    });

  if (
    !controlState.success
  ) {
    return failure(
      controlState.error ??
        "Unable to persist FINORA Branch Certification Rotation Control State.",
    );
  }

  // ----------------------------------------------------------
  // 5. DESTROY PENDING PRIVATE-KEY CUSTODY
  // ----------------------------------------------------------

  let destroyed:
    boolean;

  try {
    destroyed =
      await dependencies.destroyPending({
        requestId:
          input.pending.requestId,

        ownerId:
          input.pending.ownerId,

        businessId:
          input.pending.businessId,

        branchId:
          input.pending.branchId,

        replacementCertificationKeyId:
          replacementKeyId,
      });
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA Branch Certification Rotation completed durable state but could not destroy pending private-key custody.",
    );
  }

  if (
    !destroyed
  ) {
    return failure(
      "FINORA Branch Certification Rotation completed durable state but pending private-key custody was not present for destruction.",
    );
  }

  return {
    success:
      true,

    data: {
      requestId:
        authority.requestId,

      packageId:
        authority.packageId,

      sequence:
        authority.sequence,

      replacementCertificationKeyId:
        replacementKeyId,

      appliedAt,

      pendingDestroyed:
        true,
    },
  };
}