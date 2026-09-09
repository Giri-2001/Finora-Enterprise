package com.finora.enterprise.control;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST STATE

   MODULE  : Control
   LAYER   : Native Recipient Domain
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define the Android recipient-trust persistence schema
   - Parse encrypted-store plaintext into validated domain state
   - Serialize validated domain state back to canonical JSON shape
   - Validate operational trusted signing keys
   - Validate trust-transition replay metadata
   - Validate trust-transition monotonic sequence state
   - Validate emergency recovery replay metadata
   - Validate emergency recovery monotonic sequence state
   - Reject duplicate trust identities and replay scopes
   - Enforce at most one ACTIVE signing key per issuer

   DESKTOP PARITY:

   Root schema:
     schemaVersion
     trustedKeys
     appliedTrustTransitions?
     trustTransitionSequences?
     appliedTrustRecoveries?
     trustRecoverySequences?

   IMPORTANT:

   - This class performs no persistence.
   - This class reads no wall clock.
   - This class performs no trust bootstrap.
   - This class performs no trust transition.
   - This class performs no emergency recovery.
   - This class does not derive signingKeyId authority.
   - This class exposes no Capacitor / renderer API.
   - This class contains no private signing material.
============================================================ */

public final class FinoraRecipientTrustState {

    // ========================================================
    // CONSTANTS
    // ========================================================

    public static final int SCHEMA_VERSION =
        1;

    public static final String ALGORITHM =
        "ECDSA_P256_SHA256";

    public static final String FORMAT =
        "SPKI_DER_BASE64";

    public static final String PURPOSE_TRANSITION =
        "RECIPIENT_TRUST_TRANSITION";

    public static final String PURPOSE_RECOVERY =
        "RECIPIENT_TRUST_RECOVERY";

    public static final String STATUS_ACTIVE =
        "ACTIVE";

    public static final String STATUS_RETIRED =
        "RETIRED";

    public static final String STATUS_REVOKED =
        "REVOKED";

    private static final BigInteger MAX_SAFE_INTEGER =
        new BigInteger(
            "9007199254740991"
        );

