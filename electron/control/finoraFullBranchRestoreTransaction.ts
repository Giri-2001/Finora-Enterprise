// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// TARGET RESTORE TRANSACTION CORE
// ============================================================
//
// Privileged internal transaction only.
//
// This module does NOT select filesystem paths.
// This module does NOT trust renderer identity.
//
// Required precondition:
// restore material has already passed Full V2 artifact
// authentication/decryption.
//
// Transaction:
//
// 1. capture target storage + Portable Auth predecessor;
// 2. build exact REAL tenant replacement plan;
// 3. verify pre-write snapshot digest;
// 4. write complete target storage state;
// 5. read back storage and verify exact records/count/digest;
// 6. write Portable Auth;
// 7. read back Portable Auth canonically;
// 8. success.
//
// Any failure after a target mutation attempts rollback of every
// mutated authority. A rollback failure is surfaced distinctly.
// ============================================================

import type {
  FinoraFullBranchBackupScopeV2,
  FinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  parseFinoraPortableBranchAuth,
  serializeFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  calculateFinoraFullBranchExactRealDigest,
  planFinoraFullBranchExactRealRestore,
} from "./finoraFullBranchRestoreStoragePlan.js";

import type {
  FinoraFullBranchRestorePersistedRecord,
} from "./finoraFullBranchRestoreStoragePlan.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraFullBranchRestoreTransactionMaterial {
  branchScope:
    FinoraFullBranchBackupScopeV2;

  storageMode:
    "USB";

  authGeneration:
    number;

  portableAuthEnvelopeSerialized:
    string;

  snapshot:
    FinoraFullBranchRealSnapshotV1;

  snapshotRecordCount:
    number;

  exactRealDigestSha256:
    string;
}

export interface FinoraFullBranchRestoreCapturedStorage {
  records:
    unknown[];

  /**
   * Opaque persistence-specific rollback evidence.
   *
   * Production may carry raw predecessor bytes + existence state.
   */
  rollbackToken:
    unknown;
}

export interface FinoraFullBranchRestoreTransactionDependencies {
  captureTargetStorage:
    () =>
      Promise<
        FinoraFullBranchRestoreCapturedStorage
      >;

  writeTargetStorageRecords:
    (
      records:
        readonly FinoraFullBranchRestorePersistedRecord[],
    ) =>
      Promise<void>;

  readTargetStorageRecords:
    () =>
      Promise<unknown[]>;

  rollbackTargetStorage:
    (
      rollbackToken:
        unknown,
    ) =>
      Promise<void>;

  readTargetPortableAuth:
    () =>
      Promise<
        FinoraPortableBranchAuthEnvelopeV1 |
        null
      >;

  writeTargetPortableAuth:
    (
      envelope:
        FinoraPortableBranchAuthEnvelopeV1,
    ) =>
      Promise<void>;

  rollbackTargetPortableAuth:
    (
      previous:
        FinoraPortableBranchAuthEnvelopeV1 |
        null,
    ) =>
      Promise<void>;

  parsePortableAuth?:
    (
      serialized:
        string,
    ) =>
      FinoraPortableBranchAuthEnvelopeV1;

  serializePortableAuth?:
    (
      envelope:
        FinoraPortableBranchAuthEnvelopeV1,
    ) =>
      string;
}

export type FinoraFullBranchRestoreTransactionErrorCode =
  | "INVALID_MATERIAL"
  | "PORTABLE_AUTH_INVALID"
  | "TARGET_CAPTURE_FAILED"
  | "RESTORE_PLAN_FAILED"
  | "PREWRITE_DIGEST_MISMATCH"
  | "TARGET_STORAGE_WRITE_FAILED"
  | "TARGET_STORAGE_READBACK_FAILED"
  | "TARGET_AUTH_WRITE_FAILED"
  | "TARGET_AUTH_READBACK_FAILED"
  | "ROLLBACK_FAILED";

export type FinoraFullBranchRestoreTransactionResult =
  | {
      success:
        true;

      data: {
        authGeneration:
          number;

        snapshotRecordCount:
          number;

        removedExistingExactRealCount:
          number;

        preservedRecordCount:
          number;

        finalRecordCount:
          number;

        exactRealDigestSha256:
          string;
      };
    }
  | {
      success:
        false;

      errorCode:
        FinoraFullBranchRestoreTransactionErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraFullBranchRestoreTransactionErrorCode,
  error:
    string,
): FinoraFullBranchRestoreTransactionResult {
  return {
    success:
      false,

    errorCode,
    error,
  };
}

