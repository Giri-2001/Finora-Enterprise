package com.finora.enterprise.control;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;

/**
 * Server-first Portable Branch Auth V2 material preparation.
 *
 * SECURITY:
 * - Reverify pinned server signature and initial-enrollment scope.
 * - Require selected account folder to match the server username.
 * - Generate a new Branch Certification keypair only after verification.
 * - Embed complete signed-bootstrap provenance inside encrypted payload.
 * - Verify password and recovery decryption before returning material.
 *
 * NO USB access, persistence, device trust, runtime authority,
 * Control Store hydration, wallet access, or session issuance.
 *
 * This material MUST NOT be persisted until separate conflict,
 * runtime-authority, and full enrollment checks have passed.
 */
public final class FinoraServerFirstLoginV2MaterialService {

    private FinoraServerFirstLoginV2MaterialService() {}

    public static final class Material {
        public final String serializedEnvelope;
        public final String canonicalUsername;
        public final String ownerId;
        public final String businessId;
        public final String branchId;
        public final String sourceAuthorizationId;

        private Material(
            String serializedEnvelope,
            JSONObject verified
        ) throws Exception {
            this.serializedEnvelope = serializedEnvelope;
            this.canonicalUsername =
                verified.getString("canonicalUsername");
            this.ownerId = verified.getString("ownerId");
            this.businessId = verified.getString("businessId");
            this.branchId = verified.getString("branchId");
            this.sourceAuthorizationId =
                verified.getString("sourceAuthorizationId");
        }
    }

    private static String canonicalNow() {
        return new DateTimeFormatterBuilder()
            .appendInstant(3)
            .toFormatter(Locale.ROOT)
            .format(
                Instant.now().truncatedTo(ChronoUnit.MILLIS)
            );
    }

