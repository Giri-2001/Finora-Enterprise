package com.finora.enterprise.control;

import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Android recipient-local Branch Credential contract.
 *
 * Security boundary:
 * - contains login verifier state only;
 * - never contains plaintext Password or Security Code;
 * - Password and Security Code verifiers remain independent;
 * - Portable Auth 64-byte KDF material is never persisted here;
 * - only the Portable Auth verifier bytes are projected into the
 *   32-byte Control Credential derivedKey field;
 * - exact-key parsing rejects unexpected/plaintext fields.
 *
 * Persistence is intentionally NOT owned by this class.
 */
public final class FinoraBranchCredentialContract {

    public static final int SCHEMA_VERSION =
        1;

    public static final long INITIAL_AUTH_GENERATION =
        1L;

    public static final String STATUS_ACTIVE =
        "ACTIVE";

    public static final String STORAGE_MODE_LOCAL =
        "LOCAL";

    public static final String STORAGE_MODE_USB =
        "USB";

    public static final String DATA_CONTEXT_REAL =
        "REAL";

    public static final String DATA_CONTEXT_DEMO =
        "DEMO";

    public static final String ROLE_ADMIN =
        "ADMIN";

    public static final String ROLE_MANAGER =
        "MANAGER";

    public static final String ROLE_COLLECTOR =
        "COLLECTOR";

    public static final String ROLE_VIEWER =
        "VIEWER";

    public static final String SALT_ENCODING =
        "BASE64";

    public static final String DERIVED_KEY_ENCODING =
        "BASE64";

    private FinoraBranchCredentialContract() {
    }

    public static final class Verifier {

        public final String algorithm;

        public final String saltEncoding;

        public final String salt;

        public final String derivedKeyEncoding;

        public final String derivedKey;

        public final int keyLength;

        public final int N;

        public final int r;

        public final int p;

        Verifier(
            String algorithm,
            String saltEncoding,
            String salt,
            String derivedKeyEncoding,
            String derivedKey,
            int keyLength,
            int N,
            int r,
            int p
        ) {
            this.algorithm =
                algorithm;

            this.saltEncoding =
                saltEncoding;

            this.salt =
                salt;

            this.derivedKeyEncoding =
                derivedKeyEncoding;

            this.derivedKey =
                derivedKey;

            this.keyLength =
                keyLength;

            this.N =
                N;

            this.r =
                r;

            this.p =
                p;
        }
    }

    public static final class Credential {

        public final String credentialId;

        public final String sourceAuthorizationId;

        /**
         * Nullable only for historical compatibility.
         * Modern Android credential creation must persist it.
         */
        public final Long authGeneration;

        public final String userId;

        public final String username;

        public final String canonicalUsername;

        public final String fullName;

        public final String role;

        public final String ownerId;

        public final String businessId;

        public final String branchId;

        public final String storageMode;

        public final String dataContext;

        public final String demoId;

        public final String status;

        public final Verifier verifier;

        /**
         * Nullable only for historical compatibility.
         * Modern Android credential creation must persist it.
         */
        public final Verifier securityVerifier;

        public final String createdAt;

        public final String updatedAt;

        public final int schemaVersion;

        public Credential(
            String credentialId,
            String sourceAuthorizationId,
            Long authGeneration,
            String userId,
            String username,
            String canonicalUsername,
            String fullName,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            String status,
            Verifier verifier,
            Verifier securityVerifier,
            String createdAt,
            String updatedAt,
            int schemaVersion
        ) {
            this.credentialId =
                credentialId;

            this.sourceAuthorizationId =
                sourceAuthorizationId;

            this.authGeneration =
                authGeneration;

            this.userId =
                userId;

            this.username =
                username;

            this.canonicalUsername =
                canonicalUsername;

            this.fullName =
                fullName;

            this.role =
                role;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.status =
                status;

            this.verifier =
                verifier;

            this.securityVerifier =
                securityVerifier;

            this.createdAt =
                createdAt;

            this.updatedAt =
                updatedAt;

            this.schemaVersion =
                schemaVersion;
        }
    }

