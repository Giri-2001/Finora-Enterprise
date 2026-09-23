// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2 CONTRACT
// ============================================================
//
// PURPOSE:
//
// A Full Branch Backup is a REAL-only recovery artifact.
//
// It carries:
// - the exact encrypted Portable Branch Auth envelope;
// - one separately encrypted exact-tenant REAL storage snapshot.
//
// Security:
// - DEMO data is never represented by this contract.
// - ownerId / businessId / branchId are explicit authenticated
//   binding evidence.
// - LOCAL <-> USB migration is not authorized by this file.
// - ciphertext authentication is provided by AES-256-GCM.
// ============================================================

import {
  createHash,
} from "node:crypto";

import {
  Buffer,
} from "node:buffer";

export const FINORA_FULL_BRANCH_BACKUP_FILE_FORMAT =
  "FINORA_FULL_BRANCH_BACKUP" as const;

export const FINORA_FULL_BRANCH_BACKUP_SCHEMA_VERSION =
  2 as const;

export const FINORA_FULL_BRANCH_BACKUP_FILE_EXTENSION =
  ".finora" as const;

export const FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES =
  256 * 1024 * 1024;

export const FINORA_FULL_BRANCH_REAL_SNAPSHOT_FORMAT =
  "FINORA_FULL_BRANCH_REAL_SNAPSHOT" as const;

export const FINORA_FULL_BRANCH_REAL_SNAPSHOT_SCHEMA_VERSION =
  1 as const;

export interface FinoraFullBranchBackupScopeV2 {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export type FinoraFullBranchBackupStorageMode =
  | "LOCAL"
  | "USB";

export interface FinoraFullBranchBackupKdfV2 {
  algorithm:
    "SCRYPT";

  salt:
    string;

  N:
    32768;

  r:
    8;

  p:
    1;

  keyLength:
    32;
}

export interface FinoraFullBranchBackupEncryptedRealSnapshotV2 {
  algorithm:
    "AES-256-GCM";

  passwordKdf:
    FinoraFullBranchBackupKdfV2;

  securityKdf:
    FinoraFullBranchBackupKdfV2;

  iv:
    string;

  authTag:
    string;

  ciphertext:
    string;
}

export interface FinoraFullBranchBackupFileV2 {
  format:
    typeof FINORA_FULL_BRANCH_BACKUP_FILE_FORMAT;

  schemaVersion:
    typeof FINORA_FULL_BRANCH_BACKUP_SCHEMA_VERSION;

  backupId:
    string;

  createdAt:
    string;

  branchScope:
    FinoraFullBranchBackupScopeV2;

  dataContext:
    "REAL";

  sourceStorageMode:
    FinoraFullBranchBackupStorageMode;

  authGeneration:
    number;

  portableAuthEnvelopeSerialized:
    string;

  portableAuthEnvelopeSha256:
    string;

  realSnapshot:
    FinoraFullBranchBackupEncryptedRealSnapshotV2;
}

export interface FinoraFullBranchRealSnapshotV1 {
  format:
    typeof FINORA_FULL_BRANCH_REAL_SNAPSHOT_FORMAT;

  schemaVersion:
    typeof FINORA_FULL_BRANCH_REAL_SNAPSHOT_SCHEMA_VERSION;

  exportedAt:
    string;

  branchScope:
    FinoraFullBranchBackupScopeV2;

  dataContext:
    "REAL";

  recordCount:
    number;

  records:
    unknown[];
}

export interface FinoraFullBranchBackupBindingV2 {
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
}

function isRecord(
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

function hasExactKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
): boolean {
  const actual =
    Object.keys(
      value,
    ).sort();

  const wanted =
    [...expected].sort();

  return (
    actual.length ===
      wanted.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          wanted[index],
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

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {
  if (!hasText(value)) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function isCanonicalBase64(
  value:
    unknown,
): value is string {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    return false;
  }

  try {
    const decoded =
      Buffer.from(
        value,
        "base64",
      );

    return (
      decoded.length >
        0 &&
      decoded.toString(
        "base64",
      ) ===
        value
    );
  }
  catch {
    return false;
  }
}

export function validateFinoraFullBranchBackupScopeV2(
  value:
    unknown,
): asserts value is FinoraFullBranchBackupScopeV2 {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "ownerId",
        "businessId",
        "branchId",
      ],
    ) ||
    !hasText(
      value.ownerId,
    ) ||
    !hasText(
      value.businessId,
    ) ||
    !hasText(
      value.branchId,
    )
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup scope.",
    );
  }
}

function validateKdf(
  value:
    unknown,
): asserts value is FinoraFullBranchBackupKdfV2 {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "algorithm",
        "salt",
        "N",
        "r",
        "p",
        "keyLength",
      ],
    ) ||
    value.algorithm !==
      "SCRYPT" ||
    !isCanonicalBase64(
      value.salt,
    ) ||
    value.N !==
      32768 ||
    value.r !==
      8 ||
    value.p !==
      1 ||
    value.keyLength !==
      32
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup KDF metadata.",
    );
  }
}

