package com.finora.enterprise.control;

import android.util.Base64;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * ADMIN AUTHORITY RECOVERY CRYPTO
 *
 * Byte contract matches Electron:
 *
 * SCRYPT:
 * N = 32768
 * r = 8
 * p = 1
 * salt = 16 bytes
 * output = 32 bytes
 *
 * AES:
 * AES-256-GCM
 * IV = 12 bytes
 * tag = 16 bytes
 *
 * AAD:
 * JSON array of exact public Recovery metadata fields.
 *
 * This class DECRYPTS ONLY.
 * It does not persist signing authority and never returns
 * private signing material to the renderer.
 */
public final class FinoraDeveloperAdminRecoveryCrypto {

    private static final String FORMAT =
        "FINORA_CONTROL_CENTER_ADMIN_AUTHORITY_RECOVERY";

    private static final int SCHEMA_VERSION =
        1;

    private static final int SCRYPT_N =
        32768;

    private static final int SCRYPT_R =
        8;

    private static final int SCRYPT_P =
        1;

    private static final int SCRYPT_SALT_BYTES =
        16;

    private static final int DERIVED_KEY_BYTES =
        32;

    private static final int AES_GCM_IV_BYTES =
        12;

    private static final int AES_GCM_TAG_BYTES =
        16;

    private static final int MAX_CIPHERTEXT_BYTES =
        512 * 1024;

    private static final int SECURITY_CODE_MIN =
        10;

    private static final int SECURITY_CODE_MAX =
        20;

    private FinoraDeveloperAdminRecoveryCrypto() {
    }

    public static JSONObject decrypt(
        JSONObject bundle,
        String securityCode
    ) throws Exception {

        validateSecurityCode(
            securityCode
        );

        validateBundle(
            bundle
        );

        JSONObject kdf =
            bundle.getJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.getJSONObject(
                "encryption"
            );

        byte[] salt =
            decodeCanonicalBase64(
                kdf.getString(
                    "salt"
                ),
                SCRYPT_SALT_BYTES
            );

        byte[] iv =
            decodeCanonicalBase64(
                encryption.getString(
                    "iv"
                ),
                AES_GCM_IV_BYTES
            );

        byte[] authTag =
            decodeCanonicalBase64(
                encryption.getString(
                    "authTag"
                ),
                AES_GCM_TAG_BYTES
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                bundle.getString(
                    "ciphertext"
                ),
                -1
            );

        if (
            ciphertext.length == 0 ||
            ciphertext.length >
                MAX_CIPHERTEXT_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle ciphertext size is invalid."
            );
        }

        byte[] derivedKey =
            SCrypt.generate(
                securityCode.getBytes(
                    StandardCharsets.UTF_8
                ),
                salt,
                SCRYPT_N,
                SCRYPT_R,
                SCRYPT_P,
                DERIVED_KEY_BYTES
            );

        try {

            Cipher cipher =
                Cipher.getInstance(
                    "AES/GCM/NoPadding"
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                new SecretKeySpec(
                    derivedKey,
                    "AES"
                ),
                new GCMParameterSpec(
                    AES_GCM_TAG_BYTES * 8,
                    iv
                )
            );

            cipher.updateAAD(
                buildAad(
                    bundle
                )
            );

            /*
             * Java GCM expects ciphertext || authTag.
             * Node stores them separately.
             */
            byte[] combined =
                new byte[
                    ciphertext.length +
                    authTag.length
                ];

            System.arraycopy(
                ciphertext,
                0,
                combined,
                0,
                ciphertext.length
            );

            System.arraycopy(
                authTag,
                0,
                combined,
                ciphertext.length,
                authTag.length
            );

            final byte[] plaintext;

            try {

                plaintext =
                    cipher.doFinal(
                        combined
                    );

            } catch (
                AEADBadTagException error
            ) {

                throw new IllegalStateException(
                    "FINORA Admin Recovery Bundle authentication failed."
                );
            } catch (
                GeneralSecurityException error
            ) {

                throw new IllegalStateException(
                    "FINORA Admin Recovery Bundle authentication failed."
                );
            }

            final JSONObject vault;

            try {

                vault =
                    new JSONObject(
                        new String(
                            plaintext,
                            StandardCharsets.UTF_8
                        )
                    );

            } catch (Exception error) {

                throw new IllegalStateException(
                    "FINORA Admin Recovery Bundle plaintext is invalid."
                );
            }

            validateVaultShape(
                vault
            );

            if (
                !vault.getString(
                    "issuerId"
                ).equals(
                    bundle.getString(
                        "issuerId"
                    )
                ) ||
                !vault.getString(
                    "signingKeyId"
                ).equals(
                    bundle.getString(
                        "signingKeyId"
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Admin Recovery Bundle identity metadata does not match decrypted signing authority."
                );
            }

            return vault;

        } finally {

            java.util.Arrays.fill(
                derivedKey,
                (byte) 0
            );

            java.util.Arrays.fill(
                salt,
                (byte) 0
            );
        }
    }

