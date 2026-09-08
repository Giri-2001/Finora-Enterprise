/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT CONTROL TRUST STORE

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist recipient-authoritative Control Center public trust
   - Protect trust records with Electron safeStorage
   - Validate trusted signing-key structure before persistence
   - Validate trusted signing-key structure after decryption
   - Atomically replace the complete trusted-key state
   - Fail closed on corrupt / malformed / undecryptable state

   SECURITY:

   - Electron main process only.
   - No IPC.
   - No preload.
   - No renderer.
   - No plaintext trust-store persistence.
   - No trust-on-first-use from .finora packages.
   - No package may introduce its own trusted signing key.
   - Installation binding keys are NOT Control Center trust keys.

   AUTHORITY:

   This module is only the native persistence boundary.

   Bootstrap, rotation, retirement and revocation authorization
   are separate Phase 14 policy/service responsibilities.

   IMPORTANT:

   Missing trust-store file means the recipient trust authority
   has not yet been bootstrapped.

   It must not be interpreted as an automatically trusted or
   automatically initialized Control Center identity.
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
  createPublicKey,
  randomUUID,
} from "node:crypto";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// CONSTANTS
// ============================================================

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL =
  "control";

const TRUST_STORE_FILE_NAME =
  "finora-recipient-trust.bin";

// ============================================================
// STORE CONTRACT
// ============================================================

export interface FinoraRecipientTrustAppliedTransitionRecord {
  packageId:
    string;

  issuerId:
    string;

  purpose:
    "RECIPIENT_TRUST_TRANSITION";

  sequence:
    number;

  installationId:
    string;

  appliedAt:
    string;
}

export interface FinoraRecipientTrustTransitionSequenceState {
  issuerId:
    string;

  purpose:
    "RECIPIENT_TRUST_TRANSITION";

  installationId:
    string;

  lastSequence:
    number;

  updatedAt:
    string;
}

export interface FinoraRecipientTrustAppliedRecoveryRecord {
  packageId:
    string;

  recoveryAuthorityId:
    string;

  purpose:
    "RECIPIENT_TRUST_RECOVERY";

  sequence:
    number;

  installationId:
    string;

  operationalIssuerId:
    string;

  appliedAt:
    string;
}

export interface FinoraRecipientTrustRecoverySequenceState {
  recoveryAuthorityId:
    string;

  purpose:
    "RECIPIENT_TRUST_RECOVERY";

  installationId:
    string;

  operationalIssuerId:
    string;

  lastSequence:
    number;

  updatedAt:
    string;
}

export interface FinoraRecipientTrustStoreState {
  schemaVersion:
    1;

  trustedKeys:
    FinoraBranchTrustedControlPublicKey[];

  /**
   * Cryptographically verified recipient trust-transition
   * package IDs already applied.
   *
   * Optional for backward compatibility with trust stores
   * created by first-trust bootstrap before transition
   * replay metadata existed.
   */
  appliedTrustTransitions?:
    FinoraRecipientTrustAppliedTransitionRecord[];

  /**
   * Highest accepted trust-transition sequence per:
   *
   * issuerId + purpose + installationId
   *
   * Optional for backward compatibility with bootstrap-only
   * recipient trust stores.
   */
  trustTransitionSequences?:
    FinoraRecipientTrustTransitionSequenceState[];

  /**
   * Cryptographically verified emergency recipient-trust
   * recovery package IDs already applied.
   *
   * Kept separate from normal trust-transition replay metadata.
   *
   * Optional for backward compatibility with recipient trust
   * stores created before emergency recovery support existed.
   */
  appliedTrustRecoveries?:
    FinoraRecipientTrustAppliedRecoveryRecord[];

  /**
   * Highest accepted emergency recovery sequence per:
   *
   * recoveryAuthorityId
   * + RECIPIENT_TRUST_RECOVERY
   * + installationId
   * + operationalIssuerId
   *
   * Optional for backward compatibility with older stores.
   */
  trustRecoverySequences?:
    FinoraRecipientTrustRecoverySequenceState[];
}

