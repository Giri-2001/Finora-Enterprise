// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP ARTIFACT CONTRACT
// PHASE : 5.6N-N1
// ============================================================
//
// SECURITY MODEL:
//
// - The backup wrapper is NOT a live Portable Auth file.
// - The exact canonical serialized encrypted Portable Auth envelope
//   is carried as opaque backup payload.
// - Branch Certification private material remains inside the
//   encrypted Portable Auth envelope.
// - Password and Security Code are NEVER stored by this wrapper.
// - envelopeSha256 detects corruption of the embedded serialized
//   envelope; SHA-256 is NOT authentication or authorization.
// - Wrapper metadata is descriptive evidence only.
// - Restore MUST parse + authenticate the embedded Portable Auth
//   envelope and cross-check scope/storage/generation before write.
// - Backup does not authorize LOCAL <-> USB storage-mode migration.
// ============================================================

import {
  createHash,
} from "node:crypto";

export const
FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_FORMAT =
  "FINORA_PORTABLE_BRANCH_AUTH_BACKUP" as const;

export const
FINORA_PORTABLE_BRANCH_AUTH_BACKUP_SCHEMA_VERSION =
  1 as const;

export const
FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_EXTENSION =
  ".finora" as const;

export const
FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES =
  1_048_576 as const;

const FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_ENVELOPE_BYTES =
  786_432;

const FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_ID_LENGTH =
  160;

const FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_SCOPE_ID_LENGTH =
  256;

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthBackupScopeV1 {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export type FinoraPortableBranchAuthBackupSourceStorageMode =
  | "LOCAL"
  | "USB";

export interface FinoraPortableBranchAuthBackupFileV1 {
  format:
    typeof FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_FORMAT;

  schemaVersion:
    typeof FINORA_PORTABLE_BRANCH_AUTH_BACKUP_SCHEMA_VERSION;

  backupId:
    string;

  createdAt:
    string;

  branchScope:
    FinoraPortableBranchAuthBackupScopeV1;

  sourceStorageMode:
    FinoraPortableBranchAuthBackupSourceStorageMode;

  authGeneration:
    number;

  envelopeSha256:
    string;

  /**
   * Canonical serialization produced from the live encrypted
   * Portable Auth envelope.
   *
   * This value remains encrypted Portable Auth material.
   * It is deliberately NOT unpacked into backup-specific
   * password/security/certification fields.
   */
  portableAuthEnvelopeSerialized:
    string;
}

export interface CreateFinoraPortableBranchAuthBackupFileV1Input {
  backupId:
    string;

  createdAt:
    string;

  branchScope:
    FinoraPortableBranchAuthBackupScopeV1;

  sourceStorageMode:
    FinoraPortableBranchAuthBackupSourceStorageMode;

  authGeneration:
    number;

  portableAuthEnvelopeSerialized:
    string;
}

// ============================================================
// ERROR
// ============================================================

export class FinoraPortableBranchAuthBackupContractError
  extends Error {
  constructor(
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraPortableBranchAuthBackupContractError";
  }
}

// ============================================================
// INTERNAL VALIDATION
// ============================================================

type UnknownObject =
  Record<string, unknown>;

function isObject(
  value:
    unknown,
): value is UnknownObject {
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

function fail(
  message:
    string,
): never {
  throw new FinoraPortableBranchAuthBackupContractError(
    message,
  );
}

function assertExactKeys(
  value:
    UnknownObject,
  expected:
    readonly string[],
  label:
    string,
): void {
  const actual =
    Object.keys(
      value,
    ).sort();

  const wanted =
    [...expected].sort();

  if (
    actual.length !==
      wanted.length ||
    actual.some(
      (
        key,
        index,
      ) =>
        key !==
          wanted[index],
    )
  ) {
    fail(
      `${label} contains unexpected or missing fields.`,
    );
  }
}

function assertBoundedTrimmedString(
  value:
    unknown,
  label:
    string,
  maximumLength:
    number,
): asserts value is string {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    value.length >
      maximumLength ||
    value !==
      value.trim()
  ) {
    fail(
      `${label} is invalid.`,
    );
  }
}

function validateIsoTimestamp(
  value:
    unknown,
  label:
    string,
): asserts value is string {
  assertBoundedTrimmedString(
    value,
    label,
    64,
  );

  const milliseconds =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      milliseconds,
    ) ||
    new Date(
      milliseconds,
    ).toISOString() !==
      value
  ) {
    fail(
      `${label} must be a canonical ISO timestamp.`,
    );
  }
}

