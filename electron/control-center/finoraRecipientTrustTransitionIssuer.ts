/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST TRANSITION ISSUER

   MODULE  : Control Center
   LAYER   : Privileged Native Issuance
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve authoritative Control Center signing-key vault
   - Select one current / retained local authorizing key
   - Require ROTATE destination to equal current top-level key
   - Validate historical REVOKE_RETIRED authority
   - Persist installation-level issuance reservation
   - Build canonical recipient trust-transition envelope
   - Sign with real Control Center private key material
   - Return signed public transition package

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer.
   - No IPC.
   - No caller-supplied issuerId.
   - No caller-supplied destination signing key.
   - No caller-supplied private key.
   - No recipient trusted-key input.
   - Private signing material never appears in result.

   ROTATE POLICY:

   The destination is always the CURRENT top-level Control
   Center key at the serialized authority snapshot.

   Therefore a recipient still trusting historical key A may
   receive:

       A -> CURRENT

   even after Control Center has rotated through B -> C.

   A request whose authorizer is already CURRENT is rejected
   as a same-key rotation.

   REVOKE_RETIRED POLICY:

   The revoked key must:

   - exist in local retained history,
   - differ from authorizer,
   - have retired no later than authorizer creation.

   This prevents an older authorizer from issuing a logically
   impossible revocation of a future successor key.

   SERIALIZATION:

   Vault snapshot
   -> signer selection
   -> destination / history policy
   -> issuance reservation
   -> envelope construction
   -> signature

   executes under the same key-authority queue used by local
   signing-key rotation.

   Local rotation therefore cannot interleave with the issuer's
   key-authority decision.

   The issuance ledger has its own same-process sequence queue.
   No cross-process CAS guarantee.

   Reservation is persisted before signing. Sequence gaps are
   permitted if later signing unexpectedly fails.
=========================================================== */

import {
  signFinoraControlCenterCanonicalValue,
} from "./finoraControlCenterCrypto.js";

import {
  runFinoraControlCenterKeyAuthoritySerialized,
} from "./finoraControlCenterKeyAuthorityQueue.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterKeyVaultRecord,
  FinoraControlCenterRetainedSigningKeyRecord,
} from "./finoraControlCenterKeyVault.js";

import {
  reserveFinoraRecipientTrustTransitionIssuance,
} from "./finoraRecipientTrustTransitionIssuanceLedger.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  createFinoraRecipientTrustTransitionPayloadDigest,
  validateFinoraRecipientTrustTransitionSignedEnvelope,
} from "../control/finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustRevokeRetiredPayload,
  FinoraRecipientTrustRotatePayload,
  FinoraRecipientTrustTransitionPayload,
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
  FinoraRecipientTrustTransitionUnsignedEnvelope,
} from "../control/finoraRecipientTrustTransitionContract.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "../control/finoraSignedControlPackageVerifier.js";

// ============================================================
// REQUEST
// ============================================================

export type FinoraRecipientTrustTransitionIssueRequest =
  | {
      action:
        "ROTATE";

      target:
        FinoraRecipientTrustTransitionTarget;

      authorizingSigningKeyId:
        string;
    }
  | {
      action:
        "REVOKE_RETIRED";

      target:
        FinoraRecipientTrustTransitionTarget;

      authorizingSigningKeyId:
        string;

      revokedSigningKeyId:
        string;
    };

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustTransitionIssueResult =
  | {
      success:
        true;

      data: {
        signedTransition:
          FinoraRecipientTrustTransitionSignedEnvelope;

        issuerId:
          string;

        authorizingSigningKeyId:
          string;

        currentSigningKeyId:
          string;

        packageId:
          string;

        sequence:
          number;

        issuedAt:
          string;
      };
    }
  | {
      success:
        false;

      error:
        string;
    };

// ============================================================
// INTERNAL SIGNER VIEW
// ============================================================

interface LocalAuthorizingSigningKey {
  signingKeyId:
    string;

  privateKeyPkcs8DerBase64:
    string;

  publicKeySpkiDerBase64:
    string;

  createdAt:
    string;

  retiredAt?:
    string;

  current:
    boolean;
}

// ============================================================
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustTransitionIssueResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// BASIC VALIDATION
// ============================================================

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function validateTarget(
  target:
    FinoraRecipientTrustTransitionTarget,
): void {
  if (
    !isNonEmptyString(
      target.installationId,
    ) ||
    !isNonEmptyString(
      target.bindingKeyId,
    ) ||
    target.fingerprintAlgorithm !==
      "SHA-256" ||
    !/^[0-9a-f]{64}$/.test(
      target.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA recipient trust-transition target is invalid.",
    );
  }
}

// ============================================================
// LOCAL SIGNER RESOLUTION
// ============================================================

