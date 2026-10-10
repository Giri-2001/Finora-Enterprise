package com.finora.enterprise.control;

import org.json.JSONObject;

import java.util.Base64;

/**
 * Exact Windows server-first Runtime Authority payload mapping.
 *
 * Input authority must pass the existing pinned-signature and
 * server bootstrap preflight.
 *
 * No signing, USB writes, hydration or session creation.
 */
public final class FinoraServerFirstLoginRuntimePayloadBuilder {

    private FinoraServerFirstLoginRuntimePayloadBuilder() {}

    public static JSONObject build(
        FinoraServerFirstLoginClient.Result serverResult,
        String requestedUsername,
        String selectedAccountFolderName,
        String portableAuthFingerprint
    ) throws Exception {

        if (
            portableAuthFingerprint == null ||
            !portableAuthFingerprint.matches("^[0-9a-f]{64}$")
        ) {
            throw new SecurityException(
                "Portable Auth V2 fingerprint is invalid."
            );
        }

        FinoraServerFirstLoginEnrollmentPreflight.Result
            preflight =
                FinoraServerFirstLoginEnrollmentPreflight.evaluate(
                    serverResult,
                    requestedUsername,
                    selectedAccountFolderName
                );

        if (
            preflight == null ||
            !preflight.ready() ||
            preflight.verifiedPayload == null
        ) {
            throw new SecurityException(
                "Signed server-first bootstrap verification failed."
            );
        }

        JSONObject server =
            new JSONObject(
                preflight.verifiedPayload.toString()
            );

        String canonical =
            server.getString("canonicalUsername");

        if (
            !FinoraServerFirstLoginPayloadValidator.validate(
                server,
                canonical
            )
        ) {
            throw new SecurityException(
                "Server-first bootstrap semantics invalid."
            );
        }

        if (
            !"USB".equals(server.getString("storageMode")) ||
            !"REAL".equals(server.getString("dataContext")) ||
            !"REGISTERED".equals(
                server.getString("branchAccessType")
            ) ||
            !"ACTIVE".equals(server.getString("accessMode")) ||
            server.getInt("authGeneration") != 1
        ) {
            throw new SecurityException(
                "Server-first Runtime Authority scope invalid."
            );
        }

        JSONObject payload = new JSONObject();

        payload.put("schemaVersion", 1);
        payload.put(
            "purpose",
            FinoraPortableFreshDeviceRuntimeAuthorityContract.PURPOSE
        );

        // All identity, authorization and grant IDs are signed
        // server-origin values. Never fabricate replacements.
        copyRequired(
            server,
            payload,
            "authorityId",
            "sourceAuthorizationId",
            "credentialId",
            "activationId",
            "branchAccessGrantId",
            "storageEntitlementId",
            "ownerId",
            "businessId",
            "branchId"
        );

        copyNullable(
            server,
            payload,
            "businessCode",
            "branchCode"
        );

        copyRequired(
            server,
            payload,
            "userId",
            "username",
            "canonicalUsername",
            "fullName",
            "role"
        );

        payload.put("storageMode", "USB");
        payload.put("dataContext", "REAL");
        payload.put("demoId", JSONObject.NULL);
        payload.put("authGeneration", 1);

        payload.put("activationStatus", "ACTIVE");

        copyRequired(
            server,
            payload,
            "activationActivatedAt",
            "activationCreatedAt",
            "activationUpdatedAt"
        );

        payload.put("branchAccessType", "REGISTERED");
        payload.put("registrationPayment", JSONObject.NULL);
        payload.put("registrationCycle", JSONObject.NULL);
        payload.put("demoRemarks", JSONObject.NULL);
        payload.put("accessMode", "ACTIVE");

        copyRequired(
            server,
            payload,
            "accessValidFrom",
            "accessValidUntil",
            "branchAccessCreatedAt",
            "branchAccessUpdatedAt"
        );

        payload.put(
            "storageEntitlementStatus",
            "ACTIVE"
        );

        copyRequired(
            server,
            payload,
            "storageEntitlementActivatedAt",
            "storageEntitlementCreatedAt",
            "storageEntitlementUpdatedAt"
        );

        payload.put(
            "portableAuthFingerprint",
            portableAuthFingerprint
        );

        payload.put(
            "issuedAt",
            server.getString("issuedAt")
        );

        // Strictly parse the same package contract used by the
        // production runtime verifier. The signature below is ONLY
        // a structural placeholder; it is never returned or signed.
        JSONObject signature = new JSONObject();

        signature.put(
            "algorithm",
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .SIGNATURE_ALGORITHM
        );

        signature.put(
            "encoding",
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .SIGNATURE_ENCODING
        );

        signature.put(
            "canonicalization",
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .SIGNATURE_CANONICALIZATION
        );

        signature.put(
            "keyId",
            "FINORA-BRANCH-CERT-00000000000000000000000000000000"
        );

        signature.put(
            "value",
            Base64.getEncoder().encodeToString(
                new byte[64]
            )
        );

        JSONObject candidate = new JSONObject();

        candidate.put(
            "format",
            FinoraPortableFreshDeviceRuntimeAuthorityContract.FORMAT
        );
        candidate.put("schemaVersion", 1);
        candidate.put("payload", payload);
        candidate.put("signature", signature);

        // Malformed/null/missing/wrong-type values must fail
        // before any subsequent signature or persistence.
        FinoraPortableFreshDeviceRuntimeAuthorityContract
            .PackageValue parsed =
                FinoraPortableFreshDeviceRuntimeAuthorityContract
                    .parse(candidate.toString());

        if (
            parsed == null ||
            parsed.payload == null ||
            !canonical.equals(
                parsed.payload.canonicalUsername
            ) ||
            !portableAuthFingerprint.equals(
                parsed.payload.portableAuthFingerprint
            )
        ) {
            throw new SecurityException(
                "Runtime Authority schema or scope mismatch."
            );
        }

        return payload;
    }

    private static void copyRequired(
        JSONObject source,
        JSONObject target,
        String... keys
    ) throws Exception {

        for (String key : keys) {
            Object value = source.get(key);

            if (
                !(value instanceof String) ||
                ((String) value).trim().isEmpty()
            ) {
                throw new SecurityException(
                    "Required signed Runtime Authority field invalid: " +
                    key
                );
            }

            target.put(key, value);
        }
    }

    private static void copyNullable(
        JSONObject source,
        JSONObject target,
        String... keys
    ) throws Exception {

        for (String key : keys) {
            Object value = source.get(key);

            if (
                value != JSONObject.NULL &&
                !(value instanceof String)
            ) {
                throw new SecurityException(
                    "Signed Runtime Authority field invalid: " +
                    key
                );
            }

            target.put(key, value);
        }
    }
}