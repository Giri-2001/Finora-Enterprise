/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY VERIFIER

   MODULE  : Native Control
   LAYER   : Pure Cryptographic Verification
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Validate one signed RECIPIENT_TRUST_RECOVERY envelope
   - Require the independently provisioned recovery authority
   - Require exact native installation target
   - Require recovery-authority installation binding to match
     the exact native installation target
   - Require recovery package issuance at or after recovery-root
     provisioning
   - Reject packages issued after authoritative accepted time
   - Verify ECDSA P-256 / SHA-256 / IEEE-P1363 signature over
     the FINORA canonical unsigned recovery envelope

   TRUST SOURCE:

   recoveryAuthorityStore supplied to this pure verifier must
   originate from the validated encrypted recipient recovery-
   authority store.

   A recovery package can never introduce or select its own
   recovery authority.

   AUTHORITY SEPARATION:

   - No operational ACTIVE recipient signing key is accepted.
   - No recipient operational trusted-key array is accepted.
   - Recovery authorization is exclusively the separately
     provisioned FINORA_RECOVERY_AUTHORITY root.

   SECURITY:

   - Public keys only.
   - No private key.
   - No Electron API.
   - No filesystem.
   - No persistence.
   - No recipient trust mutation.
   - No recovery-root mutation.
   - No IPC.
   - No preload.
   - No renderer.
=========================================================== */

import {
  createPublicKey,
  verify as nodeVerify,
} from "node:crypto";

import {
  assertFinoraP256SpkiPublicKey,
} from "./finoraInstallationBindingCrypto.js";

