package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraServerFirstLoginBranchCertificationGeneratorTest {

    private static final String TIMESTAMP =
        "2026-10-08T00:00:00.000Z";

    @Test
    public void generatedPairPassesProductionValidator()
        throws Exception {

        FinoraBranchCertificationCryptoValidator.Material material =
            FinoraServerFirstLoginBranchCertificationGenerator
                .generate(TIMESTAMP);

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        assertEquals(
            "ECDSA_P256_SHA256",
            material.algorithm
        );

        assertEquals(
            "SPKI_DER_BASE64",
            material.publicKeyFormat
        );

        assertEquals(
            "PKCS8_DER_BASE64",
            material.privateKeyFormat
        );

        assertTrue(
            material.keyId.startsWith(
                "FINORA-BRANCH-CERT-"
            )
        );
    }

    @Test
    public void encryptedPayloadObjectHasAllRequiredKeyFields()
        throws Exception {

        FinoraBranchCertificationCryptoValidator.Material material =
            FinoraServerFirstLoginBranchCertificationGenerator
                .generate(TIMESTAMP);

        JSONObject object =
            FinoraServerFirstLoginBranchCertificationGenerator
                .toEncryptedPayloadObject(material);

        assertEquals(11, object.length());
        assertEquals(
            material.keyId,
            object.getString("keyId")
        );

        assertEquals(
            material.privateKey,
            object.getString("privateKey")
        );
    }

    @Test
    public void nonCanonicalTimestampRejected()
        throws Exception {

        try {
            FinoraServerFirstLoginBranchCertificationGenerator
                .generate("2026-10-08T00:00:00Z");

            fail("Noncanonical timestamp must fail.");
        } catch (IllegalArgumentException expected) {
            assertTrue(true);
        }
    }

    @Test
    public void everyEnrollmentGetsDistinctKeyMaterial()
        throws Exception {

        FinoraBranchCertificationCryptoValidator.Material first =
            FinoraServerFirstLoginBranchCertificationGenerator
                .generate(TIMESTAMP);

        FinoraBranchCertificationCryptoValidator.Material second =
            FinoraServerFirstLoginBranchCertificationGenerator
                .generate(TIMESTAMP);

        assertNotEquals(
            first.publicKeyFingerprint,
            second.publicKeyFingerprint
        );
    }
}