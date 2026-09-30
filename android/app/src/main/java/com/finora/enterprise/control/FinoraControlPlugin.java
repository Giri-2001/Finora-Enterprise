package com.finora.enterprise.control;

import android.util.Log;

// ============================================================
// FINORA ENTERPRISE OSÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
//
// ANDROID CONTROL PLUGIN
//
// RESPONSIBILITY:
//
// - Expose read-only FINORA native control-state operations
// - Read installation identity from encrypted native storage
// - Read branch activation state
// - Check per-login LOCAL / USB storage entitlement
// - Keep encrypted storage implementation outside the WebView
//
// SECURITY:
//
// Renderer MAY:
// - Read installation identity
// - Read branch activation state
// - Check LOCAL / USB entitlement status
//
// Renderer MUST NOT:
// - Create branch activation
// - Modify branch activation
// - Grant LOCAL entitlement
// - Grant USB entitlement
// - Change entitlement status
//
// IMPORTANT:
//
// - No customer data.
// - No loan data.
// - No collection data.
// - No Gold custody data.
// - No pricing amount.
// - No wallet balance.
// - No plaintext storage fallback.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

// ============================================================
// PLUGIN
// ============================================================

@CapacitorPlugin(
    name = "FinoraControl"
)
public final class FinoraControlPlugin
    extends Plugin {



    // ========================================================
    // CONSTANTS
    // ========================================================

    static final String CONTROL_VERSION =
        "1.0";

    // ========================================================
    // STATE
    // ========================================================

    private FinoraControlStore controlStore;

    private FinoraInstallationBindingService installationBindingService;
    private FinoraBranchPasswordFirstLoginAuthority
        passwordFirstLoginAuthority;

    private FinoraPortableFreshDeviceLoginRecoveryCoordinator
        freshDeviceLoginRecoveryCoordinator;

    private FinoraBranchAccessRuntimeAuthority
        branchAccessRuntimeAuthority;

    private FinoraBranchLoginSessionAuthority
        loginSessionAuthority;

    private FinoraPortableBranchAuthStore
        walletBranchCertificationPortableAuthStore;

    private FinoraWalletBranchCertificationDeviceVault
        walletBranchCertificationDeviceVault;

    private FinoraPortableBranchAuthEnrollmentAuthority
        portableBranchAuthEnrollmentAuthority;

    // ========================================================
    // LOAD
    // ========================================================

    @Override
    public void load() {
        this.controlStore =
            new FinoraControlStore(
                getContext()
            );

        this.installationBindingService =
            new FinoraInstallationBindingService(
                getContext()
            );


        FinoraPortableBranchAuthStore portableBranchAuthStore =
            new FinoraPortableBranchAuthStore(
                getContext()
            );

        this.walletBranchCertificationPortableAuthStore =
            portableBranchAuthStore;

        this.walletBranchCertificationDeviceVault =
            new FinoraWalletBranchCertificationDeviceVault(
                getContext()
            );

        this.portableBranchAuthEnrollmentAuthority =
            new FinoraPortableBranchAuthEnrollmentAuthority(
                this.controlStore,
                portableBranchAuthStore,
                this.walletBranchCertificationDeviceVault
            );

        FinoraBranchDeviceTrustStore branchDeviceTrustStore =
            new FinoraBranchDeviceTrustStore(
                getContext()
            );

        this.passwordFirstLoginAuthority =
            FinoraBranchPasswordFirstLoginProductionFactory.create(
                getContext(),
                portableBranchAuthStore,
                this.installationBindingService,
                branchDeviceTrustStore
            );

        this.freshDeviceLoginRecoveryCoordinator =
            FinoraPortableFreshDeviceRecoveryProductionFactory.create(
                getContext(),
                portableBranchAuthStore,
                this.installationBindingService,
                this.controlStore
            );
        FinoraClockHighWaterStore branchAccessClockStore =
            new FinoraClockHighWaterStore(
                getContext()
            );

        FinoraClockHighWaterAuthorityService branchAccessClockAuthority =
            new FinoraClockHighWaterAuthorityService(
                branchAccessClockStore,
                this.installationBindingService
            );

        this.branchAccessRuntimeAuthority =
            FinoraBranchAccessRuntimeProductionAdapters.create(
                new FinoraBranchAccessRuntimeProductionAdapters
                    .ValidatedControlStatePort() {
                        @Override
                        public String readValidated()
                            throws Exception {
                            JSONObject validated =
                                readValidatedControlPackage();

                            return validated == null
                                ? null
                                : validated.toString();
                        }
                    },
                branchAccessClockAuthority
            );

        FinoraBranchCredentialStore branchCredentialStore =
            new FinoraBranchCredentialStore(
                getContext()
            );

        FinoraBranchAccessRuntimeProductionAdapters.ValidatedControlStatePort
            sessionControlState =
                new FinoraBranchAccessRuntimeProductionAdapters
                    .ValidatedControlStatePort() {
                        @Override
                        public String readValidated()
                            throws Exception {
                            JSONObject validated =
                                readValidatedControlPackage();

                            return validated == null
                                ? null
                                : validated.toString();
                        }
                    };

        FinoraBranchDeviceTrustAuthority sessionDeviceTrust =
            FinoraBranchDeviceTrustProductionAdapters.create(
                portableBranchAuthStore,
                this.installationBindingService,
                branchDeviceTrustStore
            );

        FinoraBranchLoginSessionProductionAuthorizationAdapter
            sessionAuthorization =
                new FinoraBranchLoginSessionProductionAuthorizationAdapter(
                    branchCredentialStore,
                    this.branchAccessRuntimeAuthority,
                    sessionControlState,
                    new FinoraBranchLoginSessionProductionAuthorizationAdapter.DeviceTrustCheckPort() {
                        @Override
                        public FinoraBranchDeviceTrustAuthority.Result check(
                            FinoraBranchDeviceTrustAuthority.Principal principal
                        ) {
                            return sessionDeviceTrust.check(principal);
                        }
                    },
                    false
                );

        this.loginSessionAuthority =
            new FinoraBranchLoginSessionAuthority(
                sessionAuthorization
            );

        super.load();
    }

    // ========================================================
    // PASSWORD-FIRST BRANCH LOGIN
    // ========================================================

    /**
     * Android native Password-first branch login.
     *
     * Renderer supplies Username + Password and, only after
     * SECURITY_CODE_REQUIRED, the Security Code.
     *
     * Expected authentication failures resolve as structured
     * results. This method does not create a login session.
     */
    // ========================================================
    // SECURE RECIPIENT CREDENTIAL ENROLLMENT
    //
    // Renderer provides only:
    // - username
    // - password
    // - securityCode
    //
    // Native authority derives authenticated user / owner /
    // business / branch / storage scope exclusively from the
    // signed pending Branch Access enrollment authorization.
    // ========================================================

    @PluginMethod
    public void diagnoseCredentialEnrollment(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        JSObject response =
            new JSObject();

        try {

            String raw =
                controlStore == null
                    ? null
                    : controlStore.read();

            if (raw == null) {
                response.put(
                    "success",
                    false
                );

                response.put(
                    "error",
                    "FINORA Control Store is unavailable."
                );

                call.resolve(
                    response
                );

                return;
            }

            JSONObject root =
                new JSONObject(
                    raw
                );

            JSONArray authorizations =
                root.optJSONArray(
                    "branchCredentialEnrollmentAuthorizations"
                );

            JSONArray credentials =
                root.optJSONArray(
                    "branchCredentials"
                );

            JSONArray transactions =
                root.optJSONArray(
                    "portableBranchAuthEnrollmentTransactions"
                );

            JSObject data =
                new JSObject();

            data.put(
                "authorizationCount",
                authorizations == null
                    ? 0
                    : authorizations.length()
            );

            data.put(
                "credentialCount",
                credentials == null
                    ? 0
                    : credentials.length()
            );

            data.put(
                "transactionCount",
                transactions == null
                    ? 0
                    : transactions.length()
            );

            com.getcapacitor.JSArray authorizationViews =
                new com.getcapacitor.JSArray();

            if (authorizations != null) {

                for (
                    int i = 0;
                    i < authorizations.length();
                    i++
                ) {

                    JSONObject value =
                        authorizations.optJSONObject(
                            i
                        );

                    if (value == null) {
                        continue;
                    }

                    JSObject view =
                        new JSObject();

                    view.put(
                        "authorizationId",
                        value.optString(
                            "authorizationId",
                            ""
                        )
                    );

                    view.put(
                        "username",
                        value.optString(
                            "username",
                            ""
                        )
                    );

                    view.put(
                        "userId",
                        value.optString(
                            "userId",
                            ""
                        )
                    );

                    view.put(
                        "branchId",
                        value.optString(
                            "branchId",
                            ""
                        )
                    );

                    view.put(
                        "storageMode",
                        value.optString(
                            "storageMode",
                            ""
                        )
                    );

                    authorizationViews.put(
                        view
                    );
                }
            }

            data.put(
                "authorizations",
                authorizationViews
            );

            JSONArray evidence =
                root.optJSONArray(
                    "branchCredentialAuthorizationVerificationEvidence"
                );

            JSONArray applied =
                root.optJSONArray(
                    "appliedControlPackages"
                );

            JSONArray grants =
                root.optJSONArray(
                    "branchAccessGrants"
                );

            data.put(
                "verificationEvidenceCount",
                evidence == null
                    ? 0
                    : evidence.length()
            );

            data.put(
                "branchAccessGrantCount",
                grants == null
                    ? 0
                    : grants.length()
            );

            com.getcapacitor.JSArray rootKeys =
                new com.getcapacitor.JSArray();

            java.util.Iterator<String> keys =
                root.keys();

            while (keys.hasNext()) {
                rootKeys.put(
                    keys.next()
                );
            }

            data.put(
                "rootKeys",
                rootKeys
            );

            data.put(
                "hasInstallation",
                root.has(
                    "installation"
                )
            );

            data.put(
                "hasBranchActivation",
                root.has(
                    "branchActivation"
                )
            );

            data.put(
                "hasBranchActivations",
                root.has(
                    "branchActivations"
                )
            );

            data.put(
                "hasStorageEntitlements",
                root.has(
                    "storageEntitlements"
                )
            );

            JSONArray controlSequences =
                root.optJSONArray(
                    "controlSequences"
                );

            JSONArray portableBranchAccessSequences =
                root.optJSONArray(
                    "portableBranchAccessSequences"
                );

            JSONArray activations =
                root.optJSONArray(
                    "activations"
                );

            data.put(
                "controlSequenceCount",
                controlSequences == null
                    ? 0
                    : controlSequences.length()
            );

            data.put(
                "portableBranchAccessSequenceCount",
                portableBranchAccessSequences == null
                    ? 0
                    : portableBranchAccessSequences.length()
            );

            data.put(
                "activationCount",
                activations == null
                    ? 0
                    : activations.length()
            );

            com.getcapacitor.JSArray branchAccessSequences =
                new com.getcapacitor.JSArray();

            if (controlSequences != null) {
                for (
                    int i = 0;
                    i < controlSequences.length();
                    i++
                ) {
                    JSONObject value =
                        controlSequences.optJSONObject(i);

                    if (value == null) {
                        continue;
                    }

                    if (
                        "BRANCH_ACCESS".equals(
                            value.optString(
                                "purpose",
                                ""
                            )
                        )
                    ) {
                        branchAccessSequences.put(
                            value
                        );
                    }
                }
            }

            data.put(
                "branchAccessSequences",
                branchAccessSequences
            );

            com.getcapacitor.JSArray relevantPackages =
                new com.getcapacitor.JSArray();

            if (applied != null) {

                for (
                    int i = 0;
                    i < applied.length();
                    i++
                ) {

                    JSONObject value =
                        applied.optJSONObject(i);

                    if (value == null) {
                        continue;
                    }

                    String purpose =
                        value.optString(
                            "purpose",
                            ""
                        );

                    String action =
                        value.optString(
                            "action",
                            ""
                        );

                    if (
                        "BRANCH_ACCESS".equals(purpose) ||
                        "AUTHORIZE_CREDENTIAL".equals(action)
                    ) {

                        JSObject view =
                            new JSObject();

                        view.put(
                            "packageId",
                            value.optString(
                                "packageId",
                                ""
                            )
                        );

                        view.put(
                            "purpose",
                            purpose
                        );

                        view.put(
                            "action",
                            action
                        );

                        view.put(
                            "sequence",
                            value.optInt(
                                "sequence",
                                0
                            )
                        );

                        relevantPackages.put(
                            view
                        );
                    }
                }
            }

            data.put(
                "relevantAppliedPackages",
                relevantPackages
            );

            response.put(
                "success",
                true
            );

            response.put(
                "data",
                data
            );

            call.resolve(
                response
            );

        }
        catch (Exception error) {

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                error.getMessage() == null
                    ? "Unable to inspect credential enrollment state."
                    : error.getMessage()
            );

            call.resolve(
                response
            );
        }
    }


    // ========================================================
    // TEMPORARY READ-ONLY BRANCH CREDENTIAL EVIDENCE DIAGNOSTIC
    // ========================================================


    // ========================================================
    // TEMPORARY GUARDED BRANCH2 PORTABILITY PROOF REPAIR
    // ========================================================

    @PluginMethod
    public void enrollCredential(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        if (
            portableBranchAuthEnrollmentAuthority == null
        ) {

            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                "FINORA secure credential enrollment authority is unavailable."
            );

            call.resolve(
                response
            );

            return;
        }

        try {

            String username =
                call.getString(
                    "username"
                );

            String password =
                call.getString(
                    "password"
                );

            String securityCode =
                call.getString(
                    "securityCode"
                );


            FinoraPortableBranchAuthEnrollmentAuthority.Result
                result =
                    portableBranchAuthEnrollmentAuthority
                        .enroll(
                            username,
                            password,
                            securityCode
                        );


            JSObject response =
                new JSObject();

            response.put(
                "success",
                result.success
            );


            if (!result.success) {

                response.put(
                    "error",
                    result.error == null
                        ? "Unable to create the FINORA secure credential."
                        : result.error
                );

                call.resolve(
                    response
                );

                return;
            }


            JSObject data =
                new JSObject();

            data.put(
                "credentialId",
                result.credentialId
            );

            data.put(
                "userId",
                result.userId
            );

            data.put(
                "username",
                result.username
            );

            data.put(
                "storageMode",
                result.storageMode
            );


            response.put(
                "data",
                data
            );

            call.resolve(
                response
            );

        }
        catch (Exception error) {

            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            String message =
                error.getMessage();

            response.put(
                "error",
                message == null ||
                    message.trim().isEmpty()
                    ? "Unable to create the FINORA secure credential."
                    : message
            );

            call.resolve(
                response
            );
        }
    }

    @PluginMethod
    public void passwordFirstLogin(
        PluginCall call
    ) {

        try {

            if (
                passwordFirstLoginAuthority == null ||
                freshDeviceLoginRecoveryCoordinator == null
            ) {

                JSObject unavailable =
                    new JSObject();

                unavailable.put(
                    "success",
                    false
                );

                unavailable.put(
                    "errorCode",
                    FinoraBranchPasswordFirstLoginBridgeContract
                        .PASSWORD_FIRST_LOGIN_FAILED
                );

                unavailable.put(
                    "error",
                    "FINORA Password-first login authority is unavailable."
                );

                call.resolve(
                    unavailable
                );

                return;
            }

                        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
                recoveryResult =
                    freshDeviceLoginRecoveryCoordinator.recover(
                        new FinoraPortableFreshDeviceLoginRecoveryCoordinator
                            .Request(
                                call.getString(
                                    "username"
                                ),
                                call.getString(
                                    "password"
                                ),
                                call.getString(
                                    "storageMode"
                                ),
                                call.getString(
                                    "securityCode"
                                )
                            )
                    );

            if (
                recoveryResult == null
            ) {
                JSObject recoveryFailure =
                    new JSObject();

                recoveryFailure.put(
                    "success",
                    false
                );

                recoveryFailure.put(
                    "errorCode",
                    FinoraBranchPasswordFirstLoginBridgeContract
                        .PASSWORD_FIRST_LOGIN_FAILED
                );

                recoveryFailure.put(
                    "error",
                    "FINORA fresh-device recovery returned no result."
                );

                call.resolve(
                    recoveryFailure
                );

                return;
            }

            if (!recoveryResult.success) {
                JSObject recoveryFailure =
                    new JSObject();

                recoveryFailure.put(
                    "success",
                    false
                );

                recoveryFailure.put(
                    "errorCode",
                    recoveryResult.errorCode
                );

                recoveryFailure.put(
                    "error",
                    recoveryResult.error
                );

                call.resolve(
                    recoveryFailure
                );

                return;
            }

            if (
                "SECURITY_CODE_REQUIRED".equals(
                    recoveryResult.status
                )
            ) {
                JSObject challenge =
                    new JSObject();

                challenge.put(
                    "success",
                    true
                );

                challenge.put(
                    "status",
                    "SECURITY_CODE_REQUIRED"
                );

                call.resolve(
                    challenge
                );

                return;
            }

            if (
                !"NOT_APPLICABLE".equals(
                    recoveryResult.status
                ) &&
                !"RECOVERED".equals(
                    recoveryResult.status
                )
            ) {
                JSObject recoveryFailure =
                    new JSObject();

                recoveryFailure.put(
                    "success",
                    false
                );

                recoveryFailure.put(
                    "errorCode",
                    FinoraBranchPasswordFirstLoginBridgeContract
                        .PASSWORD_FIRST_LOGIN_FAILED
                );

                recoveryFailure.put(
                    "error",
                    "FINORA fresh-device recovery returned an unexpected state."
                );

                call.resolve(
                    recoveryFailure
                );

                return;
            }

            /*
             * NOT_APPLICABLE:
             *   local credential already exists.
             *
             * RECOVERED:
             *   verified fresh-device hydration has just completed.
             *
             * In both cases continue through the canonical local
             * Password-first + Device Trust authority below.
             */

            FinoraBranchPasswordFirstLoginAuthority.Result
                authorityResult =
                    passwordFirstLoginAuthority.login(
                        new FinoraBranchPasswordFirstLoginAuthority
                            .Request(
                                call.getString(
                                    "username"
                                ),
                                call.getString(
                                    "password"
                                ),
                                call.getString(
                                    "storageMode"
                                ),
                                call.getString(
                                    "securityCode"
                                )
                            )
                    );

            FinoraBranchPasswordFirstLoginBridgeContract.Response
                bridgeResult =
                    FinoraBranchPasswordFirstLoginBridgeContract
                        .fromAuthorityResult(
                            authorityResult
                        );

            JSObject response =
                new JSObject();

            response.put(
                "success",
                bridgeResult.success
            );

            if (bridgeResult.success) {

                response.put(
                    "status",
                    bridgeResult.status
                );

                FinoraBranchPasswordFirstLoginBridgeContract.Data source =
                    bridgeResult.data;

                JSObject data =
                    new JSObject();

                data.put(
                    "credentialId",
                    source.credentialId
                );

                data.put(
                    "authGeneration",
                    source.authGeneration
                );

                data.put(
                    "userId",
                    source.userId
                );

                data.put(
                    "username",
                    source.username
                );

                data.put(
                    "fullName",
                    source.fullName
                );

                data.put(
                    "role",
                    source.role
                );

                data.put(
                    "ownerId",
                    source.ownerId
                );

                data.put(
                    "businessId",
                    source.businessId
                );

                data.put(
                    "branchId",
                    source.branchId
                );

                data.put(
                    "storageMode",
                    source.storageMode
                );

                data.put(
                    "dataContext",
                    source.dataContext
                );

                if (source.demoId != null) {

                    data.put(
                        "demoId",
                        source.demoId
                    );
                }

                data.put(
                    "authenticatedAt",
                    source.authenticatedAt
                );

                response.put(
                    "data",
                    data
                );
            }
            else {

                response.put(
                    "errorCode",
                    bridgeResult.errorCode
                );

                response.put(
                    "error",
                    bridgeResult.error
                );
            }

            call.resolve(
                response
            );
        }
        catch (Exception error) {

            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "errorCode",
                FinoraBranchPasswordFirstLoginBridgeContract
                    .PASSWORD_FIRST_LOGIN_FAILED
            );

            response.put(
                "error",
                "FINORA Password-first login could not be completed."
            );

            call.resolve(
                response
            );
        }
    }

    // ========================================================
    // AUTHORITATIVE LOGIN SESSION LIFECYCLE
    // ========================================================

    @PluginMethod
    public void login(
        PluginCall call
    ) {
        if (
            passwordFirstLoginAuthority == null ||
                freshDeviceLoginRecoveryCoordinator == null ||
                loginSessionAuthority == null
        ) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA secure login session authority is unavailable."
            );
            return;
        }

        String storageMode =
            normalizeStorageMode(
                call.getString(
                    "storageMode"
                )
            );

        if (storageMode == null) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_INVALID_REQUEST,
                "FINORA storage mode must be LOCAL or USB."
            );
            return;
        }

        try {
            FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
                recoveryResult =
                    freshDeviceLoginRecoveryCoordinator.recover(
                        new FinoraPortableFreshDeviceLoginRecoveryCoordinator
                            .Request(
                                call.getString(
                                    "username"
                                ),
                                call.getString(
                                    "password"
                                ),
                                call.getString(
                                    "storageMode"
                                ),
                                call.getString(
                                    "securityCode"
                                )
                            )
                    );

            if (recoveryResult == null) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA fresh-device recovery returned no result."
                );
                return;
            }

            if (!recoveryResult.success) {
                resolveLoginSessionFailure(
                    call,
                    recoveryResult.errorCode,
                    recoveryResult.error
                );
                return;
            }

            if (
                "SECURITY_CODE_REQUIRED".equals(
                    recoveryResult.status
                )
            ) {
                resolveLoginSessionFailure(
                    call,
                    "SECURITY_CODE_REQUIRED",
                    "Security Code is required to authorize this device."
                );
                return;
            }

            if (
                !"NOT_APPLICABLE".equals(
                    recoveryResult.status
                ) &&
                !"RECOVERED".equals(
                    recoveryResult.status
                )
            ) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA fresh-device recovery returned an unexpected state."
                );
                return;
            }

            /*
             * NOT_APPLICABLE:
             *   native credential already exists.
             *
             * RECOVERED:
             *   verified fresh-device hydration completed.
             *
             * Continue through canonical password-first
             * authentication and login-session issuance.
             */
            FinoraBranchPasswordFirstLoginAuthority.Result
                authorityResult =
                    passwordFirstLoginAuthority.login(
                        new FinoraBranchPasswordFirstLoginAuthority
                            .Request(
                                call.getString(
                                    "username"
                                ),
                                call.getString(
                                    "password"
                                ),
                                call.getString(
                                    "storageMode"
                                ),
                                call.getString(
                                    "securityCode"
                                )
                            )
                    );

            if (!authorityResult.success) {
                FinoraBranchPasswordFirstLoginBridgeContract.Response
                    bridgeResult =
                        FinoraBranchPasswordFirstLoginBridgeContract
                            .fromAuthorityResult(
                                authorityResult
                            );

                resolveLoginSessionFailure(
                    call,
                    bridgeResult.errorCode,
                    bridgeResult.error
                );
                return;
            }

            if (
                authorityResult.data == null ||
                !storageMode.equals(
                    authorityResult.data.storageMode
                )
            ) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_STORAGE_MODE_MISMATCH,
                    "FINORA login storage mode does not match the authenticated credential."
                );
                return;
            }

            if (
                !restoreWalletBranchCertificationAuthority(
                    call,
                    storageMode,
                    authorityResult.data
                )
            ) {
                return;
            }
            resolveLoginSessionResult(
                call,
                loginSessionAuthority.issue(
                    authorityResult.data
                )
            );
        }
        catch (Exception error) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA secure login session could not be created."
            );
        }
    }

    private boolean restoreWalletBranchCertificationAuthority(
        PluginCall call,
        String storageMode,
        FinoraBranchPasswordFirstLoginAuthority.AuthenticatedIdentity identity
    ) {

        if (
            call == null ||
            identity == null ||
            walletBranchCertificationDeviceVault == null ||
            walletBranchCertificationPortableAuthStore == null
        ) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA Wallet Branch Certification secure authority is unavailable."
            );

            return false;
        }

        FinoraBranchCertificationCryptoValidator.Material material;

        try {
            material =
                walletBranchCertificationDeviceVault.read(
                    identity.ownerId,
                    identity.businessId,
                    identity.branchId
                );
        }
        catch (Exception error) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA Wallet Branch Certification secure vault could not be validated."
            );

            return false;
        }

        if (material == null) {
            String securityCode =
                call.getString(
                    "securityCode"
                );

            if (
                securityCode == null ||
                securityCode.trim().length() == 0
            ) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchPasswordFirstLoginBridgeContract
                        .SECURITY_CODE_REQUIRED,
                    "Security Code is required once to secure Wallet Branch Certification on this device."
                );

                return false;
            }

            final String serializedPortableAuth;

            try {
                serializedPortableAuth =
                    walletBranchCertificationPortableAuthStore.read(
                        storageMode
                    );
            }
            catch (Exception error) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA Portable Branch Auth could not be read for Wallet Branch Certification."
                );

                return false;
            }

            if (
                serializedPortableAuth == null ||
                serializedPortableAuth.trim().length() == 0
            ) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA Portable Branch Auth is unavailable for Wallet Branch Certification."
                );

                return false;
            }

            final FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope;

            try {
                envelope =
                    FinoraPortableBranchAuthEnvelopeCodec.parse(
                        serializedPortableAuth
                    );
            }
            catch (IllegalArgumentException error) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA Portable Branch Auth envelope is invalid."
                );

                return false;
            }

            final FinoraPortableBranchAuthPayloadCodec.Payload payload;

            try {
                payload =
                    FinoraPortableBranchAuthAuthenticatedDecryptAuthority
                        .decrypt(
                            envelope,
                            call.getString(
                                "password"
                            ),
                            securityCode,
                            new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                                identity.ownerId,
                                identity.businessId,
                                identity.branchId
                            )
                        );
            }
            catch (
                FinoraPortableBranchAuthDecryptAuthority.CryptoException
                    error
            ) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchPasswordFirstLoginBridgeContract
                        .SECURITY_CODE_INVALID,
                    "FINORA Security Code is invalid."
                );

                return false;
            }

            if (
                payload == null ||
                payload.branchCertificationKeyMaterial == null ||
                payload.authGeneration != identity.authGeneration ||
                !java.util.Objects.equals(
                    payload.userId,
                    identity.userId
                ) ||
                !java.util.Objects.equals(
                    payload.username,
                    identity.username
                ) ||
                !java.util.Objects.equals(
                    payload.fullName,
                    identity.fullName
                ) ||
                !java.util.Objects.equals(
                    payload.role,
                    identity.role
                ) ||
                !java.util.Objects.equals(
                    payload.ownerId,
                    identity.ownerId
                ) ||
                !java.util.Objects.equals(
                    payload.businessId,
                    identity.businessId
                ) ||
                !java.util.Objects.equals(
                    payload.branchId,
                    identity.branchId
                ) ||
                !java.util.Objects.equals(
                    payload.storageMode,
                    identity.storageMode
                ) ||
                !java.util.Objects.equals(
                    payload.dataContext,
                    identity.dataContext
                ) ||
                !java.util.Objects.equals(
                    payload.demoId,
                    identity.demoId
                )
            ) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA Portable Branch Auth does not match the authenticated Wallet branch."
                );

                return false;
            }

            material =
                payload.branchCertificationKeyMaterial;

            try {
                FinoraBranchCertificationCryptoValidator.assertValid(
                    material
                );

                walletBranchCertificationDeviceVault.write(
                    identity.ownerId,
                    identity.businessId,
                    identity.branchId,
                    material
                );
            }
            catch (Exception error) {
                resolveLoginSessionFailure(
                    call,
                    FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED,
                    "FINORA Wallet Branch Certification could not be secured on this device."
                );

                return false;
            }
        }

        try {
            FinoraBranchCertificationCryptoValidator.assertValid(
                material
            );

            FinoraWalletBranchCertificationSessionAuthority.install(
                identity.ownerId,
                identity.businessId,
                identity.branchId,
                material
            );

            return true;
        }
        catch (Exception error) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA Wallet Branch Certification runtime authority could not be restored."
            );

            return false;
        }
    }
    @PluginMethod
    public void validate(
        PluginCall call
    ) {
        if (loginSessionAuthority == null) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA secure login session authority is unavailable."
            );
            return;
        }

        resolveLoginSessionResult(
            call,
            loginSessionAuthority.validate(
                call.getString(
                    "sessionId"
                )
            )
        );
    }

    @PluginMethod
    public void touch(
        PluginCall call
    ) {
        if (loginSessionAuthority == null) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA secure login session authority is unavailable."
            );
            return;
        }

        FinoraBranchLoginSessionAuthority.TouchResult result =
            loginSessionAuthority.touch(
                call.getString(
                    "sessionId"
                )
            );

        if (!result.success) {
            resolveLoginSessionFailure(
                call,
                result.errorCode,
                result.error
            );
            return;
        }

        JSObject data =
            new JSObject();

        data.put(
            "sessionId",
            result.data.sessionId
        );

        data.put(
            "lastActivity",
            result.data.lastActivity
        );

        JSObject response =
            createSuccessResult();

        response.put(
            "data",
            data
        );

        call.resolve(
            response
        );
    }

    @PluginMethod
    public void invalidate(
        PluginCall call
    ) {
        if (loginSessionAuthority == null) {
            resolveLoginSessionFailure(
                call,
                FinoraBranchLoginSessionAuthority
                    .ERROR_CONTROL_STATE_FAILED,
                "FINORA secure login session authority is unavailable."
            );
            return;
        }

        boolean invalidated =
            loginSessionAuthority.invalidate(
                call.getString(
                    "sessionId"
                )
            );

        JSObject data =
            new JSObject();

        data.put(
            "invalidated",
            invalidated
        );

        JSObject response =
            createSuccessResult();

        response.put(
            "data",
            data
        );

        call.resolve(
            response
        );
    }

    // ========================================================
    // GET INSTALLATION
    // ========================================================

    /**
     * Return the installation identity bound to this device.
     *
     * Missing control file / missing installation returns:
     *
     * {
     *   success: true
     * }
     *
     * The renderer therefore treats data as undefined.
     */

    // ========================================================
    // INSTALLATION ENROLLMENT REQUEST EXPORT
    // ========================================================

    private static final class PendingInstallationEnrollmentExport {

        final byte[] bytes;
        final String fileName;
        final String requestId;

        PendingInstallationEnrollmentExport(
            byte[] bytes,
            String fileName,
            String requestId
        ) {
            this.bytes = bytes;
            this.fileName = fileName;
            this.requestId = requestId;
        }
    }

    private PendingInstallationEnrollmentExport
        pendingInstallationEnrollmentExport;

    @PluginMethod
    public void exportInstallationEnrollmentRequest(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        if (pendingInstallationEnrollmentExport != null) {
            resolveFailure(
                call,
                "A FINORA Installation Enrollment Request export is already in progress."
            );
            return;
        }

        try {

            if (
                installationBindingService == null ||
                controlStore == null
            ) {
                throw new IllegalStateException(
                    "FINORA native enrollment authority is unavailable."
                );
            }

            FinoraInstallationBindingCrypto.PublicBinding binding =
                installationBindingService.ensure();

            if (binding == null) {
                throw new IllegalStateException(
                    "FINORA native installation binding is unavailable."
                );
            }

            java.security.KeyPairGenerator certificationGenerator =
                java.security.KeyPairGenerator.getInstance(
                    "EC"
                );

            certificationGenerator.initialize(
                new java.security.spec.ECGenParameterSpec(
                    "secp256r1"
                )
            );

            java.security.KeyPair certificationKeyPair =
                certificationGenerator.generateKeyPair();

            String certificationPublicKey =
                java.util.Base64
                    .getEncoder()
                    .encodeToString(
                        certificationKeyPair
                            .getPublic()
                            .getEncoded()
                    );

            String certificationPrivateKey =
                java.util.Base64
                    .getEncoder()
                    .encodeToString(
                        certificationKeyPair
                            .getPrivate()
                            .getEncoded()
                    );

            byte[] certificationFingerprintBytes =
                java.security.MessageDigest
                    .getInstance(
                        "SHA-256"
                    )
                    .digest(
                        certificationKeyPair
                            .getPublic()
                            .getEncoded()
                    );

            StringBuilder certificationFingerprintBuilder =
                new StringBuilder(
                    certificationFingerprintBytes.length * 2
                );

            for (byte item : certificationFingerprintBytes) {
                certificationFingerprintBuilder.append(
                    String.format(
                        java.util.Locale.ROOT,
                        "%02x",
                        item & 0xff
                    )
                );
            }

            String certificationFingerprint =
                certificationFingerprintBuilder.toString();

            String certificationKeyId =
                FinoraBranchCertificationCryptoValidator
                    .KEY_ID_PREFIX +
                certificationFingerprint
                    .substring(
                        0,
                        32
                    )
                    .toUpperCase(
                        java.util.Locale.ROOT
                    );

            String createdAt =
                java.time.Instant
                    .now()
                    .toString();

            FinoraBranchCertificationCryptoValidator.Material
                certificationMaterial =
                    new FinoraBranchCertificationCryptoValidator.Material(
                        certificationKeyId,
                        FinoraBranchCertificationCryptoValidator.ALGORITHM,
                        FinoraBranchCertificationCryptoValidator.PUBLIC_KEY_FORMAT,
                        certificationPublicKey,
                        FinoraBranchCertificationCryptoValidator.FINGERPRINT_ALGORITHM,
                        certificationFingerprint,
                        createdAt,
                        FinoraBranchCertificationCryptoValidator.SCHEMA_VERSION,
                        FinoraBranchCertificationCryptoValidator.PRIVATE_KEY_FORMAT,
                        certificationPrivateKey,
                        FinoraBranchCertificationCryptoValidator.VAULT_SCHEMA_VERSION
                    );

            FinoraBranchCertificationCryptoValidator.assertValid(
                certificationMaterial
            );

            String requestId =
                "FINORA-ENROLLMENT-" +
                java.util.UUID
                    .randomUUID()
                    .toString();

            JSONObject deviceBinding =
                new JSONObject();

            deviceBinding.put(
                "installationId",
                binding.installationId
            );

            deviceBinding.put(
                "bindingKeyId",
                binding.bindingKeyId
            );

            deviceBinding.put(
                "platform",
                FinoraInstallationBindingCrypto.PLATFORM
            );

            deviceBinding.put(
                "algorithm",
                FinoraInstallationBindingCrypto.ALGORITHM
            );

            deviceBinding.put(
                "publicKeyFormat",
                FinoraInstallationBindingCrypto.PUBLIC_KEY_FORMAT
            );

            deviceBinding.put(
                "publicKey",
                binding.publicKey
            );

            deviceBinding.put(
                "fingerprintAlgorithm",
                binding.fingerprintAlgorithm
            );

            deviceBinding.put(
                "publicKeyFingerprint",
                binding.publicKeyFingerprint
            );

            deviceBinding.put(
                "createdAt",
                binding.createdAt
            );

            deviceBinding.put(
                "schemaVersion",
                1
            );

            JSONObject branchCertificationPublicKey =
                new JSONObject();

            branchCertificationPublicKey.put(
                "keyId",
                certificationMaterial.keyId
            );

            branchCertificationPublicKey.put(
                "algorithm",
                certificationMaterial.algorithm
            );

            branchCertificationPublicKey.put(
                "publicKeyFormat",
                certificationMaterial.publicKeyFormat
            );

            branchCertificationPublicKey.put(
                "publicKey",
                certificationMaterial.publicKey
            );

            branchCertificationPublicKey.put(
                "fingerprintAlgorithm",
                certificationMaterial.fingerprintAlgorithm
            );

            branchCertificationPublicKey.put(
                "publicKeyFingerprint",
                certificationMaterial.publicKeyFingerprint
            );

            branchCertificationPublicKey.put(
                "createdAt",
                certificationMaterial.createdAt
            );

            branchCertificationPublicKey.put(
                "schemaVersion",
                certificationMaterial.schemaVersion
            );

            JSONObject payload =
                new JSONObject();

            payload.put(
                "requestId",
                requestId
            );

            payload.put(
                "deviceBinding",
                deviceBinding
            );

            payload.put(
                "branchCertificationPublicKey",
                branchCertificationPublicKey
            );

            payload.put(
                "requestedAt",
                java.time.Instant
                    .now()
                    .toString()
            );

            payload.put(
                "schemaVersion",
                2
            );

            String canonicalPayload =
                FinoraCanonicalJson.canonicalize(
                    FinoraJsonBridge.toMap(
                        payload
                    )
                );

            String signatureValue =
                FinoraInstallationBindingCrypto
                    .signCanonicalEnrollment(
                        canonicalPayload
                    );

            JSONObject signature =
                new JSONObject();

            signature.put(
                "algorithm",
                "ECDSA_P256_SHA256"
            );

            signature.put(
                "encoding",
                "IEEE_P1363"
            );

            signature.put(
                "canonicalization",
                "FINORA_CANONICAL_JSON_V1"
            );

            signature.put(
                "bindingKeyId",
                binding.bindingKeyId
            );

            signature.put(
                "value",
                signatureValue
            );

            JSONObject request =
                new JSONObject();

            request.put(
                "payload",
                payload
            );

            request.put(
                "signature",
                signature
            );

            request.put(
                "schemaVersion",
                2
            );

            JSONObject file =
                new JSONObject();

            file.put(
                "format",
                "FINORA_INSTALLATION_ENROLLMENT_REQUEST_V2"
            );

            file.put(
                "request",
                request
            );

            file.put(
                "schemaVersion",
                2
            );

            /*
             * Preserve exact request provenance + Branch Certification
             * private material inside FINORA encrypted Control Store.
             *
             * Renderer never receives this private material.
             */
            String serializedControl =
                controlStore.read();

            JSONObject controlRoot =
                serializedControl == null ||
                serializedControl.trim().isEmpty()
                    ? new JSONObject()
                    : new JSONObject(
                        serializedControl
                    );

            JSONObject pendingEnrollment =
                new JSONObject();

            pendingEnrollment.put(
                "requestId",
                requestId
            );

            pendingEnrollment.put(
                "installationId",
                binding.installationId
            );

            pendingEnrollment.put(
                "bindingKeyId",
                binding.bindingKeyId
            );

            pendingEnrollment.put(
                "publicKeyFingerprint",
                binding.publicKeyFingerprint
            );

            pendingEnrollment.put(
                "createdAt",
                createdAt
            );

            pendingEnrollment.put(
                "schemaVersion",
                1
            );

            JSONObject pendingCertification =
                new JSONObject();

            pendingCertification.put(
                "keyId",
                certificationMaterial.keyId
            );

            pendingCertification.put(
                "algorithm",
                certificationMaterial.algorithm
            );

            pendingCertification.put(
                "publicKeyFormat",
                certificationMaterial.publicKeyFormat
            );

            pendingCertification.put(
                "publicKey",
                certificationMaterial.publicKey
            );

            pendingCertification.put(
                "fingerprintAlgorithm",
                certificationMaterial.fingerprintAlgorithm
            );

            pendingCertification.put(
                "publicKeyFingerprint",
                certificationMaterial.publicKeyFingerprint
            );

            pendingCertification.put(
                "createdAt",
                certificationMaterial.createdAt
            );

            pendingCertification.put(
                "schemaVersion",
                certificationMaterial.schemaVersion
            );

            pendingCertification.put(
                "privateKeyFormat",
                certificationMaterial.privateKeyFormat
            );

            pendingCertification.put(
                "privateKey",
                certificationMaterial.privateKey
            );

            pendingCertification.put(
                "vaultSchemaVersion",
                certificationMaterial.vaultSchemaVersion
            );

            pendingEnrollment.put(
                "branchCertificationKeyMaterial",
                pendingCertification
            );

            controlRoot.put(
                "pendingInstallationEnrollment",
                pendingEnrollment
            );

            controlStore.write(
                controlRoot.toString()
            );

            byte[] bytes =
                file
                    .toString(
                        2
                    )
                    .getBytes(
                        java.nio.charset.StandardCharsets.UTF_8
                    );

            String fileName =
                "FINORA-INSTALLATION-ENROLLMENT-" +
                binding.installationId +
                ".finora";

            pendingInstallationEnrollmentExport =
                new PendingInstallationEnrollmentExport(
                    bytes,
                    fileName,
                    requestId
                );

            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_CREATE_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/octet-stream"
            );

            intent.putExtra(
                android.content.Intent.EXTRA_TITLE,
                fileName
            );

            startActivityForResult(
                call,
                intent,
                "completeInstallationEnrollmentRequestExport"
            );

        } catch (Exception error) {

            pendingInstallationEnrollmentExport =
                null;

            resolveFailure(
                call,
                error,
                "Unable to export the FINORA Installation Enrollment Request."
            );
        }
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void completeInstallationEnrollmentRequestExport(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        PendingInstallationEnrollmentExport pending =
            pendingInstallationEnrollmentExport;

        pendingInstallationEnrollmentExport =
            null;

        if (
            pending == null
        ) {
            resolveFailure(
                call,
                "FINORA Installation Enrollment Request export state is unavailable."
            );
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK ||
            result.getData() == null ||
            result.getData().getData() == null
        ) {
            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "success",
                true
            );

            cancelled.put(
                "cancelled",
                true
            );

            call.resolve(
                cancelled
            );

            return;
        }

        try {

            android.net.Uri uri =
                result
                    .getData()
                    .getData();

            try (
                java.io.OutputStream output =
                    getContext()
                        .getContentResolver()
                        .openOutputStream(
                            uri,
                            "wt"
                        )
            ) {

                if (output == null) {
                    throw new IllegalStateException(
                        "Unable to open the selected FINORA Enrollment Request destination."
                    );
                }

                output.write(
                    pending.bytes
                );

                output.flush();
            }

            JSObject success =
                new JSObject();

            success.put(
                "success",
                true
            );

            success.put(
                "cancelled",
                false
            );

            success.put(
                "fileName",
                pending.fileName
            );

            success.put(
                "bytesWritten",
                pending.bytes.length
            );

            success.put(
                "requestId",
                pending.requestId
            );

            call.resolve(
                success
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to save the FINORA Installation Enrollment Request."
            );
        }
    }
    // ========================================================
    // OWNER WALLET RECHARGE REQUEST EXPORT
    // ========================================================

    private static final long
        OWNER_WALLET_REQUEST_MAX_SAFE_INTEGER =
            9_007_199_254_740_991L;

    private static final int
        OWNER_WALLET_REQUEST_MAX_FILE_BYTES =
            64 * 1024;


    private static final class OwnerWalletRequestExport {

        final byte[] bytes;
        final String fileName;
        final String requestId;
        final String paymentReference;

        OwnerWalletRequestExport(
            byte[] bytes,
            String fileName,
            String requestId,
            String paymentReference
        ) {
            this.bytes = bytes;
            this.fileName = fileName;
            this.requestId = requestId;
            this.paymentReference = paymentReference;
        }
    }


    private OwnerWalletRequestExport
        pendingOwnerWalletRequestExport;


    @PluginMethod
    public void exportWalletRechargeRequest(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }


        if (pendingOwnerWalletRequestExport != null) {

            resolveOwnerWalletExportFailure(
                call,
                "A FINORA Wallet Recharge Request export is already in progress."
            );

            return;
        }


        try {

            String sessionId =
                requireOwnerWalletText(
                    call.getString("sessionId"),
                    "FINORA session ID"
                );

            String paymentReference =
                requireOwnerWalletText(
                    call.getString("paymentReference"),
                    "Wallet Recharge payment reference"
                );

            String paymentMethod =
                requireOwnerWalletText(
                    call.getString("paymentMethod"),
                    "Wallet Recharge payment method"
                );

            String paymentSource =
                requireOwnerWalletText(
                    call.getString("paymentSource"),
                    "Wallet Recharge payment source"
                );


            Double rawAmount =
                call.getDouble("amountMinor");


            if (
                rawAmount == null ||
                !Double.isFinite(rawAmount.doubleValue()) ||
                rawAmount.doubleValue() <= 0.0d ||
                rawAmount.doubleValue() >
                    OWNER_WALLET_REQUEST_MAX_SAFE_INTEGER ||
                Math.rint(rawAmount.doubleValue()) !=
                    rawAmount.doubleValue()
            ) {

                throw new IllegalArgumentException(
                    "Wallet Recharge amountMinor must be a positive JavaScript-safe integer."
                );
            }


            long amountMinor =
                rawAmount.longValue();


            if (
                !ownerWalletPaymentMethodAllowed(paymentMethod) ||
                !ownerWalletPaymentSourceAllowed(paymentSource)
            ) {

                throw new IllegalArgumentException(
                    "Wallet Recharge payment method/source is invalid."
                );
            }


            if (loginSessionAuthority == null) {

                throw new IllegalStateException(
                    "FINORA login session authority is unavailable."
                );
            }


            FinoraBranchLoginSessionAuthority.SessionResult
                sessionResult =
                    loginSessionAuthority.validate(
                        sessionId
                    );


            if (
                sessionResult == null ||
                !sessionResult.success ||
                sessionResult.data == null
            ) {

                throw new IllegalStateException(
                    sessionResult != null &&
                    sessionResult.error != null
                        ? sessionResult.error
                        : "A valid FINORA login session is required."
                );
            }


            FinoraBranchLoginSessionAuthority.SessionView
                session =
                    sessionResult.data;


            if (
                !"REAL".equals(session.dataContext) ||
                !FinoraBranchLoginSessionAuthority
                    .ACCESS_MODE_ACTIVE
                    .equals(session.accessMode)
            ) {

                throw new IllegalStateException(
                    "Only an ACTIVE REAL FINORA session may export a Wallet Recharge Request."
                );
            }


            JSONObject controlPackage =
                readValidatedControlPackage();


            if (controlPackage == null) {

                throw new IllegalStateException(
                    "Validated FINORA Control State is unavailable."
                );
            }


            org.json.JSONArray profiles =
                controlPackage.optJSONArray(
                    "businessProfiles"
                );


            if (profiles == null) {

                throw new IllegalStateException(
                    "Trusted FINORA Business Profile is unavailable."
                );
            }


            JSONObject profile =
                null;


            for (
                int index = 0;
                index < profiles.length();
                index++
            ) {

                JSONObject candidate =
                    profiles.optJSONObject(
                        index
                    );


                if (candidate == null) {
                    continue;
                }


                if (
                    session.ownerId.equals(
                        candidate.optString("ownerId", "")
                    ) &&
                    session.businessId.equals(
                        candidate.optString("businessId", "")
                    ) &&
                    session.branchId.equals(
                        candidate.optString("branchId", "")
                    )
                ) {

                    if (profile != null) {

                        throw new IllegalStateException(
                            "Multiple trusted FINORA Business Profiles match the active branch."
                        );
                    }


                    profile =
                        candidate;
                }
            }


            if (profile == null) {

                throw new IllegalStateException(
                    "Trusted FINORA Business Profile does not match the active branch."
                );
            }


            String businessCode =
                requireOwnerWalletText(
                    profile.optString(
                        "businessCode",
                        null
                    ),
                    "FINORA businessCode"
                );

            String branchCode =
                requireOwnerWalletText(
                    profile.optString(
                        "branchCode",
                        null
                    ),
                    "FINORA branchCode"
                );


            FinoraInstallationBindingCrypto.PublicBinding
                binding =
                    installationBindingService.get();


            if (binding == null) {

                throw new IllegalStateException(
                    "FINORA Android installation binding is unavailable."
                );
            }
            /*
             * ANY-DEVICE WALLET REQUEST POLICY
             *
             * The authenticated FINORA branch session controls
             * ownerId / businessId / branchId.
             *
             * A fresh authorized device has its own native P-256
             * installation key. It MUST NOT be required to equal
             * the historical installation recorded in the trusted
             * Business Profile.
             *
             * The current native device key is still used below to
             * sign request integrity. This block only removes the
             * historical-device equality gate.
             */


            String requestId =
                "FINORA-WAL-REQ-" +
                ownerWalletSha256(
                    "WALLET_RECHARGE_REQUEST" +
                    "\u0000" +
                    session.ownerId +
                    "\u0000" +
                    session.businessId +
                    "\u0000" +
                    session.branchId +
                    "\u0000" +
                    paymentReference
                ).toUpperCase(
                    java.util.Locale.ROOT
                );


            String requestedAt =
                java.time.format.DateTimeFormatter
                    .ofPattern(
                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                    )
                    .withZone(
                        java.time.ZoneOffset.UTC
                    )
                    .format(
                        java.time.Instant.now()
                    );


            JSONObject scope =
                new JSONObject();

            scope.put(
                "ownerId",
                session.ownerId
            );

            scope.put(
                "businessId",
                session.businessId
            );

            scope.put(
                "branchId",
                session.branchId
            );


            JSONObject displayIdentity =
                new JSONObject();

            displayIdentity.put(
                "businessCode",
                businessCode
            );

            displayIdentity.put(
                "branchCode",
                branchCode
            );


            JSONObject installation =
                new JSONObject();

            installation.put(
                "installationId",
                binding.installationId
            );

            installation.put(
                "bindingKeyId",
                binding.bindingKeyId
            );

            installation.put(
                "fingerprintAlgorithm",
                "SHA-256"
            );

            installation.put(
                "publicKeyFingerprint",
                binding.publicKeyFingerprint
            );
            installation.put(
                "platform",
                "ANDROID"
            );
            installation.put(
                "algorithm",
                "ECDSA_P256_SHA256"
            );
            installation.put(
                "publicKeyFormat",
                binding.publicKeyFormat
            );
            installation.put(
                "publicKey",
                binding.publicKey
            );
            installation.put(
                "createdAt",
                binding.createdAt
            );
            installation.put(
                "schemaVersion",
                binding.schemaVersion
            );


            JSONObject payload =
                new JSONObject();

            payload.put(
                "purpose",
                "WALLET_RECHARGE_REQUEST"
            );

            payload.put(
                "requestId",
                requestId
            );

            payload.put(
                "paymentReference",
                paymentReference
            );

            payload.put(
                "scope",
                scope
            );

            payload.put(
                "displayIdentity",
                displayIdentity
            );

            payload.put(
                "installation",
                installation
            );

            payload.put(
                "amountMinor",
                amountMinor
            );

            payload.put(
                "currency",
                "INR"
            );

            payload.put(
                "paymentMethod",
                paymentMethod
            );

            payload.put(
                "paymentSource",
                paymentSource
            );

            payload.put(
                "requestedAt",
                requestedAt
            );

            payload.put(
                "schemaVersion",
                2
            );


            String canonicalPayload =
                FinoraCanonicalJson.canonicalize(
                    FinoraJsonBridge.toMap(
                        payload
                    )
                );


            String signatureValue =
                installationBindingService
                    .signEnrollment(
                        canonicalPayload
                    );


            byte[] signatureBytes =
                android.util.Base64.decode(
                    signatureValue,
                    android.util.Base64.DEFAULT
                );


            if (signatureBytes.length != 64) {

                throw new IllegalStateException(
                    "FINORA Wallet Recharge Request signature is not canonical IEEE-P1363."
                );
            }


            JSONObject signature =
                new JSONObject();

            signature.put(
                "algorithm",
                "ECDSA_P256_SHA256"
            );

            signature.put(
                "encoding",
                "IEEE_P1363"
            );

            signature.put(
                "canonicalization",
                "FINORA_CANONICAL_JSON_V1"
            );

            signature.put(
                "bindingKeyId",
                binding.bindingKeyId
            );

            signature.put(
                "value",
                signatureValue
            );


            FinoraBranchCertificationCryptoValidator.Material walletBranchCertificationMaterial =
                FinoraWalletBranchCertificationSessionAuthority.require(
                    session.ownerId,
                    session.businessId,
                    session.branchId
                );

            FinoraWalletBranchCertificationSigner.SignedValue branchCertificationSignedValue =
                FinoraWalletBranchCertificationSigner.sign(
                    canonicalPayload,
                    walletBranchCertificationMaterial
                );

            JSONObject branchCertificationSignature = new JSONObject();
            branchCertificationSignature.put(
                "algorithm",
                branchCertificationSignedValue.algorithm
            );
            branchCertificationSignature.put(
                "encoding",
                branchCertificationSignedValue.encoding
            );
            branchCertificationSignature.put(
                "canonicalization",
                branchCertificationSignedValue.canonicalization
            );
            branchCertificationSignature.put(
                "keyId",
                branchCertificationSignedValue.keyId
            );
            branchCertificationSignature.put(
                "value",
                branchCertificationSignedValue.value
            );

            JSONObject signedRequest =
                new JSONObject();

            signedRequest.put(
                "payload",
                payload
            );

            signedRequest.put(
                "signature",
                signature
            );

            signedRequest.put(
                "branchCertificationSignature",
                branchCertificationSignature
            );
            signedRequest.put(
                "schemaVersion",
                2
            );


            JSONObject file =
                new JSONObject();

            file.put(
                "format",
                "FINORA_WALLET_RECHARGE_REQUEST_V2"
            );

            file.put(
                "request",
                signedRequest
            );

            file.put(
                "schemaVersion",
                2
            );


            byte[] bytes =
                file.toString()
                    .getBytes(
                        java.nio.charset.StandardCharsets.UTF_8
                    );


            if (
                bytes.length >
                    OWNER_WALLET_REQUEST_MAX_FILE_BYTES
            ) {

                throw new IllegalStateException(
                    "FINORA Wallet Recharge Request exceeds the maximum file size."
                );
            }


            String fileName =
                createOwnerWalletRequestFileName(
                    businessCode,
                    branchCode,
                    paymentMethod,
                    amountMinor,
                    requestId
                );


            pendingOwnerWalletRequestExport =
                new OwnerWalletRequestExport(
                    bytes,
                    fileName,
                    requestId,
                    paymentReference
                );


            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_CREATE_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/octet-stream"
            );

            intent.putExtra(
                android.content.Intent.EXTRA_TITLE,
                fileName
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            );


            startActivityForResult(
                call,
                intent,
                "ownerWalletRequestExportSelected"
            );

        } catch (Exception error) {

            pendingOwnerWalletRequestExport =
                null;

            resolveOwnerWalletExportFailure(
                call,
                ownerWalletErrorMessage(
                    error,
                    "Unable to prepare the FINORA Wallet Recharge Request."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void ownerWalletRequestExportSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        OwnerWalletRequestExport pending =
            pendingOwnerWalletRequestExport;

        pendingOwnerWalletRequestExport =
            null;


        if (call == null) {
            return;
        }


        if (pending == null) {

            resolveOwnerWalletExportFailure(
                call,
                "FINORA Wallet Recharge Request export session is unavailable."
            );

            return;
        }


        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {

            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "success",
                true
            );

            cancelled.put(
                "cancelled",
                true
            );

            call.resolve(
                cancelled
            );

            return;
        }


        try {

            android.content.Intent data =
                result.getData();

            android.net.Uri uri =
                data == null
                    ? null
                    : data.getData();


            if (uri == null) {

                throw new IllegalStateException(
                    "Android did not return a Wallet Recharge Request destination."
                );
            }


            java.io.OutputStream output =
                getContext()
                    .getContentResolver()
                    .openOutputStream(
                        uri,
                        "wt"
                    );


            if (output == null) {

                throw new IllegalStateException(
                    "Wallet Recharge Request destination could not be opened."
                );
            }


            try {

                output.write(
                    pending.bytes
                );

                output.flush();

            } finally {

                output.close();
            }


            JSObject success =
                new JSObject();

            success.put(
                "success",
                true
            );

            success.put(
                "cancelled",
                false
            );

            success.put(
                "fileName",
                pending.fileName
            );

            success.put(
                "bytesWritten",
                pending.bytes.length
            );

            success.put(
                "requestId",
                pending.requestId
            );

            success.put(
                "paymentReference",
                pending.paymentReference
            );


            call.resolve(
                success
            );

        } catch (Exception error) {

            resolveOwnerWalletExportFailure(
                call,
                ownerWalletErrorMessage(
                    error,
                    "Unable to save the FINORA Wallet Recharge Request."
                )
            );
        }
    }


    private static void resolveOwnerWalletExportFailure(
        PluginCall call,
        String error
    ) {

        JSObject response =
            new JSObject();

        response.put(
            "success",
            false
        );

        response.put(
            "error",
            error
        );

        call.resolve(
            response
        );
    }


    private static String ownerWalletErrorMessage(
        Exception error,
        String fallback
    ) {

        if (
            error != null &&
            error.getMessage() != null &&
            !error.getMessage()
                .trim()
                .isEmpty()
        ) {

            return error
                .getMessage()
                .trim();
        }


        return fallback;
    }


    private static String requireOwnerWalletText(
        String value,
        String label
    ) {

        String normalized =
            value == null
                ? ""
                : value.trim();


        if (normalized.isEmpty()) {

            throw new IllegalArgumentException(
                label +
                " is required."
            );
        }


        return normalized;
    }


    private static String ownerWalletSha256(
        String value
    ) throws Exception {

        byte[] bytes =
            java.security.MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value.getBytes(
                        java.nio.charset.StandardCharsets.UTF_8
                    )
                );


        StringBuilder output =
            new StringBuilder(
                bytes.length * 2
            );


        for (byte item : bytes) {

            output.append(
                String.format(
                    java.util.Locale.ROOT,
                    "%02x",
                    item & 0xff
                )
            );
        }


        return output.toString();
    }


    private static boolean ownerWalletPaymentMethodAllowed(
        String value
    ) {

        return
            "UPI".equals(value) ||
            "PHONEPE".equals(value) ||
            "GOOGLE_PAY".equals(value) ||
            "PAYTM".equals(value) ||
            "RAZORPAY".equals(value) ||
            "BANK_TRANSFER".equals(value) ||
            "OTHER".equals(value);
    }


    private static boolean ownerWalletPaymentSourceAllowed(
        String value
    ) {

        return
            "PHONEPE".equals(value) ||
            "RAZORPAY".equals(value) ||
            "UPI".equals(value) ||
            "GOOGLE_PAY".equals(value) ||
            "PAYTM".equals(value) ||
            "BANK_TRANSFER".equals(value) ||
            "MANUAL".equals(value);
    }


    private static String createOwnerWalletRequestFileName(
        String businessCode,
        String branchCode,
        String paymentMethod,
        long amountMinor,
        String requestId
    ) {

        return (
            "FIN-WAL-REQ-" +
            ownerWalletBusinessToken(
                businessCode
            ) +
            "-" +
            ownerWalletBranchToken(
                branchCode
            ) +
            "-" +
            ownerWalletPaymentToken(
                paymentMethod
            ) +
            "-" +
            ownerWalletAmountToken(
                amountMinor
            ) +
            "-" +
            ownerWalletRequestToken(
                requestId
            ) +
            "_" +
            new java.text.SimpleDateFormat(
                "dd-MM-yyyy_hhÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡mm",
                java.util.Locale.US
            ).format(
                new java.util.Date()
            ) +
            ".finora"
        );
    }


    private static String ownerWalletBusinessToken(
        String value
    ) {

        String token =
            value
                .trim()
                .toUpperCase(
                    java.util.Locale.ROOT
                )
                .replaceAll(
                    "[^A-Z0-9]",
                    ""
                );


        if (token.length() > 16) {

            token =
                token.substring(
                    0,
                    16
                );
        }


        return token.isEmpty()
            ? "BUS"
            : token;
    }


    private static String ownerWalletBranchToken(
        String value
    ) {

        String normalized =
            value
                .trim()
                .toUpperCase(
                    java.util.Locale.ROOT
                );


        String digits =
            normalized.replaceAll(
                "[^0-9]",
                ""
            );


        if (!digits.isEmpty()) {

            while (digits.length() < 3) {

                digits =
                    "0" +
                    digits;
            }


            String token =
                "BR" +
                digits;


            return token.length() > 18
                ? token.substring(
                    0,
                    18
                )
                : token;
        }


        String fallback =
            normalized.replaceAll(
                "[^A-Z0-9]",
                ""
            );


        if (fallback.length() > 16) {

            fallback =
                fallback.substring(
                    0,
                    16
                );
        }


        return fallback.isEmpty()
            ? "BRANCH"
            : fallback;
    }


    private static String ownerWalletPaymentToken(
        String value
    ) {

        String token =
            value
                .trim()
                .toUpperCase(
                    java.util.Locale.ROOT
                )
                .replaceAll(
                    "[^A-Z0-9]",
                    ""
                );


        return token.length() > 20
            ? token.substring(
                0,
                20
            )
            : token;
    }


    private static String ownerWalletAmountToken(
        long amountMinor
    ) {

        long whole =
            amountMinor /
            100L;

        long paise =
            amountMinor %
            100L;


        if (paise == 0L) {

            return Long.toString(
                whole
            );
        }


        return (
            Long.toString(
                whole
            ) +
            "P" +
            String.format(
                java.util.Locale.ROOT,
                "%02d",
                paise
            )
        );
    }


    private static String ownerWalletRequestToken(
        String requestId
    ) {

        String prefix =
            "FINORA-WAL-REQ-";


        String digest =
            requestId.startsWith(
                prefix
            )
                ? requestId.substring(
                    prefix.length()
                )
                : requestId;


        digest =
            digest
                .toUpperCase(
                    java.util.Locale.ROOT
                )
                .replaceAll(
                    "[^A-F0-9]",
                    ""
                );


        if (digest.isEmpty()) {

            throw new IllegalArgumentException(
                "FINORA Wallet Recharge requestId token is invalid."
            );
        }


        return digest.substring(
            0,
            Math.min(
                6,
                digest.length()
            )
        );
    }

    /**
     * One-time recipient operational trust bootstrap.
     *
     * SECURITY:
     *
     * - The supplied public signing key is NOT trusted on its own.
     * - expectedPublicKeyFingerprint must be supplied through an
     *   independent operator-authenticated channel.
     * - Existing recipient trust cannot be replaced here.
     * - The production bootstrap service validates P-256 SPKI,
     *   canonical signingKeyId, ACTIVE status and fingerprint.
     * - No DONE / CONTROL_BUNDLE package is accepted as trust
     *   authority by this method.
     */
    
    // ========================================================
    // INSTALLATION ENROLLMENT RESPONSE IMPORT
    // ========================================================

    @PluginMethod
    public void importInstallationEnrollmentResponse(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        String expectedFingerprint =
            normalizeRequiredString(
                call.getString(
                    "expectedControlCenterPublicKeyFingerprint"
                )
            );

        if (expectedFingerprint == null) {

            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                "FINORA independently confirmed Control Center public-key fingerprint is required."
            );

            call.resolve(
                response
            );

            return;
        }

        try {

            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/octet-stream"
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "installationEnrollmentResponseSelected"
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to open the FINORA Installation Enrollment Response selector."
            );
        }
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void installationEnrollmentResponseSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK ||
            result.getData() == null ||
            result.getData().getData() == null
        ) {

            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "success",
                true
            );

            cancelled.put(
                "cancelled",
                true
            );

            call.resolve(
                cancelled
            );

            return;
        }

        try {

            String expectedFingerprint =
                normalizeRequiredString(
                    call.getString(
                        "expectedControlCenterPublicKeyFingerprint"
                    )
                );

            if (expectedFingerprint == null) {
                throw new IllegalStateException(
                    "FINORA independently confirmed Control Center fingerprint is unavailable."
                );
            }

            android.net.Uri uri =
                result
                    .getData()
                    .getData();

            java.io.InputStream input =
                getContext()
                    .getContentResolver()
                    .openInputStream(
                        uri
                    );

            if (input == null) {
                throw new IllegalStateException(
                    "FINORA Installation Enrollment Response source could not be opened."
                );
            }

            java.io.ByteArrayOutputStream buffer =
                new java.io.ByteArrayOutputStream();

            byte[] chunk =
                new byte[4096];

            int total =
                0;

            try {

                while (true) {

                    int read =
                        input.read(
                            chunk
                        );

                    if (read < 0) {
                        break;
                    }

                    total +=
                        read;

                    if (total > 262144) {
                        throw new IllegalStateException(
                            "FINORA Installation Enrollment Response exceeds the maximum allowed size."
                        );
                    }

                    buffer.write(
                        chunk,
                        0,
                        read
                    );
                }

            } finally {

                input.close();
            }

            byte[] bytes =
                buffer.toByteArray();

            if (bytes.length == 0) {
                throw new IllegalStateException(
                    "FINORA Installation Enrollment Response is empty."
                );
            }

            org.json.JSONObject file =
                new org.json.JSONObject(
                    new String(
                        bytes,
                        java.nio.charset.StandardCharsets.UTF_8
                    )
                );

            FinoraInstallationEnrollmentImportService.Result imported =
                FinoraInstallationEnrollmentImportService.apply(
                    getContext(),
                    file,
                    bytes,
                    expectedFingerprint
                );

            JSObject data =
                new JSObject();

            data.put(
                "responseId",
                imported.responseId
            );

            data.put(
                "requestId",
                imported.requestId
            );

            data.put(
                "ownerId",
                imported.ownerId
            );

            data.put(
                "businessId",
                imported.businessId
            );

            data.put(
                "branchId",
                imported.branchId
            );

            data.put(
                "businessCode",
                imported.businessCode
            );

            data.put(
                "branchCode",
                imported.branchCode
            );

            data.put(
                "installationId",
                imported.installationId
            );

            data.put(
                "controlCenterPublicKeyFingerprint",
                imported.controlCenterFingerprint
            );

            JSObject response =
                new JSObject();

            response.put(
                "success",
                true
            );

            response.put(
                "cancelled",
                false
            );

            response.put(
                "data",
                data
            );

            /*
             * Preserve the full nested data object while also
             * matching the renderer bridge's top-level metadata
             * contract used by Electron.
             */
            response.put(
                "responseId",
                imported.responseId
            );

            response.put(
                "requestId",
                imported.requestId
            );

            response.put(
                "ownerId",
                imported.ownerId
            );

            response.put(
                "businessId",
                imported.businessId
            );

            response.put(
                "branchId",
                imported.branchId
            );

            response.put(
                "businessCode",
                imported.businessCode
            );

            response.put(
                "branchCode",
                imported.branchCode
            );

            response.put(
                "installationId",
                imported.installationId
            );

            response.put(
                "controlCenterPublicKeyFingerprint",
                imported.controlCenterFingerprint
            );

            call.resolve(
                response
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to import the FINORA Installation Enrollment Response."
            );
        }
    }

