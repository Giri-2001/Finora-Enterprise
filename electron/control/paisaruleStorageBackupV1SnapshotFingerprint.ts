import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import * as path from "node:path";

import type {
  PaisaruleV1SourceFingerprint,
} from "./paisaruleStorageBackupV1SourceFingerprint.js";

const MAX_FILE_BYTES = 32 * 1024 * 1024;

const PRIMARY_FILE = "finora-storage.json";
const SECONDARY_FILE = "finora-storage.backup.json";

function fail(code: string): never {
  throw new Error(code);
}

function validateBytes(
  value: unknown,
): asserts value is Buffer {
  if (
    !Buffer.isBuffer(value) ||
    value.length <= 0 ||
    value.length > MAX_FILE_BYTES
  ) {
    fail("BACKUP_SNAPSHOT_BYTES_INVALID");
  }
}

/**
 * Compute the exact same fingerprint format as
 * capturePaisaruleV1SourceFingerprint, but from
 * the already-read primary and secondary bytes.
 *
 * No filesystem access, no USB reread, no encryption.
 *
 * The caller owns the Buffers and must zero them
 * after payload creation. This function does not
 * mutate either input Buffer.
 *
 * canonicalUsbRoot must originate from trusted
 * Electron main-process realpath resolution.
 */
export function fingerprintPaisaruleV1SnapshotBytes(
  canonicalUsbRoot: string,
  primaryBytes: Buffer,
  secondaryBytes: Buffer,
): PaisaruleV1SourceFingerprint {
  if (
    typeof canonicalUsbRoot !== "string" ||
    canonicalUsbRoot.length === 0 ||
    canonicalUsbRoot.trim() !== canonicalUsbRoot ||
    !path.isAbsolute(canonicalUsbRoot)
  ) {
    return fail("BACKUP_SNAPSHOT_ROOT_INVALID");
  }

  validateBytes(primaryBytes);
  validateBytes(secondaryBytes);

  const parts = [
    "PAISARULE_V1_SOURCE_FINGERPRINT",
    canonicalUsbRoot,
  ];

  for (const [name, bytes] of [
    [PRIMARY_FILE, primaryBytes],
    [SECONDARY_FILE, secondaryBytes],
  ] as const) {
    const hash = createHash("sha256")
      .update(bytes)
      .digest("hex");

    parts.push(name, String(bytes.length), hash);
  }

  const digest = createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex");

  return Object.freeze({ digest });
}