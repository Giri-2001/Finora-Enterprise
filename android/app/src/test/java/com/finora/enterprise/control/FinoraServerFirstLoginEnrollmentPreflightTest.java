package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraServerFirstLoginEnrollmentPreflightTest {

    @Test
    public void absentServerResultCannotEnroll() {
        FinoraServerFirstLoginEnrollmentPreflight.Result result =
            FinoraServerFirstLoginEnrollmentPreflight.evaluate(
                null,
                "testadmin",
                "testadmin"
            );

        assertFalse(result.ready());
        assertNull(result.verifiedPayload);
    }

    @Test
    public void unsignedPayloadCannotEnroll() throws Exception {
        JSONObject fake = new JSONObject();
        fake.put("schemaVersion", 1);

        JSONObject payload = new JSONObject();
        payload.put("canonicalUsername", "testadmin");
        payload.put("authGeneration", 1);
        payload.put("storageMode", "USB");

        fake.put("payload", payload);

        FinoraServerFirstLoginEnrollmentPreflight.Result result =
            FinoraServerFirstLoginEnrollmentPreflight.evaluateSigned(
                fake,
                "testadmin",
                "testadmin"
            );

        assertEquals(
            FinoraServerFirstLoginEnrollmentPreflight.Status
                .INVALID_SERVER_AUTHORITY,
            result.status
        );

        assertNull(result.verifiedPayload);
    }

    @Test
    public void attackerCannotClaimAnotherAccount() throws Exception {
        JSONObject fake = new JSONObject();

        fake.put("schemaVersion", 1);
        fake.put("payload", new JSONObject());

        assertFalse(
            FinoraServerFirstLoginEnrollmentPreflight
                .evaluateSigned(
                    fake,
                    "testadmin",
                    "giriadmin"
                )
                .ready()
        );
    }

    @Test
    public void malformedUsernameFailsClosed() throws Exception {
        assertEquals(
            FinoraServerFirstLoginEnrollmentPreflight.Status
                .INVALID_REQUEST,
            FinoraServerFirstLoginEnrollmentPreflight
                .evaluateSigned(
                    new JSONObject(),
                    "../testadmin",
                    "testadmin"
                )
                .status
        );
    }
}