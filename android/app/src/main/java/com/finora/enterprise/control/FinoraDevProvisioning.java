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
        Intent intent
    ) throws Exception {

        if (
            context == null ||
            intent == null
        ) {
            return;
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
            );

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
                requireExtra(
                    intent,
                    EXTRA_INSTALLATION_ID
                );

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

                provisionStorageEntitlement(
                    controlPackage,
                    entitlementId,
                    userId,
                    ownerId,
                    businessId,
                    branchId,
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

                provisionStorageEntitlement(
                    controlPackage,
                    entitlementId,
                    userId,
                    ownerId,
                    businessId,
                    branchId,
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

    private static void provisionStorageEntitlement(
        JSONObject controlPackage,
        String entitlementId,
        String userId,
        String ownerId,
        String businessId,
        String branchId,
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
