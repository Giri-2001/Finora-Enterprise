import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

export const PAISARULE_STORAGE_BACKUP_V1_FORMAT =
  "PAISARULE_STORAGE_BACKUP";

export const PAISARULE_STORAGE_BACKUP_V1_VERSION = 1;

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SCRYPT_MAX_MEMORY = 128 * 1024 * 1024;

const MAX_SCOPE_LENGTH = 512;
const MAX_PASSWORD_BYTES = 4096;
const MAX_PAYLOAD_BYTES = 64 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 96 * 1024 * 1024;

const KDF_ID = "scrypt-n32768-r8-p1";
const CIPHER_ID = "aes-256-gcm";

export interface PaisaruleStorageBackupV1Scope {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

interface BackupEnvelope {
  format: string;
  version: number;
  createdAt: string;
  scopeFingerprint: string;
  kdf: string;
  cipher: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function validateScope(
  scope: PaisaruleStorageBackupV1Scope,
): PaisaruleStorageBackupV1Scope {
  if (
    !scope ||
    typeof scope !== "object" ||
    Array.isArray(scope)
  ) {
    return fail("BACKUP_SCOPE_INVALID");
  }

  const names = [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
  ] as const;

  for (const name of names) {
    const value = scope[name];

    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > MAX_SCOPE_LENGTH ||
      value.trim() !== value ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) {
      return fail("BACKUP_SCOPE_INVALID");
    }
  }

  return {
    userId: scope.userId,
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function scopeCanonical(
  scope: PaisaruleStorageBackupV1Scope,
): string {
  const checked = validateScope(scope);

  return JSON.stringify([
    checked.userId,
    checked.ownerId,
    checked.businessId,
    checked.branchId,
  ]);
}

function scopeFingerprint(
  scope: PaisaruleStorageBackupV1Scope,
): string {
  return createHash("sha256")
    .update(scopeCanonical(scope), "utf8")
    .digest("hex");
}

function getKdfSalt(fingerprint: string): Buffer {
  return createHash("sha256")
    .update("PAISARULE_STORAGE_BACKUP_V1_KDF\u0000", "utf8")
    .update(fingerprint, "utf8")
    .digest();
}

function aad(
  fingerprint: string,
  createdAt: string,
): Buffer {
  return Buffer.from(
    [
      PAISARULE_STORAGE_BACKUP_V1_FORMAT,
      String(PAISARULE_STORAGE_BACKUP_V1_VERSION),
      fingerprint,
      createdAt,
    ].join("\n"),
    "utf8",
  );
}

function copyValidatedKey(key: Uint8Array): Buffer {
  if (
    !(key instanceof Uint8Array) ||
    key.byteLength !== KEY_LENGTH
  ) {
    return fail("BACKUP_KEY_INVALID");
  }

  return Buffer.from(key);
}

export async function derivePaisaruleStorageBackupV1Key(
  password: string,
  scope: PaisaruleStorageBackupV1Scope,
): Promise<Buffer> {
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES
  ) {
    return fail("BACKUP_PASSWORD_INVALID");
  }

  const fingerprint = scopeFingerprint(scope);
  const salt = getKdfSalt(fingerprint);

  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password,
        salt,
        KEY_LENGTH,
        {
          N: 32768,
          r: 8,
          p: 1,
          maxmem: SCRYPT_MAX_MEMORY,
        },
        (error, derivedKey) => {
          if (error) {
            reject(new Error("BACKUP_KEY_DERIVATION_FAILED"));
            return;
          }

          resolve(Buffer.from(derivedKey));
        },
      );
    });
  } finally {
    salt.fill(0);
  }
}

export function destroyPaisaruleStorageBackupV1Key(
  key: Uint8Array | null | undefined,
): void {
  if (key instanceof Uint8Array) {
    key.fill(0);
  }
}

export function encryptPaisaruleStorageBackupV1(
  payload: Uint8Array,
  keyInput: Uint8Array,
  scope: PaisaruleStorageBackupV1Scope,
  createdAtInput = new Date().toISOString(),
): string {
  if (
    !(payload instanceof Uint8Array) ||
    payload.byteLength === 0 ||
    payload.byteLength > MAX_PAYLOAD_BYTES
  ) {
    return fail("BACKUP_PAYLOAD_INVALID");
  }

  const key = copyValidatedKey(keyInput);
  const fingerprint = scopeFingerprint(scope);
  const createdAt = createdAtInput;

  if (!Number.isFinite(Date.parse(createdAt))) {
    key.fill(0);
    return fail("BACKUP_TIMESTAMP_INVALID");
  }

  const iv = randomBytes(IV_LENGTH);

  try {
    const cipher = createCipheriv(CIPHER_ID, key, iv);

    cipher.setAAD(aad(fingerprint, createdAt));

    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(payload)),
      cipher.final(),
    ]);

    const envelope: BackupEnvelope = {
      format: PAISARULE_STORAGE_BACKUP_V1_FORMAT,
      version: PAISARULE_STORAGE_BACKUP_V1_VERSION,
      createdAt,
      scopeFingerprint: fingerprint,
      kdf: KDF_ID,
      cipher: CIPHER_ID,
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: encrypted.toString("base64"),
    };

    const serialized = JSON.stringify(envelope);

    if (
      Buffer.byteLength(serialized, "utf8") > MAX_PACKAGE_BYTES
    ) {
      return fail("BACKUP_PACKAGE_TOO_LARGE");
    }

    return serialized;
  } finally {
    key.fill(0);
    iv.fill(0);
  }
}

