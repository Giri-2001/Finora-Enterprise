package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID PRICING POLICY STATE ENGINE
//
// RESPONSIBILITY:
//
// - Consume an already-verified signed PRICING_POLICY package.
// - Enforce the authoritative Pricing Override domain contract.
// - Enforce exact installed branch scope.
// - Enforce exact signed installation-binding tuple.
// - Enforce REPLACE-only Pricing Policy lifecycle.
// - Enforce positive fixed INR pricing.
// - Keep Base-disabled charges disabled.
// - Reject duplicate / overlapping override schedules.
// - Preserve stable overrideSetId lineage per exact scope.
// - Share generic replay / monotonic sequence authority.
// - Return one complete next Control Store state.
//
// SECURITY:
//
// - Pure state transition.
// - No Android storage access.
// - No renderer/WebView access.
// - No signature verification duplication.
// - No private key access.
// - No Business Date.
// - No persistence side effects.
//
// ============================================================

import java.time.Instant;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;


// ============================================================
// STATE ENGINE
// ============================================================

public final class FinoraPricingPolicyStateEngine {

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;


    private FinoraPricingPolicyStateEngine() {
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
                "FINORA verified Pricing Policy apply input is incomplete."
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
                "FINORA installation identity is invalid."
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

        Long payloadVersion =
            positiveSafeLong(
                verifiedPackage.get(
                    "payloadVersion"
                )
            );

        String packageIssuedAt =
            requiredString(
                verifiedPackage.get(
                    "issuedAt"
                )
            );

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

        String issuerId =
            issuer == null
                ? null
                : requiredString(
                    issuer.get(
                        "issuerId"
                    )
                );

        if (
            packageId == null ||
            issuerId == null ||
            !"PRICING_POLICY".equals(
                purpose
            ) ||
            sequence == null ||
            payloadVersion == null ||
            payloadVersion.longValue() !=
                1L ||
            !isCanonicalInstant(
                packageIssuedAt
            ) ||
            target == null ||
            payload == null
        ) {
            return Result.failure(
                "FINORA verified Pricing Policy package structure is invalid."
            );
        }


        // ----------------------------------------------------
        // VERIFIED PACKAGE TARGET
        // ----------------------------------------------------

        String targetOwnerId =
            requiredString(
                target.get(
                    "ownerId"
                )
            );

        String targetBusinessId =
            requiredString(
                target.get(
                    "businessId"
                )
            );

        String targetBranchId =
            requiredString(
                target.get(
                    "branchId"
                )
            );

        String targetInstallationId =
            requiredString(
                target.get(
                    "installationId"
                )
            );

        String targetBindingKeyId =
            requiredString(
                target.get(
                    "bindingKeyId"
                )
            );

        String targetFingerprintAlgorithm =
            requiredString(
                target.get(
                    "fingerprintAlgorithm"
                )
            );

        String targetPublicKeyFingerprint =
            requiredString(
                target.get(
                    "publicKeyFingerprint"
                )
            );

        if (
            targetOwnerId == null ||
            targetBusinessId == null ||
            targetBranchId == null ||
            targetInstallationId == null ||
            targetBindingKeyId == null ||
            !"SHA-256".equals(
                targetFingerprintAlgorithm
            ) ||
            !isCanonicalSha256Fingerprint(
                targetPublicKeyFingerprint
            ) ||
            !bindingKeyMatchesFingerprint(
                targetBindingKeyId,
                targetPublicKeyFingerprint
            )
        ) {
            return Result.failure(
                "FINORA verified Pricing Policy target is invalid."
            );
        }

        if (
            !installedOwnerId.equals(
                targetOwnerId
            ) ||
            !installedBusinessId.equals(
                targetBusinessId
            ) ||
            !installedBranchId.equals(
                targetBranchId
            ) ||
            !installedInstallationId.equals(
                targetInstallationId
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy target does not match the installed branch."
            );
        }


        // ----------------------------------------------------
        // PAYLOAD ROOT
        // ----------------------------------------------------

        String action =
            requiredString(
                payload.get(
                    "action"
                )
            );

        String payloadIssuedAt =
            requiredString(
                payload.get(
                    "issuedAt"
                )
            );

        Map<String, Object> overrideSet =
            asMap(
                payload.get(
                    "overrideSet"
                )
            );

        Map<String, Object> payloadBinding =
            asMap(
                payload.get(
                    "installationBinding"
                )
            );

        if (
            !"REPLACE".equals(
                action
            ) ||
            !isExactOne(
                payload.get(
                    "schemaVersion"
                )
            ) ||
            payloadIssuedAt == null ||
            !isCanonicalInstant(
                payloadIssuedAt
            ) ||
            !packageIssuedAt.equals(
                payloadIssuedAt
            ) ||
            overrideSet == null ||
            payloadBinding == null
        ) {
            return Result.failure(
                "FINORA Pricing Policy payload is invalid."
            );
        }


        // ----------------------------------------------------
        // PAYLOAD INSTALLATION BINDING
        // ----------------------------------------------------

        String payloadInstallationId =
            requiredString(
                payloadBinding.get(
                    "installationId"
                )
            );

        String payloadBindingKeyId =
            requiredString(
                payloadBinding.get(
                    "bindingKeyId"
                )
            );

        String payloadFingerprintAlgorithm =
            requiredString(
                payloadBinding.get(
                    "fingerprintAlgorithm"
                )
            );

        String payloadPublicKeyFingerprint =
            requiredString(
                payloadBinding.get(
                    "publicKeyFingerprint"
                )
            );

        if (
            payloadInstallationId == null ||
            payloadBindingKeyId == null ||
            !"SHA-256".equals(
                payloadFingerprintAlgorithm
            ) ||
            !isCanonicalSha256Fingerprint(
                payloadPublicKeyFingerprint
            ) ||
            !bindingKeyMatchesFingerprint(
                payloadBindingKeyId,
                payloadPublicKeyFingerprint
            ) ||
            !isExactOne(
                payloadBinding.get(
                    "schemaVersion"
                )
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy installation binding is invalid."
            );
        }

        if (
            !targetInstallationId.equals(
                payloadInstallationId
            ) ||
            !targetBindingKeyId.equals(
                payloadBindingKeyId
            ) ||
            !targetFingerprintAlgorithm.equals(
                payloadFingerprintAlgorithm
            ) ||
            !targetPublicKeyFingerprint.equals(
                payloadPublicKeyFingerprint
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy payload binding does not match the verified package target."
            );
        }


        // ----------------------------------------------------
        // OVERRIDE SET
        // ----------------------------------------------------

        String overrideSetId =
            requiredString(
                overrideSet.get(
                    "overrideSetId"
                )
            );

        Map<String, Object> scope =
            asMap(
                overrideSet.get(
                    "scope"
                )
            );

        List<Map<String, Object>> overrides =
            asMapList(
                overrideSet.get(
                    "overrides"
                )
            );

        if (
            overrideSetId == null ||
            scope == null ||
            overrides == null ||
            !isExactOne(
                overrideSet.get(
                    "schemaVersion"
                )
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy override set is invalid."
            );
        }

        String scopeOwnerId =
            requiredString(
                scope.get(
                    "ownerId"
                )
            );

        String scopeBusinessId =
            requiredString(
                scope.get(
                    "businessId"
                )
            );

        String scopeBranchId =
            requiredString(
                scope.get(
                    "branchId"
                )
            );

        if (
            scopeOwnerId == null ||
            scopeBusinessId == null ||
            scopeBranchId == null ||
            !targetOwnerId.equals(
                scopeOwnerId
            ) ||
            !targetBusinessId.equals(
                scopeBusinessId
            ) ||
            !targetBranchId.equals(
                scopeBranchId
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy override scope does not match the verified package target."
            );
        }


        // ----------------------------------------------------
        // OVERRIDE RULES
        // ----------------------------------------------------

        Set<String> overrideIds =
            new HashSet<>();

        List<Map<String, Object>> persistedOverrides =
            new ArrayList<>();

        for (
            Map<String, Object> rule :
                overrides
        ) {

            Map<String, Object> normalizedRule =
                validateAndCreatePersistedRule(
                    rule
                );

            if (normalizedRule == null) {
                return Result.failure(
                    "FINORA Pricing Policy override rule is invalid."
                );
            }

            String overrideId =
                requiredString(
                    normalizedRule.get(
                        "overrideId"
                    )
                );

            if (
                overrideId == null ||
                !overrideIds.add(
                    overrideId
                )
            ) {
                return Result.failure(
                    "FINORA Pricing Policy contains duplicate override IDs."
                );
            }

            persistedOverrides.add(
                normalizedRule
            );
        }

        if (
            hasOverlappingPricingWindows(
                persistedOverrides
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy contains overlapping override windows for the same charge."
            );
        }


        // ----------------------------------------------------
        // AUTHORITATIVE CURRENT SECURITY STATE
        // ----------------------------------------------------

        if (
            currentState.containsKey(
                "pricingPolicies"
            ) &&
            currentState.get(
                "pricingPolicies"
            ) == null
        ) {
            return Result.failure(
                "FINORA Pricing Policy collection is malformed."
            );
        }

        List<Map<String, Object>> policies =
            optionalMapList(
                currentState.get(
                    "pricingPolicies"
                )
            );

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
            policies == null ||
            appliedPackages == null ||
            sequenceStates == null
        ) {
            return Result.failure(
                "FINORA Pricing Policy security state is malformed."
            );
        }

