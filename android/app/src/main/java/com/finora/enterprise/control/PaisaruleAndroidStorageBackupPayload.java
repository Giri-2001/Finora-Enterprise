package com.finora.enterprise.control;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * PAISARULE Storage Backup V1 payload.
 *
 * Validates two original USB files before constructing
 * the exact logical payload expected by Windows V1 Restore.
 *
 * Never reads or writes USB directly.
 */
final class PaisaruleAndroidStorageBackupPayload {

    private static final String FORMAT =
        "PAISARULE_STORAGE_BACKUP_PAYLOAD";

    private static final int VERSION = 1;

    private static final int MAX_FILE_BYTES =
        32 * 1024 * 1024;

    private static final int MAX_TOTAL_BYTES =
        64 * 1024 * 1024;

    private static final int MAX_RECORDS = 200000;

    private static final String PRIMARY =
        "finora-storage.json";

    private static final String SECONDARY =
        "finora-storage.backup.json";

    private PaisaruleAndroidStorageBackupPayload() {}

    private static void require(
        boolean valid,
        String errorCode
    ) {
        if (!valid) {
            throw new IllegalArgumentException(errorCode);
        }
    }

    private static void exactKeys(
        JSONObject object,
        String... expected
    ) {
        require(
            object != null,
            "BACKUP_STORAGE_SCHEMA_INVALID"
        );

        Set<String> expectedSet =
            new HashSet<>(Arrays.asList(expected));

        Set<String> actualSet = new HashSet<>();

        java.util.Iterator<String> keys = object.keys();

        while (keys.hasNext()) {
            actualSet.add(keys.next());
        }

        require(
            actualSet.equals(expectedSet),
            "BACKUP_STORAGE_SCHEMA_INVALID"
        );
    }

    private static String scopedId(
        JSONObject principal,
        String field
    ) {
        require(
            principal != null,
            "BACKUP_SCOPE_INVALID"
        );

        Object raw = principal.opt(field);

        require(
            raw instanceof String,
            "BACKUP_SCOPE_INVALID"
        );

        String value = (String) raw;

        require(
            !value.isEmpty() &&
            value.length() <= 512 &&
            value.equals(value.trim()),
            "BACKUP_SCOPE_INVALID"
        );

        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);