/**
 * C115-R1: Stack-safe strict Base64 syntax validation.
 *
 * Avoid quantified regex execution over multi-megabyte
 * encrypted ciphertext.
 *
 * The existing decodeBase64() still enforces:
 * - nonempty input
 * - length divisible by four
 * - decoded byte size limits
 * - canonical Base64 round-trip equality
 */
function isCanonicalBase64Syntax(value: string): boolean {
  let paddingStarted = false;

  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);

    if (code === 61) {
      if (i < value.length - 2) {
        return false;
      }

      if (
        i === value.length - 2 &&
        value.charCodeAt(i + 1) !== 61
      ) {
        return false;
      }

      paddingStarted = true;
      continue;
    }

    if (paddingStarted) {
      return false;
    }

    const valid =
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 43 ||
      code === 47;

    if (!valid) {
      return false;
    }
  }

  return true;
}
function decodeBase64(
  value: unknown,
  maximum: number,
): Buffer {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 4 !== 0 ||
    !isCanonicalBase64Syntax(value)
  ) {
    return fail("BACKUP_ENCODING_INVALID");
  }

  const decoded = Buffer.from(value, "base64");

  if (
    decoded.length === 0 ||
    decoded.length > maximum ||
    decoded.toString("base64") !== value
  ) {
    decoded.fill(0);
    return fail("BACKUP_ENCODING_INVALID");
  }

  return decoded;
}

function parseEnvelope(serialized: string): BackupEnvelope {
  if (
    typeof serialized !== "string" ||
    Buffer.byteLength(serialized, "utf8") > MAX_PACKAGE_BYTES
  ) {
    return fail("BACKUP_FILE_INVALID");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    return fail("BACKUP_JSON_INVALID");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return fail("BACKUP_FORMAT_INVALID");
  }

  const value = parsed as Record<string, unknown>;

  const expected = [
    "format",
    "version",
    "createdAt",
    "scopeFingerprint",
    "kdf",
    "cipher",
    "iv",
    "authTag",
    "ciphertext",
  ].sort();

  const actual = Object.keys(value).sort();

  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    return fail("BACKUP_SCHEMA_INVALID");
  }

  if (
    value.format !== PAISARULE_STORAGE_BACKUP_V1_FORMAT ||
    value.version !== PAISARULE_STORAGE_BACKUP_V1_VERSION ||
    value.kdf !== KDF_ID ||
    value.cipher !== CIPHER_ID ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.scopeFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.scopeFingerprint)
  ) {
    return fail("BACKUP_SCHEMA_INVALID");
  }

  return value as unknown as BackupEnvelope;
}

export function decryptPaisaruleStorageBackupV1(
  serialized: string,
  keyInput: Uint8Array,
  expectedScope: PaisaruleStorageBackupV1Scope,
): Buffer {
  const key = copyValidatedKey(keyInput);

  let actualHash: Buffer | null = null;
  let expectedHash: Buffer | null = null;
  let iv: Buffer | null = null;
  let tag: Buffer | null = null;
  let ciphertext: Buffer | null = null;

  try {
    const envelope = parseEnvelope(serialized);
    const expectedFingerprint = scopeFingerprint(expectedScope);

    actualHash = Buffer.from(envelope.scopeFingerprint, "hex");
    expectedHash = Buffer.from(expectedFingerprint, "hex");
    if (
      actualHash.length !== 32 ||
      !timingSafeEqual(actualHash, expectedHash)
    ) {
      return fail("BACKUP_IDENTITY_MISMATCH");
    }

    iv = decodeBase64(envelope.iv, IV_LENGTH);
    tag = decodeBase64(envelope.authTag, TAG_LENGTH);
    ciphertext = decodeBase64(
      envelope.ciphertext,
      MAX_PAYLOAD_BYTES,
    );

    if (
      iv.length !== IV_LENGTH ||
      tag.length !== TAG_LENGTH
    ) {
      return fail("BACKUP_CRYPTO_FORMAT_INVALID");
    }

    const decipher = createDecipheriv(CIPHER_ID, key, iv);

    decipher.setAAD(
      aad(expectedFingerprint, envelope.createdAt),
    );

    decipher.setAuthTag(tag);

    try {
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      if (
        plaintext.length === 0 ||
        plaintext.length > MAX_PAYLOAD_BYTES
      ) {
        plaintext.fill(0);
        return fail("BACKUP_PAYLOAD_INVALID");
      }

      return plaintext;
    } catch {
      return fail("BACKUP_DECRYPTION_FAILED");
    }
  } finally {
    key.fill(0);
    actualHash?.fill(0);
    expectedHash?.fill(0);
    iv?.fill(0);
    tag?.fill(0);
    ciphertext?.fill(0);
  }
}