        if (
            hasInvalidPersistedPolicies(
                policies
            ) ||
            hasDuplicatePolicyScopes(
                policies
            ) ||
            hasDuplicateOverrideSetIds(
                policies
            ) ||
            hasDuplicatePackageIds(
                appliedPackages
            ) ||
            hasDuplicateSequenceScopes(
                sequenceStates
            )
        ) {
            return Result.failure(
                "FINORA Pricing Policy control state contains invalid or duplicate identities."
            );
        }


        // ----------------------------------------------------
        // REPLAY / MONOTONIC SEQUENCE
        // ----------------------------------------------------

        FinoraControlReplayPolicy.Decision replayDecision =
            FinoraControlReplayPolicy
                .evaluate(
                    packageId,
                    issuerId,
                    purpose,
                    sequence.longValue(),
                    targetOwnerId,
                    targetBusinessId,
                    targetBranchId,
                    targetInstallationId,
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
        // DEEP COPY CURRENT STATE
        // ----------------------------------------------------

        Map<String, Object> nextState =
            deepCopyMap(
                currentState
            );

        List<Map<String, Object>> nextPolicies =
            ensureMapList(
                nextState,
                "pricingPolicies"
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


        // ----------------------------------------------------
        // AUTHORITATIVE PRICING POLICY RECORD
        // ----------------------------------------------------

        Map<String, Object> persistedPolicy =
            new LinkedHashMap<>();

        persistedPolicy.put(
            "overrideSetId",
            overrideSetId
        );

        persistedPolicy.put(
            "ownerId",
            targetOwnerId
        );

        persistedPolicy.put(
            "businessId",
            targetBusinessId
        );

        persistedPolicy.put(
            "branchId",
            targetBranchId
        );

        persistedPolicy.put(
            "installationId",
            targetInstallationId
        );

        persistedPolicy.put(
            "bindingKeyId",
            targetBindingKeyId
        );

        persistedPolicy.put(
            "fingerprintAlgorithm",
            targetFingerprintAlgorithm
        );

        persistedPolicy.put(
            "publicKeyFingerprint",
            targetPublicKeyFingerprint
        );

        persistedPolicy.put(
            "overrides",
            persistedOverrides
        );

        persistedPolicy.put(
            "issuedAt",
            packageIssuedAt
        );

        persistedPolicy.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );


        // ----------------------------------------------------
        // REPLACE-ONLY LINEAGE
        // ----------------------------------------------------

        int policyIndex =
            findPolicyScopeIndex(
                nextPolicies,
                targetOwnerId,
                targetBusinessId,
                targetBranchId,
                targetInstallationId
            );

        int overrideSetIdIndex =
            findOverrideSetIdIndex(
                nextPolicies,
                overrideSetId
            );

        if (policyIndex >= 0) {

            Map<String, Object> existingPolicy =
                nextPolicies.get(
                    policyIndex
                );

            String existingOverrideSetId =
                requiredString(
                    existingPolicy.get(
                        "overrideSetId"
                    )
                );

            if (
                existingOverrideSetId == null ||
                !existingOverrideSetId.equals(
                    overrideSetId
                )
            ) {
                return Result.failure(
                    "FINORA Pricing Policy REPLACE must preserve the existing overrideSetId lineage."
                );
            }

            if (
                overrideSetIdIndex >= 0 &&
                overrideSetIdIndex !=
                    policyIndex
            ) {
                return Result.failure(
                    "FINORA Pricing Policy overrideSetId is already assigned to another scope."
                );
            }

            nextPolicies.set(
                policyIndex,
                persistedPolicy
            );

        } else {

            if (overrideSetIdIndex >= 0) {
                return Result.failure(
                    "FINORA Pricing Policy overrideSetId cannot move to another scope."
                );
            }

            nextPolicies.add(
                persistedPolicy
            );
        }


        // ----------------------------------------------------
        // APPLIED PACKAGE LEDGER
        // ----------------------------------------------------

        Map<String, Object> appliedPackageRecord =
            new LinkedHashMap<>();

        appliedPackageRecord.put(
            "packageId",
            packageId
        );

        appliedPackageRecord.put(
            "issuerId",
            issuerId
        );

        appliedPackageRecord.put(
            "purpose",
            purpose
        );

        appliedPackageRecord.put(
            "sequence",
            sequence
        );

        appliedPackageRecord.put(
            "ownerId",
            targetOwnerId
        );

        appliedPackageRecord.put(
            "businessId",
            targetBusinessId
        );

        appliedPackageRecord.put(
            "branchId",
            targetBranchId
        );

        appliedPackageRecord.put(
            "installationId",
            targetInstallationId
        );

        appliedPackageRecord.put(
            "appliedAt",
            appliedAt.toString()
        );

        appliedPackageRecord.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        nextAppliedPackages.add(
            appliedPackageRecord
        );


        // ----------------------------------------------------
        // SEQUENCE LEDGER
        // ----------------------------------------------------

        Map<String, Object> sequenceRecord =
            new LinkedHashMap<>();

        sequenceRecord.put(
            "issuerId",
            issuerId
        );

        sequenceRecord.put(
            "purpose",
            purpose
        );

        sequenceRecord.put(
            "ownerId",
            targetOwnerId
        );

        sequenceRecord.put(
            "businessId",
            targetBusinessId
        );

        sequenceRecord.put(
            "branchId",
            targetBranchId
        );

        sequenceRecord.put(
            "installationId",
            targetInstallationId
        );

        sequenceRecord.put(
            "lastSequence",
            sequence
        );

        sequenceRecord.put(
            "updatedAt",
            appliedAt.toString()
        );

        sequenceRecord.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        int sequenceIndex =
            findSequenceScopeIndex(
                nextSequenceStates,
                issuerId,
                purpose,
                targetOwnerId,
                targetBusinessId,
                targetBranchId,
                targetInstallationId
            );

        if (sequenceIndex >= 0) {

            nextSequenceStates.set(
                sequenceIndex,
                sequenceRecord
            );

        } else {

            nextSequenceStates.add(
                sequenceRecord
            );
        }


        // ----------------------------------------------------
        // ROOT UPDATE
        // ----------------------------------------------------

        nextState.put(
            "updatedAt",
            appliedAt.toString()
        );

        return Result.success(
            nextState
        );
    }