// ============================================================
// BASIC HELPERS
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
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

function parseCanonicalIsoTimestamp(
  value:
    unknown,
): number | undefined {
  if (
    !isNonEmptyString(
      value,
    )
  ) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return undefined;
  }

  if (
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    return undefined;
  }

  return parsed;
}

function decodeStrictBase64(
  value:
    string,
): Buffer {
  if (
    value.length ===
      0 ||
    value.length %
      4 !==
      0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "FINORA trusted signing public key is not canonical base64.",
    );
  }

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.length ===
      0 ||
    decoded.toString(
      "base64",
    ) !==
      value
  ) {
    throw new Error(
      "FINORA trusted signing public key is invalid base64.",
    );
  }

  return decoded;
}

// ============================================================
// TRUSTED KEY VALIDATION
// ============================================================

function validateTrustedKey(
  value:
    unknown,
): asserts value is
  FinoraBranchTrustedControlPublicKey {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust store contains an invalid trusted-key record.",
    );
  }

  if (
    !isNonEmptyString(
      value.issuerId,
    ) ||
    !isNonEmptyString(
      value.signingKeyId,
    )
  ) {
    throw new Error(
      "FINORA recipient trusted-key identity is incomplete.",
    );
  }

  if (
    value.algorithm !==
      "ECDSA_P256_SHA256" ||
    value.format !==
      "SPKI_DER_BASE64"
  ) {
    throw new Error(
      "FINORA recipient trusted-key cryptographic contract is unsupported.",
    );
  }

  if (
    value.status !==
      "ACTIVE" &&
    value.status !==
      "RETIRED" &&
    value.status !==
      "REVOKED"
  ) {
    throw new Error(
      "FINORA recipient trusted-key status is invalid.",
    );
  }

  const validFrom =
    parseCanonicalIsoTimestamp(
      value.validFrom,
    );

  if (
    validFrom ===
      undefined
  ) {
    throw new Error(
      "FINORA recipient trusted-key validFrom timestamp is invalid.",
    );
  }

  let validUntil:
    number | undefined;

  if (
    value.validUntil !==
      undefined
  ) {
    validUntil =
      parseCanonicalIsoTimestamp(
        value.validUntil,
      );

    if (
      validUntil ===
        undefined
    ) {
      throw new Error(
        "FINORA recipient trusted-key validUntil timestamp is invalid.",
      );
    }

    /*
     * The existing signed-package verifier intentionally treats
     * key validUntil as an inclusive issuance boundary:
     *
     * issuedAt === validUntil
     * remains historically valid.
     *
     * Preserve that contract here.
     */
    if (
      validUntil <
        validFrom
    ) {
      throw new Error(
        "FINORA recipient trusted-key validity window is invalid.",
      );
    }
  }

  if (
    value.status ===
      "RETIRED" &&
    validUntil ===
      undefined
  ) {
    throw new Error(
      "FINORA retired recipient signing key requires validUntil.",
    );
  }

  if (
    !isNonEmptyString(
      value.publicKey,
    )
  ) {
    throw new Error(
      "FINORA recipient trusted signing public key is missing.",
    );
  }

  const publicKeyDer =
    decodeStrictBase64(
      value.publicKey,
    );

  let publicKey:
    ReturnType<
      typeof createPublicKey
    >;

  try {
    publicKey =
      createPublicKey({
        key:
          publicKeyDer,

        format:
          "der",

        type:
          "spki",
      });
  } catch {
    throw new Error(
      "FINORA recipient trusted signing public key is invalid SPKI DER.",
    );
  }

  if (
    publicKey.asymmetricKeyType !==
      "ec"
  ) {
    throw new Error(
      "FINORA recipient trusted signing key must be an EC public key.",
    );
  }

  const details =
    publicKey.asymmetricKeyDetails;

  if (
    !details ||
    details.namedCurve !==
      "prime256v1"
  ) {
    throw new Error(
      "FINORA recipient trusted signing key must use the P-256 curve.",
    );
  }
}

