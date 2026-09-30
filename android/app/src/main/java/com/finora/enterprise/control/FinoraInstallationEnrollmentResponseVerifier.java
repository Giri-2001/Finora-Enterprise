package com.finora.enterprise.control;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.regex.Pattern;

/**
 * Strict Android verifier for a FINORA Installation Enrollment Response.
 *
 * SECURITY:
 * - No TOFU.
 * - Control Center fingerprint is supplied independently.
 * - Exact pending requestId is required.
 * - Exact current native installation binding is required.
 * - No persistence occurs in this class.
 */
public final class FinoraInstallationEnrollmentResponseVerifier {

    private static final String FILE_FORMAT =
        "FINORA_INSTALLATION_ENROLLMENT_RESPONSE_V1";

    private static final String PURPOSE =
        "INSTALLATION_ENROLLMENT_RESPONSE";

    private static final int PAYLOAD_VERSION =
        1;

    private static final Pattern SHA256 =
        Pattern.compile("^[0-9a-f]{64}$");

    private static final Pattern CANONICAL_TIMESTAMP =
        Pattern.compile(
            "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"
        );

    private static final long JS_MAX_SAFE_INTEGER =
        9007199254740991L;

    private FinoraInstallationEnrollmentResponseVerifier() {
        throw new AssertionError("No instances.");
    }

    public static final class Verified {

        public final String responseId;
        public final String requestId;
        public final long sequence;
        public final String issuedAt;
        public final String expiresAt;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String installationId;
        public final String bindingKeyId;
        public final String fingerprintAlgorithm;
        public final String publicKeyFingerprint;

        public final String businessCode;
        public final String branchCode;

        public final String issuerId;
        public final String signingKeyId;
        public final String controlCenterPublicKey;
        public final String trustedKeyValidFrom;

        public final String expectedControlCenterPublicKeyFingerprint;

        private Verified(
            String responseId,
            String requestId,
            long sequence,
            String issuedAt,
            String expiresAt,
            String ownerId,
            String businessId,
            String branchId,
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint,
            String businessCode,
            String branchCode,
            String issuerId,
            String signingKeyId,
            String controlCenterPublicKey,
            String trustedKeyValidFrom,
            String expectedControlCenterPublicKeyFingerprint
        ) {
            this.responseId = responseId;
            this.requestId = requestId;
            this.sequence = sequence;
            this.issuedAt = issuedAt;
            this.expiresAt = expiresAt;
            this.ownerId = ownerId;
            this.businessId = businessId;
            this.branchId = branchId;
            this.installationId = installationId;
            this.bindingKeyId = bindingKeyId;
            this.fingerprintAlgorithm = fingerprintAlgorithm;
            this.publicKeyFingerprint = publicKeyFingerprint;
            this.businessCode = businessCode;
            this.branchCode = branchCode;
            this.issuerId = issuerId;
            this.signingKeyId = signingKeyId;
            this.controlCenterPublicKey = controlCenterPublicKey;
            this.trustedKeyValidFrom = trustedKeyValidFrom;
            this.expectedControlCenterPublicKeyFingerprint =
                expectedControlCenterPublicKeyFingerprint;
        }
    }

