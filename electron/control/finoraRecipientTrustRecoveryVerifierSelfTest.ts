/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST RECOVERY VERIFIER SELF TEST

   VERIFY:

   - Real P-256 recovery-authority signature accepted
   - Exact recovery-root installation binding enforced
   - Exact recovery-authority identity enforced
   - Operational signing key cannot authorize recovery
   - Wrong recovery private key cannot authorize recovery
   - Package installation target mismatch rejected
   - Recovery issued before root provisioning rejected
   - Recovery issued after accepted authoritative time rejected
   - Invalid accepted time rejected
   - Payload digest tamper rejected
   - Canonical unsigned-envelope tamper rejected
   - Signature tamper rejected

   IMPORTANT:

   - No persistence.
   - No Electron app lifecycle.
   - No IPC.
   - No production key vault.
   - Private keys are generated only in memory for this selftest.
=========================================================== */

import {
  generateKeyPairSync,
  sign as nodeSign,
} from "node:crypto";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  createFinoraRecipientTrustRecoveryPayloadDigest,
} from "./finoraRecipientTrustRecoveryContract.js";

import {
  verifyFinoraRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryVerifier.js";

import type {
  FinoraRecipientTrustRecoverySignedEnvelope,
  FinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function assertRejected(
  result:
    ReturnType<
      typeof verifyFinoraRecipientTrustRecovery
    >,
  expectedReason:
    string,
  label:
    string,
): void {
  assert(
    !result.valid,
    `${label} was unexpectedly accepted.`,
  );

  assert(
    result.reason ===
      expectedReason,
    `${label} returned ${result.reason}, expected ${expectedReason}.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

// ============================================================
// TEST KEY
// ============================================================

function createP256SigningMaterial(): {
  publicKey:
    string;

  privateKey:
    ReturnType<
      typeof generateKeyPairSync
    >["privateKey"];

  fingerprint:
    string;

  signingKeyId:
    string;
} {
  const pair =
    generateKeyPairSync(
      "ec",
      {
        namedCurve:
          "prime256v1",
      },
    );

  const publicKey =
    pair.publicKey
      .export({
        type:
          "spki",

        format:
          "der",
      })
      .toString(
        "base64",
      );

  const fingerprint =
    createFinoraInstallationBindingFingerprint(
      publicKey,
    );

  const signingKeyId =
    createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
      fingerprint,
    );

  return {
    publicKey,

    privateKey:
      pair.privateKey,

    fingerprint,

    signingKeyId,
  };
}

// ============================================================
// SIGN RECOVERY
// ============================================================

function signRecoveryEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope,
  privateKey:
    ReturnType<
      typeof generateKeyPairSync
    >["privateKey"],
): FinoraRecipientTrustRecoverySignedEnvelope {
  const canonical =
    canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
      unsignedEnvelope,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonical,
        "utf8",
      ),
      {
        key:
          privateKey,

        dsaEncoding:
          "ieee-p1363",
      },
    );

  assert(
    signature.byteLength ===
      64,
    "Selftest recovery signature was not 64-byte IEEE-P1363.",
  );

  return {
    ...unsignedEnvelope,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      signingKeyId:
        unsignedEnvelope.issuer.signingKeyId,

      value:
        signature.toString(
          "base64",
        ),
    },
  };
}

// ============================================================
// SELF TEST
// ============================================================

function runSelfTest():
  void {
  const recoveryMaterial =
    createP256SigningMaterial();

  const wrongRecoveryMaterial =
    createP256SigningMaterial();

  const operationalSigningMaterial =
    createP256SigningMaterial();

  const replacementMaterial =
    createP256SigningMaterial();

  const provisionedAt =
    "2026-09-08T10:00:00.000Z";

  const issuedAt =
    "2026-09-08T11:00:00.000Z";

  const acceptedAt =
    "2026-09-08T12:00:00.000Z";

  const expectedTarget = {
    installationId:
      "FINORA-INSTALLATION-RECOVERY-VERIFIER-SELFTEST",

    bindingKeyId:
      "FINORA-BINDING-RECOVERY-VERIFIER-SELFTEST",

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      "a".repeat(
        64,
      ),
  } as const;

  const recoveryAuthorityStore:
    FinoraRecipientTrustRecoveryAuthorityStoreState = {
      schemaVersion:
        1,

      installation:
        expectedTarget,

      authority: {
        type:
          "FINORA_RECOVERY_AUTHORITY",

        recoveryAuthorityId:
          "FINORA-RECOVERY-AUTHORITY-VERIFIER-SELFTEST",

        signingKeyId:
          recoveryMaterial.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          recoveryMaterial.publicKey,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          recoveryMaterial.fingerprint,
      },

      provisionedAt,
    };

  const replacementTrustedKey:
    FinoraBranchTrustedControlPublicKey = {
      issuerId:
        "FINORA-CONTROL-CENTER-RECOVERY-VERIFIER-SELFTEST",

      signingKeyId:
        replacementMaterial.signingKeyId,

      algorithm:
        "ECDSA_P256_SHA256",

      format:
        "SPKI_DER_BASE64",

      publicKey:
        replacementMaterial.publicKey,

      status:
        "ACTIVE",

      validFrom:
        issuedAt,
    };

  const payload = {
    recoveryFormat:
      "FINORA_RECIPIENT_TRUST_RECOVERY_V1",

    action:
      "REPLACE_ACTIVE",

    operationalIssuerId:
      replacementTrustedKey.issuerId,

    expectedActiveSigningKeyId:
      operationalSigningMaterial.signingKeyId,

    replacementTrustedKey,

    issuedAt,

    schemaVersion:
      1,
  } as const;

  const unsignedEnvelope:
    FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      packageId:
        "FINORA-RECOVERY-VERIFIER-SELFTEST-001",

      purpose:
        "RECIPIENT_TRUST_RECOVERY",

      target:
        expectedTarget,

      issuedAt,

      sequence:
        1,

      payloadVersion:
        1,

      payload,

      schemaVersion:
        1,

      issuer: {
        type:
          "FINORA_RECOVERY_AUTHORITY",

        recoveryAuthorityId:
          recoveryAuthorityStore.authority.recoveryAuthorityId,

        signingKeyId:
          recoveryAuthorityStore.authority.signingKeyId,
      },

      payloadDigest:
        createFinoraRecipientTrustRecoveryPayloadDigest(
          payload,
        ),
    };

  const validEnvelope =
    signRecoveryEnvelope(
      unsignedEnvelope,
      recoveryMaterial.privateKey,
    );

  // ----------------------------------------------------------
  // TEST 1 — VALID REAL RECOVERY SIGNATURE
  // ----------------------------------------------------------

  const validResult =
    verifyFinoraRecipientTrustRecovery(
      validEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    );

  assert(
    validResult.valid,
    validResult.valid
      ? "Valid recovery verification result is invalid."
      : `Valid recovery envelope rejected: ${validResult.reason} ${validResult.error}`,
  );

  assert(
    validResult.envelope.packageId ===
      validEnvelope.packageId &&
    validResult.recoveryAuthority.signingKeyId ===
      recoveryAuthorityStore.authority.signingKeyId,
    "Valid recovery verifier returned incorrect verified authority.",
  );

  console.log(
    "PASS: valid independent recovery-root P-256 signature accepted",
  );

  // ----------------------------------------------------------
  // TEST 2 — RECOVERY ROOT INSTALLATION TARGET MISMATCH
  // ----------------------------------------------------------

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      validEnvelope,
      {
        ...recoveryAuthorityStore,

        installation: {
          ...expectedTarget,

          installationId:
            "FINORA-FOREIGN-RECOVERY-ROOT-INSTALLATION",
        },
      },
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "RECOVERY_AUTHORITY_TARGET_MISMATCH",
    "foreign recovery-root installation binding rejected",
  );

  // ----------------------------------------------------------
  // TEST 3 — PACKAGE INSTALLATION TARGET MISMATCH
  // ----------------------------------------------------------

  const foreignTarget = {
    ...expectedTarget,

    installationId:
      "FINORA-FOREIGN-RECOVERY-PACKAGE-INSTALLATION",
  };

  const foreignTargetUnsigned:
    FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...unsignedEnvelope,

      target:
        foreignTarget,
  };

  const foreignTargetEnvelope =
    signRecoveryEnvelope(
      foreignTargetUnsigned,
      recoveryMaterial.privateKey,
    );

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      foreignTargetEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "TARGET_MISMATCH",
    "foreign recovery package installation target rejected",
  );

  // ----------------------------------------------------------
  // TEST 4 — RECOVERY AUTHORITY ID MISMATCH
  // ----------------------------------------------------------

  const wrongAuthorityUnsigned:
    FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...unsignedEnvelope,

      issuer: {
        ...unsignedEnvelope.issuer,

        recoveryAuthorityId:
          "FINORA-UNTRUSTED-RECOVERY-AUTHORITY",
      },
  };

  const wrongAuthorityEnvelope =
    signRecoveryEnvelope(
      wrongAuthorityUnsigned,
      recoveryMaterial.privateKey,
    );

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      wrongAuthorityEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "RECOVERY_AUTHORITY_MISMATCH",
    "unprovisioned recovery-authority identity rejected",
  );

  // ----------------------------------------------------------
  // TEST 5 — WRONG RECOVERY PRIVATE KEY
  // ----------------------------------------------------------

  const wrongRecoverySignature =
    signRecoveryEnvelope(
      unsignedEnvelope,
      wrongRecoveryMaterial.privateKey,
    );

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      wrongRecoverySignature,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "INVALID_SIGNATURE",
    "wrong recovery private-key signature rejected",
  );

  // ----------------------------------------------------------
  // TEST 6 — OPERATIONAL SIGNING KEY CANNOT AUTHORIZE RECOVERY
  // ----------------------------------------------------------

  const operationalSignature =
    signRecoveryEnvelope(
      unsignedEnvelope,
      operationalSigningMaterial.privateKey,
    );

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      operationalSignature,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "INVALID_SIGNATURE",
    "operational signing key cannot authorize recipient recovery",
  );

  // ----------------------------------------------------------
  // TEST 7 — ISSUED BEFORE ROOT PROVISIONING
  // ----------------------------------------------------------

  const preProvisionIssuedAt =
    "2026-09-08T09:59:59.999Z";

  const preProvisionReplacementKey:
    FinoraBranchTrustedControlPublicKey = {
      ...replacementTrustedKey,

      validFrom:
        preProvisionIssuedAt,
    };

  const preProvisionPayload = {
    ...payload,

    replacementTrustedKey:
      preProvisionReplacementKey,

    issuedAt:
      preProvisionIssuedAt,
  };

  const preProvisionUnsigned:
    FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...unsignedEnvelope,

      issuedAt:
        preProvisionIssuedAt,

      payload:
        preProvisionPayload,

      payloadDigest:
        createFinoraRecipientTrustRecoveryPayloadDigest(
          preProvisionPayload,
        ),
    };

  const preProvisionEnvelope =
    signRecoveryEnvelope(
      preProvisionUnsigned,
      recoveryMaterial.privateKey,
    );

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      preProvisionEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "RECOVERY_AUTHORITY_NOT_YET_TRUSTED",
    "recovery issued before recovery-root provisioning rejected",
  );

  // ----------------------------------------------------------
  // TEST 8 — FUTURE-ISSUED RECOVERY
  // ----------------------------------------------------------

  const futureIssuedAt =
    "2026-09-08T12:00:00.001Z";

  const futureReplacementKey:
    FinoraBranchTrustedControlPublicKey = {
      ...replacementTrustedKey,

      validFrom:
        futureIssuedAt,
    };

  const futurePayload = {
    ...payload,

    replacementTrustedKey:
      futureReplacementKey,

    issuedAt:
      futureIssuedAt,
  };

  const futureUnsigned:
    FinoraRecipientTrustRecoveryUnsignedEnvelope = {
      ...unsignedEnvelope,

      issuedAt:
        futureIssuedAt,

      payload:
        futurePayload,

      payloadDigest:
        createFinoraRecipientTrustRecoveryPayloadDigest(
          futurePayload,
        ),
    };

  const futureEnvelope =
    signRecoveryEnvelope(
      futureUnsigned,
      recoveryMaterial.privateKey,
    );

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      futureEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "RECOVERY_ISSUED_IN_FUTURE",
    "future-issued recovery rejected against authoritative accepted time",
  );

  // ----------------------------------------------------------
  // TEST 9 — INVALID ACCEPTED TIME
  // ----------------------------------------------------------

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      validEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        Number.NaN,
      ),
    ),
    "INVALID_ACCEPTED_TIME",
    "invalid authoritative accepted time rejected",
  );

  // ----------------------------------------------------------
  // TEST 10 — PAYLOAD DIGEST TAMPER
  // ----------------------------------------------------------

  const digestTamperedEnvelope = {
    ...validEnvelope,

    payload: {
      ...validEnvelope.payload,

      expectedActiveSigningKeyId:
        "FINORA-KEY-TAMPERED00000000001",
    },
  };

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      digestTamperedEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "MALFORMED_RECOVERY",
    "recovery payload digest tamper rejected before signature authorization",
  );

  // ----------------------------------------------------------
  // TEST 11 — CANONICAL ENVELOPE METADATA TAMPER
  //
  // Payload digest remains valid, but sequence is signed metadata.
  // ----------------------------------------------------------

  const canonicalTamperedEnvelope = {
    ...validEnvelope,

    sequence:
      2,
  };

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      canonicalTamperedEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "INVALID_SIGNATURE",
    "canonical recovery envelope metadata tamper rejected",
  );

  // ----------------------------------------------------------
  // TEST 12 — SIGNATURE BYTE TAMPER
  // ----------------------------------------------------------

  const signatureBytes =
    Buffer.from(
      validEnvelope.signature.value,
      "base64",
    );

  signatureBytes[0] =
    signatureBytes[0] ^
    0x01;

  const signatureTamperedEnvelope = {
    ...validEnvelope,

    signature: {
      ...validEnvelope.signature,

      value:
        signatureBytes.toString(
          "base64",
        ),
    },
  };

  assertRejected(
    verifyFinoraRecipientTrustRecovery(
      signatureTamperedEnvelope,
      recoveryAuthorityStore,
      expectedTarget,
      new Date(
        acceptedAt,
      ),
    ),
    "INVALID_SIGNATURE",
    "recovery signature-byte tamper rejected",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: FINORA RECIPIENT TRUST RECOVERY VERIFIER SELFTEST",
  );

  console.log(
    "============================================================",
  );
}

// ============================================================
// RUN
// ============================================================

try {
  runSelfTest();
} catch (
  error
) {
  console.error(
    "FAIL: FINORA RECIPIENT TRUST RECOVERY VERIFIER SELFTEST",
    error,
  );

  process.exitCode =
    1;
}