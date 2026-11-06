import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";

export interface PaisaruleKeyAuthorityScope {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

interface KeyAuthorityEntry {
  generation: number;
  expiresAtMs: number;
  scopeFingerprint: Buffer;
  key: Buffer;
}

const authorities = new WeakMap<object, KeyAuthorityEntry>();

function fail(code: string): never {
  throw new Error(code);
}

function fingerprintScope(
  scope: PaisaruleKeyAuthorityScope,
): Buffer {
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    return fail("BACKUP_SCOPE_INVALID");
  }

  const fields = [
    scope.userId,
    scope.ownerId,
    scope.businessId,
    scope.branchId,
  ];

  for (const value of fields) {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.length > 512 ||
      value.trim() !== value ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) {
      return fail("BACKUP_SCOPE_INVALID");
    }
  }

  return createHash("sha256")
    .update(JSON.stringify(fields), "utf8")
    .digest();
}

function clearEntry(entry: KeyAuthorityEntry): void {
  entry.key.fill(0);
  entry.scopeFingerprint.fill(0);
}

export function setPaisaruleBackupSessionKey(
  sender: object,
  generation: number,
  keyInput: Uint8Array,
  scope: PaisaruleKeyAuthorityScope,
  expiresAt: string,
): void {
  if (!sender || typeof sender !== "object") {
    return fail("BACKUP_SENDER_INVALID");
  }

  if (!Number.isSafeInteger(generation) || generation <= 0) {
    return fail("BACKUP_GENERATION_INVALID");
  }

  if (!(keyInput instanceof Uint8Array) || keyInput.byteLength !== 32) {
    return fail("BACKUP_KEY_INVALID");
  }

  const expiresAtMs = Date.parse(expiresAt);

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return fail("BACKUP_SESSION_EXPIRED");
  }

  const fingerprint = fingerprintScope(scope);
  const previous = authorities.get(sender);

  if (previous) {
    clearEntry(previous);
  }

  authorities.set(sender, {
    generation,
    expiresAtMs,
    scopeFingerprint: fingerprint,
    key: Buffer.from(keyInput),
  });
}

export function getPaisaruleBackupSessionKey(
  sender: object,
  generation: number,
  expectedScope: PaisaruleKeyAuthorityScope,
): Buffer | null {
  if (!sender || typeof sender !== "object") {
    return null;
  }

  const entry = authorities.get(sender);

  if (!entry || generation !== entry.generation) {
    return null;
  }

  if (Date.now() >= entry.expiresAtMs) {
    clearEntry(entry);
    authorities.delete(sender);
    return null;
  }

  const expectedFingerprint = fingerprintScope(expectedScope);

  try {
    if (!timingSafeEqual(
      entry.scopeFingerprint,
      expectedFingerprint,
    )) {
      return null;
    }

    return Buffer.from(entry.key);
  } finally {
    expectedFingerprint.fill(0);
  }
}

export function clearPaisaruleBackupSessionKey(
  sender: object,
): void {
  if (!sender || typeof sender !== "object") return;

  const entry = authorities.get(sender);

  if (entry) {
    clearEntry(entry);
    authorities.delete(sender);
  }
}

export function isPaisaruleBackupSessionKeyAvailable(
  sender: object,
  generation: number,
): boolean {
  if (!sender || typeof sender !== "object") return false;

  const entry = authorities.get(sender);

  if (!entry || generation !== entry.generation) {
    return false;
  }

  if (Date.now() >= entry.expiresAtMs) {
    clearEntry(entry);
    authorities.delete(sender);
    return false;
  }

  return true;
}