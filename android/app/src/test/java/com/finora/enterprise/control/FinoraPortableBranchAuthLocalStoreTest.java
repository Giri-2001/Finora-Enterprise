package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.junit.Test;

public final class FinoraPortableBranchAuthLocalStoreTest {

    private static final class FakeStoreIo
        implements FinoraPortableBranchAuthLocalStore.StoreIo {

        private byte[] data;

        private int writes;

        private boolean failNextWrite;

        @Override
        public boolean exists() {
            return data != null;
        }

        @Override
        public byte[] readBounded(
            int maximumBytes
        )
            throws IOException {

            if (data == null) {
                throw new IOException(
                    "Missing test data."
                );
            }

            if (data.length > maximumBytes) {
                throw new IOException(
                    "Oversized test data."
                );
            }

            return data.clone();
        }

        @Override
        public void writeAtomically(
            byte[] bytes
        )
            throws IOException {

            writes += 1;

            if (failNextWrite) {
                failNextWrite =
                    false;

                throw new IOException(
                    "Injected atomic write failure."
                );
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
            FinoraPortableBranchAuthLocalStore.DIRECTORY_NAME
        );

        assertEquals(
            "auth",
            FinoraPortableBranchAuthLocalStore.AUTH_SUBDIRECTORY
        );

        assertEquals(
            "finora-branch-auth.bin",
            FinoraPortableBranchAuthLocalStore.FILE_NAME
        );

        assertEquals(
            128 * 1024,
            FinoraPortableBranchAuthLocalStore.MAX_SERIALIZED_BYTES
        );
    }

    @Test
    public void missingLocalAuthReturnsNull()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
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
    public void localRoundtripPreservesSerializedEnvelope()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
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

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
                io
            );

        char[] chars =
            new char[
                FinoraPortableBranchAuthLocalStore.MAX_SERIALIZED_BYTES
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
            FinoraPortableBranchAuthLocalStore.MAX_SERIALIZED_BYTES,
            io.snapshot().length
        );

        assertEquals(
            serialized,
            store.read()
        );
    }

    @Test
    public void oversizedSerializedWriteFailsBeforeIo()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
                io
            );

        char[] chars =
            new char[
                FinoraPortableBranchAuthLocalStore.MAX_SERIALIZED_BYTES + 1
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
                "Oversized write must fail."
            );
        }
        catch (
            FinoraPortableBranchAuthLocalStore.StoreException expected
        ) {
            assertTrue(
                expected
                    .getMessage()
                    .contains(
                        "maximum serialized size"
                    )
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
    public void oversizedPersistedDataFailsClosed()
        throws Exception {

        FakeStoreIo io =
            new FakeStoreIo();

        byte[] oversized =
            new byte[
                FinoraPortableBranchAuthLocalStore.MAX_SERIALIZED_BYTES + 1
            ];

        Arrays.fill(
            oversized,
            (byte) 'A'
        );

        io.seed(
            oversized
        );

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
                io
            );

        try {

            store.read();

            fail(
                "Oversized persisted data must fail."
            );
        }
        catch (
            FinoraPortableBranchAuthLocalStore.StoreException expected
        ) {
            assertTrue(
                expected
                    .getMessage()
                    .contains(
                        "Unable to read"
                    )
            );
        }
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

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
                io
            );

        try {

            store.read();

            fail(
                "Malformed UTF-8 must fail."
            );
        }
        catch (
            FinoraPortableBranchAuthLocalStore.StoreException expected
        ) {
            assertTrue(
                expected
                    .getMessage()
                    .contains(
                        "valid UTF-8"
                    )
            );
        }
    }

    @Test
    public void failedAtomicWriteDoesNotReplacePreviousData()
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

        io.failNextWrite =
            true;

        FinoraPortableBranchAuthLocalStore store =
            new FinoraPortableBranchAuthLocalStore(
                io
            );

        try {

            store.write(
                "{\"generation\":2}"
            );

            fail(
                "Injected atomic write failure must propagate."
            );
        }
        catch (
            FinoraPortableBranchAuthLocalStore.StoreException expected
        ) {
            assertTrue(
                expected
                    .getMessage()
                    .contains(
                        "Unable to write"
                    )
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