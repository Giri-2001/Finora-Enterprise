package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// VERIFIED BRANCH ACTIVATION STATE ENGINE
//
// RESPONSIBILITY:
//
// - Accept only an already cryptographically verified package
// - Validate BRANCH_ACTIVATION payload semantics
// - Validate current installation binding
// - Validate REGISTERED / DEMO access grants
// - Enforce package replay / monotonic sequence
// - Produce one complete next Control Store state
//
// IMPORTANT:
//
// This class does NOT verify cryptographic signatures itself.
// Its caller must pass a package returned by
// FinoraSignedControlPackageVerifier.
//
// SECURITY:
//
// - Pure Java.
// - No Android Context.
// - No filesystem.
// - No private key.
// - No signing.
// - No WebView.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class FinoraBranchActivationStateEngine {

    private static final long REGISTERED_DURATION_MS =
        365L *
        24L *
        60L *
        60L *
        1000L;

    private FinoraBranchActivationStateEngine() {
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
                "FINORA verified activation apply input is incomplete."
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

        if (
            !isValidInstallation(
                installation
            )
        ) {

            return Result.failure(
                "FINORA installation identity is required before activation."
            );
        }

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
            activations == null ||
            storageEntitlements == null
        ) {

            return Result.failure(
                "FINORA Android Control Store package is incomplete."
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
            packageId == null ||
            !"BRANCH_ACTIVATION".equals(
                purpose
            ) ||
            sequence == null ||
            issuer == null ||
            target == null ||
            payload == null
        ) {

            return Result.failure(
                "Verified FINORA package is not a valid BRANCH_ACTIVATION package."
            );
        }

        String issuerId =
            requiredString(
                issuer.get(
                    "issuerId"
                )
            );

        if (issuerId == null) {

            return Result.failure(
                "FINORA Control Package issuer identity is invalid."
            );
        }


        // ----------------------------------------------------
        // EXACT INSTALLATION TARGET
        // ----------------------------------------------------

        if (
            !sameIdentity(
                installation,
                target
            ) ||
            !requiredString(
                installation.get(
                    "installationId"
                )
            ).equals(
                requiredString(
                    target.get(
                        "installationId"
                    )
                )
            )
        ) {

            return Result.failure(
                "FINORA Control Package does not belong to this installation."
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

        Map<String, Object> activation =
            asMap(
                payload.get(
                    "activation"
                )
            );

        Map<String, Object> accessGrant =
            asMap(
                payload.get(
                    "accessGrant"
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
                !"ISSUE".equals(action) &&
                !"RENEW".equals(action) &&
                !"REPLACE".equals(action)
            ) ||
            activation == null ||
            accessGrant == null ||
            installationBinding == null ||
            !isExactInteger(
                payload.get(
                    "schemaVersion"
                ),
                1L
            )
        ) {

            return Result.failure(
                "FINORA Branch Activation payload structure is invalid."
            );
        }

        String controlInstallationId =
            requiredString(
                installation.get(
                    "installationId"
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

        String payloadInstallationId =
            requiredString(
                installationBinding.get(
                    "installationId"
                )
            );

        String payloadBindingKeyId =
            requiredString(
                installationBinding.get(
                    "bindingKeyId"
                )
            );

        String payloadFingerprintAlgorithm =
            requiredString(
                installationBinding.get(
                    "fingerprintAlgorithm"
                )
            );

        String payloadPublicKeyFingerprint =
            requiredString(
                installationBinding.get(
                    "publicKeyFingerprint"
                )
            );

        if (
            controlInstallationId == null ||
            targetInstallationId == null ||
            targetBindingKeyId == null ||
            targetFingerprintAlgorithm == null ||
            targetPublicKeyFingerprint == null ||
            payloadInstallationId == null ||
            payloadBindingKeyId == null ||
            payloadFingerprintAlgorithm == null ||
            payloadPublicKeyFingerprint == null ||
            !"SHA-256".equals(
                targetFingerprintAlgorithm
            ) ||
            !"SHA-256".equals(
                payloadFingerprintAlgorithm
            ) ||
            !isCanonicalSha256Fingerprint(
                targetPublicKeyFingerprint
            ) ||
            !isCanonicalSha256Fingerprint(
                payloadPublicKeyFingerprint
            ) ||
            !bindingKeyMatchesFingerprint(
                targetBindingKeyId,
                targetPublicKeyFingerprint
            ) ||
            !bindingKeyMatchesFingerprint(
                payloadBindingKeyId,
                payloadPublicKeyFingerprint
            ) ||
            !controlInstallationId.equals(
                targetInstallationId
            ) ||
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
                "FINORA Branch Activation native installation binding does not match."
            );
        }


        // ----------------------------------------------------
        // ACTIVATION DOMAIN
        // ----------------------------------------------------

        if (
            !isValidActivation(
                activation
            ) ||
            !"ACTIVE".equals(
                activation.get(
                    "status"
                )
            ) ||
            !sameBranchIdentity(
                installation,
                activation
            )
        ) {

            return Result.failure(
                "FINORA signed Branch Activation record is invalid."
            );
        }


        // ----------------------------------------------------
        // ACCESS GRANT DOMAIN
        // ----------------------------------------------------

        String grantError =
            validateAccessGrant(
                accessGrant
            );

        if (grantError != null) {

            return Result.failure(
                grantError
            );
        }

        if (
            !sameBranchIdentity(
                installation,
                accessGrant
            )
        ) {

            return Result.failure(
                "FINORA signed Branch Access identity does not match this installation."
            );
        }

        if (
            "RENEW".equals(
                action
            ) &&
            !"REGISTERED".equals(
                accessGrant.get(
                    "accessType"
                )
            )
        ) {

            return Result.failure(
                "FINORA RENEW action is valid only for REGISTERED access."
            );
        }


        // ----------------------------------------------------
        // SECURITY ARRAYS
        // ----------------------------------------------------

        List<Map<String, Object>> accessGrants =
            optionalMapList(
                currentState.get(
                    "branchAccessGrants"
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
            accessGrants == null ||
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
            hasDuplicateAccessGrantKeys(
                accessGrants
            )
        ) {

            return Result.failure(
                "FINORA signed control security state contains duplicate identities."
            );
        }


        // ----------------------------------------------------
        // REPLAY / SEQUENCE
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
        // DEEP-COPY CURRENT STATE
        // ----------------------------------------------------

        Map<String, Object> nextState =
            deepCopyMap(
                currentState
            );

        List<Map<String, Object>> nextActivations =
            requiredMapList(
                nextState,
                "activations"
            );

        List<Map<String, Object>> nextAccessGrants =
            ensureMapList(
                nextState,
                "branchAccessGrants"
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
        // ACTIVATION UPSERT
        // ----------------------------------------------------

        int activationIndex =
            findActivationIndex(
                nextActivations,
                activation
            );

        if (activationIndex >= 0) {

            Map<String, Object> existing =
                nextActivations.get(
                    activationIndex
                );

            if (
                !requiredString(
                    existing.get(
                        "activationId"
                    )
                ).equals(
                    requiredString(
                        activation.get(
                            "activationId"
                        )
                    )
                )
            ) {

                return Result.failure(
                    "FINORA branch activation identity cannot be replaced."
                );
            }

            nextActivations.set(
                activationIndex,
                deepCopyMap(
                    activation
                )
            );

        } else {

            nextActivations.add(
                deepCopyMap(
                    activation
                )
            );
        }


        // ----------------------------------------------------
        // ACCESS GRANT UPSERT
        // ----------------------------------------------------

        int accessIndex =
            findAccessGrantIndex(
                nextAccessGrants,
                accessGrant
            );

        if (accessIndex >= 0) {

            nextAccessGrants.set(
                accessIndex,
                deepCopyMap(
                    accessGrant
                )
            );

        } else {

            nextAccessGrants.add(
                deepCopyMap(
                    accessGrant
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
        // MONOTONIC SEQUENCE
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


        nextState.put(
            "updatedAt",
            appliedAtText
        );

        return Result.success(
            nextState
        );
    }

    // ========================================================
    // ACCESS GRANT VALIDATION
    // ========================================================

    private static String validateAccessGrant(
        Map<String, Object> grant
    ) {

        if (
            !hasRequiredString(
                grant,
                "grantId"
            ) ||
            !hasRequiredString(
                grant,
                "userId"
            ) ||
            !hasRequiredString(
                grant,
                "ownerId"
            ) ||
            !hasRequiredString(
                grant,
                "businessId"
            ) ||
            !hasRequiredString(
                grant,
                "branchId"
            ) ||
            !isExactInteger(
                grant.get(
                    "schemaVersion"
                ),
                1L
            )
        ) {

            return "FINORA Branch Access grant identity is invalid.";
        }

                String storageMode =
            requiredString(
                grant.get(
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

            return "FINORA Branch Access storage mode must be LOCAL or USB.";
        }

String administrativeStatus =
            requiredString(
                grant.get(
                    "administrativeStatus"
                )
            );

        if (
            !"ACTIVE".equals(
                administrativeStatus
            ) &&
            !"SUSPENDED".equals(
                administrativeStatus
            ) &&
            !"REVOKED".equals(
                administrativeStatus
            )
        ) {

            return "FINORA Branch Access administrative status is invalid.";
        }

        Map<String, Object> validity =
            asMap(
                grant.get(
                    "validity"
                )
            );

        if (validity == null) {

            return "FINORA Branch Access validity is invalid.";
        }

        Instant validFrom =
            parseInstant(
                validity.get(
                    "validFrom"
                )
            );

        Instant validUntil =
            parseInstant(
                validity.get(
                    "validUntil"
                )
            );

        if (
            validFrom == null ||
            validUntil == null ||
            !validUntil.isAfter(
                validFrom
            )
        ) {

            return "FINORA Branch Access validity window is invalid.";
        }

        String accessType =
            requiredString(
                grant.get(
                    "accessType"
                )
            );

        if (
            "REGISTERED".equals(
                accessType
            )
        ) {

            long duration =
                validUntil.toEpochMilli() -
                validFrom.toEpochMilli();

            if (
                duration !=
                    REGISTERED_DURATION_MS
            ) {

                return "FINORA REGISTERED access must contain exactly 365 days of validity.";
            }

            Long cycle =
                positiveSafeLong(
                    grant.get(
                        "registrationCycle"
                    )
                );

            Map<String, Object> payment =
                asMap(
                    grant.get(
                        "registrationPayment"
                    )
                );

            if (
                cycle == null ||
                payment == null
            ) {

                return "FINORA REGISTERED access metadata is invalid.";
            }

            if (
                !isExactInteger(
                    payment.get(
                        "amount"
                    ),
                    2000L
                ) ||
                !"INR".equals(
                    payment.get(
                        "currency"
                    )
                ) ||
                !Boolean.FALSE.equals(
                    payment.get(
                        "refundable"
                    )
                ) ||
                parseInstant(
                    payment.get(
                        "paidAt"
                    )
                ) ==
                    null
            ) {

                return "FINORA annual registration payment policy is invalid.";
            }

            String paymentMode =
                requiredString(
                    payment.get(
                        "paymentMode"
                    )
                );

            if (
                !"CASH".equals(
                    paymentMode
                ) &&
                !"UPI".equals(
                    paymentMode
                ) &&
                !"BANK_TRANSFER".equals(
                    paymentMode
                ) &&
                !"OTHER".equals(
                    paymentMode
                )
            ) {

                return "FINORA registration payment mode is invalid.";
            }

            if (
                grant.containsKey(
                    "demoId"
                ) &&
                grant.get(
                    "demoId"
                ) !=
                    null
            ) {

                return "FINORA REGISTERED access cannot contain Demo identity.";
            }

            return null;
        }

        if (
            "DEMO".equals(
                accessType
            )
        ) {

            if (
                !hasRequiredString(
                    grant,
                    "demoId"
                )
            ) {

                return "FINORA Demo ID is required.";
            }

            if (
                (
                    grant.containsKey(
                        "registrationPayment"
                    ) &&
                    grant.get(
                        "registrationPayment"
                    ) !=
                        null
                ) ||
                (
                    grant.containsKey(
                        "registrationCycle"
                    ) &&
                    grant.get(
                        "registrationCycle"
                    ) !=
                        null
                )
            ) {

                return "FINORA Demo access cannot contain registration payment metadata.";
            }

            return null;
        }

        return "FINORA Branch Access type is unsupported.";
    }

    // ========================================================
    // EXISTING STATE VALIDATION
    // ========================================================

    private static boolean isValidInstallation(
        Map<String, Object> value
    ) {

        return (
            value != null &&
            hasRequiredString(
                value,
                "installationId"
            ) &&
            hasRequiredString(
                value,
                "ownerId"
            ) &&
            hasRequiredString(
                value,
                "businessId"
            ) &&
            hasRequiredString(
                value,
                "branchId"
            ) &&
            isExactInteger(
                value.get(
                    "schemaVersion"
                ),
                1L
            )
        );
    }

    private static boolean isValidActivation(
        Map<String, Object> value
    ) {

        return (
            value != null &&
            hasRequiredString(
                value,
                "activationId"
            ) &&
            hasRequiredString(
                value,
                "ownerId"
            ) &&
            hasRequiredString(
                value,
                "businessId"
            ) &&
            hasRequiredString(
                value,
                "branchId"
            ) &&
            parseInstant(
                value.get(
                    "createdAt"
                )
            ) !=
                null &&
            parseInstant(
                value.get(
                    "updatedAt"
                )
            ) !=
                null &&
            isExactInteger(
                value.get(
                    "schemaVersion"
                ),
                1L
            )
        );
    }

    // ========================================================
    // FIND
    // ========================================================

    private static int findActivationIndex(
        List<Map<String, Object>> values,
        Map<String, Object> expected
    ) {

        for (
            int index = 0;
            index < values.size();
            index++
        ) {

            if (
                sameBranchIdentity(
                    values.get(index),
                    expected
                )
            ) {

                return index;
            }
        }

        return -1;
    }

    private static int findAccessGrantIndex(
        List<Map<String, Object>> values,
        Map<String, Object> expected
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
                requiredString(
                    value.get(
                        "userId"
                    )
                ).equals(
                    requiredString(
                        expected.get(
                            "userId"
                        )
                    )
                ) &&
                sameBranchIdentity(
                    value,
                    expected
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
    // DUPLICATES
    // ========================================================

    private static boolean hasDuplicatePackageIds(
        List<Map<String, Object>> values
    ) {

        java.util.HashSet<String> ids =
            new java.util.HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String id =
                requiredString(
                    value.get(
                        "packageId"
                    )
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

        java.util.HashSet<String> keys =
            new java.util.HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String key =
                requiredString(
                    value.get(
                        "issuerId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "purpose"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "ownerId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "businessId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "branchId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "installationId"
                    )
                );

            if (
                key.contains(
                    "null"
                ) ||
                !keys.add(
                    key
                )
            ) {

                return true;
            }
        }

        return false;
    }

    private static boolean hasDuplicateAccessGrantKeys(
        List<Map<String, Object>> values
    ) {

        java.util.HashSet<String> keys =
            new java.util.HashSet<>();

        for (
            Map<String, Object> value :
            values
        ) {

            String key =
                requiredString(
                    value.get(
                        "userId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "ownerId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "businessId"
                    )
                ) +
                "::" +
                requiredString(
                    value.get(
                        "branchId"
                    )
                );

            if (
                key.contains(
                    "null"
                ) ||
                !keys.add(
                    key
                )
            ) {

                return true;
            }
        }

        return false;
    }

    // ========================================================
    // IDENTITY
    // ========================================================

    private static boolean sameIdentity(
        Map<String, Object> left,
        Map<String, Object> right
    ) {

        return (
            sameBranchIdentity(
                left,
                right
            ) &&
            requiredString(
                left.get(
                    "installationId"
                )
            ).equals(
                requiredString(
                    right.get(
                        "installationId"
                    )
                )
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
        String publicKeyFingerprint
    ) {

        if (
            bindingKeyId == null ||
            !isCanonicalSha256Fingerprint(
                publicKeyFingerprint
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
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        return expectedBindingKeyId.equals(
            bindingKeyId
        );
    }

    private static boolean sameBranchIdentity(
        Map<String, Object> left,
        Map<String, Object> right
    ) {

        if (
            left == null ||
            right == null
        ) {

            return false;
        }

        String leftOwner =
            requiredString(
                left.get(
                    "ownerId"
                )
            );

        String leftBusiness =
            requiredString(
                left.get(
                    "businessId"
                )
            );

        String leftBranch =
            requiredString(
                left.get(
                    "branchId"
                )
            );

        String rightOwner =
            requiredString(
                right.get(
                    "ownerId"
                )
            );

        String rightBusiness =
            requiredString(
                right.get(
                    "businessId"
                )
            );

        String rightBranch =
            requiredString(
                right.get(
                    "branchId"
                )
            );

        return (
            leftOwner != null &&
            leftBusiness != null &&
            leftBranch != null &&
            leftOwner.equals(
                rightOwner
            ) &&
            leftBusiness.equals(
                rightBusiness
            ) &&
            leftBranch.equals(
                rightBranch
            )
        );
    }

    // ========================================================
    // MAP / LIST
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

        return (
            List<Map<String, Object>>
        ) state.get(
            key
        );
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
            ) !=
                null
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

    private static Instant parseInstant(
        Object value
    ) {

        if (!(value instanceof String)) {
            return null;
        }

        try {

            return Instant.parse(
                (String) value
            );

        } catch (DateTimeParseException error) {

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
            number <=
                0 ||
            Math.rint(
                number
            ) !=
                number ||
            number >
                9007199254740991.0d
        ) {

            return null;
        }

        long output =
            ((Number) value)
                .longValue();

        if (
            ((double) output) !=
                number
        ) {

            return null;
        }

        return Long.valueOf(
            output
        );
    }

    private static boolean isExactInteger(
        Object value,
        long expected
    ) {

        if (!(value instanceof Number)) {
            return false;
        }

        double number =
            ((Number) value)
                .doubleValue();

        return (
            Double.isFinite(
                number
            ) &&
            number ==
                (double) expected
        );
    }

    // ========================================================
    // END
    // ========================================================
}