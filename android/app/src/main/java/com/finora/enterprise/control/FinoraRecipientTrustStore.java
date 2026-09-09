package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST STORE

   MODULE  : Control
   LAYER   : Native Recipient Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist recipient operational trust state on Android
   - Encrypt the complete persisted payload with AndroidKeyStore
   - Use AES-GCM authenticated encryption
   - Replace persisted ciphertext through Android AtomicFile
   - Bound plaintext and encrypted payload sizes
   - Fail closed on malformed, truncated or undecryptable state

   IMPORTANT:

   - This class does not decide trust policy.
   - This class does not bootstrap a trusted signing key.
   - This class does not implement trust-on-first-use.
   - This class does not decide ACTIVE / RETIRED / REVOKED state.
   - This class does not verify signed control packages.
   - This class does not mutate trust transitions or recovery state.
   - This class does not read the wall clock.
   - This class exposes no Capacitor / renderer API.
   - This class stores no private signing key.

   SECURITY LIMITS:

   - AndroidKeyStore protects the encryption key at rest.
   - AtomicFile provides replacement semantics for the ciphertext.
   - This store alone cannot detect replacement with an older
     otherwise-valid encrypted recipient-trust file.
   - Clock rollback and monotonic trust-transition / recovery
     policy belong to higher authoritative services.
============================================================ */

public final class FinoraRecipientTrustStore {

    // ========================================================
    // CONSTANTS
    // ========================================================

    private static final String FILE_NAME =
        "finora-recipient-trust.bin";

    private static final String KEY_ALIAS =
        "finora_recipient_trust_aes_v1";

    private static final String ANDROID_KEY_STORE =
        "AndroidKeyStore";

    private static final String CIPHER_TRANSFORMATION =
        "AES/GCM/NoPadding";

    private static final int KEY_SIZE_BITS =
        256;

    private static final int GCM_TAG_BITS =
        128;

    private static final int ENVELOPE_VERSION =
        1;

    private static final byte[] ENVELOPE_MAGIC =
        new byte[] {
            (byte) 'F',
            (byte) 'R',
            (byte) 'T',
            (byte) '1'
        };

    private static final int MAX_PLAINTEXT_BYTES =
        4 * 1024 * 1024;

    private static final int MAX_ENCRYPTED_BYTES =
        MAX_PLAINTEXT_BYTES + 4096;

    private static final int MIN_GCM_IV_BYTES =
        12;

    private static final int MAX_GCM_IV_BYTES =
        16;

    // ========================================================
    // STATE
    // ========================================================

    private final AtomicFile atomicFile;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraRecipientTrustStore(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust store requires Android context."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        Context storageContext =
            applicationContext != null
                ? applicationContext
                : context;

        File storeFile =
            new File(
                storageContext.getFilesDir(),
                FILE_NAME
            );

        this.atomicFile =
            new AtomicFile(
                storeFile
            );
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
    // ========================================================

    public synchronized String read()
        throws Exception {

        if (!exists()) {
            return null;
        }

        byte[] encryptedEnvelope;

        try (
            FileInputStream input =
                atomicFile.openRead()
        ) {
            encryptedEnvelope =
                readBounded(
                    input,
                    MAX_ENCRYPTED_BYTES
                );
        }

        if (
            encryptedEnvelope.length == 0
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust store is empty."
            );
        }

        byte[] plaintext =
            decryptEnvelope(
                encryptedEnvelope
            );

        if (
            plaintext.length == 0 ||
            plaintext.length >
                MAX_PLAINTEXT_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust store decrypted payload size is invalid."
            );
        }

