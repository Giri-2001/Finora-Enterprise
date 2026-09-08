/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST RECOVERY AUTHORITY STORE

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist one independently provisioned recovery authority
   - Bind that authority to one native FINORA installation
   - Persist public recovery signing material only
   - Validate canonical recovery public-key identity
   - Protect the complete record with Electron safeStorage
   - Reject corrupt / undecryptable / invalid persisted state
   - Refuse normal replacement after first provisioning

   SECURITY:

   - Electron main only.
   - No IPC.
   - No preload.
   - No renderer.
   - No environment-variable provisioning.
   - No private recovery signing key.
   - No operational Control Center private key.
   - No trust-on-first-use from a recovery package.
   - No plaintext fallback.

   LIMITATIONS:

   - This store does not claim resistance to arbitrary replacement
     with a historical valid encrypted store file.
   - The existing filesystem publication pattern is not claimed
     as a cross-process compare-and-swap primitive.
   - No fsync / power-loss durability claim is made here.
=========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  constants as fsConstants,
} from "node:fs";

import {
  dirname,
  join,
} from "node:path";

import {
  randomUUID,
} from "node:crypto";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  assertFinoraP256SpkiPublicKey,
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  validateFinoraRecipientTrustRecoveryTarget,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

// ============================================================
// CONSTANTS
// ============================================================

const DIRECTORY_FINORA =
  "finora";

const DIRECTORY_CONTROL =
  "control";

const RECOVERY_AUTHORITY_STORE_FILE_NAME =
  "finora-recipient-trust-recovery-authority.bin";

const RECOVERY_AUTHORITY_STORE_SCHEMA_VERSION =
  1 as const;

// ============================================================
// TYPES
// ============================================================

export interface FinoraRecipientTrustRecoveryAuthorityPublicKey {
  type:
    "FINORA_RECOVERY_AUTHORITY";

  recoveryAuthorityId:
    string;

  signingKeyId:
    string;

  algorithm:
    "ECDSA_P256_SHA256";

  format:
    "SPKI_DER_BASE64";

  publicKey:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

export interface FinoraRecipientTrustRecoveryAuthorityStoreState {
  schemaVersion:
    typeof RECOVERY_AUTHORITY_STORE_SCHEMA_VERSION;

  installation:
    FinoraRecipientTrustTransitionTarget;

  authority:
    FinoraRecipientTrustRecoveryAuthorityPublicKey;

  provisionedAt:
    string;
}

// ============================================================
// BASIC HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<
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
    (
      key,
    ) =>
      expected.has(
        key,
      ),
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
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
): value is string {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const timestamp =
    Date.parse(
      value,
    );

  return (
    Number.isFinite(
      timestamp,
    ) &&
    new Date(
      timestamp,
    ).toISOString() ===
      value
  );
}

function isCanonicalSha256Fingerprint(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

// ============================================================
// VALIDATION
// ============================================================

export function validateFinoraRecipientTrustRecoveryAuthorityStoreState(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustRecoveryAuthorityStoreState {
  if (
    !isRecord(
      value,
    ) ||
    !hasOnlyKeys(
      value,
      [
        "schemaVersion",
        "installation",
        "authority",
        "provisionedAt",
      ],
    ) ||
    value.schemaVersion !==
      RECOVERY_AUTHORITY_STORE_SCHEMA_VERSION ||
    !isCanonicalIsoTimestamp(
      value.provisionedAt,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority store structure is invalid.",
    );
  }

  try {
    validateFinoraRecipientTrustRecoveryTarget(
      value.installation,
    );
  } catch {
    throw new Error(
      "FINORA recipient trust recovery-authority installation binding is invalid.",
    );
  }

  const authority =
    value.authority;

  if (
    !isRecord(
      authority,
    ) ||
    !hasOnlyKeys(
      authority,
      [
        "type",
        "recoveryAuthorityId",
        "signingKeyId",
        "algorithm",
        "format",
        "publicKey",
        "fingerprintAlgorithm",
        "publicKeyFingerprint",
      ],
    ) ||
    authority.type !==
      "FINORA_RECOVERY_AUTHORITY" ||
    !isNonEmptyString(
      authority.recoveryAuthorityId,
    ) ||
    !isNonEmptyString(
      authority.signingKeyId,
    ) ||
    authority.algorithm !==
      "ECDSA_P256_SHA256" ||
    authority.format !==
      "SPKI_DER_BASE64" ||
    !isNonEmptyString(
      authority.publicKey,
    ) ||
    authority.fingerprintAlgorithm !==
      "SHA-256" ||
    !isCanonicalSha256Fingerprint(
      authority.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority public-key record is invalid.",
    );
  }

  try {
    assertFinoraP256SpkiPublicKey(
      authority.publicKey,
    );
  } catch (
    error
  ) {
    throw new Error(
      error instanceof Error
        ? `FINORA recipient trust recovery-authority public key is invalid: ${error.message}`
        : "FINORA recipient trust recovery-authority public key is invalid.",
    );
  }

  const actualFingerprint =
    createFinoraInstallationBindingFingerprint(
      authority.publicKey,
    );

  if (
    actualFingerprint !==
      authority.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority public-key fingerprint does not match its public key.",
    );
  }

  const expectedSigningKeyId =
    createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
      actualFingerprint,
    );

  if (
    authority.signingKeyId !==
      expectedSigningKeyId
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority signingKeyId does not match its public key.",
    );
  }
}