function validateScope(
  value:
    unknown,
): asserts value is FinoraPortableBranchAuthBackupScopeV1 {
  if (
    !isObject(
      value,
    )
  ) {
    fail(
      "Backup branchScope is invalid.",
    );
  }

  assertExactKeys(
    value,
    [
      "ownerId",
      "businessId",
      "branchId",
    ],
    "Backup branchScope",
  );

  assertBoundedTrimmedString(
    value.ownerId,
    "Backup branchScope.ownerId",
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_SCOPE_ID_LENGTH,
  );

  assertBoundedTrimmedString(
    value.businessId,
    "Backup branchScope.businessId",
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_SCOPE_ID_LENGTH,
  );

  assertBoundedTrimmedString(
    value.branchId,
    "Backup branchScope.branchId",
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_SCOPE_ID_LENGTH,
  );
}

function validateSerializedEnvelope(
  value:
    unknown,
): asserts value is string {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    fail(
      "Backup embedded Portable Auth envelope is invalid.",
    );
  }

  const bytes =
    Buffer.byteLength(
      value,
      "utf8",
    );

  if (
    bytes <=
      0 ||
    bytes >
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_ENVELOPE_BYTES
  ) {
    fail(
      "Backup embedded Portable Auth envelope exceeds the supported size limit.",
    );
  }
}

// ============================================================
// ENVELOPE CHECKSUM
// ============================================================

export function computeFinoraPortableBranchAuthBackupEnvelopeSha256(
  portableAuthEnvelopeSerialized:
    string,
): string {
  validateSerializedEnvelope(
    portableAuthEnvelopeSerialized,
  );

  return createHash(
    "sha256",
  )
    .update(
      portableAuthEnvelopeSerialized,
      "utf8",
    )
    .digest(
      "hex",
    )
    .toUpperCase();
}

// ============================================================
// VALIDATION
// ============================================================

export function validateFinoraPortableBranchAuthBackupFileV1(
  value:
    unknown,
): asserts value is FinoraPortableBranchAuthBackupFileV1 {
  if (
    !isObject(
      value,
    )
  ) {
    fail(
      "Portable Branch Auth backup file is invalid.",
    );
  }

  assertExactKeys(
    value,
    [
      "format",
      "schemaVersion",
      "backupId",
      "createdAt",
      "branchScope",
      "sourceStorageMode",
      "authGeneration",
      "envelopeSha256",
      "portableAuthEnvelopeSerialized",
    ],
    "Portable Branch Auth backup file",
  );

  if (
    value.format !==
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_FORMAT
  ) {
    fail(
      "Portable Branch Auth backup format is unsupported.",
    );
  }

  if (
    value.schemaVersion !==
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_SCHEMA_VERSION
  ) {
    fail(
      "Portable Branch Auth backup schemaVersion is unsupported.",
    );
  }

  assertBoundedTrimmedString(
    value.backupId,
    "Backup backupId",
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_ID_LENGTH,
  );

  validateIsoTimestamp(
    value.createdAt,
    "Backup createdAt",
  );

  validateScope(
    value.branchScope,
  );

  if (
    value.sourceStorageMode !==
      "LOCAL" &&
    value.sourceStorageMode !==
      "USB"
  ) {
    fail(
      "Backup sourceStorageMode is invalid.",
    );
  }

  if (
    typeof value.authGeneration !==
      "number" ||
    !Number.isSafeInteger(
      value.authGeneration,
    ) ||
    value.authGeneration <
      1
  ) {
    fail(
      "Backup authGeneration is invalid.",
    );
  }

  validateSerializedEnvelope(
    value.portableAuthEnvelopeSerialized,
  );

  if (
    typeof value.envelopeSha256 !==
      "string" ||
    !/^[A-F0-9]{64}$/.test(
      value.envelopeSha256,
    )
  ) {
    fail(
      "Backup envelopeSha256 is invalid.",
    );
  }

  const expectedHash =
    computeFinoraPortableBranchAuthBackupEnvelopeSha256(
      value.portableAuthEnvelopeSerialized,
    );

  if (
    value.envelopeSha256 !==
      expectedHash
  ) {
    fail(
      "Backup embedded Portable Auth envelope checksum does not match.",
    );
  }
}

