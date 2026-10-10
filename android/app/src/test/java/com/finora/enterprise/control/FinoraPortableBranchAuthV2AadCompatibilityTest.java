package com.finora.enterprise.control;

import static org.junit.Assert.*;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

import org.json.JSONObject;
import org.junit.Test;

/**
 * Synthetic, non-secret tests for Node JSON.stringify-compatible
 * FINORA V2 AES-GCM Additional Authenticated Data.
 */
public final class FinoraPortableBranchAuthV2AadCompatibilityTest {

    private static JSONObject envelope() throws Exception {
        return new JSONObject(
            "{"
            + "\"format\":\"FINORA_PORTABLE_BRANCH_AUTH\","
            + "\"schemaVersion\":2,"
            + "\"canonicalUsername\":\"testadmin\","
            + "\"branchScope\":{"
            + "\"ownerId\":\"OWNER_TEST\","
            + "\"businessId\":\"BUSINESS_TEST\","
            + "\"branchId\":\"BRANCH_TEST\""
            + "}"
            + "}"
        );
    }

    private static JSONObject factor() throws Exception {
        return new JSONObject(
            "{"
            + "\"algorithm\":\"SCRYPT\","
            + "\"salt\":\"AAAA\","
            + "\"N\":32768,"
            + "\"r\":8,"
            + "\"p\":1,"
            + "\"derivedKeyLength\":64,"
            + "\"verifierLength\":32,"
            + "\"verifier\":\"BBBB\""
            + "}"
        );
    }

    private static byte[] invokePayloadAad() throws Exception {
        Method method =
            FinoraPortableBranchAuthV2DecryptAuthority.class
                .getDeclaredMethod(
                    "buildPayloadAad",
                    JSONObject.class
                );

        method.setAccessible(true);

        return (byte[]) method.invoke(
            null,
            envelope()
        );
    }

    private static byte[] invokeWrapAad(
        boolean recovery
    ) throws Exception {

        Method method =
            FinoraPortableBranchAuthV2DecryptAuthority.class
                .getDeclaredMethod(
                    "buildWrapAad",
                    JSONObject.class,
                    JSONObject.class,
                    boolean.class
                );

        method.setAccessible(true);

        return (byte[]) method.invoke(
            null,
            envelope(),
            factor(),
            recovery
        );
    }

    @Test
    public void payloadAadMatchesWindowsJsonStringifyOrder()
        throws Exception {

        String expected =
            "{"
            + "\"domain\":\"FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_AAD_V2\","
            + "\"format\":\"FINORA_PORTABLE_BRANCH_AUTH\","
            + "\"schemaVersion\":2,"
            + "\"canonicalUsername\":\"testadmin\","
            + "\"branchScope\":{"
            + "\"ownerId\":\"OWNER_TEST\","
            + "\"businessId\":\"BUSINESS_TEST\","
            + "\"branchId\":\"BRANCH_TEST\""
            + "}"
            + "}";

        assertArrayEquals(
            expected.getBytes(StandardCharsets.UTF_8),
            invokePayloadAad()
        );
    }

    @Test
    public void passwordWrapAadMatchesWindowsOrder()
        throws Exception {

        String expected =
            "{"
            + "\"domain\":\"FINORA_PORTABLE_BRANCH_AUTH_WRAP_AAD_V2\","
            + "\"purpose\":\"PASSWORD\","
            + "\"format\":\"FINORA_PORTABLE_BRANCH_AUTH\","
            + "\"schemaVersion\":2,"
            + "\"canonicalUsername\":\"testadmin\","
            + "\"branchScope\":{"
            + "\"ownerId\":\"OWNER_TEST\","
            + "\"businessId\":\"BUSINESS_TEST\","
            + "\"branchId\":\"BRANCH_TEST\""
            + "},"
            + "\"factor\":{"
            + "\"algorithm\":\"SCRYPT\","
            + "\"salt\":\"AAAA\","
            + "\"N\":32768,"
            + "\"r\":8,"
            + "\"p\":1,"
            + "\"derivedKeyLength\":64,"
            + "\"verifierLength\":32,"
            + "\"verifier\":\"BBBB\""
            + "}"
            + "}";

        assertArrayEquals(
            expected.getBytes(StandardCharsets.UTF_8),
            invokeWrapAad(false)
        );
    }

    @Test
    public void recoveryWrapAadUsesRecoveryPurpose()
        throws Exception {

        String aad = new String(
            invokeWrapAad(true),
            StandardCharsets.UTF_8
        );

        assertTrue(
            aad.contains("\"purpose\":\"RECOVERY\"")
        );

        assertFalse(
            aad.contains("\"purpose\":\"PASSWORD\"")
        );

        assertTrue(
            aad.contains(
                "\"domain\":\"FINORA_PORTABLE_BRANCH_AUTH_WRAP_AAD_V2\""
            )
        );
    }

    @Test
    public void v2ParserRejectsV1Schema()
        throws Exception {

        JSONObject invalid = new JSONObject();

        invalid.put("format", "FINORA_PORTABLE_BRANCH_AUTH");
        invalid.put("schemaVersion", 1);

        try {
            FinoraPortableBranchAuthV2Envelope.parse(
                invalid.toString()
            );

            fail("V1 must not pass V2 validation.");
        } catch (IllegalArgumentException expected) {
            assertNotNull(expected);
        }
    }
}
