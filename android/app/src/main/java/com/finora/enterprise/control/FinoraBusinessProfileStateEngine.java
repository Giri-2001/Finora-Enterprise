package com.finora.enterprise.control;

// ============================================================
// FINORA BUSINESS PROFILE STATE ENGINE
//
// RESPONSIBILITY:
//
// - Consume only a cryptographically verified BUSINESS_PROFILE
//   Control Package.
// - Validate signed Business / Branch Profile semantics.
// - Bind profile to the exact installation scope.
// - Bind profile to native installation public-binding metadata.
// - Enforce ISSUE / REPLACE lifecycle.
// - Preserve immutable profile identity.
// - Enforce replay + monotonic Control Package sequence.
// - Produce one complete next Control Store state.
//
// SECURITY:
//
// - Pure Java.
// - No Android Context.
// - No private key.
// - No signing.
// - No WebView.
// - No Business Date.
// ============================================================

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class FinoraBusinessProfileStateEngine {

    private FinoraBusinessProfileStateEngine() {
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
                "FINORA verified Business Profile apply input is incomplete."
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
        // VERIFIED CONTROL PACKAGE
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
            !"BUSINESS_PROFILE".equals(
                purpose
            ) ||
            sequence == null ||
            payloadVersion == null ||
            payloadVersion.longValue() !=
                1L ||
            parseInstant(
                packageIssuedAt
            ) == null ||
            target == null ||
            payload == null
        ) {
            return Result.failure(
                "Verified FINORA BUSINESS_PROFILE package structure is invalid."
            );
        }


        // ----------------------------------------------------
        // TARGET
        // ----------------------------------------------------

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

        String bindingKeyId =
            requiredString(
                target.get(
                    "bindingKeyId"
                )
            );

        String fingerprintAlgorithm =
            requiredString(
                target.get(
                    "fingerprintAlgorithm"
                )
            );

        String publicKeyFingerprint =
            requiredString(
                target.get(
                    "publicKeyFingerprint"
                )
            );

        if (
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
            )
        ) {
            return Result.failure(
                "FINORA BUSINESS_PROFILE package target is invalid."
            );
        }

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
                "FINORA BUSINESS_PROFILE package does not match the installed branch."
            );
        }


        // ----------------------------------------------------
        // PAYLOAD
        // ----------------------------------------------------

        String action =
            requiredString(
                payload.get(
                    "action"
                )
            );

        Long payloadSchemaVersion =
            exactSafeLong(
                payload.get(
                    "schemaVersion"
                )
            );

        String payloadIssuedAt =
            requiredString(
                payload.get(
                    "issuedAt"
                )
            );

        Map<String, Object> profile =
            asMap(
                payload.get(
                    "profile"
                )
            );

        Map<String, Object> installationBinding =
            asMap(
                payload.get(
                    "installationBinding"
                )
            );

        if (
            (
                !"ISSUE".equals(
                    action
                ) &&
                !"REPLACE".equals(
                    action
                )
            ) ||
            payloadSchemaVersion == null ||
            payloadSchemaVersion.longValue() !=
                1L ||
            parseInstant(
                payloadIssuedAt
            ) == null ||
            profile == null ||
            installationBinding == null
        ) {
            return Result.failure(
                "FINORA BUSINESS_PROFILE payload is invalid."
            );
        }


        // ----------------------------------------------------
        // PAYLOAD INSTALLATION BINDING
        // ----------------------------------------------------

        Long bindingSchemaVersion =
            exactSafeLong(
                installationBinding.get(
                    "schemaVersion"
                )
            );

        if (
            bindingSchemaVersion == null ||
            bindingSchemaVersion.longValue() !=
                1L ||
            !sameRequiredText(
                installationBinding,
                "installationId",
                installationId
            ) ||
            !sameRequiredText(
                installationBinding,
                "bindingKeyId",
                bindingKeyId
            ) ||
            !sameRequiredText(
                installationBinding,
                "fingerprintAlgorithm",
                fingerprintAlgorithm
            ) ||
            !sameRequiredText(
                installationBinding,
                "publicKeyFingerprint",
                publicKeyFingerprint
            )
        ) {
            return Result.failure(
                "FINORA BUSINESS_PROFILE installation binding does not match the signed package target."
            );
        }


        // ----------------------------------------------------
        // PROFILE DOMAIN
        // ----------------------------------------------------

        String profileId =
            requiredString(
                profile.get(
                    "profileId"
                )
            );

        String profileOwnerId =
            requiredString(
                profile.get(
                    "ownerId"
                )
            );

        String profileBusinessId =
            requiredString(
                profile.get(
                    "businessId"
                )
            );

        String profileBranchId =
            requiredString(
                profile.get(
                    "branchId"
                )
            );

        String businessCode =
            requiredString(
                profile.get(
                    "businessCode"
                )
            );

        String branchCode =
            requiredString(
                profile.get(
                    "branchCode"
                )
            );

        String businessName =
            requiredString(
                profile.get(
                    "businessName"
                )
            );

        String branchName =
            requiredString(
                profile.get(
                    "branchName"
                )
            );

        String createdAtText =
            requiredString(
                profile.get(
                    "createdAt"
                )
            );

        String updatedAtText =
            requiredString(
                profile.get(
                    "updatedAt"
                )
            );

        Long profileSchemaVersion =
            exactSafeLong(
                profile.get(
                    "schemaVersion"
                )
            );

        Instant createdAt =
            parseInstant(
                createdAtText
            );

        Instant updatedAt =
            parseInstant(
                updatedAtText
            );

        if (
            profileId == null ||
            profileOwnerId == null ||
            profileBusinessId == null ||
            profileBranchId == null ||
            !isNumberingCode(
                businessCode
            ) ||
            !isNumberingCode(
                branchCode
            ) ||
            businessName == null ||
            branchName == null ||
            createdAt == null ||
            updatedAt == null ||
            profileSchemaVersion == null ||
            profileSchemaVersion.longValue() !=
                1L ||
            updatedAt.isBefore(
                createdAt
            ) ||
            updatedAt.isAfter(
                appliedAt
            )
        ) {
            return Result.failure(
                "FINORA Business Profile domain state is invalid."
            );
        }

        if (
            !ownerId.equals(
                profileOwnerId
            ) ||
            !businessId.equals(
                profileBusinessId
            ) ||
            !branchId.equals(
                profileBranchId
            )
        ) {
            return Result.failure(
                "FINORA Business Profile identity does not match the signed target."
            );
        }


        // ----------------------------------------------------
        // NUMBERING CODE CONSISTENCY
        // ----------------------------------------------------

        String installedBusinessCode =
            requiredString(
                installation.get(
                    "businessCode"
                )
            );

        String installedBranchCode =
            requiredString(
                installation.get(
                    "branchCode"
                )
            );

        if (
            (
                installedBusinessCode == null
            ) !=
            (
                installedBranchCode == null
            )
        ) {
            return Result.failure(
                "FINORA installation numbering-code state is inconsistent."
            );
        }

        if (
            installedBusinessCode != null &&
            (
                !installedBusinessCode.equals(
                    businessCode
                ) ||
                !installedBranchCode.equals(
                    branchCode
                )
            )
        ) {
            return Result.failure(
                "FINORA Business Profile numbering codes do not match the installation identity."
            );
        }


        // ----------------------------------------------------
        // SECURITY ARRAYS
        // ----------------------------------------------------

        List<Map<String, Object>> profiles =
            optionalMapList(
                currentState.get(
                    "businessProfiles"
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
            profiles == null ||
            appliedPackages == null ||
            sequenceStates == null
        ) {
            return Result.failure(
                "FINORA Business Profile security state is malformed."
            );
        }

        if (
            hasDuplicateProfileScopes(
                profiles
            ) ||
            hasDuplicateProfileIds(
                profiles
            ) ||
            hasDuplicatePackageIds(
                appliedPackages
            ) ||
            hasDuplicateSequenceScopes(
                sequenceStates
            )
        ) {
            return Result.failure(
                "FINORA Business Profile control state contains duplicate identities."
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
        // DEEP COPY CURRENT STATE
        // ----------------------------------------------------

        Map<String, Object> nextState =
            deepCopyMap(
                currentState
            );

        List<Map<String, Object>> nextProfiles =
            ensureMapList(
                nextState,
                "businessProfiles"
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
        // PROFILE RECORD
        // ----------------------------------------------------

        Map<String, Object> persistedProfile =
            new LinkedHashMap<>();

        persistedProfile.put(
            "profileId",
            profileId
        );

        persistedProfile.put(
            "ownerId",
            ownerId
        );

        persistedProfile.put(
            "businessId",
            businessId
        );

        persistedProfile.put(
            "branchId",
            branchId
        );

        persistedProfile.put(
            "businessCode",
            businessCode
        );

        persistedProfile.put(
            "branchCode",
            branchCode
        );

        persistedProfile.put(
            "businessName",
            businessName
        );

        persistedProfile.put(
            "branchName",
            branchName
        );

        persistedProfile.put(
            "installationId",
            installationId
        );

        persistedProfile.put(
            "bindingKeyId",
            bindingKeyId
        );

        persistedProfile.put(
            "fingerprintAlgorithm",
            fingerprintAlgorithm
        );

        persistedProfile.put(
            "publicKeyFingerprint",
            publicKeyFingerprint
        );

        persistedProfile.put(
            "createdAt",
            createdAtText
        );

        persistedProfile.put(
            "updatedAt",
            updatedAtText
        );

        persistedProfile.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );


        // ----------------------------------------------------
        // ISSUE / REPLACE
        // ----------------------------------------------------

        int profileIndex =
            findProfileScopeIndex(
                nextProfiles,
                ownerId,
                businessId,
                branchId
            );

        int profileIdIndex =
            findProfileIdIndex(
                nextProfiles,
                profileId
            );

        if (
            profileIdIndex >=
                0 &&
            profileIdIndex !=
                profileIndex
        ) {
            return Result.failure(
                "FINORA Business Profile ID cannot move to another branch scope."
            );
        }

        if (
            "ISSUE".equals(
                action
            )
        ) {
            if (profileIndex >= 0) {
                return Result.failure(
                    "FINORA Business Profile already exists; REPLACE is required."
                );
            }

            nextProfiles.add(
                persistedProfile
            );

        } else {

            if (profileIndex < 0) {
                return Result.failure(
                    "FINORA Business Profile REPLACE requires an existing profile."
                );
            }

            Map<String, Object> existing =
                nextProfiles.get(
                    profileIndex
                );

            if (
                !sameImmutableProfileIdentity(
                    existing,
                    persistedProfile
                )
            ) {
                return Result.failure(
                    "FINORA Business Profile immutable identity cannot be replaced."
                );
            }

            Instant existingUpdatedAt =
                parseInstant(
                    requiredString(
                        existing.get(
                            "updatedAt"
                        )
                    )
                );

            if (
                existingUpdatedAt == null ||
                updatedAt.isBefore(
                    existingUpdatedAt
                )
            ) {
                return Result.failure(
                    "FINORA Business Profile updatedAt cannot move backwards."
                );
            }

            nextProfiles.set(
                profileIndex,
                persistedProfile
            );
        }


        // ----------------------------------------------------
        // APPLIED PACKAGE LEDGER
        // ----------------------------------------------------

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

        String appliedAtText =
            appliedAt.toString();

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
            ownerId
        );

        sequenceRecord.put(
            "businessId",
            businessId
        );

        sequenceRecord.put(
            "branchId",
            branchId
        );

        sequenceRecord.put(
            "installationId",
            installationId
        );

        sequenceRecord.put(
            "lastSequence",
            sequence
        );

        sequenceRecord.put(
            "updatedAt",
            appliedAtText
        );

        int sequenceIndex =
            findSequenceScopeIndex(
                nextSequenceStates,
                issuerId,
                purpose,
                ownerId,
                businessId,
                branchId,
                installationId
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
        // COMPLETE NEXT STATE
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
    // PROFILE IMMUTABILITY
    // ========================================================

    private static boolean sameImmutableProfileIdentity(
        Map<String, Object> existing,
        Map<String, Object> replacement
    ) {
        return (
            sameRequiredText(
                existing,
                replacement,
                "profileId"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "ownerId"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "businessId"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "branchId"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "businessCode"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "branchCode"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "installationId"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "bindingKeyId"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "fingerprintAlgorithm"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "publicKeyFingerprint"
            ) &&
            sameRequiredText(
                existing,
                replacement,
                "createdAt"
            )
        );
    }


    // ========================================================
    // DUPLICATE VALIDATION
    // ========================================================

    private static boolean hasDuplicateProfileScopes(
        List<Map<String, Object>> profiles
    ) {

        Set<String> keys =
            new HashSet<>();

        for (
            Map<String, Object> profile :
            profiles
        ) {

            if (!isValidPersistedProfile(profile)) {
                return true;
            }

            String key =
                requiredString(
                    profile.get(
                        "ownerId"
                    )
                ) +
                "::" +
                requiredString(
                    profile.get(
                        "businessId"
                    )
                ) +
                "::" +
                requiredString(
                    profile.get(
                        "branchId"
                    )
                );

            if (!keys.add(key)) {
                return true;
            }
        }

        return false;
    }


    private static boolean hasDuplicateProfileIds(
        List<Map<String, Object>> profiles
    ) {

        Set<String> ids =
            new HashSet<>();

        for (
            Map<String, Object> profile :
            profiles
        ) {

            String profileId =
                requiredString(
                    profile.get(
                        "profileId"
                    )
                );

            if (
                profileId == null ||
                !ids.add(
                    profileId
                )
            ) {
                return true;
            }
        }

        return false;
    }


    private static boolean hasDuplicatePackageIds(
        List<Map<String, Object>> values
    ) {

        Set<String> ids =
            new HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            if (value == null) {
                return true;
            }

            String packageId =
                requiredString(
                    value.get(
                        "packageId"
                    )
                );

            if (
                packageId == null ||
                !ids.add(
                    packageId
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

        Set<String> keys =
            new HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            if (value == null) {
                return true;
            }

            String issuerId =
                requiredString(
                    value.get(
                        "issuerId"
                    )
                );

            String purpose =
                requiredString(
                    value.get(
                        "purpose"
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

            String installationId =
                requiredString(
                    value.get(
                        "installationId"
                    )
                );

            Long lastSequence =
                positiveSafeLong(
                    value.get(
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

            String key =
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
                installationId;

            if (!keys.add(key)) {
                return true;
            }
        }

        return false;
    }


    // ========================================================
    // PROFILE VALIDATION
    // ========================================================

    private static boolean isValidPersistedProfile(
        Map<String, Object> value
    ) {

        if (value == null) {
            return false;
        }

        String fingerprint =
            requiredString(
                value.get(
                    "publicKeyFingerprint"
                )
            );

        String bindingKeyId =
            requiredString(
                value.get(
                    "bindingKeyId"
                )
            );

        Instant createdAt =
            parseInstant(
                requiredString(
                    value.get(
                        "createdAt"
                    )
                )
            );

        Instant updatedAt =
            parseInstant(
                requiredString(
                    value.get(
                        "updatedAt"
                    )
                )
            );

        Long schemaVersion =
            exactSafeLong(
                value.get(
                    "schemaVersion"
                )
            );

        return (
            requiredString(
                value.get(
                    "profileId"
                )
            ) != null &&
            requiredString(
                value.get(
                    "ownerId"
                )
            ) != null &&
            requiredString(
                value.get(
                    "businessId"
                )
            ) != null &&
            requiredString(
                value.get(
                    "branchId"
                )
            ) != null &&
            isNumberingCode(
                requiredString(
                    value.get(
                        "businessCode"
                    )
                )
            ) &&
            isNumberingCode(
                requiredString(
                    value.get(
                        "branchCode"
                    )
                )
            ) &&
            requiredString(
                value.get(
                    "businessName"
                )
            ) != null &&
            requiredString(
                value.get(
                    "branchName"
                )
            ) != null &&
            requiredString(
                value.get(
                    "installationId"
                )
            ) != null &&
            bindingKeyId != null &&
            "SHA-256".equals(
                requiredString(
                    value.get(
                        "fingerprintAlgorithm"
                    )
                )
            ) &&
            isCanonicalSha256Fingerprint(
                fingerprint
            ) &&
            bindingKeyMatchesFingerprint(
                bindingKeyId,
                fingerprint
            ) &&
            createdAt != null &&
            updatedAt != null &&
            !updatedAt.isBefore(
                createdAt
            ) &&
            schemaVersion != null &&
            schemaVersion.longValue() ==
                1L
        );
    }


    // ========================================================
    // INDEX HELPERS
    // ========================================================

    private static int findProfileScopeIndex(
        List<Map<String, Object>> values,
        String ownerId,
        String businessId,
        String branchId
    ) {

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
                ownerId.equals(
                    value.get(
                        "ownerId"
                    )
                ) &&
                businessId.equals(
                    value.get(
                        "businessId"
                    )
                ) &&
                branchId.equals(
                    value.get(
                        "branchId"
                    )
                )
            ) {
                return index;
            }
        }

        return -1;
    }


    private static int findProfileIdIndex(
        List<Map<String, Object>> values,
        String profileId
    ) {

        for (
            int index = 0;
            index < values.size();
            index++
        ) {

            if (
                profileId.equals(
                    values
                        .get(
                            index
                        )
                        .get(
                            "profileId"
                        )
                )
            ) {
                return index;
            }
        }

        return -1;
    }


    private static int findSequenceScopeIndex(
        List<Map<String, Object>> values,
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

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
                issuerId.equals(
                    value.get(
                        "issuerId"
                    )
                ) &&
                purpose.equals(
                    value.get(
                        "purpose"
                    )
                ) &&
                ownerId.equals(
                    value.get(
                        "ownerId"
                    )
                ) &&
                businessId.equals(
                    value.get(
                        "businessId"
                    )
                ) &&
                branchId.equals(
                    value.get(
                        "branchId"
                    )
                ) &&
                installationId.equals(
                    value.get(
                        "installationId"
                    )
                )
            ) {
                return index;
            }
        }

        return -1;
    }


    // ========================================================
    // LIST / COPY HELPERS
    // ========================================================

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asMapList(
        Object value
    ) {

        if (!(value instanceof List)) {
            return null;
        }

        List<?> source =
            (List<?>) value;

        List<Map<String, Object>> result =
            new ArrayList<>();

        for (
            Object item :
            source
        ) {

            if (!(item instanceof Map)) {
                return null;
            }

            result.add(
                (Map<String, Object>) item
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


    @SuppressWarnings("unchecked")
    private static Map<String, Object> deepCopyMap(
        Map<String, Object> source
    ) {

        Map<String, Object> result =
            new LinkedHashMap<>();

        for (
            Map.Entry<String, Object> entry :
            source.entrySet()
        ) {

            result.put(
                entry.getKey(),
                deepCopyValue(
                    entry.getValue()
                )
            );
        }

        return result;
    }


    @SuppressWarnings("unchecked")
    private static Object deepCopyValue(
        Object value
    ) {

        if (value instanceof Map) {
            return deepCopyMap(
                (Map<String, Object>) value
            );
        }

        if (value instanceof List) {

            List<Object> result =
                new ArrayList<>();

            for (
                Object item :
                (List<?>) value
            ) {
                result.add(
                    deepCopyValue(
                        item
                    )
                );
            }

            return result;
        }

        return value;
    }


    @SuppressWarnings("unchecked")
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

        if (!(existing instanceof List)) {
            throw new IllegalStateException(
                "FINORA Control Store collection is invalid: " +
                key
            );
        }

        List<?> raw =
            (List<?>) existing;

        for (Object item : raw) {
            if (!(item instanceof Map)) {
                throw new IllegalStateException(
                    "FINORA Control Store collection contains an invalid record: " +
                    key
                );
            }
        }

        return (List<Map<String, Object>>) existing;
    }


    // ========================================================
    // TEXT / VALUE HELPERS
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


    private static boolean sameRequiredText(
        Map<String, Object> value,
        String key,
        String expected
    ) {

        String actual =
            requiredString(
                value.get(
                    key
                )
            );

        return (
            actual != null &&
            expected != null &&
            expected.equals(
                actual
            )
        );
    }


    private static boolean sameRequiredText(
        Map<String, Object> left,
        Map<String, Object> right,
        String key
    ) {

        String leftValue =
            requiredString(
                left.get(
                    key
                )
            );

        String rightValue =
            requiredString(
                right.get(
                    key
                )
            );

        return (
            leftValue != null &&
            rightValue != null &&
            leftValue.equals(
                rightValue
            )
        );
    }


    private static boolean isNumberingCode(
        String value
    ) {

        return (
            value != null &&
            value.matches(
                "[A-Z0-9]{2,10}"
            )
        );
    }


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


    private static Instant parseInstant(
        String value
    ) {

        if (value == null) {
            return null;
        }

        try {

            return Instant.parse(
                value
            );

        } catch (
            DateTimeParseException error
        ) {

            return null;
        }
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
            Math.abs(
                number
            ) >
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


    private static Long positiveSafeLong(
        Object value
    ) {

        Long number =
            exactSafeLong(
                value
            );

        return (
            number != null &&
            number.longValue() >
                0L
        )
            ? number
            : null;
    }
}