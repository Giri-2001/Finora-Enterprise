import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  signFinoraControlCenterPackage,
} from "../control-center/finoraControlCenterSigner.js";

import {
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
  verifyFinoraSignedControlPackageBranchScope,
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchControlTarget,
  FinoraBranchScopeControlTarget,
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

function assertTrue(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `FAIL: ${message}`,
    );
  }
}

function expectFailureReason(
  label:
    string,
  result:
    ReturnType<
      typeof verifyFinoraSignedBranchPortabilityAuthorityPackage
    >,
  reason:
    Exclude<
      ReturnType<
        typeof verifyFinoraSignedBranchPortabilityAuthorityPackage
      >,
      { valid: true }
    >["reason"],
): void {
  assertTrue(
    !result.valid,
    `${label} unexpectedly succeeded.`,
  );

  assertTrue(
    result.reason ===
      reason,
    `${label} returned ${result.reason}; expected ${reason}.`,
  );

  console.log(
    `PASS: ${label} -> ${reason}`,
  );
}

function expectControlFailureReason(
  label:
    string,

  result:
    ReturnType<
      typeof verifyFinoraSignedControlPackageBranchScope
    >,

  reason:
    Exclude<
      ReturnType<
        typeof verifyFinoraSignedControlPackageBranchScope
      >,
      { valid: true }
    >["reason"],
): void {

  assertTrue(
    !result.valid,
    `${label} unexpectedly succeeded.`,
  );

  assertTrue(
    result.reason ===
      reason,
    `${label} returned ${result.reason}; expected ${reason}.`,
  );

  console.log(
    `PASS: ${label} -> ${reason}`,
  );
}

