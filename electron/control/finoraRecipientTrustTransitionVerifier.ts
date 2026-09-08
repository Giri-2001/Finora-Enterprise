/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION VERIFIER

   MODULE  : Native Control
   LAYER   : Pure Cryptographic Verification
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Validate signed recipient trust-transition envelope shape
   - Enforce exact native installation target
   - Resolve signer only from already-authoritative trusted keys
   - Require the transition signer to be the single ACTIVE key
     for that issuer
   - Enforce signer validity at transition issuedAt
   - Verify ECDSA P-256 / SHA-256 / IEEE-P1363 signature over
     FINORA canonical unsigned envelope

   SECURITY:

   - PUBLIC keys only.
   - No private key.
   - No Electron API.
   - No filesystem.
   - No persistence.
   - No IPC.
   - No renderer.
   - No environment variables.
   - No trust bootstrap.
   - No trust mutation.
   - No replay mutation.

   TRUST SOURCE:

   trustedKeys supplied to this pure verifier must originate
   from the validated native recipient trust store.

   A signed transition can never introduce its own signer key.

   VALIDITY:

   Existing FINORA signer-key historical-validity semantics are
   preserved:

   issuedAt === validUntil is valid.

   Only issuedAt > validUntil is rejected.
=========================================================== */

import {
  createPublicKey,
  verify as nodeVerify,
} from "node:crypto";

import {
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  validateFinoraRecipientTrustTransitionSignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustTransitionVerificationResult =
  | {
      valid:
        true;

      envelope:
        FinoraRecipientTrustTransitionSignedEnvelope;

      trustedSigner:
        FinoraBranchTrustedControlPublicKey;
    }
  | {
      valid:
        false;

      reason:
        | "MALFORMED_TRANSITION"
        | "TARGET_MISMATCH"
        | "UNKNOWN_SIGNING_KEY"
        | "SIGNING_KEY_NOT_ACTIVE"
        | "AMBIGUOUS_ACTIVE_SIGNER"
        | "SIGNING_KEY_NOT_VALID"
        | "UNSUPPORTED_TRUST_KEY"
        | "INVALID_SIGNATURE";

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  reason:
    Extract<
      FinoraRecipientTrustTransitionVerificationResult,
      {
        valid:
          false;
      }
    >["reason"],
  error:
    string,
): FinoraRecipientTrustTransitionVerificationResult {
  return {
    valid:
      false,

    reason,

    error,
  };
}

// ============================================================
// TIMESTAMP
// ============================================================

function parseCanonicalIsoTimestamp(
  value:
    string,
): number | undefined {
  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    ) ||
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    return undefined;
  }

  return parsed;
}

// ============================================================
// TARGET
// ============================================================

function targetMatches(
  actual:
    FinoraRecipientTrustTransitionTarget,
  expected:
    FinoraRecipientTrustTransitionTarget,
): boolean {
  return (
    actual.installationId ===
      expected.installationId &&
    actual.bindingKeyId ===
      expected.bindingKeyId &&
    actual.fingerprintAlgorithm ===
      expected.fingerprintAlgorithm &&
    actual.publicKeyFingerprint ===
      expected.publicKeyFingerprint
  );
}

// ============================================================
// VERIFY
// ============================================================

