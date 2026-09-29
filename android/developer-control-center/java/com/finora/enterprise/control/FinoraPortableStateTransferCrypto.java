package com.finora.enterprise.control;

import android.util.Base64;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;


/*
 * FINORA Portable State Transfer V1 authenticated decryptor.
 *
 * Crypto:
 * - SCRYPT N=32768 r=8 p=1
 * - 16-byte salt
 * - 32-byte derived key
 * - AES-256-GCM
 * - 12-byte IV
 * - 16-byte tag
 *
 * This class owns decryption only.
 */
final class FinoraPortableStateTransferCrypto {

    static final String FORMAT =
        "FINORA_CONTROL_CENTER_PORTABLE_STATE_TRANSFER";

    static final int SCHEMA_VERSION =
        1;

    static final String KDF_ALGORITHM =
        "SCRYPT";

    static final int SCRYPT_N =
        32768;

    static final int SCRYPT_R =
        8;

    static final int SCRYPT_P =
        1;

    static final int SCRYPT_SALT_BYTES =
        16;

    static final int DERIVED_KEY_BYTES =
        32;

    static final String ENCRYPTION_ALGORITHM =
        "AES-256-GCM";

    static final String CIPHER_TRANSFORMATION =
        "AES/GCM/NoPadding";

    static final int AES_GCM_IV_BYTES =
        12;

    static final int AES_GCM_TAG_BYTES =
        16;

    static final int AES_GCM_TAG_BITS =
        128;

    static final int TRANSFER_CODE_MIN_LENGTH =
        12;

    static final int TRANSFER_CODE_MAX_LENGTH =
        128;

    static final int MAX_SERIALIZED_BUNDLE_BYTES =
        48 * 1024 * 1024;

    static final int MAX_CIPHERTEXT_BYTES =
        32 * 1024 * 1024;

    static final int MAX_PLAINTEXT_BYTES =
        32 * 1024 * 1024;


    private FinoraPortableStateTransferCrypto() {
    }


    static String encryptSerializedSignedEnvelope(
        String serializedSignedEnvelope,
        String transferCode
    ) throws Exception {

        validateTransferCode(transferCode);

        if (
            serializedSignedEnvelope == null ||
            serializedSignedEnvelope.length() == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable State signed envelope is required."
            );
        }

        byte[] plaintext =
            serializedSignedEnvelope.getBytes(
                StandardCharsets.UTF_8
            );

        if (
            plaintext.length <= 0 ||
            plaintext.length > MAX_PLAINTEXT_BYTES
        ) {
            Arrays.fill(plaintext, (byte) 0);
            throw new IllegalArgumentException(
                "FINORA Portable State signed envelope size is invalid."
            );
        }

        byte[] salt =
            new byte[SCRYPT_SALT_BYTES];

        byte[] iv =
            new byte[AES_GCM_IV_BYTES];

        byte[] transferCodeBytes =
            transferCode.getBytes(StandardCharsets.UTF_8);

        byte[] derivedKey = null;
        byte[] encryptedWithTag = null;
        byte[] ciphertext = null;
        byte[] authTag = null;
        byte[] aad = null;

