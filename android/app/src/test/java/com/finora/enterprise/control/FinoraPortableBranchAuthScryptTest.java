package com.finora.enterprise.control;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import java.util.Arrays;

import org.junit.Test;

public final class FinoraPortableBranchAuthScryptTest {

    private static final String EXPECTED_FULL_DERIVED_HEX =
        "cf767c8d166d632e40c637d115e00c510da77fabc7e3d3cff8c7c66a7ae36ff5c4573312dd139948177f79d05e77623bf7dac0f081bd8b9209e85ae1141252a6";

    private static final String EXPECTED_VERIFIER_HEX =
        "cf767c8d166d632e40c637d115e00c510da77fabc7e3d3cff8c7c66a7ae36ff5";

    private static final String EXPECTED_SECRET_HALF_HEX =
        "c4573312dd139948177f79d05e77623bf7dac0f081bd8b9209e85ae1141252a6";

    @Test
    public void derivesExactNodeCompatibleFullFinoraVector() {

        byte[] salt =
            hex(
                "000102030405060708090a0b0c0d0e0f"
            );

        byte[] expected =
            hex(
                EXPECTED_FULL_DERIVED_HEX
            );

        byte[] actual =
            FinoraPortableBranchAuthScrypt.derive(
                "FinoraPortableAuth-Test-Password-01",
                salt
            );

        assertEquals(
            64,
            actual.length
        );

        assertArrayEquals(
            expected,
            actual
        );
    }

    @Test
    public void freezesCanonicalVerifierPrefixAndSecretHalf() {

        byte[] derived =
            FinoraPortableBranchAuthScrypt.derive(
                "FinoraPortableAuth-Test-Password-01",
                hex(
                    "000102030405060708090a0b0c0d0e0f"
                )
            );

        byte[] verifier =
            Arrays.copyOfRange(
                derived,
                0,
                FinoraPortableBranchAuthScrypt.VERIFIER_BYTES
            );

        byte[] secretHalf =
            Arrays.copyOfRange(
                derived,
                FinoraPortableBranchAuthScrypt.VERIFIER_BYTES,
                FinoraPortableBranchAuthScrypt.SCRYPT_DERIVED_KEY_BYTES
            );

        assertArrayEquals(
            hex(
                EXPECTED_VERIFIER_HEX
            ),
            verifier
        );

        assertArrayEquals(
            hex(
                EXPECTED_SECRET_HALF_HEX
            ),
            secretHalf
        );
    }

    @Test
    public void freezesCanonicalFinoraScryptParameters() {

        assertEquals(
            32768,
            FinoraPortableBranchAuthScrypt.SCRYPT_N
        );

        assertEquals(
            8,
            FinoraPortableBranchAuthScrypt.SCRYPT_R
        );

        assertEquals(
            1,
            FinoraPortableBranchAuthScrypt.SCRYPT_P
        );

        assertEquals(
            16,
            FinoraPortableBranchAuthScrypt.SCRYPT_SALT_BYTES
        );

        assertEquals(
            64,
            FinoraPortableBranchAuthScrypt.SCRYPT_DERIVED_KEY_BYTES
        );

        assertEquals(
            32,
            FinoraPortableBranchAuthScrypt.VERIFIER_BYTES
        );
    }

    @Test
    public void rejectsInvalidSaltLength() {

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthScrypt.derive(
                    "FinoraPortableAuth-Test-Password-01",
                    new byte[15]
                )
        );
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