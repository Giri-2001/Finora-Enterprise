import { createHash, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

// PAISARULE_R175_C38
//
// Windows Storage Backup V1 Restore payload validator.
//
// Input MUST already be authenticated AES-GCM plaintext,
// obtained using the verified native Owner/Branch authority.
//
// No filesystem operations.
// No USB writes.
// No renderer-supplied authority.

const FORMAT = "PAISARULE_STORAGE_BACKUP_PAYLOAD";
const VERSION = 1;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;

const PRIMARY = "finora-storage.json";
const SECONDARY = "finora-storage.backup.json";

export interface PaisaruleRestoreScopeV1 {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleVerifiedRestoreFilesV1 {
  primary: Buffer;
  secondary: Buffer;
}

function fail(code: string): never {
  throw new Error(code);
}

function record(value: unknown): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return fail("RESTORE_PAYLOAD_OBJECT_INVALID");
  }

  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();

  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function validateScope(
  value: unknown,
  expected: PaisaruleRestoreScopeV1,
): void {
  const scope = record(value);

  const fields = [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
  ] as const;

  if (!exactKeys(scope, fields)) {
    fail("RESTORE_SCOPE_FIELDS_INVALID");
  }

  for (const field of fields) {
    const actual = scope[field];
    const expectedValue = expected[field];

    if (
      typeof actual !== "string" ||
      actual.length === 0 ||
      actual.length > 512 ||
      actual !== actual.trim() ||
      /[\u0000-\u001f\u007f]/.test(actual) ||
      typeof expectedValue !== "string" ||
      actual !== expectedValue
    ) {
      fail("RESTORE_BRANCH_SCOPE_MISMATCH");
    }
  }
}

function decodeFile(
  value: unknown,
  name: string,
): Buffer {
  const entry = record(value);

  if (!exactKeys(entry, ["sha256", "contentBase64"])) {
    fail("RESTORE_FILE_METADATA_INVALID");
  }

  if (
    typeof entry.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(entry.sha256) ||
    typeof entry.contentBase64 !== "string" ||
    entry.contentBase64.length === 0 ||
    entry.contentBase64.length >
      Math.ceil(MAX_FILE_BYTES / 3) * 4
  ) {
    fail("RESTORE_FILE_ENCODING_INVALID");
  }

  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
      .test(entry.contentBase64)
  ) {
    fail("RESTORE_FILE_BASE64_INVALID");
  }

  const bytes = Buffer.from(entry.contentBase64, "base64");

  if (
    bytes.length === 0 ||
    bytes.length > MAX_FILE_BYTES
  ) {
    bytes.fill(0);
    fail("RESTORE_FILE_SIZE_INVALID");
  }

  if (bytes.toString("base64") !== entry.contentBase64) {
    bytes.fill(0);
    fail("RESTORE_FILE_BASE64_NOT_CANONICAL");
  }

  const actualHash = createHash("sha256").update(bytes).digest();
  const expectedHash = Buffer.from(entry.sha256, "hex");

  const matches = timingSafeEqual(actualHash, expectedHash);

  actualHash.fill(0);
  expectedHash.fill(0);

  if (!matches) {
    bytes.fill(0);
    fail("RESTORE_FILE_SHA256_MISMATCH");
  }

  // Basic JSON syntax check. Full FINORA storage semantics
  // must be validated by the USB restore integration.
  try {
    const parsed: unknown = JSON.parse(bytes.toString("utf8"));

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      fail("RESTORE_STORAGE_JSON_INVALID");
    }
  } catch {
    bytes.fill(0);
    fail("RESTORE_STORAGE_JSON_INVALID");
  }

  void name;
  return bytes;
}

export function parsePaisaruleStorageBackupV1RestorePayload(
  plaintext: Buffer,
  authenticatedScope: PaisaruleRestoreScopeV1,
  envelopeCreatedAt: string,
): PaisaruleVerifiedRestoreFilesV1 {

  if (
    !Buffer.isBuffer(plaintext) ||
    plaintext.length === 0 ||
    plaintext.length > MAX_TOTAL_BYTES ||
    typeof envelopeCreatedAt !== "string" ||
    !Number.isFinite(Date.parse(envelopeCreatedAt))
  ) {
    fail("RESTORE_PAYLOAD_INPUT_INVALID");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(plaintext.toString("utf8"));
  } catch {
    fail("RESTORE_PAYLOAD_JSON_INVALID");
  }

  const payload = record(parsed);

  if (
    !exactKeys(
      payload,
      ["format", "version", "createdAt", "scope", "storageFiles"],
    ) ||
    payload.format !== FORMAT ||
    payload.version !== VERSION ||
    payload.createdAt !== envelopeCreatedAt
  ) {
    fail("RESTORE_PAYLOAD_CONTRACT_INVALID");
  }

  validateScope(payload.scope, authenticatedScope);

  const storageFiles = record(payload.storageFiles);

  if (!exactKeys(storageFiles, [PRIMARY, SECONDARY])) {
    fail("RESTORE_STORAGE_FILES_INVALID");
  }

  const primary = decodeFile(storageFiles[PRIMARY], PRIMARY);

  try {
    const secondary = decodeFile(
      storageFiles[SECONDARY],
      SECONDARY,
    );

    if (
      primary.length + secondary.length > MAX_TOTAL_BYTES
    ) {
      secondary.fill(0);
      fail("RESTORE_TOTAL_SIZE_INVALID");
    }

    return { primary, secondary };
  } catch (error) {
    primary.fill(0);
    throw error;
  }
}