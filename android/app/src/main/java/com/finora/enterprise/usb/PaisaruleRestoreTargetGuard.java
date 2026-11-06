package com.finora.enterprise.usb;

// PAISARULE_R175_B7
//
// Pure preflight validation for a restore destination.
//
// IMPORTANT:
// - This class does not select a USB device.
// - This class does not create folders or documents.
// - This class does not modify existing storage.
// - The caller must separately establish that this is
//   the explicitly selected NEW removable USB.
// - The caller must recheck the destination immediately
//   before any future restore write.

import androidx.documentfile.provider.DocumentFile;

public final class PaisaruleRestoreTargetGuard {

    private PaisaruleRestoreTargetGuard() {
    }

    public static void requireEmptyStorageDirectory(
        DocumentFile storageDirectory
    ) {

        if (storageDirectory == null) {
            throw new IllegalStateException(
                "RESTORE_STORAGE_DIRECTORY_MISSING"
            );
        }

        if (
            !storageDirectory.exists() ||
            !storageDirectory.isDirectory()
        ) {
            throw new IllegalStateException(
                "RESTORE_STORAGE_DIRECTORY_INVALID"
            );
        }

        if (
            !storageDirectory.canRead() ||
            !storageDirectory.canWrite()
        ) {
            throw new IllegalStateException(
                "RESTORE_STORAGE_PERMISSION_REQUIRED"
            );
        }

        // Do not permit restoring over ANY existing
        // document, including temp, backup, or
        // otherwise unknown files.

        DocumentFile[] entries;

        try {
            entries = storageDirectory.listFiles();
        } catch (Exception error) {
            throw new IllegalStateException(
                "RESTORE_DIRECTORY_INSPECTION_FAILED"
            );
        }

        if (entries == null) {
            throw new IllegalStateException(
                "RESTORE_DIRECTORY_INSPECTION_FAILED"
            );
        }

        if (entries.length != 0) {
            throw new IllegalStateException(
                "RESTORE_TARGET_NOT_EMPTY"
            );
        }

        // Explicit critical-file checks as an
        // additional fail-closed protection.

        String[] prohibited = new String[] {
            "finora-storage.json",
            "finora-storage.backup.json",
            "finora-storage.tmp.json"
        };

        for (String name : prohibited) {

            DocumentFile existing;

            try {
                existing = storageDirectory.findFile(name);
            } catch (Exception error) {
                throw new IllegalStateException(
                    "RESTORE_TARGET_INSPECTION_FAILED"
                );
            }

            if (existing != null) {
                throw new IllegalStateException(
                    "RESTORE_TARGET_NOT_EMPTY"
                );
            }
        }
    }

    // ========================================================
    // PAISARULE_R175_B9
    //
    // Pure preflight for a NEW removable USB root.
    //
    // The caller must supply the root chosen explicitly
    // through Android Storage Access Framework.
    //
    // This method performs no writes and does not
    // modify saved USB selections.
    //
    // IMPORTANT:
    // The caller must independently validate the SAF
    // tree URI, removable-volume identity and permissions.
    // ========================================================

    public static void requireEmptyUsbRoot(
        DocumentFile usbRoot
    ) {

        if (
            usbRoot == null ||
            !usbRoot.exists() ||
            !usbRoot.isDirectory()
        ) {
            throw new IllegalStateException(
                "RESTORE_USB_ROOT_INVALID"
            );
        }

        if (
            !usbRoot.canRead() ||
            !usbRoot.canWrite()
        ) {
            throw new IllegalStateException(
                "RESTORE_USB_PERMISSION_REQUIRED"
            );
        }

        final DocumentFile[] existing;

        try {
            existing = usbRoot.listFiles();
        } catch (Exception error) {
            throw new IllegalStateException(
                "RESTORE_USB_ROOT_INSPECTION_FAILED"
            );
        }

        if (existing == null) {
            throw new IllegalStateException(
                "RESTORE_USB_ROOT_INSPECTION_FAILED"
            );
        }

        // Restore is allowed only on a genuinely
        // empty destination root.
        //
        // Any existing file or directory is rejected.
        // This includes FINORA, unrelated user files,
        // previous backup data and incomplete restores.

        if (existing.length != 0) {
            throw new IllegalStateException(
                "RESTORE_USB_NOT_EMPTY"
            );
        }
    }
}