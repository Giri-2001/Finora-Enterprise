import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  PaisarulePreparedBusinessRestoreV1,
} from "./paisaruleStorageBackupV1RestoreCore.js";

const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";

const MAX_FILE_BYTES = 32 * 1024 * 1024;

export interface PaisaruleAtomicRestoreInput {
  /**
   * Privileged Main Process must supply an authenticated,
   * removable branch root. Never accept a renderer path.
   */
  branchRoot: string;
  prepared: PaisarulePreparedBusinessRestoreV1;

  /**
   * Rechecks authenticated session and destination authority
   * immediately before the final directory rename.
   */
  isCurrent(): boolean;
}

export interface PaisaruleAtomicRestoreResult {
  installed: true;
  primaryBytes: number;
  secondaryBytes: number;
}

function fail(code: string): never {
  throw new Error(code);
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function samePath(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);

  return process.platform === "win32"
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

async function assertRealDirectory(
  directory: string,
): Promise<string> {
  const info = await fs.lstat(directory);

  if (
    info.isSymbolicLink() ||
    !info.isDirectory()
  ) {
    return fail("RESTORE_DIRECTORY_INVALID");
  }

  const real = await fs.realpath(directory);

  if (!samePath(directory, real)) {
    return fail("RESTORE_DIRECTORY_ALIAS_REJECTED");
  }

  return real;
}

async function assertMissing(target: string): Promise<void> {
  try {
    await fs.lstat(target);
  } catch (error) {
    if (isMissing(error)) {
      return;
    }

    throw error;
  }

  return fail("RESTORE_DESTINATION_NOT_EMPTY");
}

async function writeAndSync(
  filename: string,
  bytes: Buffer,
): Promise<void> {
  const handle = await fs.open(filename, "wx", 0o600);

  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

/**
 * Privileged, no-overwrite installation primitive.
 *
 * This function does not authenticate the Owner or determine
 * whether the target is removable. Main Process must verify:
 *
 * 1. Valid Owner session and required Security Code.
 * 2. Backup belongs to this exact Owner/Business/Branch.
 * 3. Target USB is approved for this authenticated branch.
 * 4. Target is not the active source USB.
 * 5. No other business process is writing to this target.
 *
 * Files are staged in a newly created sibling directory.
 * Publishing is attempted by renaming that directory.
 *
 * It never intentionally deletes existing business storage.
 */
export async function installPaisarulePreparedBusinessV1(
  input: PaisaruleAtomicRestoreInput,
): Promise<PaisaruleAtomicRestoreResult> {
  if (
    !input ||
    typeof input.branchRoot !== "string" ||
    !path.isAbsolute(input.branchRoot) ||
    typeof input.isCurrent !== "function" ||
    !input.isCurrent()
  ) {
    return fail("RESTORE_DESTINATION_AUTHORITY_REQUIRED");
  }

  const primary = input.prepared?.primaryBytes;
  const secondary = input.prepared?.secondaryBytes;

  if (
    !Buffer.isBuffer(primary) ||
    !Buffer.isBuffer(secondary) ||
    primary.length === 0 ||
    secondary.length === 0 ||
    primary.length > MAX_FILE_BYTES ||
    secondary.length > MAX_FILE_BYTES
  ) {
    return fail("RESTORE_PREPARED_DATA_INVALID");
  }

  // The authenticated Owner root must already exist.
  const root = await assertRealDirectory(input.branchRoot);

  // Portable Branch Auth setup must establish this directory
  // before Business Data Restore is permitted.
  const finora = path.join(root, "FINORA");

  await assertRealDirectory(finora);

  const destination = path.join(finora, "storage");

  // Never replace storage belonging to any existing business.
  await assertMissing(destination);

  if (!input.isCurrent()) {
    return fail("RESTORE_SESSION_CHANGED");
  }

  const staging = path.join(
    finora,
    ".paisarule-restore-" + randomUUID(),
  );

  let stagingCreated = false;
  let published = false;

  try {
    // Exclusive creation; refuse preexisting staging folders.
    await fs.mkdir(staging);
    stagingCreated = true;

    await writeAndSync(
      path.join(staging, PRIMARY),
      primary,
    );

    await writeAndSync(
      path.join(staging, SECONDARY),
      secondary,
    );

    // Verify staged bytes before publication.
    const [verifiedPrimary, verifiedSecondary] =
      await Promise.all([
        fs.readFile(path.join(staging, PRIMARY)),
        fs.readFile(path.join(staging, SECONDARY)),
      ]);

    try {
      if (
        !verifiedPrimary.equals(primary) ||
        !verifiedSecondary.equals(secondary)
      ) {
        return fail("RESTORE_STAGING_VERIFICATION_FAILED");
      }
    } finally {
      verifiedPrimary.fill(0);
      verifiedSecondary.fill(0);
    }

    if (!input.isCurrent()) {
      return fail("RESTORE_SESSION_CHANGED");
    }

    // Fail closed if another process created target storage.
    await assertMissing(destination);

    // Rename within the same FINORA directory/filesystem.
    // Existing destination storage must never be overwritten.
    await fs.rename(staging, destination);
    published = true;

    return {
      installed: true,
      primaryBytes: primary.length,
      secondaryBytes: secondary.length,
    };
  } finally {
    if (stagingCreated && !published) {
      // Only remove this invocation's private staging folder.
      // Never remove the target storage directory.
      await fs.rm(staging, {
        recursive: true,
        force: true,
      }).catch(() => {
        // A failed cleanup must not delete other data.
        // Leftover private staging requires recovery audit.
      });
    }
  }
}