    // ========================================================
    // RULE VALIDATION / NORMALIZATION
    // ========================================================

    private static Map<String, Object> validateAndCreatePersistedRule(
        Map<String, Object> rule
    ) {

        if (rule == null) {
            return null;
        }

        String overrideId =
            requiredString(
                rule.get(
                    "overrideId"
                )
            );

        String chargeCode =
            requiredString(
                rule.get(
                    "chargeCode"
                )
            );

        String model =
            requiredString(
                rule.get(
                    "model"
                )
            );

        String currency =
            requiredString(
                rule.get(
                    "currency"
                )
            );

        Double amount =
            positiveFiniteNumber(
                rule.get(
                    "amount"
                )
            );

        Map<String, Object> validity =
            asMap(
                rule.get(
                    "validity"
                )
            );

        if (
            overrideId == null ||
            chargeCode == null ||
            !isCanonicalPricingChargeCode(
                chargeCode
            ) ||
            !"LOAN_DISBURSEMENT".equals(
                chargeCode
            ) ||
            !"FIXED_PRICE_OVERRIDE".equals(
                model
            ) ||
            amount == null ||
            !"INR".equals(
                currency
            ) ||
            validity == null ||
            !isExactOne(
                rule.get(
                    "schemaVersion"
                )
            )
        ) {
            return null;
        }

        String validFrom =
            requiredString(
                validity.get(
                    "validFrom"
                )
            );

        String validUntil =
            requiredString(
                validity.get(
                    "validUntil"
                )
            );

        Instant validFromInstant =
            parseCanonicalInstant(
                validFrom
            );

        Instant validUntilInstant =
            parseCanonicalInstant(
                validUntil
            );

        if (
            validFromInstant == null ||
            validUntilInstant == null ||
            !validUntilInstant.isAfter(
                validFromInstant
            )
        ) {
            return null;
        }

        Map<String, Object> persisted =
            new LinkedHashMap<>();

        persisted.put(
            "overrideId",
            overrideId
        );

        persisted.put(
            "chargeCode",
            chargeCode
        );

        persisted.put(
            "model",
            model
        );

        persisted.put(
            "amount",
            amount
        );

        persisted.put(
            "currency",
            currency
        );

        persisted.put(
            "validFrom",
            validFrom
        );

        persisted.put(
            "validUntil",
            validUntil
        );

        persisted.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        return persisted;
    }


