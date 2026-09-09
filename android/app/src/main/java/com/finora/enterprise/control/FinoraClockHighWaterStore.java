package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT CLOCK HIGH-WATER STORE

   MODULE  : Control
   LAYER   : Native Recipient Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist installation-local recipient wall-clock high-water
   - Bind persisted state to one exact installationId
   - Protect the complete record with AndroidKeyStore AES-GCM
   - Replace encrypted state through Android AtomicFile
   - Validate a strict versioned persistence schema
   - Fail closed on malformed or undecryptable persisted state

   STATE:

   {
     schemaVersion: 1,
     installationId: string,
     highWaterAt: canonical ISO timestamp
   }

   IMPORTANT:

   - This class does not read the current wall clock.
   - This class does not decide whether rollback occurred.
   - This class does not resolve installation identity.
   - This class does not depend on issuerId or signingKeyId.
   - This class exposes no renderer / Capacitor API.
   - This class stores no private signing material.
============================================================ */

public final class FinoraClockHighWaterStore {

    // ========================================================
    // CONSTANTS
    // ========================================================

    public static final int SCHEMA_VERSION =
        1;

    private static final String FILE_NAME =
        "finora-clock-high-water.bin";

    private static final String KEY_ALIAS =
        "finora_clock_high_water_aes_v1";

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
            (byte) 'C',
            (byte) 'H',
            (byte) '1'
        };

    private static final int MIN_GCM_IV_BYTES =
        12;

    private static final int MAX_GCM_IV_BYTES =
        16;

    private static final int MAX_PLAINTEXT_BYTES =
        64 * 1024;

    private static final int MAX_ENCRYPTED_BYTES =
        MAX_PLAINTEXT_BYTES + 4096;

    private static final Pattern CANONICAL_ISO_MILLIS =
        Pattern.compile(
            "^\\d{4}-\\d{2}-\\d{2}T" +
            "\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"
        );

    private static final DateTimeFormatter ISO_MILLIS_FORMATTER =
        DateTimeFormatter
            .ofPattern(
                "uuuu-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.ROOT
            )
            .withZone(
                ZoneOffset.UTC
            );

    // ========================================================
    // STATE
    // ========================================================

    public static final class State {

        public final int schemaVersion;

        public final String installationId;

        public final String highWaterAt;

        public State(
            int schemaVersion,
            String installationId,
            String highWaterAt
        ) {
            this.schemaVersion =
                schemaVersion;

            this.installationId =
                installationId;

            this.highWaterAt =
                highWaterAt;
        }
    }

    private final AtomicFile atomicFile;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraClockHighWaterStore(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA clock high-water store requires Android context."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        Context storageContext =
            applicationContext != null
                ? applicationContext
                : context;

        this.atomicFile =
            new AtomicFile(
                new File(
                    storageContext.getFilesDir(),
                    FILE_NAME
                )
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

    public synchronized State read()
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
            encryptedEnvelope.length ==
                0
        ) {
            throw new IllegalStateException(
                "FINORA clock high-water store is empty."
            );
        }

        byte[] plaintext =
            decryptEnvelope(
                encryptedEnvelope
            );

        if (
            plaintext.length ==
                0 ||
            plaintext.length >
                MAX_PLAINTEXT_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA clock high-water decrypted payload size is invalid."
            );
        }

        return parse(
            new String(
                plaintext,
                StandardCharsets.UTF_8
            )
        );
    }

    // ========================================================
    // WRITE
    // ========================================================

    public synchronized void write(
        State state
    ) throws Exception {

        validate(
            state
        );

        byte[] plaintext =
            serialize(
                state
            ).getBytes(
                StandardCharsets.UTF_8
            );

        if (
            plaintext.length ==
                0 ||
            plaintext.length >
                MAX_PLAINTEXT_BYTES
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water state size is invalid."
            );
        }

        byte[] encryptedEnvelope =
            encryptEnvelope(
                plaintext
            );

        if (
            encryptedEnvelope.length ==
                0 ||
            encryptedEnvelope.length >
                MAX_ENCRYPTED_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA encrypted clock high-water payload size is invalid."
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
    // STATE VALIDATION
    // ========================================================

    public static void validate(
        State state
    ) {

        if (state == null) {
            throw new IllegalArgumentException(
                "FINORA clock high-water state is required."
            );
        }

        if (
            state.schemaVersion !=
                SCHEMA_VERSION
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water schemaVersion is unsupported."
            );
        }

        requireNonEmpty(
            state.installationId,
            "FINORA clock high-water installationId is invalid."
        );

        requireCanonicalTimestamp(
            state.highWaterAt,
            "FINORA clock high-water timestamp is invalid."
        );
    }

    // ========================================================
    // PARSE
    // ========================================================

    private static State parse(
        String serialized
    ) {

        if (
            serialized == null ||
            serialized.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water serialized state is invalid."
            );
        }

        JSONObject root;

        try {
            root =
                new JSONObject(
                    serialized
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water store contains invalid JSON.",
                error
            );
        }

        requireOnlyKeys(
            root,
            "schemaVersion",
            "installationId",
            "highWaterAt"
        );

        Object rawSchema;

        try {
            rawSchema =
                root.get(
                    "schemaVersion"
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water schemaVersion is missing.",
                error
            );
        }

        if (
            !(rawSchema instanceof
                Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water schemaVersion is invalid."
            );
        }

        BigDecimal schemaNumber;

        try {
            schemaNumber =
                new BigDecimal(
                    rawSchema.toString()
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water schemaVersion is invalid.",
                error
            );
        }

        if (
            schemaNumber.compareTo(
                BigDecimal.ONE
            ) !=
                0
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water schemaVersion is unsupported."
            );
        }

        String installationId =
            requireString(
                root,
                "installationId"
            );

        String highWaterAt =
            requireString(
                root,
                "highWaterAt"
            );

        State state =
            new State(
                SCHEMA_VERSION,
                installationId,
                highWaterAt
            );

        validate(
            state
        );

        return state;
    }

    // ========================================================
    // SERIALIZE
    // ========================================================

    private static String serialize(
        State state
    ) throws Exception {

        JSONObject root =
            new JSONObject();

        root.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        root.put(
            "installationId",
            state.installationId
        );

        root.put(
            "highWaterAt",
            state.highWaterAt
        );

        return root.toString();
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
                "FINORA clock high-water encryption produced an invalid IV."
            );
        }

        byte[] ciphertext =
            cipher.doFinal(
                plaintext
            );

        if (
            ciphertext == null ||
            ciphertext.length ==
                0
        ) {
            throw new IllegalStateException(
                "FINORA clock high-water encryption produced an empty payload."
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
                "FINORA clock high-water encrypted envelope is invalid."
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
                envelope.get() !=
                    expected
            ) {
                throw new IllegalStateException(
                    "FINORA clock high-water encrypted envelope magic is invalid."
                );
            }
        }

        if (!envelope.hasRemaining()) {
            throw new IllegalStateException(
                "FINORA clock high-water encrypted envelope version is missing."
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
                "FINORA clock high-water encrypted envelope version is unsupported."
            );
        }

        if (!envelope.hasRemaining()) {
            throw new IllegalStateException(
                "FINORA clock high-water encrypted envelope IV length is missing."
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
                "FINORA clock high-water encrypted envelope IV is invalid."
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

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_TRANSFORMATION
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateSecretKey(),
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
    // ANDROID KEYSTORE
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
                "FINORA clock high-water AndroidKeyStore alias has an unexpected key type."
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
    // JSON HELPERS
    // ========================================================

    private static void requireOnlyKeys(
        JSONObject value,
        String... allowedKeys
    ) {

        Set<String> allowed =
            new HashSet<>(
                Arrays.asList(
                    allowedKeys
                )
            );

        Iterator<String> keys =
            value.keys();

        while (
            keys.hasNext()
        ) {
            String key =
                keys.next();

            if (
                !allowed.contains(
                    key
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA clock high-water state contains an unexpected property: " +
                    key
                );
            }
        }
    }

    private static String requireString(
        JSONObject value,
        String key
    ) {

        if (
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water property is missing: " +
                key
            );
        }

        Object raw;

        try {
            raw =
                value.get(
                    key
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                "FINORA clock high-water property " +
                key +
                " must be a string."
            );
        }

        return (String) raw;
    }

    // ========================================================
    // TIMESTAMP
    // ========================================================

    private static Instant requireCanonicalTimestamp(
        String value,
        String errorMessage
    ) {

        requireNonEmpty(
            value,
            errorMessage
        );

        if (
            !CANONICAL_ISO_MILLIS
                .matcher(
                    value
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }

        try {
            Instant parsed =
                Instant.parse(
                    value
                );

            String canonical =
                ISO_MILLIS_FORMATTER.format(
                    parsed
                );

            if (
                !canonical.equals(
                    value
                )
            ) {
                throw new IllegalArgumentException(
                    errorMessage
                );
            }

            return parsed;
        } catch (
            IllegalArgumentException error
        ) {
            throw error;
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                errorMessage,
                error
            );
        }
    }

    private static void requireNonEmpty(
        String value,
        String errorMessage
    ) {
        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }
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
                    "FINORA clock high-water store exceeds its maximum encrypted size."
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