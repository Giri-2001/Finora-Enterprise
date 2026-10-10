package com.finora.enterprise.control;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * FINORA Portable Branch Auth V2 enrollment encryption.
 *
 * This is a cryptographic material generator only.
 * It does not verify server authorization, write USB state,
 * certify a branch, hydrate Control Store or issue a session.
 */
public final class FinoraPortableBranchAuthV2EncryptAuthority {

    private static final int SALT_BYTES = 16;
    private static final int IV_BYTES = 12;
    private static final int TAG_BYTES = 16;
    private static final int MASTER_KEY_BYTES = 32;

    private static final SecureRandom RANDOM =
        new SecureRandom();

    private static final String PASSWORD_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_PASSWORD_WRAP_KEY_V2";

    private static final String RECOVERY_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_RECOVERY_WRAP_KEY_V2";

    private static final String PAYLOAD_AAD_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_AAD_V2";

    private static final String WRAP_AAD_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_WRAP_AAD_V2";

    private FinoraPortableBranchAuthV2EncryptAuthority() {}

    public static final class Material {
        public final JSONObject envelope;
        public final JSONObject passwordVerifier;
        public final JSONObject securityVerifier;

        private Material(
            JSONObject envelope,
            JSONObject passwordVerifier,
            JSONObject securityVerifier
        ) {
            this.envelope = envelope;
            this.passwordVerifier = passwordVerifier;
            this.securityVerifier = securityVerifier;
        }
    }

    private static final class Factor {
        final JSONObject metadata;
        final byte[] wrapKey;

        Factor(JSONObject metadata, byte[] wrapKey) {
            this.metadata = metadata;
            this.wrapKey = wrapKey;
        }
    }

    private static final class Encrypted {
        final byte[] iv;
        final byte[] ciphertext;
        final byte[] tag;

        Encrypted(byte[] iv, byte[] ciphertext, byte[] tag) {
            this.iv = iv;
            this.ciphertext = ciphertext;
            this.tag = tag;
        }
    }

    private static String b64(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }

    private static String q(String value) {
        return JSONObject.quote(value);
    }

    private static void clear(byte[] bytes) {
        if (bytes != null) {
            Arrays.fill(bytes, (byte) 0);
        }
    }

    private static byte[] random(int length) {
        byte[] value = new byte[length];
        RANDOM.nextBytes(value);
        return value;
    }

    private static void checkSecret(String secret) {
        if (
            secret == null ||
            secret.trim().isEmpty() ||
            secret.codePointCount(0, secret.length()) < 8 ||
            secret.codePointCount(0, secret.length()) > 128
        ) {
            throw new IllegalArgumentException(
                "FINORA credential length is invalid."
            );
        }
    }

    private static Factor deriveFactor(
        String secret,
        String domain
    ) throws Exception {
        byte[] salt = random(SALT_BYTES);
        byte[] derived = null;
        byte[] secretFactor = null;
        byte[] wrapKey = null;

        try {
            derived =
                FinoraPortableBranchAuthScrypt.derive(
                    secret, salt
                );

            if (derived == null || derived.length != 64) {
                throw new SecurityException(
                    "FINORA V2 scrypt result is invalid."
                );
            }

            JSONObject factor = new JSONObject();

            factor.put("algorithm", "SCRYPT");
            factor.put("salt", b64(salt));
            factor.put("N", 32768);
            factor.put("r", 8);
            factor.put("p", 1);
            factor.put("derivedKeyLength", 64);
            factor.put("verifierLength", 32);

            factor.put(
                "verifier",
                b64(Arrays.copyOfRange(derived, 0, 32))
            );

            secretFactor =
                Arrays.copyOfRange(derived, 32, 64);

            MessageDigest digest =
                MessageDigest.getInstance("SHA-256");

            digest.update(domain.getBytes(StandardCharsets.UTF_8));
            digest.update((byte) 0);
            digest.update(secretFactor);

            wrapKey = digest.digest();

            return new Factor(factor, wrapKey);
        } finally {
            clear(salt);
            clear(derived);
            clear(secretFactor);
        }
    }

