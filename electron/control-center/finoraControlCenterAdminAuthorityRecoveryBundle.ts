/* ============================================================
   FINORA ENTERPRISE OS
   CONTROL CENTER ADMIN AUTHORITY RECOVERY BUNDLE

   PURPOSE:

   Machine-independent encrypted recovery of the complete
   Control Center signing authority.

   The recovery bundle:
   - preserves issuerId,
   - preserves the current signing key,
   - preserves retained signing-key history,
   - is NOT bound to one laptop/device,
   - never uses Electron safeStorage for portable ciphertext,
   - is encrypted from the Admin Security Code,
   - can later be restored only through the fresh-machine
     bootstrap Key Vault authority.

   Changing the Admin Security Code MUST re-encrypt the same
   signing authority. It must NOT rotate issuerId/signingKeyId.

   No renderer / IPC / filesystem authority exists here.
============================================================ */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
} from "node:crypto";

import {
  validateFinoraControlCenterKeyVaultRecord,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterKeyVaultRecord,
} from "./finoraControlCenterKeyVault.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FORMAT =
  "FINORA_CONTROL_CENTER_ADMIN_AUTHORITY_RECOVERY" as const;

export const FINORA_CONTROL_CENTER_ADMIN_RECOVERY_SCHEMA_VERSION =
  1 as const;

const SCRYPT_N =
  32768;

const SCRYPT_R =
  8;

const SCRYPT_P =
  1;

const SCRYPT_SALT_BYTES =
  16;

const DERIVED_KEY_BYTES =
  32;

const AES_GCM_IV_BYTES =
  12;

const AES_GCM_TAG_BYTES =
  16;

const MAX_CIPHERTEXT_BYTES =
  512 * 1024;

export const FINORA_CONTROL_CENTER_ADMIN_SECURITY_CODE_MIN_LENGTH =
  12;

export const FINORA_CONTROL_CENTER_ADMIN_SECURITY_CODE_MAX_LENGTH =
  128;

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraControlCenterAdminRecoveryKdfV1 {
  algorithm:
    "SCRYPT";

  N:
    typeof SCRYPT_N;

  r:
    typeof SCRYPT_R;

  p:
    typeof SCRYPT_P;

  salt:
    string;

  derivedKeyBytes:
    typeof DERIVED_KEY_BYTES;
}

export interface FinoraControlCenterAdminRecoveryEncryptionV1 {
  algorithm:
    "AES-256-GCM";

  iv:
    string;

  authTag:
    string;
}

export interface FinoraControlCenterAdminAuthorityRecoveryBundleV1 {
  format:
    typeof FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FORMAT;

  schemaVersion:
    typeof FINORA_CONTROL_CENTER_ADMIN_RECOVERY_SCHEMA_VERSION;

  bundleId:
    string;

  issuerId:
    string;

  signingKeyId:
    string;

  createdAt:
    string;

  kdf:
    FinoraControlCenterAdminRecoveryKdfV1;

  encryption:
    FinoraControlCenterAdminRecoveryEncryptionV1;

  ciphertext:
    string;
}

// ============================================================
// ADMIN SECURITY CODE
// ============================================================

function assertAdminSecurityCode(
  value:
    string,
): void {
  if (
    typeof value !==
      "string"
  ) {
    throw new Error(
      "FINORA Control Center Admin Security Code is invalid.",
    );
  }

  const length =
    Array.from(
      value,
    ).length;

  if (
    length <
      FINORA_CONTROL_CENTER_ADMIN_SECURITY_CODE_MIN_LENGTH ||
    length >
      FINORA_CONTROL_CENTER_ADMIN_SECURITY_CODE_MAX_LENGTH ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      "FINORA Control Center Admin Security Code is invalid.",
    );
  }
}

// ============================================================
// INTERNAL HELPERS
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

