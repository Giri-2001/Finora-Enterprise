package com.finora.enterprise.usb;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * FINORA Android USB Capacitor bridge.
 *
 * Responsibilities:
 *
 * - Expose FINORA USB status to the renderer.
 * - Launch the Android SAF tree picker only from an explicit
 *   renderer request.
 * - Persist Android read/write tree permission.
 * - Delegate all FINORA USB JSON CRUD operations to
 *   FinoraUsbStorage.
 *
 * Security:
 *
 * - No LOCAL fallback.
 * - No broad filesystem permission.
 * - No arbitrary path supplied by renderer.
 * - The selected SAF tree is independently validated by
 *   FinoraUsbStorage as a removable USB root or the exact
 *   FINORA/storage directory.
 */
@CapacitorPlugin(
    name = "FinoraUsb"
)
public final class FinoraUsbPlugin
    extends Plugin {

    // ========================================================
    // STATE
    // ========================================================

    private FinoraUsbStorage usbStorage;

    // ========================================================
    // LOAD
    // ========================================================

    @Override
    public void load() {
        this.usbStorage =
            new FinoraUsbStorage(
                getContext()
            );

        super.load();
    }

    // ========================================================
    // AVAILABILITY
    // ========================================================

    @PluginMethod
    public void isAvailable(
        PluginCall call
    ) {
        try {
            ensureInitialized();

            JSObject result =
                new JSObject();

            result.put(
                "value",
                usbStorage.isAvailable()
            );

            call.resolve(
                result
            );
        } catch (Exception error) {
            /*
             * Renderer contract for isAvailable() expects:
             *
             * Promise<{ value: boolean }>
             *
             * Fail closed instead of reporting an unavailable
             * device as READY.
             */
            JSObject result =
                new JSObject();

            result.put(
                "value",
                false
            );

            call.resolve(
                result
            );
        }
    }

    // ========================================================
    // STATUS
    // ========================================================

    @PluginMethod
    public void getStatus(
        PluginCall call
    ) {
        try {
            ensureInitialized();

            call.resolve(
                toJsObject(
                    usbStorage.getStatus()
                )
            );
        } catch (Exception error) {
            JSObject result =
                new JSObject();

            result.put(
                "availability",
                "ERROR"
            );

            result.put(
                "message",
                errorMessage(
                    error,
                    "Unable to determine FINORA USB storage status."
                )
            );

            call.resolve(
                result
            );
        }
    }

    // ========================================================
    // REQUEST SAF ACCESS
    // ========================================================

    /**
     * Explicit user-triggered USB selection.
     *
     * Android 24+ compatible:
     *
     * ACTION_OPEN_DOCUMENT_TREE is used directly rather than
     * StorageVolume.createOpenDocumentTreeIntent(), which starts
     * only at API 29.
     */
    @PluginMethod
    public void requestAccess(
        PluginCall call
    ) {
        try {
            ensureInitialized();

            Intent intent =
                new Intent(
                    Intent.ACTION_OPEN_DOCUMENT_TREE
                );

            intent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION |
                Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "usbTreeSelected"
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to open FINORA USB storage selector."
                )
            );
        }
    }

    // ========================================================
    // SAF CALLBACK
    // ========================================================

    @ActivityCallback
    private void usbTreeSelected(
        PluginCall call,
        ActivityResult result
    ) {
        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                Activity.RESULT_OK
        ) {
            resolveFailure(
                call,
                "FINORA USB storage selection was cancelled."
            );

            return;
        }

        Intent data =
            result.getData();

        if (data == null) {
            resolveFailure(
                call,
                "Android did not return a FINORA USB storage selection."
            );

            return;
        }

        Uri treeUri =
            data.getData();

        if (treeUri == null) {
            resolveFailure(
                call,
                "Android did not return a valid FINORA USB tree URI."
            );

            return;
        }

        int permissionFlags =
            data.getFlags() &
            (
                Intent.FLAG_GRANT_READ_URI_PERMISSION |
                Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );

        boolean persisted =
            false;

        try {
            /*
             * FINORA requires BOTH read and write access.
             */
            if (
                (
                    permissionFlags &
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                ) == 0 ||
                (
                    permissionFlags &
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                ) == 0
            ) {
                resolveFailure(
                    call,
                    "FINORA requires read and write access to the selected USB."
                );

                return;
            }

            getContext()
                .getContentResolver()
                .takePersistableUriPermission(
                    treeUri,
                    permissionFlags
                );

            persisted =
                true;

            ensureInitialized();

            JSONObject status =
                usbStorage.configureSelectedTree(
                    treeUri
                );

            JSObject response =
                createSuccessResult();

            response.put(
                "data",
                status
            );

            call.resolve(
                response
            );
        } catch (Exception error) {
            /*
             * If the user selected internal storage, an unsupported
             * subfolder, or another invalid target, do not keep an unnecessary
             * persisted grant.
             */
            if (persisted) {
                try {
                    getContext()
                        .getContentResolver()
                        .releasePersistableUriPermission(
                            treeUri,
                            permissionFlags
                        );
                } catch (Exception ignored) {
                    // Best-effort cleanup only.
                }
            }

            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to configure FINORA USB storage."
                )
            );
        }
    }

    // ========================================================
    // GET
    // ========================================================

    @PluginMethod
    public void get(
        PluginCall call
    ) {
        JSObject query =
            call.getObject(
                "query"
            );

        if (query == null) {
            resolveFailure(
                call,
                "A valid storage query is required."
            );

            return;
        }

        try {
            ensureInitialized();

            resolveStorageResult(
                call,
                usbStorage.get(
                    query
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to read FINORA USB storage."
                )
            );
        }
    }

    // ========================================================
    // GET ALL
    // ========================================================

    @PluginMethod
    public void getAll(
        PluginCall call
    ) {
        JSObject query =
            call.getObject(
                "query"
            );

        if (query == null) {
            resolveFailure(
                call,
                "A valid storage query is required."
            );

            return;
        }

        try {
            ensureInitialized();

            resolveStorageResult(
                call,
                usbStorage.getAll(
                    query
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to read FINORA USB records."
                )
            );
        }
    }

    // ========================================================
    // SAVE
    // ========================================================

    @PluginMethod
    public void save(
        PluginCall call
    ) {
        JSObject record =
            call.getObject(
                "record"
            );

        JSObject options =
            call.getObject(
                "options"
            );

        if (record == null) {
            resolveFailure(
                call,
                "A valid storage record is required."
            );

            return;
        }

        try {
            ensureInitialized();

            resolveStorageResult(
                call,
                usbStorage.save(
                    record,
                    options
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to save FINORA USB record."
                )
            );
        }
    }

    // ========================================================
    // UPDATE
    // ========================================================

    @PluginMethod
    public void update(
        PluginCall call
    ) {
        JSObject record =
            call.getObject(
                "record"
            );

        JSObject options =
            call.getObject(
                "options"
            );

        if (record == null) {
            resolveFailure(
                call,
                "A valid storage record is required."
            );

            return;
        }

        try {
            ensureInitialized();

            resolveStorageResult(
                call,
                usbStorage.update(
                    record,
                    options
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to update FINORA USB record."
                )
            );
        }
    }

    // ========================================================
    // DELETE
    // ========================================================

    @PluginMethod
    public void delete(
        PluginCall call
    ) {
        JSObject query =
            call.getObject(
                "query"
            );

        if (query == null) {
            resolveFailure(
                call,
                "A valid storage query is required."
            );

            return;
        }

        try {
            ensureInitialized();

            resolveStorageResult(
                call,
                usbStorage.delete(
                    query
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to delete FINORA USB record."
                )
            );
        }
    }

    // ========================================================
    // REPLACE ALL
    // ========================================================

    @PluginMethod
    public void replaceAll(
        PluginCall call
    ) {
        JSArray records =
            call.getArray(
                "records"
            );

        JSObject options =
            call.getObject(
                "options"
            );

        if (records == null) {
            resolveFailure(
                call,
                "Storage records must be an array."
            );

            return;
        }

        try {
            ensureInitialized();

            /*
             * JSArray extends JSONArray in Capacitor, so it can
             * be passed directly into the storage engine.
             */
            resolveStorageResult(
                call,
                usbStorage.replaceAll(
                    records,
                    options
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to replace FINORA USB records."
                )
            );
        }
    }

    // ========================================================
    // CLEAR
    // ========================================================

    @PluginMethod
    public void clear(
        PluginCall call
    ) {
        JSObject query =
            call.getObject(
                "query"
            );

        if (query == null) {
            resolveFailure(
                call,
                "A valid storage query is required."
            );

            return;
        }

        try {
            ensureInitialized();

            resolveStorageResult(
                call,
                usbStorage.clear(
                    query
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to clear FINORA USB records."
                )
            );
        }
    }

    // ========================================================
    // RESET FINORA DATA
    // ========================================================

    @PluginMethod
    public void resetFinoraData(
        PluginCall call
    ) {
        JSObject scope =
            call.getObject(
                "scope"
            );

        if (scope == null) {
            resolveFailure(
                call,
                "FINORA reset scope is required."
            );

            return;
        }

        try {
            ensureInitialized();

            /*
             * The renderer supplies only the logical REAL / DEMO
             * reset scope.
             *
             * USB target resolution remains native-owned:
             *
             * - No filesystem path is accepted.
             * - No drive letter is accepted.
             * - No arbitrary native storage location is accepted.
             */
            resolveStorageResult(
                call,
                usbStorage.resetFinoraData(
                    scope
                )
            );
        } catch (Exception error) {
            resolveFailure(
                call,
                errorMessage(
                    error,
                    "Unable to reset FINORA USB data."
                )
            );
        }
    }

    // ========================================================
    // INITIALIZATION
    // ========================================================

    private void ensureInitialized() {
        if (usbStorage == null) {
            usbStorage =
                new FinoraUsbStorage(
                    getContext()
                );
        }
    }

    // ========================================================
    // RESULT HELPERS
    // ========================================================

    private void resolveStorageResult(
        PluginCall call,
        JSONObject result
    ) {
        call.resolve(
            toJsObject(
                result
            )
        );
    }

    private JSObject createSuccessResult() {
        JSObject result =
            new JSObject();

        result.put(
            "success",
            true
        );

        return result;
    }

    private void resolveFailure(
        PluginCall call,
        String message
    ) {
        JSObject result =
            new JSObject();

        result.put(
            "success",
            false
        );

        result.put(
            "error",
            message
        );

        call.resolve(
            result
        );
    }

    private JSObject toJsObject(
        JSONObject value
    ) {
        if (value == null) {
            return new JSObject();
        }

        try {
            return JSObject.fromJSONObject(
                value
            );
        } catch (Exception error) {
            JSObject fallback =
                new JSObject();

            fallback.put(
                "success",
                false
            );

            fallback.put(
                "error",
                "Unable to serialize FINORA native USB response."
            );

            return fallback;
        }
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

    // ========================================================
    // PAISARULE_R175_C3
    //
    // Restore-specific Android SAF tree selection.
    //
    // Does not change the currently configured USB.
    // Does not write business data or initiate restore.
    // ========================================================

    private android.net.Uri paisarulePendingRestoreUsbUri;

    @PluginMethod
    public void requestPaisaruleRestoreUsb(
        PluginCall call
    ) {
        try {
            paisarulePendingRestoreUsbUri = null;

            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_OPEN_DOCUMENT_TREE
                );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "paisaruleRestoreUsbSelected"
            );

        } catch (Exception error) {
            call.reject(
                "RESTORE_USB_PICKER_UNAVAILABLE"
            );
        }
    }

    @ActivityCallback
    private void paisaruleRestoreUsbSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {
        if (call == null) {
            return;
        }

        paisarulePendingRestoreUsbUri = null;

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {
            call.reject(
                "RESTORE_USB_SELECTION_CANCELLED"
            );
            return;
        }

        android.content.Intent data =
            result.getData();

        if (data == null || data.getData() == null) {
            call.reject(
                "RESTORE_USB_SELECTION_MISSING"
            );
            return;
        }

        android.net.Uri selectedUri = data.getData();

        int flags = data.getFlags();

        int permissionFlags =
            android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
            android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION;

        if ((flags & permissionFlags) != permissionFlags) {
            call.reject(
                "RESTORE_USB_READ_WRITE_PERMISSION_REQUIRED"
            );
            return;
        }

        boolean alreadyPersisted = false;
        boolean newlyPersisted = false;
        boolean verified = false;

        try {
            // Identify whether this exact tree already has
            // a persisted read/write grant. Never revoke an
            // existing grant owned by another app workflow.

            java.util.List<android.content.UriPermission> grants =
                getContext().getContentResolver()
                    .getPersistedUriPermissions();

            if (grants != null) {
                for (android.content.UriPermission grant : grants) {
                    if (
                        selectedUri.equals(grant.getUri()) &&
                        grant.isReadPermission() &&
                        grant.isWritePermission()
                    ) {
                        alreadyPersisted = true;
                        break;
                    }
                }
            }

            if (!alreadyPersisted) {
                getContext().getContentResolver()
                    .takePersistableUriPermission(
                        selectedUri,
                        permissionFlags
                    );

                newlyPersisted = true;
            }

            // This verifies:
            // 1. externalstorage SAF tree authority
            // 2. root-level removable volume UUID
            // 3. persisted read/write permission
            // 4. matching mounted removable StorageVolume
            // 5. completely empty selected USB root

            com.finora.enterprise.usb
                .PaisaruleRestoreUsbVerifier
                .requireNewEmptyRemovableRoot(
                    getContext(),
                    selectedUri
                );

            // In-memory candidate only. No saved USB
            // preferences are modified.
            paisarulePendingRestoreUsbUri = selectedUri;

            verified = true;

            com.getcapacitor.JSObject response =
                new com.getcapacitor.JSObject();

            response.put("verified", true);
            response.put("emptyRoot", true);
            response.put("restoreExecuted", false);

            call.resolve(response);

        } catch (Exception error) {
            paisarulePendingRestoreUsbUri = null;

            call.reject(
                "RESTORE_USB_VERIFICATION_FAILED",
                error
            );

        } finally {
            // If verification failed, release only the
            // newly acquired permission.
            //
            // Permissions that existed before this picker
            // must remain untouched.

            if (
                !verified &&
                newlyPersisted &&
                !alreadyPersisted
            ) {
                try {
                    getContext().getContentResolver()
                        .releasePersistableUriPermission(
                            selectedUri,
                            permissionFlags
                        );
                } catch (Exception ignored) {
                    // Never mask the original verification error.
                }
            }
        }
    }

    // ========================================================
    // PAISARULE_R175_C4
    //
    // User-selected encrypted .paisarule file.
    //
    // No plaintext is read or sent to JavaScript.
    // No persisted URI grants, USB writes or restore.
    //
    // A subsequent privileged restore operation must
    // authenticate the Owner, check the live session
    // and verify the selected backup's branch scope.
    // ========================================================

    private android.net.Uri paisarulePendingBackupUri;

    private static final long PAISARULE_MAX_BACKUP_BYTES =
        96L * 1024L * 1024L;

    // ========================================================
    // PAISARULE_R175_C26
    // Selected Backup + USB verification only.
    // No Restore write. No credentials supplied by JS.
    // ========================================================

    @PluginMethod
    public void verifyPaisaruleRestoreSelection(
        PluginCall call
    ) {
        android.net.Uri selectedUsb =
            paisarulePendingRestoreUsbUri;

        android.net.Uri selectedBackup =
            paisarulePendingBackupUri;

        if (
            selectedUsb == null ||
            selectedBackup == null
        ) {
            call.reject(
                "RESTORE_SELECTION_REQUIRED"
            );
            return;
        }

        try {
            // Recheck the user-selected new empty USB.
            // This must not use the active business USB.
            PaisaruleRestoreUsbVerifier
                .requireNewEmptyRemovableRoot(
                    getContext(),
                    selectedUsb
                );

            // Recheck the selected encrypted backup,
            // current server-authorized Owner session,
            // scope, encryption tag and file hashes.
            //
            // Returns no plaintext or key to JS.
            com.finora.enterprise.control
                .PaisaruleRestoreSessionBridge
                .verifySelectedBackup(
                    getContext(),
                    selectedBackup
                );

            com.getcapacitor.JSObject response =
                new com.getcapacitor.JSObject();

            response.put("verified", true);
            response.put("restoreWritten", false);

            call.resolve(response);

        } catch (Exception error) {
            // A failed validation invalidates the selection.
            // The user must explicitly select both again.
            paisarulePendingRestoreUsbUri = null;
            paisarulePendingBackupUri = null;

            // Do not expose crypto or identity details.
            call.reject(
                "RESTORE_VERIFICATION_FAILED"
            );
        }
    }
    // ========================================================
    // PAISARULE_R175_C31
    // Explicitly confirmed Restore to newly selected USB.
    // ========================================================

    @PluginMethod
    public void commitPaisaruleRestoreToNewUsb(
        PluginCall call
    ) {
        String confirmation =
            call.getString("confirmation", "");

        if (!"RESTORE_TO_NEW_EMPTY_USB".equals(
            confirmation
        )) {
            call.reject("RESTORE_CONFIRMATION_REQUIRED");
            return;
        }

        android.net.Uri selectedUsb =
            paisarulePendingRestoreUsbUri;

        android.net.Uri selectedBackup =
            paisarulePendingBackupUri;

        if (
            selectedUsb == null ||
            selectedBackup == null
        ) {
            call.reject("RESTORE_SELECTION_REQUIRED");
            return;
        }

        // One-shot selection: no accidental repeated commits.
        paisarulePendingRestoreUsbUri = null;
        paisarulePendingBackupUri = null;

        try {
            // Authenticated native session re-verification,
            // AES-GCM verification, original file hashes,
            // new removable empty USB validation and
            // read-back verified writes happen downstream.
            com.finora.enterprise.control
                .PaisaruleRestoreSessionBridge
                .commitSelectedBackup(
                    getContext(),
                    selectedBackup,
                    selectedUsb
                );

            com.getcapacitor.JSObject response =
                new com.getcapacitor.JSObject();

            response.put("success", true);
            response.put("restoreWritten", true);

            call.resolve(response);

        } catch (Exception error) {
            // Never expose secrets, scope or file contents.
            call.reject("RESTORE_COMMIT_FAILED");
        }
    }
    @PluginMethod
    public void requestPaisaruleRestoreBackup(
        PluginCall call
    ) {
        paisarulePendingBackupUri = null;

        try {
            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType("*/*");

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "paisaruleRestoreBackupSelected"
            );

        } catch (Exception error) {
            call.reject(
                "RESTORE_BACKUP_PICKER_UNAVAILABLE"
            );
        }
    }

    @ActivityCallback
    private void paisaruleRestoreBackupSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {
        if (call == null) {
            return;
        }

        paisarulePendingBackupUri = null;

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {
            call.reject(
                "RESTORE_BACKUP_SELECTION_CANCELLED"
            );
            return;
        }

        android.content.Intent data =
            result.getData();

        if (data == null || data.getData() == null) {
            call.reject(
                "RESTORE_BACKUP_SELECTION_MISSING"
            );
            return;
        }

        android.net.Uri uri = data.getData();

        if (
            !"content".equals(uri.getScheme()) ||
            (data.getFlags() &
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                == 0
        ) {
            call.reject(
                "RESTORE_BACKUP_READ_PERMISSION_REQUIRED"
            );
            return;
        }

        String displayName = null;
        long fileSize = -1L;

        try (
            android.database.Cursor cursor =
                getContext().getContentResolver().query(
                    uri,
                    new String[] {
                        android.provider.OpenableColumns.DISPLAY_NAME,
                        android.provider.OpenableColumns.SIZE
                    },
                    null,
                    null,
                    null
                )
        ) {
            if (
                cursor == null ||
                !cursor.moveToFirst()
            ) {
                throw new IllegalStateException(
                    "RESTORE_BACKUP_METADATA_UNAVAILABLE"
                );
            }

            int nameColumn = cursor.getColumnIndex(
                android.provider.OpenableColumns.DISPLAY_NAME
            );

            int sizeColumn = cursor.getColumnIndex(
                android.provider.OpenableColumns.SIZE
            );

            if (
                nameColumn < 0 ||
                sizeColumn < 0 ||
                cursor.isNull(nameColumn) ||
                cursor.isNull(sizeColumn)
            ) {
                throw new IllegalStateException(
                    "RESTORE_BACKUP_METADATA_INCOMPLETE"
                );
            }

            displayName = cursor.getString(nameColumn);
            fileSize = cursor.getLong(sizeColumn);

        } catch (Exception error) {
            call.reject(
                "RESTORE_BACKUP_METADATA_INVALID"
            );
            return;
        }

        if (
            displayName == null ||
            !displayName.toLowerCase(
                java.util.Locale.ROOT
            ).endsWith(".paisarule") ||
            fileSize <= 0L ||
            fileSize > PAISARULE_MAX_BACKUP_BYTES
        ) {
            call.reject(
                "RESTORE_BACKUP_FILE_INVALID"
            );
            return;
        }

        // Metadata is only an initial preflight.
        // A future restore operation MUST read with
        // strict byte limits and verify AES-GCM,
        // payload schema, scope and SHA256 again.
        //
        // Keep the URI private to native memory.
        // Never return URI, key, or file contents to JS.

        paisarulePendingBackupUri = uri;

        com.getcapacitor.JSObject response =
            new com.getcapacitor.JSObject();

        response.put("selected", true);
        // PAISARULE_R175_C79_R2
        // Filename only; never expose content URI or storage path.
        String paisaruleSafeFileName =
            displayName.replace('\\', '/');

        int paisaruleSlash =
            paisaruleSafeFileName.lastIndexOf('/');

        if (paisaruleSlash >= 0) {
            paisaruleSafeFileName =
                paisaruleSafeFileName.substring(
                    paisaruleSlash + 1
                );
        }

        paisaruleSafeFileName =
            paisaruleSafeFileName.replaceAll(
                "[\\p{Cntrl}]",
                ""
            );

        if (paisaruleSafeFileName.length() > 160) {
            paisaruleSafeFileName =
                paisaruleSafeFileName.substring(
                    paisaruleSafeFileName.length() - 160
                );
        }
        response.put("fileName", paisaruleSafeFileName);
        response.put("fileType", "paisarule");
        response.put("fileSizeBytes", fileSize);
        response.put("restoreExecuted", false);

        call.resolve(response);
    }
}
