package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL STORE
//
// RESPONSIBILITY:
//
// - Persist FINORA device-level control state privately
// - Encrypt the complete payload with Android Keystore
// - Use AES-256-GCM authenticated encryption
// - Use an app-private FINORA control file
// - Reject corrupt / invalid encrypted data
//
// IMPORTANT:
//
// - NATIVE ANDROID ONLY.
// - No WebView localStorage.
// - No SharedPreferences payload persistence.
// - No deprecated EncryptedSharedPreferences.
// - No plaintext fallback.
// - No customer / loan / collection / Gold data.
// - No pricing calculations.
// - No wallet calculations.
// - Missing file is different from corrupt file.
// - Corrupt encrypted data is NEVER silently reset.
//
// STORAGE:
//
// app-private files directory/
//   FINORA/
//     control/
//       finora-control.bin
//
// CRYPTO:
//
// Android Keystore
//   AES-256
//   GCM
//   NoPadding
//   128-bit authentication tag
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

// ============================================================
// CONTROL STORE
// ============================================================

public final class FinoraControlStore {

    // ========================================================
    // CONSTANTS
    // ========================================================

    private static final String ANDROID_KEYSTORE =
        "AndroidKeyStore";

    private static final String KEY_ALIAS =
        "FINORA_ENTERPRISE_CONTROL_STORE_KEY_V1";

    private static final String CIPHER_TRANSFORMATION =
        "AES/GCM/NoPadding";

    private static final String DIRECTORY_FINORA =
        "FINORA";

    private static final String DIRECTORY_CONTROL =
        "control";

    private static final String CONTROL_FILE_NAME =
        "finora-control.bin";

    private static final int KEY_SIZE_BITS =
        256;

    private static final int GCM_TAG_LENGTH_BITS =
        128;

    private static final int FILE_FORMAT_VERSION =
        1;

    private static final int MAGIC =
        0x46494E31; // "FIN1"

    private static final int MAX_IV_LENGTH =
        64;

    private static final byte[] AAD =
        "FINORA_ENTERPRISE_CONTROL_STORE_V1"
            .getBytes(StandardCharsets.UTF_8);

    // ========================================================
    // STATE
    // ========================================================

    private final AtomicFile controlFile;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraControlStore(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "Android context is required."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        File controlDirectory =
            new File(
                new File(
                    applicationContext.getFilesDir(),
                    DIRECTORY_FINORA
                ),
                DIRECTORY_CONTROL
            );

        if (
            !controlDirectory.exists() &&
            !controlDirectory.mkdirs()
        ) {
            throw new IllegalStateException(
                "Unable to create the FINORA Control Store directory."
            );
        }

        File storageFile =
            new File(
                controlDirectory,
                CONTROL_FILE_NAME
            );

        this.controlFile =
            new AtomicFile(storageFile);
    }

    // ========================================================
    // EXISTS
    // ========================================================

    /**
     * Returns true only when a FINORA encrypted control file
     * currently exists.
     */
    public synchronized boolean exists() {
        return controlFile
            .getBaseFile()
            .isFile();
    }

    // ========================================================
    // READ
    // ========================================================

    /**
     * Read and decrypt the FINORA control payload.
     *
     * Returns null only when no control file exists yet.
     *
     * Invalid, corrupt or undecryptable data throws instead of
     * silently creating a fresh store.
     */
    public synchronized String read()
        throws Exception {

        if (!exists()) {
            return null;
        }

        byte[] packageBytes =
            readEncryptedPackage();

        EncryptedPackage encryptedPackage =
            decodePackage(
                packageBytes
            );

        SecretKey key =
            getOrCreateSecretKey();

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_TRANSFORMATION
            );

        GCMParameterSpec parameterSpec =
            new GCMParameterSpec(
                GCM_TAG_LENGTH_BITS,
                encryptedPackage.iv
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            key,
            parameterSpec
        );

        cipher.updateAAD(
            AAD
        );

        byte[] plainBytes =
            cipher.doFinal(
                encryptedPackage.cipherText
            );

