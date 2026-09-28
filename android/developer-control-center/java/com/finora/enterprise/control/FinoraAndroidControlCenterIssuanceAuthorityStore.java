package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.time.Instant;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;


/**
 * FINORA Android Developer Control Center
 * local issuance / wall-clock high-water authority.
 *
 * IMPORTANT:
 *
 * - Imported Portable State is immutable signed provenance.
 * - This store never mutates FinoraPortableStateAuthorityStore.
 * - Portable State issuanceAuthority.general is accepted only as
 *   an imported high-water baseline.
 * - Local reservations are persisted before signing.
 * - Sequence gaps are allowed.
 * - Sequence reuse / rollback is forbidden.
 * - Clock rollback below imported/local high-water is rejected.
 */
final class FinoraAndroidControlCenterIssuanceAuthorityStore {

    private static final int SCHEMA_VERSION =
        1;

    private static final int MAX_FILE_BYTES =
        2 * 1024 * 1024;

    private static final int IV_BYTES =
        12;

    private static final int TAG_BITS =
        128;

    private static final String STORE_DIRECTORY =
        "FINORA";

    private static final String STORE_SUBDIRECTORY =
        "control-center";

    private static final String STORE_FILE =
        "finora-android-control-center-issuance.bin";

    private static final String KEY_ALIAS =
        "FINORA_ANDROID_CONTROL_CENTER_ISSUANCE_AES_V1";

    private static final String ANDROID_KEYSTORE =
        "AndroidKeyStore";

    private static final byte[] AAD =
        "FINORA_ANDROID_CONTROL_CENTER_ISSUANCE_V1"
            .getBytes(
                StandardCharsets.UTF_8
            );


    /*
     * One process-wide monitor is required because approval and
     * decline issuance create separate store instances. AtomicFile
     * protects replacement, but sequence read-modify-write must also
     * serialize across those instances.
     */
    private static final long MAX_SAFE_SEQUENCE =
        9_007_199_254_740_991L;

    private static final Object GLOBAL_RESERVATION_LOCK =
        new Object();

    static final class Reservation {

        final String packageId;
        final long sequence;
        final String issuedAt;

        Reservation(
            String packageId,
            long sequence,
            String issuedAt
        ) {

            this.packageId =
                packageId;

            this.sequence =
                sequence;

            this.issuedAt =
                issuedAt;
        }
    }


    private final AtomicFile atomicFile;


