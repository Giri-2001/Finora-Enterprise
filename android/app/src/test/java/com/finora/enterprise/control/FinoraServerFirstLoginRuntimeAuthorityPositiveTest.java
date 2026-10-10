package com.finora.enterprise.control;

import static org.junit.Assert.*;

import java.lang.reflect.Method;

import org.json.JSONObject;
import org.junit.Test;

/**
 * Tests the actual new Runtime Authority signer with the
 * existing valid Android verifier fixture.
 *
 * Synthetic test identities only.
 * No server, USB, production credentials or persisted state.
 */
public final class FinoraServerFirstLoginRuntimeAuthorityPositiveTest {

    private static final String TEST_TIME =
        "2026-10-08T00:00:00.000Z";

    /**
     * Reuse the exact existing verifier-test payload rather than
     * independently inventing fields or changing authority rules.
     */
    private static JSONObject validFixture() throws Exception {

        Method method =
            FinoraPortableFreshDeviceRuntimeAuthorityVerifierTest.class
                .getDeclaredMethod("registeredPayload");

        method.setAccessible(true);

        JSONObject value = (JSONObject) method.invoke(null);

        return new JSONObject(value.toString());
    }

    private static FinoraBranchCertificationCryptoValidator.Material
        newCertification() throws Exception {

        return FinoraServerFirstLoginBranchCertificationGenerator
            .generate(TEST_TIME);
    }

    @Test
    public void newSignerProducesVerifiableRuntimeAuthority()
        throws Exception {

        JSONObject payload = validFixture();

        FinoraBranchCertificationCryptoValidator.Material key =
            newCertification();

        String signed =
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                payload,
                key
            );

        assertNotNull(signed);

        FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
            verified =
                FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                    .verify(signed, key);

        assertTrue(
            "New signer must pass existing runtime verifier.",
            verified.success
        );

        assertNotNull(verified.data);

        assertEquals(
            payload.getString("ownerId"),
            verified.data.ownerId
        );

        assertEquals(
            payload.getString("businessId"),
            verified.data.businessId
        );

        assertEquals(
            payload.getString("branchId"),
            verified.data.branchId
        );

        assertEquals(
            payload.getString("sourceAuthorizationId"),
            verified.data.sourceAuthorizationId
        );
    }

    @Test
    public void tamperingSignedPayloadIsRejected()
        throws Exception {

        FinoraBranchCertificationCryptoValidator.Material key =
            newCertification();

        String signed =
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                validFixture(),
                key
            );

        JSONObject tampered = new JSONObject(signed);

        JSONObject payload =
            tampered.getJSONObject("payload");

        payload.put(
            "branchId",
            "BRANCH-TAMPERED"
        );

        FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
            result =
                FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                    .verify(tampered.toString(), key);

        assertFalse(
            "Modified signed branch scope must be rejected.",
            result.success
        );
    }

    @Test
    public void wrongCertificationKeyIsRejected()
        throws Exception {

        FinoraBranchCertificationCryptoValidator.Material
            originalKey = newCertification();

        FinoraBranchCertificationCryptoValidator.Material
            unrelatedKey = newCertification();

        assertNotEquals(
            originalKey.publicKeyFingerprint,
            unrelatedKey.publicKeyFingerprint
        );

        String signed =
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                validFixture(),
                originalKey
            );

        FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
            result =
                FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                    .verify(signed, unrelatedKey);

        assertFalse(
            "Unrelated Branch Certification must not verify.",
            result.success
        );
    }

    @Test
    public void generatedSignatureUsesWindowsP1363Format()
        throws Exception {

        FinoraBranchCertificationCryptoValidator.Material key =
            newCertification();

        String signed =
            FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                validFixture(),
                key
            );

        JSONObject signature =
            new JSONObject(signed)
                .getJSONObject("signature");

        assertEquals(
            "ECDSA_P256_SHA256",
            signature.getString("algorithm")
        );

        assertEquals(
            "BASE64",
            signature.getString("encoding")
        );

        assertEquals(
            "FINORA_CANONICAL_JSON_V1",
            signature.getString("canonicalization")
        );

        byte[] signatureBytes =
            java.util.Base64.getDecoder().decode(
                signature.getString("value")
            );

        assertEquals(
            "P-256 IEEE-P1363 signature must be exactly 64 bytes.",
            64,
            signatureBytes.length
        );
    }
}