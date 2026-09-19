// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP FILE TRANSPORT SELF-TEST
// PHASE : 5.6N-N3A
// ============================================================

import type {
  BrowserWindow,
} from "electron";

import {
  exportFinoraPortableBranchAuthBackupFromNativeDialog,
} from "./finoraPortableBranchAuthBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthBackupFileTransportDependencies,
} from "./finoraPortableBranchAuthBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthBackupCreationResult,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

const PASSWORD =
  "Transport-Test-Password";

const SECURITY_CODE =
  "Transport-Test-Security-Code";

const SERIALIZED_BACKUP =
  JSON.stringify({
    format:
      "FINORA_PORTABLE_BRANCH_AUTH_BACKUP",

    schemaVersion:
      1,

    fixture:
      "N3A-PRIVILEGED-BYTES",
  });

const BACKUP_BYTES =
  Buffer.byteLength(
    SERIALIZED_BACKUP,
    "utf8",
  );

const PARENT_WINDOW =
  {} as BrowserWindow;

const PORTABLE_STORE =
  {
    read:
      async () =>
        null,
  } as Pick<
    FinoraPortableBranchAuthStore,
    "read"
  >;

function createSuccessResult(
  bytes:
    number = BACKUP_BYTES,
): FinoraPortableBranchAuthBackupCreationResult {
  return {
    success:
      true,

    data: {
      backupId:
        "FINORA-PBA-BACKUP-N3A-TEST",

      createdAt:
        "2026-09-17T17:30:00.000Z",

      branchScope: {
        ownerId:
          "OWNER-N3A",

        businessId:
          "BUSINESS-N3A",

        branchId:
          "BRANCH-N3A",
      },

      sourceStorageMode:
        "USB",

      authGeneration:
        9,

      backupFile:
        {} as never,

      serializedBackup:
        SERIALIZED_BACKUP,

      bytes,
    },
  };
}

function createDependencies(
  overrides:
    Partial<
      FinoraPortableBranchAuthBackupFileTransportDependencies
    > = {},
): FinoraPortableBranchAuthBackupFileTransportDependencies {
  return {
    createBackup:
      async () =>
        createSuccessResult(),

    showSaveDialog:
      async () => ({
        canceled:
          false,

        filePath:
          "C:\\FINORA-TEST\\Chosen Branch Backup",
      }),

    writeUtf8:
      async () => {
        return;
      },

    ...overrides,
  };
}

