import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";

export interface PaisaruleStorageBackupV1Scope {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleStorageBackupV1FileEntry {
  sha256: string;
  contentBase64: string;
}

export interface PaisaruleStorageBackupV1Payload {
  format: "PAISARULE_STORAGE_BACKUP_PAYLOAD";
  version: 1;
  createdAt: string;
  scope: PaisaruleStorageBackupV1Scope;
  storageFiles: {
    "finora-storage.json": PaisaruleStorageBackupV1FileEntry;
    "finora-storage.backup.json": PaisaruleStorageBackupV1FileEntry;
  };
}

export interface PaisaruleStorageBackupV1Validation {
  payload: PaisaruleStorageBackupV1Payload;
  recordCount: number;
  backupRecordCount: number;
}

const FORMAT = "PAISARULE_STORAGE_BACKUP_PAYLOAD";
const VERSION = 1;

const MAX_SCOPE_LENGTH = 512;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
const MAX_RECORDS = 200000;

const STORAGE_FILES = [
  "finora-storage.json",
  "finora-storage.backup.json",
] as const;

const ROOT_KEYS = [
  "records",
  "updatedAt",
  "version",
];

const RECORD_KEYS = [
  "id",
  "entity",
  "data",
  "createdAt",
  "updatedAt",
  "ownerId",
  "businessId",
  "branchId",
];

const textDecoder = new TextDecoder("utf-8", {
  fatal: true,
});

function fail(code: string): never {
  throw new Error(code);
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: string[],
  code: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();

  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail(code);
  }
}

function validateScope(
  scope: PaisaruleStorageBackupV1Scope,
): PaisaruleStorageBackupV1Scope {
  if (!isPlainObject(scope)) {
    return fail("BACKUP_SCOPE_INVALID");
  }

  assertExactKeys(
    scope as unknown as Record<string, unknown>,
    ["userId", "ownerId", "businessId", "branchId"],
    "BACKUP_SCOPE_INVALID",
  );

  for (const field of [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
  ] as const) {
    const value = scope[field];

    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > MAX_SCOPE_LENGTH ||
      value.trim() !== value ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) {
      fail("BACKUP_SCOPE_INVALID");
    }
  }

  return {
    userId: scope.userId,
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}

function equalScope(
  left: PaisaruleStorageBackupV1Scope,
  right: PaisaruleStorageBackupV1Scope,
): boolean {
  return (
    left.userId === right.userId &&
    left.ownerId === right.ownerId &&
    left.businessId === right.businessId &&
    left.branchId === right.branchId
  );
}

function parseStrictUtf8(bytes: Uint8Array): string {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_FILE_BYTES
  ) {
    return fail("BACKUP_STORAGE_FILE_INVALID");
  }

  try {
    return textDecoder.decode(bytes);
  } catch {
    return fail("BACKUP_STORAGE_UTF8_INVALID");
  }
}

function validateStorageJson(
  text: string,
  scope: PaisaruleStorageBackupV1Scope,
): number {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("BACKUP_STORAGE_JSON_INVALID");
  }

  if (!isPlainObject(parsed)) {
    return fail("BACKUP_STORAGE_ROOT_INVALID");
  }

  assertExactKeys(
    parsed,
    ROOT_KEYS,
    "BACKUP_STORAGE_ROOT_SCHEMA_INVALID",
  );

  if (
    typeof parsed.version !== "string" ||
    parsed.version.length === 0 ||
    typeof parsed.updatedAt !== "string" ||
    parsed.updatedAt.length === 0 ||
    !Array.isArray(parsed.records) ||
    parsed.records.length > MAX_RECORDS
  ) {
    return fail("BACKUP_STORAGE_ROOT_SCHEMA_INVALID");
  }

  for (const record of parsed.records) {
    if (!isPlainObject(record)) {
      fail("BACKUP_STORAGE_RECORD_INVALID");
    }

    assertExactKeys(
      record,
      RECORD_KEYS,
      "BACKUP_STORAGE_RECORD_SCHEMA_INVALID",
    );

    for (const field of [
      "id",
      "entity",
      "ownerId",
      "businessId",
      "branchId",
      "createdAt",
      "updatedAt",
    ] as const) {
      const value = record[field];

      if (
        typeof value !== "string" ||
        value.length === 0
      ) {
        fail("BACKUP_STORAGE_RECORD_INVALID");
      }
    }

    if (
      record.ownerId !== scope.ownerId ||
      record.businessId !== scope.businessId ||
      record.branchId !== scope.branchId
    ) {
      fail("BACKUP_STORAGE_RECORD_SCOPE_MISMATCH");
    }
  }

  return parsed.records.length;
}

function createFileEntry(
  raw: Uint8Array,
): PaisaruleStorageBackupV1FileEntry {
  return {
    sha256: sha256(raw),
    contentBase64: Buffer.from(raw).toString("base64"),
  };
}

