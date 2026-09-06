package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID PRICING POLICY APPLY COORDINATOR
//
// RESPONSIBILITY:
//
// - Serialize signed Pricing Policy application globally.
// - Read the authoritative encrypted Control State.
// - Read the AndroidKeyStore-backed native installation binding.
// - Verify the generic signed Control Package.
// - Delegate Pricing semantics to FinoraPricingPolicyStateEngine.
// - Persist exactly one complete next Control State on success.
//
// SECURITY:
//
// - No renderer/WebView authority.
// - No signing authority.
// - No private-key access.
// - No Business Date.
// - No Pricing semantic duplication.
// - No partial Control Store commit.
//
// ============================================================

import java.time.Instant;

import java.util.List;
import java.util.Map;


// ============================================================
// COORDINATOR
// ============================================================

public final class FinoraPricingPolicyApplyCoordinator {

    private static final Object APPLY_LOCK =
        FinoraControlPackageApplyLock.LOCK;


    private final ControlStatePort controlStatePort;

    private final NativeBindingPort nativeBindingPort;


    public FinoraPricingPolicyApplyCoordinator(
        ControlStatePort controlStatePort,
        NativeBindingPort nativeBindingPort
    ) {

        if (
            controlStatePort == null ||
            nativeBindingPort == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Pricing Policy coordinator dependencies are required."
            );
        }

        this.controlStatePort =
            controlStatePort;

        this.nativeBindingPort =
            nativeBindingPort;
    }


    // ========================================================
    // CONTROL STATE PORT
    // ========================================================

    public interface ControlStatePort {

        Map<String, Object> read()
            throws Exception;

        void write(
            Map<String, Object> state
        )
            throws Exception;
    }


    // ========================================================
    // NATIVE BINDING PORT
    // ========================================================

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


    // ========================================================
    // APPLY LOCKED
    // ========================================================

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
                "FINORA signed Pricing Policy apply input is incomplete."
            );
        }

        try {

            // ------------------------------------------------
            // AUTHORITATIVE CURRENT CONTROL STATE
            // ------------------------------------------------

            Map<String, Object> currentState =
                controlStatePort.read();

            if (currentState == null) {

                return Result.failure(
                    "FINORA installation identity is required before applying a Pricing Policy."
                );
            }


            // ------------------------------------------------
            // INSTALLED BRANCH IDENTITY
            // ------------------------------------------------

            Map<String, Object> installation =
                asMap(
                    currentState.get(
                        "installation"
                    )
                );

            if (installation == null) {

                return Result.failure(
                    "FINORA installation identity is required before applying a Pricing Policy."
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
            // CURRENT NATIVE INSTALLATION BINDING
            // ------------------------------------------------

            NativeBinding nativeBinding =
                nativeBindingPort.read();

            if (
                !isValidNativeBinding(
                    nativeBinding
                )
            ) {

                return Result.failure(
                    "FINORA Android native installation binding is required before applying a Pricing Policy."
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
            // VERIFIED PRICING POLICY STATE TRANSITION
            // ------------------------------------------------

            FinoraPricingPolicyStateEngine.Result stateResult =
                FinoraPricingPolicyStateEngine
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
                    "Applied FINORA Pricing Policy package identity is invalid."
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
                    : "Unable to apply FINORA signed Pricing Policy package."
            );
        }
    }


    // ========================================================
    // NATIVE BINDING VALIDATION
    // ========================================================

    private static boolean isValidNativeBinding(
        NativeBinding binding
    ) {

        if (
            binding == null ||
            requiredString(
                binding.installationId
            ) == null ||
            requiredString(
                binding.bindingKeyId
            ) == null ||
            !"SHA-256".equals(
                binding.fingerprintAlgorithm
            ) ||
            binding.publicKeyFingerprint == null ||
            !binding.publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            )
        ) {
            return false;
        }

        String expectedBindingKeyId =
            "FINORA-BINDING-" +
            binding.publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        return expectedBindingKeyId.equals(
            binding.bindingKeyId
        );
    }


    // ========================================================
    // MAP HELPER
    // ========================================================

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map<?, ?>)) {
            return null;
        }

        Map<?, ?> raw =
            (Map<?, ?>) value;

        for (
            Object key :
                raw.keySet()
        ) {

            if (!(key instanceof String)) {
                return null;
            }
        }

        return (Map<String, Object>) value;
    }


    // ========================================================
    // STRING HELPER
    // ========================================================

    private static String requiredString(
        Object value
    ) {

        if (!(value instanceof String)) {
            return null;
        }

        String text =
            (String) value;

        String trimmed =
            text.trim();

        if (
            trimmed.isEmpty() ||
            !text.equals(
                trimmed
            )
        ) {
            return null;
        }

        return text;
    }


    // ========================================================
    // SEQUENCE HELPER
    // ========================================================

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
            Math.rint(
                number
            ) !=
                number ||
            number <=
                0.0d ||
            number >
                9007199254740991.0d
        ) {
            return null;
        }

        long result =
            (long) number;

        if (
            (double) result !=
                number
        ) {
            return null;
        }

        return Long.valueOf(
            result
        );
    }
}