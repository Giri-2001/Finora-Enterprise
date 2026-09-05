package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID DEVELOPMENT PROVISIONING
//
// RESPONSIBILITY:
//
// - Support trusted native Android activation smoke testing
// - Provision one installation identity
// - Provision one ACTIVE branch activation
// - Optionally provision ACTIVE LOCAL / USB entitlements
//
// SECURITY:
//
// - Native Android only.
// - No Capacitor / renderer write API.
// - Runs only when the installed application is debuggable.
// - Explicit ADB Activity intent extras are required.
// - Production/non-debuggable application builds cannot use it.
// - No pricing.
// - No operational customer data.
//
// IMPORTANT:
//
// This module is development/runtime validation infrastructure.
// Production activation/licensing will use the final trusted
// FINORA provisioning path.
//
// VERSION : 1.0
// STATUS  : Development Only
// ============================================================

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

// ============================================================
// DEVELOPMENT PROVISIONER
// ============================================================

public final class FinoraDevProvisioning {

    // ========================================================
    // CONSTANTS
    // ========================================================

    private static final String TAG =
        "FINORA_DEV";

    private static final String CONTROL_VERSION =
        "1.0";

    public static final String EXTRA_PROVISION_BRANCH =
        "finora_dev_provision_branch";

    public static final String EXTRA_PROVISION_LOCAL_ENTITLEMENT =
        "finora_dev_provision_local_entitlement";

    public static final String EXTRA_PROVISION_USB_ENTITLEMENT =
        "finora_dev_provision_usb_entitlement";

    public static final String EXTRA_INSTALLATION_ID =
        "finora_dev_installation_id";

    public static final String EXTRA_ACTIVATION_ID =
        "finora_dev_activation_id";

    public static final String EXTRA_OWNER_ID =
        "finora_dev_owner_id";

    public static final String EXTRA_BUSINESS_ID =
        "finora_dev_business_id";

    public static final String EXTRA_BRANCH_ID =
        "finora_dev_branch_id";

    public static final String EXTRA_BUSINESS_CODE =
        "finora_dev_business_code";

    public static final String EXTRA_BRANCH_CODE =
        "finora_dev_branch_code";

    public static final String EXTRA_ENTITLEMENT_USER_ID =
        "finora_dev_entitlement_user_id";

    public static final String EXTRA_LOCAL_ENTITLEMENT_ID =
        "finora_dev_local_entitlement_id";

    public static final String EXTRA_USB_ENTITLEMENT_ID =
        "finora_dev_usb_entitlement_id";

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    private FinoraDevProvisioning() {
    }

    // ========================================================
    // RUN
    // ========================================================

    public static void run(
        Context context,
        Intent intent,
        FinoraInstallationBindingCrypto.PublicBinding nativeBinding
    ) throws Exception {

        if (
            context == null ||
            intent == null
        ) {
            return;
        }

        if (nativeBinding == null) {
            throw new IllegalArgumentException(
                "FINORA native installation binding is required."
            );
        }

        String nativeInstallationId =
            nativeBinding.installationId;

        if (
            nativeInstallationId == null ||
            nativeInstallationId.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA native installation ID is invalid."
            );
        }

        if (!isDebuggable(context)) {
            return;
        }

        boolean shouldProvisionBranch =
            intent.getBooleanExtra(
                EXTRA_PROVISION_BRANCH,
                false
            );

        boolean shouldProvisionLocal =
            intent.getBooleanExtra(
                EXTRA_PROVISION_LOCAL_ENTITLEMENT,
                false
            );

        boolean shouldProvisionUsb =
            intent.getBooleanExtra(
                EXTRA_PROVISION_USB_ENTITLEMENT,
                false
            );        if (
            shouldProvisionLocal &&
            shouldProvisionUsb
        ) {
            throw new IllegalStateException(
                "FINORA Android DEV registration cannot provision both LOCAL and USB storage modes."
            );
        }


        if (
            !shouldProvisionBranch &&
            !shouldProvisionLocal &&
            !shouldProvisionUsb
        ) {
            return;
        }

        String ownerId =
            requireExtra(
                intent,
                EXTRA_OWNER_ID
            );

        String businessId =
            requireExtra(
                intent,
                EXTRA_BUSINESS_ID
            );

        String branchId =
            requireExtra(
                intent,
                EXTRA_BRANCH_ID
            );

        FinoraControlStore controlStore =
            new FinoraControlStore(
                context
            );

        JSONObject controlPackage =
            loadOrCreateControlPackage(
                controlStore
            );

        String now =
            java.time.Instant
                .now()
                .toString();