export function verifyFinoraRecipientTrustTransition(
  candidate:
    unknown,
  trustedKeys:
    readonly FinoraBranchTrustedControlPublicKey[],
  expectedTarget:
    FinoraRecipientTrustTransitionTarget,
): FinoraRecipientTrustTransitionVerificationResult {
  // ----------------------------------------------------------
  // STRUCTURE + DIGEST + TRANSITION DOMAIN CONTRACT
  // ----------------------------------------------------------

  let envelope:
    FinoraRecipientTrustTransitionSignedEnvelope;

  try {
    validateFinoraRecipientTrustTransitionSignedEnvelope(
      candidate,
    );

    envelope =
      candidate;
  } catch (
    error
  ) {
    return failure(
      "MALFORMED_TRANSITION",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust transition structure is invalid.",
    );
  }

  // ----------------------------------------------------------
  // EXACT NATIVE INSTALLATION TARGET
  // ----------------------------------------------------------

  if (
    !targetMatches(
      envelope.target,
      expectedTarget,
    )
  ) {
    return failure(
      "TARGET_MISMATCH",
      "FINORA recipient trust transition target does not match this native installation.",
    );
  }

  // ----------------------------------------------------------
  // SIGNER LOOKUP
  //
  // The transition itself cannot introduce this trust.
  // Signer must already exist in recipient-authoritative state.
  // ----------------------------------------------------------

  const trustedSigner =
    trustedKeys.find(
      (key) =>
        key.issuerId ===
          envelope.issuer.issuerId &&
        key.signingKeyId ===
          envelope.signature.signingKeyId,
    );

  if (
    trustedSigner ===
      undefined
  ) {
    return failure(
      "UNKNOWN_SIGNING_KEY",
      "FINORA recipient trust transition signing key is unknown.",
    );
  }

  // ----------------------------------------------------------
  // TRUST KEY CRYPTO CONTRACT
  // ----------------------------------------------------------

  if (
    trustedSigner.algorithm !==
      "ECDSA_P256_SHA256" ||
    trustedSigner.format !==
      "SPKI_DER_BASE64"
  ) {
    return failure(
      "UNSUPPORTED_TRUST_KEY",
      "FINORA recipient trust transition signer uses an unsupported trusted-key contract.",
    );
  }

  // ----------------------------------------------------------
  // CURRENT ACTIVE AUTHORITY ONLY
  // ----------------------------------------------------------

  if (
    trustedSigner.status !==
      "ACTIVE"
  ) {
    return failure(
      "SIGNING_KEY_NOT_ACTIVE",
      "FINORA recipient trust transition must be signed by the current ACTIVE signing key.",
    );
  }

  const activeKeysForIssuer =
    trustedKeys.filter(
      (key) =>
        key.issuerId ===
          envelope.issuer.issuerId &&
        key.status ===
          "ACTIVE",
    );

  if (
    activeKeysForIssuer.length !==
      1 ||
    activeKeysForIssuer[0].signingKeyId !==
      trustedSigner.signingKeyId
  ) {
    return failure(
      "AMBIGUOUS_ACTIVE_SIGNER",
      "FINORA recipient trust authority does not contain exactly one ACTIVE signing key for this issuer.",
    );
  }

  // ----------------------------------------------------------
  // SIGNER HISTORICAL VALIDITY AT TRANSITION ISSUEDAT
  // ----------------------------------------------------------

  const issuedAt =
    parseCanonicalIsoTimestamp(
      envelope.issuedAt,
    );

  const validFrom =
    parseCanonicalIsoTimestamp(
      trustedSigner.validFrom,
    );

  const validUntil =
    trustedSigner.validUntil ===
      undefined
      ? undefined
      : parseCanonicalIsoTimestamp(
          trustedSigner.validUntil,
        );

  if (
    issuedAt ===
      undefined ||
    validFrom ===
      undefined ||
    issuedAt <
      validFrom ||
    (
      trustedSigner.validUntil !==
        undefined &&
      (
        validUntil ===
          undefined ||
        validUntil <
          validFrom ||
        issuedAt >
          validUntil
      )
    )
  ) {
    return failure(
      "SIGNING_KEY_NOT_VALID",
      "FINORA recipient trust transition signer was not valid when the transition was issued.",
    );
  }

  // ----------------------------------------------------------
  // PUBLIC KEY
  // ----------------------------------------------------------

  let publicKey:
    ReturnType<
      typeof createPublicKey
    >;

  try {
    publicKey =
      createPublicKey({
        key:
          Buffer.from(
            trustedSigner.publicKey,
            "base64",
          ),

        format:
          "der",

        type:
          "spki",
      });
  } catch {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA recipient trust transition signer public key is invalid.",
    );
  }

  if (
    publicKey.asymmetricKeyType !==
      "ec" ||
    publicKey.asymmetricKeyDetails?.namedCurve !==
      "prime256v1"
  ) {
    return failure(
      "UNSUPPORTED_TRUST_KEY",
      "FINORA recipient trust transition signer must use an EC P-256 public key.",
    );
  }

  // ----------------------------------------------------------
  // CANONICAL UNSIGNED ENVELOPE
  // ----------------------------------------------------------

  const {
    signature:
      _signature,
    ...unsignedEnvelope
  } =
    envelope;

  let canonicalEnvelope:
    string;

  try {
    canonicalEnvelope =
      canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
        unsignedEnvelope,
      );
  } catch (
    error
  ) {
    return failure(
      "MALFORMED_TRANSITION",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust transition canonicalization failed.",
    );
  }

  // ----------------------------------------------------------
  // SIGNATURE
  // ----------------------------------------------------------

  let signature:
    Buffer;

  try {
    signature =
      Buffer.from(
        envelope.signature.value,
        "base64",
      );
  } catch {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA recipient trust transition signature encoding is invalid.",
    );
  }

  if (
    signature.byteLength !==
      64
  ) {
    return failure(
      "INVALID_SIGNATURE",
      "FINORA recipient trust transition signature length is invalid.",
    );
  }

  try {
    const verified =
      nodeVerify(
        "sha256",
        Buffer.from(
          canonicalEnvelope,
          "utf8",
        ),
        {
          key:
            publicKey,

          dsaEncoding:
            "ieee-p1363",
        },
        signature,
      );

    if (
      !verified
    ) {
      return failure(
        "INVALID_SIGNATURE",
        "FINORA recipient trust transition signature verification failed.",
      );
    }
  } catch (
    error
  ) {
    return failure(
      "INVALID_SIGNATURE",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust transition signature verification failed.",
    );
  }

  // ----------------------------------------------------------
  // VERIFIED
  // ----------------------------------------------------------

  return {
    valid:
      true,

    envelope,

    trustedSigner,
  };
}

// ============================================================
// END
// ============================================================