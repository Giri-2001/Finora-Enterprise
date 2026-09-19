package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.fail;

import org.junit.Test;

public final class
    FinoraPortableBranchAuthAuthenticatedStoreAuthorityTest {

    private static final class FakeStoreReader
        implements
            FinoraPortableBranchAuthAuthenticatedStoreAuthority.StoreReader {

        private String serialized;

        private int calls;

        private String observedStorageMode;

        private FinoraPortableBranchAuthStore.StoreException error;

        @Override
        public String read(
            String storageMode
        )
            throws FinoraPortableBranchAuthStore.StoreException {

            calls += 1;

            observedStorageMode =
                storageMode;

            if (error != null) {
                throw error;
            }

            return serialized;
        }
    }

    private static final class FakeAuthenticator
        implements
            FinoraPortableBranchAuthAuthenticatedStoreAuthority.SerializedAuthenticator {

        private int calls;

        private String observedSerialized;

        private String observedPassword;

        private String observedSecurityCode;

        private FinoraPortableBranchAuthEnvelopeCodec.Scope
            observedExpectedScope;

        private FinoraPortableBranchAuthPayloadCodec.Payload result;

        @Override
        public FinoraPortableBranchAuthPayloadCodec.Payload authenticate(
            String serialized,
            String password,
            String securityCode,
            FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope
        ) {

            calls += 1;

            observedSerialized =
                serialized;

            observedPassword =
                password;

            observedSecurityCode =
                securityCode;

            observedExpectedScope =
                expectedScope;

            return result;
        }
    }

    @Test
    public void exactStorageAndFactorsReachAuthenticatedComposition()
        throws Exception {

        FakeStoreReader store =
            new FakeStoreReader();

        FakeAuthenticator authenticator =
            new FakeAuthenticator();

        store.serialized =
            "{\"portableBranchAuthEnvelope\":\"test\"}";

        FinoraPortableBranchAuthAuthenticatedStoreAuthority authority =
            new FinoraPortableBranchAuthAuthenticatedStoreAuthority(
                store,
                authenticator
            );

        FinoraPortableBranchAuthPayloadCodec.Payload result =
            authority.readAndAuthenticate(
                "USB",
                "Owner-Password",
                "Owner-Security-Code",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1"
            );

        assertNull(
            result
        );

        assertEquals(
            1,
            store.calls
        );

        assertEquals(
            "USB",
            store.observedStorageMode
        );

        assertEquals(
            1,
            authenticator.calls
        );

        assertEquals(
            store.serialized,
            authenticator.observedSerialized
        );

        assertEquals(
            "Owner-Password",
            authenticator.observedPassword
        );

        assertEquals(
            "Owner-Security-Code",
            authenticator.observedSecurityCode
        );

        assertEquals(
            "OWNER-1",
            authenticator
                .observedExpectedScope
                .ownerId
        );

        assertEquals(
            "BUSINESS-1",
            authenticator
                .observedExpectedScope
                .businessId
        );

        assertEquals(
            "BRANCH-1",
            authenticator
                .observedExpectedScope
                .branchId
        );
    }

    @Test
    public void missingPortableAuthReturnsNullWithoutCrypto()
        throws Exception {

        FakeStoreReader store =
            new FakeStoreReader();

        FakeAuthenticator authenticator =
            new FakeAuthenticator();

        store.serialized =
            null;

        FinoraPortableBranchAuthAuthenticatedStoreAuthority authority =
            new FinoraPortableBranchAuthAuthenticatedStoreAuthority(
                store,
                authenticator
            );

        assertNull(
            authority.readAndAuthenticate(
                "LOCAL",
                "password",
                null,
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1"
            )
        );

        assertEquals(
            1,
            store.calls
        );

        assertEquals(
            0,
            authenticator.calls
        );
    }

    @Test
    public void storeFailurePropagatesBeforeCrypto()
        throws Exception {

        FakeStoreReader store =
            new FakeStoreReader();

        FakeAuthenticator authenticator =
            new FakeAuthenticator();

        FinoraPortableBranchAuthStore.StoreException expectedError =
            new FinoraPortableBranchAuthStore.StoreException(
                FinoraPortableBranchAuthStore.INVALID_STORAGE_MODE,
                "Injected store failure."
            );

        store.error =
            expectedError;

        FinoraPortableBranchAuthAuthenticatedStoreAuthority authority =
            new FinoraPortableBranchAuthAuthenticatedStoreAuthority(
                store,
                authenticator
            );

        try {

            authority.readAndAuthenticate(
                "CLOUD",
                "password",
                "security-code",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1"
            );

            fail(
                "Store failure must propagate."
            );
        }
        catch (
            FinoraPortableBranchAuthStore.StoreException actual
        ) {
            assertSame(
                expectedError,
                actual
            );
        }

        assertEquals(
            1,
            store.calls
        );

        assertEquals(
            0,
            authenticator.calls
        );
    }

    @Test
    public void expectedScopeIsBuiltFromTrustedArgumentsExactly() {

        FinoraPortableBranchAuthEnvelopeCodec.Scope scope =
            FinoraPortableBranchAuthAuthenticatedStoreAuthority
                .buildExpectedScope(
                    "OWNER-ABC",
                    "BUSINESS-XYZ",
                    "BRANCH-123"
                );

        assertEquals(
            "OWNER-ABC",
            scope.ownerId
        );

        assertEquals(
            "BUSINESS-XYZ",
            scope.businessId
        );

        assertEquals(
            "BRANCH-123",
            scope.branchId
        );
    }

    @Test
    public void invalidExpectedScopeFailsBeforeStoreAccess()
        throws Exception {

        FakeStoreReader store =
            new FakeStoreReader();

        FakeAuthenticator authenticator =
            new FakeAuthenticator();

        FinoraPortableBranchAuthAuthenticatedStoreAuthority authority =
            new FinoraPortableBranchAuthAuthenticatedStoreAuthority(
                store,
                authenticator
            );

        try {

            authority.readAndAuthenticate(
                "LOCAL",
                "password",
                "security-code",
                "OWNER-1",
                " ",
                "BRANCH-1"
            );

            fail(
                "Blank expected businessId must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }

        assertEquals(
            0,
            store.calls
        );

        assertEquals(
            0,
            authenticator.calls
        );
    }

    @Test
    public void securityCodeIsNotPrevalidatedByComposition()
        throws Exception {

        FakeStoreReader store =
            new FakeStoreReader();

        FakeAuthenticator authenticator =
            new FakeAuthenticator();

        store.serialized =
            "{\"portableBranchAuthEnvelope\":\"test\"}";

        FinoraPortableBranchAuthAuthenticatedStoreAuthority authority =
            new FinoraPortableBranchAuthAuthenticatedStoreAuthority(
                store,
                authenticator
            );

        authority.readAndAuthenticate(
            "LOCAL",
            "password",
            null,
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1"
        );

        assertEquals(
            1,
            authenticator.calls
        );

        assertNull(
            authenticator.observedSecurityCode
        );
    }

    @Test
    public void malformedSerializedEnvelopeFailsAtCanonicalParser()
        throws Exception {

        try {

            FinoraPortableBranchAuthAuthenticatedStoreAuthority
                .authenticateSerialized(
                    "not-json",
                    "password",
                    "security-code",
                    new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                        "OWNER-1",
                        "BUSINESS-1",
                        "BRANCH-1"
                    )
                );

            fail(
                "Malformed serialized envelope must fail."
            );
        }
        catch (RuntimeException expected) {
            // Canonical EnvelopeCodec parse failure.
        }
    }
}