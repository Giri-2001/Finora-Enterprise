package com.finora.enterprise.control;

import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchDeviceTrustAuthorityTest {

    private static final String PORTABLE_FINGERPRINT =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static final String PUBLIC_KEY_FINGERPRINT =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    private static final class FakePortableAuth
        implements FinoraBranchDeviceTrustAuthority.PortableAuthPort {

        FinoraBranchDeviceTrustAuthority.PortableAuthIdentity
            identity;

        Exception failure;

        String observedStorageMode;

        @Override
        public FinoraBranchDeviceTrustAuthority.PortableAuthIdentity
            read(
                String storageMode
            ) throws Exception {

            observedStorageMode =
                storageMode;

            if (failure != null) {
                throw failure;
            }

            return identity;
        }
    }

    private static final class FakeBinding
        implements FinoraBranchDeviceTrustAuthority.NativeBindingPort {

        FinoraBranchDeviceTrustAuthority.NativeBinding
            binding;

        Exception failure;

        @Override
        public FinoraBranchDeviceTrustAuthority.NativeBinding get()
            throws Exception {

            if (failure != null) {
                throw failure;
            }

            return binding;
        }
    }

    private static final class FakeTrustStore
        implements FinoraBranchDeviceTrustAuthority.DeviceTrustStorePort {

        List<FinoraBranchDeviceTrustStore.Record>
            records =
                Collections.emptyList();

        Exception failure;

        @Override
        public List<FinoraBranchDeviceTrustStore.Record> readAll()
            throws Exception {

            if (failure != null) {
                throw failure;
            }

            return records;
        }
    }

    @Test
    public void unknownDeviceRequiresSecurityCode()
        throws Exception {

        Fixture fixture =
            fixture();

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .STATUS_SECURITY_CODE_REQUIRED,
            result.status
        );

        assertEquals(
            PORTABLE_FINGERPRINT,
            result.portableAuthFingerprint
        );

        assertEquals(
            "LOCAL",
            fixture.portableAuth
                .observedStorageMode
        );

        assertNull(
            result.errorCode
        );
    }

    @Test
    public void exactTrustedDeviceUsesPasswordOnlyFastPath()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.trustStore.records =
            Collections.singletonList(
                record(
                    1L,
                    "INSTALLATION-1",
                    "BINDING-1",
                    PUBLIC_KEY_FINGERPRINT
                )
            );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority.STATUS_TRUSTED,
            result.status
        );

        assertEquals(
            PORTABLE_FINGERPRINT,
            result.portableAuthFingerprint
        );
    }

    @Test
    public void historicalAuthGenerationDoesNotRevokeExactTrustedDevice()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.trustStore.records =
            Collections.singletonList(
                record(
                    1L,
                    "INSTALLATION-1",
                    "BINDING-1",
                    PUBLIC_KEY_FINGERPRINT
                )
            );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    2L
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority.STATUS_TRUSTED,
            result.status
        );
    }

    @Test
    public void changedNativeBindingRequiresSecurityCode()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.trustStore.records =
            Collections.singletonList(
                record(
                    1L,
                    "OLD-INSTALLATION",
                    "OLD-BINDING",
                    PUBLIC_KEY_FINGERPRINT
                )
            );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .STATUS_SECURITY_CODE_REQUIRED,
            result.status
        );
    }

    @Test
    public void wrongPrincipalDoesNotUseAnotherUsersTrust()
        throws Exception {

        Fixture fixture =
            fixture();

        FinoraBranchDeviceTrustStore.Record otherUser =
            new FinoraBranchDeviceTrustStore.Record(
                "AUTH-STATE-1",
                "OTHER-USER",
                "otheruser",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "REAL",
                null,
                1L,
                "SHA256",
                PORTABLE_FINGERPRINT,
                "ANDROID",
                "INSTALLATION-1",
                "BINDING-1",
                "SHA-256",
                PUBLIC_KEY_FINGERPRINT,
                "2026-09-18T10:00:00.000Z",
                "2026-09-18T10:00:00.000Z",
                1
            );

        fixture.trustStore.records =
            Collections.singletonList(
                otherUser
            );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .STATUS_SECURITY_CODE_REQUIRED,
            result.status
        );
    }

    @Test
    public void revokedExactDeviceFailsClosed() throws Exception {
        Fixture fixture = fixture();
        FinoraBranchDeviceTrustStore.Record revoked = new FinoraBranchDeviceTrustStore.Record(
            "AUTH-STATE-1", "USER-1", "owneruser", "OWNER-1", "BUSINESS-1", "BRANCH-1", "LOCAL", "REAL", null, 1L, "SHA256", PORTABLE_FINGERPRINT, "ANDROID", "INSTALLATION-1", "BINDING-1", "SHA-256", PUBLIC_KEY_FINGERPRINT, FinoraBranchDeviceTrustLifecycle.STATUS_REVOKED, "2026-09-19T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-19T10:00:00.000Z", FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION
        );
        fixture.trustStore.records = Collections.singletonList(revoked);
        FinoraBranchDeviceTrustAuthority.Result result = fixture.authority.check(principal(1L));
        assertFalse(result.success);
        assertEquals(FinoraBranchDeviceTrustAuthority.ERROR_DEVICE_REVOKED, result.errorCode);
        assertNull(result.status);
    }

    @Test
    public void ambiguousMatchingTrustFailsClosed()
        throws Exception {

        Fixture fixture =
            fixture();

        List<FinoraBranchDeviceTrustStore.Record> records =
            new ArrayList<>();

        records.add(
            record(
                1L,
                "INSTALLATION-1",
                "BINDING-1",
                PUBLIC_KEY_FINGERPRINT
            )
        );

        records.add(
            record(
                1L,
                "INSTALLATION-1",
                "BINDING-1",
                PUBLIC_KEY_FINGERPRINT
            )
        );

        fixture.trustStore.records =
            records;

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .ERROR_DEVICE_TRUST_STORE_FAILED,
            result.errorCode
        );

        assertNull(
            result.status
        );
    }

    @Test
    public void portableAuthOuterIdentityMismatchFailsClosed()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.portableAuth.identity =
            new FinoraBranchDeviceTrustAuthority
                .PortableAuthIdentity(
                    "owneruser",
                    "OWNER-1",
                    "BUSINESS-1",
                    "OTHER-BRANCH",
                    PORTABLE_FINGERPRINT
                );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .ERROR_PORTABLE_AUTH_MISMATCH,
            result.errorCode
        );
    }

    @Test
    public void portableAuthUnavailableFailsClosed()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.portableAuth.identity =
            null;

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .ERROR_PORTABLE_AUTH_UNAVAILABLE,
            result.errorCode
        );
    }

    @Test
    public void nativeBindingUnavailableFailsClosed()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.binding.binding =
            null;

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .ERROR_NATIVE_BINDING_UNAVAILABLE,
            result.errorCode
        );
    }

    @Test
    public void corruptTrustStoreFailsClosed()
        throws Exception {

        Fixture fixture =
            fixture();

        fixture.trustStore.failure =
            new Exception(
                "CORRUPT"
            );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    1L
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .ERROR_DEVICE_TRUST_STORE_FAILED,
            result.errorCode
        );
    }

    @Test
    public void differentHistoricalPortableFingerprintDoesNotRevokeTrustedBinding()
        throws Exception {

        Fixture fixture =
            fixture();

        String historicalFingerprint =
            "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

        FinoraBranchDeviceTrustStore.Record historical =
            new FinoraBranchDeviceTrustStore.Record(
                "AUTH-STATE-OLD",
                "USER-1",
                "owneruser",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "REAL",
                null,
                1L,
                "SHA256",
                historicalFingerprint,
                "ANDROID",
                "INSTALLATION-1",
                "BINDING-1",
                "SHA-256",
                PUBLIC_KEY_FINGERPRINT,
                "2026-09-17T10:00:00.000Z",
                "2026-09-17T10:00:00.000Z",
                1
            );

        fixture.trustStore.records =
            Collections.singletonList(
                historical
            );

        FinoraBranchDeviceTrustAuthority.Result result =
            fixture.authority.check(
                principal(
                    2L
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority.STATUS_TRUSTED,
            result.status
        );

        assertEquals(
            PORTABLE_FINGERPRINT,
            result.portableAuthFingerprint
        );
    }

    private static final class Fixture {

        final FakePortableAuth
            portableAuth;

        final FakeBinding
            binding;

        final FakeTrustStore
            trustStore;

        final FinoraBranchDeviceTrustAuthority
            authority;

        Fixture(
            FakePortableAuth portableAuth,
            FakeBinding binding,
            FakeTrustStore trustStore,
            FinoraBranchDeviceTrustAuthority authority
        ) {

            this.portableAuth =
                portableAuth;

            this.binding =
                binding;

            this.trustStore =
                trustStore;

            this.authority =
                authority;
        }
    }

    private static Fixture fixture() {

        FakePortableAuth portableAuth =
            new FakePortableAuth();

        portableAuth.identity =
            new FinoraBranchDeviceTrustAuthority
                .PortableAuthIdentity(
                    "owneruser",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    PORTABLE_FINGERPRINT
                );

        FakeBinding binding =
            new FakeBinding();

        binding.binding =
            new FinoraBranchDeviceTrustAuthority
                .NativeBinding(
                    "INSTALLATION-1",
                    "BINDING-1",
                    "SHA-256",
                    PUBLIC_KEY_FINGERPRINT
                );

        FakeTrustStore trustStore =
            new FakeTrustStore();

        FinoraBranchDeviceTrustAuthority authority =
            new FinoraBranchDeviceTrustAuthority(
                portableAuth,
                binding,
                trustStore
            );

        return new Fixture(
            portableAuth,
            binding,
            trustStore,
            authority
        );
    }

    private static FinoraBranchDeviceTrustAuthority.Principal
        principal(
            long authGeneration
        ) {

        return new FinoraBranchDeviceTrustAuthority.Principal(
            authGeneration,
            "USER-1",
            "OwnerUser",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "LOCAL",
            "REAL",
            null
        );
    }

    private static FinoraBranchDeviceTrustStore.Record record(
        long authGeneration,
        String installationId,
        String bindingKeyId,
        String publicKeyFingerprint
    ) {

        return new FinoraBranchDeviceTrustStore.Record(
            "AUTH-STATE-1",
            "USER-1",
            "owneruser",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "LOCAL",
            "REAL",
            null,
            authGeneration,
            "SHA256",
            PORTABLE_FINGERPRINT,
            "ANDROID",
            installationId,
            bindingKeyId,
            "SHA-256",
            publicKeyFingerprint,
            "2026-09-18T10:00:00.000Z",
            "2026-09-18T10:00:00.000Z",
            1
        );
    }
}