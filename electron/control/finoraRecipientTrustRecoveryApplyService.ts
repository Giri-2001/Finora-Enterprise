/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST EMERGENCY RECOVERY APPLY SERVICE

   MODULE  : Native Control
   LAYER   : Electron Main Security Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve exact authoritative native installation binding
   - Load independently provisioned recovery authority
   - Load authoritative recipient operational trust state
   - Cryptographically verify one signed RECIPIENT_TRUST_RECOVERY
   - Reject recovery package replay
   - Enforce scoped monotonic recovery sequence
   - Require the named compromised key to be exactly the current
     ACTIVE operational key
   - Revoke that current ACTIVE key at recovery issuedAt
   - Activate one never-before-trusted replacement key
   - Preserve historical RETIRED / REVOKED keys
   - Preserve normal trust-transition replay metadata
   - Commit trusted keys + recovery replay ledger + recovery
     sequence cursor in one recipient-trust-store replacement

   EMERGENCY REPLACE_ACTIVE:

   - expectedActiveSigningKeyId must be exactly current ACTIVE.
   - There must be exactly one ACTIVE key for operationalIssuerId.
   - Existing ACTIVE -> REVOKED.
   - Existing ACTIVE validUntil -> signed recovery issuedAt.
   - Replacement -> sole ACTIVE for the same operational issuer.
   - Replacement validFrom -> signed recovery issuedAt.
   - Replacement validUntil -> absent.
   - Replacement issuer/signing-key identity must never have
     appeared previously in recipient trust.

   AUTHORITY:

   Recovery authorization comes only from the independently
   provisioned FINORA_RECOVERY_AUTHORITY public root.

   The operational ACTIVE key being replaced does not authorize
   this recovery path.

   TIME:

   acceptedNow is supplied by the authoritative recipient
   clock-high-water import boundary.

   Explicit Date input is snapshotted before queue execution so
   caller mutation cannot change an already-submitted apply time.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No renderer IPC.
   - No caller-supplied trusted operational keys.
   - No caller-supplied native installation target.
   - No recovery-root mutation.
   - No bootstrap mutation.
   - No private signing key.
   - One shared recipient-trust authority queue.
   - No nested recipient-trust queue.
   - No cross-process compare-and-swap guarantee is claimed.
=========================================================== */

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustRecoveryAuthorityStore,
} from "./finoraRecipientTrustRecoveryAuthorityStore.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import type {
  FinoraRecipientTrustAppliedRecoveryRecord,
  FinoraRecipientTrustRecoverySequenceState,
  FinoraRecipientTrustStoreState,
} from "./finoraRecipientTrustStore.js";

import {
  FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,
} from "./finoraRecipientTrustRecoveryContract.js";

import {
  verifyFinoraRecipientTrustRecovery,
} from "./finoraRecipientTrustRecoveryVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// RESULT
// ============================================================

