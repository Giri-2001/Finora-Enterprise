package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.Locale;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraPortableBranchAuthCertificationMaterialParserTest {

    private static final String CREATED_AT =
        "2026-09-18T08:00:00.000Z";

    @Test
    public void parsesAndCryptographicallyValidatesCanonicalMaterial()
        throws Exception {

        JSONObject json =
            validMaterial();

        FinoraBranchCertificationCryptoValidator.Material material =
            FinoraPortableBranchAuthCertificationMaterialParser.parse(
                json
            );

        assertNotNull(
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
    }

    @Test
    public void toleratesUnknownObjectExtensionFieldLikeWindowsValidator()
        throws Exception {

        JSONObject json =
            validMaterial();

        json.put(
            "futureExtension",
            "WINDOWS_COMPATIBLE"
        );

        FinoraBranchCertificationCryptoValidator.Material material =
            FinoraPortableBranchAuthCertificationMaterialParser.parse(
                json
            );

        assertNotNull(
            material
        );
    }

    @Test
    public void rejectsMissingRequiredField()
        throws Exception {

        JSONObject json =
            validMaterial();

        json.remove(
            "privateKey"
        );

        expectFailure(
            () ->
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    json
                )
        );
    }

    @Test
    public void rejectsWrongJsonType()
        throws Exception {

        JSONObject json =
            validMaterial();

        json.put(
            "schemaVersion",
            "1"
        );

        expectFailure(
            () ->
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    json
                )
        );
    }

    @Test
    public void acceptsJsonNumericOnePointZeroAsEcmaNumberOne()
        throws Exception {

        JSONObject json =
            validMaterial();

        json.put(
            "schemaVersion",
            1.0d
        );

        FinoraBranchCertificationCryptoValidator.Material material =
            FinoraPortableBranchAuthCertificationMaterialParser.parse(
                json
            );

        assertEquals(
            1,
            material.schemaVersion
        );
    }

    @Test
    public void rejectsNonIntegralVersion()
        throws Exception {

        JSONObject json =
            validMaterial();

        json.put(
            "vaultSchemaVersion",
            1.5d
        );

        expectFailure(
            () ->
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    json
                )
        );
    }

    @Test
    public void delegatesFingerprintValidation()
        throws Exception {

        JSONObject json =
            validMaterial();

        String fingerprint =
            json.getString(
                "publicKeyFingerprint"
            );

        json.put(
            "publicKeyFingerprint",
            (
                fingerprint.charAt(0) ==
                '0'
            )
                ? "1" +
                    fingerprint.substring(
                        1
                    )
                : "0" +
                    fingerprint.substring(
                        1
                    )
        );

        expectFailure(
            () ->
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    json
                )
        );
    }

    @Test
    public void delegatesPublicPrivateKeypairValidation()
        throws Exception {

        JSONObject json =
            validMaterial();

        KeyPair otherPair =
            createP256();

        json.put(
            "privateKey",
            Base64
                .getEncoder()
                .encodeToString(
                    otherPair
                        .getPrivate()
                        .getEncoded()
                )
        );

        expectFailure(
            () ->
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    json
                )
        );
    }

    private static JSONObject validMaterial()
        throws Exception {

        KeyPair pair =
            createP256();

        byte[] publicDer =
            pair
                .getPublic()
                .getEncoded();

        String publicKey =
            Base64
                .getEncoder()
                .encodeToString(
                    publicDer
                );

        String fingerprint =
            fingerprint(
                publicDer
            );

        String keyId =
            "FINORA-BRANCH-CERT-" +
            fingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    Locale.ROOT
                );

        JSONObject json =
            new JSONObject();

        json.put(
            "keyId",
            keyId
        );

        json.put(
            "algorithm",
            "ECDSA_P256_SHA256"
        );

        json.put(
            "publicKeyFormat",
            "SPKI_DER_BASE64"
        );

        json.put(
            "publicKey",
            publicKey
        );

        json.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        json.put(
            "publicKeyFingerprint",
            fingerprint
        );

        json.put(
            "createdAt",
            CREATED_AT
        );

        json.put(
            "schemaVersion",
            1
        );

        json.put(
            "privateKeyFormat",
            "PKCS8_DER_BASE64"
        );

        json.put(
            "privateKey",
            Base64
                .getEncoder()
                .encodeToString(
                    pair
                        .getPrivate()
                        .getEncoded()
                )
        );

        json.put(
            "vaultSchemaVersion",
            1
        );

        return json;
    }

    private static KeyPair createP256()
        throws Exception {

        KeyPairGenerator generator =
            KeyPairGenerator.getInstance(
                "EC"
            );

        generator.initialize(
            new ECGenParameterSpec(
                "secp256r1"
            )
        );

        return generator.generateKeyPair();
    }

    private static String fingerprint(
        byte[] publicDer
    ) throws Exception {

        byte[] digest =
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    publicDer
                );

        StringBuilder result =
            new StringBuilder(
                digest.length * 2
            );

        for (
            byte value :
            digest
        ) {

            result.append(
                String.format(
                    Locale.ROOT,
                    "%02x",
                    value & 0xff
                )
            );
        }

        return result.toString();
    }

    private static void expectFailure(
        Runnable action
    ) {

        try {

            action.run();

            fail(
                "Expected Branch Certification parser failure."
            );
        }
        catch (
            IllegalArgumentException expected
        ) {

            assertTrue(
                expected.getMessage() !=
                    null
            );
        }
    }
}