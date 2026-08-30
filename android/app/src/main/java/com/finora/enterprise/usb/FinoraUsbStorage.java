package com.finora.enterprise.usb;

import android.content.ContentResolver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.UriPermission;
import android.net.Uri;
import android.os.Environment;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.provider.DocumentsContract;

import androidx.documentfile.provider.DocumentFile;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;

/**
 * FINORA Android USB storage engine.
 *
 * Security model:
 *
 * - Uses Android Storage Access Framework only.
 * - Never scans arbitrary phone storage.
 * - Accepts a removable USB root or the exact FINORA/storage directory.
 * - Requires persisted READ + WRITE URI permission.
 * - Writes only:
 *
 *   <selected USB root>/FINORA/storage/finora-storage.json
 *
 * - Never falls back to LOCAL storage.
 * - Never formats or clears unrelated USB content.
 */
public final class FinoraUsbStorage {

    // ========================================================
    // CONSTANTS
    // ========================================================

    private static final String STORAGE_VERSION =
        "2.0";

    private static final String FINORA_DIRECTORY =
        "FINORA";

    private static final String STORAGE_DIRECTORY =
        "storage";

    private static final String STORAGE_FILE =
        "finora-storage.json";

    private static final String TEMP_FILE =
        "finora-storage.tmp.json";

    private static final String BACKUP_FILE =
        "finora-storage.backup.json";

    private static final String JSON_MIME_TYPE =
        "application/json";

    private static final String EXTERNAL_STORAGE_AUTHORITY =
        "com.android.externalstorage.documents";

    private static final String PREFERENCES_NAME =
        "finora_usb_storage";

    private static final String PREFERENCE_TREE_URI =
        "selected_usb_tree_uri";

    // ========================================================
    // STATE
    // ========================================================

    private final Context context;

    private final ContentResolver contentResolver;

    private final SharedPreferences preferences;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraUsbStorage(
        Context context
    ) {
        this.context =
            context.getApplicationContext();

        this.contentResolver =
            this.context.getContentResolver();

        this.preferences =
            this.context.getSharedPreferences(
                PREFERENCES_NAME,
                Context.MODE_PRIVATE
            );
    }

    // ========================================================
    // STATUS MODEL
    // ========================================================

    private static final class UsbTarget {

        final String availability;

        final String storageId;

        final String message;

        final Uri treeUri;

        final DocumentFile root;

        final DocumentFile storageDirectory;

        UsbTarget(
            String availability,
            String storageId,
            String message,
            Uri treeUri,
            DocumentFile root,
            DocumentFile storageDirectory
        ) {
            this.availability =
                availability;

            this.storageId =
                storageId;

            this.message =
                message;

            this.treeUri =
                treeUri;

            this.root =
                root;

            this.storageDirectory =
                storageDirectory;
        }

        boolean isReady() {
            return "READY".equals(
                availability
            );
        }
    }

    // ========================================================
    // PUBLIC STATUS
    // ========================================================

    public JSONObject getStatus() {
        UsbTarget target =
            resolveConfiguredTarget();

        return createStatusObject(
            target
        );
    }

    public boolean isAvailable() {
        return resolveConfiguredTarget()
            .isReady();
    }

    /**
     * Validate and remember a user-selected SAF tree.
     *
     * The caller must first persist Android's URI permission.
     */
    public JSONObject configureSelectedTree(
        Uri treeUri
    ) throws Exception {

        if (treeUri == null) {
            throw new IllegalArgumentException(
                "FINORA USB tree URI is required."
            );
        }

        if (
            !hasPersistedReadWritePermission(
                treeUri
            )
        ) {
            throw new IllegalStateException(
                "FINORA requires persistent read and write access to the selected USB."
            );
        }

        UsbTarget target =
            resolveTargetForUri(
                treeUri
            );

        if (!target.isReady()) {
            throw new IllegalStateException(
                target.message != null
                    ? target.message
                    : "Selected storage is not a valid FINORA USB."
            );
        }

        preferences
            .edit()
            .putString(
                PREFERENCE_TREE_URI,
                treeUri.toString()
            )
            .apply();

        return createStatusObject(
            target
        );
    }

    // ========================================================
    // CRUD: GET
    // ========================================================

    public JSONObject get(
        JSONObject query
    ) {
        String queryError =
            validateQuery(
                query
            );

        if (queryError != null) {
            return failure(
                queryError
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray records =
                storagePackage.getJSONArray(
                    "records"
                );

            for (
                int index = 0;
                index < records.length();
                index++
            ) {
                JSONObject record =
                    records.optJSONObject(
                        index
                    );

                if (record == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                if (
                    recordMatchesQuery(
                        record,
                        query
                    )
                ) {
                    return success(
                        getRecordData(
                            record
                        )
                    );
                }
            }

            return success();
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to read FINORA USB storage."
                )
            );
        }
    }

    // ========================================================
    // CRUD: GET ALL
    // ========================================================