    private static Encrypted encrypt(
        byte[] key,
        byte[] plaintext,
        byte[] aad
    ) throws Exception {
        if (key == null || key.length != 32) {
            throw new SecurityException("Invalid encryption key.");
        }

        byte[] iv = random(IV_BYTES);

        Cipher cipher =
            Cipher.getInstance("AES/GCM/NoPadding");

        cipher.init(
            Cipher.ENCRYPT_MODE,
            new SecretKeySpec(key, "AES"),
            new GCMParameterSpec(128, iv)
        );

        cipher.updateAAD(aad);

        byte[] combined =
            cipher.doFinal(plaintext);

        if (combined.length < TAG_BYTES) {
            throw new SecurityException(
                "FINORA encryption output is invalid."
            );
        }

        byte[] ciphertext = Arrays.copyOfRange(
            combined, 0, combined.length - TAG_BYTES
        );

        byte[] tag = Arrays.copyOfRange(
            combined,
            combined.length - TAG_BYTES,
            combined.length
        );

        clear(combined);

        return new Encrypted(iv, ciphertext, tag);
    }

    private static String scopeJson(JSONObject envelope)
        throws Exception {
        JSONObject scope =
            envelope.getJSONObject("branchScope");

        return "{"
            + "\"ownerId\":" + q(scope.getString("ownerId"))
            + ",\"businessId\":" + q(scope.getString("businessId"))
            + ",\"branchId\":" + q(scope.getString("branchId"))
            + "}";
    }

    private static String metadataJson(JSONObject envelope)
        throws Exception {
        return "\"format\":" + q(envelope.getString("format"))
            + ",\"schemaVersion\":" + envelope.getInt("schemaVersion")
            + ",\"canonicalUsername\":"
            + q(envelope.getString("canonicalUsername"))
            + ",\"branchScope\":" + scopeJson(envelope);
    }

    private static String factorJson(JSONObject factor)
        throws Exception {
        return "{"
            + "\"algorithm\":" + q(factor.getString("algorithm"))
            + ",\"salt\":" + q(factor.getString("salt"))
            + ",\"N\":" + factor.getInt("N")
            + ",\"r\":" + factor.getInt("r")
            + ",\"p\":" + factor.getInt("p")
            + ",\"derivedKeyLength\":"
            + factor.getInt("derivedKeyLength")
            + ",\"verifierLength\":"
            + factor.getInt("verifierLength")
            + ",\"verifier\":"
            + q(factor.getString("verifier"))
            + "}";
    }

    private static byte[] payloadAad(JSONObject envelope)
        throws Exception {
        return (
            "{\"domain\":" + q(PAYLOAD_AAD_DOMAIN)
            + "," + metadataJson(envelope) + "}"
        ).getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] wrapAad(
        JSONObject envelope,
        String purpose,
        JSONObject factor
    ) throws Exception {
        return (
            "{\"domain\":" + q(WRAP_AAD_DOMAIN)
            + ",\"purpose\":" + q(purpose)
            + "," + metadataJson(envelope)
            + ",\"factor\":" + factorJson(factor)
            + "}"
        ).getBytes(StandardCharsets.UTF_8);
    }

    private static JSONObject wrap(
        byte[] masterKey,
        byte[] wrapKey,
        String derivation,
        byte[] aad
    ) throws Exception {
        Encrypted value =
            encrypt(wrapKey, masterKey, aad);

        try {
            JSONObject object = new JSONObject();

            object.put("algorithm", "AES-256-GCM");
            object.put("keyDerivation", derivation);
            object.put("iv", b64(value.iv));
            object.put("authTag", b64(value.tag));
            object.put("wrappedKey", b64(value.ciphertext));

            return object;
        } finally {
            clear(value.iv);
            clear(value.ciphertext);
            clear(value.tag);
        }
    }