        return new String(
            plainBytes,
            StandardCharsets.UTF_8
        );
    }

    // ========================================================
    // WRITE
    // ========================================================

    /**
     * Encrypt and atomically persist the complete FINORA
     * control payload.
     *
     * Plaintext fallback is intentionally unsupported.
     */
    public synchronized void write(
        String plainText
    ) throws Exception {

        if (plainText == null) {
            throw new IllegalArgumentException(
                "FINORA control payload is required."
            );
        }

        SecretKey key =
            getOrCreateSecretKey();

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_TRANSFORMATION
            );

        /*
         * Do NOT provide a caller-defined IV during encryption.
         *
         * Android Keystore / Cipher generates a fresh random IV
         * for every encryption operation.
         */
        cipher.init(
            Cipher.ENCRYPT_MODE,
            key
        );

        cipher.updateAAD(
            AAD
        );

        byte[] cipherText =
            cipher.doFinal(
                plainText.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length == 0 ||
            iv.length > MAX_IV_LENGTH
        ) {
            throw new IllegalStateException(
                "FINORA Control Store received an invalid encryption IV."
            );
        }

        byte[] packageBytes =
            encodePackage(
                iv,
                cipherText
            );

        writeEncryptedPackage(
            packageBytes
        );
    }

    // ========================================================
    // KEYSTORE KEY
    // ========================================================

    private SecretKey getOrCreateSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                ANDROID_KEYSTORE
            );

        keyStore.load(
            null
        );

        if (
            keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {
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
                    "FINORA Control Store Keystore alias is not a secret key."
                );
            }

            return (
                (KeyStore.SecretKeyEntry) entry
            ).getSecretKey();
        }

        KeyGenerator keyGenerator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            );

        KeyGenParameterSpec specification =
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                    KeyProperties.PURPOSE_DECRYPT
            )
                .setKeySize(
                    KEY_SIZE_BITS
                )
                .setBlockModes(
                    KeyProperties.BLOCK_MODE_GCM
                )
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setRandomizedEncryptionRequired(
                    true
                )
                .build();

        keyGenerator.init(
            specification
        );

        return keyGenerator
            .generateKey();
    }

    // ========================================================
    // PACKAGE ENCODING
    // ========================================================

    private byte[] encodePackage(
        byte[] iv,
        byte[] cipherText
    ) throws Exception {

        ByteArrayOutputStream buffer =
            new ByteArrayOutputStream();

        try (
            DataOutputStream output =
                new DataOutputStream(
                    buffer
                )
        ) {
            output.writeInt(
                MAGIC
            );

            output.writeInt(
                FILE_FORMAT_VERSION
            );

            output.writeInt(
                iv.length
            );

            output.write(
                iv
            );

            output.writeInt(
                cipherText.length
            );

            output.write(
                cipherText
            );

            output.flush();
        }

        return buffer
            .toByteArray();
    }

    // ========================================================
    // PACKAGE DECODING
    // ========================================================

    private EncryptedPackage decodePackage(
        byte[] packageBytes
    ) throws Exception {

        if (
            packageBytes == null ||
            packageBytes.length == 0
        ) {
            throw new IllegalStateException(
                "FINORA Control Store file is empty."
            );
        }

        try (
            DataInputStream input =
                new DataInputStream(
                    new ByteArrayInputStream(
                        packageBytes
                    )
                )
        ) {
            int magic =
                input.readInt();

            if (magic != MAGIC) {
                throw new IllegalStateException(
                    "Invalid FINORA Control Store file signature."
                );
            }

            int version =
                input.readInt();

            if (
                version !=
                FILE_FORMAT_VERSION
            ) {
                throw new IllegalStateException(
                    "Unsupported FINORA Control Store file version."
                );
            }

            int ivLength =
                input.readInt();

            if (
                ivLength <= 0 ||
                ivLength > MAX_IV_LENGTH
            ) {
                throw new IllegalStateException(
                    "Invalid FINORA Control Store IV length."
                );
            }

            byte[] iv =
                new byte[
                    ivLength
                ];

            input.readFully(
                iv
            );

            int cipherTextLength =
                input.readInt();

            if (
                cipherTextLength <= 0 ||
                cipherTextLength >
                    packageBytes.length
            ) {
                throw new IllegalStateException(
                    "Invalid FINORA Control Store ciphertext length."
                );
            }

            byte[] cipherText =
                new byte[
                    cipherTextLength
                ];

            input.readFully(
                cipherText
            );

            if (
                input.available() != 0
            ) {
                throw new IllegalStateException(
                    "FINORA Control Store contains unexpected trailing data."
                );
            }

            return new EncryptedPackage(
                iv,
                cipherText
            );
        }
    }

    // ========================================================
    // ATOMIC FILE READ
    // ========================================================

    private byte[] readEncryptedPackage()
        throws Exception {

        try (
            FileInputStream input =
                controlFile.openRead();

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {
            byte[] buffer =
                new byte[
                    8192
                ];

            int read;

            while (
                (read = input.read(buffer)) != -1
            ) {
                output.write(
                    buffer,
                    0,
                    read
                );
            }

            return output
                .toByteArray();
        }
    }

    // ========================================================
    // ATOMIC FILE WRITE
    // ========================================================

    private void writeEncryptedPackage(
        byte[] packageBytes
    ) throws Exception {

        FileOutputStream output =
            null;

        try {
            output =
                controlFile.startWrite();

            output.write(
                packageBytes
            );

            output.flush();

            controlFile.finishWrite(
                output
            );

            output =
                null;
        } catch (Exception error) {

            if (output != null) {
                controlFile.failWrite(
                    output
                );
            }

            throw error;
        }
    }

    // ========================================================
    // ENCRYPTED PACKAGE
    // ========================================================

    private static final class EncryptedPackage {

        private final byte[] iv;

        private final byte[] cipherText;

        private EncryptedPackage(
            byte[] iv,
            byte[] cipherText
        ) {
            this.iv =
                iv;

            this.cipherText =
                cipherText;
        }
    }

    // ========================================================
    // END
    // ========================================================
}
