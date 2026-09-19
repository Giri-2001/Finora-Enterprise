/* ============================================================
   FINORA ENTERPRISE

   PORTABLE BRANCH AUTH RESTORE FILE TRANSPORT

   Phase 5.6O-O3A

   SECURITY BOUNDARY

   Renderer provides only:
   - username
   - password
   - securityCode

   Main process owns:
   - Backup filesystem selection
   - Backup filesystem path
   - bounded Backup read
   - USB Restore target selection
   - Portable Store target roots
   - privileged serialized Backup bytes

   USB target selection is lazy. It occurs only if the
   authenticated current Branch Credential resolves to USB.

   Once selected, the USB root is cached for the complete
   coordinator write + readback transaction so readback can
   never silently resolve a different device.
   ============================================================ */

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  open,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

import {
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION,
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES,
} from "./finoraPortableBranchAuthBackupContract.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraPortableBranchAuthStoreDependencies,
} from "./finoraPortableBranchAuthStore.js";

import {
  restoreFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthRestoreCoordinator.js";

import type {
  FinoraPortableBranchAuthRestoreStore,
} from "./finoraPortableBranchAuthRestoreCoordinator.js";

import {
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

import type {
  FinoraPortableBranchAuthRestoreCredentialRequest,
  FinoraPortableBranchAuthRestoreErrorCode,
} from "./finoraPortableBranchAuthRestoreContract.js";

import {
  selectFinoraUsbReplacementRoot,
} from "./finoraPortableBranchAuthUsbReplacementSelectionAuthority.js";

import {
  createFinoraUsbReplacementNativeSelectionDependencies,
} from "./finoraPortableBranchAuthUsbReplacementNativeTransport.js";

import type {
  FinoraUsbReplacementRootValidator,
} from "./finoraPortableBranchAuthUsbReplacementNativeTransport.js";

// ============================================================
// PUBLIC RESULT
// ============================================================

export type FinoraPortableBranchAuthRestoreFileTransportErrorCode =
  | "INVALID_REQUEST"
  | "PARENT_WINDOW_UNAVAILABLE"
  | "BACKUP_SELECTION_FAILED"
  | "BACKUP_FILE_INVALID"
  | "BACKUP_READ_FAILED"
  | "TARGET_SELECTION_FAILED"
  | FinoraPortableBranchAuthRestoreErrorCode;

export type FinoraPortableBranchAuthRestoreFileTransportResult =
  | {
      success:
        true;

      cancelled:
        true;
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

        storageMode:
          "LOCAL" |
          "USB";

        authGeneration:
          number;
      };
    }
  | {
      success:
        false;

      cancelled:
        false;

      errorCode:
        FinoraPortableBranchAuthRestoreFileTransportErrorCode;

      error:
        string;
    };

// ============================================================
// TESTABLE NATIVE DEPENDENCIES
// ============================================================

export type FinoraPortableBranchAuthRestoreCoordinatorInvoker =
  typeof restoreFinoraPortableBranchAuth;

export interface FinoraPortableBranchAuthRestoreFileTransportDependencies {
  parentWindow:
    BrowserWindow |
    null;

  resolveLocalRoot:
    () =>
      string |
      null |
      undefined;

  validateUsbRoot:
    FinoraUsbReplacementRootValidator;

  /**
   * Tests may replace native file selection.
   * Production leaves this undefined.
   */
  selectBackupFile?:
    () =>
      Promise<
        string |
        null
      >;

  /**
   * Tests may replace the bounded native file read.
   * Production leaves this undefined.
   */
  readBackupFile?:
    (
      selectedFilePath:
        string,
    ) =>
      Promise<string>;

  /**
   * Tests may replace USB target selection.
   * Production leaves this undefined.
   */
  selectUsbTargetRoot?:
    () =>
      Promise<
        | {
            success:
              true;

            cancelled:
              true;

            root:
              null;
          }
        | {
            success:
              true;

            cancelled:
              false;

            root:
              string;
          }
        | {
            success:
              false;

            cancelled:
              false;

            root:
              null;

            error:
              string;
          }
      >;

  /**
   * Tests may replace the actual Portable Store.
   */
  createPortableStore?:
    (
      dependencies:
        FinoraPortableBranchAuthStoreDependencies,
    ) =>
      FinoraPortableBranchAuthRestoreStore;

  /**
   * Tests may replace O2 while proving native transport.
   */
  restoreCoordinator?:
    FinoraPortableBranchAuthRestoreCoordinatorInvoker;
}

// ============================================================
// INTERNAL ERROR
// ============================================================

type NativeBackupFileFailureKind =
  | "INVALID"
  | "READ_FAILED";

class NativeBackupFileError
  extends Error {
  readonly kind:
    NativeBackupFileFailureKind;

  constructor(
    kind:
      NativeBackupFileFailureKind,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "NativeBackupFileError";

    this.kind =
      kind;
  }
}

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthRestoreFileTransportErrorCode,
  error:
    string,
): FinoraPortableBranchAuthRestoreFileTransportResult {
  return {
    success:
      false,

    cancelled:
      false,

    errorCode,

    error,
  };
}

