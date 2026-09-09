package com.finora.enterprise.control;

import org.json.JSONObject;

import java.math.BigDecimal;
import java.math.BigInteger;
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
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST TRANSITION VERIFIER

   MODULE  : Control
   LAYER   : Native Recipient Cryptographic Verification
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Validate one signed RECIPIENT_TRUST_TRANSITION envelope
   - Enforce FINORA_RECIPIENT_TRUST_TRANSITION_V1
   - Validate installation-only native target
   - Validate ROTATE / REVOKE_RETIRED payload contracts
   - Validate canonical payload SHA-256
   - Resolve signer only from existing recipient trust
   - Require signer to be the single ACTIVE key for issuer
   - Evaluate signer validity at transition issuedAt
   - Verify ECDSA P-256 / SHA-256 / IEEE-P1363 signature
   - Return verified envelope + authoritative trusted signer

   SECURITY:

   - Pure PUBLIC-key verification only.
   - No trust mutation.
   - No persistence.
   - No wall-clock observation.
   - No caller-supplied current time.
   - No bootstrap authority.
   - No recovery authority.
   - No private signing material.
   - No Capacitor / renderer API.
============================================================ */

public final class FinoraRecipientTrustTransitionVerifier {

    // ========================================================
    // CONTRACT CONSTANTS
    // ========================================================

    public static final String PURPOSE =
        "RECIPIENT_TRUST_TRANSITION";

    public static final String FORMAT =
        "FINORA_RECIPIENT_TRUST_TRANSITION_V1";

    private static final int SCHEMA_VERSION =
        1;

    private static final int PAYLOAD_VERSION =
        1;

    private static final String ISSUER_TYPE =
        "FINORA_CONTROL_CENTER";

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
    // TARGET
    // ========================================================

    public static final class Target {

        public final String installationId;

        public final String bindingKeyId;

        public final String fingerprintAlgorithm;

        public final String publicKeyFingerprint;

        public Target(
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint
        ) {
            this.installationId =
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean valid;

        public final JSONObject envelope;

        public final FinoraRecipientTrustState.TrustedKeyRecord
            trustedSigner;

        public final String reason;

        public final String error;

        private Result(
            boolean valid,
            JSONObject envelope,
            FinoraRecipientTrustState.TrustedKeyRecord trustedSigner,
            String reason,
            String error
        ) {
            this.valid =
                valid;

            this.envelope =
                envelope;

            this.trustedSigner =
                trustedSigner;

            this.reason =
                reason;

            this.error =
                error;
        }

        private static Result success(
            JSONObject envelope,
            FinoraRecipientTrustState.TrustedKeyRecord trustedSigner
        ) {
            return new Result(
                true,
                envelope,
                trustedSigner,
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

    private FinoraRecipientTrustTransitionVerifier() {
    }

    // ========================================================
    // VERIFY
    // ========================================================

    public static Result verify(
        JSONObject candidate,
        List<FinoraRecipientTrustState.TrustedKeyRecord> trustedKeys,
        Target expectedTarget
    ) {

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
                "MALFORMED_TRANSITION",
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition is malformed."
                )
            );
        }

        // ----------------------------------------------------
        // EXACT NATIVE INSTALLATION TARGET
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
                "FINORA recipient trust transition target does not match the authoritative native installation."
            );
        }

        // ----------------------------------------------------
        // TRUST SOURCE
        // ----------------------------------------------------