export function validateFinoraFullBranchBackupEncryptedRealSnapshotV2(
  value:
    unknown,
): asserts value is FinoraFullBranchBackupEncryptedRealSnapshotV2 {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "algorithm",
        "passwordKdf",
        "securityKdf",
        "iv",
        "authTag",
        "ciphertext",
      ],
    ) ||
    value.algorithm !==
      "AES-256-GCM" ||
    !isCanonicalBase64(
      value.iv,
    ) ||
    !isCanonicalBase64(
      value.authTag,
    ) ||
    !isCanonicalBase64(
      value.ciphertext,
    )
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup encrypted REAL snapshot.",
    );
  }

  validateKdf(
    value.passwordKdf,
  );

  validateKdf(
    value.securityKdf,
  );

  if (
    Buffer.from(
      value.iv,
      "base64",
    ).length !==
      12 ||
    Buffer.from(
      value.authTag,
      "base64",
    ).length !==
      16
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup AES-GCM metadata.",
    );
  }
}

export function validateFinoraFullBranchBackupBindingV2(
  value:
    unknown,
): asserts value is FinoraFullBranchBackupBindingV2 {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "backupId",
        "createdAt",
        "branchScope",
        "sourceStorageMode",
        "authGeneration",
      ],
    ) ||
    !hasText(
      value.backupId,
    ) ||
    !isCanonicalTimestamp(
      value.createdAt,
    ) ||
    (
      value.sourceStorageMode !==
        "LOCAL" &&
      value.sourceStorageMode !==
        "USB"
    ) ||
    !Number.isSafeInteger(
      value.authGeneration,
    ) ||
    (
      value.authGeneration as number
    ) <=
      0
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup binding.",
    );
  }

  validateFinoraFullBranchBackupScopeV2(
    value.branchScope,
  );
}

export function buildFinoraFullBranchBackupAadV2(
  binding:
    FinoraFullBranchBackupBindingV2,
): string {
  validateFinoraFullBranchBackupBindingV2(
    binding,
  );

  return JSON.stringify({
    format:
      FINORA_FULL_BRANCH_BACKUP_FILE_FORMAT,

    schemaVersion:
      FINORA_FULL_BRANCH_BACKUP_SCHEMA_VERSION,

    backupId:
      binding.backupId,

    createdAt:
      binding.createdAt,

    branchScope: {
      ownerId:
        binding.branchScope.ownerId,

      businessId:
        binding.branchScope.businessId,

      branchId:
        binding.branchScope.branchId,
    },

    dataContext:
      "REAL",

    sourceStorageMode:
      binding.sourceStorageMode,

    authGeneration:
      binding.authGeneration,
  });
}

export function sha256Hex(
  value:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "hex",
    )
    .toUpperCase();
}

export function validateFinoraFullBranchBackupFileV2(
  value:
    unknown,
): asserts value is FinoraFullBranchBackupFileV2 {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "format",
        "schemaVersion",
        "backupId",
        "createdAt",
        "branchScope",
        "dataContext",
        "sourceStorageMode",
        "authGeneration",
        "portableAuthEnvelopeSerialized",
        "portableAuthEnvelopeSha256",
        "realSnapshot",
      ],
    ) ||
    value.format !==
      FINORA_FULL_BRANCH_BACKUP_FILE_FORMAT ||
    value.schemaVersion !==
      FINORA_FULL_BRANCH_BACKUP_SCHEMA_VERSION ||
    !hasText(
      value.backupId,
    ) ||
    !isCanonicalTimestamp(
      value.createdAt,
    ) ||
    value.dataContext !==
      "REAL" ||
    (
      value.sourceStorageMode !==
        "LOCAL" &&
      value.sourceStorageMode !==
        "USB"
    ) ||
    !Number.isSafeInteger(
      value.authGeneration,
    ) ||
    (
      value.authGeneration as number
    ) <=
      0 ||
    !hasText(
      value.portableAuthEnvelopeSerialized,
    ) ||
    typeof value.portableAuthEnvelopeSha256 !==
      "string" ||
    !/^[A-F0-9]{64}$/.test(
      value.portableAuthEnvelopeSha256,
    )
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup V2 file.",
    );
  }

  validateFinoraFullBranchBackupScopeV2(
    value.branchScope,
  );

  validateFinoraFullBranchBackupEncryptedRealSnapshotV2(
    value.realSnapshot,
  );

  if (
    sha256Hex(
      value.portableAuthEnvelopeSerialized,
    ) !==
      value.portableAuthEnvelopeSha256
  ) {
    throw new Error(
      "FINORA Full Branch Backup Portable Auth digest mismatch.",
    );
  }
}