    public static Verified verify(
        JSONObject file,
        String expectedControlCenterFingerprint,
        String expectedRequestId,
        FinoraInstallationBindingCrypto.PublicBinding nativeBinding,
        Instant verificationTime
    ) throws Exception {

        if (file == null) {
            throw invalid("file must be an object");
        }

        assertExactKeys(
            file,
            "format",
            "response",
            "schemaVersion"
        );

        if (
            !FILE_FORMAT.equals(requireText(file, "format", 256)) ||
            requireInt(file, "schemaVersion") != 1
        ) {
            throw invalid("file structure is invalid or unsupported");
        }

        JSONObject response =
            requireObject(file, "response");

        assertExactKeys(
            response,
            "responseId",
            "purpose",
            "target",
            "issuedAt",
            "validity",
            "sequence",
            "payloadVersion",
            "payload",
            "issuer",
            "payloadDigest",
            "signature",
            "schemaVersion"
        );

        String responseId =
            requireText(response, "responseId", 256);

        if (
            !responseId.startsWith(
                "FINORA-ENROLLMENT-RESPONSE-"
            ) ||
            !PURPOSE.equals(
                requireText(response, "purpose", 256)
            ) ||
            requireInt(response, "payloadVersion") !=
                PAYLOAD_VERSION ||
            requireInt(response, "schemaVersion") !=
                1
        ) {
            throw invalid("envelope metadata is invalid");
        }

        long sequence =
            requirePositiveSafeInteger(
                response,
                "sequence"
            );

        // ----------------------------------------------------
        // TARGET / CURRENT NATIVE BINDING
        // ----------------------------------------------------

        JSONObject target =
            requireObject(response, "target");

        assertExactKeys(
            target,
            "ownerId",
            "businessId",
            "branchId",
            "installationId",
            "bindingKeyId",
            "fingerprintAlgorithm",
            "publicKeyFingerprint"
        );

        String ownerId =
            requireText(target, "ownerId", 256);

        String businessId =
            requireText(target, "businessId", 256);

        String branchId =
            requireText(target, "branchId", 256);

        String installationId =
            requireText(target, "installationId", 256);

        String bindingKeyId =
            requireText(target, "bindingKeyId", 256);

        String fingerprintAlgorithm =
            requireText(
                target,
                "fingerprintAlgorithm",
                64
            );

        String publicKeyFingerprint =
            requireCanonicalSha256(
                target,
                "publicKeyFingerprint"
            );

        if (
            nativeBinding == null ||
            !installationId.equals(
                nativeBinding.installationId
            ) ||
            !bindingKeyId.equals(
                nativeBinding.bindingKeyId
            ) ||
            !fingerprintAlgorithm.equals(
                nativeBinding.fingerprintAlgorithm
            ) ||
            !publicKeyFingerprint.equals(
                nativeBinding.publicKeyFingerprint
            )
        ) {
            throw invalid(
                "does not target this exact native installation binding"
            );
        }

        // ----------------------------------------------------
        // VALIDITY
        // ----------------------------------------------------

        String issuedAt =
            requireCanonicalTimestamp(
                response,
                "issuedAt"
            );

        JSONObject validity =
            requireObject(response, "validity");

        assertExactKeys(
            validity,
            "notBefore",
            "expiresAt"
        );

        String notBefore =
            requireCanonicalTimestamp(
                validity,
                "notBefore"
            );

        String expiresAt =
            requireCanonicalTimestamp(
                validity,
                "expiresAt"
            );

        Instant issued =
            Instant.parse(issuedAt);

        Instant from =
            Instant.parse(notBefore);

        Instant until =
            Instant.parse(expiresAt);

        if (
            !issuedAt.equals(notBefore) ||
            !until.isAfter(issued)
        ) {
            throw invalid(
                "validity timestamps are invalid"
            );
        }

        if (verificationTime != null) {

            if (verificationTime.isBefore(from)) {
                throw invalid("is not yet valid");
            }

            if (verificationTime.isAfter(until)) {
                throw invalid("has expired");
            }
        }

        // ----------------------------------------------------
        // PAYLOAD
        // ----------------------------------------------------

        JSONObject payload =
            requireObject(response, "payload");

        assertExactKeys(
            payload,
            "requestId",
            "businessCode",
            "branchCode",
            "initialTrustedKey",
            "issuedAt",
            "schemaVersion"
        );

        String requestId =
            requireText(payload, "requestId", 256);

        if (
            expectedRequestId == null ||
            !requestId.equals(
                expectedRequestId.trim()
            )
        ) {
            throw invalid(
                "request provenance is invalid"
            );
        }

        String businessCode =
            requireText(
                payload,
                "businessCode",
                64
            );

        String branchCode =
            requireText(
                payload,
                "branchCode",
                64
            );

        if (
            !issuedAt.equals(
                requireCanonicalTimestamp(
                    payload,
                    "issuedAt"
                )
            ) ||
            requireInt(payload, "schemaVersion") != 1
        ) {
            throw invalid(
                "payload identity or request provenance is invalid"
            );
        }

        // ----------------------------------------------------
        // INITIAL TRUST KEY
        // ----------------------------------------------------

        JSONObject trustedKey =
            requireObject(
                payload,
                "initialTrustedKey"
            );

        assertExactKeys(
            trustedKey,
            "issuerId",
            "signingKeyId",
            "algorithm",
            "format",
            "publicKey",
            "status",
            "validFrom"
        );

        String issuerId =
            requireText(
                trustedKey,
                "issuerId",
                256
            );

        String signingKeyId =
            requireText(
                trustedKey,
                "signingKeyId",
                256
            );

        if (
            !"ECDSA_P256_SHA256".equals(
                requireText(
                    trustedKey,
                    "algorithm",
                    64
                )
            ) ||
            !"SPKI_DER_BASE64".equals(
                requireText(
                    trustedKey,
                    "format",
                    64
                )
            ) ||
            !"ACTIVE".equals(
                requireText(
                    trustedKey,
                    "status",
                    64
                )
            )
        ) {
            throw invalid(
                "initial trusted key is invalid"
            );
        }

        String trustedKeyValidFrom =
            requireCanonicalTimestamp(
                trustedKey,
                "validFrom"
            );

        byte[] trustedKeyDer =
            decodeStrictBase64(
                requireText(
                    trustedKey,
                    "publicKey",
                    16384
                )
            );

        PublicKey controlCenterKey =
            decodeP256PublicKey(
                trustedKeyDer
            );

        if (
            !Arrays.equals(
                trustedKeyDer,
                controlCenterKey.getEncoded()
            )
        ) {
            throw invalid(
                "initial trusted-key SPKI is non-canonical"
            );
        }

        String controlCenterPublicKey =
            Base64
                .getEncoder()
                .encodeToString(
                    trustedKeyDer
                );

        String actualControlCenterFingerprint =
            sha256Hex(
                trustedKeyDer
            );

        if (
            expectedControlCenterFingerprint == null ||
            !actualControlCenterFingerprint.equalsIgnoreCase(
                expectedControlCenterFingerprint.trim()
            )
        ) {
            throw invalid(
                "Control Center public key does not match the independently supplied fingerprint"
            );
        }

        /*
         * Do not invent signing-key-ID rules here.
         *
         * FinoraRecipientTrustBootstrapService performs the
         * canonical signingKeyId verification before persistence.
         * This verifier still binds the issuer and signature
         * metadata to the exact supplied signingKeyId.
         */

        // ----------------------------------------------------
        // ISSUER
        // ----------------------------------------------------

        JSONObject issuer =
            requireObject(response, "issuer");

        assertExactKeys(
            issuer,
            "type",
            "issuerId",
            "signingKeyId"
        );

        if (
            !"FINORA_CONTROL_CENTER".equals(
                requireText(
                    issuer,
                    "type",
                    128
                )
            ) ||
            !issuerId.equals(
                requireText(
                    issuer,
                    "issuerId",
                    256
                )
            ) ||
            !signingKeyId.equals(
                requireText(
                    issuer,
                    "signingKeyId",
                    256
                )
            )
        ) {
            throw invalid(
                "issuer does not match the independently verified Control Center key"
            );
        }

        // ----------------------------------------------------
        // PAYLOAD DIGEST
        // ----------------------------------------------------

        JSONObject payloadDigest =
            requireObject(
                response,
                "payloadDigest"
            );

        assertExactKeys(
            payloadDigest,
            "algorithm",
            "value"
        );

        if (
            !"SHA-256".equals(
                requireText(
                    payloadDigest,
                    "algorithm",
                    64
                )
            )
        ) {
            throw invalid(
                "payload digest is invalid"
            );
        }

        String expectedPayloadDigest =
            requireCanonicalSha256(
                payloadDigest,
                "value"
            );

        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                FinoraJsonBridge.toMap(
                    payload
                )
            );

