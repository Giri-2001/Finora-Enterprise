import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  unlink,
} from "node:fs/promises";
import path from "node:path";

import type {
  PaisarulePreparedBusinessRestoreV1,
} from "./paisaruleStorageBackupV1RestoreCore.js";

const MARKER = "paisarule-restore-incomplete";
const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";
const MAX_BYTES = 32 * 1024 * 1024;

export interface PaisaruleUsbCommitAuthorityV1 {
  // Native Main-selected removable drive root.
  targetRoot: string;

  // Authenticated Owner's current USB root.
  // May be drive root or drive\username.
  activeRoot: string;

  // Server-authenticated canonical username.
  // Never accept this from renderer IPC arguments.
  canonicalUsername: string;

  // Fresh Windows authority checks must also reject
  // aliases pointing to the SAME physical USB device.
  assertAuthorizedRemovableTarget(): Promise<void>;
  assertDifferentPhysicalDevice(): Promise<void>;
  assertCurrentOwnerSession(): Promise<void>;

  /**
   * Must provision and read-back verify portable Branch Auth
   * for this same Owner and Branch on the NEW USB.
   * Must never copy authentication from another branch.
   * Must reject expired, revoked or mismatched authority.
   * Failure must throw and leave the incomplete marker.
   */
  provisionAndVerifyPortableAuthentication(
    targetOwnerRoot: string,
  ): Promise<void>;

  /**
   * Provision and independently verify the SAME Owner's
   * current fresh-device runtime authority.
   *
   * Must originate from authenticated live authority;
   * never reconstruct it from historical wallet records
   * or invent missing authorization.
   */
  provisionAndVerifyRuntimeAuthority(
    targetOwnerRoot: string,
  ): Promise<void>;
}

export interface PaisaruleUsbCommitResultV1 {
  committed: true;
  primarySha256: string;
  secondarySha256: string;
  primaryBytes: number;
  secondaryBytes: number;
}

function fail(code: string): never {
  throw new Error(code);
}

function driveRoot(value: string): string {
  if (
    process.platform !== "win32" ||
    typeof value !== "string" ||
    !/^[A-Za-z]:\\$/.test(value)
  ) {
    return fail("RESTORE_DRIVE_ROOT_INVALID");
  }

  return value.toUpperCase();
}

function activeDriveRoot(value: string): string {
  if (
    typeof value !== "string" ||
    !path.win32.isAbsolute(value) ||
    value.startsWith("\\\\")
  ) {
    return fail("RESTORE_ACTIVE_ROOT_INVALID");
  }

  return driveRoot(path.win32.parse(value).root);
}

function safeUsername(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 100 ||
    value !== value.normalize("NFKC").toLowerCase() ||
    value === "." ||
    value === ".." ||
    value.endsWith(".") ||
    value.endsWith(" ") ||
    /[\\/:*?"<>|\u0000-\u001f\u007f]/.test(value) ||
    /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)
  ) {
    return fail("RESTORE_CANONICAL_USERNAME_INVALID");
  }

  return value;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertBytes(value: Buffer, label: string): void {
  if (
    !Buffer.isBuffer(value) ||
    value.length === 0 ||
    value.length > MAX_BYTES
  ) {
    fail("RESTORE_" + label + "_INVALID");
  }
}

async function checkAuthority(
  authority: PaisaruleUsbCommitAuthorityV1,
): Promise<void> {
  await authority.assertCurrentOwnerSession();
  await authority.assertAuthorizedRemovableTarget();
  await authority.assertDifferentPhysicalDevice();
}

async function writeExclusiveVerified(
  filePath: string,
  bytes: Buffer,
): Promise<void> {
  const handle = await open(filePath, "wx");

  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }

  const actual = await readFile(filePath);

  try {
    if (
      actual.length !== bytes.length ||
      sha256(actual) !== sha256(bytes)
    ) {
      fail("RESTORE_WRITTEN_HASH_MISMATCH");
    }
  } finally {
    actual.fill(0);
  }
}

/**
 * Privileged, fail-closed Storage V2 Restore.
 *
 * Main must independently verify:
 * - currently authenticated Owner and Branch;
 * - selected target is a real removable USB;
 * - target is physically different from source USB;
 * - server-derived canonical username;
 * - backup belongs to the same Owner and Branch.
 *
 * Empty target only. No overwrite. No LOCAL fallback.
 * Marker remains on any failure after its creation.
 * This module does NOT provision portable authentication.
 */
