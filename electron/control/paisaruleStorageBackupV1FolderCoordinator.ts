import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  inspectPaisaruleFolderRestoreSafetyV1,
} from "./paisaruleStorageBackupV1FolderSafety.js";

import {
  preparePaisaruleWalletPreservingMergeV1,
} from "./paisaruleStorageBackupV1WalletMerge.js";

import {
  withPaisarulePreparedCommitSnapshotsV1,
} from "./paisaruleStorageBackupV1CommitPreparation.js";

import {
  commitPaisaruleFolderStorageV1,
} from "./paisaruleStorageBackupV1FolderTransaction.js";

import {
  withPaisaruleRecoveryJournalKeyV2,
} from "./paisaruleStorageBackupV1RecoveryKey.js";

import {
  createPaisaruleRecoveryJournalV2,
} from "./paisaruleStorageBackupV1RecoveryJournal.js";

import {
  readPaisaruleRecoveryJournalStoreV2,
  writePaisaruleRecoveryJournalStoreV2,
} from "./paisaruleStorageBackupV1RecoveryJournalStore.js";
const MAX_STORAGE_BYTES = 32 * 1024 * 1024;
const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";

function fail(code: string): never {
  throw new Error(code);
}

export interface PaisaruleFolderCoordinatorRequestV1 {
  // All values MUST originate from privileged Electron Main.
  readonly branchRoot: string;
  readonly scope: PaisaruleStorageBackupV1Scope;
  readonly archiveBytes: Uint8Array;
  readonly archiveSha256: string;
  readonly scopedKey: Uint8Array;
  isCurrent(): boolean;
}

export interface PaisaruleFolderCoordinatorAuthorityV1 {
  // MUST use the same mutation queue and stable lock as
  // normal storage writes. Never nested-acquire that lock.
  withExclusiveStorageAccess<T>(
    operation: () => Promise<T>,
  ): Promise<T>;

  // MUST revalidate session generation, server authority,
  // selected branch path and pinned physical USB identity.
  // Must NOT read storage via the marker-blocked API.
  assertCurrentAuthority(): Promise<void>;

  // PAISARULE C117-R205
  // Completed transaction milestones only.
  // No sensitive data, file paths or credentials.
  onProgress?(
    stage:
      | "DESTINATION_VERIFIED"
      | "STAGING_VERIFIED"
      | "PUBLISHED_READBACK_VERIFIED",
  ): void;
}

export interface PaisaruleFolderCoordinatorResultV1 {
  readonly committed: true;
  readonly archiveSha256: string;
  readonly backupRecordCount: number;
  readonly finalRecordCount: number;
  readonly preservedWalletRecords: 1;
  readonly predecessorDirectory: string;
}

async function exactFile(filename: string): Promise<Buffer> {
  const stat = await fs.lstat(filename);

  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size === 0 ||
    stat.size > MAX_STORAGE_BYTES
  ) {
    fail("RESTORE_COORDINATOR_STORAGE_FILE_INVALID");
  }

  const content = await fs.readFile(filename);

  if (content.length !== stat.size) {
    content.fill(0);
    fail("RESTORE_COORDINATOR_STORAGE_FILE_CHANGED");
  }

  return content;
}

/**
 * PAISARULE_C117_R256_R2_NATIVE_COORDINATOR
 *
 * Native-only coordinator. No IPC connection yet.
 *
 * Authenticated backup and destination values must be
 * supplied by trusted Electron Main, never the renderer.
 *
 * The shared stable mutation lock must cover the entire
 * verify -> merge -> stage -> publish -> readback cycle.
 */
