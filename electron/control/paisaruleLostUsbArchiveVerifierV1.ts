/**
 * PAISARULE C117-R50
 *
 * Lost-USB archive verification primitive.
 *
 * PRIVILEGED MAIN-PROCESS USE ONLY.
 *
 * Caller MUST independently establish a current
 * server-authenticated OWNER principal before invoking.
 * A renderer-provided principal is never authoritative.
 *
 * This module does NOT authenticate Owner credentials,
 * verify a Recovery Grant, read a file or write a USB.
 */

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import {
  derivePaisaruleStorageBackupV1Key,
  destroyPaisaruleStorageBackupV1Key,
  type PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  preparePaisaruleStorageBackupV1Restore,
} from "./paisaruleStorageBackupV1RestoreReader.js";

const MAX_ARCHIVE_BYTES = 96 * 1024 * 1024;

export interface PaisaruleRecoveryAuthenticatedOwnerV1
  extends PaisaruleStorageBackupV1Scope {
  role: "OWNER";
  storageMode: "USB";
  dataContext: "REAL";
}

export interface PaisaruleRecoveryArchiveVerificationV1 {
  archiveSha256: string;
  createdAt: string;
  scope: PaisaruleStorageBackupV1Scope;
}

function reject(code: string): never {
  throw new Error(code);
}

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 512 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export async function verifyPaisaruleLostUsbArchiveV1(
  originalBytes: Buffer,
  backupPassword: string,
  authenticatedOwner: PaisaruleRecoveryAuthenticatedOwnerV1,
): Promise<PaisaruleRecoveryArchiveVerificationV1> {
  if (
    !Buffer.isBuffer(originalBytes) ||
    originalBytes.length === 0 ||
    originalBytes.length > MAX_ARCHIVE_BYTES
  ) {
    reject("RESTORE_ARCHIVE_BYTES_INVALID");
  }

  if (
    typeof backupPassword !== "string" ||
    backupPassword.length === 0 ||
    Buffer.byteLength(backupPassword, "utf8") > 4096
  ) {
    reject("RESTORE_BACKUP_PASSWORD_INVALID");
  }

  if (
    !authenticatedOwner ||
    authenticatedOwner.role !== "OWNER" ||
    authenticatedOwner.storageMode !== "USB" ||
    authenticatedOwner.dataContext !== "REAL" ||
    !validId(authenticatedOwner.userId) ||
    !validId(authenticatedOwner.ownerId) ||
    !validId(authenticatedOwner.businessId) ||
    !validId(authenticatedOwner.branchId)
  ) {
    reject("RESTORE_AUTHENTICATED_OWNER_INVALID");
  }

  const scope: PaisaruleStorageBackupV1Scope = {
    userId: authenticatedOwner.userId,
    ownerId: authenticatedOwner.ownerId,
    businessId: authenticatedOwner.businessId,
    branchId: authenticatedOwner.branchId,
  };

  // Reject lossy UTF-8 conversions before accepting a digest.
  const serialized = originalBytes.toString("utf8");

  if (!Buffer.from(serialized, "utf8").equals(originalBytes)) {
    reject("RESTORE_ARCHIVE_ENCODING_INVALID");
  }

  let key: Buffer | null = null;

  try {
    key = await derivePaisaruleStorageBackupV1Key(
      backupPassword,
      scope,
    );

    // Existing AES-GCM, payload and Storage V2 validation.
    const restored = preparePaisaruleStorageBackupV1Restore(
      serialized,
      key,
      scope,
    );

    try {
      const originalSha256 = createHash("sha256")
        .update(originalBytes)
        .digest("hex");

      if (originalSha256 !== restored.archiveSha256) {
        reject("RESTORE_ARCHIVE_BYTES_MISMATCH");
      }

      // Not proof of a redeemed grant or server authority.
      return {
        archiveSha256: originalSha256,
        createdAt: restored.createdAt,
        scope,
      };
    } finally {
      restored.files.primary.fill(0);
      restored.files.secondary.fill(0);
    }
  } finally {
    destroyPaisaruleStorageBackupV1Key(key);
  }
}