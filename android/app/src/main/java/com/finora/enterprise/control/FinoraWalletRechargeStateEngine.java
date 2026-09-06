package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID SIGNED WALLET RECHARGE STATE ENGINE
//
// RESPONSIBILITY:
//
// - Accept only already-verified WALLET_RECHARGE packages
// - Validate Recharge payload semantics
// - Enforce payload/package issuedAt equality
// - Enforce exact payload/package scope and installation binding
// - Reject package replay
// - Reject stale/equal sequence
// - Reject duplicate paymentReference authorization
// - Append durable verified Recharge authorization
// - Update replay ledger and monotonic sequence together
// - Return one complete next Control State
//
// SECURITY:
//
// - No signature verification duplication.
// - No private keys.
// - No renderer/WebView authority.
// - No persistence.
// - No Wallet balance mutation.
// - No Business Date.
// - verifiedAt is package acceptance evidence only.
//
// ============================================================

import java.time.Instant;
import java.time.format.DateTimeParseException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class FinoraWalletRechargeStateEngine {

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;


    private FinoraWalletRechargeStateEngine() {
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
        Instant now
    ) {

        if (
            currentState == null ||
            verifiedPackage == null ||
            now == null
        ) {

            return Result.failure(
                "FINORA verified Wallet Recharge state transition input is incomplete."
            );
        }

        try {

            // ------------------------------------------------
            // GENERIC PACKAGE EVIDENCE
            // ------------------------------------------------

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
                positiveSafeInteger(
                    verifiedPackage.get(
                        "sequence"
                    )
                );

            Long payloadVersion =
                positiveSafeInteger(
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

            if (
                packageId == null ||
                !"WALLET_RECHARGE".equals(
                    purpose
                ) ||
                sequence == null ||
                payloadVersion == null ||
                payloadVersion.longValue() !=
                    1L ||
                !isCanonicalInstant(
                    packageIssuedAt
                ) ||
                issuer == null ||
                target == null ||
                payload == null
            ) {

                return Result.failure(
                    "FINORA verified WALLET_RECHARGE package structure is invalid."
                );
            }


            // ------------------------------------------------
            // ISSUER
            // ------------------------------------------------

            String issuerId =
                requiredString(
                    issuer.get(
                        "issuerId"
                    )
                );

            String signingKeyId =
                requiredString(
                    issuer.get(
                        "signingKeyId"
                    )
                );

            if (
                issuerId == null ||
                signingKeyId == null
            ) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE issuer identity is invalid."
                );
            }


            // ------------------------------------------------
            // VERIFIED PACKAGE TARGET
            // ------------------------------------------------

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
                !isValidBindingIdentity(
                    targetBindingKeyId,
                    targetFingerprintAlgorithm,
                    targetPublicKeyFingerprint
                )
            ) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE verified package target is invalid."
                );
            }


            // ------------------------------------------------
            // PAYLOAD SCOPE
            // ------------------------------------------------

            Map<String, Object> scope =
                asMap(
                    payload.get(
                        "scope"
                    )
                );

            if (scope == null) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE payload scope is invalid."
                );
            }

            String ownerId =
                requiredString(
                    scope.get(
                        "ownerId"
                    )
                );

            String businessId =
                requiredString(
                    scope.get(
                        "businessId"
                    )
                );

            String branchId =
                requiredString(
                    scope.get(
                        "branchId"
                    )
                );

            if (
                ownerId == null ||
                businessId == null ||
                branchId == null ||
                !ownerId.equals(
                    targetOwnerId
                ) ||
                !businessId.equals(
                    targetBusinessId
                ) ||
                !branchId.equals(
                    targetBranchId
                )
            ) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE payload scope does not match the verified package target."
                );
            }


            // ------------------------------------------------
            // PAYLOAD INSTALLATION BINDING
            // ------------------------------------------------

            Map<String, Object> binding =
                asMap(
                    payload.get(
                        "installationBinding"
                    )
                );

            if (binding == null) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE payload installation binding is invalid."
                );
            }

            String installationId =
                requiredString(
                    binding.get(
                        "installationId"
                    )
                );

            String bindingKeyId =
                requiredString(
                    binding.get(
                        "bindingKeyId"
                    )
                );

            String fingerprintAlgorithm =
                requiredString(
                    binding.get(
                        "fingerprintAlgorithm"
                    )
                );

            String publicKeyFingerprint =
                requiredString(
                    binding.get(
                        "publicKeyFingerprint"
                    )
                );

            if (
                installationId == null ||
                !isValidBindingIdentity(
                    bindingKeyId,
                    fingerprintAlgorithm,
                    publicKeyFingerprint
                ) ||
                !isExactOne(
                    binding.get(
                        "schemaVersion"
                    )
                ) ||
                !installationId.equals(
                    targetInstallationId
                ) ||
                !bindingKeyId.equals(
                    targetBindingKeyId
                ) ||
                !fingerprintAlgorithm.equals(
                    targetFingerprintAlgorithm
                ) ||
                !publicKeyFingerprint.equals(
                    targetPublicKeyFingerprint
                )
            ) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE payload installation binding does not match the verified package target."
                );
            }


            // ------------------------------------------------
            // RECHARGE PAYLOAD
            // ------------------------------------------------

            String paymentReference =
                requiredString(
                    payload.get(
                        "paymentReference"
                    )
                );

            Long amountMinor =
            positiveSafeInteger(
                payload.get(
                    "amountMinor"
                )
            );

            String currency =
                requiredString(
                    payload.get(
                        "currency"
                    )
                );

            String paymentMethod =
                requiredString(
                    payload.get(
                        "paymentMethod"
                    )
                );

            String paymentSource =
                requiredString(
                    payload.get(
                        "paymentSource"
                    )
                );

            String payloadIssuedAt =
                requiredString(
                    payload.get(
                        "issuedAt"
                    )
                );

            String providerOrderId =
                optionalNonEmptyString(
                    payload,
                    "providerOrderId"
                );

            String providerTransactionId =
                optionalNonEmptyString(
                    payload,
                    "providerTransactionId"
                );

            if (
                paymentReference == null ||
                amountMinor == null ||
                !"INR".equals(
                    currency
                ) ||
                !isRechargePaymentMethod(
                    paymentMethod
                ) ||
                !isRechargePaymentSource(
                    paymentSource
                ) ||
                !isCanonicalInstant(
                    payloadIssuedAt
                ) ||
                !packageIssuedAt.equals(
                    payloadIssuedAt
                ) ||
                !optionalStringFieldIsValid(
                    payload,
                    "providerOrderId"
                ) ||
                !optionalStringFieldIsValid(
                    payload,
                    "providerTransactionId"
                ) ||
                !isExactOne(
                    payload.get(
                        "schemaVersion"
                    )
                )
            ) {

                return Result.failure(
                    "FINORA WALLET_RECHARGE payload is invalid."
                );
            }


            // ------------------------------------------------
            // DEFENSIVE NEXT-STATE COPY
            // ------------------------------------------------

            Map<String, Object> nextState =
                deepCopyMap(
                    currentState
                );


            // ------------------------------------------------
            // EXISTING VERIFIED AUTHORIZATIONS
            // ------------------------------------------------

            List<Map<String, Object>> authorizations =
                readMapList(
                    nextState,
                    "walletRechargeAuthorizations"
                );

            if (authorizations == null) {

                return Result.failure(
                    "FINORA Wallet Recharge authorization collection is invalid."
                );
            }

            Set<String> authorizationPackageIds =
                new HashSet<>();

            Set<String> paymentReferences =
                new HashSet<>();

            for (
                Map<String, Object> authorization :
                authorizations
            ) {

                if (
                    !isValidPersistedAuthorization(
                        authorization
                    )
                ) {

                    return Result.failure(
                        "FINORA Wallet Recharge authorization state is invalid."
                    );
                }

                String existingPackageId =
                    requiredString(
                        authorization.get(
                            "packageId"
                        )
                    );

                String existingPaymentReference =
                    requiredString(
                        authorization.get(
                            "paymentReference"
                        )
                    );

                if (
                    !authorizationPackageIds.add(
                        existingPackageId
                    ) ||
                    !paymentReferences.add(
                        existingPaymentReference
                    )
                ) {

                    return Result.failure(
                        "FINORA Wallet Recharge authorization collection contains duplicate identities."
                    );
                }
            }

            if (
                paymentReferences.contains(
                    paymentReference
                )
            ) {

                return Result.failure(
                    "FINORA Wallet Recharge payment reference has already been authorized."
                );
            }


            // ------------------------------------------------
            // APPLIED PACKAGE REPLAY LEDGER
            // ------------------------------------------------

            List<Map<String, Object>> appliedPackages =
                readMapList(
                    nextState,
                    "appliedControlPackages"
                );

            if (appliedPackages == null) {

                return Result.failure(
                    "FINORA applied Control Package ledger is invalid."
                );
            }

            Set<String> appliedPackageIds =
                new HashSet<>();

            for (
                Map<String, Object> applied :
                appliedPackages
            ) {

                if (
                    !isValidAppliedPackageRecord(
                        applied
                    )
                ) {

                    return Result.failure(
                        "FINORA applied Control Package ledger is invalid."
                    );
                }

                String existingPackageId =
                    requiredString(
                        applied.get(
                            "packageId"
                        )
                    );

                if (
                    !appliedPackageIds.add(
                        existingPackageId
                    )
                ) {

                    return Result.failure(
                        "FINORA applied Control Package ledger contains duplicate package IDs."
                    );
                }
            }

            if (
                appliedPackageIds.contains(
                    packageId
                )
            ) {

                return Result.failure(
                    "FINORA Wallet Recharge signed package has already been applied."
                );
            }


            // ------------------------------------------------
            // MONOTONIC SEQUENCE STATE
            // ------------------------------------------------

            List<Map<String, Object>> sequenceStates =
                readMapList(
                    nextState,
                    "controlSequences"
                );

            if (sequenceStates == null) {

                return Result.failure(
                    "FINORA Control Package sequence state is invalid."
                );
            }

            Set<String> sequenceKeys =
                new HashSet<>();

            int sequenceIndex =
                -1;

            String requiredSequenceKey =
                sequenceKey(
                    issuerId,
                    purpose,
                    ownerId,
                    businessId,
                    branchId,
                    installationId
                );

            for (
                int index = 0;
                index < sequenceStates.size();
                index++
            ) {

                Map<String, Object> state =
                    sequenceStates.get(
                        index
                    );

                if (
                    !isValidSequenceStateRecord(
                        state
                    )
                ) {

                    return Result.failure(
                        "FINORA Control Package sequence state is invalid."
                    );
                }

                String currentKey =
                    sequenceKey(
                        requiredString(
                            state.get(
                                "issuerId"
                            )
                        ),
                        requiredString(
                            state.get(
                                "purpose"
                            )
                        ),
                        requiredString(
                            state.get(
                                "ownerId"
                            )
                        ),
                        requiredString(
                            state.get(
                                "businessId"
                            )
                        ),
                        requiredString(
                            state.get(
                                "branchId"
                            )
                        ),
                        requiredString(
                            state.get(
                                "installationId"
                            )
                        )
                    );

                if (
                    !sequenceKeys.add(
                        currentKey
                    )
                ) {

                    return Result.failure(
                        "FINORA Control Package sequence state contains duplicate scopes."
                    );
                }

                if (
                    requiredSequenceKey.equals(
                        currentKey
                    )
                ) {

                    sequenceIndex =
                        index;
                }
            }

            if (
                sequenceIndex >= 0
            ) {

                Long previousSequence =
                    positiveSafeInteger(
                        sequenceStates
                            .get(
                                sequenceIndex
                            )
                            .get(
                                "lastSequence"
                            )
                    );

                if (
                    previousSequence == null ||
                    sequence.longValue() <=
                        previousSequence.longValue()
                ) {

                    return Result.failure(
                        "FINORA Wallet Recharge signed package sequence is stale."
                    );
                }
            }


            // ------------------------------------------------
            // VERIFIED AUTHORIZATION
            // ------------------------------------------------

            String verifiedAt =
                now.toString();

            Map<String, Object> authorization =
                new LinkedHashMap<>();

            authorization.put(
                "packageId",
                packageId
            );

            authorization.put(
                "issuerId",
                issuerId
            );

            authorization.put(
                "signingKeyId",
                signingKeyId
            );

            authorization.put(
                "purpose",
                "WALLET_RECHARGE"
            );

            authorization.put(
                "sequence",
                Long.valueOf(
                    sequence.longValue()
                )
            );

            authorization.put(
                "ownerId",
                ownerId
            );

            authorization.put(
                "businessId",
                businessId
            );

            authorization.put(
                "branchId",
                branchId
            );

            authorization.put(
                "installationId",
                installationId
            );

            authorization.put(
                "bindingKeyId",
                bindingKeyId
            );

            authorization.put(
                "fingerprintAlgorithm",
                "SHA-256"
            );

            authorization.put(
                "publicKeyFingerprint",
                publicKeyFingerprint
            );

            authorization.put(
                "paymentReference",
                paymentReference
            );

            authorization.put(
                "amountMinor",
                amountMinor
            );

            authorization.put(
                "currency",
                "INR"
            );

            authorization.put(
                "paymentMethod",
                paymentMethod
            );

            authorization.put(
                "paymentSource",
                paymentSource
            );

            if (providerOrderId != null) {

                authorization.put(
                    "providerOrderId",
                    providerOrderId
                );
            }

            if (providerTransactionId != null) {

                authorization.put(
                    "providerTransactionId",
                    providerTransactionId
                );
            }

            authorization.put(
                "issuedAt",
                payloadIssuedAt
            );

            authorization.put(
                "verifiedAt",
                verifiedAt
            );

            authorization.put(
                "schemaVersion",
                Long.valueOf(
                    1L
                )
            );

            if (
                !isValidPersistedAuthorization(
                    authorization
                )
            ) {

                return Result.failure(
                    "FINORA verified Wallet Recharge authorization could not be normalized."
                );
            }

            authorizations.add(
                authorization
            );


            // ------------------------------------------------
            // REPLAY LEDGER APPEND
            // ------------------------------------------------

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
                Long.valueOf(
                    sequence.longValue()
                )
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
                verifiedAt
            );

            appliedPackages.add(
                appliedRecord
            );


            // ------------------------------------------------
            // MONOTONIC SEQUENCE UPSERT
            // ------------------------------------------------

            Map<String, Object> nextSequenceState =
                new LinkedHashMap<>();

            nextSequenceState.put(
                "issuerId",
                issuerId
            );

            nextSequenceState.put(
                "purpose",
                purpose
            );

            nextSequenceState.put(
                "ownerId",
                ownerId
            );

            nextSequenceState.put(
                "businessId",
                businessId
            );

            nextSequenceState.put(
                "branchId",
                branchId
            );

            nextSequenceState.put(
                "installationId",
                installationId
            );

            nextSequenceState.put(
                "lastSequence",
                Long.valueOf(
                    sequence.longValue()
                )
            );

            nextSequenceState.put(
                "updatedAt",
                verifiedAt
            );

            if (sequenceIndex >= 0) {

                sequenceStates.set(
                    sequenceIndex,
                    nextSequenceState
                );

            } else {

                sequenceStates.add(
                    nextSequenceState
                );
            }


            // ------------------------------------------------
            // ONE COMPLETE NEXT CONTROL STATE
            // ------------------------------------------------

            nextState.put(
                "walletRechargeAuthorizations",
                authorizations
            );

            nextState.put(
                "appliedControlPackages",
                appliedPackages
            );

            nextState.put(
                "controlSequences",
                sequenceStates
            );

            nextState.put(
                "updatedAt",
                verifiedAt
            );

            return Result.success(
                nextState
            );

        } catch (Exception error) {

            return Result.failure(
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to apply verified FINORA Wallet Recharge authorization state."
            );
        }
    }


    // ========================================================
    // PERSISTED AUTHORIZATION VALIDATION
    // ========================================================

    private static boolean isValidPersistedAuthorization(
        Map<String, Object> value
    ) {

        if (value == null) {
            return false;
        }

        String packageId =
            requiredString(
                value.get(
                    "packageId"
                )
            );

        String issuerId =
            requiredString(
                value.get(
                    "issuerId"
                )
            );

        String signingKeyId =
            requiredString(
                value.get(
                    "signingKeyId"
                )
            );

        String purpose =
            requiredString(
                value.get(
                    "purpose"
                )
            );

        Long sequence =
            positiveSafeInteger(
                value.get(
                    "sequence"
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

        String paymentReference =
            requiredString(
                value.get(
                    "paymentReference"
                )
            );

        Long amountMinor =
            positiveSafeInteger(
                value.get(
                    "amountMinor"
                )
            );

        String currency =
            requiredString(
                value.get(
                    "currency"
                )
            );

        String paymentMethod =
            requiredString(
                value.get(
                    "paymentMethod"
                )
            );

        String paymentSource =
            requiredString(
                value.get(
                    "paymentSource"
                )
            );

        String issuedAt =
            requiredString(
                value.get(
                    "issuedAt"
                )
            );

        String verifiedAt =
            requiredString(
                value.get(
                    "verifiedAt"
                )
            );

        Instant issuedAtInstant =
            parseInstant(
                issuedAt
            );

        Instant verifiedAtInstant =
            parseInstant(
                verifiedAt
            );

        return (
            packageId != null &&
            issuerId != null &&
            signingKeyId != null &&
            "WALLET_RECHARGE".equals(
                purpose
            ) &&
            sequence != null &&
            ownerId != null &&
            businessId != null &&
            branchId != null &&
            installationId != null &&
            isValidBindingIdentity(
                bindingKeyId,
                fingerprintAlgorithm,
                publicKeyFingerprint
            ) &&
            paymentReference != null &&
            amountMinor != null &&
            "INR".equals(
                currency
            ) &&
            isRechargePaymentMethod(
                paymentMethod
            ) &&
            isRechargePaymentSource(
                paymentSource
            ) &&
            optionalStringFieldIsValid(
                value,
                "providerOrderId"
            ) &&
            optionalStringFieldIsValid(
                value,
                "providerTransactionId"
            ) &&
            issuedAtInstant != null &&
            verifiedAtInstant != null &&
            !verifiedAtInstant.isBefore(
                issuedAtInstant
            ) &&
            isExactOne(
                value.get(
                    "schemaVersion"
                )
            )
        );
    }


    // ========================================================
    // GENERIC REPLAY / SEQUENCE RECORD VALIDATION
    // ========================================================

    private static boolean isValidAppliedPackageRecord(
        Map<String, Object> value
    ) {

        return (
            value != null &&
            requiredString(
                value.get(
                    "packageId"
                )
            ) != null &&
            requiredString(
                value.get(
                    "issuerId"
                )
            ) != null &&
            requiredString(
                value.get(
                    "purpose"
                )
            ) != null &&
            positiveSafeInteger(
                value.get(
                    "sequence"
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
            requiredString(
                value.get(
                    "installationId"
                )
            ) != null &&
            isCanonicalInstant(
                requiredString(
                    value.get(
                        "appliedAt"
                    )
                )
            )
        );
    }


    private static boolean isValidSequenceStateRecord(
        Map<String, Object> value
    ) {

        return (
            value != null &&
            requiredString(
                value.get(
                    "issuerId"
                )
            ) != null &&
            requiredString(
                value.get(
                    "purpose"
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
            requiredString(
                value.get(
                    "installationId"
                )
            ) != null &&
            positiveSafeInteger(
                value.get(
                    "lastSequence"
                )
            ) != null &&
            isCanonicalInstant(
                requiredString(
                    value.get(
                        "updatedAt"
                    )
                )
            )
        );
    }


    // ========================================================
    // RECHARGE DOMAIN VALIDATION
    // ========================================================

    private static boolean isRechargePaymentMethod(
        String value
    ) {

        return (
            "UPI".equals(
                value
            ) ||
            "PHONEPE".equals(
                value
            ) ||
            "GOOGLE_PAY".equals(
                value
            ) ||
            "PAYTM".equals(
                value
            ) ||
            "RAZORPAY".equals(
                value
            ) ||
            "BANK_TRANSFER".equals(
                value
            ) ||
            "OTHER".equals(
                value
            )
        );
    }


    private static boolean isRechargePaymentSource(
        String value
    ) {

        return (
            "PHONEPE".equals(
                value
            ) ||
            "RAZORPAY".equals(
                value
            ) ||
            "UPI".equals(
                value
            ) ||
            "GOOGLE_PAY".equals(
                value
            ) ||
            "PAYTM".equals(
                value
            ) ||
            "BANK_TRANSFER".equals(
                value
            ) ||
            "MANUAL".equals(
                value
            )
        );
    }


    // ========================================================
    // BINDING VALIDATION
    // ========================================================

    private static boolean isValidBindingIdentity(
        String bindingKeyId,
        String fingerprintAlgorithm,
        String publicKeyFingerprint
    ) {

        if (
            bindingKeyId == null ||
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
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


    // ========================================================
    // COLLECTION HELPERS
    // ========================================================

    private static List<Map<String, Object>> readMapList(
        Map<String, Object> state,
        String key
    ) {

        if (!state.containsKey(key)) {

            return new ArrayList<>();
        }

        Object raw =
            state.get(
                key
            );

        if (!(raw instanceof List<?>)) {

            return null;
        }

        List<Map<String, Object>> output =
            new ArrayList<>();

        for (Object item : (List<?>) raw) {

            Map<String, Object> map =
                asMap(
                    item
                );

            if (map == null) {

                return null;
            }

            output.add(
                map
            );
        }

        return output;
    }


    private static String sequenceKey(
        String issuerId,
        String purpose,
        String ownerId,
        String businessId,
        String branchId,
        String installationId
    ) {

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
    // VALUE HELPERS
    // ========================================================

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


    private static boolean optionalStringFieldIsValid(
        Map<String, Object> value,
        String key
    ) {

        if (!value.containsKey(key)) {
            return true;
        }

        return requiredString(
            value.get(
                key
            )
        ) != null;
    }


    private static String optionalNonEmptyString(
        Map<String, Object> value,
        String key
    ) {

        if (!value.containsKey(key)) {
            return null;
        }

        return requiredString(
            value.get(
                key
            )
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


    private static Long positiveSafeInteger(
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
                0.0d ||
            number >
                (double) MAX_SAFE_INTEGER ||
            Math.rint(
                number
            ) !=
                number
        ) {

            return null;
        }

        return Long.valueOf(
            (long) number
        );
    }


    private static boolean isExactOne(
        Object value
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
                1.0d
        );
    }


    private static boolean isCanonicalInstant(
        String value
    ) {

        return parseInstant(
            value
        ) != null;
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


    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(
        Object value
    ) {

        if (!(value instanceof Map<?, ?>)) {
            return null;
        }

        Map<?, ?> raw =
            (Map<?, ?>) value;

        Map<String, Object> output =
            new LinkedHashMap<>();

        for (
            Map.Entry<?, ?> entry :
            raw.entrySet()
        ) {

            if (!(entry.getKey() instanceof String)) {
                return null;
            }

            output.put(
                (String) entry.getKey(),
                entry.getValue()
            );
        }

        return output;
    }


    // ========================================================
    // DEFENSIVE DEEP COPY
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

        if (value instanceof Map<?, ?>) {

            Map<?, ?> raw =
                (Map<?, ?>) value;

            Map<String, Object> copy =
                new LinkedHashMap<>();

            for (
                Map.Entry<?, ?> entry :
                raw.entrySet()
            ) {

                if (!(entry.getKey() instanceof String)) {

                    throw new IllegalStateException(
                        "FINORA Control State contains a non-string object key."
                    );
                }

                copy.put(
                    (String) entry.getKey(),
                    deepCopyValue(
                        entry.getValue()
                    )
                );
            }

            return copy;
        }

        if (value instanceof List<?>) {

            List<Object> copy =
                new ArrayList<>();

            for (Object item : (List<?>) value) {

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