// ============================================================
// PATH
// ============================================================

function getFinoraRecipientTrustRecoveryAuthorityStorePath():
  string {
  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    RECOVERY_AUTHORITY_STORE_FILE_NAME,
  );
}

// ============================================================
// FILE EXISTS
// ============================================================

async function fileExists(
  path:
    string,
): Promise<boolean> {
  try {
    await access(
      path,
      fsConstants.F_OK,
    );

    return true;
  } catch (
    error
  ) {
    const code =
      (
        error as NodeJS.ErrnoException
      ).code;

    if (
      code ===
        "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

// ============================================================
// SAFE STORAGE
// ============================================================

function assertSafeStorageAvailable():
  void {
  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority storage is unavailable before Electron app readiness.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure recipient trust recovery-authority storage is unavailable on this installation.",
    );
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadFinoraRecipientTrustRecoveryAuthorityStore():
  Promise<
    FinoraRecipientTrustRecoveryAuthorityStoreState |
    undefined
  > {
  const storePath =
    getFinoraRecipientTrustRecoveryAuthorityStorePath();

  if (
    !await fileExists(
      storePath,
    )
  ) {
    return undefined;
  }

  assertSafeStorageAvailable();

  const encrypted =
    await readFile(
      storePath,
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority store is empty.",
    );
  }

  let decrypted:
    string;

  try {
    decrypted =
      safeStorage.decryptString(
        encrypted,
      );
  } catch {
    throw new Error(
      "FINORA recipient trust recovery-authority store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority store decrypted to an empty payload.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        decrypted,
      );
  } catch {
    throw new Error(
      "FINORA recipient trust recovery-authority store contains invalid JSON.",
    );
  }

  validateFinoraRecipientTrustRecoveryAuthorityStoreState(
    parsed,
  );

  return parsed;
}

// ============================================================
// PERSIST NEW FIRST-PROVISIONED AUTHORITY
// ============================================================

export async function persistNewFinoraRecipientTrustRecoveryAuthorityStore(
  state:
    FinoraRecipientTrustRecoveryAuthorityStoreState,
): Promise<void> {
  validateFinoraRecipientTrustRecoveryAuthorityStoreState(
    state,
  );

  assertSafeStorageAvailable();

  const storePath =
    getFinoraRecipientTrustRecoveryAuthorityStorePath();

  if (
    await fileExists(
      storePath,
    )
  ) {
    throw new Error(
      "FINORA recipient trust recovery authority is already provisioned and cannot be replaced through initial provisioning.",
    );
  }

  const parentDirectory =
    dirname(
      storePath,
    );

  await mkdir(
    parentDirectory,
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
        state,
      ),
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust recovery-authority encryption returned an empty payload.",
    );
  }

  const temporaryPath =
    `${storePath}.${randomUUID()}.tmp`;

  try {
    await writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",

        mode:
          0o600,
      },
    );

    await rename(
      temporaryPath,
      storePath,
    );
  } catch (
    error
  ) {
    await rm(
      temporaryPath,
      {
        force:
          true,
      },
    );

    throw error;
  }
}

// ============================================================
// END
// ============================================================