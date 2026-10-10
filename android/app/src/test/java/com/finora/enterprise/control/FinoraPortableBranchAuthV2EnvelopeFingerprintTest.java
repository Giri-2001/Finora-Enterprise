package com.finora.enterprise.control;

import org.junit.Test;

import static org.junit.Assert.*;

public final class FinoraPortableBranchAuthV2EnvelopeFingerprintTest {

    @Test
    public void knownSha256VectorMatches() throws Exception {
        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            FinoraPortableBranchAuthV2EnvelopeFingerprint
                .sha256ExactSerialized("abc")
        );
    }

    @Test
    public void propertyOrderChangesDigest() throws Exception {
        String first = "{\"a\":1,\"b\":2}";
        String second = "{\"b\":2,\"a\":1}";

        assertNotEquals(
            FinoraPortableBranchAuthV2EnvelopeFingerprint
                .sha256ExactSerialized(first),
            FinoraPortableBranchAuthV2EnvelopeFingerprint
                .sha256ExactSerialized(second)
        );
    }

    @Test
    public void whitespaceChangesDigest() throws Exception {
        String compact = "{\"a\":1}";
        String spaced = "{ \"a\": 1 }";

        assertNotEquals(
            FinoraPortableBranchAuthV2EnvelopeFingerprint
                .sha256ExactSerialized(compact),
            FinoraPortableBranchAuthV2EnvelopeFingerprint
                .sha256ExactSerialized(spaced)
        );
    }

    @Test
    public void nullAndEmptyFailClosed() throws Exception {
        for (String input : new String[] { null, "" }) {
            try {
                FinoraPortableBranchAuthV2EnvelopeFingerprint
                    .sha256ExactSerialized(input);

                fail("Missing serialized envelope must fail.");
            } catch (SecurityException expected) {
                assertNotNull(expected.getMessage());
            }
        }
    }

    @Test
    public void digestIsLowercaseSha256() throws Exception {
        String digest =
            FinoraPortableBranchAuthV2EnvelopeFingerprint
                .sha256ExactSerialized(
                    "{\"canonicalUsername\":\"testadmin\"}"
                );

        assertTrue(digest.matches("^[0-9a-f]{64}$"));
    }
}