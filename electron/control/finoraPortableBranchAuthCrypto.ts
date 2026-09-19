// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CRYPTO ENGINE
// VERSION : 1.0
// STATUS  : Portable Auth Foundation
// ============================================================

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import type {
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
} from "./finoraPortableBranchAuthContract.js";
import {
  Buffer,
} from "node:buffer";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

import {
  FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM,
  FINORA_PORTABLE_BRANCH_AUTH_FORMAT,
  FINORA_PORTABLE_BRANCH_AUTH_IV_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_KDF_ALGORITHM,
  FINORA_PORTABLE_BRANCH_AUTH_KEY_DERIVATION,
  FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
  FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_N,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_P,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_R,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
  parseFinoraPortableBranchAuthEnvelopeV1,
  serializeFinoraPortableBranchAuthEnvelopeV1,
  validateFinoraPortableBranchAuthEnvelopeV1,
  validateFinoraPortableBranchAuthPayloadV1,
  validateFinoraPortableBranchAuthScopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthFactorKdfV1,
  FinoraPortableBranchAuthPayloadV1,
  FinoraPortableBranchAuthScopeV1,
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

// ============================================================
// CONSTANTS
// ============================================================

const FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_MIN_LENGTH =
  8;

const FINORA_PORTABLE_BRANCH_AUTH_SECURITY_CODE_MIN_LENGTH =
  8;

const FINORA_PORTABLE_BRANCH_AUTH_SECRET_MAX_LENGTH =
  128;

const FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_MAXMEM =
  64 * 1024 * 1024;

const FINORA_PORTABLE_BRANCH_AUTH_COMBINE_DOMAIN =
  "FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_KEY_V1";

// ============================================================
// TYPES
// ============================================================

export interface FinoraPortableBranchAuthCreateInputV1 {
  authStateId:
    string;

  sourceAuthorizationId:
    string;

  sourceAuthorizationVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  branchCertificationKeyMaterial?:
    FinoraBranchCertificationKeyMaterialV1;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  userId:
    string;

  username:
    string;

  fullName:
    string;

  role:
    string;

  dataContext:
    "REAL" | "DEMO";

  demoId?:
    string;

  storageMode:
    "LOCAL" | "USB";

  authGeneration:
    number;

  createdAt:
    string;

  updatedAt:
    string;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraPortableBranchAuthEnrollmentMaterialV1 {
  envelope:
    FinoraPortableBranchAuthEnvelopeV1;

  passwordVerifier:
    FinoraPortableBranchAuthVerifierV1;

  securityVerifier:
    FinoraPortableBranchAuthVerifierV1;
}
export interface FinoraPortableBranchAuthDecryptOptionsV1 {
  expectedScope?:
    FinoraPortableBranchAuthScopeV1;
}

export type FinoraPortableBranchAuthCryptoErrorCode =
  | "INVALID_CREDENTIALS"
  | "AUTHENTICATION_FAILED"
  | "INVALID_INPUT";

export class FinoraPortableBranchAuthCryptoError
  extends Error {
  readonly code:
    FinoraPortableBranchAuthCryptoErrorCode;

  constructor(
    code:
      FinoraPortableBranchAuthCryptoErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraPortableBranchAuthCryptoError";

    this.code =
      code;
  }
}

// ============================================================
// USERNAME CANONICALIZATION
// ============================================================

export function canonicalizeFinoraPortableBranchUsername(
  username:
    string,
): string {
  if (
    typeof username !== "string"
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_INPUT",
      "Username is invalid.",
    );
  }

  const canonical =
    username
      .trim()
      .toLowerCase();

  if (
    canonical.length === 0 ||
    canonical.length > 256
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_INPUT",
      "Username is invalid.",
    );
  }

  return canonical;
}

// ============================================================
// SECRET VALIDATION
// ============================================================

function assertPortableSecret(
  value:
    string,
  label:
    "Password" | "Security Code",
  minimumLength:
    number,
): void {
  if (
    typeof value !== "string" ||
    value.length < minimumLength ||
    value.length >
      FINORA_PORTABLE_BRANCH_AUTH_SECRET_MAX_LENGTH ||
    value.trim().length === 0
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_INPUT",
      `${label} is invalid.`,
    );
  }
}

// ============================================================
// FACTOR HELPERS
// ============================================================

