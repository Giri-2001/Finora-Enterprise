package com.finora.enterprise.control;

import java.util.Arrays;

/**
 * Canonical Portable Branch Auth V1 authenticated decrypt composition.
 *
 * Order:
 * 1. canonical raw Password-first AES-GCM decrypt;
 * 2. authenticated inner payload parsing and outer-inner binding;
 * 3. plaintext zeroization in all post-decrypt paths.
 *
 * Existing raw-decrypt and payload-binding authorities remain independent.
 */
public final class FinoraPortableBranchAuthAuthenticatedDecryptAuthority {

    private FinoraPortableBranchAuthAuthenticatedDecryptAuthority() {
    }

    interface PlaintextDecryptor {

        byte[] decrypt(
            FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
            String password,
            String securityCode
        )
            throws FinoraPortableBranchAuthDecryptAuthority.CryptoException;
    }

    public static FinoraPortableBranchAuthPayloadCodec.Payload decrypt(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String password,
        String securityCode
    )
        throws FinoraPortableBranchAuthDecryptAuthority.CryptoException {

        return decryptWith(
            envelope,
            password,
            securityCode,
            FinoraPortableBranchAuthDecryptAuthority::decrypt
        );
    }

    public static FinoraPortableBranchAuthPayloadCodec.Payload decrypt(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String password,
        String securityCode,
        FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope
    )
        throws FinoraPortableBranchAuthDecryptAuthority.CryptoException {

        return decryptWith(
            envelope,
            password,
            securityCode,
            (
                candidateEnvelope,
                candidatePassword,
                candidateSecurityCode
            ) ->
                FinoraPortableBranchAuthDecryptAuthority.decrypt(
                    candidateEnvelope,
                    candidatePassword,
                    candidateSecurityCode,
                    expectedScope
                )
        );
    }

    static FinoraPortableBranchAuthPayloadCodec.Payload decryptWith(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
        String password,
        String securityCode,
        PlaintextDecryptor decryptor
    )
        throws FinoraPortableBranchAuthDecryptAuthority.CryptoException {

        byte[] plaintext =
            null;

        try {
            plaintext =
                decryptor.decrypt(
                    envelope,
                    password,
                    securityCode
                );

            try {
                return FinoraPortableBranchAuthAuthenticatedPayloadAuthority.authenticate(
                    envelope,
                    securityCode,
                    plaintext
                );
            }
            catch (
                FinoraPortableBranchAuthAuthenticatedPayloadAuthority.AuthenticationException error
            ) {
                throw new FinoraPortableBranchAuthDecryptAuthority.CryptoException(
                    FinoraPortableBranchAuthDecryptAuthority.AUTHENTICATION_FAILED,
                    "Portable Branch Auth authentication failed.",
                    error
                );
            }
        }
        finally {
            zero(
                plaintext
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