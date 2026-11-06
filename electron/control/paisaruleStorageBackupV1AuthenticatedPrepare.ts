import {
  derivePaisaruleStorageBackupV1Key,
  destroyPaisaruleStorageBackupV1Key,
} from "./paisaruleStorageBackupV1Crypto.js";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  preparePaisaruleBusinessRestoreV1,
} from "./paisaruleStorageBackupV1RestoreCore.js";

import type {
  PaisarulePreparedBusinessRestoreV1,
} from "./paisaruleStorageBackupV1RestoreCore.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

export interface PaisaruleAuthenticatedRestorePrepareInput {
  serializedBackup: string;

  /**
   * Must originate from successful privileged credential
   * authentication. Never accept this from the renderer.
   */
  verifiedOwner: FinoraBranchCredentialAuthenticationSuccess;

  /**
   * The authenticated password used when the V1 backup
   * was created. A later password change may make an old
   * V1 archive undecryptable.
   */
  password: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function validIdentity(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 512 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

/**
 * V1 cryptographic preparation after privileged authentication.
 *
 * This function DOES NOT verify Security Code, select a USB,
 * authorize a destination or write any files.
 *
 * Main must establish Security Code authority independently
 * before calling this function or publishing any restored data.
 */
export async function preparePaisaruleAuthenticatedRestoreV1(
  input: PaisaruleAuthenticatedRestorePrepareInput,
): Promise<PaisarulePreparedBusinessRestoreV1> {
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.serializedBackup !== "string" ||
    typeof input.password !== "string" ||
    input.password.length === 0
  ) {
    return fail("RESTORE_INPUT_INVALID");
  }

  const owner = input.verifiedOwner;

  if (
    !owner ||
    owner.role !== "OWNER" ||
    owner.dataContext !== "REAL" ||
    owner.storageMode !== "USB"
  ) {
    return fail("RESTORE_OWNER_NOT_AUTHORIZED");
  }

  const scope: PaisaruleStorageBackupV1Scope = {
    userId: owner.userId,
    ownerId: owner.ownerId,
    businessId: owner.businessId,
    branchId: owner.branchId,
  };

  if (
    !validIdentity(scope.userId) ||
    !validIdentity(scope.ownerId) ||
    !validIdentity(scope.businessId) ||
    !validIdentity(scope.branchId)
  ) {
    return fail("RESTORE_OWNER_SCOPE_INVALID");
  }

  let key: Buffer | null = null;

  try {
    key = await derivePaisaruleStorageBackupV1Key(
      input.password,
      scope,
    );

    return preparePaisaruleBusinessRestoreV1(
      input.serializedBackup,
      key,
      scope,
    );
  } finally {
    destroyPaisaruleStorageBackupV1Key(key);
  }
}