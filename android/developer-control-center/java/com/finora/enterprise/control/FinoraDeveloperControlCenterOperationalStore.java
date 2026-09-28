package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;

import java.nio.charset.StandardCharsets;

import java.security.KeyStore;

import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;


/**
 * FINORA Developer Control Center Android operational store.
 *
 * Separate from the Developer security / signing-authority store.
 *
 * Persists:
 * - Control Center global Income Pricing
 * - exact-branch Pricing overrides
 * - Wallet History records when later wallet decision authority appends them
 *
 * Reads never fabricate Wallet History or Branch Pricing.
 */
final class FinoraDeveloperControlCenterOperationalStore {

    private static final int SCHEMA_VERSION =
        1;

    private static final String DIRECTORY =
        "FINORA/developer-control-center";

    private static final String FILE_NAME =
        "finora-developer-operational-store.bin";

    private static final String KEYSTORE_PROVIDER =
        "AndroidKeyStore";

    private static final String KEY_ALIAS =
        "FINORA_DEVELOPER_OPERATIONAL_STORE_KEY_V1";

    private static final String CIPHER =
        "AES/GCM/NoPadding";

    private static final int IV_BYTES =
        12;

    private static final int TAG_BITS =
        128;

    private static final int MAX_FILE_BYTES =
        2 * 1024 * 1024;

    private static final byte[] AAD =
        "FINORA_DEVELOPER_OPERATIONAL_STORE_V1"
            .getBytes(
                StandardCharsets.UTF_8
            );

    private static final String[] PRICE_KEYS = {
        "customerCreateFee",
        "loanDisbursementFee",
        "collectionBelow25000Fee",
        "collection25000To50000Fee",
        "collectionAbove50000Fee"
    };

    private final Context context;


    FinoraDeveloperControlCenterOperationalStore(
        Context context
    ) {

        if (context == null) {

            throw new IllegalArgumentException(
                "FINORA Developer operational-store Context is required."
            );
        }

        this.context =
            context.getApplicationContext();
    }


    // ========================================================
    // PUBLIC API
    // ========================================================

    synchronized JSONObject getIncomePricing()
        throws Exception {

        JSONObject root =
            readRoot();

        Object stored =
            root.get(
                "incomePricing"
            );

        if (stored == JSONObject.NULL) {
            return createMandatoryDefaults();
        }

        return cloneObject(
            (JSONObject) stored
        );
    }


    synchronized JSONObject updateIncomePricing(
        JSONObject request
    ) throws Exception {

        JSONObject root =
            readRoot();

        JSONObject current =
            getIncomePricingFromRoot(
                root
            );

        long nextRevision =
            current.optLong(
                "revision",
                0L
            ) +
            1L;

        JSONObject next =
            new JSONObject();

        for (String key : PRICE_KEYS) {

            next.put(
                key,
                requirePrice(
                    request,
                    key,
                    false
                )
            );
        }

        next.put(
            "source",
            "CONTROL_CENTER"
        );

        next.put(
            "revision",
            nextRevision
        );

        next.put(
            "updatedAt",
            nowIso()
        );

        next.put(
            "schemaVersion",
            1
        );

        validateIncomePricing(
            next,
            false
        );

        root.put(
            "incomePricing",
            next
        );

        writeRoot(
            root
        );

        return cloneObject(
            next
        );
    }


    synchronized JSONObject getBranchPricing(
        JSONObject request
    ) throws Exception {

        Scope scope =
            normalizeScope(
                request
            );

        JSONObject root =
            readRoot();

        JSONArray records =
            root.getJSONArray(
                "branchPricing"
            );

        int index =
            findBranchIndex(
                records,
                scope
            );

        if (index < 0) {
            return null;
        }

        return cloneObject(
            records.getJSONObject(
                index
            )
        );
    }


