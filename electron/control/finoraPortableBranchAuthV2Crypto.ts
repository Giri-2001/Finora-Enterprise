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
  FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION_V2,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_DERIVED_KEY_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_N,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_P,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_R,
  FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
  FINORA_PORTABLE_BRANCH_AUTH_V2_PASSWORD_WRAP_KEY_DERIVATION,
  FINORA_PORTABLE_BRANCH_AUTH_V2_RECOVERY_WRAP_KEY_DERIVATION,
  FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
  validateFinoraPortableBranchAuthEnvelopeV2,
  validateFinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV2,
  FinoraPortableBranchAuthKeyWrapV2,
  FinoraPortableBranchAuthPayloadV1,
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

// ============================================================
// CONSTANTS
// ============================================================

const PASSWORD_MIN_LENGTH =
  8;

const SECURITY_CODE_MIN_LENGTH =
  8;

const SECRET_MAX_LENGTH =
  128;

const BRANCH_MASTER_KEY_BYTES =
  32;

const PASSWORD_WRAP_DOMAIN =
  "FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_WRAP_KEY_V2";

const RECOVERY_WRAP_DOMAIN =
  "FINORA_PORTABLE_BRANCH_AUTH_RECOVERY_WRAP_KEY_V2";

const PAYLOAD_AAD_DOMAIN =
  "FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_AAD_V2";

const WRAP_AAD_DOMAIN =
  "FINORA_PORTABLE_BRANCH_AUTH_WRAP_AAD_V2";

// ============================================================
// TYPES
// ============================================================

export type FinoraPortableBranchAuthPayloadBaseV2 =
  Omit<
    FinoraPortableBranchAuthPayloadV1,
    "passwordVerifier" |
    "securityVerifier"
  >;

export interface FinoraPortableBranchAuthCreateInputV2 {
  payload:
    FinoraPortableBranchAuthPayloadBaseV2;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraPortableBranchAuthEnrollmentMaterialV2 {
  envelope:
    FinoraPortableBranchAuthEnvelopeV2;

  passwordVerifier:
    FinoraPortableBranchAuthVerifierV1;

  securityVerifier:
    FinoraPortableBranchAuthVerifierV1;
}

export interface FinoraPortableBranchAuthPasswordRotationV2 {
  envelope:
    FinoraPortableBranchAuthEnvelopeV2;

  passwordVerifier:
    FinoraPortableBranchAuthVerifierV1;
}

export interface FinoraPortableBranchAuthRecoveryRotationV2 {
  envelope:
    FinoraPortableBranchAuthEnvelopeV2;