    /**
     * Windows parity projection:
     *
     * Portable Auth derives larger secret material for encryption,
     * but its verifier field contains the fixed verifier bytes used
     * for credential verification. Only those verifier bytes become
     * the Control Credential derivedKey.
     */
    public static Verifier projectPortableVerifier(
        FinoraPortableBranchAuthPayloadCodec.Verifier portableVerifier
    ) {

        if (portableVerifier == null) {
            throw invalid(
                "Portable Branch Auth verifier is required."
            );
        }

        return projectPortableVerifierValues(
            portableVerifier.algorithm,
            portableVerifier.salt,
            portableVerifier.N,
            portableVerifier.r,
            portableVerifier.p,
            portableVerifier.derivedKeyLength,
            portableVerifier.verifierLength,
            portableVerifier.verifier
        );
    }

    static Verifier projectPortableVerifierValues(
        String algorithm,
        String salt,
        int N,
        int r,
        int p,
        int portableDerivedKeyLength,
        int portableVerifierLength,
        String portableVerifier
    ) {

        if (
            !FinoraPortableBranchAuthContract.KDF_ALGORITHM.equals(
                algorithm
            ) ||
            N != FinoraPortableBranchAuthContract.SCRYPT_N ||
            r != FinoraPortableBranchAuthContract.SCRYPT_R ||
            p != FinoraPortableBranchAuthContract.SCRYPT_P ||
            portableDerivedKeyLength !=
                FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES ||
            portableVerifierLength !=
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
        ) {
            throw invalid(
                "Portable Branch Auth verifier KDF metadata is invalid."
            );
        }

        assertCanonicalBase64Bytes(
            salt,
            FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
            "Portable Branch Auth verifier salt"
        );

        assertCanonicalBase64Bytes(
            portableVerifier,
            FinoraPortableBranchAuthContract.VERIFIER_BYTES,
            "Portable Branch Auth verifier"
        );

        Verifier result =
            new Verifier(
                FinoraPortableBranchAuthContract.KDF_ALGORITHM,
                SALT_ENCODING,
                salt,
                DERIVED_KEY_ENCODING,
                portableVerifier,
                FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                FinoraPortableBranchAuthContract.SCRYPT_N,
                FinoraPortableBranchAuthContract.SCRYPT_R,
                FinoraPortableBranchAuthContract.SCRYPT_P
            );

        validateVerifier(
            result
        );

        return result;
    }

    public static long resolveAuthGeneration(
        Credential credential
    ) {

        if (credential == null) {
            throw invalid(
                "Branch Credential is required."
            );
        }

        return credential.authGeneration == null
            ? INITIAL_AUTH_GENERATION
            : credential.authGeneration.longValue();
    }

    public static void validate(
        Credential credential
    ) {

        if (credential == null) {
            throw invalid(
                "Branch Credential is required."
            );
        }

        if (credential.schemaVersion != SCHEMA_VERSION) {
            throw invalid(
                "Branch Credential schemaVersion is invalid."
            );
        }

        requireNonEmpty(
            credential.credentialId,
            "credentialId"
        );

        requireNonEmpty(
            credential.sourceAuthorizationId,
            "sourceAuthorizationId"
        );

        if (
            credential.authGeneration != null &&
            credential.authGeneration.longValue() <= 0L
        ) {
            throw invalid(
                "Branch Credential authGeneration must be positive."
            );
        }

        requireNonEmpty(
            credential.userId,
            "userId"
        );

        requireNonEmpty(
            credential.username,
            "username"
        );

        requireNonEmpty(
            credential.canonicalUsername,
            "canonicalUsername"
        );

        if (
            !credential.canonicalUsername.equals(
                canonicalizeUsername(
                    credential.username
                )
            )
        ) {
            throw invalid(
                "Branch Credential canonicalUsername does not match canonical username."
            );
        }

        requireNonEmpty(
            credential.fullName,
            "fullName"
        );

        if (!isAllowedRole(credential.role)) {
            throw invalid(
                "Branch Credential role is invalid."
            );
        }

        requireNonEmpty(
            credential.ownerId,
            "ownerId"
        );

        requireNonEmpty(
            credential.businessId,
            "businessId"
        );

        requireNonEmpty(
            credential.branchId,
            "branchId"
        );

        if (
            !STORAGE_MODE_LOCAL.equals(
                credential.storageMode
            ) &&
            !STORAGE_MODE_USB.equals(
                credential.storageMode
            )
        ) {
            throw invalid(
                "Branch Credential storageMode must be LOCAL or USB."
            );
        }

        if (
            !DATA_CONTEXT_REAL.equals(
                credential.dataContext
            ) &&
            !DATA_CONTEXT_DEMO.equals(
                credential.dataContext
            )
        ) {
            throw invalid(
                "Branch Credential dataContext must be REAL or DEMO."
            );
        }

        if (
            DATA_CONTEXT_REAL.equals(
                credential.dataContext
            )
        ) {
            if (credential.demoId != null) {
                throw invalid(
                    "Branch Credential demoId is not allowed for REAL data context."
                );
            }
        }
        else {
            requireNonEmpty(
                credential.demoId,
                "demoId"
            );
        }

        if (!STATUS_ACTIVE.equals(credential.status)) {
            throw invalid(
                "Branch Credential status must be ACTIVE."
            );
        }

        validateVerifier(
            credential.verifier
        );

        if (credential.securityVerifier != null) {
            validateVerifier(
                credential.securityVerifier
            );
        }

        if (!isControlTimestamp(credential.createdAt)) {
            throw invalid(
                "Branch Credential createdAt is not a valid timestamp."
            );
        }

        if (!isControlTimestamp(credential.updatedAt)) {
            throw invalid(
                "Branch Credential updatedAt is not a valid timestamp."
            );
        }
    }

