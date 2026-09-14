import {
  app,
} from "electron";

import {
  Buffer,
} from "node:buffer";

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
  FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES,
} from "../control/finoraBranchCredentialEnrollmentBundleFileContract.js";

import {
  parseFinoraBranchCredentialEnrollmentBundleFileBytes,
} from "../control/finoraBranchCredentialEnrollmentBundleImportFileTransport.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundleIssuer.js";

import {
  serializeFinoraBranchCredentialEnrollmentBundleFile,
} from "./finoraBranchCredentialEnrollmentBundleFileTransport.js";

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

function expectThrows(
  label:
    string,

  operation:
    () => unknown,
): void {

  let failed =
    false;

  try {
    operation();
  } catch {
    failed =
      true;
  }

  assertTrue(
    failed,
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
        "finora-enrollment-file-transport-",
      ),
    );

  try {
    app.setPath(
      "userData",
      isolatedUserData,
    );

    await app.whenReady();

    const target = {
      ownerId:
        "OWNER-I4D",

      businessId:
        "BUSINESS-I4D",

      branchId:
        "BRANCH-I4D",

      installationId:
        "INSTALLATION-I4D",

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
          "FINORA-CREDENTIAL-ENROLLMENT-I4D-000001",

        userId:
          "USER-I4D",

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

    const bundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,
        sourceAuthorization,
      });

    const serialized =
      serializeFinoraBranchCredentialEnrollmentBundleFile(
        bundle,
      );

    assertTrue(
      serialized.bytes >
        0 &&
      serialized.bytes <=
        FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES,
      "Serialized file size is outside the transport boundary.",
    );

    assertTrue(
      serialized.bytes ===
        Buffer.byteLength(
          serialized.content,
          "utf8",
        ),
      "Serialized byte count is incorrect.",
    );

    console.log(
      "PASS: valid signed two-child bundle serialized within bounded .finora size",
    );

    const parsed =
      parseFinoraBranchCredentialEnrollmentBundleFileBytes(
        Buffer.from(
          serialized.content,
          "utf8",
        ),
      );

    assertTrue(
      parsed.branchAccessPackage.packageId ===
        bundle.branchAccessPackage.packageId &&
      parsed.branchPortabilityAuthorityPackage.packageId ===
        bundle.branchPortabilityAuthorityPackage.packageId,
      "Round-trip changed signed child package identities.",
    );

    assertTrue(
      (
        parsed.branchAccessPackage.payload
          .credentialEnrollment as
            Record<string, unknown>
      ).authorizationId ===
        parsed.branchPortabilityAuthorityPackage.payload
          .sourceAuthorizationId,
      "Round-trip changed authorization lineage.",
    );

    console.log(
      "PASS: strict UTF-8/JSON import preserves exact signed child composition",
    );

    expectThrows(
      "invalid UTF-8 rejected",
      () =>
        parseFinoraBranchCredentialEnrollmentBundleFileBytes(
          Uint8Array.from(
            [
              0xc3,
              0x28,
            ],
          ),
        ),
    );

    expectThrows(
      "invalid JSON rejected",
      () =>
        parseFinoraBranchCredentialEnrollmentBundleFileBytes(
          Buffer.from(
            "{invalid-json",
            "utf8",
          ),
        ),
    );

    const altered =
      JSON.parse(
        serialized.content,
      ) as
        Record<string, unknown>;

    altered.outerSigner =
      "MUST-NOT-BE-TRUSTED";

    expectThrows(
      "extra unsigned outer authority field rejected",
      () =>
        parseFinoraBranchCredentialEnrollmentBundleFileBytes(
          Buffer.from(
            JSON.stringify(
              altered,
            ),
            "utf8",
          ),
        ),
    );

    expectThrows(
      "oversized artifact rejected before parsing",
      () =>
        parseFinoraBranchCredentialEnrollmentBundleFileBytes(
          new Uint8Array(
            FINORA_BRANCH_CREDENTIAL_ENROLLMENT_BUNDLE_MAX_FILE_BYTES +
              1,
          ),
        ),
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I4D CREDENTIAL ENROLLMENT FILE TRANSPORT EXECUTABLE PROOF",
    );

  } finally {
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