    public JSONObject getAll(
        JSONObject query
    ) {
        String queryError =
            validateQuery(
                query
            );

        if (queryError != null) {
            return failure(
                queryError
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray records =
                storagePackage.getJSONArray(
                    "records"
                );

            int offset =
                getNonNegativeInteger(
                    query,
                    "offset",
                    0
                );

            Integer limit =
                getOptionalNonNegativeInteger(
                    query,
                    "limit"
                );

            JSONArray data =
                new JSONArray();

            int matchingIndex =
                0;

            for (
                int index = 0;
                index < records.length();
                index++
            ) {
                JSONObject record =
                    records.optJSONObject(
                        index
                    );

                if (record == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                if (
                    !recordMatchesQuery(
                        record,
                        query
                    )
                ) {
                    continue;
                }

                if (
                    matchingIndex <
                    offset
                ) {
                    matchingIndex++;
                    continue;
                }

                if (
                    limit != null &&
                    data.length() >= limit
                ) {
                    break;
                }

                data.put(
                    getRecordData(
                        record
                    )
                );

                matchingIndex++;
            }

            return success(
                data
            );
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to read FINORA USB records."
                )
            );
        }
    }

    // ========================================================
    // CRUD: SAVE
    // ========================================================

    public JSONObject save(
        JSONObject record,
        JSONObject options
    ) {
        if (record == null) {
            return failure(
                "A valid storage record is required."
            );
        }

        String entity =
            getStringValue(
                record,
                "entity"
            );

        if (
            entity == null ||
            entity.length() == 0
        ) {
            return failure(
                "Storage record entity is required."
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray records =
                storagePackage.getJSONArray(
                    "records"
                );

            String now =
                nowIso();

            String suppliedId =
                getStringValue(
                    record,
                    "id"
                );

            String id =
                suppliedId != null &&
                suppliedId.length() > 0
                    ? suppliedId
                    : UUID
                        .randomUUID()
                        .toString();

            String ownerId =
                getOptionalString(
                    options,
                    "ownerId"
                );

            String demoId =
                getOptionalString(
                    options,
                    "demoId"
                );

            for (
                int index = 0;
                index < records.length();
                index++
            ) {
                JSONObject existing =
                    records.optJSONObject(
                        index
                    );

                if (existing == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                if (
                    id.equals(
                        getOptionalString(
                            existing,
                            "id"
                        )
                    ) &&
                    entity.equals(
                        getOptionalString(
                            existing,
                            "entity"
                        )
                    ) &&
                    nullableEquals(
                        ownerId,
                        getOptionalString(
                            existing,
                            "ownerId"
                        )
                    ) &&
                    nullableEquals(
                        demoId,
                        getOptionalString(
                            existing,
                            "demoId"
                        )
                    )
                ) {
                    return failure(
                        "A storage record with the same ID already exists."
                    );
                }
            }

            JSONObject persistedRecord =
                new JSONObject();

            persistedRecord.put(
                "id",
                id
            );

            persistedRecord.put(
                "entity",
                entity
            );

            persistedRecord.put(
                "data",
                recordDataForPersistence(
                    record
                )
            );

            String createdAt =
                getStringValue(
                    record,
                    "createdAt"
                );

            persistedRecord.put(
                "createdAt",
                createdAt != null
                    ? createdAt
                    : now
            );

            persistedRecord.put(
                "updatedAt",
                now
            );

            putOptionalString(
                persistedRecord,
                "ownerId",
                ownerId
            );

            putOptionalString(
                persistedRecord,
                "demoId",
                demoId
            );

            records.put(
                persistedRecord
            );

            writeStoragePackage(
                target,
                storagePackage
            );

            return success(
                persistedRecord.get(
                    "data"
                )
            );
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to save FINORA USB record."
                )
            );
        }
    }

    // ========================================================
    // CRUD: UPDATE
    // ========================================================