function createFactorKdf(
  salt:
    Buffer,
): FinoraPortableBranchAuthFactorKdfV1 {
  return {
    algorithm:
      FINORA_PORTABLE_BRANCH_AUTH_KDF_ALGORITHM,

    salt:
      salt.toString(
        "base64",
      ),

    N:
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_N,

    r:
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_R,

    p:
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_P,

    derivedKeyLength:
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES,
  };
}

function createFactorVerifier(
  factor:
    FinoraPortableBranchAuthFactorKdfV1,
  derived:
    Buffer,
): FinoraPortableBranchAuthVerifierV1 {
  if (
    derived.length !==
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_INPUT",
      "Portable Branch Auth factor length is invalid.",
    );
  }

  return {
    ...factor,

    verifierLength:
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,

    verifier:
      derived
        .subarray(
          0,
          FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
        )
        .toString(
          "base64",
        ),
  };
}

function getSecretFactor(
  derived:
    Buffer,
): Buffer {
  if (
    derived.length !==
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_INPUT",
      "Portable Branch Auth factor length is invalid.",
    );
  }

  return Buffer.from(
    derived.subarray(
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES +
        FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES,
    ),
  );
}

function derivePortableFactor(
  secret:
    string,
  factor:
    FinoraPortableBranchAuthFactorKdfV1,
): Promise<Buffer> {
  const salt =
    Buffer.from(
      factor.salt,
      "base64",
    );

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      scrypt(
        secret,
        salt,
        factor.derivedKeyLength,
        {
          N:
            factor.N,

          r:
            factor.r,

          p:
            factor.p,

          maxmem:
            FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_MAXMEM,
        },
        (
          error,
          derivedKey,
        ) => {
          if (
            error
          ) {
            reject(
              error,
            );

            return;
          }

          resolve(
            Buffer.from(
              derivedKey,
            ),
          );
        },
      );
    },
  );
}

// ============================================================
// ENCRYPTION KEY COMBINATION
// ============================================================

function buildPortableEncryptionKey(
  passwordSecretFactor:
    Buffer,
  securitySecretFactor:
    Buffer,
): Buffer {
  if (
    passwordSecretFactor.length !==
      FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES ||
    securitySecretFactor.length !==
      FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_INPUT",
      "Portable Branch Auth secret factor length is invalid.",
    );
  }

  return createHash(
    "sha256",
  )
    .update(
      FINORA_PORTABLE_BRANCH_AUTH_COMBINE_DOMAIN,
      "utf8",
    )
    .update(
      Buffer.from([
        0,
      ]),
    )
    .update(
      passwordSecretFactor,
    )
    .update(
      Buffer.from([
        0,
      ]),
    )
    .update(
      securitySecretFactor,
    )
    .digest();
}

// ============================================================
// AUTHENTICATED ADDITIONAL DATA
// ============================================================

function buildPortableAad(
  envelope:
    Pick<
      FinoraPortableBranchAuthEnvelopeV1,
      | "format"
      | "schemaVersion"
      | "canonicalUsername"
      | "branchScope"
      | "passwordFactor"
      | "securityFactor"
      | "encryption"
    >,
): Buffer {
  const canonicalMetadata = {
    format:
      envelope.format,

    schemaVersion:
      envelope.schemaVersion,

    canonicalUsername:
      envelope.canonicalUsername,

    branchScope:
      {
        ownerId:
          envelope.branchScope.ownerId,

        businessId:
          envelope.branchScope.businessId,

        branchId:
          envelope.branchScope.branchId,
      },

    passwordFactor:
      {
        algorithm:
          envelope.passwordFactor.algorithm,

        salt:
          envelope.passwordFactor.salt,

        N:
          envelope.passwordFactor.N,

        r:
          envelope.passwordFactor.r,

        p:
          envelope.passwordFactor.p,

        derivedKeyLength:
          envelope.passwordFactor.derivedKeyLength,

        verifierLength:
          envelope.passwordFactor.verifierLength,

        verifier:
          envelope.passwordFactor.verifier,
      },

    securityFactor:
      {
        algorithm:
          envelope.securityFactor.algorithm,

        salt:
          envelope.securityFactor.salt,

        N:
          envelope.securityFactor.N,

        r:
          envelope.securityFactor.r,

        p:
          envelope.securityFactor.p,

        derivedKeyLength:
          envelope.securityFactor.derivedKeyLength,
      },

    encryption:
      {
        algorithm:
          envelope.encryption.algorithm,

        keyDerivation:
          envelope.encryption.keyDerivation,

        iv:
          envelope.encryption.iv,
      },
  };

  return Buffer.from(
    JSON.stringify(
      canonicalMetadata,
    ),
    "utf8",
  );
}