    // ========================================================
    // EXISTING POLICY VALIDATION
    // ========================================================

    private static boolean hasInvalidPersistedPolicies(
        List<Map<String, Object>> policies
    ) {

        for (
            Map<String, Object> policy :
                policies
        ) {

            if (
                !isValidPersistedPolicy(
                    policy
                )
            ) {
                return true;
            }
        }

        return false;
    }


    private static boolean isValidPersistedPolicy(
        Map<String, Object> policy
    ) {

        if (policy == null) {
            return false;
        }

        String overrideSetId =
            requiredString(
                policy.get(
                    "overrideSetId"
                )
            );

        String ownerId =
            requiredString(
                policy.get(
                    "ownerId"
                )
            );

        String businessId =
            requiredString(
                policy.get(
                    "businessId"
                )
            );

        String branchId =
            requiredString(
                policy.get(
                    "branchId"
                )
            );

        String installationId =
            requiredString(
                policy.get(
                    "installationId"
                )
            );

        String bindingKeyId =
            requiredString(
                policy.get(
                    "bindingKeyId"
                )
            );

        String fingerprintAlgorithm =
            requiredString(
                policy.get(
                    "fingerprintAlgorithm"
                )
            );

        String publicKeyFingerprint =
            requiredString(
                policy.get(
                    "publicKeyFingerprint"
                )
            );

        String issuedAt =
            requiredString(
                policy.get(
                    "issuedAt"
                )
            );

        List<Map<String, Object>> rules =
            asMapList(
                policy.get(
                    "overrides"
                )
            );

        if (
            overrideSetId == null ||
            ownerId == null ||
            businessId == null ||
            branchId == null ||
            installationId == null ||
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            !isCanonicalSha256Fingerprint(
                publicKeyFingerprint
            ) ||
            !bindingKeyMatchesFingerprint(
                bindingKeyId,
                publicKeyFingerprint
            ) ||
            !isCanonicalInstant(
                issuedAt
            ) ||
            rules == null ||
            !isExactOne(
                policy.get(
                    "schemaVersion"
                )
            )
        ) {
            return false;
        }

        Set<String> overrideIds =
            new HashSet<>();

        for (
            Map<String, Object> rule :
                rules
        ) {

            if (
                !isValidPersistedRule(
                    rule
                )
            ) {
                return false;
            }

            String overrideId =
                requiredString(
                    rule.get(
                        "overrideId"
                    )
                );

            if (
                overrideId == null ||
                !overrideIds.add(
                    overrideId
                )
            ) {
                return false;
            }
        }

        return !hasOverlappingPricingWindows(
            rules
        );
    }


