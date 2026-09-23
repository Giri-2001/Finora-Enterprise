// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2 NATIVE FILE TRANSPORT
// ============================================================
//
// Production purpose:
//
// Existing renderer/UI/IPC contract remains unchanged.
//
// This privileged exporter:
//
// 1. authenticates and creates the existing Portable Auth backup
//    authority through the proven 5.6N coordinator;
// 2. strictly READS the existing USB storage package;
// 3. captures only the exact REAL tenant snapshot;
// 4. encrypts that snapshot with Password + Security Code;
// 5. emits one Full Branch Backup V2 .finora artifact;
// 6. writes only the user-selected backup destination.
//
// IMPORTANT:
//
// The source USB read path never creates, repairs, resets or
// rewrites FINORA storage.
//
// A missing/corrupt source storage file fails closed.
// ============================================================

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
  SaveDialogOptions,
} from "electron";

import {
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  basename,
  extname,
  join,
} from "node:path";

import {
  Buffer,
} from "node:buffer";

import {
  FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION,
  FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES,
} from "./finoraFullBranchBackupContract.js";

import {
  createFinoraFullBranchBackup,
} from "./finoraFullBranchBackupCoordinator.js";

import type {
  FinoraFullBranchBackupResult,
} from "./finoraFullBranchBackupCoordinator.js";

import {
  createFinoraPortableBranchAuthBackup,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthBackupCreationRequest,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthBackupExportResult,
} from "./finoraPortableBranchAuthBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// INTERNAL AUTHORITY SHAPE
// ============================================================

interface AuthBackupAuthoritySuccess {
  success:
    true;

  data: {
    backupId:
      string;

    createdAt:
      string;

    branchScope: {
      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;
    };

    sourceStorageMode:
      "LOCAL" | "USB";

    authGeneration:
      number;

    backupFile: {
      portableAuthEnvelopeSerialized:
        string;
    };
  };
}

interface AuthBackupAuthorityFailure {
  success:
    false;

  errorCode:
    string;

  error:
    string;
}

type AuthBackupAuthorityResult =
  | AuthBackupAuthoritySuccess
  | AuthBackupAuthorityFailure;

type AuthBackupInvoker =
  (
    input:
      FinoraPortableBranchAuthBackupCreationRequest,

    portableStore:
      Pick<
        FinoraPortableBranchAuthStore,
        "read"
      >,
  ) =>
    Promise<
      AuthBackupAuthorityResult
    >;

// ============================================================
// TESTABLE PRIVILEGED DEPENDENCIES
// ============================================================

export interface FinoraFullBranchBackupFileTransportDependencies {
  createAuthBackup:
    AuthBackupInvoker;

  createFullBackup:
    typeof createFinoraFullBranchBackup;

  resolveUsbRoot:
    () =>
      Promise<
        string | null
      >;

  readTextFile:
    (
      filePath:
        string,
    ) =>
      Promise<string>;

  showSaveDialog:
    (
      parentWindow:
        BrowserWindow,

      options:
        SaveDialogOptions,
    ) =>
      Promise<{
        canceled:
          boolean;

        filePath?:
          string;
      }>;

  writeTextFile:
    (
      filePath:
        string,

      content:
        string,
    ) =>
      Promise<void>;
}

// ============================================================
// SOURCE USB PACKAGE
// ============================================================

interface StrictUsbStoragePackage {
  version:
    "2.0";

  records:
    unknown[];
}

function parseStrictUsbStoragePackage(
  raw:
    string,
): StrictUsbStoragePackage {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        raw,
      );
  }
  catch {
    throw new Error(
      "Invalid FINORA USB storage package.",
    );
  }

  if (
    typeof parsed !==
      "object" ||
    parsed ===
      null ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      "Invalid FINORA USB storage package.",
    );
  }

  const candidate =
    parsed as Record<string, unknown>;

  if (
    candidate.version !==
      "2.0" ||
    !Array.isArray(
      candidate.records,
    )
  ) {
    throw new Error(
      "Unsupported FINORA USB storage package.",
    );
  }

  return {
    version:
      "2.0",

    records:
      candidate.records,
  };
}

