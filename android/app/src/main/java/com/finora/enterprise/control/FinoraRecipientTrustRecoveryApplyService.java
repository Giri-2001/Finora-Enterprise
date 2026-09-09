package com.finora.enterprise.control;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST RECOVERY APPLY SERVICE

   MODULE  : Control
   LAYER   : Native Emergency Recipient Trust Mutation Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve exact authoritative native installation binding
   - Load independently provisioned Recovery Authority public root
   - Load authoritative operational recipient trust
   - Obtain accepted apply time from recipient clock high-water
   - Verify signed RECIPIENT_TRUST_RECOVERY
   - Reject recovery package replay
   - Enforce scoped monotonic recovery sequence
   - Confirm expectedActiveSigningKeyId is exactly the sole
     current ACTIVE key for operationalIssuerId
   - Revoke that compromised ACTIVE key
   - Install replacementTrustedKey as sole ACTIVE key
   - Preserve historical RETIRED / REVOKED keys
   - Preserve normal transition replay / sequence metadata
   - Append independent recovery replay ledger
   - Advance independent recovery sequence cursor
   - Persist one complete encrypted recipient trust replacement

   RECOVERY SEQUENCE SCOPE:

   recoveryAuthorityId
   + RECIPIENT_TRUST_RECOVERY
   + installationId
   + operationalIssuerId

   SECURITY:

   - Public apply API accepts signed recovery package only.
   - Caller supplies no trusted keys.
   - Caller supplies no Recovery Authority root.
   - Caller supplies no installation target.
   - Caller supplies no accepted time.
   - Caller supplies no expected ACTIVE key separately.
   - Operational ACTIVE key does not authorize recovery.
   - Recovery Authority root is never mutated here.
   - No bootstrap mutation.
   - No private signing key.
   - No renderer / Capacitor API.
   - Same recipient-trust class monitor is shared with normal
     trust transition apply and Recovery Authority bootstrap.

   CONCURRENCY:

   - Same-process serialization only.
   - No cross-process compare-and-swap guarantee is claimed.
============================================================ */

public final class FinoraRecipientTrustRecoveryApplyService {

    // ========================================================
    // SUCCESS DATA
    // ========================================================

    public static final class Data {

        public final String packageId;

        public final String action;

        public final String recoveryAuthorityId;

        public final String operationalIssuerId;

        public final long sequence;

        public final String installationId;

        public final String appliedAt;

        public final String revokedSigningKeyId;

        public final String activeSigningKeyId;

        private Data(
            String packageId,
            String action,
            String recoveryAuthorityId,
            String operationalIssuerId,
            long sequence,
            String installationId,
            String appliedAt,
            String revokedSigningKeyId,
            String activeSigningKeyId
        ) {
            this.packageId =
                packageId;

            this.action =
                action;

            this.recoveryAuthorityId =
                recoveryAuthorityId;

            this.operationalIssuerId =
                operationalIssuerId;

            this.sequence =
                sequence;

            this.installationId =
                installationId;

            this.appliedAt =
                appliedAt;

            this.revokedSigningKeyId =
                revokedSigningKeyId;

            this.activeSigningKeyId =
                activeSigningKeyId;
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

    private final FinoraRecipientTrustRecoveryAuthorityStore
        recoveryAuthorityStore;

    private final FinoraInstallationBindingService
        bindingService;

    private final FinoraClockHighWaterAuthorityService
        clockHighWaterAuthority;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraRecipientTrustRecoveryApplyService(
        FinoraRecipientTrustStore trustStore,
        FinoraRecipientTrustRecoveryAuthorityStore recoveryAuthorityStore,
        FinoraInstallationBindingService bindingService,
        FinoraClockHighWaterAuthorityService clockHighWaterAuthority
    ) {
        if (trustStore == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery requires recipient trust store."
            );
        }

        if (recoveryAuthorityStore == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery requires Recovery Authority store."
            );
        }

        if (bindingService == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery requires installation binding service."
            );
        }