        return new String(
            plaintext,
            StandardCharsets.UTF_8
        );
    }

    // ========================================================
    // WRITE
    // ========================================================

    public synchronized void write(
        String plainText
    ) throws Exception {

        if (plainText == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust state is required."
            );
        }

        byte[] plaintext =
            plainText.getBytes(
                StandardCharsets.UTF_8
            );

        if (
            plaintext.length == 0 ||
            plaintext.length >
                MAX_PLAINTEXT_BYTES
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust state size is invalid."
            );
        }

        byte[] encryptedEnvelope =
            encryptEnvelope(
                plaintext
            );

        if (
            encryptedEnvelope.length == 0 ||
            encryptedEnvelope.length >
                MAX_ENCRYPTED_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA encrypted recipient trust payload size is invalid."
            );
        }

        FileOutputStream output =
            null;

        try {
            output =
                atomicFile.startWrite();

            output.write(
                encryptedEnvelope
            );

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

    // ========================================================
    // ENCRYPT
    // ========================================================

    private byte[] encryptEnvelope(
        byte[] plaintext
    ) throws Exception {

        SecretKey secretKey =
            getOrCreateSecretKey();

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_TRANSFORMATION
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            secretKey
        );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length <
                MIN_GCM_IV_BYTES ||
            iv.length >
                MAX_GCM_IV_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust encryption produced an invalid IV."
            );
        }

        byte[] ciphertext =
            cipher.doFinal(
                plaintext
            );

        if (
            ciphertext == null ||
            ciphertext.length == 0
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust encryption produced an empty payload."
            );
        }

        ByteBuffer envelope =
            ByteBuffer.allocate(
                ENVELOPE_MAGIC.length +
                1 +
                1 +
                iv.length +
                ciphertext.length
            );

        envelope.put(
            ENVELOPE_MAGIC
        );

        envelope.put(
            (byte) ENVELOPE_VERSION
        );

        envelope.put(
            (byte) iv.length
        );

        envelope.put(
            iv
        );

        envelope.put(
            ciphertext
        );

        return envelope.array();
    }

    // ========================================================
    // DECRYPT
    // ========================================================

    private byte[] decryptEnvelope(
        byte[] envelopeBytes
    ) throws Exception {

        if (
            envelopeBytes == null ||
            envelopeBytes.length <
                ENVELOPE_MAGIC.length +
                1 +
                1 +
                MIN_GCM_IV_BYTES +
                16
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust encrypted envelope is invalid."
            );
        }

        ByteBuffer envelope =
            ByteBuffer.wrap(
                envelopeBytes
            );

        for (
            byte expected :
            ENVELOPE_MAGIC
        ) {
            if (
                !envelope.hasRemaining() ||
                envelope.get() != expected
            ) {
                throw new IllegalStateException(
                    "FINORA recipient trust encrypted envelope magic is invalid."
                );
            }
        }

        if (!envelope.hasRemaining()) {
            throw new IllegalStateException(
                "FINORA recipient trust encrypted envelope version is missing."
            );
        }

        int version =
            envelope.get() &
            0xff;

        if (
            version !=
                ENVELOPE_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust encrypted envelope version is unsupported."
            );
        }

        if (!envelope.hasRemaining()) {
            throw new IllegalStateException(
                "FINORA recipient trust encrypted envelope IV length is missing."
            );
        }

        int ivLength =
            envelope.get() &
            0xff;

        if (
            ivLength <
                MIN_GCM_IV_BYTES ||
            ivLength >
                MAX_GCM_IV_BYTES ||
            envelope.remaining() <=
                ivLength + 16
        ) {
            throw new IllegalStateException(
                "FINORA recipient trust encrypted envelope IV is invalid."
            );
        }

        byte[] iv =
            new byte[
                ivLength
            ];

        envelope.get(
            iv
        );

        byte[] ciphertext =
            new byte[
                envelope.remaining()
            ];

        envelope.get(
            ciphertext
        );

        SecretKey secretKey =
            getOrCreateSecretKey();

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_TRANSFORMATION
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            secretKey,
            new GCMParameterSpec(
                GCM_TAG_BITS,
                iv
            )
        );

        return cipher.doFinal(
            ciphertext
        );
    }

    // ========================================================
    // KEY AUTHORITY
    // ========================================================

    private SecretKey getOrCreateSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                ANDROID_KEY_STORE
            );

        keyStore.load(
            null
        );

        KeyStore.Entry existingEntry =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );

        if (
            existingEntry instanceof
                KeyStore.SecretKeyEntry
        ) {
            return (
                (
                    KeyStore.SecretKeyEntry
                ) existingEntry
            ).getSecretKey();
        }

        if (existingEntry != null) {
            throw new IllegalStateException(
                "FINORA recipient trust AndroidKeyStore alias has an unexpected key type."
            );
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEY_STORE
            );

        KeyGenParameterSpec specification =
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
                    KEY_SIZE_BITS
                )
                .build();

        generator.init(
            specification
        );

        return generator.generateKey();
    }

    // ========================================================
    // BOUNDED READ
    // ========================================================

    private static byte[] readBounded(
        FileInputStream input,
        int maximumBytes
    ) throws Exception {

        ByteArrayOutputStream output =
            new ByteArrayOutputStream();

        byte[] buffer =
            new byte[
                8192
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
                    maximumBytes
            ) {
                throw new IllegalStateException(
                    "FINORA recipient trust store exceeds its maximum encrypted size."
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

/* ============================================================
   END
============================================================ */