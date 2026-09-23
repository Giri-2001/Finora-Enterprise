// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V3
// NATIVE RESTORE FILE TRANSPORT
// ============================================================
//
// Drop-in privileged transport for the existing Login-page
// "Restore Branch Backup" IPC.
//
// Renderer still supplies ONLY:
//
// - username
// - password
// - securityCode
//
// Main process owns:
//
// - backup file selection;
// - bounded Full V3 file read;
// - current Branch Credential authority;
// - Full V3 parse/decrypt;
// - target USB selection;
// - target filesystem transaction;
// - storage/auth readback and rollback.
//
// Current production target:
// REAL + USB branches only.
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  open,
} from "node:fs/promises";

import {
  basename,
  extname,
} from "node:path";

import {
  dialog,
} from "electron";

import type {
  BrowserWindow,
} from "electron";

import {
  FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION,
  FINORA_FULL_BRANCH_BACKUP_LEGACY_RUNTIME_LESS_V2_MESSAGE,
  FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES,
  isFinoraLegacyRuntimeLessFullBranchBackupV2Serialized,
  parseFinoraFullBranchBackupFileV3,
} from "./finoraFullBranchBackupContract.js";

import type {
  FinoraFullBranchBackupFileV3,
} from "./finoraFullBranchBackupContract.js";

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";

import type {
  FinoraBranchCredentialAuthenticationResult,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  prepareFinoraFullBranchRestoreArtifact,
} from "./finoraFullBranchRestoreArtifactCoordinator.js";

import type {
  FinoraFullBranchRestoreArtifactResult,
} from "./finoraFullBranchRestoreArtifactCoordinator.js";

import {
  executeFinoraFullBranchRestoreTransaction,
} from "./finoraFullBranchRestoreTransaction.js";

import type {
  FinoraFullBranchRestoreTransactionDependencies,
  FinoraFullBranchRestoreTransactionResult,
} from "./finoraFullBranchRestoreTransaction.js";

import {
  createFinoraFullBranchRestoreUsbTargetTransactionDependencies,
} from "./finoraFullBranchRestoreUsbTargetAdapter.js";

