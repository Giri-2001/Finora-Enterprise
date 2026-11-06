import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

import {
  decryptPaisaruleStorageBackupV1,
  type PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  parsePaisaruleStorageBackupV1RestorePayload,
  type PaisaruleVerifiedRestoreFilesV1,
} from "./paisaruleStorageBackupV1RestorePayload.js";
import {
  validatePaisaruleRestoreStorageV2,
} from "./paisaruleStorageBackupV1RestoreSchema.js";

// ============================================================
// PAISARULE_R175_C40
// WINDOWS STORAGE BACKUP V1 VERIFIED RESTORE READER
//
// Native Electron Main use only.
//
// Caller MUST provide a server-authenticated Owner scope
// and a scope-bound key from native session authority.
//
// Never accept scope or key material from the renderer.
//
// No filesystem access.
// No USB writes.
// No business data returned to the renderer.
// ============================================================

const MAX_PACKAGE_BYTES = 96 * 1024 * 1024;

export interface PaisaruleVerifiedRestoreResultV1 {
  files: PaisaruleVerifiedRestoreFilesV1;
  createdAt: string;
  archiveSha256: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function readUntrustedEnvelopeCreatedAt(
  serialized: string,
): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    return fail("RESTORE_ENVELOPE_JSON_INVALID");
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return fail("RESTORE_ENVELOPE_INVALID");
  }

  const value = parsed as Record<string, unknown>;

  if (
    typeof value.createdAt !== "string" ||
    value.createdAt.length === 0 ||
    value.createdAt.length > 128 ||
    !Number.isFinite(Date.parse(value.createdAt))
  ) {
    return fail("RESTORE_CREATED_AT_INVALID");
  }

  // This field is initially untrusted.
  // AES-GCM decryption authenticates it through the V1 AAD.
  return value.createdAt;
}

/**
 * Verifies an encrypted V1 backup without writing to disk.
 *
 * The existing V1 decryptor checks the envelope,
 * scope fingerprint, AES-GCM AAD and authentication tag.
 *
 * The C38 payload validator checks file metadata,
 * SHA256, identity scope and payload structure.
 *
 * Full application storage semantics must additionally
 * be validated before any future USB commit.
 */
export function preparePaisaruleStorageBackupV1Restore(
  serializedBackup: string,
  scopedKey: Uint8Array,
  authenticatedScope: PaisaruleStorageBackupV1Scope,
): PaisaruleVerifiedRestoreResultV1 {

  if (
    typeof serializedBackup !== "string" ||
    serializedBackup.length === 0 ||
    Buffer.byteLength(serializedBackup, "utf8") >
      MAX_PACKAGE_BYTES
  ) {
    return fail("RESTORE_PACKAGE_SIZE_INVALID");
  }

  if (
    !(scopedKey instanceof Uint8Array) ||
    scopedKey.byteLength !== 32
  ) {
    return fail("RESTORE_KEY_INVALID");
  }

  if (
    authenticatedScope === null ||
    typeof authenticatedScope !== "object"
  ) {
    return fail("RESTORE_AUTH_SCOPE_INVALID");
  }

  const createdAt = readUntrustedEnvelopeCreatedAt(
    serializedBackup,
  );

  let plaintext: Buffer | null = null;

  try {
    // PAISARULE_R175_C101
    // Report only the failed validation stage.
    // Never expose plaintext, keys or exception details.
    try {
      plaintext = decryptPaisaruleStorageBackupV1(
        serializedBackup,
        scopedKey,
        authenticatedScope,
      );
    } catch (error) {
      // PAISARULE_R175_C106
      // Preserve only predetermined crypto validation codes.
      // Never expose unexpected exception messages or secret data.
      const knownCryptoCodes = new Set([
        "BACKUP_SCOPE_INVALID",
        "BACKUP_KEY_INVALID",
        "BACKUP_FILE_INVALID",
        "BACKUP_JSON_INVALID",
        "BACKUP_FORMAT_INVALID",
        "BACKUP_SCHEMA_INVALID",
        "BACKUP_ENCODING_INVALID",
        "BACKUP_IDENTITY_MISMATCH",
        "BACKUP_CRYPTO_FORMAT_INVALID",
        "BACKUP_DECRYPTION_FAILED",
      ]);

      const code = error instanceof Error ? error.message : "";

      throw new Error(
        knownCryptoCodes.has(code)
          ? code
          : "RESTORE_STAGE_DECRYPT_FAILED",
      );
    }

    // Decryption authenticated the createdAt metadata
    // because the existing V1 AES-GCM AAD includes it.
    const files = (() => {
      try {
        return parsePaisaruleStorageBackupV1RestorePayload(
          plaintext!,
          authenticatedScope,
          createdAt,
        );
      } catch {
        throw new Error("RESTORE_STAGE_PAYLOAD_FAILED");
      }
    })();

    try {
      try {
        validatePaisaruleRestoreStorageV2(
          files.primary,
          "PRIMARY",
        );
      } catch {
        throw new Error("RESTORE_STAGE_PRIMARY_FAILED");
      }

      try {
        validatePaisaruleRestoreStorageV2(
          files.secondary,
          "SECONDARY",
        );
      } catch {
        throw new Error("RESTORE_STAGE_SECONDARY_FAILED");
      }
    } catch (error) {
      files.primary.fill(0);
      files.secondary.fill(0);
      throw error;
    }

    return {
      files,
      createdAt,
      // SHA256 of the successfully verified serialized archive.
      // Internal Main-process result; not a renderer authorization.
      archiveSha256: createHash("sha256")
        .update(serializedBackup, "utf8")
        .digest("hex"),
    };
  } finally {
    // Never retain decrypted JSON plaintext after parsing.
    plaintext?.fill(0);
  }
}

/**
 * Clear verified original storage bytes after use.
 *
 * Must also run when a future USB transaction fails.
 */
export function destroyPaisaruleVerifiedRestoreFilesV1(
  result: PaisaruleVerifiedRestoreResultV1,
): void {
  result.files.primary.fill(0);
  result.files.secondary.fill(0);
}