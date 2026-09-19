package com.finora.enterprise.control;

import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Production authorization adapter for Android authoritative login sessions.
 */
public final class FinoraBranchLoginSessionProductionAuthorizationAdapter
    implements FinoraBranchLoginSessionAuthority.AuthorizationPort {

    interface DeviceTrustCheckPort {
        FinoraBranchDeviceTrustAuthority.Result check(
            FinoraBranchDeviceTrustAuthority.Principal principal
        );
    }

    private final FinoraBranchCredentialStore credentialStore;
    private final FinoraBranchAccessRuntimeAuthority branchAccessAuthority;
    private final FinoraBranchAccessRuntimeProductionAdapters.ValidatedControlStatePort controlState;
    private final DeviceTrustCheckPort deviceTrustCheck;

    public FinoraBranchLoginSessionProductionAuthorizationAdapter(
        FinoraBranchCredentialStore credentialStore,
        FinoraBranchAccessRuntimeAuthority branchAccessAuthority,
        FinoraBranchAccessRuntimeProductionAdapters.ValidatedControlStatePort controlState,
        DeviceTrustCheckPort deviceTrustCheck
    ) {
        if (credentialStore == null || branchAccessAuthority == null || controlState == null || deviceTrustCheck == null) {
            throw new IllegalArgumentException("Session production authorization dependencies are required.");
        }
        this.credentialStore = credentialStore;
        this.branchAccessAuthority = branchAccessAuthority;
        this.controlState = controlState;
        this.deviceTrustCheck = deviceTrustCheck;
    }

    @Override
    public FinoraBranchLoginSessionAuthority.AuthorizationResult authorize(
        String credentialId,
        String selectedStorageMode
    ) {
        synchronized (FinoraControlPackageApplyLock.LOCK) {
            try {
                if (credentialId == null || credentialId.trim().isEmpty()) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_SESSION_INVALID, "FINORA session credential is invalid.");
                }
                if (!"LOCAL".equals(selectedStorageMode) && !"USB".equals(selectedStorageMode)) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_STORAGE_MODE_MISMATCH, "FINORA session storage mode is invalid.");
                }

                FinoraBranchCredentialContract.Credential credential = findCredential(credentialId);
                if (credential == null || !"ACTIVE".equals(credential.status)) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_SESSION_INVALID, "FINORA session credential is no longer active.");
                }
                if (!selectedStorageMode.equals(credential.storageMode)) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_STORAGE_MODE_MISMATCH, "FINORA session storage mode no longer matches the credential.");
                }

                String raw = controlState.readValidated();
                if (raw == null) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_CONTROL_STATE_FAILED, "FINORA validated Control Store is unavailable.");
                }
                JSONObject controlPackage = new JSONObject(raw);

                if (!hasActiveActivation(controlPackage, credential)) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_ACTIVATION_REQUIRED, "FINORA branch activation is not ACTIVE.");
                }

                FinoraBranchAccessRuntimeAuthority.Result access = branchAccessAuthority.evaluate(
                    credential.userId,
                    credential.ownerId,
                    credential.businessId,
                    credential.branchId
                );
                if (!access.success) {
                    if ("INSTALLATION_BINDING_UNAVAILABLE".equals(access.clockErrorCode)) {
                        return failure(FinoraBranchLoginSessionAuthority.ERROR_NATIVE_BINDING_UNAVAILABLE, "FINORA native installation binding is unavailable.");
                    }
                    return failure(
                        FinoraBranchLoginSessionAuthority.ERROR_CONTROL_STATE_FAILED,
                        access.error == null ? "Unable to evaluate authoritative FINORA Branch Access." : access.error
                    );
                }

                JSONObject grant = findExactBranchAccessGrant(controlPackage, credential);
                String accessMode;
                if (FinoraBranchAccessRuntimeEvaluator.ACTIVE.equals(access.data.state) && access.data.allowed) {
                    if (grant == null) {
                        return failure(FinoraBranchLoginSessionAuthority.ERROR_CONTROL_STATE_FAILED, "FINORA ACTIVE Branch Access grant is missing.");
                    }
                    accessMode = FinoraBranchLoginSessionAuthority.ACCESS_MODE_ACTIVE;
                } else if (FinoraBranchAccessRuntimeEvaluator.EXPIRED.equals(access.data.state)) {
                    if (grant != null && "REGISTERED".equals(grant.optString("accessType", ""))) {
                        accessMode = FinoraBranchLoginSessionAuthority.ACCESS_MODE_REGISTERED_EXPIRED_READ_ONLY;
                    } else {
                        return failure(FinoraBranchLoginSessionAuthority.ERROR_BRANCH_ACCESS_DENIED, access.data.reason);
                    }
                } else {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_BRANCH_ACCESS_DENIED, access.data.reason);
                }

                FinoraBranchLoginSessionAuthority.AuthorizationResult grantContinuity =
                    verifyGrantContinuity(credential, selectedStorageMode, grant);
                if (grantContinuity != null) {
                    return grantContinuity;
                }

                if (!hasLogicalActiveStorageEntitlement(controlPackage, credential, selectedStorageMode)) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_STORAGE_ENTITLEMENT_DENIED, "FINORA ACTIVE storage entitlement is required.");
                }

                long authGeneration = credential.authGeneration == null ? 1L : credential.authGeneration.longValue();
                FinoraBranchDeviceTrustAuthority.Principal deviceTrustPrincipal = new FinoraBranchDeviceTrustAuthority.Principal(
                    authGeneration, credential.userId, credential.username, credential.ownerId, credential.businessId, credential.branchId, credential.storageMode, credential.dataContext, credential.demoId
                );
                FinoraBranchDeviceTrustAuthority.Result deviceTrust = deviceTrustCheck.check(deviceTrustPrincipal);
                if (deviceTrust == null) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_DEVICE_TRUST_FAILED, "FINORA current device trust could not be validated.");
                }
                if (!deviceTrust.success) {
                    if (FinoraBranchDeviceTrustAuthority.ERROR_NATIVE_BINDING_UNAVAILABLE.equals(deviceTrust.errorCode)) {
                        return failure(FinoraBranchLoginSessionAuthority.ERROR_NATIVE_BINDING_UNAVAILABLE, "FINORA native installation binding is unavailable.");
                    }
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_DEVICE_TRUST_FAILED, deviceTrust.error == null ? "FINORA current device trust failed." : deviceTrust.error);
                }
                if (!FinoraBranchDeviceTrustAuthority.STATUS_TRUSTED.equals(deviceTrust.status)) {
                    return failure(FinoraBranchLoginSessionAuthority.ERROR_DEVICE_TRUST_FAILED, "FINORA current device is no longer trusted.");
                }
                FinoraBranchLoginSessionAuthority.Principal principal = new FinoraBranchLoginSessionAuthority.Principal(
                    credential.credentialId,
                    authGeneration,
                    credential.userId,
                    credential.username,
                    credential.fullName,
                    credential.role,
                    credential.ownerId,
                    credential.businessId,
                    credential.branchId,
                    credential.storageMode,
                    credential.dataContext,
                    credential.demoId
                );
                return FinoraBranchLoginSessionAuthority.AuthorizationResult.success(principal, accessMode);
            } catch (Exception error) {
                return failure(
                    FinoraBranchLoginSessionAuthority.ERROR_CONTROL_STATE_FAILED,
                    messageOrFallback(error, "Unable to authorize FINORA login session.")
                );
            }
        }
    }

    private FinoraBranchCredentialContract.Credential findCredential(String credentialId) throws Exception {
        List<FinoraBranchCredentialContract.Credential> credentials = credentialStore.readAll();
        FinoraBranchCredentialContract.Credential match = null;
        for (FinoraBranchCredentialContract.Credential credential : credentials) {
            if (credentialId.equals(credential.credentialId)) {
                if (match != null) {
                    throw new IllegalStateException("Duplicate FINORA credential ID.");
                }
                match = credential;
            }
        }
        return match;
    }

    private static boolean hasActiveActivation(
        JSONObject controlPackage,
        FinoraBranchCredentialContract.Credential credential
    ) throws Exception {
        JSONArray activations = controlPackage.optJSONArray("activations");
        if (activations == null) {
            throw new IllegalStateException("FINORA activation collection is unavailable.");
        }
        JSONObject match = null;
        for (int index = 0; index < activations.length(); index++) {
            JSONObject activation = activations.getJSONObject(index);
            if (
                credential.ownerId.equals(activation.getString("ownerId")) &&
                credential.businessId.equals(activation.getString("businessId")) &&
                credential.branchId.equals(activation.getString("branchId"))
            ) {
                if (match != null) {
                    throw new IllegalStateException("Duplicate FINORA branch activation.");
                }
                match = activation;
            }
        }
        return match != null && "ACTIVE".equals(match.getString("status"));
    }

    private static JSONObject findExactBranchAccessGrant(
        JSONObject controlPackage,
        FinoraBranchCredentialContract.Credential credential
    ) throws Exception {
        JSONArray grants = controlPackage.optJSONArray("branchAccessGrants");
        if (grants == null) {
            return null;
        }
        JSONObject match = null;
        for (int index = 0; index < grants.length(); index++) {
            JSONObject grant = grants.getJSONObject(index);
            if (
                credential.userId.equals(grant.getString("userId")) &&
                credential.ownerId.equals(grant.getString("ownerId")) &&
                credential.businessId.equals(grant.getString("businessId")) &&
                credential.branchId.equals(grant.getString("branchId"))
            ) {
                if (match != null) {
                    throw new IllegalStateException("Duplicate FINORA Branch Access grant.");
                }
                match = grant;
            }
        }
        return match;
    }

    private static FinoraBranchLoginSessionAuthority.AuthorizationResult verifyGrantContinuity(
        FinoraBranchCredentialContract.Credential credential,
        String selectedStorageMode,
        JSONObject grant
    ) throws Exception {
        if (grant == null) {
            return failure(FinoraBranchLoginSessionAuthority.ERROR_CONTROL_STATE_FAILED, "FINORA Branch Access grant is unavailable.");
        }
        if (!selectedStorageMode.equals(grant.getString("storageMode"))) {
            return failure(FinoraBranchLoginSessionAuthority.ERROR_STORAGE_MODE_MISMATCH, "FINORA Branch Access storage mode no longer matches the session.");
        }
        String accessType = grant.getString("accessType");
        if ("REAL".equals(credential.dataContext)) {
            return "REGISTERED".equals(accessType)
                ? null
                : failure(FinoraBranchLoginSessionAuthority.ERROR_BRANCH_ACCESS_DENIED, "FINORA registered access is required for REAL data.");
        }
        if ("DEMO".equals(credential.dataContext)) {
            String grantDemoId = grant.optString("demoId", null);
            return "DEMO".equals(accessType) && credential.demoId != null && credential.demoId.equals(grantDemoId)
                ? null
                : failure(FinoraBranchLoginSessionAuthority.ERROR_BRANCH_ACCESS_DENIED, "FINORA Demo access does not match the authenticated session.");
        }
        return failure(FinoraBranchLoginSessionAuthority.ERROR_SESSION_INVALID, "FINORA session data context is invalid.");
    }

    private static boolean hasLogicalActiveStorageEntitlement(
        JSONObject controlPackage,
        FinoraBranchCredentialContract.Credential credential,
        String selectedStorageMode
    ) throws Exception {
        JSONArray entitlements = controlPackage.optJSONArray("storageEntitlements");
        if (entitlements == null) {
            throw new IllegalStateException("FINORA storage entitlement collection is unavailable.");
        }
        JSONObject match = null;
        for (int index = 0; index < entitlements.length(); index++) {
            JSONObject entitlement = entitlements.getJSONObject(index);
            if (
                credential.userId.equals(entitlement.getString("userId")) &&
                credential.ownerId.equals(entitlement.getString("ownerId")) &&
                credential.businessId.equals(entitlement.getString("businessId")) &&
                credential.branchId.equals(entitlement.getString("branchId")) &&
                selectedStorageMode.equals(entitlement.getString("storageMode"))
            ) {
                if (match != null) {
                    throw new IllegalStateException("Duplicate FINORA storage entitlement.");
                }
                match = entitlement;
            }
        }
        return match != null && "ACTIVE".equals(match.getString("status"));
    }

    private static FinoraBranchLoginSessionAuthority.AuthorizationResult failure(String errorCode, String error) {
        return FinoraBranchLoginSessionAuthority.AuthorizationResult.failure(
            errorCode,
            error == null || error.trim().isEmpty() ? "FINORA session authorization failed." : error
        );
    }

    private static String messageOrFallback(Exception error, String fallback) {
        String message = error.getMessage();
        return message == null || message.trim().isEmpty() ? fallback : message;
    }
}
