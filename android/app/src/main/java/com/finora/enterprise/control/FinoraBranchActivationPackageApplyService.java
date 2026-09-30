package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// VERIFIED BRANCH ACTIVATION PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Adapt encrypted FinoraControlStore to pure apply coordinator
// - Convert JSONObject packages/state to canonical Java values
// - Route the coordinator's one state commit to:
//
//   Android Keystore AES-256-GCM
//   +
//   AtomicFile persistence
//
// SECURITY:
//
// - Native Android only.
// - PUBLIC verification only.
// - No private key.
// - No signing.
// - No Capacitor PluginMethod.
// - No renderer/WebView write authority.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import org.json.JSONObject;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class FinoraBranchActivationPackageApplyService {

    private final FinoraBranchActivationApplyCoordinator coordinator;
    public FinoraBranchActivationPackageApplyService(
        FinoraControlStore controlStore,
        FinoraInstallationBindingService bindingService
    ) {

        if (controlStore == null) {

            throw new IllegalArgumentException(
                "FINORA Control Store is required."
            );
        }

        if (bindingService == null) {

            throw new IllegalArgumentException(
                "FINORA installation binding service is required."
            );
        }

        this.coordinator =
            new FinoraBranchActivationApplyCoordinator(
                new EncryptedControlStatePort(
                    controlStore,
                    bindingService
                ),
                new AndroidNativeBindingPort(
                    bindingService
                )
            );
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class ApplyResult {

        public final boolean success;

        public final String error;

        public final String packageId;

        public final Long sequence;

        private ApplyResult(
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

        private static ApplyResult fromCoordinator(
            FinoraBranchActivationApplyCoordinator.Result result
        ) {

            return new ApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }
    }

    // ========================================================
    // APPLY
    // ========================================================

    public ApplyResult apply(
        JSONObject signedPackage,
        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys,
        Instant now
    ) {

        if (signedPackage == null) {

            return new ApplyResult(
                false,
                "FINORA signed Branch Activation package is required.",
                null,
                null
            );
        }

        try {

            Map<String, Object> packageMap =
                FinoraJsonBridge
                    .toMap(
                        signedPackage
                    );

            return ApplyResult
                .fromCoordinator(
                    coordinator.apply(
                        packageMap,
                        trustedKeys,
                        now
                    )
                );

        } catch (Exception error) {

            return new ApplyResult(
                false,
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to prepare FINORA signed Branch Activation package.",
                null,
                null
            );
        }
    }

    // ========================================================
    // PRODUCTION ENCRYPTED CONTROL STATE PORT
    // ========================================================

    private static final class AndroidNativeBindingPort

        implements
            FinoraBranchActivationApplyCoordinator.NativeBindingPort {

        private final FinoraInstallationBindingService bindingService;

        private AndroidNativeBindingPort(
            FinoraInstallationBindingService bindingService
        ) {

            this.bindingService =
                bindingService;
        }

        @Override
        public FinoraBranchActivationApplyCoordinator.NativeBinding read()
            throws Exception {

            FinoraInstallationBindingCrypto.PublicBinding binding =
                bindingService.get();

            if (binding == null) {
                return null;
            }

            return new FinoraBranchActivationApplyCoordinator.NativeBinding(
                binding.installationId,
                binding.bindingKeyId,
                "SHA-256",
                binding.publicKeyFingerprint
            );
        }
    }

    private static final class EncryptedControlStatePort

        implements
            FinoraBranchActivationApplyCoordinator.ControlStatePort {

        private final FinoraControlStore controlStore;

        private final FinoraInstallationBindingService
            bindingService;

        private EncryptedControlStatePort(
            FinoraControlStore controlStore,
            FinoraInstallationBindingService bindingService
        ) {

            this.controlStore =
                controlStore;

            this.bindingService =
                bindingService;
        }

        @Override
        public Map<String, Object> read()
            throws Exception {

            String raw =
                controlStore.read();

            if (raw == null) {
                return null;
            }

            JSONObject controlState =
                new JSONObject(
                    raw
                );
            Object rawVersion =
                controlState.opt(
                    "version"
                );

            boolean versionMissing =
                rawVersion == null ||
                rawVersion == JSONObject.NULL ||
                (
                    rawVersion instanceof String &&
                    ((String) rawVersion)
                        .trim()
                        .isEmpty()
                );

            boolean canonicalVersion =
                rawVersion instanceof String &&
                FinoraControlPlugin.CONTROL_VERSION.equals(
                    ((String) rawVersion).trim()
                );

            boolean legacyNumericVersion =
                rawVersion instanceof Number &&
                Double.compare(
                    ((Number) rawVersion).doubleValue(),
                    1.0d
                ) == 0;

            boolean legacyStringVersion =
                rawVersion instanceof String &&
                "1".equals(
                    ((String) rawVersion).trim()
                );

            if (!canonicalVersion) {

                if (
                    !versionMissing &&
                    !legacyNumericVersion &&
                    !legacyStringVersion
                ) {
                    throw new IllegalStateException(
                        "Unsupported FINORA Android Control Store package version [SERVICE_VERSION]."
                    );
                }

                JSONObject installation =
                    controlState.optJSONObject(
                        "installation"
                    );

                FinoraInstallationBindingCrypto.PublicBinding
                    nativeBinding =
                        bindingService.get();

                if (
                    installation == null ||
                    nativeBinding == null
                ) {
                    throw new IllegalStateException(
                        "Unsupported FINORA Android Control Store package version [SERVICE_BINDING_MISSING]."
                    );
                }

                String installationId =
                    installation.optString(
                        "installationId",
                        ""
                    ).trim();

                String bindingKeyId =
                    installation.optString(
                        "bindingKeyId",
                        ""
                    ).trim();

                String fingerprint =
                    installation.optString(
                        "publicKeyFingerprint",
                        ""
                    ).trim();

                String fingerprintAlgorithm =
                    installation.optString(
                        "fingerprintAlgorithm",
                        ""
                    ).trim();

                /*
                 * Legacy Enrollment schema repair.
                 *
                 * Older Android Enrollment final-commit persisted
                 * installationId and branch identity, but omitted
                 * the native binding metadata.
                 *
                 * Repair is allowed only when the persisted
                 * installationId already matches the exact current
                 * Android Keystore-backed native installation.
                 *
                 * Existing non-empty binding values are never
                 * overwritten.
                 */
                if (
                    !installationId.isEmpty() &&
                    installationId.equals(
                        nativeBinding.installationId
                    )
                ) {
                    boolean repairedBinding =
                        false;

                    if (bindingKeyId.isEmpty()) {
                        installation.put(
                            "bindingKeyId",
                            nativeBinding.bindingKeyId
                        );

                        bindingKeyId =
                            nativeBinding.bindingKeyId;

                        repairedBinding =
                            true;
                    }

                    if (fingerprintAlgorithm.isEmpty()) {
                        installation.put(
                            "fingerprintAlgorithm",
                            nativeBinding.fingerprintAlgorithm
                        );

                        fingerprintAlgorithm =
                            nativeBinding.fingerprintAlgorithm;

                        repairedBinding =
                            true;
                    }

                    if (fingerprint.isEmpty()) {
                        installation.put(
                            "publicKeyFingerprint",
                            nativeBinding.publicKeyFingerprint
                        );

                        fingerprint =
                            nativeBinding.publicKeyFingerprint;

                        repairedBinding =
                            true;
                    }

                    Object rawInstallationSchemaVersion =
                        installation.opt(
                            "schemaVersion"
                        );

                    if (
                        rawInstallationSchemaVersion == null ||
                        rawInstallationSchemaVersion == JSONObject.NULL
                    ) {
                        installation.put(
                            "schemaVersion",
                            1L
                        );

                        repairedBinding =
                            true;

                    } else if (
                        !(rawInstallationSchemaVersion instanceof Number) ||
                        Double.compare(
                            ((Number) rawInstallationSchemaVersion).doubleValue(),
                            1.0d
                        ) != 0
                    ) {
                        throw new IllegalStateException(
                            "FINORA Android Control Store installation schema version is unsupported."
                        );
                    }

                    if (repairedBinding) {
                        controlStore.write(
                            controlState.toString()
                        );
                    }
                }

                if (
                    installationId.isEmpty()
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Control Store installation binding mismatch [INSTALLATION_ID_MISSING]."
                    );
                }

                if (
                    bindingKeyId.isEmpty()
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Control Store installation binding mismatch [BINDING_KEY_ID_MISSING]."
                    );
                }

                if (
                    fingerprint.isEmpty()
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Control Store installation binding mismatch [FINGERPRINT_MISSING]."
                    );
                }

                if (
                    !installationId.equals(
                        nativeBinding.installationId
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Control Store installation binding mismatch [INSTALLATION_ID]."
                    );
                }

                if (
                    !bindingKeyId.equals(
                        nativeBinding.bindingKeyId
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Control Store installation binding mismatch [BINDING_KEY_ID]."
                    );
                }

                if (
                    !fingerprint.equalsIgnoreCase(
                        nativeBinding.publicKeyFingerprint
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Control Store installation binding mismatch [FINGERPRINT]."
                    );
                }

                /*
                 * Canonical legacy migration:
                 *
                 * missing version
                 * OR legacy numeric 1 / 1.0
                 *
                 * becomes exact string "1.0".
                 *
                 * Any other existing version remains rejected.
                 */
                controlState.put(
                    "version",
                    FinoraControlPlugin.CONTROL_VERSION
                );

                controlStore.write(
                    controlState.toString()
                );
            }


            return FinoraJsonBridge
                .toMap(
                    controlState
                );
        }

        @Override
        public void write(
            Map<String, Object> nextState
        ) throws Exception {

            JSONObject controlState =
                new JSONObject(
                    nextState
                );

            /*
             * Exactly one production write.
             *
             * FinoraControlStore provides:
             *
             * - Android Keystore AES-256-GCM
             * - fresh IV per encryption
             * - authenticated AAD
             * - AtomicFile startWrite / finishWrite / failWrite
             */
            controlStore.write(
                controlState.toString()
            );
        }
    }

    // ========================================================
    // END
    // ========================================================
}