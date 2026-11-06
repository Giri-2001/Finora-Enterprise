import { Buffer } from "node:buffer";
import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  decryptPaisaruleStorageBackupV1,
} from "./paisaruleStorageBackupV1Crypto.js";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  validatePaisaruleStorageBackupV1Payload,
} from "./paisaruleStorageBackupV1Payload.js";

import type {
  PaisaruleStorageBackupV1FileEntry,
} from "./paisaruleStorageBackupV1Payload.js";

const MAX_ARCHIVE_BYTES =
  96 * 1024 * 1024;

const MAX_STORAGE_FILE_BYTES =
  32 * 1024 * 1024;

export interface PaisarulePreparedBusinessRestoreV1 {
  primaryBytes: Buffer;
  secondaryBytes: Buffer;
  createdAt: string;
  recordCount: number;
  backupRecordCount: number;
}

function fail(code: string): never {
  throw new Error(code);
}

function decodeVerifiedStorageFile(
  entry: PaisaruleStorageBackupV1FileEntry,
): Buffer {
  if (
    !entry ||
    typeof entry !== "object" ||
    typeof entry.sha256 !== "string" ||
    typeof entry.contentBase64 !== "string"
  ) {
    return fail("RESTORE_FILE_ENTRY_INVALID");
  }

  if (
    !/^[a-f0-9]{64}$/.test(entry.sha256) ||
    entry.contentBase64.length === 0 ||
    entry.contentBase64.length >
      Math.ceil(MAX_STORAGE_FILE_BYTES / 3) * 4
  ) {
    return fail("RESTORE_FILE_METADATA_INVALID");
  }

  const bytes =
    Buffer.from(entry.contentBase64, "base64");

  try {
    if (
      bytes.length === 0 ||
      bytes.length > MAX_STORAGE_FILE_BYTES ||
      bytes.toString("base64") !== entry.contentBase64
    ) {
      return fail("RESTORE_FILE_ENCODING_INVALID");
    }

    const actualHash =
      createHash("sha256")
        .update(bytes)
        .digest();

    const expectedHash =
      Buffer.from(entry.sha256, "hex");

    try {
      if (
        actualHash.length !== expectedHash.length ||
        !timingSafeEqual(actualHash, expectedHash)
      ) {
        return fail("RESTORE_FILE_HASH_MISMATCH");
      }
    } finally {
      actualHash.fill(0);
      expectedHash.fill(0);
    }

    return bytes;
  } catch (error) {
    bytes.fill(0);
    throw error;
  }
}

/**
 * Prepare an encrypted PAISARULE Business Backup V1
 * for a future privileged USB restore transaction.
 *
 * IMPORTANT:
 * - No filesystem writes.
 * - No USB root selection.
 * - No login/session verification.
 * - No renderer-controlled destination.
 * - No overwrite of existing branch data.
 *
 * The privileged caller must verify the Owner session,
 * destination USB authority and branch scope separately.
 *
 * Caller owns both returned Buffers and must zero them
 * after installation or on failure.
 */
export function preparePaisaruleBusinessRestoreV1(
  serializedBackup: string,
  key: Uint8Array,
  expectedScope: PaisaruleStorageBackupV1Scope,
): PaisarulePreparedBusinessRestoreV1 {
  if (
    typeof serializedBackup !== "string" ||
    serializedBackup.length === 0 ||
    Buffer.byteLength(serializedBackup, "utf8") >
      MAX_ARCHIVE_BYTES
  ) {
    return fail("RESTORE_ARCHIVE_INVALID");
  }

  let plaintext: Buffer | null = null;
  let primaryBytes: Buffer | null = null;
  let secondaryBytes: Buffer | null = null;
  let completed = false;

  try {
    plaintext = decryptPaisaruleStorageBackupV1(
      serializedBackup,
      key,
      expectedScope,
    );

    const validation =
      validatePaisaruleStorageBackupV1Payload(
        plaintext,
        expectedScope,
      );

    const files = validation.payload.storageFiles;

    primaryBytes = decodeVerifiedStorageFile(
      files["finora-storage.json"],
    );

    secondaryBytes = decodeVerifiedStorageFile(
      files["finora-storage.backup.json"],
    );

    if (
      !Number.isSafeInteger(validation.recordCount) ||
      validation.recordCount < 0 ||
      !Number.isSafeInteger(validation.backupRecordCount) ||
      validation.backupRecordCount < 0
    ) {
      return fail("RESTORE_RECORD_COUNT_INVALID");
    }

    const result: PaisarulePreparedBusinessRestoreV1 = {
      primaryBytes,
      secondaryBytes,
      createdAt: validation.payload.createdAt,
      recordCount: validation.recordCount,
      backupRecordCount: validation.backupRecordCount,
    };

    completed = true;

    return result;
  } finally {
    plaintext?.fill(0);

    if (!completed) {
      primaryBytes?.fill(0);
      secondaryBytes?.fill(0);
    }
  }
}

export function destroyPaisarulePreparedBusinessRestoreV1(
  prepared: PaisarulePreparedBusinessRestoreV1 | null,
): void {
  if (!prepared) {
    return;
  }

  prepared.primaryBytes.fill(0);
  prepared.secondaryBytes.fill(0);
}