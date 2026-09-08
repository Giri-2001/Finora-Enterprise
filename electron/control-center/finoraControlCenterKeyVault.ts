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

export interface FinoraControlCenterRetainedSigningKeyRecord {
  signingKeyId:
    string;

  privateKeyPkcs8DerBase64:
    string;

  publicKeySpkiDerBase64:
    string;

  createdAt:
    string;

  retiredAt:
    string;
}

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

  /**
   * Previous Control Center signing keys retained only for
   * controlled trust-transition rollout.
   *
   * The top-level signing material remains the current
   * operational signing key.
   *
   * Optional for backward compatibility with pre-rotation
   * schemaVersion 1 vaults.
   */
  retainedSigningKeys?:
    FinoraControlCenterRetainedSigningKeyRecord[];

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

function isCanonicalIsoTimestamp(
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

function isRetainedSigningKeyRecord(
  value:
    unknown,
): value is
  FinoraControlCenterRetainedSigningKeyRecord {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const keys =
    Object.keys(
      record,
    ).sort();

  const expectedKeys =
    [
      "createdAt",
      "privateKeyPkcs8DerBase64",
      "publicKeySpkiDerBase64",
      "retiredAt",
      "signingKeyId",
    ];

  if (
    keys.length !==
      expectedKeys.length ||
    !keys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[index],
    )
  ) {
    return false;
  }

  return (
    typeof record.signingKeyId ===
      "string" &&
    record.signingKeyId.length >
      0 &&
    typeof record.privateKeyPkcs8DerBase64 ===
      "string" &&
    record.privateKeyPkcs8DerBase64.length >
      0 &&
    typeof record.publicKeySpkiDerBase64 ===
      "string" &&
    record.publicKeySpkiDerBase64.length >
      0 &&
    isCanonicalIsoTimestamp(
      record.createdAt,
    ) &&
    isCanonicalIsoTimestamp(
      record.retiredAt,
    )
  );
}

function isVaultRecord(
  value:
    unknown,
): value is
  FinoraControlCenterKeyVaultRecord {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    return false;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const baseValid =
    (
      record.schemaVersion ===
        1 &&
      typeof record.issuerId ===
        "string" &&
      record.issuerId.length >
        0 &&
      typeof record.signingKeyId ===
        "string" &&
      record.signingKeyId.length >
        0 &&
      typeof record.privateKeyPkcs8DerBase64 ===
        "string" &&
      record.privateKeyPkcs8DerBase64.length >
        0 &&
      typeof record.publicKeySpkiDerBase64 ===
        "string" &&
      record.publicKeySpkiDerBase64.length >
        0 &&
      typeof record.createdAt ===
        "string" &&
      record.createdAt.length >
        0
    );

  if (
    !baseValid
  ) {
    return false;
  }

  if (
    record.retainedSigningKeys ===
      undefined
  ) {
    return true;
  }

  return (
    Array.isArray(
      record.retainedSigningKeys,
    ) &&
    record.retainedSigningKeys.every(
      isRetainedSigningKeyRecord,
    )
  );
}

