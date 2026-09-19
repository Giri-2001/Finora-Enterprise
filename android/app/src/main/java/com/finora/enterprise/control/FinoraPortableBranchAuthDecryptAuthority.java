package com.finora.enterprise.control;

import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Base64;

/**
 * FINORA ENTERPRISE OS
 * PORTABLE BRANCH AUTH V1 DECRYPT AUTHORITY
 *
 * Exact decision order:
 *
 * 1. validate outer envelope;
 * 2. verify Password;
 * 3. wrong Password -> INVALID_CREDENTIALS;
 * 4. validate Security Code;
 * 5. derive Password + Security Code factors;
 * 6. build Portable Auth encryption key;
 * 7. build exact authenticated metadata;
 * 8. AES-256-GCM decrypt.
 *
 * This class returns authenticated raw plaintext only.
 *
 * Explicitly excluded:
 * - Portable Auth payload JSON parsing;
 * - inner verifier cross-checks;
 * - branch/device trust;
 * - filesystem storage;
 * - USB routing;
 * - IPC;
 * - Android Keystore identity.
 */
public final class FinoraPortableBranchAuthDecryptAuthority {

    public static final String INVALID_INPUT =
        "INVALID_INPUT";

    public static final String INVALID_CREDENTIALS =
        "INVALID_CREDENTIALS";

    public static final String AUTHENTICATION_FAILED =
        "AUTHENTICATION_FAILED";

    public static final int SECURITY_CODE_MIN_LENGTH =
        8;

    public static final int SECRET_MAX_LENGTH =
        128;

    private FinoraPortableBranchAuthDecryptAuthority() {
    }

    public static final class CryptoException
        extends Exception {

        private final String code;

        public CryptoException(
            String code,
            String message
        ) {
            super(
                message
            );

            this.code =
                code;
        }

        public CryptoException(
            String code,
            String message,
            Throwable cause
        ) {
            super(
                message,
                cause
            );

            this.code =
                code;
        }

        public String getCode() {
            return code;
        }
    }

    public static byte[] decrypt(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String password,
        String securityCode
    )
        throws CryptoException {

        return decrypt(
            envelope,
            password,
            securityCode,
            null
        );
    }

    public static byte[] decrypt(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String password,
        String securityCode,
        FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope
    )
        throws CryptoException {

        try {
            FinoraPortableBranchAuthEnvelopeCodec.validate(
                envelope
            );
        }
        catch (IllegalArgumentException error) {
            throw new CryptoException(
                INVALID_INPUT,
                "Portable Branch Auth envelope is invalid.",
                error
            );
        }

        final boolean passwordValid;

        try {
            passwordValid =
                FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                    envelope,
                    password
                );
        }
        catch (IllegalArgumentException error) {
            throw new CryptoException(
                INVALID_INPUT,
                "Password is invalid.",
                error
            );
        }

        /*
         * CRITICAL PASSWORD-FIRST BOUNDARY.
         *
         * Security Code validation and derivation MUST remain
         * below this branch.
         */
        if (!passwordValid) {
            throw new CryptoException(
                INVALID_CREDENTIALS,
                "Invalid credentials."
            );
        }

        if (
            expectedScope != null &&
            !scopesEqual(
                envelope.branchScope,
                expectedScope
            )
        ) {
            throw new CryptoException(
                AUTHENTICATION_FAILED,
                "Portable Branch Auth authentication failed."
            );
        }

        assertSecurityCode(
            securityCode
        );

        byte[] passwordSalt =
            null;

        byte[] securitySalt =
            null;

        byte[] passwordDerived =
            null;

        byte[] securityDerived =
            null;

        byte[] passwordSecretFactor =
            null;

        byte[] securitySecretFactor =
            null;

        byte[] encryptionKey =
            null;

        byte[] iv =
            null;

        byte[] authTag =
            null;

        byte[] ciphertext =
            null;

        byte[] aad =
            null;

        try {
            passwordSalt =
                Base64.getDecoder().decode(
                    envelope.passwordFactor.salt
                );

            securitySalt =
                Base64.getDecoder().decode(
                    envelope.securityFactor.salt
                );

            passwordDerived =
                FinoraPortableBranchAuthScrypt.derive(
                    password,
                    passwordSalt
                );

            securityDerived =
                FinoraPortableBranchAuthScrypt.derive(
                    securityCode,
                    securitySalt
                );

            passwordSecretFactor =
                FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                    passwordDerived
                );

            securitySecretFactor =
                FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                    securityDerived
                );

            encryptionKey =
                FinoraPortableBranchAuthCryptoCore.buildEncryptionKey(
                    passwordSecretFactor,
                    securitySecretFactor
                );

            iv =
                Base64.getDecoder().decode(
                    envelope.encryption.iv
                );

            authTag =
                Base64.getDecoder().decode(
                    envelope.encryption.authTag
                );

            ciphertext =
                Base64.getDecoder().decode(
                    envelope.ciphertext
                );

            aad =
                FinoraPortableBranchAuthCryptoCore.buildAad(
                    envelope
                );

            try {
                return FinoraPortableBranchAuthCryptoCore.decrypt(
                    encryptionKey,
                    iv,
                    aad,
                    ciphertext,
                    authTag
                );
            }
            catch (GeneralSecurityException error) {
                throw new CryptoException(
                    AUTHENTICATION_FAILED,
                    "Portable Branch Auth authentication failed.",
                    error
                );
            }
        }
        catch (IllegalArgumentException error) {
            throw new CryptoException(
                AUTHENTICATION_FAILED,
                "Portable Branch Auth authentication failed.",
                error
            );
        }
        finally {
            zero(
                passwordSalt
            );

            zero(
                securitySalt
            );

            zero(
                passwordDerived
            );

            zero(
                securityDerived
            );

            zero(
                passwordSecretFactor
            );

            zero(
                securitySecretFactor
            );

            zero(
                encryptionKey
            );

            zero(
                iv
            );

            zero(
                authTag
            );

            zero(
                ciphertext
            );

            zero(
                aad
            );
        }
    }

    private static boolean scopesEqual(
        FinoraPortableBranchAuthEnvelopeCodec.Scope left,
        FinoraPortableBranchAuthEnvelopeCodec.Scope right
    ) {

        return (
            left != null &&
            right != null &&
            left.ownerId != null &&
            right.ownerId != null &&
            left.businessId != null &&
            right.businessId != null &&
            left.branchId != null &&
            right.branchId != null &&
            left.ownerId.equals(
                right.ownerId
            ) &&
            left.businessId.equals(
                right.businessId
            ) &&
            left.branchId.equals(
                right.branchId
            )
        );
    }
    private static void assertSecurityCode(
        String securityCode
    )
        throws CryptoException {

        if (
            securityCode == null ||
            securityCode.length() <
                SECURITY_CODE_MIN_LENGTH ||
            securityCode.length() >
                SECRET_MAX_LENGTH ||
            isAllEcmaTrimWhitespace(
                securityCode
            )
        ) {
            throw new CryptoException(
                INVALID_INPUT,
                "Security Code is invalid."
            );
        }
    }

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

    private static void zero(
        byte[] value
    ) {
        if (value != null) {
            Arrays.fill(
                value,
                (byte) 0
            );
        }
    }
}