/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY CONTRACT SELF TEST

   RESPONSIBILITY:

   - Verify installation-only recovery target validation
   - Verify independent recovery-authority envelope structure
   - Verify REPLACE_ACTIVE recovery payload
   - Verify operational issuer continuity
   - Verify replacement differs from expected compromised ACTIVE key
   - Verify shared operational ACTIVE P-256 key validation
   - Verify recovery sequence and issuedAt consistency
   - Verify payload digest integrity
   - Verify deterministic canonicalization
   - Verify signed-envelope signature shape

   IMPORTANT:

   - Pure contract test.
   - No Electron runtime.
   - No persistence.
   - No trust-store mutation.
   - No recovery-authority trust verification.
   - No IPC.
=========================================================== */

import {
  generateKeyPairSync,
} from "node:crypto";

import {
  createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "./finoraInstallationBindingCrypto.js";

import {
  FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT,
  FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  createFinoraRecipientTrustRecoveryPayloadDigest,
  validateFinoraRecipientTrustRecoveryDraft,
  validateFinoraRecipientTrustRecoveryPayload,
  validateFinoraRecipientTrustRecoverySignedEnvelope,
  validateFinoraRecipientTrustRecoveryTarget,
  validateFinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoveryPayload,
  FinoraRecipientTrustRecoverySignedEnvelope,
  FinoraRecipientTrustRecoveryUnsignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustTransitionTarget,
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

function createOperationalSigningKeyId(
  publicKey:
    string,
): string {
  const fingerprint =
    createFinoraInstallationBindingFingerprint(
      publicKey,
    );

  return createFinoraControlCenterSigningKeyIdFromPublicKeyFingerprint(
    fingerprint,
  );
}

// ============================================================
// FIXTURES
// ============================================================

const operationalIssuerId =
  "FINORA-CC-RECOVERY-SELFTEST";

const recoveryAuthorityId =
  "FINORA-RECOVERY-AUTHORITY-SELFTEST";

const recoveryAuthoritySigningKeyId =
  "FINORA-RECOVERY-KEY-SELFTEST";

const expectedActiveSigningKeyId =
  "FINORA-KEY-COMPROMISED000000001";

const issuedAt =
  "2026-09-08T10:00:00.000Z";

const target:
  FinoraRecipientTrustTransitionTarget = {
    installationId:
      "FINORA-INSTALLATION-RECOVERY-SELFTEST",

    bindingKeyId:
      "FINORA-BINDING-RECOVERY-SELFTEST",

    fingerprintAlgorithm:
      "SHA-256",

    publicKeyFingerprint:
      "a".repeat(
        64,
      ),
  };

const replacementP256PublicKey =
  createEcPublicKeyBase64(
    "prime256v1",
  );

const replacementSigningKeyId =
  createOperationalSigningKeyId(
    replacementP256PublicKey,
  );

const replacementTrustedKey:
  FinoraBranchTrustedControlPublicKey = {
    issuerId:
      operationalIssuerId,

    signingKeyId:
      replacementSigningKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      replacementP256PublicKey,

    status:
      "ACTIVE",

    validFrom:
      issuedAt,
  };

const validPayload:
  FinoraRecipientTrustRecoveryPayload = {
    recoveryFormat:
      FINORA_RECIPIENT_TRUST_RECOVERY_FORMAT,

    action:
      "REPLACE_ACTIVE",

    operationalIssuerId,

    expectedActiveSigningKeyId,

    replacementTrustedKey,

    issuedAt,

    schemaVersion:
      1,
  };

// ============================================================
// TEST 1 — VALID TARGET
// ============================================================

validateFinoraRecipientTrustRecoveryTarget(
  target,
);

console.log(
  "PASS: installation-only recipient trust recovery target accepted",
);

// ============================================================
// TEST 2 — TARGET EXTRA SCOPE REJECTED
// ============================================================

expectRejected(
  "recovery target with unsupported business scope",
  () => {
    validateFinoraRecipientTrustRecoveryTarget({
      ...target,

      businessId:
        "MUST-NOT-BE-PRESENT",
    });
  },
  "target is invalid",
);

// ============================================================
// TEST 3 — VALID REPLACE_ACTIVE PAYLOAD
// ============================================================

validateFinoraRecipientTrustRecoveryPayload(
  validPayload,
);

console.log(
  "PASS: valid REPLACE_ACTIVE recovery payload accepted",
);

// ============================================================
// TEST 4 — OPERATIONAL ISSUER MISMATCH
// ============================================================

expectRejected(
  "recovery replacement operational issuer mismatch",
  () => {
    validateFinoraRecipientTrustRecoveryPayload({
      ...validPayload,

      replacementTrustedKey: {
        ...replacementTrustedKey,

        issuerId:
          "FINORA-OTHER-OPERATIONAL-ISSUER",
      },
    });
  },
  "must preserve the operational issuerId",
);

// ============================================================
// TEST 5 — REPLACEMENT CANNOT EQUAL EXPECTED ACTIVE KEY
// ============================================================

expectRejected(
  "recovery replacement equal to expected compromised ACTIVE key",
  () => {
    validateFinoraRecipientTrustRecoveryPayload({
      ...validPayload,

      expectedActiveSigningKeyId:
        replacementSigningKeyId,
    });
  },
  "must differ from the expected compromised ACTIVE key",
);

// ============================================================
// TEST 6 — REPLACEMENT MUST BE ACTIVE
// ============================================================

expectRejected(
  "non-ACTIVE recovery replacement key",
  () => {
    validateFinoraRecipientTrustRecoveryPayload({
      ...validPayload,

      replacementTrustedKey: {
        ...replacementTrustedKey,

        status:
          "REVOKED",
      },
    });
  },
  "invalid new ACTIVE signing key",
);

// ============================================================
// TEST 7 — REPLACEMENT VALIDFROM MUST EQUAL ISSUEDAT
// ============================================================

expectRejected(
  "recovery replacement validFrom mismatch",
  () => {
    validateFinoraRecipientTrustRecoveryPayload({
      ...validPayload,

      replacementTrustedKey: {
        ...replacementTrustedKey,

        validFrom:
          "2026-09-08T09:59:59.000Z",
      },
    });
  },
  "invalid new ACTIVE signing key",
);

// ============================================================
// TEST 8 — REPLACEMENT MUST USE P-256
// ============================================================

const nonP256PublicKey =
  createEcPublicKeyBase64(
    "secp384r1",
  );

expectRejected(
  "non-P-256 recovery replacement key",
  () => {
    validateFinoraRecipientTrustRecoveryPayload({
      ...validPayload,

      replacementTrustedKey: {
        ...replacementTrustedKey,

        publicKey:
          nonP256PublicKey,

        signingKeyId:
          createOperationalSigningKeyId(
            nonP256PublicKey,
          ),
      },
    });
  },
  "must use P-256",
);

// ============================================================
// TEST 9 — CANONICAL OPERATIONAL KEY ID REQUIRED
// ============================================================

expectRejected(
  "non-canonical recovery replacement signingKeyId",
  () => {
    validateFinoraRecipientTrustRecoveryPayload({
      ...validPayload,

      replacementTrustedKey: {
        ...replacementTrustedKey,

        signingKeyId:
          "FINORA-KEY-WRONG000000000000001",
      },
    });
  },
  "signingKeyId does not match the new public key",
);

// ============================================================
// VALID DRAFT
// ============================================================

const validDraft = {
  packageId:
    "FINORA-RECIPIENT-TRUST-RECOVERY-SELFTEST-0001",

  purpose:
    FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,

  target,

  issuedAt,

  sequence:
    1,

  payloadVersion:
    1 as const,

  payload:
    validPayload,

  schemaVersion:
    1 as const,
};

// ============================================================
// TEST 10 — VALID DRAFT
// ============================================================

validateFinoraRecipientTrustRecoveryDraft(
  validDraft,
);

console.log(
  "PASS: valid recipient trust recovery draft accepted",
);

// ============================================================
// TEST 11 — INVALID SEQUENCE
// ============================================================

expectRejected(
  "non-positive recovery sequence",
  () => {
    validateFinoraRecipientTrustRecoveryDraft({
      ...validDraft,

      sequence:
        0,
    });
  },
  "draft structure is invalid",
);

// ============================================================
// TEST 12 — PAYLOAD / ENVELOPE ISSUEDAT MISMATCH
// ============================================================

expectRejected(
  "recovery payload and envelope issuedAt mismatch",
  () => {
    validateFinoraRecipientTrustRecoveryDraft({
      ...validDraft,

      issuedAt:
        "2026-09-08T10:01:00.000Z",
    });
  },
  "must match exactly",
);

// ============================================================
// TEST 13 — DETERMINISTIC PAYLOAD DIGEST
// ============================================================

const payloadDigestA =
  createFinoraRecipientTrustRecoveryPayloadDigest(
    validPayload,
  );

const payloadDigestB =
  createFinoraRecipientTrustRecoveryPayloadDigest(
    {
      schemaVersion:
        validPayload.schemaVersion,

      issuedAt:
        validPayload.issuedAt,

      replacementTrustedKey:
        validPayload.replacementTrustedKey,

      expectedActiveSigningKeyId:
        validPayload.expectedActiveSigningKeyId,

      operationalIssuerId:
        validPayload.operationalIssuerId,

      action:
        validPayload.action,

      recoveryFormat:
        validPayload.recoveryFormat,
    },
  );

assert(
  payloadDigestA.algorithm ===
    "SHA-256" &&
  payloadDigestA.value ===
    payloadDigestB.value &&
  /^[0-9a-f]{64}$/.test(
    payloadDigestA.value,
  ),
  "Equivalent recovery payloads did not produce one deterministic SHA-256 digest.",
);

console.log(
  "PASS: recipient trust recovery payload digest is deterministic",
);

// ============================================================
// VALID UNSIGNED ENVELOPE
// ============================================================

const unsignedEnvelope:
  FinoraRecipientTrustRecoveryUnsignedEnvelope = {
    ...validDraft,

    issuer: {
      type:
        "FINORA_RECOVERY_AUTHORITY",

      recoveryAuthorityId,

      signingKeyId:
        recoveryAuthoritySigningKeyId,
    },

    payloadDigest:
      payloadDigestA,
  };

// ============================================================
// TEST 14 — VALID UNSIGNED ENVELOPE
// ============================================================

validateFinoraRecipientTrustRecoveryUnsignedEnvelope(
  unsignedEnvelope,
);

console.log(
  "PASS: valid independent recovery-authority unsigned envelope accepted",
);

// ============================================================
// TEST 15 — WRONG RECOVERY AUTHORITY STRUCTURE
// ============================================================

expectRejected(
  "operational Control Center used as recovery authority",
  () => {
    validateFinoraRecipientTrustRecoveryUnsignedEnvelope({
      ...unsignedEnvelope,

      issuer: {
        ...unsignedEnvelope.issuer,

        type:
          "FINORA_CONTROL_CENTER",
      },
    });
  },
  "issuer structure is invalid",
);

// ============================================================
// TEST 16 — PAYLOAD DIGEST TAMPER
// ============================================================

expectRejected(
  "recovery payload digest tamper",
  () => {
    validateFinoraRecipientTrustRecoveryUnsignedEnvelope({
      ...unsignedEnvelope,

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
  "payload digest does not match its payload",
);

// ============================================================
// TEST 17 — DETERMINISTIC UNSIGNED CANONICALIZATION
// ============================================================

const canonicalA =
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
    unsignedEnvelope,
  );

const reorderedEquivalent:
  FinoraRecipientTrustRecoveryUnsignedEnvelope = {
    payloadDigest:
      unsignedEnvelope.payloadDigest,

    issuer:
      unsignedEnvelope.issuer,

    schemaVersion:
      unsignedEnvelope.schemaVersion,

    payload:
      unsignedEnvelope.payload,

    payloadVersion:
      unsignedEnvelope.payloadVersion,

    sequence:
      unsignedEnvelope.sequence,

    issuedAt:
      unsignedEnvelope.issuedAt,

    target:
      unsignedEnvelope.target,

    purpose:
      unsignedEnvelope.purpose,

    packageId:
      unsignedEnvelope.packageId,
  };

const canonicalB =
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
    reorderedEquivalent,
  );

assert(
  canonicalA ===
    canonicalB,
  "Equivalent recovery envelopes did not canonicalize identically.",
);

console.log(
  "PASS: recipient trust recovery canonicalization is deterministic across property order",
);

// ============================================================
// VALID SIGNED ENVELOPE
// ============================================================

const signedEnvelope:
  FinoraRecipientTrustRecoverySignedEnvelope = {
    ...unsignedEnvelope,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      signingKeyId:
        recoveryAuthoritySigningKeyId,

      value:
        Buffer.alloc(
          64,
          7,
        ).toString(
          "base64",
        ),
    },
  };

// ============================================================
// TEST 18 — VALID SIGNED STRUCTURAL CONTRACT
// ============================================================

validateFinoraRecipientTrustRecoverySignedEnvelope(
  signedEnvelope,
);

console.log(
  "PASS: structurally valid recovery 64-byte IEEE-P1363 signature envelope accepted",
);

// ============================================================
// TEST 19 — SIGNATURE KEY ID MUST MATCH RECOVERY ISSUER
// ============================================================

expectRejected(
  "recovery signature signingKeyId mismatch",
  () => {
    validateFinoraRecipientTrustRecoverySignedEnvelope({
      ...signedEnvelope,

      signature: {
        ...signedEnvelope.signature,

        signingKeyId:
          "FINORA-RECOVERY-KEY-WRONG",
      },
    });
  },
  "signature contract is invalid",
);

// ============================================================
// TEST 20 — INVALID SIGNATURE LENGTH
// ============================================================

expectRejected(
  "invalid recovery IEEE-P1363 signature length",
  () => {
    validateFinoraRecipientTrustRecoverySignedEnvelope({
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
  "PASS: FINORA RECIPIENT TRUST RECOVERY CONTRACT SELFTEST",
);

console.log(
  "============================================================",
);