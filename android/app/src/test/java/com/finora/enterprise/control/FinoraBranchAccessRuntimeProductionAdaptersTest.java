package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.Test;

public final class FinoraBranchAccessRuntimeProductionAdaptersTest {
    @Test
    public void missingControlStateReturnsMissingDecision() throws Exception {
        FinoraBranchAccessRuntimeAuthority authority = create(
            null,
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result = evaluate(authority);

        assertTrue(result.success);
        assertFalse(result.data.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.MISSING, result.data.state);
        assertNull(result.data.grant);
    }

    @Test
    public void registeredGrantMapsAndEvaluatesActive() throws Exception {
        FinoraBranchAccessRuntimeAuthority authority = create(
            root(registeredGrant()),
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result = evaluate(authority);

        assertTrue(result.success);
        assertTrue(result.data.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.ACTIVE, result.data.state);
        assertNotNull(result.data.grant);
        assertEquals("REGISTERED", result.data.grant.accessType);
        assertEquals(Long.valueOf(1L), result.data.grant.registrationCycle);
        assertEquals("INR", result.data.grant.registrationPayment.currency);
    }

    @Test
    public void exactlyValidUntilIsExpired() throws Exception {
        FinoraBranchAccessRuntimeAuthority authority = create(
            root(registeredGrant()),
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2027-01-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result = evaluate(authority);

        assertTrue(result.success);
        assertFalse(result.data.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.EXPIRED, result.data.state);
    }

    @Test
    public void malformedSelectedGrantReturnsInvalidDecision() throws Exception {
        JSONObject grant = registeredGrant();
        grant.remove("administrativeStatus");

        FinoraBranchAccessRuntimeAuthority authority = create(
            root(grant),
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result = evaluate(authority);

        assertTrue(result.success);
        assertFalse(result.data.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.INVALID, result.data.state);
    }

    @Test
    public void duplicateMatchingGrantsFailAsControlStoreError() throws Exception {
        JSONArray grants = new JSONArray();
        grants.put(registeredGrant());
        grants.put(registeredGrant());
        JSONObject root = new JSONObject();
        root.put("branchAccessGrants", grants);

        CountingClock clock = new CountingClock(
            FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                "2026-06-01T00:00:00Z"
            )
        );

        FinoraBranchAccessRuntimeAuthority authority =
            FinoraBranchAccessRuntimeProductionAdapters.create(
                new StaticControl(root.toString()),
                clock
            );

        FinoraBranchAccessRuntimeAuthority.Result result = evaluate(authority);

        assertFalse(result.success);
        assertEquals(
            FinoraBranchAccessRuntimeAuthority.ERROR_CONTROL_STORE_FAILED,
            result.errorCode
        );
        assertEquals(0, clock.calls);
    }

    @Test
    public void clockRollbackCodeIsPreserved() throws Exception {
        FinoraBranchAccessRuntimeAuthority authority = create(
            root(registeredGrant()),
            FinoraBranchAccessRuntimeAuthority.ClockResult.failure(
                "CLOCK_ROLLBACK_DETECTED",
                "rollback"
            )
        );

        FinoraBranchAccessRuntimeAuthority.Result result = evaluate(authority);

        assertFalse(result.success);
        assertEquals(
            FinoraBranchAccessRuntimeAuthority.ERROR_CLOCK_AUTHORITY_FAILED,
            result.errorCode
        );
        assertEquals("CLOCK_ROLLBACK_DETECTED", result.clockErrorCode);
        assertEquals("rollback", result.error);
    }

    private static FinoraBranchAccessRuntimeAuthority create(
        String raw,
        FinoraBranchAccessRuntimeAuthority.ClockResult clockResult
    ) {
        return FinoraBranchAccessRuntimeProductionAdapters.create(
            new StaticControl(raw),
            new CountingClock(clockResult)
        );
    }

    private static FinoraBranchAccessRuntimeAuthority.Result evaluate(
        FinoraBranchAccessRuntimeAuthority authority
    ) {
        return authority.evaluate(
            "user-1",
            "owner-1",
            "business-1",
            "branch-1"
        );
    }

    private static String root(JSONObject grant) throws Exception {
        JSONArray grants = new JSONArray();
        grants.put(grant);
        JSONObject root = new JSONObject();
        root.put("branchAccessGrants", grants);
        return root.toString();
    }

    private static JSONObject registeredGrant() throws Exception {
        JSONObject payment = new JSONObject();
        payment.put("amount", 2000.0d);
        payment.put("currency", "INR");
        payment.put("paidAt", "2025-12-31T22:00:00Z");
        payment.put("refundable", false);

        JSONObject validity = new JSONObject();
        validity.put("validFrom", "2026-01-01T00:00:00Z");
        validity.put("validUntil", "2027-01-01T00:00:00Z");

        JSONObject grant = new JSONObject();
        grant.put("grantId", "grant-1");
        grant.put("userId", "user-1");
        grant.put("ownerId", "owner-1");
        grant.put("businessId", "business-1");
        grant.put("branchId", "branch-1");
        grant.put("storageMode", "LOCAL");
        grant.put("administrativeStatus", "ACTIVE");
        grant.put("validity", validity);
        grant.put("createdAt", "2025-12-31T23:00:00Z");
        grant.put("updatedAt", "2025-12-31T23:30:00Z");
        grant.put("schemaVersion", 1);
        grant.put("accessType", "REGISTERED");
        grant.put("registrationCycle", 1);
        grant.put("registrationPayment", payment);
        return grant;
    }

    private static final class StaticControl
        implements FinoraBranchAccessRuntimeProductionAdapters.ValidatedControlStatePort {
        private final String raw;

        StaticControl(String raw) {
            this.raw = raw;
        }

        @Override
        public String readValidated() {
            return raw;
        }
    }

    private static final class CountingClock
        implements FinoraBranchAccessRuntimeProductionAdapters.ClockObservationPort {
        private final FinoraBranchAccessRuntimeAuthority.ClockResult result;
        int calls;

        CountingClock(FinoraBranchAccessRuntimeAuthority.ClockResult result) {
            this.result = result;
        }

        @Override
        public FinoraBranchAccessRuntimeAuthority.ClockResult observe() {
            calls++;
            return result;
        }
    }
}
