package com.finora.enterprise.control;

import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

/**
 * Post-decrypt Portable Branch Auth V1 authority.
 *
 * Precondition:
 * authenticatedPlaintext was produced by the canonical raw
 * AES-256-GCM decrypt authority for the same envelope and
 * Security Code.
 *
 * This layer owns:
 * - inner payload parsing;
 * - canonicalUsername binding;
 * - owner/business/branch binding;
 * - Password verifier full equality;
 * - Security verifier metadata equality;
 * - final derived Security verifier proof.
 *
 * This class does not perform raw decryption, persistence,
 * IPC, session creation, device trust, Keystore access,
 * signing, or renderer work.
 */
public final class FinoraPortableBranchAuthAuthenticatedPayloadAuthority {

    public static final String AUTHENTICATION_FAILED =
        "AUTHENTICATION_FAILED";

    private FinoraPortableBranchAuthAuthenticatedPayloadAuthority() {
    }

    public static final class AuthenticationException
        extends Exception {

        private final String code;

        public AuthenticationException(
            String code,
            String message
        ) {
            super(
                message
            );

            this.code =
                code;
        }

        public AuthenticationException(
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

    public static FinoraPortableBranchAuthPayloadCodec.Payload authenticate(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String securityCode,
        byte[] authenticatedPlaintext
    )
        throws AuthenticationException {

        if (
            envelope == null ||
            securityCode == null ||
            authenticatedPlaintext == null ||
            authenticatedPlaintext.length == 0
        ) {
            throw authenticationFailed();
        }

        final FinoraPortableBranchAuthPayloadCodec.Payload payload;

        try {
            payload =
                FinoraPortableBranchAuthPayloadCodec.parseCorePayload(
                    authenticatedPlaintext
                );
        }
        catch (IllegalArgumentException error) {
            throw authenticationFailed(
                error
            );
        }

        try {
            if (
                !payload.canonicalUsername.equals(
                    envelope.canonicalUsername
                ) ||
                !scopeMatches(
                    payload,
                    envelope.branchScope
                ) ||
                !passwordVerifierMatches(
                    payload.passwordVerifier,
                    envelope.passwordFactor
                ) ||
                !verifierMetadataMatches(
                    payload.securityVerifier,
                    envelope.securityFactor
                )
            ) {
                throw authenticationFailed();
            }

            assertDerivedSecurityVerifier(
                payload.securityVerifier,
                envelope.securityFactor,
                securityCode
            );

            return payload;
        }
        catch (AuthenticationException error) {
            throw error;
        }
        catch (IllegalArgumentException error) {
            throw authenticationFailed(
                error
            );
        }
    }

    private static boolean scopeMatches(
        FinoraPortableBranchAuthPayloadCodec.Payload payload,
        FinoraPortableBranchAuthEnvelopeCodec.Scope scope
    ) {

        return (
            scope != null &&
            payload.ownerId.equals(
                scope.ownerId
            ) &&
            payload.businessId.equals(
                scope.businessId
            ) &&
            payload.branchId.equals(
                scope.branchId
            )
        );
    }

    private static boolean verifierMetadataMatches(
        FinoraPortableBranchAuthPayloadCodec.Verifier verifier,
        FinoraPortableBranchAuthEnvelopeCodec.FactorKdf factor
    ) {

        return (
            verifier != null &&
            factor != null &&
            verifier.algorithm.equals(
                factor.algorithm
            ) &&
            verifier.salt.equals(
                factor.salt
            ) &&
            verifier.N ==
                factor.N &&
            verifier.r ==
                factor.r &&
            verifier.p ==
                factor.p &&
            verifier.derivedKeyLength ==
                factor.derivedKeyLength &&
            verifier.verifierLength ==
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
        );
    }

    private static boolean passwordVerifierMatches(
        FinoraPortableBranchAuthPayloadCodec.Verifier payloadVerifier,
        FinoraPortableBranchAuthEnvelopeCodec.Verifier envelopeVerifier
    ) {

        if (
            !verifierMetadataMatches(
                payloadVerifier,
                envelopeVerifier
            ) ||
            envelopeVerifier == null ||
            envelopeVerifier.verifierLength !=
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
        ) {
            return false;
        }

        byte[] payloadBytes =
            null;

        byte[] envelopeBytes =
            null;

        try {
            payloadBytes =
                Base64.getDecoder().decode(
                    payloadVerifier.verifier
                );

            envelopeBytes =
                Base64.getDecoder().decode(
                    envelopeVerifier.verifier
                );

            return (
                payloadBytes.length ==
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES &&
                envelopeBytes.length ==
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES &&
                MessageDigest.isEqual(
                    payloadBytes,
                    envelopeBytes
                )
            );
        }
        finally {
            zero(
                payloadBytes
            );

            zero(
                envelopeBytes
            );
        }
    }

    private static void assertDerivedSecurityVerifier(
        FinoraPortableBranchAuthPayloadCodec.Verifier payloadVerifier,
        FinoraPortableBranchAuthEnvelopeCodec.FactorKdf securityFactor,
        String securityCode
    )
        throws AuthenticationException {

        byte[] salt =
            null;

        byte[] derived =
            null;

        byte[] expectedVerifier =
            null;

        byte[] actualVerifier =
            null;

        try {
            salt =
                Base64.getDecoder().decode(
                    securityFactor.salt
                );

            derived =
                FinoraPortableBranchAuthScrypt.derive(
                    securityCode,
                    salt
                );

            expectedVerifier =
                Arrays.copyOfRange(
                    derived,
                    0,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES
                );

            actualVerifier =
                Base64.getDecoder().decode(
                    payloadVerifier.verifier
                );

            if (
                actualVerifier.length !=
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES ||
                !MessageDigest.isEqual(
                    expectedVerifier,
                    actualVerifier
                )
            ) {
                throw authenticationFailed();
            }
        }
        catch (IllegalArgumentException error) {
            throw authenticationFailed(
                error
            );
        }
        finally {
            zero(
                salt
            );

            zero(
                derived
            );

            zero(
                expectedVerifier
            );

            zero(
                actualVerifier
            );
        }
    }

    private static AuthenticationException authenticationFailed() {

        return new AuthenticationException(
            AUTHENTICATION_FAILED,
            "Portable Branch Auth authentication failed."
        );
    }

    private static AuthenticationException authenticationFailed(
        Throwable cause
    ) {

        return new AuthenticationException(
            AUTHENTICATION_FAILED,
            "Portable Branch Auth authentication failed.",
            cause
        );
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