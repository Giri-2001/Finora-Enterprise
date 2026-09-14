// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CREDENTIAL ROTATION RECOVERY SELF TEST
//
// CRASH WINDOWS:
//
// 1. PREPARED / predecessor Portable
// 2. PREPARED / replacement Portable (post-CAS, pre-mark)
// 3. PORTABLE_REPLACED
// 4. CONTROL_APPLIED
// 5. COMPLETE history skip
//
// FAIL-CLOSED:
//
// 6. PORTABLE_REPLACED + predecessor rollback
// 7. PORTABLE_REPLACED + missing Portable
// 8. PORTABLE_REPLACED + unexpected valid Portable
// 9. CONTROL_APPLIED + predecessor Control credential
// 10. PREPARED + unexpected Control credential
// 11. duplicate unfinished transaction for same credential
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
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
} from "./finoraPortableBranchAuthCrypto.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  recoverFinoraPortableBranchAuthCredentialRotations,
} from "./finoraPortableBranchAuthCredentialRotationRecoveryService.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionStatus,
  FinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

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

function toControlCredentialVerifier(
  verifier:
    FinoraPortableBranchAuthVerifierV1,
): FinoraControlBranchCredentialVerifierV1 {
  return {
    algorithm:
      "SCRYPT",

    saltEncoding:
      "BASE64",

    salt:
      verifier.salt,

    derivedKeyEncoding:
      "BASE64",

    derivedKey:
      verifier.verifier,

    keyLength:
      32,

    N:
      verifier.N,

    r:
      verifier.r,

    p:
      verifier.p,
  };
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
    "Secure operating-system encryption is unavailable for rotation recovery self-test.",
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

function normalizeExpectedMutationSurfaces(
  current:
    FinoraControlStorePackage,
  baseline:
    FinoraControlStorePackage,
): FinoraControlStorePackage {
  const normalized =
    cloneJson(
      current,
    );

  normalized.branchCredentials =
    cloneJson(
      baseline.branchCredentials,
    );

  normalized.portableBranchAuthCredentialRotationTransactions =
    cloneJson(
      baseline.portableBranchAuthCredentialRotationTransactions,
    );

  normalized.updatedAt =
    baseline.updatedAt;

  return normalized;
}

function createTransaction(
  base:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
  status:
    FinoraPortableBranchAuthCredentialRotationTransactionStatus,
  transactionId:
    string,
): FinoraPortableBranchAuthCredentialRotationTransactionV1 {
  const preparedAt =
    "2020-01-01T00:01:00.000Z";

  const portableAt =
    "2020-01-01T00:02:00.000Z";

  const controlAt =
    "2020-01-01T00:03:00.000Z";

  const completeAt =
    "2020-01-01T00:04:00.000Z";

  if (
    status ===
      "PREPARED"
  ) {
    return {
      ...cloneJson(
        base,
      ),

      transactionId,

      status:
        "PREPARED",

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };
  }

  if (
    status ===
      "PORTABLE_REPLACED"
  ) {
    return {
      ...cloneJson(
        base,
      ),

      transactionId,

      status:
        "PORTABLE_REPLACED",

      createdAt:
        preparedAt,

      portableReplacedAt:
        portableAt,

      updatedAt:
        portableAt,
    };
  }

  if (
    status ===
      "CONTROL_APPLIED"
  ) {
    return {
      ...cloneJson(
        base,
      ),

      transactionId,

      status:
        "CONTROL_APPLIED",

      createdAt:
        preparedAt,

      portableReplacedAt:
        portableAt,

      controlAppliedAt:
        controlAt,

      updatedAt:
        controlAt,
    };
  }

  return {
    ...cloneJson(
      base,
    ),

    transactionId,

    status:
      "COMPLETE",

    createdAt:
      preparedAt,

    portableReplacedAt:
      portableAt,

    controlAppliedAt:
      controlAt,

    completedAt:
      completeAt,

    updatedAt:
      completeAt,
  };
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
          "finora-portable-auth-rotation-recovery-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    process.env.FINORA_DEV_CONTROL_STORE_DIAGNOSTICS =
      "0";

    const emptyResult =
      await readFinoraControlStore();

    assert(
      emptyResult.success &&
      emptyResult.data,
      emptyResult.error ??
        "Unable to create isolated empty Control Store.",
    );


    const emptyStore:
      FinoraControlStorePackage =
      cloneJson(
        emptyResult.data,
      );
    console.log(
      "PASS: isolated recovery userData configured",
    );

    const sourceAuthorizationId =
      "FINORA-SOURCE-AUTH-ROTATION-RECOVERY-000001";

    const credentialId =
      "FINORA-CREDENTIAL-ROTATION-RECOVERY-000001";

    const authStateId =
      "FINORA-PORTABLE-AUTH-STATE-ROTATION-RECOVERY-000001";

    const ownerId =
      "OWNER-ROTATION-RECOVERY-000001";

    const businessId =
      "BUSINESS-ROTATION-RECOVERY-000001";

    const branchId =
      "BRANCH-ROTATION-RECOVERY-000001";

    const userId =
      "USER-ROTATION-RECOVERY-000001";

    const initialAt =
      "2020-01-01T00:00:00.000Z";

    const preparedAt =
      "2020-01-01T00:01:00.000Z";

    const oldPassword =
      "Recovery-Old-Password-123";

    const oldSecurityCode =
      "Recovery-Old-Security-9876";

    const newPassword =
      "Recovery-New-Password-456";

    const newSecurityCode =
      "Recovery-New-Security-6543";

    const evidence =
      createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
        sourceAuthorizationId,
      );

    const expectedMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId,

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        ownerId,

        businessId,

        branchId,

        userId,

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
          initialAt,

        updatedAt:
          initialAt,

        password:
          oldPassword,

        securityCode:
          oldSecurityCode,
      });

    const replacementMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId,

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        ownerId,

        businessId,

        branchId,

        userId,

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
          initialAt,

        updatedAt:
          preparedAt,

        password:
          newPassword,

        securityCode:
          newSecurityCode,
      });

    const unexpectedMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId,

        sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          evidence,

        ownerId,

        businessId,

        branchId,

        userId,

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
          99,

        createdAt:
          initialAt,

        updatedAt:
          preparedAt,

        password:
          "Unexpected-Password-999",

        securityCode:
          "Unexpected-Security-9999",
      });

    const expectedCredential:
      FinoraControlBranchCredential = {
      schemaVersion:
        1,

      credentialId,

      sourceAuthorizationId,

      authGeneration:
        1,

      userId,

      username:
        "admin",

      canonicalUsername:
        "admin",

      fullName:
        "FINORA Admin",

      role:
        "ADMIN",

      ownerId,

      businessId,

      branchId,

      storageMode:
        "LOCAL",

      dataContext:
        "REAL",

      status:
        "ACTIVE",

      verifier:
        toControlCredentialVerifier(
          expectedMaterial.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          expectedMaterial.securityVerifier,
        ),

      createdAt:
        initialAt,

      updatedAt:
        initialAt,
    };

    const replacementCredential:
      FinoraControlBranchCredential = {
      ...cloneJson(
        expectedCredential,
      ),

      authGeneration:
        2,

      verifier:
        toControlCredentialVerifier(
          replacementMaterial.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          replacementMaterial.securityVerifier,
        ),

      updatedAt:
        preparedAt,
    };

    const baseTransaction:
      FinoraPortableBranchAuthCredentialRotationTransactionV1 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId:
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-BASE`,

      sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        cloneJson(
          evidence,
        ),

      credentialId,

      userId,

      canonicalUsername:
        "admin",

      ownerId,

      businessId,

      branchId,

      storageMode:
        "LOCAL",

      dataContext:
        "REAL",

      currentGeneration:
        1,

      targetGeneration:
        2,

      expectedCredential:
        cloneJson(
          expectedCredential,
        ),

      replacementCredential:
        cloneJson(
          replacementCredential,
        ),

      expectedPortableEnvelope:
        cloneJson(
          expectedMaterial.envelope,
        ),

      expectedPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
          expectedMaterial.envelope,
        ),

      replacementPortableEnvelope:
        cloneJson(
          replacementMaterial.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
          replacementMaterial.envelope,
        ),

      status:
        "PREPARED",

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };

    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
      baseTransaction,
    );

    async function seedControlCase(
      transaction:
        FinoraPortableBranchAuthCredentialRotationTransactionV1,
      credential:
        FinoraControlBranchCredential,
      extraTransactions:
        FinoraPortableBranchAuthCredentialRotationTransactionV1[] = [],
    ): Promise<FinoraControlStorePackage> {
      const fixture:
        FinoraControlStorePackage =
        cloneJson(
          emptyStore,
        );

      fixture.branchCredentials = [
        cloneJson(
          credential,
        ),
      ];

      fixture.portableBranchAuthCredentialRotationTransactions = [
        cloneJson(
          transaction,
        ),
        ...cloneJson(
          extraTransactions,
        ),
      ];

      fixture.updatedAt =
        initialAt;

      await writeEncryptedControlFixture(
        temporaryUserData!,
        fixture,
      );

      const readBack =
        await readFinoraControlStore();

      assert(
        readBack.success &&
        readBack.data,
        readBack.error ??
          "Unable to read seeded recovery fixture.",
      );

      return cloneJson(
        readBack.data,
      );
    }

    async function createPortableCase(
      caseName:
        string,
      envelope:
        typeof expectedMaterial.envelope | null,
    ): Promise<{
      store:
        FinoraPortableBranchAuthStore;

      getLocalCalls:
        () => number;

      getUsbCalls:
        () => number;
    }> {
      const safeCaseName =
        caseName.replace(
          /[^A-Za-z0-9._-]+/g,
          "-",
        );

      const root =
        join(
          temporaryUserData!,
          `portable-${safeCaseName}`,
        );

      let localCalls =
        0;

      let usbCalls =
        0;

      const store =
        new FinoraPortableBranchAuthStore({
          resolveLocalRoot:
            () => {
              localCalls +=
                1;

              return root;
            },

          resolveUsbRoot:
            async () => {
              usbCalls +=
                1;

              return null;
            },
        });

      if (envelope) {
        const seedResult =
          await store.ensureExact(
            "LOCAL",
            envelope,
          );

        assert(
          seedResult ===
            "WRITTEN",
          `${caseName}: unable to seed Portable Auth fixture.`,
        );
      }

      localCalls =
        0;

      usbCalls =
        0;

      return {
        store,

        getLocalCalls:
          () =>
            localCalls,

        getUsbCalls:
          () =>
            usbCalls,
      };
    }

    async function assertSuccessfulRecovery(
      label:
        string,
      transaction:
        FinoraPortableBranchAuthCredentialRotationTransactionV1,
      credential:
        FinoraControlBranchCredential,
      portableEnvelope:
        typeof expectedMaterial.envelope,
    ): Promise<void> {
      const baseline =
        await seedControlCase(
          transaction,
          credential,
        );

      const portable =
        await createPortableCase(
          label,
          portableEnvelope,
        );

      const result =
        await recoverFinoraPortableBranchAuthCredentialRotations({
          portableStore:
            portable.store,
        });

      assert(
        result.success &&
        result.data.recoveredCount ===
          1 &&
        result.data.recoveredTransactions[0].transactionId ===
          transaction.transactionId &&
        result.data.recoveredTransactions[0].initialStatus ===
          transaction.status,
        `${label}: recovery did not report one completed transaction.`,
      );

      const finalRead =
        await readFinoraControlStore();

      assert(
        finalRead.success &&
        finalRead.data,
        finalRead.error ??
          `${label}: unable to read recovered Control Store.`,
      );

      const finalCredential =
        finalRead.data.branchCredentials?.find(
          (item) =>
            item.credentialId ===
              credentialId,
        );

      const finalTransaction =
        finalRead.data.portableBranchAuthCredentialRotationTransactions?.find(
          (item) =>
            item.transactionId ===
              transaction.transactionId,
        );

      assert(
        finalCredential !==
          undefined &&
        jsonEqual(
          finalCredential,
          replacementCredential,
        ),
        `${label}: replacement credential was not authoritative after recovery.`,
      );

      assert(
        finalTransaction !==
          undefined &&
        finalTransaction.status ===
          "COMPLETE",
        `${label}: transaction did not reach COMPLETE.`,
      );

      const finalEnvelope =
        await portable.store.read(
          "LOCAL",
        );

      assert(
        finalEnvelope !==
          null &&
        jsonEqual(
          finalEnvelope,
          replacementMaterial.envelope,
        ),
        `${label}: Portable Auth did not converge to replacement.`,
      );

      const normalized =
        normalizeExpectedMutationSurfaces(
          finalRead.data,
          baseline,
        );

      assert(
        jsonEqual(
          normalized,
          baseline,
        ),
        `${label}: unrelated Control Store state changed.`,
      );

      assert(
        portable.getUsbCalls() ===
          0,
        `${label}: LOCAL recovery consulted USB resolver.`,
      );

      console.log(
        `PASS: ${label}`,
      );
    }

    async function assertFailedRecovery(
      label:
        string,
      expectedCode:
        string,
      transaction:
        FinoraPortableBranchAuthCredentialRotationTransactionV1,
      credential:
        FinoraControlBranchCredential,
      portableEnvelope:
        typeof expectedMaterial.envelope | null,
    ): Promise<void> {
      const baseline =
        await seedControlCase(
          transaction,
          credential,
        );

      const portable =
        await createPortableCase(
          label,
          portableEnvelope,
        );

      const result =
        await recoverFinoraPortableBranchAuthCredentialRotations({
          portableStore:
            portable.store,
        });

      assert(
        !result.success &&
        result.errorCode ===
          expectedCode,
        `${label}: expected ${expectedCode}.`,
      );

      const after =
        await readFinoraControlStore();

      assert(
        after.success &&
        after.data &&
        jsonEqual(
          after.data,
          baseline,
        ),
        `${label}: failed recovery mutated Control Store.`,
      );

      assert(
        portable.getUsbCalls() ===
          0,
        `${label}: LOCAL failed recovery consulted USB resolver.`,
      );

      console.log(
        `PASS: ${label}`,
      );
    }

    // ========================================================
    // POSITIVE CRASH WINDOWS
    // ========================================================

    const preparedPreCas =
      createTransaction(
        baseTransaction,
        "PREPARED",
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-PREPARED-PRE-CAS`,
      );

    await assertSuccessfulRecovery(
      "PREPARED predecessor -> CAS -> COMPLETE",
      preparedPreCas,
      expectedCredential,
      expectedMaterial.envelope,
    );

    const preparedPostCas =
      createTransaction(
        baseTransaction,
        "PREPARED",
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-PREPARED-POST-CAS`,
      );

    await assertSuccessfulRecovery(
      "PREPARED post-CAS ALREADY_MATCHED -> COMPLETE",
      preparedPostCas,
      expectedCredential,
      replacementMaterial.envelope,
    );

    const portableReplaced =
      createTransaction(
        baseTransaction,
        "PORTABLE_REPLACED",
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-PORTABLE-REPLACED`,
      );

    await assertSuccessfulRecovery(
      "PORTABLE_REPLACED -> CONTROL_APPLIED -> COMPLETE",
      portableReplaced,
      expectedCredential,
      replacementMaterial.envelope,
    );

    const controlApplied =
      createTransaction(
        baseTransaction,
        "CONTROL_APPLIED",
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-CONTROL-APPLIED`,
      );

    await assertSuccessfulRecovery(
      "CONTROL_APPLIED -> COMPLETE",
      controlApplied,
      replacementCredential,
      replacementMaterial.envelope,
    );

    // ========================================================
    // COMPLETE HISTORY SKIP
    // ========================================================

    const completeTransaction =
      createTransaction(
        baseTransaction,
        "COMPLETE",
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-COMPLETE`,
      );

    const completeBaseline =
      await seedControlCase(
        completeTransaction,
        replacementCredential,
      );

    const completePortable =
      await createPortableCase(
        "complete-skip",
        null,
      );

    const completeResult =
      await recoverFinoraPortableBranchAuthCredentialRotations({
        portableStore:
          completePortable.store,
      });

    assert(
      completeResult.success &&
      completeResult.data.recoveredCount ===
        0,
      "COMPLETE history was not skipped.",
    );

    const completeAfter =
      await readFinoraControlStore();

    assert(
      completeAfter.success &&
      completeAfter.data &&
      jsonEqual(
        completeAfter.data,
        completeBaseline,
      ),
      "COMPLETE history skip mutated Control Store.",
    );

    assert(
      completePortable.getLocalCalls() ===
        0 &&
      completePortable.getUsbCalls() ===
        0,
      "COMPLETE history skip unexpectedly touched Portable Store.",
    );

    console.log(
      "PASS: COMPLETE history skipped without mutation or Portable access",
    );

    // ========================================================
    // NEGATIVE: DURABLE PORTABLE_REPLACED + PREDECESSOR
    // ========================================================

    await assertFailedRecovery(
      "PORTABLE_REPLACED predecessor rollback fails closed",
      "PORTABLE_STATE_MISMATCH",
      portableReplaced,
      expectedCredential,
      expectedMaterial.envelope,
    );

    // ========================================================
    // NEGATIVE: MISSING PORTABLE
    // ========================================================

    await assertFailedRecovery(
      "PORTABLE_REPLACED missing Portable fails closed",
      "PORTABLE_STATE_MISMATCH",
      portableReplaced,
      expectedCredential,
      null,
    );

    // ========================================================
    // NEGATIVE: UNEXPECTED VALID PORTABLE
    // ========================================================

    await assertFailedRecovery(
      "PORTABLE_REPLACED unexpected valid Portable fails closed",
      "PORTABLE_STATE_MISMATCH",
      portableReplaced,
      expectedCredential,
      unexpectedMaterial.envelope,
    );

    // ========================================================
    // NEGATIVE: CONTROL_APPLIED BUT PREDECESSOR CREDENTIAL
    // ========================================================

    await assertFailedRecovery(
      "CONTROL_APPLIED predecessor credential fails closed",
      "CONTROL_STATE_MISMATCH",
      controlApplied,
      expectedCredential,
      replacementMaterial.envelope,
    );

    // ========================================================
    // NEGATIVE: PREPARED BUT CONTROL ALREADY REPLACED
    //
    // PREPARED recovery must establish predecessor Control state
    // before it performs any Portable CAS.
    // ========================================================

    const preparedMismatchBaseline =
      await seedControlCase(
        preparedPreCas,
        replacementCredential,
      );

    const preparedMismatchPortable =
      await createPortableCase(
        "prepared-control-mismatch",
        expectedMaterial.envelope,
      );

    const preparedMismatchResult =
      await recoverFinoraPortableBranchAuthCredentialRotations({
        portableStore:
          preparedMismatchPortable.store,
      });

    assert(
      !preparedMismatchResult.success &&
      preparedMismatchResult.errorCode ===
        "CONTROL_STATE_MISMATCH",
      "PREPARED unexpected Control credential did not fail closed.",
    );

    assert(
      preparedMismatchPortable.getLocalCalls() ===
        0,
      "PREPARED Control mismatch reached Portable CAS before Control proof.",
    );

    const preparedMismatchAfter =
      await readFinoraControlStore();

    assert(
      preparedMismatchAfter.success &&
      preparedMismatchAfter.data &&
      jsonEqual(
        preparedMismatchAfter.data,
        preparedMismatchBaseline,
      ),
      "PREPARED Control mismatch mutated Control Store.",
    );

    console.log(
      "PASS: PREPARED Control mismatch fails before Portable CAS",
    );

    // ========================================================
    // NEGATIVE: DUPLICATE UNFINISHED FOR SAME CREDENTIAL
    //
    // Raw encrypted fixture intentionally injects an impossible
    // state that normal B4.4 preparation prevents.
    // Recovery must independently reject it before Portable I/O.
    // ========================================================

    const duplicateTransaction =
      createTransaction(
        baseTransaction,
        "PREPARED",
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-DUPLICATE`,
      );

    const duplicateFixture:
      FinoraControlStorePackage =
      cloneJson(
          emptyStore,
        );

    duplicateFixture.branchCredentials = [
      cloneJson(
        expectedCredential,
      ),
    ];

    duplicateFixture.portableBranchAuthCredentialRotationTransactions = [
      cloneJson(
        preparedPreCas,
      ),
      cloneJson(
        duplicateTransaction,
      ),
    ];

    duplicateFixture.updatedAt =
      initialAt;

    await writeEncryptedControlFixture(
      temporaryUserData,
      duplicateFixture,
    );

    const duplicatePortable =
      await createPortableCase(
        "duplicate-unfinished",
        expectedMaterial.envelope,
      );

    const duplicateResult =
      await recoverFinoraPortableBranchAuthCredentialRotations({
        portableStore:
          duplicatePortable.store,
      });

    assert(
      !duplicateResult.success &&
      duplicateResult.errorCode ===
        "DURABLE_TRANSACTION_AMBIGUOUS",
      "Duplicate unfinished credential rotation was not rejected.",
    );

    assert(
      duplicatePortable.getLocalCalls() ===
        0 &&
      duplicatePortable.getUsbCalls() ===
        0,
      "Ambiguous recovery touched Portable Store before rejection.",
    );

    console.log(
      "PASS: duplicate unfinished transaction rejected before Portable access",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: D4E4I8-B4.6-C CREDENTIAL ROTATION CRASH-RECOVERY EXECUTABLE MATRIX",
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
        "PASS: isolated recovery self-test root deleted",
      );
    }
  }
}

void runSelfTest().then(
  () => {
    app.exit(
      0,
    );
  },
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

    if (
      app.isReady()
    ) {
      app.exit(
        1,
      );

      return;
    }

    process.exitCode =
      1;
  },
);

// ============================================================
// END
// ============================================================