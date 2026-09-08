/* ===========================================================
   FINORA ENTERPRISE OS™

   VERIFIED RECIPIENT TRUST TRANSITION APPLY SERVICE

   MODULE  : Native Control
   LAYER   : Recipient Trust Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve authoritative native installation binding
   - Load authoritative recipient trusted signing keys
   - Cryptographically verify signed trust transition
   - Reject package replay
   - Enforce installation-level monotonic sequence
   - Apply ROTATE / REVOKE_RETIRED trust mutations
   - Commit trust keys + replay ledger + sequence cursor in one
     encrypted recipient-trust-store replacement

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer IPC.
   - No caller-supplied trusted keys.
   - No caller-supplied installation target.
   - No private signing key.
   - No Control Center key-vault access.
   - No branch / business / owner authority.
   - No trust-on-first-use.
   - No bootstrap.
   - No emergency recovery authority.

   SERIALIZATION:

   Entire:

   native binding
   -> trust-store load
   -> signature verification
   -> replay check
   -> domain transition
   -> replay metadata
   -> encrypted persistence

   is serialized inside this Electron main process.

   There is intentionally no cross-process CAS claim.

   ROTATE:

   - Existing ACTIVE signer becomes RETIRED.
   - Its validUntil becomes transition issuedAt.
   - New key becomes the sole ACTIVE key for the same issuer.
   - Existing trusted signing-key identities cannot be reused.

   REVOKE_RETIRED:

   - Only an existing RETIRED key belonging to the signer issuer
     may become REVOKED.
   - Current ACTIVE signer remains unchanged.
   - ACTIVE-key emergency revocation is not authorized here.

   TIME:

   A transition cannot be applied before its signed issuedAt.
   Clock rollback/tamper resistance is a separate Phase-14
   hardening boundary.
=========================================================== */

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustAppliedTransitionRecord,
  FinoraRecipientTrustStoreState,
  FinoraRecipientTrustTransitionSequenceState,
} from "./finoraRecipientTrustStore.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
} from "./finoraRecipientTrustTransitionContract.js";

