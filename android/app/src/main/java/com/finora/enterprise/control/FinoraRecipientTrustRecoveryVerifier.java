package com.finora.enterprise.control;

import org.json.JSONObject;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST RECOVERY VERIFIER

   MODULE  : Control
   LAYER   : Native Emergency Recovery Cryptographic Verification
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Validate one signed RECIPIENT_TRUST_RECOVERY envelope
   - Enforce FINORA_RECIPIENT_TRUST_RECOVERY_V1
   - Enforce REPLACE_ACTIVE payload
   - Validate exact installation-only native target
   - Validate canonical payload SHA-256
   - Authorize exclusively from independently provisioned
     FINORA_RECOVERY_AUTHORITY public root
   - Enforce recovery-root installation binding
   - Enforce recovery-root provisionedAt <= package issuedAt
   - Enforce package issuedAt <= authoritative acceptedNow
   - Verify ECDSA P-256 / SHA-256 / IEEE-P1363 signature
   - Validate replacement operational ACTIVE P-256 key

   AUTHORITY MODEL:

   - No operational ACTIVE recipient signing key is accepted.
   - No recipient operational trusted-key array is accepted.
   - Recovery authority comes only from the separately
     provisioned FINORA_RECOVERY_AUTHORITY public root.

   SECURITY:

   - Pure verification.
   - No persistence.
   - No recipient trust mutation.
   - No recovery-root mutation.
   - No local wall-clock observation.
   - No private signing material.
   - No Capacitor / renderer API.
============================================================ */

public final class FinoraRecipientTrustRecoveryVerifier {

    // ========================================================
    // CONSTANTS
    // ========================================================

    public static final String PURPOSE =
        "RECIPIENT_TRUST_RECOVERY";

    public static final String FORMAT =
        "FINORA_RECIPIENT_TRUST_RECOVERY_V1";

    private static final int SCHEMA_VERSION =
        1;

    private static final int PAYLOAD_VERSION =
        1;

    private static final String AUTHORITY_TYPE =
        "FINORA_RECOVERY_AUTHORITY";

    private static final String SIGNATURE_ALGORITHM =
        "ECDSA_P256_SHA256";

    private static final String SIGNATURE_ENCODING =
        "IEEE_P1363";

    private static final String CANONICALIZATION =
        "FINORA_CANONICAL_JSON_V1";

    private static final String PAYLOAD_DIGEST_ALGORITHM =
        "SHA-256";

    private static final String PUBLIC_KEY_FORMAT =
        "SPKI_DER_BASE64";

    private static final BigInteger MAX_SAFE_INTEGER =
        new BigInteger(
            "9007199254740991"
        );

    private static final Pattern CANONICAL_SHA256 =
        Pattern.compile(
            "^[0-9a-f]{64}$"
        );

    private static final Pattern CANONICAL_ISO_MILLIS =
        Pattern.compile(
            "^\\d{4}-\\d{2}-\\d{2}T" +
            "\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"
        );

    private static final DateTimeFormatter ISO_MILLIS_FORMATTER =
        DateTimeFormatter
            .ofPattern(
                "uuuu-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.ROOT
            )
            .withZone(
                ZoneOffset.UTC
            );

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean valid;

        public final JSONObject envelope;

        public final FinoraRecipientTrustRecoveryAuthorityState.Authority
            recoveryAuthority;

        public final String reason;

        public final String error;

        private Result(
            boolean valid,
            JSONObject envelope,
            FinoraRecipientTrustRecoveryAuthorityState.Authority recoveryAuthority,
            String reason,
            String error
        ) {
            this.valid =
                valid;

            this.envelope =
                envelope;

            this.recoveryAuthority =
                recoveryAuthority;

            this.reason =
                reason;

            this.error =
                error;
        }

        private static Result success(
            JSONObject envelope,
            FinoraRecipientTrustRecoveryAuthorityState.Authority recoveryAuthority
        ) {
            return new Result(
                true,
                envelope,
                recoveryAuthority,
                null,
                null
            );
        }

