package com.finora.enterprise.control;

import org.junit.Test;

import static org.junit.Assert.*;

public final class FinoraServerFirstLoginV2RecoveryVerificationGateTest {

    private static void reject(
        String envelope,
        String username,
        String password,
        String code,
        String runtime
    ) throws Exception {
        try {
            FinoraServerFirstLoginV2RecoveryVerificationGate.verify(
                envelope, username, password, code, runtime
            );
            fail("Unverified V2 input must not pass.");
        }
        catch (SecurityException | IllegalArgumentException expected) {
            assertNotNull(expected.getMessage());
        }
    }

    @Test
    public void missingInputsFailClosed() throws Exception {
        reject(null, "testadmin", "password", "security", "{}");
        reject("{}", null, "password", "security", "{}");
        reject("{}", "testadmin", null, "security", "{}");
        reject("{}", "testadmin", "password", null, "{}");
        reject("{}", "testadmin", "password", "security", null);
    }

    @Test
    public void malformedV2EnvelopeRejected() throws Exception {
        reject(
            "{}",
            "testadmin",
            "password",
            "security",
            "{}"
        );
    }

    @Test
    public void unsafeAccountNameRejected() throws Exception {
        reject(
            "{}",
            "../testadmin",
            "password",
            "security",
            "{}"
        );
    }
}