function decodeCanonicalBase64(
  value:
    unknown,

  expectedBytes:
    number | undefined,
): Buffer {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(
      value,
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle base64 field is invalid.",
    );
  }

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.toString(
      "base64",
    ) !==
      value
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle base64 field is not canonical.",
    );
  }

  if (
    expectedBytes !==
      undefined &&
    decoded.length !==
      expectedBytes
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle binary field length is invalid.",
    );
  }

  return decoded;
}

function deriveRecoveryKey(
  securityCode:
    string,

  salt:
    Buffer,
): Promise<Buffer> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      nodeScrypt(
        securityCode,
        salt,
        DERIVED_KEY_BYTES,
        {
          N:
            SCRYPT_N,

          r:
            SCRYPT_R,

          p:
            SCRYPT_P,

          maxmem:
            128 * 1024 * 1024,
        },
        (
          error,
          derived,
        ) => {
          if (error) {
            reject(
              error,
            );

            return;
          }

          resolve(
            derived,
          );
        },
      );
    },
  );
}

function buildAad(
  bundle:
    Omit<
      FinoraControlCenterAdminAuthorityRecoveryBundleV1,
      "ciphertext"
    >,
): Buffer {
  return Buffer.from(
    JSON.stringify([
      bundle.format,
      bundle.schemaVersion,
      bundle.bundleId,
      bundle.issuerId,
      bundle.signingKeyId,
      bundle.createdAt,
      bundle.kdf.algorithm,
      bundle.kdf.N,
      bundle.kdf.r,
      bundle.kdf.p,
      bundle.kdf.salt,
      bundle.kdf.derivedKeyBytes,
      bundle.encryption.algorithm,
      bundle.encryption.iv,
    ]),
    "utf8",
  );
}

// ============================================================
// STRICT VALIDATION
// ============================================================

export function validateFinoraControlCenterAdminAuthorityRecoveryBundleV1(
  value:
    unknown,
): asserts value is FinoraControlCenterAdminAuthorityRecoveryBundleV1 {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle must be an object.",
    );
  }

  const objectValue =
    value as Record<
      string,
      unknown
    >;

  const expectedKeys = [
    "format",
    "schemaVersion",
    "bundleId",
    "issuerId",
    "signingKeyId",
    "createdAt",
    "kdf",
    "encryption",
    "ciphertext",
  ];

  if (
    Object.keys(
      objectValue,
    ).length !==
      expectedKeys.length ||
    !expectedKeys.every(
      (
        key,
      ) =>
        Object.prototype.hasOwnProperty.call(
          objectValue,
          key,
        ),
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle fields are invalid.",
    );
  }

  if (
    objectValue.format !==
      FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FORMAT ||
    objectValue.schemaVersion !==
      FINORA_CONTROL_CENTER_ADMIN_RECOVERY_SCHEMA_VERSION ||
    typeof objectValue.bundleId !==
      "string" ||
    objectValue.bundleId.length ===
      0 ||
    typeof objectValue.issuerId !==
      "string" ||
    objectValue.issuerId.length ===
      0 ||
    typeof objectValue.signingKeyId !==
      "string" ||
    objectValue.signingKeyId.length ===
      0 ||
    !isCanonicalIsoTimestamp(
      objectValue.createdAt,
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle identity metadata is invalid.",
    );
  }

  const kdf =
    objectValue.kdf;

  if (
    typeof kdf !==
      "object" ||
    kdf ===
      null ||
    Array.isArray(
      kdf,
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle KDF metadata is invalid.",
    );
  }

  const kdfValue =
    kdf as Record<
      string,
      unknown
    >;

  if (
    Object.keys(
      kdfValue,
    ).length !==
      6 ||
    kdfValue.algorithm !==
      "SCRYPT" ||
    kdfValue.N !==
      SCRYPT_N ||
    kdfValue.r !==
      SCRYPT_R ||
    kdfValue.p !==
      SCRYPT_P ||
    kdfValue.derivedKeyBytes !==
      DERIVED_KEY_BYTES
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle SCRYPT parameters are invalid.",
    );
  }

  decodeCanonicalBase64(
    kdfValue.salt,
    SCRYPT_SALT_BYTES,
  );

  const encryption =
    objectValue.encryption;

  if (
    typeof encryption !==
      "object" ||
    encryption ===
      null ||
    Array.isArray(
      encryption,
    )
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle encryption metadata is invalid.",
    );
  }

  const encryptionValue =
    encryption as Record<
      string,
      unknown
    >;

  if (
    Object.keys(
      encryptionValue,
    ).length !==
      3 ||
    encryptionValue.algorithm !==
      "AES-256-GCM"
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle encryption algorithm is invalid.",
    );
  }

  decodeCanonicalBase64(
    encryptionValue.iv,
    AES_GCM_IV_BYTES,
  );

  decodeCanonicalBase64(
    encryptionValue.authTag,
    AES_GCM_TAG_BYTES,
  );

  const ciphertext =
    decodeCanonicalBase64(
      objectValue.ciphertext,
      undefined,
    );

  if (
    ciphertext.length ===
      0 ||
    ciphertext.length >
      MAX_CIPHERTEXT_BYTES
  ) {
    throw new Error(
      "FINORA Admin Recovery Bundle ciphertext size is invalid.",
    );
  }
}

