package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraServerFirstLoginRuntimeAuthoritySignerTest {

    @Test
    public void missingKeyMustFailClosed() throws Exception {
        try {
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                new JSONObject(),
                null
            );

            fail("Missing Branch Certification key must fail.");
        } catch (IllegalArgumentException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void missingPayloadMustFailClosed() throws Exception {
        try {
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                null,
                null
            );

            fail("Missing Runtime Authority payload must fail.");
        } catch (IllegalArgumentException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void malformedPayloadCannotBeSigned() throws Exception {
        FinoraBranchCertificationCryptoValidator.Material key =
            FinoraServerFirstLoginBranchCertificationGenerator.generate(
                "2026-10-08T00:00:00.000Z"
            );

        JSONObject malformed = new JSONObject();

        malformed.put("schemaVersion", 1);
        malformed.put(
            "purpose",
            "FRESH_DEVICE_RUNTIME_AUTHORITY"
        );

        try {
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                malformed,
                key
            );

            fail("Incomplete Runtime Authority must be rejected.");
        } catch (IllegalArgumentException expected) {
            assertTrue(true);
        }
    }
}