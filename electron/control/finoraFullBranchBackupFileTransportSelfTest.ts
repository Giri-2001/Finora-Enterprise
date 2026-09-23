// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V3 NATIVE EXPORTER SELF-TEST
// ============================================================

import assert from "node:assert/strict";

import type {
  BrowserWindow,
} from "electron";

import {
  parseFinoraFullBranchBackupFileV3,
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

function makeUsbAuthBackupSuccess(
  backupId:
    string,
) {
  return {
    success:
      true as const,

    data: {
      backupId,

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
        3,

      backupFile: {
        portableAuthEnvelopeSerialized:
          JSON.stringify({
            portable:
              "encrypted-auth-envelope",
          }),
      },
    },
  };
}

function makeRuntimeAuthorityFixture() {
  return {
    payload: {
      ownerId:
        "OWNER-A",

      businessId:
        "BUSINESS-A",

      branchId:
        "BRANCH-A",

      storageMode:
        "USB",

      dataContext:
        "REAL",

      demoId:
        null,

      authGeneration:
        3,

      portableAuthFingerprint:
        "a".repeat(
          64,
        ),
    },
  } as never;
}

function runtimeSecurityOverrides() {
  return {
    parsePortableAuth:
      () =>
        ({} as never),

    decryptPortableAuth:
      async () =>
        ({
          dataContext:
            "REAL",

          storageMode:
            "USB",

          authGeneration:
            3,

          branchCertificationKeyMaterial:
            {},
        } as never),

    createPortableAuthFingerprint:
      () =>
        "a".repeat(
          64,
        ),

    toBranchCertificationPublicKey:
      () =>
        ({} as never),

    verifyRuntimeAuthorityPackage:
      () =>
        true,
  };
}

export async function runFinoraFullBranchBackupFileTransportSelfTest():
  Promise<void> {
  let writtenPath =
    "";

  let writtenContent =
    "";

  let readPath =
    "";

  let runtimeReadMode =
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

        ...runtimeSecurityOverrides(),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readRuntimeAuthority:
          async (
            storageMode,
          ) => {
            runtimeReadMode =
              storageMode;

            return makeRuntimeAuthorityFixture();
          },

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

  assert.equal(
    runtimeReadMode,
    "USB",
  );

  assert.ok(
    writtenContent.length >
      0,
  );

  const parsed =
    parseFinoraFullBranchBackupFileV3(
      writtenContent,
    );

  assert.equal(
    parsed.format,
    "FINORA_FULL_BRANCH_BACKUP",
  );

  assert.equal(
    parsed.schemaVersion,
    3,
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

  assert.equal(
    parsed.encryptedRuntimeAuthority.purpose,
    "RUNTIME_AUTHORITY",
  );

  console.log(
    "PASS: native exporter writes Full V3 artifact with encrypted signed Runtime Authority",
  );

  console.log(
    "PASS: source read path is exact FINORA USB storage file",
  );

  let missingRuntimeWriteCalled =
    false;

  const missingRuntime =
    await exportFinoraFullBranchBackupFromNativeDialog(
      parentWindow,
      input,
      portableStore,
      {
        ...runtimeSecurityOverrides(),

        createAuthBackup:
          async () =>
            makeUsbAuthBackupSuccess(
              "FULL-P2B2-RUNTIME-MISSING",
            ),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readTextFile:
          async () =>
            makeStoragePackage(),

        readRuntimeAuthority:
          async () =>
            null,

        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\Backups\\runtime-missing.finora",
          }),

        writeTextFile:
          async () => {
            missingRuntimeWriteCalled =
              true;
          },
      },
    );

  assert.equal(
    missingRuntime.success,
    false,
  );

  assert.equal(
    missingRuntimeWriteCalled,
    false,
  );

  console.log(
    "PASS: missing Runtime Authority fails closed without backup write",
  );

  let invalidRuntimeSignatureWriteCalled =
    false;

  const invalidRuntimeSignature =
    await exportFinoraFullBranchBackupFromNativeDialog(
      parentWindow,
      input,
      portableStore,
      {
        ...runtimeSecurityOverrides(),

        createAuthBackup:
          async () =>
            makeUsbAuthBackupSuccess(
              "FULL-P2B2-RUNTIME-SIGNATURE",
            ),

        resolveUsbRoot:
          async () =>
            "X:\\",

        readTextFile:
          async () =>
            makeStoragePackage(),

        readRuntimeAuthority:
          async () =>
            makeRuntimeAuthorityFixture(),

        verifyRuntimeAuthorityPackage:
          () =>
            false,

        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\Backups\\runtime-signature-invalid.finora",
          }),

        writeTextFile:
          async () => {
            invalidRuntimeSignatureWriteCalled =
              true;
          },
      },
    );

  assert.equal(
    invalidRuntimeSignature.success,
    false,
  );

  assert.equal(
    invalidRuntimeSignatureWriteCalled,
    false,
  );

  console.log(
    "PASS: invalid Runtime Authority signature fails closed without backup write",
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