    private static boolean isValidPersistedRule(
        Map<String, Object> rule
    ) {

        if (rule == null) {
            return false;
        }

        String overrideId =
            requiredString(
                rule.get(
                    "overrideId"
                )
            );

        String chargeCode =
            requiredString(
                rule.get(
                    "chargeCode"
                )
            );

        String model =
            requiredString(
                rule.get(
                    "model"
                )
            );

        String currency =
            requiredString(
                rule.get(
                    "currency"
                )
            );

        Double amount =
            positiveFiniteNumber(
                rule.get(
                    "amount"
                )
            );

        String validFrom =
            requiredString(
                rule.get(
                    "validFrom"
                )
            );

        String validUntil =
            requiredString(
                rule.get(
                    "validUntil"
                )
            );

        Instant validFromInstant =
            parseCanonicalInstant(
                validFrom
            );

        Instant validUntilInstant =
            parseCanonicalInstant(
                validUntil
            );

        return (
            overrideId != null &&
            "LOAN_DISBURSEMENT".equals(
                chargeCode
            ) &&
            isCanonicalPricingChargeCode(
                chargeCode
            ) &&
            "FIXED_PRICE_OVERRIDE".equals(
                model
            ) &&
            amount != null &&
            "INR".equals(
                currency
            ) &&
            validFromInstant != null &&
            validUntilInstant != null &&
            validUntilInstant.isAfter(
                validFromInstant
            ) &&
            isExactOne(
                rule.get(
                    "schemaVersion"
                )
            )
        );
    }


    // ========================================================
    // PRICING RULES
    // ========================================================

