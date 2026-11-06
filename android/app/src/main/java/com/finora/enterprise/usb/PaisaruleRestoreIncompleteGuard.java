package com.finora.enterprise.usb;

import android.content.Context;
import android.net.Uri;
import androidx.documentfile.provider.DocumentFile;

/**
 * PAISARULE R175-C28
 *
 * Fail-closed protection against opening a USB with
 * an interrupted PAISARULE Restore transaction.
 *
 * This must be invoked at storage access boundaries,
 * not only from the Restore screen.
 */
final class PaisaruleRestoreIncompleteGuard {

    private static final String MARKER =
        "paisarule-restore-incomplete";

    private PaisaruleRestoreIncompleteGuard() {}
    // PAISARULE_R175_C30
    // Check marker at storage and accessible parent levels.
    // Root-level check in target resolution is also mandatory.
    static void requireCompleteAncestors(
        DocumentFile directory
    ) {
        if (directory == null) {
            throw new IllegalStateException(
                "RESTORE_STORAGE_DIRECTORY_INVALID"
            );
        }

        DocumentFile current = directory;

        for (int depth = 0; depth < 16; depth++) {
            requireComplete(current);

            DocumentFile parent = current.getParentFile();

            if (parent == null) {
                return;
            }

            if (
                parent.getUri().equals(current.getUri())
            ) {
                throw new IllegalStateException(
                    "RESTORE_STORAGE_PARENT_CYCLE"
                );
            }

            current = parent;
        }

        throw new IllegalStateException(
            "RESTORE_STORAGE_DEPTH_INVALID"
        );
    }


    static void requireComplete(
        DocumentFile usbRoot
    ) {
        if (
            usbRoot == null ||
            !usbRoot.exists() ||
            !usbRoot.isDirectory() ||
            !usbRoot.canRead()
        ) {
            throw new IllegalStateException(
                "RESTORE_USB_ROOT_UNAVAILABLE"
            );
        }

        if (usbRoot.findFile(MARKER) != null) {
            throw new IllegalStateException(
                "RESTORE_INCOMPLETE_USB_BLOCKED"
            );
        }
    }

    static void requireComplete(
        Context context,
        Uri treeUri
    ) {
        if (
            context == null ||
            treeUri == null ||
            !"content".equals(treeUri.getScheme())
        ) {
            throw new IllegalStateException(
                "RESTORE_USB_URI_INVALID"
            );
        }

        DocumentFile root =
            DocumentFile.fromTreeUri(context, treeUri);

        requireComplete(root);
    }
}