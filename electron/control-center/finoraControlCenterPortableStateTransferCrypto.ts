// ============================================================
// FINORA ENTERPRISE
// CONTROL CENTER PORTABLE STATE TRANSFER CRYPTO
//
// PURPOSE:
// - Confidentially wrap an already-signed Portable State
//   envelope for offline Windows <-> Android transfer.
//
// SECURITY MODEL:
// - Dedicated one-time Portable State Transfer Code.
// - The Transfer Code is never persisted in this bundle.
// - Admin Recovery / Developer Security Codes are not reused.
// - Signing private keys are not reused as encryption keys.
// - SCRYPT -> AES-256-GCM.
// - Strict schema and canonical base64 validation.
// - No filesystem / IPC / renderer authority.
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt as nodeScrypt,
} from "node:crypto";


export const FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_FORMAT =
  "FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER" as const;

export const FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_SCHEMA_VERSION =
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

const SCRYPT_MAXMEM =
  128 * 1024 * 1024;

const AES_GCM_IV_BYTES =
  12;

const AES_GCM_TAG_BYTES =
  16;

const MAX_PLAINTEXT_BYTES =
  32 * 1024 * 1024;

const MAX_CIPHERTEXT_BYTES =
  32 * 1024 * 1024;

export const FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_CODE_MIN_LENGTH =
  12;

export const FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_CODE_MAX_LENGTH =
  128;


export interface FinoraControlCenterPortableStateTransferKdfV1 {
  readonly algorithm:
    "SCRYPT";

  readonly N:
    typeof SCRYPT_N;

  readonly r:
    typeof SCRYPT_R;

  readonly p:
    typeof SCRYPT_P;

  readonly salt:
    string;

  readonly derivedKeyBytes:
    typeof DERIVED_KEY_BYTES;
}


export interface FinoraControlCenterPortableStateTransferEncryptionV1 {
  readonly algorithm:
    "AES-256-GCM";

  readonly iv:
    string;

  readonly authTag:
    string;
}


export interface FinoraControlCenterPortableStateTransferBundleV1 {
  readonly format:
    typeof FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_FORMAT;

  readonly schemaVersion:
    typeof FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_SCHEMA_VERSION;

  readonly kdf:
    FinoraControlCenterPortableStateTransferKdfV1;

  readonly encryption:
    FinoraControlCenterPortableStateTransferEncryptionV1;

  readonly ciphertext:
    string;
}


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


function assertExactKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
  label:
    string,
): void {

  const actual =
    Object.keys(
      value,
    ).sort();

  const sortedExpected =
    [
      ...expected,
    ].sort();

  if (
    actual.length !==
      sortedExpected.length ||
    !actual.every(
      (
        key,
        index,
      ) =>
        key ===
          sortedExpected[index],
    )
  ) {

    throw new Error(
      `${label} contains unsupported fields.`,
    );
  }
}


function assertTransferCode(
  value:
    string,
): void {

  if (
    typeof value !==
      "string" ||
    value.length <
      FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_CODE_MIN_LENGTH ||
    value.length >
      FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_CODE_MAX_LENGTH ||
    value !==
      value.trim() ||
    /[\u0000-\u001F\u007F]/.test(
      value,
    )
  ) {

    throw new Error(
      "FINORA Portable State Transfer Code is invalid.",
    );
  }
}