        if (shouldProvisionBranch) {
            String installationId =
                requireNativeInstallationId(
                    nativeInstallationId
                );

            /*
             * Backward-compatible development assertion only.
             *
             * EXTRA_INSTALLATION_ID no longer creates or selects
             * installation identity. Android Keystore binding is
             * authoritative.
             */
            String configuredInstallationId =
                intent.getStringExtra(
                    EXTRA_INSTALLATION_ID
                );

            if (
                configuredInstallationId != null
            ) {

                configuredInstallationId =
                    configuredInstallationId.trim();

                if (
                    !configuredInstallationId.isEmpty() &&
                    !configuredInstallationId.equals(
                        installationId
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Android DEV installation ID does not match the native installation binding."
                    );
                }
            }

            String activationId =
                requireExtra(
                    intent,
                    EXTRA_ACTIVATION_ID
                );

            String businessCode =
                requireExtra(
                    intent,
                    EXTRA_BUSINESS_CODE
                );

            String branchCode =
                requireExtra(
                    intent,
                    EXTRA_BRANCH_CODE
                );

            provisionInstallation(
                controlPackage,
                installationId,
                ownerId,
                businessId,
                branchId,
                businessCode,
                branchCode,
                now
            );

            provisionBranchActivation(
                controlPackage,
                activationId,
                ownerId,
                businessId,
                branchId,
                now
            );
        }

        if (
            shouldProvisionLocal ||
            shouldProvisionUsb
        ) {
            String userId =
                requireExtra(
                    intent,
                    EXTRA_ENTITLEMENT_USER_ID
                );

            if (shouldProvisionLocal) {
                String entitlementId =
                    requireExtra(
                        intent,
                        EXTRA_LOCAL_ENTITLEMENT_ID
                    );

                provisionBranchAccessGrant(
                    controlPackage,
                    entitlementId,
                    userId,
                    ownerId,
                    businessId,
                    branchId,
                    "LOCAL",
                    now
                );

                provisionStorageEntitlement(
                    controlPackage,
                    entitlementId,
                    userId,
                    ownerId,
                    businessId,
                    branchId,
                    nativeBinding,
                    "LOCAL",
                    now
                );
            }

            if (shouldProvisionUsb) {
                String entitlementId =
                    requireExtra(
                        intent,
                        EXTRA_USB_ENTITLEMENT_ID
                    );

                provisionBranchAccessGrant(
                    controlPackage,
                    entitlementId,
                    userId,
                    ownerId,
                    businessId,
                    branchId,
                    "USB",
                    now
                );

                provisionStorageEntitlement(
                    controlPackage,
                    entitlementId,
                    userId,
                    ownerId,
                    businessId,
                    branchId,
                    nativeBinding,
                    "USB",
                    now
                );
            }
        }

        controlPackage.put(
            "updatedAt",
            now
        );

        controlStore.write(
            controlPackage.toString()
        );

