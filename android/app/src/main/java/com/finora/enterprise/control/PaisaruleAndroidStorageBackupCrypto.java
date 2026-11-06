package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * PAISARULE Storage Backup V1 envelope encryption.
 *
 * Compatible with the Windows V1 crypto envelope.
 *
 * Caller responsibilities:
 * - Authenticate and revalidate the live Owner session.
 * - Obtain a scoped key from native session authority.
 * - Validate the complete USB storage payload.
 * - Clear sensitive payload and key after use.
 * - Persist the encrypted result via Android Save As.
 */
final class PaisaruleAndroidStorageBackupCrypto {

    private static final String FORMAT =
        "PAISARULE_STORAGE_BACKUP";

    private static final int VERSION = 1;

    private static final String KDF =
        "scrypt-n32768-r8-p1";

    private static final String CIPHER =
        "aes-256-gcm";

    private static final int MAX_PLAINTEXT =
        64 * 1024 * 1024;

    private static final int MAX_PACKAGE =
        96 * 1024 * 1024;

    private static final SecureRandom RANDOM =
        new SecureRandom();

    private PaisaruleAndroidStorageBackupCrypto() {}

    private static String hex(byte[] input) {
        final char[] digits = "0123456789abcdef".toCharArray();
        char[] result = new char[input.length * 2];

        for (int i = 0; i < input.length; i++) {
            int value = input[i] & 255;

            result[i * 2] = digits[value >>> 4];
            result[i * 2 + 1] = digits[value & 15];
        }

        return new String(result);
    }

    private static String scopeFingerprint(
        JSONObject principal
    ) throws Exception {

        if (principal == null) {
            throw new IllegalArgumentException(
                "BACKUP_SCOPE_REQUIRED"
            );
        }

        JSONArray canonical = new JSONArray();

        for (String field : new String[] {
            "userId", "ownerId", "businessId", "branchId"
        }) {
            String value = principal.optString(field, "");

            if (value.isEmpty() ||
                value.length() > 512 ||
                !value.equals(value.trim())) {
                throw new IllegalArgumentException(
                    "BACKUP_SCOPE_INVALID"
                );
            }

            for (int i = 0; i < value.length(); i++) {
                char character = value.charAt(i);

                if (character < 32 || character == 127) {
                    throw new IllegalArgumentException(
                        "BACKUP_SCOPE_INVALID"
                    );
                }
            }

            canonical.put(value);
        }

        byte[] source = canonical.toString()
            .getBytes(StandardCharsets.UTF_8);

        try {
            byte[] digest = MessageDigest
                .getInstance("SHA-256")
                .digest(source);

            try {
                return hex(digest);
            } finally {
                Arrays.fill(digest, (byte) 0);
            }
        } finally {
            Arrays.fill(source, (byte) 0);
        }
    }

    static String encrypt(
        byte[] plaintext,
        byte[] keyInput,
        JSONObject verifiedPrincipal,
        String createdAt
    ) throws Exception {

        if (plaintext == null ||
            plaintext.length == 0 ||
            plaintext.length > MAX_PLAINTEXT) {
            throw new IllegalArgumentException(
                "BACKUP_PAYLOAD_INVALID"
            );
        }

        if (keyInput == null || keyInput.length != 32) {
            throw new IllegalArgumentException(
                "BACKUP_KEY_INVALID"
            );
        }

        if (createdAt == null || createdAt.isEmpty()) {
            throw new IllegalArgumentException(
                "BACKUP_TIMESTAMP_INVALID"
            );
        }

        try {
            Instant.parse(createdAt);
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "BACKUP_TIMESTAMP_INVALID"
            );
        }

        String fingerprint =
            scopeFingerprint(verifiedPrincipal);

        byte[] key = keyInput.clone();
        byte[] iv = new byte[12];
        byte[] aad = null;
        byte[] encryptedAndTag = null;
        byte[] ciphertext = null;
        byte[] tag = null;

