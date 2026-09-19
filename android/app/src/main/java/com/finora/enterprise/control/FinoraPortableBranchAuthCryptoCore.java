package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * FINORA ENTERPRISE OS
 * PORTABLE BRANCH AUTH V1 CRYPTO CORE
 *
 * Byte-compatible with the authoritative Windows/Electron
 * Portable Branch Auth V1 crypto composition.
 *
 * Responsibilities:
 * - extract secret factor from 64-byte SCRYPT material;
 * - combine Password + Security Code secret factors;
 * - build exact authenticated additional data;
 * - AES-256-GCM encrypt/decrypt primitive.
 *
 * Explicitly excluded:
 * - credential UX;
 * - Password-first decision policy;
 * - Portable Auth payload parsing;
 * - filesystem persistence;
 * - USB routing;
 * - Capacitor IPC;
 * - Android Keystore device identity.
 */
public final class FinoraPortableBranchAuthCryptoCore {

    private static final String COMBINE_DOMAIN =
        "FINORA_PORTABLE_BRANCH_AUTH_ENCRYPTION_KEY_V1";

    private static final String AES_TRANSFORMATION =
        "AES/GCM/NoPadding";

    private FinoraPortableBranchAuthCryptoCore() {
    }

    public static final class EncryptedValue {

        public final byte[] ciphertext;
        public final byte[] authTag;

        private EncryptedValue(
            byte[] ciphertext,
            byte[] authTag
        ) {
            this.ciphertext =
                ciphertext;

            this.authTag =
                authTag;
        }
    }

    public static byte[] getSecretFactor(
        byte[] derived
    ) {
        if (
            derived == null ||
            derived.length !=
                FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth derived material length is invalid."
            );
        }

        int start =
            FinoraPortableBranchAuthContract.VERIFIER_BYTES;

        int end =
            start +
            FinoraPortableBranchAuthContract.SECRET_FACTOR_BYTES;

        if (
            end !=
            FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES
        ) {
            throw new IllegalStateException(
                "Portable Branch Auth secret factor contract is inconsistent."
            );
        }