    public static String serialize(
        Credential credential
    ) {

        validate(
            credential
        );

        JSONObject root =
            new JSONObject();

        try {
            root.put(
                "credentialId",
                credential.credentialId
            );

            root.put(
                "sourceAuthorizationId",
                credential.sourceAuthorizationId
            );

            if (credential.authGeneration != null) {
                root.put(
                    "authGeneration",
                    credential.authGeneration.longValue()
                );
            }

            root.put(
                "userId",
                credential.userId
            );

            root.put(
                "username",
                credential.username
            );

            root.put(
                "canonicalUsername",
                credential.canonicalUsername
            );

            root.put(
                "fullName",
                credential.fullName
            );

            root.put(
                "role",
                credential.role
            );

            root.put(
                "ownerId",
                credential.ownerId
            );

            root.put(
                "businessId",
                credential.businessId
            );

            root.put(
                "branchId",
                credential.branchId
            );

            root.put(
                "storageMode",
                credential.storageMode
            );

            root.put(
                "dataContext",
                credential.dataContext
            );

            if (credential.demoId != null) {
                root.put(
                    "demoId",
                    credential.demoId
                );
            }

            root.put(
                "status",
                credential.status
            );

            root.put(
                "verifier",
                serializeVerifier(
                    credential.verifier
                )
            );

            if (credential.securityVerifier != null) {
                root.put(
                    "securityVerifier",
                    serializeVerifier(
                        credential.securityVerifier
                    )
                );
            }

            root.put(
                "createdAt",
                credential.createdAt
            );

            root.put(
                "updatedAt",
                credential.updatedAt
            );

            root.put(
                "schemaVersion",
                credential.schemaVersion
            );

            return root.toString();
        }
        catch (JSONException error) {
            throw invalid(
                "Unable to serialize Branch Credential.",
                error
            );
        }
    }