        private static Result failure(
            String reason,
            String error
        ) {
            return new Result(
                false,
                null,
                null,
                reason,
                error
            );
        }
    }

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    private FinoraRecipientTrustRecoveryVerifier() {
    }

    // ========================================================
    // VERIFY
    // ========================================================

    public static Result verify(
        JSONObject candidate,
        FinoraRecipientTrustRecoveryAuthorityState.State recoveryAuthorityState,
        FinoraRecipientTrustTransitionVerifier.Target expectedTarget,
        String acceptedNow
    ) {

        // ----------------------------------------------------
        // AUTHORITATIVE RECOVERY ROOT STATE
        // ----------------------------------------------------

        if (recoveryAuthorityState == null) {
            return Result.failure(
                "RECOVERY_AUTHORITY_UNAVAILABLE",
                "FINORA recipient trust recovery authority is not provisioned."
            );
        }

        try {
            FinoraRecipientTrustRecoveryAuthorityState.validate(
                recoveryAuthorityState
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                "RECOVERY_AUTHORITY_INVALID",
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery authority state is invalid."
                )
            );
        }

        if (
            recoveryAuthorityState.installation == null ||
            recoveryAuthorityState.authority == null
        ) {
            return Result.failure(
                "RECOVERY_AUTHORITY_INVALID",
                "FINORA recipient trust recovery authority state is incomplete."
            );
        }

        // ----------------------------------------------------
        // EXPECTED TARGET
        // ----------------------------------------------------

        if (!isExpectedTargetValid(
            expectedTarget
        )) {
            return Result.failure(
                "TARGET_UNAVAILABLE",
                "FINORA recipient trust recovery requires authoritative native installation target."
            );
        }

        // ----------------------------------------------------
        // RECOVERY ROOT MUST BELONG TO THIS NATIVE INSTALLATION
        // ----------------------------------------------------

        if (
            !expectedTarget.installationId.equals(
                recoveryAuthorityState
                    .installation
                    .installationId
            ) ||
            !expectedTarget.bindingKeyId.equals(
                recoveryAuthorityState
                    .installation
                    .bindingKeyId
            ) ||
            !expectedTarget.fingerprintAlgorithm.equals(
                recoveryAuthorityState
                    .installation
                    .fingerprintAlgorithm
            ) ||
            !expectedTarget.publicKeyFingerprint.equals(
                recoveryAuthorityState
                    .installation
                    .publicKeyFingerprint
            )
        ) {
            return Result.failure(
                "RECOVERY_AUTHORITY_INSTALLATION_MISMATCH",
                "FINORA recipient trust recovery authority does not belong to the authoritative native installation."
            );
        }

        // ----------------------------------------------------
        // ACCEPTED NOW
        // ----------------------------------------------------

        Instant acceptedInstant =
            parseCanonicalTimestamp(
                acceptedNow
            );

        if (acceptedInstant == null) {
            return Result.failure(
                "INVALID_ACCEPTED_TIME",
                "FINORA recipient trust recovery accepted verification time is invalid."
            );
        }

        // ----------------------------------------------------
        // SIGNED ENVELOPE STRUCTURE
        // ----------------------------------------------------

        final JSONObject envelope;

        try {
            envelope =
                validateSignedEnvelope(
                    candidate
                );
        } catch (
            Exception error
        ) {
            return Result.failure(
                "MALFORMED_RECOVERY",
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery package is malformed."
                )
            );
        }

        // ----------------------------------------------------
        // EXACT PACKAGE TARGET
        // ----------------------------------------------------

        JSONObject actualTarget =
            envelope.optJSONObject(
                "target"
            );

        if (
            actualTarget == null ||
            !targetMatches(
                actualTarget,
                expectedTarget
            )
        ) {
            return Result.failure(
                "TARGET_MISMATCH",
                "FINORA recipient trust recovery target does not match the authoritative native installation."
            );
        }

        // ----------------------------------------------------
        // INDEPENDENT RECOVERY AUTHORITY IDENTITY
        // ----------------------------------------------------

        JSONObject issuer =
            envelope.optJSONObject(
                "issuer"
            );

        JSONObject signature =
            envelope.optJSONObject(
                "signature"
            );

        if (
            issuer == null ||
            signature == null
        ) {
            return Result.failure(
                "MALFORMED_RECOVERY",
                "FINORA recipient trust recovery authority identity is missing."
            );
        }

        FinoraRecipientTrustRecoveryAuthorityState.Authority
            trustedAuthority =
                recoveryAuthorityState.authority;

        if (
            !AUTHORITY_TYPE.equals(
                issuer.optString(
                    "type",
                    ""
                )
            ) ||
            !AUTHORITY_TYPE.equals(
                trustedAuthority.type
            ) ||
            !trustedAuthority.recoveryAuthorityId.equals(
                issuer.optString(
                    "recoveryAuthorityId",
                    ""
                )
            ) ||
            !trustedAuthority.signingKeyId.equals(
                issuer.optString(
                    "signingKeyId",
                    ""
                )
            ) ||
            !trustedAuthority.signingKeyId.equals(
                signature.optString(
                    "signingKeyId",
                    ""
                )
            )
        ) {
            return Result.failure(
                "RECOVERY_AUTHORITY_MISMATCH",
                "FINORA recipient trust recovery package is not authorized by the independently provisioned Recovery Authority root."
            );
        }

        // ----------------------------------------------------
        // RECOVERY ROOT CRYPTO CONTRACT
        // ----------------------------------------------------

        if (
            !SIGNATURE_ALGORITHM.equals(
                trustedAuthority.algorithm
            ) ||
            !PUBLIC_KEY_FORMAT.equals(
                trustedAuthority.format
            )
        ) {
            return Result.failure(
                "RECOVERY_AUTHORITY_UNSUPPORTED",
                "FINORA recipient trust recovery authority uses an unsupported public-key contract."
            );
        }

        // ----------------------------------------------------
        // TIME FLOOR / CEILING
        //
        // recovery-root provisionedAt <= package issuedAt
        // package issuedAt <= authoritative acceptedNow
        // ----------------------------------------------------

        Instant provisionedAt =
            parseCanonicalTimestamp(
                recoveryAuthorityState.provisionedAt
            );

        Instant issuedAt =
            parseCanonicalTimestamp(
                envelope.optString(
                    "issuedAt",
                    ""
                )
            );

        if (
            provisionedAt == null ||
            issuedAt == null
        ) {
            return Result.failure(
                "INVALID_RECOVERY_TIME",
                "FINORA recipient trust recovery timestamps are invalid."
            );
        }

        if (
            issuedAt.isBefore(
                provisionedAt
            )
        ) {
            return Result.failure(
                "RECOVERY_PREDATES_AUTHORITY",
                "FINORA recipient trust recovery package predates Recovery Authority provisioning."
            );
        }

        if (
            issuedAt.isAfter(
                acceptedInstant
            )
        ) {
            return Result.failure(
                "RECOVERY_FROM_FUTURE",
                "FINORA recipient trust recovery package was issued after the authoritative accepted time."
            );
        }

        // ----------------------------------------------------
        // PUBLIC KEY
        // ----------------------------------------------------

        final PublicKey publicKey;

        try {
            publicKey =
                decodeP256PublicKey(
                    trustedAuthority.publicKey
                );
        } catch (
            Exception error
        ) {
            return Result.failure(
                "RECOVERY_AUTHORITY_INVALID",
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery authority public key is invalid."
                )
            );
        }

        // ----------------------------------------------------
        // CANONICAL UNSIGNED ENVELOPE
        // ----------------------------------------------------

        final String canonicalEnvelope;

        try {
            Map<String, Object> unsignedEnvelope =
                new LinkedHashMap<>(
                    FinoraJsonBridge.toMap(
                        envelope
                    )
                );

            unsignedEnvelope.remove(
                "signature"
            );

            canonicalEnvelope =
                FinoraCanonicalJson.canonicalize(
                    unsignedEnvelope
                );
        } catch (
            Exception error
        ) {
            return Result.failure(
                "MALFORMED_RECOVERY",
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery canonicalization failed."
                )
            );
        }

        // ----------------------------------------------------
        // SIGNATURE
        // ----------------------------------------------------

        final byte[] p1363;

        try {
            p1363 =
                decodeStrictBase64(
                    signature.optString(
                        "value",
                        ""
                    )
                );
        } catch (
            Exception error
        ) {
            return Result.failure(
                "INVALID_SIGNATURE",
                "FINORA recipient trust recovery signature encoding is invalid."
            );
        }

        if (
            p1363.length !=
                64
        ) {
            return Result.failure(
                "INVALID_SIGNATURE",
                "FINORA recipient trust recovery signature length is invalid."
            );
        }

        try {
            Signature verifier =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            verifier.initVerify(
                publicKey
            );

            verifier.update(
                canonicalEnvelope.getBytes(
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
                    "INVALID_SIGNATURE",
                    "FINORA recipient trust recovery signature verification failed."
                );
            }
        } catch (
            Exception error
        ) {
            return Result.failure(
                "INVALID_SIGNATURE",
                messageOrDefault(
                    error,
                    "FINORA recipient trust recovery signature verification failed."
                )
            );
        }

        return Result.success(
            envelope,
            trustedAuthority
        );
    }

    // ========================================================
    // SIGNED ENVELOPE CONTRACT
    // ========================================================

    private static JSONObject validateSignedEnvelope(
        JSONObject value
    ) throws Exception {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery must be an object."
            );
        }

        requireOnlyKeys(
            value,
            "packageId",
            "purpose",
            "target",
            "issuedAt",
            "sequence",
            "payloadVersion",
            "payload",
            "schemaVersion",
            "issuer",
            "payloadDigest",
            "signature"
        );

        requireNonEmptyString(
            value,
            "packageId"
        );

        if (
            !PURPOSE.equals(
                requireNonEmptyString(
                    value,
                    "purpose"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery purpose is invalid."
            );
        }

        String issuedAt =
            requireCanonicalTimestamp(
                value,
                "issuedAt"
            );

        requirePositiveSafeInteger(
            value,
            "sequence"
        );

        requireExactInteger(
            value,
            "payloadVersion",
            PAYLOAD_VERSION
        );

        requireExactInteger(
            value,
            "schemaVersion",
            SCHEMA_VERSION
        );

        JSONObject target =
            requireObject(
                value,
                "target"
            );

        validateTarget(
            target
        );

        JSONObject payload =
            requireObject(
                value,
                "payload"
            );

        validatePayload(
            payload,
            issuedAt
        );

        JSONObject issuer =
            requireObject(
                value,
                "issuer"
            );

        validateIssuer(
            issuer
        );

        JSONObject payloadDigest =
            requireObject(
                value,
                "payloadDigest"
            );

        validatePayloadDigest(
            payload,
            payloadDigest
        );

        JSONObject signature =
            requireObject(
                value,
                "signature"
            );

        validateSignature(
            issuer,
            signature
        );

        if (
            !issuedAt.equals(
                payload.getString(
                    "issuedAt"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery payload and envelope issuedAt must match exactly."
            );
        }

        return value;
    }

    // ========================================================
    // TARGET
    // ========================================================

    private static void validateTarget(
        JSONObject value
    ) {

        requireOnlyKeys(
            value,
            "installationId",
            "bindingKeyId",
            "fingerprintAlgorithm",
            "publicKeyFingerprint"
        );

        requireNonEmptyString(
            value,
            "installationId"
        );

        requireNonEmptyString(
            value,
            "bindingKeyId"
        );

        if (
            !"SHA-256".equals(
                requireNonEmptyString(
                    value,
                    "fingerprintAlgorithm"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery target fingerprint algorithm is invalid."
            );
        }

        String fingerprint =
            requireNonEmptyString(
                value,
                "publicKeyFingerprint"
            );

        if (
            !CANONICAL_SHA256
                .matcher(
                    fingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery target fingerprint is invalid."
            );
        }
    }

    private static boolean isExpectedTargetValid(
        FinoraRecipientTrustTransitionVerifier.Target expected
    ) {

        return (
            expected != null &&
            isNonEmptyString(
                expected.installationId
            ) &&
            isNonEmptyString(
                expected.bindingKeyId
            ) &&
            "SHA-256".equals(
                expected.fingerprintAlgorithm
            ) &&
            expected.publicKeyFingerprint != null &&
            CANONICAL_SHA256
                .matcher(
                    expected.publicKeyFingerprint
                )
                .matches()
        );
    }

    private static boolean targetMatches(
        JSONObject actual,
        FinoraRecipientTrustTransitionVerifier.Target expected
    ) {

        if (
            actual == null ||
            !isExpectedTargetValid(
                expected
            )
        ) {
            return false;
        }

        try {
            validateTarget(
                actual
            );

            return (
                expected.installationId.equals(
                    actual.getString(
                        "installationId"
                    )
                ) &&
                expected.bindingKeyId.equals(
                    actual.getString(
                        "bindingKeyId"
                    )
                ) &&
                expected.fingerprintAlgorithm.equals(
                    actual.getString(
                        "fingerprintAlgorithm"
                    )
                ) &&
                expected.publicKeyFingerprint.equals(
                    actual.getString(
                        "publicKeyFingerprint"
                    )
                )
            );
        } catch (
            Exception error
        ) {
            return false;
        }
    }

    // ========================================================
    // PAYLOAD
    // ========================================================

    private static void validatePayload(
        JSONObject value,
        String envelopeIssuedAt
    ) throws Exception {

        requireOnlyKeys(
            value,
            "recoveryFormat",
            "action",
            "operationalIssuerId",
            "expectedActiveSigningKeyId",
            "replacementTrustedKey",
            "issuedAt",
            "schemaVersion"
        );

        if (
            !FORMAT.equals(
                requireNonEmptyString(
                    value,
                    "recoveryFormat"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery format is invalid."
            );
        }

        if (
            !"REPLACE_ACTIVE".equals(
                requireNonEmptyString(
                    value,
                    "action"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery action is unsupported."
            );
        }

        String operationalIssuerId =
            requireNonEmptyString(
                value,
                "operationalIssuerId"
            );

        String expectedActiveSigningKeyId =
            requireNonEmptyString(
                value,
                "expectedActiveSigningKeyId"
            );

        String issuedAt =
            requireCanonicalTimestamp(
                value,
                "issuedAt"
            );

        if (
            !envelopeIssuedAt.equals(
                issuedAt
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery payload issuedAt is inconsistent."
            );
        }

        requireExactInteger(
            value,
            "schemaVersion",
            SCHEMA_VERSION
        );

        JSONObject replacementTrustedKey =
            requireObject(
                value,
                "replacementTrustedKey"
            );

        validateReplacementTrustedKey(
            replacementTrustedKey,
            operationalIssuerId,
            expectedActiveSigningKeyId,
            issuedAt
        );
    }

    // ========================================================
    // REPLACEMENT ACTIVE KEY
    // ========================================================

    private static void validateReplacementTrustedKey(
        JSONObject value,
        String operationalIssuerId,
        String expectedActiveSigningKeyId,
        String issuedAt
    ) throws Exception {

        requireOnlyKeys(
            value,
            "issuerId",
            "signingKeyId",
            "algorithm",
            "format",
            "publicKey",
            "status",
            "validFrom"
        );

        String issuerId =
            requireNonEmptyString(
                value,
                "issuerId"
            );

        String signingKeyId =
            requireNonEmptyString(
                value,
                "signingKeyId"
            );

        String algorithm =
            requireNonEmptyString(
                value,
                "algorithm"
            );

        String format =
            requireNonEmptyString(
                value,
                "format"
            );

        String publicKey =
            requireNonEmptyString(
                value,
                "publicKey"
            );

        String status =
            requireNonEmptyString(
                value,
                "status"
            );

        String validFrom =
            requireCanonicalTimestamp(
                value,
                "validFrom"
            );

        if (
            !operationalIssuerId.equals(
                issuerId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery replacement key must belong to the operational issuer."
            );
        }

        if (
            !SIGNATURE_ALGORITHM.equals(
                algorithm
            ) ||
            !PUBLIC_KEY_FORMAT.equals(
                format
            ) ||
            !FinoraRecipientTrustState.STATUS_ACTIVE.equals(
                status
            ) ||
            !issuedAt.equals(
                validFrom
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery replacement key must be one ACTIVE P-256 operational signing key valid from issuedAt."
            );
        }

        if (
            signingKeyId.equals(
                expectedActiveSigningKeyId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery replacement key must differ from the expected compromised ACTIVE key."
            );
        }

        String fingerprint =
            FinoraRecipientTrustRecoveryAuthorityState
                .createPublicKeyFingerprint(
                    publicKey
                );

        String canonicalSigningKeyId =
            FinoraRecipientTrustRecoveryAuthorityState
                .createSigningKeyId(
                    fingerprint
                );

        if (
            !canonicalSigningKeyId.equals(
                signingKeyId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery replacement signingKeyId does not match its public key."
            );
        }
    }

    // ========================================================
    // ISSUER
    // ========================================================

    private static void validateIssuer(
        JSONObject value
    ) {

        requireOnlyKeys(
            value,
            "type",
            "recoveryAuthorityId",
            "signingKeyId"
        );

        if (
            !AUTHORITY_TYPE.equals(
                requireNonEmptyString(
                    value,
                    "type"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery issuer type is invalid."
            );
        }

        requireNonEmptyString(
            value,
            "recoveryAuthorityId"
        );

        requireNonEmptyString(
            value,
            "signingKeyId"
        );
    }

    // ========================================================
    // PAYLOAD DIGEST
    // ========================================================

    private static void validatePayloadDigest(
        JSONObject payload,
        JSONObject payloadDigest
    ) throws Exception {

        requireOnlyKeys(
            payloadDigest,
            "algorithm",
            "value"
        );

        if (
            !PAYLOAD_DIGEST_ALGORITHM.equals(
                requireNonEmptyString(
                    payloadDigest,
                    "algorithm"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery payload digest algorithm is invalid."
            );
        }

        String expectedDigest =
            requireNonEmptyString(
                payloadDigest,
                "value"
            );

        if (
            !CANONICAL_SHA256
                .matcher(
                    expectedDigest
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery payload digest structure is invalid."
            );
        }

        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                FinoraJsonBridge.toMap(
                    payload
                )
            );

        String actualDigest =
            sha256Hex(
                canonicalPayload
            );

        if (
            !expectedDigest.equals(
                actualDigest
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery payload digest does not match payload."
            );
        }
    }

    // ========================================================
    // SIGNATURE CONTRACT
    // ========================================================

    private static void validateSignature(
        JSONObject issuer,
        JSONObject signature
    ) throws Exception {

        requireOnlyKeys(
            signature,
            "algorithm",
            "encoding",
            "canonicalization",
            "signingKeyId",
            "value"
        );

        if (
            !SIGNATURE_ALGORITHM.equals(
                requireNonEmptyString(
                    signature,
                    "algorithm"
                )
            ) ||
            !SIGNATURE_ENCODING.equals(
                requireNonEmptyString(
                    signature,
                    "encoding"
                )
            ) ||
            !CANONICALIZATION.equals(
                requireNonEmptyString(
                    signature,
                    "canonicalization"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery signature contract is invalid."
            );
        }

        String issuerSigningKeyId =
            requireNonEmptyString(
                issuer,
                "signingKeyId"
            );

        String signatureSigningKeyId =
            requireNonEmptyString(
                signature,
                "signingKeyId"
            );

        if (
            !issuerSigningKeyId.equals(
                signatureSigningKeyId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery issuer and signature signingKeyId values do not match."
            );
        }

        byte[] signatureBytes =
            decodeStrictBase64(
                requireNonEmptyString(
                    signature,
                    "value"
                )
            );

        if (
            signatureBytes.length !=
                64
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery signature must be a 64-byte IEEE-P1363 P-256 signature."
            );
        }
    }

    // ========================================================
    // P-256 PUBLIC KEY
    // ========================================================

    private static PublicKey decodeP256PublicKey(
        String publicKeySpkiDerBase64
    ) throws Exception {

        byte[] der =
            decodeStrictBase64(
                publicKeySpkiDerBase64
            );

        PublicKey publicKey =
            KeyFactory
                .getInstance(
                    "EC"
                )
                .generatePublic(
                    new X509EncodedKeySpec(
                        der
                    )
                );

        if (
            !(publicKey instanceof
                ECPublicKey)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery authority must use an EC P-256 public key."
            );
        }

        if (
            !Arrays.equals(
                der,
                publicKey.getEncoded()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery authority SPKI DER is non-canonical."
            );
        }

        ECPublicKey ecPublicKey =
            (ECPublicKey) publicKey;

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

        if (
            !sameEcParameters(
                ecPublicKey.getParams(),
                expected
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery authority must use P-256."
            );
        }

        return publicKey;
    }

    private static boolean sameEcParameters(
        ECParameterSpec left,
        ECParameterSpec right
    ) {

        if (
            left == null ||
            right == null
        ) {
            return false;
        }

        return (
            left.getCofactor() ==
                right.getCofactor() &&
            left.getOrder().equals(
                right.getOrder()
            ) &&
            left.getGenerator().equals(
                right.getGenerator()
            ) &&
            left.getCurve().equals(
                right.getCurve()
            )
        );
    }

    // ========================================================
    // STRICT BASE64
    // ========================================================

    private static byte[] decodeStrictBase64(
        String value
    ) {

        if (
            value == null ||
            value.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery Base64 value is invalid."
            );
        }

        final byte[] decoded;

        try {
            decoded =
                Base64
                    .getDecoder()
                    .decode(
                        value
                    );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery Base64 value is invalid.",
                error
            );
        }

        if (
            decoded.length ==
                0 ||
            !Base64
                .getEncoder()
                .encodeToString(
                    decoded
                )
                .equals(
                    value
                )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery Base64 encoding is non-canonical."
            );
        }

        return decoded;
    }

    // ========================================================
    // IEEE-P1363 -> DER
    // ========================================================

    private static byte[] ieeeP1363ToDer(
        byte[] signature
    ) {

        if (
            signature == null ||
            signature.length !=
                64
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery P-256 signature length is invalid."
            );
        }

        byte[] r =
            Arrays.copyOfRange(
                signature,
                0,
                32
            );

        byte[] s =
            Arrays.copyOfRange(
                signature,
                32,
                64
            );

        byte[] derR =
            encodeDerInteger(
                r
            );

        byte[] derS =
            encodeDerInteger(
                s
            );

        int bodyLength =
            derR.length +
            derS.length;

        byte[] der =
            new byte[
                2 +
                bodyLength
            ];

        der[0] =
            0x30;

        der[1] =
            (byte) bodyLength;

        System.arraycopy(
            derR,
            0,
            der,
            2,
            derR.length
        );

        System.arraycopy(
            derS,
            0,
            der,
            2 + derR.length,
            derS.length
        );

        return der;
    }

    private static byte[] encodeDerInteger(
        byte[] value
    ) {

        int firstNonZero =
            0;

        while (
            firstNonZero <
                value.length - 1 &&
            value[firstNonZero] ==
                0
        ) {
            firstNonZero++;
        }

        int magnitudeLength =
            value.length -
            firstNonZero;

        boolean prependZero =
            (
                value[firstNonZero] &
                0x80
            ) !=
                0;

        int integerLength =
            magnitudeLength +
            (
                prependZero
                    ? 1
                    : 0
            );

        byte[] encoded =
            new byte[
                2 +
                integerLength
            ];

        encoded[0] =
            0x02;

        encoded[1] =
            (byte) integerLength;

        int offset =
            2;

        if (prependZero) {
            encoded[offset] =
                0;

            offset++;
        }

        System.arraycopy(
            value,
            firstNonZero,
            encoded,
            offset,
            magnitudeLength
        );

        return encoded;
    }

    // ========================================================
    // SHA-256
    // ========================================================

    private static String sha256Hex(
        String value
    ) throws Exception {

        byte[] digest =
            java.security.MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value.getBytes(
                        StandardCharsets.UTF_8
                    )
                );

        StringBuilder builder =
            new StringBuilder(
                digest.length * 2
            );

        for (
            byte item :
            digest
        ) {
            builder.append(
                Character.forDigit(
                    (item >>> 4) &
                    0x0f,
                    16
                )
            );

            builder.append(
                Character.forDigit(
                    item &
                    0x0f,
                    16
                )
            );
        }

        return builder.toString();
    }

    // ========================================================
    // TIMESTAMP
    // ========================================================

    private static String requireCanonicalTimestamp(
        JSONObject value,
        String key
    ) {

        String timestamp =
            requireNonEmptyString(
                value,
                key
            );

        if (
            parseCanonicalTimestamp(
                timestamp
            ) ==
                null
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery timestamp is invalid: " +
                key
            );
        }

        return timestamp;
    }

    private static Instant parseCanonicalTimestamp(
        String value
    ) {

        if (
            value == null ||
            !CANONICAL_ISO_MILLIS
                .matcher(
                    value
                )
                .matches()
        ) {
            return null;
        }

        try {
            Instant parsed =
                Instant.parse(
                    value
                );

            if (
                !ISO_MILLIS_FORMATTER
                    .format(
                        parsed
                    )
                    .equals(
                        value
                    )
            ) {
                return null;
            }

            return parsed;
        } catch (
            Exception error
        ) {
            return null;
        }
    }

    // ========================================================
    // JSON HELPERS
    // ========================================================

    private static void requireOnlyKeys(
        JSONObject value,
        String... allowedKeys
    ) {

        Set<String> allowed =
            new HashSet<>(
                Arrays.asList(
                    allowedKeys
                )
            );

        Iterator<String> keys =
            value.keys();

        while (
            keys.hasNext()
        ) {
            String key =
                keys.next();

            if (
                !allowed.contains(
                    key
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery contains an unsupported property: " +
                    key
                );
            }
        }
    }

    private static JSONObject requireObject(
        JSONObject value,
        String key
    ) {

        if (
            value == null ||
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property is missing: " +
                key
            );
        }

        JSONObject object =
            value.optJSONObject(
                key
            );

        if (object == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property " +
                key +
                " must be an object."
            );
        }

        return object;
    }

    private static String requireNonEmptyString(
        JSONObject value,
        String key
    ) {

        if (
            value == null ||
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property is missing: " +
                key
            );
        }

        Object raw;

        try {
            raw =
                value.get(
                    key
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property " +
                key +
                " must be a string."
            );
        }

        String result =
            (String) raw;

        if (
            result.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property " +
                key +
                " must not be empty."
            );
        }

        return result;
    }

    private static boolean isNonEmptyString(
        String value
    ) {

        return (
            value != null &&
            !value.trim().isEmpty()
        );
    }

    private static void requireExactInteger(
        JSONObject value,
        String key,
        int expected
    ) {

        BigInteger integer =
            requireInteger(
                value,
                key
            );

        if (
            !integer.equals(
                BigInteger.valueOf(
                    expected
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property " +
                key +
                " has an unsupported value."
            );
        }
    }

    private static long requirePositiveSafeInteger(
        JSONObject value,
        String key
    ) {

        BigInteger integer =
            requireInteger(
                value,
                key
            );

        if (
            integer.signum() <=
                0 ||
            integer.compareTo(
                MAX_SAFE_INTEGER
            ) >
                0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery sequence is invalid."
            );
        }

        return integer.longValue();
    }

    private static BigInteger requireInteger(
        JSONObject value,
        String key
    ) {

        if (
            value == null ||
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery numeric property is missing: " +
                key
            );
        }

        Object raw;

        try {
            raw =
                value.get(
                    key
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery numeric property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property " +
                key +
                " must be an integer."
            );
        }

        try {
            return new BigDecimal(
                raw.toString()
            ).toBigIntegerExact();
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust recovery property " +
                key +
                " must be an integer.",
                error
            );
        }
    }

    // ========================================================
    // MESSAGE
    // ========================================================

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {

        if (
            error == null ||
            error.getMessage() == null ||
            error.getMessage()
                .trim()
                .isEmpty()
        ) {
            return fallback;
        }

        return error.getMessage();
    }
}

/* ============================================================
   END
============================================================ */