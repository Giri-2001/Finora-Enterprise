package com.finora.enterprise.control;

import android.app.Activity;
import android.content.ContentResolver;
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

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST EMERGENCY RECOVERY IMPORT

   MODULE  : Control
   LAYER   : Dedicated Native Break-Glass Transport
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Expose one zero-input native emergency Recovery import action
   - Open Android native document picker
   - Accept one bounded .finora document
   - Read bytes only through Android ContentResolver
   - Decode strict UTF-8
   - Parse exactly one JSON object
   - Invoke authoritative Recipient Trust Recovery apply service
   - Return narrow apply metadata only

   SECURITY BOUNDARY:

   Renderer supplies:
     - no filepath
     - no Uri
     - no package bytes
     - no trusted operational keys
     - no Recovery Authority key
     - no expected target
     - no installation binding
     - no accepted time

   Native authority supplies:
     - picker-selected Uri
     - Recovery Authority persisted public root
     - operational recipient trust
     - installation binding
     - clock high-water observation
     - replay / sequence state
     - final trust mutation

   FILE POLICY:

   - ACTION_OPEN_DOCUMENT
   - CATEGORY_OPENABLE
   - read-only grant
   - no tree access
   - no write grant
   - no persistable grant
   - display name must end in .finora
   - maximum 4 MiB
   - UTF-8 only
   - malformed / unmappable UTF-8 rejected
   - UTF-8 BOM rejected
   - exactly one top-level JSONObject
   - trailing JSON tokens rejected
============================================================ */