// ============================================================
// SCOPE HELPERS
// ============================================================

function scopesEqual(
  left:
    FinoraPortableBranchAuthScopeV1,
  right:
    FinoraPortableBranchAuthScopeV1,
): boolean {
  return (
    left.ownerId ===
      right.ownerId &&
    left.businessId ===
      right.businessId &&
    left.branchId ===
      right.branchId
  );
}

// ============================================================
// VERIFIER HELPERS
// ============================================================

function verifierMetadataMatches(
  verifier:
    FinoraPortableBranchAuthVerifierV1,
  factor:
    FinoraPortableBranchAuthFactorKdfV1,
): boolean {
  return (
    verifier.algorithm ===
      factor.algorithm &&
    verifier.salt ===
      factor.salt &&
    verifier.N ===
      factor.N &&
    verifier.r ===
      factor.r &&
    verifier.p ===
      factor.p &&
    verifier.derivedKeyLength ===
      factor.derivedKeyLength &&
    verifier.verifierLength ===
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES
  );
}

function verifiersEqual(
  left:
    FinoraPortableBranchAuthVerifierV1,
  right:
    FinoraPortableBranchAuthVerifierV1,
): boolean {
  if (
    !verifierMetadataMatches(
      left,
      right,
    ) ||
    !verifierMetadataMatches(
      right,
      left,
    )
  ) {
    return false;
  }

  const leftBytes =
    Buffer.from(
      left.verifier,
      "base64",
    );

  const rightBytes =
    Buffer.from(
      right.verifier,
      "base64",
    );

  return (
    leftBytes.length ===
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES &&
    rightBytes.length ===
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES &&
    timingSafeEqual(
      leftBytes,
      rightBytes,
    )
  );
}

// ============================================================
// PASSWORD-FIRST AUTHORITY
// ============================================================

export async function verifyFinoraPortableBranchAuthPassword(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
  password:
    string,
): Promise<boolean> {
  validateFinoraPortableBranchAuthEnvelopeV1(
    envelope,
  );

  assertPortableSecret(
    password,
    "Password",
    FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_MIN_LENGTH,
  );

  const derived =
    await derivePortableFactor(
      password,
      envelope.passwordFactor,
    );

  try {
    const derivedVerifier =
      derived.subarray(
        0,
        FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
      );

    const expectedVerifier =
      Buffer.from(
        envelope.passwordFactor.verifier,
        "base64",
      );

    return timingSafeEqual(
      derivedVerifier,
      expectedVerifier,
    );
  }
  finally {
    derived.fill(
      0,
    );
  }
}

// ============================================================
// ENVELOPE CREATION
// ============================================================

