package com.finora.enterprise.control;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.regex.Pattern;

// ============================================================
// FINORA ENTERPRISE OS
//
// ANDROID CONTROL
// BRANCH DEVICE TRUST STORE
//
// RESPONSIBILITY:
//
// - Persist branch-scoped trusted-device public identity state.
// - Preserve Windows Device Trust record/schema parity.
// - Persist inside the existing encrypted Android Control Store.
// - Preserve every unrelated Control Store root field.
// - Serialize read/modify/write with the signed-control apply lock.
// - Never persist Password, Security Code, or private-key material.
//
// SECURITY:
//
// - Device private keys remain exclusively in AndroidKeyStore.
// - Device Trust stores only public native-binding identity.
// - Missing Device Trust state means zero trusted devices.
// - Malformed persisted trust state fails closed.
// - No plaintext persistence fallback.
// - No USB fallback.
// - No WebView access.
//
// VERSION : 1.0
// ============================================================

public final class FinoraBranchDeviceTrustStore {

    public static final String FORMAT =
        "FINORA_BRANCH_DEVICE_TRUST";

    public static final int SCHEMA_VERSION =
        2;

    public static final int RECORD_SCHEMA_VERSION =
        2;

    static final int LEGACY_SCHEMA_VERSION = 1;
    static final int LEGACY_RECORD_SCHEMA_VERSION = 1;

    public static final int MAX_RECORDS =
        64;

    static final String ROOT_KEY =
        "branchDeviceTrust";

    private static final Pattern PORTABLE_FINGERPRINT_PATTERN =
        Pattern.compile(
            "^[a-f0-9]{64}$"
        );

    private static final Pattern PUBLIC_KEY_FINGERPRINT_PATTERN =
        Pattern.compile(
            "^[A-Fa-f0-9]{64}$"
        );

    interface ControlStatePort {

        String read()
            throws Exception;

        void write(
            String serialized
        ) throws Exception;
    }

    public static final class Record {

        public final String authStateId;
        public final String userId;
        public final String canonicalUsername;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String storageMode;
        public final String dataContext;
        public final String demoId;

        public final long authGeneration;

        public final String portableAuthFingerprintAlgorithm;
        public final String portableAuthFingerprint;

        public final String platform;

        public final String installationId;
        public final String bindingKeyId;
        public final String fingerprintAlgorithm;
        public final String publicKeyFingerprint;

        public final String status;
        public final String revokedAt;

        public final String trustedAt;
        public final String updatedAt;

        public final int schemaVersion;

        public Record(
            String authStateId,
            String userId,
            String canonicalUsername,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            long authGeneration,
            String portableAuthFingerprintAlgorithm,
            String portableAuthFingerprint,
            String platform,
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint,
            String trustedAt,
            String updatedAt,
            int schemaVersion
        ) {
            this(
                authStateId,
                userId,
                canonicalUsername,
               ownerId,
               businessId,
               branchId,
                storageMode,
               dataContext,
                demoId,
                authGeneration,
               portableAuthFingerprintAlgorithm,
                portableAuthFingerprint,
               platform,
                installationId,
               bindingKeyId,
               fingerprintAlgorithm,
               publicKeyFingerprint,
                FinoraBranchDeviceTrustLifecycle.STATUS_ACTIVE,
                null,
               trustedAt,
               updatedAt,
                schemaVersion
            );
        }
        public Record(
            String authStateId,
            String userId,
            String canonicalUsername,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            long authGeneration,
            String portableAuthFingerprintAlgorithm,
            String portableAuthFingerprint,
            String platform,
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint,
            String status,
            String revokedAt,
            String trustedAt,
            String updatedAt,
            int schemaVersion
        ) {

             FinoraBranchDeviceTrustLifecycle.validateLifecycleState(
                status,
               revokedAt
             );

            this.authStateId =
                authStateId;

            this.userId =
                userId;

            this.canonicalUsername =
                canonicalUsername;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.authGeneration =
                authGeneration;

            this.portableAuthFingerprintAlgorithm =
                portableAuthFingerprintAlgorithm;

            this.portableAuthFingerprint =
                portableAuthFingerprint;

            this.platform =
                platform;

            this.installationId =
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;

            this.status =
                status;

            this.revokedAt =
                revokedAt;

            this.trustedAt =
                trustedAt;

            this.updatedAt =
                updatedAt;

            this.schemaVersion =
                schemaVersion;
        }
    }