        return Arrays.copyOfRange(
            derived,
            start,
            end
        );
    }

    public static byte[] buildEncryptionKey(
        byte[] passwordSecretFactor,
        byte[] securitySecretFactor
    ) {
        requireSecretFactor(
            passwordSecretFactor
        );

        requireSecretFactor(
            securitySecretFactor
        );

        try {
            MessageDigest digest =
                MessageDigest.getInstance(
                    "SHA-256"
                );

            digest.update(
                COMBINE_DOMAIN.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            digest.update(
                (byte) 0
            );

            digest.update(
                passwordSecretFactor
            );

            digest.update(
                (byte) 0
            );

            digest.update(
                securitySecretFactor
            );

            return digest.digest();
        }
        catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(
                "SHA-256 is unavailable.",
                error
            );
        }
    }

    public static byte[] buildAad(
        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope
    ) {
        FinoraPortableBranchAuthEnvelopeCodec.validate(
            envelope
        );

        StringBuilder output =
            new StringBuilder(
                1024
            );

        output.append('{');

        appendName(
            output,
            "format"
        );

        appendJsonString(
            output,
            envelope.format
        );

        output.append(',');

        appendName(
            output,
            "schemaVersion"
        );

        output.append(
            envelope.schemaVersion
        );

        output.append(',');

        appendName(
            output,
            "canonicalUsername"
        );

        appendJsonString(
            output,
            envelope.canonicalUsername
        );

        output.append(',');

        appendName(
            output,
            "branchScope"
        );

        appendScope(
            output,
            envelope.branchScope
        );

        output.append(',');

        appendName(
            output,
            "passwordFactor"
        );

        appendVerifier(
            output,
            envelope.passwordFactor
        );

        output.append(',');

        appendName(
            output,
            "securityFactor"
        );

        appendFactor(
            output,
            envelope.securityFactor
        );

        output.append(',');

        appendName(
            output,
            "encryption"
        );

        appendAuthenticatedEncryptionMetadata(
            output,
            envelope.encryption
        );

        output.append('}');

        return output
            .toString()
            .getBytes(
                StandardCharsets.UTF_8
            );
    }

    public static EncryptedValue encrypt(
        byte[] encryptionKey,
        byte[] iv,
        byte[] aad,
        byte[] plaintext
    )
        throws GeneralSecurityException {

        requireEncryptionKey(
            encryptionKey
        );

        requireIv(
            iv
        );

        if (aad == null) {
            throw new IllegalArgumentException(
                "Portable Branch Auth AAD is required."
            );
        }

        if (plaintext == null) {
            throw new IllegalArgumentException(
                "Portable Branch Auth plaintext is required."
            );
        }

        Cipher cipher =
            Cipher.getInstance(
                AES_TRANSFORMATION
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            new SecretKeySpec(
                encryptionKey,
                "AES"
            ),
            new GCMParameterSpec(
                FinoraPortableBranchAuthContract.TAG_BYTES * 8,
                iv
            )
        );

        cipher.updateAAD(
            aad
        );

        byte[] combined =
            cipher.doFinal(
                plaintext
            );

        if (
            combined.length <
            FinoraPortableBranchAuthContract.TAG_BYTES
        ) {
            throw new GeneralSecurityException(
                "Portable Branch Auth AES-GCM output is invalid."
            );
        }

        int ciphertextLength =
            combined.length -
            FinoraPortableBranchAuthContract.TAG_BYTES;

        byte[] ciphertext =
            Arrays.copyOfRange(
                combined,
                0,
                ciphertextLength
            );

        byte[] authTag =
            Arrays.copyOfRange(
                combined,
                ciphertextLength,
                combined.length
            );

        Arrays.fill(
            combined,
            (byte) 0
        );

        return new EncryptedValue(
            ciphertext,
            authTag
        );
    }

    public static byte[] decrypt(
        byte[] encryptionKey,
        byte[] iv,
        byte[] aad,
        byte[] ciphertext,
        byte[] authTag
    )
        throws GeneralSecurityException {

        requireEncryptionKey(
            encryptionKey
        );

        requireIv(
            iv
        );

        if (aad == null) {
            throw new IllegalArgumentException(
                "Portable Branch Auth AAD is required."
            );
        }

        if (ciphertext == null) {
            throw new IllegalArgumentException(
                "Portable Branch Auth ciphertext is required."
            );
        }

        if (
            authTag == null ||
            authTag.length !=
                FinoraPortableBranchAuthContract.TAG_BYTES
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth authentication tag length is invalid."
            );
        }

        byte[] combined =
            new byte[
                ciphertext.length +
                authTag.length
            ];

        System.arraycopy(
            ciphertext,
            0,
            combined,
            0,
            ciphertext.length
        );

        System.arraycopy(
            authTag,
            0,
            combined,
            ciphertext.length,
            authTag.length
        );

        try {
            Cipher cipher =
                Cipher.getInstance(
                    AES_TRANSFORMATION
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                new SecretKeySpec(
                    encryptionKey,
                    "AES"
                ),
                new GCMParameterSpec(
                    FinoraPortableBranchAuthContract.TAG_BYTES * 8,
                    iv
                )
            );

            cipher.updateAAD(
                aad
            );

            return cipher.doFinal(
                combined
            );
        }
        finally {
            Arrays.fill(
                combined,
                (byte) 0
            );
        }
    }

    private static void requireSecretFactor(
        byte[] value
    ) {
        if (
            value == null ||
            value.length !=
                FinoraPortableBranchAuthContract.SECRET_FACTOR_BYTES
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth secret factor length is invalid."
            );
        }
    }

    private static void requireEncryptionKey(
        byte[] value
    ) {
        if (
            value == null ||
            value.length != 32
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth encryption key length is invalid."
            );
        }
    }

    private static void requireIv(
        byte[] value
    ) {
        if (
            value == null ||
            value.length !=
                FinoraPortableBranchAuthContract.IV_BYTES
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth IV length is invalid."
            );
        }
    }

    private static void appendScope(
        StringBuilder output,
        FinoraPortableBranchAuthEnvelopeCodec.Scope scope
    ) {
        output.append('{');

        appendName(
            output,
            "ownerId"
        );

        appendJsonString(
            output,
            scope.ownerId
        );

        output.append(',');

        appendName(
            output,
            "businessId"
        );

        appendJsonString(
            output,
            scope.businessId
        );

        output.append(',');

        appendName(
            output,
            "branchId"
        );

        appendJsonString(
            output,
            scope.branchId
        );

        output.append('}');
    }

    private static void appendFactor(
        StringBuilder output,
        FinoraPortableBranchAuthEnvelopeCodec.FactorKdf factor
    ) {
        output.append('{');

        appendName(
            output,
            "algorithm"
        );

        appendJsonString(
            output,
            factor.algorithm
        );

        output.append(',');

        appendName(
            output,
            "salt"
        );

        appendJsonString(
            output,
            factor.salt
        );

        output.append(',');

        appendName(
            output,
            "N"
        );

        output.append(
            factor.N
        );

        output.append(',');

        appendName(
            output,
            "r"
        );

        output.append(
            factor.r
        );

        output.append(',');

        appendName(
            output,
            "p"
        );

        output.append(
            factor.p
        );

        output.append(',');

        appendName(
            output,
            "derivedKeyLength"
        );

        output.append(
            factor.derivedKeyLength
        );

        output.append('}');
    }

    private static void appendVerifier(
        StringBuilder output,
        FinoraPortableBranchAuthEnvelopeCodec.Verifier verifier
    ) {
        output.append('{');

        appendName(
            output,
            "algorithm"
        );

        appendJsonString(
            output,
            verifier.algorithm
        );

        output.append(',');

        appendName(
            output,
            "salt"
        );

        appendJsonString(
            output,
            verifier.salt
        );

        output.append(',');

        appendName(
            output,
            "N"
        );

        output.append(
            verifier.N
        );

        output.append(',');

        appendName(
            output,
            "r"
        );

        output.append(
            verifier.r
        );

        output.append(',');

        appendName(
            output,
            "p"
        );

        output.append(
            verifier.p
        );

        output.append(',');

        appendName(
            output,
            "derivedKeyLength"
        );

        output.append(
            verifier.derivedKeyLength
        );

        output.append(',');

        appendName(
            output,
            "verifierLength"
        );

        output.append(
            verifier.verifierLength
        );

        output.append(',');

        appendName(
            output,
            "verifier"
        );

        appendJsonString(
            output,
            verifier.verifier
        );

        output.append('}');
    }

    private static void appendAuthenticatedEncryptionMetadata(
        StringBuilder output,
        FinoraPortableBranchAuthEnvelopeCodec.Encryption encryption
    ) {
        output.append('{');

        appendName(
            output,
            "algorithm"
        );

        appendJsonString(
            output,
            encryption.algorithm
        );

        output.append(',');

        appendName(
            output,
            "keyDerivation"
        );

        appendJsonString(
            output,
            encryption.keyDerivation
        );

        output.append(',');

        appendName(
            output,
            "iv"
        );

        appendJsonString(
            output,
            encryption.iv
        );

        output.append('}');
    }

    private static void appendName(
        StringBuilder output,
        String value
    ) {
        appendJsonString(
            output,
            value
        );

        output.append(':');
    }

    private static void appendJsonString(
        StringBuilder output,
        String value
    ) {
        output.append('"');

        for (
            int index = 0;
            index < value.length();
            index++
        ) {
            char character =
                value.charAt(
                    index
                );

            switch (character) {

                case '"':
                    output.append("\\\"");
                    break;

                case '\\':
                    output.append("\\\\");
                    break;

                case '\b':
                    output.append("\\b");
                    break;

                case '\f':
                    output.append("\\f");
                    break;

                case '\n':
                    output.append("\\n");
                    break;

                case '\r':
                    output.append("\\r");
                    break;

                case '\t':
                    output.append("\\t");
                    break;

                default:

                    if (character < 0x20) {

                        appendUnicodeEscape(
                            output,
                            character
                        );

                        break;
                    }

                    if (
                        Character.isHighSurrogate(
                            character
                        )
                    ) {
                        if (
                            index + 1 <
                                value.length() &&
                            Character.isLowSurrogate(
                                value.charAt(
                                    index + 1
                                )
                            )
                        ) {
                            output.append(
                                character
                            );

                            output.append(
                                value.charAt(
                                    ++index
                                )
                            );
                        }
                        else {
                            appendUnicodeEscape(
                                output,
                                character
                            );
                        }

                        break;
                    }

                    if (
                        Character.isLowSurrogate(
                            character
                        )
                    ) {
                        appendUnicodeEscape(
                            output,
                            character
                        );

                        break;
                    }

                    output.append(
                        character
                    );
            }
        }

        output.append('"');
    }

    private static void appendUnicodeEscape(
        StringBuilder output,
        char value
    ) {
        final char[] hex =
            "0123456789abcdef".toCharArray();

        output.append("\\u");

        output.append(
            hex[
                (value >> 12) & 0x0f
            ]
        );

        output.append(
            hex[
                (value >> 8) & 0x0f
            ]
        );

        output.append(
            hex[
                (value >> 4) & 0x0f
            ]
        );

        output.append(
            hex[
                value & 0x0f
            ]
        );
    }
}