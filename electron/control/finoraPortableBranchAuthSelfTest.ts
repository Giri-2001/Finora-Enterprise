// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CRYPTO SELF-TEST
// VERSION : 1.0
// STATUS  : Executable Proof
// ============================================================

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  Buffer,
} from "node:buffer";

import {
  parseFinoraPortableBranchAuthEnvelopeV1,
  serializeFinoraPortableBranchAuthEnvelopeV1,
  validateFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FinoraPortableBranchAuthCryptoError,
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
  verifyFinoraPortableBranchAuthPassword,
} from "./finoraPortableBranchAuthCrypto.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

// ============================================================
// FIXTURES
// ============================================================

const PASSWORD =
  "admin123";

const WRONG_PASSWORD =
  "wrongpass";

const SECURITY_CODE =
  "branch-sec-9876";

const WRONG_SECURITY_CODE =
  "wrong-sec-9876";

const OWNER_ID =
  "OWNER-TEST-000001";

const BUSINESS_ID =
  "BUSINESS-TEST-000001";

const BRANCH_ID =
  "BRANCH-TEST-000001";

const CANONICAL_USERNAME =
  "admin";

const CREATED_AT =
  "2026-09-11T12:00:00.000Z";

const UPDATED_AT =
  "2026-09-11T12:00:01.000Z";

// ============================================================
// ASSERTION HELPERS
// ============================================================

function assertTrue(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      `FAIL: ${message}`,
    );
  }
}

function cloneEnvelope(
  envelope:
    FinoraPortableBranchAuthEnvelopeV1,
): FinoraPortableBranchAuthEnvelopeV1 {
  return JSON.parse(
    JSON.stringify(
      envelope,
    ),
  ) as FinoraPortableBranchAuthEnvelopeV1;
}

function tamperBase64Byte(
  value:
    string,
): string {
  const bytes =
    Buffer.from(
      value,
      "base64",
    );

  assertTrue(
    bytes.length > 0,
    "Tamper helper requires non-empty bytes.",
  );

  bytes[0] =
    bytes[0] ^ 0x01;

  return bytes.toString(
    "base64",
  );
}

async function expectCryptoError(
  label:
    string,
  expectedCode:
    "INVALID_CREDENTIALS" |
    "AUTHENTICATION_FAILED" |
    "INVALID_INPUT",
  action:
    () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
  }
  catch (
    error
  ) {
    assertTrue(
      error instanceof
        FinoraPortableBranchAuthCryptoError,
      `${label}: unexpected error type.`,
    );

    assertTrue(
      error.code ===
        expectedCode,
      `${label}: expected ${expectedCode}, got ${error.code}.`,
    );

    console.log(
      `PASS: ${label}`,
    );

    return;
  }

  throw new Error(
    `FAIL: ${label}: expected rejection.`,
  );
}

function expectSyncFailure(
  label:
    string,
  action:
    () => unknown,
): void {
  try {
    action();
  }
  catch {
    console.log(
      `PASS: ${label}`,
    );

    return;
  }

  throw new Error(
    `FAIL: ${label}: expected rejection.`,
  );
}

// ============================================================
// MAIN EXECUTABLE PROOF
// ============================================================

