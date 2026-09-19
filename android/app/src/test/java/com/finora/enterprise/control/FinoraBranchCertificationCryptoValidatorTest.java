package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.Locale;

import org.junit.Test;

public final class FinoraBranchCertificationCryptoValidatorTest {

    private static final String CREATED_AT =
        "2026-09-18T08:00:00.000Z";

    @Test
    public void acceptsCanonicalP256KeyMaterial()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material material =
            materialFor(
                pair
            );

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        assertEquals(
            fingerprint(
                pair.getPublic().getEncoded()
            ),
            material.publicKeyFingerprint
        );

        assertEquals(
            "FINORA-BRANCH-CERT-" +
            material.publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    Locale.ROOT
                ),
            material.keyId
        );
    }

    @Test
    public void rejectsNonCanonicalPublicKeyBase64()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material good =
            materialFor(
                pair
            );

        FinoraBranchCertificationCryptoValidator.Material bad =
            copy(
                good,
                good.keyId,
                good.publicKey + "\n",
                good.publicKeyFingerprint,
                good.createdAt,
                good.privateKey
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    bad
                )
        );
    }

    @Test
    public void rejectsWrongCurve()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp384r1"
            );

        String publicKey =
            Base64
                .getEncoder()
                .encodeToString(
                    pair.getPublic().getEncoded()
                );

        String fingerprint =
            fingerprint(
                pair.getPublic().getEncoded()
            );

        FinoraBranchCertificationCryptoValidator.Material material =
            new FinoraBranchCertificationCryptoValidator.Material(
                "FINORA-BRANCH-CERT-" +
                    fingerprint
                        .substring(
                            0,
                            32
                        )
                        .toUpperCase(
                            Locale.ROOT
                        ),
                "ECDSA_P256_SHA256",
                "SPKI_DER_BASE64",
                publicKey,
                "SHA-256",
                fingerprint,
                CREATED_AT,
                1,
                "PKCS8_DER_BASE64",
                Base64
                    .getEncoder()
                    .encodeToString(
                        pair.getPrivate().getEncoded()
                    ),
                1
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    material
                )
        );
    }

    @Test
    public void rejectsFingerprintMismatch()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material good =
            materialFor(
                pair
            );

        String badFingerprint =
            (
                good.publicKeyFingerprint.charAt(0) ==
                '0'
            )
                ? "1" +
                    good.publicKeyFingerprint.substring(
                        1
                    )
                : "0" +
                    good.publicKeyFingerprint.substring(
                        1
                    );

        FinoraBranchCertificationCryptoValidator.Material bad =
            copy(
                good,
                good.keyId,
                good.publicKey,
                badFingerprint,
                good.createdAt,
                good.privateKey
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    bad
                )
        );
    }

    @Test
    public void rejectsNonCanonicalKeyId()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material good =
            materialFor(
                pair
            );

        FinoraBranchCertificationCryptoValidator.Material bad =
            copy(
                good,
                "FINORA-BRANCH-CERT-WRONG",
                good.publicKey,
                good.publicKeyFingerprint,
                good.createdAt,
                good.privateKey
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    bad
                )
        );
    }

    @Test
    public void rejectsNonCanonicalTimestamp()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material good =
            materialFor(
                pair
            );

        FinoraBranchCertificationCryptoValidator.Material bad =
            copy(
                good,
                good.keyId,
                good.publicKey,
                good.publicKeyFingerprint,
                "2026-09-18T08:00:00Z",
                good.privateKey
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    bad
                )
        );
    }

    @Test
    public void rejectsMismatchedPublicAndPrivateKeys()
        throws Exception {

        KeyPair publicPair =
            createEcKeyPair(
                "secp256r1"
            );

        KeyPair privatePair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material good =
            materialFor(
                publicPair
            );

        FinoraBranchCertificationCryptoValidator.Material bad =
            copy(
                good,
                good.keyId,
                good.publicKey,
                good.publicKeyFingerprint,
                good.createdAt,
                Base64
                    .getEncoder()
                    .encodeToString(
                        privatePair
                            .getPrivate()
                            .getEncoded()
                    )
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    bad
                )
        );
    }

    @Test
    public void rejectsInvalidPrivateKeyMetadata()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material good =
            materialFor(
                pair
            );

        FinoraBranchCertificationCryptoValidator.Material bad =
            new FinoraBranchCertificationCryptoValidator.Material(
                good.keyId,
                good.algorithm,
                good.publicKeyFormat,
                good.publicKey,
                good.fingerprintAlgorithm,
                good.publicKeyFingerprint,
                good.createdAt,
                good.schemaVersion,
                "WRONG_FORMAT",
                good.privateKey,
                good.vaultSchemaVersion
            );

        expectFailure(
            () ->
                FinoraBranchCertificationCryptoValidator.assertValid(
                    bad
                )
        );
    }

    @Test
    public void helperFingerprintAndKeyIdMatchMaterial()
        throws Exception {

        KeyPair pair =
            createEcKeyPair(
                "secp256r1"
            );

        FinoraBranchCertificationCryptoValidator.Material material =
            materialFor(
                pair
            );

        String fingerprint =
            FinoraBranchCertificationCryptoValidator
                .createFingerprint(
                    material.publicKey
                );

        String keyId =
            FinoraBranchCertificationCryptoValidator
                .createKeyId(
                    fingerprint
                );

        assertEquals(
            material.publicKeyFingerprint,
            fingerprint
        );

        assertEquals(
            material.keyId,
            keyId
        );
    }

    private static KeyPair createEcKeyPair(
        String curve
    ) throws Exception {

        KeyPairGenerator generator =
            KeyPairGenerator.getInstance(
                "EC"
            );

        generator.initialize(
            new ECGenParameterSpec(
                curve
            )
        );

        return generator.generateKeyPair();
    }

    private static FinoraBranchCertificationCryptoValidator.Material materialFor(
        KeyPair pair
    ) throws Exception {

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

        return new FinoraBranchCertificationCryptoValidator.Material(
            keyId,
            "ECDSA_P256_SHA256",
            "SPKI_DER_BASE64",
            publicKey,
            "SHA-256",
            fingerprint,
            CREATED_AT,
            1,
            "PKCS8_DER_BASE64",
            Base64
                .getEncoder()
                .encodeToString(
                    pair
                        .getPrivate()
                        .getEncoded()
                ),
            1
        );
    }

    private static FinoraBranchCertificationCryptoValidator.Material copy(
        FinoraBranchCertificationCryptoValidator.Material source,
        String keyId,
        String publicKey,
        String fingerprint,
        String createdAt,
        String privateKey
    ) {

        return new FinoraBranchCertificationCryptoValidator.Material(
            keyId,
            source.algorithm,
            source.publicKeyFormat,
            publicKey,
            source.fingerprintAlgorithm,
            fingerprint,
            createdAt,
            source.schemaVersion,
            source.privateKeyFormat,
            privateKey,
            source.vaultSchemaVersion
        );
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

        StringBuilder hex =
            new StringBuilder(
                digest.length * 2
            );

        for (
            byte value :
            digest
        ) {

            hex.append(
                String.format(
                    Locale.ROOT,
                    "%02x",
                    value & 0xff
                )
            );
        }

        return hex.toString();
    }

    private static void expectFailure(
        Runnable action
    ) {

        try {

            action.run();

            fail(
                "Expected certification validation failure."
            );
        }
        catch (
            IllegalArgumentException expected
        ) {

            assertTrue(
                expected
                    .getMessage()
                    .startsWith(
                        "FINORA Branch Certification "
                    )
            );
        }
    }
}