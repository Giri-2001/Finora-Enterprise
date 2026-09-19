package com.finora.enterprise.control;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;

import org.junit.Test;

public final class FinoraPortableBranchAuthCryptoCoreTest {

    private static final String EXPECTED_SECRET_FACTOR_HEX =
        "202122232425262728292a2b2c2d2e2f" +
        "303132333435363738393a3b3c3d3e3f";

    private static final String EXPECTED_KEY_HEX =
        "8fab84edcb22e147ff2ce375327e825f" +
        "ae318ee552c7951b8217113312facc3f";

    private static final String EXPECTED_AAD =
        "{\"format\":\"FINORA_PORTABLE_BRANCH_AUTH\"," +
        "\"schemaVersion\":1," +
        "\"canonicalUsername\":\"admin\"," +
        "\"branchScope\":{" +
            "\"ownerId\":\"OWNER-P1C-0001\"," +
            "\"businessId\":\"BUSINESS-P1C-0001\"," +
            "\"branchId\":\"BRANCH-P1C-0001\"" +
        "}," +
        "\"passwordFactor\":{" +
            "\"algorithm\":\"SCRYPT\"," +
            "\"salt\":\"AAECAwQFBgcICQoLDA0ODw==\"," +
            "\"N\":32768," +
            "\"r\":8," +
            "\"p\":1," +
            "\"derivedKeyLength\":64," +
            "\"verifierLength\":32," +
            "\"verifier\":\"QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl8=\"" +
        "}," +
        "\"securityFactor\":{" +
            "\"algorithm\":\"SCRYPT\"," +
            "\"salt\":\"EBESExQVFhcYGRobHB0eHw==\"," +
            "\"N\":32768," +
            "\"r\":8," +
            "\"p\":1," +
            "\"derivedKeyLength\":64" +
        "}," +
        "\"encryption\":{" +
            "\"algorithm\":\"AES-256-GCM\"," +
            "\"keyDerivation\":\"FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1\"," +
            "\"iv\":\"AAECAwQFBgcICQoL\"" +
        "}" +
        "}";

    private static final String PLAINTEXT =
        "{\"schemaVersion\":1," +
        "\"probe\":\"FINORA-P1C-KAT\"," +
        "\"canonicalUsername\":\"admin\"}";

    private static final String EXPECTED_CIPHERTEXT_HEX =
        "7247e7161497058d4b7105de9521ba17" +
        "e0e68a7b3e0f820bd9c038c9c34da8a6" +
        "97d1a2e0ccefbc6bf70848a601452988" +
        "1940029a17933547829dce1d2c092a4e" +
        "ad95f75dc9f94739";

    private static final String EXPECTED_TAG_HEX =
        "680f6392d6aabde8126a5d6e9d658b9b";

