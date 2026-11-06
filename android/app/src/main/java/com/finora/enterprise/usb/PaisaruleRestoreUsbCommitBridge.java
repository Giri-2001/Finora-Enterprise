package com.finora.enterprise.usb;

import android.content.Context;
import android.net.Uri;
import androidx.documentfile.provider.DocumentFile;

/**
 * PAISARULE R175-C27
 *
 * Internal, native-only Restore commit bridge.
 * NOT a Capacitor PluginMethod.
 *
 * The caller must hold the native Owner session lock,
 * reverify the live Owner authority and supply files
 * returned by authenticated V1 backup decryption.
 */
public final class PaisaruleRestoreUsbCommitBridge {

    private PaisaruleRestoreUsbCommitBridge() {}

    public static void commitVerifiedFiles(
        Context context,
        Uri selectedUsbUri,
        byte[][] verifiedFiles
    ) throws Exception {

        if (
            context == null ||
            selectedUsbUri == null ||
            verifiedFiles == null ||
            verifiedFiles.length != 2 ||
            verifiedFiles[0] == null ||
            verifiedFiles[1] == null
        ) {
            throw new IllegalArgumentException(
                "RESTORE_COMMIT_INPUT_INVALID"
            );
        }

        // Recheck the selected root immediately before
        // committing. Never use the active branch USB
        // as an implicit restore target.
        PaisaruleRestoreUsbVerifier
            .requireNewEmptyRemovableRoot(
                context,
                selectedUsbUri
            );

        DocumentFile usbRoot = DocumentFile.fromTreeUri(
            context,
            selectedUsbUri
        );

        if (
            usbRoot == null ||
            !usbRoot.isDirectory() ||
            !usbRoot.canRead() ||
            !usbRoot.canWrite()
        ) {
            throw new IllegalStateException(
                "RESTORE_TARGET_INVALID"
            );
        }

        PaisaruleRestoreTargetGuard
            .requireEmptyUsbRoot(usbRoot);

        // This writer creates an incomplete marker first,
        // writes original bytes and verifies both readbacks.
        // Errors must propagate; never auto-ignore them.
        PaisaruleRestoreUsbTransaction
            .writeVerifiedFilesToEmptyUsb(
                context,
                usbRoot,
                verifiedFiles[0],
                verifiedFiles[1]
            );
    }
}