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
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "../control/finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

import {
  validateFinoraBranchCredentialEnrollmentBundle,
} from "../control/finoraBranchCredentialEnrollmentBundle.js";

import {
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
  verifyFinoraSignedControlPackageNative,
} from "../control/finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "../control/finoraSignedControlPackageVerifier.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundleIssuer.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

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

async function expectRejected(
  label:
    string,

  operation:
    () => Promise<unknown>,
): Promise<void> {

  let rejected =
    false;

  try {
    await operation();
  } catch {
    rejected =
      true;
  }

  assertTrue(
    rejected,
    `${label} unexpectedly succeeded.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

async function runSelfTest():
  Promise<void> {

  const isolatedUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-credential-enrollment-bundle-",
      ),
    );

  try {
    app.setPath(
      "userData",
      isolatedUserData,
    );

    await app.whenReady();

    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

    const now =
      new Date();

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

    const target = {
      ownerId:
        "OWNER-I4C",

      businessId:
        "BUSINESS-I4C",

      branchId:
        "BRANCH-I4C",

      installationId:
        "INSTALLATION-I4C",

      bindingKeyId:
        "FINORA-BINDING-00000000000000000000000000000000",

      fingerprintAlgorithm:
        "SHA-256" as const,

      publicKeyFingerprint:
        "0".repeat(
          64,
        ),
    };

    const sourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I4C-000001",

        userId:
          "USER-I4C-ADMIN",

        username:
          "branch-admin",

        fullName:
          "Branch Admin",

        role:
          "ADMIN",

        ownerId:
          target.ownerId,

        businessId:
          target.businessId,

        branchId:
          target.branchId,

        storageMode:
          "USB",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    await expectRejected(
      "wrong source branch rejected before either child issuance",
      () =>
        issueFinoraBranchCredentialEnrollmentBundle({
          target,

          sourceAuthorization: {
            ...sourceAuthorization,

            branchId:
              "WRONG-BRANCH",
          },
        }),
    );

    const bundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,
        sourceAuthorization,
      });

    const composition =
      validateFinoraBranchCredentialEnrollmentBundle(
        bundle,
      );

    assertTrue(
      composition.valid,
      composition.valid
        ? ""
        : composition.error,
    );

    assertTrue(
      Object.keys(
        bundle,
      ).sort().join(
        ",",
      ) ===
        "branchAccessPackage,branchPortabilityAuthorityPackage,bundleFormat,schemaVersion",
      "Outer wrapper contains unexpected authority fields.",
    );

    assertTrue(
      bundle.branchAccessPackage.sequence ===
        1,
      "Rejected preflight consumed BRANCH_ACCESS sequence.",
    );

    assertTrue(
      bundle.branchPortabilityAuthorityPackage.sequence ===
        1,
      "Rejected preflight consumed portability sequence.",
    );

    assertTrue(
      bundle.branchAccessPackage.purpose ===
        "BRANCH_ACCESS",
      "First child purpose is not BRANCH_ACCESS.",
    );

    assertTrue(
      bundle.branchPortabilityAuthorityPackage.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY",
      "Second child purpose is not BRANCH_PORTABILITY_AUTHORITY.",
    );

    assertTrue(
      bundle.branchAccessPackage.payload.action ===
        "AUTHORIZE_CREDENTIAL",
      "BRANCH_ACCESS child is not AUTHORIZE_CREDENTIAL.",
    );

    const enrollment =
      bundle.branchAccessPackage.payload
        .credentialEnrollment as
          Record<string, unknown>;

    assertTrue(
      enrollment.authorizationId ===
        bundle.branchPortabilityAuthorityPackage.payload
          .sourceAuthorizationId,
      "Child authorization lineage does not match.",
    );

    assertTrue(
      bundle.branchAccessPackage.issuer.issuerId ===
        bundle.branchPortabilityAuthorityPackage.issuer.issuerId,
      "Children were not issued by the same Control Center issuer identity.",
    );

    console.log(
      "PASS: builder produced exact unsigned two-child enrollment composition",
    );

    const branchVerification =
      verifyFinoraSignedControlPackageNative(
        bundle.branchAccessPackage,
        trustedKeys,
        target,
        new Date(
          bundle.branchAccessPackage.issuedAt,
        ),
      );

    assertTrue(
      branchVerification.valid,
      branchVerification.valid
        ? ""
        : branchVerification.error,
    );

    assertTrue(
      branchVerification.controlPackage.purpose ===
        "BRANCH_ACCESS",
      "BRANCH_ACCESS child cryptographically verified with wrong purpose.",
    );

    console.log(
      "PASS: installation-bound AUTHORIZE_CREDENTIAL child cryptographically verifies",
    );

    const portabilityVerification =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        bundle.branchPortabilityAuthorityPackage,
        trustedKeys,
        {
          ownerId:
            target.ownerId,

          businessId:
            target.businessId,

          branchId:
            target.branchId,
        },
        new Date(
          bundle.branchPortabilityAuthorityPackage.issuedAt,
        ),
      );

    assertTrue(
      portabilityVerification.valid,
      portabilityVerification.valid
        ? ""
        : portabilityVerification.error,
    );

    console.log(
      "PASS: reusable branch-only portability child cryptographically verifies",
    );

    const second =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization: {
          ...sourceAuthorization,

          authorizationId:
            "FINORA-CREDENTIAL-ENROLLMENT-I4C-000002",
        },
      });

    assertTrue(
      second.branchAccessPackage.sequence ===
        2,
      "Second composition did not advance BRANCH_ACCESS sequence.",
    );

    assertTrue(
      second.branchPortabilityAuthorityPackage.sequence ===
        2,
      "Second composition did not advance portability sequence.",
    );

    console.log(
      "PASS: both child issuance namespaces advance monotonically",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I4C CONTROL CENTER CREDENTIAL ENROLLMENT COMPOSITION BUILDER EXECUTABLE PROOF",
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