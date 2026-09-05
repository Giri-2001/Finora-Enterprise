package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// VERIFIED STORAGE ENTITLEMENT STATE ENGINE
//
// RESPONSIBILITY:
//
// - Accept only an already-verified STORAGE_ENTITLEMENT package
// - Revalidate purpose / payload / branch / installation binding
// - Enforce LOCAL / USB entitlement identity invariants
// - Enforce replay protection and monotonic sequence state
// - Produce one complete next Control Store state
//
// SECURITY:
//
// - Pure Java state engine.
// - No Android Context.
// - No AndroidKeyStore.
// - No persistence.
// - No signing.
// - No private key.
// - No WebView.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class FinoraStorageEntitlementStateEngine {

    private FinoraStorageEntitlementStateEngine() {
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final String error;

        public final Map<String, Object> nextState;

        private Result(
            boolean success,
            String error,
            Map<String, Object> nextState
        ) {

            this.success =
                success;

            this.error =
                error;

            this.nextState =
                nextState;
        }

        public static Result success(
            Map<String, Object> nextState
        ) {

            return new Result(
                true,
                null,
                nextState
            );
        }

        public static Result failure(
            String error
        ) {

            return new Result(
                false,
                error,
                null
            );
        }
    }

    // ========================================================
    // APPLY VERIFIED PACKAGE
    // ========================================================

    public static Result applyVerifiedPackage(
        Map<String, Object> currentState,
        Map<String, Object> verifiedPackage,
        Instant appliedAt
    ) {

        if (
            currentState == null ||
            verifiedPackage == null ||
            appliedAt == null
        ) {

            return Result.failure(
                "FINORA verified Storage Entitlement apply input is incomplete."
            );
        }


        // ----------------------------------------------------
        // CURRENT CONTROL STORE
        // ----------------------------------------------------

        if (
            !"1.0".equals(
                currentState.get(
                    "version"
                )
            )
        ) {

            return Result.failure(
                "Unsupported FINORA Android Control Store package version."
            );
        }

        Map<String, Object> installation =
            asMap(
                currentState.get(
                    "installation"
                )
            );

        List<Map<String, Object>> activations =
            asMapList(
                currentState.get(
                    "activations"
                )
            );

        List<Map<String, Object>> storageEntitlements =
            asMapList(
                currentState.get(
                    "storageEntitlements"
                )
            );

        if (
            installation == null ||
            activations == null ||
            storageEntitlements == null
        ) {

            return Result.failure(
                "FINORA Android Control Store package is incomplete."
            );
        }

        String installedInstallationId =
            requiredString(
                installation.get(
                    "installationId"
                )
            );

        String installedOwnerId =
            requiredString(
                installation.get(
                    "ownerId"
                )
            );

        String installedBusinessId =
            requiredString(
                installation.get(
                    "businessId"
                )
            );

        String installedBranchId =
            requiredString(
                installation.get(
                    "branchId"
                )
            );

        if (
            installedInstallationId == null ||
            installedOwnerId == null ||
            installedBusinessId == null ||
            installedBranchId == null
        ) {

            return Result.failure(
                "FINORA installed branch identity is invalid."
            );
        }


        // ----------------------------------------------------
        // VERIFIED PACKAGE ROOT
        // ----------------------------------------------------

        String packageId =
            requiredString(
                verifiedPackage.get(
                    "packageId"
                )
            );

        String purpose =
            requiredString(
                verifiedPackage.get(
                    "purpose"
                )
            );

        Long sequence =
            positiveSafeLong(
                verifiedPackage.get(
                    "sequence"
                )
            );

        if (
            packageId == null ||
            !"STORAGE_ENTITLEMENT".equals(
                purpose
            ) ||
            sequence == null ||
            !isExactInteger(
                verifiedPackage.get(
                    "payloadVersion"
                ),
                1L
            )
        ) {

            return Result.failure(
                "FINORA verified package is not a valid STORAGE_ENTITLEMENT package."
            );
        }

        Map<String, Object> issuer =
            asMap(
                verifiedPackage.get(
                    "issuer"
                )
            );

        Map<String, Object> target =
            asMap(
                verifiedPackage.get(
                    "target"
                )
            );

        Map<String, Object> payload =
            asMap(
                verifiedPackage.get(
                    "payload"
                )
            );

        if (
            issuer == null ||
            target == null ||
            payload == null
        ) {

            return Result.failure(
                "FINORA Storage Entitlement package objects are incomplete."
            );
        }

        String issuerId =
            requiredString(
                issuer.get(
                    "issuerId"
                )
            );

        String ownerId =
            requiredString(
                target.get(
                    "ownerId"
                )
            );

        String businessId =
            requiredString(
                target.get(
                    "businessId"
                )
            );

        String branchId =
            requiredString(
                target.get(
                    "branchId"
                )
            );

        String installationId =
            requiredString(
                target.get(
                    "installationId"
                )
            );

        if (
            issuerId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null ||
            installationId == null ||
            !isNativeBindingIdentityValid(
                target
            )
        ) {

            return Result.failure(
                "FINORA Storage Entitlement signed target is invalid."
            );
        }


        // ----------------------------------------------------
        // CURRENT INSTALLATION <-> SIGNED TARGET
        // ----------------------------------------------------

        if (
            !installedOwnerId.equals(
                ownerId
            ) ||
            !installedBusinessId.equals(
                businessId
            ) ||
            !installedBranchId.equals(
                branchId
            ) ||
            !installedInstallationId.equals(
                installationId
            )
        ) {

            return Result.failure(
                "FINORA Storage Entitlement target does not match the installed branch."
            );
        }


        // ----------------------------------------------------
        // PAYLOAD
        // ----------------------------------------------------

        if (
            !isExactInteger(
                payload.get(
                    "schemaVersion"
                ),
                1L
            )
        ) {

            return Result.failure(
                "FINORA Storage Entitlement payload schemaVersion is invalid."
            );
        }

        String payloadIssuedAtText =
            requiredString(
                payload.get(
                    "issuedAt"
                )
            );

        String packageIssuedAtText =
            requiredString(
                verifiedPackage.get(
                    "issuedAt"
                )
            );

        Instant payloadIssuedAt =
            parseInstant(
                payloadIssuedAtText
            );

        Instant packageIssuedAt =
            parseInstant(
                packageIssuedAtText
            );

        if (
            payloadIssuedAt == null ||
            packageIssuedAt == null ||
            payloadIssuedAtText == null ||
            !payloadIssuedAtText.equals(
                packageIssuedAtText
            )
        ) {

            return Result.failure(
                "FINORA Storage Entitlement payload and package issuedAt timestamps must match."
            );
        }

        Map<String, Object> entitlement =
            asMap(
                payload.get(
                    "entitlement"
                )
            );

        String entitlementError =
            validateStorageEntitlement(
                entitlement,
                payloadIssuedAt
            );

        if (entitlementError != null) {

            return Result.failure(
                entitlementError
            );
        }


        // ----------------------------------------------------
        // ENTITLEMENT <-> SIGNED TARGET
        // ----------------------------------------------------

        if (
            !sameText(
                entitlement,
                "ownerId",
                ownerId
            ) ||
            !sameText(
                entitlement,
                "businessId",
                businessId
            ) ||
            !sameText(
                entitlement,
                "branchId",
                branchId
            ) ||
            !sameText(
                entitlement,
                "installationId",
                installationId
            ) ||
            !sameText(
                entitlement,
                "bindingKeyId",
                requiredString(
                    target.get(
                        "bindingKeyId"
                    )
                )
            ) ||
            !sameText(
                entitlement,
                "fingerprintAlgorithm",
                requiredString(
                    target.get(
                        "fingerprintAlgorithm"
                    )
                )
            ) ||
            !sameText(
                entitlement,
                "publicKeyFingerprint",
                requiredString(
                    target.get(
                        "publicKeyFingerprint"
                    )
                )
            )
        ) {

            return Result.failure(
                "FINORA Storage Entitlement payload does not match the signed target."
            );
        }


        // ----------------------------------------------------
        // SECURITY ARRAYS
        // ----------------------------------------------------

        List<Map<String, Object>> appliedPackages =
            optionalMapList(
                currentState.get(
                    "appliedControlPackages"
                )
            );

        List<Map<String, Object>> sequenceStates =
            optionalMapList(
                currentState.get(
                    "controlSequences"
                )
            );

        if (
            appliedPackages == null ||
            sequenceStates == null
        ) {

            return Result.failure(
                "FINORA signed control security state is malformed."
            );
        }

        if (
            hasDuplicatePackageIds(
                appliedPackages
            ) ||
            hasDuplicateSequenceScopes(
                sequenceStates
            ) ||
            hasDuplicateStorageEntitlementKeys(
                storageEntitlements
            ) ||
            hasDuplicateStorageEntitlementIds(
                storageEntitlements
            )
        ) {

            return Result.failure(
                "FINORA Storage Entitlement control state contains duplicate identities."
            );
        }


        // ----------------------------------------------------
        // REPLAY / SEQUENCE
        // ----------------------------------------------------

        FinoraControlReplayPolicy.Decision replayDecision =
            FinoraControlReplayPolicy.evaluate(
                packageId,
                issuerId,
                purpose,
                sequence.longValue(),
                ownerId,
                businessId,
                branchId,
                installationId,
                appliedPackages,
                sequenceStates
            );

        if (!replayDecision.accepted) {

            return Result.failure(
                replayDecision.reason +
                    ": " +
                    replayDecision.error
            );
        }


        // ----------------------------------------------------
        // DEEP-COPY CURRENT STATE
        // ----------------------------------------------------

        Map<String, Object> nextState =
            deepCopyMap(
                currentState
            );

        List<Map<String, Object>> nextEntitlements =
            requiredMapList(
                nextState,
                "storageEntitlements"
            );

        List<Map<String, Object>> nextAppliedPackages =
            ensureMapList(
                nextState,
                "appliedControlPackages"
            );

        List<Map<String, Object>> nextSequenceStates =
            ensureMapList(
                nextState,
                "controlSequences"
            );

        if (nextEntitlements == null) {

            return Result.failure(
                "FINORA Storage Entitlement state list is unavailable."
            );
        }


        // ----------------------------------------------------
        // ENTITLEMENT UPSERT
        //
        // Logical identity:
        //
        // userId + ownerId + businessId + branchId + storageMode
        //
        // entitlementId and native installation binding cannot
        // move to another logical entitlement.
        // ----------------------------------------------------

        int entitlementIndex =
            findStorageEntitlementIndex(
                nextEntitlements,
                entitlement
            );

        int sameEntitlementIdIndex =
            findStorageEntitlementIdIndex(
                nextEntitlements,
                requiredString(
                    entitlement.get(
                        "entitlementId"
                    )
                )
            );

        if (
            sameEntitlementIdIndex >= 0 &&
            sameEntitlementIdIndex !=
                entitlementIndex
        ) {

            return Result.failure(
                "FINORA storage entitlement identity cannot move to another user, branch or storage mode."
            );
        }

        if (entitlementIndex >= 0) {

            Map<String, Object> existing =
                nextEntitlements.get(
                    entitlementIndex
                );

            if (
                !sameText(
                    existing,
                    "entitlementId",
                    requiredString(
                        entitlement.get(
                            "entitlementId"
                        )
                    )
                )
            ) {

                return Result.failure(
                    "FINORA storage entitlement identity cannot be replaced."
                );
            }

            if (
                !sameText(
                    existing,
                    "installationId",
                    requiredString(
                        entitlement.get(
                            "installationId"
                        )
                    )
                ) ||
                !sameText(
                    existing,
                    "bindingKeyId",
                    requiredString(
                        entitlement.get(
                            "bindingKeyId"
                        )
                    )
                ) ||
                !sameText(
                    existing,
                    "fingerprintAlgorithm",
                    requiredString(
                        entitlement.get(
                            "fingerprintAlgorithm"
                        )
                    )
                ) ||
                !sameText(
                    existing,
                    "publicKeyFingerprint",
                    requiredString(
                        entitlement.get(
                            "publicKeyFingerprint"
                        )
                    )
                )
            ) {

                return Result.failure(
                    "FINORA storage entitlement native installation binding cannot be replaced."
                );
            }

            nextEntitlements.set(
                entitlementIndex,
                deepCopyMap(
                    entitlement
                )
            );

        } else {

            nextEntitlements.add(
                deepCopyMap(
                    entitlement
                )
            );
        }


        // ----------------------------------------------------
        // REPLAY LEDGER
        // ----------------------------------------------------

        String appliedAtText =
            appliedAt.toString();

        Map<String, Object> appliedRecord =
            new LinkedHashMap<>();

        appliedRecord.put(
            "packageId",
            packageId
        );

        appliedRecord.put(
            "issuerId",
            issuerId
        );

        appliedRecord.put(
            "purpose",
            purpose
        );

        appliedRecord.put(
            "sequence",
            sequence
        );

        appliedRecord.put(
            "ownerId",
            ownerId
        );

        appliedRecord.put(
            "businessId",
            businessId
        );

        appliedRecord.put(
            "branchId",
            branchId
        );

        appliedRecord.put(
            "installationId",
            installationId
        );

        appliedRecord.put(
            "appliedAt",
            appliedAtText
        );

        nextAppliedPackages.add(
            appliedRecord
        );


        // ----------------------------------------------------
        // MONOTONIC SEQUENCE STATE
        // ----------------------------------------------------

        int sequenceIndex =
            findSequenceIndex(
                nextSequenceStates,
                issuerId,
                purpose,
                ownerId,
                businessId,
                branchId,
                installationId
            );

        Map<String, Object> nextSequence =
            new LinkedHashMap<>();

        nextSequence.put(
            "issuerId",
            issuerId
        );

        nextSequence.put(
            "purpose",
            purpose
        );

        nextSequence.put(
            "ownerId",
            ownerId
        );

        nextSequence.put(
            "businessId",
            businessId
        );

        nextSequence.put(
            "branchId",
            branchId
        );

        nextSequence.put(
            "installationId",
            installationId
        );

        nextSequence.put(
            "lastSequence",
            sequence
        );

        nextSequence.put(
            "updatedAt",
            appliedAtText
        );

        if (sequenceIndex >= 0) {

            nextSequenceStates.set(
                sequenceIndex,
                nextSequence
            );

        } else {

            nextSequenceStates.add(
                nextSequence
            );
        }


        // ----------------------------------------------------
        // FINAL NEXT STATE
        // ----------------------------------------------------

        nextState.put(
            "updatedAt",
            appliedAtText
        );

        return Result.success(
            nextState
        );
    }


    // ========================================================
    // STORAGE ENTITLEMENT VALIDATION
    // ========================================================

    private static String validateStorageEntitlement(
        Map<String, Object> entitlement,
        Instant payloadIssuedAt
    ) {

        if (
            entitlement == null ||
            payloadIssuedAt == null ||
            !hasRequiredString(
                entitlement,
                "entitlementId"
            ) ||
            !hasRequiredString(
                entitlement,
                "userId"
            ) ||
            !hasRequiredString(
                entitlement,
                "ownerId"
            ) ||
            !hasRequiredString(
                entitlement,
                "businessId"
            ) ||
            !hasRequiredString(
                entitlement,
                "branchId"
            ) ||
            !isNativeBindingIdentityValid(
                entitlement
            ) ||
            !isExactInteger(
                entitlement.get(
                    "schemaVersion"
                ),
                1L
            )
        ) {

            return "FINORA Storage Entitlement identity is invalid.";
        }

        String storageMode =
            requiredString(
                entitlement.get(
                    "storageMode"
                )
            );

        if (
            !"LOCAL".equals(
                storageMode
            ) &&
            !"USB".equals(
                storageMode
            )
        ) {

            return "FINORA Storage Entitlement storageMode must be LOCAL or USB.";
        }

        String status =
            requiredString(
                entitlement.get(
                    "status"
                )
            );

        if (
            !"ACTIVE".equals(
                status
            ) &&
            !"SUSPENDED".equals(
                status
            ) &&
            !"REVOKED".equals(
                status
            )
        ) {

            return "FINORA Storage Entitlement status is invalid.";
        }

        Instant activatedAt =
            parseInstant(
                entitlement.get(
                    "activatedAt"
                )
            );

        Instant createdAt =
            parseInstant(
                entitlement.get(
                    "createdAt"
                )
            );

        Instant updatedAt =
            parseInstant(
                entitlement.get(
                    "updatedAt"
                )
            );

        if (
            activatedAt == null ||
            createdAt == null ||
            updatedAt == null
        ) {

            return "FINORA Storage Entitlement timestamps are invalid.";
        }

        if (
            createdAt.isAfter(
                activatedAt
            ) ||
            activatedAt.isAfter(
                updatedAt
            ) ||
            updatedAt.isAfter(
                payloadIssuedAt
            )
        ) {

            return "FINORA Storage Entitlement timestamp order is invalid.";
        }

        return null;
    }


    // ========================================================
    // NATIVE BINDING
    // ========================================================

    private static boolean isNativeBindingIdentityValid(
        Map<String, Object> value
    ) {

        if (value == null) {
            return false;
        }

        String bindingKeyId =
            requiredString(
                value.get(
                    "bindingKeyId"
                )
            );

        String fingerprintAlgorithm =
            requiredString(
                value.get(
                    "fingerprintAlgorithm"
                )
            );

        String publicKeyFingerprint =
            requiredString(
                value.get(
                    "publicKeyFingerprint"
                )
            );

        if (
            requiredString(
                value.get(
                    "installationId"
                )
            ) == null ||
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "[0-9a-f]{64}"
            )
        ) {

            return false;
        }

        String expectedBindingKeyId =
            "FINORA-BINDING-" +
            publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase();

        return expectedBindingKeyId.equals(
            bindingKeyId
        );
    }


    // ========================================================
    // DUPLICATE DETECTION
    // ========================================================

    private static boolean hasDuplicatePackageIds(
        List<Map<String, Object>> values
    ) {

        Set<String> ids =
            new HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String id =
                requiredString(
                    value != null
                        ? value.get(
                            "packageId"
                        )
                        : null
                );

            if (
                id == null ||
                !ids.add(
                    id
                )
            ) {

                return true;
            }
        }

        return false;
    }

    private static boolean hasDuplicateSequenceScopes(
        List<Map<String, Object>> values
    ) {

        Set<String> scopes =
            new HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String scope =
                sequenceScopeKey(
                    value
                );

            if (
                scope == null ||
                !scopes.add(
                    scope
                )
            ) {

                return true;
            }
        }

        return false;
    }

    private static boolean hasDuplicateStorageEntitlementKeys(
        List<Map<String, Object>> values
    ) {

        Set<String> keys =
            new HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String key =
                storageEntitlementKey(
                    value
                );

            if (
                key == null ||
                !keys.add(
                    key
                )
            ) {

                return true;
            }
        }

        return false;
    }

    private static boolean hasDuplicateStorageEntitlementIds(
        List<Map<String, Object>> values
    ) {

        Set<String> ids =
            new HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String id =
                requiredString(
                    value != null
                        ? value.get(
                            "entitlementId"
                        )
                        : null
                );

            if (
                id == null ||
                !ids.add(
                    id
                )
            ) {

                return true;
            }
        }

        return false;
    }


    // ========================================================
    // FIND
    // ========================================================

    private static int findStorageEntitlementIndex(
        List<Map<String, Object>> values,
        Map<String, Object> expected
    ) {

        String expectedKey =
            storageEntitlementKey(
                expected
            );

        if (expectedKey == null) {
            return -1;
        }

        for (
            int index = 0;
            index < values.size();
            index++
        ) {

            if (
                expectedKey.equals(
                    storageEntitlementKey(
                        values.get(
                            index
                        )
                    )
                )
            ) {

                return index;
            }
        }

        return -1;
    }

    private static int findStorageEntitlementIdIndex(
        List<Map<String, Object>> values,
        String entitlementId
    ) {

        if (entitlementId == null) {
            return -1;
        }

        for (
            int index = 0;
            index < values.size();
            index++
        ) {

            Map<String, Object> value =
                values.get(
                    index
                );

            if (
                value != null &&
                entitlementId.equals(
                    value.get(
                        "entitlementId"
                    )
                )
            ) {

                return index;
            }
        }

        return -1;
    }

    private static int findSequenceIndex(
        List<Map<String, Object>> values,
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

        String expected =
            sequenceScopeKey(
                issuerId,
                purpose,
                ownerId,
                businessId,
                branchId,
                installationId
            );

        for (
            int index = 0;
            index < values.size();
            index++
        ) {

            if (
                expected.equals(
                    sequenceScopeKey(
                        values.get(
                            index
                        )
                    )
                )
            ) {

                return index;
            }
        }

        return -1;
    }


    // ========================================================
    // KEYS
    // ========================================================

    private static String storageEntitlementKey(
        Map<String, Object> value
    ) {

        if (value == null) {
            return null;
        }

        String userId =
            requiredString(
                value.get(
                    "userId"
                )
            );

        String ownerId =
            requiredString(
                value.get(
                    "ownerId"
                )
            );

        String businessId =
            requiredString(
                value.get(
                    "businessId"
                )
            );

        String branchId =
            requiredString(
                value.get(
                    "branchId"
                )
            );

        String storageMode =
            requiredString(
                value.get(
                    "storageMode"
                )
            );

        if (
            userId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null ||
            storageMode == null
        ) {

            return null;
        }

        return (
            userId +
            "::" +
            ownerId +
            "::" +
            businessId +
            "::" +
            branchId +
            "::" +
            storageMode
        );
    }

    private static String sequenceScopeKey(
        Map<String, Object> value
    ) {

        if (value == null) {
            return null;
        }

        return sequenceScopeKey(
            requiredString(
                value.get(
                    "issuerId"
                )
            ),
            requiredString(
                value.get(
                    "purpose"
                )
            ),
            requiredString(
                value.get(
                    "ownerId"
                )
            ),
            requiredString(
                value.get(
                    "businessId"
                )
            ),
            requiredString(
                value.get(
                    "branchId"
                )
            ),
            requiredString(
                value.get(
                    "installationId"
                )
            )
        );
    }

    private static String sequenceScopeKey(
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

        if (
            issuerId == null ||
            purpose == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null ||
            installationId == null
        ) {

            return null;
        }

        return (
            issuerId +
            "::" +
            purpose +
            "::" +
            ownerId +
            "::" +
            businessId +
            "::" +
            branchId +
            "::" +
            installationId
        );
    }


    // ========================================================
    // MAP / LIST HELPERS
    // ========================================================

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map)) {
            return null;
        }

        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asMapList(
        Object value
    ) {

        if (!(value instanceof List)) {
            return null;
        }

        List<?> raw =
            (List<?>) value;

        List<Map<String, Object>> output =
            new ArrayList<>();

        for (Object item : raw) {

            if (!(item instanceof Map)) {
                return null;
            }

            output.add(
                (Map<String, Object>) item
            );
        }

        return output;
    }

    private static List<Map<String, Object>> optionalMapList(
        Object value
    ) {

        if (value == null) {
            return new ArrayList<>();
        }

        return asMapList(
            value
        );
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> requiredMapList(
        Map<String, Object> state,
        String key
    ) {

        Object value =
            state.get(
                key
            );

        if (!(value instanceof List)) {
            return null;
        }

        return (
            List<Map<String, Object>>
        ) value;
    }

    private static List<Map<String, Object>> ensureMapList(
        Map<String, Object> state,
        String key
    ) {

        List<Map<String, Object>> existing =
            asMapList(
                state.get(
                    key
                )
            );

        if (existing != null) {

            state.put(
                key,
                existing
            );

            return existing;
        }

        List<Map<String, Object>> created =
            new ArrayList<>();

        state.put(
            key,
            created
        );

        return created;
    }


    // ========================================================
    // DEEP COPY
    // ========================================================

    private static Map<String, Object> deepCopyMap(
        Map<String, Object> source
    ) {

        Map<String, Object> output =
            new LinkedHashMap<>();

        for (
            Map.Entry<String, Object> entry :
            source.entrySet()
        ) {

            output.put(
                entry.getKey(),
                deepCopyValue(
                    entry.getValue()
                )
            );
        }

        return output;
    }

    private static Object deepCopyValue(
        Object value
    ) {

        if (value instanceof Map) {

            @SuppressWarnings("unchecked")
            Map<String, Object> map =
                (Map<String, Object>) value;

            return deepCopyMap(
                map
            );
        }

        if (value instanceof List) {

            List<?> list =
                (List<?>) value;

            List<Object> output =
                new ArrayList<>();

            for (Object item : list) {

                output.add(
                    deepCopyValue(
                        item
                    )
                );
            }

            return output;
        }

        return value;
    }


    // ========================================================
    // PRIMITIVES
    // ========================================================

    private static boolean hasRequiredString(
        Map<String, Object> value,
        String key
    ) {

        return (
            value != null &&
            requiredString(
                value.get(
                    key
                )
            ) != null
        );
    }

    private static String requiredString(
        Object value
    ) {

        if (!(value instanceof String)) {
            return null;
        }

        String normalized =
            ((String) value)
                .trim();

        return normalized.isEmpty()
            ? null
            : normalized;
    }

    private static boolean sameText(
        Map<String, Object> value,
        String key,
        String expected
    ) {

        if (
            value == null ||
            expected == null
        ) {
            return false;
        }

        return expected.equals(
            requiredString(
                value.get(
                    key
                )
            )
        );
    }

    private static Instant parseInstant(
        Object value
    ) {

        String text =
            requiredString(
                value
            );

        if (text == null) {
            return null;
        }

        try {

            return Instant.parse(
                text
            );

        } catch (Exception ignored) {

            return null;
        }
    }

    private static Long positiveSafeLong(
        Object value
    ) {

        if (!(value instanceof Number)) {
            return null;
        }

        double number =
            ((Number) value)
                .doubleValue();

        if (
            !Double.isFinite(
                number
            ) ||
            number <= 0 ||
            Math.rint(
                number
            ) !=
                number ||
            number >
                9007199254740991.0d
        ) {

            return null;
        }

        long converted =
            ((Number) value)
                .longValue();

        if (
            ((double) converted) !=
                number
        ) {

            return null;
        }

        return Long.valueOf(
            converted
        );
    }

    private static boolean isExactInteger(
        Object value,
        long expected
    ) {

        Long converted =
            positiveSafeLong(
                value
            );

        return (
            converted != null &&
            converted.longValue() ==
                expected
        );
    }
}

// ============================================================
// END
// ============================================================