// ============================================================
// CREATION
// ============================================================

export function createFinoraPortableBranchAuthBackupFileV1(
  input:
    CreateFinoraPortableBranchAuthBackupFileV1Input,
): FinoraPortableBranchAuthBackupFileV1 {
  if (
    !isObject(
      input,
    )
  ) {
    fail(
      "Portable Branch Auth backup creation input is invalid.",
    );
  }

  assertExactKeys(
    input,
    [
      "backupId",
      "createdAt",
      "branchScope",
      "sourceStorageMode",
      "authGeneration",
      "portableAuthEnvelopeSerialized",
    ],
    "Portable Branch Auth backup creation input",
  );

  const file:
    FinoraPortableBranchAuthBackupFileV1 = {
      format:
        FINORA_PORTABLE_BRANCH_AUTH_BACKUP_FILE_FORMAT,

      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_BACKUP_SCHEMA_VERSION,

      backupId:
        input.backupId,

      createdAt:
        input.createdAt,

      branchScope: {
        ownerId:
          input.branchScope.ownerId,

        businessId:
          input.branchScope.businessId,

        branchId:
          input.branchScope.branchId,
      },

      sourceStorageMode:
        input.sourceStorageMode,

      authGeneration:
        input.authGeneration,

      envelopeSha256:
        computeFinoraPortableBranchAuthBackupEnvelopeSha256(
          input.portableAuthEnvelopeSerialized,
        ),

      portableAuthEnvelopeSerialized:
        input.portableAuthEnvelopeSerialized,
    };

  validateFinoraPortableBranchAuthBackupFileV1(
    file,
  );

  return file;
}

// ============================================================
// SERIALIZATION
// ============================================================

export function serializeFinoraPortableBranchAuthBackupFileV1(
  file:
    FinoraPortableBranchAuthBackupFileV1,
): string {
  validateFinoraPortableBranchAuthBackupFileV1(
    file,
  );

  const serialized =
    JSON.stringify(
      file,
      null,
      2,
    );

  const bytes =
    Buffer.byteLength(
      serialized,
      "utf8",
    );

  if (
    bytes <=
      0 ||
    bytes >
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES
  ) {
    fail(
      "Portable Branch Auth backup file exceeds the supported size limit.",
    );
  }

  return serialized;
}

// ============================================================
// PARSING
// ============================================================

export function parseFinoraPortableBranchAuthBackupFileV1(
  serialized:
    string,
): FinoraPortableBranchAuthBackupFileV1 {
  if (
    typeof serialized !==
      "string" ||
    serialized.length ===
      0
  ) {
    fail(
      "Portable Branch Auth backup serialization is invalid.",
    );
  }

  const bytes =
    Buffer.byteLength(
      serialized,
      "utf8",
    );

  if (
    bytes <=
      0 ||
    bytes >
      FINORA_PORTABLE_BRANCH_AUTH_BACKUP_MAX_FILE_BYTES
  ) {
    fail(
      "Portable Branch Auth backup file exceeds the supported size limit.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      );
  }
  catch {
    fail(
      "Portable Branch Auth backup JSON is malformed.",
    );
  }

  validateFinoraPortableBranchAuthBackupFileV1(
    parsed,
  );

  return parsed;
}