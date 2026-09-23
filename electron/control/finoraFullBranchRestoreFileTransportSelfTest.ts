// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V3
// NATIVE RESTORE TRANSPORT SELF-TEST
// ============================================================
//
// No real file dialog.
// No Control Store write.
// No removable-drive write.
// ============================================================

import assert from "node:assert/strict";

import type {
  BrowserWindow,
} from "electron";

import type {
  FinoraFullBranchBackupFileV3,
} from "./finoraFullBranchBackupContract.js";

import {
  createFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  calculateFinoraFullBranchExactRealDigest,
} from "./finoraFullBranchRestoreStoragePlan.js";

import type {
  FinoraFullBranchRestoreArtifactResult,
} from "./finoraFullBranchRestoreArtifactCoordinator.js";

import type {
  FinoraFullBranchRestoreTransactionDependencies,
} from "./finoraFullBranchRestoreTransaction.js";

import {
  restoreFinoraFullBranchFromNativeBackup,
} from "./finoraFullBranchRestoreFileTransport.js";

const scope = {
  ownerId:
    "OWNER-A",

  businessId:
    "BUSINESS-A",

  branchId:
    "BRANCH-A",
};

const credentials = {
  username:
    "owner",

  password:
    "Password-123",

  securityCode:
    "Security-456",
};

const snapshot =
  createFinoraFullBranchRealSnapshotV1({
    exportedAt:
      "2026-09-23T12:00:00.000Z",

    branchScope:
      scope,

    records: [
      {
        id:
          "CUSTOMER-1",

        entity:
          "CUSTOMER",

        data: {
          customerId:
            "CUSTOMER-1",
        },

        createdAt:
          "2026-09-23T10:00:00.000Z",

        updatedAt:
          "2026-09-23T11:00:00.000Z",

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,
      },
    ],
  });

const digest =
  calculateFinoraFullBranchExactRealDigest(
    snapshot.records as never[],
    scope,
  );

const parsedBackup =
  {
    backupId:
      "FULL-P3C1-B2-001",

    createdAt:
      "2026-09-23T12:00:00.000Z",

    branchScope:
      scope,

    sourceStorageMode:
      "USB",

    authGeneration:
      2,
  } as unknown as FinoraFullBranchBackupFileV3;

const artifactSuccess:
  FinoraFullBranchRestoreArtifactResult =
  {
    success:
      true,

    data: {
      backupId:
        "FULL-P3C1-B2-001",

      createdAt:
        "2026-09-23T12:00:00.000Z",

      branchScope:
        scope,

      storageMode:
        "USB",

      authGeneration:
        2,

      portableAuthEnvelopeSerialized:
        "RESTORED-PORTABLE-AUTH",

      runtimeAuthorityPackageSerialized:
        "RESTORED-RUNTIME-AUTHORITY",

      snapshot,

      snapshotRecordCount:
        1,

      exactRealDigestSha256:
        digest,
    },
  };

const fakeWindow =
  {
    isDestroyed:
      () =>
        false,
  } as unknown as BrowserWindow;

function credentialSuccess(
  overrides: {
    storageMode?:
      "LOCAL" | "USB";

    dataContext?:
      "REAL" | "DEMO";

    authGeneration?:
      number;

    branchId?:
      string;
  } = {},
) {
  return {
    success:
      true as const,

    data: {
      credentialId:
        "CREDENTIAL-1",

      authGeneration:
        overrides.authGeneration ??
        2,

      userId:
        "USER-1",

      username:
        "owner",

      fullName:
        "Owner",

      role:
        "ADMIN" as const,

      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        overrides.branchId ??
        scope.branchId,

      storageMode:
        overrides.storageMode ??
        "USB",

      dataContext:
        overrides.dataContext ??
        "REAL",

      authenticatedAt:
        "2026-09-23T12:00:00.000Z",
    },
  };
}

function dummyTransactionDependencies():
  FinoraFullBranchRestoreTransactionDependencies {
  return {
    captureTargetStorage:
      async () => ({
        records:
          [],

        rollbackToken:
          null,
      }),

    writeTargetStorageRecords:
      async () =>
        undefined,

    readTargetStorageRecords:
      async () =>
        [],

    rollbackTargetStorage:
      async () =>
        undefined,

    readTargetPortableAuth:
      async () =>
        null,

    writeTargetPortableAuth:
      async () =>
        undefined,

    rollbackTargetPortableAuth:
      async () =>
        undefined,
  };
}