        try {
            RANDOM.nextBytes(iv);

            String aadText =
                FORMAT + "\n" +
                VERSION + "\n" +
                fingerprint + "\n" +
                createdAt;

            aad = aadText.getBytes(StandardCharsets.UTF_8);

            Cipher cipher = Cipher.getInstance(
                "AES/GCM/NoPadding"
            );

            cipher.init(
                Cipher.ENCRYPT_MODE,
                new SecretKeySpec(key, "AES"),
                new GCMParameterSpec(128, iv)
            );

            cipher.updateAAD(aad);

            encryptedAndTag = cipher.doFinal(plaintext);

            if (encryptedAndTag.length < 17) {
                throw new IllegalStateException(
                    "BACKUP_ENCRYPTION_OUTPUT_INVALID"
                );
            }

            int ciphertextLength =
                encryptedAndTag.length - 16;

            ciphertext = Arrays.copyOfRange(
                encryptedAndTag,
                0,
                ciphertextLength
            );

            tag = Arrays.copyOfRange(
                encryptedAndTag,
                ciphertextLength,
                encryptedAndTag.length
            );

            JSONObject envelope = new JSONObject();

            envelope.put("format", FORMAT);
            envelope.put("version", VERSION);
            envelope.put("createdAt", createdAt);
            envelope.put("scopeFingerprint", fingerprint);
            envelope.put("kdf", KDF);
            envelope.put("cipher", CIPHER);

            envelope.put(
                "iv",
                android.util.Base64.encodeToString(
                    iv,
                    android.util.Base64.NO_WRAP
                )
            );

            envelope.put(
                "authTag",
                android.util.Base64.encodeToString(
                    tag,
                    android.util.Base64.NO_WRAP
                )
            );

            envelope.put(
                "ciphertext",
                android.util.Base64.encodeToString(
                    ciphertext,
                    android.util.Base64.NO_WRAP
                )
            );

            String result = envelope.toString();

            if (result.getBytes(
                StandardCharsets.UTF_8
            ).length > MAX_PACKAGE) {
                throw new IllegalStateException(
                    "BACKUP_PACKAGE_TOO_LARGE"
                );
            }

            return result;
        } finally {
            Arrays.fill(key, (byte) 0);
            Arrays.fill(iv, (byte) 0);

            if (aad != null) {
                Arrays.fill(aad, (byte) 0);
            }

            if (encryptedAndTag != null) {
                Arrays.fill(encryptedAndTag, (byte) 0);
            }

            if (ciphertext != null) {
                Arrays.fill(ciphertext, (byte) 0);
            }

            if (tag != null) {
                Arrays.fill(tag, (byte) 0);
            }
        }
    }

    // ========================================================
    // PAISARULE_R175_B4_DECRYPT
    //
    // Decrypt existing V1 .paisarule backup envelopes.
    // No filesystem access, USB writes or authentication grants.
    //
    // The caller must supply a previously verified principal
    // and a separately authorized, 32-byte backup key.
    //
    // The caller owns the returned plaintext and must zero it
    // immediately after validation/use.
    // ========================================================

    static byte[] decrypt(
        String envelopeText,
        byte[] keyInput,
        org.json.JSONObject verifiedPrincipal
    ) throws Exception {

        if (
            envelopeText == null ||
            envelopeText.length() == 0 ||
            envelopeText.length() > MAX_PACKAGE ||
            keyInput == null ||
            keyInput.length != 32 ||
            verifiedPrincipal == null
        ) {
            throw new IllegalArgumentException(
                "BACKUP_DECRYPT_INPUT_INVALID"
            );
        }

        byte[] key = keyInput.clone();
        byte[] iv = null;
        byte[] tag = null;
        byte[] ciphertext = null;
        byte[] combined = null;
        byte[] aad = null;

        try {
            org.json.JSONObject envelope =
                new org.json.JSONObject(envelopeText);

            String[] required = new String[] {
                "format",
                "version",
                "createdAt",
                "scopeFingerprint",
                "kdf",
                "cipher",
                "iv",
                "authTag",
                "ciphertext"
            };

            if (envelope.length() != required.length) {
                throw new IllegalArgumentException(
                    "BACKUP_ENVELOPE_SCHEMA_INVALID"
                );
            }

            for (String field : required) {
                if (!envelope.has(field) ||
                    envelope.isNull(field)) {
                    throw new IllegalArgumentException(
                        "BACKUP_ENVELOPE_SCHEMA_INVALID"
                    );
                }
            }

            if (
                !FORMAT.equals(envelope.optString("format", "")) ||
                !(envelope.opt("version") instanceof Number) ||
                envelope.optInt("version", -1) != VERSION ||
                !KDF.equals(envelope.optString("kdf", "")) ||
                !CIPHER.equals(envelope.optString("cipher", ""))
            ) {
                throw new IllegalArgumentException(
                    "BACKUP_ENVELOPE_VERSION_INVALID"
                );
            }

            String createdAt =
                envelope.optString("createdAt", "");

            java.time.Instant.parse(createdAt);

            String expectedFingerprint =
                scopeFingerprint(verifiedPrincipal);

            String storedFingerprint =
                envelope.optString("scopeFingerprint", "");

            if (
                !storedFingerprint.matches("[0-9a-f]{64}") ||
                !java.security.MessageDigest.isEqual(
                    expectedFingerprint.getBytes(
                        java.nio.charset.StandardCharsets.US_ASCII
                    ),
                    storedFingerprint.getBytes(
                        java.nio.charset.StandardCharsets.US_ASCII
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "BACKUP_SCOPE_MISMATCH"
                );
            }

            iv = android.util.Base64.decode(
                envelope.getString("iv"),
                android.util.Base64.NO_WRAP
            );

            tag = android.util.Base64.decode(
                envelope.getString("authTag"),
                android.util.Base64.NO_WRAP
            );

            ciphertext = android.util.Base64.decode(
                envelope.getString("ciphertext"),
                android.util.Base64.NO_WRAP
            );

            if (
                iv.length != 12 ||
                tag.length != 16 ||
                ciphertext.length == 0 ||
                ciphertext.length > MAX_PLAINTEXT
            ) {
                throw new IllegalArgumentException(
                    "BACKUP_ENVELOPE_CONTENT_INVALID"
                );
            }

            // Reject altered/noncanonical Base64 encodings.
            if (
                !android.util.Base64.encodeToString(
                    iv, android.util.Base64.NO_WRAP
                ).equals(envelope.getString("iv")) ||
                !android.util.Base64.encodeToString(
                    tag, android.util.Base64.NO_WRAP
                ).equals(envelope.getString("authTag")) ||
                !android.util.Base64.encodeToString(
                    ciphertext, android.util.Base64.NO_WRAP
                ).equals(envelope.getString("ciphertext"))
            ) {
                throw new IllegalArgumentException(
                    "BACKUP_ENVELOPE_ENCODING_INVALID"
                );
            }

            String aadText =
                FORMAT + "\n" +
                VERSION + "\n" +
                storedFingerprint + "\n" +
                createdAt;

            aad = aadText.getBytes(
                java.nio.charset.StandardCharsets.UTF_8
            );

            combined = new byte[
                ciphertext.length + tag.length
            ];

            System.arraycopy(
                ciphertext, 0,
                combined, 0,
                ciphertext.length
            );

            System.arraycopy(
                tag, 0,
                combined, ciphertext.length,
                tag.length
            );

            javax.crypto.Cipher cipher =
                javax.crypto.Cipher.getInstance(
                    "AES/GCM/NoPadding"
                );

            cipher.init(
                javax.crypto.Cipher.DECRYPT_MODE,
                new javax.crypto.spec.SecretKeySpec(
                    key, "AES"
                ),
                new javax.crypto.spec.GCMParameterSpec(
                    128, iv
                )
            );

            cipher.updateAAD(aad);

            // GCM verifies the authentication tag here.
            // Invalid credentials, scope, AAD or tampered
            // ciphertext must fail closed.
            byte[] plaintext = cipher.doFinal(combined);

            if (
                plaintext.length == 0 ||
                plaintext.length > MAX_PLAINTEXT
            ) {
                java.util.Arrays.fill(
                    plaintext, (byte) 0
                );

                throw new IllegalArgumentException(
                    "BACKUP_PLAINTEXT_SIZE_INVALID"
                );
            }

            return plaintext;

        } finally {
            java.util.Arrays.fill(key, (byte) 0);

            if (iv != null)
                java.util.Arrays.fill(iv, (byte) 0);

            if (tag != null)
                java.util.Arrays.fill(tag, (byte) 0);

            if (ciphertext != null)
                java.util.Arrays.fill(ciphertext, (byte) 0);

            if (combined != null)
                java.util.Arrays.fill(combined, (byte) 0);

            if (aad != null)
                java.util.Arrays.fill(aad, (byte) 0);
        }
    }
}