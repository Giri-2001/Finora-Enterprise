// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2 COORDINATOR SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import {
  parseFinoraFullBranchBackupFileV2,
  parseFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  decryptFinoraFullBranchRealSnapshotV2,
} from "./finoraFullBranchBackupCrypto.js";

import {
  createFinoraFullBranchBackup,
} from "./finoraFullBranchBackupCoordinator.js";

import type {
  FinoraFullBranchBackupCoordinatorDependencies,
} from "./finoraFullBranchBackupCoordinator.js";

const request = {
  sessionId:
    "SESSION-SELFTEST",

  password:
    "BackupPassword-123",

  securityCode:
    "BackupSecurity-456",
};

const authority = {
  backupId:
    "FULL-BACKUP-SELFTEST-001",

  createdAt:
    "2026-09-23T12:00:00.000Z",

  branchScope: {
    ownerId:
      "OWNER-A",

    businessId:
      "BUSINESS-A",

    branchId:
      "BRANCH-A",
  },

  sourceStorageMode:
    "USB" as const,

  authGeneration:
    4,

  portableAuthEnvelopeSerialized:
    JSON.stringify({
      encrypted:
        "PORTABLE-AUTH-SELFTEST",
    }),
};

function persistedRecord(
  input: {
    id:
      string;

    entity:
      string;

    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    demoId?:
      string;
  },
): Record<string, unknown> {
  return {
    id:
      input.id,

    entity:
      input.entity,

    data: {
      id:
        input.id,

      entity:
        input.entity,
    },

    createdAt:
      "2026-09-23T10:00:00.000Z",

    updatedAt:
      "2026-09-23T11:00:00.000Z",

    ownerId:
      input.ownerId,

    businessId:
      input.businessId,

    branchId:
      input.branchId,

    ...(
      input.demoId ===
        undefined
        ? {}
        : {
            demoId:
              input.demoId,
          }
    ),
  };
}

function dependencies():
  FinoraFullBranchBackupCoordinatorDependencies {
  return {
    createAuthenticatedBackupAuthority:
      async () => ({
        success:
          true,

        data:
          authority,
      }),

    readRealStorageRecords:
      async (
        input,
      ) => {
        assert.deepEqual(
          input,
          {
            branchScope:
              authority.branchScope,

            storageMode:
              "USB",
          },
        );

        return {
          success:
            true,

          records: [
            persistedRecord({
              id:
                "CUSTOMER-1",

              entity:
                "CUSTOMER",

              ownerId:
                "OWNER-A",

              businessId:
                "BUSINESS-A",

              branchId:
                "BRANCH-A",
            }),

            persistedRecord({
              id:
                "LOAN-1",

              entity:
                "LOAN",

              ownerId:
                "OWNER-A",

              businessId:
                "BUSINESS-A",

              branchId:
                "BRANCH-A",
            }),

            persistedRecord({
              id:
                "SIBLING-BRANCH",

              entity:
                "CUSTOMER",

              ownerId:
                "OWNER-A",

              businessId:
                "BUSINESS-A",

              branchId:
                "BRANCH-B",
            }),

            persistedRecord({
              id:
                "DEMO-1",

              entity:
                "CUSTOMER",

              ownerId:
                "OWNER-A",

              businessId:
                "BUSINESS-A",

              branchId:
                "BRANCH-A",

              demoId:
                "DEMO-SELFTEST",
            }),
          ],
        };
      },
  };
}