export function createFinoraFullBranchBackupFileV2(
  input:
    Omit<
      FinoraFullBranchBackupFileV2,
      | "format"
      | "schemaVersion"
      | "dataContext"
      | "portableAuthEnvelopeSha256"
    >,
): FinoraFullBranchBackupFileV2 {
  const output:
    FinoraFullBranchBackupFileV2 =
    {
      format:
        FINORA_FULL_BRANCH_BACKUP_FILE_FORMAT,

      schemaVersion:
        FINORA_FULL_BRANCH_BACKUP_SCHEMA_VERSION,

      backupId:
        input.backupId,

      createdAt:
        input.createdAt,

      branchScope:
        input.branchScope,

      dataContext:
        "REAL",

      sourceStorageMode:
        input.sourceStorageMode,

      authGeneration:
        input.authGeneration,

      portableAuthEnvelopeSerialized:
        input.portableAuthEnvelopeSerialized,

      portableAuthEnvelopeSha256:
        sha256Hex(
          input.portableAuthEnvelopeSerialized,
        ),

      realSnapshot:
        input.realSnapshot,
    };

  validateFinoraFullBranchBackupFileV2(
    output,
  );

  return output;
}

export function serializeFinoraFullBranchBackupFileV2(
  value:
    FinoraFullBranchBackupFileV2,
): string {
  validateFinoraFullBranchBackupFileV2(
    value,
  );

  return JSON.stringify(
    value,
  );
}

export function parseFinoraFullBranchBackupFileV2(
  serialized:
    string,
): FinoraFullBranchBackupFileV2 {
  if (
    typeof serialized !==
      "string" ||
    serialized.length ===
      0 ||
    Buffer.byteLength(
      serialized,
      "utf8",
    ) >
      FINORA_FULL_BRANCH_BACKUP_MAX_FILE_BYTES
  ) {
    throw new Error(
      "Invalid FINORA Full Branch Backup file bytes.",
    );
  }

  const parsed:
    unknown =
    JSON.parse(
      serialized,
    );

  validateFinoraFullBranchBackupFileV2(
    parsed,
  );

  return parsed;
}

export function createFinoraFullBranchRealSnapshotV1(
  input: {
    exportedAt:
      string;

    branchScope:
      FinoraFullBranchBackupScopeV2;

    records:
      unknown[];
  },
): FinoraFullBranchRealSnapshotV1 {
  const snapshot:
    FinoraFullBranchRealSnapshotV1 =
    {
      format:
        FINORA_FULL_BRANCH_REAL_SNAPSHOT_FORMAT,

      schemaVersion:
        FINORA_FULL_BRANCH_REAL_SNAPSHOT_SCHEMA_VERSION,

      exportedAt:
        input.exportedAt,

      branchScope:
        input.branchScope,

      dataContext:
        "REAL",

      recordCount:
        input.records.length,

      records:
        input.records,
    };

  validateFinoraFullBranchRealSnapshotV1(
    snapshot,
  );

  return snapshot;
}

export function validateFinoraFullBranchRealSnapshotV1(
  value:
    unknown,
): asserts value is FinoraFullBranchRealSnapshotV1 {
  if (
    !isRecord(value) ||
    !hasExactKeys(
      value,
      [
        "format",
        "schemaVersion",
        "exportedAt",
        "branchScope",
        "dataContext",
        "recordCount",
        "records",
      ],
    ) ||
    value.format !==
      FINORA_FULL_BRANCH_REAL_SNAPSHOT_FORMAT ||
    value.schemaVersion !==
      FINORA_FULL_BRANCH_REAL_SNAPSHOT_SCHEMA_VERSION ||
    !isCanonicalTimestamp(
      value.exportedAt,
    ) ||
    value.dataContext !==
      "REAL" ||
    !Number.isSafeInteger(
      value.recordCount,
    ) ||
    (
      value.recordCount as number
    ) <
      0 ||
    !Array.isArray(
      value.records,
    ) ||
    value.records.length !==
      value.recordCount
  ) {
    throw new Error(
      "Invalid FINORA Full Branch REAL snapshot.",
    );
  }

  validateFinoraFullBranchBackupScopeV2(
    value.branchScope,
  );
}

export function serializeFinoraFullBranchRealSnapshotV1(
  value:
    FinoraFullBranchRealSnapshotV1,
): string {
  validateFinoraFullBranchRealSnapshotV1(
    value,
  );

  return JSON.stringify(
    value,
  );
}

export function parseFinoraFullBranchRealSnapshotV1(
  serialized:
    string,
): FinoraFullBranchRealSnapshotV1 {
  const parsed:
    unknown =
    JSON.parse(
      serialized,
    );

  validateFinoraFullBranchRealSnapshotV1(
    parsed,
  );

  return parsed;
}