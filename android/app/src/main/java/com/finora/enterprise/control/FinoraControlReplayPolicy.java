package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// CONTROL PACKAGE REPLAY / SEQUENCE POLICY
//
// RESPONSIBILITY:
//
// - Reject already-applied packageId values
// - Enforce monotonic package sequence
// - Scope sequence to issuer / purpose / target
//
// SECURITY:
//
// - Pure Java.
// - No Android Context.
// - No persistence.
// - No signing.
// - No private key.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import java.util.List;
import java.util.Map;

public final class FinoraControlReplayPolicy {

    private FinoraControlReplayPolicy() {
    }

    // ========================================================
    // DECISION
    // ========================================================

    public static final class Decision {

        public final boolean accepted;

        public final String reason;

        public final String error;

        public final Long previousSequence;

        private Decision(
            boolean accepted,
            String reason,
            String error,
            Long previousSequence
        ) {

            this.accepted =
                accepted;

            this.reason =
                reason;

            this.error =
                error;

            this.previousSequence =
                previousSequence;
        }

        public static Decision accepted(
            Long previousSequence
        ) {

            return new Decision(
                true,
                null,
                null,
                previousSequence
            );
        }

        public static Decision rejected(
            String reason,
            String error,
            Long previousSequence
        ) {

            return new Decision(
                false,
                reason,
                error,
                previousSequence
            );
        }
    }

    // ========================================================
    // EVALUATE
    // ========================================================

    public static Decision evaluate(
        String packageId,
        String issuerId,
        String purpose,
        long sequence,
        String ownerId,
        String businessId,
        String branchId,
        String installationId,
        List<Map<String, Object>> appliedPackages,
        List<Map<String, Object>> sequenceStates
    ) {

        if (
            !hasText(packageId) ||
            !hasText(issuerId) ||
            !hasText(purpose) ||
            sequence <= 0 ||
            !hasText(ownerId) ||
            !hasText(businessId) ||
            !hasText(branchId) ||
            !hasText(installationId) ||
            appliedPackages == null ||
            sequenceStates == null
        ) {

            return Decision.rejected(
                "INVALID_REPLAY_INPUT",
                "FINORA replay evaluation input is invalid.",
                null
            );
        }


        // ----------------------------------------------------
        // PACKAGE ID REPLAY
        // ----------------------------------------------------

        for (
            Map<String, Object> record :
            appliedPackages
        ) {

            if (
                record != null &&
                packageId.equals(
                    record.get(
                        "packageId"
                    )
                )
            ) {

                return Decision.rejected(
                    "REPLAYED_PACKAGE",
                    "FINORA Control Package has already been applied.",
                    null
                );
            }
        }


        // ----------------------------------------------------
        // MONOTONIC SEQUENCE
        // ----------------------------------------------------

        for (
            Map<String, Object> state :
            sequenceStates
        ) {

            if (
                state != null &&
                sameScope(
                    state,
                    issuerId,
                    purpose,
                    ownerId,
                    businessId,
                    branchId,
                    installationId
                )
            ) {

                Long previous =
                    safePositiveLong(
                        state.get(
                            "lastSequence"
                        )
                    );

                if (previous == null) {

                    return Decision.rejected(
                        "INVALID_SEQUENCE_STATE",
                        "FINORA stored Control Package sequence state is invalid.",
                        null
                    );
                }

                if (
                    sequence <=
                        previous.longValue()
                ) {

                    return Decision.rejected(
                        "STALE_SEQUENCE",
                        "FINORA Control Package sequence is stale.",
                        previous
                    );
                }

                return Decision.accepted(
                    previous
                );
            }
        }

        return Decision.accepted(
            null
        );
    }

    // ========================================================
    // HELPERS
    // ========================================================

    private static boolean sameScope(
        Map<String, Object> state,
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

        return (
            issuerId.equals(
                state.get(
                    "issuerId"
                )
            ) &&
            purpose.equals(
                state.get(
                    "purpose"
                )
            ) &&
            ownerId.equals(
                state.get(
                    "ownerId"
                )
            ) &&
            businessId.equals(
                state.get(
                    "businessId"
                )
            ) &&
            branchId.equals(
                state.get(
                    "branchId"
                )
            ) &&
            installationId.equals(
                state.get(
                    "installationId"
                )
            )
        );
    }

    private static Long safePositiveLong(
        Object value
    ) {

        if (!(value instanceof Number)) {
            return null;
        }

        double number =
            ((Number) value)
                .doubleValue();

        if (
            !Double.isFinite(number) ||
            number <= 0 ||
            Math.rint(number) != number ||
            number >
                9007199254740991.0d
        ) {

            return null;
        }

        long converted =
            ((Number) value)
                .longValue();

        if (
            ((double) converted) !=
                number
        ) {

            return null;
        }

        return Long.valueOf(
            converted
        );
    }

    private static boolean hasText(
        String value
    ) {

        return (
            value != null &&
            !value.trim()
                .isEmpty()
        );
    }

    // ========================================================
    // END
    // ========================================================
}