// ============================================================
// NATIVE BACKUP SELECTION
// ============================================================

async function selectBackupFileNative(
  parentWindow:
    BrowserWindow,
): Promise<
  string |
  null
> {
  const selection =
    await dialog.showOpenDialog(
      parentWindow,
      {
        title:
          "Restore FINORA Branch Backup",

        buttonLabel:
          "Select Backup",

        filters: [
          {
            name:
              "FINORA Branch Backup",

            extensions: [
              FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION.slice(
                1,
              ),
            ],
          },
        ],

        properties: [
          "openFile",
        ],
      },
    );

  if (
    selection.canceled ||
    selection.filePaths.length ===
      0
  ) {
    return null;
  }

  if (
    selection.filePaths.length !==
      1
  ) {
    throw new NativeBackupFileError(
      "INVALID",
      "FINORA Restore requires exactly one Backup file.",
    );
  }

  return (
    selection.filePaths[0] ??
    null
  );
}

// ============================================================
// BOUNDED NATIVE READ
// ============================================================

async function readBackupFileBounded(
  selectedFilePath:
    string,
): Promise<string> {
  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION
  ) {
    throw new NativeBackupFileError(
      "INVALID",
      "Selected FINORA Restore file has an invalid extension.",
    );
  }

  let handle:
    Awaited<
      ReturnType<
        typeof open
      >
    > |
    null =
    null;

  try {
    handle =
      await open(
        selectedFilePath,
        "r",
      );

    const statistics =
      await handle.stat();

    if (
      !statistics.isFile() ||
      statistics.size <=
        0 ||
      statistics.size >
        FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES
    ) {
      throw new NativeBackupFileError(
        "INVALID",
        "Selected FINORA Restore Backup size is invalid.",
      );
    }

    const bytes =
      await handle.readFile();

    if (
      bytes.length <=
        0 ||
      bytes.length >
        FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES
    ) {
      throw new NativeBackupFileError(
        "INVALID",
        "Selected FINORA Restore Backup size is invalid.",
      );
    }

    return bytes.toString(
      "utf8",
    );
  }
  catch (
    error
  ) {
    if (
      error instanceof
        NativeBackupFileError
    ) {
      throw error;
    }

    throw new NativeBackupFileError(
      "READ_FAILED",
      "Unable to read the selected FINORA Restore Backup.",
    );
  }
  finally {
    if (handle) {
      try {
        await handle.close();
      }
      catch {
        // Preserve the original result.
      }
    }
  }
}

// ============================================================
// MAIN NATIVE RESTORE TRANSPORT
// ============================================================

export async function restoreFinoraPortableBranchAuthFromNativeBackup(
  input:
    unknown,
  dependencies:
    FinoraPortableBranchAuthRestoreFileTransportDependencies,
): Promise<
  FinoraPortableBranchAuthRestoreFileTransportResult
