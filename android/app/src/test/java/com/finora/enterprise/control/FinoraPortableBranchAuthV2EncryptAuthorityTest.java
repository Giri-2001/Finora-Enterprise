package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public final class FinoraPortableBranchAuthV2EncryptAuthorityTest {

    private static final String PASSWORD =
        "SyntheticTestPassword123!";

    private static final String SECURITY =
        "SyntheticSecurityCode456!";

    private static JSONObject payload() throws Exception {
        JSONObject value = new JSONObject();

        value.put("schemaVersion", 1);
        value.put("authStateId", "synthetic-auth");
        value.put("sourceAuthorizationId", "synthetic-source");
        value.put("ownerId", "synthetic-owner");
        value.put("businessId", "synthetic-business");
        value.put("branchId", "synthetic-branch");
        value.put("userId", "synthetic-user");
        value.put("username", "testadmin");
        value.put("canonicalUsername", "testadmin");
        value.put("fullName", "Synthetic Test Owner");
        value.put("role", "OWNER");
        value.put("dataContext", "REAL");
        value.put("storageMode", "USB");
        value.put("authGeneration", 1);
        value.put("createdAt", "2026-01-01T00:00:00.000Z");
        value.put("updatedAt", "2026-01-01T00:00:00.000Z");

        return value;
    }

    @Test
    public void passwordAndRecoveryDecryptSamePayload()
        throws Exception {

        FinoraPortableBranchAuthV2EncryptAuthority.Material
            material =
                FinoraPortableBranchAuthV2EncryptAuthority.create(
                    payload(), PASSWORD, SECURITY
                );

        String serialized = material.envelope.toString();

        byte[] withPassword =
            FinoraPortableBranchAuthV2DecryptAuthority
                .decryptWithPassword(serialized, PASSWORD);

        byte[] withSecurity =
            FinoraPortableBranchAuthV2DecryptAuthority
                .decryptWithSecurityCode(serialized, SECURITY);

        try {
            assertArrayEquals(
                withPassword,
                withSecurity
            );

            JSONObject decoded = new JSONObject(
                new String(
                    withPassword,
                    StandardCharsets.UTF_8
                )
            );

            assertEquals(
                "testadmin",
                decoded.getString("canonicalUsername")
            );

            assertEquals(
                "synthetic-branch",
                decoded.getString("branchId")
            );

            assertEquals(
                material.passwordVerifier.getString("verifier"),
                decoded.getJSONObject("passwordVerifier")
                    .getString("verifier")
            );
        } finally {
            Arrays.fill(withPassword, (byte) 0);
            Arrays.fill(withSecurity, (byte) 0);
        }
    }

    @Test
    public void presetVerifierIsRejected() throws Exception {
        JSONObject invalid = payload();
        invalid.put("passwordVerifier", new JSONObject());

        try {
            FinoraPortableBranchAuthV2EncryptAuthority.create(
                invalid, PASSWORD, SECURITY
            );

            fail("Expected verifier injection rejection.");
        } catch (IllegalArgumentException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void shortCredentialIsRejected() throws Exception {
        try {
            FinoraPortableBranchAuthV2EncryptAuthority.create(
                payload(), "short", SECURITY
            );

            fail("Expected credential length rejection.");
        } catch (IllegalArgumentException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void exportSyntheticFixtureForNode() throws Exception {
        String destination =
            System.getenv("FINORA_V2_INTEROP_OUTPUT");

        if (destination == null || destination.isEmpty()) {
            return;
        }

        FinoraPortableBranchAuthV2EncryptAuthority.Material material =
            FinoraPortableBranchAuthV2EncryptAuthority.create(
                payload(), PASSWORD, SECURITY
            );

        JSONObject envelope = material.envelope;

        byte[] passwordPlaintext =
            FinoraPortableBranchAuthV2DecryptAuthority
                .decryptWithPassword(
                    envelope.toString(),
                    PASSWORD
                );

        byte[] securityPlaintext =
            FinoraPortableBranchAuthV2DecryptAuthority
                .decryptWithSecurityCode(
                    envelope.toString(),
                    SECURITY
                );

        try {
            assertArrayEquals(
                passwordPlaintext,
                securityPlaintext
            );
        } finally {
            Arrays.fill(passwordPlaintext, (byte) 0);
            Arrays.fill(securityPlaintext, (byte) 0);
        }

        java.nio.file.Files.write(
            java.nio.file.Paths.get(destination),
            envelope.toString().getBytes(
                StandardCharsets.UTF_8
            )
        );
    }
}