    @Test
    public void extractsExactSecondHalfOfDerivedMaterial() {

        byte[] derived =
            new byte[64];

        for (
            int index = 0;
            index < derived.length;
            index++
        ) {
            derived[index] =
                (byte) index;
        }

        assertArrayEquals(
            hex(
                EXPECTED_SECRET_FACTOR_HEX
            ),
            FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                derived
            )
        );
    }

    @Test
    public void derivesExactWindowsEncryptionKey() {

        byte[] passwordSecret =
            range(
                0,
                32
            );

        byte[] securitySecret =
            range(
                32,
                32
            );

        assertArrayEquals(
            hex(
                EXPECTED_KEY_HEX
            ),
            FinoraPortableBranchAuthCryptoCore.buildEncryptionKey(
                passwordSecret,
                securitySecret
            )
        );

        byte[] swapped =
            FinoraPortableBranchAuthCryptoCore.buildEncryptionKey(
                securitySecret,
                passwordSecret
            );

        assertFalse(
            java.util.Arrays.equals(
                hex(
                    EXPECTED_KEY_HEX
                ),
                swapped
            )
        );
    }

    @Test
    public void buildsExactWindowsAuthenticatedMetadataBytes() {

        byte[] aad =
            FinoraPortableBranchAuthCryptoCore.buildAad(
                fixtureEnvelope()
            );

        assertEquals(
            EXPECTED_AAD,
            new String(
                aad,
                StandardCharsets.UTF_8
            )
        );

        String aadText =
            new String(
                aad,
                StandardCharsets.UTF_8
            );

        assertFalse(
            aadText.contains(
                "\"authTag\""
            )
        );

        assertFalse(
            aadText.contains(
                "\"ciphertext\""
            )
        );
    }

    @Test
    public void encryptsExactAuthoritativeWindowsKat()
        throws Exception {

        byte[] key =
            hex(
                EXPECTED_KEY_HEX
            );

        byte[] iv =
            hex(
                "000102030405060708090a0b"
            );

        byte[] aad =
            EXPECTED_AAD.getBytes(
                StandardCharsets.UTF_8
            );

        FinoraPortableBranchAuthCryptoCore.EncryptedValue encrypted =
            FinoraPortableBranchAuthCryptoCore.encrypt(
                key,
                iv,
                aad,
                PLAINTEXT.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        assertArrayEquals(
            hex(
                EXPECTED_CIPHERTEXT_HEX
            ),
            encrypted.ciphertext
        );

        assertArrayEquals(
            hex(
                EXPECTED_TAG_HEX
            ),
            encrypted.authTag
        );

        assertEquals(
            "ckfnFhSXBY1LcQXelSG6F+Dmins+D4IL2cA4ycNNqKaX0aLgzO+8a/cISKYBRSmIGUACmheTNUeCnc4dLAkqTq2V913J+Uc5",
            Base64.getEncoder()
                .encodeToString(
                    encrypted.ciphertext
                )
        );

        assertEquals(
            "aA9jktaqvegSal1unWWLmw==",
            Base64.getEncoder()
                .encodeToString(
                    encrypted.authTag
                )
        );
    }

    @Test
    public void decryptsExactAuthoritativeWindowsKat()
        throws Exception {

        byte[] plaintext =
            FinoraPortableBranchAuthCryptoCore.decrypt(
                hex(
                    EXPECTED_KEY_HEX
                ),
                hex(
                    "000102030405060708090a0b"
                ),
                EXPECTED_AAD.getBytes(
                    StandardCharsets.UTF_8
                ),
                hex(
                    EXPECTED_CIPHERTEXT_HEX
                ),
                hex(
                    EXPECTED_TAG_HEX
                )
            );

        assertEquals(
            PLAINTEXT,
            new String(
                plaintext,
                StandardCharsets.UTF_8
            )
        );
    }

    @Test
    public void rejectsTamperedAuthenticationTag() {

        byte[] tag =
            hex(
                EXPECTED_TAG_HEX
            );

        tag[0] ^=
            0x01;

        assertThrows(
            GeneralSecurityException.class,
            () ->
                FinoraPortableBranchAuthCryptoCore.decrypt(
                    hex(
                        EXPECTED_KEY_HEX
                    ),
                    hex(
                        "000102030405060708090a0b"
                    ),
                    EXPECTED_AAD.getBytes(
                        StandardCharsets.UTF_8
                    ),
                    hex(
                        EXPECTED_CIPHERTEXT_HEX
                    ),
                    tag
                )
        );
    }

    private static FinoraPortableBranchAuthEnvelopeCodec.Envelope fixtureEnvelope() {

        return new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
            "FINORA_PORTABLE_BRANCH_AUTH",
            1,
            "admin",
            new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                "OWNER-P1C-0001",
                "BUSINESS-P1C-0001",
                "BRANCH-P1C-0001"
            ),
            new FinoraPortableBranchAuthEnvelopeCodec.Verifier(
                "SCRYPT",
                "AAECAwQFBgcICQoLDA0ODw==",
                32768,
                8,
                1,
                64,
                32,
                "QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl8="
            ),
            new FinoraPortableBranchAuthEnvelopeCodec.FactorKdf(
                "SCRYPT",
                "EBESExQVFhcYGRobHB0eHw==",
                32768,
                8,
                1,
                64
            ),
            new FinoraPortableBranchAuthEnvelopeCodec.Encryption(
                "AES-256-GCM",
                "FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1",
                "AAECAwQFBgcICQoL",
                "AAAAAAAAAAAAAAAAAAAAAA=="
            ),
            "AQID"
        );
    }

    private static byte[] range(
        int start,
        int length
    ) {
        byte[] value =
            new byte[length];

        for (
            int index = 0;
            index < length;
            index++
        ) {
            value[index] =
                (byte) (
                    start +
                    index
                );
        }

        return value;
    }

    private static byte[] hex(
        String value
    ) {
        if (
            value == null ||
            (value.length() % 2) != 0
        ) {
            throw new IllegalArgumentException(
                "Hex value is invalid."
            );
        }

        byte[] result =
            new byte[
                value.length() / 2
            ];

        for (
            int index = 0;
            index < result.length;
            index++
        ) {
            int offset =
                index * 2;

            int high =
                Character.digit(
                    value.charAt(offset),
                    16
                );

            int low =
                Character.digit(
                    value.charAt(offset + 1),
                    16
                );

            if (
                high < 0 ||
                low < 0
            ) {
                throw new IllegalArgumentException(
                    "Hex value is invalid."
                );
            }

            result[index] =
                (byte) (
                    (high << 4) |
                    low
                );
        }

        return result;
    }
}