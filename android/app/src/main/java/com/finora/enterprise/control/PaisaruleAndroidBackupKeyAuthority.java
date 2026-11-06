package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Android-only, process-memory Backup V1 key authority.
 *
 * No password, backup key, or derived key is written to
 * persistent storage or returned to the WebView.
 *
 * A caller must independently reverify live server business
 * authorization before consuming a key copy for export.
 */
final class PaisaruleAndroidBackupKeyAuthority {

    private static byte[] key;
    private static byte[] scopeDigest;
    private static long generation = -1L;

    private PaisaruleAndroidBackupKeyAuthority() {}

    static synchronized void clear() {
        if (key != null) {
            Arrays.fill(key, (byte) 0);
            key = null;
        }

        if (scopeDigest != null) {
            Arrays.fill(scopeDigest, (byte) 0);
            scopeDigest = null;
        }

        generation = -1L;
    }

    private static byte[] sha256(byte[] input)
        throws Exception {

        return MessageDigest
            .getInstance("SHA-256")
            .digest(input);
    }

    private static String hex(byte[] input) {
        final char[] chars = "0123456789abcdef".toCharArray();
        char[] output = new char[input.length * 2];

        for (int i = 0; i < input.length; i++) {
            int b = input[i] & 255;
            output[i * 2] = chars[b >>> 4];
            output[i * 2 + 1] = chars[b & 15];
        }

        return new String(output);
    }

    private static byte[] fingerprint(JSONObject scope)
        throws Exception {

        if (scope == null) {
            throw new IllegalArgumentException("BACKUP_SCOPE_REQUIRED");
        }

        JSONArray canonical = new JSONArray();

        for (String field : new String[] {
            "userId", "ownerId", "businessId", "branchId"
        }) {
            String value = scope.optString(field, "");

            if (value.isEmpty() ||
                value.length() > 512 ||
                !value.equals(value.trim())) {
                throw new IllegalArgumentException(
                    "BACKUP_SCOPE_INVALID"
                );
            }

            for (int i = 0; i < value.length(); i++) {
                char c = value.charAt(i);

                if (c < 32 || c == 127) {
                    throw new IllegalArgumentException(
                        "BACKUP_SCOPE_INVALID"
                    );
                }
            }

            canonical.put(value);
        }

        return sha256(
            canonical.toString().getBytes(StandardCharsets.UTF_8)
        );
    }

    static synchronized boolean captureVerifiedLogin(
        String password,
        JSONObject principal,
        long loginGeneration
    ) {
        clear();

        if (password == null ||
            password.isEmpty() ||
            principal == null ||
            loginGeneration < 0 ||
            !"OWNER".equals(principal.optString("role", "")) ||
            !"USB".equalsIgnoreCase(
                principal.optString("storageMode", "")
            )) {
            return false;
        }

        byte[] passwordBytes = null;
        byte[] fingerprintBytes = null;
        byte[] salt = null;
        byte[] derived = null;

        try {
            passwordBytes = password.getBytes(
                StandardCharsets.UTF_8
            );

            if (passwordBytes.length == 0 ||
                passwordBytes.length > 4096) {
                return false;
            }

            fingerprintBytes = fingerprint(principal);

            byte[] prefix = (
                "PAISARULE_STORAGE_BACKUP_V1_KDF\0"
            ).getBytes(StandardCharsets.UTF_8);

            byte[] fingerprintText = hex(
                fingerprintBytes
            ).getBytes(StandardCharsets.UTF_8);

            byte[] saltInput = new byte[
                prefix.length + fingerprintText.length
            ];

            System.arraycopy(
                prefix, 0, saltInput, 0, prefix.length
            );

            System.arraycopy(
                fingerprintText, 0, saltInput,
                prefix.length, fingerprintText.length
            );

            salt = sha256(saltInput);

            Arrays.fill(prefix, (byte) 0);
            Arrays.fill(fingerprintText, (byte) 0);
            Arrays.fill(saltInput, (byte) 0);

            derived = SCrypt.generate(
                passwordBytes,
                salt,
                32768,
                8,
                1,
                32
            );

            key = derived.clone();
            scopeDigest = fingerprintBytes.clone();
            generation = loginGeneration;

            return true;
        } catch (Exception ignored) {
            clear();
            return false;
        } finally {
            if (passwordBytes != null) {
                Arrays.fill(passwordBytes, (byte) 0);
            }

            if (fingerprintBytes != null) {
                Arrays.fill(fingerprintBytes, (byte) 0);
            }

            if (salt != null) {
                Arrays.fill(salt, (byte) 0);
            }

            if (derived != null) {
                Arrays.fill(derived, (byte) 0);
            }
        }
    }

    static synchronized byte[] copyForVerifiedScope(
        JSONObject principal,
        long loginGeneration
    ) {
        if (key == null ||
            scopeDigest == null ||
            generation != loginGeneration) {
            return null;
        }

        byte[] actual = null;

        try {
            actual = fingerprint(principal);

            if (!MessageDigest.isEqual(
                scopeDigest, actual
            )) {
                return null;
            }

            return key.clone();
        } catch (Exception ignored) {
            return null;
        } finally {
            if (actual != null) {
                Arrays.fill(actual, (byte) 0);
            }
        }
    }
}