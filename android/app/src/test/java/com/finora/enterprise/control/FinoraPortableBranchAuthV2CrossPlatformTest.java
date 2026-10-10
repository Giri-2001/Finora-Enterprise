package com.finora.enterprise.control;

import static org.junit.Assert.*;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraPortableBranchAuthV2CrossPlatformTest {

    private static JSONObject fixture() throws Exception {
        try (InputStream input =
            FinoraPortableBranchAuthV2CrossPlatformTest.class
                .getResourceAsStream("/finora-v2-cross-platform-test.json")) {

            assertNotNull("Synthetic fixture missing", input);

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int n;

            while ((n = input.read(buffer)) != -1) {
                output.write(buffer, 0, n);
            }

            return new JSONObject(
                new String(output.toByteArray(), StandardCharsets.UTF_8)
            );
        }
    }

    @Test
    public void nodePasswordDecryptsOnAndroid() throws Exception {
        JSONObject data = fixture();
        String serialized = data.getJSONObject("envelope").toString();

        assertTrue(
            FinoraPortableBranchAuthV2PasswordVerifier.verify(
                serialized, "syntheticuser", data.getString("password")
            )
        );

        byte[] decrypted =
            FinoraPortableBranchAuthV2DecryptAuthority.decryptWithPassword(
                serialized, data.getString("password")
            );

        assertEquals(
            data.getString("plaintext"),
            new String(decrypted, StandardCharsets.UTF_8)
        );
    }

    @Test
    public void nodeRecoveryCodeDecryptsOnAndroid() throws Exception {
        JSONObject data = fixture();

        byte[] decrypted =
            FinoraPortableBranchAuthV2DecryptAuthority.decryptWithSecurityCode(
                data.getJSONObject("envelope").toString(),
                data.getString("securityCode")
            );

        assertEquals(
            data.getString("plaintext"),
            new String(decrypted, StandardCharsets.UTF_8)
        );
    }

    @Test
    public void incorrectCredentialsAreRejected() throws Exception {
        JSONObject data = fixture();
        String serialized = data.getJSONObject("envelope").toString();

        assertFalse(
            FinoraPortableBranchAuthV2PasswordVerifier.verify(
                serialized, "syntheticuser", "Wrong-Password-123"
            )
        );

        assertFalse(
            FinoraPortableBranchAuthV2PasswordVerifier.verify(
                serialized, "wronguser", data.getString("password")
            )
        );

        try {
            FinoraPortableBranchAuthV2DecryptAuthority.decryptWithPassword(
                serialized, "Wrong-Password-123"
            );
            fail("Wrong password accepted");
        } catch (Exception expected) {
            assertNotNull(expected);
        }

        try {
            FinoraPortableBranchAuthV2DecryptAuthority.decryptWithSecurityCode(
                serialized, "Wrong-Security-123"
            );
            fail("Wrong Security Code accepted");
        } catch (Exception expected) {
            assertNotNull(expected);
        }
    }

    @Test
    public void tamperedCiphertextIsRejected() throws Exception {
        JSONObject data = fixture();
        JSONObject envelope = data.getJSONObject("envelope");

        byte[] ciphertext =
            Base64.getDecoder().decode(envelope.getString("ciphertext"));

        assertTrue(ciphertext.length > 0);
        ciphertext[0] ^= 1;

        envelope.put(
            "ciphertext",
            Base64.getEncoder().encodeToString(ciphertext)
        );

        try {
            FinoraPortableBranchAuthV2DecryptAuthority.decryptWithPassword(
                envelope.toString(), data.getString("password")
            );
            fail("Tampered ciphertext accepted");
        } catch (Exception expected) {
            assertNotNull(expected);
        }
    }
}