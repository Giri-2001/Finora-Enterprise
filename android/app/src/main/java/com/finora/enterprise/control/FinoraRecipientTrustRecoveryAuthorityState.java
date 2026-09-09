package com.finora.enterprise.control;

import org.json.JSONObject;

import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
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
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST RECOVERY AUTHORITY STATE

   MODULE  : Control
   LAYER   : Native Recovery Public-Root Contract
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define strict persisted Recovery Authority public-root state
   - Bind recovery root to one exact native installation target
   - Validate independently provisioned public recovery authority
   - Validate P-256 SPKI public key
   - Validate SHA-256 SPKI public-key fingerprint
   - Validate canonical signingKeyId derived from fingerprint
   - Validate canonical provisionedAt timestamp
   - Parse and serialize strict versioned JSON state

   STATE:

   {
     schemaVersion: 1,
     installation: {
       installationId,
       bindingKeyId,
       fingerprintAlgorithm: "SHA-256",
       publicKeyFingerprint
     },
     authority: {
       type: "FINORA_RECOVERY_AUTHORITY",
       recoveryAuthorityId,
       signingKeyId,
       algorithm: "ECDSA_P256_SHA256",
       format: "SPKI_DER_BASE64",
       publicKey,
       fingerprintAlgorithm: "SHA-256",
       publicKeyFingerprint
     },
     provisionedAt
   }

   SECURITY:

   - PUBLIC recovery authority only.
   - No private signing key.
   - No signing.
   - No persistence.
   - No bootstrap mutation.
   - No operational recipient trust mutation.
   - No signed recovery verification.
   - No wall-clock observation.
   - No renderer / Capacitor API.
============================================================ */

public final class FinoraRecipientTrustRecoveryAuthorityState {

    // ========================================================
    // CONTRACT CONSTANTS
    // ========================================================

    public static final int SCHEMA_VERSION =
        1;

    public static final String AUTHORITY_TYPE =
        "FINORA_RECOVERY_AUTHORITY";

    public static final String SIGNATURE_ALGORITHM =
        "ECDSA_P256_SHA256";

    public static final String PUBLIC_KEY_FORMAT =
        "SPKI_DER_BASE64";

    public static final String FINGERPRINT_ALGORITHM =
        "SHA-256";

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
    // INSTALLATION
    // ========================================================

    public static final class Installation {

        public final String installationId;

        public final String bindingKeyId;

        public final String fingerprintAlgorithm;

        public final String publicKeyFingerprint;

        public Installation(
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
    // AUTHORITY
    // ========================================================

    public static final class Authority {

        public final String type;

        public final String recoveryAuthorityId;

        public final String signingKeyId;

        public final String algorithm;

        public final String format;

        public final String publicKey;

        public final String fingerprintAlgorithm;

        public final String publicKeyFingerprint;

        public Authority(
            String type,
            String recoveryAuthorityId,
            String signingKeyId,
            String algorithm,
            String format,
            String publicKey,
            String fingerprintAlgorithm,
            String publicKeyFingerprint
        ) {
            this.type =
                type;

            this.recoveryAuthorityId =
                recoveryAuthorityId;

            this.signingKeyId =
                signingKeyId;

            this.algorithm =
                algorithm;

            this.format =
                format;

            this.publicKey =
                publicKey;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;
        }
    }

    // ========================================================
    // STATE
    // ========================================================

    public static final class State {

        public final int schemaVersion;

        public final Installation installation;

        public final Authority authority;

        public final String provisionedAt;

        public State(
            int schemaVersion,
            Installation installation,
            Authority authority,
            String provisionedAt
        ) {
            this.schemaVersion =
                schemaVersion;

            this.installation =
                installation;

            this.authority =
                authority;

            this.provisionedAt =
                provisionedAt;
        }
    }

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    private FinoraRecipientTrustRecoveryAuthorityState() {
    }

    // ========================================================
    // PARSE
    // ========================================================

    public static State parse(
        String serializedState
    ) throws Exception {

        if (
            serializedState == null ||
            serializedState.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority state is empty."
            );
        }

        JSONObject root =
            new JSONObject(
                serializedState
            );

        requireOnlyKeys(
            root,
            "schemaVersion",
            "installation",
            "authority",
            "provisionedAt"
        );

        int schemaVersion =
            requireExactInteger(
                root,
                "schemaVersion",
                SCHEMA_VERSION
            );

        JSONObject installationJson =
            requireObject(
                root,
                "installation"
            );

        Installation installation =
            parseInstallation(
                installationJson
            );

        JSONObject authorityJson =
            requireObject(
                root,
                "authority"
            );

        Authority authority =
            parseAuthority(
                authorityJson
            );

        String provisionedAt =
            requireCanonicalTimestamp(
                root,
                "provisionedAt"
            );

        State state =
            new State(
                schemaVersion,
                installation,
                authority,
                provisionedAt
            );

        validate(
            state
        );

        return state;
    }

