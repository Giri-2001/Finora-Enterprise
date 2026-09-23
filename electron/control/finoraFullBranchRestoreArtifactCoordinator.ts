// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// RESTORE ARTIFACT AUTHENTICATION / DECRYPTION COORDINATOR
// ============================================================
//
// PURE RESTORE PREPARATION.
//
// NO filesystem write.
// NO Portable Auth write.
// NO USB mutation.
//
// Caller must first authenticate the current Branch Credential
// and provide the resulting authoritative:
//   ownerId + businessId + branchId + storageMode + authGeneration.
//
// This coordinator then:
//
// 1. parses Full Branch Backup V2 only;
// 2. verifies outer scope/storage/generation;
// 3. authenticates embedded Portable Branch Auth using
//    Password + Security Code;
// 4. cross-checks Portable Auth authority;
// 5. decrypts the encrypted REAL storage snapshot;
// 6. verifies snapshot exact scope;
// 7. returns authenticated restore material + digest evidence.
// ============================================================

import type {
  FinoraFullBranchBackupFileV2,
  FinoraFullBranchBackupScopeV2,
  FinoraFullBranchBackupStorageMode,
  FinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  parseFinoraFullBranchBackupFileV2,
  parseFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  decryptFinoraFullBranchRealSnapshotV2,
} from "./finoraFullBranchBackupCrypto.js";

import {
  parseFinoraPortableBranchAuth,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  calculateFinoraFullBranchExactRealDigest,
} from "./finoraFullBranchRestoreStoragePlan.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraFullBranchRestoreAuthenticatedAuthority {
  branchScope:
    FinoraFullBranchBackupScopeV2;

  storageMode:
    FinoraFullBranchBackupStorageMode;

  authGeneration:
    number;
}

export interface FinoraFullBranchRestoreArtifactRequest {
  password:
    string;

  securityCode:
    string;

  serializedBackup:
    string;

  authenticatedAuthority:
    FinoraFullBranchRestoreAuthenticatedAuthority;
}

export interface FinoraFullBranchRestorePortableAuthority {
  branchScope:
    FinoraFullBranchBackupScopeV2;

  storageMode:
    FinoraFullBranchBackupStorageMode;

  authGeneration:
    number;
}

export interface FinoraFullBranchRestorePortableAuthenticationInput {
  portableAuthEnvelopeSerialized:
    string;

  password:
    string;

  securityCode:
    string;

  expectedScope:
    FinoraFullBranchBackupScopeV2;
}

export interface FinoraFullBranchRestoreArtifactDependencies {
  parseBackup?:
    (
      serialized:
        string,
    ) =>
      FinoraFullBranchBackupFileV2;

  authenticatePortableAuth?:
    (
      input:
        FinoraFullBranchRestorePortableAuthenticationInput,
    ) =>
      Promise<
        FinoraFullBranchRestorePortableAuthority
      >;

  decryptRealSnapshot?:
    typeof decryptFinoraFullBranchRealSnapshotV2;

  parseRealSnapshot?:
    (
      serialized:
        string,
    ) =>
      FinoraFullBranchRealSnapshotV1;
}

export type FinoraFullBranchRestoreArtifactErrorCode =
  | "INVALID_REQUEST"
  | "BACKUP_FORMAT_INVALID"
  | "SCOPE_MISMATCH"
  | "STORAGE_MODE_MISMATCH"
  | "AUTH_GENERATION_MISMATCH"
  | "PORTABLE_AUTH_AUTHENTICATION_FAILED"
  | "PORTABLE_AUTH_AUTHORITY_MISMATCH"
  | "REAL_SNAPSHOT_AUTHENTICATION_FAILED"
  | "REAL_SNAPSHOT_INVALID";

export interface FinoraFullBranchRestoreArtifactSuccess {
  backupId:
    string;

  createdAt:
    string;

  branchScope:
    FinoraFullBranchBackupScopeV2;

