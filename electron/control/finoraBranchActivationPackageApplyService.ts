// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL
// VERIFIED BRANCH ACTIVATION PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Resolve authoritative installation identity
// - Verify Control Center ECDSA P-256 signature
// - Verify package target
// - Verify BRANCH_ACTIVATION payload structure
// - Send only verified state to replay-protected atomic store
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - PUBLIC verification only.
// - No private key.
// - No signing.
// - No renderer IPC.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  applyFinoraVerifiedBranchActivationState,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchAccessGrant,
  FinoraControlBranchActivation,
  FinoraControlStoreResult,
  FinoraVerifiedBranchActivationApplyResult,
} from "./finoraControlStore.js";

import {
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// HELPERS
// ============================================================

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

function failure(
  error:
    string,
): FinoraControlStoreResult<
  FinoraVerifiedBranchActivationApplyResult
> {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// APPLY
// ============================================================

export async function applyFinoraSignedBranchActivationPackage(
  signedPackage:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date = new Date(),
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBranchActivationApplyResult
  >
> {

  // ----------------------------------------------------------
  // AUTHORITATIVE INSTALLATION
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
      "FINORA installation identity is required before activation.",
    );
  }


  // ----------------------------------------------------------
  // ----------------------------------------------------------
  // AUTHORITATIVE NATIVE INSTALLATION BINDING
  //
  // The encrypted Control Store identity alone is not sufficient
  // proof that this package belongs to this physical installation.
  //
  // The private possession key remains inside the Windows
  // safeStorage binding vault. Only its public identity is used
  // here for exact signed-target matching.
  // ----------------------------------------------------------

  let nativeBinding;

  try {
    nativeBinding =
      await getFinoraWindowsInstallationBinding();
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load the FINORA native installation binding.",
    );
  }

  if (!nativeBinding) {
    return failure(
      "FINORA native installation binding is required before activation.",
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
  // PURPOSE
  // ----------------------------------------------------------

  if (
    controlPackage.purpose !==
      "BRANCH_ACTIVATION"
  ) {
    return failure(
      "FINORA Control Package purpose must be BRANCH_ACTIVATION.",
    );
  }


  // ----------------------------------------------------------
  // DOMAIN PAYLOAD
  // ----------------------------------------------------------

  const payload =
    controlPackage.payload;

  if (
    !isRecord(
      payload.activation,
    ) ||
    !isRecord(
      payload.accessGrant,
    ) ||
    !isRecord(
      payload.installationBinding,
    ) ||
    (
      payload.action !==
        "ISSUE" &&
      payload.action !==
        "RENEW" &&
      payload.action !==
        "REPLACE"
    ) ||
    payload.schemaVersion !==
      1
  ) {
    return failure(
      "FINORA Branch Activation payload structure is invalid.",
    );
  }

  if (
    payload.installationBinding
      .installationId !==
        installation.installationId ||
    payload.installationBinding
      .installationId !==
        nativeBinding.installationId ||
    payload.installationBinding
      .bindingKeyId !==
        nativeBinding.bindingKeyId ||
    payload.installationBinding
      .fingerprintAlgorithm !==
        "SHA-256" ||
    payload.installationBinding
      .publicKeyFingerprint !==
        nativeBinding.publicKeyFingerprint ||
    payload.installationBinding
      .bindingKeyId !==
        controlPackage.target.bindingKeyId ||
    payload.installationBinding
      .fingerprintAlgorithm !==
        controlPackage.target.fingerprintAlgorithm ||
    payload.installationBinding
      .publicKeyFingerprint !==
        controlPackage.target.publicKeyFingerprint
  ) {
    return failure(
      "FINORA Branch Activation payload native installation binding does not match.",
    );
  }

  const activation =
    payload.activation as unknown as
      FinoraControlBranchActivation;

  const accessGrant =
    payload.accessGrant as unknown as
      FinoraControlBranchAccessGrant;


  // ----------------------------------------------------------
  // SIGNED IDENTITY BINDING
  // ----------------------------------------------------------

  if (
    activation.ownerId !==
      installation.ownerId ||
    activation.businessId !==
      installation.businessId ||
    activation.branchId !==
      installation.branchId ||
    accessGrant.ownerId !==
      installation.ownerId ||
    accessGrant.businessId !==
      installation.businessId ||
    accessGrant.branchId !==
      installation.branchId
  ) {
    return failure(
      "FINORA signed Branch Activation payload identity mismatch.",
    );
  }


  // ----------------------------------------------------------
  // PHASE-2 ACTIVATION REQUIREMENT
  // ----------------------------------------------------------

  if (
    activation.status !==
      "ACTIVE"
  ) {
    return failure(
      "FINORA signed Branch Activation must contain ACTIVE activation state.",
    );
  }

  if (
    payload.action ===
      "RENEW" &&
    accessGrant.accessType !==
      "REGISTERED"
  ) {
    return failure(
      "FINORA RENEW action is valid only for REGISTERED access.",
    );
  }


  // ----------------------------------------------------------
  // REPLAY-PROTECTED ATOMIC APPLY
  // ----------------------------------------------------------

  return applyFinoraVerifiedBranchActivationState({
    packageId:
      controlPackage.packageId,

    issuerId:
      controlPackage.issuer.issuerId,

    purpose:
      "BRANCH_ACTIVATION",

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
    },

    activation,

    accessGrant,

    appliedAt:
      now.toISOString(),
  });
}

// ============================================================
// END
// ============================================================