    private final ControlStatePort port;

    public FinoraBranchDeviceTrustStore(
        Context context
    ) {

        this(
            new NativeControlStatePort(
                context
            )
        );
    }

    // Package-private for deterministic JVM unit tests.
    FinoraBranchDeviceTrustStore(
        ControlStatePort port
    ) {

        if (port == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust Control State port is required."
            );
        }

        this.port =
            port;
    }

    // ========================================================
    // READ
    // ========================================================

    public List<Record> readAll()
        throws Exception {

        synchronized (
            FinoraControlPackageApplyLock.LOCK
        ) {

            return Collections.unmodifiableList(
                new ArrayList<>(
                    readAllLocked()
                )
            );
        }
    }

    // ========================================================
    // PERSIST COMPLETE TRUST SET
    // ========================================================

    public void persist(
        List<Record> records,
        String updatedAt
    ) throws Exception {

        if (records == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust records are required."
            );
        }

        requireNonEmpty(
            updatedAt,
            "updatedAt"
        );

        if (records.size() > MAX_RECORDS) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust record limit exceeded."
            );
        }

        JSONArray serializedRecords =
            new JSONArray();

        for (Record record : records) {
            validateRecord(
                record
            );

            serializedRecords.put(
                serializeRecord(
                    record
                )
            );
        }

        JSONObject trustState =
            new JSONObject();

        trustState.put(
            "format",
            FORMAT
        );

        trustState.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        trustState.put(
            "records",
            serializedRecords
        );

        trustState.put(
            "updatedAt",
            updatedAt
        );

        synchronized (
            FinoraControlPackageApplyLock.LOCK
        ) {

            String existing =
                port.read();

            if (existing == null) {
                throw new IllegalStateException(
                    "FINORA Control Store must exist before Branch Device Trust persistence."
                );
            }

            JSONObject root =
                parseRoot(
                    existing
                );

            root.put(
                ROOT_KEY,
                trustState
            );

            port.write(
                root.toString()
            );
        }
    }

    // ========================================================
    // LOCKED READ
    // ========================================================

    private List<Record> readAllLocked()
        throws Exception {

        String serialized =
            port.read();

        if (serialized == null) {
            return Collections.emptyList();
        }

        JSONObject root =
            parseRoot(
                serialized
            );

        if (!root.has(ROOT_KEY)) {
            return Collections.emptyList();
        }

        Object rawState =
            root.opt(
                ROOT_KEY
            );

        if (!(rawState instanceof JSONObject)) {
            throw new IllegalStateException(
                "FINORA Branch Device Trust state must be an object."
            );
        }

        JSONObject state =
            (JSONObject) rawState;

        requireExactKeys(
            state,
            new String[] {
                "format",
                "schemaVersion",
                "records",
                "updatedAt"
            },
            "Branch Device Trust state"
        );

        if (!FORMAT.equals(
            state.optString(
                "format",
                null
            )
        )) {
            throw new IllegalStateException(
                "Invalid FINORA Branch Device Trust format."
            );
        }

        if (
            state.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION &&
            state.optInt(
                "schemaVersion",
                -1
            ) != LEGACY_SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "Unsupported FINORA Branch Device Trust schema version."
            );
        }

        requireNonEmpty(
            state.optString(
                "updatedAt",
                null
            ),
            "state.updatedAt"
        );

        JSONArray records =
            state.optJSONArray(
                "records"
            );

        if (records == null) {
            throw new IllegalStateException(
                "FINORA Branch Device Trust records must be an array."
            );
        }

        if (records.length() > MAX_RECORDS) {
            throw new IllegalStateException(
                "FINORA Branch Device Trust persisted record limit exceeded."
            );
        }

        List<Record> result =
            new ArrayList<>();

        for (
            int index = 0;
            index < records.length();
            index++
        ) {

            JSONObject item =
                records.optJSONObject(
                    index
                );

            if (item == null) {
                throw new IllegalStateException(
                    "FINORA Branch Device Trust record must be an object."
                );
            }

            Record record =
                parseRecord(
                    item,
                    state.optInt(
                        "schemaVersion",
                        -1
                    )
                );

            validateRecord(
                record
            );

            result.add(
                record
            );
        }

        return result;
    }

    // ========================================================
    // RECORD CODEC
    // ========================================================

    private static JSONObject serializeRecord(
        Record record
    ) throws Exception {

        JSONObject object =
            new JSONObject();

        object.put(
            "authStateId",
            record.authStateId
        );

        object.put(
            "userId",
            record.userId
        );

        object.put(
            "canonicalUsername",
            record.canonicalUsername
        );

        object.put(
            "ownerId",
            record.ownerId
        );

        object.put(
            "businessId",
            record.businessId
        );

        object.put(
            "branchId",
            record.branchId
        );

        object.put(
            "storageMode",
            record.storageMode
        );

        object.put(
            "dataContext",
            record.dataContext
        );

        if (record.demoId != null) {
            object.put(
                "demoId",
                record.demoId
            );
        }

        object.put(
            "authGeneration",
            record.authGeneration
        );

        object.put(
            "portableAuthFingerprintAlgorithm",
            record.portableAuthFingerprintAlgorithm
        );

        object.put(
            "portableAuthFingerprint",
            record.portableAuthFingerprint
        );

        object.put(
            "platform",
            record.platform
        );

        object.put(
            "installationId",
            record.installationId
        );

        object.put(
            "bindingKeyId",
            record.bindingKeyId
        );

        object.put(
            "fingerprintAlgorithm",
            record.fingerprintAlgorithm
        );

        object.put(
            "publicKeyFingerprint",
            record.publicKeyFingerprint
        );

        if (record.schemaVersion == 2) {
            object.put(
                "status",
                record.status
            );
            if (record.revokedAt != null) {
                object.put(
                    "revokedAt",
                    record.revokedAt
                );
            }
        }

        object.put(
            "trustedAt",
            record.trustedAt
        );

        object.put(
            "updatedAt",
            record.updatedAt
        );

        object.put(
            "schemaVersion",
            record.schemaVersion
        );

        return object;
    }

    private static Record parseRecord(
        JSONObject object,
        int stateSchemaVersion
    ) throws Exception {

        int persistedRecordSchemaVersion =
            object.getInt(
                "schemaVersion"
            );

        if (
            persistedRecordSchemaVersion !=
            stateSchemaVersion
        ) {
            throw new IllegalStateException(
                "FINORA Branch Device Trust state and record schema versions do not match."
            );
        }

        boolean hasDemoId =
            object.has(
                "demoId"
            );

        String[] exactKeys =
            hasDemoId
                ? new String[] {
                    "authStateId",
                    "userId",
                    "canonicalUsername",
                    "ownerId",
                    "businessId",
                    "branchId",
                    "storageMode",
                    "dataContext",
                    "demoId",
                    "authGeneration",
                    "portableAuthFingerprintAlgorithm",
                    "portableAuthFingerprint",
                    "platform",
                    "installationId",
                    "bindingKeyId",
                    "fingerprintAlgorithm",
                    "publicKeyFingerprint",
                    "trustedAt",
                    "updatedAt",
                    "schemaVersion"
                }
                : new String[] {
                    "authStateId",
                    "userId",
                    "canonicalUsername",
                    "ownerId",
                    "businessId",
                    "branchId",
                    "storageMode",
                    "dataContext",
                    "authGeneration",
                    "portableAuthFingerprintAlgorithm",
                    "portableAuthFingerprint",
                    "platform",
                    "installationId",
                    "bindingKeyId",
                    "fingerprintAlgorithm",
                    "publicKeyFingerprint",
                    "trustedAt",
                    "updatedAt",
                    "schemaVersion"
                };

        if (stateSchemaVersion == 2) {
            String[] lifecycleKeys = object.has("revokedAt") ? new String[] {"status", "revokedAt"} : new String[] {"status"};
            String[] v2ExactKeys = new String[exactKeys.length + lifecycleKeys.length];
            System.arraycopy(exactKeys, 0, v2ExactKeys, 0, exactKeys.length);
            System.arraycopy(lifecycleKeys, 0, v2ExactKeys, exactKeys.length, lifecycleKeys.length);
            exactKeys = v2ExactKeys;
        }

        requireExactKeys(
            object,
            exactKeys,
            "Branch Device Trust record"
        );

        return new Record(
            requiredString(
                object,
                "authStateId"
            ),
            requiredString(
                object,
                "userId"
            ),
            requiredString(
                object,
                "canonicalUsername"
            ),
            requiredString(
                object,
                "ownerId"
            ),
            requiredString(
                object,
                "businessId"
            ),
            requiredString(
                object,
                "branchId"
            ),
            requiredString(
                object,
                "storageMode"
            ),
            requiredString(
                object,
                "dataContext"
            ),
            hasDemoId
                ? requiredString(
                    object,
                    "demoId"
                )
                : null,
            object.getLong(
                "authGeneration"
            ),
            requiredString(
                object,
                "portableAuthFingerprintAlgorithm"
            ),
            requiredString(
                object,
                "portableAuthFingerprint"
            ),
            requiredString(
                object,
                "platform"
            ),
            requiredString(
                object,
                "installationId"
            ),
            requiredString(
                object,
                "bindingKeyId"
            ),
            requiredString(
                object,
                "fingerprintAlgorithm"
            ),
            requiredString(
                object,
                "publicKeyFingerprint"
            ),
            stateSchemaVersion == 2
                ? requiredString(object, "status")
                : FinoraBranchDeviceTrustLifecycle.STATUS_ACTIVE,
            stateSchemaVersion == 2 && object.has("revokedAt")
                ? requiredString(object, "revokedAt")
                : null,
            requiredString(
                object,
                "trustedAt"
            ),
            requiredString(
                object,
                "updatedAt"
            ),
            stateSchemaVersion == LEGACY_SCHEMA_VERSION
                ? RECORD_SCHEMA_VERSION
                : object.getInt(
                    "schemaVersion"
                )
        );
    }

    // ========================================================
    // VALIDATION
    // ========================================================

    private static void validateRecord(
        Record record
    ) {

        if (record == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust record is required."
            );
        }

        requireNonEmpty(
            record.authStateId,
            "authStateId"
        );

        requireNonEmpty(
            record.userId,
            "userId"
        );

        requireNonEmpty(
            record.canonicalUsername,
            "canonicalUsername"
        );

        String canonical =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    record.canonicalUsername
                );

        if (
            canonical == null ||
            !record.canonicalUsername.equals(
                canonical
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust canonicalUsername is not canonical."
            );
        }

        requireNonEmpty(
            record.ownerId,
            "ownerId"
        );

        requireNonEmpty(
            record.businessId,
            "businessId"
        );

        requireNonEmpty(
            record.branchId,
            "branchId"
        );

        if (
            !"LOCAL".equals(
                record.storageMode
            ) &&
            !"USB".equals(
                record.storageMode
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust storageMode must be LOCAL or USB."
            );
        }

        if (
            !"REAL".equals(
                record.dataContext
            ) &&
            !"DEMO".equals(
                record.dataContext
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust dataContext must be REAL or DEMO."
            );
        }

        if ("DEMO".equals(record.dataContext)) {
            requireNonEmpty(
                record.demoId,
                "demoId"
            );
        }
        else if (record.demoId != null) {
            throw new IllegalArgumentException(
                "FINORA REAL Device Trust record must not contain demoId."
            );
        }

        if (record.authGeneration < 1L) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust authGeneration must be positive."
            );
        }

        if (!"SHA256".equals(
            record.portableAuthFingerprintAlgorithm
        )) {
            throw new IllegalArgumentException(
                "FINORA Portable Auth fingerprint algorithm must be SHA256."
            );
        }

        if (
            record.portableAuthFingerprint == null ||
            !PORTABLE_FINGERPRINT_PATTERN
                .matcher(
                    record.portableAuthFingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable Auth fingerprint must be canonical lowercase SHA-256 hex."
            );
        }

        if (
            !"WINDOWS".equals(
                record.platform
            ) &&
            !"ANDROID".equals(
                record.platform
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust platform must be WINDOWS or ANDROID."
            );
        }

        requireNonEmpty(
            record.installationId,
            "installationId"
        );

        requireNonEmpty(
            record.bindingKeyId,
            "bindingKeyId"
        );

        if (!"SHA-256".equals(
            record.fingerprintAlgorithm
        )) {
            throw new IllegalArgumentException(
                "FINORA native binding fingerprint algorithm must be SHA-256."
            );
        }

        if (
            record.publicKeyFingerprint == null ||
            !PUBLIC_KEY_FINGERPRINT_PATTERN
                .matcher(
                    record.publicKeyFingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA native public-key fingerprint must be SHA-256 hex."
            );
        }

        requireNonEmpty(
            record.trustedAt,
            "trustedAt"
        );

        requireNonEmpty(
            record.updatedAt,
            "updatedAt"
        );

        if (
            record.schemaVersion !=
            RECORD_SCHEMA_VERSION
        ) {
            throw new IllegalArgumentException(
                "Unsupported FINORA Branch Device Trust record schema version."
            );
        }
    }

    private static JSONObject parseRoot(
        String serialized
    ) throws Exception {

        if (
            serialized == null ||
            serialized.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Store root is empty."
            );
        }

        return new JSONObject(
            serialized
        );
    }

    private static String requiredString(
        JSONObject object,
        String key
    ) throws Exception {

        if (
            !object.has(key) ||
            object.isNull(key)
        ) {
            throw new IllegalStateException(
                "FINORA Branch Device Trust field is missing: " +
                key
            );
        }

        Object value =
            object.get(
                key
            );

        if (!(value instanceof String)) {
            throw new IllegalStateException(
                "FINORA Branch Device Trust field must be a string: " +
                key
            );
        }

        String text =
            (String) value;

        requireNonEmpty(
            text,
            key
        );

        return text;
    }

    private static void requireNonEmpty(
        String value,
        String field
    ) {

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust field is invalid: " +
                field
            );
        }
    }

    private static void requireExactKeys(
        JSONObject object,
        String[] expected,
        String label
    ) {

        java.util.HashSet<String> expectedSet =
            new java.util.HashSet<>();

        Collections.addAll(
            expectedSet,
            expected
        );

        java.util.HashSet<String> actualSet =
            new java.util.HashSet<>();

        Iterator<String> keys =
            object.keys();

        while (keys.hasNext()) {
            actualSet.add(
                keys.next()
            );
        }

        if (!actualSet.equals(expectedSet)) {
            throw new IllegalStateException(
                "FINORA " +
                label +
                " contains an unexpected field set."
            );
        }
    }

    // ========================================================
    // PRODUCTION CONTROL-STORE PORT
    // ========================================================

    private static final class NativeControlStatePort
        implements ControlStatePort {

        private final FinoraControlStore controlStore;

        NativeControlStatePort(
            Context context
        ) {

            if (context == null) {
                throw new IllegalArgumentException(
                    "FINORA Android Context is required."
                );
            }

            this.controlStore =
                new FinoraControlStore(
                    context
                );
        }

        @Override
        public String read()
            throws Exception {

            return controlStore.read();
        }

        @Override
        public void write(
            String serialized
        ) throws Exception {

            controlStore.write(
                serialized
            );
        }
    }
}