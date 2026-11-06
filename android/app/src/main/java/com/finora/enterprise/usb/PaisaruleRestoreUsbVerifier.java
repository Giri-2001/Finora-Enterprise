package com.finora.enterprise.usb;

// PAISARULE_R175_C1
//
// Restore-only SAF verification.
// Does NOT select a USB, change preferences or write files.
// The caller must provide a newly user-selected tree URI.
//
// A previously configured application USB selection must
// NOT be substituted for the explicit Restore selection.

import android.content.Context;
import android.content.UriPermission;
import android.net.Uri;
import android.os.Environment;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.provider.DocumentsContract;

import androidx.documentfile.provider.DocumentFile;

import java.util.List;

public final class PaisaruleRestoreUsbVerifier {

    private static final String AUTHORITY =
        "com.android.externalstorage.documents";

    private PaisaruleRestoreUsbVerifier() {
    }

    public static DocumentFile requireNewEmptyRemovableRoot(
        Context context,
        Uri selectedTreeUri
    ) {
        if (
            context == null ||
            selectedTreeUri == null ||
            !"content".equals(selectedTreeUri.getScheme()) ||
            !AUTHORITY.equals(selectedTreeUri.getAuthority()) ||
            !DocumentsContract.isTreeUri(selectedTreeUri)
        ) {
            throw new IllegalStateException(
                "RESTORE_USB_TREE_INVALID"
            );
        }

        String documentId;

        try {
            documentId = DocumentsContract.getTreeDocumentId(
                selectedTreeUri
            );
        } catch (Exception error) {
            throw new IllegalStateException(
                "RESTORE_USB_TREE_INVALID"
            );
        }

        // Removable USB volume ROOT only:
        // UUID: is permitted; UUID:folder/path is forbidden.
        // "primary:" and other internal-storage IDs fail.

        if (
            documentId == null ||
            !documentId.matches(
                "(?i)^[0-9a-f]{4}-[0-9a-f]{4}:$"
            )
        ) {
            throw new IllegalStateException(
                "RESTORE_USB_ROOT_SELECTION_REQUIRED"
            );
        }

        String selectedUuid = documentId.substring(
            0, documentId.length() - 1
        );

        boolean permissionFound = false;

        List<UriPermission> permissions =
            context.getContentResolver()
                .getPersistedUriPermissions();

        if (permissions != null) {
            for (UriPermission permission : permissions) {
                if (
                    selectedTreeUri.equals(permission.getUri()) &&
                    permission.isReadPermission() &&
                    permission.isWritePermission()
                ) {
                    permissionFound = true;
                    break;
                }
            }
        }

        if (!permissionFound) {
            throw new IllegalStateException(
                "RESTORE_USB_PERMISSION_NOT_PERSISTED"
            );
        }

        StorageManager storageManager =
            (StorageManager) context.getSystemService(
                Context.STORAGE_SERVICE
            );

        if (storageManager == null) {
            throw new IllegalStateException(
                "RESTORE_USB_STORAGE_SERVICE_UNAVAILABLE"
            );
        }

        boolean matchingVolume = false;

        List<StorageVolume> volumes =
            storageManager.getStorageVolumes();

        if (volumes != null) {
            for (StorageVolume volume : volumes) {
                String uuid = volume.getUuid();

                if (
                    volume.isRemovable() &&
                    uuid != null &&
                    selectedUuid.equalsIgnoreCase(uuid) &&
                    Environment.MEDIA_MOUNTED.equals(
                        volume.getState()
                    )
                ) {
                    matchingVolume = true;
                    break;
                }
            }
        }

        // Fail closed if the OEM cannot expose a matching
        // removable StorageVolume identity.
        if (!matchingVolume) {
            throw new IllegalStateException(
                "RESTORE_REMOVABLE_USB_NOT_VERIFIED"
            );
        }

        DocumentFile root;

        try {
            root = DocumentFile.fromTreeUri(
                context,
                selectedTreeUri
            );
        } catch (Exception error) {
            throw new IllegalStateException(
                "RESTORE_USB_DOCUMENT_ROOT_UNAVAILABLE"
            );
        }

        PaisaruleRestoreTargetGuard
            .requireEmptyUsbRoot(root);

        return root;
    }
}