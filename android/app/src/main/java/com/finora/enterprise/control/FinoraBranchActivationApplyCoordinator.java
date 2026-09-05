package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// BRANCH ACTIVATION APPLY COORDINATOR
//
// RESPONSIBILITY:
//
// - Read authoritative native control state through a port
// - Resolve current installation identity
// - Verify Control Center ECDSA P-256 signature
// - Verify exact installation target
// - Apply REGISTERED / DEMO domain rules
// - Enforce package replay / monotonic sequence
// - Commit exactly one complete next-state package
//
// SECURITY:
//
// - Pure Java.
// - PUBLIC verification only.
// - No private key.
// - No signing.
// - No Android Context.
// - No WebView.
// - No Business Date.
//
// Production persistence is supplied by
// FinoraBranchActivationPackageApplyService, whose adapter routes
// writes to FinoraControlStore:
//
// Android Keystore AES-256-GCM
// +
// AtomicFile.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class FinoraBranchActivationApplyCoordinator {

    private static final Object APPLY_LOCK =
        new Object();

    private final ControlStatePort controlStatePort;

    public FinoraBranchActivationApplyCoordinator(
        ControlStatePort controlStatePort
    ) {

        if (controlStatePort == null) {

            throw new IllegalArgumentException(
                "FINORA Control State port is required."
            );
        }

        this.controlStatePort =
            controlStatePort;
    }

    // ========================================================
    // CONTROL STATE PORT
    // ========================================================

    public interface ControlStatePort {

        Map<String, Object> read()
            throws Exception;

        void write(
            Map<String, Object> nextState
        ) throws Exception;
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final String error;

        public final String packageId;

        public final Long sequence;

        private Result(
            boolean success,
            String error,
            String packageId,
            Long sequence
        ) {

            this.success =
                success;

            this.error =
                error;

            this.packageId =
                packageId;

            this.sequence =
                sequence;
        }

        public static Result success(
            String packageId,
            long sequence
        ) {

            return new Result(
                true,
                null,
                packageId,
                Long.valueOf(
                    sequence
                )
            );
        }

        public static Result failure(
            String error
        ) {

            return new Result(
                false,
                error,
                null,
                null
            );
        }
    }

    // ========================================================
    // APPLY
    // ========================================================

    public Result apply(
        Map<String, Object> signedPackage,
        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys,
        Instant now
    ) {

        synchronized (APPLY_LOCK) {

            return applyLocked(
                signedPackage,
                trustedKeys,
                now
            );
        }
    }

    private Result applyLocked(
        Map<String, Object> signedPackage,
        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys,
        Instant now
    ) {

        if (
            signedPackage == null ||
            trustedKeys == null ||
            now == null
        ) {

            return Result.failure(
                "FINORA signed Branch Activation apply input is incomplete."
            );
        }

        try {

            // ------------------------------------------------
            // AUTHORITATIVE CURRENT STATE
            // ------------------------------------------------

            Map<String, Object> currentState =
                controlStatePort.read();

            if (currentState == null) {

                return Result.failure(
                    "FINORA installation identity is required before activation."
                );
            }

            Map<String, Object> installation =
                asMap(
                    currentState.get(
                        "installation"
                    )
                );

            if (installation == null) {

                return Result.failure(
                    "FINORA installation identity is required before activation."
                );
            }

            String installationId =
                requiredString(
                    installation.get(
                        "installationId"
                    )
                );

            String ownerId =
                requiredString(
                    installation.get(
                        "ownerId"
                    )
                );

            String businessId =
                requiredString(
                    installation.get(
                        "businessId"
                    )
                );

            String branchId =
                requiredString(
                    installation.get(
                        "branchId"
                    )
                );

            if (
                installationId == null ||
                ownerId == null ||
                businessId == null ||
                branchId == null
            ) {

                return Result.failure(
                    "FINORA installation identity is invalid."
                );
            }


            // ------------------------------------------------
            // CRYPTOGRAPHIC VERIFICATION
            // ------------------------------------------------

            FinoraSignedControlPackageVerifier.Result verification =
                FinoraSignedControlPackageVerifier
                    .verify(
                        signedPackage,
                        trustedKeys,
                        new FinoraSignedControlPackageVerifier.Target(
                            ownerId,
                            businessId,
                            branchId,
                            installationId
                        ),
                        now
                    );

            if (!verification.valid) {

                return Result.failure(
                    verification.reason +
                    ": " +
                    verification.error
                );
            }


            // ------------------------------------------------
            // DOMAIN + REPLAY / SEQUENCE ENGINE
            // ------------------------------------------------

            FinoraBranchActivationStateEngine.Result stateResult =
                FinoraBranchActivationStateEngine
                    .applyVerifiedPackage(
                        currentState,
                        verification.controlPackage,
                        now
                    );

            if (!stateResult.success) {

                return Result.failure(
                    stateResult.error
                );
            }


            // ------------------------------------------------
            // EXACTLY ONE COMPLETE STATE COMMIT
            // ------------------------------------------------

            controlStatePort.write(
                stateResult.nextState
            );


            String packageId =
                requiredString(
                    signedPackage.get(
                        "packageId"
                    )
                );

            Long sequence =
                positiveSafeLong(
                    signedPackage.get(
                        "sequence"
                    )
                );

            if (
                packageId == null ||
                sequence == null
            ) {

                return Result.failure(
                    "Applied FINORA Control Package identity is invalid."
                );
            }

            return Result.success(
                packageId,
                sequence.longValue()
            );

        } catch (Exception error) {

            return Result.failure(
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to apply FINORA signed Branch Activation package."
            );
        }
    }

    // ========================================================
    // HELPERS
    // ========================================================

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map)) {
            return null;
        }

        return (Map<String, Object>) value;
    }

    private static String requiredString(
        Object value
    ) {

        if (!(value instanceof String)) {
            return null;
        }

        String normalized =
            ((String) value)
                .trim();

        return normalized.isEmpty()
            ? null
            : normalized;
    }

    private static Long positiveSafeLong(
        Object value
    ) {

        if (!(value instanceof Number)) {
            return null;
        }

        double number =
            ((Number) value)
                .doubleValue();

        if (
            !Double.isFinite(
                number
            ) ||
            number <=
                0 ||
            Math.rint(
                number
            ) !=
                number ||
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

    // ========================================================
    // END
    // ========================================================
}