    FinoraAndroidControlCenterIssuanceAuthorityStore(
        Context context
    ) {

        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA Android issuance authority Context is required."
            );
        }

        File directory =
            new File(
                new File(
                    context
                        .getApplicationContext()
                        .getFilesDir(),
                    STORE_DIRECTORY
                ),
                STORE_SUBDIRECTORY
            );

        if (
            !directory.exists() &&
            !directory.mkdirs() &&
            !directory.isDirectory()
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance authority directory could not be created."
            );
        }

        this.atomicFile =
            new AtomicFile(
                new File(
                    directory,
                    STORE_FILE
                )
            );
    }


    synchronized Reservation reserve(
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId,
        FinoraPortableStateAuthorityStore.Snapshot portableSnapshot
    ) throws Exception {

        synchronized (GLOBAL_RESERVATION_LOCK) {

        requireText(
            issuerId,
            "Issuer ID"
        );

        requirePurpose(
            purpose
        );

        requireText(
            ownerId,
            "Owner ID"
        );

        requireText(
            businessId,
            "Business ID"
        );

        requireText(
            branchId,
            "Branch ID"
        );

        requireText(
            installationId,
            "Installation ID"
        );


        JSONObject local =
            readLocal();

        if (local == null) {

            String now =
                canonicalNow();

            local =
                createEmptyLocal(
                    issuerId,
                    now
                );
        }


        String localIssuerId =
            local.getString(
                "issuerId"
            );

        if (!issuerId.equals(localIssuerId)) {
            throw new IllegalStateException(
                "FINORA Android issuance authority belongs to another Control Center issuer."
            );
        }


        PortableBaseline portable =
            readPortableBaseline(
                issuerId,
                purpose,
                ownerId,
                businessId,
                branchId,
                installationId,
                portableSnapshot
            );


        String localClockHighWaterAt =
            local.getString(
                "clockHighWaterAt"
            );

        String effectiveHighWaterAt =
            laterTimestamp(
                localClockHighWaterAt,
                portable.clockHighWaterAt
            );


        String observedAt =
            canonicalNow();

        if (
            Instant.parse(
                observedAt
            ).isBefore(
                Instant.parse(
                    effectiveHighWaterAt
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Android Control Center wall clock is behind the trusted issuance high-water."
            );
        }


        JSONArray sequences =
            local.getJSONArray(
                "sequences"
            );

        JSONObject localRecord =
            findSequenceRecord(
                sequences,
                issuerId,
                purpose,
                ownerId,
                businessId,
                branchId,
                installationId
            );

        long localHighWater =
            localRecord == null
                ? 0L
                : localRecord.getLong(
                    "lastReservedSequence"
                );

        long baseline =
            Math.max(
                localHighWater,
                portable.sequenceHighWater
            );

        if (baseline == Long.MAX_VALUE) {
            throw new IllegalStateException(
                "FINORA Android issuance sequence is exhausted."
            );
        }

                if (
            baseline < 0L ||
            baseline >= MAX_SAFE_SEQUENCE
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance sequence has exhausted the JavaScript-safe integer range."
            );
        }

long sequence =
            baseline + 1L;


        if (localRecord == null) {

            localRecord =
                new JSONObject();

            localRecord.put(
                "issuerId",
                issuerId
            );

            localRecord.put(
                "purpose",
                purpose
            );

            localRecord.put(
                "ownerId",
                ownerId
            );

            localRecord.put(
                "businessId",
                businessId
            );

            localRecord.put(
                "branchId",
                branchId
            );

            localRecord.put(
                "installationId",
                installationId
            );

            localRecord.put(
                "lastReservedSequence",
                sequence
            );

            localRecord.put(
                "updatedAt",
                observedAt
            );

            sequences.put(
                localRecord
            );
        }
        else {

            localRecord.put(
                "lastReservedSequence",
                sequence
            );

            localRecord.put(
                "updatedAt",
                observedAt
            );
        }


        local.put(
            "clockHighWaterAt",
            observedAt
        );

        local.put(
            "updatedAt",
            observedAt
        );


        validateLocal(
            local
        );

        /*
         * Persist reservation BEFORE any package signing occurs.
         * A later signing/export failure intentionally leaves a gap.
         */
        writeLocal(
            local
        );


        return new Reservation(
            "FINORA-CC-PKG-" +
                UUID.randomUUID(),
            sequence,
            observedAt
        );
        }
    }


    synchronized JSONObject loadSnapshot()
        throws Exception {

        JSONObject local =
            readLocal();

        return local == null
            ? null
            : new JSONObject(
                local.toString()
            );
    }


    private static final class PortableBaseline {

        final long sequenceHighWater;
        final String clockHighWaterAt;

        PortableBaseline(
            long sequenceHighWater,
            String clockHighWaterAt
        ) {

            this.sequenceHighWater =
                sequenceHighWater;

            this.clockHighWaterAt =
                clockHighWaterAt;
        }
    }


    private static PortableBaseline readPortableBaseline(
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId,
        FinoraPortableStateAuthorityStore.Snapshot portableSnapshot
    ) throws Exception {

        long sequenceHighWater =
            0L;

        String clockHighWaterAt =
            "1970-01-01T00:00:00.000Z";


        if (portableSnapshot == null) {

            return new PortableBaseline(
                sequenceHighWater,
                clockHighWaterAt
            );
        }


        JSONObject payload =
            portableSnapshot.payload;

        if (payload == null) {
            throw new IllegalStateException(
                "FINORA imported Portable State payload is missing."
            );
        }


        String payloadIssuerId =
            payload.optString(
                "issuerId",
                null
            );

        if (
            payloadIssuerId != null &&
            !payloadIssuerId.equals(
                issuerId
            )
        ) {
            throw new IllegalStateException(
                "FINORA imported Portable State issuer does not match the active Control Center."
            );
        }


        JSONObject issuanceAuthority =
            payload.optJSONObject(
                "issuanceAuthority"
            );

        if (issuanceAuthority != null) {

            JSONObject general =
                issuanceAuthority.optJSONObject(
                    "general"
                );

            if (general != null) {

                JSONArray sequences =
                    general.optJSONArray(
                        "sequences"
                    );

                if (sequences != null) {

                    for (
                        int index = 0;
                        index < sequences.length();
                        index++
                    ) {

                        JSONObject record =
                            sequences.optJSONObject(
                                index
                            );

                        if (record == null) {
                            throw new IllegalStateException(
                                "FINORA imported general issuance ledger contains an invalid sequence record."
                            );
                        }


                        if (
                            issuerId.equals(
                                record.optString(
                                    "issuerId",
                                    null
                                )
                            ) &&
                            purpose.equals(
                                record.optString(
                                    "purpose",
                                    null
                                )
                            ) &&
                            ownerId.equals(
                                record.optString(
                                    "ownerId",
                                    null
                                )
                            ) &&
                            businessId.equals(
                                record.optString(
                                    "businessId",
                                    null
                                )
                            ) &&
                            branchId.equals(
                                record.optString(
                                    "branchId",
                                    null
                                )
                            ) &&
                            installationId.equals(
                                record.optString(
                                    "installationId",
                                    null
                                )
                            )
                        ) {

                            long candidate =
                                record.optLong(
                                    "lastReservedSequence",
                                    -1L
                                );

                            if (candidate < 0L) {
                                throw new IllegalStateException(
                                    "FINORA imported general issuance high-water is invalid."
                                );
                            }

                            sequenceHighWater =
                                Math.max(
                                    sequenceHighWater,
                                    candidate
                                );
                        }
                    }
                }
            }
        }


        JSONObject clockAuthority =
            payload.optJSONObject(
                "clockAuthority"
            );

        if (clockAuthority != null) {

            JSONObject state =
                clockAuthority.optJSONObject(
                    "state"
                );

            if (state != null) {

                String clockIssuerId =
                    state.optString(
                        "issuerId",
                        null
                    );

                String importedHighWaterAt =
                    state.optString(
                        "highWaterAt",
                        null
                    );

                if (
                    clockIssuerId != null &&
                    importedHighWaterAt != null
                ) {

                    if (!issuerId.equals(clockIssuerId)) {
                        throw new IllegalStateException(
                            "FINORA imported clock authority belongs to another Control Center issuer."
                        );
                    }

                    requireCanonicalTimestamp(
                        importedHighWaterAt,
                        "Imported clock high-water"
                    );

                    clockHighWaterAt =
                        importedHighWaterAt;
                }
            }
        }


        return new PortableBaseline(
            sequenceHighWater,
            clockHighWaterAt
        );
    }


    private static JSONObject createEmptyLocal(
        String issuerId,
        String observedAt
    ) throws Exception {

        JSONObject root =
            new JSONObject();

        root.put(
            "issuerId",
            issuerId
        );

        root.put(
            "sequences",
            new JSONArray()
        );

        root.put(
            "clockHighWaterAt",
            observedAt
        );

        root.put(
            "createdAt",
            observedAt
        );

        root.put(
            "updatedAt",
            observedAt
        );

        root.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        return root;
    }


    private static JSONObject findSequenceRecord(
        JSONArray sequences,
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) throws Exception {

        for (
            int index = 0;
            index < sequences.length();
            index++
        ) {

            JSONObject record =
                sequences.getJSONObject(
                    index
                );

            if (
                issuerId.equals(
                    record.optString(
                        "issuerId",
                        null
                    )
                ) &&
                purpose.equals(
                    record.optString(
                        "purpose",
                        null
                    )
                ) &&
                ownerId.equals(
                    record.optString(
                        "ownerId",
                        null
                    )
                ) &&
                businessId.equals(
                    record.optString(
                        "businessId",
                        null
                    )
                ) &&
                branchId.equals(
                    record.optString(
                        "branchId",
                        null
                    )
                ) &&
                installationId.equals(
                    record.optString(
                        "installationId",
                        null
                    )
                )
            ) {
                return record;
            }
        }

        return null;
    }


    private static void validateLocal(
        JSONObject root
    ) throws Exception {

        if (
            root == null ||
            root.length() != 6 ||
            root.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance authority root is invalid."
            );
        }

        requireText(
            root.optString(
                "issuerId",
                null
            ),
            "Issuer ID"
        );

        requireCanonicalTimestamp(
            root.optString(
                "clockHighWaterAt",
                null
            ),
            "Clock high-water"
        );

        requireCanonicalTimestamp(
            root.optString(
                "createdAt",
                null
            ),
            "Created At"
        );

        requireCanonicalTimestamp(
            root.optString(
                "updatedAt",
                null
            ),
            "Updated At"
        );

        JSONArray sequences =
            root.optJSONArray(
                "sequences"
            );

        if (sequences == null) {
            throw new IllegalStateException(
                "FINORA Android issuance sequence collection is missing."
            );
        }

        String issuerId =
            root.getString(
                "issuerId"
            );

        for (
            int index = 0;
            index < sequences.length();
            index++
        ) {

            JSONObject record =
                sequences.optJSONObject(
                    index
                );

            if (
                record == null ||
                record.length() != 8
            ) {
                throw new IllegalStateException(
                    "FINORA Android issuance sequence record is invalid."
                );
            }

            if (
                !issuerId.equals(
                    record.optString(
                        "issuerId",
                        null
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Android issuance sequence belongs to another issuer."
                );
            }

            requirePurpose(
                record.optString(
                    "purpose",
                    null
                )
            );

            requireText(
                record.optString(
                    "ownerId",
                    null
                ),
                "Owner ID"
            );

            requireText(
                record.optString(
                    "businessId",
                    null
                ),
                "Business ID"
            );

            requireText(
                record.optString(
                    "branchId",
                    null
                ),
                "Branch ID"
            );

            requireText(
                record.optString(
                    "installationId",
                    null
                ),
                "Installation ID"
            );

            if (
                record.optLong(
                    "lastReservedSequence",
                    0L
                ) <= 0L
            ) {
                throw new IllegalStateException(
                    "FINORA Android issuance sequence high-water is invalid."
                );
            }

            requireCanonicalTimestamp(
                record.optString(
                    "updatedAt",
                    null
                ),
                "Sequence Updated At"
            );
        }
    }


    private JSONObject readLocal()
        throws Exception {

        File baseFile =
            atomicFile.getBaseFile();

        if (!baseFile.exists()) {
            return null;
        }

        byte[] encrypted =
            readBoundedFile(
                baseFile
            );

        JSONObject envelope =
            new JSONObject(
                new String(
                    encrypted,
                    StandardCharsets.UTF_8
                )
            );

        if (
            envelope.length() != 5 ||
            envelope.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION ||
            !"AES-256-GCM".equals(
                envelope.optString(
                    "algorithm",
                    null
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance authority envelope is invalid."
            );
        }

        byte[] iv =
            Base64.decode(
                envelope.getString(
                    "ivBase64"
                ),
                Base64.NO_WRAP
            );

        byte[] ciphertext =
            Base64.decode(
                envelope.getString(
                    "ciphertextBase64"
                ),
                Base64.NO_WRAP
            );

        byte[] aad =
            Base64.decode(
                envelope.getString(
                    "aadBase64"
                ),
                Base64.NO_WRAP
            );

        if (
            iv.length != IV_BYTES ||
            !java.util.Arrays.equals(
                aad,
                AAD
            )
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance authority envelope binding is invalid."
            );
        }


        Cipher cipher =
            Cipher.getInstance(
                "AES/GCM/NoPadding"
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateKey(),
            new GCMParameterSpec(
                TAG_BITS,
                iv
            )
        );

        cipher.updateAAD(
            AAD
        );

        byte[] plaintext =
            cipher.doFinal(
                ciphertext
            );

        JSONObject root =
            new JSONObject(
                new String(
                    plaintext,
                    StandardCharsets.UTF_8
                )
            );

        validateLocal(
            root
        );

        return root;
    }


    private void writeLocal(
        JSONObject root
    ) throws Exception {

        validateLocal(
            root
        );

        byte[] plaintext =
            root.toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        Cipher cipher =
            Cipher.getInstance(
                "AES/GCM/NoPadding"
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            getOrCreateKey()
        );

        cipher.updateAAD(
            AAD
        );

        byte[] ciphertext =
            cipher.doFinal(
                plaintext
            );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length != IV_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance authority GCM IV is invalid."
            );
        }

        JSONObject envelope =
            new JSONObject();

        envelope.put(
            "algorithm",
            "AES-256-GCM"
        );

        envelope.put(
            "ivBase64",
            Base64.encodeToString(
                iv,
                Base64.NO_WRAP
            )
        );

        envelope.put(
            "ciphertextBase64",
            Base64.encodeToString(
                ciphertext,
                Base64.NO_WRAP
            )
        );

        envelope.put(
            "aadBase64",
            Base64.encodeToString(
                AAD,
                Base64.NO_WRAP
            )
        );

        envelope.put(
            "schemaVersion",
            SCHEMA_VERSION
        );


        byte[] serialized =
            envelope.toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        if (serialized.length > MAX_FILE_BYTES) {
            throw new IllegalStateException(
                "FINORA Android issuance authority exceeds the maximum store size."
            );
        }


        FileOutputStream stream =
            null;

        try {

            stream =
                atomicFile.startWrite();

            stream.write(
                serialized
            );

            stream.flush();

            atomicFile.finishWrite(
                stream
            );
        }
        catch (Exception error) {

            if (stream != null) {
                atomicFile.failWrite(
                    stream
                );
            }

            throw error;
        }
    }


    private static byte[] readBoundedFile(
        File file
    ) throws Exception {

        FileInputStream input =
            new FileInputStream(
                file
            );

        try {

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

                total +=
                    read;

                if (total > MAX_FILE_BYTES) {
                    throw new IllegalStateException(
                        "FINORA Android issuance authority file is too large."
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
        finally {

            input.close();
        }
    }


    private static SecretKey getOrCreateKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                ANDROID_KEYSTORE
            );

        keyStore.load(
            null
        );

        if (
            !keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {

            KeyGenerator keyGenerator =
                KeyGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES,
                    ANDROID_KEYSTORE
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

            keyGenerator.generateKey();
        }


        KeyStore.Entry entry =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );

        if (
            !(entry instanceof KeyStore.SecretKeyEntry)
        ) {
            throw new IllegalStateException(
                "FINORA Android issuance authority key is invalid."
            );
        }

        return (
            (KeyStore.SecretKeyEntry) entry
        ).getSecretKey();
    }


    private static String laterTimestamp(
        String left,
        String right
    ) {

        requireCanonicalTimestamp(
            left,
            "Local clock high-water"
        );

        requireCanonicalTimestamp(
            right,
            "Imported clock high-water"
        );

        Instant leftInstant =
            Instant.parse(
                left
            );

        Instant rightInstant =
            Instant.parse(
                right
            );

        return leftInstant.isAfter(
            rightInstant
        )
            ? left
            : right;
    }


    private static void requirePurpose(
        String purpose
    ) {

        if (
            !"WALLET_RECHARGE".equals(purpose) &&
            !"CONTROL_BUNDLE".equals(purpose) &&
            !"WALLET_RECHARGE_DECLINE".equals(purpose)
        ) {
            throw new IllegalArgumentException(
                "FINORA Android issuance purpose is unsupported."
            );
        }
    }


    private static void requireText(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty() ||
            !value.equals(
                value.trim()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA " +
                label +
                " is required."
            );
        }
    }


    static String canonicalNow() {

        return java.time.format.DateTimeFormatter
            .ofPattern(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                java.util.Locale.ROOT
            )
            .withZone(
                java.time.ZoneOffset.UTC
            )
            .format(
                Instant.now()
            );
    }


    private static void requireCanonicalTimestamp(
        String value,
        String label
    ) {

        requireText(
            value,
            label
        );

        if (
            !value.matches(
                "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA " +
                label +
                " timestamp is not canonical."
            );
        }

        try {

            Instant.parse(
                value
            );
        }
        catch (Exception error) {

            throw new IllegalArgumentException(
                "FINORA " +
                label +
                " timestamp is invalid."
            );
        }
    }
}