export async function createFinoraPortableBranchAuthEnrollmentMaterialV1(
  input:
    FinoraPortableBranchAuthCreateInputV1,
): Promise<FinoraPortableBranchAuthEnrollmentMaterialV1> {
  assertPortableSecret(
    input.password,
    "Password",
    FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_MIN_LENGTH,
  );

  assertPortableSecret(
    input.securityCode,
    "Security Code",
    FINORA_PORTABLE_BRANCH_AUTH_SECURITY_CODE_MIN_LENGTH,
  );

  validateFinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1(
    input.sourceAuthorizationVerificationEvidence,
  );

  if (
    input.sourceAuthorizationVerificationEvidence.authorizationId !==
      input.sourceAuthorizationId
  ) {
    throw new Error(
      "Portable Branch Auth source authorization verification evidence does not match sourceAuthorizationId.",
    );
  }

  const canonicalUsername =
    canonicalizeFinoraPortableBranchUsername(
      input.username,
    );

  const branchScope:
    FinoraPortableBranchAuthScopeV1 =
    {
      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,
    };

  validateFinoraPortableBranchAuthScopeV1(
    branchScope,
  );

  const passwordSalt =
    randomBytes(
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
    );

  const securitySalt =
    randomBytes(
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
    );

  const passwordFactor =
    createFactorKdf(
      passwordSalt,
    );

  const securityFactor =
    createFactorKdf(
      securitySalt,
    );

  const [
    passwordDerived,
    securityDerived,
  ] =
    await Promise.all([
      derivePortableFactor(
        input.password,
        passwordFactor,
      ),

      derivePortableFactor(
        input.securityCode,
        securityFactor,
      ),
    ]);

  const passwordSecretFactor =
    getSecretFactor(
      passwordDerived,
    );

  const securitySecretFactor =
    getSecretFactor(
      securityDerived,
    );

  const encryptionKey =
    buildPortableEncryptionKey(
      passwordSecretFactor,
      securitySecretFactor,
    );

  try {
    const passwordVerifier =
      createFactorVerifier(
        passwordFactor,
        passwordDerived,
      );

    const securityVerifier =
      createFactorVerifier(
        securityFactor,
        securityDerived,
      );

    const payload:
      FinoraPortableBranchAuthPayloadV1 =
      {
        schemaVersion:
          FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

        authStateId:
          input.authStateId,

        sourceAuthorizationId:
          input.sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          structuredClone(
            input.sourceAuthorizationVerificationEvidence,
          ),

        ...(
          input.branchCertificationKeyMaterial ===
            undefined
            ? {}
            : {
                branchCertificationKeyMaterial:
                  structuredClone(
                    input.branchCertificationKeyMaterial,
                  ),
              }
        ),

        ownerId:
          input.ownerId,

        businessId:
          input.businessId,

        branchId:
          input.branchId,

        userId:
          input.userId,

        username:
          input.username.trim(),

        canonicalUsername,

        fullName:
          input.fullName,

        role:
          input.role,

        dataContext:
          input.dataContext,

        ...(input.demoId === undefined
          ? {}
          : {
              demoId:
                input.demoId,
            }),

        storageMode:
          input.storageMode,

        passwordVerifier,

        securityVerifier,

        authGeneration:
          input.authGeneration,

        createdAt:
          input.createdAt,

        updatedAt:
          input.updatedAt,
      };

    validateFinoraPortableBranchAuthPayloadV1(
      payload,
    );

    const iv =
      randomBytes(
        FINORA_PORTABLE_BRANCH_AUTH_IV_BYTES,
      );

    const envelopeWithoutTag:
      Omit<
        FinoraPortableBranchAuthEnvelopeV1,
        "ciphertext"
      > =
      {
        format:
          FINORA_PORTABLE_BRANCH_AUTH_FORMAT,

        schemaVersion:
          FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION,

        canonicalUsername,

        branchScope,

        passwordFactor:
          passwordVerifier,

        securityFactor,

        encryption:
          {
            algorithm:
              FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM,

            keyDerivation:
              FINORA_PORTABLE_BRANCH_AUTH_KEY_DERIVATION,

            iv:
              iv.toString(
                "base64",
              ),

            authTag:
              Buffer.alloc(
                FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
              ).toString(
                "base64",
              ),
          },
      };

    const aad =
      buildPortableAad(
        envelopeWithoutTag,
      );

    const cipher =
      createCipheriv(
        "aes-256-gcm",
        encryptionKey,
        iv,
        {
          authTagLength:
            FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
        },
      );

    cipher.setAAD(
      aad,
    );

    const plaintext =
      Buffer.from(
        JSON.stringify(
          payload,
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

    const envelope:
      FinoraPortableBranchAuthEnvelopeV1 =
      {
        ...envelopeWithoutTag,

        encryption:
          {
            ...envelopeWithoutTag.encryption,

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

    validateFinoraPortableBranchAuthEnvelopeV1(
      envelope,
    );

    return {
      envelope,

      passwordVerifier,

      securityVerifier,
    };
  }
  finally {
    passwordDerived.fill(
      0,
    );

    securityDerived.fill(
      0,
    );

    passwordSecretFactor.fill(
      0,
    );

    securitySecretFactor.fill(
      0,
    );

    encryptionKey.fill(
      0,
    );
  }
}

// ============================================================
// ENVELOPE CREATION COMPATIBILITY API
//
// Existing callers receive the exact same envelope contract.
// The new enrollment-material API is the authoritative
// single-derivation path for credential enrollment.
// ============================================================

export async function createFinoraPortableBranchAuthEnvelopeV1(
  input:
    FinoraPortableBranchAuthCreateInputV1,
): Promise<FinoraPortableBranchAuthEnvelopeV1> {
  const material =
    await createFinoraPortableBranchAuthEnrollmentMaterialV1(
      input,
    );

  return material.envelope;
}
// ============================================================
// ENVELOPE DECRYPTION
// ============================================================

export async function decryptFinoraPortableBranchAuthEnvelopeV1(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
  password:
    string,
  securityCode:
    string,
  options:
    FinoraPortableBranchAuthDecryptOptionsV1 = {},
): Promise<FinoraPortableBranchAuthPayloadV1> {
  validateFinoraPortableBranchAuthEnvelopeV1(
    envelope,
  );

  assertPortableSecret(
    password,
    "Password",
    FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_MIN_LENGTH,
  );

  const passwordValid =
    await verifyFinoraPortableBranchAuthPassword(
      envelope,
      password,
    );

  if (
    !passwordValid
  ) {
    throw new FinoraPortableBranchAuthCryptoError(
      "INVALID_CREDENTIALS",
      "Invalid credentials.",
    );
  }

  assertPortableSecret(
    securityCode,
    "Security Code",
    FINORA_PORTABLE_BRANCH_AUTH_SECURITY_CODE_MIN_LENGTH,
  );

  if (
    options.expectedScope !==
      undefined
  ) {
    validateFinoraPortableBranchAuthScopeV1(
      options.expectedScope,
    );

    if (
      !scopesEqual(
        envelope.branchScope,
        options.expectedScope,
      )
    ) {
      throw new FinoraPortableBranchAuthCryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth authentication failed.",
      );
    }
  }

  const [
    passwordDerived,
    securityDerived,
  ] =
    await Promise.all([
      derivePortableFactor(
        password,
        envelope.passwordFactor,
      ),

      derivePortableFactor(
        securityCode,
        envelope.securityFactor,
      ),
    ]);

  const passwordSecretFactor =
    getSecretFactor(
      passwordDerived,
    );

  const securitySecretFactor =
    getSecretFactor(
      securityDerived,
    );

  const encryptionKey =
    buildPortableEncryptionKey(
      passwordSecretFactor,
      securitySecretFactor,
    );

  try {
    const iv =
      Buffer.from(
        envelope.encryption.iv,
        "base64",
      );

    const authTag =
      Buffer.from(
        envelope.encryption.authTag,
        "base64",
      );

    const ciphertext =
      Buffer.from(
        envelope.ciphertext,
        "base64",
      );

    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        encryptionKey,
        iv,
        {
          authTagLength:
            FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
        },
      );

    decipher.setAAD(
      buildPortableAad(
        envelope,
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
      throw new FinoraPortableBranchAuthCryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth authentication failed.",
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
      throw new FinoraPortableBranchAuthCryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth authentication failed.",
      );
    }

    try {
      validateFinoraPortableBranchAuthPayloadV1(
        parsed,
      );
    }
    catch {
      throw new FinoraPortableBranchAuthCryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth authentication failed.",
      );
    }

    const payload =
      parsed;

    const payloadScope:
      FinoraPortableBranchAuthScopeV1 =
      {
        ownerId:
          payload.ownerId,

        businessId:
          payload.businessId,

        branchId:
          payload.branchId,
      };

    if (
      payload.canonicalUsername !==
        envelope.canonicalUsername ||
      !scopesEqual(
        payloadScope,
        envelope.branchScope,
      ) ||
      !verifiersEqual(
        payload.passwordVerifier,
        envelope.passwordFactor,
      ) ||
      !verifierMetadataMatches(
        payload.securityVerifier,
        envelope.securityFactor,
      )
    ) {
      throw new FinoraPortableBranchAuthCryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth authentication failed.",
      );
    }

    const expectedSecurityVerifier =
      securityDerived.subarray(
        0,
        FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
      );

    const actualSecurityVerifier =
      Buffer.from(
        payload.securityVerifier.verifier,
        "base64",
      );

    if (
      !timingSafeEqual(
        expectedSecurityVerifier,
        actualSecurityVerifier,
      )
    ) {
      throw new FinoraPortableBranchAuthCryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth authentication failed.",
      );
    }

    return payload;
  }
  finally {
    passwordDerived.fill(
      0,
    );

    securityDerived.fill(
      0,
    );

    passwordSecretFactor.fill(
      0,
    );

    securitySecretFactor.fill(
      0,
    );

    encryptionKey.fill(
      0,
    );
  }
}

// ============================================================
// PORTABLE SERIALIZATION API
// ============================================================

export function serializeFinoraPortableBranchAuth(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
): string {
  return serializeFinoraPortableBranchAuthEnvelopeV1(
    envelope,
  );
}

export function parseFinoraPortableBranchAuth(
  serialized:
    string,
): FinoraPortableBranchAuthEnvelopeV1 {
  return parseFinoraPortableBranchAuthEnvelopeV1(
    serialized,
  );
}

// ============================================================
// END
// ============================================================