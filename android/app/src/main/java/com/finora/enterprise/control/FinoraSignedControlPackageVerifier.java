package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// SIGNED CONTROL PACKAGE VERIFIER
//
// RESPONSIBILITY:
//
// - Verify FINORA ECDSA P-256 / SHA-256 packages
// - Verify IEEE-P1363 64-byte signatures
// - Convert IEEE-P1363 r||s to DER for Android/JCA
// - Verify payload SHA-256
// - Verify Control Center public-key trust
// - Verify exact Owner / Business / Branch / Installation target
// - Verify package envelope time window
//
// SECURITY:
//
// - PUBLIC verification only.
// - No private key.
// - No signing.
// - No filesystem.
// - No Android Context.
// - No renderer/WebView.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class FinoraSignedControlPackageVerifier {

    private FinoraSignedControlPackageVerifier() {
    }

    // ========================================================
    // TRUST KEY
    // ========================================================

    public static final class TrustedKey {

        public final String issuerId;

        public final String signingKeyId;

        public final String algorithm;

        public final String format;

        public final String publicKey;

        public final String status;

        public final String validFrom;

        public final String validUntil;

        public TrustedKey(
            String issuerId,
            String signingKeyId,
            String algorithm,
            String format,
            String publicKey,
            String status,
            String validFrom,
            String validUntil
        ) {
            this.issuerId =
                issuerId;

            this.signingKeyId =
                signingKeyId;

            this.algorithm =
                algorithm;

            this.format =
                format;

            this.publicKey =
                publicKey;

            this.status =
                status;

            this.validFrom =
                validFrom;

            this.validUntil =
                validUntil;
        }
    }

    // ========================================================
    // TARGET
    // ========================================================

    public static final class Target {

        public final String ownerId;

        public final String businessId;

        public final String branchId;

        public final String installationId;

        public Target(
            String ownerId,
            String businessId,
            String branchId,
            String installationId
        ) {
            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.installationId =
                installationId;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean valid;

        public final String reason;

        public final String error;

        public final Map<String, Object> controlPackage;

        private Result(
            boolean valid,
            String reason,
            String error,
            Map<String, Object> controlPackage
        ) {
            this.valid =
                valid;

            this.reason =
                reason;

            this.error =
                error;

            this.controlPackage =
                controlPackage;
        }

        private static Result success(
            Map<String, Object> controlPackage
        ) {
            return new Result(
                true,
                null,
                null,
                controlPackage
            );
        }

        private static Result failure(
            String reason,
            String error
        ) {
            return new Result(
                false,
                reason,
                error,
                null
            );
        }
    }

    // ========================================================
    // VERIFY
    // ========================================================

    public static Result verify(
        Map<String, Object> controlPackage,
        List<TrustedKey> trustedKeys,
        Target expectedTarget,
        Instant now
    ) {

        if (
            controlPackage == null ||
            trustedKeys == null ||
            expectedTarget == null ||
            now == null
        ) {
            return Result.failure(
                "MALFORMED_PACKAGE",
                "FINORA Control Package verification input is incomplete."
            );
        }

        // ----------------------------------------------------
        // ROOT
        // ----------------------------------------------------

        if (
            !isExactInteger(
                controlPackage.get(
                    "schemaVersion"
                ),
                1L
            ) ||
            !isNonEmptyString(
                controlPackage.get(
                    "packageId"
                )
            ) ||
            !isPositiveSafeInteger(
                controlPackage.get(
                    "sequence"
                )
            ) ||
            !isPositiveSafeInteger(
                controlPackage.get(
                    "payloadVersion"
                )
            )
        ) {
            return Result.failure(
                "MALFORMED_PACKAGE",
                "FINORA Control Package structure is invalid."
            );
        }

        Map<String, Object> issuer =
            asMap(
                controlPackage.get(
                    "issuer"
                )
            );

        Map<String, Object> target =
            asMap(
                controlPackage.get(
                    "target"
                )
            );

        Map<String, Object> payload =
            asMap(
                controlPackage.get(
                    "payload"
                )
            );

        Map<String, Object> payloadDigest =
            asMap(
                controlPackage.get(
                    "payloadDigest"
                )
            );

        Map<String, Object> signature =
            asMap(
                controlPackage.get(
                    "signature"
                )
            );

        if (
            issuer == null ||
            target == null ||
            payload == null ||
            payloadDigest == null ||
            signature == null
        ) {
            return Result.failure(
                "MALFORMED_PACKAGE",
                "FINORA Control Package objects are incomplete."
            );
        }

        // ----------------------------------------------------
        // ISSUER / CRYPTO CONTRACT
        // ----------------------------------------------------

        if (
            !"FINORA_CONTROL_CENTER".equals(
                issuer.get(
                    "type"
                )
            )
        ) {
            return Result.failure(
                "UNTRUSTED_ISSUER",
                "FINORA Control Package issuer is not trusted."
            );
        }

        String issuerId =
            requiredString(
                issuer.get(
                    "issuerId"
                )
            );

        String issuerSigningKeyId =
            requiredString(
                issuer.get(
                    "signingKeyId"
                )
            );

        String signatureSigningKeyId =
            requiredString(
                signature.get(
                    "signingKeyId"
                )
            );

        if (
            issuerId == null ||
            issuerSigningKeyId == null ||
            signatureSigningKeyId == null
        ) {
            return Result.failure(
                "MALFORMED_PACKAGE",
                "FINORA issuer/signature identity is invalid."
            );
        }

        if (
            !issuerSigningKeyId.equals(
                signatureSigningKeyId
            )
        ) {
            return Result.failure(
                "MALFORMED_PACKAGE",
                "FINORA issuer and signature key IDs do not match."
            );
        }

        if (
            !"ECDSA_P256_SHA256".equals(
                signature.get(
                    "algorithm"
                )
            ) ||
            !"IEEE_P1363".equals(
                signature.get(
                    "encoding"
                )
            ) ||
            !"FINORA_CANONICAL_JSON_V1".equals(
                signature.get(
                    "canonicalization"
                )
            ) ||
            !"SHA-256".equals(
                payloadDigest.get(
                    "algorithm"
                )
            )
        ) {
            return Result.failure(
                "UNSUPPORTED_ALGORITHM",
                "FINORA Control Package cryptographic contract is unsupported."
            );
        }

        // ----------------------------------------------------
        // TARGET
        // ----------------------------------------------------

        if (
            !matchesTarget(
                target,
                expectedTarget
            )
        ) {
            return Result.failure(
                "TARGET_MISMATCH",
                "FINORA Control Package does not belong to this installation."
            );
        }

        // ----------------------------------------------------
        // TIME
        // ----------------------------------------------------

        Instant issuedAt =
            parseInstant(
                controlPackage.get(
                    "issuedAt"
                )
            );

        if (issuedAt == null) {
            return Result.failure(
                "MALFORMED_PACKAGE",
                "FINORA Control Package issuedAt timestamp is invalid."
            );
        }

        Object validityValue =
            controlPackage.get(
                "validity"
            );

        if (validityValue != null) {

            Map<String, Object> validity =
                asMap(
                    validityValue
                );

            if (validity == null) {
                return Result.failure(
                    "MALFORMED_PACKAGE",
                    "FINORA Control Package validity is invalid."
                );
            }

            if (
                validity.containsKey(
                    "notBefore"
                ) &&
                validity.get(
                    "notBefore"
                ) != null
            ) {

                Instant notBefore =
                    parseInstant(
                        validity.get(
                            "notBefore"
                        )
                    );

                if (notBefore == null) {
                    return Result.failure(
                        "MALFORMED_PACKAGE",
                        "FINORA Control Package notBefore timestamp is invalid."
                    );
                }

                if (
                    now.isBefore(
                        notBefore
                    )
                ) {
                    return Result.failure(
                        "NOT_YET_VALID",
                        "FINORA Control Package is not valid yet."
                    );
                }
            }

            if (
                validity.containsKey(
                    "expiresAt"
                ) &&
                validity.get(
                    "expiresAt"
                ) != null
            ) {

                Instant expiresAt =
                    parseInstant(
                        validity.get(
                            "expiresAt"
                        )
                    );

                if (expiresAt == null) {
                    return Result.failure(
                        "MALFORMED_PACKAGE",
                        "FINORA Control Package expiresAt timestamp is invalid."
                    );
                }

                /*
                 * Matches the Electron verifier:
                 * package remains valid at exactly expiresAt and
                 * becomes expired after that instant.
                 */
                if (
                    now.isAfter(
                        expiresAt
                    )
                ) {
                    return Result.failure(
                        "PACKAGE_EXPIRED",
                        "FINORA Control Package has expired."
                    );
                }
            }
        }

        // ----------------------------------------------------
        // PAYLOAD DIGEST
        // ----------------------------------------------------

        String expectedDigest =
            requiredString(
                payloadDigest.get(
                    "value"
                )
            );

        if (
            expectedDigest == null ||
            !expectedDigest.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            return Result.failure(
                "INVALID_PAYLOAD_DIGEST",
                "FINORA payload digest format is invalid."
            );
        }

        final String calculatedDigest;

        try {

            calculatedDigest =
                sha256Hex(
                    FinoraCanonicalJson
                        .canonicalize(
                            payload
                        )
                );

        } catch (RuntimeException error) {

            return Result.failure(
                "MALFORMED_PACKAGE",
                error.getMessage()
            );
        }

        if (
            !expectedDigest.equals(
                calculatedDigest
            )
        ) {
            return Result.failure(
                "INVALID_PAYLOAD_DIGEST",
                "FINORA Control Package payload integrity check failed."
            );
        }

        // ----------------------------------------------------
        // TRUST KEY
        // ----------------------------------------------------

        TrustedKey trustedKey =
            findTrustedKey(
                trustedKeys,
                issuerId,
                signatureSigningKeyId
            );

        if (trustedKey == null) {
            return Result.failure(
                "UNKNOWN_SIGNING_KEY",
                "FINORA Control Package signing key is unknown."
            );
        }

        if (
            !"ECDSA_P256_SHA256".equals(
                trustedKey.algorithm
            ) ||
            !"SPKI_DER_BASE64".equals(
                trustedKey.format
            )
        ) {
            return Result.failure(
                "UNSUPPORTED_ALGORITHM",
                "FINORA trusted public-key contract is unsupported."
            );
        }

        if (
            !"ACTIVE".equals(
                trustedKey.status
            ) &&
            !"RETIRED".equals(
                trustedKey.status
            ) &&
            !"REVOKED".equals(
                trustedKey.status
            )
        ) {
            return Result.failure(
                "SIGNING_KEY_NOT_VALID",
                "FINORA trusted signing-key status is invalid."
            );
        }

        if (
            "REVOKED".equals(
                trustedKey.status
            )
        ) {
            return Result.failure(
                "SIGNING_KEY_REVOKED",
                "FINORA Control Package signing key has been revoked."
            );
        }

        Instant keyValidFrom =
            parseInstant(
                trustedKey.validFrom
            );

        Instant keyValidUntil =
            trustedKey.validUntil == null
                ? null
                : parseInstant(
                    trustedKey.validUntil
                );

        if (
            keyValidFrom == null ||
            issuedAt.isBefore(
                keyValidFrom
            ) ||
            (
                trustedKey.validUntil != null &&
                (
                    keyValidUntil == null ||
                    issuedAt.isAfter(
                        keyValidUntil
                    )
                )
            )
        ) {
            return Result.failure(
                "SIGNING_KEY_NOT_VALID",
                "FINORA signing key was not valid when this package was issued."
            );
        }

        // ----------------------------------------------------
        // SIGNATURE
        // ----------------------------------------------------

        String signatureBase64 =
            requiredString(
                signature.get(
                    "value"
                )
            );

        if (signatureBase64 == null) {
            return Result.failure(
                "INVALID_SIGNATURE",
                "FINORA Control Package signature is missing."
            );
        }

        try {

            byte[] p1363 =
                Base64
                    .getDecoder()
                    .decode(
                        signatureBase64
                    );

            if (
                p1363.length !=
                    64
            ) {
                return Result.failure(
                    "INVALID_SIGNATURE",
                    "FINORA IEEE-P1363 signature must contain exactly 64 bytes."
                );
            }

            byte[] publicKeyBytes =
                Base64
                    .getDecoder()
                    .decode(
                        trustedKey.publicKey
                    );

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

            if (
                !(publicKey instanceof ECPublicKey)
            ) {
                return Result.failure(
                    "INVALID_SIGNATURE",
                    "FINORA trusted key is not an EC public key."
                );
            }

            ECPublicKey ecPublicKey =
                (ECPublicKey) publicKey;

            if (
                ecPublicKey
                    .getParams()
                    .getCurve()
                    .getField()
                    .getFieldSize() !=
                        256
            ) {
                return Result.failure(
                    "INVALID_SIGNATURE",
                    "FINORA trusted EC public key is not P-256."
                );
            }

            Map<String, Object> unsignedPackage =
                new LinkedHashMap<>(
                    controlPackage
                );

            unsignedPackage.remove(
                "signature"
            );

            String canonicalPackage =
                FinoraCanonicalJson
                    .canonicalize(
                        unsignedPackage
                    );

            Signature verifier =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            verifier.initVerify(
                publicKey
            );

            verifier.update(
                canonicalPackage.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            byte[] derSignature =
                ieeeP1363ToDer(
                    p1363
                );

            if (
                !verifier.verify(
                    derSignature
                )
            ) {
                return Result.failure(
                    "INVALID_SIGNATURE",
                    "FINORA Control Package signature verification failed."
                );
            }

        } catch (Exception error) {

            return Result.failure(
                "INVALID_SIGNATURE",
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to verify FINORA Control Package signature."
            );
        }

        return Result.success(
            controlPackage
        );
    }

    // ========================================================
    // SHA-256
    // ========================================================

    public static String sha256Hex(
        String value
    ) {

        try {

            MessageDigest digest =
                MessageDigest.getInstance(
                    "SHA-256"
                );

            byte[] hash =
                digest.digest(
                    value.getBytes(
                        StandardCharsets.UTF_8
                    )
                );

            StringBuilder output =
                new StringBuilder(
                    hash.length * 2
                );

            for (byte item : hash) {

                output.append(
                    Character.forDigit(
                        (item >>> 4) &
                        0x0f,
                        16
                    )
                );

                output.append(
                    Character.forDigit(
                        item &
                        0x0f,
                        16
                    )
                );
            }

            return output.toString();

        } catch (Exception error) {

            throw new IllegalStateException(
                "SHA-256 is unavailable for FINORA verification.",
                error
            );
        }
    }

    // ========================================================
    // IEEE-P1363 -> ASN.1 DER
    // ========================================================

    private static byte[] ieeeP1363ToDer(
        byte[] signature
    ) {

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

        /*
         * P-256 ECDSA DER sequence is <= 72 bytes, therefore
         * one-byte DER length encoding is sufficient.
         */
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
        int offset,
        int length
    ) {

        int first =
            offset;

        int end =
            offset +
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
            ) !=
            0;

        int valueLength =
            end -
            first;

        byte[] output =
            new byte[
                valueLength +
                (
                    needsLeadingZero
                        ? 1
                        : 0
                )
            ];

        int destinationOffset =
            needsLeadingZero
                ? 1
                : 0;

        System.arraycopy(
            source,
            first,
            output,
            destinationOffset,
            valueLength
        );

        return output;
    }

    // ========================================================
    // HELPERS
    // ========================================================

    private static TrustedKey findTrustedKey(
        List<TrustedKey> keys,
        String issuerId,
        String signingKeyId
    ) {

        for (TrustedKey key : keys) {

            if (
                key != null &&
                issuerId.equals(
                    key.issuerId
                ) &&
                signingKeyId.equals(
                    key.signingKeyId
                )
            ) {
                return key;
            }
        }

        return null;
    }

    private static boolean matchesTarget(
        Map<String, Object> target,
        Target expected
    ) {

        return (
            expected.ownerId.equals(
                target.get(
                    "ownerId"
                )
            ) &&
            expected.businessId.equals(
                target.get(
                    "businessId"
                )
            ) &&
            expected.branchId.equals(
                target.get(
                    "branchId"
                )
            ) &&
            expected.installationId.equals(
                target.get(
                    "installationId"
                )
            )
        );
    }

    private static boolean isNonEmptyString(
        Object value
    ) {

        return (
            value instanceof String &&
            !((String) value)
                .trim()
                .isEmpty()
        );
    }

    private static String requiredString(
        Object value
    ) {

        if (!isNonEmptyString(value)) {
            return null;
        }

        return (String) value;
    }

    private static Instant parseInstant(
        Object value
    ) {

        if (!(value instanceof String)) {
            return null;
        }

        try {

            return Instant.parse(
                (String) value
            );

        } catch (DateTimeParseException error) {

            return null;
        }
    }

    private static boolean isPositiveSafeInteger(
        Object value
    ) {

        if (!(value instanceof Number)) {
            return false;
        }

        double number =
            ((Number) value)
                .doubleValue();

        return (
            Double.isFinite(
                number
            ) &&
            number >
                0 &&
            Math.rint(
                number
            ) ==
                number &&
            number <=
                9007199254740991.0d
        );
    }

    private static boolean isExactInteger(
        Object value,
        long expected
    ) {

        if (!(value instanceof Number)) {
            return false;
        }

        double number =
            ((Number) value)
                .doubleValue();

        return (
            Double.isFinite(
                number
            ) &&
            number ==
                (double) expected
        );
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map)) {
            return null;
        }

        Map<?, ?> raw =
            (Map<?, ?>) value;

        for (Object key : raw.keySet()) {

            if (!(key instanceof String)) {
                return null;
            }
        }

        return (Map<String, Object>) raw;
    }

    // ========================================================
    // END
    // ========================================================
}