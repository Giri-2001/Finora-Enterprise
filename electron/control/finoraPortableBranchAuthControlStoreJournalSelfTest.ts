// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CONTROL STORE JOURNAL SELF-TEST
// VERSION : 1.0
// STATUS  : Executable Proof
// ============================================================

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  dirname,
  join,
} from "node:path";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthEnvelopeSha256,
  validateFinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import type {
  FinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

// ============================================================
// HELPERS
// ============================================================

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

function cloneJson<T>(
  value:
    T,
): T {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as T;
}

async function encryptControlFixture(
  plainText:
    string,
): Promise<Buffer> {
  if (
    await safeStorage.isAsyncEncryptionAvailable()
  ) {
    return safeStorage.encryptStringAsync(
      plainText,
    );
  }

  if (
    safeStorage.isEncryptionAvailable()
  ) {
    return safeStorage.encryptString(
      plainText,
    );
  }

  throw new Error(
    "Secure operating-system encryption is unavailable for journal self-test.",
  );
}

async function writeEncryptedControlFixture(
  userDataRoot:
    string,
  value:
    unknown,
): Promise<void> {
  const controlFile =
    join(
      userDataRoot,
      "FINORA",
      "control",
      "finora-control.bin",
    );

  await mkdir(
    dirname(
      controlFile,
    ),
    {
      recursive:
        true,
      mode:
        0o700,
    },
  );

  const encrypted =
    await encryptControlFixture(
      JSON.stringify(
        value,
      ),
    );

  await writeFile(
    controlFile,
    encrypted,
    {
      mode:
        0o600,
    },
  );
}

async function expectControlStoreValidationFailure(
  label:
    string,
): Promise<void> {
  const result =
    await readFinoraControlStore();

  assertTrue(
    !result.success,
    `${label}: expected Control Store validation failure.`,
  );

  assertTrue(
    result.error ===
      "FINORA Control Store package validation failed.",
    `${label}: unexpected failure message: ${result.error ?? "NONE"}`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

// ============================================================
// MAIN
// ============================================================

async function runSelfTest(): Promise<void> {
  let temporaryUserData:
    string |
    undefined;

  try {
    assertTrue(
      !app.isReady(),
      "Self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-portable-auth-journal-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    process.env.FINORA_DEV_CONTROL_STORE_DIAGNOSTICS =
      "0";

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // ========================================================
    // EMPTY STORE DEFAULT
    // ========================================================

    const emptyResult =
      await readFinoraControlStore();

    assertTrue(
      emptyResult.success &&
        emptyResult.data !== undefined,
      emptyResult.error ??
        "Unable to obtain empty Control Store.",
    );

    assertTrue(
      Array.isArray(
        emptyResult.data.portableBranchAuthEnrollmentTransactions,
      ) &&
        emptyResult.data.portableBranchAuthEnrollmentTransactions.length ===
          0,
      "Empty Control Store did not initialize Portable Auth journal.",
    );

    console.log(
      "PASS: empty Control Store initializes durable journal",
    );

    // ========================================================
    // VALID PREPARED TRANSACTION
    // ========================================================

    const envelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "PORTABLE-JOURNAL-AUTH-STATE-000001",

        sourceAuthorizationId:
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
          ),

        ownerId:
          "OWNER-JOURNAL-000001",

        businessId:
          "BUSINESS-JOURNAL-000001",

        branchId:
          "BRANCH-JOURNAL-000001",

        userId:
          "USER-JOURNAL-000001",

        username:
          "Admin",

        fullName:
          "FINORA Journal Test Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "USB",

        authGeneration:
          1,

        createdAt:
          "2026-09-11T12:00:00.000Z",

        updatedAt:
          "2026-09-11T12:00:01.000Z",

        password:
          "admin123",

        securityCode:
          "branch-sec-9876",
      });

    const credential:
      FinoraControlBranchCredential =
      {
        schemaVersion:
          1,

        credentialId:
          "FINORA-CREDENTIAL-JOURNAL-000001",

        sourceAuthorizationId:
          "AUTHORIZATION-JOURNAL-000001",

        userId:
          "USER-JOURNAL-000001",

        username:
          "Admin",

        canonicalUsername:
          "admin",

        fullName:
          "FINORA Journal Test Admin",

        role:
          "ADMIN",

        ownerId:
          "OWNER-JOURNAL-000001",

        businessId:
          "BUSINESS-JOURNAL-000001",

        branchId:
          "BRANCH-JOURNAL-000001",

        storageMode:
          "USB",

        dataContext:
          "REAL",

        status:
          "ACTIVE",

        verifier: {
          algorithm:
            "SCRYPT",

          saltEncoding:
            "BASE64",

          salt:
            "AAAAAAAAAAAAAAAAAAAAAA==",

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",

          keyLength:
            32,

          N:
            32768,

          r:
            8,

          p:
            1,
        },

        securityVerifier: {
          algorithm:
            "SCRYPT",

          saltEncoding:
            "BASE64",

          salt:
            "AQEBAQEBAQEBAQEBAQEBAQ==",

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",

          keyLength:
            32,

          N:
            32768,

          r:
            8,

          p:
            1,
        },

        createdAt:
          "2026-09-11T12:00:02.000Z",

        updatedAt:
          "2026-09-11T12:00:02.000Z",
      };

    const transaction:
      FinoraPortableBranchAuthEnrollmentTransactionV1 =
      {
        schemaVersion:
          FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,

        transactionId:
          `${FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX}000001`,

        sourceAuthorizationId:
          credential.sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            credential.sourceAuthorizationId,
          ),

        canonicalUsername:
          credential.canonicalUsername,

        ownerId:
          credential.ownerId,

        businessId:
          credential.businessId,

        branchId:
          credential.branchId,

        storageMode:
          credential.storageMode,

        status:
          "PREPARED",

        credential,

        portableEnvelope:
          envelope,

        portableEnvelopeSha256:
          computeFinoraPortableBranchAuthEnvelopeSha256(
            envelope,
          ),

        createdAt:
          "2026-09-11T12:00:02.000Z",

        updatedAt:
          "2026-09-11T12:00:02.000Z",
      };

    validateFinoraPortableBranchAuthEnrollmentTransactionV1(
      transaction,
    );

    const validPackage:
      FinoraControlStorePackage =
      {
        ...emptyResult.data,

        portableBranchAuthEnrollmentTransactions: [
          transaction,
        ],

        updatedAt:
          "2026-09-11T12:00:02.000Z",
      };

    await writeEncryptedControlFixture(
      temporaryUserData,
      validPackage,
    );

    const validRead =
      await readFinoraControlStore();

    assertTrue(
      validRead.success &&
        validRead.data !== undefined,
      validRead.error ??
        "Valid journal failed encrypted Control Store read.",
    );

    assertTrue(
      validRead.data
        .portableBranchAuthEnrollmentTransactions
        ?.length ===
        1 &&
        validRead.data
          .portableBranchAuthEnrollmentTransactions[
            0
          ].transactionId ===
          transaction.transactionId,
      "Valid durable journal did not survive encrypted roundtrip.",
    );

    console.log(
      "PASS: valid durable journal survives encrypted Control Store roundtrip",
    );

    // ========================================================
    // EXTRA FIELD
    // ========================================================

    const extraFieldPackage =
      cloneJson(
        validPackage,
      ) as unknown as
        Record<string, unknown>;

    const extraJournal =
      (
        extraFieldPackage
          .portableBranchAuthEnrollmentTransactions as
            Array<Record<string, unknown>>
      );

    extraJournal[0].unexpectedField =
      "NOT_ALLOWED";

    await writeEncryptedControlFixture(
      temporaryUserData,
      extraFieldPackage,
    );

    await expectControlStoreValidationFailure(
      "journal transaction with extra field fails closed",
    );

    // ========================================================
    // ENVELOPE DIGEST TAMPER
    // ========================================================

    const digestTampered =
      cloneJson(
        validPackage,
      );

    digestTampered
      .portableBranchAuthEnrollmentTransactions![
        0
      ].portableEnvelopeSha256 =
        "0".repeat(
          64,
        );

    await writeEncryptedControlFixture(
      temporaryUserData,
      digestTampered,
    );

    await expectControlStoreValidationFailure(
      "journal envelope digest tamper fails closed",
    );

    // ========================================================
    // SECOND INDIVIDUALLY VALID TRANSACTION
    // ========================================================

    const secondTransaction =
      cloneJson(
        transaction,
      );

    secondTransaction.transactionId =
      `${FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX}000002`;

    secondTransaction.sourceAuthorizationId =
      "AUTHORIZATION-JOURNAL-000002";

    secondTransaction.credential.credentialId =
      "FINORA-CREDENTIAL-JOURNAL-000002";

    secondTransaction.credential.sourceAuthorizationId =
      secondTransaction.sourceAuthorizationId;

    secondTransaction.sourceAuthorizationVerificationEvidence =
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        secondTransaction.sourceAuthorizationId,
      );

    validateFinoraPortableBranchAuthEnrollmentTransactionV1(
      secondTransaction,
    );

    // ========================================================
    // DUPLICATE TRANSACTION ID
    // ========================================================

    const duplicateTransactionIdPackage =
      cloneJson(
        validPackage,
      );

    const duplicateTransactionIdEntry =
      cloneJson(
        secondTransaction,
      );

    duplicateTransactionIdEntry.transactionId =
      transaction.transactionId;

    duplicateTransactionIdPackage
      .portableBranchAuthEnrollmentTransactions =
      [
        cloneJson(
          transaction,
        ),
        duplicateTransactionIdEntry,
      ];

    await writeEncryptedControlFixture(
      temporaryUserData,
      duplicateTransactionIdPackage,
    );

    await expectControlStoreValidationFailure(
      "duplicate journal transactionId fails closed",
    );

    // ========================================================
    // DUPLICATE SOURCE AUTHORIZATION ID
    // ========================================================

    const duplicateAuthorizationPackage =
      cloneJson(
        validPackage,
      );

    const duplicateAuthorizationEntry =
      cloneJson(
        secondTransaction,
      );

    duplicateAuthorizationEntry.sourceAuthorizationId =
      transaction.sourceAuthorizationId;

    duplicateAuthorizationEntry.credential.sourceAuthorizationId =
      transaction.sourceAuthorizationId;

    duplicateAuthorizationEntry.sourceAuthorizationVerificationEvidence =
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        duplicateAuthorizationEntry.sourceAuthorizationId,
      );

    validateFinoraPortableBranchAuthEnrollmentTransactionV1(
      duplicateAuthorizationEntry,
    );

    duplicateAuthorizationPackage
      .portableBranchAuthEnrollmentTransactions =
      [
        cloneJson(
          transaction,
        ),
        duplicateAuthorizationEntry,
      ];

    await writeEncryptedControlFixture(
      temporaryUserData,
      duplicateAuthorizationPackage,
    );

    await expectControlStoreValidationFailure(
      "duplicate journal sourceAuthorizationId fails closed",
    );

    // ========================================================
    // JOURNAL MUST BE ARRAY
    // ========================================================

    const nonArrayJournal =
      cloneJson(
        validPackage,
      ) as unknown as
        Record<string, unknown>;

    nonArrayJournal.portableBranchAuthEnrollmentTransactions =
      {
        invalid:
          true,
      };

    await writeEncryptedControlFixture(
      temporaryUserData,
      nonArrayJournal,
    );

    await expectControlStoreValidationFailure(
      "non-array durable journal fails closed",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: PHASE 5.6E3D3D1C2 ENCRYPTED CONTROL STORE JOURNAL EXECUTABLE PROOF",
    );
  }
  finally {
    if (
      temporaryUserData !==
        undefined
    ) {
      await rm(
        temporaryUserData,
        {
          recursive:
            true,
          force:
            true,
        },
      );

      console.log(
        "PASS: isolated journal self-test userData deleted",
      );
    }

    if (
      app.isReady()
    ) {
      app.quit();
    }
  }
}

void runSelfTest().catch(
  (
    error,
  ) => {
    console.error(
      "",
    );

    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;

    if (
      app.isReady()
    ) {
      app.quit();
    }
  },
);

// ============================================================
// END
// ============================================================