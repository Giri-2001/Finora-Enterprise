package com.finora.enterprise.usb;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class FinoraUsbPortableAuthRootAuthorityTest {

    @Test
    public void removableVolumeRootIsPortableAuthReady() {

        assertTrue(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    "ABCD-1234:"
                )
        );
    }

    @Test
    public void legacyFinoraStorageSelectionRequiresReauthorization() {

        assertFalse(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    "ABCD-1234:FINORA/storage"
                )
        );
    }

    @Test
    public void arbitraryUsbSubdirectoryIsNotPortableAuthRoot() {

        assertFalse(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    "ABCD-1234:Documents"
                )
        );
    }

    @Test
    public void malformedDocumentIdsFailClosed() {

        assertFalse(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    null
                )
        );

        assertFalse(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    ""
                )
        );

        assertFalse(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    "ABCD-1234"
                )
        );

        assertFalse(
            FinoraUsbStorage
                .isPortableAuthUsbRootDocumentId(
                    ":"
                )
        );
    }
}