  storageMode:
    FinoraFullBranchBackupStorageMode;

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

export type FinoraFullBranchRestoreArtifactResult =
  | {
      success:
        true;

      data:
        FinoraFullBranchRestoreArtifactSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraFullBranchRestoreArtifactErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

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

function hasText(
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

function scopesEqual(
  left:
    FinoraFullBranchBackupScopeV2,
  right:
    FinoraFullBranchBackupScopeV2,
): boolean {
  return (
    left.ownerId ===
      right.ownerId &&
    left.businessId ===
      right.businessId &&
    left.branchId ===
      right.branchId
  );
}

function failure(
  errorCode:
    FinoraFullBranchRestoreArtifactErrorCode,
  error:
    string,
): FinoraFullBranchRestoreArtifactResult {
  return {
    success:
      false,

    errorCode,
    error,
  };
}

function sanitizeRequest(
  value:
    unknown,
): FinoraFullBranchRestoreArtifactRequest | null {
  if (
    !isObject(
      value,
    )
  ) {
    return null;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "authenticatedAuthority",
      "password",
      "securityCode",
      "serializedBackup",
    ].sort();

  if (
    keys.length !==
      expectedKeys.length ||
    keys.some(
      (
        key,
        index,
      ) =>
        key !==
          expectedKeys[index],
    )
  ) {
    return null;
  }

  if (
    !hasText(
      value.password,
    ) ||
    !hasText(
      value.securityCode,
    ) ||
    !hasText(
      value.serializedBackup,
    ) ||
    !isObject(
      value.authenticatedAuthority,
    )
  ) {
    return null;
  }

  const authority =
    value.authenticatedAuthority;

  if (
    !isObject(
      authority.branchScope,
    ) ||
    !hasText(
      authority.branchScope.ownerId,
    ) ||
    !hasText(
      authority.branchScope.businessId,
    ) ||
    !hasText(
      authority.branchScope.branchId,
    ) ||
    (
      authority.storageMode !==
        "LOCAL" &&
      authority.storageMode !==
        "USB"
    ) ||
    !Number.isSafeInteger(
      authority.authGeneration,
    ) ||
    (
      authority.authGeneration as number
    ) <
      1
  ) {
    return null;
  }

  return {
    password:
      value.password,

    securityCode:
      value.securityCode,

    serializedBackup:
      value.serializedBackup,

    authenticatedAuthority: {
      branchScope: {
        ownerId:
          authority.branchScope.ownerId,

        businessId:
          authority.branchScope.businessId,

        branchId:
          authority.branchScope.branchId,
      },

      storageMode:
        authority.storageMode,

      authGeneration:
        authority.authGeneration as number,
    },
  };
}

async function authenticatePortableAuthDefault(
  input:
    FinoraFullBranchRestorePortableAuthenticationInput,
): Promise<
  FinoraFullBranchRestorePortableAuthority
> {
  const envelope =
    parseFinoraPortableBranchAuth(
      input.portableAuthEnvelopeSerialized,
    );

  const payload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      envelope,
      input.password,
      input.securityCode,
      {
        expectedScope:
          input.expectedScope,
      },
    );

  return {
    branchScope: {
      ownerId:
        payload.ownerId,

      businessId:
        payload.businessId,

      branchId:
        payload.branchId,
    },

    storageMode:
      payload.storageMode,

    authGeneration:
      payload.authGeneration,
  };
}

// ============================================================
// PREPARE AUTHENTICATED FULL RESTORE MATERIAL
// ============================================================

export async function prepareFinoraFullBranchRestoreArtifact(
  input:
    unknown,
  dependencyOverrides:
    FinoraFullBranchRestoreArtifactDependencies = {},
): Promise<
  FinoraFullBranchRestoreArtifactResult
> {
  const request =
    sanitizeRequest(
      input,
    );

  if (
    request ===
      null
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Full Branch restore request is required.",
    );
  }

  const parseBackup =
    dependencyOverrides.parseBackup ??
    parseFinoraFullBranchBackupFileV2;

  const authenticatePortableAuth =
    dependencyOverrides.authenticatePortableAuth ??
    authenticatePortableAuthDefault;

  const decryptRealSnapshot =
    dependencyOverrides.decryptRealSnapshot ??
    decryptFinoraFullBranchRealSnapshotV2;

  const parseRealSnapshot =
    dependencyOverrides.parseRealSnapshot ??
    parseFinoraFullBranchRealSnapshotV1;

  let backup:
    FinoraFullBranchBackupFileV2;

  try {
    backup =
      parseBackup(
        request.serializedBackup,
      );
  }
  catch {
    return failure(
      "BACKUP_FORMAT_INVALID",
      "The selected file is not a valid FINORA Full Branch Backup V2 artifact.",
    );
  }

  const authenticated =
    request.authenticatedAuthority;

  if (
    !scopesEqual(
      backup.branchScope,
      authenticated.branchScope,
    )
  ) {
    return failure(
      "SCOPE_MISMATCH",
      "FINORA Full Branch Backup scope does not match the authenticated branch.",
    );
  }

  if (
    backup.sourceStorageMode !==
      authenticated.storageMode
  ) {
    return failure(
      "STORAGE_MODE_MISMATCH",
      "FINORA Full Branch Backup storage mode does not match the authenticated branch.",
    );
  }

  if (
    backup.authGeneration !==
      authenticated.authGeneration
  ) {
    return failure(
      "AUTH_GENERATION_MISMATCH",
      "FINORA Full Branch Backup credential generation does not match the authenticated branch.",
    );
  }

  let portableAuthority:
    FinoraFullBranchRestorePortableAuthority;

  try {
    portableAuthority =
      await authenticatePortableAuth({
        portableAuthEnvelopeSerialized:
          backup.portableAuthEnvelopeSerialized,

        password:
          request.password,

        securityCode:
          request.securityCode,

        expectedScope:
          authenticated.branchScope,
      });
  }
  catch {
    return failure(
      "PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "FINORA could not authenticate the Portable Branch Auth contained in this backup.",
    );
  }

  if (
    !scopesEqual(
      portableAuthority.branchScope,
      backup.branchScope,
    ) ||
    portableAuthority.storageMode !==
      backup.sourceStorageMode ||
    portableAuthority.authGeneration !==
      backup.authGeneration
  ) {
    return failure(
      "PORTABLE_AUTH_AUTHORITY_MISMATCH",
      "FINORA Full Branch Backup Portable Auth authority is inconsistent.",
    );
  }

  let decryptedSnapshot:
    string;

  try {
    decryptedSnapshot =
      await decryptRealSnapshot({
        encryptedSnapshot:
          backup.realSnapshot,

        password:
          request.password,

        securityCode:
          request.securityCode,

        binding: {
          backupId:
            backup.backupId,

          createdAt:
            backup.createdAt,

          branchScope:
            backup.branchScope,

          sourceStorageMode:
            backup.sourceStorageMode,

          authGeneration:
            backup.authGeneration,
        },
      });
  }
  catch {
    return failure(
      "REAL_SNAPSHOT_AUTHENTICATION_FAILED",
      "FINORA could not authenticate or decrypt the REAL branch snapshot.",
    );
  }

  let snapshot:
    FinoraFullBranchRealSnapshotV1;

  try {
    snapshot =
      parseRealSnapshot(
        decryptedSnapshot,
      );
  }
  catch {
    return failure(
      "REAL_SNAPSHOT_INVALID",
      "FINORA Full Branch Backup contains an invalid REAL branch snapshot.",
    );
  }

  if (
    !scopesEqual(
      snapshot.branchScope,
      backup.branchScope,
    )
  ) {
    return failure(
      "SCOPE_MISMATCH",
      "FINORA Full Branch Backup snapshot scope is inconsistent.",
    );
  }

  let digest:
    string;

  try {
    digest =
      calculateFinoraFullBranchExactRealDigest(
        snapshot.records as never[],
        backup.branchScope,
      );
  }
  catch {
    return failure(
      "REAL_SNAPSHOT_INVALID",
      "FINORA Full Branch Backup REAL snapshot failed exact-tenant validation.",
    );
  }

  return {
    success:
      true,

    data: {
      backupId:
        backup.backupId,

      createdAt:
        backup.createdAt,

      branchScope: {
        ownerId:
          backup.branchScope.ownerId,

        businessId:
          backup.branchScope.businessId,

        branchId:
          backup.branchScope.branchId,
      },

      storageMode:
        backup.sourceStorageMode,

      authGeneration:
        backup.authGeneration,

      portableAuthEnvelopeSerialized:
        backup.portableAuthEnvelopeSerialized,

      snapshot:
        structuredClone(
          snapshot,
        ),

      snapshotRecordCount:
        snapshot.recordCount,

      exactRealDigestSha256:
        digest,
    },
  };
}