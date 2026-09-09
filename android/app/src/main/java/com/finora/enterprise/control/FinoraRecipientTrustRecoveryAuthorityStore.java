package com.finora.enterprise.control;

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
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST RECOVERY AUTHORITY STORE

   MODULE  : Control
   LAYER   : Native Recovery Public-Root Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist the independently provisioned recipient Recovery
     Authority PUBLIC root
   - Encrypt persisted state with AndroidKeyStore AES/GCM
   - Replace state through Android AtomicFile
   - Provide existence / read / write persistence operations

   SECURITY:

   - PUBLIC recovery authority only.
   - No Recovery Authority private key.
   - No signing.
   - No package verification.
   - No recipient operational trust mutation.
   - No bootstrap decision.
   - No trust-on-first-use.
   - No renderer / Capacitor API.
   - Separate encryption key from operational recipient trust.
   - Separate file from operational recipient trust.
   - Same-user / OS compromise resistance beyond AndroidKeyStore
     guarantees is not claimed.

   PERSISTENCE:

   - File:
       finora-recipient-trust-recovery-authority.bin
   - AndroidKeyStore AES key:
       finora_recipient_trust_recovery_authority_aes_v1
   - Envelope:
       magic FRA1
       version 1
       IV
       AES/GCM ciphertext
============================================================ */

public final class FinoraRecipientTrustRecoveryAuthorityStore {

    // ========================================================
    // STORAGE CONSTANTS
    // ========================================================

    private static final String FILE_NAME =
        "finora-recipient-trust-recovery-authority.bin";

    private static final String KEY_ALIAS =
        "finora_recipient_trust_recovery_authority_aes_v1";

    private static final String KEYSTORE_PROVIDER =
        "AndroidKeyStore";

    private static final String CIPHER_TRANSFORMATION =
        "AES/GCM/NoPadding";

    private static final int MAGIC =
        0x46524131; // FRA1

    private static final int ENVELOPE_VERSION =
        1;

    private static final int IV_BYTES =
        12;

    private static final int GCM_TAG_BITS =
        128;

    private static final int MAX_PLAINTEXT_BYTES =
        64 * 1024;

    private static final int MAX_CIPHERTEXT_BYTES =
        MAX_PLAINTEXT_BYTES +
        64;

    // ========================================================
    // STATE
    // ========================================================

    private final AtomicFile atomicFile;

    private final SecureRandom secureRandom;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraRecipientTrustRecoveryAuthorityStore(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority store requires Android context."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        Context authorityContext =
            applicationContext != null
                ? applicationContext
                : context;

        File file =
            new File(
                authorityContext.getFilesDir(),
                FILE_NAME
            );

        this.atomicFile =
            new AtomicFile(
                file
            );

        this.secureRandom =
            new SecureRandom();
    }

    // ========================================================
    // EXISTS
    // ========================================================

    public synchronized boolean exists() {

        return atomicFile
            .getBaseFile()
            .isFile();
    }

    // ========================================================
    // READ
    //
    // null = not provisioned.
    // Any existing but malformed / undecryptable store fails
    // closed with an exception.
    // ========================================================

    public synchronized String read()
        throws Exception {

        if (!exists()) {
            return null;
        }

        byte[] envelope =
            readEnvelopeBytes();

        if (
            envelope.length ==
                0
        ) {
            throw new IllegalStateException(
                "FINORA recipient recovery-authority store is empty."
            );
        }

        return decryptEnvelope(
            envelope
        );
    }

    // ========================================================
    // WRITE
    // ========================================================

    public synchronized void write(
        String serializedState
    ) throws Exception {

        if (
            serializedState == null ||
            serializedState.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority state must not be empty."
            );
        }

        byte[] plaintext =
            serializedState.getBytes(
                StandardCharsets.UTF_8
            );

