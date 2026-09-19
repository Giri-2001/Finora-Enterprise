package com.finora.enterprise.control;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * FINORA ENTERPRISE OS
 * PORTABLE BRANCH AUTH V1 OUTER ENVELOPE CODEC
 *
 * Responsibilities:
 * - strict JSON parsing;
 * - exact-key validation;
 * - canonical metadata validation;
 * - canonical Base64 validation;
 * - canonical FINORA creation-order serialization.
 *
 * Explicitly excluded:
 * - SCRYPT execution;
 * - AES-GCM encryption/decryption;
 * - Password / Security Code decisions;
 * - persistence;
 * - IPC;
 * - renderer access.
 */
public final class FinoraPortableBranchAuthEnvelopeCodec {

    private static final Pattern CANONICAL_BASE64 =
        Pattern.compile(
            "^[A-Za-z0-9+/]+={0,2}$"
        );

    private FinoraPortableBranchAuthEnvelopeCodec() {
    }

    public static final class Scope {

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public Scope(
            String ownerId,
            String businessId,
            String branchId
        ) {
            this.ownerId = ownerId;
            this.businessId = businessId;
            this.branchId = branchId;
        }
    }

    public static class FactorKdf {

        public final String algorithm;
        public final String salt;
        public final int N;
        public final int r;
        public final int p;
        public final int derivedKeyLength;

        public FactorKdf(
            String algorithm,
            String salt,
            int N,
            int r,
            int p,
            int derivedKeyLength
        ) {
            this.algorithm = algorithm;
            this.salt = salt;
            this.N = N;
            this.r = r;
            this.p = p;
            this.derivedKeyLength =
                derivedKeyLength;
        }
    }

    public static final class Verifier
        extends FactorKdf {

        public final int verifierLength;
        public final String verifier;

        public Verifier(
            String algorithm,
            String salt,
            int N,
            int r,
            int p,
            int derivedKeyLength,
            int verifierLength,
            String verifier
        ) {
            super(
                algorithm,
                salt,
                N,
                r,
                p,
                derivedKeyLength
            );

            this.verifierLength =
                verifierLength;

            this.verifier =
                verifier;
        }
    }

    public static final class Encryption {

        public final String algorithm;
        public final String keyDerivation;
        public final String iv;
        public final String authTag;

        public Encryption(
            String algorithm,
            String keyDerivation,
            String iv,
            String authTag
        ) {
            this.algorithm = algorithm;
            this.keyDerivation = keyDerivation;
            this.iv = iv;
            this.authTag = authTag;
        }
    }

    public static final class Envelope {

        public final String format;
        public final int schemaVersion;
        public final String canonicalUsername;
        public final Scope branchScope;
        public final Verifier passwordFactor;
        public final FactorKdf securityFactor;
        public final Encryption encryption;
        public final String ciphertext;

        public Envelope(
            String format,
            int schemaVersion,
            String canonicalUsername,
            Scope branchScope,
            Verifier passwordFactor,
            FactorKdf securityFactor,
            Encryption encryption,
            String ciphertext
        ) {
            this.format = format;
            this.schemaVersion = schemaVersion;
            this.canonicalUsername =
                canonicalUsername;
            this.branchScope = branchScope;
            this.passwordFactor =
                passwordFactor;
            this.securityFactor =
                securityFactor;
            this.encryption = encryption;
            this.ciphertext = ciphertext;
        }
    }

