package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

import org.junit.Test;

public final class FinoraPortableBranchAuthDecryptAuthorityTest {

    private static final String PASSWORD =
        "Finora-P1D-Password-01";

    private static final String WRONG_PASSWORD =
        "Finora-P1D-Wrong-Password";

    private static final String SECURITY_CODE =
        "Finora-P1D-Security-01";

    private static final String WRONG_SECURITY_CODE =
        "Finora-P1D-Wrong-Security";

    private static final String PASSWORD_SALT =
        "AAECAwQFBgcICQoLDA0ODw==";

    private static final String SECURITY_SALT =
        "EBESExQVFhcYGRobHB0eHw==";

    private static final byte[] IV =
        hex(
            "000102030405060708090a0b"
        );

    private static final String PLAINTEXT =
        "{\"probe\":\"FINORA-P1D-I2\",\"canonicalUsername\":\"admin\"}";

    @Test
    public void correctPasswordAndSecurityCodeDecryptAuthenticatedPlaintext()
        throws Exception {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            encryptedFixture();

        byte[] plaintext =
            FinoraPortableBranchAuthDecryptAuthority.decrypt(
                envelope,
                PASSWORD,
                SECURITY_CODE
            );

        try {
            assertEquals(
                PLAINTEXT,
                new String(
                    plaintext,
                    StandardCharsets.UTF_8
                )
            );
        }
        finally {
            Arrays.fill(
                plaintext,
                (byte) 0
            );
        }
    }

    @Test
    public void wrongPasswordFailsBeforeMalformedSecurityCodeIsEvaluated()
        throws Exception {

        FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
            assertThrows(
                FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                () ->
                    FinoraPortableBranchAuthDecryptAuthority.decrypt(
                        encryptedFixture(),
                        WRONG_PASSWORD,
                        "x"
                    )
            );

        assertEquals(
            FinoraPortableBranchAuthDecryptAuthority.INVALID_CREDENTIALS,
            error.getCode()
        );

        assertEquals(
            "Invalid credentials.",
            error.getMessage()
        );
    }

    @Test
    public void correctPasswordThenMalformedSecurityCodeIsInvalidInput()
        throws Exception {

        FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
            assertThrows(
                FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                () ->
                    FinoraPortableBranchAuthDecryptAuthority.decrypt(
                        encryptedFixture(),
                        PASSWORD,
                        "x"
                    )
            );

        assertEquals(
            FinoraPortableBranchAuthDecryptAuthority.INVALID_INPUT,
            error.getCode()
        );
    }

    @Test
    public void matchingExpectedScopeDecryptsAuthenticatedPlaintext()
        throws Exception {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            encryptedFixture();

        byte[] plaintext =
            FinoraPortableBranchAuthDecryptAuthority.decrypt(
                envelope,
                PASSWORD,
                SECURITY_CODE,
                new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                    envelope.branchScope.ownerId,
                    envelope.branchScope.businessId,
                    envelope.branchScope.branchId
                )
            );

