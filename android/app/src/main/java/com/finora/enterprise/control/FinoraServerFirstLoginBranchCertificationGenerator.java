package com.finora.enterprise.control;

import org.json.JSONObject;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;

/**
 * Generates Windows-compatible Branch Certification P-256 key material.
 *
 * This is NOT enrollment authorization.
 * Caller must verify the server bootstrap and enforce all
 * scope, persistence, runtime and session security requirements.
 *
 * Never persist the returned private-key material outside
 * authenticated encrypted Portable Auth V2.
 */
public final class FinoraServerFirstLoginBranchCertificationGenerator {

    private FinoraServerFirstLoginBranchCertificationGenerator() {}

    public static FinoraBranchCertificationCryptoValidator.Material generate(
        String createdAt
    ) throws Exception {

        if (createdAt == null || createdAt.isEmpty()) {
            throw new IllegalArgumentException(
                "Branch Certification timestamp required."
            );
        }

        Instant parsed = Instant.parse(createdAt);

        String canonical =
            new DateTimeFormatterBuilder()
                .appendInstant(3)
                .toFormatter(Locale.ROOT)
                .format(parsed);

        if (!createdAt.equals(canonical)) {
            throw new IllegalArgumentException(
                "Branch Certification timestamp is not canonical."
            );
        }

        KeyPairGenerator generator =
            KeyPairGenerator.getInstance("EC");

        generator.initialize(
            new ECGenParameterSpec("secp256r1"),
            new SecureRandom()
        );

        KeyPair pair = generator.generateKeyPair();

        byte[] publicDer = pair.getPublic().getEncoded();
        byte[] privateDer = pair.getPrivate().getEncoded();

        try {
            if (
                publicDer == null ||
                privateDer == null ||
                publicDer.length == 0 ||
                privateDer.length == 0
            ) {
                throw new SecurityException(
                    "Branch Certification key encoding unavailable."
                );
            }

            byte[] digest =
                MessageDigest.getInstance("SHA-256")
                    .digest(publicDer);

            StringBuilder hex = new StringBuilder();

            for (byte b : digest) {
                hex.append(
                    String.format(
                        Locale.ROOT,
                        "%02x",
                        b & 0xff
                    )
                );
            }

            String fingerprint = hex.toString();

            String keyId =
                "FINORA-BRANCH-CERT-" +
                fingerprint.substring(0, 32)
                    .toUpperCase(Locale.ROOT);

            FinoraBranchCertificationCryptoValidator.Material material =
                new FinoraBranchCertificationCryptoValidator.Material(
                    keyId,
                    "ECDSA_P256_SHA256",
                    "SPKI_DER_BASE64",
                    Base64.getEncoder().encodeToString(publicDer),
                    "SHA-256",
                    fingerprint,
                    createdAt,
                    1,
                    "PKCS8_DER_BASE64",
                    Base64.getEncoder().encodeToString(privateDer),
                    1
                );

            FinoraBranchCertificationCryptoValidator.assertValid(
                material
            );

            return material;
        } finally {
            if (publicDer != null) {
                Arrays.fill(publicDer, (byte) 0);
            }

            if (privateDer != null) {
                Arrays.fill(privateDer, (byte) 0);
            }
        }
    }

    public static JSONObject toEncryptedPayloadObject(
        FinoraBranchCertificationCryptoValidator.Material material
    ) throws Exception {

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        JSONObject result = new JSONObject();

        result.put("keyId", material.keyId);
        result.put("algorithm", material.algorithm);
        result.put("publicKeyFormat", material.publicKeyFormat);
        result.put("publicKey", material.publicKey);
        result.put(
            "fingerprintAlgorithm",
            material.fingerprintAlgorithm
        );
        result.put(
            "publicKeyFingerprint",
            material.publicKeyFingerprint
        );
        result.put("createdAt", material.createdAt);
        result.put("schemaVersion", material.schemaVersion);
        result.put("privateKeyFormat", material.privateKeyFormat);
        result.put("privateKey", material.privateKey);
        result.put(
            "vaultSchemaVersion",
            material.vaultSchemaVersion
        );

        return result;
    }
}