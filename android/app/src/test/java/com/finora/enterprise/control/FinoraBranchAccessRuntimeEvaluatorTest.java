package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class FinoraBranchAccessRuntimeEvaluatorTest {
    private static final String FROM = "2026-01-01T00:00:00Z";
    private static final String UNTIL = "2027-01-01T00:00:00Z";
    private static final String CREATED = "2025-12-31T23:00:00Z";
    private static final String UPDATED = "2025-12-31T23:30:00Z";
    private static final String PAID = "2025-12-31T22:00:00Z";

    @Test
    public void missingGrantIsDenied() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(null,"2026-06-01T00:00:00Z");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.MISSING,result.state);
        assertNull(result.grant);
    }

    @Test
    public void registeredGrantIsActiveInsideWindow() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("ACTIVE",FROM,UNTIL),"2026-06-01T00:00:00Z");
        assertTrue(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.ACTIVE,result.state);
        assertEquals("FINORA Branch Access is active.",result.reason);
    }

    @Test
    public void validFromIsInclusive() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("ACTIVE",FROM,UNTIL),FROM);
        assertTrue(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.ACTIVE,result.state);
    }

    @Test
    public void validUntilIsExclusive() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("ACTIVE",FROM,UNTIL),UNTIL);
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.EXPIRED,result.state);
        assertEquals("FINORA annual registration has expired.",result.reason);
    }

    @Test
    public void beforeValidFromIsNotYetValid() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("ACTIVE",FROM,UNTIL),"2025-12-31T23:59:59.999Z");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.NOT_YET_VALID,result.state);
    }

    @Test
    public void revokedWinsBeforeClockWindow() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("REVOKED",FROM,UNTIL),"2025-12-01T00:00:00Z");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.REVOKED,result.state);
    }

    @Test
    public void suspendedWinsBeforeClockWindow() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("SUSPENDED",FROM,UNTIL),"2025-12-01T00:00:00Z");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.SUSPENDED,result.state);
    }

    @Test
    public void demoExpiresFailClosed() {
        FinoraBranchAccessRuntimeEvaluator.Grant demo = new FinoraBranchAccessRuntimeEvaluator.Grant("grant-demo","user-1","owner-1","business-1","branch-1","LOCAL","ACTIVE","2026-01-01T00:00:00Z","2026-01-03T00:00:00Z",CREATED,UPDATED,1,"DEMO",null,null,"FINORA-DEMO-1");
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(demo,"2026-01-03T00:00:00Z");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.EXPIRED,result.state);
        assertEquals("FINORA Demo access has expired.",result.reason);
    }

    @Test
    public void malformedRegisteredDurationIsInvalid() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("ACTIVE",FROM,"2026-12-31T23:59:59Z"),"2026-06-01T00:00:00Z");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.INVALID,result.state);
        assertEquals("FINORA registered access must have exactly 365 days of validity.",result.reason);
    }

    @Test
    public void invalidRuntimeClockIsInvalid() {
        FinoraBranchAccessRuntimeEvaluator.Decision result = FinoraBranchAccessRuntimeEvaluator.evaluate(registered("ACTIVE",FROM,UNTIL),"not-a-time");
        assertFalse(result.allowed);
        assertEquals(FinoraBranchAccessRuntimeEvaluator.INVALID,result.state);
        assertEquals("FINORA runtime clock is invalid.",result.reason);
    }

    private static FinoraBranchAccessRuntimeEvaluator.Grant registered(String administrativeStatus,String validFrom,String validUntil) {
        return new FinoraBranchAccessRuntimeEvaluator.Grant("grant-registered","user-1","owner-1","business-1","branch-1","LOCAL",administrativeStatus,validFrom,validUntil,CREATED,UPDATED,1,"REGISTERED",1L,new FinoraBranchAccessRuntimeEvaluator.RegistrationPayment(2000.0d,"INR",PAID,false),null);
    }
}
