/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION VERIFIER SELF TEST

   RESPONSIBILITY:

   - Sign real recipient trust-transition envelopes with ECDSA
     P-256 private test keys
   - Verify valid signatures
   - Reject signed-content tamper
   - Reject signature tamper
   - Reject installation target mismatch
   - Reject unknown signer
   - Reject RETIRED signer
   - Reject ambiguous ACTIVE authority
   - Enforce signer historical validity
   - Verify inclusive validUntil boundary

   IMPORTANT:

   - Pure Node runtime.
   - Ephemeral test keys only.
   - No Electron.
   - No filesystem persistence.
   - No trust-store mutation.
   - No IPC.
=========================================================== */

import {
  generateKeyPairSync,
  sign as nodeSign,
} from "node:crypto";

import type {
  KeyObject,
} from "node:crypto";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  createFinoraRecipientTrustTransitionPayloadDigest,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustRotatePayload,
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
  FinoraRecipientTrustTransitionUnsignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

import {
  verifyFinoraRecipientTrustTransition,
} from "./finoraRecipientTrustTransitionVerifier.js";

import type {
  FinoraRecipientTrustTransitionVerificationResult,
} from "./finoraRecipientTrustTransitionVerifier.js";

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
    FinoraRecipientTrustTransitionVerificationResult,
  expectedReason:
    Exclude<
      FinoraRecipientTrustTransitionVerificationResult,
      {
        valid:
          true;
      }
    >["reason"],
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
    `${label} returned ${result.reason}; expected ${expectedReason}.`,
  );

  console.log(
    `PASS: ${label} rejected as ${expectedReason}`,
  );
}

// ============================================================
// TEST KEY MATERIAL
// ============================================================

interface TestSigningMaterial {
  privateKey:
    KeyObject;

  publicKey:
    string;

  signingKeyId:
    string;
}

function createTestSigningMaterial():
  TestSigningMaterial {
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
    `FINORA-KEY-${fingerprint
      .slice(
        0,
        24,
      )
      .toUpperCase()}`;

  return {
    privateKey:
      pair.privateKey,

    publicKey,

    signingKeyId,
  };
}

// ============================================================
// FIXTURES
// ============================================================

const issuerId =
  "FINORA-CC-TRUST-VERIFIER-SELFTEST";

const baseIssuedAt =
  "2026-09-07T08:00:00.000Z";

const signerMaterial =
  createTestSigningMaterial();

const newKeyMaterial =
  createTestSigningMaterial();

const alternateNewKeyMaterial =
  createTestSigningMaterial();

const secondActiveMaterial =
  createTestSigningMaterial();

const target:
  FinoraRecipientTrustTransitionTarget = {
    installationId:
      "FINORA-INSTALLATION-TRUST-VERIFY-001",

    bindingKeyId:
      "FINORA-BINDING-TRUST-VERIFY-001",

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      "b".repeat(
        64,
      ),
  };

// ============================================================
// TRUSTED SIGNER
// ============================================================

function createTrustedSigner(
  overrides:
    Partial<
      FinoraBranchTrustedControlPublicKey
    > = {},
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId,

    signingKeyId:
      signerMaterial.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      signerMaterial.publicKey,

    status:
      "ACTIVE",

    validFrom:
      "2026-01-01T00:00:00.000Z",

    ...overrides,
  };
}

// ============================================================
// UNSIGNED ROTATE ENVELOPE
// ============================================================

