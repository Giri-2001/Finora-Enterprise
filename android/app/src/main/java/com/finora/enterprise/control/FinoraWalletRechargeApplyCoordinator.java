package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID WALLET RECHARGE APPLY COORDINATOR
//
// RESPONSIBILITY:
//
// - Serialize signed Recharge package application globally.
// - Read authoritative encrypted Control State.
// - Read AndroidKeyStore-backed installation binding.
// - Reuse generic signed Control Package verification.
// - Delegate Recharge semantics to Recharge State Engine.
// - Persist exactly one complete next Control State.
//
// SECURITY:
//
// - No renderer/WebView authority.
// - No signing authority.
// - No private-key access.
// - No Wallet mutation.
// - No Business Date.
// - No partial Control Store commit.
//
// ============================================================

import java.time.Instant;

import java.util.List;
import java.util.Map;

public final class FinoraWalletRechargeApplyCoordinator {

    private static final Object APPLY_LOCK =
        FinoraControlPackageApplyLock.LOCK;


    private final ControlStatePort controlStatePort;

    private final NativeBindingPort nativeBindingPort;


    public FinoraWalletRechargeApplyCoordinator(
        ControlStatePort controlStatePort,
        NativeBindingPort nativeBindingPort
    ) {

        if (
            controlStatePort == null ||
            nativeBindingPort == null
        ) {

            throw new IllegalArgumentException(
                "FINORA Wallet Recharge coordinator dependencies are required."
            );
        }

        this.controlStatePort =
            controlStatePort;

        this.nativeBindingPort =
            nativeBindingPort;
    }


    // ========================================================
    // PORTS
    // ========================================================

    public interface ControlStatePort {

        Map<String, Object> read()
            throws Exception;

        void write(
            Map<String, Object> state
        )
            throws Exception;
    }


    public interface NativeBindingPort {

        NativeBinding read()
            throws Exception;
    }


    // ========================================================
    // NATIVE BINDING
    // ========================================================

    public static final class NativeBinding {

        public final String installationId;

        public final String bindingKeyId;

        public final String fingerprintAlgorithm;

        public final String publicKeyFingerprint;


        public NativeBinding(
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint
        ) {

            this.installationId =
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;
        }
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
                "FINORA signed Wallet Recharge apply input is incomplete."
            );
        }

        try {

            // ------------------------------------------------
            // AUTHORITATIVE CONTROL STATE
            // ------------------------------------------------

            Map<String, Object> currentState =
                controlStatePort.read();

            if (currentState == null) {

                return Result.failure(
                    "FINORA installation identity is required before applying a Wallet Recharge authorization."
                );
            }


            // ------------------------------------------------
            // INSTALLED BRANCH
            // ------------------------------------------------

            Map<String, Object> installation =
                asMap(
                    currentState.get(
                        "installation"
                    )
                );

            if (installation == null) {

                return Result.failure(
                    "FINORA installation identity is required before applying a Wallet Recharge authorization."
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
            // CURRENT NATIVE BINDING
            // ------------------------------------------------

            NativeBinding nativeBinding =
                nativeBindingPort.read();

            if (
                !isValidNativeBinding(
                    nativeBinding
                )
            ) {

                return Result.failure(
                    "FINORA Android native installation binding is required before applying a Wallet Recharge authorization."
                );
            }

            if (
                !installationId.equals(
                    nativeBinding.installationId
                )
            ) {

                return Result.failure(
                    "FINORA native installation binding does not match the Control Store installation identity."
                );
            }


            // ------------------------------------------------
            // GENERIC SIGNED CONTROL PACKAGE VERIFICATION
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
                            installationId,
                            nativeBinding.bindingKeyId,
                            nativeBinding.fingerprintAlgorithm,
                            nativeBinding.publicKeyFingerprint
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
            // VERIFIED RECHARGE STATE TRANSITION
            // ------------------------------------------------

            FinoraWalletRechargeStateEngine.Result stateResult =
                FinoraWalletRechargeStateEngine
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


            // ------------------------------------------------
            // APPLIED PACKAGE IDENTITY
            // ------------------------------------------------

            String packageId =
                requiredString(
                    signedPackage.get(
                        "packageId"
                    )
                );

            Long sequence =
                positiveSafeInteger(
                    signedPackage.get(
                        "sequence"
                    )
                );

            if (
                packageId == null ||
                sequence == null
            ) {

                return Result.failure(
                    "FINORA applied Wallet Recharge package identity is invalid."
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
                    : "Unable to apply FINORA signed Wallet Recharge authorization."
            );
        }
    }


    // ========================================================
    // HELPERS
    // ========================================================

    private static boolean isValidNativeBinding(
        NativeBinding value
    ) {

        if (
            value == null ||
            requiredString(
                value.installationId
            ) == null ||
            requiredString(
                value.bindingKeyId
            ) == null ||
            !"SHA-256".equals(
                value.fingerprintAlgorithm
            ) ||
            value.publicKeyFingerprint == null ||
            !value.publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            )
        ) {

            return false;
        }

        String expectedBindingKeyId =
            "FINORA-BINDING-" +
            value.publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        return expectedBindingKeyId.equals(
            value.bindingKeyId
        );
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


    private static Long positiveSafeInteger(
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
                0.0d ||
            number >
                9007199254740991.0d ||
            Math.rint(
                number
            ) !=
                number
        ) {

            return null;
        }

        return Long.valueOf(
            (long) number
        );
    }


    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map<?, ?>)) {
            return null;
        }

        Map<?, ?> raw =
            (Map<?, ?>) value;

        java.util.LinkedHashMap<String, Object> output =
            new java.util.LinkedHashMap<>();

        for (
            Map.Entry<?, ?> entry :
            raw.entrySet()
        ) {

            if (!(entry.getKey() instanceof String)) {
                return null;
            }

            output.put(
                (String) entry.getKey(),
                entry.getValue()
            );
        }

        return output;
    }
}
