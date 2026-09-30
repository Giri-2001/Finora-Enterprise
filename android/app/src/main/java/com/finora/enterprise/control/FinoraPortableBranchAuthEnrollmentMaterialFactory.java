package com.finora.enterprise.control;

import android.util.Base64;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;


/**
 * Native Android Portable Branch Auth enrollment material factory.
 *
 * SECURITY:
 * - Password and Security Code never leave native enrollment authority.
 * - Independent SCRYPT salts are used for both factors.
 * - Full 64-byte SCRYPT material is never persisted in Control Credential.
 * - Only first 32 verifier bytes are projected into Control Credential.
 * - Second 32-byte factors derive the AES-256-GCM Portable Auth key.
 * - Branch Certification private material exists only inside encrypted
 *   Portable Auth payload.
 */
public final class FinoraPortableBranchAuthEnrollmentMaterialFactory {

    private static final String FORMAT =
        "FINORA_PORTABLE_BRANCH_AUTH";

    private static final int SCHEMA_VERSION =
        1;

    private static final String KDF_ALGORITHM =
        "SCRYPT";

    private static final int SCRYPT_N =
        32768;

    private static final int SCRYPT_R =
        8;

    private static final int SCRYPT_P =
        1;

    private static final int SALT_BYTES =
        16;

    private static final int DERIVED_KEY_BYTES =
        64;

    private static final int VERIFIER_BYTES =
        32;

    private static final String ENCRYPTION_ALGORITHM =
        "AES-256-GCM";

    private static final String KEY_DERIVATION =
        "FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1";

    private static final int IV_BYTES =
        12;

    private static final int AUTH_TAG_BYTES =
        16;

    private static final int MIN_SECRET_LENGTH =
        8;

    private static final int MAX_SECRET_LENGTH =
        128;


    public static final class Material {

        public final FinoraPortableBranchAuthEnvelopeCodec.Envelope
            envelope;

        public final FinoraPortableBranchAuthEnvelopeCodec.Verifier
            passwordVerifier;

        public final FinoraPortableBranchAuthEnvelopeCodec.Verifier
            securityVerifier;

        public final String serializedEnvelope;


        Material(
            FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
            FinoraPortableBranchAuthEnvelopeCodec.Verifier passwordVerifier,
            FinoraPortableBranchAuthEnvelopeCodec.Verifier securityVerifier,
            String serializedEnvelope
        ) {
            this.envelope =
                envelope;

            this.passwordVerifier =
                passwordVerifier;

            this.securityVerifier =
                securityVerifier;

            this.serializedEnvelope =
                serializedEnvelope;
        }
    }


