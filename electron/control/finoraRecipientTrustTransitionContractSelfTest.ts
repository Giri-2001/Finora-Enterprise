/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION CONTRACT SELF TEST

   RESPONSIBILITY:

   - Verify installation-only transition target validation
   - Verify payload digest integrity
   - Verify stable issuer rotation rule
   - Verify rotation requires a different signing key
   - Verify current signer cannot revoke itself
   - Verify P-256 new-key enforcement
   - Verify valid ROTATE contract
   - Verify valid REVOKE_RETIRED contract
   - Verify deterministic canonicalization
   - Verify signed-envelope signature shape

   IMPORTANT:

   - Pure contract test.
   - No Electron runtime.
   - No persistence.
   - No trust-store mutation.
   - No IPC.
=========================================================== */

import {
  generateKeyPairSync,
} from "node:crypto";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  createFinoraRecipientTrustTransitionPayloadDigest,
  validateFinoraRecipientTrustTransitionDraft,
  validateFinoraRecipientTrustTransitionSignedEnvelope,
  validateFinoraRecipientTrustTransitionUnsignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustRotatePayload,
  FinoraRecipientTrustRevokeRetiredPayload,
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
  FinoraRecipientTrustTransitionUnsignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

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

function errorMessage(
  error:
    unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(
        error,
      );
}

function expectRejected(
  label:
    string,
  operation:
    () => void,
  expectedMessage:
    string,
): void {
  let rejection:
    string | undefined;

  try {
    operation();
  } catch (
    error
  ) {
    rejection =
      errorMessage(
        error,
      );
  }

  assert(
    rejection !==
      undefined,
    `${label} was unexpectedly accepted.`,
  );

  assert(
    rejection.includes(
      expectedMessage,
    ),
    `${label} returned unexpected rejection: ${rejection}`,
  );

  console.log(
    `PASS: ${label} rejected`,
  );
}

// ============================================================
// KEY HELPERS
// ============================================================

function createEcPublicKeyBase64(
  namedCurve:
    string,
): string {
  const pair =
    generateKeyPairSync(
      "ec",
      {
        namedCurve,
      },
    );

  return pair.publicKey
    .export({
      type:
        "spki",

      format:
        "der",
    })
    .toString(
      "base64",
    );
}

function createSigningKeyId(
  publicKey:
    string,
): string {
  const fingerprint =
    createFinoraInstallationBindingFingerprint(
      publicKey,
    );

  return (
    `FINORA-KEY-${fingerprint
      .slice(
        0,
        24,
      )
      .toUpperCase()}`
  );
}

// ============================================================
// FIXTURES
// ============================================================

const issuerId =
  "FINORA-CC-TRUST-TRANSITION-SELFTEST";

const currentSignerKeyId =
  "FINORA-KEY-CURRENTSIGNER000000001";

const issuedAt =
  "2026-09-07T07:45:00.000Z";

const target:
  FinoraRecipientTrustTransitionTarget = {
    installationId:
      "FINORA-INSTALLATION-TRUST-SELFTEST",

    bindingKeyId:
      "FINORA-BINDING-TRUST-SELFTEST",

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      "a".repeat(
        64,
      ),
  };

const newP256PublicKey =
  createEcPublicKeyBase64(
    "prime256v1",
  );

const newP256SigningKeyId =
  createSigningKeyId(
    newP256PublicKey,
  );

const newTrustedKey:
  FinoraBranchTrustedControlPublicKey = {
    issuerId,

    signingKeyId:
      newP256SigningKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      newP256PublicKey,

    status:
      "ACTIVE",

    validFrom:
      issuedAt,
  };

function createRotatePayload():
  FinoraRecipientTrustRotatePayload {
  return {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "ROTATE",

    newTrustedKey: {
      ...newTrustedKey,
    },

    issuedAt,

    schemaVersion:
      1,
  };
}

function createRevokePayload():
  FinoraRecipientTrustRevokeRetiredPayload {
  return {
    transitionFormat:
      FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

    action:
      "REVOKE_RETIRED",

    revokedSigningKeyId:
      "FINORA-KEY-RETIRED0000000000001",

    issuedAt,

    schemaVersion:
      1,
  };
}

