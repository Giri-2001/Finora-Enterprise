package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
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

    private static final String CONTROL_VERSION =
        "1.0";

    // ========================================================
    // STATE
    // ========================================================

    private FinoraControlStore controlStore;

    private FinoraInstallationBindingService installationBindingService;

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

        super.load();
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

            for (
                int index = 0;
                index < activations.length();
                index++
            ) {
                JSONObject activation =
                    activations.getJSONObject(
                        index
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
            // CURRENT NATIVE INSTALLATION BINDING
            // ------------------------------------------------

            FinoraInstallationBindingService bindingService =
                new FinoraInstallationBindingService(
                    getContext()
                );

            FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                bindingService.get();

            if (nativeBinding == null) {

                resolveFailure(
                    call,
                    "FINORA Android native installation binding is required before reading the Business Profile."
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
                // PROFILE -> INSTALLATION
                // --------------------------------------------

                String profileInstallationId =
                    normalizeRequiredString(
                        profile.optString(
                            "installationId",
                            null
                        )
                    );

                String profileBindingKeyId =
                    normalizeRequiredString(
                        profile.optString(
                            "bindingKeyId",
                            null
                        )
                    );

                String profileFingerprintAlgorithm =
                    normalizeRequiredString(
                        profile.optString(
                            "fingerprintAlgorithm",
                            null
                        )
                    );

                String profilePublicKeyFingerprint =
                    normalizeRequiredString(
                        profile.optString(
                            "publicKeyFingerprint",
                            null
                        )
                    );

                if (
                    profileInstallationId == null ||
                    profileBindingKeyId == null ||
                    profileFingerprintAlgorithm == null ||
                    profilePublicKeyFingerprint == null ||
                    !installationId.equals(
                        profileInstallationId
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA Business Profile does not match the installed branch."
                    );

                    return;
                }


                // --------------------------------------------
                // PROFILE -> CURRENT NATIVE BINDING
                // --------------------------------------------

                if (
                    !nativeBinding.bindingKeyId.equals(
                        profileBindingKeyId
                    ) ||
                    !"SHA-256".equals(
                        profileFingerprintAlgorithm
                    ) ||
                    !nativeBinding.publicKeyFingerprint.equals(
                        profilePublicKeyFingerprint
                    )
                ) {

                    resolveFailure(
                        call,
                        "FINORA Business Profile native installation binding is invalid."
                    );

                    return;
                }


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

            if (
                installationBindingService == null
            ) {
                throw new IllegalStateException(
                    "FINORA installation binding service is not initialized."
                );
            }


            // ------------------------------------------------
            // AUTHORITATIVE ANDROIDKEYSTORE PUBLIC BINDING
            // ------------------------------------------------

            FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                installationBindingService.get();

            if (
                !isValidRuntimeNativeBinding(
                    nativeBinding
                )
            ) {
                resolveBooleanSuccess(
                    call,
                    false
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
                ) &&
                nativeBinding.installationId.equals(
                    installation.optString(
                        "installationId",
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

                if (!identityMatches) {
                    continue;
                }


                // --------------------------------------------
                // ACTIVE + EXACT NATIVE BINDING
                // --------------------------------------------

                boolean active =
                    "ACTIVE".equals(
                        entitlement.getString(
                            "status"
                        )
                    );

                boolean nativeBindingMatches =
                    nativeBinding.installationId.equals(
                        entitlement.getString(
                            "installationId"
                        )
                    ) &&
                    nativeBinding.bindingKeyId.equals(
                        entitlement.getString(
                            "bindingKeyId"
                        )
                    ) &&
                    "SHA-256".equals(
                        entitlement.getString(
                            "fingerprintAlgorithm"
                        )
                    ) &&
                    nativeBinding.publicKeyFingerprint.equals(
                        entitlement.getString(
                            "publicKeyFingerprint"
                        )
                    );

                resolveBooleanSuccess(
                    call,
                    active &&
                        nativeBindingMatches
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
            !businessCode.matches(
                "[A-Z0-9]{2,10}"
            ) ||
            !branchCode.matches(
                "[A-Z0-9]{2,10}"
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
        JSONArray businessProfiles =
            controlPackage.optJSONArray(
                "businessProfiles"
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