function resolveAuthorizingSigningKey(
  vault:
    FinoraControlCenterKeyVaultRecord,
  signingKeyId:
    string,
): LocalAuthorizingSigningKey | undefined {
  if (
    vault.signingKeyId ===
      signingKeyId
  ) {
    return {
      signingKeyId:
        vault.signingKeyId,

      privateKeyPkcs8DerBase64:
        vault.privateKeyPkcs8DerBase64,

      publicKeySpkiDerBase64:
        vault.publicKeySpkiDerBase64,

      createdAt:
        vault.createdAt,

      current:
        true,
    };
  }

  const retained =
    (
      vault.retainedSigningKeys ??
      []
    ).find(
      (key) =>
        key.signingKeyId ===
          signingKeyId,
    );

  if (
    retained ===
      undefined
  ) {
    return undefined;
  }

  return {
    signingKeyId:
      retained.signingKeyId,

    privateKeyPkcs8DerBase64:
      retained.privateKeyPkcs8DerBase64,

    publicKeySpkiDerBase64:
      retained.publicKeySpkiDerBase64,

    createdAt:
      retained.createdAt,

    retiredAt:
      retained.retiredAt,

    current:
      false,
  };
}

// ============================================================
// CURRENT DESTINATION TRUST KEY
// ============================================================

function createCurrentDestinationTrustedKey(
  vault:
    FinoraControlCenterKeyVaultRecord,
  issuedAt:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId:
      vault.issuerId,

    signingKeyId:
      vault.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      vault.publicKeySpkiDerBase64,

    status:
      "ACTIVE",

    validFrom:
      issuedAt,
  };
}

// ============================================================
// REVOKE TARGET POLICY
// ============================================================

function findRevocationTarget(
  vault:
    FinoraControlCenterKeyVaultRecord,
  revokedSigningKeyId:
    string,
): FinoraControlCenterRetainedSigningKeyRecord | undefined {
  return (
    vault.retainedSigningKeys ??
    []
  ).find(
    (key) =>
      key.signingKeyId ===
        revokedSigningKeyId,
  );
}

// ============================================================
// INTERNAL ISSUE
// ============================================================

async function issueFinoraRecipientTrustTransitionInternal(
  request:
    FinoraRecipientTrustTransitionIssueRequest,
): Promise<
  FinoraRecipientTrustTransitionIssueResult
