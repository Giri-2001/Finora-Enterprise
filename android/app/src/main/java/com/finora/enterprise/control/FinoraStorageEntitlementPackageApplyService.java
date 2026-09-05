package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// VERIFIED STORAGE ENTITLEMENT PACKAGE APPLY SERVICE
//
// RESPONSIBILITY:
//
// - Adapt encrypted FinoraControlStore to pure coordinator
// - Convert JSONObject package/state to canonical Java values
// - Resolve AndroidKeyStore-backed installation public binding
// - Route exactly one complete state commit to:
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

public final class FinoraStorageEntitlementPackageApplyService {

    private final FinoraStorageEntitlementApplyCoordinator coordinator;

    public FinoraStorageEntitlementPackageApplyService(
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
            new FinoraStorageEntitlementApplyCoordinator(
                new EncryptedControlStatePort(
                    controlStore
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
            FinoraStorageEntitlementApplyCoordinator.Result result
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
                "FINORA signed Storage Entitlement package is required.",
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
                    : "Unable to prepare FINORA signed Storage Entitlement package.",
                null,
                null
            );
        }
    }

    // ========================================================
    // ANDROID NATIVE BINDING PORT
    // ========================================================

    private static final class AndroidNativeBindingPort

        implements
            FinoraStorageEntitlementApplyCoordinator.NativeBindingPort {

        private final FinoraInstallationBindingService bindingService;

        private AndroidNativeBindingPort(
            FinoraInstallationBindingService bindingService
        ) {

            this.bindingService =
                bindingService;
        }

        @Override
        public FinoraStorageEntitlementApplyCoordinator.NativeBinding read()
            throws Exception {

            FinoraInstallationBindingCrypto.PublicBinding binding =
                bindingService.get();

            if (binding == null) {
                return null;
            }

            return new FinoraStorageEntitlementApplyCoordinator.NativeBinding(
                binding.installationId,
                binding.bindingKeyId,
                "SHA-256",
                binding.publicKeyFingerprint
            );
        }
    }

    // ========================================================
    // ENCRYPTED CONTROL STATE PORT
    // ========================================================

    private static final class EncryptedControlStatePort

        implements
            FinoraStorageEntitlementApplyCoordinator.ControlStatePort {

        private final FinoraControlStore controlStore;

        private EncryptedControlStatePort(
            FinoraControlStore controlStore
        ) {

            this.controlStore =
                controlStore;
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
             * FinoraControlStore supplies:
             *
             * - Android Keystore AES-256-GCM
             * - fresh IV
             * - authenticated AAD
             * - AtomicFile replacement
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