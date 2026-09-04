// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// PRIVATE SIGNING KEY VAULT
//
// RESPONSIBILITY:
//
// - Persist Control Center signing identity
// - Encrypt the complete vault using Electron safeStorage
// - Generate the signing key only on first initialization
// - Reject corrupt vaults without silent regeneration
// - Keep private key material inside Electron main process
//
// STORAGE:
//
// Electron userData/
//   FINORA/
//     control-center/
//       finora-control-center-key.bin
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - NO IPC.
// - NO renderer exposure.
// - NO plaintext private-key fallback.
// - A corrupt vault is NEVER silently replaced.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import fs from "node:fs/promises";

import path from "node:path";

import {
  randomUUID,
} from "node:crypto";

import {
  generateFinoraControlCenterSigningMaterial,
  validateFinoraControlCenterSigningMaterial,
} from "./finoraControlCenterCrypto.js";

// ============================================================
// CONSTANTS
// ============================================================

const VAULT_DIRECTORY =
  "FINORA";

const VAULT_SUBDIRECTORY =
  "control-center";

const VAULT_FILE =
  "finora-control-center-key.bin";

// ============================================================
// VAULT RECORD
// ============================================================

export interface FinoraControlCenterKeyVaultRecord {

  issuerId:
    string;

  signingKeyId:
    string;

  privateKeyPkcs8DerBase64:
    string;

  publicKeySpkiDerBase64:
    string;

  createdAt:
    string;

  schemaVersion:
    1;
}

// ============================================================
// PATH
// ============================================================

function getVaultPath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA Control Center key vault cannot be used before Electron is ready.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    VAULT_DIRECTORY,
    VAULT_SUBDIRECTORY,
    VAULT_FILE,
  );
}

// ============================================================
// VALIDATION
// ============================================================

function isVaultRecord(
  value: unknown,
): value is
  FinoraControlCenterKeyVaultRecord {

  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return (
    record.schemaVersion === 1 &&
    typeof record.issuerId === "string" &&
    record.issuerId.length > 0 &&
    typeof record.signingKeyId === "string" &&
    record.signingKeyId.length > 0 &&
    typeof record.privateKeyPkcs8DerBase64 === "string" &&
    record.privateKeyPkcs8DerBase64.length > 0 &&
    typeof record.publicKeySpkiDerBase64 === "string" &&
    record.publicKeySpkiDerBase64.length > 0 &&
    typeof record.createdAt === "string" &&
    record.createdAt.length > 0
  );
}

function validateVaultCryptography(
  record:
    FinoraControlCenterKeyVaultRecord,
): void {

  const valid =
    validateFinoraControlCenterSigningMaterial({
      signingKeyId:
        record.signingKeyId,

      privateKeyPkcs8DerBase64:
        record.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        record.publicKeySpkiDerBase64,
    });

  if (!valid) {
    throw new Error(
      "FINORA Control Center signing-key vault failed cryptographic validation.",
    );
  }
}

// ============================================================
// READ
// ============================================================

async function readVault():
  Promise<
    FinoraControlCenterKeyVaultRecord | undefined
  > {

  const vaultPath =
    getVaultPath();

  let encrypted:
    Buffer;

  try {

    encrypted =
      await fs.readFile(
        vaultPath,
      );

  } catch (error) {

    const code =
      (
        error as NodeJS.ErrnoException
      ).code;

    if (code === "ENOENT") {
      return undefined;
    }

    throw error;
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure key-vault encryption is unavailable.",
    );
  }

  let plaintext:
    string;

  try {

    plaintext =
      safeStorage.decryptString(
        encrypted,
      );

  } catch {
    throw new Error(
      "FINORA Control Center signing-key vault cannot be decrypted.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        plaintext,
      );

  } catch {
    throw new Error(
      "FINORA Control Center signing-key vault is corrupt.",
    );
  }

  if (!isVaultRecord(parsed)) {
    throw new Error(
      "FINORA Control Center signing-key vault schema is invalid.",
    );
  }

  validateVaultCryptography(
    parsed,
  );

  return parsed;
}

// ============================================================
// WRITE
// ============================================================

async function writeVault(
  record:
    FinoraControlCenterKeyVaultRecord,
): Promise<void> {

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure key-vault encryption is unavailable. Private key was not persisted.",
    );
  }

  validateVaultCryptography(
    record,
  );

  const vaultPath =
    getVaultPath();

  const directory =
    path.dirname(
      vaultPath,
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        record,
      ),
    );

  const temporaryPath =
    `${vaultPath}.${process.pid}.tmp`;

  try {

    await fs.writeFile(
      temporaryPath,
      encrypted,
      {
        mode:
          0o600,
      },
    );

    await fs.rename(
      temporaryPath,
      vaultPath,
    );

  } catch (error) {

    await fs.rm(
      temporaryPath,
      {
        force:
          true,
      },
    )
      .catch(
        () =>
          undefined,
      );

    throw error;
  }
}

// ============================================================
// LOAD OR INITIALIZE
// ============================================================

export async function loadOrCreateFinoraControlCenterKeyVault():
  Promise<
    FinoraControlCenterKeyVaultRecord
  > {

  const existing =
    await readVault();

  if (existing) {
    return existing;
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure key-vault encryption is unavailable. Signing identity was not created.",
    );
  }

  const material =
    generateFinoraControlCenterSigningMaterial();

  const now =
    new Date()
      .toISOString();

  const record:
    FinoraControlCenterKeyVaultRecord = {

      issuerId:
        `FINORA-CC-${randomUUID()}`,

      signingKeyId:
        material.signingKeyId,

      privateKeyPkcs8DerBase64:
        material.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        material.publicKeySpkiDerBase64,

      createdAt:
        now,

      schemaVersion:
        1,
    };

  await writeVault(
    record,
  );

  return record;
}

// ============================================================
// PUBLIC-ONLY VIEW
// ============================================================

export interface FinoraControlCenterPublicIdentity {

  issuerId:
    string;

  signingKeyId:
    string;

  publicKeySpkiDerBase64:
    string;

  createdAt:
    string;
}

export async function getFinoraControlCenterPublicIdentity():
  Promise<
    FinoraControlCenterPublicIdentity
  > {

  const vault =
    await loadOrCreateFinoraControlCenterKeyVault();

  return {
    issuerId:
      vault.issuerId,

    signingKeyId:
      vault.signingKeyId,

    publicKeySpkiDerBase64:
      vault.publicKeySpkiDerBase64,

    createdAt:
      vault.createdAt,
  };
}

// ============================================================
// END
// ============================================================