function ensureFinoraExtension(
  filePath:
    string,
): string {
  return (
    extname(
      filePath,
    ).toLowerCase() ===
      FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION
  )
    ? filePath
    : (
        filePath +
        FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION
      );
}

function failure(
  error:
    string,
): FinoraPortableBranchAuthBackupExportResult {
  return {
    success:
      false,

    cancelled:
      false,

    data:
      null,

    errorCode:
      "EXPORT_FAILED",

    error,
  };
}

function cancelled():
  FinoraPortableBranchAuthBackupExportResult {
  return {
    success:
      true,

    cancelled:
      true,

    data:
      null,

    errorCode:
      null,

    error:
      null,
  };
}

function createDefaultDependencies():
  Omit<
    FinoraFullBranchBackupFileTransportDependencies,
    "resolveUsbRoot"
  > {
  return {
    createAuthBackup:
      async (
        input,
        portableStore,
      ) =>
        (
          await createFinoraPortableBranchAuthBackup(
            input,
            portableStore,
          )
        ) as AuthBackupAuthorityResult,

    createFullBackup:
      createFinoraFullBranchBackup,

    readTextFile:
      (
        filePath,
      ) =>
        readFile(
          filePath,
          "utf8",
        ),

    showSaveDialog:
      (
        parentWindow,
        options,
      ) =>
        dialog.showSaveDialog(
          parentWindow,
          options,
        ),

    writeTextFile:
      async (
        filePath,
        content,
      ) => {
        await writeFile(
          filePath,
          content,
          "utf8",
        );
      },
  };
}

// ============================================================
// NATIVE EXPORT
// ============================================================

export async function exportFinoraFullBranchBackupFromNativeDialog(
  parentWindow:
    BrowserWindow,

  input:
    FinoraPortableBranchAuthBackupCreationRequest,

  portableStore:
    Pick<
      FinoraPortableBranchAuthStore,
      "read"
    >,

  dependencyOverrides:
    Partial<
      FinoraFullBranchBackupFileTransportDependencies
    > &
    Pick<
      FinoraFullBranchBackupFileTransportDependencies,
      "resolveUsbRoot"
    >,
): Promise<
  FinoraPortableBranchAuthBackupExportResult