    // ========================================================
    // SERIALIZE
    // ========================================================

    public static String serialize(
        State state
    ) throws Exception {

        validate(
            state
        );

        JSONObject installation =
            new JSONObject();

        installation.put(
            "installationId",
            state.installation.installationId
        );

        installation.put(
            "bindingKeyId",
            state.installation.bindingKeyId
        );

        installation.put(
            "fingerprintAlgorithm",
            state.installation.fingerprintAlgorithm
        );

        installation.put(
            "publicKeyFingerprint",
            state.installation.publicKeyFingerprint
        );

        JSONObject authority =
            new JSONObject();

        authority.put(
            "type",
            state.authority.type
        );

        authority.put(
            "recoveryAuthorityId",
            state.authority.recoveryAuthorityId
        );

        authority.put(
            "signingKeyId",
            state.authority.signingKeyId
        );

        authority.put(
            "algorithm",
            state.authority.algorithm
        );

        authority.put(
            "format",
            state.authority.format
        );

        authority.put(
            "publicKey",
            state.authority.publicKey
        );

        authority.put(
            "fingerprintAlgorithm",
            state.authority.fingerprintAlgorithm
        );

        authority.put(
            "publicKeyFingerprint",
            state.authority.publicKeyFingerprint
        );

        JSONObject root =
            new JSONObject();

        root.put(
            "schemaVersion",
            state.schemaVersion
        );

        root.put(
            "installation",
            installation
        );

        root.put(
            "authority",
            authority
        );

        root.put(
            "provisionedAt",
            state.provisionedAt
        );

        return root.toString();
    }

    // ========================================================
    // VALIDATE
    // ========================================================

    public static void validate(
        State state
    ) throws Exception {

        if (state == null) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority state is required."
            );
        }