        Log.i(
            TAG,
            "FINORA Android development provisioning completed."
        );
    }

    // ========================================================
    // DEBUGGABLE CHECK
    // ========================================================

    private static boolean isDebuggable(
        Context context
    ) {
        ApplicationInfo applicationInfo =
            context.getApplicationInfo();

        return (
            applicationInfo != null &&
            (
                applicationInfo.flags &
                ApplicationInfo.FLAG_DEBUGGABLE
            ) != 0
        );
    }

    // ========================================================
    // LOAD / CREATE PACKAGE
    // ========================================================

    private static JSONObject loadOrCreateControlPackage(
        FinoraControlStore controlStore
    ) throws Exception {

        String raw =
            controlStore.read();

        if (raw == null) {
            JSONObject created =
                new JSONObject();

            created.put(
                "version",
                CONTROL_VERSION
            );

            created.put(
                "activations",
                new JSONArray()
            );

            created.put(
                "storageEntitlements",
                new JSONArray()
            );
            created.put(
                "branchAccessGrants",
                new JSONArray()
            );

            created.put(
                "updatedAt",
                java.time.Instant
                    .now()
                    .toString()
            );

            return created;
        }

        JSONObject existing =
            new JSONObject(
                raw
            );

        if (
            !CONTROL_VERSION.equals(
                existing.optString(
                    "version",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "Unsupported FINORA Android Control Store package version."
            );
        }

        if (
            existing.optJSONArray(
                "activations"
            ) == null ||
            existing.optJSONArray(
                "storageEntitlements"
            ) == null
        ) {
            throw new IllegalStateException(
                "FINORA Android Control Store package is incomplete."
            );
        }

                JSONArray branchAccessGrants =
            existing.optJSONArray(
                "branchAccessGrants"
            );

        if (branchAccessGrants == null) {
            if (
                existing.has(
                    "branchAccessGrants"
                ) &&
                !existing.isNull(
                    "branchAccessGrants"
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Android Branch Access Grant collection is invalid."
                );
            }

            existing.put(
                "branchAccessGrants",
                new JSONArray()
            );
        }
return existing;
    }

    // ========================================================
    // INSTALLATION
    // ========================================================

    private static void provisionInstallation(
        JSONObject controlPackage,
        String installationId,
        String ownerId,
        String businessId,
        String branchId,
        String businessCode,
        String branchCode,
        String now
    ) throws Exception {

        JSONObject existing =
            controlPackage.optJSONObject(
                "installation"
            );

        if (existing != null) {
            ensureSameIdentity(
                existing,
                "installationId",
                installationId,
                "FINORA installation identity cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "ownerId",
                ownerId,
                "FINORA installation Owner ID cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "businessId",
                businessId,
                "FINORA installation Business ID cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "branchId",
                branchId,
                "FINORA installation Branch ID cannot be replaced."
            );

            String existingBusinessCode =
                existing.optString(
                    "businessCode",
                    ""
                ).trim();

            String existingBranchCode =
                existing.optString(
                    "branchCode",
                    ""
                ).trim();

            boolean hasExistingBusinessCode =
                !existingBusinessCode.isEmpty();

            boolean hasExistingBranchCode =
                !existingBranchCode.isEmpty();

            if (
                hasExistingBusinessCode !=
                hasExistingBranchCode
            ) {
                throw new IllegalStateException(
                    "FINORA installation numbering codes are incomplete."
                );
            }

            if (
                hasExistingBusinessCode
            ) {
                if (
                    !existingBusinessCode.equals(
                        businessCode
                    ) ||
                    !existingBranchCode.equals(
                        branchCode
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA installation numbering codes cannot be replaced."
                    );
                }
            } else {
                existing.put(
                    "businessCode",
                    businessCode
                );

                existing.put(
                    "branchCode",
                    branchCode
                );
            }

            existing.put(
                "updatedAt",
                now
            );

            return;
        }

        JSONObject installation =
            new JSONObject();

        installation.put(
            "installationId",
            installationId
        );

        installation.put(
            "ownerId",
            ownerId
        );

        installation.put(
            "businessId",
            businessId
        );

        installation.put(
            "branchId",
            branchId
        );

        installation.put(
            "businessCode",
            businessCode
        );

        installation.put(
            "branchCode",
            branchCode
        );

        installation.put(
            "createdAt",
            now
        );

        installation.put(
            "updatedAt",
            now
        );

        installation.put(
            "schemaVersion",
            1
        );

        controlPackage.put(
            "installation",
            installation
        );
    }

    // ========================================================
    // BRANCH ACTIVATION
    // ========================================================

    private static void provisionBranchActivation(
        JSONObject controlPackage,
        String activationId,
        String ownerId,
        String businessId,
        String branchId,
        String now
    ) throws Exception {

        JSONArray activations =
            controlPackage.getJSONArray(
                "activations"
            );

        JSONObject existing =
            findActivation(
                activations,
                ownerId,
                businessId,
                branchId
            );

        if (existing != null) {
            ensureSameIdentity(
                existing,
                "activationId",
                activationId,
                "FINORA branch activation identity cannot be replaced."
            );

            existing.put(
                "status",
                "ACTIVE"
            );

            if (
                !hasNonEmptyString(
                    existing,
                    "activatedAt"
                )
            ) {
                existing.put(
                    "activatedAt",
                    now
                );
            }

            existing.put(
                "updatedAt",
                now
            );

            return;
        }

        JSONObject activation =
            new JSONObject();

        activation.put(
            "activationId",
            activationId
        );

        activation.put(
            "ownerId",
            ownerId
        );

        activation.put(
            "businessId",
            businessId
        );

        activation.put(
            "branchId",
            branchId
        );

        activation.put(
            "status",
            "ACTIVE"
        );

        activation.put(
            "activatedAt",
            now
        );

        activation.put(
            "createdAt",
            now
        );

        activation.put(
            "updatedAt",
            now
        );

        activation.put(
            "schemaVersion",
            1
        );

        activations.put(
            activation
        );
    }

    // ========================================================
    // STORAGE ENTITLEMENT
        // ========================================================
    // DEVELOPMENT REGISTERED BRANCH ACCESS
    // ========================================================

    private static void provisionBranchAccessGrant(
        JSONObject controlPackage,
        String entitlementId,
        String userId,
        String ownerId,
        String businessId,
        String branchId,
        String storageMode,
        String now
    ) throws Exception {

        if (
            !"LOCAL".equals(
                storageMode
            ) &&
            !"USB".equals(
                storageMode
            )
        ) {
            throw new IllegalStateException(
                "FINORA Android DEV Branch Access storage mode must be LOCAL or USB."
            );
        }

        JSONArray grants =
            controlPackage.optJSONArray(
                "branchAccessGrants"
            );

        if (grants == null) {
            throw new IllegalStateException(
                "FINORA Android Branch Access Grant collection is unavailable."
            );
        }

        JSONObject existing =
            null;

        for (
            int index = 0;
            index < grants.length();
            index++
        ) {
            JSONObject candidate =
                grants.getJSONObject(
                    index
                );

            if (
                userId.equals(
                    candidate.optString(
                        "userId",
                        ""
                    )
                ) &&
                ownerId.equals(
                    candidate.optString(
                        "ownerId",
                        ""
                    )
                ) &&
                businessId.equals(
                    candidate.optString(
                        "businessId",
                        ""
                    )
                ) &&
                branchId.equals(
                    candidate.optString(
                        "branchId",
                        ""
                    )
                )
            ) {
                existing =
                    candidate;

                break;
            }
        }

        String grantId =
            "FINORA-DEV-GRANT-" +
            entitlementId;

        if (existing != null) {
            ensureSameIdentity(
                existing,
                "grantId",
                grantId,
                "FINORA Android DEV Branch Access Grant identity cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "storageMode",
                storageMode,
                "FINORA Android DEV registration storage mode cannot be changed."
            );

            ensureSameIdentity(
                existing,
                "accessType",
                "REGISTERED",
                "FINORA Android DEV Branch Access type cannot be replaced."
            );

            return;
        }

        java.time.Instant validFrom =
            java.time.Instant.parse(
                now
            );

        java.time.Instant validUntil =
            validFrom.plusSeconds(
                365L * 24L * 60L * 60L
            );

        JSONObject validity =
            new JSONObject();

        validity.put(
            "validFrom",
            validFrom.toString()
        );

        validity.put(
            "validUntil",
            validUntil.toString()
        );

        JSONObject payment =
            new JSONObject();

        payment.put(
            "amount",
            2000
        );

        payment.put(
            "currency",
            "INR"
        );

        payment.put(
            "paymentMode",
            "CASH"
        );

        payment.put(
            "paidAt",
            now
        );

        payment.put(
            "remarks",
            "FINORA trusted Android development provisioning."
        );

        payment.put(
            "refundable",
            false
        );

        JSONObject grant =
            new JSONObject();

        grant.put(
            "grantId",
            grantId
        );

        grant.put(
            "userId",
            userId
        );

        grant.put(
            "ownerId",
            ownerId
        );

        grant.put(
            "businessId",
            businessId
        );

        grant.put(
            "branchId",
            branchId
        );

        grant.put(
            "storageMode",
            storageMode
        );

        grant.put(
            "accessType",
            "REGISTERED"
        );

        grant.put(
            "administrativeStatus",
            "ACTIVE"
        );

        grant.put(
            "validity",
            validity
        );

        grant.put(
            "registrationPayment",
            payment
        );

        grant.put(
            "registrationCycle",
            1
        );

        grant.put(
            "createdAt",
            now
        );

        grant.put(
            "updatedAt",
            now
        );

        grant.put(
            "schemaVersion",
            1
        );

        grants.put(
            grant
        );
    }

// ========================================================

    private static void provisionStorageEntitlement(
        JSONObject controlPackage,
        String entitlementId,
        String userId,
        String ownerId,
        String businessId,
        String branchId,
        FinoraInstallationBindingCrypto.PublicBinding nativeBinding,
        String storageMode,
        String now
    ) throws Exception {

        JSONArray entitlements =
            controlPackage.getJSONArray(
                "storageEntitlements"
            );

        JSONObject existing =
            findStorageEntitlement(
                entitlements,
                userId,
                ownerId,
                businessId,
                branchId,
                storageMode
            );

        if (existing != null) {
            ensureSameIdentity(
                existing,
                "entitlementId",
                entitlementId,
                "FINORA storage entitlement identity cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "installationId",
                nativeBinding.installationId,
                "FINORA storage entitlement installation cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "bindingKeyId",
                nativeBinding.bindingKeyId,
                "FINORA storage entitlement binding key cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "fingerprintAlgorithm",
                nativeBinding.fingerprintAlgorithm,
                "FINORA storage entitlement fingerprint algorithm cannot be replaced."
            );

            ensureSameIdentity(
                existing,
                "publicKeyFingerprint",
                nativeBinding.publicKeyFingerprint,
                "FINORA storage entitlement fingerprint cannot be replaced."
            );

            existing.put(
                "status",
                "ACTIVE"
            );

            existing.put(
                "updatedAt",
                now
            );

            return;
        }

        JSONObject entitlement =
            new JSONObject();

        entitlement.put(
            "entitlementId",
            entitlementId
        );

        entitlement.put(
            "userId",
            userId
        );

        entitlement.put(
            "ownerId",
            ownerId
        );

        entitlement.put(
            "businessId",
            businessId
        );

        entitlement.put(
            "branchId",
            branchId
        );


        entitlement.put(
            "installationId",
            nativeBinding.installationId
        );

        entitlement.put(
            "bindingKeyId",
            nativeBinding.bindingKeyId
        );

        entitlement.put(
            "fingerprintAlgorithm",
            nativeBinding.fingerprintAlgorithm
        );

        entitlement.put(
            "publicKeyFingerprint",
            nativeBinding.publicKeyFingerprint
        );

        entitlement.put(
            "storageMode",
            storageMode
        );

        entitlement.put(
            "status",
            "ACTIVE"
        );

        entitlement.put(
            "activatedAt",
            now
        );

        entitlement.put(
            "createdAt",
            now
        );

        entitlement.put(
            "updatedAt",
            now
        );

        entitlement.put(
            "schemaVersion",
            1
        );

        entitlements.put(
            entitlement
        );
    }

    // ========================================================
    // FIND ACTIVATION
    // ========================================================

    private static JSONObject findActivation(
        JSONArray activations,
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

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
                    activation.optString(
                        "ownerId",
                        ""
                    )
                ) &&
                businessId.equals(
                    activation.optString(
                        "businessId",
                        ""
                    )
                ) &&
                branchId.equals(
                    activation.optString(
                        "branchId",
                        ""
                    )
                )
            ) {
                return activation;
            }
        }

        return null;
    }

    // ========================================================
    // FIND STORAGE ENTITLEMENT
    // ========================================================

    private static JSONObject findStorageEntitlement(
        JSONArray entitlements,
        String userId,
        String ownerId,
        String businessId,
        String branchId,
        String storageMode
    ) throws Exception {

        for (
            int index = 0;
            index < entitlements.length();
            index++
        ) {
            JSONObject entitlement =
                entitlements.getJSONObject(
                    index
                );

            if (
                userId.equals(
                    entitlement.optString(
                        "userId",
                        ""
                    )
                ) &&
                ownerId.equals(
                    entitlement.optString(
                        "ownerId",
                        ""
                    )
                ) &&
                businessId.equals(
                    entitlement.optString(
                        "businessId",
                        ""
                    )
                ) &&
                branchId.equals(
                    entitlement.optString(
                        "branchId",
                        ""
                    )
                ) &&
                storageMode.equals(
                    entitlement.optString(
                        "storageMode",
                        ""
                    )
                )
            ) {
                return entitlement;
            }
        }

        return null;
    }

    // ========================================================
    // IDENTITY GUARD
    // ========================================================

    private static void ensureSameIdentity(
        JSONObject value,
        String key,
        String expected,
        String errorMessage
    ) {
        String existing =
            value.optString(
                key,
                ""
            );

        if (!expected.equals(existing)) {
            throw new IllegalStateException(
                errorMessage
            );
        }
    }

    // ========================================================
    // STRING HELPERS
    // ========================================================

    private static String requireNativeInstallationId(
        String value
    ) {

        if (value == null) {
            throw new IllegalStateException(
                "FINORA Android native installation binding is required."
            );
        }

        String normalized =
            value.trim();

        if (normalized.isEmpty()) {
            throw new IllegalStateException(
                "FINORA Android native installation binding is required."
            );
        }

        return normalized;
    }
    private static String requireExtra(
        Intent intent,
        String key
    ) {
        String value =
            intent.getStringExtra(
                key
            );

        if (value == null) {
            throw new IllegalArgumentException(
                "Missing required FINORA Android development extra: " +
                key
            );
        }

        String normalized =
            value.trim();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException(
                "Missing required FINORA Android development extra: " +
                key
            );
        }

        return normalized;
    }

    private static boolean hasNonEmptyString(
        JSONObject value,
        String key
    ) {
        String stringValue =
            value.optString(
                key,
                ""
            );

        return (
            stringValue != null &&
            !stringValue.trim().isEmpty()
        );
    }
}
