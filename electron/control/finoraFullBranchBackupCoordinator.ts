// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V3 COMPOSITION COORDINATOR
// ============================================================
//
// This coordinator does not resolve filesystem roots itself.
//
// Privileged callers must provide:
//
// 1. authenticated Portable Branch Auth backup authority;
// 2. authoritative REAL storage records for that exact scope.
//
// It then:
//
// - captures exact REAL tenant snapshot;
// - encrypts that snapshot with Password + Security Code;
// - binds ciphertext to backup/scope/storage/authGeneration;
// - emits one Full Branch Backup V3 serialized .finora payload.
//
// DEMO is never exported.
// ============================================================

import {
  createFinoraFullBranchBackupFileV3,
  serializeFinoraFullBranchBackupFileV3,
  serializeFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import type {
  FinoraFullBranchBackupFileV3,
  FinoraFullBranchBackupScopeV2,
  FinoraFullBranchBackupStorageMode,
} from "./finoraFullBranchBackupContract.js";

import {
  encryptFinoraFullBranchRealSnapshotV2,
  encryptFinoraFullBranchRuntimeAuthorityV2,
} from "./finoraFullBranchBackupCrypto.js";

import {
  captureFinoraFullBranchRealStorageSnapshot,
} from "./finoraFullBranchBackupStorageSnapshot.js";

export interface FinoraFullBranchBackupRequest {
  sessionId:
    string;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraFullBranchAuthenticatedBackupAuthority {
  backupId:
    string;

  createdAt:
    string;

  branchScope:
    FinoraFullBranchBackupScopeV2;

  sourceStorageMode:
    FinoraFullBranchBackupStorageMode;

  authGeneration:
    number;

  portableAuthEnvelopeSerialized:
    string;

  runtimeAuthorityPackageSerialized?:
    string;
}

export type FinoraFullBranchAuthenticatedBackupAuthorityResult =
  | {
      success:
        true;

      data:
        FinoraFullBranchAuthenticatedBackupAuthority;
    }
  | {
      success:
        false;

      errorCode:
        string;

      error:
        string;
    };

export interface FinoraFullBranchStorageReadRequest {
  branchScope:
    FinoraFullBranchBackupScopeV2;

  storageMode:
    FinoraFullBranchBackupStorageMode;
}

export type FinoraFullBranchStorageReadResult =
  | {
      success:
        true;

      records:
        unknown[];
    }
  | {
      success:
        false;

      error:
        string;
    };

export interface FinoraFullBranchBackupCoordinatorDependencies {
  createAuthenticatedBackupAuthority:
    (
      request:
        FinoraFullBranchBackupRequest,
    ) =>
      Promise<
        FinoraFullBranchAuthenticatedBackupAuthorityResult
      >;

  readRealStorageRecords:
    (
      request:
        FinoraFullBranchStorageReadRequest,
    ) =>
      Promise<
        FinoraFullBranchStorageReadResult
      >;

  encryptSnapshot?:
    typeof encryptFinoraFullBranchRealSnapshotV2;

  encryptRuntimeAuthority?:
    typeof encryptFinoraFullBranchRuntimeAuthorityV2;
}

export type FinoraFullBranchBackupErrorCode =
  | "INVALID_REQUEST"
  | "AUTH_BACKUP_FAILED"
  | "REAL_STORAGE_READ_FAILED"
  | "SNAPSHOT_FAILED"
  | "RUNTIME_AUTHORITY_UNAVAILABLE"
  | "RUNTIME_AUTHORITY_ENCRYPTION_FAILED"
  | "BACKUP_ENCRYPTION_FAILED"
  | "BACKUP_CREATION_FAILED";

export interface FinoraFullBranchBackupSuccess {
  backupId:
    string;

  createdAt:
    string;

  branchScope:
    FinoraFullBranchBackupScopeV2;

  sourceStorageMode:
    FinoraFullBranchBackupStorageMode;

  authGeneration:
    number;

  recordCount:
    number;

  backupFile:
    FinoraFullBranchBackupFileV3;

  serializedBackup:
    string;
}

export type FinoraFullBranchBackupResult =
  | {
      success:
        true;

      data:
        FinoraFullBranchBackupSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraFullBranchBackupErrorCode;

      error:
        string;
    };

function failure(
  errorCode:
    FinoraFullBranchBackupErrorCode,
  error:
    string,
): FinoraFullBranchBackupResult {
  return {
    success:
      false,

    errorCode,
    error,
  };
}

function validRequest(
  request:
    unknown,
): request is FinoraFullBranchBackupRequest {
  if (
    typeof request !==
      "object" ||
    request ===
      null ||
    Array.isArray(
      request,
    )
  ) {
    return false;
  }

  const candidate =
    request as Record<string, unknown>;

  return (
    Object.keys(
      candidate,
    ).length ===
      3 &&
    typeof candidate.sessionId ===
      "string" &&
    candidate.sessionId.trim().length >
      0 &&
    typeof candidate.password ===
      "string" &&
    candidate.password.length >
      0 &&
    typeof candidate.securityCode ===
      "string" &&
    candidate.securityCode.trim().length >
      0
  );
}

export async function createFinoraFullBranchBackup(
  request:
    unknown,
  dependencies:
    FinoraFullBranchBackupCoordinatorDependencies,
): Promise<FinoraFullBranchBackupResult> {
  if (
    !validRequest(
      request,
    )
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid authenticated FINORA Full Branch Backup request is required.",
    );
  }

  let authorityResult:
    FinoraFullBranchAuthenticatedBackupAuthorityResult;

  try {
    authorityResult =
      await dependencies.createAuthenticatedBackupAuthority(
        request,
      );
  }
  catch {
    return failure(
      "AUTH_BACKUP_FAILED",
      "FINORA could not authenticate the branch backup authority.",
    );
  }

  if (
    !authorityResult.success
  ) {
    return failure(
      "AUTH_BACKUP_FAILED",
      authorityResult.error ||
        "FINORA could not authenticate the branch backup authority.",
    );
  }

  const authority =
    authorityResult.data;

  let storageResult:
    FinoraFullBranchStorageReadResult;

  try {
    storageResult =
      await dependencies.readRealStorageRecords({
        branchScope:
          authority.branchScope,

        storageMode:
          authority.sourceStorageMode,
      });
  }
  catch {
    return failure(
      "REAL_STORAGE_READ_FAILED",
      "FINORA could not read the authoritative REAL branch storage.",
    );
  }

  if (
    !storageResult.success
  ) {
    return failure(
      "REAL_STORAGE_READ_FAILED",
      storageResult.error ||
        "FINORA could not read the authoritative REAL branch storage.",
    );
  }

  let snapshot;

  try {
    snapshot =
      captureFinoraFullBranchRealStorageSnapshot({
        exportedAt:
          authority.createdAt,

        branchScope:
          authority.branchScope,

        records:
          storageResult.records,
      });
  }
  catch (
    error:
      unknown
  ) {
    return failure(
      "SNAPSHOT_FAILED",
      error instanceof Error
        ? error.message
        : "FINORA could not create the exact REAL branch snapshot.",
    );
  }

  const binding = {
    backupId:
      authority.backupId,

    createdAt:
      authority.createdAt,

    branchScope:
      authority.branchScope,

    sourceStorageMode:
      authority.sourceStorageMode,

    authGeneration:
      authority.authGeneration,
  };

  const runtimeAuthorityPackageSerialized =
    authority.runtimeAuthorityPackageSerialized;

  if (
    typeof runtimeAuthorityPackageSerialized !==
      "string" ||
    runtimeAuthorityPackageSerialized.trim().length ===
      0
  ) {
    return failure(
      "RUNTIME_AUTHORITY_UNAVAILABLE",
      "FINORA Fresh Device Runtime Authority is unavailable for this Full Branch Backup.",
    );
  }

  const encryptRuntimeAuthority =
    dependencies.encryptRuntimeAuthority ??
    encryptFinoraFullBranchRuntimeAuthorityV2;

  let encryptedRuntimeAuthority;

  try {
    encryptedRuntimeAuthority =
      await encryptRuntimeAuthority({
        serializedRuntimeAuthority:
          runtimeAuthorityPackageSerialized,

        password:
          request.password,

        securityCode:
          request.securityCode,

        binding,
      });
  }
  catch (
    error:
      unknown
  ) {
    return failure(
      "RUNTIME_AUTHORITY_ENCRYPTION_FAILED",
      error instanceof Error
        ? error.message
        : "FINORA could not encrypt the Fresh Device Runtime Authority.",
    );
  }

  const encryptSnapshot =
    dependencies.encryptSnapshot ??
    encryptFinoraFullBranchRealSnapshotV2;

  let encryptedSnapshot;

  try {
    encryptedSnapshot =
      await encryptSnapshot({
        serializedSnapshot:
          serializeFinoraFullBranchRealSnapshotV1(
            snapshot,
          ),

        password:
          request.password,

        securityCode:
          request.securityCode,

        binding,
      });
  }
  catch {
    return failure(
      "BACKUP_ENCRYPTION_FAILED",
      "FINORA could not encrypt the REAL branch backup snapshot.",
    );
  }

  try {
    const backupFile =
      createFinoraFullBranchBackupFileV3({
        backupId:
          authority.backupId,

        createdAt:
          authority.createdAt,

        branchScope:
          authority.branchScope,

        sourceStorageMode:
          authority.sourceStorageMode,

        authGeneration:
          authority.authGeneration,

        portableAuthEnvelopeSerialized:
          authority.portableAuthEnvelopeSerialized,

        encryptedRuntimeAuthority:
          encryptedRuntimeAuthority,

        realSnapshot:
          encryptedSnapshot,
      });

    return {
      success:
        true,

      data: {
        backupId:
          authority.backupId,

        createdAt:
          authority.createdAt,

        branchScope:
          authority.branchScope,

        sourceStorageMode:
          authority.sourceStorageMode,

        authGeneration:
          authority.authGeneration,

        recordCount:
          snapshot.recordCount,

        backupFile,

        serializedBackup:
          serializeFinoraFullBranchBackupFileV3(
            backupFile,
          ),
      },
    };
  }
  catch {
    return failure(
      "BACKUP_CREATION_FAILED",
      "FINORA could not create the Full Branch Backup artifact.",
    );
  }
}