    private static boolean isCanonicalPricingChargeCode(
        String value
    ) {

        return (
            "LOAN_DISBURSEMENT".equals(
                value
            ) ||
            "LOAN_NUMBER_GENERATION".equals(
                value
            ) ||
            "CUSTOMER_NUMBER_GENERATION".equals(
                value
            ) ||
            "COLLECTION_PROCESSING".equals(
                value
            ) ||
            "RECEIPT_PROCESSING".equals(
                value
            ) ||
            "CUSTOMER_ID_CARD_GENERATION".equals(
                value
            ) ||
            "OTHER_PLATFORM_FEE".equals(
                value
            )
        );
    }


    private static boolean hasOverlappingPricingWindows(
        List<Map<String, Object>> rules
    ) {

        for (
            int leftIndex = 0;
            leftIndex < rules.size();
            leftIndex++
        ) {

            Map<String, Object> left =
                rules.get(
                    leftIndex
                );

            String leftCharge =
                requiredString(
                    left.get(
                        "chargeCode"
                    )
                );

            Instant leftFrom =
                parseCanonicalInstant(
                    requiredString(
                        left.get(
                            "validFrom"
                        )
                    )
                );

            Instant leftUntil =
                parseCanonicalInstant(
                    requiredString(
                        left.get(
                            "validUntil"
                        )
                    )
                );

            if (
                leftCharge == null ||
                leftFrom == null ||
                leftUntil == null
            ) {
                return true;
            }

            for (
                int rightIndex =
                    leftIndex + 1;
                rightIndex <
                    rules.size();
                rightIndex++
            ) {

                Map<String, Object> right =
                    rules.get(
                        rightIndex
                    );

                String rightCharge =
                    requiredString(
                        right.get(
                            "chargeCode"
                        )
                    );

                if (
                    !leftCharge.equals(
                        rightCharge
                    )
                ) {
                    continue;
                }

                Instant rightFrom =
                    parseCanonicalInstant(
                        requiredString(
                            right.get(
                                "validFrom"
                            )
                        )
                    );

                Instant rightUntil =
                    parseCanonicalInstant(
                        requiredString(
                            right.get(
                                "validUntil"
                            )
                        )
                    );

                if (
                    rightFrom == null ||
                    rightUntil == null
                ) {
                    return true;
                }

                boolean overlaps =
                    leftFrom.isBefore(
                        rightUntil
                    ) &&
                    rightFrom.isBefore(
                        leftUntil
                    );

                if (overlaps) {
                    return true;
                }
            }
        }

        return false;
    }


    // ========================================================
    // DUPLICATE SECURITY STATE
    // ========================================================

    private static boolean hasDuplicatePolicyScopes(
        List<Map<String, Object>> policies
    ) {

        Set<String> identities =
            new HashSet<>();

        for (
            Map<String, Object> policy :
                policies
        ) {

            String ownerId =
                requiredString(
                    policy.get(
                        "ownerId"
                    )
                );

            String businessId =
                requiredString(
                    policy.get(
                        "businessId"
                    )
                );

            String branchId =
                requiredString(
                    policy.get(
                        "branchId"
                    )
                );

            String installationId =
                requiredString(
                    policy.get(
                        "installationId"
                    )
                );

            if (
                ownerId == null ||
                businessId == null ||
                branchId == null ||
                installationId == null
            ) {
                return true;
            }

            String identity =
                ownerId +
                "\u0000" +
                businessId +
                "\u0000" +
                branchId +
                "\u0000" +
                installationId;

            if (
                !identities.add(
                    identity
                )
            ) {
                return true;
            }
        }

        return false;
    }


    private static boolean hasDuplicateOverrideSetIds(
        List<Map<String, Object>> policies
    ) {

        Set<String> identities =
            new HashSet<>();

        for (
            Map<String, Object> policy :
                policies
        ) {

            String overrideSetId =
                requiredString(
                    policy.get(
                        "overrideSetId"
                    )
                );

            if (
                overrideSetId == null ||
                !identities.add(
                    overrideSetId
                )
            ) {
                return true;
            }
        }

        return false;
    }


    private static boolean hasDuplicatePackageIds(
        List<Map<String, Object>> records
    ) {

        Set<String> identities =
            new HashSet<>();

        for (
            Map<String, Object> record :
                records
        ) {

            String packageId =
                requiredString(
                    record.get(
                        "packageId"
                    )
                );

            if (
                packageId == null ||
                !identities.add(
                    packageId
                )
            ) {
                return true;
            }
        }

        return false;
    }


