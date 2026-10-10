package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Windows-compatible FINORA Portable Branch Auth V2 digest.
 *
 * Windows:
 * SHA256(UTF8(JSON.stringify(validatedEnvelope)))
 *
 * This primitive hashes the exact serialized envelope supplied
 * by its caller. It deliberately does NOT parse and reserialize
 * JSON because JSONObject may reorder properties.
 *
 * TRUST REQUIREMENT:
 * The caller must independently validate the complete V2
 * envelope and obtain the exact serialized content from the
 * selected, account-scoped USB authentication file.
 *
 * This class does not authorize login or write any state.
 */
public final class FinoraPortableBranchAuthV2EnvelopeFingerprint {

    private static final int MAX_BYTES = 256 * 1024;

    private FinoraPortableBranchAuthV2EnvelopeFingerprint() {}

    public static String sha256ExactSerialized(
        String serializedEnvelope
    ) throws Exception {

        if (
            serializedEnvelope == null ||
            serializedEnvelope.isEmpty()
        ) {
            throw new SecurityException(
                "Portable Auth V2 serialized envelope is missing."
            );
        }

        byte[] serialized =
            serializedEnvelope.getBytes(StandardCharsets.UTF_8);

        if (
            serialized.length == 0 ||
            serialized.length > MAX_BYTES
        ) {
            throw new SecurityException(
                "Portable Auth V2 serialized envelope size is invalid."
            );
        }

        byte[] digest = MessageDigest
            .getInstance("SHA-256")
            .digest(serialized);

        StringBuilder hex =
            new StringBuilder(digest.length * 2);

        for (byte item : digest) {
            hex.append(
                String.format(
                    Locale.ROOT,
                    "%02x",
                    item & 0xff
                )
            );
        }

        java.util.Arrays.fill(digest, (byte) 0);

        return hex.toString();
    }
}