    public static Material create(
        FinoraServerFirstLoginClient.Result serverResult,
        String username,
        String selectedAccountFolderName,
        String password,
        String securityCode
    ) throws Exception {

        if (
            password == null ||
            securityCode == null ||
            password.length() < 8 ||
            securityCode.length() < 8
        ) {
            throw new SecurityException(
                "Server-first enrollment credentials are invalid."
            );
        }

        FinoraServerFirstLoginEnrollmentPreflight.Result
            preflight =
                FinoraServerFirstLoginEnrollmentPreflight
                    .evaluate(
                        serverResult,
                        username,
                        selectedAccountFolderName
                    );

        if (
            !preflight.ready() ||
            preflight.verifiedPayload == null
        ) {
            throw new SecurityException(
                "Signed server-first enrollment preflight failed."
            );
        }

        JSONObject server = preflight.verifiedPayload;

        // The server result has already passed pinned-signature
        // verification, but never trust a mutable result blindly.
        JSONObject signed = serverResult.signedBootstrap;

        if (
            !FinoraServerFirstLoginSignatureVerifier
                .verify(signed)
        ) {
            throw new SecurityException(
                "Server-first bootstrap signature invalid."
            );
        }

        if (
            !FinoraServerFirstLoginPayloadValidator.validate(
                server,
                server.getString("canonicalUsername")
            )
        ) {
            throw new SecurityException(
                "Server-first bootstrap semantics invalid."
            );
        }

        // A syntactically valid historical grant is not enough.
        // Never create fresh material using expired or future access.
        Instant now = Instant.now();
        Instant validFrom = Instant.parse(
            server.getString("accessValidFrom")
        );
        Instant validUntil = Instant.parse(
            server.getString("accessValidUntil")
        );

        if (
            now.isBefore(validFrom) ||
            now.isAfter(validUntil)
        ) {
            throw new SecurityException(
                "Server-first access validity window is inactive."
            );
        }

        // Verify request-scoped ID against signed evidence.
        String authorizationId =
            server.getString("sourceAuthorizationId");

        JSONObject evidence = new JSONObject();

        evidence.put(
            "authorizationId",
            authorizationId
        );
        evidence.put(
            "provenanceType",
            "SERVER_FIRST_LOGIN_SIGNED_BOOTSTRAP"
        );

        // Snapshot exact signed authority; do not invent
        // or replace the server-signed bootstrap.
        evidence.put(
            "signedBootstrap",
            new JSONObject(signed.toString())
        );
        evidence.put(
            "verifiedAt",
            canonicalNow()
        );
        evidence.put("schemaVersion", 1);

        FinoraBranchCertificationCryptoValidator.Material
            certification =
                FinoraServerFirstLoginBranchCertificationGenerator
                    .generate(
                        server.getString("issuedAt")
                    );

        JSONObject payload = new JSONObject();

        payload.put("schemaVersion", 1);
        payload.put(
            "authStateId",
            "FINORA-PORTABLE-AUTH-STATE-" +
                UUID.randomUUID().toString()
        );
        payload.put(
            "sourceAuthorizationId",
            authorizationId
        );
        payload.put(
            "sourceAuthorizationVerificationEvidence",
            evidence
        );
        payload.put(
            "branchCertificationKeyMaterial",
            FinoraServerFirstLoginBranchCertificationGenerator
                .toEncryptedPayloadObject(certification)
        );

        for (String key : new String[] {
            "ownerId",
            "businessId",
            "branchId",
            "userId",
            "username",
            "canonicalUsername",
            "fullName",
            "role"
        }) {
            payload.put(
                key,
                server.getString(key)
            );
        }

        payload.put("dataContext", "REAL");
        payload.put("storageMode", "USB");
        payload.put("authGeneration", 1);
        payload.put(
            "createdAt",
            server.getString("issuedAt")
        );
        payload.put(
            "updatedAt",
            server.getString("issuedAt")
        );

        FinoraPortableBranchAuthV2EncryptAuthority.Material
            encrypted =
                FinoraPortableBranchAuthV2EncryptAuthority.create(
                    payload,
                    password,
                    securityCode
                );

        String serialized = encrypted.envelope.toString();

        byte[] passwordPlaintext = null;
        byte[] recoveryPlaintext = null;

        try {
            passwordPlaintext =
                FinoraPortableBranchAuthV2DecryptAuthority
                    .decryptWithPassword(
                        serialized,
                        password
                    );

            recoveryPlaintext =
                FinoraPortableBranchAuthV2DecryptAuthority
                    .decryptWithSecurityCode(
                        serialized,
                        securityCode
                    );

            if (
                !Arrays.equals(
                    passwordPlaintext,
                    recoveryPlaintext
                )
            ) {
                throw new SecurityException(
                    "V2 password and recovery material mismatch."
                );
            }

            JSONObject decoded = new JSONObject(
                new String(
                    passwordPlaintext,
                    StandardCharsets.UTF_8
                )
            );

            if (
                !server.getString("canonicalUsername")
                    .equals(
                        decoded.getString("canonicalUsername")
                    ) ||
                !server.getString("ownerId")
                    .equals(decoded.getString("ownerId")) ||
                !server.getString("businessId")
                    .equals(decoded.getString("businessId")) ||
                !server.getString("branchId")
                    .equals(decoded.getString("branchId")) ||
                !authorizationId.equals(
                    decoded.getString("sourceAuthorizationId")
                ) ||
                decoded.getInt("authGeneration") != 1 ||
                !decoded.getJSONObject(
                    "sourceAuthorizationVerificationEvidence"
                ).getString("authorizationId")
                    .equals(authorizationId) ||
                !FinoraServerFirstLoginSignatureVerifier
                    .verify(
                        decoded.getJSONObject(
                            "sourceAuthorizationVerificationEvidence"
                        ).getJSONObject("signedBootstrap")
                    )
            ) {
                throw new SecurityException(
                    "Encrypted V2 enrollment payload scope mismatch."
                );
            }

            JSONObject embeddedKey =
                decoded.getJSONObject(
                    "branchCertificationKeyMaterial"
                );

            if (
                !certification.keyId.equals(
                    embeddedKey.getString("keyId")
                ) ||
                !certification.publicKeyFingerprint.equals(
                    embeddedKey.getString(
                        "publicKeyFingerprint"
                    )
                )
            ) {
                throw new SecurityException(
                    "Encrypted Branch Certification mismatch."
                );
            }

            return new Material(serialized, server);
        } finally {
            if (passwordPlaintext != null) {
                Arrays.fill(passwordPlaintext, (byte) 0);
            }

            if (recoveryPlaintext != null) {
                Arrays.fill(recoveryPlaintext, (byte) 0);
            }
        }
    }
}