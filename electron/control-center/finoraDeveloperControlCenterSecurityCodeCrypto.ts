/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER SECURITY CODE CRYPTO

   RESPONSIBILITY:
   - Define the Developer Security Code policy.
   - Create a salted SCRYPT verifier.
   - Verify a candidate Security Code in constant time.
   - Validate persisted verifier structure.

   SECURITY:
   - Plaintext Security Code is ephemeral input only.
   - Plaintext Security Code is never returned or persisted here.
   - Fresh random salt is generated for every new verifier.
   - Verification uses timingSafeEqual.
   - This module has no filesystem authority.
   - This module has no Electron persistence authority.
   - This module has no Control Center signing authority.
   ============================================================ */

import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

export const
  FINORA_DEVELOPER_SECURITY_CODE_MIN_LENGTH =
    10 as const;

export const
  FINORA_DEVELOPER_SECURITY_CODE_MAX_LENGTH =
    20 as const;

export const
  FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_N =
    32768 as const;

export const
  FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_R =
    8 as const;

export const
  FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_P =
    1 as const;

export const
  FINORA_DEVELOPER_SECURITY_CODE_SALT_BYTES =
    16 as const;

export const
  FINORA_DEVELOPER_SECURITY_CODE_VERIFIER_BYTES =
    32 as const;

const FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_MAXMEM =
  128 * 1024 * 1024;

export interface FinoraDeveloperSecurityCodeVerifierV1 {
  algorithm:
    "SCRYPT";

  saltEncoding:
    "BASE64";

  verifierEncoding:
    "BASE64";

  salt:
    string;

  verifier:
    string;

  N:
    typeof FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_N;

  r:
    typeof FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_R;

  p:
    typeof FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_P;

  keyLength:
    typeof FINORA_DEVELOPER_SECURITY_CODE_VERIFIER_BYTES;
}

function isCanonicalBase64(
  value:
    string,
  expectedBytes:
    number,
): boolean {

  if (
    value.length ===
    0
  ) {
    return false;
  }

  let decoded:
    Buffer;

  try {
    decoded =
      Buffer.from(
        value,
        "base64",
      );
  } catch {
    return false;
  }

  return (
    decoded.length ===
      expectedBytes &&
    decoded.toString(
      "base64",
    ) ===
      value
  );
}

export function
isFinoraDeveloperSecurityCodeAllowed(
  securityCode:
    string,
): boolean {

  const length =
    Array.from(
      securityCode,
    ).length;

  return (
    length >=
      FINORA_DEVELOPER_SECURITY_CODE_MIN_LENGTH &&
    length <=
      FINORA_DEVELOPER_SECURITY_CODE_MAX_LENGTH &&
    securityCode.trim().length >
      0
  );
}

export function
validateFinoraDeveloperSecurityCode(
  securityCode:
    string,
): void {

  if (
    !isFinoraDeveloperSecurityCodeAllowed(
      securityCode,
    )
  ) {
    throw new Error(
      `FINORA Developer Security Code must contain between ${FINORA_DEVELOPER_SECURITY_CODE_MIN_LENGTH} and ${FINORA_DEVELOPER_SECURITY_CODE_MAX_LENGTH} characters and cannot be whitespace-only.`,
    );
  }
}

export function
validateFinoraDeveloperSecurityCodeVerifierV1(
  value:
    unknown,
): asserts value is FinoraDeveloperSecurityCodeVerifierV1 {

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
      "FINORA Developer Security Code verifier is invalid.",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  const expectedKeys =
    [
      "N",
      "algorithm",
      "keyLength",
      "p",
      "r",
      "salt",
      "saltEncoding",
      "verifier",
      "verifierEncoding",
    ].sort();

  const actualKeys =
    Object.keys(
      record,
    ).sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    !actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
        expectedKeys[index],
    )
  ) {
    throw new Error(
      "FINORA Developer Security Code verifier contains unsupported fields.",
    );
  }

  if (
    record.algorithm !==
      "SCRYPT" ||
    record.saltEncoding !==
      "BASE64" ||
    record.verifierEncoding !==
      "BASE64" ||
    record.N !==
      FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_N ||
    record.r !==
      FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_R ||
    record.p !==
      FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_P ||
    record.keyLength !==
      FINORA_DEVELOPER_SECURITY_CODE_VERIFIER_BYTES ||
    typeof record.salt !==
      "string" ||
    typeof record.verifier !==
      "string" ||
    !isCanonicalBase64(
      record.salt,
      FINORA_DEVELOPER_SECURITY_CODE_SALT_BYTES,
    ) ||
    !isCanonicalBase64(
      record.verifier,
      FINORA_DEVELOPER_SECURITY_CODE_VERIFIER_BYTES,
    )
  ) {
    throw new Error(
      "FINORA Developer Security Code verifier parameters are invalid.",
    );
  }
}

function deriveFinoraDeveloperSecurityCodeKey(
  securityCode:
    string,
  salt:
    Buffer,
): Promise<
  Buffer
> {

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      nodeScrypt(
        securityCode,
        salt,
        FINORA_DEVELOPER_SECURITY_CODE_VERIFIER_BYTES,
        {
          N:
            FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_N,

          r:
            FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_R,

          p:
            FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_P,

          maxmem:
            FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_MAXMEM,
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
            derivedKey,
          );
        },
      );
    },
  );
}

export async function
createFinoraDeveloperSecurityCodeVerifier(
  securityCode:
    string,
): Promise<
  FinoraDeveloperSecurityCodeVerifierV1
> {

  validateFinoraDeveloperSecurityCode(
    securityCode,
  );

  const salt =
    randomBytes(
      FINORA_DEVELOPER_SECURITY_CODE_SALT_BYTES,
    );

  const derivedKey =
    await deriveFinoraDeveloperSecurityCodeKey(
      securityCode,
      salt,
    );

  return {
    algorithm:
      "SCRYPT",

    saltEncoding:
      "BASE64",

    verifierEncoding:
      "BASE64",

    salt:
      salt.toString(
        "base64",
      ),

    verifier:
      derivedKey.toString(
        "base64",
      ),

    N:
      FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_N,

    r:
      FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_R,

    p:
      FINORA_DEVELOPER_SECURITY_CODE_SCRYPT_P,

    keyLength:
      FINORA_DEVELOPER_SECURITY_CODE_VERIFIER_BYTES,
  };
}

export async function
verifyFinoraDeveloperSecurityCode(
  securityCode:
    string,
  verifier:
    FinoraDeveloperSecurityCodeVerifierV1,
): Promise<
  boolean
> {

  validateFinoraDeveloperSecurityCodeVerifierV1(
    verifier,
  );

  if (
    !isFinoraDeveloperSecurityCodeAllowed(
      securityCode,
    )
  ) {
    return false;
  }

  const salt =
    Buffer.from(
      verifier.salt,
      "base64",
    );

  const expected =
    Buffer.from(
      verifier.verifier,
      "base64",
    );

  const actual =
    await deriveFinoraDeveloperSecurityCodeKey(
      securityCode,
      salt,
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
