package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * DEVELOPER SECURITY CODE STORE
 *
 * Mirrors the Windows security-code authority:
 *
 * - Code length: 10..20 Unicode code points.
 * - SCRYPT N=32768 r=8 p=1.
 * - Salt: 16 bytes.
 * - Verifier: 32 bytes.
 * - Plaintext Security Code is never persisted.
 * - Store is issuer-bound.
 * - Throttle state is persisted with the verifier record.
 * - Full persisted record is encrypted with AndroidKeyStore AES-GCM.
 * - AtomicFile protects replacement.
 */
public final class FinoraDeveloperSecurityCodeStore {

    private static final int STORE_SCHEMA_VERSION =
        1;

    private static final int SECURITY_CODE_MIN =
        10;

    private static final int SECURITY_CODE_MAX =
        20;

    private static final int SCRYPT_N =
        32768;

    private static final int SCRYPT_R =
        8;

    private static final int SCRYPT_P =
        1;

    private static final int SALT_BYTES =
        16;

    private static final int VERIFIER_BYTES =
        32;

    private static final String KEYSTORE_PROVIDER =
        "AndroidKeyStore";

    private static final String KEY_ALIAS =
        "finora_developer_security_code_store_aes_v1";

    private static final String CIPHER_ALGORITHM =
        "AES/GCM/NoPadding";

    private static final String FILE_NAME =
        "finora_developer_security_code_store_v1.enc";

    private static final int GCM_TAG_BITS =
        128;

    private static final byte[] AAD =
        "FINORA-DEVELOPER-SECURITY-CODE-STORE-V1"
            .getBytes(StandardCharsets.UTF_8);

    private static final int MAX_FILE_BYTES =
        256 * 1024;

    private final AtomicFile atomicFile;

    private final SecureRandom secureRandom =
        new SecureRandom();

    public FinoraDeveloperSecurityCodeStore(
        Context context
    ) {

        File directory =
            new File(
                context.getApplicationContext().getFilesDir(),
                "finora-developer-control-center"
            );

        if (
            !directory.exists() &&
            !directory.mkdirs() &&
            !directory.exists()
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security storage directory could not be created."
            );
        }

