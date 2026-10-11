package com.finora.enterprise.control;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

/**
 * Read-only V2 encrypted credential and signed Runtime Authority gate.
 *
 * This verifies matching password/security-code decryption, branch
 * scope, a server-signed evidence package, embedded Branch
 * Certification, signed Runtime Authority and V2 envelope fingerprint.
 *
 * It does NOT grant a session, hydrate Control Store, enroll a USB,
 * or substitute for complete production server-first authorization.
 */
public final class FinoraServerFirstLoginV2RecoveryVerificationGate {

    private FinoraServerFirstLoginV2RecoveryVerificationGate() {}

    public static final class VerifiedPair {
        public final JSONObject portablePayload;
        public final JSONObject verifiedEnvelope;
        public final FinoraPortableFreshDeviceRuntimeAuthorityContract
            .Payload runtimeAuthority;
        public final String portableAuthFingerprint;

        private VerifiedPair(
            JSONObject portablePayload,
            JSONObject verifiedEnvelope,
            FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtimeAuthority,
            String portableAuthFingerprint
        ) {
            this.portablePayload = portablePayload;
            this.verifiedEnvelope = verifiedEnvelope;
            this.runtimeAuthority = runtimeAuthority;
            this.portableAuthFingerprint = portableAuthFingerprint;
        }
    }

