import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  preparePaisaruleStorageBackupV1Restore,
  destroyPaisaruleVerifiedRestoreFilesV1,
} from "./paisaruleStorageBackupV1RestoreReader.js";

import {
  countPaisaruleStorageBackupV1Entities,
} from "./paisaruleStorageBackupV1EntityCounts.js";

const MAX_ARCHIVE_BYTES = 96 * 1024 * 1024;

function reject(code: string): never {
  throw new Error(code);
}

export interface PaisaruleCommitVerifiedFilesV1 {
  readonly primary: Uint8Array;
  readonly secondary: Uint8Array;
}

export interface PaisaruleCommitVerifiedSnapshotV1 {
  readonly archiveSha256: string;
  readonly createdAt: string;
  readonly files: PaisaruleCommitVerifiedFilesV1;
  readonly entityCounts: ReturnType<
    typeof countPaisaruleStorageBackupV1Entities
  >;
}

/**
 * PAISARULE_C117_R251_COMMIT_REVERIFY
 *
 * Main-process-only re-verification of the exact archive bytes.
 *
 * The caller must obtain archiveBytes from a native-pinned,
 * authenticated file selection and independently confirm the
 * Owner session, selected branch and physical USB identity.
 *
 * scopedKey must come from the existing native session-key
 * authority; neither key nor scope may come from the renderer.
 *
 * The callback must complete all work using the verified data
 * before returning. Decrypted file buffers are always zeroized
 * when the callback resolves or rejects.
 *
 * This module performs NO filesystem access and NO Restore commit.
 */
export async function withPaisaruleCommitReverifiedBackupV1<T>(
  archiveBytes: Uint8Array,
  scopedKey: Uint8Array,
  scope: PaisaruleStorageBackupV1Scope,
  expectedArchiveSha256: string,
  isCurrent: () => boolean,
  operation: (
    verified: PaisaruleCommitVerifiedSnapshotV1,
  ) => Promise<T>,
): Promise<T> {
  if (
    !(archiveBytes instanceof Uint8Array) ||
    archiveBytes.byteLength === 0 ||
    archiveBytes.byteLength > MAX_ARCHIVE_BYTES ||
    !(scopedKey instanceof Uint8Array) ||
    scopedKey.byteLength !== 32 ||
    !scope ||
    typeof scope !== "object" ||
    !/^[a-f0-9]{64}$/i.test(expectedArchiveSha256) ||
    typeof isCurrent !== "function" ||
    typeof operation !== "function"
  ) {
    reject("RESTORE_COMMIT_REVERIFY_INPUT_INVALID");
  }

  if (!isCurrent()) {
    reject("RESTORE_COMMIT_LOGIN_CHANGED");
  }

  const expected = Buffer.from(
    expectedArchiveSha256,
    "hex",
  );

  const actual = createHash("sha256")
    .update(archiveBytes)
    .digest();

  try {
    if (!timingSafeEqual(actual, expected)) {
      reject("RESTORE_COMMIT_ARCHIVE_CHANGED");
    }
  } finally {
    actual.fill(0);
    expected.fill(0);
  }

  if (!isCurrent()) {
    reject("RESTORE_COMMIT_LOGIN_CHANGED");
  }

  // The existing reader validates the authenticated archive,
  // decrypts both storage snapshots and enforces Owner scope.
  const serialized = Buffer.from(archiveBytes)
    .toString("utf8");

  const restored =
    preparePaisaruleStorageBackupV1Restore(
      serialized,
      scopedKey,
      scope,
    );

  try {
    if (
      restored.archiveSha256.toLowerCase() !==
      expectedArchiveSha256.toLowerCase()
    ) {
      reject("RESTORE_COMMIT_ARCHIVE_BYTES_MISMATCH");
    }

    const entityCounts =
      countPaisaruleStorageBackupV1Entities(
        restored.files.primary,
        {
          ownerId: scope.ownerId,
          businessId: scope.businessId,
          branchId: scope.branchId,
        },
      );

    if (!isCurrent()) {
      reject("RESTORE_COMMIT_LOGIN_CHANGED");
    }

    return await operation({
      archiveSha256: restored.archiveSha256,
      createdAt: restored.createdAt,
      files: restored.files,
      entityCounts,
    });
  } finally {
    destroyPaisaruleVerifiedRestoreFilesV1(restored);
  }
}