    private static void validateSecurityCode(
        String securityCode
    ) {

        if (securityCode == null) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Security Code is invalid."
            );
        }

        int length =
            securityCode.codePointCount(
                0,
                securityCode.length()
            );

        if (
            length <
                SECURITY_CODE_MIN ||
            length >
                SECURITY_CODE_MAX ||
            securityCode.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Security Code is invalid."
            );
        }
    }

    private static void validateBundle(
        JSONObject bundle
    ) throws Exception {

        if (bundle == null) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle is invalid."
            );
        }

        if (
            !FORMAT.equals(
                bundle.optString(
                    "format",
                    ""
                )
            ) ||
            bundle.optInt(
                "schemaVersion",
                -1
            ) !=
                SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle format/schema is invalid."
            );
        }

        requireNonEmptyString(
            bundle,
            "bundleId"
        );

        requireNonEmptyString(
            bundle,
            "issuerId"
        );

        requireNonEmptyString(
            bundle,
            "signingKeyId"
        );

        requireNonEmptyString(
            bundle,
            "createdAt"
        );

        JSONObject kdf =
            bundle.optJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.optJSONObject(
                "encryption"
            );

        if (
            kdf == null ||
            encryption == null
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle cryptographic metadata is invalid."
            );
        }

        if (
            !"SCRYPT".equals(
                kdf.optString(
                    "algorithm",
                    ""
                )
            ) ||
            kdf.optInt(
                "N",
                -1
            ) !=
                SCRYPT_N ||
            kdf.optInt(
                "r",
                -1
            ) !=
                SCRYPT_R ||
            kdf.optInt(
                "p",
                -1
            ) !=
                SCRYPT_P ||
            kdf.optInt(
                "derivedKeyBytes",
                -1
            ) !=
                DERIVED_KEY_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle SCRYPT parameters are invalid."
            );
        }

        if (
            !"AES-256-GCM".equals(
                encryption.optString(
                    "algorithm",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle encryption algorithm is invalid."
            );
        }

        decodeCanonicalBase64(
            kdf.getString(
                "salt"
            ),
            SCRYPT_SALT_BYTES
        );

        decodeCanonicalBase64(
            encryption.getString(
                "iv"
            ),
            AES_GCM_IV_BYTES
        );

        decodeCanonicalBase64(
            encryption.getString(
                "authTag"
            ),
            AES_GCM_TAG_BYTES
        );

        decodeCanonicalBase64(
            bundle.getString(
                "ciphertext"
            ),
            -1
        );
    }

    private static byte[] buildAad(
        JSONObject bundle
    ) throws Exception {

        JSONObject kdf =
            bundle.getJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.getJSONObject(
                "encryption"
            );

        JSONArray aad =
            new JSONArray();

        aad.put(
            bundle.getString(
                "format"
            )
        );

        aad.put(
            bundle.getInt(
                "schemaVersion"
            )
        );

        aad.put(
            bundle.getString(
                "bundleId"
            )
        );

        aad.put(
            bundle.getString(
                "issuerId"
            )
        );

        aad.put(
            bundle.getString(
                "signingKeyId"
            )
        );

        aad.put(
            bundle.getString(
                "createdAt"
            )
        );

        aad.put(
            kdf.getString(
                "algorithm"
            )
        );

        aad.put(
            kdf.getInt(
                "N"
            )
        );

        aad.put(
            kdf.getInt(
                "r"
            )
        );

        aad.put(
            kdf.getInt(
                "p"
            )
        );

        aad.put(
            kdf.getString(
                "salt"
            )
        );

        aad.put(
            kdf.getInt(
                "derivedKeyBytes"
            )
        );

        aad.put(
            encryption.getString(
                "algorithm"
            )
        );

        aad.put(
            encryption.getString(
                "iv"
            )
        );

        return aad
            .toString()
            .getBytes(
                StandardCharsets.UTF_8
            );
    }

    private static byte[] decodeCanonicalBase64(
        String value,
        int expectedBytes
    ) {

        if (
            value == null ||
            value.isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle base64 field is invalid."
            );
        }

        final byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );

        } catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle base64 field is invalid."
            );
        }

        String canonical =
            Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            );

        if (
            !canonical.equals(
                value
            ) ||
            (
                expectedBytes >= 0 &&
                decoded.length !=
                    expectedBytes
            )
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle base64 field is not canonical."
            );
        }

        return decoded;
    }

    private static void validateVaultShape(
        JSONObject vault
    ) throws Exception {

        if (
            vault.optInt(
                "schemaVersion",
                -1
            ) !=
                1
        ) {
            throw new IllegalStateException(
                "FINORA recovered Control Center key-vault schema is invalid."
            );
        }

        requireNonEmptyString(
            vault,
            "issuerId"
        );

        requireNonEmptyString(
            vault,
            "signingKeyId"
        );

        requireNonEmptyString(
            vault,
            "privateKeyPkcs8DerBase64"
        );

        requireNonEmptyString(
            vault,
            "publicKeySpkiDerBase64"
        );

        requireNonEmptyString(
            vault,
            "createdAt"
        );

        /*
         * Private/public key DER cryptographic equivalence is
         * deliberately checked in Phase 2B2 before persistence.
         */
    }

    private static void requireNonEmptyString(
        JSONObject object,
        String field
    ) throws Exception {

        if (
            !object.has(
                field
            ) ||
            object.isNull(
                field
            ) ||
            object.getString(
                field
            ).isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Admin Recovery Bundle field is invalid: " +
                field
            );
        }
    }
}