    public static VerifiedPair verify(
        String serializedEnvelope,
        String username,
        String password,
        String securityCode,
        String serializedRuntimeAuthority
    ) throws Exception {

        if (
            isBlank(serializedEnvelope) ||
            isBlank(username) ||
            isBlank(password) ||
            isBlank(securityCode) ||
            isBlank(serializedRuntimeAuthority)
        ) {
            throw new SecurityException("V2 recovery input incomplete.");
        }

        String canonical =
            FinoraPortableBranchAccountUsbRoot
                .canonicalUsername(username);

        JSONObject envelope =
            FinoraPortableBranchAuthV2Envelope
                .parse(serializedEnvelope);

        if (
            !canonical.equals(
                envelope.getString("canonicalUsername")
            ) ||
            !FinoraPortableBranchAuthV2PasswordVerifier.verify(
                serializedEnvelope,
                username,
                password
            )
        ) {
            throw new SecurityException("V2 credentials invalid.");
        }

        byte[] passwordPlain = null;
        byte[] securityPlain = null;

        try {
            passwordPlain =
                FinoraPortableBranchAuthV2DecryptAuthority
                    .decryptWithPassword(
                        serializedEnvelope,
                        password
                    );

            securityPlain =
                FinoraPortableBranchAuthV2DecryptAuthority
                    .decryptWithSecurityCode(
                        serializedEnvelope,
                        securityCode
                    );

            if (!MessageDigest.isEqual(
                passwordPlain,
                securityPlain
            )) {
                throw new SecurityException(
                    "V2 authentication factors do not match."
                );
            }

            JSONObject payload = new JSONObject(
                new String(
                    passwordPlain,
                    StandardCharsets.UTF_8
                )
            );

            JSONObject envelopeScope =
                envelope.getJSONObject("branchScope");

            if (
                !canonical.equals(
                    payload.getString("canonicalUsername")
                ) ||
                !"USB".equals(
                    payload.getString("storageMode")
                ) ||
                !"REAL".equals(
                    payload.getString("dataContext")
                ) ||
                payload.getLong("authGeneration") != 1L ||
                !envelopeScope.getString("ownerId").equals(
                    payload.getString("ownerId")
                ) ||
                !envelopeScope.getString("businessId").equals(
                    payload.getString("businessId")
                ) ||
                !envelopeScope.getString("branchId").equals(
                    payload.getString("branchId")
                )
            ) {
                throw new SecurityException(
                    "V2 portable authentication scope mismatch."
                );
            }

            JSONObject evidence =
                payload.getJSONObject(
                    "sourceAuthorizationVerificationEvidence"
                );

            if (
                evidence.getInt("schemaVersion") != 1 ||
                !"SERVER_FIRST_LOGIN_SIGNED_BOOTSTRAP".equals(
                    evidence.getString("provenanceType")
                ) ||
                !payload.getString("sourceAuthorizationId")
                    .equals(evidence.getString("authorizationId")) ||
                !FinoraServerFirstLoginSignatureVerifier.verify(
                    evidence.getJSONObject("signedBootstrap")
                )
            ) {
                throw new SecurityException(
                    "Signed server-first evidence invalid."
                );
            }

            JSONObject signedBootstrap =
                evidence.getJSONObject("signedBootstrap");

            JSONObject server =
                signedBootstrap.getJSONObject("payload");

            if (
                !FinoraServerFirstLoginPayloadValidator.validate(
                    server,
                    canonical
                )
            ) {
                throw new SecurityException(
                    "Signed server-first bootstrap semantics invalid."
                );
            }

            // Never accept a valid signature for a different account,
            // owner, business, branch, or authorization generation.
            for (String field : new String[] {
                "sourceAuthorizationId",
                "ownerId",
                "businessId",
                "branchId",
                "userId",
                "username",
                "canonicalUsername",
                "fullName",
                "role",
                "storageMode",
                "dataContext"
            }) {
                if (!server.getString(field).equals(
                    payload.getString(field)
                )) {
                    throw new SecurityException(
                        "Signed server-first scope mismatch."
                    );
                }
            }

            if (
                server.getLong("authGeneration") !=
                    payload.getLong("authGeneration")
            ) {
                throw new SecurityException(
                    "Signed authorization generation mismatch."
                );
            }

            java.time.Instant now = java.time.Instant.now();
            java.time.Instant validFrom =
                java.time.Instant.parse(
                    server.getString("accessValidFrom")
                );
            java.time.Instant validUntil =
                java.time.Instant.parse(
                    server.getString("accessValidUntil")
                );

            if (
                now.isBefore(validFrom) ||
                now.isAfter(validUntil)
            ) {
                throw new SecurityException(
                    "Server-first authorization is not currently valid."
                );
            }

            JSONObject key =
                payload.getJSONObject(
                    "branchCertificationKeyMaterial"
                );

            FinoraBranchCertificationCryptoValidator.Material
                certification =
                    new FinoraBranchCertificationCryptoValidator.Material(
                        key.getString("keyId"),
                        key.getString("algorithm"),
                        key.getString("publicKeyFormat"),
                        key.getString("publicKey"),
                        key.getString("fingerprintAlgorithm"),
                        key.getString("publicKeyFingerprint"),
                        key.getString("createdAt"),
                        key.getInt("schemaVersion"),
                        key.getString("privateKeyFormat"),
                        key.getString("privateKey"),
                        key.getInt("vaultSchemaVersion")
                    );

            FinoraBranchCertificationCryptoValidator.assertValid(
                certification
            );

            FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
                signed =
                    FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                        .verify(
                            serializedRuntimeAuthority,
                            certification
                        );

            if (!signed.success || signed.data == null) {
                throw new SecurityException(
                    "V2 Runtime Authority signature invalid."
                );
            }

            FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload
                runtime = signed.data;

            String fingerprint =
                FinoraPortableBranchAuthV2EnvelopeFingerprint
                    .sha256ExactSerialized(serializedEnvelope);

            if (
                !fingerprint.equals(
                    runtime.portableAuthFingerprint
                ) ||
                !payload.getString("sourceAuthorizationId")
                    .equals(runtime.sourceAuthorizationId) ||
                !canonical.equals(runtime.canonicalUsername) ||
                !payload.getString("ownerId")
                    .equals(runtime.ownerId) ||
                !payload.getString("businessId")
                    .equals(runtime.businessId) ||
                !payload.getString("branchId")
                    .equals(runtime.branchId) ||
                !payload.getString("userId")
                    .equals(runtime.userId) ||
                !payload.getString("username")
                    .equals(runtime.username) ||
                !payload.getString("fullName")
                    .equals(runtime.fullName) ||
                !payload.getString("role")
                    .equals(runtime.role) ||
                runtime.authGeneration != 1L ||
                !"USB".equals(runtime.storageMode) ||
                !"REAL".equals(runtime.dataContext) ||
                !server.getString("authorityId")
                    .equals(runtime.authorityId) ||
                !server.getString("credentialId")
                    .equals(runtime.credentialId) ||
                !server.getString("activationId")
                    .equals(runtime.activationId) ||
                !server.getString("branchAccessGrantId")
                    .equals(runtime.branchAccessGrantId) ||
                !server.getString("storageEntitlementId")
                    .equals(runtime.storageEntitlementId) ||
                !server.getString("accessValidFrom")
                    .equals(runtime.accessValidFrom) ||
                !server.getString("accessValidUntil")
                    .equals(runtime.accessValidUntil)
            ) {
                throw new SecurityException(
                    "V2 signed Runtime Authority continuity mismatch."
                );
            }

            return new VerifiedPair(
                payload,
                envelope,
                runtime,
                fingerprint
            );
        }
        finally {
            if (passwordPlain != null) {
                Arrays.fill(passwordPlain, (byte) 0);
            }
            if (securityPlain != null) {
                Arrays.fill(securityPlain, (byte) 0);
            }
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}