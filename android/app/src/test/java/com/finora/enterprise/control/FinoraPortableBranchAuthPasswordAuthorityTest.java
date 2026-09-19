package com.finora.enterprise.control;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Base64;

import org.junit.Test;

public final class FinoraPortableBranchAuthPasswordAuthorityTest {

    private static final String PASSWORD =
        "FinoraPortableAuth-Test-Password-01";

    private static final String WRONG_PASSWORD =
        "FinoraPortableAuth-Wrong-Password-99";

    private static final String PASSWORD_SALT =
        "AAECAwQFBgcICQoLDA0ODw==";

    private static final String PASSWORD_VERIFIER =
        "z3Z8jRZtYy5AxjfRFeAMUQ2nf6vH49PP+MfGanrjb/U=";

    @Test
    public void acceptsExactCanonicalPasswordVerifierVector() {

        assertTrue(
            FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                fixtureEnvelope(
                    PASSWORD_VERIFIER
                ),
                PASSWORD
            )
        );
    }

    @Test
    public void rejectsWrongPasswordAsBooleanFalse() {

        assertFalse(
            FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                fixtureEnvelope(
                    PASSWORD_VERIFIER
                ),
                WRONG_PASSWORD
            )
        );
    }

    @Test
    public void rejectsPasswordShorterThanEightCharacters() {

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                    fixtureEnvelope(
                        PASSWORD_VERIFIER
                    ),
                    "1234567"
                )
        );
    }

    @Test
    public void rejectsPasswordLongerThanOneHundredTwentyEightCharacters() {

        char[] chars =
            new char[129];

        Arrays.fill(
            chars,
            'x'
        );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                    fixtureEnvelope(
                        PASSWORD_VERIFIER
                    ),
                    new String(
                        chars
                    )
                )
        );
    }

    @Test
    public void rejectsWhitespaceOnlyPassword() {

        assertThrows(
            IllegalArgumentException.class,
            () ->
                FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                    fixtureEnvelope(
                        PASSWORD_VERIFIER
                    ),
                    "        "
                )
        );
    }

    @Test
    public void doesNotTrimValidPasswordBeforeScrypt() {

        String spacedPassword =
            "  Finora-P1D-Password  ";

        byte[] salt =
            Base64.getDecoder().decode(
                PASSWORD_SALT
            );

        byte[] derived =
            FinoraPortableBranchAuthScrypt.derive(
                spacedPassword,
                salt
            );

        try {
            String verifier =
                Base64.getEncoder().encodeToString(
                    Arrays.copyOfRange(
                        derived,
                        0,
                        FinoraPortableBranchAuthContract.VERIFIER_BYTES
                    )
                );

            assertTrue(
                FinoraPortableBranchAuthPasswordAuthority.verifyPassword(
                    fixtureEnvelope(
                        verifier
                    ),
                    spacedPassword
                )
            );
        }
        finally {
            Arrays.fill(
                derived,
                (byte) 0
            );

            Arrays.fill(
                salt,
                (byte) 0
            );
        }
    }

    private static FinoraPortableBranchAuthEnvelopeCodec.Envelope fixtureEnvelope(
        String passwordVerifier
    ) {
        return new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
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
                passwordVerifier
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
}