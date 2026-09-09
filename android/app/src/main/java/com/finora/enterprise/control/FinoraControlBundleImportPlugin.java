package com.finora.enterprise.control;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONTokener;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID CONTROL BUNDLE IMPORT PLUGIN

   MODULE  : Control
   LAYER   : Native Transport Boundary
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Expose one zero-input Control Bundle import operation
   - Open Android's native single-document picker
   - Accept one .finora file selected by the operator
   - Read selected content through ContentResolver only
   - Enforce a strict 4 MiB maximum
   - Decode strict UTF-8
   - Parse exactly one JSON object
   - Forward that object to the native authoritative coordinator
   - Return only narrow import/result metadata to the renderer

   SECURITY:

   - Renderer supplies no filesystem path.
   - Renderer supplies no URI.
   - Renderer supplies no file bytes.
   - Renderer supplies no trusted keys.
   - Renderer supplies no expected target.
   - Renderer supplies no installation identity.
   - Renderer supplies no verification timestamp.
   - Renderer cannot call purpose-specific apply services directly.
   - No persistent SAF grant is requested.
   - No write permission is requested.
   - No private signing material is exposed.

   FILE CONTRACT:

   - Native ACTION_OPEN_DOCUMENT
   - CATEGORY_OPENABLE
   - one operator-selected document
   - required .finora display-name extension
   - maximum 4 * 1024 * 1024 bytes
   - strict UTF-8
   - exactly one JSON object
============================================================ */

