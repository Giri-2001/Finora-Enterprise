package com.finora.enterprise.control;

import android.content.Context;
import android.util.AtomicFile;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
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

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * VERIFIED PORTABLE STATE LOCAL STORE
 *
 * - AndroidKeyStore AES-256-GCM
 * - AtomicFile persistence
 * - exact signed envelope persistence
 * - stale / conflicting generation rejection
 */
public final class FinoraDeveloperPortableStateStore {

    private static final String KEY_ALIAS =
        "FINORA_DEVELOPER_PORTABLE_STATE_V1";

    private static final String FILE_NAME =
        "finora-developer-portable-state.bin";

    private static final String STORE_FORMAT =
        "FINORA_DEVELOPER_PORTABLE_STATE_STORE_V1";

    private static final int STORE_SCHEMA_VERSION =
        1;

    private final AtomicFile atomicFile;

    public FinoraDeveloperPortableStateStore(
        Context context
    ) {

        File file =
            new File(
                context.getFilesDir(),
                FILE_NAME
            );

        atomicFile =
            new AtomicFile(
                file
            );
    }

    public synchronized JSONObject read()
        throws Exception {

        if (
            !atomicFile.getBaseFile().exists()
        ) {
            return null;
        }

        byte[] serialized =
            readAll();

        try {

            JSONObject wrapper =
                new JSONObject(
                    new String(
                        serialized,
                        StandardCharsets.UTF_8
                    )
                );

            if (
                !STORE_FORMAT.equals(
                    wrapper.optString(
                        "format",
                        ""
                    )
                ) ||
                wrapper.optInt(
                    "schemaVersion",
                    -1
                ) != STORE_SCHEMA_VERSION
            ) {
                throw new IllegalStateException(
                    "FINORA Developer Portable State store format is invalid."
                );
            }

            byte[] iv =
                Base64.decode(
                    wrapper.getString(
                        "iv"
                    ),
                    Base64.NO_WRAP
                );

            byte[] encrypted =
                Base64.decode(
                    wrapper.getString(
                        "ciphertext"
                    ),
                    Base64.NO_WRAP
                );

            Cipher cipher =
                Cipher.getInstance(
                    "AES/GCM/NoPadding"
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                new GCMParameterSpec(
                    128,
                    iv
                )
            );

            byte[] plaintext =
                cipher.doFinal(
                    encrypted
                );

            try {

                return new JSONObject(
                    new String(
                        plaintext,
                        StandardCharsets.UTF_8
                    )
                );

            } finally {

                java.util.Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }

        } finally {

            java.util.Arrays.fill(
                serialized,
                (byte) 0
            );
        }
    }

    public synchronized String adoptVerifiedEnvelope(
        JSONObject envelope
    ) throws Exception {

        JSONObject payload =
            envelope.getJSONObject(
                "payload"
            );

        long incomingGeneration =
            payload.getLong(
                "stateGeneration"
            );

        String incomingSha256 =
            envelope.getString(
                "payloadSha256"
            );

        Object parentValue =
            payload.opt(
                "parentPayloadSha256"
            );

        String incomingParent =
            (
                parentValue == null ||
                parentValue == JSONObject.NULL
            )
                ? null
                : String.valueOf(
                    parentValue
                );

        JSONObject existing =
            read();

        if (existing != null) {

            JSONObject existingPayload =
                existing.getJSONObject(
                    "payload"
                );

            long existingGeneration =
                existingPayload.getLong(
                    "stateGeneration"
                );

            String existingSha256 =
                existing.getString(
                    "payloadSha256"
                );

            if (
                incomingGeneration ==
                existingGeneration
            ) {

                if (
                    incomingSha256.equals(
                        existingSha256
                    )
                ) {
                    return "ALREADY_ADOPTED";
                }

                throw new IllegalStateException(
                    "FINORA Portable State generation conflict detected."
                );
            }

            if (
                incomingGeneration <
                existingGeneration
            ) {
                throw new IllegalStateException(
                    "FINORA Portable State is stale."
                );
            }

            if (
                incomingParent == null ||
                !incomingParent.equals(
                    existingSha256
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Portable State lineage parent mismatch."
                );
            }
        }

        write(
            envelope
        );

        return "ADOPTED";
    }

    private void write(
        JSONObject envelope
    ) throws Exception {

        byte[] plaintext =
            envelope
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        Cipher cipher =
            Cipher.getInstance(
                "AES/GCM/NoPadding"
            );

        /*
         * FINORA_KEYSTORE_GENERATED_GCM_IV
         *
         * AndroidKeyStore-backed AES-GCM encryption must generate
         * its own fresh random IV. Caller-provided IVs are rejected
         * by secure AndroidKeyStore implementations.
         *
         * The generated IV is persisted beside ciphertext and is
         * supplied only during DECRYPT_MODE.
         */
        cipher.init(
            Cipher.ENCRYPT_MODE,
            getOrCreateKey()
        );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length != 12
        ) {
            throw new IllegalStateException(
                "FINORA Developer Portable State AndroidKeyStore generated an invalid AES-GCM IV."
            );
        }

        byte[] encrypted =
            cipher.doFinal(
                plaintext
            );

        try {

            JSONObject wrapper =
                new JSONObject();

            wrapper.put(
                "format",
                STORE_FORMAT
            );

            wrapper.put(
                "schemaVersion",
                STORE_SCHEMA_VERSION
            );

            wrapper.put(
                "iv",
                Base64.encodeToString(
                    iv,
                    Base64.NO_WRAP
                )
            );

            wrapper.put(
                "ciphertext",
                Base64.encodeToString(
                    encrypted,
                    Base64.NO_WRAP
                )
            );

            byte[] output =
                wrapper
                    .toString()
                    .getBytes(
                        StandardCharsets.UTF_8
                    );

            FileOutputStream stream =
                null;

            try {

                stream =
                    atomicFile.startWrite();

                stream.write(
                    output
                );

                stream.flush();

                atomicFile.finishWrite(
                    stream
                );

                stream =
                    null;

            } finally {

                if (stream != null) {
                    atomicFile.failWrite(
                        stream
                    );
                }

                java.util.Arrays.fill(
                    output,
                    (byte) 0
                );
            }

        } finally {

            java.util.Arrays.fill(
                plaintext,
                (byte) 0
            );

            java.util.Arrays.fill(
                encrypted,
                (byte) 0
            );

            java.util.Arrays.fill(
                iv,
                (byte) 0
            );
        }
    }

    private byte[] readAll()
        throws Exception {

        FileInputStream input =
            atomicFile.openRead();

        try {

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[8192];

            int read;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) != -1
            ) {

                output.write(
                    buffer,
                    0,
                    read
                );

                if (
                    output.size() >
                    40 * 1024 * 1024
                ) {
                    throw new IllegalStateException(
                        "FINORA Developer Portable State store exceeds supported size."
                    );
                }
            }

            return output.toByteArray();

        } finally {

            input.close();
        }
    }

    private SecretKey getOrCreateKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                "AndroidKeyStore"
            );

        keyStore.load(
            null
        );

        KeyStore.Entry existing =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );

        if (
            existing instanceof
            KeyStore.SecretKeyEntry
        ) {
            return (
                (
                    KeyStore.SecretKeyEntry
                ) existing
            ).getSecretKey();
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
            );

        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                KeyProperties.PURPOSE_DECRYPT
            )
                .setKeySize(
                    256
                )
                .setBlockModes(
                    KeyProperties.BLOCK_MODE_GCM
                )
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .build()
        );

        return generator.generateKey();
    }
}