        String actualPayloadDigest =
            sha256Hex(
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        if (
            !expectedPayloadDigest.equals(
                actualPayloadDigest
            )
        ) {
            throw invalid(
                "payload digest verification failed"
            );
        }

        // ----------------------------------------------------
        // SIGNATURE
        // ----------------------------------------------------

        JSONObject signature =
            requireObject(
                response,
                "signature"
            );

        assertExactKeys(
            signature,
            "algorithm",
            "encoding",
            "canonicalization",
            "signingKeyId",
            "value"
        );

        if (
            !"ECDSA_P256_SHA256".equals(
                requireText(
                    signature,
                    "algorithm",
                    64
                )
            ) ||
            !"IEEE_P1363".equals(
                requireText(
                    signature,
                    "encoding",
                    64
                )
            ) ||
            !"FINORA_CANONICAL_JSON_V1".equals(
                requireText(
                    signature,
                    "canonicalization",
                    128
                )
            ) ||
            !signingKeyId.equals(
                requireText(
                    signature,
                    "signingKeyId",
                    256
                )
            )
        ) {
            throw invalid(
                "signature metadata is invalid"
            );
        }

        byte[] p1363 =
            decodeStrictBase64(
                requireText(
                    signature,
                    "value",
                    1024
                )
            );

        if (p1363.length != 64) {
            throw invalid(
                "signature must contain exactly 64 IEEE-P1363 bytes"
            );
        }

        Map<String, Object> unsigned =
            new LinkedHashMap<>();

        unsigned.put(
            "responseId",
            responseId
        );

        unsigned.put(
            "purpose",
            response.get("purpose")
        );

        unsigned.put(
            "target",
            FinoraJsonBridge.toMap(target)
        );

        unsigned.put(
            "issuedAt",
            issuedAt
        );

        unsigned.put(
            "validity",
            FinoraJsonBridge.toMap(validity)
        );

        unsigned.put(
            "sequence",
            Long.valueOf(sequence)
        );

        unsigned.put(
            "payloadVersion",
            Integer.valueOf(PAYLOAD_VERSION)
        );

        unsigned.put(
            "payload",
            FinoraJsonBridge.toMap(payload)
        );

        unsigned.put(
            "issuer",
            FinoraJsonBridge.toMap(issuer)
        );

        unsigned.put(
            "payloadDigest",
            FinoraJsonBridge.toMap(
                payloadDigest
            )
        );

        unsigned.put(
            "schemaVersion",
            Integer.valueOf(1)
        );

        String canonicalResponse =
            FinoraCanonicalJson.canonicalize(
                unsigned
            );

        Signature verifier =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        verifier.initVerify(
            controlCenterKey
        );

        verifier.update(
            canonicalResponse.getBytes(
                StandardCharsets.UTF_8
            )
        );

        byte[] der =
            FinoraInstallationBindingSignatureCodec
                .p1363ToDer(
                    p1363
                );

        if (!verifier.verify(der)) {
            throw invalid(
                "signature verification failed"
            );
        }

        return new Verified(
            responseId,
            requestId,
            sequence,
            issuedAt,
            expiresAt,
            ownerId,
            businessId,
            branchId,
            installationId,
            bindingKeyId,
            fingerprintAlgorithm,
            publicKeyFingerprint,
            businessCode,
            branchCode,
            issuerId,
            signingKeyId,
            controlCenterPublicKey,
            trustedKeyValidFrom,
            actualControlCenterFingerprint
        );
    }

