/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT RECOVERY SELF-TEST

   PURPOSE:

   - Prove expired first-import response is rejected
   - Prove the same expired response can be cryptographically
     reverified through the protected recovery verifier
   - Prove exact accepted-response latch comparison succeeds
   - Prove a different valid signed response cannot take over
   - Prove bad signature still fails
   - Prove wrong independently supplied Control Center
     fingerprint still fails

   IMPORTANT:

   - Executable proof only.
   - No safeStorage mutation.
   - No pending-enrollment mutation.
   - No recipient-trust mutation.
   - No Control Store mutation.
=========================================================== */

import {
  app,
} from "electron";

import {
  generateKeyPairSync,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,
} from "./finoraInstallationEnrollmentResponse.types.js";

import type {
  FinoraInstallationEnrollmentResponseFile,
  FinoraSignedInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponse.types.js";

import {
  createFinoraInstallationBindingFingerprint,
  generateFinoraWindowsInstallationBindingMaterial,
  toFinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

import {
  createFinoraVerifiedInstallationEnrollmentResponseDigest,
  isExactFinoraVerifiedInstallationEnrollmentAcceptedResponse,
  verifyFinoraInstallationEnrollmentResponseFile,
  verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery,
} from "./finoraInstallationEnrollmentResponseVerifier.js";

// ============================================================
// ASSERT
// ============================================================

function assertSelfTest(
  condition:
    boolean,
  message:
    string,
): asserts condition {

  if (!condition) {
    throw new Error(
      `SELF-TEST FAILED: ${message}`,
    );
  }
}

// ============================================================
// TEST CRYPTO AUTHORITY
// ============================================================

const controlCenterKeyPair =
  generateKeyPairSync(
    "ec",
    {
      namedCurve:
        "prime256v1",
    },
  );

const controlCenterPublicKey =
  controlCenterKeyPair.publicKey
    .export({
      format:
        "der",
      type:
        "spki",
    })
    .toString(
      "base64",
    );

const controlCenterPrivateKey =
  controlCenterKeyPair.privateKey
    .export({
      format:
        "der",
      type:
        "pkcs8",
    })
    .toString(
      "base64",
    );

const controlCenterFingerprint =
  createFinoraInstallationBindingFingerprint(
    controlCenterPublicKey,
  );

const controlCenterSigningKeyId =
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
    controlCenterFingerprint,
  );

const controlCenterIssuerId =
  "FINORA-CONTROL-CENTER-ENROLLMENT-SELFTEST";

// ============================================================
// TEST NATIVE INSTALLATION BINDING
// ============================================================

const installationMaterial =
  generateFinoraWindowsInstallationBindingMaterial(
    new Date(
      "2020-01-01T00:00:00.000Z",
    ),
  );

const installationBinding =
  toFinoraWindowsInstallationBindingPublic(
    installationMaterial,
  );

// ============================================================
// FIXED EXPIRED RESPONSE WINDOW
// ============================================================

const requestId =
  "FINORA-ENROLLMENT-SELFTEST-REQUEST";

const issuedAt =
  "2020-01-02T00:00:00.000Z";

const expiresAt =
  "2020-01-03T00:00:00.000Z";

const trustedKeyValidFrom =
  "2020-01-01T00:00:00.000Z";

// ============================================================
// RESPONSE BUILDER
// ============================================================

function buildSignedExpiredEnrollmentResponse(
  responseId:
    string,
): FinoraInstallationEnrollmentResponseFile {

  const target = {
    ownerId:
      "OWNER-SELFTEST",

    businessId:
      "BUSINESS-SELFTEST",

    branchId:
      "BRANCH-SELFTEST",

    installationId:
      installationBinding.installationId,

    bindingKeyId:
      installationBinding.bindingKeyId,

    fingerprintAlgorithm:
      "SHA-256" as const,

    publicKeyFingerprint:
      installationBinding.publicKeyFingerprint,
  };

  const initialTrustedKey = {
    issuerId:
      controlCenterIssuerId,

    signingKeyId:
      controlCenterSigningKeyId,

    algorithm:
      "ECDSA_P256_SHA256" as const,

    format:
      "SPKI_DER_BASE64" as const,

    publicKey:
      controlCenterPublicKey,

    status:
      "ACTIVE" as const,

    validFrom:
      trustedKeyValidFrom,
  };

  const payload = {
    requestId,

    businessCode:
      "BIZ-SELFTEST",

    branchCode:
      "BR-SELFTEST",

    initialTrustedKey,

    issuedAt,

    schemaVersion:
      1 as const,
  };

  const unsignedResponse:
    Omit<
      FinoraSignedInstallationEnrollmentResponse,
      "signature"
    > = {

      responseId,

      purpose:
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,

      target,

      issuedAt,

      validity: {
        notBefore:
          issuedAt,

        expiresAt,
      },

      sequence:
        1,

      payloadVersion:
        FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,

      payload,

      issuer: {
        type:
          "FINORA_CONTROL_CENTER",

        issuerId:
          controlCenterIssuerId,

        signingKeyId:
          controlCenterSigningKeyId,
      },

      payloadDigest:
        createFinoraControlCenterPayloadDigest(
          payload,
        ),

      schemaVersion:
        1,
    };

  const canonicalResponse =
    canonicalizeFinoraControlCenterValue(
      unsignedResponse,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonicalResponse,
      controlCenterPrivateKey,
    );

  const response:
    FinoraSignedInstallationEnrollmentResponse = {
      ...unsignedResponse,

      signature: {
        algorithm:
          "ECDSA_P256_SHA256",

        encoding:
          "IEEE_P1363",

        canonicalization:
          "FINORA_CANONICAL_JSON_V1",

        signingKeyId:
          controlCenterSigningKeyId,

        value:
          signature,
      },
    };

  return {
    format:
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,

    response,

    schemaVersion:
      1,
  };
}

// ============================================================
// INPUT
// ============================================================

function buildVerificationInput(
  value:
    unknown,

  fingerprint:
    string = controlCenterFingerprint,
) {

  return {
    value,

    expectedControlCenterPublicKeyFingerprint:
      fingerprint,

    expectedRequestId:
      requestId,

    nativeBinding: {
      installationId:
        installationBinding.installationId,

      bindingKeyId:
        installationBinding.bindingKeyId,

      fingerprintAlgorithm:
        installationBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        installationBinding.publicKeyFingerprint,
    },
  };
}

// ============================================================
// SIGNATURE TAMPER
// ============================================================

function createBadSignatureFile(
  source:
    FinoraInstallationEnrollmentResponseFile,
): FinoraInstallationEnrollmentResponseFile {

  const bytes =
    Buffer.from(
      source.response.signature.value,
      "base64",
    );

  assertSelfTest(
    bytes.length ===
      64,
    "fixture signature must be IEEE-P1363 64 bytes",
  );

  bytes[0] =
    bytes[0] ^ 0x01;

  return {
    ...source,

    response: {
      ...source.response,

      signature: {
        ...source.response.signature,

        value:
          bytes.toString(
            "base64",
          ),
      },
    },
  };
}

// ============================================================
// EXECUTABLE PROOF
// ============================================================

function runEnrollmentRecoverySelfTest():
  void {

  const responseA =
    buildSignedExpiredEnrollmentResponse(
      "FINORA-ENROLLMENT-RESPONSE-SELFTEST-A",
    );

  // ----------------------------------------------------------
  // 1. EXPIRED + UNLATCHED / FIRST IMPORT => REJECT
  // ----------------------------------------------------------

  const strictExpired =
    verifyFinoraInstallationEnrollmentResponseFile(
      buildVerificationInput(
        responseA,
      ),
    );

  assertSelfTest(
    !strictExpired.success,
    "expired first-import response must fail strict verification",
  );

  console.log(
    "PASS: expired first-import response rejected",
  );

  // ----------------------------------------------------------
  // 2. SAME EXPIRED RESPONSE / PROTECTED RECOVERY => PASS
  //
  // This only proves the cryptographic recovery verifier.
  // Production coordinator is what authorizes selecting this
  // path based on encrypted acceptedResponse state.
  // ----------------------------------------------------------

  const recoveryA =
    verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery(
      buildVerificationInput(
        responseA,
      ),
    );

  assertSelfTest(
    recoveryA.success,
    "same expired response must pass protected recovery cryptographic verification",
  );

  console.log(
    "PASS: expired exact response passed recovery cryptographic verification",
  );

  // ----------------------------------------------------------
  // 3. EXACT PROTECTED LATCH => ACCEPT
  // ----------------------------------------------------------

  const acceptedLatch = {
    responseId:
      recoveryA.data.responseId,

    responseDigest:
      createFinoraVerifiedInstallationEnrollmentResponseDigest(
        recoveryA.data,
      ),
  };

  assertSelfTest(
    isExactFinoraVerifiedInstallationEnrollmentAcceptedResponse(
      recoveryA.data,
      acceptedLatch,
    ),
    "exact verified response must match its protected accepted-response latch",
  );

  console.log(
    "PASS: exact protected accepted-response latch matched",
  );

  // ----------------------------------------------------------
  // 4. DIFFERENT BUT VALID SIGNED RESPONSE => LATCH REJECT
  // ----------------------------------------------------------

  const responseB =
    buildSignedExpiredEnrollmentResponse(
      "FINORA-ENROLLMENT-RESPONSE-SELFTEST-B",
    );

  const recoveryB =
    verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery(
      buildVerificationInput(
        responseB,
      ),
    );

  assertSelfTest(
    recoveryB.success,
    "different signed response fixture must itself remain cryptographically valid",
  );

  assertSelfTest(
    !isExactFinoraVerifiedInstallationEnrollmentAcceptedResponse(
      recoveryB.data,
      acceptedLatch,
    ),
    "different valid signed response must not match the protected latch",
  );

  console.log(
    "PASS: different valid signed response rejected by protected latch",
  );

  // ----------------------------------------------------------
  // 5. BAD SIGNATURE => REJECT EVEN IN RECOVERY
  // ----------------------------------------------------------

  const badSignatureFile =
    createBadSignatureFile(
      responseA,
    );

  const badSignature =
    verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery(
      buildVerificationInput(
        badSignatureFile,
      ),
    );

  assertSelfTest(
    !badSignature.success,
    "bad signature must fail protected recovery verification",
  );

  console.log(
    "PASS: bad signature rejected during recovery verification",
  );

  // ----------------------------------------------------------
  // 6. WRONG INDEPENDENT CONTROL CENTER FINGERPRINT => REJECT
  // ----------------------------------------------------------

  const wrongFingerprint =
    (
      controlCenterFingerprint ===
        "0".repeat(64)
    )
      ? "1".repeat(64)
      : "0".repeat(64);

  const wrongAuthority =
    verifyFinoraInstallationEnrollmentResponseFileForLatchedRecovery(
      buildVerificationInput(
        responseA,
        wrongFingerprint,
      ),
    );

  assertSelfTest(
    !wrongAuthority.success,
    "wrong independent Control Center fingerprint must fail recovery verification",
  );

  console.log(
    "PASS: wrong independent Control Center fingerprint rejected",
  );

  console.log(
    "FINORA ENROLLMENT RECOVERY SELF-TEST PASS",
  );
}

// ============================================================
// MAIN
// ============================================================

async function main():
  Promise<void> {

  await app.whenReady();

  try {
    runEnrollmentRecoverySelfTest();

    app.exit(
      0,
    );
  } catch (
    error
  ) {

    console.error(
      error instanceof Error
        ? error.stack ?? error.message
        : error,
    );

    app.exit(
      1,
    );
  }
}

void main();

// ============================================================
// END
// ============================================================