        if (
            plaintext.length >
                MAX_PLAINTEXT_BYTES
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority state exceeds the supported size limit."
            );
        }

        byte[] envelope =
            encryptEnvelope(
                plaintext
            );

        writeEnvelopeBytes(
            envelope
        );
    }

    // ========================================================
    // READ ENVELOPE
    // ========================================================

    private byte[] readEnvelopeBytes()
        throws Exception {

        try (
            FileInputStream input =
                atomicFile.openRead();

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {
            byte[] buffer =
                new byte[
                    4096
                ];

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

                if (read == 0) {
                    continue;
                }

                total +=
                    read;

                if (
                    total >
                        MAX_CIPHERTEXT_BYTES +
                        128
                ) {
                    throw new IllegalStateException(
                        "FINORA recipient recovery-authority encrypted store exceeds the supported size limit."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            return output.toByteArray();
        }
    }

    // ========================================================
    // ATOMIC WRITE
    // ========================================================

    private void writeEnvelopeBytes(
        byte[] envelope
    ) throws Exception {

        FileOutputStream output =
            null;

        try {
            output =
                atomicFile.startWrite();

            output.write(
                envelope
            );

            output.flush();

            atomicFile.finishWrite(
                output
            );

            output =
                null;
        } catch (
            Exception error
        ) {
            if (output != null) {
                atomicFile.failWrite(
                    output
                );
            }

            throw error;
        }
    }

    // ========================================================
    // ENCRYPT
    // ========================================================

    private byte[] encryptEnvelope(
        byte[] plaintext
    ) throws Exception {

        SecretKey key =
            getOrCreateKey();

        byte[] iv =
            new byte[
                IV_BYTES
            ];

        secureRandom.nextBytes(
            iv
        );

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_TRANSFORMATION
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            key,
            new GCMParameterSpec(
                GCM_TAG_BITS,
                iv
            )
        );

        byte[] ciphertext =
            cipher.doFinal(
                plaintext
            );

        if (
            ciphertext.length >
                MAX_CIPHERTEXT_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA recipient recovery-authority encrypted state exceeds the supported size limit."
            );
        }

        ByteArrayOutputStream bytes =
            new ByteArrayOutputStream();

        try (
            DataOutputStream output =
                new DataOutputStream(
                    bytes
                )
        ) {
            output.writeInt(
                MAGIC
            );

            output.writeInt(
                ENVELOPE_VERSION
            );

            output.writeInt(
                iv.length
            );

            output.write(
                iv
            );

            output.writeInt(
                ciphertext.length
            );

            output.write(
                ciphertext
            );

            output.flush();
        }

        return bytes.toByteArray();
    }

    // ========================================================
    // DECRYPT
    // ========================================================

    private String decryptEnvelope(
        byte[] envelope
    ) throws Exception {

        try (
            DataInputStream input =
                new DataInputStream(
                    new ByteArrayInputStream(
                        envelope
                    )
                )
        ) {
            int magic =
                input.readInt();

            if (magic != MAGIC) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority store magic is invalid."
                );
            }

            int version =
                input.readInt();

            if (
                version !=
                    ENVELOPE_VERSION
            ) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority store version is unsupported."
                );
            }

            int ivLength =
                input.readInt();

            if (
                ivLength !=
                    IV_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority store IV length is invalid."
                );
            }

            byte[] iv =
                new byte[
                    ivLength
                ];

            input.readFully(
                iv
            );

            int ciphertextLength =
                input.readInt();

            if (
                ciphertextLength <=
                    0 ||
                ciphertextLength >
                    MAX_CIPHERTEXT_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority ciphertext length is invalid."
                );
            }

            byte[] ciphertext =
                new byte[
                    ciphertextLength
                ];

            input.readFully(
                ciphertext
            );

            if (
                input.read() !=
                    -1
            ) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority store contains trailing bytes."
                );
            }

            SecretKey key =
                getExistingKey();

            if (key == null) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority encryption key is unavailable."
                );
            }

            Cipher cipher =
                Cipher.getInstance(
                    CIPHER_TRANSFORMATION
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                key,
                new GCMParameterSpec(
                    GCM_TAG_BITS,
                    iv
                )
            );

            byte[] plaintext =
                cipher.doFinal(
                    ciphertext
                );

            if (
                plaintext.length ==
                    0 ||
                plaintext.length >
                    MAX_PLAINTEXT_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA recipient recovery-authority plaintext size is invalid."
                );
            }

            return new String(
                plaintext,
                StandardCharsets.UTF_8
            );
        }
    }

    // ========================================================
    // KEY
    // ========================================================

    private static SecretKey getOrCreateKey()
        throws Exception {

        SecretKey existing =
            getExistingKey();

        if (existing != null) {
            return existing;
        }

        KeyGenerator keyGenerator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
            );

        keyGenerator.init(
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
                .build()
        );

        return keyGenerator.generateKey();
    }

    private static SecretKey getExistingKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        keyStore.load(
            null
        );

        KeyStore.Entry entry =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );

        if (
            entry ==
                null
        ) {
            return null;
        }

        if (
            !(entry instanceof
                KeyStore.SecretKeyEntry)
        ) {
            throw new IllegalStateException(
                "FINORA recipient recovery-authority AndroidKeyStore entry has an invalid type."
            );
        }

        return (
            (
                KeyStore.SecretKeyEntry
            ) entry
        ).getSecretKey();
    }
}

/* ============================================================
   END
============================================================ */