import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  getPaisaruleBackupSessionKey,
} from "./paisaruleStorageBackupV1SessionKeyAuthority.js";

import {
  preparePaisaruleStorageBackupV1Restore,
  destroyPaisaruleVerifiedRestoreFilesV1,
} from "./paisaruleStorageBackupV1RestoreReader.js";
import {
  countPaisaruleStorageBackupV1Entities,
  type PaisaruleV1EntityCounts,
} from "./paisaruleStorageBackupV1EntityCounts.js";

// ============================================================
// PAISARULE_R175_C52
// WINDOWS STORAGE BACKUP V1 - VERIFY ONLY
//
// Native Electron Main coordinator.
//
// Owner identity/scope MUST come from the verified
// business session, never from renderer arguments.
//
// No USB writes.
// No restore commit.
// No plaintext or key material returned to the renderer.
// ============================================================

const MAX_PACKAGE_BYTES = 96 * 1024 * 1024;

export interface PaisaruleRestoreVerifyContextV1 {
  sender: object;
  generation: number;
  scope: PaisaruleStorageBackupV1Scope;
  isCurrent(): boolean;
}

export interface PaisaruleRestoreVerifyDependenciesV1 {
  showOpenDialog(): Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  // PAISARULE_C117_R258_NATIVE_HANDOFF
  // Internal Main-process dependency only.
  // Never include selectedPath in an IPC return value.
  onVerifiedArchive?(selection: {
    readonly selectedPath: string;
    readonly archiveSha256: string;
  }): void | Promise<void>;
}

export type PaisaruleRestoreVerifyResultV1 =
  | {
      success: true;
      cancelled: true;
      verified: false;
      createdAt: null;
      errorCode: null;
    }
  | {
      success: true;
      cancelled: false;
      verified: true;
      createdAt: string;
      fileName: string;
      // PAISARULE_C117_R194_VERIFIED_COUNTS
      // Computed from authenticated primary archive bytes.
      entityCounts: PaisaruleV1EntityCounts;
      errorCode: null;
    }
  | {
      success: false;
      cancelled: false;
      verified: false;
      createdAt: null;
      errorCode: string;
    };

function failure(
  errorCode: string,
): PaisaruleRestoreVerifyResultV1 {
  return {
    success: false,
    cancelled: false,
    verified: false,
    createdAt: null,
    errorCode,
  };
}

