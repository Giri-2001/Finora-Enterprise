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
} from "./finoraSignedControlPackageVerifier.js";

import type {
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