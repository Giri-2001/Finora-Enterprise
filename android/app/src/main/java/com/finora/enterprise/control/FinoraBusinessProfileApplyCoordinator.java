package com.finora.enterprise.control;

// ============================================================
// FINORA BUSINESS PROFILE APPLY COORDINATOR
//
// RESPONSIBILITY:
//
// - Share the global signed-package apply lock.
// - Read authoritative encrypted control state.
// - Read AndroidKeyStore-backed installation public binding.
// - Verify Control Center ECDSA package + exact target.
// - Route verified package into Business Profile State Engine.
// - Commit exactly one complete next Control Store state.
//
// SECURITY:
//
// - Public verification only.
// - No private key.
// - No signing.
// - No Android Context.
// - No PluginMethod.
// - No renderer/WebView write authority.
// ============================================================

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class FinoraBusinessProfileApplyCoordinator {

    private static final Object APPLY_LOCK =
        FinoraControlPackageApplyLock.LOCK;

    private final ControlStatePort controlStatePort;

    private final NativeBindingPort nativeBindingPort;


    public FinoraBusinessProfileApplyCoordinator(
        ControlStatePort controlStatePort,
        NativeBindingPort nativeBindingPort
    ) {

        if (controlStatePort == null) {
            throw new IllegalArgumentException(
                "FINORA Control State port is required."
            );
        }

        if (nativeBindingPort == null) {
            throw new IllegalArgumentException(
                "FINORA native installation binding port is required."
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
            Map<String, Object> nextState
        )
            throws Exception;
    }


    public interface NativeBindingPort {

        NativeBinding read()
            throws Exception;
    }


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
                "FINORA signed Business Profile apply input is incomplete."
            );
        }

        try {

            Map<String, Object> currentState =
                controlStatePort.read();

            if (currentState == null) {

                return Result.failure(
                    "FINORA installation identity is required before applying a Business Profile."
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
                    "FINORA installation identity is required before applying a Business Profile."
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


            NativeBinding nativeBinding =
                nativeBindingPort.read();

            if (
                !isValidNativeBinding(
                    nativeBinding
                )
            ) {

                return Result.failure(
                    "FINORA Android native installation binding is required before applying a Business Profile."
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


            FinoraBusinessProfileStateEngine.Result stateResult =
                FinoraBusinessProfileStateEngine
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
                    "Applied FINORA Business Profile package identity is invalid."
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
                    : "Unable to apply FINORA signed Business Profile package."
            );
        }
    }


    // ========================================================
    // HELPERS
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
}