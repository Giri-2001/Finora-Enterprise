import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
} from "node:crypto";

import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";

import { join } from "node:path";
import { app, safeStorage } from "electron";

import {
  signFinoraWindowsBillingReceiptV2,
  type FinoraUsageBillingAttestationV2,
} from "./finoraUsageBillingReceiptSigner";

/*
 * FINORA C79-R15
 *
 * Billing-only Windows key vault.
 *
 * - Separate key identity from Branch Login and installation keys.
 * - P-256 private key encrypted with Electron safeStorage.
 * - Never return the private key to renderer code.
 * - Never automatically regenerate a missing or damaged key.
 * - Device enrollment/activation is NOT performed here.
 * - DPAPI/safeStorage is user-bound encrypted storage;
 *   it is NOT hardware-backed non-exportable attestation.
 *
 * INTERNAL MAIN PROCESS ONLY.
 * Do not expose unrestricted create/sign IPC.
 */

type VaultRecord = {
  version: 1;
  deviceId: string;
  publicKeySpkiBase64: string;
  publicKeySha256: string;
  encryptedPrivateKeyBase64: string;
};

export type FinoraWindowsBillingIdentity = Readonly<{
  deviceId: string;
  publicKeySpkiBase64: string;
  publicKeySha256: string;
}>;

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const SHA = /^[a-f0-9]{64}$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function vaultPath(): string {
  if (!app.isReady()) {
    throw new Error("BILLING_VAULT_APP_NOT_READY");
  }

  return join(
    app.getPath("userData"),
    "FINORA",
    "billing",
    "billing-device-v1.json",
  );
}

function requireEncryption(): void {
  if (
    process.platform !== "win32" ||
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error("BILLING_VAULT_ENCRYPTION_UNAVAILABLE");
  }
}

function requireSafeDirectory(path: string): void {
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    throw new Error("BILLING_VAULT_SYMLINK_DIRECTORY");
  }

  mkdirSync(path, {
    recursive: true,
    mode: 0o700,
  });

  const stat = lstatSync(path);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("BILLING_VAULT_INVALID_DIRECTORY");
  }
}

function directoryPath(): string {
  const root = join(app.getPath("userData"), "FINORA");
  const dir = join(root, "billing");

  requireSafeDirectory(root);
  requireSafeDirectory(dir);

  return dir;
}

function readVault(): VaultRecord {
  requireEncryption();

  const path = vaultPath();

  if (!existsSync(path)) {
    throw new Error("BILLING_VAULT_NOT_ENROLLED");
  }

  const stat = lstatSync(path);

  if (!stat.isFile() || stat.isSymbolicLink() ||
      stat.size <= 0 || stat.size > 16384) {
    throw new Error("BILLING_VAULT_INVALID_FILE");
  }

  const record: unknown = JSON.parse(
    readFileSync(path, "utf8"),
  );

  if (!record || typeof record !== "object" ||
      Array.isArray(record)) {
    throw new Error("BILLING_VAULT_INVALID_RECORD");
  }

  const value = record as Partial<VaultRecord>;

  if (
    value.version !== 1 ||
    typeof value.deviceId !== "string" ||
    !ID.test(value.deviceId) ||
    typeof value.publicKeySpkiBase64 !== "string" ||
    !BASE64.test(value.publicKeySpkiBase64) ||
    typeof value.publicKeySha256 !== "string" ||
    !SHA.test(value.publicKeySha256) ||
    typeof value.encryptedPrivateKeyBase64 !== "string" ||
    !BASE64.test(value.encryptedPrivateKeyBase64)
  ) {
    throw new Error("BILLING_VAULT_INVALID_RECORD");
  }

  const publicKey = Buffer.from(
    value.publicKeySpkiBase64,
    "base64",
  );

  if (
    publicKey.toString("base64") !==
    value.publicKeySpkiBase64 ||
    createHash("sha256").update(publicKey).digest("hex") !==
    value.publicKeySha256
  ) {
    throw new Error("BILLING_VAULT_PUBLIC_KEY_MISMATCH");
  }

  return value as VaultRecord;
}