export function createPaisaruleStorageBackupV1Payload(
  storageBytes: Uint8Array,
  storageBackupBytes: Uint8Array,
  scopeInput: PaisaruleStorageBackupV1Scope,
  createdAtInput = new Date().toISOString(),
): Buffer {
  const scope = validateScope(scopeInput);

  if (!Number.isFinite(Date.parse(createdAtInput))) {
    return fail("BACKUP_TIMESTAMP_INVALID");
  }

  const total =
    storageBytes.byteLength +
    storageBackupBytes.byteLength;

  if (
    total === 0 ||
    total > MAX_TOTAL_BYTES
  ) {
    return fail("BACKUP_STORAGE_TOTAL_SIZE_INVALID");
  }

  const storageText = parseStrictUtf8(storageBytes);
  const backupText = parseStrictUtf8(storageBackupBytes);

  validateStorageJson(storageText, scope);

  validateStorageJson(backupText, scope);

  const payload: PaisaruleStorageBackupV1Payload = {
    format: FORMAT,
    version: VERSION,
    createdAt: createdAtInput,
    scope,
    storageFiles: {
      "finora-storage.json":
        createFileEntry(storageBytes),
      "finora-storage.backup.json":
        createFileEntry(storageBackupBytes),
    },
  };

  const result = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  );

  if (result.byteLength > 96 * 1024 * 1024) {
    result.fill(0);
    return fail("BACKUP_PAYLOAD_TOO_LARGE");
  }

  return result;
}

function decodeFileEntry(
  value: unknown,
): Buffer {
  if (!isPlainObject(value)) {
    return fail("BACKUP_STORAGE_FILE_ENTRY_INVALID");
  }

  assertExactKeys(
    value,
    ["sha256", "contentBase64"],
    "BACKUP_STORAGE_FILE_ENTRY_INVALID",
  );

  if (
    typeof value.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    typeof value.contentBase64 !== "string" ||
    value.contentBase64.length === 0 ||
    value.contentBase64.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.contentBase64)
  ) {
    return fail("BACKUP_STORAGE_FILE_ENTRY_INVALID");
  }

  const bytes = Buffer.from(value.contentBase64, "base64");

  if (
    bytes.length === 0 ||
    bytes.length > MAX_FILE_BYTES ||
    bytes.toString("base64") !== value.contentBase64
  ) {
    bytes.fill(0);
    return fail("BACKUP_STORAGE_FILE_ENCODING_INVALID");
  }

  if (sha256(bytes) !== value.sha256) {
    bytes.fill(0);
    return fail("BACKUP_STORAGE_FILE_HASH_MISMATCH");
  }

  return bytes;
}

export function validatePaisaruleStorageBackupV1Payload(
  payloadBytes: Uint8Array,
  expectedScopeInput: PaisaruleStorageBackupV1Scope,
): PaisaruleStorageBackupV1Validation {
  if (
    !(payloadBytes instanceof Uint8Array) ||
    payloadBytes.byteLength === 0 ||
    payloadBytes.byteLength > 96 * 1024 * 1024
  ) {
    return fail("BACKUP_PAYLOAD_INVALID");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(
      parseStrictUtf8(payloadBytes),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("BACKUP_")
    ) {
      throw error;
    }

    return fail("BACKUP_PAYLOAD_JSON_INVALID");
  }

  if (!isPlainObject(parsed)) {
    return fail("BACKUP_PAYLOAD_INVALID");
  }

  assertExactKeys(
    parsed,
    ["format", "version", "createdAt", "scope", "storageFiles"],
    "BACKUP_PAYLOAD_SCHEMA_INVALID",
  );

  if (
    parsed.format !== FORMAT ||
    parsed.version !== VERSION ||
    typeof parsed.createdAt !== "string" ||
    !Number.isFinite(Date.parse(parsed.createdAt))
  ) {
    return fail("BACKUP_PAYLOAD_SCHEMA_INVALID");
  }

  const expectedScope = validateScope(expectedScopeInput);

  if (!isPlainObject(parsed.scope)) {
    return fail("BACKUP_SCOPE_INVALID");
  }

  const storedScope = validateScope(
    parsed.scope as unknown as PaisaruleStorageBackupV1Scope,
  );

  if (!equalScope(storedScope, expectedScope)) {
    return fail("BACKUP_IDENTITY_MISMATCH");
  }

  if (!isPlainObject(parsed.storageFiles)) {
    return fail("BACKUP_STORAGE_FILES_MISSING");
  }

  assertExactKeys(
    parsed.storageFiles,
    [...STORAGE_FILES],
    "BACKUP_STORAGE_FILES_MISSING",
  );

  const primary = decodeFileEntry(
    parsed.storageFiles["finora-storage.json"],
  );

  const secondary = decodeFileEntry(
    parsed.storageFiles["finora-storage.backup.json"],
  );

  try {
    const primaryCount = validateStorageJson(
      parseStrictUtf8(primary),
      expectedScope,
    );

    const backupCount = validateStorageJson(
      parseStrictUtf8(secondary),
      expectedScope,
    );

    return {
      payload: parsed as unknown as PaisaruleStorageBackupV1Payload,
      recordCount: primaryCount,
      backupRecordCount: backupCount,
    };
  } finally {
    primary.fill(0);
    secondary.fill(0);
  }
}