    public static Credential parse(
        String serialized
    ) {

        if (
            serialized == null ||
            serialized.length() == 0
        ) {
            throw invalid(
                "Branch Credential serialized data is required."
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
                "Branch Credential is not valid JSON.",
                error
            );
        }

        requireExactKeys(
            root,
            new String[] {
                "credentialId",
                "sourceAuthorizationId",
                "userId",
                "username",
                "canonicalUsername",
                "fullName",
                "role",
                "ownerId",
                "businessId",
                "branchId",
                "storageMode",
                "dataContext",
                "status",
                "verifier",
                "createdAt",
                "updatedAt",
                "schemaVersion"
            },
            new String[] {
                "authGeneration",
                "demoId",
                "securityVerifier"
            },
            "Branch Credential"
        );

        Credential credential =
            new Credential(
                requireString(
                    root,
                    "credentialId"
                ),
                requireString(
                    root,
                    "sourceAuthorizationId"
                ),
                optionalPositiveLong(
                    root,
                    "authGeneration"
                ),
                requireString(
                    root,
                    "userId"
                ),
                requireString(
                    root,
                    "username"
                ),
                requireString(
                    root,
                    "canonicalUsername"
                ),
                requireString(
                    root,
                    "fullName"
                ),
                requireString(
                    root,
                    "role"
                ),
                requireString(
                    root,
                    "ownerId"
                ),
                requireString(
                    root,
                    "businessId"
                ),
                requireString(
                    root,
                    "branchId"
                ),
                requireString(
                    root,
                    "storageMode"
                ),
                requireString(
                    root,
                    "dataContext"
                ),
                optionalString(
                    root,
                    "demoId"
                ),
                requireString(
                    root,
                    "status"
                ),
                parseVerifier(
                    requireObject(
                        root,
                        "verifier"
                    )
                ),
                root.has(
                    "securityVerifier"
                )
                    ? parseVerifier(
                        requireObject(
                            root,
                            "securityVerifier"
                        )
                    )
                    : null,
                requireString(
                    root,
                    "createdAt"
                ),
                requireString(
                    root,
                    "updatedAt"
                ),
                requireInt(
                    root,
                    "schemaVersion"
                )
            );

        validate(
            credential
        );

        return credential;
    }

    private static JSONObject serializeVerifier(
        Verifier verifier
    )
        throws JSONException {

        validateVerifier(
            verifier
        );

        JSONObject result =
            new JSONObject();

        result.put(
            "algorithm",
            verifier.algorithm
        );

        result.put(
            "saltEncoding",
            verifier.saltEncoding
        );

        result.put(
            "salt",
            verifier.salt
        );

        result.put(
            "derivedKeyEncoding",
            verifier.derivedKeyEncoding
        );

        result.put(
            "derivedKey",
            verifier.derivedKey
        );

        result.put(
            "keyLength",
            verifier.keyLength
        );

        result.put(
            "N",
            verifier.N
        );

        result.put(
            "r",
            verifier.r
        );

        result.put(
            "p",
            verifier.p
        );

        return result;
    }

    private static Verifier parseVerifier(
        JSONObject value
    ) {

        requireExactKeys(
            value,
            new String[] {
                "algorithm",
                "saltEncoding",
                "salt",
                "derivedKeyEncoding",
                "derivedKey",
                "keyLength",
                "N",
                "r",
                "p"
            },
            new String[0],
            "Branch Credential verifier"
        );

        Verifier verifier =
            new Verifier(
                requireString(
                    value,
                    "algorithm"
                ),
                requireString(
                    value,
                    "saltEncoding"
                ),
                requireString(
                    value,
                    "salt"
                ),
                requireString(
                    value,
                    "derivedKeyEncoding"
                ),
                requireString(
                    value,
                    "derivedKey"
                ),
                requireInt(
                    value,
                    "keyLength"
                ),
                requireInt(
                    value,
                    "N"
                ),
                requireInt(
                    value,
                    "r"
                ),
                requireInt(
                    value,
                    "p"
                )
            );

        validateVerifier(
            verifier
        );

        return verifier;
    }

    private static void validateVerifier(
        Verifier verifier
    ) {

        if (verifier == null) {
            throw invalid(
                "Branch Credential verifier is required."
            );
        }

        if (
            !FinoraPortableBranchAuthContract.KDF_ALGORITHM.equals(
                verifier.algorithm
            ) ||
            !SALT_ENCODING.equals(
                verifier.saltEncoding
            ) ||
            !DERIVED_KEY_ENCODING.equals(
                verifier.derivedKeyEncoding
            ) ||
            verifier.keyLength !=
                FinoraPortableBranchAuthContract.VERIFIER_BYTES ||
            verifier.N !=
                FinoraPortableBranchAuthContract.SCRYPT_N ||
            verifier.r !=
                FinoraPortableBranchAuthContract.SCRYPT_R ||
            verifier.p !=
                FinoraPortableBranchAuthContract.SCRYPT_P
        ) {
            throw invalid(
                "Branch Credential verifier metadata is invalid."
            );
        }

        assertCanonicalBase64Bytes(
            verifier.salt,
            FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
            "Branch Credential verifier salt"
        );

        assertCanonicalBase64Bytes(
            verifier.derivedKey,
            FinoraPortableBranchAuthContract.VERIFIER_BYTES,
            "Branch Credential derivedKey"
        );
    }