    private static final Pattern CANONICAL_BASE64 =
        Pattern.compile(
            "^(?:[A-Za-z0-9+/]{4})*" +
            "(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$"
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
    // TRUSTED KEY
    // ========================================================

    public static final class TrustedKeyRecord {

        public final String issuerId;

        public final String signingKeyId;

        public final String algorithm;

        public final String format;

        public final String publicKey;

        public final String status;

        public final String validFrom;

        public final String validUntil;

        public TrustedKeyRecord(
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
    // APPLIED TRUST TRANSITION
    // ========================================================

    public static final class AppliedTransitionRecord {

        public final String packageId;

        public final String issuerId;

        public final String purpose;

        public final long sequence;

        public final String installationId;

        public final String appliedAt;

        public AppliedTransitionRecord(
            String packageId,
            String issuerId,
            String purpose,
            long sequence,
            String installationId,
            String appliedAt
        ) {
            this.packageId =
                packageId;

            this.issuerId =
                issuerId;

            this.purpose =
                purpose;

            this.sequence =
                sequence;

            this.installationId =
                installationId;

            this.appliedAt =
                appliedAt;
        }
    }

    // ========================================================
    // TRUST TRANSITION SEQUENCE
    // ========================================================

    public static final class TransitionSequenceState {

        public final String issuerId;

        public final String purpose;

        public final String installationId;

        public final long lastSequence;

        public final String updatedAt;

        public TransitionSequenceState(
            String issuerId,
            String purpose,
            String installationId,
            long lastSequence,
            String updatedAt
        ) {
            this.issuerId =
                issuerId;

            this.purpose =
                purpose;

            this.installationId =
                installationId;

            this.lastSequence =
                lastSequence;

            this.updatedAt =
                updatedAt;
        }
    }

    // ========================================================
    // APPLIED TRUST RECOVERY
    // ========================================================

    public static final class AppliedRecoveryRecord {

        public final String packageId;

        public final String recoveryAuthorityId;

        public final String purpose;

        public final long sequence;

        public final String installationId;

        public final String operationalIssuerId;

        public final String appliedAt;

        public AppliedRecoveryRecord(
            String packageId,
            String recoveryAuthorityId,
            String purpose,
            long sequence,
            String installationId,
            String operationalIssuerId,
            String appliedAt
        ) {
            this.packageId =
                packageId;

            this.recoveryAuthorityId =
                recoveryAuthorityId;

            this.purpose =
                purpose;

            this.sequence =
                sequence;

            this.installationId =
                installationId;

            this.operationalIssuerId =
                operationalIssuerId;

            this.appliedAt =
                appliedAt;
        }
    }

    // ========================================================
    // TRUST RECOVERY SEQUENCE
    // ========================================================

    public static final class RecoverySequenceState {

        public final String recoveryAuthorityId;

        public final String purpose;

        public final String installationId;

        public final String operationalIssuerId;

        public final long lastSequence;

        public final String updatedAt;

        public RecoverySequenceState(
            String recoveryAuthorityId,
            String purpose,
            String installationId,
            String operationalIssuerId,
            long lastSequence,
            String updatedAt
        ) {
            this.recoveryAuthorityId =
                recoveryAuthorityId;

            this.purpose =
                purpose;

            this.installationId =
                installationId;

            this.operationalIssuerId =
                operationalIssuerId;

            this.lastSequence =
                lastSequence;

            this.updatedAt =
                updatedAt;
        }
    }

    // ========================================================
    // ROOT STATE
    // ========================================================

    public static final class State {

        public final int schemaVersion;

        public final List<
            TrustedKeyRecord
        > trustedKeys;

        public final List<
            AppliedTransitionRecord
        > appliedTrustTransitions;

        public final List<
            TransitionSequenceState
        > trustTransitionSequences;

        public final List<
            AppliedRecoveryRecord
        > appliedTrustRecoveries;

        public final List<
            RecoverySequenceState
        > trustRecoverySequences;

        public State(
            int schemaVersion,
            List<TrustedKeyRecord> trustedKeys,
            List<AppliedTransitionRecord> appliedTrustTransitions,
            List<TransitionSequenceState> trustTransitionSequences,
            List<AppliedRecoveryRecord> appliedTrustRecoveries,
            List<RecoverySequenceState> trustRecoverySequences
        ) {
            this.schemaVersion =
                schemaVersion;

            this.trustedKeys =
                immutableCopyRequired(
                    trustedKeys
                );

            this.appliedTrustTransitions =
                immutableCopyOptional(
                    appliedTrustTransitions
                );

            this.trustTransitionSequences =
                immutableCopyOptional(
                    trustTransitionSequences
                );

            this.appliedTrustRecoveries =
                immutableCopyOptional(
                    appliedTrustRecoveries
                );

            this.trustRecoverySequences =
                immutableCopyOptional(
                    trustRecoverySequences
                );
        }
    }

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    private FinoraRecipientTrustState() {
    }

    // ========================================================
    // PARSE
    // ========================================================

    public static State parse(
        String serialized
    ) throws Exception {

        if (
            serialized == null ||
            serialized.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust state is required."
            );
        }

        JSONObject root;

        try {
            root =
                new JSONObject(
                    serialized
                );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trust state contains invalid JSON.",
                error
            );
        }

        requireOnlyKeys(
            root,
            "schemaVersion",
            "trustedKeys",
            "appliedTrustTransitions",
            "trustTransitionSequences",
            "appliedTrustRecoveries",
            "trustRecoverySequences"
        );

        int schemaVersion =
            requireExactSchemaVersion(
                root,
                "schemaVersion"
            );

        JSONArray trustedKeysArray =
            requireArray(
                root,
                "trustedKeys"
            );

        if (
            trustedKeysArray.length() == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust store must contain at least one trusted signing key."
            );
        }

        List<TrustedKeyRecord> trustedKeys =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                trustedKeysArray.length();
            index++
        ) {
            trustedKeys.add(
                parseTrustedKey(
                    requireObject(
                        trustedKeysArray,
                        index,
                        "trustedKeys"
                    )
                )
            );
        }

        List<AppliedTransitionRecord>
            appliedTrustTransitions =
                parseOptionalAppliedTransitions(
                    root
                );

        List<TransitionSequenceState>
            trustTransitionSequences =
                parseOptionalTransitionSequences(
                    root
                );

        List<AppliedRecoveryRecord>
            appliedTrustRecoveries =
                parseOptionalAppliedRecoveries(
                    root
                );