@PluginMethod
    public void bootstrapRecipientOperationalTrust(
        PluginCall call
    ) {
        if (call == null) {
            return;
        }

        try {
            String issuerId =
                normalizeRequiredString(
                    call.getString(
                        "issuerId"
                    )
                );

            String signingKeyId =
                normalizeRequiredString(
                    call.getString(
                        "signingKeyId"
                    )
                );

            String publicKey =
                normalizeRequiredString(
                    call.getString(
                        "publicKey"
                    )
                );

            String validFrom =
                normalizeRequiredString(
                    call.getString(
                        "validFrom"
                    )
                );

            String expectedPublicKeyFingerprint =
                normalizeRequiredString(
                    call.getString(
                        "expectedPublicKeyFingerprint"
                    )
                );

            if (
                issuerId == null ||
                signingKeyId == null ||
                publicKey == null ||
                validFrom == null ||
                expectedPublicKeyFingerprint == null
            ) {
                JSObject response =
                    new JSObject();

                response.put(
                    "success",
                    false
                );

                response.put(
                    "error",
                    "FINORA recipient trust bootstrap requires issuerId, signingKeyId, publicKey, validFrom and an independently confirmed public-key fingerprint."
                );

                call.resolve(
                    response
                );

                return;
            }

            FinoraRecipientTrustState.TrustedKeyRecord
                trustedKey =
                    new FinoraRecipientTrustState
                        .TrustedKeyRecord(
                            issuerId,
                            signingKeyId,
                            "ECDSA_P256_SHA256",
                            "SPKI_DER_BASE64",
                            publicKey,
                            FinoraRecipientTrustState
                                .STATUS_ACTIVE,
                            validFrom,
                            null
                        );

            FinoraRecipientTrustBootstrapService
                bootstrapService =
                    new FinoraRecipientTrustBootstrapService(
                        new FinoraRecipientTrustStore(
                            getContext()
                        )
                    );

            FinoraRecipientTrustBootstrapService.Result
                result =
                    bootstrapService.bootstrap(
                        new FinoraRecipientTrustBootstrapService
                            .Request(
                                trustedKey,
                                expectedPublicKeyFingerprint
                            )
                    );

            JSObject response =
                new JSObject();

            response.put(
                "success",
                result != null &&
                    result.success
            );

            if (
                result != null &&
                result.success &&
                result.data != null
            ) {
                JSObject data =
                    new JSObject();

                data.put(
                    "issuerId",
                    result.data.issuerId
                );

                data.put(
                    "signingKeyId",
                    result.data.signingKeyId
                );

                data.put(
                    "publicKeyFingerprint",
                    result.data.publicKeyFingerprint
                );

                response.put(
                    "data",
                    data
                );
            }
            else {
                response.put(
                    "error",
                    result != null &&
                        result.error != null
                            ? result.error
                            : "FINORA recipient operational trust bootstrap failed."
                );
            }

            call.resolve(
                response
            );
        }
        catch (Exception error) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA recipient operational trust bootstrap failed."
            );

            call.resolve(
                response
            );
        }
    }
    /*
     * RELEASE-PINNED RECIPIENT TRUST
     *
     * The signing public key and independently confirmed
     * fingerprint below are release trust anchors.
     *
     * The imported DONE package is NOT used to establish trust.
     * The production bootstrap service still validates:
     *
     * - P-256 SPKI public key
     * - SHA-256 fingerprint
     * - canonical signingKeyId
     * - ACTIVE initial key policy
     *
     * Existing recipient trust cannot be replaced here.
     */
    @PluginMethod
    public void bootstrapPinnedRecipientOperationalTrust(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        try {
            FinoraRecipientTrustState.TrustedKeyRecord
                trustedKey =
                    new FinoraRecipientTrustState
                        .TrustedKeyRecord(
                            "FINORA-CC-dc30c0f4-7803-4a7c-ba30-af9f01d9e89d",
                            "FINORA-KEY-6384C74DCF2F1A9232ECE849",
                            "ECDSA_P256_SHA256",
                            "SPKI_DER_BASE64",
                            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEpN5+8+7gNeYB2RyUS2N4wORqsaKRJinBB9LjI2S4sDGlLRov61gHXMDzGxS1W7zf1lHmMfHJ4DBztG9dSQwvoA==",
                            FinoraRecipientTrustState.STATUS_ACTIVE,
                            "2026-09-06T14:32:24.118Z",
                            null
                        );

            FinoraRecipientTrustBootstrapService
                bootstrapService =
                    new FinoraRecipientTrustBootstrapService(
                        new FinoraRecipientTrustStore(
                            getContext()
                        )
                    );

            FinoraRecipientTrustBootstrapService.Result
                result =
                    bootstrapService.bootstrap(
                        new FinoraRecipientTrustBootstrapService
                            .Request(
                                trustedKey,
                                "6384c74dcf2f1a9232ece849bea73f10adf8ef5b2614837e5647de2f135b7e81"
                            )
                    );

            JSObject response =
                new JSObject();

            response.put(
                "success",
                result != null &&
                    result.success
            );

            if (
                result == null ||
                !result.success
            ) {
                response.put(
                    "error",
                    result != null &&
                        result.error != null
                            ? result.error
                            : "FINORA signed recharge trust initialization failed."
                );
            }

            call.resolve(
                response
            );
        }
        catch (Exception error) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA signed recharge trust initialization failed."
            );

            call.resolve(
                response
            );
        }
    }

    @PluginMethod
    public void importAndBootstrapRecipientOperationalTrust(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        String expectedFingerprint =
            normalizeRequiredString(
                call.getString(
                    "expectedPublicKeyFingerprint"
                )
            );

        if (
            expectedFingerprint == null ||
            !expectedFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                "FINORA recipient trust pairing requires the independently confirmed 64-character lowercase SHA-256 fingerprint shown by the unlocked Control Center."
            );

            call.resolve(
                response
            );

            return;
        }

        try {
            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/json"
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "recipientTrustRecordSelected"
            );
        }
        catch (Exception error) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to open the FINORA recipient trust-record selector."
            );

            call.resolve(
                response
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void recipientTrustRecordSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                true
            );

            response.put(
                "cancelled",
                true
            );

            call.resolve(
                response
            );

            return;
        }

        String expectedFingerprint =
            normalizeRequiredString(
                call.getString(
                    "expectedPublicKeyFingerprint"
                )
            );

        if (
            expectedFingerprint == null ||
            !expectedFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "error",
                "FINORA recipient trust pairing fingerprint is invalid."
            );

            call.resolve(
                response
            );

            return;
        }

        try {
            android.content.Intent resultData =
                result.getData();

            android.net.Uri uri =
                resultData == null
                    ? null
                    : resultData.getData();

            if (uri == null) {
                throw new IllegalStateException(
                    "FINORA recipient trust-record import returned no source file."
                );
            }

            java.io.InputStream input =
                getContext()
                    .getContentResolver()
                    .openInputStream(
                        uri
                    );

            if (input == null) {
                throw new IllegalStateException(
                    "FINORA recipient trust-record source could not be opened."
                );
            }

            java.io.ByteArrayOutputStream buffer =
                new java.io.ByteArrayOutputStream();

            byte[] chunk =
                new byte[4096];

            int total =
                0;

            try {
                while (true) {
                    int read =
                        input.read(
                            chunk
                        );

                    if (read < 0) {
                        break;
                    }

                    total +=
                        read;

                    if (total > 65536) {
                        throw new IllegalStateException(
                            "FINORA recipient trust record exceeds the maximum allowed size."
                        );
                    }

                    buffer.write(
                        chunk,
                        0,
                        read
                    );
                }
            }
            finally {
                java.util.Arrays.fill(
                    chunk,
                    (byte) 0
                );

                input.close();
            }

            String serialized =
                new String(
                    buffer.toByteArray(),
                    java.nio.charset.StandardCharsets.UTF_8
                );

            JSONObject record =
                new JSONObject(
                    serialized
                );

            if (
                record.optInt(
                    "schemaVersion",
                    -1
                ) != 1 ||
                !"ECDSA_P256_SHA256".equals(
                    record.optString(
                        "algorithm",
                        ""
                    )
                ) ||
                !"SPKI_DER_BASE64".equals(
                    record.optString(
                        "format",
                        ""
                    )
                ) ||
                !"SHA-256".equals(
                    record.optString(
                        "fingerprintAlgorithm",
                        ""
                    )
                ) ||
                !"ACTIVE".equals(
                    record.optString(
                        "status",
                        ""
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Control Center trust record is invalid."
                );
            }

            String embeddedFingerprint =
                normalizeRequiredString(
                    record.optString(
                        "publicKeyFingerprint",
                        null
                    )
                );

            if (
                embeddedFingerprint == null ||
                !expectedFingerprint.equals(
                    embeddedFingerprint
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Control Center trust-record fingerprint does not match the independently confirmed fingerprint."
                );
            }

            String issuerId =
                normalizeRequiredString(
                    record.getString(
                        "issuerId"
                    )
                );

            String signingKeyId =
                normalizeRequiredString(
                    record.getString(
                        "signingKeyId"
                    )
                );

            String publicKey =
                normalizeRequiredString(
                    record.getString(
                        "publicKey"
                    )
                );

            String validFrom =
                normalizeRequiredString(
                    record.optString(
                        "validFrom",
                        record.optString(
                            "createdAt",
                            null
                        )
                    )
                );

            if (
                issuerId == null ||
                signingKeyId == null ||
                publicKey == null ||
                validFrom == null
            ) {
                throw new IllegalStateException(
                    "FINORA Control Center trust record is incomplete."
                );
            }

            FinoraRecipientTrustState.TrustedKeyRecord
                trustedKey =
                    new FinoraRecipientTrustState
                        .TrustedKeyRecord(
                            issuerId,
                            signingKeyId,
                            "ECDSA_P256_SHA256",
                            "SPKI_DER_BASE64",
                            publicKey,
                            FinoraRecipientTrustState
                                .STATUS_ACTIVE,
                            validFrom,
                            null
                        );

            FinoraRecipientTrustBootstrapService
                bootstrapService =
                    new FinoraRecipientTrustBootstrapService(
                        new FinoraRecipientTrustStore(
                            getContext()
                        )
                    );

            FinoraRecipientTrustBootstrapService.Result
                bootstrapResult =
                    bootstrapService.bootstrap(
                        new FinoraRecipientTrustBootstrapService
                            .Request(
                                trustedKey,
                                expectedFingerprint
                            )
                    );

            JSObject response =
                new JSObject();

            response.put(
                "success",
                bootstrapResult != null &&
                    bootstrapResult.success
            );

            response.put(
                "cancelled",
                false
            );

            if (
                bootstrapResult == null ||
                !bootstrapResult.success
            ) {
                response.put(
                    "error",
                    bootstrapResult != null &&
                        bootstrapResult.error != null
                            ? bootstrapResult.error
                            : "FINORA recipient operational trust bootstrap failed."
                );
            }

            call.resolve(
                response
            );
        }
        catch (Exception error) {
            JSObject response =
                new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "cancelled",
                false
            );

            response.put(
                "error",
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA recipient trust-record import failed."
            );

            call.resolve(
                response
            );
        }
    }

    @PluginMethod
    public void getInstallation(
        PluginCall call
    ) {
        try {
            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {
                resolveSuccess(
                    call
                );

                return;
            }

            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (installation == null) {
                resolveSuccess(
                    call
                );

                return;
            }

            JSObject result =
                createSuccessResult();

            result.put(
                "data",
                installation
            );

            call.resolve(
                result
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                error,
                "Unable to read FINORA installation identity."
            );
        }
    }

    // ========================================================
    // FIND BRANCH ACTIVATION
    // ========================================================

    /**
     * Find activation state for one Owner / Business / Branch.
     */
    @PluginMethod
    public void findBranchActivation(
        PluginCall call
    ) {
        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        if (
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {
            resolveFailure(
                call,
                "Owner ID, Business ID and Branch ID are required."
            );

            return;
        }

        try {
            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {
                resolveSuccess(
                    call
                );

                return;
            }

            JSONArray activations =
                controlPackage.getJSONArray(
                    "activations"
                );

            android.util.Log.i(
                "FINORA_ACTIVATION_DIAG",
                "REQUEST owner=" + ownerId +
                " business=" + businessId +
                " branch=" + branchId +
                " activationCount=" + activations.length()
            );

            JSONArray appliedPackages =
                controlPackage.optJSONArray(
                    "appliedControlPackages"
                );

            if (appliedPackages != null) {
                for (
                    int appliedIndex = 0;
                    appliedIndex < appliedPackages.length();
                    appliedIndex++
                ) {
                    JSONObject applied =
                        appliedPackages.optJSONObject(
                            appliedIndex
                        );

                    if (
                        applied != null &&
                        "BRANCH_ACTIVATION".equals(
                            applied.optString(
                                "purpose",
                                ""
                            )
                        )
                    ) {
                        android.util.Log.i(
                            "FINORA_ACTIVATION_DIAG",
                            "LEDGER package=" +
                                applied.optString("packageId", "") +
                            " owner=" +
                                applied.optString("ownerId", "") +
                            " business=" +
                                applied.optString("businessId", "") +
                            " branch=" +
                                applied.optString("branchId", "") +
                            " installation=" +
                                applied.optString("installationId", "") +
                            " sequence=" +
                                applied.optLong("sequence", -1L)
                        );
                    }
                }
            }

            for (
                int index = 0;
                index < activations.length();
                index++
            ) {
                JSONObject activation =
                    activations.getJSONObject(
                        index
                    );

                android.util.Log.i(
                    "FINORA_ACTIVATION_DIAG",
                    "ACTIVATION index=" + index +
                    " activationId=" +
                        activation.optString("activationId", "") +
                    " owner=" +
                        activation.optString("ownerId", "") +
                    " business=" +
                        activation.optString("businessId", "") +
                    " branch=" +
                        activation.optString("branchId", "") +
                    " status=" +
                        activation.optString("status", "")
                );

                if (
                    ownerId.equals(
                        activation.getString(
                            "ownerId"
                        )
                    ) &&
                    businessId.equals(
                        activation.getString(
                            "businessId"
                        )
                    ) &&
                    branchId.equals(
                        activation.getString(
                            "branchId"
                        )
                    )
                ) {
                    JSObject result =
                        createSuccessResult();

                    result.put(
                        "data",
                        activation
                    );

                    call.resolve(
                        result
                    );

                    return;
                }
            }

            resolveSuccess(
                call
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                error,
                "Unable to read FINORA branch activation."
            );
        }
    }

        // ========================================================
    // FIND BRANCH ACCESS GRANT
    // ========================================================
    // FIND BUSINESS PROFILE
    // ========================================================

    /**
     * Read the signed FINORA Business / Branch Profile for one
     * exact Owner / Business / Branch scope.
     *
     * SECURITY:
     *
     * - READ ONLY.
     * - No profile creation.
     * - No profile mutation.
     * - No signed package apply authority.
     * - No signing authority.
     * - Scope must match the installed branch.
     * - Persisted native-binding metadata must match the current
     *   AndroidKeyStore-backed installation binding.
     * - Renderer receives only sanitized profile fields.
     */
    @PluginMethod
    public void findBusinessProfile(
        PluginCall call
    ) {

        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        if (
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {

            resolveFailure(
                call,
                "Owner ID, Business ID and Branch ID are required."
            );

            return;
        }


        try {

            // ------------------------------------------------
            // AUTHORITATIVE ENCRYPTED CONTROL STATE
            // ------------------------------------------------

            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // INSTALLED BRANCH SCOPE
            // ------------------------------------------------

            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (
                installation == null ||
                !isValidInstallation(
                    installation
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is required before reading the Business Profile."
                );

                return;
            }

            String installationId =
                normalizeRequiredString(
                    installation.optString(
                        "installationId",
                        null
                    )
                );

            String installedOwnerId =
                normalizeRequiredString(
                    installation.optString(
                        "ownerId",
                        null
                    )
                );

            String installedBusinessId =
                normalizeRequiredString(
                    installation.optString(
                        "businessId",
                        null
                    )
                );

            String installedBranchId =
                normalizeRequiredString(
                    installation.optString(
                        "branchId",
                        null
                    )
                );

            if (
                installationId == null ||
                installedOwnerId == null ||
                installedBusinessId == null ||
                installedBranchId == null
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is invalid."
                );

                return;
            }

            if (
                !ownerId.equals(
                    installedOwnerId
                ) ||
                !businessId.equals(
                    installedBusinessId
                ) ||
                !branchId.equals(
                    installedBranchId
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA Business Profile request does not match the installed branch."
                );

                return;
            }

            // ------------------------------------------------
            // SIMPLE PORTABILITY
            //
            // The signed installation record remains evidence
            // for the provisioned branch, but current Android
            // device identity is not an ordinary login or
            // Business Profile authorization gate.
            //
            // Exact Owner / Business / Branch scope remains
            // mandatory below.
            // ------------------------------------------------


            // ------------------------------------------------
            // LEGACY STORE WITHOUT BUSINESS PROFILE
            // ------------------------------------------------

            JSONArray businessProfiles =
                controlPackage.optJSONArray(
                    "businessProfiles"
                );

            if (businessProfiles == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // EXACT PROFILE LOOKUP
            // ------------------------------------------------

            for (
                int index = 0;
                index < businessProfiles.length();
                index++
            ) {

                JSONObject profile =
                    businessProfiles.getJSONObject(
                        index
                    );

                boolean scopeMatches =
                    ownerId.equals(
                        profile.getString(
                            "ownerId"
                        )
                    ) &&
                    businessId.equals(
                        profile.getString(
                            "businessId"
                        )
                    ) &&
                    branchId.equals(
                        profile.getString(
                            "branchId"
                        )
                    );

                if (!scopeMatches) {
                    continue;
                }

                // --------------------------------------------
                // HISTORICAL BINDING EVIDENCE
                //
                // installationId / bindingKeyId / fingerprint
                // fields remain signed historical evidence.
                //
                // They are deliberately not compared with the
                // current Android device for ordinary portable
                // authentication or Business Profile loading.
                // --------------------------------------------


                // --------------------------------------------
                // OPTIONAL INSTALLATION NUMBERING CODES
                // --------------------------------------------

                String installedBusinessCode =
                    normalizeRequiredString(
                        installation.optString(
                            "businessCode",
                            null
                        )
                    );

                String installedBranchCode =
                    normalizeRequiredString(
                        installation.optString(
                            "branchCode",
                            null
                        )
                    );

                String profileBusinessCode =
                    normalizeRequiredString(
                        profile.optString(
                            "businessCode",
                            null
                        )
                    );

                String profileBranchCode =
                    normalizeRequiredString(
                        profile.optString(
                            "branchCode",
                            null
                        )
                    );

                if (
                    (
                        installedBusinessCode == null
                    ) !=
                    (
                        installedBranchCode == null
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA installation numbering-code state is inconsistent."
                    );

                    return;
                }

                if (
                    installedBusinessCode != null &&
                    (
                        !installedBusinessCode.equals(
                            profileBusinessCode
                        ) ||
                        !installedBranchCode.equals(
                            profileBranchCode
                        )
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA Business Profile numbering codes do not match the installation identity."
                    );

                    return;
                }


                // --------------------------------------------
                // SANITIZED READ-ONLY RENDERER VIEW
                //
                // Deliberately excludes:
                //
                // installationId
                // bindingKeyId
                // fingerprintAlgorithm
                // publicKeyFingerprint
                // --------------------------------------------

                JSObject data =
                    new JSObject();

                data.put(
                    "profileId",
                    profile.getString(
                        "profileId"
                    )
                );

                data.put(
                    "ownerId",
                    profile.getString(
                        "ownerId"
                    )
                );

                data.put(
                    "businessId",
                    profile.getString(
                        "businessId"
                    )
                );

                data.put(
                    "branchId",
                    profile.getString(
                        "branchId"
                    )
                );

                data.put(
                    "businessCode",
                    profile.getString(
                        "businessCode"
                    )
                );

                data.put(
                    "branchCode",
                    profile.getString(
                        "branchCode"
                    )
                );

                data.put(
                    "businessName",
                    profile.getString(
                        "businessName"
                    )
                );

                data.put(
                    "branchName",
                    profile.getString(
                        "branchName"
                    )
                );

                data.put(
                    "createdAt",
                    profile.getString(
                        "createdAt"
                    )
                );

                data.put(
                    "updatedAt",
                    profile.getString(
                        "updatedAt"
                    )
                );

                data.put(
                    "schemaVersion",
                    profile.get(
                        "schemaVersion"
                    )
                );


                JSObject result =
                    createSuccessResult();

                result.put(
                    "data",
                    data
                );

                call.resolve(
                    result
                );

                return;
            }


            // ------------------------------------------------
            // NO PROFILE FOR EXACT INSTALLED SCOPE
            // ------------------------------------------------

            resolveSuccess(
                call
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to read FINORA Business Profile."
            );
        }
    }

    // ========================================================

    /**
     * Find the signed REGISTERED / DEMO access grant for one
     * authenticated FINORA login identity.
     *
     * READ ONLY:
     *
     * - No grant creation.
     * - No grant mutation.
     * - No signed control-package apply authority.
     * - Runtime expiry evaluation remains in the shared
     *   renderer Branch Access evaluator using system time.
     */
    // ========================================================
    // FIND PRICING POLICY
    // ========================================================
    // FIND PORTABLE BUSINESS PROFILE
    // ========================================================

    /**
     * Read the signed FINORA Business / Branch Profile through
     * one already-authenticated opaque login session.
     *
     * SECURITY:
     *
     * - Renderer supplies only sessionId.
     * - Native session authority resolves branch scope.
     * - Exact Owner / Business / Branch scope is mandatory.
     * - Historical installation-binding fields remain evidence.
     * - Current Android device binding is not an ordinary
     *   portable login / Business Profile authorization gate.
     * - Renderer receives only sanitized profile fields.
     *
     * READ ONLY.
     */
    @PluginMethod
    public void findPortableBusinessProfile(
        PluginCall call
    ) {

        if (loginSessionAuthority == null) {

            resolveFailure(
                call,
                "FINORA secure login session authority is unavailable."
            );

            return;
        }

        String sessionId =
            normalizeRequiredString(
                call.getString(
                    "sessionId"
                )
            );

        if (sessionId == null) {

            resolveFailure(
                call,
                "A valid FINORA portable Business Profile session is required."
            );

            return;
        }

        FinoraBranchLoginSessionAuthority.SessionResult sessionResult =
            loginSessionAuthority.validate(
                sessionId
            );

        if (
            !sessionResult.success ||
            sessionResult.data == null
        ) {

            resolveLoginSessionFailure(
                call,
                sessionResult.errorCode,
                sessionResult.error
            );

            return;
        }

        String ownerId =
            normalizeRequiredString(
                sessionResult.data.ownerId
            );

        String businessId =
            normalizeRequiredString(
                sessionResult.data.businessId
            );

        String branchId =
            normalizeRequiredString(
                sessionResult.data.branchId
            );

        if (
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {

            resolveFailure(
                call,
                "The authenticated FINORA session does not contain a valid branch scope."
            );

            return;
        }

        try {

            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {




                resolveSuccess(
                    call
                );

                return;
            }

            // ------------------------------------------------
            // LOGICAL INSTALLED BRANCH SCOPE
            // ------------------------------------------------

            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (
                installation == null ||
                !isValidInstallation(
                    installation
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is required before reading the portable Business Profile."
                );

                return;
            }

            String installedOwnerId =
                normalizeRequiredString(
                    installation.optString(
                        "ownerId",
                        null
                    )
                );

            String installedBusinessId =
                normalizeRequiredString(
                    installation.optString(
                        "businessId",
                        null
                    )
                );

            String installedBranchId =
                normalizeRequiredString(
                    installation.optString(
                        "branchId",
                        null
                    )
                );

            if (
                installedOwnerId == null ||
                installedBusinessId == null ||
                installedBranchId == null
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is invalid."
                );

                return;
            }

            if (
                !ownerId.equals(
                    installedOwnerId
                ) ||
                !businessId.equals(
                    installedBusinessId
                ) ||
                !branchId.equals(
                    installedBranchId
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA portable Business Profile request does not match the authenticated branch scope."
                );

                return;
            }

            JSONArray businessProfiles =
                controlPackage.optJSONArray(
                    "businessProfiles"
                );

            if (businessProfiles == null) {




                resolveSuccess(
                    call
                );

                return;
            }


            for (
                int index = 0;
                index < businessProfiles.length();
                index++
            ) {

                JSONObject profile =
                    businessProfiles.getJSONObject(
                        index
                    );

                boolean scopeMatches =
                    ownerId.equals(
                        profile.getString(
                            "ownerId"
                        )
                    ) &&
                    businessId.equals(
                        profile.getString(
                            "businessId"
                        )
                    ) &&
                    branchId.equals(
                        profile.getString(
                            "branchId"
                        )
                    );

                if (!scopeMatches) {
                    continue;
                }


                // --------------------------------------------
                // HISTORICAL BINDING EVIDENCE
                //
                // installationId / bindingKeyId / fingerprint
                // remain signed historical evidence only.
                // They are not rebound to this Android device.
                // --------------------------------------------

                String installedBusinessCode =
                    normalizeRequiredString(
                        installation.optString(
                            "businessCode",
                            null
                        )
                    );

                String installedBranchCode =
                    normalizeRequiredString(
                        installation.optString(
                            "branchCode",
                            null
                        )
                    );

                String profileBusinessCode =
                    normalizeRequiredString(
                        profile.optString(
                            "businessCode",
                            null
                        )
                    );

                String profileBranchCode =
                    normalizeRequiredString(
                        profile.optString(
                            "branchCode",
                            null
                        )
                    );

                if (
                    (
                        installedBusinessCode == null
                    ) !=
                    (
                        installedBranchCode == null
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA installation numbering-code state is inconsistent."
                    );

                    return;
                }

                if (
                    installedBusinessCode != null &&
                    (
                        !installedBusinessCode.equals(
                            profileBusinessCode
                        ) ||
                        !installedBranchCode.equals(
                            profileBranchCode
                        )
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA portable Business Profile numbering codes do not match the installation identity."
                    );

                    return;
                }

                JSObject data =
                    new JSObject();

                data.put(
                    "profileId",
                    profile.getString(
                        "profileId"
                    )
                );

                data.put(
                    "ownerId",
                    profile.getString(
                        "ownerId"
                    )
                );

                data.put(
                    "businessId",
                    profile.getString(
                        "businessId"
                    )
                );

                data.put(
                    "branchId",
                    profile.getString(
                        "branchId"
                    )
                );

                data.put(
                    "businessCode",
                    profile.getString(
                        "businessCode"
                    )
                );

                data.put(
                    "branchCode",
                    profile.getString(
                        "branchCode"
                    )
                );

                data.put(
                    "businessName",
                    profile.getString(
                        "businessName"
                    )
                );

                data.put(
                    "branchName",
                    profile.getString(
                        "branchName"
                    )
                );

                data.put(
                    "createdAt",
                    profile.getString(
                        "createdAt"
                    )
                );

                data.put(
                    "updatedAt",
                    profile.getString(
                        "updatedAt"
                    )
                );

                data.put(
                    "schemaVersion",
                    profile.get(
                        "schemaVersion"
                    )
                );

                JSObject result =
                    createSuccessResult();

                result.put(
                    "data",
                    data
                );

                call.resolve(
                    result
                );

                return;
            }


            resolveSuccess(
                call
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to read authenticated FINORA portable Business Profile."
            );
        }
    }

    // ========================================================

    /**
     * Read the authoritative verified FINORA Pricing Override
     * schedule for one exact installed branch scope.
     *
     * SECURITY:
     *
     * - READ ONLY.
     * - No Pricing Policy creation.
     * - No Pricing Policy replacement.
     * - No signed package apply authority.
     * - No signing authority.
     * - Scope must match the installed branch.
     * - Persisted native-binding metadata must match the current
     *   AndroidKeyStore-backed installation binding.
     * - Renderer receives only override-set pricing data.
     */
    @PluginMethod
    public void findPricingPolicy(
        PluginCall call
    ) {

        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        if (
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {

            resolveFailure(
                call,
                "Owner ID, Business ID and Branch ID are required."
            );

            return;
        }


        try {

            // ------------------------------------------------
            // AUTHORITATIVE ENCRYPTED CONTROL STATE
            // ------------------------------------------------

            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // INSTALLED BRANCH SCOPE
            // ------------------------------------------------

            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (
                installation == null ||
                !isValidInstallation(
                    installation
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is required before reading the Pricing Policy."
                );

                return;
            }

            String installationId =
                normalizeRequiredString(
                    installation.optString(
                        "installationId",
                        null
                    )
                );

            String installedOwnerId =
                normalizeRequiredString(
                    installation.optString(
                        "ownerId",
                        null
                    )
                );

            String installedBusinessId =
                normalizeRequiredString(
                    installation.optString(
                        "businessId",
                        null
                    )
                );

            String installedBranchId =
                normalizeRequiredString(
                    installation.optString(
                        "branchId",
                        null
                    )
                );

            if (
                installationId == null ||
                installedOwnerId == null ||
                installedBusinessId == null ||
                installedBranchId == null
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is invalid."
                );

                return;
            }

            if (
                !ownerId.equals(
                    installedOwnerId
                ) ||
                !businessId.equals(
                    installedBusinessId
                ) ||
                !branchId.equals(
                    installedBranchId
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA Pricing Policy request does not match the installation identity."
                );

                return;
            }


            // ------------------------------------------------
            // CURRENT ANDROID NATIVE INSTALLATION BINDING
            // ------------------------------------------------

            if (installationBindingService == null) {

                resolveFailure(
                    call,
                    "FINORA installation binding service is unavailable."
                );

                return;
            }

            FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                installationBindingService.get();

            if (nativeBinding == null) {

                resolveFailure(
                    call,
                    "FINORA Android native installation binding is required before reading the Pricing Policy."
                );

                return;
            }

            if (
                !installationId.equals(
                    nativeBinding.installationId
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA native installation binding does not match the Control Store installation identity."
                );

                return;
            }


            // ------------------------------------------------
            // AUTHORITATIVE PRICING POLICY COLLECTION
            //
            // Legacy Control Stores may not contain this field.
            // ------------------------------------------------

            JSONArray pricingPolicies =
                controlPackage.optJSONArray(
                    "pricingPolicies"
                );

            if (pricingPolicies == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            JSONObject selectedPolicy =
                null;

            for (
                int index = 0;
                index < pricingPolicies.length();
                index++
            ) {

                JSONObject policy =
                    pricingPolicies.optJSONObject(
                        index
                    );

                if (
                    policy == null ||
                    !isValidPricingPolicy(
                        policy
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA Pricing Policy state is invalid."
                    );

                    return;
                }

                String policyOwnerId =
                    normalizeRequiredString(
                        policy.optString(
                            "ownerId",
                            null
                        )
                    );

                String policyBusinessId =
                    normalizeRequiredString(
                        policy.optString(
                            "businessId",
                            null
                        )
                    );

                String policyBranchId =
                    normalizeRequiredString(
                        policy.optString(
                            "branchId",
                            null
                        )
                    );

                String policyInstallationId =
                    normalizeRequiredString(
                        policy.optString(
                            "installationId",
                            null
                        )
                    );

                if (
                    ownerId.equals(
                        policyOwnerId
                    ) &&
                    businessId.equals(
                        policyBusinessId
                    ) &&
                    branchId.equals(
                        policyBranchId
                    ) &&
                    installationId.equals(
                        policyInstallationId
                    )
                ) {

                    selectedPolicy =
                        policy;

                    break;
                }
            }

            if (selectedPolicy == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // DEFENCE-IN-DEPTH NATIVE BINDING CONSISTENCY
            // ------------------------------------------------

            String policyBindingKeyId =
                normalizeRequiredString(
                    selectedPolicy.optString(
                        "bindingKeyId",
                        null
                    )
                );

            String policyFingerprintAlgorithm =
                normalizeRequiredString(
                    selectedPolicy.optString(
                        "fingerprintAlgorithm",
                        null
                    )
                );

            String policyPublicKeyFingerprint =
                normalizeRequiredString(
                    selectedPolicy.optString(
                        "publicKeyFingerprint",
                        null
                    )
                );

            if (
                policyBindingKeyId == null ||
                !"SHA-256".equals(
                    policyFingerprintAlgorithm
                ) ||
                policyPublicKeyFingerprint == null ||
                !nativeBinding.bindingKeyId.equals(
                    policyBindingKeyId
                ) ||
                !nativeBinding.publicKeyFingerprint.equals(
                    policyPublicKeyFingerprint
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA Pricing Policy native installation binding is inconsistent."
                );

                return;
            }


            // ------------------------------------------------
            // SANITIZED RENDERER RESPONSE
            //
            // Do NOT expose:
            //
            // - installationId
            // - bindingKeyId
            // - fingerprintAlgorithm
            // - publicKeyFingerprint
            // - issuedAt
            // ------------------------------------------------

            JSObject data =
                new JSObject();

            data.put(
                "overrideSetId",
                selectedPolicy.getString(
                    "overrideSetId"
                )
            );

            JSObject scope =
                new JSObject();

            scope.put(
                "ownerId",
                selectedPolicy.getString(
                    "ownerId"
                )
            );

            scope.put(
                "businessId",
                selectedPolicy.getString(
                    "businessId"
                )
            );

            scope.put(
                "branchId",
                selectedPolicy.getString(
                    "branchId"
                )
            );

            data.put(
                "scope",
                scope
            );


            JSONArray persistedOverrides =
                selectedPolicy.getJSONArray(
                    "overrides"
                );

            JSONArray rendererOverrides =
                new JSONArray();

            for (
                int index = 0;
                index < persistedOverrides.length();
                index++
            ) {

                JSONObject persistedRule =
                    persistedOverrides.getJSONObject(
                        index
                    );

                JSONObject rendererRule =
                    new JSONObject();

                rendererRule.put(
                    "overrideId",
                    persistedRule.getString(
                        "overrideId"
                    )
                );

                rendererRule.put(
                    "chargeCode",
                    persistedRule.getString(
                        "chargeCode"
                    )
                );

                rendererRule.put(
                    "model",
                    persistedRule.getString(
                        "model"
                    )
                );

                rendererRule.put(
                    "amount",
                    persistedRule.getDouble(
                        "amount"
                    )
                );

                rendererRule.put(
                    "currency",
                    persistedRule.getString(
                        "currency"
                    )
                );

                JSONObject validity =
                    new JSONObject();

                validity.put(
                    "validFrom",
                    persistedRule.getString(
                        "validFrom"
                    )
                );

                validity.put(
                    "validUntil",
                    persistedRule.getString(
                        "validUntil"
                    )
                );

                rendererRule.put(
                    "validity",
                    validity
                );

                rendererRule.put(
                    "schemaVersion",
                    1
                );

                rendererOverrides.put(
                    rendererRule
                );
            }

            data.put(
                "overrides",
                rendererOverrides
            );

            data.put(
                "schemaVersion",
                1
            );

            call.resolve(
                data
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to read FINORA Pricing Policy."
            );
        }
    }

    // ========================================================
    // FIND VERIFIED WALLET RECHARGE AUTHORIZATION
    // ========================================================

    /**
     * Read one previously verified signed Wallet Recharge
     * authorization for the exact installed branch scope and
     * paymentReference.
     *
     * SECURITY:
     *
     * - READ ONLY.
     * - No signed-package apply authority.
     * - No signing authority.
     * - No Wallet balance mutation.
     * - No raw signature exposure.
     * - No trusted-key exposure.
     * - No installation binding metadata exposure.
     * - Native binding consistency is checked before release.
     */
    @PluginMethod
    public void findWalletRechargeAuthorization(
        PluginCall call
    ) {

        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        String paymentReference =
            normalizeRequiredString(
                call.getString(
                    "paymentReference"
                )
            );

        if (
            ownerId == null ||
            businessId == null ||
            branchId == null ||
            paymentReference == null
        ) {

            resolveFailure(
                call,
                "Owner ID, Business ID, Branch ID and Payment Reference are required."
            );

            return;
        }

        try {

            // ------------------------------------------------
            // AUTHORITATIVE ENCRYPTED CONTROL STATE
            // ------------------------------------------------

            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // INSTALLED BRANCH IDENTITY
            // ------------------------------------------------

            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (
                installation == null ||
                !isValidInstallation(
                    installation
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is required before reading a Wallet Recharge authorization."
                );

                return;
            }

            String installationId =
                normalizeRequiredString(
                    installation.optString(
                        "installationId",
                        null
                    )
                );

            String installedOwnerId =
                normalizeRequiredString(
                    installation.optString(
                        "ownerId",
                        null
                    )
                );

            String installedBusinessId =
                normalizeRequiredString(
                    installation.optString(
                        "businessId",
                        null
                    )
                );

            String installedBranchId =
                normalizeRequiredString(
                    installation.optString(
                        "branchId",
                        null
                    )
                );

            if (
                installationId == null ||
                installedOwnerId == null ||
                installedBusinessId == null ||
                installedBranchId == null
            ) {

                resolveFailure(
                    call,
                    "FINORA installation identity is invalid."
                );

                return;
            }

            if (
                !ownerId.equals(
                    installedOwnerId
                ) ||
                !businessId.equals(
                    installedBusinessId
                ) ||
                !branchId.equals(
                    installedBranchId
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA Wallet Recharge authorization request does not match the installation identity."
                );

                return;
            }


            // ------------------------------------------------
            // CURRENT ANDROID NATIVE INSTALLATION BINDING
            // ------------------------------------------------

            if (installationBindingService == null) {

                resolveFailure(
                    call,
                    "FINORA installation binding service is unavailable."
                );

                return;
            }

            FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                installationBindingService.get();

            if (nativeBinding == null) {

                resolveFailure(
                    call,
                    "FINORA Android native installation binding is required before reading a Wallet Recharge authorization."
                );

                return;
            }

            /*
             * PORTABLE WALLET RECHARGE READ
             *
             * Current Android native binding is still required.
             *
             * The persisted Control Store installationId may belong
             * to a historical authorized device, so Wallet Recharge
             * authorization lookup does not require that historical
             * installationId to equal this current device.
             *
             * Exact business scope, payment reference, trusted DONE
             * verification and authorization binding integrity remain
             * mandatory.
             */


            // ------------------------------------------------
            // VERIFIED RECHARGE AUTHORIZATION COLLECTION
            //
            // Legacy Control Stores may not contain this field.
            // ------------------------------------------------

            JSONArray authorizations =
                controlPackage.optJSONArray(
                    "walletRechargeAuthorizations"
                );

            if (authorizations == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // EXACT SCOPE + PAYMENT REFERENCE LOOKUP
            // ------------------------------------------------

            JSONObject selectedAuthorization =
                null;

            for (
                int index = 0;
                index < authorizations.length();
                index++
            ) {

                JSONObject authorization =
                    authorizations.optJSONObject(
                        index
                    );

                if (
                    authorization == null ||
                    !isValidWalletRechargeAuthorization(
                        authorization
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA Wallet Recharge authorization state is invalid."
                    );

                    return;
                }

                String authorizationOwnerId =
                    normalizeRequiredString(
                        authorization.optString(
                            "ownerId",
                            null
                        )
                    );

                String authorizationBusinessId =
                    normalizeRequiredString(
                        authorization.optString(
                            "businessId",
                            null
                        )
                    );

                String authorizationBranchId =
                    normalizeRequiredString(
                        authorization.optString(
                            "branchId",
                            null
                        )
                    );

                String authorizationInstallationId =
                    normalizeRequiredString(
                        authorization.optString(
                            "installationId",
                            null
                        )
                    );

                String authorizationPaymentReference =
                    normalizeRequiredString(
                        authorization.optString(
                            "paymentReference",
                            null
                        )
                    );

                if (
                    ownerId.equals(
                        authorizationOwnerId
                    ) &&
                    businessId.equals(
                        authorizationBusinessId
                    ) &&
                    branchId.equals(
                        authorizationBranchId
                    ) &&
                    paymentReference.equals(
                        authorizationPaymentReference
                    )
                ) {

                    selectedAuthorization =
                        authorization;

                    break;
                }
            }

            if (selectedAuthorization == null) {

                resolveSuccess(
                    call
                );

                return;
            }


            // ------------------------------------------------
            // DEFENCE-IN-DEPTH NATIVE BINDING CONSISTENCY
            // ------------------------------------------------

            String authorizationBindingKeyId =
                normalizeRequiredString(
                    selectedAuthorization.optString(
                        "bindingKeyId",
                        null
                    )
                );

            String authorizationFingerprintAlgorithm =
                normalizeRequiredString(
                    selectedAuthorization.optString(
                        "fingerprintAlgorithm",
                        null
                    )
                );

            String authorizationPublicKeyFingerprint =
                normalizeRequiredString(
                    selectedAuthorization.optString(
                        "publicKeyFingerprint",
                        null
                    )
                );

            /*
             * Portable verified Wallet authorization:
             *
             * The historical installation binding belongs to the
             * device that created the original Recharge request.
             *
             * It remains structurally/internally validated, but is
             * deliberately NOT compared with this current device.
             *
             * The signed DONE import already established package
             * authenticity and exact owner/business/branch scope.
             */
            if (
                authorizationBindingKeyId == null ||
                !"SHA-256".equals(
                    authorizationFingerprintAlgorithm
                ) ||
                authorizationPublicKeyFingerprint == null ||
                !bindingKeyMatchesProfileFingerprint(
                    authorizationBindingKeyId,
                    authorizationPublicKeyFingerprint
                )
            ) {

                resolveFailure(
                    call,
                    "FINORA Wallet Recharge authorization binding metadata is invalid."
                );

                return;
            }


            // ------------------------------------------------
            // SANITIZED RENDERER RESPONSE
            //
            // Deliberately NOT exposed:
            //
            // - installationId
            // - bindingKeyId
            // - fingerprintAlgorithm
            // - publicKeyFingerprint
            // - raw signed package
            // - payloadDigest
            // - signature
            // - trusted public keys
            // ------------------------------------------------

            JSObject data =
                new JSObject();

            data.put(
                "packageId",
                selectedAuthorization.getString(
                    "packageId"
                )
            );

            data.put(
                "issuerId",
                selectedAuthorization.getString(
                    "issuerId"
                )
            );

            data.put(
                "signingKeyId",
                selectedAuthorization.getString(
                    "signingKeyId"
                )
            );

            data.put(
                "purpose",
                "WALLET_RECHARGE"
            );

            data.put(
                "sequence",
                selectedAuthorization.getLong(
                    "sequence"
                )
            );

            JSObject scope =
                new JSObject();

            scope.put(
                "ownerId",
                selectedAuthorization.getString(
                    "ownerId"
                )
            );

            scope.put(
                "businessId",
                selectedAuthorization.getString(
                    "businessId"
                )
            );

            scope.put(
                "branchId",
                selectedAuthorization.getString(
                    "branchId"
                )
            );

            data.put(
                "scope",
                scope
            );

            data.put(
                "paymentReference",
                selectedAuthorization.getString(
                    "paymentReference"
                )
            );

            data.put(
                "amountMinor",
                selectedAuthorization.getLong(
                    "amountMinor"
                )
            );

            data.put(
                "currency",
                selectedAuthorization.getString(
                    "currency"
                )
            );

            data.put(
                "paymentMethod",
                selectedAuthorization.getString(
                    "paymentMethod"
                )
            );

            data.put(
                "paymentSource",
                selectedAuthorization.getString(
                    "paymentSource"
                )
            );

            if (
                selectedAuthorization.has(
                    "providerOrderId"
                )
            ) {

                data.put(
                    "providerOrderId",
                    selectedAuthorization.getString(
                        "providerOrderId"
                    )
                );
            }

            if (
                selectedAuthorization.has(
                    "providerTransactionId"
                )
            ) {

                data.put(
                    "providerTransactionId",
                    selectedAuthorization.getString(
                        "providerTransactionId"
                    )
                );
            }

            data.put(
                "issuedAt",
                selectedAuthorization.getString(
                    "issuedAt"
                )
            );

            data.put(
                "verifiedAt",
                selectedAuthorization.getString(
                    "verifiedAt"
                )
            );

            data.put(
                "schemaVersion",
                1
            );

            JSObject result =
                createSuccessResult();

            result.put(
                "data",
                data
            );

            call.resolve(
                result
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error,
                "Unable to read FINORA Wallet Recharge authorization."
            );
        }
    }

    // ========================================================
    // AUTHORITATIVE BRANCH ACCESS EVALUATION
    // ========================================================

    @PluginMethod
    public void evaluateBranchAccess(
        PluginCall call
    ) {
        String userId =
            normalizeRequiredString(
                call.getString("userId")
            );

        String ownerId =
            normalizeRequiredString(
                call.getString("ownerId")
            );

        String businessId =
            normalizeRequiredString(
                call.getString("businessId")
            );

        String branchId =
            normalizeRequiredString(
                call.getString("branchId")
            );

        if (
            userId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {
            JSObject invalid = new JSObject();
            invalid.put("success", false);
            invalid.put("errorCode", "INVALID_REQUEST");
            invalid.put(
                "error",
                "User ID, Owner ID, Business ID and Branch ID are required."
            );
            call.resolve(invalid);
            return;
        }

        if (branchAccessRuntimeAuthority == null) {
            JSObject unavailable = new JSObject();
            unavailable.put("success", false);
            unavailable.put("errorCode", "CONTROL_STORE_FAILED");
            unavailable.put(
                "error",
                "FINORA authoritative Branch Access service is unavailable."
            );
            call.resolve(unavailable);
            return;
        }

        FinoraBranchAccessRuntimeAuthority.Result result =
            branchAccessRuntimeAuthority.evaluate(
                userId,
                ownerId,
                businessId,
                branchId
            );

        if (!result.success) {
            JSObject failure = new JSObject();
            failure.put("success", false);

            if (result.errorCode != null) {
                failure.put("errorCode", result.errorCode);
            }

            if (result.clockErrorCode != null) {
                failure.put("clockErrorCode", result.clockErrorCode);
            }

            failure.put(
                "error",
                result.error == null
                    ? "Unable to evaluate authoritative FINORA Branch Access."
                    : result.error
            );

            call.resolve(failure);
            return;
        }


        JSObject decision = new JSObject();
        decision.put("allowed", result.data.allowed);
        decision.put("state", result.data.state);
        decision.put("reason", result.data.reason);
        decision.put("observedAt", result.data.observedAt);

        boolean signedGrantAttached =
            false;

        try {
            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage != null) {
                JSONArray grants =
                    controlPackage.optJSONArray(
                        "branchAccessGrants"
                    );

                if (grants != null) {
                    for (
                        int index = 0;
                        index < grants.length();
                        index++
                    ) {
                        JSONObject grant =
                            grants.getJSONObject(
                                index
                            );

                        if (
                            userId.equals(
                                grant.getString(
                                    "userId"
                                )
                            ) &&
                            ownerId.equals(
                                grant.getString(
                                    "ownerId"
                                )
                            ) &&
                            businessId.equals(
                                grant.getString(
                                    "businessId"
                                )
                            ) &&
                            branchId.equals(
                                grant.getString(
                                    "branchId"
                                )
                            )
                        ) {
                            decision.put(
                                "grant",
                                grant
                            );

                            signedGrantAttached =
                                true;


                            break;
                        }
                    }
                }
            }
        } catch (Exception error) {

            JSObject failure =
                new JSObject();

            failure.put(
                "success",
                false
            );

            failure.put(
                "errorCode",
                "CONTROL_STORE_FAILED"
            );

            failure.put(
                "error",
                "Unable to resolve the signed FINORA Branch Access Grant."
            );

            call.resolve(
                failure
            );

            return;
        }

        if (!signedGrantAttached) {
        }

        JSObject response = createSuccessResult();
        response.put("data", decision);
        call.resolve(response);
    }

    @PluginMethod
    public void findBranchAccessGrant(
        PluginCall call
    ) {
        String userId =
            normalizeRequiredString(
                call.getString(
                    "userId"
                )
            );

        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        if (
            userId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {
            resolveFailure(
                call,
                "User ID, Owner ID, Business ID and Branch ID are required."
            );

            return;
        }

        try {
            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {
                resolveSuccess(
                    call
                );

                return;
            }

            JSONArray grants =
                controlPackage.optJSONArray(
                    "branchAccessGrants"
                );

            /*
             * Legacy Control Stores may not yet contain the
             * Branch Access collection.
             *
             * Returning success with undefined data causes the
             * shared runtime evaluator to fail closed as MISSING.
             */
            if (grants == null) {
                resolveSuccess(
                    call
                );

                return;
            }

            for (
                int index = 0;
                index < grants.length();
                index++
            ) {
                JSONObject grant =
                    grants.getJSONObject(
                        index
                    );

                if (
                    userId.equals(
                        grant.getString(
                            "userId"
                        )
                    ) &&
                    ownerId.equals(
                        grant.getString(
                            "ownerId"
                        )
                    ) &&
                    businessId.equals(
                        grant.getString(
                            "businessId"
                        )
                    ) &&
                    branchId.equals(
                        grant.getString(
                            "branchId"
                        )
                    )
                ) {
                    JSObject result =
                        createSuccessResult();

                    result.put(
                        "data",
                        grant
                    );

                    call.resolve(
                        result
                    );

                    return;
                }
            }

            resolveSuccess(
                call
            );

        } catch (Exception error) {
            resolveFailure(
                call,
                error,
                "Unable to read FINORA Branch Access Grant."
            );
        }
    }

    // ========================================================
    // BRANCH ACCESS RENEWAL HISTORY
    // ========================================================

    /**
     * Read append-only verified REGISTERED Branch Access renewals
     * for one exact user / owner / business / branch scope.
     *
     * READ ONLY.
     */
    @PluginMethod
    public void listBranchAccessRenewalHistory(
        PluginCall call
    ) {
        String userId =
            normalizeRequiredString(
                call.getString(
                    "userId"
                )
            );

        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        if (
            userId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {
            resolveFailure(
                call,
                "User ID, Owner ID, Business ID and Branch ID are required."
            );

            return;
        }

        try {
            JSONObject controlPackage =
                readValidatedControlPackage();

            JSONArray scopedHistory =
                new JSONArray();

            if (controlPackage != null) {
                JSONArray history =
                    controlPackage.optJSONArray(
                        "branchAccessRenewalHistory"
                    );

                if (history != null) {
                    for (
                        int index = 0;
                        index < history.length();
                        index++
                    ) {
                        JSONObject record =
                            history.getJSONObject(
                                index
                            );

                        JSONObject grant =
                            record.getJSONObject(
                                "accessGrant"
                            );

                        if (
                            userId.equals(
                                grant.getString(
                                    "userId"
                                )
                            ) &&
                            ownerId.equals(
                                record.getString(
                                    "ownerId"
                                )
                            ) &&
                            businessId.equals(
                                record.getString(
                                    "businessId"
                                )
                            ) &&
                            branchId.equals(
                                record.getString(
                                    "branchId"
                                )
                            )
                        ) {
                            scopedHistory.put(
                                record
                            );
                        }
                    }
                }
            }

            JSObject result =
                createSuccessResult();

            result.put(
                "data",
                scopedHistory
            );

            call.resolve(
                result
            );

        } catch (Exception error) {
            resolveFailure(
                call,
                error,
                "Unable to read FINORA Branch Access renewal history."
            );
        }
    }


// ========================================================
    // ACTIVE STORAGE ENTITLEMENT CHECK
    // ========================================================

    /**
     * Check whether one FINORA user/login currently owns an
     * ACTIVE entitlement for LOCAL or USB.
     */

    @PluginMethod
    public void hasActiveStorageEntitlement(
        PluginCall call
    ) {
        String userId =
            normalizeRequiredString(
                call.getString(
                    "userId"
                )
            );

        String ownerId =
            normalizeRequiredString(
                call.getString(
                    "ownerId"
                )
            );

        String businessId =
            normalizeRequiredString(
                call.getString(
                    "businessId"
                )
            );

        String branchId =
            normalizeRequiredString(
                call.getString(
                    "branchId"
                )
            );

        String storageMode =
            normalizeStorageMode(
                call.getString(
                    "storageMode"
                )
            );


        if (
            userId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {
            resolveFailure(
                call,
                "User ID, Owner ID, Business ID and Branch ID are required."
            );

            return;
        }

        if (storageMode == null) {
            resolveFailure(
                call,
                "FINORA storage mode must be LOCAL or USB."
            );

            return;
        }

        try {
            JSONObject controlPackage =
                readValidatedControlPackage();

            if (controlPackage == null) {

                resolveBooleanSuccess(
                    call,
                    false
                );

                return;
            }

            // ------------------------------------------------
            // SIMPLE PORTABILITY
            //
            // Storage entitlement is logical branch authority.
            // Current device identity is not an ordinary
            // login/session authorization gate.
            //
            // Historical installation/binding fields remain
            // signed evidence in the Control Store but are not
            // compared with this Android device.
            // ------------------------------------------------


            // ------------------------------------------------
            // INSTALLED BRANCH IDENTITY
            // ------------------------------------------------

            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (installation == null) {

                resolveBooleanSuccess(
                    call,
                    false
                );

                return;
            }

            boolean installationMatches =
                ownerId.equals(
                    installation.optString(
                        "ownerId",
                        ""
                    )
                ) &&
                businessId.equals(
                    installation.optString(
                        "businessId",
                        ""
                    )
                ) &&
                branchId.equals(
                    installation.optString(
                        "branchId",
                        ""
                    )
                );

            if (!installationMatches) {

                resolveBooleanSuccess(
                    call,
                    false
                );

                return;
            }


            // ------------------------------------------------
            // EXACT LOCAL / USB ENTITLEMENT
            // ------------------------------------------------

            JSONArray entitlements =
                controlPackage.getJSONArray(
                    "storageEntitlements"
                );

            for (
                int index = 0;
                index < entitlements.length();
                index++
            ) {
                JSONObject entitlement =
                    entitlements.getJSONObject(
                        index
                    );

                boolean identityMatches =
                    matchesLogicalStorageEntitlementIdentity(
                        entitlement,
                        userId,
                        ownerId,
                        businessId,
                        branchId,
                        storageMode
                    );

                if (!identityMatches) {
                    continue;
                }


                // --------------------------------------------
                // ACTIVE LOGICAL STORAGE ENTITLEMENT
                //
                // identityMatches above already proves:
                // - user
                // - owner
                // - business
                // - branch
                // - exact LOCAL / USB mode
                //
                // Historical native-binding fields remain
                // signed evidence only and are not a current
                // device authorization gate.
                // --------------------------------------------

                boolean activeLogicalEntitlement =
                    isActiveLogicalStorageEntitlement(
                        entitlement
                    );


                resolveBooleanSuccess(
                    call,
                    activeLogicalEntitlement
                );

                return;
            }


            resolveBooleanSuccess(
                call,
                false
            );

        } catch (Exception error) {
            resolveFailure(
                call,
                error,
                "Unable to verify FINORA storage entitlement."
            );
        }
    }

    // ========================================================
    // SIMPLE-PORTABILITY LOGICAL STORAGE ENTITLEMENT
    // ========================================================
    //
    // Package-private pure helpers intentionally evaluate only
    // logical signed entitlement state:
    //
    // - user
    // - owner
    // - business
    // - branch
    // - exact LOCAL / USB mode
    // - ACTIVE status
    //
    // Historical installation/binding fields remain evidence
    // and are deliberately not inputs to these decisions.
    // ========================================================

    static boolean matchesLogicalStorageEntitlementIdentity(
        JSONObject entitlement,
        String userId,
        String ownerId,
        String businessId,
        String branchId,
        String storageMode
    ) throws Exception {
        if (
            entitlement == null ||
            userId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null ||
            storageMode == null
        ) {
            return false;
        }

        return
            userId.equals(
                entitlement.getString(
                    "userId"
                )
            ) &&
            ownerId.equals(
                entitlement.getString(
                    "ownerId"
                )
            ) &&
            businessId.equals(
                entitlement.getString(
                    "businessId"
                )
            ) &&
            branchId.equals(
                entitlement.getString(
                    "branchId"
                )
            ) &&
            storageMode.equals(
                entitlement.getString(
                    "storageMode"
                )
            );
    }

    static boolean isActiveLogicalStorageEntitlement(
        JSONObject entitlement
    ) throws Exception {
        return
            entitlement != null &&
            "ACTIVE".equals(
                entitlement.getString(
                    "status"
                )
            );
    }
    // ========================================================
    // CONTROL PACKAGE READ
    // ========================================================

    /**
     * Read and validate the decrypted FINORA Control Store.
     *
     * Returns null only when the native encrypted control file
     * does not exist yet.
     */
    private JSONObject readValidatedControlPackage()
        throws Exception {

        if (controlStore == null) {
            throw new IllegalStateException(
                "FINORA Control Store is not initialized."
            );
        }

        String raw =
            controlStore.read();

        if (raw == null) {
            return null;
        }

        JSONObject controlPackage =
            new JSONObject(
                raw
            );

        try {
            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (
                installation != null &&
                !installation.has(
                    "schemaVersion"
                )
            ) {
                if (installationBindingService == null) {
                    throw new IllegalStateException(
                        "FINORA installation binding service is unavailable for legacy schema migration."
                    );
                }

                FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                    installationBindingService.get();

                if (nativeBinding == null) {
                    throw new IllegalStateException(
                        "FINORA native installation binding is unavailable for legacy schema migration."
                    );
                }

                String installationId =
                    normalizeRequiredString(
                        installation.optString(
                            "installationId",
                            null
                        )
                    );

                String bindingKeyId =
                    normalizeRequiredString(
                        installation.optString(
                            "bindingKeyId",
                            null
                        )
                    );

                String fingerprintAlgorithm =
                    normalizeRequiredString(
                        installation.optString(
                            "fingerprintAlgorithm",
                            null
                        )
                    );

                String publicKeyFingerprint =
                    normalizeRequiredString(
                        installation.optString(
                            "publicKeyFingerprint",
                            null
                        )
                    );

                if (
                    installationId == null ||
                    bindingKeyId == null ||
                    fingerprintAlgorithm == null ||
                    publicKeyFingerprint == null ||
                    !installationId.equals(
                        nativeBinding.installationId
                    ) ||
                    !bindingKeyId.equals(
                        nativeBinding.bindingKeyId
                    ) ||
                    !"SHA-256".equals(
                        fingerprintAlgorithm
                    ) ||
                    !publicKeyFingerprint.equalsIgnoreCase(
                        nativeBinding.publicKeyFingerprint
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA legacy installation schema migration rejected due to native binding mismatch."
                    );
                }

                installation.put(
                    "schemaVersion",
                    1
                );

                controlPackage.put(
                    "installation",
                    installation
                );

                controlStore.write(
                    controlPackage.toString()
                );

                android.util.Log.i(
                    "FINORA_INSTALLATION_MIGRATION",
                    "Legacy installation schemaVersion migrated to 1."
                );
            }
        } catch (Exception migrationError) {
            throw migrationError;
        }

        validateControlPackage(
            controlPackage
        );

        return controlPackage;
    }

    // ========================================================
    // CONTROL PACKAGE VALIDATION
    // ========================================================
    // BUSINESS PROFILE VALIDATION
    // ========================================================

    private boolean isValidBusinessProfile(
        JSONObject value
    ) {

        if (value == null) {
            return false;
        }

        String businessCode =
            normalizeRequiredString(
                value.optString(
                    "businessCode",
                    null
                )
            );

        String branchCode =
            normalizeRequiredString(
                value.optString(
                    "branchCode",
                    null
                )
            );

        String bindingKeyId =
            normalizeRequiredString(
                value.optString(
                    "bindingKeyId",
                    null
                )
            );

        String fingerprintAlgorithm =
            normalizeRequiredString(
                value.optString(
                    "fingerprintAlgorithm",
                    null
                )
            );

        String publicKeyFingerprint =
            normalizeRequiredString(
                value.optString(
                    "publicKeyFingerprint",
                    null
                )
            );

        String createdAt =
            normalizeRequiredString(
                value.optString(
                    "createdAt",
                    null
                )
            );

        String updatedAt =
            normalizeRequiredString(
                value.optString(
                    "updatedAt",
                    null
                )
            );

        Object schemaVersion =
            value.opt(
                "schemaVersion"
            );

        if (
            !hasRequiredString(
                value,
                "profileId"
            ) ||
            !hasRequiredString(
                value,
                "ownerId"
            ) ||
            !hasRequiredString(
                value,
                "businessId"
            ) ||
            !hasRequiredString(
                value,
                "branchId"
            ) ||
            !hasRequiredString(
                value,
                "businessName"
            ) ||
            !hasRequiredString(
                value,
                "branchName"
            ) ||
            !hasRequiredString(
                value,
                "installationId"
            ) ||
            businessCode == null ||
            branchCode == null ||
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            ) ||
            !bindingKeyMatchesProfileFingerprint(
                bindingKeyId,
                publicKeyFingerprint
            ) ||
            !isCanonicalProfileInstant(
                createdAt
            ) ||
            !isCanonicalProfileInstant(
                updatedAt
            ) ||
            !isProfileSchemaVersionOne(
                schemaVersion
            )
        ) {
            return false;
        }

        try {

            java.time.Instant created =
                java.time.Instant.parse(
                    createdAt
                );

            java.time.Instant updated =
                java.time.Instant.parse(
                    updatedAt
                );

            return !updated.isBefore(
                created
            );

        } catch (
            java.time.format.DateTimeParseException error
        ) {

            return false;
        }
    }


    private void ensureUniqueBusinessProfiles(
        JSONArray businessProfiles
    ) {

        java.util.HashSet<String> scopes =
            new java.util.HashSet<>();

        java.util.HashSet<String> profileIds =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < businessProfiles.length();
            index++
        ) {

            JSONObject profile =
                businessProfiles.optJSONObject(
                    index
                );

            if (
                !isValidBusinessProfile(
                    profile
                )
            ) {

                throw new IllegalStateException(
                    "Invalid FINORA Business Profile."
                );
            }

            String ownerId =
                profile.optString(
                    "ownerId",
                    ""
                );

            String businessId =
                profile.optString(
                    "businessId",
                    ""
                );

            String branchId =
                profile.optString(
                    "branchId",
                    ""
                );

            String profileId =
                profile.optString(
                    "profileId",
                    ""
                );

            String scope =
                ownerId +
                "::" +
                businessId +
                "::" +
                branchId;

            if (
                !scopes.add(
                    scope
                )
            ) {

                throw new IllegalStateException(
                    "Duplicate FINORA Business Profile branch scope detected."
                );
            }

            if (
                !profileIds.add(
                    profileId
                )
            ) {

                throw new IllegalStateException(
                    "Duplicate FINORA Business Profile ID detected."
                );
            }
        }
    }


    private boolean bindingKeyMatchesProfileFingerprint(
        String bindingKeyId,
        String publicKeyFingerprint
    ) {

        if (
            bindingKeyId == null ||
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            )
        ) {
            return false;
        }

        String expectedBindingKeyId =
            "FINORA-BINDING-" +
            publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        return expectedBindingKeyId.equals(
            bindingKeyId
        );
    }


    private boolean isCanonicalProfileInstant(
        String value
    ) {

        if (value == null) {
            return false;
        }

        try {

            java.time.Instant.parse(
                value
            );

            return true;

        } catch (
            java.time.format.DateTimeParseException error
        ) {

            return false;
        }
    }


    private boolean isProfileSchemaVersionOne(
        Object value
    ) {

        if (!(value instanceof Number)) {
            return false;
        }

        double number =
            ((Number) value)
                .doubleValue();

        return (
            Double.isFinite(
                number
            ) &&
            number ==
                1.0d
        );
    }


    // ========================================================

    // ========================================================
    // ========================================================
    // WALLET RECHARGE AUTHORIZATION VALIDATION
    // ========================================================

    private boolean isValidWalletRechargeAuthorization(
        JSONObject value
    ) {

        if (value == null) {
            return false;
        }

        String purpose =
            normalizeRequiredString(
                value.optString(
                    "purpose",
                    null
                )
            );

        String bindingKeyId =
            normalizeRequiredString(
                value.optString(
                    "bindingKeyId",
                    null
                )
            );

        String fingerprintAlgorithm =
            normalizeRequiredString(
                value.optString(
                    "fingerprintAlgorithm",
                    null
                )
            );

        String publicKeyFingerprint =
            normalizeRequiredString(
                value.optString(
                    "publicKeyFingerprint",
                    null
                )
            );

        String currency =
            normalizeRequiredString(
                value.optString(
                    "currency",
                    null
                )
            );

        String paymentMethod =
            normalizeRequiredString(
                value.optString(
                    "paymentMethod",
                    null
                )
            );

        String paymentSource =
            normalizeRequiredString(
                value.optString(
                    "paymentSource",
                    null
                )
            );

        String issuedAt =
            normalizeRequiredString(
                value.optString(
                    "issuedAt",
                    null
                )
            );

        String verifiedAt =
            normalizeRequiredString(
                value.optString(
                    "verifiedAt",
                    null
                )
            );

        Object amountMinor =
            value.opt(
                "amountMinor"
            );

        Object sequence =
            value.opt(
                "sequence"
            );

        if (
            !hasRequiredString(
                value,
                "packageId"
            ) ||
            !hasRequiredString(
                value,
                "issuerId"
            ) ||
            !hasRequiredString(
                value,
                "signingKeyId"
            ) ||
            !"WALLET_RECHARGE".equals(
                purpose
            ) ||
            !isPositiveSafeControlInteger(
                sequence
            ) ||
            !hasRequiredString(
                value,
                "ownerId"
            ) ||
            !hasRequiredString(
                value,
                "businessId"
            ) ||
            !hasRequiredString(
                value,
                "branchId"
            ) ||
            !hasRequiredString(
                value,
                "installationId"
            ) ||
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            ) ||
            !bindingKeyMatchesProfileFingerprint(
                bindingKeyId,
                publicKeyFingerprint
            ) ||
            !hasRequiredString(
                value,
                "paymentReference"
            ) ||
            !isPositiveSafeControlInteger(
                amountMinor
            ) ||
            !"INR".equals(
                currency
            ) ||
            !isWalletRechargePaymentMethod(
                paymentMethod
            ) ||
            !isWalletRechargePaymentSource(
                paymentSource
            ) ||
            !isOptionalWalletRechargeString(
                value,
                "providerOrderId"
            ) ||
            !isOptionalWalletRechargeString(
                value,
                "providerTransactionId"
            ) ||
            !isCanonicalControlTimestamp(
                issuedAt
            ) ||
            !isCanonicalControlTimestamp(
                verifiedAt
            ) ||
            value.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {
            return false;
        }

        try {

            java.time.Instant issuedAtInstant =
                java.time.Instant.parse(
                    issuedAt
                );

            java.time.Instant verifiedAtInstant =
                java.time.Instant.parse(
                    verifiedAt
                );

            return !verifiedAtInstant.isBefore(
                issuedAtInstant
            );

        } catch (Exception error) {

            return false;
        }
    }


    private boolean isWalletRechargePaymentMethod(
        String value
    ) {

        return (
            "UPI".equals(
                value
            ) ||
            "PHONEPE".equals(
                value
            ) ||
            "GOOGLE_PAY".equals(
                value
            ) ||
            "PAYTM".equals(
                value
            ) ||
            "RAZORPAY".equals(
                value
            ) ||
            "BANK_TRANSFER".equals(
                value
            ) ||
            "OTHER".equals(
                value
            )
        );
    }


    private boolean isWalletRechargePaymentSource(
        String value
    ) {

        return (
            "PHONEPE".equals(
                value
            ) ||
            "RAZORPAY".equals(
                value
            ) ||
            "UPI".equals(
                value
            ) ||
            "GOOGLE_PAY".equals(
                value
            ) ||
            "PAYTM".equals(
                value
            ) ||
            "BANK_TRANSFER".equals(
                value
            ) ||
            "MANUAL".equals(
                value
            )
        );
    }


    private boolean isOptionalWalletRechargeString(
        JSONObject value,
        String key
    ) {

        if (!value.has(key)) {
            return true;
        }

        if (value.isNull(key)) {
            return false;
        }

        return normalizeRequiredString(
            value.optString(
                key,
                null
            )
        ) != null;
    }


    private boolean isPositiveSafeControlInteger(
        Object value
    ) {

        if (!(value instanceof Number)) {
            return false;
        }

        double number =
            ((Number) value)
                .doubleValue();

        return (
            Double.isFinite(
                number
            ) &&
            number >
                0.0d &&
            number <=
                9007199254740991.0d &&
            Math.rint(
                number
            ) ==
                number
        );
    }


    private void ensureUniqueWalletRechargeAuthorizations(
        JSONArray authorizations
    ) {

        java.util.HashSet<String> packageIds =
            new java.util.HashSet<>();

        java.util.HashSet<String> paymentReferences =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < authorizations.length();
            index++
        ) {

            JSONObject authorization =
                authorizations.optJSONObject(
                    index
                );

            if (
                authorization == null ||
                !isValidWalletRechargeAuthorization(
                    authorization
                )
            ) {

                throw new IllegalStateException(
                    "FINORA Wallet Recharge authorization validation failed."
                );
            }

            String packageId =
                authorization.optString(
                    "packageId",
                    ""
                );

            String paymentReference =
                authorization.optString(
                    "paymentReference",
                    ""
                );

            if (
                !packageIds.add(
                    packageId
                ) ||
                !paymentReferences.add(
                    paymentReference
                )
            ) {

                throw new IllegalStateException(
                    "FINORA Wallet Recharge authorization collection contains duplicate identities."
                );
            }
        }
    }

    // PRICING POLICY VALIDATION
    // ========================================================

    private boolean isValidPricingPolicy(
        JSONObject value
    ) {

        if (value == null) {
            return false;
        }

        String bindingKeyId =
            normalizeRequiredString(
                value.optString(
                    "bindingKeyId",
                    null
                )
            );

        String fingerprintAlgorithm =
            normalizeRequiredString(
                value.optString(
                    "fingerprintAlgorithm",
                    null
                )
            );

        String publicKeyFingerprint =
            normalizeRequiredString(
                value.optString(
                    "publicKeyFingerprint",
                    null
                )
            );

        String issuedAt =
            normalizeRequiredString(
                value.optString(
                    "issuedAt",
                    null
                )
            );

        JSONArray overrides =
            value.optJSONArray(
                "overrides"
            );

        if (
            !hasRequiredString(
                value,
                "overrideSetId"
            ) ||
            !hasRequiredString(
                value,
                "ownerId"
            ) ||
            !hasRequiredString(
                value,
                "businessId"
            ) ||
            !hasRequiredString(
                value,
                "branchId"
            ) ||
            !hasRequiredString(
                value,
                "installationId"
            ) ||
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            ) ||
            !bindingKeyMatchesProfileFingerprint(
                bindingKeyId,
                publicKeyFingerprint
            ) ||
            issuedAt == null ||
            !isCanonicalControlTimestamp(
                issuedAt
            ) ||
            overrides == null ||
            value.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {
            return false;
        }

        java.util.HashSet<String> overrideIds =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < overrides.length();
            index++
        ) {

            JSONObject rule =
                overrides.optJSONObject(
                    index
                );

            if (
                rule == null ||
                !isValidPricingOverrideRule(
                    rule
                )
            ) {
                return false;
            }

            String overrideId =
                normalizeRequiredString(
                    rule.optString(
                        "overrideId",
                        null
                    )
                );

            if (
                overrideId == null ||
                !overrideIds.add(
                    overrideId
                )
            ) {
                return false;
            }
        }

        return !hasOverlappingPricingOverrideWindows(
            overrides
        );
    }


    private boolean isValidPricingOverrideRule(
        JSONObject rule
    ) {

        if (rule == null) {
            return false;
        }

        String overrideId =
            normalizeRequiredString(
                rule.optString(
                    "overrideId",
                    null
                )
            );

        String chargeCode =
            normalizeRequiredString(
                rule.optString(
                    "chargeCode",
                    null
                )
            );

        String model =
            normalizeRequiredString(
                rule.optString(
                    "model",
                    null
                )
            );

        String currency =
            normalizeRequiredString(
                rule.optString(
                    "currency",
                    null
                )
            );

        String validFrom =
            normalizeRequiredString(
                rule.optString(
                    "validFrom",
                    null
                )
            );

        String validUntil =
            normalizeRequiredString(
                rule.optString(
                    "validUntil",
                    null
                )
            );

        Object amountValue =
            rule.opt(
                "amount"
            );

        if (
            overrideId == null ||
            !"LOAN_DISBURSEMENT".equals(
                chargeCode
            ) ||
            !"FIXED_PRICE_OVERRIDE".equals(
                model
            ) ||
            !"INR".equals(
                currency
            ) ||
            validFrom == null ||
            validUntil == null ||
            !isCanonicalControlTimestamp(
                validFrom
            ) ||
            !isCanonicalControlTimestamp(
                validUntil
            ) ||
            !(amountValue instanceof Number) ||
            rule.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {
            return false;
        }

        double amount =
            ((Number) amountValue)
                .doubleValue();

        if (
            !Double.isFinite(
                amount
            ) ||
            amount <=
                0.0d
        ) {
            return false;
        }

        try {

            java.time.Instant from =
                java.time.Instant.parse(
                    validFrom
                );

            java.time.Instant until =
                java.time.Instant.parse(
                    validUntil
                );

            return until.isAfter(
                from
            );

        } catch (Exception error) {

            return false;
        }
    }


    private boolean hasOverlappingPricingOverrideWindows(
        JSONArray overrides
    ) {

        for (
            int leftIndex = 0;
            leftIndex < overrides.length();
            leftIndex++
        ) {

            JSONObject left =
                overrides.optJSONObject(
                    leftIndex
                );

            if (left == null) {
                return true;
            }

            String leftCharge =
                normalizeRequiredString(
                    left.optString(
                        "chargeCode",
                        null
                    )
                );

            String leftFromText =
                normalizeRequiredString(
                    left.optString(
                        "validFrom",
                        null
                    )
                );

            String leftUntilText =
                normalizeRequiredString(
                    left.optString(
                        "validUntil",
                        null
                    )
                );

            if (
                leftCharge == null ||
                leftFromText == null ||
                leftUntilText == null
            ) {
                return true;
            }

            java.time.Instant leftFrom;
            java.time.Instant leftUntil;

            try {

                leftFrom =
                    java.time.Instant.parse(
                        leftFromText
                    );

                leftUntil =
                    java.time.Instant.parse(
                        leftUntilText
                    );

            } catch (Exception error) {

                return true;
            }

            for (
                int rightIndex =
                    leftIndex + 1;
                rightIndex < overrides.length();
                rightIndex++
            ) {

                JSONObject right =
                    overrides.optJSONObject(
                        rightIndex
                    );

                if (right == null) {
                    return true;
                }

                String rightCharge =
                    normalizeRequiredString(
                        right.optString(
                            "chargeCode",
                            null
                        )
                    );

                if (
                    !leftCharge.equals(
                        rightCharge
                    )
                ) {
                    continue;
                }

                String rightFromText =
                    normalizeRequiredString(
                        right.optString(
                            "validFrom",
                            null
                        )
                    );

                String rightUntilText =
                    normalizeRequiredString(
                        right.optString(
                            "validUntil",
                            null
                        )
                    );

                if (
                    rightFromText == null ||
                    rightUntilText == null
                ) {
                    return true;
                }

                try {

                    java.time.Instant rightFrom =
                        java.time.Instant.parse(
                            rightFromText
                        );

                    java.time.Instant rightUntil =
                        java.time.Instant.parse(
                            rightUntilText
                        );

                    if (
                        leftFrom.isBefore(
                            rightUntil
                        ) &&
                        rightFrom.isBefore(
                            leftUntil
                        )
                    ) {
                        return true;
                    }

                } catch (Exception error) {

                    return true;
                }
            }
        }

        return false;
    }


    private void ensureUniquePricingPolicies(
        JSONArray pricingPolicies
    ) {

        java.util.HashSet<String> scopes =
            new java.util.HashSet<>();

        java.util.HashSet<String> overrideSetIds =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < pricingPolicies.length();
            index++
        ) {

            JSONObject policy =
                pricingPolicies.optJSONObject(
                    index
                );

            if (
                policy == null ||
                !isValidPricingPolicy(
                    policy
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Pricing Policy validation failed."
                );
            }

            String overrideSetId =
                policy.optString(
                    "overrideSetId",
                    ""
                );

            String scope =
                policy.optString(
                    "ownerId",
                    ""
                ) +
                "\u0000" +
                policy.optString(
                    "businessId",
                    ""
                ) +
                "\u0000" +
                policy.optString(
                    "branchId",
                    ""
                ) +
                "\u0000" +
                policy.optString(
                    "installationId",
                    ""
                );

            if (
                !scopes.add(
                    scope
                ) ||
                !overrideSetIds.add(
                    overrideSetId
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Pricing Policy collection contains duplicate identities."
                );
            }
        }
    }

    private void validateControlPackage(
        JSONObject controlPackage
    ) {
        if (
            !CONTROL_VERSION.equals(
                controlPackage.optString(
                    "version",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "Unsupported FINORA Control Store package version."
            );
        }

        JSONArray activations =
            controlPackage.optJSONArray(
                "activations"
            );

        JSONArray entitlements =
            controlPackage.optJSONArray(
                "storageEntitlements"
            );

        JSONArray branchAccessGrants =
            controlPackage.optJSONArray(
                "branchAccessGrants"
            );

        JSONArray branchAccessRenewalHistory =
            controlPackage.optJSONArray(
                "branchAccessRenewalHistory"
            );

        JSONArray businessProfiles =
            controlPackage.optJSONArray(
                "businessProfiles"
            );

        JSONArray pricingPolicies =
            controlPackage.optJSONArray(
                "pricingPolicies"
            );

        JSONArray walletRechargeAuthorizations =
            controlPackage.optJSONArray(
                "walletRechargeAuthorizations"
            );

        String updatedAt =
            normalizeRequiredString(
                controlPackage.optString(
                    "updatedAt",
                    null
                )
            );

        if (
            activations == null ||
            entitlements == null ||
            updatedAt == null
        ) {
            throw new IllegalStateException(
                "FINORA Control Store package validation failed."
            );
        }

        /*
         * branchAccessGrants is optional only for compatibility
         * with encrypted Control Stores written before the
         * Branch Access Engine existed.
         *
         * If the property exists, it MUST be a JSON array.
         */
        if (
            controlPackage.has(
                "branchAccessGrants"
            ) &&
            !controlPackage.isNull(
                "branchAccessGrants"
            ) &&
            branchAccessGrants == null
        ) {
            throw new IllegalStateException(
                "FINORA Branch Access Grant collection validation failed."
            );
        }

        /*
         * branchAccessRenewalHistory is optional only for
         * compatibility with encrypted Control Stores written
         * before Subscription Renewal History support existed.
         */
        if (
            controlPackage.has(
                "branchAccessRenewalHistory"
            ) &&
            !controlPackage.isNull(
                "branchAccessRenewalHistory"
            ) &&
            branchAccessRenewalHistory == null
        ) {
            throw new IllegalStateException(
                "FINORA Branch Access Renewal History collection validation failed."
            );
        }
        if (
            controlPackage.has(
                "installation"
            ) &&
            !controlPackage.isNull(
                "installation"
            )
        ) {
            JSONObject installation =
                controlPackage.optJSONObject(
                    "installation"
                );

            if (
                installation == null ||
                !isValidInstallation(
                    installation
                )
            ) {

                throw new IllegalStateException(
                    "FINORA installation identity validation failed."
                );
            }
        }

        for (
            int index = 0;
            index < activations.length();
            index++
        ) {
            JSONObject activation =
                activations.optJSONObject(
                    index
                );

            if (
                activation == null ||
                !isValidActivation(
                    activation
                )
            ) {
                throw new IllegalStateException(
                    "FINORA branch activation validation failed."
                );
            }
        }

        for (
            int index = 0;
            index < entitlements.length();
            index++
        ) {
            JSONObject entitlement =
                entitlements.optJSONObject(
                    index
                );

            if (
                entitlement == null ||
                !isValidEntitlement(
                    entitlement
                )
            ) {
                throw new IllegalStateException(
                    "FINORA storage entitlement validation failed."
                );
            }
        }

        if (branchAccessGrants != null) {
            for (
                int index = 0;
                index < branchAccessGrants.length();
                index++
            ) {
                JSONObject grant =
                    branchAccessGrants.optJSONObject(
                        index
                    );

                if (
                    grant == null ||
                    !isValidBranchAccessGrant(
                        grant
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Branch Access Grant validation failed."
                    );
                }
            }
        }

        if (branchAccessRenewalHistory != null) {
            for (
                int index = 0;
                index < branchAccessRenewalHistory.length();
                index++
            ) {
                JSONObject record =
                    branchAccessRenewalHistory.optJSONObject(
                        index
                    );

                if (
                    record == null ||
                    !isValidBranchAccessRenewalHistoryRecord(
                        record
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Branch Access Renewal History record validation failed."
                    );
                }
            }
        }
        ensureUniqueActivations(
            activations
        );

        ensureUniqueEntitlements(
            entitlements
        );

        if (branchAccessGrants != null) {
            ensureUniqueBranchAccessGrants(
                branchAccessGrants
            );
        }

        if (branchAccessRenewalHistory != null) {
            ensureUniqueBranchAccessRenewalHistory(
                branchAccessRenewalHistory
            );
        }
        /*
         * businessProfiles is optional only for encrypted
         * Control Stores written before Phase-4 Business Profile
         * provisioning existed.
         *
         * Once present it must be a valid JSON array containing
         * unique, fully validated signed profile records.
         */
        if (businessProfiles == null) {

            if (
                controlPackage.has(
                    "businessProfiles"
                ) &&
                !controlPackage.isNull(
                    "businessProfiles"
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Business Profile collection is invalid."
                );
            }

        } else {

            ensureUniqueBusinessProfiles(
                businessProfiles
            );
        }
        /*
         * pricingPolicies is optional for encrypted Control
         * Stores written before Phase-7 Pricing Policy support.
         *
         * Once present it must contain fully validated,
         * unique authoritative Pricing Policy records.
         */
        if (pricingPolicies == null) {

            if (
                controlPackage.has(
                    "pricingPolicies"
                ) &&
                !controlPackage.isNull(
                    "pricingPolicies"
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Pricing Policy collection is invalid."
                );
            }

        } else {

            ensureUniquePricingPolicies(
                pricingPolicies
            );
        }

        /*
         * walletRechargeAuthorizations is optional for
         * encrypted Control Stores written before Phase-9
         * Signed Wallet Recharge authorization support.
         *
         * Once present it must contain fully validated,
         * unique verified Recharge authorization records.
         */
        if (walletRechargeAuthorizations == null) {

            if (
                controlPackage.has(
                    "walletRechargeAuthorizations"
                ) &&
                !controlPackage.isNull(
                    "walletRechargeAuthorizations"
                )
            ) {

                throw new IllegalStateException(
                    "FINORA Wallet Recharge authorization collection is invalid."
                );
            }

        } else {

            ensureUniqueWalletRechargeAuthorizations(
                walletRechargeAuthorizations
            );
        }
    }
// ========================================================
    // INSTALLATION VALIDATION
    // ========================================================

    private boolean isValidInstallation(
        JSONObject value
    ) {
        boolean hasBusinessCode =
            value.has(
                "businessCode"
            );

        boolean hasBranchCode =
            value.has(
                "branchCode"
            );

        if (
            hasBusinessCode !=
            hasBranchCode
        ) {
            return false;
        }

        if (
            hasBusinessCode &&
            (
                !hasRequiredString(
                    value,
                    "businessCode"
                ) ||
                !hasRequiredString(
                    value,
                    "branchCode"
                )
            )
        ) {
            return false;
        }

        return (
            hasRequiredString(
                value,
                "installationId"
            ) &&
            hasRequiredString(
                value,
                "ownerId"
            ) &&
            hasRequiredString(
                value,
                "businessId"
            ) &&
            hasRequiredString(
                value,
                "branchId"
            ) &&
            hasRequiredString(
                value,
                "createdAt"
            ) &&
            hasRequiredString(
                value,
                "updatedAt"
            ) &&
            value.optInt(
                "schemaVersion",
                -1
            ) == 1
        );
    }

    // ========================================================
    // ACTIVATION VALIDATION
    // ========================================================

    private boolean isValidActivation(
        JSONObject value
    ) {
        String status =
            value.optString(
                "status",
                ""
            );

        boolean validStatus =
            "PENDING".equals(
                status
            ) ||
            "ACTIVE".equals(
                status
            ) ||
            "SUSPENDED".equals(
                status
            ) ||
            "DEACTIVATED".equals(
                status
            );

        boolean activatedAtValid =
            !value.has(
                "activatedAt"
            ) ||
            value.isNull(
                "activatedAt"
            ) ||
            hasRequiredString(
                value,
                "activatedAt"
            );

        return (
            hasRequiredString(
                value,
                "activationId"
            ) &&
            hasRequiredString(
                value,
                "ownerId"
            ) &&
            hasRequiredString(
                value,
                "businessId"
            ) &&
            hasRequiredString(
                value,
                "branchId"
            ) &&
            validStatus &&
            activatedAtValid &&
            hasRequiredString(
                value,
                "createdAt"
            ) &&
            hasRequiredString(
                value,
                "updatedAt"
            ) &&
            value.optInt(
                "schemaVersion",
                -1
            ) == 1
        );
    }

        // ========================================================
    // BRANCH ACCESS GRANT VALIDATION
    // ========================================================

    private boolean isCanonicalControlTimestamp(
        String value
    ) {
        String normalized =
            normalizeRequiredString(
                value
            );

        if (normalized == null) {
            return false;
        }

        try {
            java.time.Instant.parse(
                normalized
            );

            return true;

        } catch (Exception error) {
            return false;
        }
    }

    private boolean isOptionalGrantString(
        JSONObject value,
        String key
    ) {
        return (
            !value.has(
                key
            ) ||
            value.isNull(
                key
            ) ||
            value.optString(
                key,
                null
            ) != null
        );
    }

    private boolean isValidRegistrationPayment(
        JSONObject value
    ) {
        if (value == null) {
            return false;
        }

        double amount =
            value.optDouble(
                "amount",
                Double.NaN
            );

        String paymentMode =
            value.optString(
                "paymentMode",
                ""
            );

        boolean validPaymentMode =
            "CASH".equals(
                paymentMode
            ) ||
            "UPI".equals(
                paymentMode
            ) ||
            "BANK_TRANSFER".equals(
                paymentMode
            ) ||
            "OTHER".equals(
                paymentMode
            );

        return (
            !Double.isNaN(
                amount
            ) &&
            !Double.isInfinite(
                amount
            ) &&
            amount > 0.0d &&
            hasRequiredString(
                value,
                "currency"
            ) &&
            validPaymentMode &&
            isCanonicalControlTimestamp(
                value.optString(
                    "paidAt",
                    null
                )
            ) &&
            value.has(
                "refundable"
            ) &&
            !value.optBoolean(
                "refundable",
                true
            ) &&
            isOptionalGrantString(
                value,
                "reference"
            ) &&
            isOptionalGrantString(
                value,
                "remarks"
            )
        );
    }

    private boolean isValidBranchAccessGrant(
        JSONObject value
    ) {
        String accessType =
            value.optString(
                "accessType",
                ""
            );

                String storageMode =
            value.optString(
                "storageMode",
                ""
            );

        if (
            !"LOCAL".equals(
                storageMode
            ) &&
            !"USB".equals(
                storageMode
            )
        ) {
            return false;
        }

String administrativeStatus =
            value.optString(
                "administrativeStatus",
                ""
            );

        boolean validAdministrativeStatus =
            "ACTIVE".equals(
                administrativeStatus
            ) ||
            "SUSPENDED".equals(
                administrativeStatus
            ) ||
            "REVOKED".equals(
                administrativeStatus
            );

        JSONObject validity =
            value.optJSONObject(
                "validity"
            );

        if (
            !hasRequiredString(
                value,
                "grantId"
            ) ||
            !hasRequiredString(
                value,
                "userId"
            ) ||
            !hasRequiredString(
                value,
                "ownerId"
            ) ||
            !hasRequiredString(
                value,
                "businessId"
            ) ||
            !hasRequiredString(
                value,
                "branchId"
            ) ||
            !validAdministrativeStatus ||
            validity == null ||
            !isCanonicalControlTimestamp(
                validity.optString(
                    "validFrom",
                    null
                )
            ) ||
            !isCanonicalControlTimestamp(
                validity.optString(
                    "validUntil",
                    null
                )
            ) ||
            !isCanonicalControlTimestamp(
                value.optString(
                    "createdAt",
                    null
                )
            ) ||
            !isCanonicalControlTimestamp(
                value.optString(
                    "updatedAt",
                    null
                )
            ) ||
            value.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {
            return false;
        }

        java.time.Instant validFrom;
        java.time.Instant validUntil;
        java.time.Instant createdAt;
        java.time.Instant updatedAt;

        try {
            validFrom =
                java.time.Instant.parse(
                    validity.getString(
                        "validFrom"
                    )
                );

            validUntil =
                java.time.Instant.parse(
                    validity.getString(
                        "validUntil"
                    )
                );

            createdAt =
                java.time.Instant.parse(
                    value.getString(
                        "createdAt"
                    )
                );

            updatedAt =
                java.time.Instant.parse(
                    value.getString(
                        "updatedAt"
                    )
                );

        } catch (Exception error) {
            return false;
        }

        if (
            !validUntil.isAfter(
                validFrom
            ) ||
            updatedAt.isBefore(
                createdAt
            )
        ) {
            return false;
        }

        if (
            "REGISTERED".equals(
                accessType
            )
        ) {
            JSONObject registrationPayment =
                value.optJSONObject(
                    "registrationPayment"
                );

            int registrationCycle =
                value.optInt(
                    "registrationCycle",
                    -1
                );

            if (
                !isValidRegistrationPayment(
                    registrationPayment
                ) ||
                registrationCycle < 1
            ) {
                return false;
            }

            /*
             * REGISTERED and DEMO are mutually exclusive
             * discriminated grant variants.
             */
            if (
                value.has(
                    "demoId"
                ) &&
                !value.isNull(
                    "demoId"
                )
            ) {
                return false;
            }

            return true;
        }

        if (
            "DEMO".equals(
                accessType
            )
        ) {
            if (
                !hasRequiredString(
                    value,
                    "demoId"
                ) ||
                !isOptionalGrantString(
                    value,
                    "demoRemarks"
                )
            ) {
                return false;
            }

            if (
                (
                    value.has(
                        "registrationPayment"
                    ) &&
                    !value.isNull(
                        "registrationPayment"
                    )
                ) ||
                (
                    value.has(
                        "registrationCycle"
                    ) &&
                    !value.isNull(
                        "registrationCycle"
                    )
                )
            ) {
                return false;
            }

            return true;
        }

        return false;
    }

    private boolean isValidBranchAccessRenewalHistoryRecord(
        JSONObject value
    ) {
        if (
            value == null ||
            value.optInt(
                "schemaVersion",
                -1
            ) != 1 ||
            !hasRequiredString(
                value,
                "packageId"
            ) ||
            !hasRequiredString(
                value,
                "issuerId"
            ) ||
            value.optLong(
                "sequence",
                -1L
            ) <= 0L ||
            !"RENEW".equals(
                value.optString(
                    "action",
                    ""
                )
            ) ||
            !hasRequiredString(
                value,
                "ownerId"
            ) ||
            !hasRequiredString(
                value,
                "businessId"
            ) ||
            !hasRequiredString(
                value,
                "branchId"
            ) ||
            !hasRequiredString(
                value,
                "installationId"
            ) ||
            !isCanonicalControlTimestamp(
                value.optString(
                    "appliedAt",
                    null
                )
            )
        ) {
            return false;
        }

        JSONObject accessGrant =
            value.optJSONObject(
                "accessGrant"
            );

        if (
            accessGrant == null ||
            !isValidBranchAccessGrant(
                accessGrant
            ) ||
            !"REGISTERED".equals(
                accessGrant.optString(
                    "accessType",
                    ""
                )
            )
        ) {
            return false;
        }

        return (
            value.optString(
                "ownerId",
                ""
            ).equals(
                accessGrant.optString(
                    "ownerId",
                    ""
                )
            ) &&
            value.optString(
                "businessId",
                ""
            ).equals(
                accessGrant.optString(
                    "businessId",
                    ""
                )
            ) &&
            value.optString(
                "branchId",
                ""
            ).equals(
                accessGrant.optString(
                    "branchId",
                    ""
                )
            )
        );
    }
// ========================================================
    // ENTITLEMENT VALIDATION
    // ========================================================

        private boolean isCanonicalStorageFingerprint(
        String value
    ) {

        return (
            value != null &&
            value.matches(
                "[0-9a-f]{64}"
            )
        );
    }

    private boolean isValidStorageNativeBinding(
        JSONObject value
    ) {

        String installationId =
            normalizeRequiredString(
                value.optString(
                    "installationId",
                    null
                )
            );

        String bindingKeyId =
            normalizeRequiredString(
                value.optString(
                    "bindingKeyId",
                    null
                )
            );

        String fingerprintAlgorithm =
            normalizeRequiredString(
                value.optString(
                    "fingerprintAlgorithm",
                    null
                )
            );

        String publicKeyFingerprint =
            normalizeRequiredString(
                value.optString(
                    "publicKeyFingerprint",
                    null
                )
            );

        if (
            installationId == null ||
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            !isCanonicalStorageFingerprint(
                publicKeyFingerprint
            )
        ) {
            return false;
        }

        String expectedBindingKeyId =
            "FINORA-BINDING-" +
            publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        return expectedBindingKeyId.equals(
            bindingKeyId
        );
    }

    private boolean isValidRuntimeNativeBinding(
        FinoraInstallationBindingCrypto.PublicBinding binding
    ) {
        if (
            binding == null ||
            normalizeRequiredString(
                binding.installationId
            ) == null ||
            normalizeRequiredString(
                binding.bindingKeyId
            ) == null ||
            !isCanonicalStorageFingerprint(
                binding.publicKeyFingerprint
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
private boolean isValidEntitlement(
        JSONObject value
    ) {
        String storageMode =
            value.optString(
                "storageMode",
                ""
            );

        String status =
            value.optString(
                "status",
                ""
            );

        boolean validStorageMode =
            "LOCAL".equals(
                storageMode
            ) ||
            "USB".equals(
                storageMode
            );

        boolean validStatus =
            "ACTIVE".equals(
                status
            ) ||
            "SUSPENDED".equals(
                status
            ) ||
            "REVOKED".equals(
                status
            );

        return (
            hasRequiredString(
                value,
                "entitlementId"
            ) &&
            hasRequiredString(
                value,
                "userId"
            ) &&
            hasRequiredString(
                value,
                "ownerId"
            ) &&
            hasRequiredString(
                value,
                "businessId"
            ) &&
            hasRequiredString(
                value,
                "branchId"
            ) &&
            isValidStorageNativeBinding(
                value
            ) &&
            validStorageMode &&
            validStatus &&
            hasRequiredString(
                value,
                "activatedAt"
            ) &&
            hasRequiredString(
                value,
                "createdAt"
            ) &&
            hasRequiredString(
                value,
                "updatedAt"
            ) &&
            value.optInt(
                "schemaVersion",
                -1
            ) == 1
        );
    }

    // ========================================================
    // DUPLICATE ACTIVATION VALIDATION
    // ========================================================

    private void ensureUniqueActivations(
        JSONArray activations
    ) {
        java.util.HashSet<String> keys =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < activations.length();
            index++
        ) {
            JSONObject activation =
                activations.optJSONObject(
                    index
                );

            if (activation == null) {
                throw new IllegalStateException(
                    "Invalid FINORA branch activation."
                );
            }

            String key =
                activation.optString(
                    "ownerId",
                    ""
                ) +
                "::" +
                activation.optString(
                    "businessId",
                    ""
                ) +
                "::" +
                activation.optString(
                    "branchId",
                    ""
                );

            if (!keys.add(key)) {
                throw new IllegalStateException(
                    "Duplicate FINORA branch activation detected."
                );
            }
        }
    }

    // ========================================================
    // DUPLICATE ENTITLEMENT VALIDATION
    // ========================================================

    private void ensureUniqueEntitlements(
        JSONArray entitlements
    ) {
        java.util.HashSet<String> keys =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < entitlements.length();
            index++
        ) {
            JSONObject entitlement =
                entitlements.optJSONObject(
                    index
                );

            if (entitlement == null) {
                throw new IllegalStateException(
                    "Invalid FINORA storage entitlement."
                );
            }

            String key =
                entitlement.optString(
                    "userId",
                    ""
                ) +
                "::" +
                entitlement.optString(
                    "ownerId",
                    ""
                ) +
                "::" +
                entitlement.optString(
                    "businessId",
                    ""
                ) +
                "::" +
                entitlement.optString(
                    "branchId",
                    ""
                ) +
                "::" +
                entitlement.optString(
                    "storageMode",
                    ""
                );

            if (!keys.add(key)) {
                throw new IllegalStateException(
                    "Duplicate FINORA storage entitlement detected."
                );
            }
        }
    }

        // ========================================================
    // DUPLICATE BRANCH ACCESS VALIDATION
    // ========================================================

    private void ensureUniqueBranchAccessGrants(
        JSONArray grants
    ) {
        java.util.HashSet<String> keys =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < grants.length();
            index++
        ) {
            JSONObject grant =
                grants.optJSONObject(
                    index
                );

            if (grant == null) {
                throw new IllegalStateException(
                    "Invalid FINORA Branch Access Grant."
                );
            }

            String key =
                grant.optString(
                    "userId",
                    ""
                ) +
                "::" +
                grant.optString(
                    "ownerId",
                    ""
                ) +
                "::" +
                grant.optString(
                    "businessId",
                    ""
                ) +
                "::" +
                grant.optString(
                    "branchId",
                    ""
                );

            if (!keys.add(key)) {
                throw new IllegalStateException(
                    "Duplicate FINORA Branch Access Grant detected."
                );
            }
        }
    }

    private void ensureUniqueBranchAccessRenewalHistory(
        JSONArray history
    ) {
        java.util.HashSet<String> packageIds =
            new java.util.HashSet<>();

        for (
            int index = 0;
            index < history.length();
            index++
        ) {
            JSONObject record =
                history.optJSONObject(
                    index
                );

            if (record == null) {
                throw new IllegalStateException(
                    "Invalid FINORA Branch Access Renewal History record."
                );
            }

            String packageId =
                record.optString(
                    "packageId",
                    ""
                );

            if (!packageIds.add(packageId)) {
                throw new IllegalStateException(
                    "Duplicate FINORA Branch Access Renewal History package detected."
                );
            }
        }
    }
// ========================================================
    // STRING VALIDATION
    // ========================================================

    private boolean hasRequiredString(
        JSONObject value,
        String key
    ) {
        return normalizeRequiredString(
            value.optString(
                key,
                null
            )
        ) != null;
    }

    private String normalizeRequiredString(
        String value
    ) {
        if (value == null) {
            return null;
        }

        String normalized =
            value.trim();

        if (normalized.isEmpty()) {
            return null;
        }

        return normalized;
    }

    private String normalizeStorageMode(
        String value
    ) {
        String normalized =
            normalizeRequiredString(
                value
            );

        if (normalized == null) {
            return null;
        }

        if (
            "LOCAL".equals(
                normalized
            ) ||
            "USB".equals(
                normalized
            )
        ) {
            return normalized;
        }

        return null;
    }

    private void resolveLoginSessionResult(
        PluginCall call,
        FinoraBranchLoginSessionAuthority.SessionResult result
    ) {
        if (
            result == null ||
            !result.success ||
            result.data == null
        ) {
            resolveLoginSessionFailure(
                call,
                result == null
                    ? FinoraBranchLoginSessionAuthority
                        .ERROR_CONTROL_STATE_FAILED
                    : result.errorCode,
                result == null
                    ? "FINORA secure login session operation failed."
                    : result.error
            );
            return;
        }

        FinoraBranchLoginSessionAuthority.SessionView source =
            result.data;

        JSObject data =
            new JSObject();

        data.put(
            "sessionId",
            source.sessionId
        );

        data.put(
            "userId",
            source.userId
        );

        data.put(
            "username",
            source.username
        );

        data.put(
            "fullName",
            source.fullName
        );

        data.put(
            "role",
            source.role
        );

        data.put(
            "ownerId",
            source.ownerId
        );

        data.put(
            "businessId",
            source.businessId
        );

        data.put(
            "branchId",
            source.branchId
        );

        data.put(
            "storageMode",
            source.storageMode
        );

        data.put(
            "dataContext",
            source.dataContext
        );

        if (source.demoId != null) {
            data.put(
                "demoId",
                source.demoId
            );
        }

        data.put(
            "accessMode",
            source.accessMode
        );

        data.put(
            "loginTime",
            source.loginTime
        );

        data.put(
            "lastActivity",
            source.lastActivity
        );

        data.put(
            "validatedAt",
            source.validatedAt
        );

        JSObject response =
            createSuccessResult();

        response.put(
            "data",
            data
        );

        call.resolve(
            response
        );
    }

    private void resolveLoginSessionFailure(
        PluginCall call,
        String errorCode,
        String error
    ) {
        JSObject response =
            new JSObject();

        response.put(
            "success",
            false
        );

        if (
            errorCode != null &&
            !errorCode.trim().isEmpty()
        ) {
            response.put(
                "errorCode",
                errorCode
            );
        }

        response.put(
            "error",
            error == null ||
                error.trim().isEmpty()
                ? "FINORA secure login session operation failed."
                : error
        );

        call.resolve(
            response
        );
    }

    // ========================================================
    // RESULT HELPERS
    // ========================================================

    private JSObject createSuccessResult() {
        JSObject result =
            new JSObject();

        result.put(
            "success",
            true
        );

        return result;
    }

    private void resolveSuccess(
        PluginCall call
    ) {
        call.resolve(
            createSuccessResult()
        );
    }

    private void resolveBooleanSuccess(
        PluginCall call,
        boolean value
    ) {
        JSObject result =
            createSuccessResult();

        result.put(
            "data",
            value
        );

        call.resolve(
            result
        );
    }

    private void resolveFailure(
        PluginCall call,
        String message
    ) {
        JSObject result =
            new JSObject();

        result.put(
            "success",
            false
        );

        result.put(
            "error",
            message
        );

        call.resolve(
            result
        );
    }

    private void resolveFailure(
        PluginCall call,
        Exception error,
        String fallbackMessage
    ) {
        String message =
            error.getMessage();

        if (
            message == null ||
            message.trim().isEmpty()
        ) {
            message =
                fallbackMessage;
        }

        resolveFailure(
            call,
            message
        );
    }

    // ========================================================
    // END
    // ========================================================
}
