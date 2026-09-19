// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP FILE TRANSPORT
// PHASE : 5.6N-N3A
// ============================================================
//
// SECURITY BOUNDARY:
//
// - Backup creation/authentication is delegated to N2.
// - serializedBackup remains inside privileged Electron execution.
// - Renderer never supplies a filesystem destination.
// - Native Electron showSaveDialog chooses the destination.
// - Only bounded UTF-8 .finora bytes are written.
// - Public result returns basename + non-secret evidence only.
// - Full path, serialized backup, Password and Security Code are
//   never returned by this transport.
// ============================================================

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
  SaveDialogOptions,
} from "electron";

import {
  writeFile,
} from "node:fs/promises";

import {
  basename,
} from "node:path";

import {
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION,
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES,
} from "./finoraPortableBranchAuthBackupContract.js";

import {
  createFinoraPortableBranchAuthBackup,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthBackupCreationErrorCode,
  FinoraPortableBranchAuthBackupCreationRequest,
  FinoraPortableBranchAuthBackupCreationResult,
} from "./finoraPortableBranchAuthBackupCoordinator.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraPortableBranchAuthBackupExportErrorCode =
  | FinoraPortableBranchAuthBackupCreationErrorCode
  | "EXPORT_FAILED";

export type FinoraPortableBranchAuthBackupExportResult =
  | {
      success:
        true;

      cancelled:
        true;

      data:
        null;

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        true;

      cancelled:
        false;

      data: {
        backupId:
          string;

        fileName:
          string;

        bytesWritten:
          number;

        sourceStorageMode:
          "LOCAL" | "USB";

        authGeneration:
          number;
      };

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        false;

      cancelled:
        false;

      data:
        null;

      errorCode:
        FinoraPortableBranchAuthBackupExportErrorCode;

      error:
        string;
    };

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraPortableBranchAuthBackupFileTransportDependencies {
  createBackup:
    typeof createFinoraPortableBranchAuthBackup;

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

  writeUtf8:
    (
      destination:
        string,
      serialized:
        string,
    ) =>
      Promise<void>;
}

function createDefaultDependencies():
  FinoraPortableBranchAuthBackupFileTransportDependencies {
  return {
    createBackup:
      createFinoraPortableBranchAuthBackup,

    showSaveDialog:
      (
        parentWindow,
        options,
      ) =>
        dialog.showSaveDialog(
          parentWindow,
          options,
        ),

    writeUtf8:
      async (
        destination,
        serialized,
      ) => {
        await writeFile(
          destination,
          serialized,
          {
            encoding:
              "utf8",
          },
        );
      },
  };
}

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthBackupExportErrorCode,
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

    errorCode,

    error,
  };
}

function sanitizeFileToken(
  value:
    string,
): string {
  const token =
    value
      .replace(
        /[^A-Za-z0-9_-]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      );

  return token.length >
    0
    ? token
    : "FINORA-PBA-BACKUP";
}

function createDefaultFileName(
  backupId:
    string,
): string {
  return (
    sanitizeFileToken(
      backupId,
    ) +
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION
  );
}

function ensureFinoraExtension(
  filePath:
    string,
): string {
  return filePath
    .toLowerCase()
    .endsWith(
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION,
    )
    ? filePath
    : (
        filePath +
        FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION
      );
}

// ============================================================
// NATIVE EXPORT
// ============================================================

export async function exportFinoraPortableBranchAuthBackupFromNativeDialog(
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
      FinoraPortableBranchAuthBackupFileTransportDependencies
    > = {},
): Promise<
  FinoraPortableBranchAuthBackupExportResult
> {
  const defaults =
    createDefaultDependencies();

  const dependencies:
    FinoraPortableBranchAuthBackupFileTransportDependencies = {
      ...defaults,
      ...dependencyOverrides,
    };

  let backup:
    FinoraPortableBranchAuthBackupCreationResult;

  try {
    backup =
      await dependencies.createBackup(
        input,
        portableStore,
      );
  }
  catch {
    return failure(
      "EXPORT_FAILED",
      "Unable to prepare the FINORA Portable Branch Auth backup.",
    );
  }

  if (
    !backup.success
  ) {
    return failure(
      backup.errorCode,
      backup.error,
    );
  }

  const serializedBackup =
    backup.data.serializedBackup;

  const actualBytes =
    Buffer.byteLength(
      serializedBackup,
      "utf8",
    );

  if (
    actualBytes <=
      0 ||
    actualBytes >
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES ||
    actualBytes !==
      backup.data.bytes
  ) {
    return failure(
      "EXPORT_FAILED",
      "FINORA Portable Branch Auth backup bytes failed validation.",
    );
  }

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
            "Export FINORA Branch Backup",

          defaultPath:
            createDefaultFileName(
              backup.data.backupId,
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
      "EXPORT_FAILED",
      "Unable to open the FINORA backup save dialog.",
    );
  }

  if (
    saveResult.canceled ||
    !saveResult.filePath
  ) {
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

  const destination =
    ensureFinoraExtension(
      saveResult.filePath,
    );

  try {
    await dependencies.writeUtf8(
      destination,
      serializedBackup,
    );
  }
  catch {
    return failure(
      "EXPORT_FAILED",
      "Unable to write the FINORA Portable Branch Auth backup.",
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    data: {
      backupId:
        backup.data.backupId,

      fileName:
        basename(
          destination,
        ),

      bytesWritten:
        actualBytes,

      sourceStorageMode:
        backup.data.sourceStorageMode,

      authGeneration:
        backup.data.authGeneration,
    },

    errorCode:
      null,

    error:
      null,
  };
}