        List<RecoverySequenceState>
            trustRecoverySequences =
                parseOptionalRecoverySequences(
                    root
                );

        State state =
            new State(
                schemaVersion,
                trustedKeys,
                appliedTrustTransitions,
                trustTransitionSequences,
                appliedTrustRecoveries,
                trustRecoverySequences
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

        JSONObject root =
            new JSONObject();

        root.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        JSONArray trustedKeys =
            new JSONArray();

        for (
            TrustedKeyRecord trustedKey :
            state.trustedKeys
        ) {
            trustedKeys.put(
                toJson(
                    trustedKey
                )
            );
        }

        root.put(
            "trustedKeys",
            trustedKeys
        );

        if (
            state.appliedTrustTransitions !=
                null
        ) {
            JSONArray values =
                new JSONArray();

            for (
                AppliedTransitionRecord record :
                state.appliedTrustTransitions
            ) {
                values.put(
                    toJson(
                        record
                    )
                );
            }

            root.put(
                "appliedTrustTransitions",
                values
            );
        }

        if (
            state.trustTransitionSequences !=
                null
        ) {
            JSONArray values =
                new JSONArray();

            for (
                TransitionSequenceState record :
                state.trustTransitionSequences
            ) {
                values.put(
                    toJson(
                        record
                    )
                );
            }

            root.put(
                "trustTransitionSequences",
                values
            );
        }

        if (
            state.appliedTrustRecoveries !=
                null
        ) {
            JSONArray values =
                new JSONArray();

            for (
                AppliedRecoveryRecord record :
                state.appliedTrustRecoveries
            ) {
                values.put(
                    toJson(
                        record
                    )
                );
            }

            root.put(
                "appliedTrustRecoveries",
                values
            );
        }

        if (
            state.trustRecoverySequences !=
                null
        ) {
            JSONArray values =
                new JSONArray();

            for (
                RecoverySequenceState record :
                state.trustRecoverySequences
            ) {
                values.put(
                    toJson(
                        record
                    )
                );
            }

            root.put(
                "trustRecoverySequences",
                values
            );
        }

        return root.toString();
    }

    // ========================================================
    // VALIDATE ROOT
    // ========================================================

    public static void validate(
        State state
    ) throws Exception {

        if (state == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust state is required."
            );
        }

