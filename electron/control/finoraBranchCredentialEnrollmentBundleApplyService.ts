/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT BUNDLE APPLY SERVICE

   SECURITY ORDER:

   1. Defensive bundle + trust + time snapshot.
   2. Exact composition validation.
   3. Authoritative recipient installation identity.
   4. Authoritative native installation binding.
   5. Verify installation-bound BRANCH_ACCESS child.
   6. Verify branch-only BRANCH_PORTABILITY_AUTHORITY child.
   7. Require exact matched trusted Control Center signer.
   8. Build + validate reusable portability provenance.
   9. Only then delegate BRANCH_ACCESS application.
  10. I5C owns the one encrypted atomic Control Store write.

   The portability child is NOT replay-consumed here and does
   NOT enter normal Control Store sequence state.
============================================================ */

import {
  validateFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundle.js";

import {
  applyFinoraSignedBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlStoreResult,
  FinoraVerifiedBranchAccessApplyResult,
} from "./finoraControlStore.js";

import {
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";


function failure(
  error:
    string,
): FinoraControlStoreResult<never> {

  return {
    success:
      false,

    error,
  };
}

function verifiedSignersMatchExactly(
  left:
    FinoraBranchTrustedControlPublicKey,

  right:
    FinoraBranchTrustedControlPublicKey,
): boolean {

  return (
    left.issuerId ===
      right.issuerId &&
    left.signingKeyId ===
      right.signingKeyId &&
    left.algorithm ===
      right.algorithm &&
    left.format ===
      right.format &&
    left.publicKey ===
      right.publicKey &&
    left.status ===
      right.status &&
    left.validFrom ===
      right.validFrom &&
    left.validUntil ===
      right.validUntil
  );
}

export async function applyFinoraBranchCredentialEnrollmentBundle(
  value:
    unknown,

  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],

  now:
    Date,
): Promise<
  FinoraControlStoreResult<
    FinoraVerifiedBranchAccessApplyResult
  >
> {

  if (
    !Array.isArray(
      trustedKeys,
    ) ||
    trustedKeys.length ===
      0 ||
    !(now instanceof Date) ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    return failure(
      "A valid FINORA recipient trust set and verification time are required.",
    );
  }

  /*
   * Snapshot every caller-controlled verification input before
   * the first await.
   */
  let bundleSnapshot:
    unknown;

  let trustedKeySnapshot:
    FinoraBranchTrustedControlPublicKey[];

  try {
    bundleSnapshot =
      structuredClone(
        value,
      );

    trustedKeySnapshot =
      trustedKeys.map(
        (
          key,
        ) => ({
          ...key,
        }),
      );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? `Unable to snapshot FINORA Branch Credential Enrollment Bundle inputs: ${error.message}`
        : "Unable to snapshot FINORA Branch Credential Enrollment Bundle inputs.",
    );
  }

  const verificationNow =
    new Date(
      now.getTime(),
    );

  // ----------------------------------------------------------
  // 1. STRUCTURAL COMPOSITION PREFLIGHT
  // ----------------------------------------------------------

  const composition =
    validateFinoraBranchCredentialEnrollmentBundle(
      bundleSnapshot,
    );

  if (!composition.valid) {
    return failure(
      composition.error,
    );
  }

  const bundle =
    composition.bundle;

  // ----------------------------------------------------------
  // 2. AUTHORITATIVE RECIPIENT INSTALLATION
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
      "FINORA installation identity is required before applying a Branch Credential Enrollment Bundle.",
    );
  }

  // ----------------------------------------------------------
  // 3. AUTHORITATIVE NATIVE INSTALLATION BINDING
  // ----------------------------------------------------------

  let nativeBinding;

  try {
    nativeBinding =
      await getFinoraWindowsInstallationBinding();
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load the FINORA native installation binding.",
    );
  }

  if (!nativeBinding) {
    return failure(
      "FINORA native installation binding is required before applying a Branch Credential Enrollment Bundle.",
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

  const installationTarget = {
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
      "SHA-256" as const,

    publicKeyFingerprint:
      nativeBinding.publicKeyFingerprint,
  };

  const branchTarget = {
    ownerId:
      installation.ownerId,

    businessId:
      installation.businessId,

    branchId:
      installation.branchId,
  };

  // ----------------------------------------------------------
  // 4. VERIFY INSTALLATION-BOUND BRANCH_ACCESS CHILD
  // ----------------------------------------------------------

  const branchVerification =
    verifyFinoraSignedControlPackageNative(
      bundle.branchAccessPackage,
      trustedKeySnapshot,
      installationTarget,
      verificationNow,
    );

  if (!branchVerification.valid) {
    return failure(
      `BRANCH_ACCESS ${branchVerification.reason}: ${branchVerification.error}`,
    );
  }

  if (
    branchVerification.controlPackage.purpose !==
      "BRANCH_ACCESS"
  ) {
    return failure(
      "FINORA Branch Credential Enrollment Bundle BRANCH_ACCESS child purpose verification failed.",
    );
  }

  // ----------------------------------------------------------
  // 5. VERIFY REUSABLE BRANCH-ONLY PORTABILITY CHILD
  //
  // No authoritative mutation has occurred before this point.
  // ----------------------------------------------------------

  const portabilityVerification =
    verifyFinoraSignedBranchPortabilityAuthorityPackage(
      bundle.branchPortabilityAuthorityPackage,
      trustedKeySnapshot,
      branchTarget,
      verificationNow,
    );

  if (!portabilityVerification.valid) {
    return failure(
      `BRANCH_PORTABILITY_AUTHORITY ${portabilityVerification.reason}: ${portabilityVerification.error}`,
    );
  }

  // ----------------------------------------------------------
  // 6. EXACT VERIFIED SIGNER EQUIVALENCE
  // ----------------------------------------------------------

  if (
    !verifiedSignersMatchExactly(
      branchVerification.verifiedTrustedKey,
      portabilityVerification.verifiedTrustedKey,
    )
  ) {
    return failure(
      "FINORA Branch Credential Enrollment Bundle children were not verified by the exact same trusted Control Center signing key.",
    );
  }

  const verifiedSigner =
    branchVerification.verifiedTrustedKey;

  if (
    bundle.branchAccessPackage.issuer.issuerId !==
      verifiedSigner.issuerId ||
    bundle.branchAccessPackage.issuer.signingKeyId !==
      verifiedSigner.signingKeyId ||
    bundle.branchPortabilityAuthorityPackage.issuer.issuerId !==
      verifiedSigner.issuerId ||
    bundle.branchPortabilityAuthorityPackage.issuer.signingKeyId !==
      verifiedSigner.signingKeyId
  ) {
    return failure(
      "FINORA Branch Credential Enrollment Bundle signer identity does not match verified trusted-key evidence.",
    );
  }

  // ----------------------------------------------------------
  // 7. BUILD VERIFIED PORTABILITY PROVENANCE
  // ----------------------------------------------------------

  const credentialPortabilityAuthorityProvenanceCandidate = {
    sourceAuthorizationId:
      composition.sourceAuthorizationId,

    signedPortabilityAuthorityPackage:
      bundle.branchPortabilityAuthorityPackage,

    verifiedControlSigner: {
      ...portabilityVerification.verifiedTrustedKey,
    },

    verifiedAt:
      verificationNow.toISOString(),

    schemaVersion:
      1,
  };

  /*
   * The generic signed-package verifier intentionally returns a
   * generic Record payload type.
   *
   * The strict I5C provenance validator performs the final domain
   * narrowing here instead of using an unsafe TypeScript cast.
   */
  if (
    !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
      credentialPortabilityAuthorityProvenanceCandidate,
    )
  ) {
    return failure(
      "FINORA verified Branch Portability Authority provenance is invalid.",
    );
  }

  const credentialPortabilityAuthorityProvenance =
    credentialPortabilityAuthorityProvenanceCandidate;

  // ----------------------------------------------------------
  // 8. AUTHORITATIVE APPLY
  //
  // Both children have already verified before this call.
  // Existing Branch Access code deliberately re-verifies and
  // re-sanitizes its own child before I5C performs the atomic
  // credential-authorization + provenance persistence.
  // ----------------------------------------------------------

  return applyFinoraSignedBranchAccessPackage(
    bundle.branchAccessPackage,
    trustedKeySnapshot,
    verificationNow,
    credentialPortabilityAuthorityProvenance,
  );
}