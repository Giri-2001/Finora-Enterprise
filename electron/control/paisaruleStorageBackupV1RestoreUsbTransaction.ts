import {
  open,
  mkdir,
  readdir,
  readFile,
  realpath,
  lstat,
  unlink,
} from "node:fs/promises";

import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";
import path from "node:path";

import type {
  PaisaruleVerifiedRestoreFilesV1,
} from "./paisaruleStorageBackupV1RestorePayload.js";

// ============================================================
// PAISARULE_R175_C42
// WINDOWS STORAGE BACKUP V1 - NEW USB RESTORE WRITER
//
// Native Electron Main only. No renderer IPC exposure.
//
// Removable-drive authority MUST be verified by a trusted,
// independently implemented Windows native check.
//
// Fail closed: an incomplete marker is retained on failure.
// ============================================================

const MARKER = "paisarule-restore-incomplete";
const MAX_FILE_BYTES = 32 * 1024 * 1024;

export interface PaisaruleRestoreUsbDependenciesV1 {
  // PAISARULE_R175_C68
  // Recheck the physical target during the transaction.
  assertTargetIdentity(): Promise<void>;
  verifyRemovableDriveRoot(
    canonicalDriveRoot: string,
  ): Promise<void>;
}

function fail(code: string): never {
  throw new Error(code);
}

function validFile(value: Buffer): boolean {
  return (
    Buffer.isBuffer(value) &&
    value.length > 0 &&
    value.length <= MAX_FILE_BYTES
  );
}

function isWindowsDriveRoot(value: string): boolean {
  return /^[A-Za-z]:\\$/.test(value);
}

async function requireEmptyRoot(
  root: string,
): Promise<void> {
  const stat = await lstat(root);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail("RESTORE_USB_ROOT_INVALID");
  }

  const entries = await readdir(root);

  if (entries.length !== 0) {
    fail("RESTORE_USB_NOT_EMPTY");
  }
}

async function createAndSync(
  filePath: string,
  content: Buffer,
): Promise<void> {
  // Exclusive creation rejects existing files.
  const handle = await open(filePath, "wx");

  try {
    let offset = 0;

    while (offset < content.length) {
      const result = await handle.write(
        content,
        offset,
        content.length - offset,
        offset,
      );

      if (result.bytesWritten <= 0) {
        fail("RESTORE_USB_WRITE_INCOMPLETE");
      }

      offset += result.bytesWritten;
    }

    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function verifyReadback(
  filePath: string,
  expected: Buffer,
): Promise<void> {
  const stat = await lstat(filePath);

  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size !== expected.length
  ) {
    fail("RESTORE_READBACK_FILE_INVALID");
  }

  const actual = await readFile(filePath);

  try {
    if (actual.length !== expected.length) {
      fail("RESTORE_READBACK_SIZE_MISMATCH");
    }

    const firstHash = createHash("sha256")
      .update(expected).digest();

    const secondHash = createHash("sha256")
      .update(actual).digest();

    try {
      if (!timingSafeEqual(firstHash, secondHash)) {
        fail("RESTORE_READBACK_HASH_MISMATCH");
      }

      if (!timingSafeEqual(expected, actual)) {
        fail("RESTORE_READBACK_BYTES_MISMATCH");
      }
    } finally {
      firstHash.fill(0);
      secondHash.fill(0);
    }
  } finally {
    actual.fill(0);
  }
}

export async function commitPaisaruleV1ToNewEmptyUsb(
  selectedDriveRoot: string,
  files: PaisaruleVerifiedRestoreFilesV1,
  dependencies: PaisaruleRestoreUsbDependenciesV1,
): Promise<void> {

  if (
    process.platform !== "win32" ||
    typeof selectedDriveRoot !== "string" ||
    !isWindowsDriveRoot(selectedDriveRoot) ||
    !files ||
    !validFile(files.primary) ||
    !validFile(files.secondary) ||
    !dependencies ||
    typeof dependencies.verifyRemovableDriveRoot !== "function" ||
    typeof dependencies.assertTargetIdentity !== "function"
  ) {
    fail("RESTORE_USB_INPUT_INVALID");
  }

  const canonical = await realpath(selectedDriveRoot);

  // Reject subdirectories, mapped aliases and non-drive roots.
  if (
    !isWindowsDriveRoot(canonical) ||
    path.win32.normalize(canonical).toLowerCase() !==
      path.win32.normalize(selectedDriveRoot).toLowerCase()
  ) {
    fail("RESTORE_USB_CANONICAL_ROOT_INVALID");
  }

  // This dependency must be backed by trusted Windows
  // removable-volume verification. Never substitute
  // renderer input or a hardcoded success callback.
  await dependencies.verifyRemovableDriveRoot(canonical);

  // No existing FINORA or unrelated files are permitted.
  await requireEmptyRoot(canonical);

  const markerPath = path.join(canonical, MARKER);
  const finoraPath = path.join(canonical, "FINORA");
  const storagePath = path.join(finoraPath, "storage");

  // A second empty-root check narrows the pre-write window.
  await requireEmptyRoot(canonical);

  // PAISARULE_R175_C68: Check before first USB mutation.
  await dependencies.assertTargetIdentity();

  // Marker is created before any business storage mutation.
  // If interrupted, the marker must block normal access.
  await createAndSync(
    markerPath,
    Buffer.from("PAISARULE_RESTORE_INCOMPLETE_V1\n", "utf8"),
  );

  // NEVER auto-delete the marker on failure.
  // NEVER overwrite existing business storage.
  await dependencies.assertTargetIdentity();
  await mkdir(finoraPath);
  await mkdir(storagePath);

  const primaryPath = path.join(
    storagePath, "finora-storage.json",
  );

  const secondaryPath = path.join(
    storagePath, "finora-storage.backup.json",
  );

  await dependencies.assertTargetIdentity();
  await createAndSync(primaryPath, files.primary);
  await verifyReadback(primaryPath, files.primary);

  await dependencies.assertTargetIdentity();
  await createAndSync(secondaryPath, files.secondary);
  await verifyReadback(secondaryPath, files.secondary);

  // Recheck both restored files before finalization.
  await verifyReadback(primaryPath, files.primary);
  await verifyReadback(secondaryPath, files.secondary);

  // Success requires both files verified and marker removed.
  // Never finalize a transaction on a changed USB target.
  await dependencies.assertTargetIdentity();
  await unlink(markerPath);
}