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

    // ========================================================
    // LOAD
    // ========================================================

    @Override
    public void load() {
        this.controlStore =
            new FinoraControlStore(
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

                if (identityMatches) {
                    boolean active =
                        "ACTIVE".equals(
                            entitlement.getString(
                                "status"
                            )
                        );

                    resolveBooleanSuccess(
                        call,
                        active
                    );

                    return;
                }
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

        ensureUniqueActivations(
            activations
        );

        ensureUniqueEntitlements(
            entitlements
        );
    }

    // ========================================================
    // INSTALLATION VALIDATION
    // ========================================================

    private boolean isValidInstallation(
        JSONObject value
    ) {
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
    // ENTITLEMENT VALIDATION
    // ========================================================

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