        try {

            SecureRandom random =
                new SecureRandom();

            random.nextBytes(salt);
            random.nextBytes(iv);

            String saltBase64 =
                Base64.encodeToString(
                    salt,
                    Base64.NO_WRAP
                );

            String ivBase64 =
                Base64.encodeToString(
                    iv,
                    Base64.NO_WRAP
                );

            derivedKey =
                SCrypt.generate(
                    transferCodeBytes,
                    salt,
                    SCRYPT_N,
                    SCRYPT_R,
                    SCRYPT_P,
                    DERIVED_KEY_BYTES
                );

            Cipher cipher =
                Cipher.getInstance(
                    CIPHER_TRANSFORMATION
                );

            cipher.init(
                Cipher.ENCRYPT_MODE,
                new SecretKeySpec(
                    derivedKey,
                    "AES"
                ),
                new GCMParameterSpec(
                    AES_GCM_TAG_BITS,
                    iv
                )
            );

            aad =
                buildAad(
                    saltBase64,
                    ivBase64
                );

            cipher.updateAAD(aad);

            encryptedWithTag =
                cipher.doFinal(plaintext);

            int ciphertextLength =
                encryptedWithTag.length -
                    AES_GCM_TAG_BYTES;

            if (
                ciphertextLength <= 0 ||
                ciphertextLength >
                    MAX_CIPHERTEXT_BYTES
            ) {
                throw new IllegalArgumentException(
                    "FINORA Portable State Transfer ciphertext size is invalid."
                );
            }

            ciphertext =
                Arrays.copyOfRange(
                    encryptedWithTag,
                    0,
                    ciphertextLength
                );

            authTag =
                Arrays.copyOfRange(
                    encryptedWithTag,
                    ciphertextLength,
                    encryptedWithTag.length
                );

            JSONObject kdf =
                new JSONObject();

            kdf.put("algorithm", KDF_ALGORITHM);
            kdf.put("N", SCRYPT_N);
            kdf.put("r", SCRYPT_R);
            kdf.put("p", SCRYPT_P);
            kdf.put(
                "salt",
                saltBase64
            );
            kdf.put(
                "derivedKeyBytes",
                DERIVED_KEY_BYTES
            );

            JSONObject encryption =
                new JSONObject();

            encryption.put(
                "algorithm",
                ENCRYPTION_ALGORITHM
            );
            encryption.put(
                "iv",
                ivBase64
            );
            encryption.put(
                "authTag",
                Base64.encodeToString(
                    authTag,
                    Base64.NO_WRAP
                )
            );

            JSONObject root =
                new JSONObject();

            root.put("format", FORMAT);
            root.put(
                "schemaVersion",
                SCHEMA_VERSION
            );
            root.put("kdf", kdf);
            root.put(
                "encryption",
                encryption
            );
            root.put(
                "ciphertext",
                Base64.encodeToString(
                    ciphertext,
                    Base64.NO_WRAP
                )
            );

            String serialized =
                root.toString();

            if (
                serialized.getBytes(
                    StandardCharsets.UTF_8
                ).length >
                    MAX_SERIALIZED_BUNDLE_BYTES
            ) {
                throw new IllegalArgumentException(
                    "FINORA Portable State Transfer serialization is too large."
                );
            }

            return serialized;
        }
        finally {

            Arrays.fill(
                plaintext,
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
                transferCodeBytes,
                (byte) 0
            );

            if (derivedKey != null) {
                Arrays.fill(
                    derivedKey,
                    (byte) 0
                );
            }

            if (encryptedWithTag != null) {
                Arrays.fill(
                    encryptedWithTag,
                    (byte) 0
                );
            }

            if (ciphertext != null) {
                Arrays.fill(
                    ciphertext,
                    (byte) 0
                );
            }

            if (authTag != null) {
                Arrays.fill(
                    authTag,
                    (byte) 0
                );
            }

            if (aad != null) {
                Arrays.fill(
                    aad,
                    (byte) 0
                );
            }
        }
    }

    static String decryptSerializedSignedEnvelope(
        String serializedBundle,
        String transferCode
    ) throws Exception {

        validateTransferCode(
            transferCode
        );


        if (
            serializedBundle == null ||
            serializedBundle.length() == 0
        ) {

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer serialization is required."
            );
        }


        byte[] serializedBytes =
            serializedBundle.getBytes(
                StandardCharsets.UTF_8
            );


        if (
            serializedBytes.length <= 0 ||
            serializedBytes.length >
                MAX_SERIALIZED_BUNDLE_BYTES
        ) {

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer serialization size is invalid."
            );
        }


        JSONObject root;

        try {

            root =
                new JSONObject(
                    serializedBundle
                );
        }
        catch (Exception error) {

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer serialization is malformed.",
                error
            );
        }


        requireExactKeys(
            root,
            new String[] {
                "ciphertext",
                "encryption",
                "format",
                "kdf",
                "schemaVersion"
            },
            "FINORA Portable State Transfer bundle"
        );


        if (
            !FORMAT.equals(
                root.optString(
                    "format",
                    ""
                )
            )
        ) {

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer format is invalid."
            );
        }


        requireExactInteger(
            root,
            "schemaVersion",
            SCHEMA_VERSION,
            "FINORA Portable State Transfer schemaVersion"
        );


        JSONObject kdf =
            root.optJSONObject(
                "kdf"
            );

        if (kdf == null) {

            throw new IllegalArgumentException(
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
            !KDF_ALGORITHM.equals(
                kdf.optString(
                    "algorithm",
                    ""
                )
            )
        ) {

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer KDF algorithm is invalid."
            );
        }


        requireExactInteger(
            kdf,
            "N",
            SCRYPT_N,
            "FINORA Portable State Transfer SCRYPT N"
        );

        requireExactInteger(
            kdf,
            "r",
            SCRYPT_R,
            "FINORA Portable State Transfer SCRYPT r"
        );

        requireExactInteger(
            kdf,
            "p",
            SCRYPT_P,
            "FINORA Portable State Transfer SCRYPT p"
        );

        requireExactInteger(
            kdf,
            "derivedKeyBytes",
            DERIVED_KEY_BYTES,
            "FINORA Portable State Transfer derivedKeyBytes"
        );


        String saltBase64 =
            requireNonEmptyString(
                kdf,
                "salt"
            );

        byte[] salt =
            decodeCanonicalBase64(
                saltBase64,
                SCRYPT_SALT_BYTES,
                "FINORA Portable State Transfer salt"
            );


        JSONObject encryption =
            root.optJSONObject(
                "encryption"
            );

        if (encryption == null) {

            Arrays.fill(
                salt,
                (byte) 0
            );

            throw new IllegalArgumentException(
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
            !ENCRYPTION_ALGORITHM.equals(
                encryption.optString(
                    "algorithm",
                    ""
                )
            )
        ) {

            Arrays.fill(
                salt,
                (byte) 0
            );

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer encryption algorithm is invalid."
            );
        }


        String ivBase64 =
            requireNonEmptyString(
                encryption,
                "iv"
            );

        byte[] iv =
            decodeCanonicalBase64(
                ivBase64,
                AES_GCM_IV_BYTES,
                "FINORA Portable State Transfer IV"
            );


        String authTagBase64 =
            requireNonEmptyString(
                encryption,
                "authTag"
            );

        byte[] authTag =
            decodeCanonicalBase64(
                authTagBase64,
                AES_GCM_TAG_BYTES,
                "FINORA Portable State Transfer authentication tag"
            );


        String ciphertextBase64 =
            requireNonEmptyString(
                root,
                "ciphertext"
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                ciphertextBase64,
                -1,
                "FINORA Portable State Transfer ciphertext"
            );


        if (
            ciphertext.length <= 0 ||
            ciphertext.length >
                MAX_CIPHERTEXT_BYTES
        ) {

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

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer ciphertext size is invalid."
            );
        }


        byte[] transferCodeBytes =
            transferCode.getBytes(
                StandardCharsets.UTF_8
            );

        byte[] derivedKey =
            null;

        byte[] ciphertextAndTag =
            null;

        byte[] plaintext =
            null;


        try {

            derivedKey =
                SCrypt.generate(
                    transferCodeBytes,
                    salt,
                    SCRYPT_N,
                    SCRYPT_R,
                    SCRYPT_P,
                    DERIVED_KEY_BYTES
                );


            if (
                derivedKey == null ||
                derivedKey.length !=
                    DERIVED_KEY_BYTES
            ) {

                throw new GeneralSecurityException(
                    "FINORA Portable State Transfer key derivation failed."
                );
            }


            ciphertextAndTag =
                new byte[
                    ciphertext.length +
                    authTag.length
                ];


            System.arraycopy(
                ciphertext,
                0,
                ciphertextAndTag,
                0,
                ciphertext.length
            );


            System.arraycopy(
                authTag,
                0,
                ciphertextAndTag,
                ciphertext.length,
                authTag.length
            );


            Cipher cipher =
                Cipher.getInstance(
                    CIPHER_TRANSFORMATION
                );


            cipher.init(
                Cipher.DECRYPT_MODE,
                new SecretKeySpec(
                    derivedKey,
                    "AES"
                ),
                new GCMParameterSpec(
                    AES_GCM_TAG_BITS,
                    iv
                )
            );


            byte[] aad =
                buildAad(
                    saltBase64,
                    ivBase64
                );


            try {

                cipher.updateAAD(
                    aad
                );

                plaintext =
                    cipher.doFinal(
                        ciphertextAndTag
                    );
            }
            catch (AEADBadTagException error) {

                throw new GeneralSecurityException(
                    "FINORA Portable State Transfer authentication failed.",
                    error
                );
            }
            finally {

                Arrays.fill(
                    aad,
                    (byte) 0
                );
            }


            if (
                plaintext == null ||
                plaintext.length <= 0 ||
                plaintext.length >
                    MAX_PLAINTEXT_BYTES
            ) {

                throw new GeneralSecurityException(
                    "FINORA Portable State decrypted envelope size is invalid."
                );
            }


            return new String(
                plaintext,
                StandardCharsets.UTF_8
            );
        }
        finally {

            Arrays.fill(
                transferCodeBytes,
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


            if (derivedKey != null) {

                Arrays.fill(
                    derivedKey,
                    (byte) 0
                );
            }


            if (ciphertextAndTag != null) {

                Arrays.fill(
                    ciphertextAndTag,
                    (byte) 0
                );
            }


            if (plaintext != null) {

                Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }
        }
    }


    private static byte[] buildAad(
        String saltBase64,
        String ivBase64
    ) {

        /*
         * AES-GCM AAD MUST match the Windows JSON.stringify([...])
         * representation byte-for-byte.
         *
         * Android org.json serialization escapes "/" as "\/".
         * Standard Base64 may contain "/", so a platform JSON
         * serializer cannot own these authenticated bytes.
         *
         * FORMAT / algorithm constants and canonical Base64 values
         * contain no JSON quote or backslash characters.
         */
        StringBuilder aad =
            new StringBuilder();

        aad
            .append('[')
            .append('"')
            .append(FORMAT)
            .append('"')
            .append(',')
            .append(SCHEMA_VERSION)
            .append(',')
            .append('"')
            .append(KDF_ALGORITHM)
            .append('"')
            .append(',')
            .append(SCRYPT_N)
            .append(',')
            .append(SCRYPT_R)
            .append(',')
            .append(SCRYPT_P)
            .append(',')
            .append('"')
            .append(saltBase64)
            .append('"')
            .append(',')
            .append(DERIVED_KEY_BYTES)
            .append(',')
            .append('"')
            .append(ENCRYPTION_ALGORITHM)
            .append('"')
            .append(',')
            .append('"')
            .append(ivBase64)
            .append('"')
            .append(']');

        return aad
            .toString()
            .getBytes(
                StandardCharsets.UTF_8
            );
    }


    private static void requireExactInteger(
        JSONObject object,
        String key,
        int expected,
        String label
    ) {

        Object raw =
            object.opt(
                key
            );


        if (
            !(raw instanceof Number)
        ) {

            throw new IllegalArgumentException(
                label +
                " must be numeric."
            );
        }


        Number number =
            (Number) raw;

        double doubleValue =
            number.doubleValue();

        long longValue =
            number.longValue();


        if (
            !Double.isFinite(
                doubleValue
            ) ||
            doubleValue !=
                (double) longValue ||
            longValue !=
                (long) expected
        ) {

            throw new IllegalArgumentException(
                label +
                " is invalid."
            );
        }
    }


    private static String requireNonEmptyString(
        JSONObject object,
        String key
    ) {

        Object raw =
            object.opt(
                key
            );


        if (
            !(raw instanceof String) ||
            ((String) raw).length() == 0
        ) {

            throw new IllegalArgumentException(
                key +
                " is invalid."
            );
        }


        return (String) raw;
    }


    private static byte[] decodeCanonicalBase64(
        String value,
        int expectedBytes,
        String label
    ) {

        if (
            value == null ||
            value.length() == 0
        ) {

            throw new IllegalArgumentException(
                label +
                " is invalid."
            );
        }


        final byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );
        }
        catch (IllegalArgumentException error) {

            throw new IllegalArgumentException(
                label +
                " is invalid Base64.",
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
                decoded.length !=
                    expectedBytes
            )
        ) {

            Arrays.fill(
                decoded,
                (byte) 0
            );

            throw new IllegalArgumentException(
                label +
                " is not canonical Base64."
            );
        }


        return decoded;
    }


    private static void validateTransferCode(
        String value
    ) {

        if (
            value == null ||
            value.length() <
                TRANSFER_CODE_MIN_LENGTH ||
            value.length() >
                TRANSFER_CODE_MAX_LENGTH ||
            !value.equals(
                value.trim()
            )
        ) {

            throw new IllegalArgumentException(
                "FINORA Portable State Transfer Code is invalid."
            );
        }


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
                character <= 0x1f ||
                character == 0x7f
            ) {

                throw new IllegalArgumentException(
                    "FINORA Portable State Transfer Code is invalid."
                );
            }
        }
    }


    private static void requireExactKeys(
        JSONObject object,
        String[] expectedKeys,
        String label
    ) {

        Set<String> expected =
            new HashSet<>(
                Arrays.asList(
                    expectedKeys
                )
            );

        Set<String> actual =
            new HashSet<>();

        Iterator<String> iterator =
            object.keys();


        while (
            iterator.hasNext()
        ) {

            actual.add(
                iterator.next()
            );
        }


        if (
            actual.size() !=
                expected.size() ||
            !actual.equals(
                expected
            )
        ) {

            throw new IllegalArgumentException(
                label +
                " contains unsupported fields."
            );
        }
    }
}