> {
  const defaults =
    createDefaultDependencies();

  const dependencies:
    FinoraFullBranchBackupFileTransportDependencies =
    {
      ...defaults,

      ...dependencyOverrides,

      resolveUsbRoot:
        dependencyOverrides.resolveUsbRoot,
    };

  // ----------------------------------------------------------
  // 1. PROVEN AUTHENTICATED PORTABLE AUTH BACKUP AUTHORITY
  // ----------------------------------------------------------

  let authBackup:
    AuthBackupAuthorityResult;

  try {
    authBackup =
      await dependencies.createAuthBackup(
        input,
        portableStore,
      );
  }
  catch {
    return failure(
      "Unable to authenticate the FINORA Branch Backup.",
    );
  }

  if (
    !authBackup.success
  ) {
    return failure(
      authBackup.error ||
        "Unable to authenticate the FINORA Branch Backup.",
    );
  }

  /*
   * Current production requirement:
   *
   * USB-provisioned branch -> complete USB recovery artifact.
   *
   * Do not silently generate an auth-only artifact for LOCAL.
   */
  if (
    authBackup.data.sourceStorageMode !==
      "USB"
  ) {
    return failure(
      "Full FINORA Branch Backup currently requires the provisioned USB storage mode.",
    );
  }

  // ----------------------------------------------------------
  // 2. PIN CURRENT TRUSTED SOURCE USB ROOT
  // ----------------------------------------------------------

  let usbRoot:
    string | null;

  try {
    usbRoot =
      await dependencies.resolveUsbRoot();
  }
  catch {
    return failure(
      "Unable to resolve the authoritative FINORA USB source.",
    );
  }

  if (
    !usbRoot
  ) {
    return failure(
      "FINORA Pendrive is disconnected.",
    );
  }

  const storageFile =
    join(
      usbRoot,
      "FINORA",
      "storage",
      "finora-storage.json",
    );

  // ----------------------------------------------------------
  // 3. STRICT READ-ONLY SOURCE STORAGE READ
  // ----------------------------------------------------------

  let sourcePackage:
    StrictUsbStoragePackage;

  try {
    const raw =
      await dependencies.readTextFile(
        storageFile,
      );

    sourcePackage =
      parseStrictUsbStoragePackage(
        raw,
      );
  }
  catch {
    return failure(
      "Unable to read the authoritative FINORA REAL storage for backup. No source data was changed.",
    );
  }

  // ----------------------------------------------------------
  // 4. COMPOSE FULL V2 ARTIFACT
  // ----------------------------------------------------------

  let fullBackup:
    FinoraFullBranchBackupResult;

  try {
    fullBackup =
      await dependencies.createFullBackup(
        input,
        {
          createAuthenticatedBackupAuthority:
            async () => ({
              success:
                true,

              data: {
                backupId:
                  authBackup.data.backupId,

                createdAt:
                  authBackup.data.createdAt,

                branchScope:
                  authBackup.data.branchScope,

                sourceStorageMode:
                  authBackup.data.sourceStorageMode,

                authGeneration:
                  authBackup.data.authGeneration,

                portableAuthEnvelopeSerialized:
                  authBackup.data.backupFile
                    .portableAuthEnvelopeSerialized,
              },
            }),

          readRealStorageRecords:
            async (
              request,
            ) => {
              if (
                request.storageMode !==
                  "USB" ||
                request.branchScope.ownerId !==
                  authBackup.data.branchScope.ownerId ||
                request.branchScope.businessId !==
                  authBackup.data.branchScope.businessId ||
                request.branchScope.branchId !==
                  authBackup.data.branchScope.branchId
              ) {
                return {
                  success:
                    false,

                  error:
                    "FINORA Full Branch Backup storage authority mismatch.",
                };
              }

              return {
                success:
                  true,

                records:
                  sourcePackage.records,
              };
            },
        },
      );
  }
  catch {
    return failure(
      "Unable to create the FINORA Full Branch Backup.",
    );
  }

  if (
    !fullBackup.success
  ) {
    return failure(
      fullBackup.error,
    );
  }

  const serializedBackup =
    fullBackup.data.serializedBackup;

  const bytes =
    Buffer.byteLength(
      serializedBackup,
      "utf8",
    );

  if (
    bytes <=
      0 ||
    bytes >
      FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES
  ) {
    return failure(
      "FINORA Full Branch Backup exceeds the supported file size.",
    );
  }

  // ----------------------------------------------------------
  // 5. NATIVE DESTINATION SELECTION
  // ----------------------------------------------------------

  let saveResult:
    {
      canceled:
        boolean;

      filePath?:
        string;
    };

  try {
    saveResult =
      await dependencies.showSaveDialog(
        parentWindow,
        {
          title:
            "Save FINORA Branch Backup",

          defaultPath:
            (
              "FINORA-BRANCH-BACKUP-" +
              fullBackup.data.backupId +
              FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION
            ),

          filters: [
            {
              name:
                "FINORA Branch Backup",

              extensions: [
                "finora",
              ],
            },
          ],

          properties: [
            "createDirectory",
            "showOverwriteConfirmation",
          ],
        },
      );
  }
  catch {
    return failure(
      "Unable to open the FINORA Branch Backup save dialog.",
    );
  }

  if (
    saveResult.canceled
  ) {
    return cancelled();
  }

  if (
    typeof saveResult.filePath !==
      "string" ||
    saveResult.filePath.trim().length ===
      0
  ) {
    return failure(
      "A valid FINORA Branch Backup destination was not selected.",
    );
  }

  const destination =
    ensureFinoraExtension(
      saveResult.filePath,
    );

  // ----------------------------------------------------------
  // 6. WRITE ONLY THE USER-SELECTED BACKUP DESTINATION
  // ----------------------------------------------------------

  try {
    await dependencies.writeTextFile(
      destination,
      serializedBackup,
    );
  }
  catch {
    return failure(
      "Unable to write the FINORA Full Branch Backup file.",
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    data: {
      backupId:
        fullBackup.data.backupId,

      fileName:
        basename(
          destination,
        ),

      bytesWritten:
        bytes,

      sourceStorageMode:
        fullBackup.data.sourceStorageMode,

      authGeneration:
        fullBackup.data.authGeneration,
    },

    errorCode:
      null,

    error:
      null,
  };
}