        if (
            trustedKeys == null ||
            trustedKeys.isEmpty()
        ) {
            return Result.failure(
                "UNKNOWN_SIGNING_KEY",
                "FINORA recipient trust transition signer is not trusted."
            );
        }

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
                "MALFORMED_TRANSITION",
                "FINORA recipient trust transition signer identity is missing."
            );
        }

        String issuerId =
            issuer.optString(
                "issuerId",
                ""
            );

        String signingKeyId =
            signature.optString(
                "signingKeyId",
                ""
            );

        FinoraRecipientTrustState.TrustedKeyRecord
            trustedSigner =
                null;

        for (
            FinoraRecipientTrustState.TrustedKeyRecord key :
            trustedKeys
        ) {
            if (
                key != null &&
                issuerId.equals(
                    key.issuerId
                ) &&
                signingKeyId.equals(
                    key.signingKeyId
                )
            ) {
                trustedSigner =
                    key;

                break;
            }
        }

        if (trustedSigner == null) {
            return Result.failure(
                "UNKNOWN_SIGNING_KEY",
                "FINORA recipient trust transition signing key is not trusted."
            );
        }

        // ----------------------------------------------------
        // CURRENT ACTIVE AUTHORITY ONLY
        // ----------------------------------------------------

        if (
            !FinoraRecipientTrustState.STATUS_ACTIVE.equals(
                trustedSigner.status
            )
        ) {
            return Result.failure(
                "SIGNING_KEY_NOT_ACTIVE",
                "FINORA recipient trust transition must be signed by the current ACTIVE signing key."
            );
        }

        int activeKeysForIssuer =
            0;

        String soleActiveSigningKeyId =
            null;

        for (
            FinoraRecipientTrustState.TrustedKeyRecord key :
            trustedKeys
        ) {
            if (
                key != null &&
                issuerId.equals(
                    key.issuerId
                ) &&
                FinoraRecipientTrustState.STATUS_ACTIVE.equals(
                    key.status
                )
            ) {
                activeKeysForIssuer++;

                soleActiveSigningKeyId =
                    key.signingKeyId;
            }
        }

        if (
            activeKeysForIssuer !=
                1 ||
            !signingKeyId.equals(
                soleActiveSigningKeyId
            )
        ) {
            return Result.failure(
                "AMBIGUOUS_ACTIVE_SIGNER",
                "FINORA recipient trust authority does not contain exactly one ACTIVE signing key for this issuer."
            );
        }

        // ----------------------------------------------------
        // SIGNER HISTORICAL VALIDITY AT TRANSITION issuedAt
        //
        // Exact validUntil is inclusive.
        // Only issuedAt > validUntil is rejected.
        // ----------------------------------------------------

        Instant issuedAt =
            parseCanonicalTimestamp(
                envelope.optString(
                    "issuedAt",
                    ""
                )
            );

        Instant validFrom =
            parseCanonicalTimestamp(
                trustedSigner.validFrom
            );

        Instant validUntil =
            trustedSigner.validUntil == null
                ? null
                : parseCanonicalTimestamp(
                    trustedSigner.validUntil
                );

        if (
            issuedAt == null ||
            validFrom == null ||
            issuedAt.isBefore(
                validFrom
            ) ||
            (
                trustedSigner.validUntil !=
                    null &&
                (
                    validUntil ==
                        null ||
                    validUntil.isBefore(
                        validFrom
                    ) ||
                    issuedAt.isAfter(
                        validUntil
                    )
                )
            )
        ) {
            return Result.failure(
                "SIGNING_KEY_NOT_VALID",
                "FINORA recipient trust transition signer was not valid when the transition was issued."
            );
        }

        // ----------------------------------------------------
        // TRUSTED PUBLIC-KEY CONTRACT
        // ----------------------------------------------------

        if (
            !SIGNATURE_ALGORITHM.equals(
                trustedSigner.algorithm
            ) ||
            !PUBLIC_KEY_FORMAT.equals(
                trustedSigner.format
            )
        ) {
            return Result.failure(
                "UNSUPPORTED_TRUST_KEY",
                "FINORA recipient trust transition signer uses an unsupported public-key contract."
            );
        }

        final PublicKey publicKey;

        try {
            publicKey =
                decodeP256PublicKey(
                    trustedSigner.publicKey
                );
        } catch (
            UnsupportedOperationException error
        ) {
            return Result.failure(
                "UNSUPPORTED_TRUST_KEY",
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition signer must use an EC P-256 public key."
                )
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                "INVALID_SIGNATURE",
                "FINORA recipient trust transition signer public key is invalid."
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
                "MALFORMED_TRANSITION",
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition canonicalization failed."
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
                "FINORA recipient trust transition signature encoding is invalid."
            );
        }

        if (
            p1363.length !=
                64
        ) {
            return Result.failure(
                "INVALID_SIGNATURE",
                "FINORA recipient trust transition signature length is invalid."
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
                    "FINORA recipient trust transition signature verification failed."
                );
            }
        } catch (
            Exception error
        ) {
            return Result.failure(
                "INVALID_SIGNATURE",
                messageOrDefault(
                    error,
                    "FINORA recipient trust transition signature verification failed."
                )
            );
        }

        return Result.success(
            envelope,
            trustedSigner
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
                "FINORA recipient trust transition must be an object."
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
                "FINORA recipient trust transition purpose is invalid."
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

        // ----------------------------------------------------
        // PAYLOAD / ENVELOPE issuedAt EXACT MATCH
        // ----------------------------------------------------

        if (
            !issuedAt.equals(
                requireNonEmptyString(
                    payload,
                    "issuedAt"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition payload and envelope issuedAt must match exactly."
            );
        }

        String issuerId =
            requireNonEmptyString(
                issuer,
                "issuerId"
            );

        String issuerSigningKeyId =
            requireNonEmptyString(
                issuer,
                "signingKeyId"
            );

        String action =
            requireNonEmptyString(
                payload,
                "action"
            );

        // ----------------------------------------------------
        // ROTATE CROSS-FIELD POLICY
        // ----------------------------------------------------

        if (
            "ROTATE".equals(
                action
            )
        ) {
            JSONObject newTrustedKey =
                requireObject(
                    payload,
                    "newTrustedKey"
                );

            if (
                !issuerId.equals(
                    requireNonEmptyString(
                        newTrustedKey,
                        "issuerId"
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust rotation cannot change issuerId."
                );
            }

            if (
                issuerSigningKeyId.equals(
                    requireNonEmptyString(
                        newTrustedKey,
                        "signingKeyId"
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust rotation new signing key must differ from the authorizing signing key."
                );
            }
        }

        // ----------------------------------------------------
        // REVOKE_RETIRED CROSS-FIELD POLICY
        // ----------------------------------------------------

        if (
            "REVOKE_RETIRED".equals(
                action
            ) &&
            issuerSigningKeyId.equals(
                requireNonEmptyString(
                    payload,
                    "revokedSigningKeyId"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition cannot revoke its authorizing signing key."
            );
        }

        return value;
    }

    // ========================================================
    // TARGET CONTRACT
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
                "FINORA recipient trust transition target fingerprint algorithm is invalid."
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
                "FINORA recipient trust transition target fingerprint is invalid."
            );
        }
    }

    private static boolean targetMatches(
        JSONObject actual,
        Target expected
    ) {

        if (
            actual == null ||
            expected == null ||
            expected.installationId == null ||
            expected.bindingKeyId == null ||
            expected.fingerprintAlgorithm == null ||
            expected.publicKeyFingerprint == null
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
    // PAYLOAD CONTRACT
    // ========================================================

    private static void validatePayload(
        JSONObject value,
        String envelopeIssuedAt
    ) throws Exception {

        String action =
            requireNonEmptyString(
                value,
                "action"
            );

        if (
            "ROTATE".equals(
                action
            )
        ) {
            requireOnlyKeys(
                value,
                "transitionFormat",
                "action",
                "newTrustedKey",
                "issuedAt",
                "schemaVersion"
            );

            if (
                !FORMAT.equals(
                    requireNonEmptyString(
                        value,
                        "transitionFormat"
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition format is invalid."
                );
            }

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
                    "FINORA recipient trust ROTATE issuedAt is inconsistent."
                );
            }

            requireExactInteger(
                value,
                "schemaVersion",
                SCHEMA_VERSION
            );

            JSONObject newTrustedKey =
                requireObject(
                    value,
                    "newTrustedKey"
                );

            validateNewActiveTrustedKey(
                newTrustedKey,
                issuedAt
            );

            return;
        }

        if (
            "REVOKE_RETIRED".equals(
                action
            )
        ) {
            requireOnlyKeys(
                value,
                "transitionFormat",
                "action",
                "revokedSigningKeyId",
                "issuedAt",
                "schemaVersion"
            );

            if (
                !FORMAT.equals(
                    requireNonEmptyString(
                        value,
                        "transitionFormat"
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition format is invalid."
                );
            }

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
                    "FINORA recipient trust REVOKE_RETIRED issuedAt is inconsistent."
                );
            }

            requireNonEmptyString(
                value,
                "revokedSigningKeyId"
            );

            requireExactInteger(
                value,
                "schemaVersion",
                SCHEMA_VERSION
            );

            return;
        }

        throw new IllegalArgumentException(
            "FINORA recipient trust transition action is unsupported."
        );
    }

    // ========================================================
    // NEW ACTIVE KEY CONTRACT
    // ========================================================

    private static void validateNewActiveTrustedKey(
        JSONObject value,
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
                "FINORA recipient trust ROTATE payload contains an invalid new ACTIVE signing key."
            );
        }

        FinoraRecipientTrustState.TrustedKeyRecord record =
            new FinoraRecipientTrustState.TrustedKeyRecord(
                issuerId,
                signingKeyId,
                algorithm,
                format,
                publicKey,
                status,
                validFrom,
                null
            );

        FinoraRecipientTrustState.State validationState =
            new FinoraRecipientTrustState.State(
                FinoraRecipientTrustState.SCHEMA_VERSION,
                Collections.singletonList(
                    record
                ),
                null,
                null,
                null,
                null
            );

        FinoraRecipientTrustState.validate(
            validationState
        );

        String fingerprint =
            createPublicKeyFingerprint(
                publicKey
            );

        String canonicalSigningKeyId =
            createSigningKeyId(
                fingerprint
            );

        if (
            !canonicalSigningKeyId.equals(
                signingKeyId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust ROTATE signingKeyId does not match the new public key."
            );
        }
    }

    // ========================================================
    // ISSUER CONTRACT
    // ========================================================

    private static void validateIssuer(
        JSONObject value
    ) {

        requireOnlyKeys(
            value,
            "type",
            "issuerId",
            "signingKeyId"
        );

        if (
            !ISSUER_TYPE.equals(
                requireNonEmptyString(
                    value,
                    "type"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition issuer type is invalid."
            );
        }

        requireNonEmptyString(
            value,
            "issuerId"
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
                "FINORA recipient trust transition payload digest algorithm is invalid."
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
                "FINORA recipient trust transition payload digest structure is invalid."
            );
        }

        Map<String, Object> payloadMap =
            FinoraJsonBridge.toMap(
                payload
            );

        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                payloadMap
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
                "FINORA recipient trust transition payload digest does not match its payload."
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
                "FINORA recipient trust transition signature contract is invalid."
            );
        }

        String signatureSigningKeyId =
            requireNonEmptyString(
                signature,
                "signingKeyId"
            );

        String issuerSigningKeyId =
            requireNonEmptyString(
                issuer,
                "signingKeyId"
            );

        if (
            !issuerSigningKeyId.equals(
                signatureSigningKeyId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition issuer and signature signingKeyId values do not match."
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
                "FINORA recipient trust transition signature must be a 64-byte IEEE-P1363 P-256 signature."
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
            throw new UnsupportedOperationException(
                "FINORA recipient trust transition signer must use an EC P-256 public key."
            );
        }

        if (
            !Arrays.equals(
                der,
                publicKey.getEncoded()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition signer SPKI encoding is non-canonical."
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
            throw new UnsupportedOperationException(
                "FINORA recipient trust transition signer must use an EC P-256 public key."
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
    // PUBLIC-KEY FINGERPRINT / SIGNING KEY ID
    // ========================================================

    private static String createPublicKeyFingerprint(
        String publicKeySpkiDerBase64
    ) throws Exception {

        byte[] der =
            decodeStrictBase64(
                publicKeySpkiDerBase64
            );

        return toLowerHex(
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    der
                )
        );
    }

    private static String createSigningKeyId(
        String fingerprint
    ) {

        if (
            fingerprint == null ||
            !CANONICAL_SHA256
                .matcher(
                    fingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition signing-key fingerprint is invalid."
            );
        }

        return (
            "FINORA-KEY-" +
            fingerprint
                .substring(
                    0,
                    24
                )
                .toUpperCase(
                    Locale.ROOT
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
                "FINORA recipient trust transition Base64 value is invalid."
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
                "FINORA recipient trust transition Base64 value is invalid.",
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
                "FINORA recipient trust transition Base64 encoding is non-canonical."
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
                "FINORA recipient trust transition P-256 signature length is invalid."
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

        return toLowerHex(
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value.getBytes(
                        StandardCharsets.UTF_8
                    )
                )
        );
    }

    private static String toLowerHex(
        byte[] bytes
    ) {

        StringBuilder builder =
            new StringBuilder(
                bytes.length * 2
            );

        for (
            byte value :
            bytes
        ) {
            builder.append(
                Character.forDigit(
                    (value >>> 4) &
                    0x0f,
                    16
                )
            );

            builder.append(
                Character.forDigit(
                    value &
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
                "FINORA recipient trust transition timestamp is invalid: " +
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
                    "FINORA recipient trust transition contains an unsupported property: " +
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
                "FINORA recipient trust transition property is missing: " +
                key
            );
        }

        JSONObject object =
            value.optJSONObject(
                key
            );

        if (object == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition property " +
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
                "FINORA recipient trust transition property is missing: " +
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
                "FINORA recipient trust transition property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition property " +
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
                "FINORA recipient trust transition property " +
                key +
                " must not be empty."
            );
        }

        return result;
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
                "FINORA recipient trust transition property " +
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
                "FINORA recipient trust transition sequence is invalid."
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
                "FINORA recipient trust transition numeric property is missing: " +
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
                "FINORA recipient trust transition numeric property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust transition property " +
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
                "FINORA recipient trust transition property " +
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