function baseDependencies(
  overrides: Record<string, unknown> = {},
) {
  return {
    parentWindow:
      fakeWindow,

    resolveLocalRoot:
      () =>
        "C:\\FINORA-LOCAL-UNUSED",

    validateUsbRoot:
      async () =>
        true,

    selectBackupFile:
      async () =>
        "C:\\Downloads\\backup.finora",

    readBackupFile:
      async () =>
        "FULL-V2-SELFTEST",

    parseFullBackup:
      () =>
        parsedBackup,

    authenticateCredential:
      async () =>
        credentialSuccess(),

    prepareArtifact:
      async () =>
        artifactSuccess,

    selectUsbTargetRoot:
      async () => ({
        success:
          true as const,

        cancelled:
          false as const,

        root:
          "R:\\",
      }),

    createTransactionDependencies:
      () =>
        dummyTransactionDependencies(),

    executeTransaction:
      async () => ({
        success:
          true as const,

        data: {
          authGeneration:
            2,

          snapshotRecordCount:
            1,

          removedExistingExactRealCount:
            0,

          preservedRecordCount:
            0,

          finalRecordCount:
            1,

          exactRealDigestSha256:
            digest,
        },
      }),

    ...overrides,
  };
}

export async function runFinoraFullBranchRestoreFileTransportSelfTest():
  Promise<void> {
  // ========================================================
  // HAPPY PATH
  // ========================================================

  let selectedTarget:
    string |
    null =
    null;

  let transactionCalled =
    false;

  const success =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        createTransactionDependencies:
          (
            root:
              string,
          ) => {
            selectedTarget =
              root;

            return dummyTransactionDependencies();
          },

        executeTransaction:
          async (
            material:
              unknown,
          ) => {
            transactionCalled =
              true;

            const candidate =
              material as {
                snapshotRecordCount:
                  number;

                exactRealDigestSha256:
                  string;

                storageMode:
                  string;

                runtimeAuthorityPackageSerialized:
                  string;
              };

            assert.equal(
              candidate.snapshotRecordCount,
              1,
            );

            assert.equal(
              candidate.exactRealDigestSha256,
              digest,
            );

            assert.equal(
              candidate.storageMode,
              "USB",
            );

            assert.equal(
              candidate.runtimeAuthorityPackageSerialized,
              "RESTORED-RUNTIME-AUTHORITY",
            );

            return {
              success:
                true as const,

              data: {
                authGeneration:
                  2,

                snapshotRecordCount:
                  1,

                removedExistingExactRealCount:
                  0,

                preservedRecordCount:
                  0,

                finalRecordCount:
                  1,

                exactRealDigestSha256:
                  digest,
              },
            };
          },
      }),
    );

  assert.equal(
    success.success,
    true,
  );

  assert.equal(
    success.cancelled,
    false,
  );

  if (
    success.success &&
    !success.cancelled
  ) {
    assert.equal(
      success.data.backupId,
      "FULL-P3C1-B2-001",
    );

    assert.equal(
      success.data.fileName,
      "backup.finora",
    );

    assert.equal(
      success.data.storageMode,
      "USB",
    );

    assert.equal(
      success.data.authGeneration,
      2,
    );
  }

  assert.equal(
    selectedTarget,
    "R:\\",
  );

  assert.equal(
    transactionCalled,
    true,
  );

  console.log(
    "PASS: Full V3 native transport authenticates, selects pinned target and executes transaction",
  );

  // ========================================================
  // 13 MiB FILE — PROVES OLD AUTH-ONLY BOUND IS NOT USED
  // ========================================================

  const largeSerialized =
    "X".repeat(
      13 * 1024 * 1024,
    );

  let largeParseSeen =
    false;

  const largeResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        readBackupFile:
          async () =>
            largeSerialized,

        parseFullBackup:
          (
            serialized:
              string,
          ) => {
            assert.equal(
              serialized.length,
              largeSerialized.length,
            );

            largeParseSeen =
              true;

            return parsedBackup;
          },
      }),
    );

  assert.equal(
    largeResult.success,
    true,
  );

  assert.equal(
    largeParseSeen,
    true,
  );

  console.log(
    "PASS: Full V3 transport accepts a 13 MiB backup under the 256 MiB bound",
  );

  // ========================================================
  // HISTORICAL RUNTIME-LESS FULL V2 REJECT
  // ========================================================

  let runtimeLessV2ParseCalled =
    false;

  const runtimeLessV2Result =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        readBackupFile:
          async () =>
            JSON.stringify({
              format:
                "FINORA_FULL_BRANCH_BACKUP",

              schemaVersion:
                2,

              backupId:
                "LEGACY-RUNTIME-LESS-V2",

              createdAt:
                "2026-01-01T00:00:00.000Z",

              branchScope: {
                ownerId:
                  "OWNER-A",

                businessId:
                  "BUSINESS-A",

                branchId:
                  "BRANCH-A",
              },

              dataContext:
                "REAL",

              sourceStorageMode:
                "USB",

              authGeneration:
                1,

              portableAuthEnvelopeSerialized:
                "LEGACY-PORTABLE-AUTH",

              portableAuthEnvelopeSha256:
                "A".repeat(
                  64,
                ),

              realSnapshot: {},
            }),

        parseFullBackup:
          () => {
            runtimeLessV2ParseCalled =
              true;

            throw new Error(
              "Runtime-less V2 must be rejected before V3 parsing.",
            );
          },
      }),
    );

  assert.equal(
    runtimeLessV2Result.success,
    false,
  );

  assert.equal(
    runtimeLessV2ParseCalled,
    false,
  );

  if (
    !runtimeLessV2Result.success
  ) {
    assert.equal(
      runtimeLessV2Result.errorCode,
      "BACKUP_FILE_INVALID",
    );

    assert.match(
      runtimeLessV2Result.error,
      /legacy\/incomplete backup.*Runtime Authority/i,
    );
  }

  console.log(
    "PASS: historical Runtime-less Full V2 is explicitly rejected before V3 transport parsing",
  );

  // ========================================================
  // LEGACY V1 / NON-FULL FORMAT REJECT
  // ========================================================

  const legacyResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        readBackupFile:
          async () =>
            JSON.stringify({
              format:
                "FINORA_PORTABLE_BRANCH_AUTH_BACKUP",

              schemaVersion:
                1,
            }),

        parseFullBackup:
          () => {
            throw new Error(
              "Not Full V3.",
            );
          },
      }),
    );

  assert.equal(
    legacyResult.success,
    false,
  );

  if (
    !legacyResult.success
  ) {
    assert.equal(
      legacyResult.errorCode,
      "BACKUP_FILE_INVALID",
    );
  }

  console.log(
    "PASS: legacy auth-only backup is rejected before target selection",
  );

  // ========================================================
  // WRONG CREDENTIALS — NO TARGET SELECTION
  // ========================================================

  let targetRequestedAfterBadCredential =
    false;

  const badCredential =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        authenticateCredential:
          async () => ({
            success:
              false as const,

            errorCode:
              "INVALID_CREDENTIALS" as const,

            error:
              "Invalid username or password.",
          }),

        selectUsbTargetRoot:
          async () => {
            targetRequestedAfterBadCredential =
              true;

            return {
              success:
                true as const,

              cancelled:
                false as const,

              root:
                "R:\\",
            };
          },
      }),
    );

  assert.equal(
    badCredential.success,
    false,
  );

  if (
    !badCredential.success
  ) {
    assert.equal(
      badCredential.errorCode,
      "CREDENTIAL_AUTHENTICATION_FAILED",
    );
  }

  assert.equal(
    targetRequestedAfterBadCredential,
    false,
  );

  console.log(
    "PASS: invalid Username/Password fails before target USB selection",
  );

  // ========================================================
  // DEMO REJECT
  // ========================================================

  const demoResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        authenticateCredential:
          async () =>
            credentialSuccess({
              dataContext:
                "DEMO",
            }),
      }),
    );

  assert.equal(
    demoResult.success,
    false,
  );

  if (
    !demoResult.success
  ) {
    assert.equal(
      demoResult.errorCode,
      "STORAGE_MODE_MISMATCH",
    );
  }

  console.log(
    "PASS: DEMO authority is rejected from Full Branch Restore",
  );

  // ========================================================
  // LOCAL REJECT
  // ========================================================

  const localResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        authenticateCredential:
          async () =>
            credentialSuccess({
              storageMode:
                "LOCAL",
            }),
      }),
    );

  assert.equal(
    localResult.success,
    false,
  );

  if (
    !localResult.success
  ) {
    assert.equal(
      localResult.errorCode,
      "STORAGE_MODE_MISMATCH",
    );
  }

  console.log(
    "PASS: LOCAL branch cannot enter the USB Full Restore transaction",
  );

  // ========================================================
  // SCOPE MISMATCH
  // ========================================================

  const scopeResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        authenticateCredential:
          async () =>
            credentialSuccess({
              branchId:
                "BRANCH-B",
            }),
      }),
    );

  assert.equal(
    scopeResult.success,
    false,
  );

  if (
    !scopeResult.success
  ) {
    assert.equal(
      scopeResult.errorCode,
      "SCOPE_MISMATCH",
    );
  }

  console.log(
    "PASS: current Branch Credential scope mismatch fails closed",
  );

  // ========================================================
  // STALE / FUTURE GENERATION
  // ========================================================

  const staleResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        authenticateCredential:
          async () =>
            credentialSuccess({
              authGeneration:
                3,
            }),
      }),
    );

  assert.equal(
    staleResult.success,
    false,
  );

  if (
    !staleResult.success
  ) {
    assert.equal(
      staleResult.errorCode,
      "STALE_BACKUP",
    );
  }

  const futureResult =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        authenticateCredential:
          async () =>
            credentialSuccess({
              authGeneration:
                1,
            }),
      }),
    );

  assert.equal(
    futureResult.success,
    false,
  );

  if (
    !futureResult.success
  ) {
    assert.equal(
      futureResult.errorCode,
      "FUTURE_BACKUP",
    );
  }

  console.log(
    "PASS: stale and future authGeneration restore artifacts fail closed",
  );

  // ========================================================
  // SECURITY CODE / ARTIFACT AUTH FAILURE
  // ========================================================

  const authFailure:
    FinoraFullBranchRestoreArtifactResult =
    {
      success:
        false,

      errorCode:
        "PORTABLE_AUTH_AUTHENTICATION_FAILED",

      error:
        "Invalid Full Backup authentication.",
    };

  let targetRequestedAfterArtifactFailure =
    false;

  const artifactFailure =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        prepareArtifact:
          async () =>
            authFailure,

        selectUsbTargetRoot:
          async () => {
            targetRequestedAfterArtifactFailure =
              true;

            return {
              success:
                true as const,

              cancelled:
                false as const,

              root:
                "R:\\",
            };
          },
      }),
    );

  assert.equal(
    artifactFailure.success,
    false,
  );

  if (
    !artifactFailure.success
  ) {
    assert.equal(
      artifactFailure.errorCode,
      "BACKUP_AUTHENTICATION_FAILED",
    );
  }

  assert.equal(
    targetRequestedAfterArtifactFailure,
    false,
  );

  console.log(
    "PASS: Security Code / encrypted artifact authentication failure occurs before target mutation",
  );

  // ========================================================
  // TARGET CANCEL
  // ========================================================

  let transactionAfterCancel =
    false;

  const cancelled =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        selectUsbTargetRoot:
          async () => ({
            success:
              true as const,

            cancelled:
              true as const,

            root:
              null,
          }),

        executeTransaction:
          async () => {
            transactionAfterCancel =
              true;

            throw new Error(
              "Must not execute.",
            );
          },
      }),
    );

  assert.equal(
    cancelled.success,
    true,
  );

  assert.equal(
    cancelled.cancelled,
    true,
  );

  assert.equal(
    transactionAfterCancel,
    false,
  );

  console.log(
    "PASS: target USB cancellation exits without transaction execution",
  );

  // ========================================================
  // TRANSACTION FAILURE MAPPING
  // ========================================================

  const runtimeWriteFailure =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        executeTransaction:
          async () => ({
            success:
              false as const,

            errorCode:
              "TARGET_RUNTIME_AUTHORITY_WRITE_FAILED" as const,

            error:
              "Runtime Authority write failure.",
          }),
      }),
    );

  assert.equal(
    runtimeWriteFailure.success,
    false,
  );

  if (
    !runtimeWriteFailure.success
  ) {
    assert.equal(
      runtimeWriteFailure.errorCode,
      "TARGET_WRITE_FAILED",
    );
  }

  console.log(
    "PASS: Runtime Authority write failure maps to target-write failure",
  );

  const runtimeReadbackFailure =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        executeTransaction:
          async () => ({
            success:
              false as const,

            errorCode:
              "TARGET_RUNTIME_AUTHORITY_READBACK_FAILED" as const,

            error:
              "Runtime Authority readback failure.",
          }),
      }),
    );

  assert.equal(
    runtimeReadbackFailure.success,
    false,
  );

  if (
    !runtimeReadbackFailure.success
  ) {
    assert.equal(
      runtimeReadbackFailure.errorCode,
      "TARGET_READBACK_FAILED",
    );
  }

  console.log(
    "PASS: Runtime Authority readback failure maps to target-readback failure",
  );

  const rollbackFailure =
    await restoreFinoraFullBranchFromNativeBackup(
      credentials,
      baseDependencies({
        executeTransaction:
          async () => ({
            success:
              false as const,

            errorCode:
              "ROLLBACK_FAILED" as const,

            error:
              "Rollback failure.",
          }),
      }),
    );

  assert.equal(
    rollbackFailure.success,
    false,
  );

  if (
    !rollbackFailure.success
  ) {
    assert.equal(
      rollbackFailure.errorCode,
      "RESTORE_FAILED",
    );
  }

  console.log(
    "PASS: transaction rollback failure is surfaced as Restore failure",
  );

  console.log(
    "PASS: Full V3 native restore transport self-test complete",
  );
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchRestoreFileTransportSelfTest()
    .catch(
      (
        error:
          unknown,
      ) => {
        console.error(
          error,
        );

        process.exitCode =
          1;
      },
    );
}