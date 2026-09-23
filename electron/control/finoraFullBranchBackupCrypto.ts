// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2 SNAPSHOT CRYPTO
// ============================================================
//
// Password and Security Code are independently derived with
// SCRYPT and combined into one AES-256-GCM encryption key.
//
// The exact branch/storage/auth-generation binding is supplied
// as authenticated additional data (AAD).
//
// Password and Security Code are never persisted.
// ============================================================

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
} from "node:crypto";

import {
  Buffer,
} from "node:buffer";

import type {
  FinoraFullBranchBackupBindingV2,
  FinoraFullBranchBackupEncryptedRealSnapshotV2,
  FinoraFullBranchBackupEncryptedRuntimeAuthorityV2,
  FinoraFullBranchBackupKdfV2,
} from "./finoraFullBranchBackupContract.js";

import {
  buildFinoraFullBranchBackupAadV2,
  validateFinoraFullBranchBackupEncryptedRealSnapshotV2,
  validateFinoraFullBranchBackupEncryptedRuntimeAuthorityV2,
} from "./finoraFullBranchBackupContract.js";

const SCRYPT_N =
  32768 as const;

const SCRYPT_R =
  8 as const;

const SCRYPT_P =
  1 as const;

const KEY_LENGTH =
  32 as const;

const SALT_BYTES =
  16;

const IV_BYTES =
  12;

const AUTH_TAG_BYTES =
  16;

const SCRYPT_MAX_MEMORY =
  128 * 1024 * 1024;

const KEY_CONTEXT =
  "FINORA_FULL_BRANCH_BACKUP_V2_REAL_SNAPSHOT";

export type FinoraFullBranchBackupCryptoErrorCode =
  | "INVALID_INPUT"
  | "AUTHENTICATION_FAILED";

export class FinoraFullBranchBackupCryptoError
  extends Error {
  readonly code:
    FinoraFullBranchBackupCryptoErrorCode;

  constructor(
    code:
      FinoraFullBranchBackupCryptoErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraFullBranchBackupCryptoError";

    this.code =
      code;
  }
}

function assertSecret(
  value:
    string,
  label:
    string,
): void {
  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    value.trim().length ===
      0 ||
    value.length >
      1024
  ) {
    throw new FinoraFullBranchBackupCryptoError(
      "INVALID_INPUT",
      `${label} is invalid.`,
    );
  }
}