    public static Material create(
        String authStateId,
        String sourceAuthorizationId,
        JSONObject sourceAuthorizationVerificationEvidence,
        String ownerId,
        String businessId,
        String branchId,
        String userId,
        String username,
        String fullName,
        String role,
        String dataContext,
        String demoId,
        String storageMode,
        FinoraBranchCertificationCryptoValidator.Material
            branchCertificationMaterial,
        long authGeneration,
        String createdAt,
        String updatedAt,
        String password,
        String securityCode
    ) throws Exception {

        requireSecret(
            password,
            "Password"
        );

        requireSecret(
            securityCode,
            "Security Code"
        );

        requireText(
            authStateId,
            "Auth State ID"
        );

        requireText(
            sourceAuthorizationId,
            "Source Authorization ID"
        );

        if (
            sourceAuthorizationVerificationEvidence == null
        ) {
            throw new IllegalArgumentException(
                "FINORA source authorization verification evidence is required."
            );
        }

        /*
         * USB portability must remain cryptographically usable on a
         * fresh device. Signed V1 evidence therefore needs its exact
         * portabilityAuthorityProof. Never synthesize one here.
         */
        if (
            "USB".equals(
                storageMode
            ) &&
            !sourceAuthorizationVerificationEvidence.has(
                "portabilityAuthorityProof"
            )
        ) {
            throw new IllegalStateException(
                "FINORA USB credential authorization is missing portability authority proof."
            );
        }

        if (
            branchCertificationMaterial == null
        ) {
            throw new IllegalStateException(
                "FINORA Branch Certification material is required."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            branchCertificationMaterial
        );

        final String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    username
                );

        byte[] passwordSalt =
            randomBytes(
                SALT_BYTES
            );

        byte[] securitySalt =
            randomBytes(
                SALT_BYTES
            );

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

        byte[] aad =
            null;

        byte[] plaintext =
            null;

        FinoraPortableBranchAuthCryptoCore.EncryptedValue
            encrypted =
                null;

        try {

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

            if (
                passwordDerived.length !=
                    DERIVED_KEY_BYTES ||
                securityDerived.length !=
                    DERIVED_KEY_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA Portable Auth SCRYPT output length is invalid."
                );
            }

            passwordSecretFactor =
                FinoraPortableBranchAuthCryptoCore
                    .getSecretFactor(
                        passwordDerived
                    );

            securitySecretFactor =
                FinoraPortableBranchAuthCryptoCore
                    .getSecretFactor(
                        securityDerived
                    );

            encryptionKey =
                FinoraPortableBranchAuthCryptoCore
                    .buildEncryptionKey(
                        passwordSecretFactor,
                        securitySecretFactor
                    );


            String passwordSaltBase64 =
                Base64.encodeToString(
                    passwordSalt,
                    Base64.NO_WRAP
                );

            String securitySaltBase64 =
                Base64.encodeToString(
                    securitySalt,
                    Base64.NO_WRAP
                );

            String passwordVerifierBase64 =
                Base64.encodeToString(
                    Arrays.copyOfRange(
                        passwordDerived,
                        0,
                        VERIFIER_BYTES
                    ),
                    Base64.NO_WRAP
                );

            String securityVerifierBase64 =
                Base64.encodeToString(
                    Arrays.copyOfRange(
                        securityDerived,
                        0,
                        VERIFIER_BYTES
                    ),
                    Base64.NO_WRAP
                );


            FinoraPortableBranchAuthEnvelopeCodec.Verifier
                passwordVerifier =
                    new FinoraPortableBranchAuthEnvelopeCodec
                        .Verifier(
                            KDF_ALGORITHM,
                            passwordSaltBase64,
                            SCRYPT_N,
                            SCRYPT_R,
                            SCRYPT_P,
                            DERIVED_KEY_BYTES,
                            VERIFIER_BYTES,
                            passwordVerifierBase64
                        );

            FinoraPortableBranchAuthEnvelopeCodec.Verifier
                securityVerifier =
                    new FinoraPortableBranchAuthEnvelopeCodec
                        .Verifier(
                            KDF_ALGORITHM,
                            securitySaltBase64,
                            SCRYPT_N,
                            SCRYPT_R,
                            SCRYPT_P,
                            DERIVED_KEY_BYTES,
                            VERIFIER_BYTES,
                            securityVerifierBase64
                        );

            FinoraPortableBranchAuthEnvelopeCodec.FactorKdf
                securityFactor =
                    new FinoraPortableBranchAuthEnvelopeCodec
                        .FactorKdf(
                            KDF_ALGORITHM,
                            securitySaltBase64,
                            SCRYPT_N,
                            SCRYPT_R,
                            SCRYPT_P,
                            DERIVED_KEY_BYTES
                        );


            JSONObject payload =
                new JSONObject();

            payload.put(
                "schemaVersion",
                1
            );

            payload.put(
                "authStateId",
                authStateId
            );

            payload.put(
                "sourceAuthorizationId",
                sourceAuthorizationId
            );

            payload.put(
                "sourceAuthorizationVerificationEvidence",
                new JSONObject(
                    sourceAuthorizationVerificationEvidence
                        .toString()
                )
            );

            payload.put(
                "ownerId",
                ownerId
            );

            payload.put(
                "businessId",
                businessId
            );

            payload.put(
                "branchId",
                branchId
            );

            payload.put(
                "userId",
                userId
            );

            payload.put(
                "username",
                username
            );

            payload.put(
                "canonicalUsername",
                canonicalUsername
            );

            payload.put(
                "fullName",
                fullName
            );

            payload.put(
                "role",
                role
            );

            payload.put(
                "dataContext",
                dataContext
            );

            if (demoId != null) {
                payload.put(
                    "demoId",
                    demoId
                );
            }

            payload.put(
                "storageMode",
                storageMode
            );

            payload.put(
                "passwordVerifier",
                portableVerifierJson(
                    passwordVerifier
                )
            );

            payload.put(
                "securityVerifier",
                portableVerifierJson(
                    securityVerifier
                )
            );

            payload.put(
                "authGeneration",
                authGeneration
            );

            payload.put(
                "createdAt",
                createdAt
            );

            payload.put(
                "updatedAt",
                updatedAt
            );

            payload.put(
                "branchCertificationKeyMaterial",
                certificationMaterialJson(
                    branchCertificationMaterial
                )
            );


            plaintext =
                payload.toString()
                    .getBytes(
                        StandardCharsets.UTF_8
                    );

            /*
             * Reuse the production parser as an enrollment
             * pre-encryption validator. This validates:
             * - exact payload keys,
             * - exact source signer evidence,
             * - portabilityAuthorityProof,
             * - factor metadata,
             * - identity/scope formats,
             * - Branch Certification material.
             */
            FinoraPortableBranchAuthPayloadCodec
                .parseCorePayload(
                    plaintext
                );


            iv =
                randomBytes(
                    IV_BYTES
                );

            String ivBase64 =
                Base64.encodeToString(
                    iv,
                    Base64.NO_WRAP
                );

            String zeroTagBase64 =
                Base64.encodeToString(
                    new byte[
                        AUTH_TAG_BYTES
                    ],
                    Base64.NO_WRAP
                );


            FinoraPortableBranchAuthEnvelopeCodec.Scope
                scope =
                    new FinoraPortableBranchAuthEnvelopeCodec
                        .Scope(
                            ownerId,
                            businessId,
                            branchId
                        );

            /*
             * buildAad() validates the Envelope before emitting the
             * authenticated metadata. Ciphertext is not part of AAD,
             * therefore one canonical dummy byte is used only for this
             * pre-encryption validation object.
             */
            FinoraPortableBranchAuthEnvelopeCodec.Envelope
                aadEnvelope =
                    new FinoraPortableBranchAuthEnvelopeCodec
                        .Envelope(
                            FORMAT,
                            SCHEMA_VERSION,
                            canonicalUsername,
                            scope,
                            passwordVerifier,
                            securityFactor,
                            new FinoraPortableBranchAuthEnvelopeCodec
                                .Encryption(
                                    ENCRYPTION_ALGORITHM,
                                    KEY_DERIVATION,
                                    ivBase64,
                                    zeroTagBase64
                                ),
                            Base64.encodeToString(
                                new byte[] {
                                    0
                                },
                                Base64.NO_WRAP
                            )
                        );

            aad =
                FinoraPortableBranchAuthCryptoCore
                    .buildAad(
                        aadEnvelope
                    );

            encrypted =
                FinoraPortableBranchAuthCryptoCore
                    .encrypt(
                        encryptionKey,
                        iv,
                        aad,
                        plaintext
                    );

            if (
                encrypted == null ||
                encrypted.ciphertext == null ||
                encrypted.ciphertext.length == 0 ||
                encrypted.authTag == null ||
                encrypted.authTag.length !=
                    AUTH_TAG_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA Portable Auth AES-GCM encryption produced invalid output."
                );
            }