export type FinoraRecipientTrustRecoveryApplyResult =
  | {
      success:
        true;

      data: {
        packageId:
          string;

        action:
          "REPLACE_ACTIVE";

        recoveryAuthorityId:
          string;

        operationalIssuerId:
          string;

        sequence:
          number;

        installationId:
          string;

        appliedAt:
          string;

        revokedSigningKeyId:
          string;

        activeSigningKeyId:
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
): FinoraRecipientTrustRecoveryApplyResult {
  return {
    success:
      false,

    error,
  };
}

// ============================================================
// INTERNAL APPLY
// ============================================================

async function applyFinoraRecipientTrustRecoveryInternal(
  signedRecovery:
    unknown,
  acceptedNow:
    Date,
): Promise<
  FinoraRecipientTrustRecoveryApplyResult
> {
  // ----------------------------------------------------------
  // AUTHORITATIVE ACCEPTED APPLY TIME
  // ----------------------------------------------------------

  const acceptedNowMs =
    acceptedNow.getTime();

  if (
    !Number.isFinite(
      acceptedNowMs,
    )
  ) {
    return failure(
      "FINORA recipient trust recovery accepted apply time is invalid.",
    );
  }

  const appliedAt =
    acceptedNow.toISOString();

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
      "FINORA native installation binding is required before applying recipient trust recovery.",
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
  // INDEPENDENT RECOVERY AUTHORITY
  // ----------------------------------------------------------

  let recoveryAuthorityStore:
    Awaited<
      ReturnType<
        typeof loadFinoraRecipientTrustRecoveryAuthorityStore
      >
    >;

  try {
    recoveryAuthorityStore =
      await loadFinoraRecipientTrustRecoveryAuthorityStore();
  } catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to load FINORA recipient trust recovery authority.",
    );
  }

  if (
    recoveryAuthorityStore ===
      undefined
  ) {
    return failure(
      "FINORA recipient trust recovery authority must be independently provisioned before applying emergency recovery.",
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE OPERATIONAL RECIPIENT TRUST
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
      "FINORA recipient operational trust must exist before applying emergency recovery.",
    );
  }

  // ----------------------------------------------------------
  // CRYPTOGRAPHIC RECOVERY VERIFICATION
  //
  // Recovery signer authority comes only from the separately
  // encrypted recovery-authority store loaded above.
  //
  // Operational trustedKeys do not authorize this signature.
  // ----------------------------------------------------------

  const verification =
    verifyFinoraRecipientTrustRecovery(
      signedRecovery,
      recoveryAuthorityStore,
      expectedTarget,
      acceptedNow,
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

  // ----------------------------------------------------------
  // RECOVERY REPLAY STATE
  // ----------------------------------------------------------

  const appliedRecoveries:
    FinoraRecipientTrustAppliedRecoveryRecord[] =
      [
        ...(
          trustStore.appliedTrustRecoveries ??
          []
        ).map(
          (
            record,
          ) => ({
            ...record,
          }),
        ),
      ];

  const recoverySequenceStates:
    FinoraRecipientTrustRecoverySequenceState[] =
      [
        ...(
          trustStore.trustRecoverySequences ??
          []
        ).map(
          (
            state,
          ) => ({
            ...state,
          }),
        ),
      ];

  // ----------------------------------------------------------
  // PACKAGE REPLAY
  // ----------------------------------------------------------

  if (
    appliedRecoveries.some(
      (record) =>
        record.packageId ===
          envelope.packageId,
    )
  ) {
    return failure(
      "FINORA recipient trust recovery package has already been applied.",
    );
  }

  // ----------------------------------------------------------
  // SCOPED MONOTONIC RECOVERY SEQUENCE
  //
  // Scope:
  //
  // recoveryAuthorityId
  // + RECIPIENT_TRUST_RECOVERY
  // + installationId
  // + operationalIssuerId
  // ----------------------------------------------------------

  const recoverySequenceIndex =
    recoverySequenceStates.findIndex(
      (state) =>
        state.recoveryAuthorityId ===
          envelope.issuer.recoveryAuthorityId &&
        state.purpose ===
          FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE &&
        state.installationId ===
          envelope.target.installationId &&
        state.operationalIssuerId ===
          envelope.payload.operationalIssuerId,
    );

  if (
    recoverySequenceIndex >=
      0 &&
    envelope.sequence <=
      recoverySequenceStates[
        recoverySequenceIndex
      ].lastSequence
  ) {
    return failure(
      "FINORA recipient trust recovery sequence is stale.",
    );
  }

  // ----------------------------------------------------------
  // EXACT CURRENT ACTIVE OPERATIONAL AUTHORITY
  // ----------------------------------------------------------

  const operationalIssuerId =
    envelope.payload.operationalIssuerId;

  const expectedActiveSigningKeyId =
    envelope.payload.expectedActiveSigningKeyId;

  const activeKeysForOperationalIssuer =
    trustStore.trustedKeys.filter(
      (key) =>
        key.issuerId ===
          operationalIssuerId &&
        key.status ===
          "ACTIVE",
    );

  if (
    activeKeysForOperationalIssuer.length !==
      1
  ) {
    return failure(
      "FINORA recipient trust recovery requires exactly one current ACTIVE signing key for the operational issuer.",
    );
  }

  const currentActive =
    activeKeysForOperationalIssuer[
      0
    ];

  if (
    currentActive.signingKeyId !==
      expectedActiveSigningKeyId
  ) {
    return failure(
      "FINORA recipient trust recovery expected ACTIVE signing key does not match current recipient authority.",
    );
  }

  // ----------------------------------------------------------
  // CURRENT ACTIVE VALIDITY AT RECOVERY BOUNDARY
  //
  // Recovery must not precede the operational key's validFrom.
  // If an ACTIVE record already carries validUntil, recovery
  // must not extend that historical validity boundary.
  // ----------------------------------------------------------

  const recoveryIssuedAtMs =
    Date.parse(
      envelope.issuedAt,
    );

  const currentActiveValidFromMs =
    Date.parse(
      currentActive.validFrom,
    );

  const currentActiveValidUntilMs =
    currentActive.validUntil ===
      undefined
      ? undefined
      : Date.parse(
          currentActive.validUntil,
        );

  if (
    !Number.isFinite(
      recoveryIssuedAtMs,
    ) ||
    !Number.isFinite(
      currentActiveValidFromMs,
    ) ||
    recoveryIssuedAtMs <
      currentActiveValidFromMs
  ) {
    return failure(
      "FINORA recipient trust recovery cannot replace an operational key before that key becomes valid.",
    );
  }

  if (
    currentActive.validUntil !==
      undefined &&
    (
      currentActiveValidUntilMs ===
        undefined ||
      !Number.isFinite(
        currentActiveValidUntilMs,
      ) ||
      recoveryIssuedAtMs >
        currentActiveValidUntilMs
    )
  ) {
    return failure(
      "FINORA recipient trust recovery cannot extend an existing operational key validity boundary.",
    );
  }

  // ----------------------------------------------------------
  // REPLACEMENT OPERATIONAL KEY
  // ----------------------------------------------------------

  const replacementTrustedKey =
    envelope.payload.replacementTrustedKey;

  if (
    replacementTrustedKey.issuerId !==
      operationalIssuerId ||
    replacementTrustedKey.status !==
      "ACTIVE" ||
    replacementTrustedKey.validFrom !==
      envelope.issuedAt ||
    replacementTrustedKey.validUntil !==
      undefined
  ) {
    return failure(
      "FINORA recipient trust recovery replacement key does not match the signed operational ACTIVE boundary.",
    );
  }

  if (
    replacementTrustedKey.signingKeyId ===
      expectedActiveSigningKeyId
  ) {
    return failure(
      "FINORA recipient trust recovery replacement signing key must differ from the compromised ACTIVE key.",
    );
  }

  // ----------------------------------------------------------
  // TRUSTED KEY IDENTITIES ARE NEVER REUSED
  // ----------------------------------------------------------

  const replacementIdentityAlreadyExists =
    trustStore.trustedKeys.some(
      (key) =>
        key.issuerId ===
          replacementTrustedKey.issuerId &&
        key.signingKeyId ===
          replacementTrustedKey.signingKeyId,
    );

  if (
    replacementIdentityAlreadyExists
  ) {
    return failure(
      "FINORA recipient trust recovery replacement signing-key identity has already existed in recipient trust.",
    );
  }

  // ----------------------------------------------------------
  // WHOLE TRUSTED-KEY MUTATION
  //
  // Preserve every historical key except the exact compromised
  // current ACTIVE key named by this verified recovery.
  // ----------------------------------------------------------

  const nextTrustedKeys =
    trustStore.trustedKeys.map<
      FinoraBranchTrustedControlPublicKey
    >(
      (key) => {
        if (
          key.issuerId ===
            operationalIssuerId &&
          key.signingKeyId ===
            expectedActiveSigningKeyId
        ) {
          return {
            ...key,

            status:
              "REVOKED",

            validUntil:
              envelope.issuedAt,
          };
        }

        return {
          ...key,
        };
      },
    );

  nextTrustedKeys.push({
    ...replacementTrustedKey,
  });

  // ----------------------------------------------------------
  // APPLIED RECOVERY LEDGER
  // ----------------------------------------------------------

  appliedRecoveries.push({
    packageId:
      envelope.packageId,

    recoveryAuthorityId:
      envelope.issuer.recoveryAuthorityId,

    purpose:
      FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,

    sequence:
      envelope.sequence,

    installationId:
      envelope.target.installationId,

    operationalIssuerId,

    appliedAt,
  });

  // ----------------------------------------------------------
  // MONOTONIC RECOVERY SEQUENCE CURSOR
  // ----------------------------------------------------------

  const nextRecoverySequenceState:
    FinoraRecipientTrustRecoverySequenceState = {
      recoveryAuthorityId:
        envelope.issuer.recoveryAuthorityId,

      purpose:
        FINORA_RECIPIENT_TRUST_RECOVERY_PURPOSE,

      installationId:
        envelope.target.installationId,

      operationalIssuerId,

      lastSequence:
        envelope.sequence,

      updatedAt:
        appliedAt,
    };

  if (
    recoverySequenceIndex >=
      0
  ) {
    recoverySequenceStates[
      recoverySequenceIndex
    ] =
      nextRecoverySequenceState;
  } else {
    recoverySequenceStates.push(
      nextRecoverySequenceState,
    );
  }

  // ----------------------------------------------------------
  // ONE AUTHORITATIVE RECIPIENT TRUST STATE
  //
  // Operational key mutation + recovery package ledger +
  // recovery sequence cursor are persisted together through one
  // encrypted recipient-trust-store replacement.
  //
  // Existing normal transition ledger/cursor remain unchanged.
  // ----------------------------------------------------------

  const nextTrustStore:
    FinoraRecipientTrustStoreState = {
      schemaVersion:
        1,

      trustedKeys:
        nextTrustedKeys,

      ...(
        trustStore.appliedTrustTransitions ===
          undefined
          ? {}
          : {
              appliedTrustTransitions:
                trustStore.appliedTrustTransitions.map(
                  (
                    record,
                  ) => ({
                    ...record,
                  }),
                ),
            }
      ),

      ...(
        trustStore.trustTransitionSequences ===
          undefined
          ? {}
          : {
              trustTransitionSequences:
                trustStore.trustTransitionSequences.map(
                  (
                    state,
                  ) => ({
                    ...state,
                  }),
                ),
            }
      ),

      appliedTrustRecoveries:
        appliedRecoveries,

      trustRecoverySequences:
        recoverySequenceStates,
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
        : "Unable to persist verified FINORA recipient trust recovery state.",
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

      recoveryAuthorityId:
        envelope.issuer.recoveryAuthorityId,

      operationalIssuerId,

      sequence:
        envelope.sequence,

      installationId:
        envelope.target.installationId,

      appliedAt,

      revokedSigningKeyId:
        expectedActiveSigningKeyId,

      activeSigningKeyId:
        replacementTrustedKey.signingKeyId,
    },
  };
}

// ============================================================
// PUBLIC SERIALIZED APPLY
// ============================================================

export function applyFinoraSignedRecipientTrustRecovery(
  signedRecovery:
    unknown,
  acceptedNow:
    Date,
): Promise<
  FinoraRecipientTrustRecoveryApplyResult
> {
  /*
   * Date is mutable. Snapshot explicit accepted time before
   * entering the shared recipient-trust authority queue.
   */
  const acceptedNowSnapshot =
    new Date(
      acceptedNow.getTime(),
    );

  if (
    !Number.isFinite(
      acceptedNowSnapshot.getTime(),
    )
  ) {
    return Promise.resolve(
      failure(
        "FINORA recipient trust recovery accepted apply time is invalid.",
      ),
    );
  }

  return runFinoraRecipientTrustAuthoritySerialized(
    () =>
      applyFinoraRecipientTrustRecoveryInternal(
        signedRecovery,
        acceptedNowSnapshot,
      ),
  );
}

// ============================================================
// END
// ============================================================