    private static boolean hasDuplicateSequenceScopes(
        List<Map<String, Object>> records
    ) {

        Set<String> identities =
            new HashSet<>();

        for (
            Map<String, Object> record :
                records
        ) {

            String issuerId =
                requiredString(
                    record.get(
                        "issuerId"
                    )
                );

            String purpose =
                requiredString(
                    record.get(
                        "purpose"
                    )
                );

            String ownerId =
                requiredString(
                    record.get(
                        "ownerId"
                    )
                );

            String businessId =
                requiredString(
                    record.get(
                        "businessId"
                    )
                );

            String branchId =
                requiredString(
                    record.get(
                        "branchId"
                    )
                );

            String installationId =
                requiredString(
                    record.get(
                        "installationId"
                    )
                );

            Long lastSequence =
                positiveSafeLong(
                    record.get(
                        "lastSequence"
                    )
                );

            if (
                issuerId == null ||
                purpose == null ||
                ownerId == null ||
                businessId == null ||
                branchId == null ||
                installationId == null ||
                lastSequence == null
            ) {
                return true;
            }

            String identity =
                issuerId +
                "\u0000" +
                purpose +
                "\u0000" +
                ownerId +
                "\u0000" +
                businessId +
                "\u0000" +
                branchId +
                "\u0000" +
                installationId;

            if (
                !identities.add(
                    identity
                )
            ) {
                return true;
            }
        }

        return false;
    }


    // ========================================================
    // FINDERS
    // ========================================================

    private static int findPolicyScopeIndex(
        List<Map<String, Object>> policies,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

        for (
            int index = 0;
            index < policies.size();
            index++
        ) {

            Map<String, Object> policy =
                policies.get(
                    index
                );

            if (
                sameRequiredText(
                    policy.get(
                        "ownerId"
                    ),
                    ownerId
                ) &&
                sameRequiredText(
                    policy.get(
                        "businessId"
                    ),
                    businessId
                ) &&
                sameRequiredText(
                    policy.get(
                        "branchId"
                    ),
                    branchId
                ) &&
                sameRequiredText(
                    policy.get(
                        "installationId"
                    ),
                    installationId
                )
            ) {
                return index;
            }
        }

        return -1;
    }


    private static int findOverrideSetIdIndex(
        List<Map<String, Object>> policies,
        String overrideSetId
    ) {

        for (
            int index = 0;
            index < policies.size();
            index++
        ) {

            if (
                sameRequiredText(
                    policies
                        .get(
                            index
                        )
                        .get(
                            "overrideSetId"
                        ),
                    overrideSetId
                )
            ) {
                return index;
            }
        }

        return -1;
    }


    private static int findSequenceScopeIndex(
        List<Map<String, Object>> records,
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

        for (
            int index = 0;
            index < records.size();
            index++
        ) {

            Map<String, Object> record =
                records.get(
                    index
                );

            if (
                sameRequiredText(
                    record.get(
                        "issuerId"
                    ),
                    issuerId
                ) &&
                sameRequiredText(
                    record.get(
                        "purpose"
                    ),
                    purpose
                ) &&
                sameRequiredText(
                    record.get(
                        "ownerId"
                    ),
                    ownerId
                ) &&
                sameRequiredText(
                    record.get(
                        "businessId"
                    ),
                    businessId
                ) &&
                sameRequiredText(
                    record.get(
                        "branchId"
                    ),
                    branchId
                ) &&
                sameRequiredText(
                    record.get(
                        "installationId"
                    ),
                    installationId
                )
            ) {
                return index;
            }
        }

        return -1;
    }


    // ========================================================
    // INSTALLATION BINDING
    // ========================================================

    private static boolean isCanonicalSha256Fingerprint(
        String value
    ) {

        return (
            value != null &&
            value.matches(
                "[0-9a-f]{64}"
            )
        );
    }


    private static boolean bindingKeyMatchesFingerprint(
        String bindingKeyId,
        String fingerprint
    ) {

        if (
            bindingKeyId == null ||
            !isCanonicalSha256Fingerprint(
                fingerprint
            )
        ) {
            return false;
        }

        String expected =
            "FINORA-BINDING-" +
            fingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        return expected.equals(
            bindingKeyId
        );
    }


    // ========================================================
    // TIME
    // ========================================================

    private static boolean isCanonicalInstant(
        String value
    ) {

        return parseCanonicalInstant(
            value
        ) != null;
    }


