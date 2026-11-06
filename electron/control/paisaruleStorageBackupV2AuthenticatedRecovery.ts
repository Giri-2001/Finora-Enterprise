import path from "node:path";

import {
  withPaisaruleRecoveryJournalKeyV2,
} from "./paisaruleStorageBackupV1RecoveryKey.js";

import {
  readPaisaruleRecoveryJournalStoreV2,
} from "./paisaruleStorageBackupV1RecoveryJournalStore.js";

import {
  recoverPaisaruleMissingStorageV1,
} from "./paisaruleStorageBackupV1RecoveryExecutor.js";

import type {
  PaisaruleJournalScopeV2,
} from "./paisaruleStorageBackupV1RecoveryJournal.js";

export interface PaisaruleAuthenticatedRecoveryRequestV2 {
  // Trusted Electron Main values only.
  readonly branchRoot: string;
  readonly scope: PaisaruleJournalScopeV2;
  readonly scopedKey: Uint8Array;
  isCurrent(): boolean;
}

export interface PaisaruleAuthenticatedRecoveryAuthorityV2 {
  // Must be the same exclusive lock as regular USB storage writes.
  // Caller must NOT already hold this lock.
  withExclusiveStorageAccess<T>(
    operation: () => Promise<T>,
  ): Promise<T>;

  // Must check current server Owner session, scope,
  // active branch and pinned physical USB identity.
  assertCurrentAuthority(): Promise<void>;
}

function reject(code: string): never {
  throw new Error(code);
}

/**
 * C117-R330
 *
 * Native-only recovery gate.
 * Not connected to Electron Main or renderer.
 *
 * This function never accepts untrusted journal hashes.
 * An authenticated journal is read under the shared lock.
 * Recovery is possible only if original storage is missing
 * and the predecessor matches both authenticated hashes.
 *
 * Recovered journals remain for explicit review.
 * No journal, predecessor or WALLET deletion occurs here.
 */
export async function recoverPaisaruleAuthenticatedStorageV2(
  request: PaisaruleAuthenticatedRecoveryRequestV2,
  authority: PaisaruleAuthenticatedRecoveryAuthorityV2,
): Promise<{
  recovered: true;
  originalPrimarySha256: string;
  originalSecondarySha256: string;
}> {
  if (
    process.platform !== "win32" ||
    !request ||
    !path.win32.isAbsolute(request.branchRoot) ||
    !request.scope ||
    !(request.scopedKey instanceof Uint8Array) ||
    request.scopedKey.byteLength !== 32 ||
    typeof request.isCurrent !== "function" ||
    !authority ||
    typeof authority.withExclusiveStorageAccess !== "function" ||
    typeof authority.assertCurrentAuthority !== "function"
  ) {
    reject("RECOVERY_NATIVE_AUTHORITY_INVALID");
  }

  const branchRoot = path.win32.resolve(request.branchRoot);
  const driveRoot = path.win32.parse(branchRoot).root;

  if (
    !/^[A-Za-z]:\\$/.test(driveRoot) ||
    branchRoot.toLowerCase() === driveRoot.toLowerCase()
  ) {
    reject("RECOVERY_BRANCH_FOLDER_REQUIRED");
  }

  if (!request.isCurrent()) {
    reject("RECOVERY_LOGIN_CHANGED");
  }

  return authority.withExclusiveStorageAccess(async () => {
    await authority.assertCurrentAuthority();

    if (!request.isCurrent()) {
      reject("RECOVERY_LOGIN_CHANGED");
    }

    return withPaisaruleRecoveryJournalKeyV2(
      request.scopedKey,
      async journalKey => {
        const verified =
          await readPaisaruleRecoveryJournalStoreV2(
            {
              branchRoot,
              scope: request.scope,
            },
            journalKey,
          );

        await authority.assertCurrentAuthority();

        if (!request.isCurrent()) {
          reject("RECOVERY_LOGIN_CHANGED");
        }

        // The exclusive lock is already held.
        // Never acquire it a second time.
        const result = await recoverPaisaruleMissingStorageV1(
          branchRoot,
          {
            expectedPrimarySha256:
              verified.expectedPrimarySha256,
            expectedSecondarySha256:
              verified.expectedSecondarySha256,
          },
          {
            withExclusiveStorageAccess: async operation =>
              operation(),
            assertCurrentAuthority:
              authority.assertCurrentAuthority,
          },
        );

        // Keep the authenticated journal on disk.
        // Its cleanup needs a separate reviewed lifecycle.
        return result;
      },
    );
  });
}