    public static Material create(
        JSONObject payloadBase,
        String password,
        String securityCode
    ) throws Exception {
        if (payloadBase == null) {
            throw new IllegalArgumentException(
                "FINORA enrollment payload is required."
            );
        }

        checkSecret(password);
        checkSecret(securityCode);

        // Prevent caller-supplied verifiers from being accepted.
        if (
            payloadBase.has("passwordVerifier") ||
            payloadBase.has("securityVerifier")
        ) {
            throw new IllegalArgumentException(
                "Enrollment verifiers must be generated internally."
            );
        }

        Factor passwordFactor = null;
        Factor securityFactor = null;
        byte[] masterKey = null;
        byte[] plaintext = null;

        try {
            passwordFactor = deriveFactor(
                password, PASSWORD_DOMAIN
            );

            securityFactor = deriveFactor(
                securityCode, RECOVERY_DOMAIN
            );

            masterKey = random(MASTER_KEY_BYTES);

            JSONObject payload =
                new JSONObject(payloadBase.toString());

            payload.put(
                "passwordVerifier",
                passwordFactor.metadata
            );

            payload.put(
                "securityVerifier",
                securityFactor.metadata
            );

            JSONObject envelope = new JSONObject();

            envelope.put(
                "format",
                "FINORA_PORTABLE_BRANCH_AUTH"
            );

            envelope.put("schemaVersion", 2);

            envelope.put(
                "canonicalUsername",
                payload.getString("canonicalUsername")
            );

            JSONObject scope = new JSONObject();

            scope.put(
                "ownerId",
                payload.getString("ownerId")
            );

            scope.put(
                "businessId",
                payload.getString("businessId")
            );

            scope.put(
                "branchId",
                payload.getString("branchId")
            );

            envelope.put("branchScope", scope);

            plaintext =
                payload.toString().getBytes(
                    StandardCharsets.UTF_8
                );

            if (plaintext.length > 65536) {
                throw new IllegalArgumentException(
                    "FINORA enrollment payload is too large."
                );
            }

            Encrypted protectedPayload =
                encrypt(
                    masterKey,
                    plaintext,
                    payloadAad(envelope)
                );

            try {
                JSONObject encryption = new JSONObject();

                encryption.put("algorithm", "AES-256-GCM");
                encryption.put("iv", b64(protectedPayload.iv));
                encryption.put("authTag", b64(protectedPayload.tag));

                envelope.put(
                    "passwordFactor",
                    passwordFactor.metadata
                );

                envelope.put(
                    "securityFactor",
                    securityFactor.metadata
                );

                envelope.put("payloadEncryption", encryption);

                envelope.put(
                    "passwordWrap",
                    wrap(
                        masterKey,
                        passwordFactor.wrapKey,
                        "FINORA-PORTABLE-BRANCH-AUTH-PASSWORD-WRAP-V2",
                        wrapAad(
                            envelope,
                            "PASSWORD",
                            passwordFactor.metadata
                        )
                    )
                );

                envelope.put(
                    "recoveryWrap",
                    wrap(
                        masterKey,
                        securityFactor.wrapKey,
                        "FINORA-PORTABLE-BRANCH-AUTH-RECOVERY-WRAP-V2",
                        wrapAad(
                            envelope,
                            "RECOVERY",
                            securityFactor.metadata
                        )
                    )
                );

                envelope.put(
                    "ciphertext",
                    b64(protectedPayload.ciphertext)
                );

                FinoraPortableBranchAuthV2Envelope.parse(
                    envelope.toString()
                );

                return new Material(
                    envelope,
                    passwordFactor.metadata,
                    securityFactor.metadata
                );
            } finally {
                clear(protectedPayload.iv);
                clear(protectedPayload.ciphertext);
                clear(protectedPayload.tag);
            }
        } finally {
            clear(masterKey);
            clear(plaintext);

            if (passwordFactor != null) {
                clear(passwordFactor.wrapKey);
            }

            if (securityFactor != null) {
                clear(securityFactor.wrapKey);
            }
        }
    }
}