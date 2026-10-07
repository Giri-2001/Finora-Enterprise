// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH V2 CREDENTIAL ROTATION RECOVERY SELF TEST
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
  FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
} from "./finoraPortableBranchAuthContract.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";
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
  createFinoraPortableBranchAuthEnrollmentMaterialV2,
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
} from "./finoraPortableBranchAuthV2Crypto.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  recoverFinoraPortableBranchAuthCredentialRotationsV2,
} from "./finoraPortableBranchAuthCredentialRotationRecoveryServiceV2.js";

import {
  rotateFinoraPortableBranchAuthCredentialV2,
} from "./finoraPortableBranchAuthCredentialRotationCoordinatorV2.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";

import type {
  FinoraPortableBranchAuthV2CredentialRotationTransactionStatus,
  FinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";

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

  normalized.portableBranchAuthV2CredentialRotationTransactions =
    cloneJson(
      baseline.portableBranchAuthV2CredentialRotationTransactions,
    );

  normalized.updatedAt =
    baseline.updatedAt;

  return normalized;
}

function createTransaction(
  base:
    FinoraPortableBranchAuthCredentialRotationTransactionV2,
  status:
    FinoraPortableBranchAuthV2CredentialRotationTransactionStatus,
  transactionId:
    string,
): FinoraPortableBranchAuthCredentialRotationTransactionV2 {
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

    const branchCertificationKeyMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          initialAt,
        ),
      );
    const expectedMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV2({

        payload: {
          schemaVersion:
            FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

          authStateId:
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

          canonicalUsername:
            "admin",

          branchCertificationKeyMaterial:
            structuredClone(
              branchCertificationKeyMaterial,
            ),
        },

        password:
          oldPassword,

        securityCode:
          oldSecurityCode,
      });

    const replacementMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV2({

        payload: {
          schemaVersion:
            FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

          authStateId:
            "FINORA-PORTABLE-AUTH-STATE-ROTATION-RECOVERY-000002",

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

          canonicalUsername:
            "admin",

          branchCertificationKeyMaterial:
            structuredClone(
              branchCertificationKeyMaterial,
            ),
        },

        password:
          newPassword,

        securityCode:
          newSecurityCode,
      });

    const unexpectedMaterial =
      await createFinoraPortableBranchAuthEnrollmentMaterialV2({

        payload: {
          schemaVersion:
            FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

          authStateId:
            "FINORA-PORTABLE-AUTH-STATE-ROTATION-RECOVERY-000099",

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

          canonicalUsername:
            "admin",

          branchCertificationKeyMaterial:
            structuredClone(
              branchCertificationKeyMaterial,
            ),
        },

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
      FinoraPortableBranchAuthCredentialRotationTransactionV2 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId:
        `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-BASE`,

      rotationRequestId:
        "ROTATION-REQUEST-RECOVERY-BASE-000001",

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
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          expectedMaterial.envelope,
        ),

      replacementPortableEnvelope:
        cloneJson(
          replacementMaterial.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          replacementMaterial.envelope,
        ),

      status:
        "PREPARED",

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };

    validateFinoraPortableBranchAuthCredentialRotationTransactionV2(
      baseTransaction,
    );

    async function seedControlCase(
      transaction:
        FinoraPortableBranchAuthCredentialRotationTransactionV2,
      credential:
        FinoraControlBranchCredential,
      extraTransactions:
        FinoraPortableBranchAuthCredentialRotationTransactionV2[] = [],
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

      fixture.portableBranchAuthV2CredentialRotationTransactions = [
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
        FinoraPortableBranchAuthV2Store;

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
        new FinoraPortableBranchAuthV2Store({
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
        FinoraPortableBranchAuthCredentialRotationTransactionV2,
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
        await recoverFinoraPortableBranchAuthCredentialRotationsV2({
          portableStore:
            portable.store,
        });

      assert(
        result.success &&
        result.data.recoveredCount ===
          1 &&
        result.data.recoveredTransactions.length ===
          1 &&
        result.data.recoveredTransactions[0].transactionId ===
          transaction.transactionId &&
        result.data.recoveredTransactions[0].initialStatus ===
          transaction.status &&
        result.data.recoveredTransactions[0].completed ===
          true,
        `${label}: passwordless V2 recovery did not complete the exact durable transaction.`,
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
        finalRead.data.portableBranchAuthV2CredentialRotationTransactions?.find(
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
        FinoraPortableBranchAuthCredentialRotationTransactionV2,
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
        await recoverFinoraPortableBranchAuthCredentialRotationsV2({
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
    // LIVE NORMAL ROTATION LINEAGE REGRESSION
    //
    // This exercises the production V2 rotation path from an
    // authoritative generation-1 Control credential + Portable
    // envelope. It specifically guards the encrypted Portable
    // payload authGeneration / updatedAt synchronization contract.
    // ========================================================

    {
      const liveFixture:
        FinoraControlStorePackage =
        cloneJson(
          emptyStore,
        );

      liveFixture.branchCredentials = [
        cloneJson(
          expectedCredential,
        ),
      ];

      liveFixture.portableBranchAuthV2CredentialRotationTransactions =
        [];

      liveFixture.updatedAt =
        initialAt;

      await writeEncryptedControlFixture(
        temporaryUserData!,
        liveFixture,
      );

      const livePortable =
        await createPortableCase(
          "live-normal-rotation-lineage",
          expectedMaterial.envelope,
        );

      const liveRotationResult =
        await rotateFinoraPortableBranchAuthCredentialV2({
          request: {
            rotationRequestId:
              "ROTATION-REQUEST-LIVE-LINEAGE-000001",

            username:
              "admin",

            currentPassword:
              oldPassword,

            currentSecurityCode:
              oldSecurityCode,

            newPassword,
            newSecurityCode,
          },

          portableStore:
            livePortable.store,
        });

      assert(
        liveRotationResult.success,
        liveRotationResult.success
          ? "Unexpected live rotation assertion state."
          : liveRotationResult.error,
      );

      assert(
        liveRotationResult.data.authGeneration ===
          2,
        "Live V2 rotation did not advance authGeneration exactly once.",
      );

      assert(
        liveRotationResult.data.credential.authGeneration ===
          2,
        "Live V2 replacement Control credential has the wrong authGeneration.",
      );

      assert(
        liveRotationResult.data.credential.createdAt ===
          initialAt,
        "Live V2 rotation changed immutable credential createdAt.",
      );

      const liveEnvelope =
        await livePortable.store.read(
          "LOCAL",
        );

      assert(
        liveEnvelope !==
          null,
        "Live V2 rotation did not persist successor Portable Auth.",
      );

      const livePasswordPayload =
        await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
          liveEnvelope,
          newPassword,
        );

      const liveRecoveryPayload =
        await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
          liveEnvelope,
          newSecurityCode,
        );

      assert(
        jsonEqual(
          livePasswordPayload,
          liveRecoveryPayload,
        ),
        "Successor Password and Security Code did not decrypt the same Portable payload.",
      );

      assert(
        livePasswordPayload.authGeneration ===
          liveRotationResult.data.authGeneration,
        "Portable successor authGeneration does not match coordinator result.",
      );

      assert(
        livePasswordPayload.authGeneration ===
          liveRotationResult.data.credential.authGeneration,
        "Portable successor authGeneration does not match Control credential.",
      );

      assert(
        livePasswordPayload.updatedAt ===
          liveRotationResult.data.credential.updatedAt,
        "Portable successor updatedAt does not match Control credential.",
      );

      assert(
        livePasswordPayload.createdAt ===
          initialAt,
        "Portable successor changed immutable createdAt.",
      );

      let predecessorPasswordRejected =
        false;

      try {
        await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
          liveEnvelope,
          oldPassword,
        );
      }
      catch {
        predecessorPasswordRejected =
          true;
      }

      assert(
        predecessorPasswordRejected,
        "Predecessor Password still decrypts successor Portable Auth.",
      );

      const liveControlAfter =
        await readFinoraControlStore();

      assert(
        liveControlAfter.success &&
        liveControlAfter.data,
        liveControlAfter.error ??
          "Unable to read Control Store after live V2 rotation.",
      );

      const liveAuthoritativeCredential =
        liveControlAfter.data.branchCredentials?.find(
          (credential) =>
            credential.credentialId ===
              credentialId,
        );

      assert(
        liveAuthoritativeCredential !==
          undefined,
        "Live V2 rotation lost authoritative Control credential.",
      );

      assert(
        liveAuthoritativeCredential.authGeneration ===
          livePasswordPayload.authGeneration &&
        liveAuthoritativeCredential.updatedAt ===
          livePasswordPayload.updatedAt,
        "Control Store and Portable V2 lineage diverged after live rotation.",
      );

      assert(
        livePortable.getUsbCalls() ===
          0,
        "LOCAL live V2 rotation unexpectedly consulted USB resolver.",
      );

      console.log(
        "PASS: live V2 rotation kept Portable payload generation/timestamp synchronized with Control credential",
      );

      console.log(
        "PASS: successor Password/Security Code converge on one payload and predecessor Password is stale",
      );
    }


    // ========================================================
    // POSITIVE CRASH WINDOWS
    // ========================================================

    const preparedPreCas =
      createTransaction(
        baseTransaction,
        "PREPARED",
        `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-PREPARED-PRE-CAS`,
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
        `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-PREPARED-POST-CAS`,
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
        `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-PORTABLE-REPLACED`,
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
        `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}RECOVERY-CONTROL-APPLIED`,
      );

    await assertSuccessfulRecovery(
      "CONTROL_APPLIED -> COMPLETE",
      controlApplied,
      replacementCredential,
      replacementMaterial.envelope,
    );

    // ========================================================
    // PRODUCTION ENTRYPOINT PRE-AUTH RECOVERY
    //
    // Simulate a crash after CONTROL_APPLIED:
    //
    // - Control Store already contains replacement credential.
    // - Portable Auth already contains replacement envelope.
    // - durable journal is still CONTROL_APPLIED.
    //
    // Retry arrives with predecessor Password.
    //
    // Required ordering:
    //
    // 1. passwordless durable recovery completes transaction
    // 2. only then predecessor Password authentication runs
    // 3. predecessor Password is rejected as stale
    //
    // Therefore INVALID_CREDENTIALS is expected, but journal
    // MUST already be COMPLETE before that result is returned.
    // ========================================================

    const coordinatorControlApplied =
      {
        ...createTransaction(
          baseTransaction,
          "CONTROL_APPLIED",
          `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}COORDINATOR-PREAUTH-CONTROL-APPLIED`,
        ),

        rotationRequestId:
          "ROTATION-REQUEST-COORDINATOR-RETRY-000001",
      };

    await seedControlCase(
      coordinatorControlApplied,
      replacementCredential,
    );

    const coordinatorPortable =
      await createPortableCase(
        "coordinator-preauth-control-applied",
        replacementMaterial.envelope,
      );

    const coordinatorRetryResult =
      await rotateFinoraPortableBranchAuthCredentialV2({
        request: {
          rotationRequestId:
            "ROTATION-REQUEST-COORDINATOR-RETRY-000001",

          username:
            "admin",

          currentPassword:
            oldPassword,

          currentSecurityCode:
            oldSecurityCode,

          newPassword:
            newPassword,

          newSecurityCode:
            newSecurityCode,
        },

        portableStore:
          coordinatorPortable.store,
      });

    assert(
      coordinatorRetryResult.success ===
        true,
      coordinatorRetryResult.success
        ? "Unexpected idempotent-success assertion state."
        : coordinatorRetryResult.error,
    );

    assert(
      coordinatorRetryResult.data.transactionId ===
        coordinatorControlApplied.transactionId,
      "Idempotent retry did not return the recovered frozen transactionId.",
    );

    assert(
      coordinatorRetryResult.data.authGeneration ===
        coordinatorControlApplied.targetGeneration,
      "Idempotent retry returned the wrong target generation.",
    );

    assert(
      jsonEqual(
        coordinatorRetryResult.data.credential,
        replacementCredential,
      ),
      "Idempotent retry did not return the frozen replacement credential.",
    );

    assert(
      coordinatorRetryResult.data.portableReplaceResult ===
        "ALREADY_MATCHED",
      "Idempotent retry did not report ALREADY_MATCHED.",
    );

    const coordinatorAfter =
      await readFinoraControlStore();

    assert(
      coordinatorAfter.success &&
      coordinatorAfter.data,
      coordinatorAfter.error ??
        "Unable to read Control Store after coordinator pre-auth recovery.",
    );

    const recoveredCoordinatorTransaction =
      coordinatorAfter.data
        .portableBranchAuthV2CredentialRotationTransactions
        ?.find(
          (transaction) =>
            transaction.transactionId ===
              coordinatorControlApplied.transactionId,
        );

    assert(
      recoveredCoordinatorTransaction?.status ===
        "COMPLETE",
      "Production V2 rotation entrypoint did not complete CONTROL_APPLIED transaction before Password authentication.",
    );

    const authoritativeCredential =
      coordinatorAfter.data.branchCredentials?.find(
        (credential) =>
          credential.credentialId ===
            credentialId,
      );

    assert(
      authoritativeCredential !==
        undefined &&
      jsonEqual(
        authoritativeCredential,
        replacementCredential,
      ),
      "Production pre-auth recovery did not preserve replacement credential authority.",
    );

    const coordinatorPortableAfter =
      await coordinatorPortable.store.read(
        "LOCAL",
      );

    assert(
      coordinatorPortableAfter !==
        null &&
      jsonEqual(
        coordinatorPortableAfter,
        replacementMaterial.envelope,
      ),
      "Production pre-auth recovery changed the authoritative replacement Portable Auth envelope.",
    );

    assert(
      coordinatorPortable.getUsbCalls() ===
        0,
      "LOCAL production pre-auth recovery consulted USB resolver.",
    );

    console.log(
      "PASS: production V2 coordinator returned idempotent success for exact recovered rotationRequestId",
    );

    console.log(
      "PASS: exact recovered retry bypassed stale predecessor Password authentication safely",
    );

    // ========================================================
    // DIFFERENT REQUEST ID MUST NOT RECEIVE IDEMPOTENT SUCCESS
    // ========================================================

    const differentIdControlApplied =
      {
        ...createTransaction(
          baseTransaction,
          "CONTROL_APPLIED",
          `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}COORDINATOR-DIFFERENT-REQUEST-ID`,
        ),

        rotationRequestId:
          "ROTATION-REQUEST-ORIGINAL-000002",
      };

    await seedControlCase(
      differentIdControlApplied,
      replacementCredential,
    );

    const differentIdPortable =
      await createPortableCase(
        "coordinator-different-request-id",
        replacementMaterial.envelope,
      );

    const differentIdRetry =
      await rotateFinoraPortableBranchAuthCredentialV2({
        request: {
          rotationRequestId:
            "ROTATION-REQUEST-DIFFERENT-000003",

          username:
            "admin",

          currentPassword:
            oldPassword,

          currentSecurityCode:
            oldSecurityCode,

          newPassword:
            newPassword,

          newSecurityCode:
            newSecurityCode,
        },

        portableStore:
          differentIdPortable.store,
      });

    assert(
      differentIdRetry.success ===
        false &&
      differentIdRetry.errorCode ===
        "INVALID_CREDENTIALS",
      differentIdRetry.success
        ? "Different rotationRequestId incorrectly received idempotent success."
        : `Different request ID returned ${differentIdRetry.errorCode} instead of INVALID_CREDENTIALS.`,
    );

    const differentIdAfter =
      await readFinoraControlStore();

    assert(
      differentIdAfter.success &&
      differentIdAfter.data,
      differentIdAfter.error ??
        "Unable to read Control Store after different-request-id recovery.",
    );

    const differentIdRecoveredTransaction =
      differentIdAfter.data
        .portableBranchAuthV2CredentialRotationTransactions
        ?.find(
          (transaction) =>
            transaction.transactionId ===
              differentIdControlApplied.transactionId,
        );

    assert(
      differentIdRecoveredTransaction?.status ===
        "COMPLETE",
      "Different-request-id case did not complete durable recovery before authentication failure.",
    );

    console.log(
      "PASS: different rotationRequestId did not inherit recovered idempotent success",
    );

    console.log(
      "PASS: different request recovered durable state then rejected stale Password",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: V2 CREDENTIAL ROTATION CORE CRASH-RECOVERY MATRIX",
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









