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
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
} from "../control/finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "../control/finoraSignedControlPackageVerifier.js";

import {
  issueFinoraBranchPortabilityAuthorityPackage,
} from "./finoraBranchPortabilityAuthorityIssuer.js";

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
        "finora-portability-issuer-",
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
        "OWNER-I3G",

      businessId:
        "BUSINESS-I3G",

      branchId:
        "BRANCH-I3G",
    };

    const sourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I3G-000001",

        userId:
          "USER-I3G-ADMIN",

        username:
          "branch-admin",

        fullName:
          "Mutable Display Name",

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
      "wrong source branch rejected before sequence reservation",
      () =>
        issueFinoraBranchPortabilityAuthorityPackage({
          target,

          sourceAuthorization: {
            ...sourceAuthorization,

            branchId:
              "WRONG-BRANCH",
          },
        }),
    );

    await expectRejected(
      "invalid credential authorization prefix rejected",
      () =>
        issueFinoraBranchPortabilityAuthorityPackage({
          target,

          sourceAuthorization: {
            ...sourceAuthorization,

            authorizationId:
              "INVALID-AUTHORIZATION-ID",
          },
        }),
    );

    await expectRejected(
      "installation-shaped portability target rejected",
      () =>
        issueFinoraBranchPortabilityAuthorityPackage({
          target: {
            ...target,

            installationId:
              "MUST-NOT-BE-ACCEPTED",
          } as typeof target,

          sourceAuthorization,
        }),
    );

    const signed =
      await issueFinoraBranchPortabilityAuthorityPackage({
        target,
        sourceAuthorization,
      });

    assertTrue(
      signed.sequence ===
        1,
      "Rejected inputs consumed the dedicated branch sequence.",
    );

    assertTrue(
      signed.purpose ===
        "BRANCH_PORTABILITY_AUTHORITY",
      "Signed package purpose is invalid.",
    );

    assertTrue(
      signed.payloadVersion ===
        1,
      "Portability payloadVersion is invalid.",
    );

    assertTrue(
      Object.keys(
        signed.target,
      ).sort().join(
        ",",
      ) ===
        "branchId,businessId,ownerId",
      "Signed portability target contains unexpected fields.",
    );

    assertTrue(
      !(
        "installationId" in
          signed.target
      ),
      "Signed portability target contains installationId.",
    );

    assertTrue(
      signed.payload.sourceAuthorizationId ===
        sourceAuthorization.authorizationId,
      "Portability sourceAuthorizationId does not equal AUTHORIZE_CREDENTIAL authorizationId.",
    );

    assertTrue(
      signed.payload.ownerId ===
        sourceAuthorization.ownerId &&
      signed.payload.businessId ===
        sourceAuthorization.businessId &&
      signed.payload.branchId ===
        sourceAuthorization.branchId,
      "Portability branch scope does not match source authorization.",
    );

    assertTrue(
      signed.payload.userId ===
        sourceAuthorization.userId &&
      signed.payload.username ===
        sourceAuthorization.username &&
      signed.payload.role ===
        sourceAuthorization.role,
      "Portability credential identity does not match source authorization.",
    );

    assertTrue(
      signed.payload.storageMode ===
        sourceAuthorization.storageMode &&
      signed.payload.dataContext ===
        sourceAuthorization.dataContext,
      "Portability storage/data context does not match source authorization.",
    );

    assertTrue(
      signed.payload.sourceAuthorizationMethod ===
        FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
      "Portability source authorization method is invalid.",
    );

    assertTrue(
      !(
        "fullName" in
          signed.payload
      ),
      "Mutable fullName leaked into portability trust payload.",
    );

    console.log(
      "PASS: exact immutable credential lineage mapped into portability payload",
    );

    const verification =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        signed,
        trustedKeys,
        target,
        new Date(
          signed.issuedAt,
        ),
      );

    assertTrue(
      verification.valid,
      verification.valid
        ? ""
        : verification.error,
    );

    assertTrue(
      verification.verifiedTrustedKey.signingKeyId ===
        publicIdentity.signingKeyId,
      "Verifier did not preserve exact matched signer evidence.",
    );

    console.log(
      "PASS: issued branch portability authority verifies with pinned Control Center signer",
    );

    const second =
      await issueFinoraBranchPortabilityAuthorityPackage({
        target,
        sourceAuthorization,
      });

    assertTrue(
      second.sequence ===
        2,
      "Second valid portability issuance did not advance branch sequence.",
    );

    console.log(
      "PASS: dedicated issuer owns monotonic branch sequence reservation",
    );

    const demoTarget = {
      ownerId:
        "OWNER-I3G-DEMO",

      businessId:
        "BUSINESS-I3G-DEMO",

      branchId:
        "BRANCH-I3G-DEMO",
    };

    const demoAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...sourceAuthorization,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I3G-DEMO-000001",

        ownerId:
          demoTarget.ownerId,

        businessId:
          demoTarget.businessId,

        branchId:
          demoTarget.branchId,

        dataContext:
          "DEMO",

        demoId:
          "DEMO-I3G-001",
      };

    const demoSigned =
      await issueFinoraBranchPortabilityAuthorityPackage({
        target:
          demoTarget,

        sourceAuthorization:
          demoAuthorization,
      });

    assertTrue(
      demoSigned.payload.demoId ===
        demoAuthorization.demoId,
      "DEMO lineage did not preserve demoId.",
    );

    console.log(
      "PASS: DEMO lineage requires and preserves exact demoId",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I3G BRANCH PORTABILITY AUTHORITY PAYLOAD + POLICY + ISSUER EXECUTABLE PROOF",
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