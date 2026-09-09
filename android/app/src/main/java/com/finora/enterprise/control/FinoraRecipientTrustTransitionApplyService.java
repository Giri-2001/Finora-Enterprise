package com.finora.enterprise.control;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST TRANSITION APPLY SERVICE

   MODULE  : Control
   LAYER   : Native Recipient Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve authoritative Android installation binding
   - Load encrypted recipient operational trust
   - Verify signed RECIPIENT_TRUST_TRANSITION
   - Reject transition package replay
   - Enforce installation-level monotonic transition sequence
   - Apply ROTATE / REVOKE_RETIRED trust mutation
   - Obtain appliedAt from authoritative clock high-water
   - Preserve independent recovery ledger / sequence metadata
   - Persist keys + replay + sequence in one trust-store write

   TRANSITION SEQUENCE SCOPE:

   issuerId
   + RECIPIENT_TRUST_TRANSITION
   + installationId

   ROTATE:

   - Existing trusted-key identities are never reused.
   - Current ACTIVE authorizing key becomes RETIRED.
   - Retired key validUntil = signed transition issuedAt.
   - New trusted key becomes the ACTIVE signing key.

   REVOKE_RETIRED:

   - Current ACTIVE signer remains ACTIVE.
   - Only an existing RETIRED key from the same issuer
     may become REVOKED.

   SECURITY:

   - Public API accepts the signed transition only.
   - Caller supplies no trusted keys.
   - Caller supplies no verification time.
   - Caller supplies no expected target.
   - Caller supplies no installation identity.
   - No renderer / Capacitor API.
   - No private signing material.
   - No Recovery Authority verification or mutation.
   - Recovery replay metadata is preserved unchanged.

   CONCURRENCY:

   - Trust mutation is serialized on the recipient trust-store
     class monitor in this process.
   - Future emergency Recovery apply must use the same monitor.
   - No cross-process compare-and-swap guarantee is claimed.
============================================================ */

public final class FinoraRecipientTrustTransitionApplyService {

    // ========================================================
    // RESULT DATA
    // ========================================================

    public static final class Data {

        public final String packageId;

        public final String action;

        public final String issuerId;

        public final long sequence;

        public final String installationId;

        public final String appliedAt;

        public final String activeSigningKeyId;

        public final String affectedSigningKeyId;

        private Data(
            String packageId,
            String action,
            String issuerId,
            long sequence,
            String installationId,
            String appliedAt,
            String activeSigningKeyId,
            String affectedSigningKeyId
        ) {
            this.packageId =
                packageId;

            this.action =
                action;

            this.issuerId =
                issuerId;

            this.sequence =
                sequence;

            this.installationId =
                installationId;

            this.appliedAt =
                appliedAt;

            this.activeSigningKeyId =
                activeSigningKeyId;

            this.affectedSigningKeyId =
                affectedSigningKeyId;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final Data data;

        public final String error;

        private Result(
            boolean success,
            Data data,
            String error
        ) {
            this.success =
                success;

            this.data =
                data;

            this.error =
                error;
        }

        private static Result success(
            Data data
        ) {
            return new Result(
                true,
                data,
                null
            );
        }

        private static Result failure(
            String error
        ) {
            return new Result(
                false,
                null,
                error
            );
        }
    }

    // ========================================================
    // DEPENDENCIES
    // ========================================================

    private final FinoraRecipientTrustStore trustStore;

    private final FinoraInstallationBindingService
        bindingService;

    private final FinoraClockHighWaterAuthorityService
        clockHighWaterAuthority;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraRecipientTrustTransitionApplyService(
        FinoraRecipientTrustStore trustStore,
        FinoraInstallationBindingService bindingService,
        FinoraClockHighWaterAuthorityService clockHighWaterAuthority
    ) {
        if (trustStore == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition requires recipient trust store."
            );
        }

        if (bindingService == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition requires installation binding service."
            );
        }