    public JSONObject update(
        JSONObject record,
        JSONObject options
    ) {
        if (record == null) {
            return failure(
                "A valid storage record is required."
            );
        }

        String entity =
            getStringValue(
                record,
                "entity"
            );

        String id =
            getStringValue(
                record,
                "id"
            );

        if (
            entity == null ||
            entity.length() == 0
        ) {
            return failure(
                "Storage record entity is required."
            );
        }

        if (
            id == null ||
            id.length() == 0
        ) {
            return failure(
                "Storage record ID is required for update."
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray records =
                storagePackage.getJSONArray(
                    "records"
                );

            String ownerId =
                getOptionalString(
                    options,
                    "ownerId"
                );

            String demoId =
                getOptionalString(
                    options,
                    "demoId"
                );

            int matchIndex =
                -1;

            JSONObject existing =
                null;

            for (
                int index = 0;
                index < records.length();
                index++
            ) {
                JSONObject candidate =
                    records.optJSONObject(
                        index
                    );

                if (candidate == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                if (
                    id.equals(
                        getOptionalString(
                            candidate,
                            "id"
                        )
                    ) &&
                    entity.equals(
                        getOptionalString(
                            candidate,
                            "entity"
                        )
                    ) &&
                    nullableEquals(
                        ownerId,
                        getOptionalString(
                            candidate,
                            "ownerId"
                        )
                    ) &&
                    nullableEquals(
                        demoId,
                        getOptionalString(
                            candidate,
                            "demoId"
                        )
                    )
                ) {
                    matchIndex =
                        index;

                    existing =
                        candidate;

                    break;
                }
            }

            if (
                matchIndex < 0 ||
                existing == null
            ) {
                return failure(
                    "FINORA storage record was not found."
                );
            }

            JSONObject updatedRecord =
                new JSONObject(
                    existing.toString()
                );

            updatedRecord.put(
                "data",
                recordDataForPersistence(
                    record
                )
            );

            updatedRecord.put(
                "updatedAt",
                nowIso()
            );

            records.put(
                matchIndex,
                updatedRecord
            );

            writeStoragePackage(
                target,
                storagePackage
            );

            return success(
                updatedRecord.get(
                    "data"
                )
            );
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to update FINORA USB record."
                )
            );
        }
    }

    // ========================================================
    // CRUD: DELETE
    // ========================================================

    public JSONObject delete(
        JSONObject query
    ) {
        String queryError =
            validateQuery(
                query
            );

        if (queryError != null) {
            return failure(
                queryError
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray records =
                storagePackage.getJSONArray(
                    "records"
                );

            JSONArray remaining =
                new JSONArray();

            boolean deleted =
                false;

            for (
                int index = 0;
                index < records.length();
                index++
            ) {
                JSONObject record =
                    records.optJSONObject(
                        index
                    );

                if (record == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                if (
                    recordMatchesQuery(
                        record,
                        query
                    )
                ) {
                    deleted =
                        true;
                } else {
                    remaining.put(
                        record
                    );
                }
            }

            if (deleted) {
                storagePackage.put(
                    "records",
                    remaining
                );

                writeStoragePackage(
                    target,
                    storagePackage
                );
            }

            return success();
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to delete FINORA USB record."
                )
            );
        }
    }

    // ========================================================
    // CRUD: REPLACE ALL
    // ========================================================

    public JSONObject replaceAll(
        JSONArray sourceRecords,
        JSONObject options
    ) {
        if (sourceRecords == null) {
            return failure(
                "Storage records must be an array."
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            String ownerId =
                getOptionalString(
                    options,
                    "ownerId"
                );

            String demoId =
                getOptionalString(
                    options,
                    "demoId"
                );

            String now =
                nowIso();

            JSONArray preparedRecords =
                new JSONArray();

            for (
                int index = 0;
                index < sourceRecords.length();
                index++
            ) {
                JSONObject source =
                    sourceRecords.optJSONObject(
                        index
                    );

                if (source == null) {
                    return failure(
                        "Every storage record must contain an entity."
                    );
                }

                String entity =
                    getStringValue(
                        source,
                        "entity"
                    );

                /*
                 * Electron replaceAll parity:
                 *
                 * entity must be a string, but an empty string is still
                 * technically accepted by the existing desktop handler.
                 */
                if (entity == null) {
                    return failure(
                        "Every storage record must contain an entity."
                    );
                }

                String suppliedId =
                    getStringValue(
                        source,
                        "id"
                    );

                JSONObject prepared =
                    new JSONObject();

                prepared.put(
                    "id",
                    suppliedId != null &&
                    suppliedId.length() > 0
                        ? suppliedId
                        : UUID
                            .randomUUID()
                            .toString()
                );

                prepared.put(
                    "entity",
                    entity
                );

                prepared.put(
                    "data",
                    recordDataForPersistence(
                        source
                    )
                );

                String createdAt =
                    getStringValue(
                        source,
                        "createdAt"
                    );

                prepared.put(
                    "createdAt",
                    createdAt != null
                        ? createdAt
                        : now
                );

                prepared.put(
                    "updatedAt",
                    now
                );

                putOptionalString(
                    prepared,
                    "ownerId",
                    ownerId
                );

                putOptionalString(
                    prepared,
                    "demoId",
                    demoId
                );

                preparedRecords.put(
                    prepared
                );
            }

            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray existingRecords =
                storagePackage.getJSONArray(
                    "records"
                );

            JSONArray finalRecords =
                new JSONArray();

            for (
                int existingIndex = 0;
                existingIndex < existingRecords.length();
                existingIndex++
            ) {
                JSONObject existing =
                    existingRecords.optJSONObject(
                        existingIndex
                    );

                if (existing == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                boolean replaced =
                    false;

                for (
                    int replacementIndex = 0;
                    replacementIndex < preparedRecords.length();
                    replacementIndex++
                ) {
                    JSONObject replacement =
                        preparedRecords.getJSONObject(
                            replacementIndex
                        );

                    if (
                        nullableEquals(
                            getOptionalString(
                                replacement,
                                "entity"
                            ),
                            getOptionalString(
                                existing,
                                "entity"
                            )
                        ) &&
                        nullableEquals(
                            getOptionalString(
                                replacement,
                                "ownerId"
                            ),
                            getOptionalString(
                                existing,
                                "ownerId"
                            )
                        ) &&
                        nullableEquals(
                            getOptionalString(
                                replacement,
                                "demoId"
                            ),
                            getOptionalString(
                                existing,
                                "demoId"
                            )
                        )
                    ) {
                        replaced =
                            true;

                        break;
                    }
                }

                if (!replaced) {
                    finalRecords.put(
                        existing
                    );
                }
            }

            for (
                int index = 0;
                index < preparedRecords.length();
                index++
            ) {
                finalRecords.put(
                    preparedRecords.get(
                        index
                    )
                );
            }

            storagePackage.put(
                "records",
                finalRecords
            );

            writeStoragePackage(
                target,
                storagePackage
            );

            return success();
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to replace FINORA USB records."
                )
            );
        }
    }

