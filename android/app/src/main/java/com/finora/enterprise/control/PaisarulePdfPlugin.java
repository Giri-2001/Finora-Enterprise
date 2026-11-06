package com.finora.enterprise.control;

// PAISARULE_R173_P1_B1_R1
// Android-only PDF Save As + Android Print Manager.
// No USB, Wallet, business-record or database mutation.

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;

import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.InputStream;
import java.io.OutputStream;

import java.security.MessageDigest;

import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;

@CapacitorPlugin(name = "PaisarulePdf")
public final class PaisarulePdfPlugin extends Plugin {

    private static final int MAX_PDF_BYTES =
        16 * 1024 * 1024;

    private byte[] pendingPdf;

    private boolean saveBusy = false;

    // ====================================================
    // PDF VALIDATION
    // ====================================================

    private static byte[] decodePdf(
        PluginCall call
    ) throws Exception {

        String encoded = call.getString(
            "dataBase64"
        );

        if (
            encoded == null ||
            encoded.isEmpty() ||
            encoded.length() > 24 * 1024 * 1024
        ) {
            throw new IllegalArgumentException(
                "PDF_SIZE_INVALID"
            );
        }

        byte[] decoded =
            Base64.getDecoder().decode(encoded);

        if (
            decoded.length < 8 ||
            decoded.length > MAX_PDF_BYTES ||
            decoded[0] != '%' ||
            decoded[1] != 'P' ||
            decoded[2] != 'D' ||
            decoded[3] != 'F' ||
            decoded[4] != '-'
        ) {

            Arrays.fill(
                decoded,
                (byte) 0
            );

            throw new IllegalArgumentException(
                "PDF_CONTENT_INVALID"
            );
        }

        return decoded;
    }

    // ====================================================
    // FILE NAME
    // ====================================================

    private static String fileName(
        PluginCall call
    ) {

        String raw = call.getString(
            "fileName"
        );

        if (raw == null) {
            raw = "PAISARULE_Report.pdf";
        }

        String safe = raw.trim()
            .replaceAll(
                "[^A-Za-z0-9._-]",
                "_"
            );

        if (
            safe.isEmpty() ||
            safe.equals(".") ||
            safe.equals("..")
        ) {
            safe = "PAISARULE_Report.pdf";
        }

        if (safe.length() > 120) {
            safe = safe.substring(0, 120);
        }

        if (
            !safe.toLowerCase(Locale.ROOT)
                .endsWith(".pdf")
        ) {
            safe += ".pdf";
        }

        return safe;
    }

    // ====================================================
    // CLEAR PENDING SAVE
    // ====================================================

    private synchronized void clearPending() {

        if (pendingPdf != null) {

            Arrays.fill(
                pendingPdf,
                (byte) 0
            );
        }

        pendingPdf = null;
        saveBusy = false;
    }

    // ====================================================
    // ANDROID SAVE AS
    // ====================================================

    @PluginMethod
    public void savePdfAs(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        synchronized (this) {

            if (saveBusy) {

                call.reject(
                    "PDF_SAVE_BUSY"
                );

                return;
            }

            saveBusy = true;
        }

        try {

            byte[] bytes = decodePdf(call);

            String name = fileName(call);

            synchronized (this) {
                pendingPdf = bytes;
            }

            Intent intent = new Intent(
                Intent.ACTION_CREATE_DOCUMENT
            );

            intent.addCategory(
                Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/pdf"
            );

            intent.putExtra(
                Intent.EXTRA_TITLE,
                name
            );

            getActivity().runOnUiThread(() -> {

                try {

                    startActivityForResult(
                        call,
                        intent,
                        "completePdfSaveAs"
                    );

                } catch (Exception error) {

                    clearPending();

                    call.reject(
                        "PDF_SAVE_PICKER_FAILED"
                    );
                }
            });

        } catch (Exception error) {

            clearPending();

            call.reject(
                "PDF_PREPARATION_FAILED"
            );
        }
    }

    // ====================================================
    // SAVE AS RESULT
    // ====================================================

