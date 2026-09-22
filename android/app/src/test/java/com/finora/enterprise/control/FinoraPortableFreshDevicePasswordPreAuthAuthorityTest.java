package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class
    FinoraPortableFreshDevicePasswordPreAuthAuthorityTest {

    @Test
    public void validUsbPasswordRequiresSecurityCode() {

        FakeStoreReader store =
            new FakeStoreReader(
                "portable-auth"
            );

        FakePasswordProbe probe =
            new FakePasswordProbe(
                true
            );

        FinoraPortableFreshDevicePasswordPreAuthAuthority
            authority =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    store,
                    probe
                );

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            result =
                authority.authenticate(
                    new FinoraPortableFreshDevicePasswordPreAuthAuthority
                        .Request(
                            "Admin",
                            "Correct-Password-01",
                            "USB"
                        )
                );

        assertTrue(
            result.success
        );

        assertEquals(
            "SECURITY_CODE_REQUIRED",
            result.status
        );

        assertNull(
            result.errorCode
        );

        assertEquals(
            "USB",
            store.lastStorageMode
        );

        assertEquals(
            1,
            store.readCount
        );

        assertEquals(
            1,
            probe.verifyCount
        );
    }

    @Test
    public void wrongCredentialsNeverRequireSecurityCode() {

        FakeStoreReader store =
            new FakeStoreReader(
                "portable-auth"
            );

        FakePasswordProbe probe =
            new FakePasswordProbe(
                false
            );

        FinoraPortableFreshDevicePasswordPreAuthAuthority
            authority =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    store,
                    probe
                );

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            result =
                authority.authenticate(
                    new FinoraPortableFreshDevicePasswordPreAuthAuthority
                        .Request(
                            "Admin",
                            "Wrong-Password-99",
                            "USB"
                        )
                );

        assertFalse(
            result.success
        );

        assertNull(
            result.status
        );

        assertEquals(
            "INVALID_CREDENTIALS",
            result.errorCode
        );

        assertEquals(
            "Invalid username or password.",
            result.error
        );

        assertEquals(
            1,
            probe.verifyCount
        );
    }

    @Test
    public void selectedStorageModeIsNeverProbedOrFallback() {

        FakeStoreReader store =
            new FakeStoreReader(
                "portable-auth"
            );

        FakePasswordProbe probe =
            new FakePasswordProbe(
                true
            );

        FinoraPortableFreshDevicePasswordPreAuthAuthority
            authority =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    store,
                    probe
                );

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            result =
                authority.authenticate(
                    new FinoraPortableFreshDevicePasswordPreAuthAuthority
                        .Request(
                            "Admin",
                            "Correct-Password-01",
                            "LOCAL"
                        )
                );

        assertTrue(
            result.success
        );

        assertEquals(
            "LOCAL",
            store.lastStorageMode
        );

        assertEquals(
            1,
            store.readCount
        );
    }

    @Test
    public void invalidStorageModeFailsBeforeStoreRead() {

        FakeStoreReader store =
            new FakeStoreReader(
                "portable-auth"
            );

        FakePasswordProbe probe =
            new FakePasswordProbe(
                true
            );

        FinoraPortableFreshDevicePasswordPreAuthAuthority
            authority =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    store,
                    probe
                );

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            result =
                authority.authenticate(
                    new FinoraPortableFreshDevicePasswordPreAuthAuthority
                        .Request(
                            "Admin",
                            "Correct-Password-01",
                            "OTHER"
                        )
                );

        assertFalse(
            result.success
        );

        assertEquals(
            "INVALID_REQUEST",
            result.errorCode
        );

        assertEquals(
            0,
            store.readCount
        );

        assertEquals(
            0,
            probe.verifyCount
        );
    }

    @Test
    public void invalidCredentialShapeRemainsGeneric() {

        FakeStoreReader store =
            new FakeStoreReader(
                "portable-auth"
            );

        FakePasswordProbe probe =
            new FakePasswordProbe(
                new IllegalArgumentException(
                    "synthetic invalid credential"
                )
            );

        FinoraPortableFreshDevicePasswordPreAuthAuthority
            authority =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    store,
                    probe
                );

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            result =
                authority.authenticate(
                    new FinoraPortableFreshDevicePasswordPreAuthAuthority
                        .Request(
                            "missing-user",
                            "bad",
                            "USB"
                        )
                );

        assertFalse(
            result.success
        );

        assertEquals(
            "INVALID_CREDENTIALS",
            result.errorCode
        );

        assertEquals(
            "Invalid username or password.",
            result.error
        );
    }

    @Test
    public void storeFailureDoesNotFallBackToAnotherMode() {

        FakeStoreReader store =
            new FakeStoreReader(
                new Exception(
                    "synthetic USB failure"
                )
            );

        FakePasswordProbe probe =
            new FakePasswordProbe(
                true
            );

        FinoraPortableFreshDevicePasswordPreAuthAuthority
            authority =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    store,
                    probe
                );

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            result =
                authority.authenticate(
                    new FinoraPortableFreshDevicePasswordPreAuthAuthority
                        .Request(
                            "Admin",
                            "Correct-Password-01",
                            "USB"
                        )
                );

        assertFalse(
            result.success
        );

        assertEquals(
            "PORTABLE_AUTH_FAILED",
            result.errorCode
        );

        assertEquals(
            1,
            store.readCount
        );

        assertEquals(
            "USB",
            store.lastStorageMode
        );

        assertEquals(
            0,
            probe.verifyCount
        );
    }

    private static final class FakeStoreReader
        implements FinoraPortableFreshDevicePasswordPreAuthAuthority
            .StoreReader {

        private final String serialized;
        private final Exception failure;

        int readCount;
        String lastStorageMode;

        FakeStoreReader(
            String serialized
        ) {
            this.serialized =
                serialized;

            this.failure =
                null;
        }

        FakeStoreReader(
            Exception failure
        ) {
            this.serialized =
                null;

            this.failure =
                failure;
        }

        @Override
        public String read(
            String storageMode
        ) throws Exception {

            readCount++;
            lastStorageMode =
                storageMode;

            if (failure != null) {
                throw failure;
            }

            return serialized;
        }
    }

    private static final class FakePasswordProbe
        implements FinoraPortableFreshDevicePasswordPreAuthAuthority
            .PasswordProbe {

        private final boolean result;
        private final RuntimeException failure;

        int verifyCount;

        FakePasswordProbe(
            boolean result
        ) {
            this.result =
                result;

            this.failure =
                null;
        }

        FakePasswordProbe(
            RuntimeException failure
        ) {
            this.result =
                false;

            this.failure =
                failure;
        }

        @Override
        public boolean verify(
            String serialized,
            String username,
            String password
        ) {
            verifyCount++;

            if (failure != null) {
                throw failure;
            }

            return result;
        }
    }
}