export async function commitPaisaruleRestoreToEmptyUsbV1(
  prepared: PaisarulePreparedBusinessRestoreV1,
  authority: PaisaruleUsbCommitAuthorityV1,
): Promise<PaisaruleUsbCommitResultV1> {
  if (
    !prepared ||
    !authority ||
    typeof authority.assertCurrentOwnerSession !== "function" ||
    typeof authority.assertAuthorizedRemovableTarget !== "function" ||
    typeof authority.assertDifferentPhysicalDevice !== "function" ||
    typeof authority.provisionAndVerifyPortableAuthentication !== "function" ||
    typeof authority.provisionAndVerifyRuntimeAuthority !== "function"
  ) {
    return fail("RESTORE_COMMIT_AUTHORITY_INVALID");
  }

  assertBytes(prepared.primaryBytes, "PRIMARY");
  assertBytes(prepared.secondaryBytes, "SECONDARY");

  const target = driveRoot(authority.targetRoot);
  const active = activeDriveRoot(authority.activeRoot);
  const username = safeUsername(authority.canonicalUsername);

  if (target === active) {
    return fail("RESTORE_ACTIVE_USB_FORBIDDEN");
  }

  await checkAuthority(authority);

  const stat = await lstat(target);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    return fail("RESTORE_TARGET_INVALID");
  }

  const resolved = await realpath(target);

  if (
    driveRoot(path.win32.parse(resolved).root) !== target
  ) {
    return fail("RESTORE_TARGET_ROOT_CHANGED");
  }

  // Destination USB MUST be completely empty.
  // Do not delete any existing content.
  if ((await readdir(target)).length !== 0) {
    return fail("RESTORE_USB_NOT_EMPTY");
  }

  await checkAuthority(authority);

  const markerPath = path.win32.join(target, MARKER);

  const storageDir = path.win32.join(
    target,
    username,
    "FINORA",
    "storage",
  );

  // The first mutation marks the ENTIRE drive incomplete.
  const marker = await open(markerPath, "wx");

  try {
    await marker.writeFile(
      "PAISARULE_RESTORE_INCOMPLETE\n",
    );
    await marker.sync();
  } finally {
    await marker.close();
  }

  // Any subsequent failure leaves the marker blocking
  // ordinary Storage V2 access on this USB drive.
  await mkdir(storageDir, { recursive: true });

  const primaryPath = path.win32.join(
    storageDir,
    PRIMARY,
  );

  const secondaryPath = path.win32.join(
    storageDir,
    SECONDARY,
  );

  await checkAuthority(authority);

  await writeExclusiveVerified(
    primaryPath,
    prepared.primaryBytes,
  );

  await checkAuthority(authority);

  await writeExclusiveVerified(
    secondaryPath,
    prepared.secondaryBytes,
  );

  await checkAuthority(authority);

  const primaryReadback = await readFile(primaryPath);
  const secondaryReadback = await readFile(secondaryPath);

  try {
    const primarySha256 = sha256(prepared.primaryBytes);
    const secondarySha256 = sha256(prepared.secondaryBytes);

    if (
      primaryReadback.length !== prepared.primaryBytes.length ||
      secondaryReadback.length !== prepared.secondaryBytes.length ||
      sha256(primaryReadback) !== primarySha256 ||
      sha256(secondaryReadback) !== secondarySha256
    ) {
      return fail("RESTORE_FINAL_INTEGRITY_FAILED");
    }

    await checkAuthority(authority);

    // Keep the incomplete marker until the SAME Owner's
    // portable authentication is provisioned and verified.
    // Authentication must not depend on restoring wallet
    // spend authority or modifying production records.
    const ownerRoot = path.win32.join(target, username);

    await authority.provisionAndVerifyPortableAuthentication(
      ownerRoot,
    );

    await checkAuthority(authority);

    // Fresh-device runtime authority is separate from
    // Portable Branch Auth and Storage V2 history.
    await authority.provisionAndVerifyRuntimeAuthority(
      ownerRoot,
    );

    await checkAuthority(authority);

    // Both Storage V2 files, Portable Auth and Runtime
    // Authority must all be verified before unblocking.
    await unlink(markerPath);

    return {
      committed: true,
      primarySha256,
      secondarySha256,
      primaryBytes: primaryReadback.length,
      secondaryBytes: secondaryReadback.length,
    };
  } finally {
    primaryReadback.fill(0);
    secondaryReadback.fill(0);
  }
}