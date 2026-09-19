package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.junit.Test;

public final class FinoraPortableBranchAuthUsbStoreTest {

    private static final class FakeStoreIo
        implements FinoraPortableBranchAuthUsbStore.StoreIo {

        private byte[] data;

        private int writes;

        private FinoraPortableBranchAuthUsbStore.StoreException
            nextExistsError;

        private FinoraPortableBranchAuthUsbStore.StoreException
            nextWriteError;

        @Override
        public boolean exists()
            throws FinoraPortableBranchAuthUsbStore.StoreException {

            if (nextExistsError != null) {

                FinoraPortableBranchAuthUsbStore.StoreException
                    error =
                        nextExistsError;

                nextExistsError =
                    null;

                throw error;
            }

            return data != null;
        }

        @Override
        public byte[] readBounded(
            int maximumBytes
        )
            throws FinoraPortableBranchAuthUsbStore.StoreException {

            if (data == null) {
                throw new FinoraPortableBranchAuthUsbStore.StoreException(
                    FinoraPortableBranchAuthUsbStore.USB_STORE_FAILED,
                    "Missing test data."
                );
            }

            if (data.length > maximumBytes) {
                throw new FinoraPortableBranchAuthUsbStore.StoreException(
                    FinoraPortableBranchAuthUsbStore.INVALID_SERIALIZED,
                    "Oversized test data."
                );
            }

            return data.clone();
        }

        @Override
        public void writeRecoverably(
            byte[] bytes
        )
            throws FinoraPortableBranchAuthUsbStore.StoreException {

            writes += 1;

            if (nextWriteError != null) {

                FinoraPortableBranchAuthUsbStore.StoreException
                    error =
                        nextWriteError;

                nextWriteError =
                    null;

                throw error;
            }

            data =
                bytes.clone();
        }

        void seed(
            byte[] bytes
        ) {
            data =
                bytes == null
                    ? null
                    : bytes.clone();
        }

        byte[] snapshot() {

            return data == null
                ? null
                : data.clone();
        }
    }

    @Test
    public void physicalContractMatchesWindowsAuthority() {

        assertEquals(
            "FINORA",
            FinoraPortableBranchAuthUsbStore.DIRECTORY_NAME
        );

        assertEquals(
            "auth",
            FinoraPortableBranchAuthUsbStore.AUTH_SUBDIRECTORY
        );

        assertEquals(
            "finora-branch-auth.bin",
            FinoraPortableBranchAuthUsbStore.FILE_NAME
        );

        assertEquals(
            128 * 1024,
            FinoraPortableBranchAuthUsbStore.MAX_SERIALIZED_BYTES
        );
    }

    @Test
    public void rootAvailabilityMapsFailClosed() {

        assertEquals(
            FinoraPortableBranchAuthUsbStore.REAUTHORIZATION_REQUIRED,
            FinoraPortableBranchAuthUsbStore
                .errorCodeForRootAvailability(
                    "REAUTHORIZATION_REQUIRED"
                )
        );

        assertEquals(
            FinoraPortableBranchAuthUsbStore.USB_NOT_CONFIGURED,
            FinoraPortableBranchAuthUsbStore
                .errorCodeForRootAvailability(
                    "NOT_CONFIGURED"
                )
        );

        assertEquals(
            FinoraPortableBranchAuthUsbStore.USB_UNAVAILABLE,
            FinoraPortableBranchAuthUsbStore
                .errorCodeForRootAvailability(
                    "UNAVAILABLE"
                )
        );

        assertEquals(
            FinoraPortableBranchAuthUsbStore.USB_UNAVAILABLE,
            FinoraPortableBranchAuthUsbStore
                .errorCodeForRootAvailability(
                    "ERROR"
                )
        );
    }

    @Test
    public void missingUsbAuthReturnsNull()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        assertFalse(
            store.exists()
        );

        assertNull(
            store.read()
        );