@CapacitorPlugin(
    name =
        "FinoraControlBundleImport"
)
public final class FinoraControlBundleImportPlugin
    extends Plugin {

    // ========================================================
    // FILE CONTRACT
    // ========================================================

    private static final String FILE_EXTENSION =
        ".finora";

    private static final int MAX_FILE_BYTES =
        4 * 1024 * 1024;

    // ========================================================
    // STATE
    // ========================================================

    private FinoraControlBundleImportCoordinator
        importCoordinator;

    // ========================================================
    // SELECTED FILE
    // ========================================================

    private static final class SelectedFile {

        private final String fileName;

        private final int bytesRead;

        private final JSONObject signedBundle;

        private SelectedFile(
            String fileName,
            int bytesRead,
            JSONObject signedBundle
        ) {
            this.fileName =
                fileName;

            this.bytesRead =
                bytesRead;

            this.signedBundle =
                signedBundle;
        }
    }

    // ========================================================
    // ZERO-INPUT IMPORT
    // ========================================================

    @PluginMethod
    public void importControlBundle(
        PluginCall call
    ) {
        if (call == null) {
            return;
        }

        try {
            ensureInitialized();

            Intent intent =
                new Intent(
                    Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                Intent.CATEGORY_OPENABLE
            );

            /*
             * .finora does not rely on a platform-wide MIME
             * registration. The authoritative type boundary is
             * the native-selected display name plus signed JSON
             * verification after bounded reading.
             */
            intent.setType(
                "*/*"
            );

            intent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "controlBundleSelected"
            );
        } catch (
            Exception error
        ) {
            resolveFailure(
                call,
                "NATIVE_PICKER_FAILED",
                messageOrDefault(
                    error,
                    "FINORA Control Bundle picker could not be opened."
                )
            );
        }
    }

    // ========================================================
    // PICKER CALLBACK
    // ========================================================

    @ActivityCallback
    private void controlBundleSelected(
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
            resolveCancelled(
                call
            );

            return;
        }

        Intent data =
            result.getData();

        if (data == null) {
            resolveFailure(
                call,
                "NATIVE_SELECTION_INVALID",
                "Android did not return a FINORA Control Bundle selection."
            );

            return;
        }

        Uri selectedUri =
            data.getData();

        if (selectedUri == null) {
            resolveFailure(
                call,
                "NATIVE_SELECTION_INVALID",
                "Android did not return a valid FINORA Control Bundle URI."
            );

            return;
        }

        try {
            ensureInitialized();

            SelectedFile selectedFile =
                readSelectedFile(
                    selectedUri
                );

            FinoraControlBundleImportCoordinator.Result
                importResult =
                    importCoordinator.apply(
                        selectedFile.signedBundle
                    );

            if (!importResult.success) {
                resolveImportFailure(
                    call,
                    importResult
                );

                return;
            }

            resolveSuccess(
                call,
                selectedFile,
                importResult
            );
        } catch (
            Exception error
        ) {
            resolveFailure(
                call,
                "FINORA_FILE_IMPORT_FAILED",
                messageOrDefault(
                    error,
                    "FINORA Control Bundle file import failed."
                )
            );
        }
    }

    // ========================================================
    // INITIALIZATION
    // ========================================================

    private synchronized void ensureInitialized() {

        if (importCoordinator != null) {
            return;
        }

        Context context =
            getContext();

        if (context == null) {
            throw new IllegalStateException(
                "FINORA Control Bundle import requires Android context."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        Context authorityContext =
            applicationContext != null
                ? applicationContext
                : context;

        FinoraControlStore controlStore =
            new FinoraControlStore(
                authorityContext
            );

        FinoraInstallationBindingService bindingService =
            new FinoraInstallationBindingService(
                authorityContext
            );

        FinoraRecipientTrustStore trustStore =
            new FinoraRecipientTrustStore(
                authorityContext
            );

        FinoraClockHighWaterStore highWaterStore =
            new FinoraClockHighWaterStore(
                authorityContext
            );

        FinoraClockHighWaterAuthorityService
            clockHighWaterAuthority =
                new FinoraClockHighWaterAuthorityService(
                    highWaterStore,
                    bindingService
                );

        importCoordinator =
            new FinoraControlBundleImportCoordinator(
                controlStore,
                bindingService,
                trustStore,
                clockHighWaterAuthority
            );
    }

    // ========================================================
    // READ SELECTED FILE
    // ========================================================

    private SelectedFile readSelectedFile(
        Uri selectedUri
    ) throws Exception {

        if (selectedUri == null) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle selection is required."
            );
        }

        ContentResolver resolver =
            getContext()
                .getContentResolver();

        FileMetadata metadata =
            readFileMetadata(
                resolver,
                selectedUri
            );

        if (
            metadata.fileName == null ||
            !metadata.fileName
                .toLowerCase(
                    Locale.ROOT
                )
                .endsWith(
                    FILE_EXTENSION
                )
        ) {
            throw new IllegalArgumentException(
                "Selected file must use the .finora extension."
            );
        }

        if (
            metadata.reportedSize !=
                null &&
            metadata.reportedSize >
                MAX_FILE_BYTES
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle exceeds the supported 4 MiB file size limit."
            );
        }

        byte[] content =
            readBounded(
                resolver,
                selectedUri
            );

        if (content.length == 0) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle file is empty."
            );
        }

        String json =
            decodeStrictUtf8(
                content
            );

        JSONObject signedBundle =
            parseExactlyOneJsonObject(
                json
            );

        return new SelectedFile(
            metadata.fileName,
            content.length,
            signedBundle
        );
    }

    // ========================================================
    // FILE METADATA
    // ========================================================

    private static final class FileMetadata {

        private final String fileName;

        private final Long reportedSize;

        private FileMetadata(
            String fileName,
            Long reportedSize
        ) {
            this.fileName =
                fileName;

            this.reportedSize =
                reportedSize;
        }
    }

    private static FileMetadata readFileMetadata(
        ContentResolver resolver,
        Uri uri
    ) throws Exception {

        if (
            resolver == null ||
            uri == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle metadata source is invalid."
            );
        }

        String fileName =
            null;

        Long reportedSize =
            null;

        String[] projection =
            new String[] {
                OpenableColumns.DISPLAY_NAME,
                OpenableColumns.SIZE
            };

        try (
            Cursor cursor =
                resolver.query(
                    uri,
                    projection,
                    null,
                    null,
                    null
                )
        ) {
            if (
                cursor == null ||
                !cursor.moveToFirst()
            ) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle file metadata could not be resolved."
                );
            }

            int nameIndex =
                cursor.getColumnIndex(
                    OpenableColumns.DISPLAY_NAME
                );

            if (
                nameIndex >= 0 &&
                !cursor.isNull(
                    nameIndex
                )
            ) {
                fileName =
                    cursor.getString(
                        nameIndex
                    );
            }

            int sizeIndex =
                cursor.getColumnIndex(
                    OpenableColumns.SIZE
                );

            if (
                sizeIndex >= 0 &&
                !cursor.isNull(
                    sizeIndex
                )
            ) {
                long rawSize =
                    cursor.getLong(
                        sizeIndex
                    );

                if (rawSize >= 0) {
                    reportedSize =
                        rawSize;
                }
            }
        }

        if (
            fileName == null ||
            fileName.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle file name could not be resolved."
            );
        }

        return new FileMetadata(
            fileName,
            reportedSize
        );
    }

    // ========================================================
    // BOUNDED CONTENT READ
    // ========================================================

    private static byte[] readBounded(
        ContentResolver resolver,
        Uri uri
    ) throws Exception {

        try (
            InputStream input =
                resolver.openInputStream(
                    uri
                )
        ) {
            if (input == null) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle file could not be opened."
                );
            }

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
                        MAX_FILE_BYTES
                ) {
                    throw new IllegalArgumentException(
                        "FINORA Control Bundle exceeds the supported 4 MiB file size limit."
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
    // STRICT UTF-8
    // ========================================================

    private static String decodeStrictUtf8(
        byte[] bytes
    ) throws CharacterCodingException {

        if (
            bytes == null ||
            bytes.length == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle UTF-8 payload is empty."
            );
        }

        /*
         * Reject UTF-8 BOM. The signed .finora transport uses
         * ordinary UTF-8 JSON bytes with no hidden prefix.
         */
        if (
            bytes.length >= 3 &&
            (bytes[0] & 0xff) ==
                0xef &&
            (bytes[1] & 0xff) ==
                0xbb &&
            (bytes[2] & 0xff) ==
                0xbf
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle UTF-8 BOM is not supported."
            );
        }

        return StandardCharsets.UTF_8
            .newDecoder()
            .onMalformedInput(
                CodingErrorAction.REPORT
            )
            .onUnmappableCharacter(
                CodingErrorAction.REPORT
            )
            .decode(
                ByteBuffer.wrap(
                    bytes
                )
            )
            .toString();
    }

    // ========================================================
    // EXACT JSON OBJECT
    // ========================================================

    private static JSONObject parseExactlyOneJsonObject(
        String json
    ) {

        if (
            json == null ||
            json.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle JSON is empty."
            );
        }

        try {
            JSONTokener tokener =
                new JSONTokener(
                    json
                );

            Object parsed =
                tokener.nextValue();

            if (
                !(parsed instanceof
                    JSONObject)
            ) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle root must be one JSON object."
                );
            }

            char trailing =
                tokener.nextClean();

            if (trailing != 0) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle contains trailing non-JSON content."
                );
            }

            return (JSONObject) parsed;
        } catch (
            IllegalArgumentException error
        ) {
            throw error;
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle contains invalid JSON.",
                error
            );
        }
    }

    // ========================================================
    // SUCCESS RESULT
    // ========================================================

    private static void resolveSuccess(
        PluginCall call,
        SelectedFile selectedFile,
        FinoraControlBundleImportCoordinator.Result result
    ) {

        JSObject response =
            new JSObject();

        response.put(
            "success",
            true
        );

        response.put(
            "cancelled",
            false
        );

        response.put(
            "fileName",
            selectedFile.fileName
        );

        response.put(
            "bytesRead",
            selectedFile.bytesRead
        );

        response.put(
            "bundlePackageId",
            result.bundlePackageId
        );

        response.put(
            "verifiedAt",
            result.verifiedAt
        );

        JSArray children =
            new JSArray();

        for (
            FinoraControlBundleImportCoordinator.AppliedChild child :
            result.appliedChildren
        ) {
            JSObject childResult =
                new JSObject();

            childResult.put(
                "purpose",
                child.purpose
            );

            childResult.put(
                "packageId",
                child.packageId
            );

            if (child.sequence != null) {
                childResult.put(
                    "sequence",
                    child.sequence
                );
            }

            children.put(
                childResult
            );
        }

        response.put(
            "appliedChildren",
            children
        );

        call.resolve(
            response
        );
    }

    // ========================================================
    // IMPORT FAILURE RESULT
    // ========================================================

    private static void resolveImportFailure(
        PluginCall call,
        FinoraControlBundleImportCoordinator.Result result
    ) {

        String errorCode =
            result != null &&
            result.errorCode != null
                ? result.errorCode
                : "CONTROL_BUNDLE_IMPORT_FAILED";

        String error =
            result != null &&
            result.error != null
                ? result.error
                : "FINORA Control Bundle import failed.";

        resolveFailure(
            call,
            errorCode,
            error
        );
    }

    // ========================================================
    // CANCELLED
    // ========================================================

    private static void resolveCancelled(
        PluginCall call
    ) {

        JSObject response =
            new JSObject();

        response.put(
            "success",
            true
        );

        response.put(
            "cancelled",
            true
        );

        call.resolve(
            response
        );
    }

    // ========================================================
    // FAILURE
    // ========================================================

    private static void resolveFailure(
        PluginCall call,
        String errorCode,
        String error
    ) {

        JSObject response =
            new JSObject();

        response.put(
            "success",
            false
        );

        response.put(
            "cancelled",
            false
        );

        response.put(
            "errorCode",
            errorCode
        );

        response.put(
            "error",
            error
        );

        call.resolve(
            response
        );
    }

    // ========================================================
    // MESSAGE
    // ========================================================

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {

        if (
            error == null ||
            error.getMessage() == null ||
            error.getMessage()
                .trim()
                .isEmpty()
        ) {
            return fallback;
        }

        return error.getMessage();
    }
}

/* ============================================================
   END
============================================================ */