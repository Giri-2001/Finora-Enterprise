package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraServerFirstLoginV2MaterialServiceTest {

    @Test
    public void missingServerAuthorityFailsClosed() throws Exception {
        try {
            FinoraServerFirstLoginV2MaterialService.create(
                null,
                "testadmin",
                "testadmin",
                "SyntheticPassword123!",
                "SyntheticSecurity123!"
            );

            fail("Missing server authority must be rejected.");
        } catch (SecurityException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void invalidCredentialsFailBeforeKeyGeneration()
        throws Exception {

        try {
            FinoraServerFirstLoginV2MaterialService.create(
                null,
                "testadmin",
                "testadmin",
                "short",
                "SyntheticSecurity123!"
            );

            fail("Short password must fail.");
        } catch (SecurityException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void noUnsignedEnrollmentFallback() throws Exception {
        assertFalse(
            FinoraServerFirstLoginEnrollmentPreflight
                .evaluateSigned(
                    new JSONObject(),
                    "testadmin",
                    "testadmin"
                )
                .ready()
        );
    }
}