  securityVerifier:
    FinoraPortableBranchAuthVerifierV1;
}

// ============================================================
// ERROR
// ============================================================

export type FinoraPortableBranchAuthV2CryptoErrorCode =
  | "INVALID_CREDENTIALS"
  | "AUTHENTICATION_FAILED"
  | "INVALID_INPUT";

export class FinoraPortableBranchAuthV2CryptoError
  extends Error {
  readonly code:
    FinoraPortableBranchAuthV2CryptoErrorCode;

  constructor(
    code:
      FinoraPortableBranchAuthV2CryptoErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraPortableBranchAuthV2CryptoError";

    this.code =
      code;
  }
}

// ============================================================
// BASIC HELPERS
// ============================================================

function assertSecret(
  secret:
    string,
  label:
    string,
  minimumLength:
    number,
): void {
  const length =
    Array.from(
      secret,
    ).length;

  if (
    typeof secret !== "string" ||
    secret.trim().length === 0 ||
    length <
      minimumLength ||
    length >
      SECRET_MAX_LENGTH
  ) {
    throw new FinoraPortableBranchAuthV2CryptoError(
      "INVALID_INPUT",
      `${label} must contain between ${minimumLength} and ${SECRET_MAX_LENGTH} characters.`,
    );
  }
}

function createFactorMetadata(
  salt:
    Buffer,
): Omit<
  FinoraPortableBranchAuthVerifierV1,
  "verifierLength" |
  "verifier"
> {
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

async function deriveFactor(
  secret:
    string,
  factor:
    Pick<
      FinoraPortableBranchAuthVerifierV1,
      "salt" |
      "N" |
      "r" |
      "p" |
      "derivedKeyLength"
    >,
): Promise<Buffer> {
  const salt =
    Buffer.from(
      factor.salt,
      "base64",
    );

  return await new Promise<Buffer>(
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
            128 * 1024 * 1024,
        },
        (
          error,
          derivedKey,
        ) => {
          if (error) {
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

function createVerifier(
  factor:
    Omit<
      FinoraPortableBranchAuthVerifierV1,
      "verifierLength" |
      "verifier"
    >,
  derived:
    Buffer,
): FinoraPortableBranchAuthVerifierV1 {
  const verifier =
    derived.subarray(
      0,
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
    );

  return {
    ...factor,

    verifierLength:
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,

    verifier:
      verifier.toString(
        "base64",
      ),
  };
}

function getSecretFactor(
  derived:
    Buffer,
): Buffer {
  const start =
    FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES;

  const end =
    start +
    FINORA_PORTABLE_BRANCH_AUTH_SECRET_FACTOR_BYTES;

  if (
    derived.length <
      end
  ) {
    throw new FinoraPortableBranchAuthV2CryptoError(
      "AUTHENTICATION_FAILED",
      "Portable Branch Auth factor derivation failed.",
    );
  }

  return Buffer.from(
    derived.subarray(
      start,
      end,
    ),
  );
}

function verifierMatches(
  derived:
    Buffer,
  verifier:
    FinoraPortableBranchAuthVerifierV1,
): boolean {
  const actual =
    derived.subarray(
      0,
      FINORA_PORTABLE_BRANCH_AUTH_VERIFIER_BYTES,
    );

  const expected =
    Buffer.from(
      verifier.verifier,
      "base64",
    );

  return (
    actual.length ===
      expected.length &&
    timingSafeEqual(
      actual,
      expected,
    )
  );
}

function deriveWrapKey(
  secretFactor:
    Buffer,
  domain:
    string,
): Buffer {
  return createHash(
    "sha256",
  )
    .update(
      domain,
      "utf8",
    )
    .update(
      Buffer.from(
        [0],
      ),
    )
    .update(
      secretFactor,
    )
    .digest();
}

function buildStableScopeMetadata(
  envelope:
    Pick<
      FinoraPortableBranchAuthEnvelopeV2,
      "format" |
      "schemaVersion" |
      "canonicalUsername" |
      "branchScope"
    >,
): Record<
  string,
  unknown
> {
  return {
    format:
      envelope.format,

    schemaVersion:
      envelope.schemaVersion,

    canonicalUsername:
      envelope.canonicalUsername,

    branchScope:
      envelope.branchScope,
  };
}

function buildPayloadAad(
  envelope:
    Pick<
      FinoraPortableBranchAuthEnvelopeV2,
      "format" |
      "schemaVersion" |
      "canonicalUsername" |
      "branchScope"
    >,
): Buffer {
  return Buffer.from(
    JSON.stringify(
      {
        domain:
          PAYLOAD_AAD_DOMAIN,

        ...buildStableScopeMetadata(
          envelope,
        ),
      },
    ),
    "utf8",
  );
}

function buildWrapAad(
  envelope:
    Pick<
      FinoraPortableBranchAuthEnvelopeV2,
      "format" |
      "schemaVersion" |
      "canonicalUsername" |
      "branchScope"
    >,
  purpose:
    "PASSWORD" |
    "RECOVERY",
  factor:
    FinoraPortableBranchAuthVerifierV1,
): Buffer {
  return Buffer.from(
    JSON.stringify(
      {
        domain:
          WRAP_AAD_DOMAIN,

        purpose,

        ...buildStableScopeMetadata(
          envelope,
        ),

        factor: {
          algorithm:
            factor.algorithm,

          salt:
            factor.salt,

          N:
            factor.N,

          r:
            factor.r,

          p:
            factor.p,

          derivedKeyLength:
            factor.derivedKeyLength,

          verifierLength:
            factor.verifierLength,

          verifier:
            factor.verifier,
        },
      },
    ),
    "utf8",
  );
}

// ============================================================
// AES-GCM HELPERS
// ============================================================

function encryptAesGcm(
  key:
    Buffer,
  plaintext:
    Buffer,
  aad:
    Buffer,
): {
  iv:
    Buffer;
  authTag:
    Buffer;
  ciphertext:
    Buffer;
} {
  const iv =
    randomBytes(
      FINORA_PORTABLE_BRANCH_AUTH_IV_BYTES,
    );

  const cipher =
    createCipheriv(
      "aes-256-gcm",
      key,
      iv,
      {
        authTagLength:
          FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
      },
    );

  cipher.setAAD(
    aad,
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

  return {
    iv,
    authTag,
    ciphertext,
  };
}

function decryptAesGcm(
  key:
    Buffer,
  iv:
    string,
  authTag:
    string,
  ciphertext:
    string,
  aad:
    Buffer,
): Buffer {
  try {
    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(
          iv,
          "base64",
        ),
        {
          authTagLength:
            FINORA_PORTABLE_BRANCH_AUTH_TAG_BYTES,
        },
      );

    decipher.setAAD(
      aad,
    );

    decipher.setAuthTag(
      Buffer.from(
        authTag,
        "base64",
      ),
    );

    return Buffer.concat([
      decipher.update(
        Buffer.from(
          ciphertext,
          "base64",
        ),
      ),
      decipher.final(),
    ]);
  }
  catch {
    throw new FinoraPortableBranchAuthV2CryptoError(
      "AUTHENTICATION_FAILED",
      "Portable Branch Auth authentication failed.",
    );
  }
}

function createKeyWrap(
  masterKey:
    Buffer,
  wrapKey:
    Buffer,
  keyDerivation:
    typeof FINORA_PORTABLE_BRANCH_AUTH_V2_PASSWORD_WRAP_KEY_DERIVATION |
    typeof FINORA_PORTABLE_BRANCH_AUTH_V2_RECOVERY_WRAP_KEY_DERIVATION,
  aad:
    Buffer,
): FinoraPortableBranchAuthKeyWrapV2 {
  const encrypted =
    encryptAesGcm(
      wrapKey,
      masterKey,
      aad,
    );

  return {
    algorithm:
      FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM,

    keyDerivation,

    iv:
      encrypted.iv.toString(
        "base64",
      ),

    authTag:
      encrypted.authTag.toString(
        "base64",
      ),

    wrappedKey:
      encrypted.ciphertext.toString(
        "base64",
      ),
  };
}

function unwrapMasterKey(
  wrap:
    FinoraPortableBranchAuthKeyWrapV2,
  wrapKey:
    Buffer,
  aad:
    Buffer,
): Buffer {
  const masterKey =
    decryptAesGcm(
      wrapKey,
      wrap.iv,
      wrap.authTag,
      wrap.wrappedKey,
      aad,
    );

  if (
    masterKey.length !==
      BRANCH_MASTER_KEY_BYTES
  ) {
    masterKey.fill(
      0,
    );

    throw new FinoraPortableBranchAuthV2CryptoError(
      "AUTHENTICATION_FAILED",
      "Portable Branch Auth master key is invalid.",
    );
  }

  return masterKey;
}

// ============================================================
// PAYLOAD DECRYPTION
// ============================================================

function decryptPayloadWithMasterKey(
  envelope:
    FinoraPortableBranchAuthEnvelopeV2,
  masterKey:
    Buffer,
): FinoraPortableBranchAuthPayloadV1 {
  const plaintext =
    decryptAesGcm(
      masterKey,
      envelope.payloadEncryption.iv,
      envelope.payloadEncryption.authTag,
      envelope.ciphertext,
      buildPayloadAad(
        envelope,
      ),
    );

  try {
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
      throw new FinoraPortableBranchAuthV2CryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth payload is invalid.",
      );
    }

    validateFinoraPortableBranchAuthPayloadV1(
      parsed,
    );

    if (
      parsed.canonicalUsername !==
        envelope.canonicalUsername ||
      parsed.ownerId !==
        envelope.branchScope.ownerId ||
      parsed.businessId !==
        envelope.branchScope.businessId ||
      parsed.branchId !==
        envelope.branchScope.branchId
    ) {
      throw new FinoraPortableBranchAuthV2CryptoError(
        "AUTHENTICATION_FAILED",
        "Portable Branch Auth payload scope mismatch.",
      );
    }

    return parsed;
  }
  finally {
    plaintext.fill(
      0,
    );
  }
}

// ============================================================
// CREATE
// ============================================================

export async function createFinoraPortableBranchAuthEnrollmentMaterialV2(
  input:
    FinoraPortableBranchAuthCreateInputV2,
): Promise<
  FinoraPortableBranchAuthEnrollmentMaterialV2
> {
  assertSecret(
    input.password,
    "Password",
    PASSWORD_MIN_LENGTH,
  );

  assertSecret(
    input.securityCode,
    "Security Code",
    SECURITY_CODE_MIN_LENGTH,
  );

  const passwordSalt =
    randomBytes(
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
    );

  const securitySalt =
    randomBytes(
      FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
    );

  const passwordFactorBase =
    createFactorMetadata(
      passwordSalt,
    );

  const securityFactorBase =
    createFactorMetadata(
      securitySalt,
    );

  const [
    passwordDerived,
    securityDerived,
  ] =
    await Promise.all([
      deriveFactor(
        input.password,
        passwordFactorBase,
      ),

      deriveFactor(
        input.securityCode,
        securityFactorBase,
      ),
    ]);

  const passwordVerifier =
    createVerifier(
      passwordFactorBase,
      passwordDerived,
    );

  const securityVerifier =
    createVerifier(
      securityFactorBase,
      securityDerived,
    );

  const passwordSecretFactor =
    getSecretFactor(
      passwordDerived,
    );

  const securitySecretFactor =
    getSecretFactor(
      securityDerived,
    );

  const passwordWrapKey =
    deriveWrapKey(
      passwordSecretFactor,
      PASSWORD_WRAP_DOMAIN,
    );

  const recoveryWrapKey =
    deriveWrapKey(
      securitySecretFactor,
      RECOVERY_WRAP_DOMAIN,
    );

  const masterKey =
    randomBytes(
      BRANCH_MASTER_KEY_BYTES,
    );

  try {
    const payload:
      FinoraPortableBranchAuthPayloadV1 =
      {
        ...structuredClone(
          input.payload,
        ),

        passwordVerifier,

        securityVerifier,
      };

    validateFinoraPortableBranchAuthPayloadV1(
      payload,
    );

    const envelopeBase:
      Pick<
        FinoraPortableBranchAuthEnvelopeV2,
        "format" |
        "schemaVersion" |
        "canonicalUsername" |
        "branchScope"
      > =
      {
        format:
          FINORA_PORTABLE_BRANCH_AUTH_FORMAT,

        schemaVersion:
          FINORA_PORTABLE_BRANCH_AUTH_SCHEMA_VERSION_V2,

        canonicalUsername:
          payload.canonicalUsername,

        branchScope: {
          ownerId:
            payload.ownerId,

          businessId:
            payload.businessId,

          branchId:
            payload.branchId,
        },
      };

    const payloadPlaintext =
      Buffer.from(
        JSON.stringify(
          payload,
        ),
        "utf8",
      );

    try {
      const payloadEncrypted =
        encryptAesGcm(
          masterKey,
          payloadPlaintext,
          buildPayloadAad(
            envelopeBase,
          ),
        );

      const passwordWrap =
        createKeyWrap(
          masterKey,
          passwordWrapKey,
          FINORA_PORTABLE_BRANCH_AUTH_V2_PASSWORD_WRAP_KEY_DERIVATION,
          buildWrapAad(
            envelopeBase,
            "PASSWORD",
            passwordVerifier,
          ),
        );

      const recoveryWrap =
        createKeyWrap(
          masterKey,
          recoveryWrapKey,
          FINORA_PORTABLE_BRANCH_AUTH_V2_RECOVERY_WRAP_KEY_DERIVATION,
          buildWrapAad(
            envelopeBase,
            "RECOVERY",
            securityVerifier,
          ),
        );

      const envelope:
        FinoraPortableBranchAuthEnvelopeV2 =
        {
          ...envelopeBase,

          passwordFactor:
            passwordVerifier,

          securityFactor:
            securityVerifier,

          payloadEncryption: {
            algorithm:
              FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM,

            iv:
              payloadEncrypted.iv.toString(
                "base64",
              ),

            authTag:
              payloadEncrypted.authTag.toString(
                "base64",
              ),
          },

          passwordWrap,

          recoveryWrap,

          ciphertext:
            payloadEncrypted.ciphertext.toString(
              "base64",
            ),
        };

      validateFinoraPortableBranchAuthEnvelopeV2(
        envelope,
      );

      return {
        envelope,
        passwordVerifier,
        securityVerifier,
      };
    }
    finally {
      payloadPlaintext.fill(
        0,
      );
    }
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

    passwordWrapKey.fill(
      0,
    );

    recoveryWrapKey.fill(
      0,
    );

    masterKey.fill(
      0,
    );
  }
}

// ============================================================
// PASSWORD LOGIN
// ============================================================

export async function decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
  envelope:
    FinoraPortableBranchAuthEnvelopeV2,
  password:
    string,
): Promise<
  FinoraPortableBranchAuthPayloadV1
> {
  validateFinoraPortableBranchAuthEnvelopeV2(
    envelope,
  );

  assertSecret(
    password,
    "Password",
    PASSWORD_MIN_LENGTH,
  );

  const derived =
    await deriveFactor(
      password,
      envelope.passwordFactor,
    );

  try {
    if (
      !verifierMatches(
        derived,
        envelope.passwordFactor,
      )
    ) {
      throw new FinoraPortableBranchAuthV2CryptoError(
        "INVALID_CREDENTIALS",
        "Invalid credentials.",
      );
    }

    const secretFactor =
      getSecretFactor(
        derived,
      );

    const wrapKey =
      deriveWrapKey(
        secretFactor,
        PASSWORD_WRAP_DOMAIN,
      );

    try {
      const masterKey =
        unwrapMasterKey(
          envelope.passwordWrap,
          wrapKey,
          buildWrapAad(
            envelope,
            "PASSWORD",
            envelope.passwordFactor,
          ),
        );

      try {
        return decryptPayloadWithMasterKey(
          envelope,
          masterKey,
        );
      }
      finally {
        masterKey.fill(
          0,
        );
      }
    }
    finally {
      secretFactor.fill(
        0,
      );

      wrapKey.fill(
        0,
      );
    }
  }
  finally {
    derived.fill(
      0,
    );
  }
}

// ============================================================
// SECURITY-CODE RECOVERY
// ============================================================

export async function decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
  envelope:
    FinoraPortableBranchAuthEnvelopeV2,
  securityCode:
    string,
): Promise<
  FinoraPortableBranchAuthPayloadV1
> {
  validateFinoraPortableBranchAuthEnvelopeV2(
    envelope,
  );

  assertSecret(
    securityCode,
    "Security Code",
    SECURITY_CODE_MIN_LENGTH,
  );

  const derived =
    await deriveFactor(
      securityCode,
      envelope.securityFactor,
    );

  try {
    if (
      !verifierMatches(
        derived,
        envelope.securityFactor,
      )
    ) {
      throw new FinoraPortableBranchAuthV2CryptoError(
        "INVALID_CREDENTIALS",
        "Invalid Security Code.",
      );
    }

    const secretFactor =
      getSecretFactor(
        derived,
      );

    const wrapKey =
      deriveWrapKey(
        secretFactor,
        RECOVERY_WRAP_DOMAIN,
      );

    try {
      const masterKey =
        unwrapMasterKey(
          envelope.recoveryWrap,
          wrapKey,
          buildWrapAad(
            envelope,
            "RECOVERY",
            envelope.securityFactor,
          ),
        );

      try {
        return decryptPayloadWithMasterKey(
          envelope,
          masterKey,
        );
      }
      finally {
        masterKey.fill(
          0,
        );
      }
    }
    finally {
      secretFactor.fill(
        0,
      );

      wrapKey.fill(
        0,
      );
    }
  }
  finally {
    derived.fill(
      0,
    );
  }
}

// ============================================================
// PASSWORD WRAP ROTATION
//
// Recovery code unlocks the master key.
// Payload ciphertext is NOT re-encrypted.
// Old password immediately stops unlocking the master key.
// ============================================================

export async function rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode(
  envelope:
    FinoraPortableBranchAuthEnvelopeV2,
  securityCode:
    string,
  newPassword:
    string,
): Promise<
  FinoraPortableBranchAuthPasswordRotationV2
> {
  validateFinoraPortableBranchAuthEnvelopeV2(
    envelope,
  );

  assertSecret(
    securityCode,
    "Security Code",
    SECURITY_CODE_MIN_LENGTH,
  );

  assertSecret(
    newPassword,
    "New Password",
    PASSWORD_MIN_LENGTH,
  );

  const recoveryDerived =
    await deriveFactor(
      securityCode,
      envelope.securityFactor,
    );

  if (
    !verifierMatches(
      recoveryDerived,
      envelope.securityFactor,
    )
  ) {
    recoveryDerived.fill(
      0,
    );

    throw new FinoraPortableBranchAuthV2CryptoError(
      "INVALID_CREDENTIALS",
      "Invalid Security Code.",
    );
  }

  const recoverySecretFactor =
    getSecretFactor(
      recoveryDerived,
    );

  const recoveryWrapKey =
    deriveWrapKey(
      recoverySecretFactor,
      RECOVERY_WRAP_DOMAIN,
    );

  let masterKey:
    Buffer | null =
    null;

  try {
    masterKey =
      unwrapMasterKey(
        envelope.recoveryWrap,
        recoveryWrapKey,
        buildWrapAad(
          envelope,
          "RECOVERY",
          envelope.securityFactor,
        ),
      );

    // Prove the recovered key decrypts the authoritative payload
    // before generating replacement Password material.
    decryptPayloadWithMasterKey(
      envelope,
      masterKey,
    );

    const passwordSalt =
      randomBytes(
        FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
      );

    const passwordFactorBase =
      createFactorMetadata(
        passwordSalt,
      );

    const passwordDerived =
      await deriveFactor(
        newPassword,
        passwordFactorBase,
      );

    try {
      const passwordVerifier =
        createVerifier(
          passwordFactorBase,
          passwordDerived,
        );

      const passwordSecretFactor =
        getSecretFactor(
          passwordDerived,
        );

      const passwordWrapKey =
        deriveWrapKey(
          passwordSecretFactor,
          PASSWORD_WRAP_DOMAIN,
        );

      try {
        const replacementEnvelope:
          FinoraPortableBranchAuthEnvelopeV2 =
          {
            ...structuredClone(
              envelope,
            ),

            passwordFactor:
              passwordVerifier,

            passwordWrap:
              createKeyWrap(
                masterKey,
                passwordWrapKey,
                FINORA_PORTABLE_BRANCH_AUTH_V2_PASSWORD_WRAP_KEY_DERIVATION,
                buildWrapAad(
                  envelope,
                  "PASSWORD",
                  passwordVerifier,
                ),
              ),
          };

        // Keep encrypted payload verifier metadata synchronized with
        // the outer envelope by re-encrypting the payload with the same
        // master key. The master key itself does not rotate.
        const currentPayload =
          decryptPayloadWithMasterKey(
            envelope,
            masterKey,
          );

        const replacementPayload:
          FinoraPortableBranchAuthPayloadV1 =
          {
            ...structuredClone(
              currentPayload,
            ),

            passwordVerifier,
          };

        validateFinoraPortableBranchAuthPayloadV1(
          replacementPayload,
        );

        const plaintext =
          Buffer.from(
            JSON.stringify(
              replacementPayload,
            ),
            "utf8",
          );

        try {
          const payloadEncrypted =
            encryptAesGcm(
              masterKey,
              plaintext,
              buildPayloadAad(
                replacementEnvelope,
              ),
            );

          replacementEnvelope.payloadEncryption =
            {
              algorithm:
                FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM,

              iv:
                payloadEncrypted.iv.toString(
                  "base64",
                ),

              authTag:
                payloadEncrypted.authTag.toString(
                  "base64",
                ),
            };

          replacementEnvelope.ciphertext =
            payloadEncrypted.ciphertext.toString(
              "base64",
            );

          validateFinoraPortableBranchAuthEnvelopeV2(
            replacementEnvelope,
          );

          return {
            envelope:
              replacementEnvelope,

            passwordVerifier,
          };
        }
        finally {
          plaintext.fill(
            0,
          );
        }
      }
      finally {
        passwordSecretFactor.fill(
          0,
        );

        passwordWrapKey.fill(
          0,
        );
      }
    }
    finally {
      passwordDerived.fill(
        0,
      );
    }
  }
  finally {
    recoveryDerived.fill(
      0,
    );

    recoverySecretFactor.fill(
      0,
    );

    recoveryWrapKey.fill(
      0,
    );

    masterKey?.fill(
      0,
    );
  }
}

// ============================================================
// SECURITY-CODE ROTATION
//
// Current password proves normal owner access.
// Payload remains protected by the same master key.
// ============================================================

export async function rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword(
  envelope:
    FinoraPortableBranchAuthEnvelopeV2,
  password:
    string,
  newSecurityCode:
    string,
): Promise<
  FinoraPortableBranchAuthRecoveryRotationV2
> {
  validateFinoraPortableBranchAuthEnvelopeV2(
    envelope,
  );

  assertSecret(
    password,
    "Password",
    PASSWORD_MIN_LENGTH,
  );

  assertSecret(
    newSecurityCode,
    "New Security Code",
    SECURITY_CODE_MIN_LENGTH,
  );

  const passwordDerived =
    await deriveFactor(
      password,
      envelope.passwordFactor,
    );

  if (
    !verifierMatches(
      passwordDerived,
      envelope.passwordFactor,
    )
  ) {
    passwordDerived.fill(
      0,
    );

    throw new FinoraPortableBranchAuthV2CryptoError(
      "INVALID_CREDENTIALS",
      "Invalid credentials.",
    );
  }

  const passwordSecretFactor =
    getSecretFactor(
      passwordDerived,
    );

  const passwordWrapKey =
    deriveWrapKey(
      passwordSecretFactor,
      PASSWORD_WRAP_DOMAIN,
    );

  let masterKey:
    Buffer | null =
    null;

  try {
    masterKey =
      unwrapMasterKey(
        envelope.passwordWrap,
        passwordWrapKey,
        buildWrapAad(
          envelope,
          "PASSWORD",
          envelope.passwordFactor,
        ),
      );

    const currentPayload =
      decryptPayloadWithMasterKey(
        envelope,
        masterKey,
      );

    const securitySalt =
      randomBytes(
        FINORA_PORTABLE_BRANCH_AUTH_SCRYPT_SALT_BYTES,
      );

    const securityFactorBase =
      createFactorMetadata(
        securitySalt,
      );

    const securityDerived =
      await deriveFactor(
        newSecurityCode,
        securityFactorBase,
      );

    try {
      const securityVerifier =
        createVerifier(
          securityFactorBase,
          securityDerived,
        );

      const securitySecretFactor =
        getSecretFactor(
          securityDerived,
        );

      const recoveryWrapKey =
        deriveWrapKey(
          securitySecretFactor,
          RECOVERY_WRAP_DOMAIN,
        );

      try {
        const replacementEnvelope:
          FinoraPortableBranchAuthEnvelopeV2 =
          {
            ...structuredClone(
              envelope,
            ),

            securityFactor:
              securityVerifier,

            recoveryWrap:
              createKeyWrap(
                masterKey,
                recoveryWrapKey,
                FINORA_PORTABLE_BRANCH_AUTH_V2_RECOVERY_WRAP_KEY_DERIVATION,
                buildWrapAad(
                  envelope,
                  "RECOVERY",
                  securityVerifier,
                ),
              ),
          };

        const replacementPayload:
          FinoraPortableBranchAuthPayloadV1 =
          {
            ...structuredClone(
              currentPayload,
            ),

            securityVerifier,
          };

        validateFinoraPortableBranchAuthPayloadV1(
          replacementPayload,
        );

        const plaintext =
          Buffer.from(
            JSON.stringify(
              replacementPayload,
            ),
            "utf8",
          );

        try {
          const payloadEncrypted =
            encryptAesGcm(
              masterKey,
              plaintext,
              buildPayloadAad(
                replacementEnvelope,
              ),
            );

          replacementEnvelope.payloadEncryption =
            {
              algorithm:
                FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_ALGORITHM,

              iv:
                payloadEncrypted.iv.toString(
                  "base64",
                ),

              authTag:
                payloadEncrypted.authTag.toString(
                  "base64",
                ),
            };

          replacementEnvelope.ciphertext =
            payloadEncrypted.ciphertext.toString(
              "base64",
            );

          validateFinoraPortableBranchAuthEnvelopeV2(
            replacementEnvelope,
          );

          return {
            envelope:
              replacementEnvelope,

            securityVerifier,
          };
        }
        finally {
          plaintext.fill(
            0,
          );
        }
      }
      finally {
        securitySecretFactor.fill(
          0,
        );

        recoveryWrapKey.fill(
          0,
        );
      }
    }
    finally {
      securityDerived.fill(
        0,
      );
    }
  }
  finally {
    passwordDerived.fill(
      0,
    );

    passwordSecretFactor.fill(
      0,
    );

    passwordWrapKey.fill(
      0,
    );

    masterKey?.fill(
      0,
    );
  }
}