import {
  verifyFinoraRecipientTrustTransition,
} from "./finoraRecipientTrustTransitionVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustTransitionApplyResult =
  | {
      success:
        true;

      data: {
        packageId:
          string;

        action:
          "ROTATE" | "REVOKE_RETIRED";

        issuerId:
          string;

        sequence:
          number;

        installationId:
          string;

        appliedAt:
          string;

        activeSigningKeyId:
          string;

        affectedSigningKeyId:
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
// FAILURE
// ============================================================

function failure(
  error:
    string,
): FinoraRecipientTrustTransitionApplyResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// INTERNAL APPLY
// ============================================================

async function applyFinoraRecipientTrustTransitionInternal(
  signedTransition:
    unknown,
  now:
    Date,
): Promise<
  FinoraRecipientTrustTransitionApplyResult
> {
  // ----------------------------------------------------------
  // AUTHORITATIVE APPLY TIME
  // ----------------------------------------------------------

  const nowMs =
    now.getTime();

  if (
    !Number.isFinite(
      nowMs,
    )
  ) {
    return failure(
      "FINORA recipient trust transition apply time is invalid.",
    );
  }

  const appliedAt =
    now.toISOString();

  // ----------------------------------------------------------
  // AUTHORITATIVE NATIVE INSTALLATION BINDING
  // ----------------------------------------------------------

  let nativeBinding:
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >;

  try {
    nativeBinding =
      await getFinoraWindowsInstallationBinding();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA native installation binding.",
    );
  }

  if (
    nativeBinding ===
      undefined
  ) {
    return failure(
      "FINORA native installation binding is required before applying a recipient trust transition.",
    );
  }

  const expectedTarget = {
    installationId:
      nativeBinding.installationId,

    bindingKeyId:
      nativeBinding.bindingKeyId,

    fingerprintAlgorithm:
      nativeBinding.fingerprintAlgorithm,

    publicKeyFingerprint:
      nativeBinding.publicKeyFingerprint,
  } as const;

  // ----------------------------------------------------------
  // AUTHORITATIVE RECIPIENT TRUST
  // ----------------------------------------------------------

  let trustStore:
    FinoraRecipientTrustStoreState | undefined;

  try {
    trustStore =
      await loadFinoraRecipientTrustStore();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA recipient trust state.",
    );
  }

  if (
    trustStore ===
      undefined
  ) {
    return failure(
      "FINORA recipient trust must be bootstrapped before applying trust transitions.",
    );
  }

  // ----------------------------------------------------------
  // CRYPTOGRAPHIC VERIFICATION
  //
  // trustedKeys originate only from the encrypted recipient
  // trust store loaded above.
  // ----------------------------------------------------------

  const verification =
    verifyFinoraRecipientTrustTransition(
      signedTransition,
      trustStore.trustedKeys,
      expectedTarget,
    );

  if (
    !verification.valid
  ) {
    return failure(
      `${verification.reason}: ${verification.error}`,
    );
  }

  const envelope =
    verification.envelope;

  const trustedSigner =
    verification.trustedSigner;

  // ----------------------------------------------------------
  // DO NOT APPLY BEFORE SIGNED ISSUANCE TIME
  // ----------------------------------------------------------

  const issuedAtMs =
    Date.parse(
      envelope.issuedAt,
    );

  if (
    !Number.isFinite(
      issuedAtMs,
    ) ||
    issuedAtMs >
      nowMs
  ) {
    return failure(
      "FINORA recipient trust transition cannot be applied before its signed issuedAt timestamp.",
    );
  }

  // ----------------------------------------------------------
  // COPY AUTHORITATIVE REPLAY STATE
  // ----------------------------------------------------------

  const appliedTransitions:
    FinoraRecipientTrustAppliedTransitionRecord[] =
      [
        ...(
          trustStore.appliedTrustTransitions ??
          []
        ),
      ];

  const sequenceStates:
    FinoraRecipientTrustTransitionSequenceState[] =
      [
        ...(
          trustStore.trustTransitionSequences ??
          []
        ),
      ];

  // ----------------------------------------------------------
  // PACKAGE REPLAY
  // ----------------------------------------------------------

  if (
    appliedTransitions.some(
      (record) =>
        record.packageId ===
          envelope.packageId,
    )
  ) {
    return failure(
      "FINORA recipient trust transition package has already been applied.",
    );
  }

  // ----------------------------------------------------------
  // INSTALLATION-LEVEL MONOTONIC SEQUENCE
  //
  // Scope:
  // issuerId + purpose + installationId
  // ----------------------------------------------------------

  const sequenceIndex =
    sequenceStates.findIndex(
      (record) =>
        record.issuerId ===
          envelope.issuer.issuerId &&
        record.purpose ===
          FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE &&
        record.installationId ===
          envelope.target.installationId,
    );

  if (
    sequenceIndex >=
      0 &&
    envelope.sequence <=
      sequenceStates[
        sequenceIndex
      ].lastSequence
  ) {
    return failure(
      "FINORA recipient trust transition sequence is stale.",
    );
  }

  // ----------------------------------------------------------
  // DOMAIN MUTATION
  // ----------------------------------------------------------

  let nextTrustedKeys:
    FinoraBranchTrustedControlPublicKey[];

  let activeSigningKeyId:
    string;

  let affectedSigningKeyId:
    string;

  if (
    envelope.payload.action ===
      "ROTATE"
  ) {
    const newTrustedKey =
      envelope.payload.newTrustedKey;

    // --------------------------------------------------------
    // TRUSTED KEY IDENTITIES ARE NEVER REUSED
    // --------------------------------------------------------

    const newIdentityAlreadyExists =
      trustStore.trustedKeys.some(
        (key) =>
          key.issuerId ===
            newTrustedKey.issuerId &&
          key.signingKeyId ===
            newTrustedKey.signingKeyId,
      );

    if (
      newIdentityAlreadyExists
    ) {
      return failure(
        "FINORA recipient trust rotation new signing-key identity already exists.",
      );
    }

    // --------------------------------------------------------
    // RETIRE CURRENT ACTIVE SIGNER AT SIGNED BOUNDARY
    // --------------------------------------------------------

    nextTrustedKeys =
      trustStore.trustedKeys.map<
        FinoraBranchTrustedControlPublicKey
      >(
        (key) => {
          if (
            key.issuerId ===
              trustedSigner.issuerId &&
            key.signingKeyId ===
              trustedSigner.signingKeyId
          ) {
            return {
              ...key,

              status:
                "RETIRED",

              validUntil:
                envelope.issuedAt,
            };
          }

          return {
            ...key,
          };
        },
      );

    // --------------------------------------------------------
    // ACTIVATE NEW SIGNER
    // --------------------------------------------------------

    nextTrustedKeys.push({
      ...newTrustedKey,
    });

    activeSigningKeyId =
      newTrustedKey.signingKeyId;

    affectedSigningKeyId =
      trustedSigner.signingKeyId;
  } else {
    // --------------------------------------------------------
    // REVOKE_RETIRED
    //
    // Only a RETIRED key from the same stable issuer may be
    // revoked by the current ACTIVE signer.
    // --------------------------------------------------------

    const revokedSigningKeyId =
      envelope.payload.revokedSigningKeyId;

    const revokedKeyIndex =
      trustStore.trustedKeys.findIndex(
        (key) =>
          key.issuerId ===
            trustedSigner.issuerId &&
          key.signingKeyId ===
            revokedSigningKeyId,
      );

    if (
      revokedKeyIndex <
        0
    ) {
      return failure(
        "FINORA recipient trust revocation target signing key does not exist for this issuer.",
      );
    }

    const revokedKey =
      trustStore.trustedKeys[
        revokedKeyIndex
      ];

    if (
      revokedKey.status !==
        "RETIRED"
    ) {
      return failure(
        "FINORA recipient trust REVOKE_RETIRED action requires an existing RETIRED signing key.",
      );
    }

    nextTrustedKeys =
      trustStore.trustedKeys.map<
        FinoraBranchTrustedControlPublicKey
      >(
        (
          key,
          index,
        ) => {
          if (
            index ===
              revokedKeyIndex
          ) {
            return {
              ...key,

              status:
                "REVOKED",
            };
          }

          return {
            ...key,
          };
        },
      );

    activeSigningKeyId =
      trustedSigner.signingKeyId;

    affectedSigningKeyId =
      revokedKey.signingKeyId;
  }

  // ----------------------------------------------------------
  // APPLIED TRANSITION LEDGER
  // ----------------------------------------------------------

  appliedTransitions.push({
    packageId:
      envelope.packageId,

    issuerId:
      envelope.issuer.issuerId,

    purpose:
      FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

    sequence:
      envelope.sequence,

    installationId:
      envelope.target.installationId,

    appliedAt,
  });

  // ----------------------------------------------------------
  // MONOTONIC SEQUENCE CURSOR
  // ----------------------------------------------------------

  const nextSequenceState:
    FinoraRecipientTrustTransitionSequenceState = {
      issuerId:
        envelope.issuer.issuerId,

      purpose:
        FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

      installationId:
        envelope.target.installationId,

      lastSequence:
        envelope.sequence,

      updatedAt:
        appliedAt,
    };

  if (
    sequenceIndex >=
      0
  ) {
    sequenceStates[
      sequenceIndex
    ] =
      nextSequenceState;
  } else {
    sequenceStates.push(
      nextSequenceState,
    );
  }

  // ----------------------------------------------------------
  // ONE AUTHORITATIVE RECIPIENT TRUST STATE
  //
  // Trust-key mutation + replay package ledger + monotonic
  // sequence are persisted together through one encrypted
  // recipient-trust-store replacement.
  // ----------------------------------------------------------

  const nextTrustStore:
    FinoraRecipientTrustStoreState = {
      schemaVersion:
        1,

      trustedKeys:
        nextTrustedKeys,

      appliedTrustTransitions:
        appliedTransitions,

      trustTransitionSequences:
        sequenceStates,

      ...(
        trustStore.appliedTrustRecoveries ===
          undefined
          ? {}
          : {
              appliedTrustRecoveries:
                trustStore.appliedTrustRecoveries.map(
                  (
                    record,
                  ) => ({
                    ...record,
                  }),
                ),
            }
      ),

      ...(
        trustStore.trustRecoverySequences ===
          undefined
          ? {}
          : {
              trustRecoverySequences:
                trustStore.trustRecoverySequences.map(
                  (
                    state,
                  ) => ({
                    ...state,
                  }),
                ),
            }
      ),
    };

  try {
    await persistFinoraRecipientTrustStore(
      nextTrustStore,
    );
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to persist verified FINORA recipient trust transition state.",
    );
  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return {
    success:
      true,

    data: {
      packageId:
        envelope.packageId,

      action:
        envelope.payload.action,

      issuerId:
        envelope.issuer.issuerId,

      sequence:
        envelope.sequence,

      installationId:
        envelope.target.installationId,

      appliedAt,

      activeSigningKeyId,

      affectedSigningKeyId,
    },
  };
}

// ============================================================
// PUBLIC SERIALIZED APPLY
// ============================================================

export function applyFinoraSignedRecipientTrustTransition(
  signedTransition:
    unknown,
  now:
    Date,
): Promise<
  FinoraRecipientTrustTransitionApplyResult
> {
  return runFinoraRecipientTrustAuthoritySerialized(
    () =>
      applyFinoraRecipientTrustTransitionInternal(
        signedTransition,
        now,
      ),
  );
}

// ============================================================
// END
// ============================================================