        if (clockHighWaterAuthority == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition requires clock high-water authority."
            );
        }

        this.trustStore =
            trustStore;

        this.bindingService =
            bindingService;

        this.clockHighWaterAuthority =
            clockHighWaterAuthority;
    }

    // ========================================================
    // PUBLIC APPLY
    // ========================================================

    public Result apply(
        JSONObject signedTransition
    ) {
        synchronized (
            FinoraRecipientTrustStore.class
        ) {
            return applyLocked(
                signedTransition
            );
        }
    }

    // ========================================================
    // APPLY LOCKED
    // ========================================================

    private Result applyLocked(
        JSONObject signedTransition
    ) {

        try {
            // ------------------------------------------------
            // AUTHORITATIVE NATIVE INSTALLATION BINDING
            // ------------------------------------------------

            FinoraInstallationBindingCrypto.PublicBinding
                nativeBinding =
                    bindingService.get();

            if (
                nativeBinding == null ||
                nativeBinding.installationId == null ||
                nativeBinding.installationId
                    .trim()
                    .isEmpty()
            ) {
                return Result.failure(
                    "FINORA recipient trust transition requires authoritative native installation binding."
                );
            }

            FinoraRecipientTrustTransitionVerifier.Target
                expectedTarget =
                    new FinoraRecipientTrustTransitionVerifier.Target(
                        nativeBinding.installationId,
                        nativeBinding.bindingKeyId,
                        nativeBinding.fingerprintAlgorithm,
                        nativeBinding.publicKeyFingerprint
                    );

            // ------------------------------------------------
            // AUTHORITATIVE RECIPIENT TRUST SNAPSHOT
            // ------------------------------------------------

            String serializedTrust =
                trustStore.read();

            if (serializedTrust == null) {
                return Result.failure(
                    "FINORA recipient operational trust has not been bootstrapped."
                );
            }

            FinoraRecipientTrustState.State trustState =
                FinoraRecipientTrustState.parse(
                    serializedTrust
                );

            // ------------------------------------------------
            // CRYPTOGRAPHIC VERIFICATION
            // ------------------------------------------------

            FinoraRecipientTrustTransitionVerifier.Result
                verification =
                    FinoraRecipientTrustTransitionVerifier.verify(
                        signedTransition,
                        trustState.trustedKeys,
                        expectedTarget
                    );

            if (
                !verification.valid ||
                verification.envelope == null ||
                verification.trustedSigner == null
            ) {
                return Result.failure(
                    verification.error != null
                        ? verification.error
                        : "FINORA recipient trust transition verification failed."
                );
            }

            JSONObject envelope =
                verification.envelope;

            FinoraRecipientTrustState.TrustedKeyRecord
                trustedSigner =
                    verification.trustedSigner;

            JSONObject issuer =
                envelope.getJSONObject(
                    "issuer"
                );

            JSONObject target =
                envelope.getJSONObject(
                    "target"
                );

            JSONObject payload =
                envelope.getJSONObject(
                    "payload"
                );

            String packageId =
                envelope.getString(
                    "packageId"
                );

            String issuerId =
                issuer.getString(
                    "issuerId"
                );

            String installationId =
                target.getString(
                    "installationId"
                );

            String action =
                payload.getString(
                    "action"
                );

            String issuedAt =
                envelope.getString(
                    "issuedAt"
                );

            long sequence =
                requireVerifiedSequence(
                    envelope
                );

            // ------------------------------------------------
            // COPY TRANSITION REPLAY STATE
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.AppliedTransitionRecord
            > appliedTransitions =
                trustState.appliedTrustTransitions ==
                    null
                    ? new ArrayList<>()
                    : new ArrayList<>(
                        trustState.appliedTrustTransitions
                    );

            List<
                FinoraRecipientTrustState.TransitionSequenceState
            > sequenceStates =
                trustState.trustTransitionSequences ==
                    null
                    ? new ArrayList<>()
                    : new ArrayList<>(
                        trustState.trustTransitionSequences
                    );

            // ------------------------------------------------
            // PACKAGE REPLAY
            // ------------------------------------------------

            for (
                FinoraRecipientTrustState.AppliedTransitionRecord
                    record :
                appliedTransitions
            ) {
                if (
                    record != null &&
                    packageId.equals(
                        record.packageId
                    )
                ) {
                    return Result.failure(
                        "FINORA recipient trust transition package has already been applied."
                    );
                }
            }

            // ------------------------------------------------
            // INSTALLATION-LEVEL MONOTONIC SEQUENCE
            //
            // issuerId + purpose + installationId
            // ------------------------------------------------

            int sequenceIndex =
                -1;

            for (
                int index = 0;
                index <
                    sequenceStates.size();
                index++
            ) {
                FinoraRecipientTrustState.TransitionSequenceState
                    state =
                        sequenceStates.get(
                            index
                        );

                if (
                    state != null &&
                    issuerId.equals(
                        state.issuerId
                    ) &&
                    FinoraRecipientTrustTransitionVerifier.PURPOSE.equals(
                        state.purpose
                    ) &&
                    installationId.equals(
                        state.installationId
                    )
                ) {
                    sequenceIndex =
                        index;

                    break;
                }
            }

            if (
                sequenceIndex >=
                    0 &&
                sequence <=
                    sequenceStates
                        .get(
                            sequenceIndex
                        )
                        .lastSequence
            ) {
                return Result.failure(
                    "FINORA recipient trust transition sequence is stale."
                );
            }

            // ------------------------------------------------
            // PROPOSE DOMAIN MUTATION
            //
            // No trust-store write occurs before all policy
            // checks and authoritative clock acceptance.
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.TrustedKeyRecord
            > nextTrustedKeys =
                new ArrayList<>();

            String activeSigningKeyId;

            String affectedSigningKeyId;

            if (
                "ROTATE".equals(
                    action
                )
            ) {
                JSONObject newTrustedKeyJson =
                    payload.getJSONObject(
                        "newTrustedKey"
                    );

                FinoraRecipientTrustState.TrustedKeyRecord
                    newTrustedKey =
                        createTrustedKey(
                            newTrustedKeyJson
                        );

                // --------------------------------------------
                // TRUSTED KEY IDENTITIES ARE NEVER REUSED
                // --------------------------------------------

                for (
                    FinoraRecipientTrustState.TrustedKeyRecord
                        existing :
                    trustState.trustedKeys
                ) {
                    if (
                        existing != null &&
                        newTrustedKey.issuerId.equals(
                            existing.issuerId
                        ) &&
                        newTrustedKey.signingKeyId.equals(
                            existing.signingKeyId
                        )
                    ) {
                        return Result.failure(
                            "FINORA recipient trust rotation new signing-key identity already exists."
                        );
                    }
                }

                // --------------------------------------------
                // RETIRE CURRENT ACTIVE AUTHORIZING KEY
                // --------------------------------------------

                boolean signerRetired =
                    false;

                for (
                    FinoraRecipientTrustState.TrustedKeyRecord
                        key :
                    trustState.trustedKeys
                ) {
                    if (
                        key.issuerId.equals(
                            trustedSigner.issuerId
                        ) &&
                        key.signingKeyId.equals(
                            trustedSigner.signingKeyId
                        )
                    ) {
                        nextTrustedKeys.add(
                            new FinoraRecipientTrustState.TrustedKeyRecord(
                                key.issuerId,
                                key.signingKeyId,
                                key.algorithm,
                                key.format,
                                key.publicKey,
                                FinoraRecipientTrustState.STATUS_RETIRED,
                                key.validFrom,
                                issuedAt
                            )
                        );

                        signerRetired =
                            true;
                    } else {
                        nextTrustedKeys.add(
                            copyTrustedKey(
                                key
                            )
                        );
                    }
                }

                if (!signerRetired) {
                    return Result.failure(
                        "FINORA recipient trust rotation authorizing ACTIVE key could not be resolved."
                    );
                }

                nextTrustedKeys.add(
                    copyTrustedKey(
                        newTrustedKey
                    )
                );

                activeSigningKeyId =
                    newTrustedKey.signingKeyId;

                affectedSigningKeyId =
                    trustedSigner.signingKeyId;
            } else if (
                "REVOKE_RETIRED".equals(
                    action
                )
            ) {
                String revokedSigningKeyId =
                    payload.getString(
                        "revokedSigningKeyId"
                    );

                int revokedKeyIndex =
                    -1;

                FinoraRecipientTrustState.TrustedKeyRecord
                    revokedKey =
                        null;

                for (
                    int index = 0;
                    index <
                        trustState.trustedKeys.size();
                    index++
                ) {
                    FinoraRecipientTrustState.TrustedKeyRecord
                        key =
                            trustState.trustedKeys.get(
                                index
                            );

                    if (
                        key != null &&
                        trustedSigner.issuerId.equals(
                            key.issuerId
                        ) &&
                        revokedSigningKeyId.equals(
                            key.signingKeyId
                        )
                    ) {
                        revokedKeyIndex =
                            index;

                        revokedKey =
                            key;

                        break;
                    }
                }

                if (
                    revokedKeyIndex <
                        0 ||
                    revokedKey ==
                        null
                ) {
                    return Result.failure(
                        "FINORA recipient trust revocation target signing key does not exist for this issuer."
                    );
                }

                if (
                    !FinoraRecipientTrustState.STATUS_RETIRED.equals(
                        revokedKey.status
                    )
                ) {
                    return Result.failure(
                        "FINORA recipient trust REVOKE_RETIRED action requires an existing RETIRED signing key."
                    );
                }

                for (
                    int index = 0;
                    index <
                        trustState.trustedKeys.size();
                    index++
                ) {
                    FinoraRecipientTrustState.TrustedKeyRecord
                        key =
                            trustState.trustedKeys.get(
                                index
                            );

                    if (
                        index ==
                            revokedKeyIndex
                    ) {
                        nextTrustedKeys.add(
                            new FinoraRecipientTrustState.TrustedKeyRecord(
                                key.issuerId,
                                key.signingKeyId,
                                key.algorithm,
                                key.format,
                                key.publicKey,
                                FinoraRecipientTrustState.STATUS_REVOKED,
                                key.validFrom,
                                key.validUntil
                            )
                        );
                    } else {
                        nextTrustedKeys.add(
                            copyTrustedKey(
                                key
                            )
                        );
                    }
                }

                activeSigningKeyId =
                    trustedSigner.signingKeyId;

                affectedSigningKeyId =
                    revokedKey.signingKeyId;
            } else {
                return Result.failure(
                    "FINORA recipient trust transition action is unsupported."
                );
            }

            // ------------------------------------------------
            // VALIDATE PROPOSED KEY SET BEFORE CLOCK / WRITE
            // ------------------------------------------------

            FinoraRecipientTrustState.State
                proposedKeyValidationState =
                    new FinoraRecipientTrustState.State(
                        FinoraRecipientTrustState.SCHEMA_VERSION,
                        nextTrustedKeys,
                        appliedTransitions,
                        sequenceStates,
                        copyAppliedRecoveries(
                            trustState.appliedTrustRecoveries
                        ),
                        copyRecoverySequences(
                            trustState.trustRecoverySequences
                        )
                    );

            FinoraRecipientTrustState.validate(
                proposedKeyValidationState
            );

            // ------------------------------------------------
            // AUTHORITATIVE APPLIED TIME / ROLLBACK DEFENCE
            //
            // Caller cannot supply appliedAt.
            // ------------------------------------------------

            FinoraClockHighWaterAuthorityService.Result
                clockResult =
                    clockHighWaterAuthority.observe();

            if (
                !clockResult.success ||
                clockResult.data == null
            ) {
                return Result.failure(
                    clockResult.error != null
                        ? clockResult.error
                        : "FINORA recipient clock authority rejected the trust transition."
                );
            }

            if (
                !installationId.equals(
                    clockResult.data.installationId
                )
            ) {
                return Result.failure(
                    "FINORA recipient clock authority installation does not match the verified trust transition target."
                );
            }

            String appliedAt =
                clockResult.data.observedAt;

            // ------------------------------------------------
            // APPLIED TRANSITION LEDGER
            // ------------------------------------------------

            appliedTransitions.add(
                new FinoraRecipientTrustState.AppliedTransitionRecord(
                    packageId,
                    issuerId,
                    FinoraRecipientTrustTransitionVerifier.PURPOSE,
                    sequence,
                    installationId,
                    appliedAt
                )
            );

            // ------------------------------------------------
            // MONOTONIC SEQUENCE CURSOR
            // ------------------------------------------------

            FinoraRecipientTrustState.TransitionSequenceState
                nextSequenceState =
                    new FinoraRecipientTrustState.TransitionSequenceState(
                        issuerId,
                        FinoraRecipientTrustTransitionVerifier.PURPOSE,
                        installationId,
                        sequence,
                        appliedAt
                    );

            if (
                sequenceIndex >=
                    0
            ) {
                sequenceStates.set(
                    sequenceIndex,
                    nextSequenceState
                );
            } else {
                sequenceStates.add(
                    nextSequenceState
                );
            }

            // ------------------------------------------------
            // PRESERVE INDEPENDENT RECOVERY METADATA
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.AppliedRecoveryRecord
            > preservedRecoveries =
                copyAppliedRecoveries(
                    trustState.appliedTrustRecoveries
                );

            List<
                FinoraRecipientTrustState.RecoverySequenceState
            > preservedRecoverySequences =
                copyRecoverySequences(
                    trustState.trustRecoverySequences
                );

            // ------------------------------------------------
            // ONE AUTHORITATIVE RECIPIENT TRUST STATE
            // ------------------------------------------------

            FinoraRecipientTrustState.State nextState =
                new FinoraRecipientTrustState.State(
                    FinoraRecipientTrustState.SCHEMA_VERSION,
                    nextTrustedKeys,
                    appliedTransitions,
                    sequenceStates,
                    preservedRecoveries,
                    preservedRecoverySequences
                );

            String serializedNextState =
                FinoraRecipientTrustState.serialize(
                    nextState
                );

            // ------------------------------------------------
            // ONE ENCRYPTED TRUST-STORE REPLACEMENT
            // ------------------------------------------------

            trustStore.write(
                serializedNextState
            );

            return Result.success(
                new Data(
                    packageId,
                    action,
                    issuerId,
                    sequence,
                    installationId,
                    appliedAt,
                    activeSigningKeyId,
                    affectedSigningKeyId
                )
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition apply failed."
                )
            );
        }
    }

    // ========================================================
    // VERIFIED SEQUENCE
    // ========================================================

    private static long requireVerifiedSequence(
        JSONObject envelope
    ) throws Exception {

        Object raw =
            envelope.get(
                "sequence"
            );

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA verified recipient trust transition sequence is invalid."
            );
        }

        long sequence =
            ((Number) raw)
                .longValue();

        if (sequence <= 0) {
            throw new IllegalArgumentException(
                "FINORA verified recipient trust transition sequence is invalid."
            );
        }

        return sequence;
    }

    // ========================================================
    // NEW TRUSTED KEY
    // ========================================================

    private static FinoraRecipientTrustState.TrustedKeyRecord
        createTrustedKey(
            JSONObject value
        ) throws Exception {

        return new FinoraRecipientTrustState.TrustedKeyRecord(
            value.getString(
                "issuerId"
            ),
            value.getString(
                "signingKeyId"
            ),
            value.getString(
                "algorithm"
            ),
            value.getString(
                "format"
            ),
            value.getString(
                "publicKey"
            ),
            value.getString(
                "status"
            ),
            value.getString(
                "validFrom"
            ),
            value.has(
                "validUntil"
            ) &&
            !value.isNull(
                "validUntil"
            )
                ? value.getString(
                    "validUntil"
                )
                : null
        );
    }

    // ========================================================
    // TRUSTED KEY COPY
    // ========================================================

    private static FinoraRecipientTrustState.TrustedKeyRecord
        copyTrustedKey(
            FinoraRecipientTrustState.TrustedKeyRecord key
        ) {

        if (key == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust contains an invalid trusted-key entry."
            );
        }

        return new FinoraRecipientTrustState.TrustedKeyRecord(
            key.issuerId,
            key.signingKeyId,
            key.algorithm,
            key.format,
            key.publicKey,
            key.status,
            key.validFrom,
            key.validUntil
        );
    }

    // ========================================================
    // RECOVERY METADATA COPY
    //
    // Metadata only. No Recovery Authority logic is invoked.
    // ========================================================

    private static List<
        FinoraRecipientTrustState.AppliedRecoveryRecord
    > copyAppliedRecoveries(
        List<
            FinoraRecipientTrustState.AppliedRecoveryRecord
        > records
    ) {

        if (records == null) {
            return null;
        }

        List<
            FinoraRecipientTrustState.AppliedRecoveryRecord
        > copy =
            new ArrayList<>();

        for (
            FinoraRecipientTrustState.AppliedRecoveryRecord
                record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery ledger contains an invalid entry."
                );
            }

            copy.add(
                new FinoraRecipientTrustState.AppliedRecoveryRecord(
                    record.packageId,
                    record.recoveryAuthorityId,
                    record.purpose,
                    record.sequence,
                    record.installationId,
                    record.operationalIssuerId,
                    record.appliedAt
                )
            );
        }

        return copy;
    }

    private static List<
        FinoraRecipientTrustState.RecoverySequenceState
    > copyRecoverySequences(
        List<
            FinoraRecipientTrustState.RecoverySequenceState
        > records
    ) {

        if (records == null) {
            return null;
        }

        List<
            FinoraRecipientTrustState.RecoverySequenceState
        > copy =
            new ArrayList<>();

        for (
            FinoraRecipientTrustState.RecoverySequenceState
                record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery sequence state contains an invalid entry."
                );
            }

            copy.add(
                new FinoraRecipientTrustState.RecoverySequenceState(
                    record.recoveryAuthorityId,
                    record.purpose,
                    record.installationId,
                    record.operationalIssuerId,
                    record.lastSequence,
                    record.updatedAt
                )
            );
        }

        return copy;
    }

    // ========================================================
    // MESSAGE
    // ========================================================

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {

        if (
            error == null ||
            error.getMessage() == null ||
            error.getMessage()
                .trim()
                .isEmpty()
        ) {
            return fallback;
        }

        return error.getMessage();
    }
}

/* ============================================================
   END
============================================================ */