    private static JSONObject requireObject(
        JSONObject parent,
        String key
    ) {

        JSONObject value =
            parent.optJSONObject(key);

        if (value == null) {
            throw invalid(
                "property is missing or invalid: " +
                key
            );
        }

        return value;
    }

    private static String requireText(
        JSONObject value,
        String key,
        int maximumLength
    ) {

        Object raw =
            value.opt(key);

        if (!(raw instanceof String)) {
            throw invalid(
                "property must be text: " +
                key
            );
        }

        String text =
            ((String) raw).trim();

        if (
            text.isEmpty() ||
            text.length() >
                maximumLength
        ) {
            throw invalid(
                "text property is invalid: " +
                key
            );
        }

        return text;
    }

    private static int requireInt(
        JSONObject value,
        String key
    ) {

        Object raw =
            value.opt(key);

        if (!(raw instanceof Number)) {
            throw invalid(
                "integer property is invalid: " +
                key
            );
        }

        double number =
            ((Number) raw).doubleValue();

        long integer =
            ((Number) raw).longValue();

        if (
            !Double.isFinite(number) ||
            number != (double) integer ||
            integer < Integer.MIN_VALUE ||
            integer > Integer.MAX_VALUE
        ) {
            throw invalid(
                "integer property is invalid: " +
                key
            );
        }

        return (int) integer;
    }

    private static long requirePositiveSafeInteger(
        JSONObject value,
        String key
    ) {

        Object raw =
            value.opt(key);

        if (!(raw instanceof Number)) {
            throw invalid(
                "sequence is invalid"
            );
        }

        double number =
            ((Number) raw).doubleValue();

        long integer =
            ((Number) raw).longValue();

        if (
            !Double.isFinite(number) ||
            number != (double) integer ||
            integer <= 0L ||
            integer > JS_MAX_SAFE_INTEGER
        ) {
            throw invalid(
                "sequence is invalid"
            );
        }

        return integer;
    }

