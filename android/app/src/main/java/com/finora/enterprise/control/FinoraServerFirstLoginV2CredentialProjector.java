package com.finora.enterprise.control;

import org.json.JSONObject;

/**
 * Converts an independently verified server-first V2 recovery
 * pair into the existing native Android Branch Credential format.
 *
 * Does not verify USB by itself, persist state, hydrate a device,
 * or issue any login session.
 */
public final class FinoraServerFirstLoginV2CredentialProjector {

    private FinoraServerFirstLoginV2CredentialProjector() {}

    public static FinoraBranchCredentialContract.Credential project(
        FinoraServerFirstLoginV2RecoveryVerificationGate.VerifiedPair verified
    ) throws Exception {

        if (
            verified == null ||
            verified.portablePayload == null ||
            verified.runtimeAuthority == null ||
            verified.verifiedEnvelope == null
        ) {
            throw new SecurityException(
                "Verified V2 material is required."
            );
        }

        JSONObject portable = verified.portablePayload;
        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload
            runtime = verified.runtimeAuthority;

        if (
            !verified.portableAuthFingerprint.equals(
                runtime.portableAuthFingerprint
            ) ||
            !portable.getString("canonicalUsername").equals(
                runtime.canonicalUsername
            ) ||
            !portable.getString("ownerId").equals(runtime.ownerId) ||
            !portable.getString("businessId").equals(runtime.businessId) ||
            !portable.getString("branchId").equals(runtime.branchId) ||
            !portable.getString("userId").equals(runtime.userId) ||
            !portable.getString("sourceAuthorizationId").equals(
                runtime.sourceAuthorizationId
            ) ||
            portable.getLong("authGeneration") != runtime.authGeneration ||
            !"USB".equals(runtime.storageMode) ||
            !"REAL".equals(runtime.dataContext)
        ) {
            throw new SecurityException(
                "P117_SCOPE_CONTINUITY"
            );
        }

        // FINORA_P1_112_STAGE
        FinoraBranchCredentialContract.Verifier password;
        try {
            password = projectFactor(
                verified.verifiedEnvelope.getJSONObject("passwordFactor")
            );
        } catch (Exception error) {
            throw new SecurityException("P112_PASSWORD_FACTOR");
        }

        FinoraBranchCredentialContract.Verifier security;
        try {
            security = projectFactor(
                verified.verifiedEnvelope.getJSONObject("securityFactor")
            );
        } catch (Exception error) {
            throw new SecurityException("P112_SECURITY_FACTOR");
        }

        FinoraBranchCredentialContract.Credential credential =
            new FinoraBranchCredentialContract.Credential(
                runtime.credentialId,
                portable.getString("sourceAuthorizationId"),
                Long.valueOf(portable.getLong("authGeneration")),
                portable.getString("userId"),
                portable.getString("username"),
                portable.getString("canonicalUsername"),
                portable.getString("fullName"),
                portable.getString("role"),
                portable.getString("ownerId"),
                portable.getString("businessId"),
                portable.getString("branchId"),
                "USB",
                "REAL",
                runtime.demoId,
                FinoraBranchCredentialContract.STATUS_ACTIVE,
                password,
                security,
                portable.getString("createdAt"),
                portable.getString("updatedAt"),
                FinoraBranchCredentialContract.SCHEMA_VERSION
            );

        // FINORA_P1_117_STAGE
        try {
            FinoraBranchCredentialContract.validate(credential);
        } catch (Exception error) {
            // FINORA_P1_119_DIAGNOSTIC
            // Never expose raw exception content or credential values.
            String reason = error.getMessage();
            String category = "OTHER";

            if (reason != null) {
                if (reason.contains("createdAt")) {
                    category = "CREATED_AT";
                } else if (reason.contains("updatedAt")) {
                    category = "UPDATED_AT";
                } else if (reason.contains("canonicalUsername")) {
                    category = "USERNAME";
                } else if (reason.contains("role")) {
                    category = "ROLE";
                } else if (reason.contains("verifier") ||
                           reason.contains("Verifier")) {
                    category = "VERIFIER";
                } else if (reason.contains("schemaVersion")) {
                    category = "SCHEMA";
                } else if (reason.contains("demoId")) {
                    category = "DEMO_SCOPE";
                } else if (reason.contains("credentialId")) {
                    category = "CREDENTIAL_ID";
                } else if (reason.contains("sourceAuthorizationId")) {
                    category = "AUTHORIZATION_ID";
                } else if (reason.contains("authGeneration")) {
                    category = "AUTH_GENERATION";
                }
            }

            throw new SecurityException(
                "P119_NATIVE_" + category
            );
        }

        return credential;
    }

    private static FinoraBranchCredentialContract.Verifier projectFactor(
        JSONObject factor
    ) throws Exception {

        if (factor == null) {
            throw new SecurityException(
                "V2 verifier factor is missing."
            );
        }

        return FinoraBranchCredentialContract
            .projectPortableVerifierValues(
                factor.getString("algorithm"),
                factor.getString("salt"),
                factor.getInt("N"),
                factor.getInt("r"),
                factor.getInt("p"),
                factor.getInt("derivedKeyLength"),
                factor.getInt("verifierLength"),
                factor.getString("verifier")
            );
    }
}