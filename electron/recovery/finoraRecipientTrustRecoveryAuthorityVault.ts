// ============================================================
// FINORA ENTERPRISE OS™
//
// RECIPIENT TRUST RECOVERY AUTHORITY PRIVATE-KEY VAULT
//
// MODULE  : Offline Recovery Authority
// LAYER   : Privileged Native Persistence
// VERSION : 1.0
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Own the independent Recipient Trust Recovery private key
// - Generate one P-256 Recovery Authority identity on first use
// - Encrypt complete private authority state with safeStorage
// - Validate keypair, signingKeyId and public-key fingerprint
// - Refuse corrupt persisted authority state
// - Keep the Recovery root separate from the operational
//   FINORA Control Center signing-key vault
//
// SECURITY:
//
// - Offline / privileged Electron main process only.
// - No renderer exposure.
// - No IPC.
// - No preload.
// - No Recipient Trust Store access.
// - No operational Control Center key-vault access.
// - No Control Center key rotation.
// - No Recovery-root replacement API.
// - No plaintext private-key fallback.
//
// IMPORTANT:
//
// The shared Control Center crypto module is reused only for its
// pure Node P-256 key-generation / keypair-validation primitive.
// The operational Control Center vault, issuer, key-authority
// queue and rotation authority are not used.
//
// safeStorage protects confidentiality at rest. This store does
// not claim resistance to arbitrary same-user/OS compromise,
// replacement with a historical valid encrypted vault, cross-
// process CAS, or fsync/power-loss durability.
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
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
  generateFinoraControlCenterSigningMaterial,
  validateFinoraControlCenterSigningMaterial,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
} from "../control/finoraInstallationBindingCrypto.js";

// ============================================================
// CONSTANTS
// ============================================================

const RECOVERY_AUTHORITY_VAULT_SCHEMA_VERSION =
  1 as const;

const RECOVERY_AUTHORITY_DIRECTORY =
  "finora";

const RECOVERY_AUTHORITY_SUBDIRECTORY =
  "recovery";

const RECOVERY_AUTHORITY_VAULT_FILE =
  "finora-recipient-trust-recovery-authority-vault.bin";

// ============================================================
// VAULT RECORD
// ============================================================

export interface FinoraRecipientTrustRecoveryAuthorityVaultRecord {
  schemaVersion:
    typeof RECOVERY_AUTHORITY_VAULT_SCHEMA_VERSION;

  type:
    "FINORA_RECOVERY_AUTHORITY";

  recoveryAuthorityId:
    string;

  signingKeyId:
    string;

  algorithm:
    "ECDSA_P256_SHA256";

  privateKeyFormat:
    "PKCS8_DER_BASE64";

  privateKeyPkcs8DerBase64:
    string;

  publicKeyFormat:
    "SPKI_DER_BASE64";

  publicKeySpkiDerBase64:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  createdAt:
    string;
}

// ============================================================
// BASIC HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is
  Record<
    string,
    unknown
  > {
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

function hasOnlyKeys(
  value:
    Record<
      string,
      unknown
    >,
  expectedKeys:
    readonly string[],
): boolean {
  const actualKeys =
    Object.keys(
      value,
    );

  if (
    actualKeys.length !==
      expectedKeys.length
  ) {
    return false;
  }

  const expected =
    new Set(
      expectedKeys,
    );

  return actualKeys.every(
    (key) =>
      expected.has(
        key,
      ),
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is
  string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isCanonicalIsoTimestamp(
  value:
    unknown,
): value is
  string {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const milliseconds =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      milliseconds,
    ) &&
    new Date(
      milliseconds,
    ).toISOString() ===
      value
  );
}

function isCanonicalBase64(
  value:
    unknown,
): value is
  string {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    value.length %
      4 !==
      0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(
      value,
    )
  ) {
    return false;
  }

  try {
    return (
      Buffer.from(
        value,
        "base64",
      ).toString(
        "base64",
      ) ===
        value
    );
  } catch {
    return false;
  }
}