            require(
                c >= 32 && c != 127,
                "BACKUP_SCOPE_INVALID"
            );
        }

        return value;
    }

    private static String strictUtf8(
        byte[] bytes
    ) throws CharacterCodingException {

        require(
            bytes != null &&
            bytes.length > 0 &&
            bytes.length <= MAX_FILE_BYTES,
            "BACKUP_STORAGE_FILE_INVALID"
        );

        return StandardCharsets.UTF_8
            .newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(
                CodingErrorAction.REPORT
            )
            .decode(ByteBuffer.wrap(bytes))
            .toString();
    }

    private static void validateStorage(
        byte[] bytes,
        JSONObject scope
    ) throws Exception {

        JSONObject root;

        try {
            root = new JSONObject(strictUtf8(bytes));
        } catch (CharacterCodingException error) {
            throw new IllegalArgumentException(
                "BACKUP_STORAGE_UTF8_INVALID"
            );
        } catch (org.json.JSONException error) {
            throw new IllegalArgumentException(
                "BACKUP_STORAGE_JSON_INVALID"
            );
        }

        exactKeys(
            root,
            "records",
            "updatedAt",
            "version"
        );

        require(
            root.opt("version") instanceof String &&
            !root.optString("version").isEmpty() &&
            root.opt("updatedAt") instanceof String &&
            !root.optString("updatedAt").isEmpty(),
            "BACKUP_STORAGE_ROOT_SCHEMA_INVALID"
        );

        JSONArray records = root.optJSONArray("records");

        require(
            records != null &&
            records.length() <= MAX_RECORDS,
            "BACKUP_STORAGE_ROOT_SCHEMA_INVALID"
        );

        String ownerId = scopedId(scope, "ownerId");
        String businessId = scopedId(scope, "businessId");
        String branchId = scopedId(scope, "branchId");

        for (int index = 0; index < records.length(); index++) {
            JSONObject record = records.optJSONObject(index);

            require(
                record != null,
                "BACKUP_STORAGE_RECORD_INVALID"
            );

            exactKeys(
                record,
                "id",
                "entity",
                "data",
                "createdAt",
                "updatedAt",
                "ownerId",
                "businessId",
                "branchId"
            );

            for (String field : new String[] {
                "id", "entity", "ownerId",
                "businessId", "branchId",
                "createdAt", "updatedAt"
            }) {
                Object value = record.opt(field);

                require(
                    value instanceof String &&
                    !((String) value).isEmpty(),
                    "BACKUP_STORAGE_RECORD_INVALID"
                );
            }

            require(
                ownerId.equals(record.optString("ownerId")) &&
                businessId.equals(record.optString("businessId")) &&
                branchId.equals(record.optString("branchId")),
                "BACKUP_STORAGE_RECORD_SCOPE_MISMATCH"
            );
        }
    }

    private static String hex(byte[] input) {
        char[] alphabet =
            "0123456789abcdef".toCharArray();

        char[] output = new char[input.length * 2];

        for (int i = 0; i < input.length; i++) {
            int value = input[i] & 255;

            output[i * 2] = alphabet[value >>> 4];
            output[i * 2 + 1] = alphabet[value & 15];
        }

        return new String(output);
    }

    private static JSONObject fileEntry(
        byte[] original
    ) throws Exception {

        byte[] hash = MessageDigest
            .getInstance("SHA-256")
            .digest(original);

        try {
            JSONObject entry = new JSONObject();

            entry.put("sha256", hex(hash));
            entry.put(
                "contentBase64",
                android.util.Base64.encodeToString(
                    original,
                    android.util.Base64.NO_WRAP
                )
            );

            return entry;
        } finally {
            Arrays.fill(hash, (byte) 0);
        }
    }

    static byte[] createPayload(
        byte[] primary,
        byte[] secondary,
        JSONObject verifiedPrincipal,
        String createdAt
    ) throws Exception {

        require(
            primary != null &&
            secondary != null &&
            primary.length > 0 &&
            secondary.length > 0 &&
            primary.length <= MAX_FILE_BYTES &&
            secondary.length <= MAX_FILE_BYTES,
            "BACKUP_STORAGE_FILE_INVALID"
        );

        require(
            (long) primary.length +
            (long) secondary.length <= MAX_TOTAL_BYTES,
            "BACKUP_STORAGE_TOTAL_SIZE_INVALID"
        );

        try {
            Instant.parse(createdAt);
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "BACKUP_TIMESTAMP_INVALID"
            );
        }

        JSONObject scope = new JSONObject();

        for (String field : new String[] {
            "userId", "ownerId", "businessId", "branchId"
        }) {
            scope.put(
                field,
                scopedId(verifiedPrincipal, field)
            );
        }

        validateStorage(primary, scope);
        validateStorage(secondary, scope);

        JSONObject storageFiles = new JSONObject();

        storageFiles.put(PRIMARY, fileEntry(primary));
        storageFiles.put(SECONDARY, fileEntry(secondary));

        JSONObject payload = new JSONObject();

        payload.put("format", FORMAT);
        payload.put("version", VERSION);
        payload.put("createdAt", createdAt);
        payload.put("scope", scope);
        payload.put("storageFiles", storageFiles);

        byte[] result = payload.toString()
            .getBytes(StandardCharsets.UTF_8);

        // Windows V1 encryption accepts at most 64 MiB
        // of plaintext. Fail closed above that limit.
        if (result.length > MAX_TOTAL_BYTES) {
            Arrays.fill(result, (byte) 0);

            throw new IllegalArgumentException(
                "BACKUP_PAYLOAD_TOO_LARGE"
            );
        }

        return result;
    }

    // ========================================================
    // PAISARULE_R175_B5_RESTORE
    //
    // Parse authenticated V1 backup plaintext.
    //
    // Preconditions:
    // - AES-GCM decryption completed successfully.
    // - Caller supplies a separately verified principal.
    //
    // Returns:
    // [0] original primary storage bytes
    // [1] original secondary backup storage bytes
    //
    // No USB writes, filesystem access or login grants.
    // Caller must clear returned byte arrays after use.
    // ========================================================

    private static void requireRestoreExactKeys(
        JSONObject object,
        String... keys
    ) {
        if (
            object == null ||
            object.length() != keys.length
        ) {
            throw new IllegalArgumentException(
                "RESTORE_SCHEMA_INVALID"
            );
        }

        for (String key : keys) {
            if (
                !object.has(key) ||
                object.isNull(key)
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_SCHEMA_INVALID"
                );
            }
        }
    }

    private static byte[] decodeRestoreFile(
        JSONObject entry
    ) throws Exception {

        requireRestoreExactKeys(
            entry,
            "sha256",
            "contentBase64"
        );

        Object hashValue = entry.opt("sha256");
        Object contentValue = entry.opt("contentBase64");

        if (
            !(hashValue instanceof String) ||
            !(contentValue instanceof String)
        ) {
            throw new IllegalArgumentException(
                "RESTORE_FILE_SCHEMA_INVALID"
            );
        }

        String expectedHash = (String) hashValue;
        String encoded = (String) contentValue;

        if (
            !expectedHash.matches("[0-9a-f]{64}") ||
            encoded.isEmpty() ||
            encoded.length() >
                ((MAX_FILE_BYTES + 2L) / 3L) * 4L
        ) {
            throw new IllegalArgumentException(
                "RESTORE_FILE_ENCODING_INVALID"
            );
        }

        byte[] decoded = null;
        boolean success = false;

        try {
            decoded = android.util.Base64.decode(
                encoded,
                android.util.Base64.NO_WRAP
            );

            if (
                decoded.length == 0 ||
                decoded.length > MAX_FILE_BYTES
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_FILE_SIZE_INVALID"
                );
            }

            String canonical =
                android.util.Base64.encodeToString(
                    decoded,
                    android.util.Base64.NO_WRAP
                );

            if (!canonical.equals(encoded)) {
                throw new IllegalArgumentException(
                    "RESTORE_FILE_BASE64_INVALID"
                );
            }

            byte[] actualHash =
                MessageDigest.getInstance("SHA-256")
                    .digest(decoded);

            byte[] expectedHashBytes =
                expectedHash.getBytes(
                    StandardCharsets.US_ASCII
                );

            byte[] actualHashBytes =
                hex(actualHash).getBytes(
                    StandardCharsets.US_ASCII
                );

            try {
                if (
                    !MessageDigest.isEqual(
                        expectedHashBytes,
                        actualHashBytes
                    )
                ) {
                    throw new IllegalArgumentException(
                        "RESTORE_FILE_SHA256_MISMATCH"
                    );
                }
            } finally {
                java.util.Arrays.fill(
                    actualHash, (byte) 0
                );
                java.util.Arrays.fill(
                    actualHashBytes, (byte) 0
                );
                java.util.Arrays.fill(
                    expectedHashBytes, (byte) 0
                );
            }

            success = true;
            return decoded;

        } finally {
            if (!success && decoded != null) {
                java.util.Arrays.fill(
                    decoded, (byte) 0
                );
            }
        }
    }

    static byte[][] parseVerifiedRestorePayload(
        byte[] plaintext,
        JSONObject verifiedPrincipal
    ) throws Exception {

        if (
            plaintext == null ||
            plaintext.length == 0 ||
            plaintext.length > MAX_TOTAL_BYTES ||
            verifiedPrincipal == null
        ) {
            throw new IllegalArgumentException(
                "RESTORE_PAYLOAD_INPUT_INVALID"
            );
        }

        byte[] primary = null;
        byte[] secondary = null;
        boolean success = false;

        try {
            String jsonText =
                StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(
                        java.nio.charset.CodingErrorAction.REPORT
                    )
                    .onUnmappableCharacter(
                        java.nio.charset.CodingErrorAction.REPORT
                    )
                    .decode(
                        java.nio.ByteBuffer.wrap(plaintext)
                    )
                    .toString();

            JSONObject payload =
                new JSONObject(jsonText);

            requireRestoreExactKeys(
                payload,
                "format",
                "version",
                "createdAt",
                "scope",
                "storageFiles"
            );

            if (
                !(payload.opt("format") instanceof String) ||
                !FORMAT.equals(
                    payload.optString("format", "")
                ) ||
                !(payload.opt("version") instanceof Number) ||
                payload.optInt("version", -1) != VERSION ||
                !(payload.opt("createdAt") instanceof String)
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_PAYLOAD_VERSION_INVALID"
                );
            }

            java.time.Instant.parse(
                payload.getString("createdAt")
            );

            JSONObject scope =
                payload.getJSONObject("scope");

            requireRestoreExactKeys(
                scope,
                "userId",
                "ownerId",
                "businessId",
                "branchId"
            );

            for (String field : new String[] {
                "userId",
                "ownerId",
                "businessId",
                "branchId"
            }) {
                if (
                    !(scope.opt(field) instanceof String) ||
                    !scopedId(
                        verifiedPrincipal, field
                    ).equals(
                        scope.getString(field)
                    )
                ) {
                    throw new IllegalArgumentException(
                        "RESTORE_BUSINESS_SCOPE_MISMATCH"
                    );
                }
            }

            JSONObject storageFiles =
                payload.getJSONObject("storageFiles");

            requireRestoreExactKeys(
                storageFiles,
                PRIMARY,
                SECONDARY
            );

            primary = decodeRestoreFile(
                storageFiles.getJSONObject(PRIMARY)
            );

            secondary = decodeRestoreFile(
                storageFiles.getJSONObject(SECONDARY)
            );

            if (
                (long) primary.length +
                (long) secondary.length > MAX_TOTAL_BYTES
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_TOTAL_SIZE_INVALID"
                );
            }

            // Reuse the existing backup export's strict
            // storage schema / business-scope validator.
            validateStorage(primary, scope);
            validateStorage(secondary, scope);

            success = true;

            return new byte[][] {
                primary,
                secondary
            };

        } finally {
            if (!success) {
                if (primary != null) {
                    java.util.Arrays.fill(
                        primary, (byte) 0
                    );
                }

                if (secondary != null) {
                    java.util.Arrays.fill(
                        secondary, (byte) 0
                    );
                }
            }
        }
    }
}