// ============================================================
// TRUST TRANSITION REPLAY METADATA VALIDATION
// ============================================================

function isAppliedTrustTransitionRecord(
  value:
    unknown,
): value is
  FinoraRecipientTrustAppliedTransitionRecord {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "appliedAt",
      "installationId",
      "issuerId",
      "packageId",
      "purpose",
      "sequence",
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
    isNonEmptyString(
      value.packageId,
    ) &&
    isNonEmptyString(
      value.issuerId,
    ) &&
    value.purpose ===
      "RECIPIENT_TRUST_TRANSITION" &&
    Number.isSafeInteger(
      value.sequence,
    ) &&
    (
      value.sequence as number
    ) >
      0 &&
    isNonEmptyString(
      value.installationId,
    ) &&
    parseCanonicalIsoTimestamp(
      value.appliedAt,
    ) !==
      undefined
  );
}

function isTrustTransitionSequenceState(
  value:
    unknown,
): value is
  FinoraRecipientTrustTransitionSequenceState {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "installationId",
      "issuerId",
      "lastSequence",
      "purpose",
      "updatedAt",
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
    isNonEmptyString(
      value.issuerId,
    ) &&
    value.purpose ===
      "RECIPIENT_TRUST_TRANSITION" &&
    isNonEmptyString(
      value.installationId,
    ) &&
    Number.isSafeInteger(
      value.lastSequence,
    ) &&
    (
      value.lastSequence as number
    ) >
      0 &&
    parseCanonicalIsoTimestamp(
      value.updatedAt,
    ) !==
      undefined
  );
}

// ============================================================
// TRUST RECOVERY REPLAY METADATA VALIDATION
// ============================================================

function isAppliedTrustRecoveryRecord(
  value:
    unknown,
): value is
  FinoraRecipientTrustAppliedRecoveryRecord {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "appliedAt",
      "installationId",
      "operationalIssuerId",
      "packageId",
      "purpose",
      "recoveryAuthorityId",
      "sequence",
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
    isNonEmptyString(
      value.packageId,
    ) &&
    isNonEmptyString(
      value.recoveryAuthorityId,
    ) &&
    value.purpose ===
      "RECIPIENT_TRUST_RECOVERY" &&
    Number.isSafeInteger(
      value.sequence,
    ) &&
    (
      value.sequence as number
    ) >
      0 &&
    isNonEmptyString(
      value.installationId,
    ) &&
    isNonEmptyString(
      value.operationalIssuerId,
    ) &&
    parseCanonicalIsoTimestamp(
      value.appliedAt,
    ) !==
      undefined
  );
}

function isTrustRecoverySequenceState(
  value:
    unknown,
): value is
  FinoraRecipientTrustRecoverySequenceState {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "installationId",
      "lastSequence",
      "operationalIssuerId",
      "purpose",
      "recoveryAuthorityId",
      "updatedAt",
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
    isNonEmptyString(
      value.recoveryAuthorityId,
    ) &&
    value.purpose ===
      "RECIPIENT_TRUST_RECOVERY" &&
    isNonEmptyString(
      value.installationId,
    ) &&
    isNonEmptyString(
      value.operationalIssuerId,
    ) &&
    Number.isSafeInteger(
      value.lastSequence,
    ) &&
    (
      value.lastSequence as number
    ) >
      0 &&
    parseCanonicalIsoTimestamp(
      value.updatedAt,
    ) !==
      undefined
  );
}

function hasDuplicateAppliedTrustTransitionPackageIds(
  records:
    readonly FinoraRecipientTrustAppliedTransitionRecord[],
): boolean {
  const packageIds =
    new Set<string>();

  for (
    const record of
      records
  ) {
    if (
      packageIds.has(
        record.packageId,
      )
    ) {
      return true;
    }

    packageIds.add(
      record.packageId,
    );
  }

  return false;
}