> {
  // ----------------------------------------------------------
  // Renderer boundary:
  // exact Username + Password + Security Code only.
  // ----------------------------------------------------------

  const credentials:
    FinoraPortableBranchAuthRestoreCredentialRequest |
    null =
    sanitizeFinoraPortableBranchAuthRestoreCredentialRequest(
      input,
    );

  if (!credentials) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Restore request is required.",
    );
  }

  const parentWindow =
    dependencies.parentWindow;

  if (
    !parentWindow ||
    parentWindow.isDestroyed()
  ) {
    return failure(
      "PARENT_WINDOW_UNAVAILABLE",
      "FINORA Restore window is unavailable.",
    );
  }

  // ----------------------------------------------------------
  // Backup file selection.
  // Renderer never sees or supplies this path.
  // ----------------------------------------------------------

  let selectedFilePath:
    string |
    null;

  try {
    selectedFilePath =
      dependencies.selectBackupFile
        ? await dependencies.selectBackupFile()
        : await selectBackupFileNative(
            parentWindow,
          );
  }
  catch (
    error
  ) {
    if (
      error instanceof
        NativeBackupFileError &&
      error.kind ===
        "INVALID"
    ) {
      return failure(
        "BACKUP_FILE_INVALID",
        "The selected FINORA Restore Backup is invalid.",
      );
    }

    return failure(
      "BACKUP_SELECTION_FAILED",
      "FINORA could not select a Restore Backup.",
    );
  }

  if (!selectedFilePath) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  // ----------------------------------------------------------
  // Exact extension is enforced even when the native dialog
  // filter was bypassed or ignored.
  // ----------------------------------------------------------

  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION
  ) {
    return failure(
      "BACKUP_FILE_INVALID",
      "The selected FINORA Restore Backup is invalid.",
    );
  }

  let serializedBackup:
    string;

  try {
    serializedBackup =
      dependencies.readBackupFile
        ? await dependencies.readBackupFile(
            selectedFilePath,
          )
        : await readBackupFileBounded(
            selectedFilePath,
          );
  }
  catch (
    error
  ) {
    if (
      error instanceof
        NativeBackupFileError &&
      error.kind ===
        "INVALID"
    ) {
      return failure(
        "BACKUP_FILE_INVALID",
        "The selected FINORA Restore Backup is invalid.",
      );
    }

    return failure(
      "BACKUP_READ_FAILED",
      "FINORA could not read the selected Restore Backup.",
    );
  }

  if (
    typeof serializedBackup !==
      "string" ||
    serializedBackup.length ===
      0 ||
    Buffer.byteLength(
      serializedBackup,
      "utf8",
    ) >
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES
  ) {
    return failure(
      "BACKUP_FILE_INVALID",
      "The selected FINORA Restore Backup is invalid.",
    );
  }

  // ----------------------------------------------------------
  // USB TARGET AUTHORITY
  //
  // Selection is lazy because authoritative storageMode comes
  // from current Branch Credential authentication inside O2.
  //
  // write() + read() may each resolve the USB root. Therefore
  // one approved selection is cached for this Restore attempt.
  // ----------------------------------------------------------

  let cachedUsbRoot:
    string |
    null =
    null;

  let usbSelectionAttempted =
    false;

  let usbSelectionCancelled =
    false;

  let usbSelectionFailed =
    false;

  const resolveUsbRoot =
    async (): Promise<
      string |
      null
    > => {
      if (cachedUsbRoot) {
        return cachedUsbRoot;
      }

      if (
        usbSelectionCancelled ||
        usbSelectionFailed
      ) {
        return null;
      }

      if (usbSelectionAttempted) {
        return null;
      }

      usbSelectionAttempted =
        true;

      try {
        const selection =
          dependencies.selectUsbTargetRoot
            ? await dependencies.selectUsbTargetRoot()
            : await (
                async () => {
                  const nativeDependencies =
                    createFinoraUsbReplacementNativeSelectionDependencies(
                      parentWindow,
                      dependencies.validateUsbRoot,
                    );

                  const result =
                    await selectFinoraUsbReplacementRoot(
                      "TARGET",
                      nativeDependencies,
                    );

                  if (!result.success) {
                    return {
                      success:
                        false as const,

                      cancelled:
                        false as const,

                      root:
                        null,

                      error:
                        result.error,
                    };
                  }

                  if (result.cancelled) {
                    return {
                      success:
                        true as const,

                      cancelled:
                        true as const,

                      root:
                        null,
                    };
                  }

                  return {
                    success:
                      true as const,

                    cancelled:
                      false as const,

                    root:
                      result.root,
                  };
                }
              )();

        if (!selection.success) {
          usbSelectionFailed =
            true;

          return null;
        }

        if (selection.cancelled) {
          usbSelectionCancelled =
            true;

          return null;
        }

        cachedUsbRoot =
          selection.root;

        return cachedUsbRoot;
      }
      catch {
        usbSelectionFailed =
          true;

        return null;
      }
    };

  const storeDependencies:
    FinoraPortableBranchAuthStoreDependencies =
    {
      resolveLocalRoot:
        dependencies.resolveLocalRoot,

      resolveUsbRoot,
    };

  const portableStore =
    dependencies.createPortableStore
      ? dependencies.createPortableStore(
          storeDependencies,
        )
      : new FinoraPortableBranchAuthStore(
          storeDependencies,
        );

  const coordinator =
    dependencies.restoreCoordinator ??
    restoreFinoraPortableBranchAuth;

  const result =
    await coordinator(
      {
        credentials,

        serializedBackup,
      },
      {
        portableStore,
      },
    );

  // ----------------------------------------------------------
  // Native USB cancellation is transport cancellation rather
  // than a false Restore error.
  // ----------------------------------------------------------

  if (
    !result.success &&
    usbSelectionCancelled
  ) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  if (
    !result.success &&
    usbSelectionFailed
  ) {
    return failure(
      "TARGET_SELECTION_FAILED",
      "FINORA could not select an approved Restore USB target.",
    );
  }

  if (!result.success) {
    return {
      success:
        false,

      cancelled:
        false,

      errorCode:
        result.errorCode,

      error:
        result.error,
    };
  }

  return {
    success:
      true,

    cancelled:
      false,

    data: {
      backupId:
        result.data.backupId,

      fileName:
        basename(
          selectedFilePath,
        ),

      storageMode:
        result.data.storageMode,

      authGeneration:
        result.data.authGeneration,
    },
  };
}

// ============================================================
// END
// ============================================================