        atomicFile =
            new AtomicFile(
                new File(
                    directory,
                    FILE_NAME
                )
            );
    }

    public synchronized boolean isConfigured(
        String issuerId
    ) throws Exception {

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        return record != null;
    }

    public synchronized void initialize(
        String issuerId,
        String securityCode
    ) throws Exception {

        requireText(
            issuerId,
            "issuerId"
        );

        validateSecurityCode(
            securityCode
        );

        JSONObject existing =
            readRecord();

        if (existing != null) {
            throw new IllegalStateException(
                "FINORA Developer Security Code is already configured."
            );
        }

        JSONObject verifier =
            createVerifier(
                securityCode
            );

        String now =
            java.time.Instant.now()
                .toString();

        JSONObject record =
            new JSONObject();

        record.put(
            "schemaVersion",
            STORE_SCHEMA_VERSION
        );

        record.put(
            "issuerId",
            issuerId
        );

        record.put(
            "verifier",
            verifier
        );

        record.put(
            "createdAt",
            now
        );

        record.put(
            "updatedAt",
            now
        );

        writeRecord(
            record
        );

        JSONObject persisted =
            readBoundRecord(
                issuerId
            );

        if (
            persisted == null ||
            !issuerId.equals(
                persisted.getString(
                    "issuerId"
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code store read-back verification failed."
            );
        }
    }

    public synchronized boolean verify(
        String issuerId,
        String securityCode
    ) throws Exception {

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        if (record == null) {
            return false;
        }

        validateSecurityCode(
            securityCode
        );

        JSONObject verifier =
            record.getJSONObject(
                "verifier"
            );

        byte[] salt =
            decodeCanonicalBase64(
                verifier.getString(
                    "salt"
                ),
                SALT_BYTES
            );

        byte[] expected =
            decodeCanonicalBase64(
                verifier.getString(
                    "verifier"
                ),
                VERIFIER_BYTES
            );

        byte[] actual =
            derive(
                securityCode,
                salt
            );

        try {

            return MessageDigest.isEqual(
                expected,
                actual
            );

        } finally {

            java.util.Arrays.fill(
                actual,
                (byte) 0
            );
        }
    }

    public synchronized boolean change(
        String issuerId,
        String oldSecurityCode,
        String newSecurityCode
    ) throws Exception {

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        if (record == null) {
            return false;
        }

        if (
            !verify(
                issuerId,
                oldSecurityCode
            )
        ) {
            return false;
        }

        validateSecurityCode(
            newSecurityCode
        );

        record.put(
            "verifier",
            createVerifier(
                newSecurityCode
            )
        );

        record.put(
            "updatedAt",
            java.time.Instant.now()
                .toString()
        );

        record.remove(
            "failedAttempts"
        );

        record.remove(
            "blockedUntil"
        );

        writeRecord(
            record
        );

        return true;
    }

    public synchronized int readFailedAttempts(
        String issuerId
    ) throws Exception {

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        if (record == null) {
            return 0;
        }

        return record.optInt(
            "failedAttempts",
            0
        );
    }

    public synchronized long readBlockedUntilMilliseconds(
        String issuerId
    ) throws Exception {

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        if (
            record == null ||
            !record.has(
                "blockedUntil"
            )
        ) {
            return 0L;
        }

        try {

            return java.time.Instant.parse(
                record.getString(
                    "blockedUntil"
                )
            ).toEpochMilli();

        } catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Developer Security Code throttle state is corrupt."
            );
        }
    }

    public synchronized void writeThrottle(
        String issuerId,
        int failedAttempts,
        long blockedUntilMilliseconds
    ) throws Exception {

        if (
            failedAttempts < 1 ||
            blockedUntilMilliseconds <= 0
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code throttle state is invalid."
            );
        }

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        if (record == null) {
            throw new IllegalStateException(
                "FINORA Developer Security Code is not configured."
            );
        }

        record.put(
            "failedAttempts",
            failedAttempts
        );

        record.put(
            "blockedUntil",
            java.time.Instant.ofEpochMilli(
                blockedUntilMilliseconds
            ).toString()
        );

        writeRecord(
            record
        );
    }

    public synchronized void clearThrottle(
        String issuerId
    ) throws Exception {

        JSONObject record =
            readBoundRecord(
                issuerId
            );

        if (record == null) {
            return;
        }

        record.remove(
            "failedAttempts"
        );

        record.remove(
            "blockedUntil"
        );

        writeRecord(
            record
        );
    }

    private JSONObject createVerifier(
        String securityCode
    ) throws Exception {

        byte[] salt =
            new byte[
                SALT_BYTES
            ];

        secureRandom.nextBytes(
            salt
        );

        byte[] derived =
            derive(
                securityCode,
                salt
            );

        try {

            JSONObject verifier =
                new JSONObject();

            verifier.put(
                "algorithm",
                "SCRYPT"
            );

            verifier.put(
                "saltEncoding",
                "BASE64"
            );

            verifier.put(
                "verifierEncoding",
                "BASE64"
            );

            verifier.put(
                "salt",
                Base64.encodeToString(
                    salt,
                    Base64.NO_WRAP
                )
            );

            verifier.put(
                "verifier",
                Base64.encodeToString(
                    derived,
                    Base64.NO_WRAP
                )
            );

            verifier.put(
                "N",
                SCRYPT_N
            );

            verifier.put(
                "r",
                SCRYPT_R
            );

            verifier.put(
                "p",
                SCRYPT_P
            );

            verifier.put(
                "keyLength",
                VERIFIER_BYTES
            );

            return verifier;

        } finally {

            java.util.Arrays.fill(
                derived,
                (byte) 0
            );
        }
    }

    private static byte[] derive(
        String securityCode,
        byte[] salt
    ) {

        return SCrypt.generate(
            securityCode.getBytes(
                StandardCharsets.UTF_8
            ),
            salt,
            SCRYPT_N,
            SCRYPT_R,
            SCRYPT_P,
            VERIFIER_BYTES
        );
    }

    private JSONObject readBoundRecord(
        String issuerId
    ) throws Exception {

        requireText(
            issuerId,
            "issuerId"
        );

        JSONObject record =
            readRecord();

        if (record == null) {
            return null;
        }

        if (
            !issuerId.equals(
                record.getString(
                    "issuerId"
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code store does not belong to the current Control Center issuer."
            );
        }

        return record;
    }

    private JSONObject readRecord()
        throws Exception {

        if (
            !atomicFile
                .getBaseFile()
                .exists()
        ) {
            return null;
        }

        byte[] serialized;

        try (
            FileInputStream input =
                atomicFile.openRead()
        ) {

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[8192];

            int total =
                0;

            while (true) {

                int read =
                    input.read(
                        buffer
                    );

                if (read < 0) {
                    break;
                }

                total += read;

                if (
                    total >
                    MAX_FILE_BYTES
                ) {
                    throw new IllegalStateException(
                        "FINORA Developer Security Code encrypted store is too large."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            serialized =
                output.toByteArray();
        }

        JSONObject envelope =
            new JSONObject(
                new String(
                    serialized,
                    StandardCharsets.UTF_8
                )
            );

        byte[] iv =
            decodeCanonicalBase64(
                envelope.getString(
                    "iv"
                ),
                12
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                envelope.getString(
                    "ciphertext"
                ),
                -1
            );

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_ALGORITHM
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            getExistingSecretKey(),
            new GCMParameterSpec(
                GCM_TAG_BITS,
                iv
            )
        );

        cipher.updateAAD(
            AAD
        );

        final byte[] plaintext;

        try {

            plaintext =
                cipher.doFinal(
                    ciphertext
                );

        } catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Developer Security Code store authentication failed."
            );
        }

        JSONObject record =
            new JSONObject(
                new String(
                    plaintext,
                    StandardCharsets.UTF_8
                )
            );

        validateRecord(
            record
        );

        return record;
    }

    private void writeRecord(
        JSONObject record
    ) throws Exception {

        validateRecord(
            record
        );

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_ALGORITHM
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            getOrCreateSecretKey()
        );

        cipher.updateAAD(
            AAD
        );

        byte[] ciphertext =
            cipher.doFinal(
                record.toString()
                    .getBytes(
                        StandardCharsets.UTF_8
                    )
            );

        JSONObject envelope =
            new JSONObject();

        envelope.put(
            "schemaVersion",
            1
        );

        envelope.put(
            "algorithm",
            "ANDROID_KEYSTORE_AES_256_GCM"
        );

        envelope.put(
            "iv",
            Base64.encodeToString(
                cipher.getIV(),
                Base64.NO_WRAP
            )
        );

        envelope.put(
            "ciphertext",
            Base64.encodeToString(
                ciphertext,
                Base64.NO_WRAP
            )
        );

        FileOutputStream output =
            null;

        try {

            output =
                atomicFile.startWrite();

            output.write(
                envelope.toString()
                    .getBytes(
                        StandardCharsets.UTF_8
                    )
            );

            output.flush();

            atomicFile.finishWrite(
                output
            );

            output =
                null;

        } catch (Exception error) {

            if (output != null) {
                atomicFile.failWrite(
                    output
                );
            }

            throw error;
        }
    }

    private static void validateRecord(
        JSONObject record
    ) throws Exception {

        if (
            record.optInt(
                "schemaVersion",
                -1
            ) !=
                STORE_SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code store schema is invalid."
            );
        }

        requireText(
            record.getString(
                "issuerId"
            ),
            "issuerId"
        );

        requireText(
            record.getString(
                "createdAt"
            ),
            "createdAt"
        );

        requireText(
            record.getString(
                "updatedAt"
            ),
            "updatedAt"
        );

        JSONObject verifier =
            record.optJSONObject(
                "verifier"
            );

        if (verifier == null) {
            throw new IllegalStateException(
                "FINORA Developer Security Code verifier is missing."
            );
        }

        if (
            !"SCRYPT".equals(
                verifier.optString(
                    "algorithm",
                    ""
                )
            ) ||
            !"BASE64".equals(
                verifier.optString(
                    "saltEncoding",
                    ""
                )
            ) ||
            !"BASE64".equals(
                verifier.optString(
                    "verifierEncoding",
                    ""
                )
            ) ||
            verifier.optInt(
                "N",
                -1
            ) !=
                SCRYPT_N ||
            verifier.optInt(
                "r",
                -1
            ) !=
                SCRYPT_R ||
            verifier.optInt(
                "p",
                -1
            ) !=
                SCRYPT_P ||
            verifier.optInt(
                "keyLength",
                -1
            ) !=
                VERIFIER_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code verifier parameters are invalid."
            );
        }

        decodeCanonicalBase64(
            verifier.getString(
                "salt"
            ),
            SALT_BYTES
        );

        decodeCanonicalBase64(
            verifier.getString(
                "verifier"
            ),
            VERIFIER_BYTES
        );

        boolean hasAttempts =
            record.has(
                "failedAttempts"
            );

        boolean hasBlockedUntil =
            record.has(
                "blockedUntil"
            );

        if (
            hasAttempts !=
                hasBlockedUntil
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code throttle state is incomplete."
            );
        }

        if (hasAttempts) {

            if (
                record.getInt(
                    "failedAttempts"
                ) < 1
            ) {
                throw new IllegalStateException(
                    "FINORA Developer Security Code failed-attempt state is invalid."
                );
            }

            java.time.Instant.parse(
                record.getString(
                    "blockedUntil"
                )
            );
        }
    }

    private static void validateSecurityCode(
        String securityCode
    ) {

        if (securityCode == null) {
            throw new IllegalStateException(
                "FINORA Developer Security Code is invalid."
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
                "FINORA Developer Security Code must contain between 10 and 20 characters and cannot be whitespace-only."
            );
        }
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
                "FINORA Developer Security Code base64 field is invalid."
            );
        }

        byte[] decoded =
            Base64.decode(
                value,
                Base64.DEFAULT
            );

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
                "FINORA Developer Security Code base64 field is not canonical."
            );
        }

        return decoded;
    }

    private static SecretKey getOrCreateSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        keyStore.load(
            null
        );

        if (
            keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {
            return readSecretKey(
                keyStore
            );
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
            );

        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                    KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(
                    KeyProperties.BLOCK_MODE_GCM
                )
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setKeySize(
                    256
                )
                .setRandomizedEncryptionRequired(
                    true
                )
                .build()
        );

        generator.generateKey();

        keyStore.load(
            null
        );

        return readSecretKey(
            keyStore
        );
    }

    private static SecretKey getExistingSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        keyStore.load(
            null
        );

        if (
            !keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code AndroidKeyStore key is unavailable."
            );
        }

        return readSecretKey(
            keyStore
        );
    }

    private static SecretKey readSecretKey(
        KeyStore keyStore
    ) throws Exception {

        KeyStore.Entry entry =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );

        if (
            !(entry instanceof
                KeyStore.SecretKeyEntry)
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code AndroidKeyStore entry has an invalid type."
            );
        }

        return (
            (KeyStore.SecretKeyEntry) entry
        ).getSecretKey();
    }

    private static void requireText(
        String value,
        String field
    ) {

        if (
            value == null ||
            value.isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Developer Security Code store field is invalid: " +
                field
            );
        }
    }
}