export async function verifySelectedPaisaruleBackupV1(
  context: PaisaruleRestoreVerifyContextV1,
  dependencies: PaisaruleRestoreVerifyDependenciesV1,
): Promise<PaisaruleRestoreVerifyResultV1> {
  if (
    !context ||
    !context.sender ||
    !Number.isSafeInteger(context.generation) ||
    !context.scope ||
    typeof context.isCurrent !== "function" ||
    !dependencies ||
    typeof dependencies.showOpenDialog !== "function"
  ) {
    return failure("RESTORE_VERIFY_CONTEXT_INVALID");
  }

  if (!context.isCurrent()) {
    return failure("LOGIN_CHANGED");
  }

  let key: Buffer | null = null;
  let serialized: Buffer | null = null;

  try {
    const dialogResult =
      await dependencies.showOpenDialog();

    if (!context.isCurrent()) {
      return failure("LOGIN_CHANGED");
    }

    if (dialogResult.canceled) {
      return {
        success: true,
        cancelled: true,
        verified: false,
        createdAt: null,
        errorCode: null,
      };
    }

    if (
      !Array.isArray(dialogResult.filePaths) ||
      dialogResult.filePaths.length !== 1
    ) {
      return failure("RESTORE_FILE_SELECTION_INVALID");
    }

    const filePath = dialogResult.filePaths[0];

    if (
      typeof filePath !== "string" ||
      !path.isAbsolute(filePath) ||
      path.extname(filePath).toLowerCase() !== ".paisarule"
    ) {
      return failure("RESTORE_FILE_TYPE_INVALID");
    }

    const fileStat = await lstat(filePath);

    if (
      !fileStat.isFile() ||
      fileStat.isSymbolicLink() ||
      fileStat.size === 0 ||
      fileStat.size > MAX_PACKAGE_BYTES
    ) {
      return failure("RESTORE_FILE_SIZE_INVALID");
    }

    if (!context.isCurrent()) {
      return failure("LOGIN_CHANGED");
    }

    key = getPaisaruleBackupSessionKey(
      context.sender,
      context.generation,
      context.scope,
    );

    if (!key) {
      return failure("BACKUP_SESSION_KEY_UNAVAILABLE");
    }

    serialized = await readFile(filePath);

    if (
      serialized.length === 0 ||
      serialized.length > MAX_PACKAGE_BYTES
    ) {
      return failure("RESTORE_FILE_SIZE_INVALID");
    }

    if (!context.isCurrent()) {
      return failure("LOGIN_CHANGED");
    }

    const restored =
      preparePaisaruleStorageBackupV1Restore(
        serialized.toString("utf8"),
        key,
        context.scope,
      );

    try {
      // Bind the authenticated archive to its original file bytes.
      // Never expose this digest as renderer authorization.
      const originalArchiveSha256 = createHash("sha256")
        .update(serialized)
        .digest("hex");

      if (
        originalArchiveSha256 !== restored.archiveSha256
      ) {
        return failure("RESTORE_ARCHIVE_BYTES_MISMATCH");
      }

      if (!context.isCurrent()) {
        return failure("LOGIN_CHANGED");
      }

      // PAISARULE_R175_C82
      // Filename metadata only. Never expose the full path,
      // selected backup bytes or encryption key.
      const safeFileName = path.basename(filePath)
        .replace(/[\x00-\x1f\x7f]/g, "")
        .slice(-160);

      if (!safeFileName) {
        return failure("RESTORE_FILENAME_INVALID");
      }

      // PAISARULE_C117_R194_VERIFIED_COUNTS
      // Count the independently authenticated PRIMARY file.
      // Never read active USB, never count secondary twice,
      // and never return any underlying records.
      // Failure rejects verification instead of defaulting
      // to zero or trusting renderer-supplied counts.
      const entityCounts =
        countPaisaruleStorageBackupV1Entities(
          restored.files.primary,
          {
            ownerId: context.scope.ownerId,
            businessId: context.scope.businessId,
            branchId: context.scope.branchId,
          },
        );

      if (!context.isCurrent()) {
        return failure("LOGIN_CHANGED");
      }

            // Native handoff only after archive authentication,
      // record validation and current-session validation.
      // Store only path + digest, never plaintext or key.
      // The later commit must independently re-read and
      // reauthenticate the archive.
      if (dependencies.onVerifiedArchive) {
        await dependencies.onVerifiedArchive({
          selectedPath: filePath,
          archiveSha256: originalArchiveSha256,
        });
        if (!context.isCurrent()) {
          return failure("LOGIN_CHANGED");
        }
      }
// Verification-only. Existing finally zeroizes
      // primary/secondary authenticated storage bytes.
      // A future commit must independently re-verify the
      // selected archive and destination USB authority.
      return {
        success: true,
        cancelled: false,
        verified: true,
        createdAt: restored.createdAt,
        fileName: safeFileName,
        entityCounts,
        errorCode: null,
      };
    } finally {
      destroyPaisaruleVerifiedRestoreFilesV1(restored);
    }
  } catch (error) {
    // PAISARULE_R175_C93
    // Return only explicitly allowlisted validation codes.
    // Never expose exception messages, paths, keys or data.
    const safeCodes = new Set([
      "RESTORE_PACKAGE_SIZE_INVALID",
      "RESTORE_KEY_INVALID",
      "RESTORE_AUTH_SCOPE_INVALID",
      "RESTORE_ENVELOPE_JSON_INVALID",
      "RESTORE_ENVELOPE_INVALID",
      "RESTORE_CREATED_AT_INVALID",
      "RESTORE_STORAGE_BYTES_INVALID",
      "RESTORE_STORAGE_JSON_INVALID",
      "RESTORE_STORAGE_PACKAGE_INVALID",
      "RESTORE_STORAGE_VERSION_OR_RECORDS_INVALID",
      "RESTORE_STORAGE_RECORD_INVALID",
      // PAISARULE_R175_C101
      "RESTORE_STAGE_DECRYPT_FAILED",
      "RESTORE_STAGE_PAYLOAD_FAILED",
      "RESTORE_STAGE_PRIMARY_FAILED",
      "RESTORE_STAGE_SECONDARY_FAILED",
      // PAISARULE_R175_C97
      // Known encrypted-envelope validation failures.
      // Codes only: no exception details or sensitive data.
      "BACKUP_FILE_INVALID",
      "BACKUP_ENCODING_INVALID",
      "BACKUP_JSON_INVALID",
      "BACKUP_FORMAT_INVALID",
      "BACKUP_SCHEMA_INVALID",
      "BACKUP_IDENTITY_MISMATCH",
      "BACKUP_CRYPTO_FORMAT_INVALID",
      "BACKUP_SCOPE_INVALID",
      "BACKUP_KEY_INVALID",
      "BACKUP_SCOPE_MISMATCH",
      "BACKUP_AUTHENTICATION_FAILED",
      "BACKUP_DECRYPTION_FAILED",
    ]);

    const code =
      error instanceof Error ? error.message : "";

    return failure(
      safeCodes.has(code)
        ? code
        : "RESTORE_BACKUP_VERIFICATION_FAILED",
    );
  } finally {
    key?.fill(0);
    serialized?.fill(0);
  }
}