package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

import org.json.JSONObject;

/**
 * FINORA Portable Branch Auth V2 key-wrap decryption.
 *
 * Fail-closed cryptographic primitive.
 * No store access, device authorization, or session issuance.
 */
public final class FinoraPortableBranchAuthV2DecryptAuthority {

    private static final String PASSWORD_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_WRAP_KEY_V2";

    private static final String RECOVERY_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_RECOVERY_WRAP_KEY_V2";

    private static final String PAYLOAD_AAD_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_AAD_V2";

    private static final String WRAP_AAD_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_WRAP_AAD_V2";

    private FinoraPortableBranchAuthV2DecryptAuthority() {
    }

    public static byte[] decryptWithPassword(
        String serialized,
        String password
    ) throws Exception {
        return decrypt(serialized, password, false);
    }

    public static byte[] decryptWithSecurityCode(
        String serialized,
        String securityCode
    ) throws Exception {
        return decrypt(serialized, securityCode, true);
    }

    private static byte[] decrypt(
        String serialized,
        String secret,
        boolean recovery
    ) throws Exception {

        JSONObject envelope =
            FinoraPortableBranchAuthV2Envelope.parse(serialized);

        JSONObject factor = envelope.getJSONObject(
            recovery ? "securityFactor" : "passwordFactor"
        );

        JSONObject wrap = envelope.getJSONObject(
            recovery ? "recoveryWrap" : "passwordWrap"
        );

        byte[] derived = null;
        byte[] salt = null;
        byte[] verifier = null;
        byte[] actualVerifier = null;
        byte[] secretFactor = null;
        byte[] wrapKey = null;
        byte[] masterKey = null;

        try {
            if (secret == null || secret.isEmpty()) {
                throw new SecurityException("Authentication failed.");
            }

            if (
                factor.getInt("N") != 32768 ||
                factor.getInt("r") != 8 ||
                factor.getInt("p") != 1 ||
                factor.getInt("derivedKeyLength") != 64 ||
                factor.getInt("verifierLength") != 32
            ) {
                throw new SecurityException("Authentication failed.");
            }

            salt = Base64.getDecoder().decode(
                factor.getString("salt")
            );

            verifier = Base64.getDecoder().decode(
                factor.getString("verifier")
            );

            if (salt.length != 16 || verifier.length != 32) {
                throw new SecurityException("Authentication failed.");
            }

            derived = FinoraPortableBranchAuthScrypt.derive(
                secret,
                salt
            );

            if (derived.length != 64) {
                throw new SecurityException("Authentication failed.");
            }

            actualVerifier = Arrays.copyOfRange(
                derived, 0, 32
            );

            if (!MessageDigest.isEqual(
                actualVerifier, verifier
            )) {
                throw new SecurityException("Authentication failed.");
            }

            secretFactor = Arrays.copyOfRange(
                derived, 32, 64
            );

            MessageDigest hash = MessageDigest.getInstance("SHA-256");

            hash.update(
                (recovery ? RECOVERY_DOMAIN : PASSWORD_DOMAIN)
                    .getBytes(StandardCharsets.UTF_8)
            );

            hash.update((byte) 0);
            hash.update(secretFactor);

            wrapKey = hash.digest();

            byte[] wrapAad = buildWrapAad(
                envelope, factor, recovery
            );

            masterKey = FinoraPortableBranchAuthCryptoCore.decrypt(
                wrapKey,
                Base64.getDecoder().decode(wrap.getString("iv")),
                wrapAad,
                Base64.getDecoder().decode(wrap.getString("wrappedKey")),
                Base64.getDecoder().decode(wrap.getString("authTag"))
            );

            if (masterKey.length != 32) {
                throw new SecurityException("Authentication failed.");
            }

            JSONObject payloadEncryption =
                envelope.getJSONObject("payloadEncryption");

            return FinoraPortableBranchAuthCryptoCore.decrypt(
                masterKey,
                Base64.getDecoder().decode(
                    payloadEncryption.getString("iv")
                ),
                buildPayloadAad(envelope),
                Base64.getDecoder().decode(
                    envelope.getString("ciphertext")
                ),
                Base64.getDecoder().decode(
                    payloadEncryption.getString("authTag")
                )
            );

        } finally {
            zero(derived);
            zero(salt);
            zero(verifier);
            zero(actualVerifier);
            zero(secretFactor);
            zero(wrapKey);
            zero(masterKey);
        }
    }

    /*
     * Match Node.js JSON.stringify insertion order exactly.
     *
     * Android JSONObject.toString() must not be used for
     * authenticated AAD because JSONObject key iteration order
     * is not guaranteed.
     */
    private static String jsonString(String value) {
        return JSONObject.quote(value);
    }

    private static String stableScopeJson(
        JSONObject scope
    ) throws Exception {
        return "{"
            + "\"ownerId\":" + jsonString(scope.getString("ownerId"))
            + ",\"businessId\":" + jsonString(scope.getString("businessId"))
            + ",\"branchId\":" + jsonString(scope.getString("branchId"))
            + "}";
    }

    private static String stableMetadataJson(
        JSONObject envelope
    ) throws Exception {
        return "\"format\":"
            + jsonString(envelope.getString("format"))
            + ",\"schemaVersion\":"
            + envelope.getInt("schemaVersion")
            + ",\"canonicalUsername\":"
            + jsonString(envelope.getString("canonicalUsername"))
            + ",\"branchScope\":"
            + stableScopeJson(
                envelope.getJSONObject("branchScope")
            );
    }

    private static String stableFactorJson(
        JSONObject factor
    ) throws Exception {
        return "{"
            + "\"algorithm\":"
            + jsonString(factor.getString("algorithm"))
            + ",\"salt\":"
            + jsonString(factor.getString("salt"))
            + ",\"N\":" + factor.getInt("N")
            + ",\"r\":" + factor.getInt("r")
            + ",\"p\":" + factor.getInt("p")
            + ",\"derivedKeyLength\":"
            + factor.getInt("derivedKeyLength")
            + ",\"verifierLength\":"
            + factor.getInt("verifierLength")
            + ",\"verifier\":"
            + jsonString(factor.getString("verifier"))
            + "}";
    }

    private static byte[] buildPayloadAad(
        JSONObject envelope
    ) throws Exception {
        String canonical = "{"
            + "\"domain\":" + jsonString(PAYLOAD_AAD_DOMAIN)
            + ","
            + stableMetadataJson(envelope)
            + "}";

        return canonical.getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] buildWrapAad(
        JSONObject envelope,
        JSONObject factor,
        boolean recovery
    ) throws Exception {
        String canonical = "{"
            + "\"domain\":" + jsonString(WRAP_AAD_DOMAIN)
            + ",\"purpose\":"
            + jsonString(recovery ? "RECOVERY" : "PASSWORD")
            + ","
            + stableMetadataJson(envelope)
            + ",\"factor\":"
            + stableFactorJson(factor)
            + "}";

        return canonical.getBytes(StandardCharsets.UTF_8);
    }
    private static void zero(byte[] bytes) {
        if (bytes != null) {
            Arrays.fill(bytes, (byte) 0);
        }
    }
}
