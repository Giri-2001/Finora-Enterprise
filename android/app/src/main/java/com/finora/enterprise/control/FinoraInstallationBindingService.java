package com.finora.enterprise.control;

/* ===========================================================
   FINORA ENTERPRISE OS™

   ANDROID INSTALLATION BINDING SERVICE

   MODULE  : Native Control
   LAYER   : Android Native
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Read existing Control Store installationId
   - Reconcile it with Android Keystore binding identity
   - Preserve legacy installation identity
   - Generate fresh installation identity only when required
   - Fail closed on mismatch
   - Provide internal enrollment signing capability

   SECURITY:

   - Native only.
   - No PluginMethod.
   - No WebView.
   - No private-key getter.
   - No Control Center signing authority.
   - No Business Date.
=========================================================== */

import android.content.Context;

import java.util.UUID;

import org.json.JSONObject;

public final class FinoraInstallationBindingService {

    private static final Object LOCK =
        new Object();

    private final FinoraControlStore controlStore;

    public FinoraInstallationBindingService(
        Context context
    ) {

        if (context == null) {
            throw new IllegalArgumentException(
                "Android context is required."
            );
        }

        controlStore =
            new FinoraControlStore(
                context.getApplicationContext()
            );
    }

    // ========================================================
    // ENSURE
    // ========================================================

    public FinoraInstallationBindingCrypto.PublicBinding ensure()
        throws Exception {

        synchronized (LOCK) {

            String controlInstallationId =
                loadControlInstallationId();

            FinoraInstallationBindingCrypto.PublicBinding existing =
                FinoraInstallationBindingCrypto
                    .loadExisting();

            FinoraInstallationBindingReconciliation.Decision decision =
                FinoraInstallationBindingReconciliation
                    .reconcile(
                        controlInstallationId,
                        existing == null
                            ? null
                            : existing.installationId
                    );

            if (!decision.accepted) {
                throw new IllegalStateException(
                    decision.error
                );
            }

            if (
                FinoraInstallationBindingReconciliation
                    .ACTION_USE_EXISTING
                    .equals(
                        decision.action
                    )
            ) {

                if (existing == null) {
                    throw new IllegalStateException(
                        "FINORA Android installation reconciliation expected an existing native binding."
                    );
                }

                return existing;
            }

            if (
                !FinoraInstallationBindingReconciliation
                    .ACTION_CREATE
                    .equals(
                        decision.action
                    )
            ) {
                throw new IllegalStateException(
                    "FINORA Android installation reconciliation action is invalid."
                );
            }

            String installationId =
                decision.installationId;

            if (
                installationId == null
            ) {
                installationId =
                    "FINORA-INSTALLATION-" +
                    UUID.randomUUID();
            }

            FinoraInstallationBindingCrypto.PublicBinding generated =
                FinoraInstallationBindingCrypto
                    .generate(
                        installationId
                    );

            /*
             * Re-read Control Store after native key generation.
             * If another native startup path established an
             * incompatible installation identity, fail closed.
             */
            String authoritativeControlInstallationId =
                loadControlInstallationId();

            FinoraInstallationBindingReconciliation.Decision finalDecision =
                FinoraInstallationBindingReconciliation
                    .reconcile(
                        authoritativeControlInstallationId,
                        generated.installationId
                    );

            if (
                !finalDecision.accepted ||
                !FinoraInstallationBindingReconciliation
                    .ACTION_USE_EXISTING
                    .equals(
                        finalDecision.action
                    )
            ) {
                throw new IllegalStateException(
                    finalDecision.error != null
                        ? finalDecision.error
                        : "FINORA Android installation binding final consistency check failed."
                );
            }

            return generated;
        }
    }

    // ========================================================
    // READ PUBLIC BINDING
    // ========================================================

    public FinoraInstallationBindingCrypto.PublicBinding get()
        throws Exception {

        synchronized (LOCK) {

            FinoraInstallationBindingCrypto.PublicBinding binding =
                FinoraInstallationBindingCrypto
                    .loadExisting();

            if (binding == null) {
                return null;
            }

            assertConsistency(
                binding
            );

            return binding;
        }
    }

    // ========================================================
    // INTERNAL ENROLLMENT SIGNING
    // ========================================================

    public String signEnrollment(
        String canonicalPayload
    ) throws Exception {

        synchronized (LOCK) {

            FinoraInstallationBindingCrypto.PublicBinding binding =
                FinoraInstallationBindingCrypto
                    .loadExisting();

            if (binding == null) {
                throw new IllegalStateException(
                    "FINORA Android installation binding has not been initialized."
                );
            }

            assertConsistency(
                binding
            );

            return FinoraInstallationBindingCrypto
                .signCanonicalEnrollment(
                    canonicalPayload
                );
        }
    }

    // ========================================================
    // CONSISTENCY
    // ========================================================

    private void assertConsistency(
        FinoraInstallationBindingCrypto.PublicBinding binding
    ) throws Exception {

        String controlInstallationId =
            loadControlInstallationId();

        FinoraInstallationBindingReconciliation.Decision decision =
            FinoraInstallationBindingReconciliation
                .reconcile(
                    controlInstallationId,
                    binding.installationId
                );

        if (
            !decision.accepted ||
            !FinoraInstallationBindingReconciliation
                .ACTION_USE_EXISTING
                .equals(
                    decision.action
                )
        ) {
            throw new IllegalStateException(
                decision.error != null
                    ? decision.error
                    : "FINORA Android installation binding consistency check failed."
            );
        }
    }

    // ========================================================
    // CONTROL STORE INSTALLATION ID
    // ========================================================

    private String loadControlInstallationId()
        throws Exception {

        String raw =
            controlStore.read();

        if (raw == null) {
            return null;
        }

        JSONObject controlPackage =
            new JSONObject(
                raw
            );

        JSONObject installation =
            controlPackage.optJSONObject(
                "installation"
            );

        if (installation == null) {
            return null;
        }

        String installationId =
            installation.optString(
                "installationId",
                ""
            ).trim();

        if (installationId.isEmpty()) {
            throw new IllegalStateException(
                "FINORA Control Store installationId is invalid."
            );
        }

        return installationId;
    }
}