async function main(): Promise<void> {
  console.log(
    "===== PHASE 5.6E3D1B PORTABLE AUTH CRYPTO EXECUTABLE PROOF =====",
  );

  const envelope =
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "PORTABLE-AUTH-STATE-000001",

      sourceAuthorizationId:
        "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

      sourceAuthorizationVerificationEvidence:
        createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
        ),

      ownerId:
        OWNER_ID,

      businessId:
        BUSINESS_ID,

      branchId:
        BRANCH_ID,

      userId:
        "USER-TEST-000001",

      username:
        "Admin",

      fullName:
        "FINORA Test Owner",

      role:
        "OWNER",

      dataContext:
        "REAL",

      storageMode:
        "USB",

      authGeneration:
        1,

      createdAt:
        CREATED_AT,

      updatedAt:
        UPDATED_AT,

      password:
        PASSWORD,

      securityCode:
        SECURITY_CODE,
    });

  validateFinoraPortableBranchAuthEnvelopeV1(
    envelope,
  );

  console.log(
    "PASS: valid portable auth envelope created and strictly validated",
  );

  assertTrue(
    envelope.canonicalUsername ===
      CANONICAL_USERNAME,
    "Username was not canonicalized.",
  );

  console.log(
    "PASS: canonical username normalized",
  );

  assertTrue(
    envelope.passwordFactor.salt !==
      envelope.securityFactor.salt,
    "Password and Security Code salts must be independent.",
  );

  console.log(
    "PASS: password and Security Code use independent SCRYPT salts",
  );

  assertTrue(
    !Object.prototype.hasOwnProperty.call(
      envelope.securityFactor,
      "verifier",
    ),
    "Security verifier must not be exposed in outer envelope.",
  );

  console.log(
    "PASS: outer Security Code factor exposes KDF metadata only",
  );

  const serialized =
    serializeFinoraPortableBranchAuthEnvelopeV1(
      envelope,
    );

  assertTrue(
    !serialized.includes(
      PASSWORD,
    ),
    "Serialized envelope contains plaintext password.",
  );

  assertTrue(
    !serialized.includes(
      SECURITY_CODE,
    ),
    "Serialized envelope contains plaintext Security Code.",
  );

  assertTrue(
    !serialized.includes(
      '"privateKey"',
    ),
    "Serialized envelope contains private device key field.",
  );

  assertTrue(
    !serialized.includes(
      '"installationId"',
    ),
    "Serialized envelope contains device installation identity.",
  );

  console.log(
    "PASS: serialized envelope contains no plaintext secrets or private device identity",
  );

  const parsedEnvelope =
    parseFinoraPortableBranchAuthEnvelopeV1(
      serialized,
    );

  assertTrue(
    JSON.stringify(
      parsedEnvelope,
    ) ===
      JSON.stringify(
        envelope,
      ),
    "Envelope serialization roundtrip changed data.",
  );

  console.log(
    "PASS: strict envelope serialization roundtrip",
  );

  const correctPassword =
    await verifyFinoraPortableBranchAuthPassword(
      envelope,
      PASSWORD,
    );

  assertTrue(
    correctPassword,
    "Correct password was rejected.",
  );

  console.log(
    "PASS: correct password validates before Security Code",
  );

  const wrongPassword =
    await verifyFinoraPortableBranchAuthPassword(
      envelope,
      WRONG_PASSWORD,
    );

  assertTrue(
    wrongPassword === false,
    "Wrong password was accepted.",
  );

  console.log(
    "PASS: wrong password rejected",
  );

  await expectCryptoError(
    "wrong password fails before malformed Security Code is evaluated",
    "INVALID_CREDENTIALS",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        envelope,
        WRONG_PASSWORD,
        "x",
      ),
  );

  const payload =
    await decryptFinoraPortableBranchAuthEnvelopeV1(
      envelope,
      PASSWORD,
      SECURITY_CODE,
      {
        expectedScope:
          {
            ownerId:
              OWNER_ID,

            businessId:
              BUSINESS_ID,

            branchId:
              BRANCH_ID,
          },
      },
    );

  assertTrue(
    payload.ownerId ===
      OWNER_ID &&
    payload.businessId ===
      BUSINESS_ID &&
    payload.branchId ===
      BRANCH_ID,
    "Decrypted branch scope does not match.",
  );

  assertTrue(
    payload.canonicalUsername ===
      CANONICAL_USERNAME,
    "Decrypted canonical username does not match.",
  );

  assertTrue(
    payload.passwordVerifier.salt ===
      envelope.passwordFactor.salt,
    "Authoritative password verifier metadata does not match outer factor.",
  );

  assertTrue(
    payload.securityVerifier.salt ===
      envelope.securityFactor.salt,
    "Authoritative Security Code verifier metadata does not match outer factor.",
  );

  assertTrue(
    payload.passwordVerifier.salt !==
      payload.securityVerifier.salt,
    "Inner password and Security Code verifier salts are not independent.",
  );

  console.log(
    "PASS: correct Password + Security Code decrypt authoritative payload",
  );

  await expectCryptoError(
    "wrong Security Code rejected",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        envelope,
        PASSWORD,
        WRONG_SECURITY_CODE,
      ),
  );

  await expectCryptoError(
    "wrong expected branch scope rejected",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        envelope,
        PASSWORD,
        SECURITY_CODE,
        {
          expectedScope:
            {
              ownerId:
                OWNER_ID,

              businessId:
                BUSINESS_ID,

              branchId:
                "BRANCH-OTHER-000001",
            },
        },
      ),
  );

  const ciphertextTampered =
    cloneEnvelope(
      envelope,
    );

  ciphertextTampered.ciphertext =
    tamperBase64Byte(
      ciphertextTampered.ciphertext,
    );

  validateFinoraPortableBranchAuthEnvelopeV1(
    ciphertextTampered,
  );

  await expectCryptoError(
    "ciphertext tamper rejected by AES-GCM",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        ciphertextTampered,
        PASSWORD,
        SECURITY_CODE,
      ),
  );

  const tagTampered =
    cloneEnvelope(
      envelope,
    );

  tagTampered.encryption.authTag =
    tamperBase64Byte(
      tagTampered.encryption.authTag,
    );

  validateFinoraPortableBranchAuthEnvelopeV1(
    tagTampered,
  );

  await expectCryptoError(
    "authentication tag tamper rejected",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        tagTampered,
        PASSWORD,
        SECURITY_CODE,
      ),
  );

  const ivTampered =
    cloneEnvelope(
      envelope,
    );

  ivTampered.encryption.iv =
    tamperBase64Byte(
      ivTampered.encryption.iv,
    );

  validateFinoraPortableBranchAuthEnvelopeV1(
    ivTampered,
  );

  await expectCryptoError(
    "AES-GCM IV tamper rejected",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        ivTampered,
        PASSWORD,
        SECURITY_CODE,
      ),
  );

  const scopeMetadataTampered =
    cloneEnvelope(
      envelope,
    );

  scopeMetadataTampered.branchScope.branchId =
    "BRANCH-TAMPERED-000001";

  validateFinoraPortableBranchAuthEnvelopeV1(
    scopeMetadataTampered,
  );

  await expectCryptoError(
    "authenticated branch metadata tamper rejected",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        scopeMetadataTampered,
        PASSWORD,
        SECURITY_CODE,
      ),
  );

  const usernameMetadataTampered =
    cloneEnvelope(
      envelope,
    );

  usernameMetadataTampered.canonicalUsername =
    "other-admin";

  validateFinoraPortableBranchAuthEnvelopeV1(
    usernameMetadataTampered,
  );

  await expectCryptoError(
    "authenticated canonical username metadata tamper rejected",
    "AUTHENTICATION_FAILED",
    () =>
      decryptFinoraPortableBranchAuthEnvelopeV1(
        usernameMetadataTampered,
        PASSWORD,
        SECURITY_CODE,
      ),
  );

  const passwordVerifierTampered =
    cloneEnvelope(
      envelope,
    );

  passwordVerifierTampered.passwordFactor.verifier =
    tamperBase64Byte(
      passwordVerifierTampered.passwordFactor.verifier,
    );

  validateFinoraPortableBranchAuthEnvelopeV1(
    passwordVerifierTampered,
  );

  const tamperedPasswordValid =
    await verifyFinoraPortableBranchAuthPassword(
      passwordVerifierTampered,
      PASSWORD,
    );

  assertTrue(
    tamperedPasswordValid ===
      false,
    "Tampered password verifier was accepted.",
  );

  console.log(
    "PASS: tampered outer password verifier rejected",
  );

  const unsupportedVersion =
    JSON.parse(
      serialized,
    ) as Record<string, unknown>;

  unsupportedVersion.schemaVersion =
    2;

  expectSyncFailure(
    "unsupported outer schemaVersion rejected",
    () =>
      parseFinoraPortableBranchAuthEnvelopeV1(
        JSON.stringify(
          unsupportedVersion,
        ),
      ),
  );

  const extraFieldEnvelope =
    JSON.parse(
      serialized,
    ) as Record<string, unknown>;

  extraFieldEnvelope.unexpectedField =
    "NOT_ALLOWED";

  expectSyncFailure(
    "unexpected outer envelope field rejected",
    () =>
      parseFinoraPortableBranchAuthEnvelopeV1(
        JSON.stringify(
          extraFieldEnvelope,
        ),
      ),
  );

  const malformedSaltEnvelope =
    cloneEnvelope(
      envelope,
    );

  malformedSaltEnvelope.securityFactor.salt =
    Buffer.alloc(
      15,
      1,
    ).toString(
      "base64",
    );

  expectSyncFailure(
    "malformed Security Code SCRYPT salt rejected",
    () =>
      validateFinoraPortableBranchAuthEnvelopeV1(
        malformedSaltEnvelope,
      ),
  );

  const nonCanonicalUsernameEnvelope =
    cloneEnvelope(
      envelope,
    );

  nonCanonicalUsernameEnvelope.canonicalUsername =
    "Admin";

  expectSyncFailure(
    "non-canonical outer username rejected",
    () =>
      validateFinoraPortableBranchAuthEnvelopeV1(
        nonCanonicalUsernameEnvelope,
      ),
  );

  console.log(
    "",
  );

  console.log(
    "PASS: PHASE 5.6E3D1B PORTABLE BRANCH AUTH CRYPTO EXECUTABLE PROOF",
  );
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      "",
    );

    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);

// ============================================================
// END
// ============================================================