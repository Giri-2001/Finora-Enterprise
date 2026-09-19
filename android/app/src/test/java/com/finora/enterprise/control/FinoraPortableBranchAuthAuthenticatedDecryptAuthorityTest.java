package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraPortableBranchAuthAuthenticatedDecryptAuthorityTest {

    private static final String PASSWORD =
        "password-01";

    private static final String WRONG_PASSWORD =
        "wrong-password";

    private static final String SECURITY_CODE =
        "security-code-01";

    private static final byte[] IV =
        new byte[] {
            0x00,
            0x01,
            0x02,
            0x03,
            0x04,
            0x05,
            0x06,
            0x07,
            0x08,
            0x09,
            0x0a,
            0x0b
        };

    @Test
    public void decryptsAndAuthenticatesEncryptedPortablePayload()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            FinoraPortableBranchAuthPayloadCodec.Payload payload =
                FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decrypt(
                    fixture.envelope,
                    PASSWORD,
                    SECURITY_CODE
                );

            assertEquals(
                fixture.expected.canonicalUsername,
                payload.canonicalUsername
            );

            assertEquals(
                fixture.expected.ownerId,
                payload.ownerId
            );

            assertEquals(
                fixture.expected.businessId,
                payload.businessId
            );

            assertEquals(
                fixture.expected.branchId,
                payload.branchId
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void preservesRawWrongPasswordInvalidCredentials()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
                assertThrows(
                    FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                    () ->
                        FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decrypt(
                            fixture.envelope,
                            WRONG_PASSWORD,
                            SECURITY_CODE
                        )
                );

            assertEquals(
                FinoraPortableBranchAuthDecryptAuthority.INVALID_CREDENTIALS,
                error.getCode()
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void mapsPostDecryptBindingFailureToAuthenticationFailed()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            FinoraPortableBranchAuthEnvelopeCodec.Envelope mismatched =
                new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
                    fixture.envelope.format,
                    fixture.envelope.schemaVersion,
                    fixture.envelope.canonicalUsername,
                    new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                        fixture.envelope.branchScope.ownerId,
                        fixture.envelope.branchScope.businessId,
                        "BRANCH-MISMATCH"
                    ),
                    fixture.envelope.passwordFactor,
                    fixture.envelope.securityFactor,
                    fixture.envelope.encryption,
                    fixture.envelope.ciphertext
                );

            byte[] supplied =
                Arrays.copyOf(
                    fixture.plaintext,
                    fixture.plaintext.length
                );

            FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
                assertThrows(
                    FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                    () ->
                        FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decryptWith(
                            mismatched,
                            PASSWORD,
                            SECURITY_CODE,
                            (
                                envelope,
                                password,
                                securityCode
                            ) ->
                                supplied
                        )
                );

            assertEquals(
                FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
                error.getCode()
            );

            assertTrue(
                allZero(
                    supplied
                )
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void zeroizesAuthenticatedPlaintextAfterSuccessfulComposition()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            byte[] supplied =
                Arrays.copyOf(
                    fixture.plaintext,
                    fixture.plaintext.length
                );

            FinoraPortableBranchAuthPayloadCodec.Payload payload =
                FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decryptWith(
                    fixture.envelope,
                    PASSWORD,
                    SECURITY_CODE,
                    (
                        envelope,
                        password,
                        securityCode
                    ) ->
                        supplied
                );

            assertEquals(
                fixture.expected.branchId,
                payload.branchId
            );

            assertTrue(
                allZero(
                    supplied
                )
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void zeroizesPlaintextWhenInnerPayloadAuthenticationFails()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            byte[] malformed =
                "{}".getBytes(
                    StandardCharsets.UTF_8
                );

            FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
                assertThrows(
                    FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                    () ->
                        FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decryptWith(
                            fixture.envelope,
                            PASSWORD,
                            SECURITY_CODE,
                            (
                                envelope,
                                password,
                                securityCode
                            ) ->
                                malformed
                        )
                );

            assertEquals(
                FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
                error.getCode()
            );

            assertTrue(
                allZero(
                    malformed
                )
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void matchingExpectedScopeDecryptsAndAuthenticatesPortablePayload()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope =
                new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                    fixture.envelope.branchScope.ownerId,
                    fixture.envelope.branchScope.businessId,
                    fixture.envelope.branchScope.branchId
                );

            FinoraPortableBranchAuthPayloadCodec.Payload payload =
                FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decrypt(
                    fixture.envelope,
                    PASSWORD,
                    SECURITY_CODE,
                    expectedScope
                );

            assertEquals(
                fixture.expected.branchId,
                payload.branchId
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void wrongPasswordWinsBeforeExpectedScopeMismatchAtTopLevel()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            FinoraPortableBranchAuthEnvelopeCodec.Scope wrongScope =
                new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                    fixture.envelope.branchScope.ownerId,
                    fixture.envelope.branchScope.businessId,
                    "BRANCH-WRONG"
                );

            FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
                assertThrows(
                    FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                    () ->
                        FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decrypt(
                            fixture.envelope,
                            WRONG_PASSWORD,
                            "x",
                            wrongScope
                        )
                );

            assertEquals(
                FinoraPortableBranchAuthDecryptAuthority.INVALID_CREDENTIALS,
                error.getCode()
            );
        }
        finally {
            fixture.destroy();
        }
    }

    @Test
    public void expectedScopeMismatchWinsBeforeSecurityValidationAtTopLevel()
        throws Exception {

        Fixture fixture =
            fixture();

        try {
            FinoraPortableBranchAuthEnvelopeCodec.Scope wrongScope =
                new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                    fixture.envelope.branchScope.ownerId,
                    fixture.envelope.branchScope.businessId,
                    "BRANCH-WRONG"
                );

            FinoraPortableBranchAuthDecryptAuthority.CryptoException error =
                assertThrows(
                    FinoraPortableBranchAuthDecryptAuthority.CryptoException.class,
                    () ->
                        FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decrypt(
                            fixture.envelope,
                            PASSWORD,
                            "x",
                            wrongScope
                        )
                );

            assertEquals(
                FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
                error.getCode()
            );
        }
        finally {
            fixture.destroy();
        }
    }
    private static Fixture fixture()
        throws Exception {

        String canonicalJson =
            loadCanonicalPayloadFixture();

        JSONObject root =
            new JSONObject(
                canonicalJson
            );

        JSONObject passwordVerifierJson =
            root.getJSONObject(
                "passwordVerifier"
            );

        JSONObject securityVerifierJson =
            root.getJSONObject(
                "securityVerifier"
            );

        byte[] passwordSalt =
            null;

        byte[] securitySalt =
            null;

        byte[] passwordDerived =
            null;

        byte[] securityDerived =
            null;

        byte[] passwordVerifier =
            null;

        byte[] securityVerifier =
            null;

        byte[] passwordSecret =
            null;

        byte[] securitySecret =
            null;

        byte[] key =
            null;

        byte[] aad =
            null;

        byte[] plaintext =
            null;

        boolean success =
            false;

        try {
            passwordSalt =
                Base64.getDecoder().decode(
                    passwordVerifierJson.getString(
                        "salt"
                    )
                );

            securitySalt =
                Base64.getDecoder().decode(
                    securityVerifierJson.getString(
                        "salt"
                    )
                );

            passwordDerived =
                FinoraPortableBranchAuthScrypt.derive(
                    PASSWORD,
                    passwordSalt
                );

            securityDerived =
                FinoraPortableBranchAuthScrypt.derive(
                    SECURITY_CODE,
                    securitySalt
                );

            passwordVerifier =
                Arrays.copyOfRange(
                    passwordDerived,
                    0,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES
                );

            securityVerifier =
                Arrays.copyOfRange(
                    securityDerived,
                    0,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES
                );

            passwordVerifierJson.put(
                "verifier",
                Base64.getEncoder().encodeToString(
                    passwordVerifier
                )
            );

            securityVerifierJson.put(
                "verifier",
                Base64.getEncoder().encodeToString(
                    securityVerifier
                )
            );

            plaintext =
                root
                    .toString()
                    .getBytes(
                        StandardCharsets.UTF_8
                    );

            FinoraPortableBranchAuthPayloadCodec.Payload payload =
                FinoraPortableBranchAuthPayloadCodec.parseCorePayload(
                    plaintext
                );

            FinoraPortableBranchAuthEnvelopeCodec.Scope scope =
                new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                    payload.ownerId,
                    payload.businessId,
                    payload.branchId
                );

            FinoraPortableBranchAuthEnvelopeCodec.Verifier passwordFactor =
                new FinoraPortableBranchAuthEnvelopeCodec.Verifier(
                    payload.passwordVerifier.algorithm,
                    payload.passwordVerifier.salt,
                    payload.passwordVerifier.N,
                    payload.passwordVerifier.r,
                    payload.passwordVerifier.p,
                    payload.passwordVerifier.derivedKeyLength,
                    payload.passwordVerifier.verifierLength,
                    payload.passwordVerifier.verifier
                );

            FinoraPortableBranchAuthEnvelopeCodec.FactorKdf securityFactor =
                new FinoraPortableBranchAuthEnvelopeCodec.FactorKdf(
                    payload.securityVerifier.algorithm,
                    payload.securityVerifier.salt,
                    payload.securityVerifier.N,
                    payload.securityVerifier.r,
                    payload.securityVerifier.p,
                    payload.securityVerifier.derivedKeyLength
                );

            passwordSecret =
                FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                    passwordDerived
                );

            securitySecret =
                FinoraPortableBranchAuthCryptoCore.getSecretFactor(
                    securityDerived
                );

            key =
                FinoraPortableBranchAuthCryptoCore.buildEncryptionKey(
                    passwordSecret,
                    securitySecret
                );

            FinoraPortableBranchAuthEnvelopeCodec.Envelope aadEnvelope =
                new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
                    "FINORA_PORTABLE_BRANCH_AUTH",
                    1,
                    payload.canonicalUsername,
                    scope,
                    passwordFactor,
                    securityFactor,
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

            aad =
                FinoraPortableBranchAuthCryptoCore.buildAad(
                    aadEnvelope
                );

            FinoraPortableBranchAuthCryptoCore.EncryptedValue encrypted =
                FinoraPortableBranchAuthCryptoCore.encrypt(
                    key,
                    IV,
                    aad,
                    plaintext
                );

            try {
                String authTag =
                    Base64.getEncoder().encodeToString(
                        encrypted.authTag
                    );

                String ciphertext =
                    Base64.getEncoder().encodeToString(
                        encrypted.ciphertext
                    );

                FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
                    new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
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
                            authTag
                        ),
                        ciphertext
                    );

                Fixture result =
                    new Fixture(
                        envelope,
                        plaintext,
                        payload
                    );

                success =
                    true;

                return result;
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
            }
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
                passwordVerifier
            );

            zero(
                securityVerifier
            );

            zero(
                passwordSecret
            );

            zero(
                securitySecret
            );

            zero(
                key
            );

            zero(
                aad
            );

            if (!success) {
                zero(
                    plaintext
                );
            }
        }
    }

    private static String loadCanonicalPayloadFixture()
        throws Exception {

        Method method =
            FinoraPortableBranchAuthPayloadCodecTest.class.getDeclaredMethod(
                "realPayload"
            );

        method.setAccessible(
            true
        );

        return (String) method.invoke(
            null
        );
    }

    private static boolean allZero(
        byte[] value
    ) {

        if (value == null) {
            return false;
        }

        for (byte item : value) {

            if (item != 0) {
                return false;
            }
        }

        return true;
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

    private static final class Fixture {

        final FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope;
        final byte[] plaintext;
        final FinoraPortableBranchAuthPayloadCodec.Payload expected;

        Fixture(
            FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
            byte[] plaintext,
            FinoraPortableBranchAuthPayloadCodec.Payload expected
        ) {
            this.envelope =
                envelope;

            this.plaintext =
                plaintext;

            this.expected =
                expected;
        }

        void destroy() {

            zero(
                plaintext
            );
        }
    }
}