            FinoraPortableBranchAuthEnvelopeCodec.Envelope
                finalEnvelope =
                    new FinoraPortableBranchAuthEnvelopeCodec
                        .Envelope(
                            FORMAT,
                            SCHEMA_VERSION,
                            canonicalUsername,
                            scope,
                            passwordVerifier,
                            securityFactor,
                            new FinoraPortableBranchAuthEnvelopeCodec
                                .Encryption(
                                    ENCRYPTION_ALGORITHM,
                                    KEY_DERIVATION,
                                    ivBase64,
                                    Base64.encodeToString(
                                        encrypted.authTag,
                                        Base64.NO_WRAP
                                    )
                                ),
                            Base64.encodeToString(
                                encrypted.ciphertext,
                                Base64.NO_WRAP
                            )
                        );

            String serializedEnvelope =
                FinoraPortableBranchAuthEnvelopeCodec
                    .serialize(
                        finalEnvelope
                    );

            /*
             * Canonical round-trip before returning enrollment
             * material.
             */
            String roundTrip =
                FinoraPortableBranchAuthEnvelopeCodec
                    .serialize(
                        FinoraPortableBranchAuthEnvelopeCodec
                            .parse(
                                serializedEnvelope
                            )
                    );

            if (
                !serializedEnvelope.equals(
                    roundTrip
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Portable Auth envelope canonical round-trip failed."
                );
            }

