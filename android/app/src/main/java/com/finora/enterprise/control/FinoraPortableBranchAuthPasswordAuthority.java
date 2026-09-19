package com.finora.enterprise.control;

import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

/**
 * Password-first authority for Portable Branch Auth V1.
 *
 * This layer validates only the outer Password verifier.
 * It does not derive or evaluate Security Code material,
 * decrypt Portable Auth payloads, access storage or expose IPC.
 */
public final class FinoraPortableBranchAuthPasswordAuthority {

    public static final int PASSWORD_MIN_LENGTH =
        8;

    public static final int SECRET_MAX_LENGTH =
        128;

    private FinoraPortableBranchAuthPasswordAuthority() {
    }

    public static boolean verifyPassword(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String password
    ) {
        FinoraPortableBranchAuthEnvelopeCodec.validate(
            envelope
        );

        assertPassword(
            password
        );

        byte[] salt =
            Base64.getDecoder().decode(
                envelope.passwordFactor.salt
            );

        byte[] expectedVerifier =
            Base64.getDecoder().decode(
                envelope.passwordFactor.verifier
            );

        byte[] derived =
            null;

        byte[] derivedVerifier =
            null;

        try {
            derived =
                FinoraPortableBranchAuthScrypt.derive(
                    password,
                    salt
                );

            if (
                derived.length !=
                FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES
            ) {
                throw new IllegalStateException(
                    "Portable Branch Auth derived material length is invalid."
                );
            }

            derivedVerifier =
                Arrays.copyOfRange(
                    derived,
                    0,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES
                );

            if (
                expectedVerifier.length !=
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
            ) {
                throw new IllegalStateException(
                    "Portable Branch Auth Password verifier length is invalid."
                );
            }

            return MessageDigest.isEqual(
                derivedVerifier,
                expectedVerifier
            );
        }
        finally {

            if (derivedVerifier != null) {
                Arrays.fill(
                    derivedVerifier,
                    (byte) 0
                );
            }

            if (derived != null) {
                Arrays.fill(
                    derived,
                    (byte) 0
                );
            }

            Arrays.fill(
                expectedVerifier,
                (byte) 0
            );

            Arrays.fill(
                salt,
                (byte) 0
            );
        }
    }

    private static void assertPassword(
        String password
    ) {
        if (
            password == null ||
            password.length() <
                PASSWORD_MIN_LENGTH ||
            password.length() >
                SECRET_MAX_LENGTH ||
            isAllEcmaTrimWhitespace(
                password
            )
        ) {
            throw new IllegalArgumentException(
                "Password is invalid."
            );
        }
    }

    /**
     * Mirrors the relevant ECMAScript String.prototype.trim()
     * whitespace set for the Windows TypeScript authority.
     *
     * Password bytes themselves are never trimmed before SCRYPT.
     */
    private static boolean isAllEcmaTrimWhitespace(
        String value
    ) {
        int offset =
            0;

        while (
            offset <
            value.length()
        ) {
            int codePoint =
                value.codePointAt(
                    offset
                );

            if (
                !isEcmaTrimWhitespace(
                    codePoint
                )
            ) {
                return false;
            }

            offset +=
                Character.charCount(
                    codePoint
                );
        }

        return true;
    }

    private static boolean isEcmaTrimWhitespace(
        int codePoint
    ) {
        switch (codePoint) {

            case 0x0009:
            case 0x000A:
            case 0x000B:
            case 0x000C:
            case 0x000D:
            case 0x0020:
            case 0x00A0:
            case 0x1680:
            case 0x2028:
            case 0x2029:
            case 0x202F:
            case 0x205F:
            case 0x3000:
            case 0xFEFF:
                return true;

            default:
                return (
                    codePoint >= 0x2000 &&
                    codePoint <= 0x200A
                );
        }
    }
}