    private static String requireCanonicalSha256(
        JSONObject value,
        String key
    ) {

        String fingerprint =
            requireText(
                value,
                key,
                64
            );

        if (
            !SHA256.matcher(
                fingerprint
            ).matches()
        ) {
            throw invalid(
                "SHA-256 value is non-canonical: " +
                key
            );
        }

        return fingerprint;
    }

    private static String requireCanonicalTimestamp(
        JSONObject value,
        String key
    ) {

        String timestamp =
            requireText(
                value,
                key,
                64
            );

        if (
            !CANONICAL_TIMESTAMP
                .matcher(
                    timestamp
                )
                .matches()
        ) {
            throw invalid(
                "timestamp is non-canonical: " +
                key
            );
        }

        Instant parsed =
            Instant.parse(
                timestamp
            );

        String normalized =
            java.time.format.DateTimeFormatter
                .ofPattern(
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                )
                .withZone(
                    java.time.ZoneOffset.UTC
                )
                .format(
                    parsed
                );

        if (!timestamp.equals(normalized)) {
            throw invalid(
                "timestamp is non-canonical: " +
                key
            );
        }

        return timestamp;
    }

    private static void assertExactKeys(
        JSONObject value,
        String... expected
    ) {

        Set<String> allowed =
            new HashSet<>(
                Arrays.asList(
                    expected
                )
            );

        if (value.length() != allowed.size()) {
            throw invalid(
                "object structure contains unexpected or missing properties"
            );
        }

        Iterator<String> keys =
            value.keys();

        while (keys.hasNext()) {

            String key =
                keys.next();

            if (!allowed.contains(key)) {
                throw invalid(
                    "unexpected property: " +
                    key
                );
            }
        }

        for (String key : allowed) {

            if (
                !value.has(key) ||
                value.isNull(key)
            ) {
                throw invalid(
                    "missing property: " +
                    key
                );
            }
        }
    }

    private static byte[] decodeStrictBase64(
        String value
    ) {

        try {

            byte[] decoded =
                Base64
                    .getDecoder()
                    .decode(
                        value
                    );

            String canonical =
                Base64
                    .getEncoder()
                    .encodeToString(
                        decoded
                    );

            if (!canonical.equals(value)) {
                throw invalid(
                    "Base64 value is non-canonical"
                );
            }

            return decoded;

        } catch (
            IllegalArgumentException error
        ) {

            throw invalid(
                "Base64 value is invalid"
            );
        }
    }

    private static PublicKey decodeP256PublicKey(
        byte[] der
    ) throws Exception {

        PublicKey key =
            KeyFactory
                .getInstance("EC")
                .generatePublic(
                    new X509EncodedKeySpec(
                        der
                    )
                );

        if (!(key instanceof ECPublicKey)) {
            throw invalid(
                "Control Center public key is not EC"
            );
        }

        AlgorithmParameters parameters =
            AlgorithmParameters.getInstance(
                "EC"
            );

        parameters.init(
            new ECGenParameterSpec(
                "secp256r1"
            )
        );

        ECParameterSpec expected =
            parameters.getParameterSpec(
                ECParameterSpec.class
            );

        ECPublicKey ec =
            (ECPublicKey) key;

        if (
            ec.getParams() == null ||
            ec.getParams().getCurve() == null ||
            ec.getParams().getOrder() == null ||
            !ec.getParams().getOrder().equals(
                expected.getOrder()
            ) ||
            !ec.getParams().getGenerator().equals(
                expected.getGenerator()
            )
        ) {
            throw invalid(
                "Control Center public key must use P-256"
            );
        }

        return key;
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
                Character.forDigit(
                    (item >>> 4) & 0x0f,
                    16
                )
            );

            output.append(
                Character.forDigit(
                    item & 0x0f,
                    16
                )
            );
        }

        return output
            .toString()
            .toLowerCase(
                Locale.ROOT
            );
    }

    private static IllegalArgumentException invalid(
        String detail
    ) {

        return new IllegalArgumentException(
            "FINORA Installation Enrollment Response " +
            detail +
            "."
        );
    }
}