        if (
            state.schemaVersion !=
                SCHEMA_VERSION
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust schemaVersion is unsupported."
            );
        }

        if (
            state.trustedKeys == null ||
            state.trustedKeys.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust store must contain at least one trusted signing key."
            );
        }

        validateTrustedKeys(
            state.trustedKeys
        );

        validateAppliedTransitions(
            state.appliedTrustTransitions
        );

        validateTransitionSequences(
            state.trustTransitionSequences
        );

        validateAppliedRecoveries(
            state.appliedTrustRecoveries
        );

        validateRecoverySequences(
            state.trustRecoverySequences
        );
    }

    // ========================================================
    // TRUSTED KEY VALIDATION
    // ========================================================

    private static void validateTrustedKeys(
        List<TrustedKeyRecord> trustedKeys
    ) throws Exception {

        Set<String> identities =
            new HashSet<>();

        Set<String> activeIssuerIds =
            new HashSet<>();

        for (
            TrustedKeyRecord trustedKey :
            trustedKeys
        ) {
            validateTrustedKey(
                trustedKey
            );

            String identity =
                compositeKey(
                    trustedKey.issuerId,
                    trustedKey.signingKeyId
                );

            if (
                !identities.add(
                    identity
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust store contains a duplicate issuer/signing-key identity."
                );
            }

            if (
                STATUS_ACTIVE.equals(
                    trustedKey.status
                ) &&
                !activeIssuerIds.add(
                    trustedKey.issuerId
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust store contains more than one ACTIVE signing key for the same issuer."
                );
            }
        }
    }

    private static void validateTrustedKey(
        TrustedKeyRecord value
    ) throws Exception {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust store contains an invalid trusted-key record."
            );
        }

        requireNonEmpty(
            value.issuerId,
            "FINORA recipient trusted-key issuerId is invalid."
        );

        requireNonEmpty(
            value.signingKeyId,
            "FINORA recipient trusted-key signingKeyId is invalid."
        );

        if (
            !ALGORITHM.equals(
                value.algorithm
            ) ||
            !FORMAT.equals(
                value.format
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key cryptographic contract is unsupported."
            );
        }

        if (
            !STATUS_ACTIVE.equals(
                value.status
            ) &&
            !STATUS_RETIRED.equals(
                value.status
            ) &&
            !STATUS_REVOKED.equals(
                value.status
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key status is invalid."
            );
        }

        Instant validFrom =
            requireCanonicalTimestamp(
                value.validFrom,
                "FINORA recipient trusted-key validFrom timestamp is invalid."
            );

        Instant validUntil =
            null;

        if (
            value.validUntil !=
                null
        ) {
            validUntil =
                requireCanonicalTimestamp(
                    value.validUntil,
                    "FINORA recipient trusted-key validUntil timestamp is invalid."
                );

            if (
                validUntil.isBefore(
                    validFrom
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trusted-key validity window is invalid."
                );
            }
        }

        if (
            STATUS_RETIRED.equals(
                value.status
            ) &&
            validUntil ==
                null
        ) {
            throw new IllegalArgumentException(
                "FINORA retired recipient signing key requires validUntil."
            );
        }

        validateP256SpkiPublicKey(
            value.publicKey
        );
    }

    // ========================================================
    // TRANSITION REPLAY VALIDATION
    // ========================================================

    private static void validateAppliedTransitions(
        List<AppliedTransitionRecord> records
    ) throws Exception {

        if (records == null) {
            return;
        }

        Set<String> packageIds =
            new HashSet<>();

        for (
            AppliedTransitionRecord record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust applied transition ledger is invalid."
                );
            }

            requireNonEmpty(
                record.packageId,
                "FINORA recipient trust transition packageId is invalid."
            );

            requireNonEmpty(
                record.issuerId,
                "FINORA recipient trust transition issuerId is invalid."
            );

            if (
                !PURPOSE_TRANSITION.equals(
                    record.purpose
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition purpose is invalid."
                );
            }

            requirePositiveSafeInteger(
                record.sequence,
                "FINORA recipient trust transition sequence is invalid."
            );

            requireNonEmpty(
                record.installationId,
                "FINORA recipient trust transition installationId is invalid."
            );

            requireCanonicalTimestamp(
                record.appliedAt,
                "FINORA recipient trust transition appliedAt is invalid."
            );

            if (
                !packageIds.add(
                    record.packageId
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust store contains a duplicate applied transition packageId."
                );
            }
        }
    }

    private static void validateTransitionSequences(
        List<TransitionSequenceState> records
    ) throws Exception {

        if (records == null) {
            return;
        }

        Set<String> scopes =
            new HashSet<>();

        for (
            TransitionSequenceState record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition sequence state is invalid."
                );
            }

            requireNonEmpty(
                record.issuerId,
                "FINORA recipient trust transition sequence issuerId is invalid."
            );

            if (
                !PURPOSE_TRANSITION.equals(
                    record.purpose
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust transition sequence purpose is invalid."
                );
            }

            requireNonEmpty(
                record.installationId,
                "FINORA recipient trust transition sequence installationId is invalid."
            );

            requirePositiveSafeInteger(
                record.lastSequence,
                "FINORA recipient trust transition lastSequence is invalid."
            );

            requireCanonicalTimestamp(
                record.updatedAt,
                "FINORA recipient trust transition updatedAt is invalid."
            );

            String scope =
                compositeKey(
                    record.issuerId,
                    record.purpose,
                    record.installationId
                );

            if (
                !scopes.add(
                    scope
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust store contains a duplicate transition sequence scope."
                );
            }
        }
    }

    // ========================================================
    // RECOVERY REPLAY VALIDATION
    // ========================================================

    private static void validateAppliedRecoveries(
        List<AppliedRecoveryRecord> records
    ) throws Exception {

        if (records == null) {
            return;
        }

        Set<String> packageIds =
            new HashSet<>();

        for (
            AppliedRecoveryRecord record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust applied recovery ledger is invalid."
                );
            }

            requireNonEmpty(
                record.packageId,
                "FINORA recipient trust recovery packageId is invalid."
            );

            requireNonEmpty(
                record.recoveryAuthorityId,
                "FINORA recipient trust recovery authorityId is invalid."
            );

            if (
                !PURPOSE_RECOVERY.equals(
                    record.purpose
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery purpose is invalid."
                );
            }

            requirePositiveSafeInteger(
                record.sequence,
                "FINORA recipient trust recovery sequence is invalid."
            );

            requireNonEmpty(
                record.installationId,
                "FINORA recipient trust recovery installationId is invalid."
            );

            requireNonEmpty(
                record.operationalIssuerId,
                "FINORA recipient trust recovery operationalIssuerId is invalid."
            );

            requireCanonicalTimestamp(
                record.appliedAt,
                "FINORA recipient trust recovery appliedAt is invalid."
            );

            if (
                !packageIds.add(
                    record.packageId
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust store contains a duplicate applied recovery packageId."
                );
            }
        }
    }

    private static void validateRecoverySequences(
        List<RecoverySequenceState> records
    ) throws Exception {

        if (records == null) {
            return;
        }

        Set<String> scopes =
            new HashSet<>();

        for (
            RecoverySequenceState record :
            records
        ) {
            if (record == null) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery sequence state is invalid."
                );
            }

            requireNonEmpty(
                record.recoveryAuthorityId,
                "FINORA recipient trust recovery sequence authorityId is invalid."
            );

            if (
                !PURPOSE_RECOVERY.equals(
                    record.purpose
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust recovery sequence purpose is invalid."
                );
            }

            requireNonEmpty(
                record.installationId,
                "FINORA recipient trust recovery sequence installationId is invalid."
            );

            requireNonEmpty(
                record.operationalIssuerId,
                "FINORA recipient trust recovery sequence operationalIssuerId is invalid."
            );

            requirePositiveSafeInteger(
                record.lastSequence,
                "FINORA recipient trust recovery lastSequence is invalid."
            );

            requireCanonicalTimestamp(
                record.updatedAt,
                "FINORA recipient trust recovery updatedAt is invalid."
            );

            String scope =
                compositeKey(
                    record.recoveryAuthorityId,
                    record.purpose,
                    record.installationId,
                    record.operationalIssuerId
                );

            if (
                !scopes.add(
                    scope
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trust store contains a duplicate recovery sequence scope."
                );
            }
        }
    }

    // ========================================================
    // JSON PARSERS
    // ========================================================

    private static TrustedKeyRecord parseTrustedKey(
        JSONObject value
    ) throws Exception {

        requireOnlyKeys(
            value,
            "issuerId",
            "signingKeyId",
            "algorithm",
            "format",
            "publicKey",
            "status",
            "validFrom",
            "validUntil"
        );

        String validUntil =
            null;

        if (
            value.has(
                "validUntil"
            )
        ) {
            if (
                value.isNull(
                    "validUntil"
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA recipient trusted-key validUntil must be omitted rather than null."
                );
            }

            validUntil =
                requireString(
                    value,
                    "validUntil"
                );
        }

        TrustedKeyRecord record =
            new TrustedKeyRecord(
                requireString(
                    value,
                    "issuerId"
                ),
                requireString(
                    value,
                    "signingKeyId"
                ),
                requireString(
                    value,
                    "algorithm"
                ),
                requireString(
                    value,
                    "format"
                ),
                requireString(
                    value,
                    "publicKey"
                ),
                requireString(
                    value,
                    "status"
                ),
                requireString(
                    value,
                    "validFrom"
                ),
                validUntil
            );

        validateTrustedKey(
            record
        );

        return record;
    }

    private static List<AppliedTransitionRecord>
        parseOptionalAppliedTransitions(
            JSONObject root
        ) throws Exception {

        JSONArray values =
            optionalArray(
                root,
                "appliedTrustTransitions"
            );

        if (values == null) {
            return null;
        }

        List<AppliedTransitionRecord> result =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                values.length();
            index++
        ) {
            JSONObject value =
                requireObject(
                    values,
                    index,
                    "appliedTrustTransitions"
                );

            requireOnlyKeys(
                value,
                "packageId",
                "issuerId",
                "purpose",
                "sequence",
                "installationId",
                "appliedAt"
            );

            result.add(
                new AppliedTransitionRecord(
                    requireString(
                        value,
                        "packageId"
                    ),
                    requireString(
                        value,
                        "issuerId"
                    ),
                    requireString(
                        value,
                        "purpose"
                    ),
                    requirePositiveSafeInteger(
                        value,
                        "sequence"
                    ),
                    requireString(
                        value,
                        "installationId"
                    ),
                    requireString(
                        value,
                        "appliedAt"
                    )
                )
            );
        }

        return result;
    }

    private static List<TransitionSequenceState>
        parseOptionalTransitionSequences(
            JSONObject root
        ) throws Exception {

        JSONArray values =
            optionalArray(
                root,
                "trustTransitionSequences"
            );

        if (values == null) {
            return null;
        }

        List<TransitionSequenceState> result =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                values.length();
            index++
        ) {
            JSONObject value =
                requireObject(
                    values,
                    index,
                    "trustTransitionSequences"
                );

            requireOnlyKeys(
                value,
                "issuerId",
                "purpose",
                "installationId",
                "lastSequence",
                "updatedAt"
            );

            result.add(
                new TransitionSequenceState(
                    requireString(
                        value,
                        "issuerId"
                    ),
                    requireString(
                        value,
                        "purpose"
                    ),
                    requireString(
                        value,
                        "installationId"
                    ),
                    requirePositiveSafeInteger(
                        value,
                        "lastSequence"
                    ),
                    requireString(
                        value,
                        "updatedAt"
                    )
                )
            );
        }

        return result;
    }

    private static List<AppliedRecoveryRecord>
        parseOptionalAppliedRecoveries(
            JSONObject root
        ) throws Exception {

        JSONArray values =
            optionalArray(
                root,
                "appliedTrustRecoveries"
            );

        if (values == null) {
            return null;
        }

        List<AppliedRecoveryRecord> result =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                values.length();
            index++
        ) {
            JSONObject value =
                requireObject(
                    values,
                    index,
                    "appliedTrustRecoveries"
                );

            requireOnlyKeys(
                value,
                "packageId",
                "recoveryAuthorityId",
                "purpose",
                "sequence",
                "installationId",
                "operationalIssuerId",
                "appliedAt"
            );

            result.add(
                new AppliedRecoveryRecord(
                    requireString(
                        value,
                        "packageId"
                    ),
                    requireString(
                        value,
                        "recoveryAuthorityId"
                    ),
                    requireString(
                        value,
                        "purpose"
                    ),
                    requirePositiveSafeInteger(
                        value,
                        "sequence"
                    ),
                    requireString(
                        value,
                        "installationId"
                    ),
                    requireString(
                        value,
                        "operationalIssuerId"
                    ),
                    requireString(
                        value,
                        "appliedAt"
                    )
                )
            );
        }

        return result;
    }

    private static List<RecoverySequenceState>
        parseOptionalRecoverySequences(
            JSONObject root
        ) throws Exception {

        JSONArray values =
            optionalArray(
                root,
                "trustRecoverySequences"
            );

        if (values == null) {
            return null;
        }

        List<RecoverySequenceState> result =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                values.length();
            index++
        ) {
            JSONObject value =
                requireObject(
                    values,
                    index,
                    "trustRecoverySequences"
                );

            requireOnlyKeys(
                value,
                "recoveryAuthorityId",
                "purpose",
                "installationId",
                "operationalIssuerId",
                "lastSequence",
                "updatedAt"
            );

            result.add(
                new RecoverySequenceState(
                    requireString(
                        value,
                        "recoveryAuthorityId"
                    ),
                    requireString(
                        value,
                        "purpose"
                    ),
                    requireString(
                        value,
                        "installationId"
                    ),
                    requireString(
                        value,
                        "operationalIssuerId"
                    ),
                    requirePositiveSafeInteger(
                        value,
                        "lastSequence"
                    ),
                    requireString(
                        value,
                        "updatedAt"
                    )
                )
            );
        }

        return result;
    }

    // ========================================================
    // JSON SERIALIZERS
    // ========================================================

    private static JSONObject toJson(
        TrustedKeyRecord value
    ) throws Exception {

        JSONObject result =
            new JSONObject();

        result.put(
            "issuerId",
            value.issuerId
        );

        result.put(
            "signingKeyId",
            value.signingKeyId
        );

        result.put(
            "algorithm",
            value.algorithm
        );

        result.put(
            "format",
            value.format
        );

        result.put(
            "publicKey",
            value.publicKey
        );

        result.put(
            "status",
            value.status
        );

        result.put(
            "validFrom",
            value.validFrom
        );

        if (
            value.validUntil !=
                null
        ) {
            result.put(
                "validUntil",
                value.validUntil
            );
        }

        return result;
    }

    private static JSONObject toJson(
        AppliedTransitionRecord value
    ) throws Exception {

        JSONObject result =
            new JSONObject();

        result.put(
            "packageId",
            value.packageId
        );

        result.put(
            "issuerId",
            value.issuerId
        );

        result.put(
            "purpose",
            value.purpose
        );

        result.put(
            "sequence",
            value.sequence
        );

        result.put(
            "installationId",
            value.installationId
        );

        result.put(
            "appliedAt",
            value.appliedAt
        );

        return result;
    }

    private static JSONObject toJson(
        TransitionSequenceState value
    ) throws Exception {

        JSONObject result =
            new JSONObject();

        result.put(
            "issuerId",
            value.issuerId
        );

        result.put(
            "purpose",
            value.purpose
        );

        result.put(
            "installationId",
            value.installationId
        );

        result.put(
            "lastSequence",
            value.lastSequence
        );

        result.put(
            "updatedAt",
            value.updatedAt
        );

        return result;
    }

    private static JSONObject toJson(
        AppliedRecoveryRecord value
    ) throws Exception {

        JSONObject result =
            new JSONObject();

        result.put(
            "packageId",
            value.packageId
        );

        result.put(
            "recoveryAuthorityId",
            value.recoveryAuthorityId
        );

        result.put(
            "purpose",
            value.purpose
        );

        result.put(
            "sequence",
            value.sequence
        );

        result.put(
            "installationId",
            value.installationId
        );

        result.put(
            "operationalIssuerId",
            value.operationalIssuerId
        );

        result.put(
            "appliedAt",
            value.appliedAt
        );

        return result;
    }

    private static JSONObject toJson(
        RecoverySequenceState value
    ) throws Exception {

        JSONObject result =
            new JSONObject();

        result.put(
            "recoveryAuthorityId",
            value.recoveryAuthorityId
        );

        result.put(
            "purpose",
            value.purpose
        );

        result.put(
            "installationId",
            value.installationId
        );

        result.put(
            "operationalIssuerId",
            value.operationalIssuerId
        );

        result.put(
            "lastSequence",
            value.lastSequence
        );

        result.put(
            "updatedAt",
            value.updatedAt
        );

        return result;
    }

    // ========================================================
    // P-256 SPKI VALIDATION
    // ========================================================

    private static void validateP256SpkiPublicKey(
        String encoded
    ) throws Exception {

        requireNonEmpty(
            encoded,
            "FINORA recipient trusted-key publicKey is invalid."
        );

        if (
            encoded.length() %
                4 !=
                0 ||
            !CANONICAL_BASE64.matcher(
                encoded
            ).matches()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key publicKey is not canonical Base64."
            );
        }

        byte[] der;

        try {
            der =
                Base64.decode(
                    encoded,
                    Base64.NO_WRAP
                );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key publicKey is invalid Base64.",
                error
            );
        }

        if (
            der.length == 0 ||
            !encoded.equals(
                Base64.encodeToString(
                    der,
                    Base64.NO_WRAP
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key publicKey Base64 encoding is non-canonical."
            );
        }

        PublicKey publicKey;

        try {
            publicKey =
                KeyFactory
                    .getInstance(
                        "EC"
                    )
                    .generatePublic(
                        new X509EncodedKeySpec(
                            der
                        )
                    );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key publicKey is not a valid SPKI EC key.",
                error
            );
        }

        if (
            !(publicKey instanceof
                ECPublicKey)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key publicKey must be an EC public key."
            );
        }

        if (
            !Arrays.equals(
                der,
                publicKey.getEncoded()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trusted-key publicKey SPKI encoding is non-canonical."
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
                "FINORA recipient trusted-key publicKey must use P-256."
            );
        }
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
    // TIMESTAMP
    // ========================================================

    private static Instant requireCanonicalTimestamp(
        String value,
        String errorMessage
    ) {

        requireNonEmpty(
            value,
            errorMessage
        );

        if (
            !CANONICAL_ISO_MILLIS
                .matcher(
                    value
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }

        try {
            Instant instant =
                Instant.parse(
                    value
                );

            String canonical =
                ISO_MILLIS_FORMATTER.format(
                    instant
                );

            if (
                !canonical.equals(
                    value
                )
            ) {
                throw new IllegalArgumentException(
                    errorMessage
                );
            }

            return instant;
        } catch (
            IllegalArgumentException error
        ) {
            throw error;
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                errorMessage,
                error
            );
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
                    "FINORA recipient trust state contains an unexpected property: " +
                    key
                );
            }
        }
    }

    private static int requireExactSchemaVersion(
        JSONObject value,
        String key
    ) {

        Object raw =
            requireValue(
                value,
                key
            );

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust schemaVersion is invalid."
            );
        }

        BigDecimal number;

        try {
            number =
                new BigDecimal(
                    raw.toString()
                );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trust schemaVersion is invalid.",
                error
            );
        }

        if (
            number.compareTo(
                BigDecimal.ONE
            ) !=
                0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust schemaVersion is unsupported."
            );
        }

        return SCHEMA_VERSION;
    }

    private static long requirePositiveSafeInteger(
        JSONObject value,
        String key
    ) {

        Object raw =
            requireValue(
                value,
                key
            );

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust sequence value is invalid."
            );
        }

        BigInteger integer;

        try {
            integer =
                new BigDecimal(
                    raw.toString()
                ).toBigIntegerExact();
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trust sequence value must be an integer.",
                error
            );
        }

        if (
            integer.signum() <=
                0 ||
            integer.compareTo(
                MAX_SAFE_INTEGER
            ) >
                0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust sequence value is outside the safe positive range."
            );
        }

        return integer.longValue();
    }

    private static void requirePositiveSafeInteger(
        long value,
        String errorMessage
    ) {
        if (
            value <=
                0 ||
            BigInteger
                .valueOf(
                    value
                )
                .compareTo(
                    MAX_SAFE_INTEGER
                ) >
                0
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }
    }

    private static String requireString(
        JSONObject value,
        String key
    ) {

        Object raw =
            requireValue(
                value,
                key
            );

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust property " +
                key +
                " must be a string."
            );
        }

        return (String) raw;
    }

    private static Object requireValue(
        JSONObject value,
        String key
    ) {

        if (
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust property is missing: " +
                key
            );
        }

        try {
            return value.get(
                key
            );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trust property could not be read: " +
                key,
                error
            );
        }
    }

    private static JSONArray requireArray(
        JSONObject value,
        String key
    ) {

        Object raw =
            requireValue(
                value,
                key
            );

        if (
            !(raw instanceof JSONArray)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust property " +
                key +
                " must be an array."
            );
        }

        return (JSONArray) raw;
    }

    private static JSONArray optionalArray(
        JSONObject value,
        String key
    ) {

        if (
            !value.has(
                key
            )
        ) {
            return null;
        }

        if (
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust optional property " +
                key +
                " must be omitted rather than null."
            );
        }

        Object raw;

        try {
            raw =
                value.get(
                    key
                );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trust optional property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof JSONArray)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust optional property " +
                key +
                " must be an array."
            );
        }

        return (JSONArray) raw;
    }

    private static JSONObject requireObject(
        JSONArray values,
        int index,
        String collection
    ) {

        Object raw;

        try {
            raw =
                values.get(
                    index
                );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "FINORA recipient trust collection entry could not be read: " +
                collection,
                error
            );
        }

        if (
            !(raw instanceof JSONObject)
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust collection contains a non-object entry: " +
                collection
            );
        }

        return (JSONObject) raw;
    }

    // ========================================================
    // BASIC HELPERS
    // ========================================================

    private static void requireNonEmpty(
        String value,
        String errorMessage
    ) {
        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }
    }

    private static String compositeKey(
        String... values
    ) {

        StringBuilder result =
            new StringBuilder();

        for (
            int index = 0;
            index <
                values.length;
            index++
        ) {
            if (index > 0) {
                result.append(
                    '\u0000'
                );
            }

            result.append(
                values[index]
            );
        }

        return result.toString();
    }

    private static <T> List<T>
        immutableCopyRequired(
            List<T> values
        ) {

        if (values == null) {
            return null;
        }

        return Collections.unmodifiableList(
            new ArrayList<>(
                values
            )
        );
    }

    private static <T> List<T>
        immutableCopyOptional(
            List<T> values
        ) {

        if (values == null) {
            return null;
        }

        return Collections.unmodifiableList(
            new ArrayList<>(
                values
            )
        );
    }
}

/* ============================================================
   END
============================================================ */