function validText(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isObject(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function materialLooksValid(
  material:
    FinoraFullBranchRestoreTransactionMaterial,
): boolean {
  return (
    isObject(
      material,
    ) &&
    isObject(
      material.branchScope,
    ) &&
    validText(
      material.branchScope.ownerId,
    ) &&
    validText(
      material.branchScope.businessId,
    ) &&
    validText(
      material.branchScope.branchId,
    ) &&
    material.storageMode ===
      "USB" &&
    Number.isSafeInteger(
      material.authGeneration,
    ) &&
    material.authGeneration >
      0 &&
    validText(
      material.portableAuthEnvelopeSerialized,
    ) &&
    Number.isSafeInteger(
      material.snapshotRecordCount,
    ) &&
    material.snapshotRecordCount >=
      0 &&
    /^[A-F0-9]{64}$/.test(
      material.exactRealDigestSha256,
    )
  );
}

function isExactRealRecord(
  value:
    unknown,
  scope:
    FinoraFullBranchBackupScopeV2,
): value is FinoraFullBranchRestorePersistedRecord {
  if (
    !isObject(
      value,
    )
  ) {
    return false;
  }

  return (
    value.ownerId ===
      scope.ownerId &&
    value.businessId ===
      scope.businessId &&
    value.branchId ===
      scope.branchId &&
    !Object.prototype.hasOwnProperty.call(
      value,
      "demoId",
    )
  );
}

function recordsExactlyEqual(
  left:
    readonly unknown[],
  right:
    readonly unknown[],
): boolean {
  try {
    return JSON.stringify(
      left,
    ) ===
      JSON.stringify(
        right,
      );
  }
  catch {
    return false;
  }
}

async function rollbackMutations(
  dependencies:
    FinoraFullBranchRestoreTransactionDependencies,
  storageMutated:
    boolean,
  authMutated:
    boolean,
  storageRollbackToken:
    unknown,
  previousAuth:
    FinoraPortableBranchAuthEnvelopeV1 |
    null,
): Promise<boolean> {
  let rollbackSucceeded =
    true;

  if (
    authMutated
  ) {
    try {
      await dependencies.rollbackTargetPortableAuth(
        previousAuth,
      );
    }
    catch {
      rollbackSucceeded =
        false;
    }
  }

  if (
    storageMutated
  ) {
    try {
      await dependencies.rollbackTargetStorage(
        storageRollbackToken,
      );
    }
    catch {
      rollbackSucceeded =
        false;
    }
  }

  return rollbackSucceeded;
}

// ============================================================
// EXECUTION
// ============================================================

export async function executeFinoraFullBranchRestoreTransaction(
  material:
    FinoraFullBranchRestoreTransactionMaterial,
  dependencies:
    FinoraFullBranchRestoreTransactionDependencies,
): Promise<
  FinoraFullBranchRestoreTransactionResult
> {
  if (
    !materialLooksValid(
      material,
    )
  ) {
    return failure(
      "INVALID_MATERIAL",
      "FINORA Full Branch restore transaction material is invalid.",
    );
  }

  const parsePortableAuth =
    dependencies.parsePortableAuth ??
    parseFinoraPortableBranchAuth;

  const serializePortableAuth =
    dependencies.serializePortableAuth ??
    serializeFinoraPortableBranchAuth;

  let restoredEnvelope:
    FinoraPortableBranchAuthEnvelopeV1;

  try {
    restoredEnvelope =
      parsePortableAuth(
        material.portableAuthEnvelopeSerialized,
      );
  }
  catch {
    return failure(
      "PORTABLE_AUTH_INVALID",
      "FINORA Full Branch restore Portable Auth envelope is invalid.",
    );
  }

  let capturedStorage:
    FinoraFullBranchRestoreCapturedStorage;

  let previousAuth:
    FinoraPortableBranchAuthEnvelopeV1 |
    null;

  try {
    [
      capturedStorage,
      previousAuth,
    ] =
      await Promise.all([
        dependencies.captureTargetStorage(),
        dependencies.readTargetPortableAuth(),
      ]);
  }
  catch {
    return failure(
      "TARGET_CAPTURE_FAILED",
      "FINORA could not capture the target predecessor state.",
    );
  }

  let plan;

  try {
    plan =
      planFinoraFullBranchExactRealRestore({
        currentRecords:
          capturedStorage.records,

        snapshot:
          material.snapshot,

        expectedScope:
          material.branchScope,
      });
  }
  catch {
    return failure(
      "RESTORE_PLAN_FAILED",
      "FINORA could not build an exact REAL tenant restore plan.",
    );
  }

  if (
    plan.snapshotRecordCount !==
      material.snapshotRecordCount ||
    plan.exactRealDigestSha256 !==
      material.exactRealDigestSha256
  ) {
    return failure(
      "PREWRITE_DIGEST_MISMATCH",
      "FINORA restore material failed the pre-write snapshot digest check.",
    );
  }

  let storageMutated =
    false;

  let authMutated =
    false;

  // ----------------------------------------------------------
  // STORAGE WRITE
  // ----------------------------------------------------------

  try {
    /*
     * Set before await because persistence may mutate and then
     * report failure.
     */
    storageMutated =
      true;

    await dependencies.writeTargetStorageRecords(
      plan.records,
    );
  }
  catch {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_STORAGE_WRITE_FAILED",
          "FINORA could not write the exact REAL branch snapshot.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA restore storage write failed and predecessor rollback could not be completed.",
        );
  }

  // ----------------------------------------------------------
  // STORAGE READBACK
  // ----------------------------------------------------------

  let storageReadback:
    unknown[];

  try {
    storageReadback =
      await dependencies.readTargetStorageRecords();
  }
  catch {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_STORAGE_READBACK_FAILED",
          "FINORA could not read back the restored REAL branch storage.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA restore storage readback failed and predecessor rollback could not be completed.",
        );
  }

  const readbackExact =
    storageReadback.filter(
      (
        record,
      ) =>
        isExactRealRecord(
          record,
          material.branchScope,
        ),
    ) as FinoraFullBranchRestorePersistedRecord[];

  let readbackDigest:
    string;

  try {
    readbackDigest =
      calculateFinoraFullBranchExactRealDigest(
        readbackExact,
        material.branchScope,
      );
  }
  catch {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_STORAGE_READBACK_FAILED",
          "FINORA restored REAL branch storage failed digest validation.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA storage validation failed and predecessor rollback could not be completed.",
        );
  }

  if (
    storageReadback.length !==
      plan.finalRecordCount ||
    readbackExact.length !==
      material.snapshotRecordCount ||
    readbackDigest !==
      material.exactRealDigestSha256 ||
    !recordsExactlyEqual(
      storageReadback,
      plan.records,
    )
  ) {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_STORAGE_READBACK_FAILED",
          "FINORA restored storage failed exact readback verification.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA restored storage verification failed and predecessor rollback could not be completed.",
        );
  }

  // ----------------------------------------------------------
  // PORTABLE AUTH WRITE
  // ----------------------------------------------------------

  try {
    /*
     * Same rule: write may mutate and subsequently throw.
     */
    authMutated =
      true;

    await dependencies.writeTargetPortableAuth(
      restoredEnvelope,
    );
  }
  catch {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_AUTH_WRITE_FAILED",
          "FINORA could not write the restored Portable Auth authority.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA Portable Auth write failed and predecessor rollback could not be completed.",
        );
  }

  // ----------------------------------------------------------
  // PORTABLE AUTH READBACK
  // ----------------------------------------------------------

  let authReadback:
    FinoraPortableBranchAuthEnvelopeV1 |
    null;

  try {
    authReadback =
      await dependencies.readTargetPortableAuth();
  }
  catch {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_AUTH_READBACK_FAILED",
          "FINORA could not read back restored Portable Auth.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA Portable Auth readback failed and predecessor rollback could not be completed.",
        );
  }

  let authMatches =
    false;

  try {
    authMatches =
      authReadback !==
        null &&
      serializePortableAuth(
        authReadback,
      ) ===
        material.portableAuthEnvelopeSerialized;
  }
  catch {
    authMatches =
      false;
  }

  if (
    !authMatches
  ) {
    const rolledBack =
      await rollbackMutations(
        dependencies,
        storageMutated,
        authMutated,
        capturedStorage.rollbackToken,
        previousAuth,
      );

    return rolledBack
      ? failure(
          "TARGET_AUTH_READBACK_FAILED",
          "FINORA restored Portable Auth failed exact readback verification.",
        )
      : failure(
          "ROLLBACK_FAILED",
          "FINORA Portable Auth verification failed and predecessor rollback could not be completed.",
        );
  }

  return {
    success:
      true,

    data: {
      authGeneration:
        material.authGeneration,

      snapshotRecordCount:
        material.snapshotRecordCount,

      removedExistingExactRealCount:
        plan.removedExistingExactRealCount,

      preservedRecordCount:
        plan.preservedRecordCount,

      finalRecordCount:
        plan.finalRecordCount,

      exactRealDigestSha256:
        material.exactRealDigestSha256,
    },
  };
}