    @ActivityCallback
    private void completePdfSaveAs(
        PluginCall call,
        ActivityResult result
    ) {

        if (call == null) {

            clearPending();
            return;
        }

        if (
            result == null ||
            result.getResultCode() != Activity.RESULT_OK ||
            result.getData() == null ||
            result.getData().getData() == null
        ) {

            clearPending();

            JSObject response = new JSObject();

            response.put(
                "success",
                false
            );

            response.put(
                "cancelled",
                true
            );

            call.resolve(response);
            return;
        }

        final Uri uri =
            result.getData().getData();

        getBridge().execute(() -> {

            byte[] bytes;

            synchronized (this) {
                bytes = pendingPdf;
            }

            if (bytes == null) {

                clearPending();

                call.reject(
                    "PDF_SAVE_STATE_MISSING"
                );

                return;
            }

            try {

                // Write only to user-selected SAF URI.

                try (
                    OutputStream output =
                        getContext()
                            .getContentResolver()
                            .openOutputStream(
                                uri,
                                "wt"
                            )
                ) {

                    if (output == null) {
                        throw new IllegalStateException(
                            "PDF_OUTPUT_UNAVAILABLE"
                        );
                    }

                    output.write(bytes);
                    output.flush();
                }

                // SHA256 readback verification.

                MessageDigest digest =
                    MessageDigest.getInstance(
                        "SHA-256"
                    );

                byte[] expected =
                    digest.digest(bytes);

                digest.reset();

                int total = 0;

                try (
                    InputStream input =
                        getContext()
                            .getContentResolver()
                            .openInputStream(uri)
                ) {

                    if (input == null) {
                        throw new IllegalStateException(
                            "PDF_READBACK_UNAVAILABLE"
                        );
                    }

                    byte[] buffer =
                        new byte[8192];

                    int count;

                    while (
                        (count = input.read(buffer)) != -1
                    ) {

                        total += count;

                        if (
                            total > MAX_PDF_BYTES
                        ) {
                            throw new IllegalStateException(
                                "PDF_READBACK_TOO_LARGE"
                            );
                        }

                        digest.update(
                            buffer,
                            0,
                            count
                        );
                    }
                }

                if (
                    total != bytes.length ||
                    !MessageDigest.isEqual(
                        expected,
                        digest.digest()
                    )
                ) {

                    throw new IllegalStateException(
                        "PDF_INTEGRITY_FAILED"
                    );
                }

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

                clearPending();

                call.resolve(response);

            } catch (Exception error) {

                clearPending();

                call.reject(
                    "PDF_SAVE_OR_VERIFY_FAILED"
                );
            }
        });
    }

    // ====================================================
    // ANDROID PRINT MANAGER
    // ====================================================

    @PluginMethod
    public void printPdf(
        PluginCall call
    ) {

        if (call == null) {
            return;
        }

        final byte[] bytes;

        try {

            bytes = decodePdf(call);

        } catch (Exception error) {

            call.reject(
                "PDF_PREPARATION_FAILED"
            );

            return;
        }

        final String name =
            fileName(call);

        getActivity().runOnUiThread(() -> {

            try {

                PrintManager manager =
                    (PrintManager)
                    getActivity().getSystemService(
                        Context.PRINT_SERVICE
                    );

                if (manager == null) {

                    throw new IllegalStateException(
                        "PRINT_MANAGER_UNAVAILABLE"
                    );
                }

                PrintDocumentAdapter adapter =
                    new PrintDocumentAdapter() {

                    @Override
                    public void onLayout(
                        PrintAttributes oldAttributes,
                        PrintAttributes newAttributes,
                        CancellationSignal cancellation,
                        LayoutResultCallback callback,
                        Bundle extras
                    ) {

                        if (
                            cancellation.isCanceled()
                        ) {

                            callback.onLayoutCancelled();
                            return;
                        }

                        PrintDocumentInfo info =
                            new PrintDocumentInfo.Builder(
                                name
                            )
                                .setContentType(
                                    PrintDocumentInfo
                                        .CONTENT_TYPE_DOCUMENT
                                )
                                .build();

                        callback.onLayoutFinished(
                            info,
                            true
                        );
                    }

                    @Override
                    public void onWrite(
                        PageRange[] pages,
                        ParcelFileDescriptor destination,
                        CancellationSignal cancellation,
                        WriteResultCallback callback
                    ) {

                        getBridge().execute(() -> {

                            if (
                                cancellation.isCanceled()
                            ) {

                                try {
                                    destination.close();
                                } catch (Exception ignored) {}

                                callback.onWriteCancelled();
                                return;
                            }

                            try (
                                OutputStream output =
                                    new ParcelFileDescriptor
                                        .AutoCloseOutputStream(
                                            destination
                                        )
                            ) {

                                output.write(bytes);
                                output.flush();

                                if (
                                    cancellation.isCanceled()
                                ) {

                                    callback.onWriteCancelled();

                                } else {

                                    callback.onWriteFinished(
                                        new PageRange[]{
                                            PageRange.ALL_PAGES
                                        }
                                    );
                                }

                            } catch (Exception error) {

                                callback.onWriteFailed(
                                    "Unable to prepare PDF for printing."
                                );
                            }
                        });
                    }

                    @Override
                    public void onFinish() {

                        Arrays.fill(
                            bytes,
                            (byte) 0
                        );
                    }
                };

                PrintAttributes attributes =
                    new PrintAttributes.Builder()
                        .setMediaSize(
                            PrintAttributes.MediaSize.ISO_A4
                        )
                        .build();

                manager.print(
                    "PAISARULE - " + name,
                    adapter,
                    attributes
                );

                JSObject response =
                    new JSObject();

                response.put(
                    "success",
                    true
                );

                response.put(
                    "submitted",
                    true
                );

                call.resolve(response);

            } catch (Exception error) {

                Arrays.fill(
                    bytes,
                    (byte) 0
                );

                call.reject(
                    "PDF_PRINT_DIALOG_FAILED"
                );
            }
        });
    }
}