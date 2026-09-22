package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Public verifier for a FINORA fresh-device Runtime Authority.
 *
 * The supplied Branch Certification material comes from already
 * authenticated/decrypted Portable Branch Auth. Only the public
 * verification half is consumed here.
 */
public final class
    FinoraPortableFreshDeviceRuntimeAuthorityVerifier {

    public static final String
        ERROR_MALFORMED_RUNTIME_AUTHORITY =
            "MALFORMED_RUNTIME_AUTHORITY";

    public static final String
        ERROR_INVALID_BRANCH_CERTIFICATION_AUTHORITY =
            "INVALID_BRANCH_CERTIFICATION_AUTHORITY";

    public static final String
        ERROR_INVALID_RUNTIME_AUTHORITY_SIGNATURE =
            "INVALID_RUNTIME_AUTHORITY_SIGNATURE";

    private FinoraPortableFreshDeviceRuntimeAuthorityVerifier() {
    }

    public static final class Result {

        public final boolean success;

        public final FinoraPortableFreshDeviceRuntimeAuthorityContract
            .Payload data;

        public final String errorCode;
        public final String error;

        private Result(
            boolean success,
            FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload data,
            String errorCode,
            String error
        ) {
            this.success =
                success;

            this.data =
                data;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result success(
            FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload data
        ) {
            return new Result(
                true,
                data,
                null,
                null
            );
        }

        static Result failure(
            String errorCode,
            String error
        ) {
            return new Result(
                false,
                null,
                errorCode,
                error
            );
        }
    }

    public static Result verify(
        String serializedPackage,
        FinoraBranchCertificationCryptoValidator.Material
            certificationAuthority
    ) {
        final FinoraPortableFreshDeviceRuntimeAuthorityContract.PackageValue
            packageValue;

        try {
            packageValue =
                FinoraPortableFreshDeviceRuntimeAuthorityContract
                    .parse(
                        serializedPackage
                    );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_MALFORMED_RUNTIME_AUTHORITY,
                "FINORA fresh-device Runtime Authority is malformed."
            );
        }

        if (
            !isValidPublicAuthority(
                certificationAuthority
            )
        ) {
            return Result.failure(
                ERROR_INVALID_BRANCH_CERTIFICATION_AUTHORITY,
                "FINORA Branch Certification public authority is invalid."
            );
        }

        if (
            !packageValue.signature.keyId.equals(
                certificationAuthority.keyId
            )
        ) {
            return Result.failure(
                ERROR_INVALID_RUNTIME_AUTHORITY_SIGNATURE,
                "FINORA Runtime Authority signature key does not match Branch Certification authority."
            );
        }

        try {
            byte[] publicKeyBytes =
                Base64
                    .getDecoder()
                    .decode(
                        certificationAuthority.publicKey
                    );

            if (
                !Base64
                    .getEncoder()
                    .encodeToString(
                        publicKeyBytes
                    )
                    .equals(
                        certificationAuthority.publicKey
                    )
            ) {
                return Result.failure(
                    ERROR_INVALID_BRANCH_CERTIFICATION_AUTHORITY,
                    "FINORA Branch Certification public key is not canonical Base64."
                );
            }

            String fingerprint =
                sha256Hex(
                    publicKeyBytes
                );

            if (
                !fingerprint.equals(
                    certificationAuthority.publicKeyFingerprint
                )
            ) {
                return Result.failure(
                    ERROR_INVALID_BRANCH_CERTIFICATION_AUTHORITY,
                    "FINORA Branch Certification public-key fingerprint does not match."
                );
            }

            PublicKey publicKey =
                KeyFactory
                    .getInstance(
                        "EC"
                    )
                    .generatePublic(
                        new X509EncodedKeySpec(
                            publicKeyBytes
                        )
                    );

            if (!(publicKey instanceof ECPublicKey)) {
                return Result.failure(
                    ERROR_INVALID_BRANCH_CERTIFICATION_AUTHORITY,
                    "FINORA Branch Certification key is not an EC public key."
                );
            }

            ECPublicKey ecPublicKey =
                (ECPublicKey) publicKey;

            if (
                ecPublicKey
                    .getParams()
                    .getCurve()
                    .getField()
                    .getFieldSize() != 256
            ) {
                return Result.failure(
                    ERROR_INVALID_BRANCH_CERTIFICATION_AUTHORITY,
                    "FINORA Branch Certification key is not P-256."
                );
            }

            byte[] p1363 =
                Base64
                    .getDecoder()
                    .decode(
                        packageValue.signature.value
                    );

            if (p1363.length != 64) {
                return Result.failure(
                    ERROR_INVALID_RUNTIME_AUTHORITY_SIGNATURE,
                    "FINORA Runtime Authority signature must contain exactly 64 IEEE-P1363 bytes."
                );
            }

            if (
                !Base64
                    .getEncoder()
                    .encodeToString(
                        p1363
                    )
                    .equals(
                        packageValue.signature.value
                    )
            ) {
                return Result.failure(
                    ERROR_INVALID_RUNTIME_AUTHORITY_SIGNATURE,
                    "FINORA Runtime Authority signature is not canonical Base64."
                );
            }

            String canonicalPayload =
                FinoraPortableFreshDeviceRuntimeAuthorityContract
                    .canonicalizePayload(
                        packageValue.payload
                    );

            Signature verifier =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            verifier.initVerify(
                publicKey
            );

            verifier.update(
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            if (
                !verifier.verify(
                    ieeeP1363ToDer(
                        p1363
                    )
                )
            ) {
                return Result.failure(
                    ERROR_INVALID_RUNTIME_AUTHORITY_SIGNATURE,
                    "FINORA Runtime Authority signature verification failed."
                );
            }

            return Result.success(
                packageValue.payload
            );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_INVALID_RUNTIME_AUTHORITY_SIGNATURE,
                "FINORA Runtime Authority signature could not be verified."
            );
        }
    }

    private static boolean isValidPublicAuthority(
        FinoraBranchCertificationCryptoValidator.Material value
    ) {
        if (value == null) {
            return false;
        }

        return
            FinoraBranchCertificationCryptoValidator
                .ALGORITHM
                .equals(
                    value.algorithm
                ) &&
            FinoraBranchCertificationCryptoValidator
                .PUBLIC_KEY_FORMAT
                .equals(
                    value.publicKeyFormat
                ) &&
            FinoraBranchCertificationCryptoValidator
                .FINGERPRINT_ALGORITHM
                .equals(
                    value.fingerprintAlgorithm
                ) &&
            value.schemaVersion ==
                FinoraBranchCertificationCryptoValidator
                    .SCHEMA_VERSION &&
            value.keyId != null &&
            value.keyId.startsWith(
                FinoraBranchCertificationCryptoValidator
                    .KEY_ID_PREFIX
            ) &&
            value.publicKey != null &&
            value.publicKey.length() > 0 &&
            value.publicKeyFingerprint != null &&
            value.publicKeyFingerprint.matches(
                "^[0-9a-f]{64}$"
            );
    }

    private static String sha256Hex(
        byte[] value
    ) throws Exception {
        byte[] digest =
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value
                );

        StringBuilder output =
            new StringBuilder(
                digest.length * 2
            );

        for (byte item : digest) {
            output.append(
                String.format(
                    "%02x",
                    item & 0xff
                )
            );
        }

        return output.toString();
    }

    private static byte[] ieeeP1363ToDer(
        byte[] signature
    ) {
        if (
            signature == null ||
            signature.length != 64
        ) {
            throw new IllegalArgumentException(
                "FINORA IEEE-P1363 signature must contain exactly 64 bytes."
            );
        }

        byte[] r =
            encodeDerInteger(
                signature,
                0,
                32
            );

        byte[] s =
            encodeDerInteger(
                signature,
                32,
                32
            );

        int sequenceLength =
            2 +
            r.length +
            2 +
            s.length;

        byte[] der =
            new byte[
                2 +
                sequenceLength
            ];

        int offset =
            0;

        der[offset++] =
            0x30;

        der[offset++] =
            (byte) sequenceLength;

        der[offset++] =
            0x02;

        der[offset++] =
            (byte) r.length;

        System.arraycopy(
            r,
            0,
            der,
            offset,
            r.length
        );

        offset +=
            r.length;

        der[offset++] =
            0x02;

        der[offset++] =
            (byte) s.length;

        System.arraycopy(
            s,
            0,
            der,
            offset,
            s.length
        );

        return der;
    }

    private static byte[] encodeDerInteger(
        byte[] source,
        int start,
        int length
    ) {
        int first =
            start;

        int end =
            start +
            length;

        while (
            first <
                end - 1 &&
            source[first] ==
                0
        ) {
            first++;
        }

        boolean needsLeadingZero =
            (
                source[first] &
                0x80
            ) != 0;

        int outputLength =
            end -
            first +
            (
                needsLeadingZero
                    ? 1
                    : 0
            );

        byte[] output =
            new byte[
                outputLength
            ];

        int destination =
            0;

        if (needsLeadingZero) {
            output[destination++] =
                0;
        }

        System.arraycopy(
            source,
            first,
            output,
            destination,
            end - first
        );

        return output;
    }
}