function createUnsignedRotateEnvelope(
  issuedAt:
    string,
  sequence:
    number,
  rotationMaterial:
    TestSigningMaterial =
      newKeyMaterial,
): FinoraRecipientTrustTransitionUnsignedEnvelope {
  const newTrustedKey:
    FinoraBranchTrustedControlPublicKey = {
      issuerId,

      signingKeyId:
        rotationMaterial.signingKeyId,

      algorithm:
        "ECDSA_P256_SHA256",

      format:
        "SPKI_DER_BASE64",

      publicKey:
        rotationMaterial.publicKey,

      status:
        "ACTIVE",

      validFrom:
        issuedAt,
    };

  const payload:
    FinoraRecipientTrustRotatePayload = {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "ROTATE",

    newTrustedKey,

    issuedAt,

    schemaVersion:
      1,
  };

  return {
    packageId:
      `FINORA-TRUST-VERIFY-${sequence}`,

    purpose:
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

    target: {
      ...target,
    },

    issuedAt,

    sequence,

    payloadVersion:
      1,

    payload,

    schemaVersion:
      1,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER",

      issuerId,

      signingKeyId:
        signerMaterial.signingKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustTransitionPayloadDigest(
        payload,
      ),
  };
}

// ============================================================
// REAL SIGNATURE
// ============================================================

function signEnvelope(
  unsignedEnvelope:
    FinoraRecipientTrustTransitionUnsignedEnvelope,
  privateKey:
    KeyObject =
      signerMaterial.privateKey,
): FinoraRecipientTrustTransitionSignedEnvelope {
  const canonical =
    canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
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
    "Generated P-256 IEEE-P1363 signature was not 64 bytes.",
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
// TEST 1 — VALID REAL ECDSA SIGNATURE
// ============================================================

const validUnsigned =
  createUnsignedRotateEnvelope(
    baseIssuedAt,
    1,
  );

const validSigned =
  signEnvelope(
    validUnsigned,
  );

const validResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [
      createTrustedSigner(),
    ],
    target,
  );

assert(
  validResult.valid,
  validResult.valid
    ? "Valid signed transition unexpectedly failed."
    : validResult.error,
);

assert(
  validResult.trustedSigner.signingKeyId ===
    signerMaterial.signingKeyId,
  "Verified transition returned incorrect trusted signer.",
);

console.log(
  "PASS: real ECDSA P-256 trust-transition signature verified",
);

// ============================================================
// TEST 2 — SIGNED PAYLOAD TAMPER
//
// Replace the new key with another structurally valid P-256
// key and recompute payload digest, but retain old signature.
// Contract remains valid; signature must fail.
// ============================================================

const tamperedPayload:
  FinoraRecipientTrustRotatePayload = {
  ...(
    validSigned.payload as
      FinoraRecipientTrustRotatePayload
  ),

  newTrustedKey: {
    ...(
      validSigned.payload as
        FinoraRecipientTrustRotatePayload
    ).newTrustedKey,

    publicKey:
      alternateNewKeyMaterial.publicKey,

    signingKeyId:
      alternateNewKeyMaterial.signingKeyId,
  },
};

const tamperedPayloadResult =
  verifyFinoraRecipientTrustTransition(
    {
      ...validSigned,

      payload:
        tamperedPayload,

      payloadDigest:
        createFinoraRecipientTrustTransitionPayloadDigest(
          tamperedPayload,
        ),
    },
    [
      createTrustedSigner(),
    ],
    target,
  );

assertRejected(
  tamperedPayloadResult,
  "INVALID_SIGNATURE",
  "signed payload tamper with recomputed digest",
);

// ============================================================
// TEST 3 — SIGNATURE BYTE TAMPER
// ============================================================

const signatureBytes =
  Buffer.from(
    validSigned.signature.value,
    "base64",
  );

signatureBytes[0] =
  signatureBytes[0] ^
  0x01;

const tamperedSignatureResult =
  verifyFinoraRecipientTrustTransition(
    {
      ...validSigned,

      signature: {
        ...validSigned.signature,

        value:
          signatureBytes.toString(
            "base64",
          ),
      },
    },
    [
      createTrustedSigner(),
    ],
    target,
  );

assertRejected(
  tamperedSignatureResult,
  "INVALID_SIGNATURE",
  "signature-byte tamper",
);

// ============================================================
// TEST 4 — WRONG INSTALLATION TARGET
// ============================================================

const wrongTargetResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [
      createTrustedSigner(),
    ],
    {
      ...target,

      installationId:
        "FINORA-WRONG-INSTALLATION",
    },
  );

