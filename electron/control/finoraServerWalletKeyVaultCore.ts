// Main-process only. Never expose private material through IPC.
// Files contain encrypted signing material, never balances or session tokens.
import { promises as fs } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import {
  generateFinoraOwnerWalletProofKeyV1,
  signFinoraOwnerWalletProofV1,
} from "./finoraOwnerWalletProofCrypto.js";
import type {
  FinoraOwnerWalletProofKeyMaterialV1,
  FinoraOwnerWalletProofChallengeV1,
} from "./finoraOwnerWalletProofCrypto.js";

type Scope = Omit<FinoraOwnerWalletProofChallengeV1, "challenge" | "keyId">;
type Protection = {
  available: () => boolean;
  encrypt: (plain: string) => Buffer;
  decrypt: (encrypted: Buffer) => string;
};
const MAX_BYTES = 32768;
const fields = [
  "userId", "ownerId", "businessId", "branchId", "credentialId",
] as const;
const keyFields = [
  "schemaVersion", "keyId", "algorithm", "publicKeySpkiDerBase64",
  "publicKeySha256", "privateKeyPkcs8DerBase64",
];

function scopeCopy(value: Scope): Scope {
  if (
    !value ||
    !fields.every(field =>
      typeof value[field] === "string" &&
      value[field].length > 0 && value[field].length <= 128 &&
      value[field].trim() === value[field] &&
      !/[\u0000-\u001f\u007f]/.test(value[field])
    ) ||
    !Number.isSafeInteger(value.authGeneration) || value.authGeneration < 1
  ) throw new Error("INVALID_SCOPE");

  return {
    userId: value.userId, ownerId: value.ownerId,
    businessId: value.businessId, branchId: value.branchId,
    credentialId: value.credentialId, authGeneration: value.authGeneration,
  };
}

function scopeText(scope: Scope): string {
  return JSON.stringify([
    "FINORA_SERVER_WALLET_KEY_V1",
    ...fields.map(field => scope[field]),
    scope.authGeneration,
  ]);
}

function validateMaterial(
  value: unknown,
  scope: Scope,
): FinoraOwnerWalletProofKeyMaterialV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_KEY");
  }
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).length !== keyFields.length ||
    !keyFields.every(field => Object.hasOwn(object, field)) ||
    typeof object.keyId !== "string" || object.keyId.length !== 36
  ) throw new Error("INVALID_KEY");

  const material = value as FinoraOwnerWalletProofKeyMaterialV1;
  // Checks public/private consistency, fingerprint and signing capability.
  signFinoraOwnerWalletProofV1({
    ...scope, challenge: "0".repeat(64), keyId: material.keyId,
  }, material);
  return structuredClone(material);
}

export function createFinoraServerWalletKeyVaultCore(
  directory: string,
  protection: Protection,
) {
  if (
    typeof directory !== "string" || !path.isAbsolute(directory) ||
    !protection ||
    typeof protection.available !== "function" ||
    typeof protection.encrypt !== "function" ||
    typeof protection.decrypt !== "function"
  ) throw new Error("WALLET_KEY_VAULT_CONFIGURATION_INVALID");

  function requireProtection() {
    if (protection.available() !== true) throw new Error("NO_ENCRYPTION");
  }

  function filename(scope: Scope) {
    const hash = createHash("sha256").update(scopeText(scope)).digest("hex");
    return path.join(directory, hash + ".bin");
  }

  async function checkDirectory(create: boolean): Promise<boolean> {
    if (create) await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    let stat;
    try {
      stat = await fs.lstat(directory);
    } catch (error) {
      if (!create && (error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error("INVALID_VAULT_DIRECTORY");
    }
    return true;
  }

  async function readRecord(scope: Scope) {
    requireProtection();
    if (!await checkDirectory(false)) return null;
    const target = filename(scope);
    let stat;
    try {
      stat = await fs.lstat(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
    if (
      !stat.isFile() || stat.isSymbolicLink() ||
      stat.size < 1 || stat.size > MAX_BYTES
    ) throw new Error("INVALID_VAULT_FILE");

    const encrypted = await fs.readFile(target);
    if (encrypted.length < 1 || encrypted.length > MAX_BYTES) {
      throw new Error("INVALID_VAULT_FILE");
    }

    const plain = protection.decrypt(encrypted);
    if (typeof plain !== "string" || Buffer.byteLength(plain) > MAX_BYTES) {
      throw new Error("INVALID_VAULT_CONTENT");
    }

    const record = JSON.parse(plain);
    if (
      !record || record.schemaVersion !== 1 ||
      record.purpose !== "FINORA_SERVER_WALLET_KEY_V1" ||
      Object.keys(record).sort().join(",") !==
        "material,purpose,schemaVersion,scope" ||
      scopeText(scopeCopy(record.scope)) !== scopeText(scope)
    ) throw new Error("VAULT_SCOPE_MISMATCH");

    return validateMaterial(record.material, scope);
  }

  async function read(input: Scope) {
    try {
      const scope = scopeCopy(input);
      return await readRecord(scope);
    } catch {
      throw new Error("WALLET_KEY_VAULT_UNAVAILABLE");
    }
  }

  async function getOrCreate(input: Scope) {
    let temporary: string | null = null;
    try {
      const scope = scopeCopy(input);
      requireProtection();
      const existing = await readRecord(scope);
      if (existing) return existing;

      const material = validateMaterial(
        generateFinoraOwnerWalletProofKeyV1(), scope,
      );
      const encrypted = protection.encrypt(JSON.stringify({
        schemaVersion: 1,
        purpose: "FINORA_SERVER_WALLET_KEY_V1",
        scope,
        material,
      }));
      if (
        !Buffer.isBuffer(encrypted) ||
        encrypted.length < 1 || encrypted.length > MAX_BYTES
      ) throw new Error("INVALID_ENCRYPTION_RESULT");

      await checkDirectory(true);
      temporary = path.join(directory, randomUUID() + ".pending");
      const handle = await fs.open(temporary, "wx", 0o600);
      try {
        await handle.writeFile(encrypted);
        await handle.sync();
      } finally {
        await handle.close();
      }

      // Publish the complete ciphertext without overwriting an existing key.
      // Concurrent creators read the same winner. No overwrite fallback.
      try {
        await fs.link(temporary, filename(scope));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }

      const stored = await readRecord(scope);
      if (!stored) throw new Error("VAULT_POST_WRITE_FAILED");
      return stored;
    } catch {
      throw new Error("WALLET_KEY_VAULT_UNAVAILABLE");
    } finally {
      if (temporary) await fs.unlink(temporary).catch(() => undefined);
    }
  }

  return Object.freeze({ read, getOrCreate });
}