async function runSelfTest(): Promise<void> {
  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-portability-verifier-",
      ),
    );

  try {
    app.setPath(
      "userData",
      isolatedUserData,
    );

    await app.whenReady();

    const now =
      new Date();

    const issuedAt =
      now.toISOString();

    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        {
          issuerId:
            publicIdentity.issuerId,

          signingKeyId:
            publicIdentity.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            publicIdentity.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            new Date(
              now.getTime() -
                24 * 60 * 60 * 1000,
            ).toISOString(),
        },
      ];

    const target:
      FinoraBranchScopeControlTarget = {
        ownerId:
          "OWNER-PORTABILITY-SELFTEST",

        businessId:
          "BUSINESS-PORTABILITY-SELFTEST",

        branchId:
          "BRANCH-PORTABILITY-SELFTEST",
      };

    const payload = {
      authorizationId:
        "FINORA-AUTHORIZATION-PORTABILITY-SELFTEST-000001",

      schemaVersion:
        1 as const,
    };

    const validPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-PORTABILITY-VALID-000001",

        purpose:
          "BRANCH_PORTABILITY_AUTHORITY",

        target,

        issuedAt,

        sequence:
          1,

        payloadVersion:
          1,

        payload,

        schemaVersion:
          1,
      });

    const validResult =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        validPackage,
        trustedKeys,
        target,
        now,
      );

    assertTrue(
      validResult.valid,
      validResult.valid
        ? ""
        : validResult.error,
    );

    assertTrue(
      validResult.controlPackage.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY",
      "Valid package purpose was not preserved.",
    );

    assertTrue(
      validResult.verifiedTrustedKey.signingKeyId ===
        publicIdentity.signingKeyId,
      "Verifier did not return the exact matched signer evidence.",
    );

    console.log(
      "PASS: valid signed branch-only portability authority verified",
    );

    const wrongBranchResult =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        validPackage,
        trustedKeys,
        {
          ...target,
          branchId:
            "BRANCH-PORTABILITY-WRONG",
        },
        now,
      );

    expectFailureReason(
      "wrong branch rejected",
      wrongBranchResult,
      "TARGET_MISMATCH",
    );

    const extraInstallationPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-PORTABILITY-EXTRA-INSTALLATION-000001",

        purpose:
          "BRANCH_PORTABILITY_AUTHORITY",

        target: {
          ...target,

          installationId:
            "INSTALLATION-MUST-NOT-BE-ACCEPTED",
        },

        issuedAt,

        sequence:
          2,

        payloadVersion:
          1,

        payload,

        schemaVersion:
          1,
      });

    const extraInstallationResult =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        extraInstallationPackage,
        trustedKeys,
        target,
        now,
      );

    expectFailureReason(
      "installation-shaped target rejected by branch-only verifier",
      extraInstallationResult,
      "TARGET_MISMATCH",
    );

    const wrongPurposePackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-BRANCH-PORTABILITY-WRONG-PURPOSE-000001",

        purpose:
          "BUSINESS_PROFILE",

        target,

        issuedAt,

        sequence:
          3,

        payloadVersion:
          1,

        payload,

        schemaVersion:
          1,
      });

    const wrongPurposeResult =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        wrongPurposePackage,
        trustedKeys,
        target,
        now,
      );

    expectFailureReason(
      "cryptographically valid wrong purpose rejected",
      wrongPurposeResult,
      "PURPOSE_MISMATCH",
    );

    const badSignaturePackage = {
      ...validPackage,

      signature: {
        ...validPackage.signature,

        value:
          Buffer.alloc(
            64,
          ).toString(
            "base64",
          ),
      },
    };

    const badSignatureResult =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        badSignaturePackage,
        trustedKeys,
        target,
        now,
      );

    expectFailureReason(
      "bad signature rejected",
      badSignatureResult,
      "INVALID_SIGNATURE",
    );

    const unknownSignerResult =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        validPackage,
        [],
        target,
        now,
      );

    expectFailureReason(
      "unknown signer rejected",
      unknownSignerResult,
      "UNKNOWN_SIGNING_KEY",
    );

    // ========================================================
    // G4 PORTABLE FULL-HISTORICAL-TARGET VERIFIER
    //
    // Ordinary operational Control Packages retain the complete
    // historical installation binding inside their signatures.
    //
    // Portable authorization compares only the permanent branch
    // scope, while the historical installation target must still
    // be internally valid.
    // ========================================================

    const historicalFingerprint =
      "ab".repeat(
        32,
      );

    const historicalTarget:
      FinoraBranchControlTarget = {
        ...target,

        installationId:
          "INSTALLATION-HISTORICAL-PORTABLE-000001",

        bindingKeyId:
          `FINORA-BINDING-${historicalFingerprint
            .slice(
              0,
              32,
            )
            .toUpperCase()}`,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          historicalFingerprint,
      };

    const historicalPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-G4-PORTABLE-FULL-TARGET-000001",

        purpose:
          "BUSINESS_PROFILE",

        target:
          historicalTarget,

        issuedAt,

        sequence:
          4,

        payloadVersion:
          1,

        payload,

        schemaVersion:
          1,
      });

    const portableValidResult =
      verifyFinoraSignedControlPackageBranchScope(
        historicalPackage,
        trustedKeys,
        target,
        now,
      );

    assertTrue(
      portableValidResult.valid,
      portableValidResult.valid
        ? ""
        : portableValidResult.error,
    );

    assertTrue(
      portableValidResult.controlPackage.target.installationId ===
        historicalTarget.installationId &&
      portableValidResult.controlPackage.target.bindingKeyId ===
        historicalTarget.bindingKeyId &&
      portableValidResult.controlPackage.target.publicKeyFingerprint ===
        historicalTarget.publicKeyFingerprint,
      "Portable verifier did not preserve the signed historical installation-binding provenance.",
    );

    console.log(
      "PASS: full historical installation target verified through matching portable branch scope",
    );

    const portableWrongBranchResult =
      verifyFinoraSignedControlPackageBranchScope(
        historicalPackage,
        trustedKeys,
        {
          ...target,

          branchId:
            "BRANCH-G4-PORTABLE-WRONG",
        },
        now,
      );

    expectControlFailureReason(
      "portable verifier rejected wrong branch scope",
      portableWrongBranchResult,
      "TARGET_MISMATCH",
    );

    // --------------------------------------------------------
    // Cryptographically sign a malformed historical target.
    //
    // The bindingKeyId is syntactically populated but does not
    // correspond to the signed SHA-256 fingerprint.
    // --------------------------------------------------------

    const malformedHistoricalFingerprint =
      "cd".repeat(
        32,
      );

    const malformedHistoricalTarget:
      FinoraBranchControlTarget = {
        ...target,

        installationId:
          "INSTALLATION-HISTORICAL-MALFORMED-000001",

        bindingKeyId:
          "FINORA-BINDING-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          malformedHistoricalFingerprint,
      };

    const malformedHistoricalPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "PACKAGE-G4-PORTABLE-MALFORMED-HISTORICAL-000001",

        purpose:
          "BUSINESS_PROFILE",

        target:
          malformedHistoricalTarget,

        issuedAt,

        sequence:
          5,

        payloadVersion:
          1,

        payload,

        schemaVersion:
          1,
      });

    const malformedHistoricalResult =
      verifyFinoraSignedControlPackageBranchScope(
        malformedHistoricalPackage,
        trustedKeys,
        target,
        now,
      );

    expectControlFailureReason(
      "portable verifier rejected signed malformed historical binding provenance",
      malformedHistoricalResult,
      "TARGET_MISMATCH",
    );

    const badPortableSignaturePackage = {
      ...historicalPackage,

      signature: {
        ...historicalPackage.signature,

        value:
          Buffer.alloc(
            64,
          ).toString(
            "base64",
          ),
      },
    };

    const badPortableSignatureResult =
      verifyFinoraSignedControlPackageBranchScope(
        badPortableSignaturePackage,
        trustedKeys,
        target,
        now,
      );

    expectControlFailureReason(
      "portable verifier rejected bad signature",
      badPortableSignatureResult,
      "INVALID_SIGNATURE",
    );

    // --------------------------------------------------------
    // Native exact-binding regression.
    //
    // This represents another internally valid device binding.
    // The same historical package must remain rejected by the
    // native verifier because exact installation equality is
    // still mandatory in the native policy.
    // --------------------------------------------------------

    const differentNativeFingerprint =
      "ef".repeat(
        32,
      );

    const differentNativeTarget:
      FinoraBranchControlTarget = {
        ...target,

        installationId:
          "INSTALLATION-DIFFERENT-NATIVE-000001",

        bindingKeyId:
          `FINORA-BINDING-${differentNativeFingerprint
            .slice(
              0,
              32,
            )
            .toUpperCase()}`,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          differentNativeFingerprint,
      };

    const nativeDifferentInstallationResult =
      verifyFinoraSignedControlPackageNative(
        historicalPackage,
        trustedKeys,
        differentNativeTarget,
        now,
      );

    expectControlFailureReason(
      "native verifier preserved exact installation binding",
      nativeDifferentInstallationResult,
      "TARGET_MISMATCH",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: G4 PORTABLE FULL-TARGET VERIFIER EXECUTABLE MATRIX",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I2F3 BRANCH PORTABILITY AUTHORITY VERIFIER EXECUTABLE PROOF",
    );
  }
  finally {
    await rm(
      isolatedUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

void runSelfTest()
  .then(
    () => {
      app.quit();
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED",
      );

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );