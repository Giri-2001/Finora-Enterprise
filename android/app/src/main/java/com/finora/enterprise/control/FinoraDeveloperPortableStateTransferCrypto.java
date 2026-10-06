package com.finora.enterprise.control;

import android.util.Base64;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * PORTABLE STATE TRANSFER CRYPTO V1
 *
 * PURPOSE:
 * - Byte-compatible Android decrypt of the Windows
 *   FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER V1 bundle.
 * - Transfer Code -> SCRYPT -> AES-256-GCM.
 * - Exact authenticated metadata / AAD parity.
 *
 * SECURITY:
 * - No device binding.
 * - No plaintext persistence.
 * - No signing-key authority introduced here.
 * - Signed Portable State verification remains a separate mandatory step.
 */
public final class FinoraDeveloperPortableStateTransferCrypto {

    private static final String FORMAT =
        "FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER";

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
        32 * 1024 * 1024;

    private static final int MAX_PLAINTEXT_BYTES =
        32 * 1024 * 1024;

    private static final int TRANSFER_CODE_MIN_LENGTH =
        12;

    private static final int TRANSFER_CODE_MAX_LENGTH =
        128;

    private FinoraDeveloperPortableStateTransferCrypto() {
    }

    public static JSONObject decrypt(
        JSONObject bundle,
        String transferCode
    ) throws Exception {

        validateTransferCode(
            transferCode
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
                SCRYPT_SALT_BYTES,
                "salt"
            );

        byte[] iv =
            decodeCanonicalBase64(
                encryption.getString(
                    "iv"
                ),
                AES_GCM_IV_BYTES,
                "iv"
            );

        byte[] authTag =
            decodeCanonicalBase64(
                encryption.getString(
                    "authTag"
                ),
                AES_GCM_TAG_BYTES,
                "authTag"
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                bundle.getString(
                    "ciphertext"
                ),
                -1,
                "ciphertext"
            );

        if (
            ciphertext.length == 0 ||
            ciphertext.length > MAX_CIPHERTEXT_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer ciphertext size is invalid."
            );
        }

        byte[] derivedKey =
            SCrypt.generate(
                transferCode.getBytes(
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

            SecretKeySpec key =
                new SecretKeySpec(
                    derivedKey,
                    "AES"
                );

            GCMParameterSpec gcm =
                new GCMParameterSpec(
                    AES_GCM_TAG_BYTES * 8,
                    iv
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                key,
                gcm
            );

            cipher.updateAAD(
                buildAad(
                    bundle
                )
            );

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

            byte[] plaintext;

            try {
                plaintext =
                    cipher.doFinal(
                        combined
                    );
            } catch (Exception error) {
                throw new IllegalStateException(
                    "FINORA Portable State Transfer authentication failed.",
                    error
                );
            } finally {
                Arrays.fill(
                    combined,
                    (byte) 0
                );
            }

            try {

                if (
                    plaintext.length == 0 ||
                    plaintext.length > MAX_PLAINTEXT_BYTES
                ) {
                    throw new IllegalStateException(
                        "FINORA Portable State decrypted payload size is invalid."
                    );
                }

                String json =
                    new String(
                        plaintext,
                        StandardCharsets.UTF_8
                    );

                return new JSONObject(
                    json
                );

            } finally {

                Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }

        } finally {

            Arrays.fill(
                derivedKey,
                (byte) 0
            );

            Arrays.fill(
                salt,
                (byte) 0
            );

            Arrays.fill(
                iv,
                (byte) 0
            );

            Arrays.fill(
                authTag,
                (byte) 0
            );

            Arrays.fill(
                ciphertext,
                (byte) 0
            );
        }
    }

    private static void validateTransferCode(
        String value
    ) {

        if (
            value == null ||
            value.length() < TRANSFER_CODE_MIN_LENGTH ||
            value.length() > TRANSFER_CODE_MAX_LENGTH ||
            !value.equals(
                value.trim()
            ) ||
            containsControlCharacter(
                value
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable State Transfer Code is invalid."
            );
        }
    }

