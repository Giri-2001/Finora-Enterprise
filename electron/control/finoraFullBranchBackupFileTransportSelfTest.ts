// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2 NATIVE EXPORTER SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import type {
  BrowserWindow,
} from "electron";

import {
  parseFinoraFullBranchBackupFileV2,
} from "./finoraFullBranchBackupContract.js";

import {
  exportFinoraFullBranchBackupFromNativeDialog,
} from "./finoraFullBranchBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

const parentWindow =
  {} as BrowserWindow;

const portableStore =
  {} as Pick<
    FinoraPortableBranchAuthStore,
    "read"
  >;

const input = {
  sessionId:
    "SESSION-P2B2",

  password:
    "BackupPassword-123",

  securityCode:
    "BackupSecurity-456",
};

function makeStoragePackage():
  string {
  return JSON.stringify({
    version:
      "2.0",

    updatedAt:
      "2026-09-23T12:00:00.000Z",

    records: [
      {
        id:
          "CUSTOMER-1",

        entity:
          "CUSTOMER",

        data: {
          id:
            "CUSTOMER-1",
        },

        createdAt:
          "2026-09-23T10:00:00.000Z",

        updatedAt:
          "2026-09-23T11:00:00.000Z",

        ownerId:
          "OWNER-A",

        businessId:
          "BUSINESS-A",

        branchId:
          "BRANCH-A",
      },

      {
        id:
          "LOAN-1",

        entity:
          "LOAN",

        data: {
          id:
            "LOAN-1",
        },

        createdAt:
          "2026-09-23T10:00:00.000Z",

        updatedAt:
          "2026-09-23T11:00:00.000Z",

        ownerId:
          "OWNER-A",

        businessId:
          "BUSINESS-A",

        branchId:
          "BRANCH-A",
      },

      {
        id:
          "SIBLING-1",

        entity:
          "CUSTOMER",

        data: {
          id:
            "SIBLING-1",
        },

        createdAt:
          "2026-09-23T10:00:00.000Z",

        updatedAt:
          "2026-09-23T11:00:00.000Z",

        ownerId:
          "OWNER-A",

        businessId:
          "BUSINESS-A",

        branchId:
          "BRANCH-B",
      },
    ],
  });
}

export async function runFinoraFullBranchBackupFileTransportSelfTest():
  Promise<void> {
  let writtenPath =
    "";

  let writtenContent =
    "";

  let readPath =
    "";

  const result =
    await exportFinoraFullBranchBackupFromNativeDialog(
      parentWindow,
      input,
      portableStore,
      {
        createAuthBackup:
          async () => ({
            success:
              true,

            data: {
              backupId:
                "FULL-P2B2-001",

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
                "USB",

              authGeneration:
                3,

              backupFile: {
                portableAuthEnvelopeSerialized:
                  JSON.stringify({
                    portable:
                      "encrypted-auth-envelope",
                  }),
              },
            },
          }),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readTextFile:
          async (
            path,
          ) => {
            readPath =
              path;

            return makeStoragePackage();
          },

        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\Backups\\branch-copy",
          }),

        writeTextFile:
          async (
            path,
            content,
          ) => {
            writtenPath =
              path;

            writtenContent =
              content;
          },
      },
    );

  assert.equal(
    result.success,
    true,
  );

  assert.equal(
    result.cancelled,
    false,
  );

  assert.equal(
    readPath,
    "X:\\FINORA\\storage\\finora-storage.json",
  );

  assert.equal(
    writtenPath,
    "C:\\Backups\\branch-copy.finora",
  );

  assert.ok(
    writtenContent.length >
      0,
  );

  const parsed =
    parseFinoraFullBranchBackupFileV2(
      writtenContent,
    );

  assert.equal(
    parsed.format,
    "FINORA_FULL_BRANCH_BACKUP",
  );

  assert.equal(
    parsed.schemaVersion,
    2,
  );

  assert.deepEqual(
    parsed.branchScope,
    {
      ownerId:
        "OWNER-A",

      businessId:
        "BUSINESS-A",

      branchId:
        "BRANCH-A",
    },
  );

  console.log(
    "PASS: native exporter writes one Full V2 .finora artifact",
  );

  console.log(
    "PASS: source read path is exact FINORA USB storage file",
  );

  let writeCalled =
    false;

  const missingSource =
    await exportFinoraFullBranchBackupFromNativeDialog(
      parentWindow,
      input,
      portableStore,
      {
        createAuthBackup:
          async () => ({
            success:
              true,

            data: {
              backupId:
                "FULL-P2B2-002",

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
                "USB",

              authGeneration:
                3,

              backupFile: {
                portableAuthEnvelopeSerialized:
                  "{}",
              },
            },
          }),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readTextFile:
          async () => {
            throw new Error(
              "ENOENT",
            );
          },

        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\Backups\\must-not-write.finora",
          }),

        writeTextFile:
          async () => {
            writeCalled =
              true;
          },
      },
    );

  assert.equal(
    missingSource.success,
    false,
  );

  assert.equal(
    writeCalled,
    false,
  );

  console.log(
    "PASS: missing source storage fails closed without backup write",
  );

  let corruptWriteCalled =
    false;

  const corruptSource =
    await exportFinoraFullBranchBackupFromNativeDialog(
      parentWindow,
      input,
      portableStore,
      {
        createAuthBackup:
          async () => ({
            success:
              true,

            data: {
              backupId:
                "FULL-P2B2-003",

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
                "USB",

              authGeneration:
                3,

              backupFile: {
                portableAuthEnvelopeSerialized:
                  "{}",
              },
            },
          }),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readTextFile:
          async () =>
            "{broken-json",

        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\Backups\\must-not-write.finora",
          }),

        writeTextFile:
          async () => {
            corruptWriteCalled =
              true;
          },
      },
    );

  assert.equal(
    corruptSource.success,
    false,
  );

  assert.equal(
    corruptWriteCalled,
    false,
  );

  console.log(
    "PASS: corrupt source storage fails closed without backup write",
  );

  const localSource =
    await exportFinoraFullBranchBackupFromNativeDialog(
      parentWindow,
      input,
      portableStore,
      {
        createAuthBackup:
          async () => ({
            success:
              true,

            data: {
              backupId:
                "FULL-P2B2-004",

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
                "LOCAL",

              authGeneration:
                3,

              backupFile: {
                portableAuthEnvelopeSerialized:
                  "{}",
              },
            },
          }),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readTextFile:
          async () =>
            makeStoragePackage(),

        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\Backups\\must-not-write.finora",
          }),

        writeTextFile:
          async () => {
            throw new Error(
              "LOCAL must not write.",
            );
          },
      },
    );

  assert.equal(
    localSource.success,
    false,
  );

  console.log(
    "PASS: LOCAL branch cannot silently create an auth-only Full Backup",
  );

  console.log(
    "PASS: Full Branch Backup native exporter self-test complete",
  );
}

if (
  require.main ===
    module
) {
  runFinoraFullBranchBackupFileTransportSelfTest()
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