    private static Instant parseCanonicalInstant(
        String value
    ) {

        if (
            value == null ||
            !value.matches(
                "[0-9]{4}-[0-9]{2}-[0-9]{2}T" +
                "[0-9]{2}:[0-9]{2}:[0-9]{2}\\." +
                "[0-9]{3}Z"
            )
        ) {
            return null;
        }

        try {

            return Instant.parse(
                value
            );

        } catch (Exception error) {

            return null;
        }
    }


    // ========================================================
    // NUMBER HELPERS
    // ========================================================

    private static Long positiveSafeLong(
        Object value
    ) {

        Long exact =
            exactSafeLong(
                value
            );

        if (
            exact == null ||
            exact.longValue() <=
                0L
        ) {
            return null;
        }

        return exact;
    }


    private static Long exactSafeLong(
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
            Math.rint(
                number
            ) !=
                number ||
            number >
                MAX_SAFE_INTEGER ||
            number <
                -MAX_SAFE_INTEGER
        ) {
            return null;
        }

        long result =
            (long) number;

        if (
            (double) result !=
                number
        ) {
            return null;
        }

        return Long.valueOf(
            result
        );
    }


    private static boolean isExactOne(
        Object value
    ) {

        Long exact =
            exactSafeLong(
                value
            );

        return (
            exact != null &&
            exact.longValue() ==
                1L
        );
    }


    private static Double positiveFiniteNumber(
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
            number <=
                0.0d
        ) {
            return null;
        }

        return Double.valueOf(
            number
        );
    }


    // ========================================================
    // TEXT HELPERS
    // ========================================================

    private static String requiredString(
        Object value
    ) {

        if (!(value instanceof String)) {
            return null;
        }

        String text =
            (String) value;

        String trimmed =
            text.trim();

        if (
            trimmed.isEmpty() ||
            !text.equals(
                trimmed
            )
        ) {
            return null;
        }

        return text;
    }


    private static boolean sameRequiredText(
        Object value,
        String expected
    ) {

        String actual =
            requiredString(
                value
            );

        return (
            actual != null &&
            expected != null &&
            actual.equals(
                expected
            )
        );
    }


    // ========================================================
    // MAP / LIST HELPERS
    // ========================================================

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map<?, ?>)) {
            return null;
        }

        Map<?, ?> raw =
            (Map<?, ?>) value;

        for (
            Object key :
                raw.keySet()
        ) {

            if (!(key instanceof String)) {
                return null;
            }
        }

        return (Map<String, Object>) value;
    }


    private static List<Map<String, Object>> asMapList(
        Object value
    ) {

        if (!(value instanceof List<?>)) {
            return null;
        }

        List<?> raw =
            (List<?>) value;

        List<Map<String, Object>> result =
            new ArrayList<>();

        for (
            Object item :
                raw
        ) {

            Map<String, Object> map =
                asMap(
                    item
                );

            if (map == null) {
                return null;
            }

            result.add(
                map
            );
        }

        return result;
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


    private static List<Map<String, Object>> ensureMapList(
        Map<String, Object> state,
        String key
    ) {

        Object existing =
            state.get(
                key
            );

        if (existing == null) {

            List<Map<String, Object>> created =
                new ArrayList<>();

            state.put(
                key,
                created
            );

            return created;
        }

        List<Map<String, Object>> result =
            asMapList(
                existing
            );

        if (result == null) {
            throw new IllegalStateException(
                "FINORA Control Store collection is malformed: " +
                key
            );
        }

        state.put(
            key,
            result
        );

        return result;
    }


    // ========================================================
    // DEEP COPY
    // ========================================================

    private static Map<String, Object> deepCopyMap(
        Map<String, Object> source
    ) {

        Map<String, Object> copy =
            new LinkedHashMap<>();

        for (
            Map.Entry<String, Object> entry :
                source.entrySet()
        ) {

            copy.put(
                entry.getKey(),
                deepCopyValue(
                    entry.getValue()
                )
            );
        }

        return copy;
    }


    private static Object deepCopyValue(
        Object value
    ) {

        Map<String, Object> map =
            asMap(
                value
            );

        if (map != null) {
            return deepCopyMap(
                map
            );
        }

        if (value instanceof List<?>) {

            List<?> source =
                (List<?>) value;

            List<Object> copy =
                new ArrayList<>();

            for (
                Object item :
                    source
            ) {

                copy.add(
                    deepCopyValue(
                        item
                    )
                );
            }

            return copy;
        }

        return value;
    }
}