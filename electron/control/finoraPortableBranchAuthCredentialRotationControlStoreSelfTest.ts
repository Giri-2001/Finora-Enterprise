// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION CONTROL STORE SELF TEST
//
// PROVES:
//
// - PREPARED transaction durability
// - exact PREPARED retry idempotency
// - one unfinished rotation per credential
// - PORTABLE_REPLACED durability/idempotency
// - exact expected credential required
// - replacement credential + CONTROL_APPLIED durability
// - CONTROL_APPLIED retry idempotency
// - COMPLETE durability/idempotency
// - stale expected credential rejected after committed rotation
// - same sourceAuthorizationId may support a later rotation
// ============================================================

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
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import {
  applyFinoraPortableBranchAuthCredentialRotationControlState,
  completeFinoraPortableBranchAuthCredentialRotationTransaction,
  markFinoraPortableBranchAuthCredentialRotationPortableReplaced,
  prepareFinoraPortableBranchAuthCredentialRotationTransaction,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

// ============================================================
// HELPERS
// ============================================================

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function expectSuccess(
  label:
    string,
  result: {
    success:
      boolean;

    error?:
      string;
  },
): void {
  assert(
    result.success,
    result.error ??
      `${label}: expected success.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

function expectFailure(
  label:
    string,
  result: {
    success:
      boolean;
  },
): void {
  assert(
    !result.success,
    `${label}: expected failure.`,
  );

  console.log(
    `PASS: ${label}`,
  );
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

function jsonEqual(
  left:
    unknown,
  right:
    unknown,
): boolean {
  return JSON.stringify(
    left,
  ) ===
    JSON.stringify(
      right,
    );
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
    "Secure operating-system encryption is unavailable for rotation Control Store self-test.",
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

// ============================================================
// MAIN
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryUserData:
    string |
    undefined;

  try {
    assert(
      !app.isReady(),
      "Self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-portable-auth-rotation-control-store-",
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

    const emptyResult =
      await readFinoraControlStore();

    assert(
      emptyResult.success &&
        emptyResult.data,
      emptyResult.error ??
        "Unable to create isolated empty Control Store.",
    );

    const sourceAuthorizationId =
      "FINORA-SOURCE-AUTH-ROTATION-CONTROL-000001";

    const evidence =
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        sourceAuthorizationId,
      );

    const expectedEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "FINORA-ROTATION-CONTROL-AUTH-STATE-000001",

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        ownerId:
          "OWNER-ROTATION-CONTROL-000001",

        businessId:
          "BUSINESS-ROTATION-CONTROL-000001",

        branchId:
          "BRANCH-ROTATION-CONTROL-000001",

        userId:
          "USER-ROTATION-CONTROL-000001",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        authGeneration:
          1,

        createdAt:
          "2026-09-13T03:00:00.000Z",

        updatedAt:
          "2026-09-13T03:00:00.000Z",

        password:
          "Old-Password-123",

        securityCode:
          "Old-Security-Code-9876",
      });

    const replacementEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "FINORA-ROTATION-CONTROL-AUTH-STATE-000001",

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        ownerId:
          "OWNER-ROTATION-CONTROL-000001",

        businessId:
          "BUSINESS-ROTATION-CONTROL-000001",

        branchId:
          "BRANCH-ROTATION-CONTROL-000001",

        userId:
          "USER-ROTATION-CONTROL-000001",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        authGeneration:
          2,

        createdAt:
          "2026-09-13T03:00:00.000Z",

        updatedAt:
          "2026-09-13T03:01:00.000Z",

        password:
          "New-Password-456",

        securityCode:
          "New-Security-Code-6543",
      });

    const thirdEnvelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "FINORA-ROTATION-CONTROL-AUTH-STATE-000001",

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        ownerId:
          "OWNER-ROTATION-CONTROL-000001",

        businessId:
          "BUSINESS-ROTATION-CONTROL-000001",

        branchId:
          "BRANCH-ROTATION-CONTROL-000001",

        userId:
          "USER-ROTATION-CONTROL-000001",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        authGeneration:
          3,

        createdAt:
          "2026-09-13T03:00:00.000Z",

        updatedAt:
          "2026-09-13T03:06:00.000Z",

        password:
          "Third-Password-789",

        securityCode:
          "Third-Security-Code-3210",
      });

    const expectedCredential:
      FinoraControlBranchCredential = {
        schemaVersion:
          1,

        credentialId:
          "FINORA-CREDENTIAL-ROTATION-CONTROL-000001",

        sourceAuthorizationId,

        authGeneration:
          1,

        userId:
          "USER-ROTATION-CONTROL-000001",

        username:
          "admin",

        canonicalUsername:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId:
          "OWNER-ROTATION-CONTROL-000001",

        businessId:
          "BUSINESS-ROTATION-CONTROL-000001",

        branchId:
          "BRANCH-ROTATION-CONTROL-000001",

        storageMode:
          "LOCAL",

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
          "2026-09-13T02:00:00.000Z",

        updatedAt:
          "2026-09-13T02:00:00.000Z",
      };

    const replacementCredential:
      FinoraControlBranchCredential = {
        ...expectedCredential,

        authGeneration:
          2,

        verifier: {
          ...expectedCredential.verifier,

          salt:
            "AgICAgICAgICAgICAgICAg==",

          derivedKey:
            "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=",
        },

        securityVerifier: {
          ...expectedCredential.securityVerifier!,

          salt:
            "AwMDAwMDAwMDAwMDAwMDAw==",

          derivedKey:
            "AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM=",
        },

        updatedAt:
          "2026-09-13T03:01:00.000Z",
      };

    const thirdCredential:
      FinoraControlBranchCredential = {
        ...replacementCredential,

        authGeneration:
          3,

        verifier: {
          ...replacementCredential.verifier,

          salt:
            "BAQEBAQEBAQEBAQEBAQEBA==",

          derivedKey:
            "BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ=",
        },

        updatedAt:
          "2026-09-13T03:06:00.000Z",
      };

    const prepared:
      FinoraPortableBranchAuthCredentialRotationTransactionV1 = {
        schemaVersion:
          FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

        transactionId:
          `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}CONTROL-SELFTEST-000001`,

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        credentialId:
          expectedCredential.credentialId,

        userId:
          expectedCredential.userId,

        canonicalUsername:
          expectedCredential.canonicalUsername,

        ownerId:
          expectedCredential.ownerId,

        businessId:
          expectedCredential.businessId,

        branchId:
          expectedCredential.branchId,

        storageMode:
          expectedCredential.storageMode,

        dataContext:
          expectedCredential.dataContext,

        currentGeneration:
          1,

        targetGeneration:
          2,

        expectedCredential,

        replacementCredential,

        expectedPortableEnvelope:
          expectedEnvelope,

        expectedPortableEnvelopeSha256:
          computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
            expectedEnvelope,
          ),

        replacementPortableEnvelope:
          replacementEnvelope,

        replacementPortableEnvelopeSha256:
          computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
            replacementEnvelope,
          ),

        status:
          "PREPARED",

        createdAt:
          "2026-09-13T03:01:00.000Z",

        updatedAt:
          "2026-09-13T03:01:00.000Z",
      };

    const seededStore:
      FinoraControlStorePackage =
      cloneJson(
        emptyResult.data,
      );

    seededStore.branchCredentials = [
      expectedCredential,
    ];

    seededStore.portableBranchAuthCredentialRotationTransactions =
      [];

    seededStore.updatedAt =
      "2026-09-13T03:00:00.000Z";

    await writeEncryptedControlFixture(
      temporaryUserData,
      seededStore,
    );

    const seededRead =
      await readFinoraControlStore();

    assert(
      seededRead.success &&
        seededRead.data &&
        seededRead.data.branchCredentials?.length ===
          1 &&
        jsonEqual(
          seededRead.data.branchCredentials[0],
          expectedCredential,
        ),
      "Seeded authoritative credential was not readable.",
    );

    console.log(
      "PASS: authoritative generation-1 credential fixture seeded",
    );

    // ========================================================
    // PREPARE
    // ========================================================

    const prepareResult =
      await prepareFinoraPortableBranchAuthCredentialRotationTransaction({
        transaction:
          prepared,
      });

    expectSuccess(
      "PREPARED rotation transaction persisted",
      prepareResult,
    );

    const afterPrepare =
      await readFinoraControlStore();

    assert(
      afterPrepare.success &&
        afterPrepare.data &&
        afterPrepare.data.portableBranchAuthCredentialRotationTransactions?.length ===
          1 &&
        afterPrepare.data.portableBranchAuthCredentialRotationTransactions[0].status ===
          "PREPARED" &&
        jsonEqual(
          afterPrepare.data.branchCredentials?.[0],
          expectedCredential,
        ),
      "PREPARED persistence changed credential or lost journal state.",
    );

    console.log(
      "PASS: PREPARED journal write leaves credential unchanged",
    );

    const prepareRetry =
      await prepareFinoraPortableBranchAuthCredentialRotationTransaction({
        transaction:
          prepared,
      });

    expectSuccess(
      "exact PREPARED retry is idempotent",
      prepareRetry,
    );

    const activeConflict =
      cloneJson(
        prepared,
      );

    activeConflict.transactionId =
      `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}CONTROL-SELFTEST-ACTIVE-CONFLICT`;

    const activeConflictResult =
      await prepareFinoraPortableBranchAuthCredentialRotationTransaction({
        transaction:
          activeConflict,
      });

    expectFailure(
      "second unfinished rotation for same credential rejected",
      activeConflictResult,
    );

    // ========================================================
    // PORTABLE_REPLACED
    // ========================================================

    const portableResult =
      await markFinoraPortableBranchAuthCredentialRotationPortableReplaced({
        transactionId:
          prepared.transactionId,

        transitionedAt:
          "2026-09-13T03:02:00.000Z",
      });

    expectSuccess(
      "PREPARED -> PORTABLE_REPLACED",
      portableResult,
    );

    const portableRetry =
      await markFinoraPortableBranchAuthCredentialRotationPortableReplaced({
        transactionId:
          prepared.transactionId,

        transitionedAt:
          "2026-09-13T03:02:30.000Z",
      });

    expectSuccess(
      "PORTABLE_REPLACED retry is idempotent",
      portableRetry,
    );

    const afterPortable =
      await readFinoraControlStore();

    assert(
      afterPortable.success &&
        afterPortable.data &&
        afterPortable.data.portableBranchAuthCredentialRotationTransactions?.[0].status ===
          "PORTABLE_REPLACED" &&
        jsonEqual(
          afterPortable.data.branchCredentials?.[0],
          expectedCredential,
        ),
      "PORTABLE_REPLACED transition changed credential before Control apply.",
    );

    console.log(
      "PASS: PORTABLE_REPLACED journal persists before credential mutation",
    );

    // ========================================================
    // CONTROL_APPLIED — ATOMIC CREDENTIAL REPLACEMENT
    // ========================================================

    const applyResult =
      await applyFinoraPortableBranchAuthCredentialRotationControlState({
        transactionId:
          prepared.transactionId,

        transitionedAt:
          "2026-09-13T03:03:00.000Z",
      });

    expectSuccess(
      "PORTABLE_REPLACED -> CONTROL_APPLIED",
      applyResult,
    );

    const afterApply =
      await readFinoraControlStore();

    assert(
      afterApply.success &&
        afterApply.data &&
        afterApply.data.portableBranchAuthCredentialRotationTransactions?.[0].status ===
          "CONTROL_APPLIED" &&
        jsonEqual(
          afterApply.data.branchCredentials?.[0],
          replacementCredential,
        ),
      "CONTROL_APPLIED did not persist exact replacement credential + journal state.",
    );

    console.log(
      "PASS: replacement credential + CONTROL_APPLIED state persisted together",
    );

    const applyRetry =
      await applyFinoraPortableBranchAuthCredentialRotationControlState({
        transactionId:
          prepared.transactionId,

        transitionedAt:
          "2026-09-13T03:03:30.000Z",
      });

    expectSuccess(
      "CONTROL_APPLIED retry is idempotent",
      applyRetry,
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    const completeResult =
      await completeFinoraPortableBranchAuthCredentialRotationTransaction({
        transactionId:
          prepared.transactionId,

        transitionedAt:
          "2026-09-13T03:04:00.000Z",
      });

    expectSuccess(
      "CONTROL_APPLIED -> COMPLETE",
      completeResult,
    );

    const completeRetry =
      await completeFinoraPortableBranchAuthCredentialRotationTransaction({
        transactionId:
          prepared.transactionId,

        transitionedAt:
          "2026-09-13T03:04:30.000Z",
      });

    expectSuccess(
      "COMPLETE retry is idempotent",
      completeRetry,
    );

    const afterComplete =
      await readFinoraControlStore();

    assert(
      afterComplete.success &&
        afterComplete.data &&
        afterComplete.data.portableBranchAuthCredentialRotationTransactions?.[0].status ===
          "COMPLETE" &&
        jsonEqual(
          afterComplete.data.branchCredentials?.[0],
          replacementCredential,
        ),
      "COMPLETE state lost replacement credential evidence.",
    );

    console.log(
      "PASS: COMPLETE retains exact generation-2 replacement credential",
    );

    // ========================================================
    // STALE EXPECTED CREDENTIAL AFTER COMMITTED ROTATION
    // ========================================================

    const stalePrepare =
      cloneJson(
        prepared,
      );

    stalePrepare.transactionId =
      `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}CONTROL-SELFTEST-STALE`;

    const staleResult =
      await prepareFinoraPortableBranchAuthCredentialRotationTransaction({
        transaction:
          stalePrepare,
      });

    expectFailure(
      "stale generation-1 expected credential rejected after committed rotation",
      staleResult,
    );

    // ========================================================
    // SAME SOURCE AUTHORIZATION LINEAGE — NEXT ROTATION
    // ========================================================

    const nextRotation:
      FinoraPortableBranchAuthCredentialRotationTransactionV1 = {
        ...cloneJson(
          prepared,
        ),

        transactionId:
          `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}CONTROL-SELFTEST-000002`,

        currentGeneration:
          2,

        targetGeneration:
          3,

        expectedCredential:
          replacementCredential,

        replacementCredential:
          thirdCredential,

        expectedPortableEnvelope:
          replacementEnvelope,

        expectedPortableEnvelopeSha256:
          computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
            replacementEnvelope,
          ),

        replacementPortableEnvelope:
          thirdEnvelope,

        replacementPortableEnvelopeSha256:
          computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
            thirdEnvelope,
          ),

        status:
          "PREPARED",

        createdAt:
          "2026-09-13T03:06:00.000Z",

        updatedAt:
          "2026-09-13T03:06:00.000Z",

        portableReplacedAt:
          undefined,

        controlAppliedAt:
          undefined,

        completedAt:
          undefined,
      };

    delete nextRotation.portableReplacedAt;
    delete nextRotation.controlAppliedAt;
    delete nextRotation.completedAt;

    const nextRotationResult =
      await prepareFinoraPortableBranchAuthCredentialRotationTransaction({
        transaction:
          nextRotation,
      });

    expectSuccess(
      "same sourceAuthorizationId reused for later generation-2 -> 3 rotation",
      nextRotationResult,
    );

    const finalRead =
      await readFinoraControlStore();

    assert(
      finalRead.success &&
        finalRead.data &&
        finalRead.data.portableBranchAuthCredentialRotationTransactions?.length ===
          2 &&
        finalRead.data.portableBranchAuthCredentialRotationTransactions[0].status ===
          "COMPLETE" &&
        finalRead.data.portableBranchAuthCredentialRotationTransactions[1].status ===
          "PREPARED" &&
        finalRead.data.portableBranchAuthCredentialRotationTransactions[0].sourceAuthorizationId ===
          sourceAuthorizationId &&
        finalRead.data.portableBranchAuthCredentialRotationTransactions[1].sourceAuthorizationId ===
          sourceAuthorizationId,
      "Same immutable credential lineage was not preserved across rotations.",
    );

    console.log(
      "PASS: multiple rotation transactions preserve same immutable sourceAuthorizationId lineage",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I8-B4.4-B2 ATOMIC CREDENTIAL ROTATION CONTROL STORE EXECUTABLE PROOF",
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
        "PASS: isolated rotation Control Store root deleted",
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