function identity(record: VaultRecord): FinoraWindowsBillingIdentity {
  return Object.freeze({
    deviceId: record.deviceId,
    publicKeySpkiBase64: record.publicKeySpkiBase64,
    publicKeySha256: record.publicKeySha256,
  });
}

/*
 * Provision ONCE, only after explicit trusted main-process
 * authorization. Never call automatically on application startup.
 */
export function createFinoraWindowsBillingKeyIdentity():
  FinoraWindowsBillingIdentity {
  requireEncryption();

  const path = vaultPath();

  directoryPath();

  if (existsSync(path)) {
    throw new Error("BILLING_VAULT_ALREADY_EXISTS");
  }

  const pair = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });

  const publicDer = pair.publicKey.export({
    format: "der",
    type: "spki",
  });

  const privateDer = pair.privateKey.export({
    format: "der",
    type: "pkcs8",
  });

  let encrypted: Buffer;

  try {
    encrypted = safeStorage.encryptString(
      privateDer.toString("base64"),
    );
  } finally {
    privateDer.fill(0);
  }

  const record: VaultRecord = {
    version: 1,
    deviceId: "BILLING_" + randomUUID().replace(/-/g, ""),
    publicKeySpkiBase64: publicDer.toString("base64"),
    publicKeySha256: createHash("sha256")
      .update(publicDer)
      .digest("hex"),
    encryptedPrivateKeyBase64:
      encrypted.toString("base64"),
  };

  // Exclusive create: never overwrite an existing identity.
  const fd = openSync(path, "wx", 0o600);
  let finished = false;

  try {
    writeFileSync(fd, JSON.stringify(record), "utf8");
    fsyncSync(fd);
    finished = true;
  } finally {
    closeSync(fd);

    if (!finished) {
      try {
        unlinkSync(path);
      } catch {
        // Preserve the original write failure.
      }
    }
  }

  return identity(record);
}

export function getFinoraWindowsBillingPublicIdentity():
  FinoraWindowsBillingIdentity {
  return identity(readVault());
}

/*
 * Cryptographic signing only.
 *
 * Calling code MUST independently validate:
 * authenticated Owner session, active approved Billing device,
 * server-issued challenge, exact branch/source scope,
 * and native USB read-back digest.
 *
 * This function MUST NOT be a public renderer IPC handler.
 */
export function signFinoraWindowsBillingVaultReceipt(
  attestation: FinoraUsageBillingAttestationV2,
): string {
  const record = readVault();

  if (attestation?.deviceId !== record.deviceId) {
    throw new Error("BILLING_VAULT_DEVICE_MISMATCH");
  }

  const encrypted = Buffer.from(
    record.encryptedPrivateKeyBase64,
    "base64",
  );

  if (
    encrypted.toString("base64") !==
    record.encryptedPrivateKeyBase64
  ) {
    throw new Error("BILLING_VAULT_INVALID_CIPHERTEXT");
  }

  const privateDer = Buffer.from(
    safeStorage.decryptString(encrypted),
    "base64",
  );

  try {
    const privateKey = createPrivateKey({
      key: privateDer,
      format: "der",
      type: "pkcs8",
    });

    const publicDer = createPublicKey(privateKey).export({
      format: "der",
      type: "spki",
    });

    if (
      publicDer.toString("base64") !==
      record.publicKeySpkiBase64
    ) {
      throw new Error("BILLING_VAULT_PRIVATE_KEY_MISMATCH");
    }

    const signature = signFinoraWindowsBillingReceiptV2(
      attestation,
      privateKey,
    );

    if (!signature) {
      throw new Error("BILLING_VAULT_SIGNING_REJECTED");
    }

    return signature;
  } finally {
    privateDer.fill(0);
  }
}