function decodeCanonicalBase64(
  value:
    unknown,
  expectedBytes:
    number | undefined,
  label:
    string,
): Buffer {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {

    throw new Error(
      `${label} is invalid.`,
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
      value ||
    (
      expectedBytes !==
        undefined &&
      decoded.length !==
        expectedBytes
    )
  ) {

    throw new Error(
      `${label} is not canonical base64.`,
    );
  }

  return decoded;
}


function deriveTransferKey(
  transferCode:
    string,
  salt:
    Buffer,
): Promise<Buffer> {

  assertTransferCode(
    transferCode,
  );

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      nodeScrypt(
        transferCode,
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
            SCRYPT_MAXMEM,
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
      FinoraControlCenterPortableStateTransferBundleV1,
      "ciphertext"
    >,
): Buffer {

  return Buffer.from(
    JSON.stringify([
      bundle.format,
      bundle.schemaVersion,
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


export function validateFinoraControlCenterPortableStateTransferBundleV1(
  value:
    unknown,
): asserts value is FinoraControlCenterPortableStateTransferBundleV1 {

  if (!isRecord(value)) {

    throw new Error(
      "FINORA Portable State Transfer Bundle must be an object.",
    );
  }

  assertExactKeys(
    value,
    [
      "ciphertext",
      "encryption",
      "format",
      "kdf",
      "schemaVersion",
    ],
    "FINORA Portable State Transfer Bundle",
  );

  if (
    value.format !==
      FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_FORMAT ||
    value.schemaVersion !==
      FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_SCHEMA_VERSION
  ) {

    throw new Error(
      "FINORA Portable State Transfer Bundle format or schemaVersion is invalid.",
    );
  }

  if (!isRecord(value.kdf)) {

    throw new Error(
      "FINORA Portable State Transfer KDF metadata is invalid.",
    );
  }

  assertExactKeys(
    value.kdf,
    [
      "N",
      "algorithm",
      "derivedKeyBytes",
      "p",
      "r",
      "salt",
    ],
    "FINORA Portable State Transfer KDF metadata",
  );

  if (
    value.kdf.algorithm !==
      "SCRYPT" ||
    value.kdf.N !==
      SCRYPT_N ||
    value.kdf.r !==
      SCRYPT_R ||
    value.kdf.p !==
      SCRYPT_P ||
    value.kdf.derivedKeyBytes !==
      DERIVED_KEY_BYTES
  ) {

    throw new Error(
      "FINORA Portable State Transfer SCRYPT parameters are invalid.",
    );
  }

  decodeCanonicalBase64(
    value.kdf.salt,
    SCRYPT_SALT_BYTES,
    "FINORA Portable State Transfer salt",
  );

  if (!isRecord(value.encryption)) {

    throw new Error(
      "FINORA Portable State Transfer encryption metadata is invalid.",
    );
  }

  assertExactKeys(
    value.encryption,
    [
      "algorithm",
      "authTag",
      "iv",
    ],
    "FINORA Portable State Transfer encryption metadata",
  );

  if (
    value.encryption.algorithm !==
      "AES-256-GCM"
  ) {

    throw new Error(
      "FINORA Portable State Transfer encryption algorithm is invalid.",
    );
  }

  decodeCanonicalBase64(
    value.encryption.iv,
    AES_GCM_IV_BYTES,
    "FINORA Portable State Transfer IV",
  );

  decodeCanonicalBase64(
    value.encryption.authTag,
    AES_GCM_TAG_BYTES,
    "FINORA Portable State Transfer authentication tag",
  );

  const ciphertext =
    decodeCanonicalBase64(
      value.ciphertext,
      undefined,
      "FINORA Portable State Transfer ciphertext",
    );

  if (
    ciphertext.length >
      MAX_CIPHERTEXT_BYTES
  ) {

    throw new Error(
      "FINORA Portable State Transfer ciphertext exceeds the supported size limit.",
    );
  }
}


export async function createFinoraControlCenterPortableStateTransferBundleV1(
  serializedSignedPortableStateEnvelope:
    string,
  transferCode:
    string,
): Promise<
  FinoraControlCenterPortableStateTransferBundleV1
> {

  assertTransferCode(
    transferCode,
  );

  if (
    typeof serializedSignedPortableStateEnvelope !==
      "string" ||
    serializedSignedPortableStateEnvelope.length ===
      0
  ) {

    throw new Error(
      "FINORA Portable State signed envelope serialization is required.",
    );
  }

  const plaintext =
    Buffer.from(
      serializedSignedPortableStateEnvelope,
      "utf8",
    );

  if (
    plaintext.length ===
      0 ||
    plaintext.length >
      MAX_PLAINTEXT_BYTES
  ) {

    throw new Error(
      "FINORA Portable State signed envelope size is invalid.",
    );
  }

  const salt =
    randomBytes(
      SCRYPT_SALT_BYTES,
    );

  const iv =
    randomBytes(
      AES_GCM_IV_BYTES,
    );

  const derivedKey =
    await deriveTransferKey(
      transferCode,
      salt,
    );

  try {

    const metadata:
      Omit<
        FinoraControlCenterPortableStateTransferBundleV1,
        "ciphertext"
      > = {
        format:
          FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_FORMAT,

        schemaVersion:
          FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER_SCHEMA_VERSION,

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

    const ciphertext =
      Buffer.concat([
        cipher.update(
          plaintext,
        ),
        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    if (
      ciphertext.length ===
        0 ||
      ciphertext.length >
        MAX_CIPHERTEXT_BYTES ||
      authTag.length !==
        AES_GCM_TAG_BYTES
    ) {

      throw new Error(
        "FINORA Portable State Transfer encryption produced invalid output.",
      );
    }

    const bundle:
      FinoraControlCenterPortableStateTransferBundleV1 = {
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

    validateFinoraControlCenterPortableStateTransferBundleV1(
      bundle,
    );

    return bundle;
  } finally {

    derivedKey.fill(
      0,
    );

    plaintext.fill(
      0,
    );
  }
}


export async function decryptFinoraControlCenterPortableStateTransferBundleV1(
  bundle:
    FinoraControlCenterPortableStateTransferBundleV1,
  transferCode:
    string,
): Promise<string> {

  validateFinoraControlCenterPortableStateTransferBundleV1(
    bundle,
  );

  assertTransferCode(
    transferCode,
  );

  const salt =
    decodeCanonicalBase64(
      bundle.kdf.salt,
      SCRYPT_SALT_BYTES,
      "FINORA Portable State Transfer salt",
    );

  const iv =
    decodeCanonicalBase64(
      bundle.encryption.iv,
      AES_GCM_IV_BYTES,
      "FINORA Portable State Transfer IV",
    );

  const authTag =
    decodeCanonicalBase64(
      bundle.encryption.authTag,
      AES_GCM_TAG_BYTES,
      "FINORA Portable State Transfer authentication tag",
    );

  const ciphertext =
    decodeCanonicalBase64(
      bundle.ciphertext,
      undefined,
      "FINORA Portable State Transfer ciphertext",
    );

  const derivedKey =
    await deriveTransferKey(
      transferCode,
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

    const metadata:
      Omit<
        FinoraControlCenterPortableStateTransferBundleV1,
        "ciphertext"
      > = {
        format:
          bundle.format,

        schemaVersion:
          bundle.schemaVersion,

        kdf: {
          ...bundle.kdf,
        },

        encryption: {
          algorithm:
            bundle.encryption.algorithm,

          iv:
            bundle.encryption.iv,

          authTag:
            "",
        },
      };

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
    } catch {

      throw new Error(
        "FINORA Portable State Transfer authentication failed.",
      );
    }

    try {

      if (
        plaintext.length ===
          0 ||
        plaintext.length >
          MAX_PLAINTEXT_BYTES
      ) {

        throw new Error(
          "FINORA Portable State decrypted payload size is invalid.",
        );
      }

      return plaintext.toString(
        "utf8",
      );
    } finally {

      plaintext.fill(
        0,
      );
    }
  } finally {

    derivedKey.fill(
      0,
    );
  }
}


export function serializeFinoraControlCenterPortableStateTransferBundleV1(
  bundle:
    FinoraControlCenterPortableStateTransferBundleV1,
): string {

  validateFinoraControlCenterPortableStateTransferBundleV1(
    bundle,
  );

  return JSON.stringify(
    bundle,
  );
}


export function parseFinoraControlCenterPortableStateTransferBundleV1(
  serialized:
    string,
): FinoraControlCenterPortableStateTransferBundleV1 {

  if (
    typeof serialized !==
      "string" ||
    serialized.length ===
      0
  ) {

    throw new Error(
      "FINORA Portable State Transfer serialization is required.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        serialized,
      );
  } catch {

    throw new Error(
      "FINORA Portable State Transfer serialization is malformed.",
    );
  }

  validateFinoraControlCenterPortableStateTransferBundleV1(
    parsed,
  );

  return parsed;
}