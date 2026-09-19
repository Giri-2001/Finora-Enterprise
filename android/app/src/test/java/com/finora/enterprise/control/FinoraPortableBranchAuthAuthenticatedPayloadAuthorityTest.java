package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraPortableBranchAuthAuthenticatedPayloadAuthorityTest {

    private static final String SECURITY_CODE =
        "security-code-01";

    @Test
    public void acceptsMatchingAuthenticatedPayload()
        throws Exception {

        Fixture fixture =
            fixture();

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                fixture.envelope,
                SECURITY_CODE,
                fixture.plaintext
            );

        assertEquals(
            fixture.expected.canonicalUsername,
            payload.canonicalUsername
        );

        assertEquals(
            fixture.expected.branchId,
            payload.branchId
        );
    }

    @Test
    public void malformedPayloadMapsToAuthenticationFailed()
        throws Exception {

        Fixture fixture =
            fixture();

        assertAuthenticationFailed(
            () ->
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    fixture.envelope,
                    SECURITY_CODE,
                    "{}".getBytes(
                        StandardCharsets.UTF_8
                    )
                )
        );
    }

    @Test
    public void rejectsCanonicalUsernameMismatch()
        throws Exception {

        Fixture fixture =
            fixture();

        FinoraPortableBranchAuthEnvelopeCodec.Envelope mismatched =
            envelope(
                "different-user",
                fixture.envelope.branchScope,
                fixture.envelope.passwordFactor,
                fixture.envelope.securityFactor
            );

        assertAuthenticationFailed(
            () ->
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    mismatched,
                    SECURITY_CODE,
                    fixture.plaintext
                )
        );
    }

    @Test
    public void rejectsBranchScopeMismatch()
        throws Exception {

        Fixture fixture =
            fixture();

        FinoraPortableBranchAuthEnvelopeCodec.Scope wrongScope =
            new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                fixture.envelope.branchScope.ownerId,
                fixture.envelope.branchScope.businessId,
                "BRANCH-WRONG"
            );

        FinoraPortableBranchAuthEnvelopeCodec.Envelope mismatched =
            envelope(
                fixture.envelope.canonicalUsername,
                wrongScope,
                fixture.envelope.passwordFactor,
                fixture.envelope.securityFactor
            );

        assertAuthenticationFailed(
            () ->
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    mismatched,
                    SECURITY_CODE,
                    fixture.plaintext
                )
        );
    }

    @Test
    public void rejectsPasswordVerifierByteMismatch()
        throws Exception {

        Fixture fixture =
            fixture();

        byte[] verifier =
            Base64.getDecoder().decode(
                fixture
                    .envelope
                    .passwordFactor
                    .verifier
            );

        verifier[0] ^=
            0x01;

        FinoraPortableBranchAuthEnvelopeCodec.Verifier wrongPasswordFactor =
            new FinoraPortableBranchAuthEnvelopeCodec.Verifier(
                fixture.envelope.passwordFactor.algorithm,
                fixture.envelope.passwordFactor.salt,
                fixture.envelope.passwordFactor.N,
                fixture.envelope.passwordFactor.r,
                fixture.envelope.passwordFactor.p,
                fixture.envelope.passwordFactor.derivedKeyLength,
                fixture.envelope.passwordFactor.verifierLength,
                Base64.getEncoder().encodeToString(
                    verifier
                )
            );

        Arrays.fill(
            verifier,
            (byte) 0
        );

        FinoraPortableBranchAuthEnvelopeCodec.Envelope mismatched =
            envelope(
                fixture.envelope.canonicalUsername,
                fixture.envelope.branchScope,
                wrongPasswordFactor,
                fixture.envelope.securityFactor
            );

        assertAuthenticationFailed(
            () ->
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    mismatched,
                    SECURITY_CODE,
                    fixture.plaintext
                )
        );
    }

    @Test
    public void rejectsSecurityVerifierMetadataMismatch()
        throws Exception {

        Fixture fixture =
            fixture();

        FinoraPortableBranchAuthEnvelopeCodec.FactorKdf wrongSecurityFactor =
            new FinoraPortableBranchAuthEnvelopeCodec.FactorKdf(
                fixture.envelope.securityFactor.algorithm,
                fixture.envelope.securityFactor.salt,
                fixture.envelope.securityFactor.N + 1,
                fixture.envelope.securityFactor.r,
                fixture.envelope.securityFactor.p,
                fixture.envelope.securityFactor.derivedKeyLength
            );

        FinoraPortableBranchAuthEnvelopeCodec.Envelope mismatched =
            envelope(
                fixture.envelope.canonicalUsername,
                fixture.envelope.branchScope,
                fixture.envelope.passwordFactor,
                wrongSecurityFactor
            );

        assertAuthenticationFailed(
            () ->
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    mismatched,
                    SECURITY_CODE,
                    fixture.plaintext
                )
        );
    }

    @Test
    public void rejectsDerivedSecurityVerifierMismatch()
        throws Exception {

        Fixture fixture =
            fixture();

        JSONObject root =
            new JSONObject(
                new String(
                    fixture.plaintext,
                    StandardCharsets.UTF_8
                )
            );

        JSONObject securityVerifier =
            root.getJSONObject(
                "securityVerifier"
            );

        byte[] verifier =
            Base64.getDecoder().decode(
                securityVerifier.getString(
                    "verifier"
                )
            );

        verifier[0] ^=
            0x01;

        securityVerifier.put(
            "verifier",
            Base64.getEncoder().encodeToString(
                verifier
            )
        );

        Arrays.fill(
            verifier,
            (byte) 0
        );

        byte[] tamperedPayload =
            root
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        assertAuthenticationFailed(
            () ->
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    fixture.envelope,
                    SECURITY_CODE,
                    tamperedPayload
                )
        );
    }

    private static Fixture fixture()
        throws Exception {

        String basePayload =
            loadCanonicalPayloadFixture();

        JSONObject root =
            new JSONObject(
                basePayload
            );

        JSONObject securityVerifier =
            root.getJSONObject(
                "securityVerifier"
            );

        byte[] salt =
            Base64.getDecoder().decode(
                securityVerifier.getString(
                    "salt"
                )
            );

        byte[] securityDerived =
            FinoraPortableBranchAuthScrypt.derive(
                SECURITY_CODE,
                salt
            );

        byte[] derivedVerifier =
            Arrays.copyOfRange(
                securityDerived,
                0,
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
            );

        try {
            securityVerifier.put(
                "verifier",
                Base64.getEncoder().encodeToString(
                    derivedVerifier
                )
            );

            byte[] plaintext =
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

            return new Fixture(
                envelope(
                    payload.canonicalUsername,
                    scope,
                    passwordFactor,
                    securityFactor
                ),
                plaintext,
                payload
            );
        }
        finally {
            Arrays.fill(
                salt,
                (byte) 0
            );

            Arrays.fill(
                securityDerived,
                (byte) 0
            );

            Arrays.fill(
                derivedVerifier,
                (byte) 0
            );
        }
    }

    private static FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope(
        String canonicalUsername,
        FinoraPortableBranchAuthEnvelopeCodec.Scope scope,
        FinoraPortableBranchAuthEnvelopeCodec.Verifier passwordFactor,
        FinoraPortableBranchAuthEnvelopeCodec.FactorKdf securityFactor
    ) {

        return new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
            "FINORA_PORTABLE_BRANCH_AUTH",
            1,
            canonicalUsername,
            scope,
            passwordFactor,
            securityFactor,
            null,
            null
        );
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

    private static void assertAuthenticationFailed(
        ThrowingAction action
    ) {

        FinoraPortableBranchAuthAuthenticatedPayloadAuthority.AuthenticationException error =
            assertThrows(
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.AuthenticationException.class,
                () ->
                    action.run()
            );

        assertEquals(
            FinoraPortableBranchAuthAuthenticatedPayloadAuthority.AUTHENTICATION_FAILED,
            error.getCode()
        );

        assertEquals(
            "Portable Branch Auth authentication failed.",
            error.getMessage()
        );
    }

    private interface ThrowingAction {

        void run()
            throws Exception;
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
    }
}