    static String canonicalizeUsername(
        String value
    ) {

        if (value == null) {
            throw invalid(
                "Branch Credential username is required."
            );
        }

        String trimmed =
            trimEcmaWhitespace(
                value
            );

        return Normalizer
            .normalize(
                trimmed,
                Normalizer.Form.NFKC
            )
            .toLowerCase(
                Locale.ROOT
            );
    }

    private static String trimEcmaWhitespace(
        String value
    ) {

        int start =
            0;

        int end =
            value.length();

        while (start < end) {

            int codePoint =
                value.codePointAt(
                    start
                );

            if (!isEcmaTrimWhitespace(codePoint)) {
                break;
            }

            start +=
                Character.charCount(
                    codePoint
                );
        }

        while (end > start) {

            int codePoint =
                value.codePointBefore(
                    end
                );

            if (!isEcmaTrimWhitespace(codePoint)) {
                break;
            }

            end -=
                Character.charCount(
                    codePoint
                );
        }

        return value.substring(
            start,
            end
        );
    }

    private static boolean isEcmaTrimWhitespace(
        int codePoint
    ) {

        return Character.isWhitespace(
            codePoint
        ) ||
            Character.isSpaceChar(
                codePoint
            ) ||
            codePoint == 0xFEFF;
    }

    static boolean isControlTimestamp(
        String value
    ) {

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            return false;
        }

        String candidate =
            value.trim();

        /*
         * Windows authority accepts any non-empty timestamp for
         * which Date.parse(...) is finite.
         *
         * Android has no equivalent ECMAScript Date.parse API.
         * FINORA-produced timestamps are ISO-8601, so Instant is
         * the primary path. Additional standard Java time forms
         * preserve compatibility for other ordinary parseable
         * timestamp representations without weakening malformed
         * input rejection.
         */

        if (parsesAsInstant(candidate)) {
            return true;
        }

        if (parsesAsOffsetDateTime(candidate)) {
            return true;
        }

        if (parsesAsZonedDateTime(candidate)) {
            return true;
        }

        if (parsesAsLocalDateTime(candidate)) {
            return true;
        }

        if (parsesAsLocalDate(candidate)) {
            return true;
        }

