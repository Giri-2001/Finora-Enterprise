package com.finora.enterprise.control;

import android.content.ContentResolver;
import androidx.documentfile.provider.DocumentFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.Locale;

/**
 * FINORA V2 encrypted USB authority writer.
 *
 * Write-once only. Never replaces an existing auth file.
 * The caller MUST complete signed server verification and
 * full enrollment checks before invoking this class.
 *
 * This is a persistence component, NOT login authorization.
 */
public final class FinoraPortableBranchAuthV2UsbWriter {

    public static final String AUTH_FILE =
        "finora-branch-auth.bin";

    private static final int MAX_BYTES = 256 * 1024;

    private static final Object WRITE_LOCK = new Object();

    private FinoraPortableBranchAuthV2UsbWriter() {}

    public enum Status {
        WRITTEN,
        CONFLICT,
        INVALID_REQUEST,
        IO_FAILED
    }

    public static final class Result {
        public final Status status;
        public final String message;

        private Result(Status status, String message) {
            this.status = status;
            this.message = message;
        }

        public boolean success() {
            return status == Status.WRITTEN;
        }
    }

    private static Result result(Status status, String message) {
        return new Result(status, message);
    }

    public static boolean accountFolderMatches(
        String folderName,
        String canonicalUsername
    ) {
        if (folderName == null || canonicalUsername == null) {
            return false;
        }

        String normalizedUsername = Normalizer.normalize(
            canonicalUsername.trim(),
            Normalizer.Form.NFKC
        ).toLowerCase(Locale.ROOT);

        String normalizedFolder = Normalizer.normalize(
            folderName,
            Normalizer.Form.NFKC
        ).toLowerCase(Locale.ROOT);

        return normalizedUsername.matches(
            "[a-z0-9][a-z0-9._-]*"
        ) && normalizedUsername.equals(normalizedFolder);
    }

    public static Result writeNew(
        ContentResolver resolver,
        DocumentFile accountFolder,
        String canonicalUsername,
        byte[] encryptedV2Envelope
    ) {
        if (
            resolver == null ||
            accountFolder == null ||
            !accountFolder.isDirectory() ||
            !accountFolder.canWrite() ||
            !accountFolderMatches(
                accountFolder.getName(),
                canonicalUsername
            ) ||
            encryptedV2Envelope == null ||
            encryptedV2Envelope.length == 0 ||
            encryptedV2Envelope.length > MAX_BYTES
        ) {
            return result(
                Status.INVALID_REQUEST,
                "FINORA V2 USB enrollment input or account folder is invalid."
            );
        }

        synchronized (WRITE_LOCK) {
            try {
                DocumentFile finora =
                    accountFolder.findFile("FINORA");

                if (finora != null && !finora.isDirectory()) {
                    return result(
                        Status.CONFLICT,
                        "Existing FINORA path is not a directory."
                    );
                }

                if (finora == null) {
                    finora = accountFolder.createDirectory("FINORA");
                }

                if (finora == null || !finora.isDirectory()) {
                    return result(
                        Status.IO_FAILED,
                        "FINORA directory could not be opened."
                    );
                }

                DocumentFile auth = finora.findFile("auth");

                if (auth != null && !auth.isDirectory()) {
                    return result(
                        Status.CONFLICT,
                        "Existing FINORA auth path is not a directory."
                    );
                }

                if (auth == null) {
                    auth = finora.createDirectory("auth");
                }

                if (auth == null || !auth.isDirectory()) {
                    return result(
                        Status.IO_FAILED,
                        "FINORA auth directory could not be opened."
                    );
                }

                // Never overwrite a V1, V2 or unreadable existing file.
                if (auth.findFile(AUTH_FILE) != null) {
                    return result(
                        Status.CONFLICT,
                        "Existing portable authentication file must not be replaced."
                    );
                }

                DocumentFile created = auth.createFile(
                    "application/octet-stream",
                    AUTH_FILE
                );

                if (created == null) {
                    return result(
                        Status.IO_FAILED,
                        "Portable authentication file could not be created."
                    );
                }

                if (
                    !AUTH_FILE.equals(created.getName()) ||
                    !created.isFile()
                ) {
                    return result(
                        Status.IO_FAILED,
                        "USB provider did not create the expected authentication filename."
                    );
                }

                // Never open an existing file in truncation mode.
                // Only the newly created document URI is written.
                try (OutputStream output =
                    resolver.openOutputStream(created.getUri(), "w")) {

                    if (output == null) {
                        throw new IllegalStateException(
                            "USB output stream unavailable."
                        );
                    }

                    output.write(encryptedV2Envelope);
                    output.flush();
                }

                ByteArrayOutputStream readBack =
                    new ByteArrayOutputStream();

                try (InputStream input =
                    resolver.openInputStream(created.getUri())) {

                    if (input == null) {
                        throw new IllegalStateException(
                            "USB read-back unavailable."
                        );
                    }

                    byte[] buffer = new byte[8192];
                    int count;

                    while ((count = input.read(buffer)) != -1) {
                        if (readBack.size() + count > MAX_BYTES) {
                            throw new IllegalStateException(
                                "USB read-back exceeds size limit."
                            );
                        }

                        readBack.write(buffer, 0, count);
                    }
                }

                if (!MessageDigest.isEqual(
                    encryptedV2Envelope,
                    readBack.toByteArray()
                )) {
                    return result(
                        Status.IO_FAILED,
                        "USB authentication read-back verification failed."
                    );
                }

                return result(
                    Status.WRITTEN,
                    "FINORA encrypted V2 authority persisted and verified."
                );

            } catch (Exception error) {
                // No automatic deletion: an incomplete file remains a
                // conflict until an explicit verified recovery procedure.
                // This prevents silently replacing damaged auth state.
                return result(
                    Status.IO_FAILED,
                    "FINORA USB enrollment write or verification failed."
                );
            }
        }
    }
}