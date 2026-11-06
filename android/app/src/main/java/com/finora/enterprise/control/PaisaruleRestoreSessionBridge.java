package com.finora.enterprise.control;

import android.content.Context;
import android.net.Uri;
import java.util.Arrays;

/**
 * PAISARULE_R175_C26
 *
 * Native-only verified Restore preparation bridge.
 * Never returns keys, storage bytes or backup contents
 * to WebView.
 *
 * Verification only: no USB writes.
 */
public final class PaisaruleRestoreSessionBridge {

    private PaisaruleRestoreSessionBridge() {}

        // PAISARULE_R175_C31
    // Native-only authenticated Restore commit.
    // No credential, key, scope or file bytes from JS.
    public static synchronized void commitSelectedBackup(
        Context context,
        Uri selectedBackupUri,
        Uri selectedUsbUri
    ) throws Exception {

        if (
            context == null ||
            selectedBackupUri == null ||
            selectedUsbUri == null
        ) {
            throw new IllegalArgumentException(
                "RESTORE_SELECTION_REQUIRED"
            );
        }

        FinoraNativeWalletSession
            .commitPaisaruleAndroidRestoreToNewUsb(
                context,
                selectedBackupUri,
                selectedUsbUri
            );
    }
    public static synchronized void verifySelectedBackup(
        Context context,
        Uri selectedBackupUri
    ) throws Exception {

        byte[][] files = null;

        try {
            files = FinoraNativeWalletSession
                .preparePaisaruleAndroidRestoreVerifiedFiles(
                    context,
                    selectedBackupUri
                );

            if (
                files == null ||
                files.length != 2 ||
                files[0] == null ||
                files[1] == null ||
                files[0].length == 0 ||
                files[1].length == 0
            ) {
                throw new IllegalStateException(
                    "RESTORE_VERIFIED_FILES_INVALID"
                );
            }

        } finally {
            if (files != null) {
                for (byte[] file : files) {
                    if (file != null) {
                        Arrays.fill(file, (byte) 0);
                    }
                }
            }
        }
    }
}