@CapacitorPlugin(
    name = "FinoraRecipientTrustRecoveryImport"
)
public final class FinoraRecipientTrustRecoveryImportPlugin
    extends Plugin {

    // ========================================================
    // CONSTANTS
    // ========================================================

    private static final int MAX_FINORA_BYTES =
        4 * 1024 * 1024;

    private static final String FINORA_EXTENSION =
        ".finora";

    // ========================================================
    // PUBLIC IMPORT
    //
    // ZERO INPUT:
    // PluginCall is lifecycle/result transport only.
    // No call.get* authority input is read.
    // ========================================================

    @PluginMethod
    public void importSignedRecovery(
        PluginCall call
    ) {

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
            "handleRecoveryImportResult"
        );
    }

    // ========================================================
    // PICKER RESULT
    // ========================================================

    @ActivityCallback
    private void handleRecoveryImportResult(
        PluginCall call,
        ActivityResult activityResult
    ) {

        if (call == null) {
            return;
        }

        if (
            activityResult == null ||
            activityResult.getResultCode() !=
                Activity.RESULT_OK
        ) {
            call.reject(
                "FINORA recipient trust recovery import was cancelled."
            );

            return;
        }

        Intent data =
            activityResult.getData();

        if (
            data == null ||
            data.getData() == null
        ) {
            call.reject(
                "FINORA recipient trust recovery import did not return a document."
            );

            return;
        }

        Uri uri =
            data.getData();

        try {
            ContentResolver resolver =
                getContext()
                    .getContentResolver();

            SelectedDocument selected =
                inspectSelectedDocument(
                    resolver,
                    uri
                );

            if (
                selected.displayName == null ||
                !selected.displayName
                    .toLowerCase()
                    .endsWith(
                        FINORA_EXTENSION
                    )
            ) {
                call.reject(
                    "FINORA recipient trust recovery import requires a .finora document."
                );

                return;
            }

            if (
                selected.sizeBytes >
                    MAX_FINORA_BYTES
            ) {
                call.reject(
                    "FINORA recipient trust recovery package exceeds the 4 MiB limit."
                );

                return;
            }

            byte[] bytes =
                readBoundedBytes(
                    resolver,
                    uri
                );

            String jsonText =
                decodeStrictUtf8(
                    bytes
                );

            JSONObject signedRecovery =
                parseExactlyOneObject(
                    jsonText
                );

            FinoraInstallationBindingService bindingService =
                new FinoraInstallationBindingService(
                    getContext()
                );

            FinoraRecipientTrustStore trustStore =
                new FinoraRecipientTrustStore(
                    getContext()
                );

            FinoraRecipientTrustRecoveryAuthorityStore
                recoveryAuthorityStore =
                    new FinoraRecipientTrustRecoveryAuthorityStore(
                        getContext()
                    );

            FinoraClockHighWaterStore clockStore =
                new FinoraClockHighWaterStore(
                    getContext()
                );

            FinoraClockHighWaterAuthorityService
                clockAuthority =
                    new FinoraClockHighWaterAuthorityService(
                        clockStore,
                        bindingService
                    );

            FinoraRecipientTrustRecoveryApplyService
                applyService =
                    new FinoraRecipientTrustRecoveryApplyService(
                        trustStore,
                        recoveryAuthorityStore,
                        bindingService,
                        clockAuthority
                    );

            FinoraRecipientTrustRecoveryApplyService.Result
                result =
                    applyService.apply(
                        signedRecovery
                    );

            if (
                !result.success ||
                result.data == null
            ) {
                call.reject(
                    result.error != null
                        ? result.error
                        : "FINORA recipient trust recovery apply failed."
                );

                return;
            }

            JSObject response =
                new JSObject();

            response.put(
                "packageId",
                result.data.packageId
            );

            response.put(
                "action",
                result.data.action
            );

            response.put(
                "recoveryAuthorityId",
                result.data.recoveryAuthorityId
            );

            response.put(
                "operationalIssuerId",
                result.data.operationalIssuerId
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
                "revokedSigningKeyId",
                result.data.revokedSigningKeyId
            );

            response.put(
                "activeSigningKeyId",
                result.data.activeSigningKeyId
            );

            call.resolve(
                response
            );
        } catch (
            Exception error
        ) {
            call.reject(
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery import failed."
                )
            );
        }
    }

    // ========================================================
    // SELECTED DOCUMENT METADATA
    // ========================================================

    private static final class SelectedDocument {

        private final String displayName;

        private final long sizeBytes;

        private SelectedDocument(
            String displayName,
            long sizeBytes
        ) {
            this.displayName =
                displayName;

            this.sizeBytes =
                sizeBytes;
        }
    }

    private static SelectedDocument inspectSelectedDocument(
        ContentResolver resolver,
        Uri uri
    ) throws Exception {

        String displayName =
            null;

        long sizeBytes =
            -1L;

        try (
            Cursor cursor =
                resolver.query(
                    uri,
                    new String[] {
                        OpenableColumns.DISPLAY_NAME,
                        OpenableColumns.SIZE
                    },
                    null,
                    null,
                    null
                )
        ) {
            if (
                cursor != null &&
                cursor.moveToFirst()
            ) {
                int nameIndex =
                    cursor.getColumnIndex(
                        OpenableColumns.DISPLAY_NAME
                    );

                if (
                    nameIndex >=
                        0 &&
                    !cursor.isNull(
                        nameIndex
                    )
                ) {
                    displayName =
                        cursor.getString(
                            nameIndex
                        );
                }

                int sizeIndex =
                    cursor.getColumnIndex(
                        OpenableColumns.SIZE
                    );

                if (
                    sizeIndex >=
                        0 &&
                    !cursor.isNull(
                        sizeIndex
                    )
                ) {
                    sizeBytes =
                        cursor.getLong(
                            sizeIndex
                        );
                }
            }
        }

        if (
            displayName == null ||
            displayName
                .trim()
                .isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery document name is unavailable."
            );
        }

        if (
            sizeBytes >
                MAX_FINORA_BYTES
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery package exceeds the 4 MiB limit."
            );
        }

        return new SelectedDocument(
            displayName,
            sizeBytes
        );
    }

    // ========================================================
    // BOUNDED READ
    // ========================================================

    private static byte[] readBoundedBytes(
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
                throw new IllegalStateException(
                    "FINORA recipient trust recovery document could not be opened."
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
                        MAX_FINORA_BYTES
                ) {
                    throw new IllegalArgumentException(
                        "FINORA recipient trust recovery package exceeds the 4 MiB limit."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            if (total == 0) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery package is empty."
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
    ) throws Exception {

        if (
            bytes == null ||
            bytes.length == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery package is empty."
            );
        }

        if (
            bytes.length >=
                3 &&
            (
                bytes[0] &
                0xff
            ) ==
                0xef &&
            (
                bytes[1] &
                0xff
            ) ==
                0xbb &&
            (
                bytes[2] &
                0xff
            ) ==
                0xbf
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery package must not contain a UTF-8 BOM."
            );
        }

        try {
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
        } catch (
            CharacterCodingException error
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery package is not valid UTF-8.",
                error
            );
        }
    }

    // ========================================================
    // EXACT JSON OBJECT
    // ========================================================

    private static JSONObject parseExactlyOneObject(
        String jsonText
    ) throws Exception {

        if (
            jsonText == null ||
            jsonText
                .trim()
                .isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery JSON is empty."
            );
        }

        JSONTokener tokener =
            new JSONTokener(
                jsonText
            );

        Object root =
            tokener.nextValue();

        if (
            !(root instanceof
                JSONObject)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery package must contain exactly one JSON object."
            );
        }

        char trailing =
            tokener.nextClean();

        if (trailing != 0) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery package contains trailing JSON content."
            );
        }

        return (JSONObject) root;
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