export async function runFinoraFullBranchBackupCoordinatorSelfTest():
  Promise<void> {
  const result =
    await createFinoraFullBranchBackup(
      request,
      dependencies(),
    );

  assert.equal(
    result.success,
    true,
  );

  assert.equal(
    result.data.recordCount,
    2,
  );

  const file =
    parseFinoraFullBranchBackupFileV2(
      result.data.serializedBackup,
    );

  assert.equal(
    file.format,
    "FINORA_FULL_BRANCH_BACKUP",
  );

  assert.equal(
    file.schemaVersion,
    2,
  );

  assert.deepEqual(
    file.branchScope,
    authority.branchScope,
  );

  assert.equal(
    file.sourceStorageMode,
    "USB",
  );

  assert.equal(
    file.authGeneration,
    4,
  );

  assert.equal(
    file.portableAuthEnvelopeSerialized,
    authority.portableAuthEnvelopeSerialized,
  );

  console.log(
    "PASS: one Full V2 artifact binds Portable Auth + REAL snapshot",
  );

  const decrypted =
    await decryptFinoraFullBranchRealSnapshotV2({
      encryptedSnapshot:
        file.realSnapshot,

      password:
        request.password,

      securityCode:
        request.securityCode,

      binding: {
        backupId:
          file.backupId,

        createdAt:
          file.createdAt,

        branchScope:
          file.branchScope,

        sourceStorageMode:
          file.sourceStorageMode,

        authGeneration:
          file.authGeneration,
      },
    });

  const snapshot =
    parseFinoraFullBranchRealSnapshotV1(
      decrypted,
    );

  assert.equal(
    snapshot.recordCount,
    2,
  );

  assert.deepEqual(
    snapshot.records.map(
      (
        record:
          unknown,
      ) =>
        (
          record as {
            id:
              string;
          }
        ).id,
    ),
    [
      "CUSTOMER-1",
      "LOAN-1",
    ],
  );

  console.log(
    "PASS: encrypted Full V2 artifact restores exact REAL tenant snapshot",
  );

  assert.equal(
    snapshot.records.some(
      (
        record:
          unknown,
      ) =>
        (
          record as {
            id:
              string;
          }
        ).id ===
          "SIBLING-BRANCH",
    ),
    false,
  );

  assert.equal(
    snapshot.records.some(
      (
        record:
          unknown,
      ) =>
        (
          record as {
            id:
              string;
          }
        ).id ===
          "DEMO-1",
    ),
    false,
  );

  console.log(
    "PASS: sibling tenant + DEMO records absent from Full V2 artifact",
  );

  const authFailure =
    await createFinoraFullBranchBackup(
      request,
      {
        ...dependencies(),

        createAuthenticatedBackupAuthority:
          async () => ({
            success:
              false,

            errorCode:
              "AUTHENTICATION_FAILED",

            error:
              "Authentication failed.",
          }),
      },
    );

  assert.equal(
    authFailure.success,
    false,
  );

  if (
    authFailure.success
  ) {
    throw new Error(
      "Expected auth failure.",
    );
  }

  assert.equal(
    authFailure.errorCode,
    "AUTH_BACKUP_FAILED",
  );

  console.log(
    "PASS: Portable Auth authority failure blocks Full Branch Backup",
  );

  const storageFailure =
    await createFinoraFullBranchBackup(
      request,
      {
        ...dependencies(),

        readRealStorageRecords:
          async () => ({
            success:
              false,

            error:
              "Storage unavailable.",
          }),
      },
    );

  assert.equal(
    storageFailure.success,
    false,
  );

  if (
    storageFailure.success
  ) {
    throw new Error(
      "Expected storage failure.",
    );
  }

  assert.equal(
    storageFailure.errorCode,
    "REAL_STORAGE_READ_FAILED",
  );

  console.log(
    "PASS: REAL storage read failure blocks backup artifact creation",
  );

  const invalid =
    await createFinoraFullBranchBackup(
      {
        sessionId:
          "",
      },
      dependencies(),
    );

  assert.equal(
    invalid.success,
    false,
  );

  if (
    invalid.success
  ) {
    throw new Error(
      "Expected invalid request failure.",
    );
  }

  assert.equal(
    invalid.errorCode,
    "INVALID_REQUEST",
  );

  console.log(
    "PASS: malformed renderer request fails closed",
  );

  console.log(
    "PASS: Full Branch Backup V2 coordinator self-test complete",
  );
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchBackupCoordinatorSelfTest()
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