        try {
            assertEquals(
                PLAINTEXT,
                new String(
                    plaintext,
                    StandardCharsets.UTF_8
                )
            );
        }
        finally {
            Arrays.fill(
                plaintext,
                (byte) 0
            );
        }
    }

    @Test
    public void expectedScopeMismatchFailsBeforeSecurityCodeValidation()
        throws Exception {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            encryptedFixture();

        FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
            assertThrows(
                FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                () ->
                    FinoraPortableBranchAuthDecryptAuthority.decrypt(
                        envelope,
                        PASSWORD,
                        "x",
                        new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                            envelope.branchScope.ownerId,
                            envelope.branchScope.businessId,
                            "BRANCH-WRONG"
                        )
                    )
            );

        assertEquals(
            FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
            error.getCode()
        );
    }

    @Test
    public void wrongPasswordWinsBeforeExpectedScopeMismatch()
        throws Exception {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            encryptedFixture();

        FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
            assertThrows(
                FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                () ->
                    FinoraPortableBranchAuthDecryptAuthority.decrypt(
                        envelope,
                        WRONG_PASSWORD,
                        "x",
                        new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                            envelope.branchScope.ownerId,
                            envelope.branchScope.businessId,
                            "BRANCH-WRONG"
                        )
                    )
            );

        assertEquals(
            FinoraPortableBranchAuthDecryptAuthority.INVALID_CREDENTIALS,
            error.getCode()
        );
    }
    @Test
    public void wrongSecurityCodeFailsAuthenticatedDecrypt()
        throws Exception {

        FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
            assertThrows(
                FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                () ->
                    FinoraPortableBranchAuthDecryptAuthority.decrypt(
                        encryptedFixture(),
                        PASSWORD,
                        WRONG_SECURITY_CODE
                    )
            );

        assertEquals(
            FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
            error.getCode()
        );
    }

    @Test
    public void tamperedCiphertextFailsAuthenticatedDecrypt()
        throws Exception {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope original =
            encryptedFixture();

        byte[] ciphertext =
            Base64.getDecoder().decode(
                original.ciphertext
            );

        ciphertext[0] ^=
            0x01;

        FinoraPortableBranchAuthEnvelopeCodec.Envelope tampered =
            new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
                original.format,
                original.schemaVersion,
                original.canonicalUsername,
                original.branchScope,
                original.passwordFactor,
                original.securityFactor,
                original.encryption,
                Base64.getEncoder().encodeToString(
                    ciphertext
                )
            );

        Arrays.fill(
            ciphertext,
            (byte) 0
        );

        FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
            assertThrows(
                FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                () ->
                    FinoraPortableBranchAuthDecryptAuthority.decrypt(
                        tampered,
                        PASSWORD,
                        SECURITY_CODE
                    )
            );

        assertEquals(
            FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
            error.getCode()
        );
    }

    private static FinoraPortableBranchAuthEnvelopeCodec.Envelope encryptedFixture()
        throws Exception {

        byte[] passwordSalt =
            Base64.getDecoder().decode(
                PASSWORD_SALT
            );

        byte[] securitySalt =
            Base64.getDecoder().decode(
                SECURITY_SALT
            );

        byte[] passwordDerived =
            FinoraPortableBranchAuthScrypt.derive(
                PASSWORD,
                passwordSalt
            );

        byte[] securityDerived =
            FinoraPortableBranchAuthScrypt.derive(
                SECURITY_CODE,
                securitySalt
            );

        byte[] passwordVerifier =
            Arrays.copyOfRange(
                passwordDerived,
                0,
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
            );

        byte[] passwordSecret =
            FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                passwordDerived
            );

        byte[] securitySecret =
            FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                securityDerived
            );

        byte[] key =
            FinoraPortableBranchAuthCryptoCore.buildEncryptionKey(
                passwordSecret,
                securitySecret
            );

        try {
            FinoraPortableBranchAuthEnvelopeCodec.Envelope aadEnvelope =
                new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
                    "FINORA_PORTABLE_BRANCH_AUTH",
                    1,
                    "admin",
                    new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                        "OWNER-P1D-0001",
                        "BUSINESS-P1D-0001",
                        "BRANCH-P1D-0001"
                    ),
                    new FinoraPortableBranchAuthEnvelopeCodec.Verifier(
                        "SCRYPT",
                        PASSWORD_SALT,
                        32768,
                        8,
                        1,
                        64,
                        32,
                        Base64.getEncoder().encodeToString(
                            passwordVerifier
                        )
                    ),
                    new FinoraPortableBranchAuthEnvelopeCodec.FactorKdf(
                        "SCRYPT",
                        SECURITY_SALT,
                        32768,
                        8,
                        1,
                        64
                    ),
                    new FinoraPortableBranchAuthEnvelopeCodec.Encryption(
                        "AES-256-GCM",
                        "FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1",
                        Base64.getEncoder().encodeToString(
                            IV
                        ),
                        "AAAAAAAAAAAAAAAAAAAAAA=="
                    ),
                    "AQ=="
                );

            byte[] aad =
                FinoraPortableBranchAuthCryptoCore.buildAad(
                    aadEnvelope
                );

            FinoraPortableBranchAuthCryptoCore.EncryptedValue encrypted =
                FinoraPortableBranchAuthCryptoCore.encrypt(
                    key,
                    IV,
                    aad,
                    PLAINTEXT.getBytes(
                        StandardCharsets.UTF_8
                    )
                );

            try {
                return new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
                    aadEnvelope.format,
                    aadEnvelope.schemaVersion,
                    aadEnvelope.canonicalUsername,
                    aadEnvelope.branchScope,
                    aadEnvelope.passwordFactor,
                    aadEnvelope.securityFactor,
                    new FinoraPortableBranchAuthEnvelopeCodec.Encryption(
                        aadEnvelope.encryption.algorithm,
                        aadEnvelope.encryption.keyDerivation,
                        aadEnvelope.encryption.iv,
                        Base64.getEncoder().encodeToString(
                            encrypted.authTag
                        )
                    ),
                    Base64.getEncoder().encodeToString(
                        encrypted.ciphertext
                    )
                );
            }
            finally {
                Arrays.fill(
                    encrypted.ciphertext,
                    (byte) 0
                );

                Arrays.fill(
                    encrypted.authTag,
                    (byte) 0
                );

                Arrays.fill(
                    aad,
                    (byte) 0
                );
            }
        }
        finally {
            Arrays.fill(
                passwordSalt,
                (byte) 0
            );

            Arrays.fill(
                securitySalt,
                (byte) 0
            );

            Arrays.fill(
                passwordDerived,
                (byte) 0
            );

            Arrays.fill(
                securityDerived,
                (byte) 0
            );

            Arrays.fill(
                passwordVerifier,
                (byte) 0
            );

            Arrays.fill(
                passwordSecret,
                (byte) 0
            );

            Arrays.fill(
                securitySecret,
                (byte) 0
            );

            Arrays.fill(
                key,
                (byte) 0
            );
        }
    }

    private static byte[] hex(
        String value
    ) {
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

            result[index] =
                (byte) (
                    (
                        Character.digit(
                            value.charAt(
                                offset
                            ),
                            16
                        ) << 4
                    ) |
                    Character.digit(
                        value.charAt(
                            offset + 1
                        ),
                        16
                    )
                );
        }

        return result;
    }
}