    private static boolean containsControlCharacter(
        String value
    ) {

        for (
            int index = 0;
            index < value.length();
            index++
        ) {

            char character =
                value.charAt(
                    index
                );

            if (
                character <= 0x1F ||
                character == 0x7F
            ) {
                return true;
            }
        }

        return false;
    }

    private static void validateBundle(
        JSONObject bundle
    ) throws Exception {

        if (bundle == null) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer Bundle must be an object."
            );
        }

        requireExactKeys(
            bundle,
            new String[] {
                "ciphertext",
                "encryption",
                "format",
                "kdf",
                "schemaVersion"
            },
            "FINORA Portable State Transfer Bundle"
        );

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
            ) != SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer Bundle format or schemaVersion is invalid."
            );
        }

        JSONObject kdf =
            bundle.optJSONObject(
                "kdf"
            );

        if (kdf == null) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer KDF metadata is invalid."
            );
        }

        requireExactKeys(
            kdf,
            new String[] {
                "N",
                "algorithm",
                "derivedKeyBytes",
                "p",
                "r",
                "salt"
            },
            "FINORA Portable State Transfer KDF metadata"
        );

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
            ) != SCRYPT_N ||
            kdf.optInt(
                "r",
                -1
            ) != SCRYPT_R ||
            kdf.optInt(
                "p",
                -1
            ) != SCRYPT_P ||
            kdf.optInt(
                "derivedKeyBytes",
                -1
            ) != DERIVED_KEY_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer SCRYPT parameters are invalid."
            );
        }

        decodeCanonicalBase64(
            kdf.getString(
                "salt"
            ),
            SCRYPT_SALT_BYTES,
            "salt"
        );

        JSONObject encryption =
            bundle.optJSONObject(
                "encryption"
            );

        if (encryption == null) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer encryption metadata is invalid."
            );
        }

        requireExactKeys(
            encryption,
            new String[] {
                "algorithm",
                "authTag",
                "iv"
            },
            "FINORA Portable State Transfer encryption metadata"
        );

        if (
            !"AES-256-GCM".equals(
                encryption.optString(
                    "algorithm",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer encryption algorithm is invalid."
            );
        }

        decodeCanonicalBase64(
            encryption.getString(
                "iv"
            ),
            AES_GCM_IV_BYTES,
            "iv"
        );

        decodeCanonicalBase64(
            encryption.getString(
                "authTag"
            ),
            AES_GCM_TAG_BYTES,
            "authTag"
        );

        byte[] ciphertext =
            decodeCanonicalBase64(
                bundle.getString(
                    "ciphertext"
                ),
                -1,
                "ciphertext"
            );

        try {

            if (
                ciphertext.length >
                MAX_CIPHERTEXT_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA Portable State Transfer ciphertext exceeds the supported size limit."
                );
            }

        } finally {

            Arrays.fill(
                ciphertext,
                (byte) 0
            );
        }
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
        int expectedBytes,
        String label
    ) {

        if (
            value == null ||
            value.isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Portable State Transfer " +
                label +
                " is invalid."
            );
        }

        byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.NO_WRAP
                );

        } catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Portable State Transfer " +
                label +
                " is not canonical base64.",
                error
            );
        }

        String canonical =
            Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            );

        if (
            decoded.length == 0 ||
            !canonical.equals(
                value
            ) ||
            (
                expectedBytes >= 0 &&
                decoded.length != expectedBytes
            )
        ) {
            Arrays.fill(
                decoded,
                (byte) 0
            );

            throw new IllegalStateException(
                "FINORA Portable State Transfer " +
                label +
                " is not canonical base64."
            );
        }

        return decoded;
    }

    private static void requireExactKeys(
        JSONObject object,
        String[] expected,
        String label
    ) {

        Set<String> actualKeys =
            new HashSet<>();

        Iterator<String> iterator =
            object.keys();

        while (
            iterator.hasNext()
        ) {
            actualKeys.add(
                iterator.next()
            );
        }

        Set<String> expectedKeys =
            new HashSet<>(
                Arrays.asList(
                    expected
                )
            );

        if (
            !actualKeys.equals(
                expectedKeys
            )
        ) {
            throw new IllegalStateException(
                label +
                " contains unsupported fields."
            );
        }
    }
}