        if (clockHighWaterAuthority == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery requires clock high-water authority."
            );
        }

        this.trustStore =
            trustStore;

        this.recoveryAuthorityStore =
            recoveryAuthorityStore;

        this.bindingService =
            bindingService;

        this.clockHighWaterAuthority =
            clockHighWaterAuthority;
    }

    // ========================================================
    // PUBLIC APPLY
    // ========================================================

    public Result apply(
        JSONObject signedRecovery
    ) {
        synchronized (
            FinoraRecipientTrustStore.class
        ) {
            return applyLocked(
                signedRecovery
            );
        }
    }

    // ========================================================
    // APPLY LOCKED
    // ========================================================

    private Result applyLocked(
        JSONObject signedRecovery
    ) {

        try {
            // ------------------------------------------------
            // AUTHORITATIVE NATIVE INSTALLATION
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
                    "FINORA native installation binding is required before applying recipient trust recovery."
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
            // INDEPENDENT RECOVERY AUTHORITY ROOT
            // ------------------------------------------------

            String serializedRecoveryAuthority =
                recoveryAuthorityStore.read();

            if (serializedRecoveryAuthority == null) {
                return Result.failure(
                    "FINORA recipient trust recovery authority must be independently provisioned before applying emergency recovery."
                );
            }

            FinoraRecipientTrustRecoveryAuthorityState.State
                recoveryAuthorityState =
                    FinoraRecipientTrustRecoveryAuthorityState.parse(
                        serializedRecoveryAuthority
                    );

            // ------------------------------------------------
            // AUTHORITATIVE OPERATIONAL RECIPIENT TRUST
            // ------------------------------------------------

            String serializedTrust =
                trustStore.read();

            if (serializedTrust == null) {
                return Result.failure(
                    "FINORA recipient operational trust must exist before applying emergency recovery."
                );
            }

            FinoraRecipientTrustState.State trustState =
                FinoraRecipientTrustState.parse(
                    serializedTrust
                );

            // ------------------------------------------------
            // AUTHORITATIVE ACCEPTED APPLY TIME
            //
            // Recovery verifier needs acceptedNow.
            // Caller cannot provide it.
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
                        : "FINORA recipient clock authority rejected emergency recovery."
                );
            }

            if (
                !nativeBinding.installationId.equals(
                    clockResult.data.installationId
                )
            ) {
                return Result.failure(
                    "FINORA recipient recovery clock observation does not belong to the authoritative native installation."
                );
            }

            String acceptedNow =
                clockResult.data.observedAt;

            // ------------------------------------------------
            // INDEPENDENT RECOVERY CRYPTOGRAPHIC VERIFICATION
            // ------------------------------------------------

            FinoraRecipientTrustRecoveryVerifier.Result
                verification =
                    FinoraRecipientTrustRecoveryVerifier.verify(
                        signedRecovery,
                        recoveryAuthorityState,
                        expectedTarget,
                        acceptedNow
                    );

            if (
                !verification.valid ||
                verification.envelope == null ||
                verification.recoveryAuthority == null
            ) {
                return Result.failure(
                    verification.error != null
                        ? verification.error
                        : "FINORA recipient trust recovery verification failed."
                );
            }

            JSONObject envelope =
                verification.envelope;

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

            String recoveryAuthorityId =
                issuer.getString(
                    "recoveryAuthorityId"
                );

            String installationId =
                target.getString(
                    "installationId"
                );

            String operationalIssuerId =
                payload.getString(
                    "operationalIssuerId"
                );

            String expectedActiveSigningKeyId =
                payload.getString(
                    "expectedActiveSigningKeyId"
                );

            String action =
                payload.getString(
                    "action"
                );

            long sequence =
                requireVerifiedSequence(
                    envelope
                );

            // ------------------------------------------------
            // COPY RECOVERY LEDGER / CURSOR
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.AppliedRecoveryRecord
            > appliedRecoveries =
                trustState.appliedTrustRecoveries ==
                    null
                    ? new ArrayList<>()
                    : copyAppliedRecoveries(
                        trustState.appliedTrustRecoveries
                    );

            List<
                FinoraRecipientTrustState.RecoverySequenceState
            > recoverySequenceStates =
                trustState.trustRecoverySequences ==
                    null
                    ? new ArrayList<>()
                    : copyRecoverySequences(
                        trustState.trustRecoverySequences
                    );

            // ------------------------------------------------
            // PACKAGE REPLAY
            // ------------------------------------------------

            for (
                FinoraRecipientTrustState.AppliedRecoveryRecord
                    record :
                appliedRecoveries
            ) {
                if (
                    record != null &&
                    packageId.equals(
                        record.packageId
                    )
                ) {
                    return Result.failure(
                        "FINORA recipient trust recovery package has already been applied."
                    );
                }
            }

            // ------------------------------------------------
            // SCOPED MONOTONIC RECOVERY SEQUENCE
            //
            // recoveryAuthorityId
            // + RECIPIENT_TRUST_RECOVERY
            // + installationId
            // + operationalIssuerId
            //
            // Forward sequence gaps are permitted.
            // ------------------------------------------------

            int recoverySequenceIndex =
                -1;

            for (
                int index = 0;
                index <
                    recoverySequenceStates.size();
                index++
            ) {
                FinoraRecipientTrustState.RecoverySequenceState
                    state =
                        recoverySequenceStates.get(
                            index
                        );

                if (
                    state != null &&
                    recoveryAuthorityId.equals(
                        state.recoveryAuthorityId
                    ) &&
                    FinoraRecipientTrustRecoveryVerifier.PURPOSE.equals(
                        state.purpose
                    ) &&
                    installationId.equals(
                        state.installationId
                    ) &&
                    operationalIssuerId.equals(
                        state.operationalIssuerId
                    )
                ) {
                    recoverySequenceIndex =
                        index;

                    break;
                }
            }

            if (
                recoverySequenceIndex >=
                    0 &&
                sequence <=
                    recoverySequenceStates
                        .get(
                            recoverySequenceIndex
                        )
                        .lastSequence
            ) {
                return Result.failure(
                    "FINORA recipient trust recovery sequence is stale."
                );
            }

            // ------------------------------------------------
            // EXACT CURRENT ACTIVE OPERATIONAL AUTHORITY
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.TrustedKeyRecord
            > activeKeysForOperationalIssuer =
                new ArrayList<>();

            for (
                FinoraRecipientTrustState.TrustedKeyRecord key :
                trustState.trustedKeys
            ) {
                if (
                    key != null &&
                    operationalIssuerId.equals(
                        key.issuerId
                    ) &&
                    FinoraRecipientTrustState.STATUS_ACTIVE.equals(
                        key.status
                    )
                ) {
                    activeKeysForOperationalIssuer.add(
                        key
                    );
                }
            }

            if (
                activeKeysForOperationalIssuer.size() !=
                    1
            ) {
                return Result.failure(
                    "FINORA recipient trust recovery requires exactly one current ACTIVE signing key for the operational issuer."
                );
            }

            FinoraRecipientTrustState.TrustedKeyRecord
                currentActive =
                    activeKeysForOperationalIssuer.get(
                        0
                    );

            if (
                !expectedActiveSigningKeyId.equals(
                    currentActive.signingKeyId
                )
            ) {
                return Result.failure(
                    "FINORA recipient trust recovery expected ACTIVE signing key does not match current operational trust."
                );
            }

            // ------------------------------------------------
            // REPLACEMENT KEY
            // ------------------------------------------------

            JSONObject replacementJson =
                payload.getJSONObject(
                    "replacementTrustedKey"
                );

            FinoraRecipientTrustState.TrustedKeyRecord
                replacement =
                    createReplacementTrustedKey(
                        replacementJson
                    );

            // ------------------------------------------------
            // NEVER REUSE AN EXISTING TRUSTED KEY IDENTITY
            // ------------------------------------------------

            for (
                FinoraRecipientTrustState.TrustedKeyRecord key :
                trustState.trustedKeys
            ) {
                if (
                    key != null &&
                    replacement.issuerId.equals(
                        key.issuerId
                    ) &&
                    replacement.signingKeyId.equals(
                        key.signingKeyId
                    )
                ) {
                    return Result.failure(
                        "FINORA recipient trust recovery replacement signing-key identity already exists."
                    );
                }
            }

            // ------------------------------------------------
            // REVOKE CURRENT ACTIVE + PRESERVE HISTORY
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.TrustedKeyRecord
            > nextTrustedKeys =
                new ArrayList<>();

            boolean currentActiveRevoked =
                false;

            for (
                FinoraRecipientTrustState.TrustedKeyRecord key :
                trustState.trustedKeys
            ) {
                if (
                    key.issuerId.equals(
                        currentActive.issuerId
                    ) &&
                    key.signingKeyId.equals(
                        currentActive.signingKeyId
                    )
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

                    currentActiveRevoked =
                        true;
                } else {
                    nextTrustedKeys.add(
                        copyTrustedKey(
                            key
                        )
                    );
                }
            }

            if (!currentActiveRevoked) {
                return Result.failure(
                    "FINORA recipient trust recovery current ACTIVE signing key could not be revoked."
                );
            }

            nextTrustedKeys.add(
                copyTrustedKey(
                    replacement
                )
            );

            // ------------------------------------------------
            // RECOVERY APPLIED LEDGER
            // ------------------------------------------------

            appliedRecoveries.add(
                new FinoraRecipientTrustState.AppliedRecoveryRecord(
                    packageId,
                    recoveryAuthorityId,
                    FinoraRecipientTrustRecoveryVerifier.PURPOSE,
                    sequence,
                    installationId,
                    operationalIssuerId,
                    acceptedNow
                )
            );

            // ------------------------------------------------
            // RECOVERY SEQUENCE CURSOR
            // ------------------------------------------------

            FinoraRecipientTrustState.RecoverySequenceState
                nextRecoverySequence =
                    new FinoraRecipientTrustState.RecoverySequenceState(
                        recoveryAuthorityId,
                        FinoraRecipientTrustRecoveryVerifier.PURPOSE,
                        installationId,
                        operationalIssuerId,
                        sequence,
                        acceptedNow
                    );

            if (
                recoverySequenceIndex >=
                    0
            ) {
                recoverySequenceStates.set(
                    recoverySequenceIndex,
                    nextRecoverySequence
                );
            } else {
                recoverySequenceStates.add(
                    nextRecoverySequence
                );
            }

            // ------------------------------------------------
            // PRESERVE NORMAL TRANSITION METADATA
            // ------------------------------------------------

            List<
                FinoraRecipientTrustState.AppliedTransitionRecord
            > preservedTransitions =
                copyAppliedTransitions(
                    trustState.appliedTrustTransitions
                );

            List<
                FinoraRecipientTrustState.TransitionSequenceState
            > preservedTransitionSequences =
                copyTransitionSequences(
                    trustState.trustTransitionSequences
                );

            // ------------------------------------------------
            // ONE COMPLETE NEXT TRUST STATE
            // ------------------------------------------------

            FinoraRecipientTrustState.State nextState =
                new FinoraRecipientTrustState.State(
                    FinoraRecipientTrustState.SCHEMA_VERSION,
                    nextTrustedKeys,
                    preservedTransitions,
                    preservedTransitionSequences,
                    appliedRecoveries,
                    recoverySequenceStates
                );

            FinoraRecipientTrustState.validate(
                nextState
            );

            String serializedNextState =
                FinoraRecipientTrustState.serialize(
                    nextState
                );

            // ------------------------------------------------
            // ONE ENCRYPTED OPERATIONAL TRUST REPLACEMENT
            // ------------------------------------------------

            trustStore.write(
                serializedNextState
            );

            return Result.success(
                new Data(
                    packageId,
                    action,
                    recoveryAuthorityId,
                    operationalIssuerId,
                    sequence,
                    installationId,
                    acceptedNow,
                    currentActive.signingKeyId,
                    replacement.signingKeyId
                )
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery apply failed."
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
                "FINORA verified recipient trust recovery sequence is invalid."
            );
        }

        long sequence =
            ((Number) raw)
                .longValue();

        if (sequence <= 0) {
            throw new IllegalArgumentException(
                "FINORA verified recipient trust recovery sequence is invalid."
            );
        }

        return sequence;
    }

    // ========================================================
    // REPLACEMENT KEY
    // ========================================================

    private static FinoraRecipientTrustState.TrustedKeyRecord
        createReplacementTrustedKey(
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
    // NORMAL TRANSITION METADATA COPY
    // ========================================================

    private static List<
        FinoraRecipientTrustState.AppliedTransitionRecord
    > copyAppliedTransitions(
        List<
            FinoraRecipientTrustState.AppliedTransitionRecord
        > records
    ) {

        if (records == null) {
            return null;
        }

        List<
            FinoraRecipientTrustState.AppliedTransitionRecord
        > copy =
            new ArrayList<>();

        for (
            FinoraRecipientTrustState.AppliedTransitionRecord
                record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition ledger contains an invalid entry."
                );
            }

            copy.add(
                new FinoraRecipientTrustState.AppliedTransitionRecord(
                    record.packageId,
                    record.issuerId,
                    record.purpose,
                    record.sequence,
                    record.installationId,
                    record.appliedAt
                )
            );
        }

        return copy;
    }

    private static List<
        FinoraRecipientTrustState.TransitionSequenceState
    > copyTransitionSequences(
        List<
            FinoraRecipientTrustState.TransitionSequenceState
        > records
    ) {

        if (records == null) {
            return null;
        }

        List<
            FinoraRecipientTrustState.TransitionSequenceState
        > copy =
            new ArrayList<>();

        for (
            FinoraRecipientTrustState.TransitionSequenceState
                record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition sequence state contains an invalid entry."
                );
            }

            copy.add(
                new FinoraRecipientTrustState.TransitionSequenceState(
                    record.issuerId,
                    record.purpose,
                    record.installationId,
                    record.lastSequence,
                    record.updatedAt
                )
            );
        }

        return copy;
    }

    // ========================================================
    // RECOVERY METADATA COPY
    // ========================================================

    private static List<
        FinoraRecipientTrustState.AppliedRecoveryRecord
    > copyAppliedRecoveries(
        List<
            FinoraRecipientTrustState.AppliedRecoveryRecord
        > records
    ) {

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