function isCanonicalFingerprint(
  value:
    unknown,
): value is
  string {
  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

function isCanonicalSigningKeyId(
  value:
    unknown,
): value is
  string {
  return (
    typeof value ===
      "string" &&
    /^FINORA-KEY-[0-9A-F]{24}$/.test(
      value,
    )
  );
}

function isCanonicalRecoveryAuthorityId(
  value:
    unknown,
): value is
  string {
  return (
    typeof value ===
      "string" &&
    /^FINORA-RECOVERY-AUTHORITY-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(
      value,
    )
  );
}

// ============================================================
// STRICT VAULT VALIDATION
// ============================================================

export function validateFinoraRecipientTrustRecoveryAuthorityVaultRecord(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoveryAuthorityVaultRecord {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "schemaVersion",
        "type",
        "recoveryAuthorityId",
        "signingKeyId",
        "algorithm",
        "privateKeyFormat",
        "privateKeyPkcs8DerBase64",
        "publicKeyFormat",
        "publicKeySpkiDerBase64",
        "fingerprintAlgorithm",
        "publicKeyFingerprint",
        "createdAt",
      ],
    ) ||
    value.schemaVersion !==
      RECOVERY_AUTHORITY_VAULT_SCHEMA_VERSION ||
    value.type !==
      "FINORA_RECOVERY_AUTHORITY" ||
    !isCanonicalRecoveryAuthorityId(
      value.recoveryAuthorityId,
    ) ||
    !isCanonicalSigningKeyId(
      value.signingKeyId,
    ) ||
    value.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.privateKeyFormat !==
      "PKCS8_DER_BASE64" ||
    !isCanonicalBase64(
      value.privateKeyPkcs8DerBase64,
    ) ||
    value.publicKeyFormat !==
      "SPKI_DER_BASE64" ||
    !isCanonicalBase64(
      value.publicKeySpkiDerBase64,
    ) ||
    value.fingerprintAlgorithm !==
      "SHA-256" ||
    !isCanonicalFingerprint(
      value.publicKeyFingerprint,
    ) ||
    !isCanonicalIsoTimestamp(
      value.createdAt,
    )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority vault structure is invalid.",
    );
  }

  try {
    assertFinoraP256SpkiPublicKey(
      value.publicKeySpkiDerBase64,
    );
  } catch (
    error
  ) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "FINORA Recovery Authority public key is not a valid P-256 SPKI key.",
    );
  }

  const validKeyPair =
    validateFinoraControlCenterSigningMaterial({
      signingKeyId:
        value.signingKeyId,

      privateKeyPkcs8DerBase64:
        value.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        value.publicKeySpkiDerBase64,
    });

  if (
    !validKeyPair
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority vault contains an invalid P-256 private/public keypair.",
    );
  }

  const actualFingerprint =
    createFinoraInstallationBindingFingerprint(
      value.publicKeySpkiDerBase64,
    );

  if (
    actualFingerprint !==
      value.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority public-key fingerprint does not match its public key.",
    );
  }

  const expectedSigningKeyId =
    createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
      actualFingerprint,
    );

  if (
    expectedSigningKeyId !==
      value.signingKeyId
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority signingKeyId does not match its public key.",
    );
  }
}

// ============================================================
// PATH
// ============================================================

function getRecoveryAuthorityVaultPath():
  string {
  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority vault cannot be used before Electron is ready.",
    );
  }

  return path.join(
    app.getPath(
      "userData",
    ),
    RECOVERY_AUTHORITY_DIRECTORY,
    RECOVERY_AUTHORITY_SUBDIRECTORY,
    RECOVERY_AUTHORITY_VAULT_FILE,
  );
}

// ============================================================
// SECURE STORAGE
// ============================================================

function assertSafeStorageAvailable():
  void {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure storage is unavailable for the Recipient Trust Recovery Authority private-key vault.",
    );
  }
}

// ============================================================
// READ
// ============================================================

async function readRecoveryAuthorityVault():
  Promise<
    FinoraRecipientTrustRecoveryAuthorityVaultRecord |
    undefined
  > {
  const vaultPath =
    getRecoveryAuthorityVaultPath();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await fs.readFile(
        vaultPath,
      );
  } catch (
    error
  ) {
    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (
      code ===
        "ENOENT"
    ) {
      return undefined;
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA Recipient Trust Recovery Authority vault.",
    );
  }

  assertSafeStorageAvailable();

  let plaintext:
    string;

  try {
    plaintext =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority vault cannot be decrypted.",
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
      "FINORA Recipient Trust Recovery Authority vault contains invalid JSON.",
    );
  }

  validateFinoraRecipientTrustRecoveryAuthorityVaultRecord(
    parsed,
  );

  return parsed;
}

// ============================================================
// PERSIST NEW — IMMUTABLE FIRST PROVISIONING
// ============================================================