        if (
            state.schemaVersion !=
                SCHEMA_VERSION
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority state schemaVersion is unsupported."
            );
        }

        validateInstallation(
            state.installation
        );

        validateAuthority(
            state.authority
        );

        if (
            parseCanonicalTimestamp(
                state.provisionedAt
            ) ==
                null
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority provisionedAt is invalid."
            );
        }
    }

    // ========================================================
    // INSTALLATION PARSE / VALIDATE
    // ========================================================

    private static Installation parseInstallation(
        JSONObject value
    ) {

        requireOnlyKeys(
            value,
            "installationId",
            "bindingKeyId",
            "fingerprintAlgorithm",
            "publicKeyFingerprint"
        );

        Installation installation =
            new Installation(
                requireNonEmptyString(
                    value,
                    "installationId"
                ),
                requireNonEmptyString(
                    value,
                    "bindingKeyId"
                ),
                requireNonEmptyString(
                    value,
                    "fingerprintAlgorithm"
                ),
                requireNonEmptyString(
                    value,
                    "publicKeyFingerprint"
                )
            );

        validateInstallation(
            installation
        );

        return installation;
    }

    private static void validateInstallation(
        Installation installation
    ) {

        if (installation == null) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority installation binding is required."
            );
        }

        requireNonEmptyValue(
            installation.installationId,
            "installationId"
        );

        requireNonEmptyValue(
            installation.bindingKeyId,
            "bindingKeyId"
        );

        if (
            !FINGERPRINT_ALGORITHM.equals(
                installation.fingerprintAlgorithm
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority installation fingerprint algorithm is invalid."
            );
        }

        if (
            installation.publicKeyFingerprint ==
                null ||
            !CANONICAL_SHA256
                .matcher(
                    installation.publicKeyFingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority installation fingerprint is invalid."
            );
        }
    }

    // ========================================================
    // AUTHORITY PARSE / VALIDATE
    // ========================================================

    private static Authority parseAuthority(
        JSONObject value
    ) throws Exception {

        requireOnlyKeys(
            value,
            "type",
            "recoveryAuthorityId",
            "signingKeyId",
            "algorithm",
            "format",
            "publicKey",
            "fingerprintAlgorithm",
            "publicKeyFingerprint"
        );

        Authority authority =
            new Authority(
                requireNonEmptyString(
                    value,
                    "type"
                ),
                requireNonEmptyString(
                    value,
                    "recoveryAuthorityId"
                ),
                requireNonEmptyString(
                    value,
                    "signingKeyId"
                ),
                requireNonEmptyString(
                    value,
                    "algorithm"
                ),
                requireNonEmptyString(
                    value,
                    "format"
                ),
                requireNonEmptyString(
                    value,
                    "publicKey"
                ),
                requireNonEmptyString(
                    value,
                    "fingerprintAlgorithm"
                ),
                requireNonEmptyString(
                    value,
                    "publicKeyFingerprint"
                )
            );

        validateAuthority(
            authority
        );

        return authority;
    }

    private static void validateAuthority(
        Authority authority
    ) throws Exception {

        if (authority == null) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery authority is required."
            );
        }

        if (
            !AUTHORITY_TYPE.equals(
                authority.type
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority type is invalid."
            );
        }

        requireNonEmptyValue(
            authority.recoveryAuthorityId,
            "recoveryAuthorityId"
        );

        requireNonEmptyValue(
            authority.signingKeyId,
            "signingKeyId"
        );

        if (
            !SIGNATURE_ALGORITHM.equals(
                authority.algorithm
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority signing algorithm is invalid."
            );
        }

        if (
            !PUBLIC_KEY_FORMAT.equals(
                authority.format
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority public-key format is invalid."
            );
        }

        requireNonEmptyValue(
            authority.publicKey,
            "publicKey"
        );

        if (
            !FINGERPRINT_ALGORITHM.equals(
                authority.fingerprintAlgorithm
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority fingerprint algorithm is invalid."
            );
        }

        if (
            authority.publicKeyFingerprint ==
                null ||
            !CANONICAL_SHA256
                .matcher(
                    authority.publicKeyFingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority public-key fingerprint is invalid."
            );
        }

        byte[] publicKeyDer =
            decodeStrictBase64(
                authority.publicKey
            );

        PublicKey publicKey =
            decodeP256PublicKey(
                publicKeyDer
            );

        if (
            !Arrays.equals(
                publicKeyDer,
                publicKey.getEncoded()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority SPKI DER is non-canonical."
            );
        }

        String actualFingerprint =
            toLowerHex(
                MessageDigest
                    .getInstance(
                        "SHA-256"
                    )
                    .digest(
                        publicKeyDer
                    )
            );

        if (
            !authority.publicKeyFingerprint.equals(
                actualFingerprint
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority public-key fingerprint does not match its public key."
            );
        }

        String expectedSigningKeyId =
            createSigningKeyId(
                actualFingerprint
            );

        if (
            !authority.signingKeyId.equals(
                expectedSigningKeyId
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority signingKeyId does not match its public key."
            );
        }
    }

    // ========================================================
    // P-256 SPKI
    // ========================================================

    private static PublicKey decodeP256PublicKey(
        byte[] publicKeyDer
    ) throws Exception {

        if (
            publicKeyDer == null ||
            publicKeyDer.length == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority public key is empty."
            );
        }

        PublicKey publicKey =
            KeyFactory
                .getInstance(
                    "EC"
                )
                .generatePublic(
                    new X509EncodedKeySpec(
                        publicKeyDer
                    )
                );

        if (
            !(publicKey instanceof
                ECPublicKey)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority public key must use P-256."
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
                "FINORA recipient recovery-authority public key must use P-256."
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
                "FINORA recipient recovery-authority Base64 value is invalid."
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
                "FINORA recipient recovery-authority Base64 value is invalid.",
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
                "FINORA recipient recovery-authority Base64 encoding is non-canonical."
            );
        }

        return decoded;
    }

    // ========================================================
    // SIGNING KEY ID
    // ========================================================

    public static String createSigningKeyId(
        String publicKeyFingerprint
    ) {

        if (
            publicKeyFingerprint == null ||
            !CANONICAL_SHA256
                .matcher(
                    publicKeyFingerprint
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority fingerprint is invalid."
            );
        }

        return (
            "FINORA-KEY-" +
            publicKeyFingerprint
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
    // PUBLIC-KEY FINGERPRINT
    // ========================================================

    public static String createPublicKeyFingerprint(
        String publicKeySpkiDerBase64
    ) throws Exception {

        byte[] der =
            decodeStrictBase64(
                publicKeySpkiDerBase64
            );

        decodeP256PublicKey(
            der
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
                "FINORA recipient recovery-authority timestamp is invalid: " +
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
                    "FINORA recipient recovery-authority state contains an unsupported property: " +
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
                "FINORA recipient recovery-authority property is missing: " +
                key
            );
        }

        JSONObject object =
            value.optJSONObject(
                key
            );

        if (object == null) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority property " +
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
                "FINORA recipient recovery-authority property is missing: " +
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
                "FINORA recipient recovery-authority property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority property " +
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
                "FINORA recipient recovery-authority property " +
                key +
                " must not be empty."
            );
        }

        return result;
    }

    private static int requireExactInteger(
        JSONObject value,
        String key,
        int expected
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
                "FINORA recipient recovery-authority numeric property is missing: " +
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
                "FINORA recipient recovery-authority numeric property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority property " +
                key +
                " must be an integer."
            );
        }

        int actual =
            ((Number) raw)
                .intValue();

        if (
            actual !=
                expected ||
            Double.compare(
                ((Number) raw).doubleValue(),
                (double) expected
            ) !=
                0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority schemaVersion is unsupported."
            );
        }

        return actual;
    }

    private static void requireNonEmptyValue(
        String value,
        String field
    ) {

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient recovery-authority field is invalid: " +
                field
            );
        }
    }

    // ========================================================
    // HEX
    // ========================================================

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
}

/* ============================================================
   END
============================================================ */