function hasDuplicateTrustTransitionSequenceScopes(
  records:
    readonly FinoraRecipientTrustTransitionSequenceState[],
): boolean {
  const scopes =
    new Set<string>();

  for (
    const record of
      records
  ) {
    const scope =
      JSON.stringify([
        record.issuerId,
        record.purpose,
        record.installationId,
      ]);

    if (
      scopes.has(
        scope,
      )
    ) {
      return true;
    }

    scopes.add(
      scope,
    );
  }

  return false;
}

function hasDuplicateAppliedTrustRecoveryPackageIds(
  records:
    readonly FinoraRecipientTrustAppliedRecoveryRecord[],
): boolean {
  const packageIds =
    new Set<string>();

  for (
    const record of
    records
  ) {
    if (
      packageIds.has(
        record.packageId,
      )
    ) {
      return true;
    }

    packageIds.add(
      record.packageId,
    );
  }

  return false;
}

function hasDuplicateTrustRecoverySequenceScopes(
  records:
    readonly FinoraRecipientTrustRecoverySequenceState[],
): boolean {
  const scopes =
    new Set<string>();

  for (
    const record of
    records
  ) {
    const scope =
      JSON.stringify([
        record.recoveryAuthorityId,
        record.purpose,
        record.installationId,
        record.operationalIssuerId,
      ]);

    if (
      scopes.has(
        scope,
      )
    ) {
      return true;
    }

    scopes.add(
      scope,
    );
  }

  return false;
}

// ============================================================
// COMPLETE STORE VALIDATION
// ============================================================

export function validateFinoraRecipientTrustStoreState(
  value:
    unknown,
): asserts value is
  FinoraRecipientTrustStoreState {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA recipient trust store structure is invalid.",
    );
  }

  if (
    value.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA recipient trust store schema is unsupported.",
    );
  }

  if (
    !Array.isArray(
      value.trustedKeys,
    )
  ) {
    throw new Error(
      "FINORA recipient trust store trustedKeys collection is invalid.",
    );
  }

  if (
    value.trustedKeys.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust store must contain at least one trusted signing key.",
    );
  }

  const identities =
    new Set<string>();

  const activeIssuerIds =
    new Set<string>();

  for (
    const trustedKey of
      value.trustedKeys
  ) {
    validateTrustedKey(
      trustedKey,
    );

    const identity =
      JSON.stringify([
        trustedKey.issuerId,
        trustedKey.signingKeyId,
      ]);

    if (
      identities.has(
        identity,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store contains a duplicate issuer/signing-key identity.",
      );
    }

    identities.add(
      identity,
    );

    // --------------------------------------------------------
    // SINGLE CURRENT ACTIVE AUTHORITY PER ISSUER
    //
    // Historical RETIRED / REVOKED keys may coexist.
    //
    // At most one ACTIVE signing key may represent current
    // recipient authority for a given issuer.
    // --------------------------------------------------------

    if (
      trustedKey.status ===
        "ACTIVE"
    ) {
      if (
        activeIssuerIds.has(
          trustedKey.issuerId,
        )
      ) {
        throw new Error(
          "FINORA recipient trust store contains more than one ACTIVE signing key for the same issuer.",
        );
      }

      activeIssuerIds.add(
        trustedKey.issuerId,
      );
    }
  }

  // ----------------------------------------------------------
  // APPLIED TRUST TRANSITION LEDGER
  // ----------------------------------------------------------

  if (
    value.appliedTrustTransitions !==
      undefined
  ) {
    if (
      !Array.isArray(
        value.appliedTrustTransitions,
      ) ||
      !value.appliedTrustTransitions.every(
        isAppliedTrustTransitionRecord,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store applied transition ledger is invalid.",
      );
    }

    if (
      hasDuplicateAppliedTrustTransitionPackageIds(
        value.appliedTrustTransitions,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store contains a duplicate applied transition packageId.",
      );
    }
  }

  // ----------------------------------------------------------
  // MONOTONIC TRUST TRANSITION SEQUENCES
  //
  // Scope:
  // issuerId + RECIPIENT_TRUST_TRANSITION + installationId
  // ----------------------------------------------------------

  if (
    value.trustTransitionSequences !==
      undefined
  ) {
    if (
      !Array.isArray(
        value.trustTransitionSequences,
      ) ||
      !value.trustTransitionSequences.every(
        isTrustTransitionSequenceState,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store transition sequence state is invalid.",
      );
    }

    if (
      hasDuplicateTrustTransitionSequenceScopes(
        value.trustTransitionSequences,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store contains a duplicate transition sequence scope.",
      );
    }
  }

  // ----------------------------------------------------------
  // APPLIED TRUST RECOVERY LEDGER
  // ----------------------------------------------------------

  if (
    value.appliedTrustRecoveries !==
      undefined
  ) {
    if (
      !Array.isArray(
        value.appliedTrustRecoveries,
      ) ||
      !value.appliedTrustRecoveries.every(
        isAppliedTrustRecoveryRecord,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store applied recovery ledger is invalid.",
      );
    }

    if (
      hasDuplicateAppliedTrustRecoveryPackageIds(
        value.appliedTrustRecoveries,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store contains a duplicate applied recovery packageId.",
      );
    }
  }

  // ----------------------------------------------------------
  // MONOTONIC TRUST RECOVERY SEQUENCES
  //
  // Scope:
  //
  // recoveryAuthorityId
  // + RECIPIENT_TRUST_RECOVERY
  // + installationId
  // + operationalIssuerId
  // ----------------------------------------------------------

  if (
    value.trustRecoverySequences !==
      undefined
  ) {
    if (
      !Array.isArray(
        value.trustRecoverySequences,
      ) ||
      !value.trustRecoverySequences.every(
        isTrustRecoverySequenceState,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store recovery sequence state is invalid.",
      );
    }

    if (
      hasDuplicateTrustRecoverySequenceScopes(
        value.trustRecoverySequences,
      )
    ) {
      throw new Error(
        "FINORA recipient trust store contains a duplicate recovery sequence scope.",
      );
    }
  }
}

