package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class FinoraBranchAccessRuntimeAuthorityTest {
    @Test
    public void invalidRequestStopsBeforePorts() {
        CountingGrantPort grants = new CountingGrantPort(registered());
        CountingClockPort clock = new CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result =
            authority(grants, clock).evaluate(
                " ",
                "owner-1",
                "business-1",
                "branch-1"
            );

        assertFalse(result.success);
        assertEquals(
            FinoraBranchAccessRuntimeAuthority.ERROR_INVALID_REQUEST,
            result.errorCode
        );
        assertEquals(0, grants.calls);
        assertEquals(0, clock.calls);
    }

    @Test
    public void controlStoreFailureStopsBeforeClock() {
        FinoraBranchAccessRuntimeAuthority.GrantPort grants =
            new FinoraBranchAccessRuntimeAuthority.GrantPort() {
                @Override
                public FinoraBranchAccessRuntimeEvaluator.Grant find(
                    String userId,
                    String ownerId,
                    String businessId,
                    String branchId
                ) throws Exception {
                    throw new Exception("control-store-failed");
                }
            };

        CountingClockPort clock = new CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result =
            authority(grants, clock).evaluate(
                "user-1",
                "owner-1",
                "business-1",
                "branch-1"
            );

        assertFalse(result.success);
        assertEquals(
            FinoraBranchAccessRuntimeAuthority.ERROR_CONTROL_STORE_FAILED,
            result.errorCode
        );
        assertEquals("control-store-failed", result.error);
        assertEquals(0, clock.calls);
    }

    @Test
    public void clockFailurePreservesNativeCode() {
        CountingGrantPort grants = new CountingGrantPort(registered());
        CountingClockPort clock = new CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult.failure(
                "CLOCK_ROLLBACK_DETECTED",
                "rollback"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result =
            authority(grants, clock).evaluate(
                "user-1",
                "owner-1",
                "business-1",
                "branch-1"
            );

        assertFalse(result.success);
        assertEquals(
            FinoraBranchAccessRuntimeAuthority.ERROR_CLOCK_AUTHORITY_FAILED,
            result.errorCode
        );
        assertEquals("CLOCK_ROLLBACK_DETECTED", result.clockErrorCode);
        assertEquals("rollback", result.error);
    }

    @Test
    public void missingGrantReturnsMissingDecisionWithTrustedTime() {
        CountingGrantPort grants = new CountingGrantPort(null);
        CountingClockPort clock = new CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result =
            authority(grants, clock).evaluate(
                "user-1",
                "owner-1",
                "business-1",
                "branch-1"
            );

        assertTrue(result.success);
        assertFalse(result.data.allowed);
        assertEquals(
            FinoraBranchAccessRuntimeEvaluator.MISSING,
            result.data.state
        );
        assertEquals("2026-06-01T00:00:00Z", result.data.observedAt);
        assertNull(result.data.grant);
    }

    @Test
    public void registeredExpiryUsesTrustedObservedAt() {
        CountingGrantPort grants = new CountingGrantPort(registered());
        CountingClockPort clock = new CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2027-01-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result =
            authority(grants, clock).evaluate(
                "user-1",
                "owner-1",
                "business-1",
                "branch-1"
            );

        assertTrue(result.success);
        assertFalse(result.data.allowed);
        assertEquals(
            FinoraBranchAccessRuntimeEvaluator.EXPIRED,
            result.data.state
        );
    }

    @Test
    public void activeGrantReturnsActiveDecision() {
        CountingGrantPort grants = new CountingGrantPort(registered());
        CountingClockPort clock = new CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result =
            authority(grants, clock).evaluate(
                "user-1",
                "owner-1",
                "business-1",
                "branch-1"
            );

        assertTrue(result.success);
        assertTrue(result.data.allowed);
        assertEquals(
            FinoraBranchAccessRuntimeEvaluator.ACTIVE,
            result.data.state
        );
        assertEquals(1, grants.calls);
        assertEquals(1, clock.calls);
    }

    private static FinoraBranchAccessRuntimeAuthority authority(
        FinoraBranchAccessRuntimeAuthority.GrantPort grants,
        FinoraBranchAccessRuntimeAuthority.ClockPort clock
    ) {
        return new FinoraBranchAccessRuntimeAuthority(grants, clock);
    }

    private static FinoraBranchAccessRuntimeEvaluator.Grant registered() {
        return new FinoraBranchAccessRuntimeEvaluator.Grant(
            "grant-1",
            "user-1",
            "owner-1",
            "business-1",
            "branch-1",
            "LOCAL",
            "ACTIVE",
            "2026-01-01T00:00:00Z",
            "2027-01-01T00:00:00Z",
            "2025-12-31T23:00:00Z",
            "2025-12-31T23:30:00Z",
            1,
            "REGISTERED",
            1L,
            new FinoraBranchAccessRuntimeEvaluator.RegistrationPayment(
                2000.0d,
                "INR",
                "2025-12-31T22:00:00Z",
                false
            ),
            null
        );
    }

    private static final class CountingGrantPort
        implements FinoraBranchAccessRuntimeAuthority.GrantPort {
        private final FinoraBranchAccessRuntimeEvaluator.Grant grant;
        int calls;

        CountingGrantPort(FinoraBranchAccessRuntimeEvaluator.Grant grant) {
            this.grant = grant;
        }

        @Override
        public FinoraBranchAccessRuntimeEvaluator.Grant find(
            String userId,
            String ownerId,
            String businessId,
            String branchId
        ) {
            calls++;
            return grant;
        }
    }

    private static final class CountingClockPort
        implements FinoraBranchAccessRuntimeAuthority.ClockPort {
        private final FinoraBranchAccessRuntimeAuthority.ClockResult result;
        int calls;

        CountingClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult result
        ) {
            this.result = result;
        }

        @Override
        public FinoraBranchAccessRuntimeAuthority.ClockResult observe() {
            calls++;
            return result;
        }
    }
}