export async function commitPaisaruleAuthenticatedFolderV1(
  request: PaisaruleFolderCoordinatorRequestV1,
  authority: PaisaruleFolderCoordinatorAuthorityV1,
): Promise<PaisaruleFolderCoordinatorResultV1> {
  if (
    process.platform !== "win32" ||
    !request ||
    typeof request.branchRoot !== "string" ||
    !path.win32.isAbsolute(request.branchRoot) ||
    !request.scope ||
    !(request.archiveBytes instanceof Uint8Array) ||
    !(request.scopedKey instanceof Uint8Array) ||
    typeof request.archiveSha256 !== "string" ||
    typeof request.isCurrent !== "function" ||
    !authority ||
    typeof authority.withExclusiveStorageAccess !== "function" ||
    typeof authority.assertCurrentAuthority !== "function"
  ) {
    fail("RESTORE_COORDINATOR_INPUT_INVALID");
  }

  const branchRoot = path.win32.resolve(request.branchRoot);

  if (
    branchRoot.toLowerCase() ===
    path.win32.parse(branchRoot).root.toLowerCase()
  ) {
    fail("RESTORE_COORDINATOR_BRANCH_FOLDER_REQUIRED");
  }

  return authority.withExclusiveStorageAccess(async () => {
    await authority.assertCurrentAuthority();

    if (!request.isCurrent()) {
      fail("RESTORE_COORDINATOR_SESSION_CHANGED");
    }

    const safety = await inspectPaisaruleFolderRestoreSafetyV1({
      branchRoot,
      scope: {
        ownerId: request.scope.ownerId,
        businessId: request.scope.businessId,
        branchId: request.scope.branchId,
      },
      isCurrent: request.isCurrent,
    });

    if (
      safety.preservedWalletRecords !== 1 ||
      safety.businessRecords !== 0 ||
      path.win32.resolve(safety.branchRoot).toLowerCase() !==
        branchRoot.toLowerCase()
    ) {
      fail("RESTORE_COORDINATOR_DESTINATION_UNSAFE");
    }

    const storageDir = path.win32.join(
      branchRoot,
      "FINORA",
      "storage",
    );

    let currentPrimary: Buffer | null = null;
    let currentSecondary: Buffer | null = null;

    try {
      currentPrimary = await exactFile(
        path.win32.join(storageDir, PRIMARY),
      );

      currentSecondary = await exactFile(
        path.win32.join(storageDir, SECONDARY),
      );

      await authority.assertCurrentAuthority();

      if (!request.isCurrent()) {
        fail("RESTORE_COORDINATOR_SESSION_CHANGED");
      }

      return await withPaisarulePreparedCommitSnapshotsV1(
        {
          archiveBytes: request.archiveBytes,
          scopedKey: request.scopedKey,
          expectedArchiveSha256: request.archiveSha256,
          scope: request.scope,
          currentPrimary,
          currentSecondary,
          expectedPrimarySha256: safety.primarySha256,
          expectedSecondarySha256: safety.secondarySha256,
          isCurrent: request.isCurrent,
        },
        preparePaisaruleWalletPreservingMergeV1,
        async prepared => {
          await authority.assertCurrentAuthority();

          if (!request.isCurrent()) {
            fail("RESTORE_COORDINATOR_SESSION_CHANGED");
          }

          // Already inside the shared stable mutation lock.
          // The transaction must not reacquire that same lock.
          const journalScope = {
            userId: request.scope.userId,
            ownerId: request.scope.ownerId,
            businessId: request.scope.businessId,
            branchId: request.scope.branchId,
          };

          const result = await withPaisaruleRecoveryJournalKeyV2(
            request.scopedKey,
            async journalKey => {
              await authority.assertCurrentAuthority();

              if (!request.isCurrent()) {
                fail("RESTORE_COORDINATOR_SESSION_CHANGED");
              }

              const journal = createPaisaruleRecoveryJournalV2(
                {
                  branchRoot,
                  scope: journalScope,
                  expectedPrimarySha256: safety.primarySha256,
                  expectedSecondarySha256: safety.secondarySha256,
                },
                journalKey,
              );

              const journalWrite = await writePaisaruleRecoveryJournalStoreV2(
                { branchRoot, scope: journalScope },
                journal,
                journalKey,
              );

              await authority.assertCurrentAuthority();

              if (!request.isCurrent()) {
                fail("RESTORE_COORDINATOR_SESSION_CHANGED");
              }
              const installed = await commitPaisaruleFolderStorageV1(
            {
              branchRoot,
              expectedPrimarySha256: safety.primarySha256,
              expectedSecondarySha256: safety.secondarySha256,
              mergedPrimary: prepared.primary,
              mergedSecondary: prepared.secondary,
            },
            {
              withExclusiveStorageAccess: async operation =>
                operation(),
              assertCurrentAuthority:
                authority.assertCurrentAuthority,
              // PAISARULE C117-R205
              onProgress: stage => {
                try {
                  authority.onProgress?.(stage);
                } catch {
                  // Progress must never interrupt Restore.
                }
              },
            },
          );
              // C117-R321: Only finalize a completed transaction.
              // FolderTransaction already verified published snapshots.
              await authority.assertCurrentAuthority();

              if (!request.isCurrent()) {
                fail("RESTORE_FINALIZATION_SESSION_CHANGED");
              }

              const publishedJournal =
                await readPaisaruleRecoveryJournalStoreV2(
                  { branchRoot, scope: journalScope },
                  journalKey,
                );

              if (
                publishedJournal.transactionId !==
                  journalWrite.transactionId ||
                publishedJournal.expectedPrimarySha256 !==
                  safety.primarySha256.toLowerCase() ||
                publishedJournal.expectedSecondarySha256 !==
                  safety.secondarySha256.toLowerCase()
              ) {
                fail("RESTORE_FINALIZATION_JOURNAL_MISMATCH");
              }

              const incompleteMarker = path.win32.join(
                branchRoot,
                "FINORA",
                "paisarule-restore-incomplete",
              );

              try {
                await fs.lstat(incompleteMarker);
                fail("RESTORE_FINALIZATION_MARKER_PRESENT");
              } catch (error) {
                if (
                  (error as NodeJS.ErrnoException).code !==
                  "ENOENT"
                ) {
                  throw error;
                }
              }

              await authority.assertCurrentAuthority();

              if (!request.isCurrent()) {
                fail("RESTORE_FINALIZATION_SESSION_CHANGED");
              }

              // Remove only our authenticated, completed journal.
              // Never remove predecessor or business storage.
              await fs.unlink(
                path.win32.join(
                  branchRoot,
                  "FINORA",
                  "paisarule-restore-journal-v2.json",
                ),
              );

              return installed;
            },
          );

          return {
            committed: true as const,
            archiveSha256: prepared.archiveSha256,
            backupRecordCount: prepared.backupRecordCount,
            finalRecordCount: prepared.finalRecordCount,
            preservedWalletRecords:
              prepared.preservedWalletRecords,
            predecessorDirectory: result.predecessorDirectory,
          };
        },
      );
    } finally {
      currentPrimary?.fill(0);
      currentSecondary?.fill(0);
    }
  });
}