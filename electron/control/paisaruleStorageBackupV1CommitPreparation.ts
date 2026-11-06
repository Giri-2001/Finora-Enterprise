import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import type {
  PaisaruleWalletMergeInputV1,
  PaisaruleWalletMergeResultV1,
} from "./paisaruleStorageBackupV1WalletMerge.js";

import {
  withPaisaruleCommitReverifiedBackupV1,
} from "./paisaruleStorageBackupV1CommitReverify.js";

const MAX_STORAGE_BYTES = 32 * 1024 * 1024;

function reject(code: string): never {
  throw new Error(code);
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}

function validHash(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

export interface PaisaruleCommitPreparationInputV1 {
  // All fields must be supplied by authenticated Electron Main.
  archiveBytes: Uint8Array;
  scopedKey: Uint8Array;
  expectedArchiveSha256: string;
  scope: PaisaruleStorageBackupV1Scope;
  currentPrimary: Uint8Array;
  currentSecondary: Uint8Array;
  expectedPrimarySha256: string;
  expectedSecondarySha256: string;
  isCurrent(): boolean;
}

export interface PaisarulePreparedSnapshotsV1 {
  readonly primary: Uint8Array;
  readonly secondary: Uint8Array;
  readonly archiveSha256: string;
  readonly backupRecordCount: number;
  readonly finalRecordCount: number;
  readonly preservedWalletRecords: 1;
}

/**
 * PAISARULE_C117_R254_COMMIT_PREPARATION
 *
 * Native-only preparation between Restore verification and the
 * folder transaction. This module performs no filesystem I/O.
 *
 * Caller MUST hold shared Restore exclusion throughout its use,
 * reverify server session and physical USB identity, and supply
 * destination bytes read under that exclusion.
 *
 * The actual WALLET merge implementation is injected explicitly
 * so an unexpected export or alternative algorithm cannot be
 * silently substituted here.
 *
 * The transaction callback receives identical primary/secondary
 * complete snapshots. Buffers are cleared after callback return
 * or rejection. Never expose them to the renderer.
 */
export async function withPaisarulePreparedCommitSnapshotsV1<T>(
  input: PaisaruleCommitPreparationInputV1,
  mergeWallet: (
    value: PaisaruleWalletMergeInputV1,
  ) => PaisaruleWalletMergeResultV1,
  operation: (
    prepared: PaisarulePreparedSnapshotsV1,
  ) => Promise<T>,
): Promise<T> {
  if (
    !input ||
    !(input.currentPrimary instanceof Uint8Array) ||
    !(input.currentSecondary instanceof Uint8Array) ||
    input.currentPrimary.length === 0 ||
    input.currentPrimary.length > MAX_STORAGE_BYTES ||
    input.currentSecondary.length === 0 ||
    input.currentSecondary.length > MAX_STORAGE_BYTES ||
    !validHash(input.expectedPrimarySha256) ||
    !validHash(input.expectedSecondarySha256) ||
    typeof input.isCurrent !== "function" ||
    typeof mergeWallet !== "function" ||
    typeof operation !== "function"
  ) {
    reject("RESTORE_PREPARATION_INPUT_INVALID");
  }

  if (!input.isCurrent()) {
    reject("RESTORE_PREPARATION_SESSION_CHANGED");
  }

  if (
    digest(input.currentPrimary).toLowerCase() !==
      input.expectedPrimarySha256.toLowerCase() ||
    digest(input.currentSecondary).toLowerCase() !==
      input.expectedSecondarySha256.toLowerCase()
  ) {
    reject("RESTORE_PREPARATION_DESTINATION_CHANGED");
  }

  return withPaisaruleCommitReverifiedBackupV1(
    input.archiveBytes,
    input.scopedKey,
    input.scope,
    input.expectedArchiveSha256,
    input.isCurrent,
    async verified => {
      if (!input.isCurrent()) {
        reject("RESTORE_PREPARATION_SESSION_CHANGED");
      }

      const merged = mergeWallet({
        backupPrimary: verified.files.primary,
        currentPrimary: input.currentPrimary,
        scope: {
          ownerId: input.scope.ownerId,
          businessId: input.scope.businessId,
          branchId: input.scope.branchId,
        },
      });

      let primary: Buffer | null = null;
      let secondary: Buffer | null = null;

      try {
        if (
          !(merged.mergedPrimary instanceof Buffer) ||
          merged.mergedPrimary.length === 0 ||
          merged.mergedPrimary.length > MAX_STORAGE_BYTES ||
          merged.preservedWalletRecords !== 1 ||
          merged.backupRecordCount !==
            verified.entityCounts.totalStorageRecords ||
          merged.finalRecordCount !==
            merged.restoredBusinessAndMetadataRecords + 1
        ) {
          reject("RESTORE_PREPARATION_MERGE_INVALID");
        }

        primary = Buffer.from(merged.mergedPrimary);
        secondary = Buffer.from(primary);

        if (!input.isCurrent()) {
          reject("RESTORE_PREPARATION_SESSION_CHANGED");
        }

        return await operation({
          primary,
          secondary,
          archiveSha256: verified.archiveSha256,
          backupRecordCount: merged.backupRecordCount,
          finalRecordCount: merged.finalRecordCount,
          preservedWalletRecords: 1,
        });
      } finally {
        primary?.fill(0);
        secondary?.fill(0);
        if (merged.mergedPrimary instanceof Uint8Array) {
          merged.mergedPrimary.fill(0);
        }
      }
    },
  );
}