    public static Envelope parse(
        String serialized
    ) {
        if (
            serialized == null ||
            serialized.length() == 0
        ) {
            throw invalid(
                "Portable Branch Auth envelope is empty."
            );
        }

        final JSONObject root;

        try {
            root =
                new JSONObject(
                    serialized
                );
        }
        catch (JSONException error) {
            throw invalid(
                "Portable Branch Auth envelope is not valid JSON."
            );
        }

        requireExactKeys(
            root,
            "portableBranchAuthEnvelope",
            "format",
            "schemaVersion",
            "canonicalUsername",
            "branchScope",
            "passwordFactor",
            "securityFactor",
            "encryption",
            "ciphertext"
        );

        String format =
            requireString(
                root,
                "format"
            );

        if (
            !FinoraPortableBranchAuthContract.FORMAT.equals(
                format
            )
        ) {
            throw invalid(
                "Portable Branch Auth format is invalid."
            );
        }

        int schemaVersion =
            requireExactInteger(
                root,
                "schemaVersion"
            );

        if (
            schemaVersion !=
            FinoraPortableBranchAuthContract.SCHEMA_VERSION
        ) {
            throw invalid(
                "Portable Branch Auth schemaVersion is unsupported."
            );
        }

        String canonicalUsername =
            requireCanonicalString(
                root,
                "canonicalUsername",
                256
            );

        if (
            !canonicalUsername.equals(
                canonicalUsername.toLowerCase(
                    Locale.ROOT
                )
            )
        ) {
            throw invalid(
                "canonicalUsername must be lower-case canonical form."
            );
        }

        Scope scope =
            parseScope(
                requireObject(
                    root,
                    "branchScope"
                )
            );

        Verifier passwordFactor =
            parseVerifier(
                requireObject(
                    root,
                    "passwordFactor"
                ),
                "passwordFactor"
            );

        FactorKdf securityFactor =
            parseFactor(
                requireObject(
                    root,
                    "securityFactor"
                ),
                "securityFactor"
            );

        Encryption encryption =
            parseEncryption(
                requireObject(
                    root,
                    "encryption"
                )
            );

        String ciphertext =
            requireString(
                root,
                "ciphertext"
            );

        byte[] ciphertextBytes =
            decodeCanonicalBase64(
                ciphertext,
                "ciphertext"
            );

        if (
            ciphertextBytes.length >
            FinoraPortableBranchAuthContract.MAX_CIPHERTEXT_BYTES
        ) {
            throw invalid(
                "Portable Branch Auth ciphertext exceeds maximum size."
            );
        }

        Envelope envelope =
            new Envelope(
                format,
                schemaVersion,
                canonicalUsername,
                scope,
                passwordFactor,
                securityFactor,
                encryption,
                ciphertext
            );

        validate(
            envelope
        );

        return envelope;
    }