function deriveFactor(
  secret:
    string,
  salt:
    Buffer,
): Promise<Buffer> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      scrypt(
        secret,
        salt,
        KEY_LENGTH,
        {
          N:
            SCRYPT_N,

          r:
            SCRYPT_R,

          p:
            SCRYPT_P,

          maxmem:
            SCRYPT_MAX_MEMORY,
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

function buildCombinedKey(
  passwordFactor:
    Buffer,
  securityFactor:
    Buffer,
): Buffer {
  return createHash(
    "sha256",
  )
    .update(
      KEY_CONTEXT,
      "utf8",
    )
    .update(
      Buffer.from([
        0,
      ]),
    )
    .update(
      passwordFactor,
    )
    .update(
      securityFactor,
    )
    .digest();
}

function createKdf(
  salt:
    Buffer,
): FinoraFullBranchBackupKdfV2 {
  return {
    algorithm:
      "SCRYPT",

    salt:
      salt.toString(
        "base64",
      ),

    N:
      SCRYPT_N,

    r:
      SCRYPT_R,

    p:
      SCRYPT_P,

    keyLength:
      KEY_LENGTH,
  };
}

export async function encryptFinoraFullBranchRealSnapshotV2(
  input: {
    serializedSnapshot:
      string;

    password:
      string;

    securityCode:
      string;

    binding:
      FinoraFullBranchBackupBindingV2;
  },
): Promise<FinoraFullBranchBackupEncryptedRealSnapshotV2> {
  assertSecret(
    input.password,
    "Password",
  );

  assertSecret(
    input.securityCode,
    "Security Code",
  );

  if (
    typeof input.serializedSnapshot !==
      "string" ||
    input.serializedSnapshot.length ===
      0
  ) {
    throw new FinoraFullBranchBackupCryptoError(
      "INVALID_INPUT",
      "FINORA REAL snapshot is empty.",
    );
  }

  const passwordSalt =
    randomBytes(
      SALT_BYTES,
    );

  const securitySalt =
    randomBytes(
      SALT_BYTES,
    );

  const iv =
    randomBytes(
      IV_BYTES,
    );

  const [
    passwordFactor,
    securityFactor,
  ] =
    await Promise.all([
      deriveFactor(
        input.password,
        passwordSalt,
      ),

      deriveFactor(
        input.securityCode,
        securitySalt,
      ),
    ]);

  const key =
    buildCombinedKey(
      passwordFactor,
      securityFactor,
    );

  try {
    const cipher =
      createCipheriv(
        "aes-256-gcm",
        key,
        iv,
        {
          authTagLength:
            AUTH_TAG_BYTES,
        },
      );

    const aad =
      Buffer.from(
        buildFinoraFullBranchBackupAadV2(
          input.binding,
        ),
        "utf8",
      );

    cipher.setAAD(
      aad,
    );

    const ciphertext =
      Buffer.concat([
        cipher.update(
          input.serializedSnapshot,
          "utf8",
        ),

        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    const output:
      FinoraFullBranchBackupEncryptedRealSnapshotV2 =
      {
        algorithm:
          "AES-256-GCM",

        passwordKdf:
          createKdf(
            passwordSalt,
          ),

        securityKdf:
          createKdf(
            securitySalt,
          ),

        iv:
          iv.toString(
            "base64",
          ),

        authTag:
          authTag.toString(
            "base64",
          ),

        ciphertext:
          ciphertext.toString(
            "base64",
          ),
      };

    validateFinoraFullBranchBackupEncryptedRealSnapshotV2(
      output,
    );

    return output;
  }
  finally {
    passwordFactor.fill(
      0,
    );

    securityFactor.fill(
      0,
    );

    key.fill(
      0,
    );

    passwordSalt.fill(
      0,
    );

    securitySalt.fill(
      0,
    );
  }
}

export async function decryptFinoraFullBranchRealSnapshotV2(
  input: {
    encryptedSnapshot:
      FinoraFullBranchBackupEncryptedRealSnapshotV2;

    password:
      string;

    securityCode:
      string;

    binding:
      FinoraFullBranchBackupBindingV2;
  },
): Promise<string> {
  assertSecret(
    input.password,
    "Password",
  );

  assertSecret(
    input.securityCode,
    "Security Code",
  );

  validateFinoraFullBranchBackupEncryptedRealSnapshotV2(
    input.encryptedSnapshot,
  );

  const passwordSalt =
    Buffer.from(
      input.encryptedSnapshot.passwordKdf.salt,
      "base64",
    );

  const securitySalt =
    Buffer.from(
      input.encryptedSnapshot.securityKdf.salt,
      "base64",
    );

  const [
    passwordFactor,
    securityFactor,
  ] =
    await Promise.all([
      deriveFactor(
        input.password,
        passwordSalt,
      ),

      deriveFactor(
        input.securityCode,
        securitySalt,
      ),
    ]);

  const key =
    buildCombinedKey(
      passwordFactor,
      securityFactor,
    );

  try {
    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(
          input.encryptedSnapshot.iv,
          "base64",
        ),
        {
          authTagLength:
            AUTH_TAG_BYTES,
        },
      );

    decipher.setAAD(
      Buffer.from(
        buildFinoraFullBranchBackupAadV2(
          input.binding,
        ),
        "utf8",
      ),
    );

    decipher.setAuthTag(
      Buffer.from(
        input.encryptedSnapshot.authTag,
        "base64",
      ),
    );

    const plaintext =
      Buffer.concat([
        decipher.update(
          Buffer.from(
            input.encryptedSnapshot.ciphertext,
            "base64",
          ),
        ),

        decipher.final(),
      ]);

    return plaintext.toString(
      "utf8",
    );
  }
  catch {
    throw new FinoraFullBranchBackupCryptoError(
      "AUTHENTICATION_FAILED",
      "FINORA Full Branch Backup authentication failed.",
    );
  }
  finally {
    passwordFactor.fill(
      0,
    );

    securityFactor.fill(
      0,
    );

    key.fill(
      0,
    );

    passwordSalt.fill(
      0,
    );

    securitySalt.fill(
      0,
    );
  }
}

// ============================================================
// ENCRYPTED FRESH-DEVICE RUNTIME AUTHORITY
//
// IMPORTANT:
//
// - Uses the same Password + Security Code factor policy as the
//   encrypted REAL snapshot.
// - Uses independent salts and IV.
// - Uses a distinct AAD domain so REAL snapshot ciphertext and
//   Runtime Authority ciphertext cannot be interchanged.
// ============================================================

const FINORA_FULL_BRANCH_RUNTIME_AUTHORITY_AAD_DOMAIN =
  "FINORA_FULL_BRANCH_RUNTIME_AUTHORITY_V2";

function buildFinoraFullBranchRuntimeAuthorityAadV2(
  binding:
    FinoraFullBranchBackupBindingV2,
): string {
  return (
    FINORA_FULL_BRANCH_RUNTIME_AUTHORITY_AAD_DOMAIN +
    "\u0000" +
    buildFinoraFullBranchBackupAadV2(
      binding,
    )
  );
}

export async function encryptFinoraFullBranchRuntimeAuthorityV2(
  input: {
    serializedRuntimeAuthority:
      string;

    password:
      string;

    securityCode:
      string;

    binding:
      FinoraFullBranchBackupBindingV2;
  },
): Promise<FinoraFullBranchBackupEncryptedRuntimeAuthorityV2> {
  assertSecret(
    input.password,
    "Password",
  );

  assertSecret(
    input.securityCode,
    "Security Code",
  );

  if (
    typeof input.serializedRuntimeAuthority !==
      "string" ||
    input.serializedRuntimeAuthority.length ===
      0
  ) {
    throw new FinoraFullBranchBackupCryptoError(
      "INVALID_INPUT",
      "FINORA Runtime Authority is empty.",
    );
  }

  const passwordSalt =
    randomBytes(
      SALT_BYTES,
    );

  const securitySalt =
    randomBytes(
      SALT_BYTES,
    );

  const iv =
    randomBytes(
      IV_BYTES,
    );

  const [
    passwordFactor,
    securityFactor,
  ] =
    await Promise.all([
      deriveFactor(
        input.password,
        passwordSalt,
      ),

      deriveFactor(
        input.securityCode,
        securitySalt,
      ),
    ]);

  const key =
    buildCombinedKey(
      passwordFactor,
      securityFactor,
    );

  try {
    const cipher =
      createCipheriv(
        "aes-256-gcm",
        key,
        iv,
        {
          authTagLength:
            AUTH_TAG_BYTES,
        },
      );

    cipher.setAAD(
      Buffer.from(
        buildFinoraFullBranchRuntimeAuthorityAadV2(
          input.binding,
        ),
        "utf8",
      ),
    );

    const ciphertext =
      Buffer.concat([
        cipher.update(
          input.serializedRuntimeAuthority,
          "utf8",
        ),

        cipher.final(),
      ]);

    const authTag =
      cipher.getAuthTag();

    const output:
      FinoraFullBranchBackupEncryptedRuntimeAuthorityV2 =
      {
        purpose:
          "RUNTIME_AUTHORITY",

        algorithm:
          "AES-256-GCM",

        passwordKdf:
          createKdf(
            passwordSalt,
          ),

        securityKdf:
          createKdf(
            securitySalt,
          ),

        iv:
          iv.toString(
            "base64",
          ),

        authTag:
          authTag.toString(
            "base64",
          ),

        ciphertext:
          ciphertext.toString(
            "base64",
          ),
      };

    validateFinoraFullBranchBackupEncryptedRuntimeAuthorityV2(
      output,
    );

    return output;
  }
  finally {
    passwordFactor.fill(
      0,
    );

    securityFactor.fill(
      0,
    );

    key.fill(
      0,
    );

    passwordSalt.fill(
      0,
    );

    securitySalt.fill(
      0,
    );
  }
}

export async function decryptFinoraFullBranchRuntimeAuthorityV2(
  input: {
    encryptedRuntimeAuthority:
      FinoraFullBranchBackupEncryptedRuntimeAuthorityV2;

    password:
      string;

    securityCode:
      string;

    binding:
      FinoraFullBranchBackupBindingV2;
  },
): Promise<string> {
  assertSecret(
    input.password,
    "Password",
  );

  assertSecret(
    input.securityCode,
    "Security Code",
  );

  validateFinoraFullBranchBackupEncryptedRuntimeAuthorityV2(
    input.encryptedRuntimeAuthority,
  );

  const passwordSalt =
    Buffer.from(
      input.encryptedRuntimeAuthority.passwordKdf.salt,
      "base64",
    );

  const securitySalt =
    Buffer.from(
      input.encryptedRuntimeAuthority.securityKdf.salt,
      "base64",
    );

  const [
    passwordFactor,
    securityFactor,
  ] =
    await Promise.all([
      deriveFactor(
        input.password,
        passwordSalt,
      ),

      deriveFactor(
        input.securityCode,
        securitySalt,
      ),
    ]);

  const key =
    buildCombinedKey(
      passwordFactor,
      securityFactor,
    );

  try {
    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(
          input.encryptedRuntimeAuthority.iv,
          "base64",
        ),
        {
          authTagLength:
            AUTH_TAG_BYTES,
        },
      );

    decipher.setAAD(
      Buffer.from(
        buildFinoraFullBranchRuntimeAuthorityAadV2(
          input.binding,
        ),
        "utf8",
      ),
    );

    decipher.setAuthTag(
      Buffer.from(
        input.encryptedRuntimeAuthority.authTag,
        "base64",
      ),
    );

    const plaintext =
      Buffer.concat([
        decipher.update(
          Buffer.from(
            input.encryptedRuntimeAuthority.ciphertext,
            "base64",
          ),
        ),

        decipher.final(),
      ]);

    return plaintext.toString(
      "utf8",
    );
  }
  catch {
    throw new FinoraFullBranchBackupCryptoError(
      "AUTHENTICATION_FAILED",
      "FINORA Full Branch Backup Runtime Authority authentication failed.",
    );
  }
  finally {
    passwordFactor.fill(
      0,
    );

    securityFactor.fill(
      0,
    );

    key.fill(
      0,
    );

    passwordSalt.fill(
      0,
    );

    securitySalt.fill(
      0,
    );
  }
}
