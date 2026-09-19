package com.finora.enterprise.control;

import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchDeviceTrustAuthorizationAuthorityTest {

    private static final String PORTABLE_FINGERPRINT =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static final String PUBLIC_KEY_FINGERPRINT =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    private static final class FakePortableAuth
        implements FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableAuthPort {

        FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState state =
                portableState(
                    1L
                );

        Exception failure;

        int calls;

        @Override
        public FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState authenticate(
                FinoraBranchDeviceTrustAuthorizationAuthority
                    .Principal principal,
                String password,
                String securityCode
            ) throws Exception {

            calls++;

            if (failure != null) {
                throw failure;
            }

            return state;
        }
    }

    private static final class FakePortabilityVerifier
        implements FinoraBranchDeviceTrustAuthorizationAuthority
            .PortabilityVerificationPort {

        boolean verified =
            true;

        Exception failure;

        int calls;

        @Override
        public boolean verify(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .AuthenticatedPortableState state
        ) throws Exception {

            calls++;

            if (failure != null) {
                throw failure;
            }

            return verified;
        }
    }

    private static final class FakeBinding
        implements FinoraBranchDeviceTrustAuthorizationAuthority
            .NativeBindingPort {

        FinoraBranchDeviceTrustAuthorizationAuthority
            .NativeBinding binding =
                binding();

        Exception failure;

        int calls;

        @Override
        public FinoraBranchDeviceTrustAuthorizationAuthority
            .NativeBinding get()
                throws Exception {

            calls++;

            if (failure != null) {
                throw failure;
            }

            return binding;
        }
    }

    private static final class FakeStore
        implements FinoraBranchDeviceTrustAuthorizationAuthority
            .DeviceTrustStorePort {

        List<
            FinoraBranchDeviceTrustStore.Record
        > records =
            new ArrayList<>();

        Exception readFailure;
        Exception persistFailure;

        int reads;
        int writes;

        List<
            FinoraBranchDeviceTrustStore.Record
        > persisted;

        String persistedUpdatedAt;

        @Override
        public List<
            FinoraBranchDeviceTrustStore.Record
        > readAll()
            throws Exception {

            reads++;

            if (readFailure != null) {
                throw readFailure;
            }

            return new ArrayList<>(
                records
            );
        }

        @Override
        public void persist(
            List<
                FinoraBranchDeviceTrustStore.Record
            > records,
            String updatedAt
        ) throws Exception {

            if (persistFailure != null) {
                throw persistFailure;
            }

            writes++;

            persisted =
                new ArrayList<>(
                    records
                );

            persistedUpdatedAt =
                updatedAt;

            this.records =
                new ArrayList<>(
                    records
                );
        }
    }

    private static final class FakeClock
        implements FinoraBranchDeviceTrustAuthorizationAuthority
            .ClockPort {

        String now =
            "2026-09-18T12:00:00.000Z";

        @Override
        public String nowIso() {
            return now;
        }
    }

    private static final class Fixture {

        final FakePortableAuth portableAuth =
            new FakePortableAuth();

        final FakePortabilityVerifier verifier =
            new FakePortabilityVerifier();

        final FakeBinding binding =
            new FakeBinding();

        final FakeStore store =
            new FakeStore();

        final FakeClock clock =
            new FakeClock();

        final FinoraBranchDeviceTrustAuthorizationAuthority
            authority =
                new FinoraBranchDeviceTrustAuthorizationAuthority(
                    portableAuth,
                    verifier,
                    binding,
                    store,
                    clock
                );
    }

    @Test
    public void wrongSecurityCodeFailsWithZeroMutation()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.portableAuth.failure =
            new Exception(
                "AUTHENTICATION_FAILED"
            );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "WRONG-SECURITY-CODE"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );

        assertEquals(
            0,
            fixture.store.reads
        );

        assertEquals(
            0,
            fixture.binding.calls
        );
    }

    @Test
    public void staleAuthGenerationFailsWithZeroMutation()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.portableAuth.state =
            portableState(
                1L
            );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    2L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_PORTABLE_AUTH_PAYLOAD_MISMATCH,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );

        assertEquals(
            0,
            fixture.binding.calls
        );
    }

    @Test
    public void payloadPrincipalMismatchFailsWithZeroMutation()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.portableAuth.state =
            new FinoraBranchDeviceTrustAuthorizationAuthority
                .AuthenticatedPortableState(
                    "AUTH-STATE-1",
                    1L,
                    "USER-1",
                    "OwnerUser",
                    "owneruser",
                    "Different Name",
                    "OWNER",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "LOCAL",
                    "REAL",
                    null,
                    PORTABLE_FINGERPRINT
                );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_PORTABLE_AUTH_PAYLOAD_MISMATCH,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );
    }

    @Test
    public void portabilityVerificationFailureHasZeroMutation()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.verifier.verified =
            false;

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_PORTABILITY_AUTH_VERIFICATION_FAILED,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );

        assertEquals(
            0,
            fixture.binding.calls
        );
    }

    @Test
    public void missingNativeBindingHasZeroMutation()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.binding.binding =
            null;

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_NATIVE_BINDING_UNAVAILABLE,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );
    }

    @Test
    public void correctProofAuthorizesExactCurrentAndroidDevice()
        throws Exception {

        Fixture fixture =
            new Fixture();

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_AUTHORIZED,
            result.status
        );

        assertEquals(
            1,
            fixture.store.writes
        );

        assertEquals(
            1,
            fixture.store.persisted.size()
        );

        FinoraBranchDeviceTrustStore.Record record =
            fixture.store.persisted.get(
                0
            );

        assertEquals(
            "AUTH-STATE-1",
            record.authStateId
        );

        assertEquals(
            1L,
            record.authGeneration
        );

        assertEquals(
            "USER-1",
            record.userId
        );

        assertEquals(
            "owneruser",
            record.canonicalUsername
        );

        assertEquals(
            "ANDROID",
            record.platform
        );

        assertEquals(
            "INSTALLATION-1",
            record.installationId
        );

        assertEquals(
            "BINDING-1",
            record.bindingKeyId
        );

        assertEquals(
            PORTABLE_FINGERPRINT,
            record.portableAuthFingerprint
        );

        assertEquals(
            fixture.clock.now,
            record.trustedAt
        );

        assertEquals(
            fixture.clock.now,
            record.updatedAt
        );

        assertEquals(
            fixture.clock.now,
            fixture.store.persistedUpdatedAt
        );
    }

    @Test
    public void repeatedExactDeviceIsIdempotentlyAlreadyTrusted()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.store.records =
            new ArrayList<>(
                Collections.singletonList(
                    trustedRecord()
                )
            );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_ALREADY_TRUSTED,
            result.status
        );

        assertEquals(
            0,
            fixture.store.writes
        );

        assertTrue(
            result.record ==
            fixture.store.records.get(
                0
            )
        );
    }

    @Test
    public void historicalLineageExactDeviceDoesNotCreateDuplicate()
        throws Exception {

        Fixture fixture =
            new Fixture();

        FinoraBranchDeviceTrustStore.Record historical =
            new FinoraBranchDeviceTrustStore.Record(
                "OLD-AUTH-STATE",
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
                "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                "ANDROID",
                "INSTALLATION-1",
                "BINDING-1",
                "SHA-256",
                PUBLIC_KEY_FINGERPRINT,
                "2026-09-17T12:00:00.000Z",
                "2026-09-17T12:00:00.000Z",
                1
            );

        fixture.store.records =
            new ArrayList<>(
                Collections.singletonList(
                    historical
                )
            );

        fixture.portableAuth.state =
            portableState(
                2L
            );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    2L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_ALREADY_TRUSTED,
            result.status
        );

        assertEquals(
            0,
            fixture.store.writes
        );

        assertEquals(
            "OLD-AUTH-STATE",
            result.record.authStateId
        );
    }

    @Test
    public void revokedExactDeviceCannotBeReauthorized() throws Exception {
        Fixture fixture = new Fixture();
        FinoraBranchDeviceTrustStore.Record revoked = new FinoraBranchDeviceTrustStore.Record(
            "AUTH-STATE-1", "USER-1", "owneruser", "OWNER-1", "BUSINESS-1", "BRANCH-1", "LOCAL", "REAL", null, 1L, "SHA256", PORTABLE_FINGERPRINT, "ANDROID", "INSTALLATION-1", "BINDING-1", "SHA-256", PUBLIC_KEY_FINGERPRINT, FinoraBranchDeviceTrustLifecycle.STATUS_REVOKED, "2026-09-19T10:00:00.000Z", "2026-09-18T11:00:00.000Z", "2026-09-19T10:00:00.000Z", FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION
        );
        fixture.store.records = new ArrayList<>(Collections.singletonList(revoked));
        FinoraBranchDeviceTrustAuthorizationAuthority.Result result = fixture.authority.authorize(principal(1L), "correct-password", "correct-security-code");
        assertFalse(result.success);
        assertEquals(FinoraBranchDeviceTrustAuthorizationAuthority.ERROR_DEVICE_REVOKED, result.errorCode);
        assertEquals(0, fixture.store.writes);
        assertEquals(FinoraBranchDeviceTrustLifecycle.STATUS_REVOKED, fixture.store.records.get(0).status);
    }

    @Test
    public void ambiguousExactDeviceAuthorityFailsClosed()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.store.records =
            new ArrayList<>();

        fixture.store.records.add(
            trustedRecord()
        );

        fixture.store.records.add(
            trustedRecord()
        );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_DEVICE_TRUST_STORE_FAILED,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );
    }

    @Test
    public void persistenceFailureFailsClosed()
        throws Exception {

        Fixture fixture =
            new Fixture();

        fixture.store.persistFailure =
            new Exception(
                "WRITE-FAILED"
            );

        FinoraBranchDeviceTrustAuthorizationAuthority.Result result =
            fixture.authority.authorize(
                principal(
                    1L
                ),
                "correct-password",
                "correct-security-code"
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_DEVICE_TRUST_PERSIST_FAILED,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.store.writes
        );
    }

    private static FinoraBranchDeviceTrustAuthorizationAuthority
        .Principal principal(
            long authGeneration
        ) {

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .Principal(
                authGeneration,
                "USER-1",
                "OwnerUser",
                "Owner Name",
                "OWNER",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "REAL",
                null
            );
    }

    private static FinoraBranchDeviceTrustAuthorizationAuthority
        .AuthenticatedPortableState portableState(
            long authGeneration
        ) {

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState(
                "AUTH-STATE-1",
                authGeneration,
                "USER-1",
                "OwnerUser",
                "owneruser",
                "Owner Name",
                "OWNER",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "REAL",
                null,
                PORTABLE_FINGERPRINT
            );
    }

    private static FinoraBranchDeviceTrustAuthorizationAuthority
        .NativeBinding binding() {

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .NativeBinding(
                "INSTALLATION-1",
                "BINDING-1",
                "SHA-256",
                PUBLIC_KEY_FINGERPRINT
            );
    }

    private static FinoraBranchDeviceTrustStore.Record
        trustedRecord() {

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
            1L,
            "SHA256",
            PORTABLE_FINGERPRINT,
            "ANDROID",
            "INSTALLATION-1",
            "BINDING-1",
            "SHA-256",
            PUBLIC_KEY_FINGERPRINT,
            "2026-09-18T11:00:00.000Z",
            "2026-09-18T11:00:00.000Z",
            1
        );
    }
}