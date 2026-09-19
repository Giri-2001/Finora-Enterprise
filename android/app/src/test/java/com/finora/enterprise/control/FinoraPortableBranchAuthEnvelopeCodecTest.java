package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import org.junit.Test;

public final class FinoraPortableBranchAuthEnvelopeCodecTest {

    private static final String PASSWORD_SALT =
        "AAECAwQFBgcICQoLDA0ODw==";

    private static final String SECURITY_SALT =
        "EBESExQVFhcYGRobHB0eHw==";

    private static final String PASSWORD_VERIFIER =
        "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=";

    private static final String IV =
        "AAECAwQFBgcICQoL";

    private static final String AUTH_TAG =
        "AAAAAAAAAAAAAAAAAAAAAA==";

    private static final String CIPHERTEXT =
        "AQID";

    private static final String CANONICAL_FIXTURE =
        "{" +
        "\"format\":\"FINORA_PORTABLE_BRANCH_AUTH\"," +
        "\"schemaVersion\":1," +
        "\"canonicalUsername\":\"admin\"," +
        "\"branchScope\":{" +
            "\"ownerId\":\"OWNER-1\"," +
            "\"businessId\":\"BUSINESS-1\"," +
            "\"branchId\":\"BRANCH-1\"" +
        "}," +
        "\"passwordFactor\":{" +
            "\"algorithm\":\"SCRYPT\"," +
            "\"salt\":\"" + PASSWORD_SALT + "\"," +
            "\"N\":32768," +
            "\"r\":8," +
            "\"p\":1," +
            "\"derivedKeyLength\":64," +
            "\"verifierLength\":32," +
            "\"verifier\":\"" + PASSWORD_VERIFIER + "\"" +
        "}," +
        "\"securityFactor\":{" +
            "\"algorithm\":\"SCRYPT\"," +
            "\"salt\":\"" + SECURITY_SALT + "\"," +
            "\"N\":32768," +
            "\"r\":8," +
            "\"p\":1," +
            "\"derivedKeyLength\":64" +
        "}," +
        "\"encryption\":{" +
            "\"algorithm\":\"AES-256-GCM\"," +
            "\"keyDerivation\":\"FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1\"," +
            "\"iv\":\"" + IV + "\"," +
            "\"authTag\":\"" + AUTH_TAG + "\"" +
        "}," +
        "\"ciphertext\":\"" + CIPHERTEXT + "\"" +
        "}";

    @Test
    public void parsesAndSerializesCanonicalWindowsCreationOrderExactly() {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            FinoraPortableBranchAuthEnvelopeCodec.parse(
                CANONICAL_FIXTURE
            );

        assertEquals(
            "admin",
            envelope.canonicalUsername
        );

        assertEquals(
            "BRANCH-1",
            envelope.branchScope.branchId
        );

        assertEquals(
            64,
            envelope.passwordFactor.derivedKeyLength
        );

        assertEquals(
            32,
            envelope.passwordFactor.verifierLength
        );

        assertEquals(
            CANONICAL_FIXTURE,
            FinoraPortableBranchAuthEnvelopeCodec.serialize(
                envelope
            )
        );
    }

    @Test
    public void rejectsUnexpectedOuterField() {

        String invalid =
            CANONICAL_FIXTURE.substring(
                0,
                CANONICAL_FIXTURE.length() - 1
            ) +
            ",\"unexpectedField\":\"NO\"}";

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsSecurityVerifierExposure() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                "\"derivedKeyLength\":64}," +
                "\"encryption\"",
                "\"derivedKeyLength\":64," +
                "\"verifierLength\":32," +
                "\"verifier\":\"" +
                PASSWORD_VERIFIER +
                "\"}," +
                "\"encryption\""
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsMalformedSecuritySaltLength() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                SECURITY_SALT,
                "AQID"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsNonCanonicalUsername() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                "\"canonicalUsername\":\"admin\"",
                "\"canonicalUsername\":\"Admin\""
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsNonCanonicalBase64() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                PASSWORD_SALT,
                "AAECAwQFBgcICQoLDA0ODw"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsUnsupportedScryptParameters() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                "\"N\":32768",
                "\"N\":16384"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsWrongIvLength() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                IV,
                "AQID"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }

    @Test
    public void rejectsWrongAuthTagLength() {

        String invalid =
            CANONICAL_FIXTURE.replace(
                AUTH_TAG,
                "AQID"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthEnvelopeCodec.parse(
                    invalid
                )
        );
    }
}