    synchronized JSONObject updateBranchPricing(
        JSONObject request
    ) throws Exception {

        Scope scope =
            normalizeScope(
                request
            );

        JSONObject root =
            readRoot();

        JSONArray records =
            root.getJSONArray(
                "branchPricing"
            );

        int existingIndex =
            findBranchIndex(
                records,
                scope
            );

        JSONObject custom =
            new JSONObject();

        for (String key : PRICE_KEYS) {

            if (
                request != null &&
                request.has(key) &&
                !request.isNull(key)
            ) {

                custom.put(
                    key,
                    requirePrice(
                        request,
                        key,
                        false
                    )
                );
            }
        }

        if (custom.length() == 0) {

            if (existingIndex >= 0) {

                records.remove(
                    existingIndex
                );

                writeRoot(
                    root
                );
            }

            return null;
        }

        long revision =
            1L;

        if (existingIndex >= 0) {

            revision =
                records
                    .getJSONObject(
                        existingIndex
                    )
                    .optLong(
                        "revision",
                        0L
                    ) +
                1L;
        }

        JSONObject next =
            new JSONObject();

        next.put(
            "ownerId",
            scope.ownerId
        );

        next.put(
            "businessId",
            scope.businessId
        );

        next.put(
            "branchId",
            scope.branchId
        );

        for (String key : PRICE_KEYS) {

            if (custom.has(key)) {

                next.put(
                    key,
                    custom.get(key)
                );
            }
        }

        next.put(
            "revision",
            revision
        );

        next.put(
            "updatedAt",
            nowIso()
        );

        next.put(
            "schemaVersion",
            1
        );

        validateBranchPricing(
            next
        );

        if (existingIndex >= 0) {

            records.put(
                existingIndex,
                next
            );
        }
        else {

            records.put(
                next
            );
        }

        writeRoot(
            root
        );

        return cloneObject(
            next
        );
    }


    synchronized JSONArray getWalletHistory()
        throws Exception {

        JSONObject root =
            readRoot();

        JSONArray records =
            root.getJSONArray(
                "walletHistory"
            );

        /*
         * 04C3 is READ ONLY for Wallet History.
         *
         * Wallet approval/decline issuance will append genuine
         * decision evidence in the dedicated wallet step.
         */
        return cloneArray(
            records
        );
    }



    // ========================================================
    // WALLET HISTORY MUTATION AUTHORITY
    // ========================================================

    /**
     * Append one genuine completed Wallet Recharge decision.
     *
     * Caller contract:
     * - invoke only after signed DONE / NOT export succeeds
     * - record must already contain native import/export evidence
     * - one global history collection remains authoritative
     * - branch history is an exact scope-filtered view
     *
     * Idempotency:
     * - same historyId + same immutable evidence => return existing
     * - same historyId + conflicting evidence => reject
     */
    synchronized JSONObject appendWalletHistory(
        JSONObject record
    ) throws Exception {

        if (record == null) {
            throw new IllegalArgumentException(
                "FINORA Wallet History record is required."
            );
        }

        JSONObject candidate =
            cloneObject(
                record
            );

        validateWalletHistoryRecord(
            candidate
        );

        JSONObject root =
            readRoot();

        JSONArray records =
            root.getJSONArray(
                "walletHistory"
            );

        String historyId =
            candidate.getString(
                "historyId"
            );

        for (
            int index = 0;
            index < records.length();
            index++
        ) {

            JSONObject existing =
                records.getJSONObject(
                    index
                );

            if (
                historyId.equals(
                    existing.optString(
                        "historyId",
                        null
                    )
                )
            ) {

                if (
                    !walletHistoryEvidenceMatches(
                        existing,
                        candidate
                    )
                ) {
                    throw new IllegalStateException(
                        "Conflicting FINORA Wallet History record already exists for historyId " +
                        historyId +
                        "."
                    );
                }

                return cloneObject(
                    existing
                );
            }
        }

        records.put(
            candidate
        );

        /*
         * Validate the complete root before encrypted atomic
         * persistence. No partial / malformed history is allowed.
         */
        validateRoot(
            root
        );

        writeRoot(
            root
        );

        return cloneObject(
            candidate
        );
    }


    /**
     * Exact branch-scoped Wallet History view.
     *
     * The persistent authority remains the single global collection.
     * This prevents Total History and Branch History divergence.
     */
    synchronized JSONArray getWalletHistoryForBranch(
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

        if (
            ownerId == null ||
            ownerId.trim().isEmpty() ||
            businessId == null ||
            businessId.trim().isEmpty() ||
            branchId == null ||
            branchId.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet History branch scope is incomplete."
            );
        }