async function runSelfTest(): Promise<void> {
  // ==========================================================
  // SUCCESS
  // ==========================================================

  let dialogCalls =
    0;

  let observedDefaultPath =
    "";

  let writtenDestination =
    "";

  let writtenSerialized =
    "";

  const success =
    await exportFinoraPortableBranchAuthBackupFromNativeDialog(
      PARENT_WINDOW,
      {
        sessionId:
          "FINORA-SESSION-N3A",

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      PORTABLE_STORE,
      createDependencies({
        showSaveDialog:
          async (
            _parentWindow,
            options,
          ) => {
            dialogCalls +=
              1;

            observedDefaultPath =
              String(
                options.defaultPath ??
                "",
              );

            return {
              canceled:
                false,

              filePath:
                "C:\\FINORA-TEST\\Chosen Branch Backup",
            };
          },

        writeUtf8:
          async (
            destination,
            serialized,
          ) => {
            writtenDestination =
              destination;

            writtenSerialized =
              serialized;
          },
      }),
    );

  assert(
    success.success &&
    !success.cancelled,
    "Expected native backup export success.",
  );

  assert(
    dialogCalls ===
      1,
    "Native save dialog must be opened exactly once.",
  );

  assert(
    observedDefaultPath ===
      "FINORA-PBA-BACKUP-N3A-TEST.finora",
    "Backup default filename is invalid.",
  );

  assert(
    writtenDestination ===
      "C:\\FINORA-TEST\\Chosen Branch Backup.finora",
    "Native destination did not enforce .finora extension.",
  );

  assert(
    writtenSerialized ===
      SERIALIZED_BACKUP,
    "Native transport changed privileged backup serialization.",
  );

  assert(
    success.data.fileName ===
      "Chosen Branch Backup.finora" &&
    success.data.bytesWritten ===
      BACKUP_BYTES &&
    success.data.backupId ===
      "FINORA-PBA-BACKUP-N3A-TEST" &&
    success.data.sourceStorageMode ===
      "USB" &&
    success.data.authGeneration ===
      9,
    "Backup transport returned incorrect non-secret metadata.",
  );

  const serializedResult =
    JSON.stringify(
      success,
    );

  assert(
    !serializedResult.includes(
      SERIALIZED_BACKUP,
    ) &&
    !serializedResult.includes(
      PASSWORD,
    ) &&
    !serializedResult.includes(
      SECURITY_CODE,
    ) &&
    !serializedResult.includes(
      "C:\\FINORA-TEST",
    ),
    "Public transport result leaked privileged backup bytes, credentials or filesystem path.",
  );

  console.log(
    "PASS: native backup export writes exact privileged serializedBackup bytes to native-selected .finora destination",
  );

  console.log(
    "PASS: backup export success returns basename and non-secret metadata only",
  );

  // ==========================================================
  // CANCELLED
  // ==========================================================

  let cancelledWrites =
    0;

  const cancelled =
    await exportFinoraPortableBranchAuthBackupFromNativeDialog(
      PARENT_WINDOW,
      {
        sessionId:
          "FINORA-SESSION-N3A",

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      PORTABLE_STORE,
      createDependencies({
        showSaveDialog:
          async () => ({
            canceled:
              true,
          }),

        writeUtf8:
          async () => {
            cancelledWrites +=
              1;
          },
      }),
    );

  assert(
    cancelled.success &&
    cancelled.cancelled &&
    cancelled.data ===
      null &&
    cancelledWrites ===
      0,
    "Cancelled native export performed a write.",
  );

  console.log(
    "PASS: native save cancellation performs zero filesystem write",
  );

  // ==========================================================
  // COORDINATOR FAILURE BEFORE DIALOG
  // ==========================================================

  let deniedDialogCalls =
    0;

  const denied =
    await exportFinoraPortableBranchAuthBackupFromNativeDialog(
      PARENT_WINDOW,
      {
        sessionId:
          "INVALID-SESSION",

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      PORTABLE_STORE,
      createDependencies({
        createBackup:
          async () => ({
            success:
              false,

            errorCode:
              "SESSION_DENIED",

            error:
              "An authenticated FINORA branch session is required.",
          }),

        showSaveDialog:
          async () => {
            deniedDialogCalls +=
              1;

            return {
              canceled:
                true,
            };
          },
      }),
    );

  assert(
    !denied.success &&
    denied.errorCode ===
      "SESSION_DENIED" &&
    deniedDialogCalls ===
      0,
    "Backup coordinator failure reached native save dialog.",
  );

  console.log(
    "PASS: backup authentication/session failure stops before native save dialog",
  );

  // ==========================================================
  // BYTE MISMATCH BEFORE DIALOG
  // ==========================================================

  let mismatchDialogCalls =
    0;

  const byteMismatch =
    await exportFinoraPortableBranchAuthBackupFromNativeDialog(
      PARENT_WINDOW,
      {
        sessionId:
          "FINORA-SESSION-N3A",

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      PORTABLE_STORE,
      createDependencies({
        createBackup:
          async () =>
            createSuccessResult(
              BACKUP_BYTES + 1,
            ),

        showSaveDialog:
          async () => {
            mismatchDialogCalls +=
              1;

            return {
              canceled:
                true,
            };
          },
      }),
    );

  assert(
    !byteMismatch.success &&
    byteMismatch.errorCode ===
      "EXPORT_FAILED" &&
    mismatchDialogCalls ===
      0,
    "Inconsistent privileged backup byte evidence reached save dialog.",
  );

  console.log(
    "PASS: privileged serializedBackup byte mismatch fails before native save dialog",
  );

  // ==========================================================
  // WRITE FAILURE — NO PATH LEAK
  // ==========================================================

  const writeFailure =
    await exportFinoraPortableBranchAuthBackupFromNativeDialog(
      PARENT_WINDOW,
      {
        sessionId:
          "FINORA-SESSION-N3A",

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      PORTABLE_STORE,
      createDependencies({
        writeUtf8:
          async () => {
            throw new Error(
              "C:\\SECRET\\DO-NOT-LEAK.finora",
            );
          },
      }),
    );

  assert(
    !writeFailure.success &&
    writeFailure.errorCode ===
      "EXPORT_FAILED" &&
    !writeFailure.error.includes(
      "C:\\SECRET",
    ),
    "Native write failure leaked privileged filesystem detail.",
  );

  console.log(
    "PASS: native backup write failure is sanitized and leaks no destination path",
  );

  // ==========================================================
  // ALREADY .FINORA — NO DOUBLE EXTENSION
  // ==========================================================

  let existingExtensionDestination =
    "";

  const existingExtension =
    await exportFinoraPortableBranchAuthBackupFromNativeDialog(
      PARENT_WINDOW,
      {
        sessionId:
          "FINORA-SESSION-N3A",

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
      PORTABLE_STORE,
      createDependencies({
        showSaveDialog:
          async () => ({
            canceled:
              false,

            filePath:
              "C:\\FINORA-TEST\\Existing.FINORA",
          }),

        writeUtf8:
          async (
            destination,
          ) => {
            existingExtensionDestination =
              destination;
          },
      }),
    );

  assert(
    existingExtension.success &&
    !existingExtension.cancelled &&
    existingExtensionDestination ===
      "C:\\FINORA-TEST\\Existing.FINORA",
    "Existing .finora extension was duplicated.",
  );

  console.log(
    "PASS: existing .finora extension is preserved without duplication",
  );

  console.log(
    "PASS: 5.6N-N3A Portable Branch Auth native backup file transport executable proof",
  );
}

runSelfTest()
  .then(
    () => {
      process.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED:",
        error,
      );

      process.exit(
        1,
      );
    },
  );