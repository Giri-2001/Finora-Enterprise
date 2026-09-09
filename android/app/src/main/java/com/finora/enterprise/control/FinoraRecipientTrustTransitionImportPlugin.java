package com.finora.enterprise.control;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST TRANSITION IMPORT PLUGIN

   MODULE  : Control
   LAYER   : Native Privileged Transport Boundary
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Expose one zero-input recipient trust-transition import
   - Open Android native single-document picker
   - Accept one operator-selected .finora document
   - Read selected content through ContentResolver only
   - Enforce strict 4 MiB maximum
   - Decode strict UTF-8
   - Parse exactly one JSON object
   - Forward only that object to native transition authority
   - Return narrow mutation summary to renderer

   SECURITY:

   - Renderer supplies no filesystem path.
   - Renderer supplies no URI.
   - Renderer supplies no file bytes.
   - Renderer supplies no trusted keys.
   - Renderer supplies no expected target.
   - Renderer supplies no installation identity.
   - Renderer supplies no verification timestamp.
   - Renderer supplies no transition action or key identity.
   - No persistent SAF grant.
   - No write permission.
   - No private signing material.
   - No emergency recovery authority.
   - Signed transition verifier remains authoritative.

   FILE CONTRACT:

   - ACTION_OPEN_DOCUMENT
   - CATEGORY_OPENABLE
   - exactly one selected document
   - required .finora display-name extension
   - maximum 4 * 1024 * 1024 bytes
   - strict UTF-8
   - exactly one JSON object
============================================================ */

@CapacitorPlugin(
    name =
        "FinoraRecipientTrustTransitionImport"
)
public final class FinoraRecipientTrustTransitionImportPlugin
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

    private FinoraRecipientTrustTransitionApplyService
        applyService;

    // ========================================================
    // SELECTED FILE
    // ========================================================

    private static final class SelectedFile {

        private final String fileName;

        private final int bytesRead;

        private final JSONObject signedTransition;

        private SelectedFile(
            String fileName,
            int bytesRead,
            JSONObject signedTransition
        ) {
            this.fileName =
                fileName;

            this.bytesRead =
                bytesRead;

            this.signedTransition =
                signedTransition;
        }
    }

    // ========================================================
    // ZERO-INPUT IMPORT
    // ========================================================

    @PluginMethod
    public void importRecipientTrustTransition(
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

            intent.setType(
                "*/*"
            );

            intent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "recipientTrustTransitionSelected"
            );
        } catch (
            Exception error
        ) {
            resolveFailure(
                call,
                "NATIVE_PICKER_FAILED",
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition picker could not be opened."
                )
            );
        }
    }

    // ========================================================
    // PICKER CALLBACK
    // ========================================================

    @ActivityCallback
    private void recipientTrustTransitionSelected(
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
                "Android did not return a recipient trust transition selection."
            );

            return;
        }

        Uri selectedUri =
            data.getData();

        if (selectedUri == null) {
            resolveFailure(
                call,
                "NATIVE_SELECTION_INVALID",
                "Android did not return a valid recipient trust transition URI."
            );

            return;
        }

        try {
            ensureInitialized();

            SelectedFile selectedFile =
                readSelectedFile(
                    selectedUri
                );

            FinoraRecipientTrustTransitionApplyService.Result
                applyResult =
                    applyService.apply(
                        selectedFile.signedTransition
                    );

            if (!applyResult.success) {
                resolveFailure(
                    call,
                    "RECIPIENT_TRUST_TRANSITION_APPLY_FAILED",
                    applyResult.error != null
                        ? applyResult.error
                        : "FINORA recipient trust transition apply failed."
                );

                return;
            }

            resolveSuccess(
                call,
                selectedFile,
                applyResult
            );
        } catch (
            Exception error
        ) {
            resolveFailure(
                call,
                "RECIPIENT_TRUST_TRANSITION_IMPORT_FAILED",
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition import failed."
                )
            );
        }
    }

    // ========================================================
    // INITIALIZATION
    // ========================================================

    private synchronized void ensureInitialized() {

        if (applyService != null) {
            return;
        }

        Context context =
            getContext();

        if (context == null) {
            throw new IllegalStateException(
                "FINORA recipient trust transition import requires Android context."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        Context authorityContext =
            applicationContext != null
                ? applicationContext
                : context;

        FinoraRecipientTrustStore trustStore =
            new FinoraRecipientTrustStore(
                authorityContext
            );

        FinoraInstallationBindingService bindingService =
            new FinoraInstallationBindingService(
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

        applyService =
            new FinoraRecipientTrustTransitionApplyService(
                trustStore,
                bindingService,
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
                "FINORA recipient trust transition selection is required."
            );
        }

        Context context =
            getContext();

        if (context == null) {
            throw new IllegalStateException(
                "FINORA recipient trust transition import requires Android context."
            );
        }

        ContentResolver resolver =
            context.getContentResolver();

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
                "Selected trust transition file must use the .finora extension."
            );
        }

        if (
            metadata.reportedSize !=
                null &&
            metadata.reportedSize >
                MAX_FILE_BYTES
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition exceeds the supported 4 MiB file size limit."
            );
        }

        byte[] content =
            readBounded(
                resolver,
                selectedUri
            );

        if (content.length == 0) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition file is empty."
            );
        }

        String json =
            decodeStrictUtf8(
                content
            );

        JSONObject signedTransition =
            parseExactlyOneJsonObject(
                json
            );

        return new SelectedFile(
            metadata.fileName,
            content.length,
            signedTransition
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
                "FINORA recipient trust transition metadata source is invalid."
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
                    "FINORA recipient trust transition file metadata could not be resolved."
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
                "FINORA recipient trust transition file name could not be resolved."
            );
        }

        return new FileMetadata(
            fileName,
            reportedSize
        );
    }

    // ========================================================
    // BOUNDED READ
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
                    "FINORA recipient trust transition file could not be opened."
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
                        "FINORA recipient trust transition exceeds the supported 4 MiB file size limit."
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
                "FINORA recipient trust transition UTF-8 payload is empty."
            );
        }

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
                "FINORA recipient trust transition UTF-8 BOM is not supported."
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
                "FINORA recipient trust transition JSON is empty."
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
                    "FINORA recipient trust transition root must be one JSON object."
                );
            }

            char trailing =
                tokener.nextClean();

            if (trailing != 0) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition contains trailing non-JSON content."
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
                "FINORA recipient trust transition contains invalid JSON.",
                error
            );
        }
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    private static void resolveSuccess(
        PluginCall call,
        SelectedFile selectedFile,
        FinoraRecipientTrustTransitionApplyService.Result result
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

        if (result.data != null) {
            response.put(
                "packageId",
                result.data.packageId
            );

            response.put(
                "action",
                result.data.action
            );

            response.put(
                "issuerId",
                result.data.issuerId
            );

            response.put(
                "sequence",
                result.data.sequence
            );

            response.put(
                "installationId",
                result.data.installationId
            );

            response.put(
                "appliedAt",
                result.data.appliedAt
            );

            response.put(
                "activeSigningKeyId",
                result.data.activeSigningKeyId
            );

            response.put(
                "affectedSigningKeyId",
                result.data.affectedSigningKeyId
            );
        }

        call.resolve(
            response
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