assertRejected(
  wrongTargetResult,
  "TARGET_MISMATCH",
  "wrong native installation target",
);

// ============================================================
// TEST 5 — UNKNOWN SIGNER
// ============================================================

const unknownSignerResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [],
    target,
  );

assertRejected(
  unknownSignerResult,
  "UNKNOWN_SIGNING_KEY",
  "unknown transition signer",
);

// ============================================================
// TEST 6 — RETIRED SIGNER
// ============================================================

const retiredSignerResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [
      createTrustedSigner({
        status:
          "RETIRED",

        validUntil:
          baseIssuedAt,
      }),
    ],
    target,
  );

assertRejected(
  retiredSignerResult,
  "SIGNING_KEY_NOT_ACTIVE",
  "RETIRED transition signer",
);

// ============================================================
// TEST 7 — AMBIGUOUS ACTIVE AUTHORITY
// ============================================================

const secondActiveKey:
  FinoraBranchTrustedControlPublicKey = {
    issuerId,

    signingKeyId:
      secondActiveMaterial.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      secondActiveMaterial.publicKey,

    status:
      "ACTIVE",

    validFrom:
      "2026-01-01T00:00:00.000Z",
  };

const ambiguousActiveResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [
      createTrustedSigner(),
      secondActiveKey,
    ],
    target,
  );

assertRejected(
  ambiguousActiveResult,
  "AMBIGUOUS_ACTIVE_SIGNER",
  "multiple ACTIVE keys for one issuer",
);

// ============================================================
// TEST 8 — PRE-validFrom SIGNER
// ============================================================

const preValidFromResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [
      createTrustedSigner({
        validFrom:
          "2026-09-07T08:00:00.001Z",
      }),
    ],
    target,
  );

assertRejected(
  preValidFromResult,
  "SIGNING_KEY_NOT_VALID",
  "transition issued before signer validFrom",
);

// ============================================================
// TEST 9 — EXACT validUntil IS VALID
// ============================================================

const exactValidUntilResult =
  verifyFinoraRecipientTrustTransition(
    validSigned,
    [
      createTrustedSigner({
        validUntil:
          baseIssuedAt,
      }),
    ],
    target,
  );

assert(
  exactValidUntilResult.valid,
  exactValidUntilResult.valid
    ? "Exact validUntil boundary unexpectedly failed."
    : exactValidUntilResult.error,
);

console.log(
  "PASS: issuedAt exactly equal to signer validUntil remains valid",
);

// ============================================================
// TEST 10 — validUntil + 1ms IS REJECTED
//
// Use a separately and correctly signed transition so failure
// proves signer validity, not signature integrity.
// ============================================================

const afterValidUntilIssuedAt =
  "2026-09-07T08:00:00.001Z";

const afterValidUntilSigned =
  signEnvelope(
    createUnsignedRotateEnvelope(
      afterValidUntilIssuedAt,
      2,
    ),
  );

const afterValidUntilResult =
  verifyFinoraRecipientTrustTransition(
    afterValidUntilSigned,
    [
      createTrustedSigner({
        validUntil:
          baseIssuedAt,
      }),
    ],
    target,
  );

assertRejected(
  afterValidUntilResult,
  "SIGNING_KEY_NOT_VALID",
  "transition issued one millisecond after signer validUntil",
);

// ============================================================
// TEST 11 — UNSIGNED ENVELOPE FIELD TAMPER
//
// sequence participates in the canonical signature even though
// it is outside payloadDigest.
// ============================================================

const sequenceTamperResult =
  verifyFinoraRecipientTrustTransition(
    {
      ...validSigned,

      sequence:
        999,
    },
    [
      createTrustedSigner(),
    ],
    target,
  );

assertRejected(
  sequenceTamperResult,
  "INVALID_SIGNATURE",
  "signed envelope sequence tamper",
);

// ============================================================
// FINAL
// ============================================================

console.log(
  "============================================================",
);

console.log(
  "PASS: FINORA RECIPIENT TRUST TRANSITION VERIFIER SELFTEST",
);

console.log(
  "============================================================",
);