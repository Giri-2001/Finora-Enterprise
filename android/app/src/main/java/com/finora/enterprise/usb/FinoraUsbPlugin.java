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
        try {
            ensureInitialized();

            /*
             * This rewrites only:
             *
             * FINORA/storage/finora-storage.json
             *
             * It never formats the selected USB and never deletes
             * unrelated user files.
             */
            resolveStorageResult(
                call,
                usbStorage.resetFinoraData()
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
}