function createUnsignedRotateEnvelope():
  FinoraRecipientTrustTransitionUnsignedEnvelope {
  const payload =
    createRotatePayload();

  return {
    packageId:
      "FINORA-TRUST-TRANSITION-0001",

    purpose:
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

    target: {
      ...target,
    },

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
        "FINORA_CONTROL_CENTER",

      issuerId,

      signingKeyId:
        currentSignerKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustTransitionPayloadDigest(
        payload,
      ),
  };
}

function createUnsignedRevokeEnvelope():
  FinoraRecipientTrustTransitionUnsignedEnvelope {
  const payload =
    createRevokePayload();

  return {
    packageId:
      "FINORA-TRUST-TRANSITION-0002",

    purpose:
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

    target: {
      ...target,
    },

    issuedAt,

    sequence:
      2,

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
        currentSignerKeyId,
    },

    payloadDigest:
      createFinoraRecipientTrustTransitionPayloadDigest(
        payload,
      ),
  };
}

// ============================================================
// TEST 1 — VALID ROTATE
// ============================================================

const rotateEnvelope =
  createUnsignedRotateEnvelope();

validateFinoraRecipientTrustTransitionUnsignedEnvelope(
  rotateEnvelope,
);

console.log(
  "PASS: valid installation-level ROTATE envelope accepted",
);

// ============================================================
// TEST 2 — BRANCH AUTHORITY INJECTION
// ============================================================

expectRejected(
  "branch-scoped target-field injection",
  () => {
    validateFinoraRecipientTrustTransitionDraft({
      packageId:
        "FINORA-TRUST-INJECT-0001",

      purpose:
        FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

      target: {
        ...target,

        branchId:
          "BRANCH-MUST-NOT-EXIST",
      },

      issuedAt,

      sequence:
        3,

      payloadVersion:
        1,

      payload:
        createRotatePayload(),

      schemaVersion:
        1,
    });
  },
  "target is invalid",
);

// ============================================================
// TEST 3 — PAYLOAD DIGEST TAMPER
// ============================================================

expectRejected(
  "payload digest tamper",
  () => {
    validateFinoraRecipientTrustTransitionUnsignedEnvelope({
      ...createUnsignedRotateEnvelope(),

      payloadDigest: {
        algorithm:
          "SHA-256",

        value:
          "0".repeat(
            64,
          ),
      },
    });
  },
  "payload digest does not match payload",
);

// ============================================================
// TEST 4 — ROTATION CANNOT CHANGE ISSUER
// ============================================================

expectRejected(
  "issuer-changing rotation",
  () => {
    const envelope =
      createUnsignedRotateEnvelope();

    const payload:
      FinoraRecipientTrustRotatePayload = {
      ...envelope.payload as
        FinoraRecipientTrustRotatePayload,

      newTrustedKey: {
        ...(
          envelope.payload as
            FinoraRecipientTrustRotatePayload
        ).newTrustedKey,

        issuerId:
          "FINORA-CC-DIFFERENT-ISSUER",
      },
    };

    validateFinoraRecipientTrustTransitionUnsignedEnvelope({
      ...envelope,

      payload,

      payloadDigest:
        createFinoraRecipientTrustTransitionPayloadDigest(
          payload,
        ),
    });
  },
  "rotation cannot change issuerId",
);

// ============================================================
// TEST 5 — SAME KEY ROTATION
// ============================================================

expectRejected(
  "same-key rotation",
  () => {
    const envelope =
      createUnsignedRotateEnvelope();

    validateFinoraRecipientTrustTransitionUnsignedEnvelope({
      ...envelope,

      issuer: {
        ...envelope.issuer,

        signingKeyId:
          newP256SigningKeyId,
      },
    });
  },
  "requires a different new signing key",
);

// ============================================================
// TEST 6 — SELF REVOCATION
// ============================================================

expectRejected(
  "current signer self-revocation",
  () => {
    const envelope =
      createUnsignedRevokeEnvelope();

    const payload:
      FinoraRecipientTrustRevokeRetiredPayload = {
      ...envelope.payload as
        FinoraRecipientTrustRevokeRetiredPayload,

      revokedSigningKeyId:
        currentSignerKeyId,
    };

    validateFinoraRecipientTrustTransitionUnsignedEnvelope({
      ...envelope,

      payload,

      payloadDigest:
        createFinoraRecipientTrustTransitionPayloadDigest(
          payload,
        ),
    });
  },
  "signer cannot revoke itself",
);