            return new Material(
                finalEnvelope,
                passwordVerifier,
                securityVerifier,
                serializedEnvelope
            );

        }
        finally {

            wipe(
                passwordSalt
            );

            wipe(
                securitySalt
            );

            wipe(
                passwordDerived
            );

            wipe(
                securityDerived
            );

            wipe(
                passwordSecretFactor
            );

            wipe(
                securitySecretFactor
            );

            wipe(
                encryptionKey
            );

            wipe(
                iv
            );

            wipe(
                aad
            );

            wipe(
                plaintext
            );

            if (encrypted != null) {
                wipe(
                    encrypted.ciphertext
                );

                wipe(
                    encrypted.authTag
                );
            }
        }
    }


    public static FinoraBranchCredentialContract.Verifier
        toControlCredentialVerifier(
            FinoraPortableBranchAuthEnvelopeCodec.Verifier
                verifier
        ) {

        if (verifier == null) {
            throw new IllegalArgumentException(
                "FINORA Portable Auth verifier is required."
            );
        }

        return new FinoraBranchCredentialContract.Verifier(
            verifier.algorithm,
            FinoraBranchCredentialContract.SALT_ENCODING,
            verifier.salt,
            FinoraBranchCredentialContract
                .DERIVED_KEY_ENCODING,
            verifier.verifier,
            VERIFIER_BYTES,
            verifier.N,
            verifier.r,
            verifier.p
        );
    }


    private static JSONObject portableVerifierJson(
        FinoraPortableBranchAuthEnvelopeCodec.Verifier
            verifier
    ) throws Exception {

        JSONObject value =
            new JSONObject();

        value.put(
            "algorithm",
            verifier.algorithm
        );

        value.put(
            "salt",
            verifier.salt
        );

        value.put(
            "N",
            verifier.N
        );

        value.put(
            "r",
            verifier.r
        );

        value.put(
            "p",
            verifier.p
        );

        value.put(
            "derivedKeyLength",
            verifier.derivedKeyLength
        );

        value.put(
            "verifierLength",
            verifier.verifierLength
        );

        value.put(
            "verifier",
            verifier.verifier
        );

        return value;
    }


    private static JSONObject certificationMaterialJson(
        FinoraBranchCertificationCryptoValidator.Material
            material
    ) throws Exception {

        JSONObject value =
            new JSONObject();

        value.put(
            "keyId",
            material.keyId
        );

        value.put(
            "algorithm",
            material.algorithm
        );

        value.put(
            "publicKeyFormat",
            material.publicKeyFormat
        );

        value.put(
            "publicKey",
            material.publicKey
        );

        value.put(
            "fingerprintAlgorithm",
            material.fingerprintAlgorithm
        );

        value.put(
            "publicKeyFingerprint",
            material.publicKeyFingerprint
        );

        value.put(
            "createdAt",
            material.createdAt
        );

        value.put(
            "schemaVersion",
            material.schemaVersion
        );

        value.put(
            "privateKeyFormat",
            material.privateKeyFormat
        );

        value.put(
            "privateKey",
            material.privateKey
        );

        value.put(
            "vaultSchemaVersion",
            material.vaultSchemaVersion
        );

        return value;
    }


    private static byte[] randomBytes(
        int length
    ) {

        byte[] value =
            new byte[
                length
            ];

        new SecureRandom()
            .nextBytes(
                value
            );

        return value;
    }


    private static void requireSecret(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty() ||
            value.codePointCount(
                0,
                value.length()
            ) <
                MIN_SECRET_LENGTH ||
            value.codePointCount(
                0,
                value.length()
            ) >
                MAX_SECRET_LENGTH
        ) {
            throw new IllegalArgumentException(
                label +
                " must contain between 8 and 128 characters."
            );
        }
    }


    private static String requireText(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty() ||
            !value.equals(
                value.trim()
            )
        ) {
            throw new IllegalArgumentException(
                label +
                " is required."
            );
        }

        return value;
    }


    private static void wipe(
        byte[] value
    ) {
        if (value != null) {
            Arrays.fill(
                value,
                (byte) 0
            );
        }
    }


    private FinoraPortableBranchAuthEnrollmentMaterialFactory() {
        throw new AssertionError(
            "No instances."
        );
    }
}