package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Field;
import java.util.ArrayDeque;
import java.util.Queue;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class
    FinoraBranchLoginSessionAuthorityTest {

    @Test
    public void issueReturnsAuthoritativeOpaqueSessionView() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult result =
            fixture.authority.issue(
                identity()
            );

        assertTrue(
            result.success
        );

        assertEquals(
            "FINORA-SESSION-TEST-1",
            result.data.sessionId
        );

        assertEquals(
            "USER-1",
            result.data.userId
        );

        assertEquals(
            "owner",
            result.data.username
        );

        assertEquals(
            "ADMIN",
            result.data.role
        );

        assertEquals(
            "OWNER-1",
            result.data.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            result.data.businessId
        );

        assertEquals(
            "BRANCH-1",
            result.data.branchId
        );

        assertEquals(
            "USB",
            result.data.storageMode
        );

        assertEquals(
            "REAL",
            result.data.dataContext
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ACCESS_MODE_ACTIVE,
            result.data.accessMode
        );

        assertEquals(
            "2026-09-18T13:00:00Z",
            result.data.loginTime
        );

        assertEquals(
            "2026-09-18T13:00:00Z",
            result.data.lastActivity
        );

        assertEquals(
            "2026-09-18T13:00:01Z",
            result.data.validatedAt
        );

        assertEquals(
            1,
            fixture.authority.activeSessionCountForTest()
        );
    }

    @Test
    public void issueRevokesPreviousSessionForSameCredential() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult first =
            fixture.authority.issue(
                identity()
            );

        fixture.wallClock.add(
            "2026-09-18T13:01:00Z"
        );

        fixture.wallClock.add(
            "2026-09-18T13:01:01Z"
        );

        fixture.sessionIds.add(
            "FINORA-SESSION-TEST-2"
        );

        FinoraBranchLoginSessionAuthority.SessionResult second =
            fixture.authority.issue(
                identity()
            );

        assertTrue(
            first.success
        );

        assertTrue(
            second.success
        );

        assertEquals(
            1,
            fixture.authority.activeSessionCountForTest()
        );

        FinoraBranchLoginSessionAuthority.SessionResult old =
            fixture.authority.validate(
                first.data.sessionId
            );

        assertFalse(
            old.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_SESSION_NOT_FOUND,
            old.errorCode
        );
    }

    @Test
    public void exactlyThirtyMinutesIdleRemainsValid() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        assertTrue(
            issued.success
        );

        fixture.monotonic.now =
            FinoraBranchLoginSessionAuthority
                .IDLE_TIMEOUT_MS;

        fixture.wallClock.add(
            "2026-09-18T13:30:00Z"
        );

        FinoraBranchLoginSessionAuthority.SessionResult validated =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertTrue(
            validated.success
        );
    }

    @Test
    public void moreThanThirtyMinutesIdleExpiresAndDeletesSession() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        fixture.monotonic.now =
            FinoraBranchLoginSessionAuthority
                .IDLE_TIMEOUT_MS +
            1L;

        FinoraBranchLoginSessionAuthority.SessionResult expired =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertFalse(
            expired.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_SESSION_EXPIRED,
            expired.errorCode
        );

        FinoraBranchLoginSessionAuthority.SessionResult missing =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_SESSION_NOT_FOUND,
            missing.errorCode
        );
    }

    @Test
    public void failedAuthoritativeRevalidationRevokesSession() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        fixture.authorization.result =
            FinoraBranchLoginSessionAuthority
                .AuthorizationResult.failure(
                    FinoraBranchLoginSessionAuthority
                        .ERROR_STORAGE_ENTITLEMENT_DENIED,
                    "Storage entitlement denied."
                );

        FinoraBranchLoginSessionAuthority.SessionResult denied =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertFalse(
            denied.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_STORAGE_ENTITLEMENT_DENIED,
            denied.errorCode
        );

        assertEquals(
            0,
            fixture.authority.activeSessionCountForTest()
        );
    }

    @Test
    public void deviceTrustFailureOnRevalidationRevokesSession() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        assertTrue(
            issued.success
        );

        fixture.authorization.result =
            FinoraBranchLoginSessionAuthority
                .AuthorizationResult.failure(
                    FinoraBranchLoginSessionAuthority
                        .ERROR_DEVICE_TRUST_FAILED,
                    "FINORA current device has been revoked."
                );

        FinoraBranchLoginSessionAuthority.SessionResult denied =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertFalse(
            denied.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_DEVICE_TRUST_FAILED,
            denied.errorCode
        );

        assertEquals(
            0,
            fixture.authority.activeSessionCountForTest()
        );
    }

    @Test
    public void touchRefreshesWallAndMonotonicActivityOnly() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        int authorizationCallsBeforeTouch =
            fixture.authorization.calls;

        fixture.monotonic.now =
            1_000L;

        fixture.wallClock.add(
            "2026-09-18T13:05:00Z"
        );

        FinoraBranchLoginSessionAuthority.TouchResult touched =
            fixture.authority.touch(
                issued.data.sessionId
            );

        assertTrue(
            touched.success
        );

        assertEquals(
            issued.data.sessionId,
            touched.data.sessionId
        );

        assertEquals(
            "2026-09-18T13:05:00Z",
            touched.data.lastActivity
        );

        assertEquals(
            authorizationCallsBeforeTouch,
            fixture.authorization.calls
        );

        fixture.monotonic.now =
            1_000L +
            FinoraBranchLoginSessionAuthority
                .IDLE_TIMEOUT_MS;

        fixture.wallClock.add(
            "2026-09-18T13:35:00Z"
        );

        FinoraBranchLoginSessionAuthority.SessionResult stillValid =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertTrue(
            stillValid.success
        );

        assertEquals(
            "2026-09-18T13:05:00Z",
            stillValid.data.lastActivity
        );
    }

    @Test
    public void touchExpiredSessionDeletesBearer() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        fixture.monotonic.now =
            FinoraBranchLoginSessionAuthority
                .IDLE_TIMEOUT_MS +
            1L;

        FinoraBranchLoginSessionAuthority.TouchResult result =
            fixture.authority.touch(
                issued.data.sessionId
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_SESSION_EXPIRED,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.authority.activeSessionCountForTest()
        );
    }

    @Test
    public void validationReturnsFreshAuthoritativePrincipal() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        fixture.authorization.result =
            FinoraBranchLoginSessionAuthority
                .AuthorizationResult.success(
                    new FinoraBranchLoginSessionAuthority
                        .Principal(
                            "CREDENTIAL-1",
                            8L,
                            "USER-1",
                            "owner",
                            "Updated Owner Name",
                            "MANAGER",
                            "OWNER-1",
                            "BUSINESS-1",
                            "BRANCH-1",
                            "USB",
                            "REAL",
                            null
                        ),
                    FinoraBranchLoginSessionAuthority
                        .ACCESS_MODE_REGISTERED_EXPIRED_READ_ONLY
                );

        fixture.wallClock.add(
            "2026-09-18T13:10:00Z"
        );

        FinoraBranchLoginSessionAuthority.SessionResult validated =
            fixture.authority.validate(
                issued.data.sessionId
            );

        assertTrue(
            validated.success
        );

        assertEquals(
            "Updated Owner Name",
            validated.data.fullName
        );

        assertEquals(
            "MANAGER",
            validated.data.role
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ACCESS_MODE_REGISTERED_EXPIRED_READ_ONLY,
            validated.data.accessMode
        );
    }

    @Test
    public void issueRejectsAuthoritativeIdentityMismatch() {

        Fixture fixture =
            new Fixture();

        fixture.authorization.result =
            FinoraBranchLoginSessionAuthority
                .AuthorizationResult.success(
                    new FinoraBranchLoginSessionAuthority
                        .Principal(
                            "CREDENTIAL-1",
                            8L,
                            "USER-1",
                            "owner",
                            "Owner Name",
                            "ADMIN",
                            "OWNER-1",
                            "BUSINESS-1",
                            "BRANCH-1",
                            "USB",
                            "REAL",
                            null
                        ),
                    FinoraBranchLoginSessionAuthority
                        .ACCESS_MODE_ACTIVE
                );

        FinoraBranchLoginSessionAuthority.SessionResult result =
            fixture.authority.issue(
                identity()
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_SESSION_INVALID,
            result.errorCode
        );

        assertEquals(
            0,
            fixture.authority.activeSessionCountForTest()
        );
    }

    @Test
    public void invalidateIsIdempotentBooleanDelete() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult issued =
            fixture.authority.issue(
                identity()
            );

        assertTrue(
            fixture.authority.invalidate(
                issued.data.sessionId
            )
        );

        assertFalse(
            fixture.authority.invalidate(
                issued.data.sessionId
            )
        );

        assertFalse(
            fixture.authority.invalidate(
                "   "
            )
        );
    }

    @Test
    public void internalRecordStoresNoPasswordOrSecurityCodeMaterial()
        throws Exception {

        Class<?> recordClass =
            null;

        for (
            Class<?> nested
            : FinoraBranchLoginSessionAuthority.class
                .getDeclaredClasses()
        ) {
            if (
                "SessionRecord".equals(
                    nested.getSimpleName()
                )
            ) {
                recordClass =
                    nested;

                break;
            }
        }

        assertTrue(
            recordClass != null
        );

        for (
            Field field
            : recordClass.getDeclaredFields()
        ) {
            String name =
                field.getName()
                    .toLowerCase();

            assertFalse(
                name.contains(
                    "password"
                )
            );

            assertFalse(
                name.contains(
                    "security"
                )
            );

            assertFalse(
                name.contains(
                    "verifier"
                )
            );

            assertFalse(
                name.contains(
                    "salt"
                )
            );

            assertFalse(
                name.contains(
                    "derived"
                )
            );
        }
    }

    @Test
    public void nullAndUnknownBearersFailClosed() {

        Fixture fixture =
            new Fixture();

        FinoraBranchLoginSessionAuthority.SessionResult invalid =
            fixture.authority.validate(
                null
            );

        assertFalse(
            invalid.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_INVALID_REQUEST,
            invalid.errorCode
        );

        FinoraBranchLoginSessionAuthority.SessionResult unknown =
            fixture.authority.validate(
                "FINORA-SESSION-UNKNOWN"
            );

        assertFalse(
            unknown.success
        );

        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ERROR_SESSION_NOT_FOUND,
            unknown.errorCode
        );
    }

    private static FinoraBranchPasswordFirstLoginAuthority
        .AuthenticatedIdentity identity() {

        return new FinoraBranchPasswordFirstLoginAuthority
            .AuthenticatedIdentity(
                "CREDENTIAL-1",
                7L,
                "USER-1",
                "owner",
                "Owner Name",
                "ADMIN",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "USB",
                "REAL",
                null,
                "2026-09-18T12:59:59Z"
            );
    }

    private static FinoraBranchLoginSessionAuthority.Principal
        principal() {

        return new FinoraBranchLoginSessionAuthority
            .Principal(
                "CREDENTIAL-1",
                7L,
                "USER-1",
                "owner",
                "Owner Name",
                "ADMIN",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "USB",
                "REAL",
                null
            );
    }

    private static final class Fixture {

        final FakeAuthorization authorization =
            new FakeAuthorization();

        final FakeWallClock wallClock =
            new FakeWallClock();

        final FakeMonotonicClock monotonic =
            new FakeMonotonicClock();

        final FakeSessionIds sessionIds =
            new FakeSessionIds();

        final FinoraBranchLoginSessionAuthority authority;

        Fixture() {

            authorization.result =
                FinoraBranchLoginSessionAuthority
                    .AuthorizationResult.success(
                        principal(),
                        FinoraBranchLoginSessionAuthority
                            .ACCESS_MODE_ACTIVE
                    );

            wallClock.add(
                "2026-09-18T13:00:00Z"
            );

            wallClock.add(
                "2026-09-18T13:00:01Z"
            );

            sessionIds.add(
                "FINORA-SESSION-TEST-1"
            );

            authority =
                new FinoraBranchLoginSessionAuthority(
                    authorization,
                    wallClock,
                    monotonic,
                    sessionIds
                );
        }
    }

    private static final class FakeAuthorization
        implements FinoraBranchLoginSessionAuthority
            .AuthorizationPort {

        FinoraBranchLoginSessionAuthority
            .AuthorizationResult result;

        int calls;

        @Override
        public FinoraBranchLoginSessionAuthority
            .AuthorizationResult authorize(
                String credentialId,
                String selectedStorageMode
            ) {

            calls += 1;

            return result;
        }
    }

    private static final class FakeWallClock
        implements FinoraBranchLoginSessionAuthority
            .WallClockPort {

        private final Queue<String> values =
            new ArrayDeque<>();

        private String last =
            "2026-09-18T13:00:00Z";

        void add(
            String value
        ) {

            values.add(
                value
            );
        }

        @Override
        public String nowIso() {

            if (!values.isEmpty()) {
                last =
                    values.remove();
            }

            return last;
        }
    }

    private static final class FakeMonotonicClock
        implements FinoraBranchLoginSessionAuthority
            .MonotonicClockPort {

        long now;

        @Override
        public long nowMs() {
            return now;
        }
    }

    private static final class FakeSessionIds
        implements FinoraBranchLoginSessionAuthority
            .SessionIdPort {

        private final Queue<String> values =
            new ArrayDeque<>();

        private int fallback;

        void add(
            String value
        ) {

            values.add(
                value
            );
        }

        @Override
        public String nextSessionId() {

            if (!values.isEmpty()) {
                return values.remove();
            }

            fallback += 1;

            return (
                "FINORA-SESSION-FALLBACK-" +
                fallback
            );
        }
    }
}