async function persistNewRecoveryAuthorityVault(
  record:
    FinoraRecipientTrustRecoveryAuthorityVaultRecord,
): Promise<void> {
  validateFinoraRecipientTrustRecoveryAuthorityVaultRecord(
    record,
  );

  assertSafeStorageAvailable();

  const existing =
    await readRecoveryAuthorityVault();

  if (
    existing
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority vault is already provisioned.",
    );
  }

  const vaultPath =
    getRecoveryAuthorityVaultPath();

  const vaultDirectory =
    path.dirname(
      vaultPath,
    );

  await fs.mkdir(
    vaultDirectory,
    {
      recursive:
        true,

      mode:
        0o700,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        record,
      ),
    );

  const temporaryPath =
    `${vaultPath}.${process.pid}.${randomUUID()}.tmp`;

  let temporaryCreated =
    false;

  try {
    await fs.writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",

        mode:
          0o600,
      },
    );

    temporaryCreated =
      true;

    await fs.rename(
      temporaryPath,
      vaultPath,
    );

    temporaryCreated =
      false;
  } finally {
    if (
      temporaryCreated
    ) {
      try {
        await fs.rm(
          temporaryPath,
          {
            force:
              true,
          },
        );
      } catch {
        // Best-effort cleanup only.
      }
    }
  }
}

// ============================================================
// PUBLIC LOAD
// ============================================================

export async function loadFinoraRecipientTrustRecoveryAuthorityVault():
  Promise<
    FinoraRecipientTrustRecoveryAuthorityVaultRecord |
    undefined
  > {
  return readRecoveryAuthorityVault();
}

// ============================================================
// LOAD OR CREATE
//
// Same-process promise serialization prevents concurrent callers
// from independently creating different Recovery roots.
// No cross-process CAS claim is made.
// ============================================================

let recoveryAuthorityVaultLoadPromise:
  Promise<
    FinoraRecipientTrustRecoveryAuthorityVaultRecord
  > |
  undefined;

async function loadOrCreateRecoveryAuthorityVaultInternal():
  Promise<
    FinoraRecipientTrustRecoveryAuthorityVaultRecord
  > {
  const existing =
    await readRecoveryAuthorityVault();

  if (
    existing
  ) {
    return existing;
  }

  assertSafeStorageAvailable();

  const material =
    generateFinoraControlCenterSigningMaterial();

  if (
    !validateFinoraControlCenterSigningMaterial(
      material,
    )
  ) {
    throw new Error(
      "FINORA generated invalid Recipient Trust Recovery Authority signing material.",
    );
  }

  const publicKeyFingerprint =
    createFinoraInstallationBindingFingerprint(
      material.publicKeySpkiDerBase64,
    );

  const canonicalSigningKeyId =
    createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
      publicKeyFingerprint,
    );

  if (
    material.signingKeyId !==
      canonicalSigningKeyId
  ) {
    throw new Error(
      "FINORA generated Recovery Authority signingKeyId is not canonical for its public key.",
    );
  }

  const createdAt =
    new Date().toISOString();

  const record:
    FinoraRecipientTrustRecoveryAuthorityVaultRecord = {
      schemaVersion:
        RECOVERY_AUTHORITY_VAULT_SCHEMA_VERSION,

      type:
        "FINORA_RECOVERY_AUTHORITY",

      recoveryAuthorityId:
        `FINORA-RECOVERY-AUTHORITY-${randomUUID().toUpperCase()}`,

      signingKeyId:
        canonicalSigningKeyId,

      algorithm:
        "ECDSA_P256_SHA256",

      privateKeyFormat:
        "PKCS8_DER_BASE64",

      privateKeyPkcs8DerBase64:
        material.privateKeyPkcs8DerBase64,

      publicKeyFormat:
        "SPKI_DER_BASE64",

      publicKeySpkiDerBase64:
        material.publicKeySpkiDerBase64,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint,

      createdAt,
    };

  validateFinoraRecipientTrustRecoveryAuthorityVaultRecord(
    record,
  );

  await persistNewRecoveryAuthorityVault(
    record,
  );

  const persisted =
    await readRecoveryAuthorityVault();

  if (
    !persisted ||
    JSON.stringify(
      persisted,
    ) !==
      JSON.stringify(
        record,
      )
  ) {
    throw new Error(
      "FINORA Recipient Trust Recovery Authority vault read-back verification failed.",
    );
  }

  return persisted;
}

export function loadOrCreateFinoraRecipientTrustRecoveryAuthorityVault():
  Promise<
    FinoraRecipientTrustRecoveryAuthorityVaultRecord
  > {
  if (
    recoveryAuthorityVaultLoadPromise
  ) {
    return recoveryAuthorityVaultLoadPromise;
  }

  const pending =
    loadOrCreateRecoveryAuthorityVaultInternal();

  recoveryAuthorityVaultLoadPromise =
    pending;

  void pending.finally(
    () => {
      if (
        recoveryAuthorityVaultLoadPromise ===
          pending
      ) {
        recoveryAuthorityVaultLoadPromise =
          undefined;
      }
    },
  );

  return pending;
}

// ============================================================
// END
// ============================================================