// ============================================================
// PATH
// ============================================================

function getFinoraRecipientTrustStorePath():
  string {
  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    TRUST_STORE_FILE_NAME,
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
  } catch {
    return false;
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
      "FINORA recipient trust storage is unavailable before Electron app readiness.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure recipient trust storage is unavailable on this installation.",
    );
  }
}

// ============================================================
// LOAD
// ============================================================

export async function loadFinoraRecipientTrustStore():
  Promise<
    FinoraRecipientTrustStoreState |
    undefined
  > {
  const trustStorePath =
    getFinoraRecipientTrustStorePath();

  if (
    !await fileExists(
      trustStorePath,
    )
  ) {
    /*
     * Missing file means UNBOOTSTRAPPED.
     *
     * Do not synthesize an empty store and do not trust any
     * package-provided public key.
     */
    return undefined;
  }

  assertSafeStorageAvailable();

  const encrypted =
    await readFile(
      trustStorePath,
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust store is empty.",
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
      "FINORA recipient trust store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust store decrypted to an empty payload.",
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
      "FINORA recipient trust store contains invalid JSON.",
    );
  }

  validateFinoraRecipientTrustStoreState(
    parsed,
  );

  return parsed;
}

// ============================================================
// PERSIST COMPLETE VALIDATED STATE
//
// This is intentionally a low-level persistence primitive.
//
// It does NOT authorize:
// - first bootstrap
// - key rotation
// - retirement
// - revocation
//
// A separate main-process authority service must enforce those
// transitions before calling this function.
// ============================================================

export async function persistFinoraRecipientTrustStore(
  trustStore:
    FinoraRecipientTrustStoreState,
): Promise<void> {
  validateFinoraRecipientTrustStoreState(
    trustStore,
  );

  assertSafeStorageAvailable();

  const trustStorePath =
    getFinoraRecipientTrustStorePath();

  const parentDirectory =
    dirname(
      trustStorePath,
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
        trustStore,
      ),
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA recipient trust-store encryption returned an empty payload.",
    );
  }

  const temporaryPath =
    `${trustStorePath}.${randomUUID()}.tmp`;

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
      trustStorePath,
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