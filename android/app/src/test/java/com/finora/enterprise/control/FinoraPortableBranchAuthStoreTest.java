package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Test;

public final class FinoraPortableBranchAuthStoreTest {

    private static final class FakeModeStore
        implements FinoraPortableBranchAuthStore.ModeStore {

        private boolean present;

        private String serialized;

        private int existsCalls;

        private int readCalls;

        private int writeCalls;

        private FinoraPortableBranchAuthStore.StoreException
            existsError;

        private FinoraPortableBranchAuthStore.StoreException
            readError;

        private FinoraPortableBranchAuthStore.StoreException
            writeError;

        @Override
        public boolean exists()
            throws FinoraPortableBranchAuthStore.StoreException {

            existsCalls += 1;

            if (existsError != null) {
                throw existsError;
            }

            return present;
        }

        @Override
        public String read()
            throws FinoraPortableBranchAuthStore.StoreException {

            readCalls += 1;

            if (readError != null) {
                throw readError;
            }

            return serialized;
        }

        @Override
        public void write(
            String value
        )
            throws FinoraPortableBranchAuthStore.StoreException {

            writeCalls += 1;

            if (writeError != null) {
                throw writeError;
            }

            serialized =
                value;

            present =
                true;
        }
    }

    @Test
    public void localReadConsultsOnlyLocalStore()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        local.serialized =
            "{\"storageMode\":\"LOCAL\"}";

        local.present =
            true;

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        assertEquals(
            local.serialized,
            store.read(
                "LOCAL"
            )
        );

        assertEquals(
            1,
            local.readCalls
        );

        assertEquals(
            0,
            usb.readCalls
        );

        assertEquals(
            0,
            usb.existsCalls
        );

        assertEquals(
            0,
            usb.writeCalls
        );
    }

    @Test
    public void usbReadConsultsOnlyUsbStore()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        usb.serialized =
            "{\"storageMode\":\"USB\"}";

        usb.present =
            true;

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        assertEquals(
            usb.serialized,
            store.read(
                "USB"
            )
        );

        assertEquals(
            1,
            usb.readCalls
        );

        assertEquals(
            0,
            local.readCalls
        );

        assertEquals(
            0,
            local.existsCalls
        );

        assertEquals(
            0,
            local.writeCalls
        );
    }

    @Test
    public void usbFailureNeverFallsBackToLocal()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        local.serialized =
            "{\"storageMode\":\"LOCAL\"}";

        local.present =
            true;

        usb.readError =
            new FinoraPortableBranchAuthStore.StoreException(
                FinoraPortableBranchAuthUsbStore
                    .REAUTHORIZATION_REQUIRED,
                "Select removable USB root."
            );

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        try {

            store.read(
                "USB"
            );

            fail(
                "USB failure must not fall back to LOCAL."
            );
        }
        catch (
            FinoraPortableBranchAuthStore.StoreException expected
        ) {

            assertEquals(
                FinoraPortableBranchAuthUsbStore
                    .REAUTHORIZATION_REQUIRED,
                expected.code
            );
        }

        assertEquals(
            1,
            usb.readCalls
        );

        assertEquals(
            0,
            local.readCalls
        );

        assertEquals(
            0,
            local.existsCalls
        );

        assertEquals(
            0,
            local.writeCalls
        );
    }

    @Test
    public void localWriteNeverConsultsUsb()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        store.write(
            "LOCAL",
            "{\"generation\":1}"
        );

        assertEquals(
            1,
            local.writeCalls
        );

        assertEquals(
            "{\"generation\":1}",
            local.serialized
        );

        assertEquals(
            0,
            usb.writeCalls
        );

        assertEquals(
            0,
            usb.readCalls
        );

        assertEquals(
            0,
            usb.existsCalls
        );
    }

    @Test
    public void usbWriteNeverConsultsLocal()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        store.write(
            "USB",
            "{\"generation\":2}"
        );

        assertEquals(
            1,
            usb.writeCalls
        );

        assertEquals(
            "{\"generation\":2}",
            usb.serialized
        );

        assertEquals(
            0,
            local.writeCalls
        );

        assertEquals(
            0,
            local.readCalls
        );

        assertEquals(
            0,
            local.existsCalls
        );
    }

    @Test
    public void existsDispatchIsModeExact()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        local.present =
            true;

        usb.present =
            false;

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        assertTrue(
            store.exists(
                "LOCAL"
            )
        );

        assertFalse(
            store.exists(
                "USB"
            )
        );

        assertEquals(
            1,
            local.existsCalls
        );

        assertEquals(
            1,
            usb.existsCalls
        );
    }

    @Test
    public void invalidModesFailBeforeAnyStoreAccess()
        throws Exception {

        String[] invalidModes =
            new String[] {
                null,
                "",
                " ",
                "local",
                "usb",
                " LOCAL ",
                "CLOUD"
            };

        for (String mode : invalidModes) {

            FakeModeStore local =
                new FakeModeStore();

            FakeModeStore usb =
                new FakeModeStore();

            FinoraPortableBranchAuthStore store =
                new FinoraPortableBranchAuthStore(
                    local,
                    usb
                );

            try {

                store.read(
                    mode
                );

                fail(
                    "Invalid storageMode must fail closed: " +
                    mode
                );
            }
            catch (
                FinoraPortableBranchAuthStore.StoreException expected
            ) {

                assertEquals(
                    FinoraPortableBranchAuthStore
                        .INVALID_STORAGE_MODE,
                    expected.code
                );
            }

            assertEquals(
                0,
                local.readCalls
            );

            assertEquals(
                0,
                usb.readCalls
            );

            assertEquals(
                0,
                local.existsCalls
            );

            assertEquals(
                0,
                usb.existsCalls
            );

            assertEquals(
                0,
                local.writeCalls
            );

            assertEquals(
                0,
                usb.writeCalls
            );
        }
    }

    @Test
    public void missingSelectedStoreRemainsNull()
        throws Exception {

        FakeModeStore local =
            new FakeModeStore();

        FakeModeStore usb =
            new FakeModeStore();

        FinoraPortableBranchAuthStore store =
            new FinoraPortableBranchAuthStore(
                local,
                usb
            );

        assertNull(
            store.read(
                "LOCAL"
            )
        );

        assertNull(
            store.read(
                "USB"
            )
        );
    }
}