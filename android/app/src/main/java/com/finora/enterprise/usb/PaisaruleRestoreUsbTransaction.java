package com.finora.enterprise.usb;

import androidx.documentfile.provider.DocumentFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.util.Arrays;

/**
 * PAISARULE R175-C21
 *
 * Internal USB restore persistence component.
 *
 * Caller MUST authenticate Owner, validate backup envelope,
 * verify branch scope and parse the validated payload first.
 *
 * This component is intentionally not exposed to JavaScript.
 *
 * Fail closed: an incomplete marker is never silently cleared
 * after write or verification failure.
 */
final class PaisaruleRestoreUsbTransaction {

    private static final int MAX_FILE_BYTES = 32 * 1024 * 1024;

    private static final String PRIMARY =
        "finora-storage.json";

    private static final String SECONDARY =
        "finora-storage.backup.json";

    private static final String MARKER =
        "paisarule-restore-incomplete";

    private PaisaruleRestoreUsbTransaction() {}

    private static void require(
        boolean condition,
        String code
    ) {
        if (!condition) {
            throw new IllegalStateException(code);
        }
    }

    private static boolean equalHash(
        byte[] expected,
        byte[] actual
    ) throws Exception {
        byte[] a = MessageDigest
            .getInstance("SHA-256")
            .digest(expected);

        byte[] b = MessageDigest
            .getInstance("SHA-256")
            .digest(actual);

        try {
            return MessageDigest.isEqual(a, b);
        } finally {
            Arrays.fill(a, (byte) 0);
            Arrays.fill(b, (byte) 0);
        }
    }

    private static DocumentFile createExact(
        DocumentFile parent,
        String name
    ) {
        require(
            parent != null && parent.isDirectory() &&
            parent.canWrite() && parent.findFile(name) == null,
            "RESTORE_TARGET_NOT_EMPTY"
        );

        DocumentFile result = parent.createFile(
            "application/octet-stream",
            name
        );

        require(
            result != null &&
            result.isFile() &&
            name.equals(result.getName()),
            "RESTORE_FILE_CREATE_FAILED"
        );

        return result;
    }

    private static void writeExact(
        android.content.Context context,
        DocumentFile parent,
        String name,
        byte[] content
    ) throws Exception {

        DocumentFile output = createExact(parent, name);

        try (OutputStream stream = context
            .getContentResolver()
            .openOutputStream(
                output.getUri(),
                "wt"
            )) {

            require(
                stream != null,
                "RESTORE_OUTPUT_UNAVAILABLE"
            );

            stream.write(content);
            stream.flush();
        }

        byte[] readback;

        try (
            InputStream stream = context
                .getContentResolver()
                .openInputStream(output.getUri());

            ByteArrayOutputStream memory =
                new ByteArrayOutputStream()
        ) {
            require(
                stream != null,
                "RESTORE_READBACK_UNAVAILABLE"
            );

            byte[] buffer = new byte[32768];
            int length;

            while ((length = stream.read(buffer)) != -1) {
                require(
                    memory.size() <=
                    content.length - length,
                    "RESTORE_READBACK_SIZE_INVALID"
                );
                memory.write(buffer, 0, length);
            }

            readback = memory.toByteArray();
            Arrays.fill(buffer, (byte) 0);
        }

        try {
            require(
                readback.length == content.length &&
                equalHash(content, readback),
                "RESTORE_READBACK_HASH_MISMATCH"
            );
        } finally {
            Arrays.fill(readback, (byte) 0);
        }
    }

    /**
     * Must only receive files returned from verified
     * decryption + scope-bound payload validation.
     *
     * Caller must validate the removable SAF root independently.
     */
    static void writeVerifiedFilesToEmptyUsb(
        android.content.Context context,
        DocumentFile usbRoot,
        byte[] primary,
        byte[] secondary
    ) throws Exception {

        require(
            context != null &&
            usbRoot != null &&
            primary != null &&
            secondary != null,
            "RESTORE_INPUT_INVALID"
        );

        require(
            primary.length > 0 &&
            secondary.length > 0 &&
            primary.length <= MAX_FILE_BYTES &&
            secondary.length <= MAX_FILE_BYTES,
            "RESTORE_FILE_SIZE_INVALID"
        );

        // PAISARULE_R175_C22_GUARD
        // Root validation must occur immediately before writes.
        PaisaruleRestoreTargetGuard.requireEmptyUsbRoot(
            usbRoot
        );

        require(
            usbRoot.isDirectory() &&
            usbRoot.canRead() &&
            usbRoot.canWrite(),
            "RESTORE_USB_ACCESS_INVALID"
        );

        // Never proceed if another restore marker or FINORA
        // directory appears between validation and mutation.
        require(
            usbRoot.findFile(MARKER) == null &&
            usbRoot.findFile("FINORA") == null,
            "RESTORE_TARGET_CHANGED"
        );

        // Create a persistent fail-closed marker first.
        DocumentFile marker = createExact(
            usbRoot,
            MARKER
        );

        // If interrupted, marker remains and empty-root
        // validation rejects a subsequent automatic retry.
        DocumentFile finora = usbRoot.createDirectory("FINORA");

        require(
            finora != null &&
            finora.isDirectory() &&
            "FINORA".equals(finora.getName()),
            "RESTORE_DIRECTORY_CREATE_FAILED"
        );

        DocumentFile storage =
            finora.createDirectory("storage");

        require(
            storage != null &&
            storage.isDirectory() &&
            "storage".equals(storage.getName()),
            "RESTORE_DIRECTORY_CREATE_FAILED"
        );

        writeExact(
            context, storage, PRIMARY, primary
        );

        writeExact(
            context, storage, SECONDARY, secondary
        );

        // Both original files have been read-back verified.
        // A missing successful marker deletion is a failure,
        // not a success with an unresolved journal.
        require(
            marker.delete(),
            "RESTORE_FINALIZE_FAILED"
        );
    }
}