        assertEquals(
            0,
            io.writes
        );
    }

    @Test
    public void usbRoundtripPreservesSerializedEnvelope()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        String serialized =
            "{\"format\":\"FINORA_PORTABLE_BRANCH_AUTH_V1\"}";

        store.write(
            serialized
        );

        assertTrue(
            store.exists()
        );

        assertEquals(
            serialized,
            store.read()
        );

        assertEquals(
            1,
            io.writes
        );
    }

    @Test
    public void exactMaximumSerializedSizeIsAccepted()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        char[] chars =
            new char[
                FinoraPortableBranchAuthUsbStore.MAX_SERIALIZED_BYTES
            ];

        Arrays.fill(
            chars,
            'A'
        );

        String serialized =
            new String(
                chars
            );

        store.write(
            serialized
        );

        assertEquals(
            FinoraPortableBranchAuthUsbStore.MAX_SERIALIZED_BYTES,
            io.snapshot().length
        );

        assertEquals(
            serialized,
            store.read()
        );
    }

    @Test
    public void oversizedWriteFailsBeforeUsbIo()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        char[] chars =
            new char[
                FinoraPortableBranchAuthUsbStore.MAX_SERIALIZED_BYTES + 1
            ];

        Arrays.fill(
            chars,
            'A'
        );

        try {

            store.write(
                new String(
                    chars
                )
            );

            fail(
                "Oversized USB Portable Auth write must fail."
            );
        }
        catch (
            FinoraPortableBranchAuthUsbStore.StoreException expected
        ) {
            assertEquals(
                FinoraPortableBranchAuthUsbStore.INVALID_SERIALIZED,
                expected.code
            );
        }

        assertEquals(
            0,
            io.writes
        );

        assertNull(
            io.snapshot()
        );
    }

    @Test
    public void malformedUtf8FailsClosed()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        io.seed(
            new byte[] {
                (byte) 0xC3,
                (byte) 0x28
            }
        );

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        try {

            store.read();

            fail(
                "Malformed USB Portable Auth UTF-8 must fail."
            );
        }
        catch (
            FinoraPortableBranchAuthUsbStore.StoreException expected
        ) {

            assertEquals(
                FinoraPortableBranchAuthUsbStore.INVALID_SERIALIZED,
                expected.code
            );
        }
    }

    @Test
    public void reauthorizationRequirementPropagatesWithoutFallback()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        io.nextExistsError =
            new FinoraPortableBranchAuthUsbStore.StoreException(
                FinoraPortableBranchAuthUsbStore.REAUTHORIZATION_REQUIRED,
                "Select USB root."
            );

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        try {

            store.read();

            fail(
                "Legacy FINORA/storage selection must require reauthorization."
            );
        }
        catch (
            FinoraPortableBranchAuthUsbStore.StoreException expected
        ) {

            assertEquals(
                FinoraPortableBranchAuthUsbStore.REAUTHORIZATION_REQUIRED,
                expected.code
            );
        }
    }

    @Test
    public void failedRecoverableWriteDoesNotReplacePreviousData()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        String original =
            "{\"generation\":1}";

        io.seed(
            original.getBytes(
                StandardCharsets.UTF_8
            )
        );

        io.nextWriteError =
            new FinoraPortableBranchAuthUsbStore.StoreException(
                FinoraPortableBranchAuthUsbStore.USB_STORE_FAILED,
                "Injected USB write failure."
            );

        FinoraPortableBranchAuthUsbStore store =
            new FinoraPortableBranchAuthUsbStore(
                io
            );

        try {

            store.write(
                "{\"generation\":2}"
            );

            fail(
                "Injected recoverable USB write failure must propagate."
            );
        }
        catch (
            FinoraPortableBranchAuthUsbStore.StoreException expected
        ) {

            assertEquals(
                FinoraPortableBranchAuthUsbStore.USB_STORE_FAILED,
                expected.code
            );
        }

        assertEquals(
            original,
            new String(
                io.snapshot(),
                StandardCharsets.UTF_8
            )
        );
    }
}