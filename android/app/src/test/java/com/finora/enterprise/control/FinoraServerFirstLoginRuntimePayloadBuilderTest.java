package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.junit.Test;

public final class FinoraServerFirstLoginRuntimePayloadBuilderTest {

    private static final String FINGERPRINT =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    @Test
    public void missingSignedBootstrapRejected() throws Exception {
        try {
            FinoraServerFirstLoginRuntimePayloadBuilder.build(
                null,
                "testadmin",
                "testadmin",
                FINGERPRINT
            );

            fail("Unsigned bootstrap must never create authority.");
        } catch (SecurityException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void malformedFingerprintRejected() throws Exception {
        try {
            FinoraServerFirstLoginRuntimePayloadBuilder.build(
                null,
                "testadmin",
                "testadmin",
                "not-a-sha256-fingerprint"
            );

            fail("Malformed fingerprint must be rejected.");
        } catch (SecurityException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void missingFingerprintRejected() throws Exception {
        try {
            FinoraServerFirstLoginRuntimePayloadBuilder.build(
                null,
                "testadmin",
                "testadmin",
                null
            );

            fail("Missing fingerprint must be rejected.");
        } catch (SecurityException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void uppercaseFingerprintRejected() throws Exception {
        try {
            FinoraServerFirstLoginRuntimePayloadBuilder.build(
                null,
                "testadmin",
                "testadmin",
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
            );

            fail("Noncanonical fingerprint must be rejected.");
        } catch (SecurityException expected) {
            assertTrue(true);
        }
    }
}