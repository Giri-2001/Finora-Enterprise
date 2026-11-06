package com.finora.enterprise.usb;

// PAISARULE_R175_C5
//
// Strict, bounded encrypted backup reader.
//
// - Reads only the URI supplied by the SAF backup picker.
// - Does not access or write any USB destination.
// - Does not grant login, decrypt, or expose content to JS.
// - Metadata is not trusted as the actual file length.
// - Actual bytes are capped independently of metadata.
//
// Caller MUST clear the returned bytes after processing.

import android.content.Context;
import android.net.Uri;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;

public final class PaisaruleRestoreBackupReader {

    public static final int MAX_PACKAGE_BYTES =
        96 * 1024 * 1024;

    private static final int BUFFER_BYTES = 65536;

    private PaisaruleRestoreBackupReader() {
    }

    public static byte[] readEncryptedBackup(
        Context context,
        Uri selectedBackupUri
    ) throws Exception {

        if (
            context == null ||
            selectedBackupUri == null ||
            !"content".equals(selectedBackupUri.getScheme())
        ) {
            throw new IllegalArgumentException(
                "RESTORE_BACKUP_URI_INVALID"
            );
        }

        byte[] buffer = new byte[BUFFER_BYTES];
        byte[] result = null;
        boolean success = false;

        try {
            // A provider's reported document length can be
            // unknown or inaccurate. Enforce actual bytes.

            try (
                InputStream input =
                    context.getContentResolver()
                        .openInputStream(selectedBackupUri);

                ByteArrayOutputStream output =
                    new ByteArrayOutputStream(BUFFER_BYTES)
            ) {
                if (input == null) {
                    throw new IllegalStateException(
                        "RESTORE_BACKUP_STREAM_UNAVAILABLE"
                    );
                }

                long total = 0L;
                int count;

                while (
                    (count = input.read(buffer)) != -1
                ) {
                    if (count == 0) {
                        continue;
                    }

                    total += count;

                    if (total > MAX_PACKAGE_BYTES) {
                        throw new IllegalStateException(
                            "RESTORE_BACKUP_ACTUAL_SIZE_EXCEEDED"
                        );
                    }

                    output.write(buffer, 0, count);
                }

                if (total == 0L) {
                    throw new IllegalStateException(
                        "RESTORE_BACKUP_EMPTY"
                    );
                }

                result = output.toByteArray();

                if (
                    result.length == 0 ||
                    result.length > MAX_PACKAGE_BYTES
                ) {
                    throw new IllegalStateException(
                        "RESTORE_BACKUP_SIZE_INVALID"
                    );
                }

                success = true;
                return result;
            }

        } finally {
            Arrays.fill(buffer, (byte) 0);

            if (!success && result != null) {
                Arrays.fill(result, (byte) 0);
            }
        }
    }
}