import {
  canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope,
  validateFinoraRecipientTrustRecoverySignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import {
  validateFinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import type {
  FinoraRecipientTrustRecoverySignedEnvelope,
} from "./finoraRecipientTrustRecoveryContract.js";

import type {
  FinoraRecipientTrustRecoveryAuthorityStoreState,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import type {
  FinoraRecipientTrustTransitionTarget,
} from "./finoraRecipientTrustTransitionContract.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryVerificationFailureReason =
  | "MALFORMED_RECOVERY"
  | "INVALID_RECOVERY_AUTHORITY"
  | "RECOVERY_AUTHORITY_TARGET_MISMATCH"
  | "TARGET_MISMATCH"
  | "RECOVERY_AUTHORITY_MISMATCH"
  | "RECOVERY_AUTHORITY_NOT_YET_TRUSTED"
  | "RECOVERY_ISSUED_IN_FUTURE"
  | "INVALID_ACCEPTED_TIME"
  | "UNSUPPORTED_RECOVERY_AUTHORITY"
  | "INVALID_SIGNATURE";

export type FinoraRecipientTrustRecoveryVerificationResult =
  | {
      valid:
        true;

      envelope:
        FinoraRecipientTrustRecoverySignedEnvelope;

      recoveryAuthority:
        FinoraRecipientTrustRecoveryAuthorityStoreState["authority"];
    }
  | {
      valid:
        false;

      reason:
        FinoraRecipientTrustRecoveryVerificationFailureReason;

      error:
        string;
    };

// ============================================================
// FAILURE
// ============================================================

function failure(
  reason:
    FinoraRecipientTrustRecoveryVerificationFailureReason,
  error:
    string,
): FinoraRecipientTrustRecoveryVerificationResult {
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

export function verifyFinoraRecipientTrustRecovery(
  candidate:
    unknown,
  recoveryAuthorityStore:
    FinoraRecipientTrustRecoveryAuthorityStoreState,
  expectedTarget:
    FinoraRecipientTrustTransitionTarget,
  acceptedNow:
    Date,
): FinoraRecipientTrustRecoveryVerificationResult {
  // ----------------------------------------------------------
  // AUTHORITATIVE RECOVERY ROOT STATE
  // ----------------------------------------------------------

  try {
    validateFinoraRecipientTrustRecoveryAuthorityStoreState(
      recoveryAuthorityStore,
    );
  } catch (
    error
  ) {
    return failure(
      "INVALID_RECOVERY_AUTHORITY",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust recovery authority is invalid.",
    );
  }

  // ----------------------------------------------------------
  // RECOVERY ROOT MUST BELONG TO THIS NATIVE INSTALLATION
  // ----------------------------------------------------------

  if (
    !targetMatches(
      recoveryAuthorityStore.installation,
      expectedTarget,
    )
  ) {
    return failure(
      "RECOVERY_AUTHORITY_TARGET_MISMATCH",
      "FINORA recipient trust recovery authority is not bound to this native installation.",
    );
  }

  // ----------------------------------------------------------
  // STRUCTURE + DIGEST + RECOVERY DOMAIN CONTRACT
  //
  // The signed-envelope contract:
  //
  // - validates exact object shape,
  // - validates RECIPIENT_TRUST_RECOVERY purpose,
  // - validates REPLACE_ACTIVE payload,
  // - recomputes payload digest,
  // - requires independent FINORA_RECOVERY_AUTHORITY issuer,
  // - requires issuer/signature signingKeyId equality,
  // - validates canonical Base64,
  // - requires exact 64-byte IEEE-P1363 signature length.
  // ----------------------------------------------------------

  let envelope:
    FinoraRecipientTrustRecoverySignedEnvelope;

  try {
    validateFinoraRecipientTrustRecoverySignedEnvelope(
      candidate,
    );

    envelope =
      candidate;
  } catch (
    error
  ) {
    return failure(
      "MALFORMED_RECOVERY",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust recovery structure is invalid.",
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
      "FINORA recipient trust recovery target does not match this native installation.",
    );
  }

  // ----------------------------------------------------------
  // INDEPENDENT RECOVERY AUTHORITY IDENTITY
  //
  // No operational recipient signing key participates here.
  // The signer must exactly match the independently provisioned
  // recovery-authority store.
  // ----------------------------------------------------------

  const trustedRecoveryAuthority =
    recoveryAuthorityStore.authority;

  if (
    envelope.issuer.type !==
      "FINORA_RECOVERY_AUTHORITY" ||
    envelope.issuer.recoveryAuthorityId !==
      trustedRecoveryAuthority.recoveryAuthorityId ||
    envelope.issuer.signingKeyId !==
      trustedRecoveryAuthority.signingKeyId ||
    envelope.signature.signingKeyId !==
      trustedRecoveryAuthority.signingKeyId
  ) {
    return failure(
      "RECOVERY_AUTHORITY_MISMATCH",
      "FINORA recipient trust recovery signer does not match the independently provisioned recovery authority.",
    );
  }

  // ----------------------------------------------------------
  // TRUSTED RECOVERY KEY CONTRACT
  // ----------------------------------------------------------

  if (
    trustedRecoveryAuthority.algorithm !==
      "ECDSA_P256_SHA256" ||
    trustedRecoveryAuthority.format !==
      "SPKI_DER_BASE64"
  ) {
    return failure(
      "UNSUPPORTED_RECOVERY_AUTHORITY",
      "FINORA recipient trust recovery authority uses an unsupported public-key contract.",
    );
  }

  // ----------------------------------------------------------
  // TEMPORAL AUTHORITY
  //
  // A recovery package cannot become retroactively trusted:
  //
  //   recovery-root provisionedAt <= package issuedAt
  //
  // Nor can it be accepted before its claimed issue time:
  //
  //   package issuedAt <= authoritative acceptedNow
  // ----------------------------------------------------------

  const provisionedAt =
    parseCanonicalIsoTimestamp(
      recoveryAuthorityStore.provisionedAt,
    );

  const issuedAt =
    parseCanonicalIsoTimestamp(
      envelope.issuedAt,
    );

  const acceptedNowMs =
    acceptedNow.getTime();

  if (
    !Number.isFinite(
      acceptedNowMs,
    )
  ) {
    return failure(
      "INVALID_ACCEPTED_TIME",
      "FINORA recipient trust recovery accepted time is invalid.",
    );
  }

  if (
    provisionedAt ===
      undefined ||
    issuedAt ===
      undefined
  ) {
    return failure(
      "MALFORMED_RECOVERY",
      "FINORA recipient trust recovery temporal authority state is invalid.",
    );
  }

  if (
    issuedAt <
      provisionedAt
  ) {
    return failure(
      "RECOVERY_AUTHORITY_NOT_YET_TRUSTED",
      "FINORA recipient trust recovery was issued before the recovery authority was provisioned.",
    );
  }

  if (
    issuedAt >
      acceptedNowMs
  ) {
    return failure(
      "RECOVERY_ISSUED_IN_FUTURE",
      "FINORA recipient trust recovery was issued after the authoritative accepted time.",
    );
  }

  // ----------------------------------------------------------
  // RECOVERY PUBLIC KEY
  // ----------------------------------------------------------

  try {
    assertFinoraP256SpkiPublicKey(
      trustedRecoveryAuthority.publicKey,
    );
  } catch (
    error
  ) {
    return failure(
      "UNSUPPORTED_RECOVERY_AUTHORITY",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust recovery authority public key is invalid.",
    );
  }

  let publicKey:
    ReturnType<
      typeof createPublicKey
    >;

  try {
    publicKey =
      createPublicKey({
        key:
          Buffer.from(
            trustedRecoveryAuthority.publicKey,
            "base64",
          ),

        format:
          "der",

        type:
          "spki",
      });
  } catch {
    return failure(
      "INVALID_RECOVERY_AUTHORITY",
      "FINORA recipient trust recovery authority public key is invalid.",
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
      canonicalizeFinoraRecipientTrustRecoveryUnsignedEnvelope(
        unsignedEnvelope,
      );
  } catch (
    error
  ) {
    return failure(
      "MALFORMED_RECOVERY",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust recovery canonicalization failed.",
    );
  }

  // ----------------------------------------------------------
  // SIGNATURE
  //
  // Strict Base64 and exact 64-byte length were already enforced
  // by validateFinoraRecipientTrustRecoverySignedEnvelope().
  // ----------------------------------------------------------

  const signature =
    Buffer.from(
      envelope.signature.value,
      "base64",
    );

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
        "FINORA recipient trust recovery signature verification failed.",
      );
    }
  } catch (
    error
  ) {
    return failure(
      "INVALID_SIGNATURE",
      error instanceof Error
        ? error.message
        : "FINORA recipient trust recovery signature verification failed.",
    );
  }

  // ----------------------------------------------------------
  // VERIFIED
  // ----------------------------------------------------------

  return {
    valid:
      true,

    envelope,

    recoveryAuthority:
      trustedRecoveryAuthority,
  };
}

// ============================================================
// END
// ============================================================