        JSONObject root =
            readRoot();

        JSONArray records =
            root.getJSONArray(
                "walletHistory"
            );

        JSONArray result =
            new JSONArray();

        for (
            int index = 0;
            index < records.length();
            index++
        ) {

            JSONObject record =
                records.getJSONObject(
                    index
                );

            if (
                ownerId.equals(
                    record.optString(
                        "ownerId",
                        null
                    )
                ) &&
                businessId.equals(
                    record.optString(
                        "businessId",
                        null
                    )
                ) &&
                branchId.equals(
                    record.optString(
                        "branchId",
                        null
                    )
                )
            ) {

                result.put(
                    cloneObject(
                        record
                    )
                );
            }
        }

        return result;
    }


    /**
     * Merge already-verified Portable State Wallet History.
     *
     * This method does NOT trust raw external files.
     * Caller must supply records from a cryptographically verified
     * Portable State snapshot.
     *
     * Existing records are idempotent by historyId/evidence.
     * Conflicting duplicates are rejected.
     *
     * @return number of newly persisted records
     */
    synchronized int mergeWalletHistory(
        JSONArray incomingRecords
    ) throws Exception {

        if (incomingRecords == null) {
            throw new IllegalArgumentException(
                "FINORA Portable Wallet History records are required."
            );
        }

        JSONObject root =
            readRoot();

        JSONArray existingRecords =
            root.getJSONArray(
                "walletHistory"
            );

        int added =
            0;

        for (
            int incomingIndex = 0;
            incomingIndex < incomingRecords.length();
            incomingIndex++
        ) {

            JSONObject incoming =
                incomingRecords.optJSONObject(
                    incomingIndex
                );

            if (incoming == null) {
                throw new IllegalStateException(
                    "FINORA Portable Wallet History contains an invalid record."
                );
            }

            JSONObject candidate =
                cloneObject(
                    incoming
                );

            validateWalletHistoryRecord(
                candidate
            );

            String historyId =
                candidate.getString(
                    "historyId"
                );

            JSONObject existingMatch =
                null;

            for (
                int existingIndex = 0;
                existingIndex < existingRecords.length();
                existingIndex++
            ) {

                JSONObject existing =
                    existingRecords.getJSONObject(
                        existingIndex
                    );

                if (
                    historyId.equals(
                        existing.optString(
                            "historyId",
                            null
                        )
                    )
                ) {

                    existingMatch =
                        existing;

                    break;
                }
            }

            if (existingMatch != null) {

                if (
                    !walletHistoryEvidenceMatches(
                        existingMatch,
                        candidate
                    )
                ) {
                    throw new IllegalStateException(
                        "Conflicting FINORA Portable Wallet History record for historyId " +
                        historyId +
                        "."
                    );
                }

                continue;
            }

            existingRecords.put(
                candidate
            );

            added++;
        }

        if (added > 0) {

            validateRoot(
                root
            );

            writeRoot(
                root
            );
        }

        return added;
    }


    private static boolean walletHistoryEvidenceMatches(
        JSONObject left,
        JSONObject right
    ) {

        if (
            left == null ||
            right == null
        ) {
            return false;
        }

        String[] stringKeys = {
            "historyId",
            "decision",
            "ownerId",
            "businessId",
            "branchId",
            "businessCode",
            "branchCode",
            "installationId",
            "bindingKeyId",
            "fingerprintAlgorithm",
            "publicKeyFingerprint",
            "requestId",
            "paymentReference",
            "currency",
            "paymentMethod",
            "paymentSource",
            "requestedAt",
            "decisionAt",
            "controlBundlePackageId",
            "importedRequestFileName",
            "importedRequestFilePath",
            "exportedResultFileName",
            "exportedResultFilePath"
        };

        for (String key : stringKeys) {

            String leftValue =
                left.optString(
                    key,
                    null
                );

            String rightValue =
                right.optString(
                    key,
                    null
                );

            if (
                leftValue == null ||
                !leftValue.equals(
                    rightValue
                )
            ) {
                return false;
            }
        }

        /*
         * recordedAt is intentionally not used for idempotent
         * equivalence. A retry after a successfully persisted
         * decision may observe a different local evidence clock,
         * while the signed decision identity/evidence is unchanged.
         */
        return (
            left.optLong(
                "amountMinor",
                Long.MIN_VALUE
            ) ==
                right.optLong(
                    "amountMinor",
                    Long.MIN_VALUE
                ) &&
            left.optInt(
                "schemaVersion",
                -1
            ) ==
                right.optInt(
                    "schemaVersion",
                    -1
                )
        );
    }

    // ========================================================
    // DEFAULTS
    // ========================================================

    private static JSONObject createMandatoryDefaults()
        throws Exception {

        JSONObject defaults =
            new JSONObject();

        defaults.put(
            "customerCreateFee",
            30
        );

        defaults.put(
            "loanDisbursementFee",
            30
        );

        defaults.put(
            "collectionBelow25000Fee",
            20
        );

        defaults.put(
            "collection25000To50000Fee",
            25
        );

        defaults.put(
            "collectionAbove50000Fee",
            30
        );

        defaults.put(
            "source",
            "MANDATORY_DEFAULT"
        );

        defaults.put(
            "revision",
            0
        );

        defaults.put(
            "schemaVersion",
            1
        );

        return defaults;
    }


    private static JSONObject getIncomePricingFromRoot(
        JSONObject root
    ) throws Exception {

        Object stored =
            root.get(
                "incomePricing"
            );

        if (stored == JSONObject.NULL) {
            return createMandatoryDefaults();
        }

        return (JSONObject) stored;
    }


    // ========================================================
    // INPUT VALIDATION
    // ========================================================

    private static double requirePrice(
        JSONObject source,
        String key,
        boolean optional
    ) throws Exception {

        if (
            source == null ||
            !source.has(key) ||
            source.isNull(key)
        ) {

            if (optional) {
                return Double.NaN;
            }

            throw new IllegalArgumentException(
                "FINORA Pricing " +
                key +
                " is required."
            );
        }

        Object raw =
            source.get(
                key
            );

        if (!(raw instanceof Number)) {

            throw new IllegalArgumentException(
                "FINORA Pricing " +
                key +
                " must be a positive finite number."
            );
        }

        double value =
            (
                (Number) raw
            ).doubleValue();

        if (
            !Double.isFinite(value) ||
            value <= 0.0d
        ) {

            throw new IllegalArgumentException(
                "FINORA Pricing " +
                key +
                " must be a positive finite number."
            );
        }

        return value;
    }


    private static String requireScopeString(
        JSONObject source,
        String key
    ) throws Exception {

        if (source == null) {

            throw new IllegalArgumentException(
                "FINORA Branch Pricing scope is required."
            );
        }

        String raw =
            source.optString(
                key,
                null
            );

        String normalized =
            raw == null
                ? ""
                : raw.trim();

        if (normalized.isEmpty()) {

            throw new IllegalArgumentException(
                "FINORA Branch Pricing " +
                key +
                " is required."
            );
        }

        return normalized;
    }


    private static Scope normalizeScope(
        JSONObject source
    ) throws Exception {

        return new Scope(
            requireScopeString(
                source,
                "ownerId"
            ),
            requireScopeString(
                source,
                "businessId"
            ),
            requireScopeString(
                source,
                "branchId"
            )
        );
    }


    // ========================================================
    // ROOT VALIDATION
    // ========================================================

    private static JSONObject createEmptyRoot()
        throws Exception {

        JSONObject root =
            new JSONObject();

        root.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        root.put(
            "incomePricing",
            JSONObject.NULL
        );

        root.put(
            "branchPricing",
            new JSONArray()
        );

        root.put(
            "walletHistory",
            new JSONArray()
        );

        return root;
    }


    private static void validateRoot(
        JSONObject root
    ) throws Exception {

        if (
            root == null ||
            root.length() != 4 ||
            root.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION
        ) {

            throw new IllegalStateException(
                "FINORA Developer operational store root is invalid."
            );
        }

        if (!root.has("incomePricing")) {

            throw new IllegalStateException(
                "FINORA Developer operational Income Pricing state is missing."
            );
        }

        Object income =
            root.get(
                "incomePricing"
            );

        if (income != JSONObject.NULL) {

            if (!(income instanceof JSONObject)) {

                throw new IllegalStateException(
                    "FINORA Developer operational Income Pricing state is invalid."
                );
            }

            validateIncomePricing(
                (JSONObject) income,
                false
            );
        }

        JSONArray branchPricing =
            root.optJSONArray(
                "branchPricing"
            );

        JSONArray walletHistory =
            root.optJSONArray(
                "walletHistory"
            );

        if (
            branchPricing == null ||
            walletHistory == null
        ) {

            throw new IllegalStateException(
                "FINORA Developer operational arrays are invalid."
            );
        }

        for (
            int index = 0;
            index < branchPricing.length();
            index++
        ) {

            validateBranchPricing(
                branchPricing.getJSONObject(
                    index
                )
            );
        }

        for (
            int index = 0;
            index < walletHistory.length();
            index++
        ) {

            validateWalletHistoryRecord(
                walletHistory.getJSONObject(
                    index
                )
            );
        }
    }


    private static void validateIncomePricing(
        JSONObject value,
        boolean allowMandatory
    ) throws Exception {

        String source =
            value.optString(
                "source",
                null
            );

        boolean mandatory =
            "MANDATORY_DEFAULT".equals(
                source
            );

        boolean controlCenter =
            "CONTROL_CENTER".equals(
                source
            );

        if (
            (!allowMandatory && !controlCenter) ||
            (allowMandatory &&
                !mandatory &&
                !controlCenter)
        ) {

            throw new IllegalStateException(
                "FINORA Income Pricing source is invalid."
            );
        }

        for (String key : PRICE_KEYS) {

            requirePrice(
                value,
                key,
                false
            );
        }

        long revision =
            value.optLong(
                "revision",
                -1L
            );

        if (
            mandatory
                ? revision != 0L
                : revision <= 0L
        ) {

            throw new IllegalStateException(
                "FINORA Income Pricing revision is invalid."
            );
        }

        if (
            value.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {

            throw new IllegalStateException(
                "FINORA Income Pricing schemaVersion is invalid."
            );
        }

        if (controlCenter) {

            String updatedAt =
                value.optString(
                    "updatedAt",
                    null
                );

            if (
                updatedAt == null ||
                updatedAt.trim().isEmpty()
            ) {

                throw new IllegalStateException(
                    "FINORA Income Pricing updatedAt is invalid."
                );
            }
        }
    }


    private static void validateBranchPricing(
        JSONObject value
    ) throws Exception {

        Scope scope =
            normalizeScope(
                value
            );

        if (
            scope.ownerId.isEmpty() ||
            scope.businessId.isEmpty() ||
            scope.branchId.isEmpty()
        ) {

            throw new IllegalStateException(
                "FINORA Branch Pricing scope is invalid."
            );
        }

        int customCount =
            0;

        for (String key : PRICE_KEYS) {

            if (
                value.has(key) &&
                !value.isNull(key)
            ) {

                requirePrice(
                    value,
                    key,
                    false
                );

                customCount++;
            }
        }

        if (customCount == 0) {

            throw new IllegalStateException(
                "FINORA Branch Pricing requires at least one custom price."
            );
        }

        if (
            value.optLong(
                "revision",
                0L
            ) <= 0L ||
            value.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {

            throw new IllegalStateException(
                "FINORA Branch Pricing revision/schema is invalid."
            );
        }

        String updatedAt =
            value.optString(
                "updatedAt",
                null
            );

        if (
            updatedAt == null ||
            updatedAt.trim().isEmpty()
        ) {

            throw new IllegalStateException(
                "FINORA Branch Pricing updatedAt is invalid."
            );
        }
    }


    private static void validateWalletHistoryRecord(
        JSONObject record
    ) throws Exception {

        String decision =
            record.optString(
                "decision",
                null
            );

        if (
            !"APPROVED".equals(decision) &&
            !"DECLINED".equals(decision)
        ) {

            throw new IllegalStateException(
                "FINORA Wallet History decision is invalid."
            );
        }

        if (
            record.optLong(
                "amountMinor",
                0L
            ) <= 0L ||
            record.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {

            throw new IllegalStateException(
                "FINORA Wallet History amount/schema is invalid."
            );
        }

        String[] requiredStrings = {
            "historyId",
            "ownerId",
            "businessId",
            "branchId",
            "businessCode",
            "branchCode",
            "installationId",
            "bindingKeyId",
            "fingerprintAlgorithm",
            "publicKeyFingerprint",
            "requestId",
            "paymentReference",
            "currency",
            "paymentMethod",
            "paymentSource",
            "requestedAt",
            "decisionAt",
            "recordedAt",
            "controlBundlePackageId",
            "importedRequestFileName",
            "importedRequestFilePath",
            "exportedResultFileName",
            "exportedResultFilePath"
        };

        for (String key : requiredStrings) {

            String value =
                record.optString(
                    key,
                    null
                );

            if (
                value == null ||
                value.trim().isEmpty()
            ) {

                throw new IllegalStateException(
                    "FINORA Wallet History " +
                    key +
                    " is invalid."
                );
            }
        }
    }


    // ========================================================
    // BRANCH HELPERS
    // ========================================================

    private static int findBranchIndex(
        JSONArray records,
        Scope scope
    ) throws Exception {

        for (
            int index = 0;
            index < records.length();
            index++
        ) {

            JSONObject record =
                records.getJSONObject(
                    index
                );

            if (
                scope.ownerId.equals(
                    record.optString(
                        "ownerId",
                        null
                    )
                ) &&
                scope.businessId.equals(
                    record.optString(
                        "businessId",
                        null
                    )
                ) &&
                scope.branchId.equals(
                    record.optString(
                        "branchId",
                        null
                    )
                )
            ) {

                return index;
            }
        }

        return -1;
    }


    private static final class Scope {

        final String ownerId;
        final String businessId;
        final String branchId;

        Scope(
            String ownerId,
            String businessId,
            String branchId
        ) {

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;
        }
    }


    // ========================================================
    // ENCRYPTED STORAGE
    // ========================================================

    private AtomicFile getFile() {

        File directory =
            new File(
                context.getFilesDir(),
                DIRECTORY
            );

        if (
            !directory.exists() &&
            !directory.mkdirs() &&
            !directory.isDirectory()
        ) {

            throw new IllegalStateException(
                "FINORA Developer operational directory could not be created."
            );
        }

        return new AtomicFile(
            new File(
                directory,
                FILE_NAME
            )
        );
    }


    private SecretKey getOrCreateKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        keyStore.load(
            null
        );

        if (
            keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {

            KeyStore.SecretKeyEntry entry =
                (
                    KeyStore.SecretKeyEntry
                )
                    keyStore.getEntry(
                        KEY_ALIAS,
                        null
                    );

            if (entry == null) {

                throw new IllegalStateException(
                    "FINORA Developer operational key is unavailable."
                );
            }

            return entry.getSecretKey();
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
            );

        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                    KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(
                    KeyProperties.BLOCK_MODE_GCM
                )
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setKeySize(
                    256
                )
                .build()
        );

        return generator.generateKey();
    }


    private JSONObject encrypt(
        JSONObject root
    ) throws Exception {

        validateRoot(
            root
        );

        byte[] iv =
            null;

        byte[] plaintext =
            root.toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        try {

            Cipher cipher =
                Cipher.getInstance(
                    CIPHER
                );

            cipher.init(
                Cipher.ENCRYPT_MODE,
                getOrCreateKey()
            );

            iv =
                cipher.getIV();

            if (
                iv == null ||
                iv.length < 12 ||
                iv.length > 16
            ) {
                throw new IllegalStateException(
                    "FINORA Developer operational encryption produced an invalid AES-GCM IV."
                );
            }

            cipher.updateAAD(
                AAD
            );

            byte[] ciphertext =
                cipher.doFinal(
                    plaintext
                );

            JSONObject envelope =
                new JSONObject();

            envelope.put(
                "schemaVersion",
                SCHEMA_VERSION
            );

            envelope.put(
                "iv",
                Base64.encodeToString(
                    iv,
                    Base64.NO_WRAP
                )
            );

            envelope.put(
                "ciphertext",
                Base64.encodeToString(
                    ciphertext,
                    Base64.NO_WRAP
                )
            );

            return envelope;
        }
        finally {

            if (iv != null) {
                Arrays.fill(
                    iv,
                    (byte) 0
                );
            }

            Arrays.fill(
                plaintext,
                (byte) 0
            );
        }
    }


    private JSONObject decrypt(
        JSONObject envelope
    ) throws Exception {

        if (
            envelope == null ||
            envelope.length() != 3 ||
            envelope.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION
        ) {

            throw new IllegalStateException(
                "FINORA Developer operational envelope is invalid."
            );
        }

        byte[] iv =
            Base64.decode(
                envelope.getString(
                    "iv"
                ),
                Base64.DEFAULT
            );

        byte[] ciphertext =
            Base64.decode(
                envelope.getString(
                    "ciphertext"
                ),
                Base64.DEFAULT
            );

        try {

            if (
                iv.length != IV_BYTES ||
                ciphertext.length <= 16
            ) {

                throw new IllegalStateException(
                    "FINORA Developer operational ciphertext is invalid."
                );
            }

            Cipher cipher =
                Cipher.getInstance(
                    CIPHER
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                new GCMParameterSpec(
                    TAG_BITS,
                    iv
                )
            );

            cipher.updateAAD(
                AAD
            );

            byte[] plaintext =
                cipher.doFinal(
                    ciphertext
                );

            try {

                JSONObject root =
                    new JSONObject(
                        new String(
                            plaintext,
                            StandardCharsets.UTF_8
                        )
                    );

                validateRoot(
                    root
                );

                return root;
            }
            finally {

                Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }
        }
        finally {

            if (iv != null) {
                Arrays.fill(
                    iv,
                    (byte) 0
                );
            }

            Arrays.fill(
                ciphertext,
                (byte) 0
            );
        }
    }


    private JSONObject readRoot()
        throws Exception {

        AtomicFile atomicFile =
            getFile();

        if (
            !atomicFile
                .getBaseFile()
                .exists()
        ) {

            return createEmptyRoot();
        }

        byte[] bytes;

        try (
            FileInputStream input =
                atomicFile.openRead();

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {

            byte[] buffer =
                new byte[
                    8192
                ];

            int total =
                0;

            int read;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) != -1
            ) {

                total +=
                    read;

                if (
                    total >
                        MAX_FILE_BYTES
                ) {

                    throw new IllegalStateException(
                        "FINORA Developer operational store is oversized."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            bytes =
                output.toByteArray();
        }

        if (bytes.length == 0) {

            throw new IllegalStateException(
                "FINORA Developer operational store is empty."
            );
        }

        try {

            JSONObject envelope =
                new JSONObject(
                    new String(
                        bytes,
                        StandardCharsets.UTF_8
                    )
                );

            return decrypt(
                envelope
            );
        }
        finally {

            Arrays.fill(
                bytes,
                (byte) 0
            );
        }
    }


    private void writeRoot(
        JSONObject root
    ) throws Exception {

        JSONObject envelope =
            encrypt(
                root
            );

        byte[] bytes =
            envelope.toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        AtomicFile atomicFile =
            getFile();

        FileOutputStream output =
            null;

        try {

            output =
                atomicFile.startWrite();

            output.write(
                bytes
            );

            output.flush();

            atomicFile.finishWrite(
                output
            );

            output =
                null;
        }
        catch (Exception error) {

            if (output != null) {

                atomicFile.failWrite(
                    output
                );
            }

            throw error;
        }
        finally {

            Arrays.fill(
                bytes,
                (byte) 0
            );
        }
    }


    // ========================================================
    // CLONE / TIME
    // ========================================================

    private static JSONObject cloneObject(
        JSONObject value
    ) throws Exception {

        return new JSONObject(
            value.toString()
        );
    }


    private static JSONArray cloneArray(
        JSONArray value
    ) throws Exception {

        return new JSONArray(
            value.toString()
        );
    }


    private static String nowIso() {

        java.text.SimpleDateFormat format =
            new java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                java.util.Locale.US
            );

        format.setTimeZone(
            java.util.TimeZone.getTimeZone(
                "UTC"
            )
        );

        return format.format(
            new java.util.Date()
        );
    }
}