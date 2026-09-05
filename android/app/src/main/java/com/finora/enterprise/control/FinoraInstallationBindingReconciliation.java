package com.finora.enterprise.control;

/* ===========================================================
   FINORA ENTERPRISE OS™

   ANDROID INSTALLATION BINDING RECONCILIATION

   MODULE  : Native Control
   LAYER   : Pure Domain Policy
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Reconcile Control Store installation identity
     with Android Keystore installation-binding identity
   - Preserve legacy installation IDs
   - Permit fresh native installation creation
   - Fail closed on mismatching identities

   SECURITY:

   - Pure Java.
   - No Android APIs.
   - No private key.
   - No WebView.
   - No storage mutation.
   - No Business Date.
=========================================================== */

public final class FinoraInstallationBindingReconciliation {

    public static final String ACTION_USE_EXISTING =
        "USE_EXISTING_BINDING";

    public static final String ACTION_CREATE =
        "CREATE_BINDING";

    private FinoraInstallationBindingReconciliation() {
    }

    // ========================================================
    // DECISION
    // ========================================================

    public static final class Decision {

        public final boolean accepted;

        public final String action;

        public final String installationId;

        public final String error;

        private Decision(
            boolean accepted,
            String action,
            String installationId,
            String error
        ) {
            this.accepted =
                accepted;

            this.action =
                action;

            this.installationId =
                installationId;

            this.error =
                error;
        }

        public static Decision accepted(
            String action,
            String installationId
        ) {
            return new Decision(
                true,
                action,
                installationId,
                null
            );
        }

        public static Decision rejected(
            String error
        ) {
            return new Decision(
                false,
                null,
                null,
                error
            );
        }
    }

    // ========================================================
    // RECONCILE
    // ========================================================

    public static Decision reconcile(
        String controlInstallationId,
        String bindingInstallationId
    ) {

        String controlId =
            normalize(
                controlInstallationId
            );

        String bindingId =
            normalize(
                bindingInstallationId
            );

        // ----------------------------------------------------
        // NATIVE KEY ALREADY EXISTS
        // ----------------------------------------------------

        if (bindingId != null) {

            if (
                controlId != null &&
                !controlId.equals(
                    bindingId
                )
            ) {
                return Decision.rejected(
                    "FINORA Android native installation binding does not match the existing Control Store installation identity."
                );
            }

            return Decision.accepted(
                ACTION_USE_EXISTING,
                bindingId
            );
        }

        // ----------------------------------------------------
        // NO NATIVE KEY YET
        //
        // Preserve a legacy Control Store installationId.
        // Null means a fresh installation may generate one.
        // ----------------------------------------------------

        return Decision.accepted(
            ACTION_CREATE,
            controlId
        );
    }

    // ========================================================
    // NORMALIZE
    // ========================================================

    private static String normalize(
        String value
    ) {

        if (value == null) {
            return null;
        }

        String normalized =
            value.trim();

        return normalized.isEmpty()
            ? null
            : normalized;
    }
}