        return parsesAsRfc1123DateTime(
            candidate
        );
    }

    private static boolean parsesAsInstant(
        String value
    ) {

        try {
            Instant.parse(
                value
            );

            return true;
        }
        catch (DateTimeParseException error) {
            return false;
        }
    }

    private static boolean parsesAsOffsetDateTime(
        String value
    ) {

        try {
            OffsetDateTime.parse(
                value
            );

            return true;
        }
        catch (DateTimeParseException error) {
            return false;
        }
    }

    private static boolean parsesAsZonedDateTime(
        String value
    ) {

        try {
            ZonedDateTime.parse(
                value
            );

            return true;
        }
        catch (DateTimeParseException error) {
            return false;
        }
    }

    private static boolean parsesAsLocalDateTime(
        String value
    ) {

        try {
            LocalDateTime.parse(
                value
            );

            return true;
        }
        catch (DateTimeParseException error) {
            return false;
        }
    }

    private static boolean parsesAsLocalDate(
        String value
    ) {

        try {
            LocalDate.parse(
                value
            );

            return true;
        }
        catch (DateTimeParseException error) {
            return false;
        }
    }

    private static boolean parsesAsRfc1123DateTime(
        String value
    ) {

        try {
            ZonedDateTime.parse(
                value,
                DateTimeFormatter.RFC_1123_DATE_TIME
            );

            return true;
        }
        catch (DateTimeParseException error) {
            return false;
        }
    }

    private static boolean isAllowedRole(
        String role
    ) {

        return ROLE_ADMIN.equals(role) ||
            ROLE_MANAGER.equals(role) ||
            ROLE_COLLECTOR.equals(role) ||
            ROLE_VIEWER.equals(role);
    }

    private static void requireExactKeys(
        JSONObject value,
        String[] requiredKeys,
        String[] optionalKeys,
        String label
    ) {

        Set<String> allowed =
            new HashSet<String>();

        allowed.addAll(
            Arrays.asList(
                requiredKeys
            )
        );

        allowed.addAll(
            Arrays.asList(
                optionalKeys
            )
        );

        for (String required : requiredKeys) {
            if (!value.has(required)) {
                throw invalid(
                    label +
                    " is missing required key: " +
                    required
                );
            }
        }

        java.util.Iterator<String> keys =
            value.keys();

        while (keys.hasNext()) {

            String key =
                keys.next();

            if (!allowed.contains(key)) {
                throw invalid(
                    label +
                    " contains an unexpected key: " +
                    key
                );
            }
        }
    }

    private static JSONObject requireObject(
        JSONObject parent,
        String key
    ) {

        Object value =
            requireValue(
                parent,
                key
            );

        if (!(value instanceof JSONObject)) {
            throw invalid(
                key +
                " must be an object."
            );
        }

        return (JSONObject) value;
    }

    private static String requireString(
        JSONObject parent,
        String key
    ) {

        Object value =
            requireValue(
                parent,
                key
            );

        if (!(value instanceof String)) {
            throw invalid(
                key +
                " must be a string."
            );
        }

        String stringValue =
            (String) value;

        requireNonEmpty(
            stringValue,
            key
        );

        return stringValue;
    }

    private static String optionalString(
        JSONObject parent,
        String key
    ) {

        if (!parent.has(key)) {
            return null;
        }

        return requireString(
            parent,
            key
        );
    }

    private static int requireInt(
        JSONObject parent,
        String key
    ) {

        Object value =
            requireValue(
                parent,
                key
            );

        if (!(value instanceof Number)) {
            throw invalid(
                key +
                " must be an integer."
            );
        }

        Number number =
            (Number) value;

        long longValue =
            number.longValue();

        double doubleValue =
            number.doubleValue();

        if (
            doubleValue != (double) longValue ||
            longValue < Integer.MIN_VALUE ||
            longValue > Integer.MAX_VALUE
        ) {
            throw invalid(
                key +
                " must be an integer."
            );
        }

        return (int) longValue;
    }

    private static Long optionalPositiveLong(
        JSONObject parent,
        String key
    ) {

        if (!parent.has(key)) {
            return null;
        }

        Object value =
            requireValue(
                parent,
                key
            );

        if (!(value instanceof Number)) {
            throw invalid(
                key +
                " must be a positive integer."
            );
        }

        Number number =
            (Number) value;

        long longValue =
            number.longValue();

        double doubleValue =
            number.doubleValue();

        if (
            doubleValue != (double) longValue ||
            longValue <= 0L
        ) {
            throw invalid(
                key +
                " must be a positive integer."
            );
        }

        return Long.valueOf(
            longValue
        );
    }

    private static Object requireValue(
        JSONObject parent,
        String key
    ) {

        if (!parent.has(key)) {
            throw invalid(
                "Missing required key: " +
                key
            );
        }

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
                    key +
                    " must not be null."
                );
            }

            return value;
        }
        catch (JSONException error) {
            throw invalid(
                "Unable to read key: " +
                key,
                error
            );
        }
    }

    private static void requireNonEmpty(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw invalid(
                "Branch Credential " +
                label +
                " is required."
            );
        }
    }

    private static void assertCanonicalBase64Bytes(
        String value,
        int expectedLength,
        String label
    ) {

        if (
            value == null ||
            value.length() == 0
        ) {
            throw invalid(
                label +
                " is required."
            );
        }

        byte[] decoded =
            null;

        try {
            decoded =
                Base64
                    .getDecoder()
                    .decode(
                        value
                    );

            if (
                decoded.length != expectedLength ||
                !Base64
                    .getEncoder()
                    .encodeToString(
                        decoded
                    )
                    .equals(
                        value
                    )
            ) {
                throw invalid(
                    label +
                    " is not canonical BASE64 of the required length."
                );
            }
        }
        catch (IllegalArgumentException error) {
            throw invalid(
                label +
                " is not valid canonical BASE64.",
                error
            );
        }
        finally {

            if (decoded != null) {
                Arrays.fill(
                    decoded,
                    (byte) 0
                );
            }
        }
    }

    private static IllegalArgumentException invalid(
        String message
    ) {
        return new IllegalArgumentException(
            message
        );
    }

    private static IllegalArgumentException invalid(
        String message,
        Throwable cause
    ) {
        return new IllegalArgumentException(
            message,
            cause
        );
    }
}