// ============================================================
// CREATE
// ============================================================

export async function createFinoraControlCenterAdminAuthorityRecoveryBundleV1(
  vault:
    FinoraControlCenterKeyVaultRecord,

  securityCode:
    string,
): Promise<
  FinoraControlCenterAdminAuthorityRecoveryBundleV1
> {
  validateFinoraControlCenterKeyVaultRecord(
    vault,
  );

  assertAdminSecurityCode(
    securityCode,
  );

  const salt =
    randomBytes(
      SCRYPT_SALT_BYTES,
    );

  const iv =
    randomBytes(
      AES_GCM_IV_BYTES,
    );

  const derivedKey =
    await deriveRecoveryKey(
      securityCode,
      salt,
    );

  try {
    const metadata:
      Omit<
        FinoraControlCenterAdminAuthorityRecoveryBundleV1,
        "ciphertext"
      > = {
        format:
          FINORA_CONTROL_CENTER_ADMIN_RECOVERY_FORMAT,

        schemaVersion:
          FINORA_CONTROL_CENTER_ADMIN_RECOVERY_SCHEMA_VERSION,

        bundleId:
          `FINORA-CC-RECOVERY-${randomUUID()}`,

        issuerId:
          vault.issuerId,

        signingKeyId:
          vault.signingKeyId,

        createdAt:
          new Date()
            .toISOString(),

        kdf: {
          algorithm:
            "SCRYPT",

          N:
            SCRYPT_N,

          r:
            SCRYPT_R,

          p:
            SCRYPT_P,

          salt:
            salt.toString(
              "base64",
            ),

          derivedKeyBytes:
            DERIVED_KEY_BYTES,
        },

        encryption: {
          algorithm:
            "AES-256-GCM",

          iv:
            iv.toString(
              "base64",
            ),

          authTag:
            "",
        },
      };

    const cipher =
      createCipheriv(
        "aes-256-gcm",
        derivedKey,
        iv,
        {
          authTagLength:
            AES_GCM_TAG_BYTES,
        },
      );

    cipher.setAAD(
      buildAad(
        metadata,
      ),
    );

    const plaintext =
      Buffer.from(
        JSON.stringify(
          vault,
        ),
        "utf8",
      );

    const ciphertext =
      Buffer.concat([
        cipher.update(
          plaintext,
        ),
        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    const bundle:
      FinoraControlCenterAdminAuthorityRecoveryBundleV1 = {
        ...metadata,

        encryption: {
          ...metadata.encryption,

          authTag:
            authTag.toString(
              "base64",
            ),
        },

        ciphertext:
          ciphertext.toString(
            "base64",
          ),
      };

    validateFinoraControlCenterAdminAuthorityRecoveryBundleV1(
      bundle,
    );

    return bundle;
  }
  finally {
    derivedKey.fill(
      0,
    );
  }
}

// ============================================================
// DECRYPT
// ============================================================

export async function decryptFinoraControlCenterAdminAuthorityRecoveryBundleV1(
  bundle:
    FinoraControlCenterAdminAuthorityRecoveryBundleV1,

  securityCode:
    string,
): Promise<
  FinoraControlCenterKeyVaultRecord
> {
  validateFinoraControlCenterAdminAuthorityRecoveryBundleV1(
    bundle,
  );

  assertAdminSecurityCode(
    securityCode,
  );

  const salt =
    decodeCanonicalBase64(
      bundle.kdf.salt,
      SCRYPT_SALT_BYTES,
    );

  const iv =
    decodeCanonicalBase64(
      bundle.encryption.iv,
      AES_GCM_IV_BYTES,
    );

  const authTag =
    decodeCanonicalBase64(
      bundle.encryption.authTag,
      AES_GCM_TAG_BYTES,
    );

  const ciphertext =
    decodeCanonicalBase64(
      bundle.ciphertext,
      undefined,
    );

  const derivedKey =
    await deriveRecoveryKey(
      securityCode,
      salt,
    );

  try {
    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        derivedKey,
        iv,
        {
          authTagLength:
            AES_GCM_TAG_BYTES,
        },
      );

    const metadata = {
      format:
        bundle.format,

      schemaVersion:
        bundle.schemaVersion,

      bundleId:
        bundle.bundleId,

      issuerId:
        bundle.issuerId,

      signingKeyId:
        bundle.signingKeyId,

      createdAt:
        bundle.createdAt,

      kdf:
        bundle.kdf,

      encryption: {
        algorithm:
          bundle.encryption.algorithm,

        iv:
          bundle.encryption.iv,

        authTag:
          "",
      },
    } satisfies Omit<
      FinoraControlCenterAdminAuthorityRecoveryBundleV1,
      "ciphertext"
    >;

    decipher.setAAD(
      buildAad(
        metadata,
      ),
    );

    decipher.setAuthTag(
      authTag,
    );

    let plaintext:
      Buffer;

    try {
      plaintext =
        Buffer.concat([
          decipher.update(
            ciphertext,
          ),
          decipher.final(),
        ]);
    }
    catch {
      throw new Error(
        "FINORA Admin Recovery Bundle authentication failed.",
      );
    }

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          plaintext.toString(
            "utf8",
          ),
        );
    }
    catch {
      throw new Error(
        "FINORA Admin Recovery Bundle plaintext is invalid.",
      );
    }

    validateFinoraControlCenterKeyVaultRecord(
      parsed,
    );

    if (
      parsed.issuerId !==
        bundle.issuerId ||
      parsed.signingKeyId !==
        bundle.signingKeyId
    ) {
      throw new Error(
        "FINORA Admin Recovery Bundle identity metadata does not match decrypted signing authority.",
      );
    }

    return parsed;
  }
  finally {
    derivedKey.fill(
      0,
    );
  }
}

// ============================================================
// SERIALIZATION
// ============================================================

export function serializeFinoraControlCenterAdminAuthorityRecoveryBundleV1(
  bundle:
    FinoraControlCenterAdminAuthorityRecoveryBundleV1,
): string {
  validateFinoraControlCenterAdminAuthorityRecoveryBundleV1(
    bundle,
  );

  return JSON.stringify(
    bundle,
  );
}

export function parseFinoraControlCenterAdminAuthorityRecoveryBundleV1(
  serialized:
    string,
): FinoraControlCenterAdminAuthorityRecoveryBundleV1 {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      );
  }
  catch {
    throw new Error(
      "FINORA Admin Recovery Bundle JSON is invalid.",
    );
  }

  validateFinoraControlCenterAdminAuthorityRecoveryBundleV1(
    parsed,
  );

  return parsed;
}

// ============================================================
// END
// ============================================================