import {
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

import type {
  FinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

import {
  selectFinoraUsbReplacementRoot,
} from "./finoraPortableBranchAuthUsbReplacementSelectionAuthority.js";

import {
  createFinoraUsbReplacementNativeSelectionDependencies,
} from "./finoraPortableBranchAuthUsbReplacementNativeTransport.js";

import type {
  FinoraPortableBranchAuthRestoreFileTransportDependencies,
  FinoraPortableBranchAuthRestoreFileTransportErrorCode,
  FinoraPortableBranchAuthRestoreFileTransportResult,
} from "./finoraPortableBranchAuthRestoreFileTransport.js";

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraFullBranchRestoreFileTransportDependencies
  extends FinoraPortableBranchAuthRestoreFileTransportDependencies {
  authenticateCredential?:
    typeof authenticateFinoraBranchCredential;

  parseFullBackup?:
    typeof parseFinoraFullBranchBackupFileV3;

  prepareArtifact?:
    typeof prepareFinoraFullBranchRestoreArtifact;

  createTransactionDependencies?:
    (
      targetUsbRoot:
        string,
    ) =>
      FinoraFullBranchRestoreTransactionDependencies;

  executeTransaction?:
    typeof executeFinoraFullBranchRestoreTransaction;
}

// ============================================================
// INTERNAL ERROR
// ============================================================

type FullBackupFileFailureKind =
  | "INVALID"
  | "READ_FAILED";

class FullBackupFileError
  extends Error {
  readonly kind:
    FullBackupFileFailureKind;

  constructor(
    kind:
      FullBackupFileFailureKind,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FullBackupFileError";

    this.kind =
      kind;
  }
}

// ============================================================
// RESULT
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
// FILE SELECTION
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
              FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION.slice(
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
    throw new FullBackupFileError(
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
// BOUNDED FULL V3 READ
// ============================================================

async function readBackupFileBounded(
  selectedFilePath:
    string,
): Promise<string> {
  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION
  ) {
    throw new FullBackupFileError(
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
        FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES
    ) {
      throw new FullBackupFileError(
        "INVALID",
        "Selected FINORA Full Branch Backup size is invalid.",
      );
    }

    const bytes =
      await handle.readFile();

    if (
      bytes.length <=
        0 ||
      bytes.length >
        FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES
    ) {
      throw new FullBackupFileError(
        "INVALID",
        "Selected FINORA Full Branch Backup size is invalid.",
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
        FullBackupFileError
    ) {
      throw error;
    }

    throw new FullBackupFileError(
      "READ_FAILED",
      "Unable to read the selected FINORA Full Branch Backup.",
    );
  }
  finally {
    if (
      handle
    ) {
      try {
        await handle.close();
      }
      catch {
        // Preserve original result.
      }
    }
  }
}

// ============================================================
// AUTHORITY HELPERS
// ============================================================

function scopesMatch(
  backup:
    FinoraFullBranchBackupFileV3,
  current:
    {
      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;
    },
): boolean {
  return (
    backup.branchScope.ownerId ===
      current.ownerId &&
    backup.branchScope.businessId ===
      current.businessId &&
    backup.branchScope.branchId ===
      current.branchId
  );
}

function mapArtifactFailure(
  result:
    Extract<
      FinoraFullBranchRestoreArtifactResult,
      {
        success:
          false;
      }
    >,
): FinoraPortableBranchAuthRestoreFileTransportResult {
  switch (
    result.errorCode
  ) {
    case "INVALID_REQUEST":
      return failure(
        "INVALID_REQUEST",
        result.error,
      );

    case "SCOPE_MISMATCH":
      return failure(
        "SCOPE_MISMATCH",
        result.error,
      );

    case "STORAGE_MODE_MISMATCH":
      return failure(
        "STORAGE_MODE_MISMATCH",
        result.error,
      );

    case "PORTABLE_AUTH_AUTHENTICATION_FAILED":
    case "REAL_SNAPSHOT_AUTHENTICATION_FAILED":
      return failure(
        "BACKUP_AUTHENTICATION_FAILED",
        result.error,
      );

    case "BACKUP_FORMAT_INVALID":
    case "AUTH_GENERATION_MISMATCH":
    case "PORTABLE_AUTH_AUTHORITY_MISMATCH":
    case "REAL_SNAPSHOT_INVALID":
    default:
      return failure(
        "BACKUP_INVALID",
        result.error,
      );
  }
}

function mapTransactionFailure(
  result:
    Extract<
      FinoraFullBranchRestoreTransactionResult,
      {
        success:
          false;
      }
    >,
): FinoraPortableBranchAuthRestoreFileTransportResult {
  switch (
    result.errorCode
  ) {
    case "TARGET_CAPTURE_FAILED":
    case "TARGET_STORAGE_READBACK_FAILED":
    case "TARGET_AUTH_READBACK_FAILED":
    case "TARGET_RUNTIME_AUTHORITY_READBACK_FAILED":
      return failure(
        "TARGET_READBACK_FAILED",
        result.error,
      );

    case "TARGET_STORAGE_WRITE_FAILED":
    case "TARGET_AUTH_WRITE_FAILED":
    case "TARGET_RUNTIME_AUTHORITY_WRITE_FAILED":
      return failure(
        "TARGET_WRITE_FAILED",
        result.error,
      );

    case "ROLLBACK_FAILED":
      return failure(
        "RESTORE_FAILED",
        result.error,
      );

    case "INVALID_MATERIAL":
    case "PORTABLE_AUTH_INVALID":
    case "RESTORE_PLAN_FAILED":
    case "PREWRITE_DIGEST_MISMATCH":
    default:
      return failure(
        "BACKUP_INVALID",
        result.error,
      );
  }
}

// ============================================================
// MAIN TRANSPORT
// ============================================================

export async function restoreFinoraFullBranchFromNativeBackup(
  input:
    unknown,
  dependencies:
    FinoraFullBranchRestoreFileTransportDependencies,
): Promise<
  FinoraPortableBranchAuthRestoreFileTransportResult
> {
  const credentials:
    FinoraPortableBranchAuthRestoreCredentialRequest |
    null =
    sanitizeFinoraPortableBranchAuthRestoreCredentialRequest(
      input,
    );

  if (
    !credentials
  ) {
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
  // 1. SELECT BACKUP
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
        FullBackupFileError &&
      error.kind ===
        "INVALID"
    ) {
      return failure(
        "BACKUP_FILE_INVALID",
        error.message,
      );
    }

    return failure(
      "BACKUP_SELECTION_FAILED",
      "FINORA could not select a Restore Backup.",
    );
  }

  if (
    !selectedFilePath
  ) {
    return {
      success:
        true,

      cancelled:
        true,
    };
  }

  if (
    extname(
      selectedFilePath,
    ).toLowerCase() !==
      FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION
  ) {
    return failure(
      "BACKUP_FILE_INVALID",
      "The selected FINORA Restore Backup has an invalid extension.",
    );
  }

  // ----------------------------------------------------------
  // 2. READ FULL V3 FILE
  // ----------------------------------------------------------

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
        FullBackupFileError &&
      error.kind ===
        "INVALID"
    ) {
      return failure(
        "BACKUP_FILE_INVALID",
        error.message,
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
      FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES
  ) {
    return failure(
      "BACKUP_FILE_INVALID",
      "The selected FINORA Full Branch Backup is invalid.",
    );
  }

  if (
    isFinoraLegacyRuntimeLessFullBranchBackupV2Serialized(
      serializedBackup,
    )
  ) {
    return failure(
      "BACKUP_FILE_INVALID",
      FINORA_FULL_BRANCH_BACKUP_LEGACY_RUNTIME_LESS_V2_MESSAGE,
    );
  }

  // ----------------------------------------------------------
  // 3. STRICT FULL V3 OUTER PARSE
  // ----------------------------------------------------------

  const parseFullBackup =
    dependencies.parseFullBackup ??
    parseFinoraFullBranchBackupFileV3;

  let backup:
    FinoraFullBranchBackupFileV3;

  try {
    backup =
      parseFullBackup(
        serializedBackup,
      );
  }
  catch {
    return failure(
      "BACKUP_FILE_INVALID",
      "The selected file is not a valid FINORA Full Branch Backup V3 artifact.",
    );
  }

  // ----------------------------------------------------------
  // 4. CURRENT BRANCH CREDENTIAL AUTHORITY
  // ----------------------------------------------------------

  const authenticateCredential =
    dependencies.authenticateCredential ??
    authenticateFinoraBranchCredential;

  let credentialResult:
    FinoraBranchCredentialAuthenticationResult;

  try {
    credentialResult =
      await authenticateCredential({
        username:
          credentials.username,

        password:
          credentials.password,
      });
  }
  catch {
    return failure(
      "CREDENTIAL_AUTHENTICATION_FAILED",
      "FINORA could not authenticate the current Branch Credential.",
    );
  }

  if (
    !credentialResult.success
  ) {
    return failure(
      "CREDENTIAL_AUTHENTICATION_FAILED",
      "Invalid FINORA Restore credentials.",
    );
  }

  const current =
    credentialResult.data;

  if (
    current.dataContext !==
      "REAL"
  ) {
    return failure(
      "STORAGE_MODE_MISMATCH",
      "FINORA Full Branch Restore is available only for REAL branch data.",
    );
  }

  if (
    current.storageMode !==
      "USB"
  ) {
    return failure(
      "STORAGE_MODE_MISMATCH",
      "This FINORA Full Branch Restore currently requires the provisioned USB storage mode.",
    );
  }

  if (
    backup.sourceStorageMode !==
      "USB"
  ) {
    return failure(
      "STORAGE_MODE_MISMATCH",
      "The FINORA Full Branch Backup is not a USB branch backup.",
    );
  }

  if (
    !scopesMatch(
      backup,
      current,
    )
  ) {
    return failure(
      "SCOPE_MISMATCH",
      "The FINORA Full Branch Backup belongs to a different branch.",
    );
  }

  if (
    backup.authGeneration <
      current.authGeneration
  ) {
    return failure(
      "STALE_BACKUP",
      "This FINORA Full Branch Backup is older than the current Branch Credential authority.",
    );
  }

  if (
    backup.authGeneration >
      current.authGeneration
  ) {
    return failure(
      "FUTURE_BACKUP",
      "This FINORA Full Branch Backup is newer than the current Branch Credential authority and cannot be trusted.",
    );
  }

  // ----------------------------------------------------------
  // 5. AUTHENTICATE + DECRYPT FULL ARTIFACT
  // ----------------------------------------------------------

  const prepareArtifact =
    dependencies.prepareArtifact ??
    prepareFinoraFullBranchRestoreArtifact;

  let artifactResult:
    FinoraFullBranchRestoreArtifactResult;

  try {
    artifactResult =
      await prepareArtifact({
        password:
          credentials.password,

        securityCode:
          credentials.securityCode,

        serializedBackup,

        authenticatedAuthority: {
          branchScope: {
            ownerId:
              current.ownerId,

            businessId:
              current.businessId,

            branchId:
              current.branchId,
          },

          storageMode:
            current.storageMode,

          authGeneration:
            current.authGeneration,
        },
      });
  }
  catch {
    return failure(
      "BACKUP_AUTHENTICATION_FAILED",
      "FINORA could not authenticate the Full Branch Backup.",
    );
  }

  if (
    !artifactResult.success
  ) {
    return mapArtifactFailure(
      artifactResult,
    );
  }

  // ----------------------------------------------------------
  // 6. SELECT NATIVE TARGET USB
  //
  // This happens only after credentials and backup authority
  // have passed. Renderer never supplies target path.
  // ----------------------------------------------------------

  let targetUsbRoot:
    string |
    null =
    null;

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

              if (
                !result.success
              ) {
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

              if (
                result.cancelled
              ) {
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

    if (
      !selection.success
    ) {
      return failure(
        "TARGET_SELECTION_FAILED",
        selection.error,
      );
    }

    if (
      selection.cancelled
    ) {
      return {
        success:
          true,

        cancelled:
          true,
      };
    }

    targetUsbRoot =
      selection.root;
  }
  catch {
    return failure(
      "TARGET_SELECTION_FAILED",
      "FINORA could not select an approved Restore USB target.",
    );
  }

  if (
    typeof targetUsbRoot !==
      "string" ||
    targetUsbRoot.trim().length ===
      0
  ) {
    return failure(
      "TARGET_SELECTION_FAILED",
      "FINORA Restore target USB is unavailable.",
    );
  }

  // ----------------------------------------------------------
  // 7. CREATE PINNED NATIVE TARGET TRANSACTION
  // ----------------------------------------------------------

  const createTransactionDependencies =
    dependencies.createTransactionDependencies ??
    createFinoraFullBranchRestoreUsbTargetTransactionDependencies;

  let transactionDependencies:
    FinoraFullBranchRestoreTransactionDependencies;

  try {
    transactionDependencies =
      createTransactionDependencies(
        targetUsbRoot,
      );
  }
  catch {
    return failure(
      "TARGET_SELECTION_FAILED",
      "FINORA could not prepare the selected Restore USB target.",
    );
  }

  // ----------------------------------------------------------
  // 8. VERIFIED STORAGE + AUTH + RUNTIME AUTHORITY TRANSACTION
  // ----------------------------------------------------------

  const executeTransaction =
    dependencies.executeTransaction ??
    executeFinoraFullBranchRestoreTransaction;

  let transactionResult:
    FinoraFullBranchRestoreTransactionResult;

  try {
    transactionResult =
      await executeTransaction(
        {
          branchScope:
            artifactResult.data.branchScope,

          storageMode:
            "USB",

          authGeneration:
            artifactResult.data.authGeneration,

          portableAuthEnvelopeSerialized:
            artifactResult.data.portableAuthEnvelopeSerialized,

          runtimeAuthorityPackageSerialized:
            artifactResult.data.runtimeAuthorityPackageSerialized,

          snapshot:
            artifactResult.data.snapshot,

          snapshotRecordCount:
            artifactResult.data.snapshotRecordCount,

          exactRealDigestSha256:
            artifactResult.data.exactRealDigestSha256,
        },
        transactionDependencies,
      );
  }
  catch {
    return failure(
      "RESTORE_FAILED",
      "FINORA Full Branch Restore transaction could not be completed.",
    );
  }

  if (
    !transactionResult.success
  ) {
    return mapTransactionFailure(
      transactionResult,
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    data: {
      backupId:
        artifactResult.data.backupId,

      fileName:
        basename(
          selectedFilePath,
        ),

      storageMode:
        "USB",

      authGeneration:
        artifactResult.data.authGeneration,
    },
  };
}