// ============================================================
// TEST 7 — NON-P256 ROTATION KEY
// ============================================================

expectRejected(
  "non-P-256 rotation key",
  () => {
    const envelope =
      createUnsignedRotateEnvelope();

    const nonP256PublicKey =
      createEcPublicKeyBase64(
        "secp384r1",
      );

    const payload = {
      ...(
        envelope.payload as
          FinoraRecipientTrustRotatePayload
      ),

      newTrustedKey: {
        ...(
          envelope.payload as
            FinoraRecipientTrustRotatePayload
        ).newTrustedKey,

        publicKey:
          nonP256PublicKey,

        signingKeyId:
          createSigningKeyId(
            nonP256PublicKey,
          ),
      },
    };

    createFinoraRecipientTrustTransitionPayloadDigest(
      payload,
    );
  },
  "must use P-256",
);

// ============================================================
// TEST 8 — VALID REVOKE_RETIRED
// ============================================================

const revokeEnvelope =
  createUnsignedRevokeEnvelope();

validateFinoraRecipientTrustTransitionUnsignedEnvelope(
  revokeEnvelope,
);

console.log(
  "PASS: valid installation-level REVOKE_RETIRED envelope accepted",
);

// ============================================================
// TEST 9 — DETERMINISTIC CANONICALIZATION
// ============================================================

const canonicalA =
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
    rotateEnvelope,
  );

const reorderedEquivalent:
  FinoraRecipientTrustTransitionUnsignedEnvelope = {
    schemaVersion:
      rotateEnvelope.schemaVersion,

    payloadDigest:
      rotateEnvelope.payloadDigest,

    issuer:
      rotateEnvelope.issuer,

    payload:
      rotateEnvelope.payload,

    payloadVersion:
      rotateEnvelope.payloadVersion,

    sequence:
      rotateEnvelope.sequence,

    issuedAt:
      rotateEnvelope.issuedAt,

    target:
      rotateEnvelope.target,

    purpose:
      rotateEnvelope.purpose,

    packageId:
      rotateEnvelope.packageId,
  };

const canonicalB =
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
    reorderedEquivalent,
  );

assert(
  canonicalA ===
    canonicalB,
  "Equivalent transition envelopes did not canonicalize identically.",
);

console.log(
  "PASS: trust-transition canonicalization is deterministic across property order",
);

// ============================================================
// TEST 10 — SIGNED ENVELOPE STRUCTURAL CONTRACT
// ============================================================

const signedEnvelope:
  FinoraRecipientTrustTransitionSignedEnvelope = {
  ...rotateEnvelope,

  signature: {
    algorithm:
      "ECDSA_P256_SHA256",

    encoding:
      "IEEE_P1363",

    canonicalization:
      "FINORA_CANONICAL_JSON_V1",

    signingKeyId:
      currentSignerKeyId,

    value:
      Buffer.alloc(
        64,
        7,
      ).toString(
        "base64",
      ),
  },
};

validateFinoraRecipientTrustTransitionSignedEnvelope(
  signedEnvelope,
);

console.log(
  "PASS: structurally valid 64-byte IEEE-P1363 signature envelope accepted",
);

// ============================================================
// TEST 11 — INVALID SIGNATURE LENGTH
// ============================================================

expectRejected(
  "invalid IEEE-P1363 signature length",
  () => {
    validateFinoraRecipientTrustTransitionSignedEnvelope({
      ...signedEnvelope,

      signature: {
        ...signedEnvelope.signature,

        value:
          Buffer.alloc(
            63,
            7,
          ).toString(
            "base64",
          ),
      },
    });
  },
  "must be a 64-byte IEEE-P1363",
);

// ============================================================
// FINAL
// ============================================================

console.log(
  "============================================================",
);

console.log(
  "PASS: FINORA RECIPIENT TRUST TRANSITION CONTRACT SELFTEST",
);

console.log(
  "============================================================",
);