function validateVaultCryptography(
  record:
    FinoraControlCenterKeyVaultRecord,
): void {
  const currentValid =
    validateFinoraControlCenterSigningMaterial({
      signingKeyId:
        record.signingKeyId,

      privateKeyPkcs8DerBase64:
        record.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        record.publicKeySpkiDerBase64,
    });

  if (
    !currentValid
  ) {
    throw new Error(
      "FINORA Control Center current signing-key vault failed cryptographic validation.",
    );
  }

  const signingKeyIds =
    new Set<string>([
      record.signingKeyId,
    ]);

  for (
    const retainedKey of
      (
        record.retainedSigningKeys ??
        []
      )
  ) {
    const retainedValid =
      validateFinoraControlCenterSigningMaterial({
        signingKeyId:
          retainedKey.signingKeyId,

        privateKeyPkcs8DerBase64:
          retainedKey.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          retainedKey.publicKeySpkiDerBase64,
      });

    if (
      !retainedValid
    ) {
      throw new Error(
        "FINORA Control Center retained signing key failed cryptographic validation.",
      );
    }

    if (
      signingKeyIds.has(
        retainedKey.signingKeyId,
      )
    ) {
      throw new Error(
        "FINORA Control Center key vault contains a duplicate current/retained signingKeyId.",
      );
    }

    const createdAt =
      Date.parse(
        retainedKey.createdAt,
      );

    const retiredAt =
      Date.parse(
        retainedKey.retiredAt,
      );

    if (
      retiredAt <
        createdAt
    ) {
      throw new Error(
        "FINORA Control Center retained signing key retirement precedes key creation.",
      );
    }

    signingKeyIds.add(
      retainedKey.signingKeyId,
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

  if (
    !isVaultRecord(
      record,
    )
  ) {
    throw new Error(
      "FINORA Control Center signing-key vault schema is invalid.",
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

async function loadOrCreateFinoraControlCenterKeyVaultInternal():
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

  /*
   * BOOTSTRAP CLOCK BOUNDARY:
   *
   * This is the one-time genesis timestamp for a newly created
   * Control Center issuer/key vault.
   *
   * The issuer-bound clock high-water authority cannot guard this
   * first timestamp because that authority must first resolve this
   * Control Center identity. Routing genesis creation back through
   * that authority would introduce a circular dependency.
   *
   * After identity exists, operational issuance and signing-key
   * rotation use the issuer-bound clock high-water authority.
   *
   * This genesis timestamp therefore remains a bootstrap trust
   * assumption. It does not provide rollback detection by itself,
   * and coordinated replacement of older valid encrypted key-vault
   * and high-water files remains outside the same-process guarantee.
   */
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

let controlCenterKeyVaultLoadPromise:
  Promise<
    FinoraControlCenterKeyVaultRecord
  > | null =
    null;

export async function loadOrCreateFinoraControlCenterKeyVault():
  Promise<
    FinoraControlCenterKeyVaultRecord
  > {

  if (controlCenterKeyVaultLoadPromise) {
    return controlCenterKeyVaultLoadPromise;
  }

  const loadPromise =
    loadOrCreateFinoraControlCenterKeyVaultInternal();

  controlCenterKeyVaultLoadPromise =
    loadPromise;

  try {
    return await loadPromise;
  } finally {
    if (
      controlCenterKeyVaultLoadPromise ===
      loadPromise
    ) {
      controlCenterKeyVaultLoadPromise =
        null;
    }
  }
}

// ============================================================
// CONTROLLED VAULT REPLACEMENT
//
// This primitive persists a complete validated vault state.
//
// It does NOT:
// - choose a rotation policy,
// - generate a new key,
// - sign a trust transition,
// - expose renderer / IPC authority.
//
// Stable issuer identity is immutable.
//
// If the current signing key changes, the previous current
// signing material must remain present in retainedSigningKeys.
// This prevents an accidental destructive rollover.
// ============================================================

async function replaceFinoraControlCenterKeyVaultInternal(
  nextRecord:
    FinoraControlCenterKeyVaultRecord,
): Promise<void> {
  const existing =
    await loadOrCreateFinoraControlCenterKeyVault();

  if (
    nextRecord.issuerId !==
      existing.issuerId
  ) {
    throw new Error(
      "FINORA Control Center key-vault replacement cannot change issuerId.",
    );
  }

  const existingRetainedSigningKeys =
    existing.retainedSigningKeys ??
    [];

  const nextRetainedSigningKeys =
    nextRecord.retainedSigningKeys ??
    [];

  // ----------------------------------------------------------
  // EXISTING RETAINED HISTORY IS IMMUTABLE
  //
  // Normal key replacement may never silently:
  // - remove an older retained key,
  // - replace its key material,
  // - alter its creation timestamp,
  // - alter its retirement timestamp.
  //
  // Explicit historical-key destruction, if ever supported,
  // requires a separate lifecycle authority.
  // ----------------------------------------------------------

  for (
    const existingRetainedKey of
      existingRetainedSigningKeys
  ) {
    const preserved =
      nextRetainedSigningKeys.find(
        (key) =>
          key.signingKeyId ===
            existingRetainedKey.signingKeyId,
      );

    if (
      preserved ===
        undefined ||
      preserved.privateKeyPkcs8DerBase64 !==
        existingRetainedKey.privateKeyPkcs8DerBase64 ||
      preserved.publicKeySpkiDerBase64 !==
        existingRetainedKey.publicKeySpkiDerBase64 ||
      preserved.createdAt !==
        existingRetainedKey.createdAt ||
      preserved.retiredAt !==
        existingRetainedKey.retiredAt
    ) {
      throw new Error(
        "FINORA Control Center key-vault replacement cannot remove or modify existing retained signing history.",
      );
    }
  }

  const newlyRetainedSigningKeys =
    nextRetainedSigningKeys.filter(
      (nextRetainedKey) =>
        !existingRetainedSigningKeys.some(
          (existingRetainedKey) =>
            existingRetainedKey.signingKeyId ===
              nextRetainedKey.signingKeyId,
        ),
    );

  // ----------------------------------------------------------
  // SAME CURRENT KEY = NO SIGNING MATERIAL MUTATION
  // ----------------------------------------------------------

  if (
    nextRecord.signingKeyId ===
      existing.signingKeyId
  ) {
    if (
      nextRecord.privateKeyPkcs8DerBase64 !==
        existing.privateKeyPkcs8DerBase64 ||
      nextRecord.publicKeySpkiDerBase64 !==
        existing.publicKeySpkiDerBase64 ||
      nextRecord.createdAt !==
        existing.createdAt
    ) {
      throw new Error(
        "FINORA Control Center current signing material is immutable unless the signing key is rotated.",
      );
    }

    if (
      newlyRetainedSigningKeys.length !==
        0
    ) {
      throw new Error(
        "FINORA Control Center key-vault replacement cannot inject retained signing material without rotating the current key.",
      );
    }
  } else {
    // --------------------------------------------------------
    // CURRENT KEY CHANGED
    //
    // Exactly one new retained entry is permitted:
    // the immediately previous current signing key.
    // --------------------------------------------------------

    if (
      newlyRetainedSigningKeys.length !==
        1
    ) {
      throw new Error(
        "FINORA Control Center key rotation must retain exactly the immediately previous current signing key.",
      );
    }

    const retainedPrevious =
      newlyRetainedSigningKeys[0];

    if (
      retainedPrevious.signingKeyId !==
        existing.signingKeyId ||
      retainedPrevious.privateKeyPkcs8DerBase64 !==
        existing.privateKeyPkcs8DerBase64 ||
      retainedPrevious.publicKeySpkiDerBase64 !==
        existing.publicKeySpkiDerBase64 ||
      retainedPrevious.createdAt !==
        existing.createdAt
    ) {
      throw new Error(
        "FINORA Control Center key rotation must retain the exact previous current signing material.",
      );
    }
  }

  await writeVault(
    nextRecord,
  );

  const persisted =
    await readVault();

  if (
    persisted ===
      undefined ||
    persisted.issuerId !==
      nextRecord.issuerId ||
    persisted.signingKeyId !==
      nextRecord.signingKeyId ||
    persisted.privateKeyPkcs8DerBase64 !==
      nextRecord.privateKeyPkcs8DerBase64 ||
    persisted.publicKeySpkiDerBase64 !==
      nextRecord.publicKeySpkiDerBase64 ||
    persisted.createdAt !==
      nextRecord.createdAt ||
    JSON.stringify(
      persisted.retainedSigningKeys ??
        [],
    ) !==
      JSON.stringify(
        nextRecord.retainedSigningKeys ??
          [],
      )
  ) {
    throw new Error(
      "FINORA Control Center key-vault replacement read-back verification failed.",
    );
  }
}

let controlCenterKeyVaultReplacementQueue:
  Promise<void> =
    Promise.resolve();

export function replaceFinoraControlCenterKeyVault(
  nextRecord:
    FinoraControlCenterKeyVaultRecord,
): Promise<void> {
  const snapshot:
    FinoraControlCenterKeyVaultRecord = {
      ...nextRecord,

      ...(
        nextRecord.retainedSigningKeys ===
          undefined
          ? {}
          : {
              retainedSigningKeys:
                nextRecord.retainedSigningKeys.map(
                  (key) => ({
                    ...key,
                  }),
                ),
            }
      ),
  };

  const operation =
    controlCenterKeyVaultReplacementQueue.then(
      () =>
        replaceFinoraControlCenterKeyVaultInternal(
          snapshot,
        ),
      () =>
        replaceFinoraControlCenterKeyVaultInternal(
          snapshot,
        ),
    );

  controlCenterKeyVaultReplacementQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
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