    public static String serialize(
        Envelope envelope
    ) {
        validate(
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

        appendEncryption(
            output,
            envelope.encryption
        );

        output.append(',');

        appendName(
            output,
            "ciphertext"
        );

        appendJsonString(
            output,
            envelope.ciphertext
        );

        output.append('}');

        return output.toString();
    }

    public static void validate(
        Envelope envelope
    ) {
        if (envelope == null) {
            throw invalid(
                "Portable Branch Auth envelope is required."
            );
        }

        if (
            !FinoraPortableBranchAuthContract.FORMAT.equals(
                envelope.format
            )
        ) {
            throw invalid(
                "Portable Branch Auth format is invalid."
            );
        }

        if (
            envelope.schemaVersion !=
            FinoraPortableBranchAuthContract.SCHEMA_VERSION
        ) {
            throw invalid(
                "Portable Branch Auth schemaVersion is unsupported."
            );
        }

        validateCanonicalString(
            envelope.canonicalUsername,
            "canonicalUsername",
            256
        );

        if (
            !envelope.canonicalUsername.equals(
                envelope.canonicalUsername.toLowerCase(
                    Locale.ROOT
                )
            )
        ) {
            throw invalid(
                "canonicalUsername must be lower-case canonical form."
            );
        }

        validateScope(
            envelope.branchScope
        );

        validateVerifier(
            envelope.passwordFactor,
            "passwordFactor"
        );

        validateFactor(
            envelope.securityFactor,
            "securityFactor"
        );

        validateEncryption(
            envelope.encryption
        );

        byte[] ciphertext =
            decodeCanonicalBase64(
                envelope.ciphertext,
                "ciphertext"
            );

        if (
            ciphertext.length >
            FinoraPortableBranchAuthContract.MAX_CIPHERTEXT_BYTES
        ) {
            throw invalid(
                "Portable Branch Auth ciphertext exceeds maximum size."
            );
        }
    }

    private static Scope parseScope(
        JSONObject value
    ) {
        requireExactKeys(
            value,
            "branchScope",
            "ownerId",
            "businessId",
            "branchId"
        );

        Scope scope =
            new Scope(
                requireCanonicalString(
                    value,
                    "ownerId",
                    256
                ),
                requireCanonicalString(
                    value,
                    "businessId",
                    256
                ),
                requireCanonicalString(
                    value,
                    "branchId",
                    256
                )
            );

        validateScope(
            scope
        );

        return scope;
    }

    private static FactorKdf parseFactor(
        JSONObject value,
        String label
    ) {
        requireExactKeys(
            value,
            label,
            "algorithm",
            "salt",
            "N",
            "r",
            "p",
            "derivedKeyLength"
        );

        FactorKdf factor =
            new FactorKdf(
                requireString(
                    value,
                    "algorithm"
                ),
                requireString(
                    value,
                    "salt"
                ),
                requireExactInteger(
                    value,
                    "N"
                ),
                requireExactInteger(
                    value,
                    "r"
                ),
                requireExactInteger(
                    value,
                    "p"
                ),
                requireExactInteger(
                    value,
                    "derivedKeyLength"
                )
            );

        validateFactor(
            factor,
            label
        );

        return factor;
    }

    private static Verifier parseVerifier(
        JSONObject value,
        String label
    ) {
        requireExactKeys(
            value,
            label,
            "algorithm",
            "salt",
            "N",
            "r",
            "p",
            "derivedKeyLength",
            "verifierLength",
            "verifier"
        );

        Verifier verifier =
            new Verifier(
                requireString(
                    value,
                    "algorithm"
                ),
                requireString(
                    value,
                    "salt"
                ),
                requireExactInteger(
                    value,
                    "N"
                ),
                requireExactInteger(
                    value,
                    "r"
                ),
                requireExactInteger(
                    value,
                    "p"
                ),
                requireExactInteger(
                    value,
                    "derivedKeyLength"
                ),
                requireExactInteger(
                    value,
                    "verifierLength"
                ),
                requireString(
                    value,
                    "verifier"
                )
            );

        validateVerifier(
            verifier,
            label
        );

        return verifier;
    }

    private static Encryption parseEncryption(
        JSONObject value
    ) {
        requireExactKeys(
            value,
            "encryption",
            "algorithm",
            "keyDerivation",
            "iv",
            "authTag"
        );

        Encryption encryption =
            new Encryption(
                requireString(
                    value,
                    "algorithm"
                ),
                requireString(
                    value,
                    "keyDerivation"
                ),
                requireString(
                    value,
                    "iv"
                ),
                requireString(
                    value,
                    "authTag"
                )
            );

        validateEncryption(
            encryption
        );

        return encryption;
    }

    private static void validateScope(
        Scope scope
    ) {
        if (scope == null) {
            throw invalid(
                "branchScope must be an object."
            );
        }

        validateCanonicalString(
            scope.ownerId,
            "branchScope.ownerId",
            256
        );

        validateCanonicalString(
            scope.businessId,
            "branchScope.businessId",
            256
        );

        validateCanonicalString(
            scope.branchId,
            "branchScope.branchId",
            256
        );
    }

    private static void validateFactor(
        FactorKdf factor,
        String label
    ) {
        if (factor == null) {
            throw invalid(
                label + " must be an object."
            );
        }

        if (
            !FinoraPortableBranchAuthContract.KDF_ALGORITHM.equals(
                factor.algorithm
            )
        ) {
            throw invalid(
                label + ".algorithm is invalid."
            );
        }

        assertBase64Length(
            factor.salt,
            FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
            label + ".salt"
        );

        if (
            factor.N !=
                FinoraPortableBranchAuthContract.SCRYPT_N ||
            factor.r !=
                FinoraPortableBranchAuthContract.SCRYPT_R ||
            factor.p !=
                FinoraPortableBranchAuthContract.SCRYPT_P ||
            factor.derivedKeyLength !=
                FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES
        ) {
            throw invalid(
                label + " contains unsupported SCRYPT parameters."
            );
        }
    }

    private static void validateVerifier(
        Verifier verifier,
        String label
    ) {
        validateFactor(
            verifier,
            label
        );

        if (
            verifier.verifierLength !=
            FinoraPortableBranchAuthContract.VERIFIER_BYTES
        ) {
            throw invalid(
                label + ".verifierLength is invalid."
            );
        }

        assertBase64Length(
            verifier.verifier,
            FinoraPortableBranchAuthContract.VERIFIER_BYTES,
            label + ".verifier"
        );
    }

    private static void validateEncryption(
        Encryption encryption
    ) {
        if (encryption == null) {
            throw invalid(
                "encryption must be an object."
            );
        }

        if (
            !FinoraPortableBranchAuthContract.ENCRYPTION_ALGORITHM.equals(
                encryption.algorithm
            ) ||
            !FinoraPortableBranchAuthContract.KEY_DERIVATION.equals(
                encryption.keyDerivation
            )
        ) {
            throw invalid(
                "Portable Branch Auth encryption metadata is unsupported."
            );
        }

        assertBase64Length(
            encryption.iv,
            FinoraPortableBranchAuthContract.IV_BYTES,
            "encryption.iv"
        );

        assertBase64Length(
            encryption.authTag,
            FinoraPortableBranchAuthContract.TAG_BYTES,
            "encryption.authTag"
        );
    }

    private static void requireExactKeys(
        JSONObject object,
        String label,
        String... requiredKeys
    ) {
        Set<String> required =
            new HashSet<>(
                Arrays.asList(
                    requiredKeys
                )
            );

        for (String key : requiredKeys) {

            if (!object.has(key)) {
                throw invalid(
                    label +
                    " is missing " +
                    key +
                    "."
                );
            }
        }

        Iterator<String> keys =
            object.keys();

        while (keys.hasNext()) {

            String actual =
                keys.next();

            if (!required.contains(actual)) {
                throw invalid(
                    label +
                    " contains unsupported field " +
                    actual +
                    "."
                );
            }
        }
    }

    private static JSONObject requireObject(
        JSONObject parent,
        String key
    ) {
        Object value =
            getRequired(
                parent,
                key
            );

        if (!(value instanceof JSONObject)) {
            throw invalid(
                key + " must be an object."
            );
        }

        return (JSONObject) value;
    }

    private static String requireString(
        JSONObject parent,
        String key
    ) {
        Object value =
            getRequired(
                parent,
                key
            );

        if (!(value instanceof String)) {
            throw invalid(
                key + " must be a string."
            );
        }

        return (String) value;
    }

    private static String requireCanonicalString(
        JSONObject parent,
        String key,
        int maximumLength
    ) {
        String value =
            requireString(
                parent,
                key
            );

        validateCanonicalString(
            value,
            key,
            maximumLength
        );

        return value;
    }

    private static void validateCanonicalString(
        String value,
        String label,
        int maximumLength
    ) {
        if (
            value == null ||
            value.length() == 0 ||
            value.length() > maximumLength ||
            hasEcmaTrimWhitespaceAtBoundary(
                value
            )
        ) {
            throw invalid(
                label +
                " must be a non-empty canonical string."
            );
        }
    }

    private static int requireExactInteger(
        JSONObject parent,
        String key
    ) {
        Object value =
            getRequired(
                parent,
                key
            );

        if (
            !(value instanceof Integer) &&
            !(value instanceof Long)
        ) {
            throw invalid(
                key + " must be an integer."
            );
        }

        long numeric =
            ((Number) value).longValue();

        if (
            numeric <
                Integer.MIN_VALUE ||
            numeric >
                Integer.MAX_VALUE
        ) {
            throw invalid(
                key + " is outside integer range."
            );
        }

        return (int) numeric;
    }

    private static Object getRequired(
        JSONObject parent,
        String key
    ) {
        try {
            Object value =
                parent.get(
                    key
                );

            if (
                value == null ||
                value == JSONObject.NULL
            ) {
                throw invalid(
                    key + " is required."
                );
            }

            return value;
        }
        catch (JSONException error) {
            throw invalid(
                key + " is required."
            );
        }
    }

    private static void assertBase64Length(
        String value,
        int expectedBytes,
        String label
    ) {
        byte[] decoded =
            decodeCanonicalBase64(
                value,
                label
            );

        if (
            decoded.length !=
            expectedBytes
        ) {
            throw invalid(
                label +
                " has invalid byte length."
            );
        }
    }

    private static byte[] decodeCanonicalBase64(
        String value,
        String label
    ) {
        if (
            value == null ||
            value.length() == 0 ||
            !CANONICAL_BASE64.matcher(
                value
            ).matches()
        ) {
            throw invalid(
                label +
                " must be canonical base64."
            );
        }

        final byte[] decoded;

        try {
            decoded =
                Base64.getDecoder().decode(
                    value
                );
        }
        catch (IllegalArgumentException error) {
            throw invalid(
                label +
                " must be canonical base64."
            );
        }

        String canonical =
            Base64.getEncoder()
                .encodeToString(
                    decoded
                );

        if (!canonical.equals(value)) {
            throw invalid(
                label +
                " must be canonical base64."
            );
        }

        return decoded;
    }

    private static boolean hasEcmaTrimWhitespaceAtBoundary(
        String value
    ) {
        int first =
            value.codePointAt(
                0
            );

        int last =
            value.codePointBefore(
                value.length()
            );

        return isEcmaTrimWhitespace(first) ||
            isEcmaTrimWhitespace(last);
    }

    private static boolean isEcmaTrimWhitespace(
        int codePoint
    ) {
        switch (codePoint) {

            case 0x0009:
            case 0x000A:
            case 0x000B:
            case 0x000C:
            case 0x000D:
            case 0x0020:
            case 0x00A0:
            case 0x1680:
            case 0x2028:
            case 0x2029:
            case 0x202F:
            case 0x205F:
            case 0x3000:
            case 0xFEFF:
                return true;

            default:
                return (
                    codePoint >= 0x2000 &&
                    codePoint <= 0x200A
                );
        }
    }

    private static void appendScope(
        StringBuilder output,
        Scope scope
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
        FactorKdf factor
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
        Verifier verifier
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

    private static void appendEncryption(
        StringBuilder output,
        Encryption encryption
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

        output.append(',');

        appendName(
            output,
            "authTag"
        );

        appendJsonString(
            output,
            encryption.authTag
        );

        output.append('}');
    }

    private static void appendName(
        StringBuilder output,
        String name
    ) {
        appendJsonString(
            output,
            name
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

    private static IllegalArgumentException invalid(
        String message
    ) {
        return new IllegalArgumentException(
            message
        );
    }
}