> {
  // ----------------------------------------------------------
  // INPUT POLICY BEFORE RESERVATION
  // ----------------------------------------------------------

  try {
    validateTarget(
      request.target,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA recipient trust-transition target is invalid.",
    );
  }

  if (
    !isNonEmptyString(
      request.authorizingSigningKeyId,
    )
  ) {
    return failure(
      "FINORA recipient trust-transition authorizing signingKeyId is required.",
    );
  }

  if (
    request.action ===
      "REVOKE_RETIRED" &&
    !isNonEmptyString(
      request.revokedSigningKeyId,
    )
  ) {
    return failure(
      "FINORA recipient trust-transition revoked signingKeyId is required.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE VAULT SNAPSHOT
  // ----------------------------------------------------------

  let vault:
    FinoraControlCenterKeyVaultRecord;

  try {
    vault =
      await loadOrCreateFinoraControlCenterKeyVault();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA Control Center signing authority.",
    );
  }

  const authorizer =
    resolveAuthorizingSigningKey(
      vault,
      request.authorizingSigningKeyId,
    );

  if (
    authorizer ===
      undefined
  ) {
    return failure(
      "FINORA recipient trust-transition authorizing signing key does not exist in Control Center key history.",
    );
  }

  // ----------------------------------------------------------
  // ACTION POLICY BEFORE RESERVATION
  // ----------------------------------------------------------

  if (
    request.action ===
      "ROTATE"
  ) {
    if (
      authorizer.signingKeyId ===
        vault.signingKeyId
    ) {
      return failure(
        "FINORA recipient trust-transition ROTATE authorizer already equals the current destination signing key.",
      );
    }
  } else {
    if (
      request.revokedSigningKeyId ===
        authorizer.signingKeyId
    ) {
      return failure(
        "FINORA recipient trust-transition cannot revoke its authorizing signing key.",
      );
    }

    const revokedKey =
      findRevocationTarget(
        vault,
        request.revokedSigningKeyId,
      );

    if (
      revokedKey ===
        undefined
    ) {
      return failure(
        "FINORA recipient trust-transition REVOKE_RETIRED target does not exist in retained Control Center key history.",
      );
    }

    const revokedRetiredAt =
      Date.parse(
        revokedKey.retiredAt,
      );

    const authorizerCreatedAt =
      Date.parse(
        authorizer.createdAt,
      );

    if (
      !Number.isFinite(
        revokedRetiredAt,
      ) ||
      !Number.isFinite(
        authorizerCreatedAt,
      ) ||
      revokedRetiredAt >
        authorizerCreatedAt
    ) {
      return failure(
        "FINORA recipient trust-transition authorizer cannot revoke a successor key from a later trust generation.",
      );
    }
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE INSTALLATION-LEVEL RESERVATION
  //
  // Persisted before envelope signing.
  // ----------------------------------------------------------

  let reservation:
    Awaited<
      ReturnType<
        typeof reserveFinoraRecipientTrustTransitionIssuance
      >
    >;

  try {
    reservation =
      await reserveFinoraRecipientTrustTransitionIssuance({
        issuerId:
          vault.issuerId,

        installationId:
          request.target.installationId,
      });
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to reserve FINORA recipient trust-transition issuance sequence.",
    );
  }

  // ----------------------------------------------------------
  // PAYLOAD
  // ----------------------------------------------------------

  let payload:
    FinoraRecipientTrustTransitionPayload;

  if (
    request.action ===
      "ROTATE"
  ) {
    const rotatePayload:
      FinoraRecipientTrustRotatePayload = {
        transitionFormat:
          FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

        action:
          "ROTATE",

        newTrustedKey:
          createCurrentDestinationTrustedKey(
            vault,
            reservation.issuedAt,
          ),

        issuedAt:
          reservation.issuedAt,

        schemaVersion:
          1,
      };

    payload =
      rotatePayload;
  } else {
    const revokePayload:
      FinoraRecipientTrustRevokeRetiredPayload = {
        transitionFormat:
          FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

        action:
          "REVOKE_RETIRED",

        revokedSigningKeyId:
          request.revokedSigningKeyId,

        issuedAt:
          reservation.issuedAt,

        schemaVersion:
          1,
      };

    payload =
      revokePayload;
  }

  // ----------------------------------------------------------
  // UNSIGNED ENVELOPE
  // ----------------------------------------------------------

  const unsignedEnvelope:
    FinoraRecipientTrustTransitionUnsignedEnvelope = {
      packageId:
        reservation.packageId,

      purpose:
        FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

      target: {
        ...request.target,
      },

      issuedAt:
        reservation.issuedAt,

      sequence:
        reservation.sequence,

      payloadVersion:
        1,

      payload,

      schemaVersion:
        1,

      issuer: {
        type:
          "FINORA_CONTROL_CENTER",

        issuerId:
          vault.issuerId,

        signingKeyId:
          authorizer.signingKeyId,
      },

      payloadDigest:
        createFinoraRecipientTrustTransitionPayloadDigest(
          payload,
        ),
    };

  // ----------------------------------------------------------
  // CANONICAL SIGNATURE
  // ----------------------------------------------------------

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
      error instanceof Error
        ? error.message
        : "Unable to canonicalize FINORA recipient trust transition.",
    );
  }

  let signatureValue:
    string;

  try {
    signatureValue =
      signFinoraControlCenterCanonicalValue(
        canonicalEnvelope,
        authorizer.privateKeyPkcs8DerBase64,
      );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to sign FINORA recipient trust transition.",
    );
  }

  const signedTransition:
    FinoraRecipientTrustTransitionSignedEnvelope = {
      ...unsignedEnvelope,

      signature: {
        algorithm:
          "ECDSA_P256_SHA256",

        encoding:
          "IEEE_P1363",

        canonicalization:
          "FINORA_CANONICAL_JSON_V1",

        signingKeyId:
          authorizer.signingKeyId,

        value:
          signatureValue,
      },
    };

  // ----------------------------------------------------------
  // FINAL STRUCTURAL SELF-CHECK
  // ----------------------------------------------------------

  try {
    validateFinoraRecipientTrustTransitionSignedEnvelope(
      signedTransition,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "FINORA recipient trust-transition signed envelope failed final validation.",
    );
  }

  // ----------------------------------------------------------
  // SUCCESS — PUBLIC PACKAGE / METADATA ONLY
  // ----------------------------------------------------------

  return {
    success:
      true,

    data: {
      signedTransition,

      issuerId:
        vault.issuerId,

      authorizingSigningKeyId:
        authorizer.signingKeyId,

      currentSigningKeyId:
        vault.signingKeyId,

      packageId:
        reservation.packageId,

      sequence:
        reservation.sequence,

      issuedAt:
        reservation.issuedAt,
    },
  };
}

// ============================================================
// PUBLIC API — SHARED KEY AUTHORITY SERIALIZATION
// ============================================================

export function issueFinoraRecipientTrustTransition(
  request:
    FinoraRecipientTrustTransitionIssueRequest,
): Promise<
  FinoraRecipientTrustTransitionIssueResult
> {
  const snapshot:
    FinoraRecipientTrustTransitionIssueRequest =
      request.action ===
        "ROTATE"
        ? {
            action:
              "ROTATE",

            target: {
              ...request.target,
            },

            authorizingSigningKeyId:
              request.authorizingSigningKeyId,
          }
        : {
            action:
              "REVOKE_RETIRED",

            target: {
              ...request.target,
            },

            authorizingSigningKeyId:
              request.authorizingSigningKeyId,

            revokedSigningKeyId:
              request.revokedSigningKeyId,
          };

  return runFinoraControlCenterKeyAuthoritySerialized(
    () =>
      issueFinoraRecipientTrustTransitionInternal(
        snapshot,
      ),
  );
}

// ============================================================
// END
// ============================================================