    // ========================================================
    // CRUD: CLEAR
    // ========================================================

    public JSONObject clear(
        JSONObject query
    ) {
        String queryError =
            validateQuery(
                query
            );

        if (queryError != null) {
            return failure(
                queryError
            );
        }

        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            JSONObject storagePackage =
                readStoragePackage(
                    target
                );

            JSONArray records =
                storagePackage.getJSONArray(
                    "records"
                );

            JSONArray remaining =
                new JSONArray();

            for (
                int index = 0;
                index < records.length();
                index++
            ) {
                JSONObject record =
                    records.optJSONObject(
                        index
                    );

                if (record == null) {
                    throw new IllegalStateException(
                        "FINORA USB storage contains an invalid record."
                    );
                }

                if (
                    !recordMatchesQuery(
                        record,
                        query
                    )
                ) {
                    remaining.put(
                        record
                    );
                }
            }

            storagePackage.put(
                "records",
                remaining
            );

            writeStoragePackage(
                target,
                storagePackage
            );

            return success();
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to clear FINORA USB records."
                )
            );
        }
    }

    // ========================================================
    // CRUD: RESET FINORA DATA
    // ========================================================

    public JSONObject resetFinoraData() {
        UsbTarget target =
            resolveConfiguredTarget();

        if (!target.isReady()) {
            return failure(
                statusFailureMessage(
                    target
                )
            );
        }

        try {
            writeStoragePackage(
                target,
                createEmptyStoragePackage()
            );

            return success();
        } catch (Exception error) {
            return failure(
                errorMessage(
                    error,
                    "Unable to reset FINORA USB data."
                )
            );
        }
    }

    // ========================================================
    // CONFIGURED TARGET RESOLUTION
    // ========================================================

    private UsbTarget resolveConfiguredTarget() {
        String rawTreeUri =
            preferences.getString(
                PREFERENCE_TREE_URI,
                null
            );

        if (
            rawTreeUri == null ||
            rawTreeUri.trim().isEmpty()
        ) {
            return targetFailure(
                "NOT_CONFIGURED",
                null,
                "FINORA USB storage access has not been selected."
            );
        }

        final Uri treeUri;

        try {
            treeUri =
                Uri.parse(
                    rawTreeUri
                );
        } catch (Exception error) {
            preferences
                .edit()
                .remove(
                    PREFERENCE_TREE_URI
                )
                .apply();

            return targetFailure(
                "NOT_CONFIGURED",
                null,
                "FINORA USB storage access must be selected again."
            );
        }

        if (
            !hasPersistedReadWritePermission(
                treeUri
            )
        ) {
            preferences
                .edit()
                .remove(
                    PREFERENCE_TREE_URI
                )
                .apply();

            return targetFailure(
                "NOT_CONFIGURED",
                null,
                "FINORA USB storage permission is no longer available."
            );
        }

        return resolveTargetForUri(
            treeUri
        );
    }

    // ========================================================
    // SAF USB VALIDATION
    // ========================================================

    private UsbTarget resolveTargetForUri(
        Uri treeUri
    ) {
        try {
            if (
                !EXTERNAL_STORAGE_AUTHORITY.equals(
                    treeUri.getAuthority()
                )
            ) {
                return targetFailure(
                    "UNAVAILABLE",
                    null,
                    "FINORA accepts only an approved removable USB storage location."
                );
            }

            String treeDocumentId =
                DocumentsContract
                    .getTreeDocumentId(
                        treeUri
                    );

            if (treeDocumentId == null) {
                return targetFailure(
                    "UNAVAILABLE",
                    null,
                    "FINORA USB storage selection is invalid."
                );
            }

            int separatorIndex =
                treeDocumentId.indexOf(
                    ':'
                );

            if (separatorIndex <= 0) {
                return targetFailure(
                    "UNAVAILABLE",
                    null,
                    "FINORA USB storage selection is invalid."
                );
            }

            String volumeId =
                treeDocumentId.substring(
                    0,
                    separatorIndex
                );

            String relativePath =
                treeDocumentId.substring(
                    separatorIndex + 1
                );

            boolean selectedUsbRoot =
                relativePath.length() == 0;

            boolean selectedFinoraStorageDirectory =
                (
                    FINORA_DIRECTORY +
                    "/" +
                    STORAGE_DIRECTORY
                ).equals(
                    relativePath
                );

            if (
                !selectedUsbRoot &&
                !selectedFinoraStorageDirectory
            ) {
                return targetFailure(
                    "UNAVAILABLE",
                    "USB:" + volumeId,
                    "Select the USB root or the FINORA/storage folder."
                );
            }

            if (
                "primary".equalsIgnoreCase(
                    volumeId
                )
            ) {
                return targetFailure(
                    "UNAVAILABLE",
                    null,
                    "Internal phone storage cannot be used as FINORA USB storage."
                );
            }

            StorageManager storageManager =
                (StorageManager)
                    context.getSystemService(
                        Context.STORAGE_SERVICE
                    );

            if (storageManager == null) {
                return targetFailure(
                    "ERROR",
                    null,
                    "Android storage service is unavailable."
                );
            }

            StorageVolume matchedVolume =
                null;

            List<StorageVolume> volumes =
                storageManager
                    .getStorageVolumes();

            for (
                StorageVolume volume :
                volumes
            ) {
                if (
                    volume == null ||
                    !volume.isRemovable()
                ) {
                    continue;
                }

                String uuid =
                    volume.getUuid();

                if (
                    uuid != null &&
                    uuid.equalsIgnoreCase(
                        volumeId
                    )
                ) {
                    matchedVolume =
                        volume;

                    break;
                }
            }

            if (matchedVolume == null) {
                return targetFailure(
                    "DISCONNECTED",
                    "USB:" + volumeId,
                    "FINORA USB storage is disconnected."
                );
            }

            String volumeState =
                matchedVolume.getState();

            if (
                Environment
                    .MEDIA_MOUNTED_READ_ONLY
                    .equals(
                        volumeState
                    )
            ) {
                return targetFailure(
                    "UNAVAILABLE",
                    "USB:" + volumeId,
                    "FINORA USB storage is read-only."
                );
            }

            if (
                !Environment
                    .MEDIA_MOUNTED
                    .equals(
                        volumeState
                    )
            ) {
                return targetFailure(
                    "DISCONNECTED",
                    "USB:" + volumeId,
                    "FINORA USB storage is disconnected."
                );
            }

            DocumentFile root =
                DocumentFile.fromTreeUri(
                    context,
                    treeUri
                );

            if (
                root == null ||
                !root.exists() ||
                !root.isDirectory()
            ) {
                return targetFailure(
                    "ERROR",
                    "USB:" + volumeId,
                    "Unable to access the selected FINORA USB location."
                );
            }

            if (!root.canWrite()) {
                return targetFailure(
                    "UNAVAILABLE",
                    "USB:" + volumeId,
                    "FINORA does not have write access to the selected USB."
                );
            }

            DocumentFile storageDirectory;

            if (selectedFinoraStorageDirectory) {
                storageDirectory =
                    root;
            } else {
                DocumentFile finoraDirectory =
                    ensureDirectory(
                        root,
                        FINORA_DIRECTORY
                    );

                storageDirectory =
                    ensureDirectory(
                        finoraDirectory,
                        STORAGE_DIRECTORY
                    );
            }

            return new UsbTarget(
                "READY",
                "USB:" + volumeId,
                "FINORA USB storage is ready.",
                treeUri,
                root,
                storageDirectory
            );
        } catch (Exception error) {
            return targetFailure(
                "ERROR",
                null,
                errorMessage(
                    error,
                    "Unable to validate FINORA USB storage."
                )
            );
        }
    }

    // ========================================================
    // PERSISTED URI PERMISSION
    // ========================================================

    private boolean hasPersistedReadWritePermission(
        Uri treeUri
    ) {
        List<UriPermission> permissions =
            contentResolver
                .getPersistedUriPermissions();

        for (
            UriPermission permission :
            permissions
        ) {
            if (
                permission != null &&
                treeUri.equals(
                    permission.getUri()
                ) &&
                permission.isReadPermission() &&
                permission.isWritePermission()
            ) {
                return true;
            }
        }

        return false;
    }

    // ========================================================
    // PACKAGE READ
    // ========================================================

    private JSONObject readStoragePackage(
        UsbTarget target
    ) throws Exception {

        DocumentFile storageFile =
            resolveRecoverableStorageFile(
                target.storageDirectory
            );

        if (storageFile == null) {
            JSONObject emptyPackage =
                createEmptyStoragePackage();

            writeStoragePackage(
                target,
                emptyPackage
            );

            storageFile =
                target
                    .storageDirectory
                    .findFile(
                        STORAGE_FILE
                    );

            if (storageFile == null) {
                throw new IllegalStateException(
                    "Unable to create FINORA USB storage file."
                );
            }
        }

        String raw =
            readTextFile(
                storageFile
            );

        JSONObject storagePackage =
            new JSONObject(
                raw
            );

        validateStoragePackage(
            storagePackage
        );

        return storagePackage;
    }

    // ========================================================
    // PACKAGE WRITE
    // ========================================================

    private void writeStoragePackage(
        UsbTarget target,
        JSONObject storagePackage
    ) throws Exception {

        validateStoragePackage(
            storagePackage
        );

        storagePackage.put(
            "updatedAt",
            nowIso()
        );

        String serialized =
            storagePackage.toString(
                2
            );

        DocumentFile directory =
            target.storageDirectory;

        deleteIfPresent(
            directory,
            TEMP_FILE
        );

        DocumentFile tempFile =
            directory.createFile(
                JSON_MIME_TYPE,
                TEMP_FILE
            );

        if (tempFile == null) {
            throw new IllegalStateException(
                "Unable to create FINORA USB temporary storage file."
            );
        }

        writeTextFile(
            tempFile,
            serialized
        );

        DocumentFile currentFile =
            directory.findFile(
                STORAGE_FILE
            );

        deleteIfPresent(
            directory,
            BACKUP_FILE
        );

        if (currentFile == null) {
            if (
                tempFile.renameTo(
                    STORAGE_FILE
                )
            ) {
                return;
            }

            DocumentFile finalFile =
                directory.createFile(
                    JSON_MIME_TYPE,
                    STORAGE_FILE
                );

            if (finalFile == null) {
                throw new IllegalStateException(
                    "Unable to create FINORA USB storage file."
                );
            }

            writeTextFile(
                finalFile,
                serialized
            );

            tempFile.delete();

            return;
        }

        boolean currentMovedToBackup =
            currentFile.renameTo(
                BACKUP_FILE
            );

        if (!currentMovedToBackup) {
            /*
             * Some DocumentsProvider implementations do not support
             * rename. Keep functionality available by replacing the
             * existing document only after the complete temp document
             * has already been written successfully.
             */
            writeTextFile(
                currentFile,
                serialized
            );

            tempFile.delete();

            return;
        }

        boolean tempMovedToFinal =
            tempFile.renameTo(
                STORAGE_FILE
            );

        if (!tempMovedToFinal) {
            DocumentFile finalFile =
                directory.createFile(
                    JSON_MIME_TYPE,
                    STORAGE_FILE
                );

            if (finalFile != null) {
                try {
                    writeTextFile(
                        finalFile,
                        serialized
                    );

                    tempFile.delete();

                    deleteIfPresent(
                        directory,
                        BACKUP_FILE
                    );

                    return;
                } catch (Exception writeError) {
                    finalFile.delete();
                }
            }

            DocumentFile backupFile =
                directory.findFile(
                    BACKUP_FILE
                );

            if (backupFile != null) {
                backupFile.renameTo(
                    STORAGE_FILE
                );
            }

            throw new IllegalStateException(
                "Unable to replace FINORA USB storage file."
            );
        }

        deleteIfPresent(
            directory,
            BACKUP_FILE
        );
    }

    // ========================================================
    // WRITE RECOVERY
    // ========================================================

    private DocumentFile resolveRecoverableStorageFile(
        DocumentFile directory
    ) throws Exception {

        DocumentFile finalFile =
            directory.findFile(
                STORAGE_FILE
            );

        if (finalFile != null) {
            return finalFile;
        }

        DocumentFile backupFile =
            directory.findFile(
                BACKUP_FILE
            );

        if (backupFile != null) {
            if (
                backupFile.renameTo(
                    STORAGE_FILE
                )
            ) {
                return backupFile;
            }

            return backupFile;
        }

        DocumentFile tempFile =
            directory.findFile(
                TEMP_FILE
            );

        if (tempFile != null) {
            try {
                JSONObject candidate =
                    new JSONObject(
                        readTextFile(
                            tempFile
                        )
                    );

                validateStoragePackage(
                    candidate
                );

                if (
                    tempFile.renameTo(
                        STORAGE_FILE
                    )
                ) {
                    return tempFile;
                }

                return tempFile;
            } catch (Exception ignored) {
                tempFile.delete();
            }
        }

        return null;
    }

    // ========================================================
    // PACKAGE VALIDATION
    // ========================================================

    private void validateStoragePackage(
        JSONObject storagePackage
    ) {
        if (storagePackage == null) {
            throw new IllegalStateException(
                "FINORA USB storage package is missing."
            );
        }

        if (
            !STORAGE_VERSION.equals(
                storagePackage.optString(
                    "version",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "Unsupported FINORA USB storage package version."
            );
        }

        JSONArray records =
            storagePackage.optJSONArray(
                "records"
            );

        if (records == null) {
            throw new IllegalStateException(
                "FINORA USB storage records are invalid."
            );
        }

        for (
            int index = 0;
            index < records.length();
            index++
        ) {
            if (
                records.optJSONObject(
                    index
                ) == null
            ) {
                throw new IllegalStateException(
                    "FINORA USB storage contains an invalid record."
                );
            }
        }
    }

    private JSONObject createEmptyStoragePackage()
        throws Exception {

        JSONObject result =
            new JSONObject();

        result.put(
            "version",
            STORAGE_VERSION
        );

        result.put(
            "records",
            new JSONArray()
        );

        result.put(
            "updatedAt",
            nowIso()
        );

        return result;
    }

    // ========================================================
    // QUERY
    // ========================================================

    private String validateQuery(
        JSONObject query
    ) {
        if (query == null) {
            return "A valid storage query is required.";
        }

        String entity =
            getStringValue(
                query,
                "entity"
            );

        if (
            entity == null ||
            entity.length() == 0
        ) {
            return "Storage query entity is required.";
        }

        if (
            query.has(
                "offset"
            ) &&
            !isNonNegativeInteger(
                query.opt(
                    "offset"
                )
            )
        ) {
            return "Storage query offset must be a non-negative integer.";
        }

        if (
            query.has(
                "limit"
            ) &&
            !isNonNegativeInteger(
                query.opt(
                    "limit"
                )
            )
        ) {
            return "Storage query limit must be a non-negative integer.";
        }

        return null;
    }

    private boolean recordMatchesQuery(
        JSONObject record,
        JSONObject query
    ) {
        String entity =
            getStringValue(
                query,
                "entity"
            );

        if (
            !nullableEquals(
                entity,
                getOptionalString(
                    record,
                    "entity"
                )
            )
        ) {
            return false;
        }

        String queryId =
            getOptionalString(
                query,
                "id"
            );

        if (
            queryId != null &&
            !nullableEquals(
                queryId,
                getOptionalString(
                    record,
                    "id"
                )
            )
        ) {
            return false;
        }

        String queryOwnerId =
            getOptionalString(
                query,
                "ownerId"
            );

        if (
            queryOwnerId != null &&
            !nullableEquals(
                queryOwnerId,
                getOptionalString(
                    record,
                    "ownerId"
                )
            )
        ) {
            return false;
        }

        String queryDemoId =
            getOptionalString(
                query,
                "demoId"
            );

        if (
            queryDemoId != null &&
            !nullableEquals(
                queryDemoId,
                getOptionalString(
                    record,
                    "demoId"
                )
            )
        ) {
            return false;
        }

        return true;
    }

    // ========================================================
    // RECORD DATA
    // ========================================================

    private Object recordDataForPersistence(
        JSONObject record
    ) throws Exception {

        Object explicitData =
            record.opt(
                "data"
            );

        if (
            explicitData != null &&
            explicitData != JSONObject.NULL
        ) {
            return deepCopyJsonValue(
                explicitData
            );
        }

        return new JSONObject(
            record.toString()
        );
    }

    private Object getRecordData(
        JSONObject record
    ) throws Exception {

        Object data =
            record.opt(
                "data"
            );

        if (
            data == null ||
            data == JSONObject.NULL
        ) {
            return JSONObject.NULL;
        }

        return deepCopyJsonValue(
            data
        );
    }

    private Object deepCopyJsonValue(
        Object value
    ) throws Exception {

        if (value instanceof JSONObject) {
            return new JSONObject(
                value.toString()
            );
        }

        if (value instanceof JSONArray) {
            return new JSONArray(
                value.toString()
            );
        }

        return value;
    }

    // ========================================================
    // DOCUMENT HELPERS
    // ========================================================

    private DocumentFile ensureDirectory(
        DocumentFile parent,
        String name
    ) {
        DocumentFile existing =
            parent.findFile(
                name
            );

        if (existing != null) {
            if (!existing.isDirectory()) {
                throw new IllegalStateException(
                    "FINORA USB path conflicts with an existing file: " +
                    name
                );
            }

            return existing;
        }

        DocumentFile created =
            parent.createDirectory(
                name
            );

        if (created == null) {
            throw new IllegalStateException(
                "Unable to create FINORA USB directory: " +
                name
            );
        }

        return created;
    }

    private String readTextFile(
        DocumentFile file
    ) throws Exception {

        InputStream inputStream =
            contentResolver.openInputStream(
                file.getUri()
            );

        if (inputStream == null) {
            throw new IllegalStateException(
                "Unable to open FINORA USB storage file."
            );
        }

        StringBuilder builder =
            new StringBuilder();

        try (
            BufferedReader reader =
                new BufferedReader(
                    new InputStreamReader(
                        inputStream,
                        StandardCharsets.UTF_8
                    )
                )
        ) {
            String line;

            while (
                (line = reader.readLine()) !=
                null
            ) {
                builder.append(
                    line
                );

                builder.append(
                    '\n'
                );
            }
        }

        return builder.toString();
    }

    private void writeTextFile(
        DocumentFile file,
        String content
    ) throws Exception {

        OutputStream outputStream =
            contentResolver.openOutputStream(
                file.getUri(),
                "rwt"
            );

        if (outputStream == null) {
            throw new IllegalStateException(
                "Unable to open FINORA USB storage file for writing."
            );
        }

        try (
            BufferedWriter writer =
                new BufferedWriter(
                    new OutputStreamWriter(
                        outputStream,
                        StandardCharsets.UTF_8
                    )
                )
        ) {
            writer.write(
                content
            );

            writer.flush();
        }
    }

    private void deleteIfPresent(
        DocumentFile directory,
        String name
    ) {
        DocumentFile existing =
            directory.findFile(
                name
            );

        if (existing != null) {
            existing.delete();
        }
    }

    // ========================================================
    // RESULT HELPERS
    // ========================================================

    private JSONObject createStatusObject(
        UsbTarget target
    ) {
        JSONObject result =
            new JSONObject();

        try {
            result.put(
                "availability",
                target.availability
            );

            if (
                target.storageId != null
            ) {
                result.put(
                    "storageId",
                    target.storageId
                );
            }

            if (
                target.message != null
            ) {
                result.put(
                    "message",
                    target.message
                );
            }
        } catch (Exception ignored) {
            // JSONObject.put with these primitive values should
            // not fail under normal circumstances.
        }

        return result;
    }

    private JSONObject success() {
        JSONObject result =
            new JSONObject();

        try {
            result.put(
                "success",
                true
            );
        } catch (Exception ignored) {
        }

        return result;
    }

    private JSONObject success(
        Object data
    ) {
        JSONObject result =
            success();

        if (
            data == null ||
            data == JSONObject.NULL
        ) {
            return result;
        }

        try {
            result.put(
                "data",
                data
            );
        } catch (Exception ignored) {
        }

        return result;
    }

    private JSONObject failure(
        String message
    ) {
        JSONObject result =
            new JSONObject();

        try {
            result.put(
                "success",
                false
            );

            result.put(
                "error",
                message
            );
        } catch (Exception ignored) {
        }

        return result;
    }

    private UsbTarget targetFailure(
        String availability,
        String storageId,
        String message
    ) {
        return new UsbTarget(
            availability,
            storageId,
            message,
            null,
            null,
            null
        );
    }

    private String statusFailureMessage(
        UsbTarget target
    ) {
        if (
            target.message != null &&
            !target.message.trim().isEmpty()
        ) {
            return target.message;
        }

        return "FINORA USB storage is not ready.";
    }

    // ========================================================
    // VALUE HELPERS
    // ========================================================

    private String getStringValue(
        JSONObject object,
        String key
    ) {
        if (object == null) {
            return null;
        }

        Object value =
            object.opt(
                key
            );

        return value instanceof String
            ? (String) value
            : null;
    }

    private String getOptionalString(
        JSONObject object,
        String key
    ) {
        return getStringValue(
            object,
            key
        );
    }

    private void putOptionalString(
        JSONObject object,
        String key,
        String value
    ) throws Exception {
        if (value != null) {
            object.put(
                key,
                value
            );
        }
    }

    private boolean nullableEquals(
        String first,
        String second
    ) {
        if (first == null) {
            return second == null;
        }

        return first.equals(
            second
        );
    }

    private boolean isNonNegativeInteger(
        Object value
    ) {
        if (!(value instanceof Number)) {
            return false;
        }

        double number =
            ((Number) value)
                .doubleValue();

        return number >= 0 &&
            number == Math.floor(
                number
            ) &&
            number <= Integer.MAX_VALUE;
    }

    private int getNonNegativeInteger(
        JSONObject object,
        String key,
        int fallback
    ) {
        Object value =
            object.opt(
                key
            );

        if (
            !isNonNegativeInteger(
                value
            )
        ) {
            return fallback;
        }

        return ((Number) value)
            .intValue();
    }

    private Integer getOptionalNonNegativeInteger(
        JSONObject object,
        String key
    ) {
        if (
            !object.has(
                key
            )
        ) {
            return null;
        }

        Object value =
            object.opt(
                key
            );

        if (
            !isNonNegativeInteger(
                value
            )
        ) {
            return null;
        }

        return ((Number) value)
            .intValue();
    }

    // ========================================================
    // TIME / ERROR HELPERS
    // ========================================================

    private String nowIso() {
        SimpleDateFormat formatter =
            new SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.US
            );

        formatter.setTimeZone(
            TimeZone.getTimeZone(
                "UTC"
            )
        );

        return formatter.format(
            new Date()
        );
    }

    private String errorMessage(
        Exception error,
        String fallback
    ) {
        if (
            error == null ||
            error.getMessage() == null ||
            error.getMessage().trim().isEmpty()
        ) {
            return fallback;
        }

        return error.getMessage();
    }
}
