package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/*
 * Native verified BRANCH_ACCESS apply service.
 *
 * Security:
 * - verifies the original signed package
 * - exact installation target + native binding required
 * - replay / sequence protected
 * - persists only into encrypted FinoraControlStore
 * - never signs or changes the signed package
 */
public final class FinoraBranchAccessPackageApplyService {

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;

    private final FinoraControlStore controlStore;
    private final FinoraInstallationBindingService bindingService;

    public FinoraBranchAccessPackageApplyService(
        FinoraControlStore controlStore,
        FinoraInstallationBindingService bindingService
    ) {
        if (controlStore == null || bindingService == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Access dependencies are required."
            );
        }

        this.controlStore = controlStore;
        this.bindingService = bindingService;
    }

    public static final class ApplyResult {

        public final boolean success;
        public final String error;
        public final String packageId;
        public final Long sequence;

        private ApplyResult(
            boolean success,
            String error,
            String packageId,
            Long sequence
        ) {
            this.success = success;
            this.error = error;
            this.packageId = packageId;
            this.sequence = sequence;
        }

        static ApplyResult success(
            String packageId,
            long sequence
        ) {
            return new ApplyResult(
                true,
                null,
                packageId,
                Long.valueOf(sequence)
            );
        }

        static ApplyResult failure(
            String error
        ) {
            return new ApplyResult(
                false,
                error,
                null,
                null
            );
        }
    }

    public ApplyResult apply(
        JSONObject signedPackage,
        List<FinoraSignedControlPackageVerifier.TrustedKey> trustedKeys,
        Instant now
    ) {
        return applyWithVerifiedPortabilityAuthority(
            signedPackage,
            trustedKeys,
            now,
            null
        );
    }

    /*
     * Internal one-file onboarding boundary.
     *
     * portabilityAuthorityProof MUST already have been built from a
     * successfully verified BRANCH_PORTABILITY_AUTHORITY package by the
     * authoritative credential-enrollment pair service.
     *
     * Deliberately package-private:
     * - no renderer authority;
     * - no public plugin authority;
     * - ordinary BRANCH_ACCESS callers continue through apply(...).
     */
    ApplyResult applyWithVerifiedPortabilityAuthority(
        JSONObject signedPackage,
        List<FinoraSignedControlPackageVerifier.TrustedKey> trustedKeys,
        Instant now,
        JSONObject portabilityAuthorityProof
    ) {

        if (
            signedPackage == null ||
            trustedKeys == null ||
            now == null
        ) {
            return ApplyResult.failure(
                "FINORA signed Branch Access package is required."
            );
        }

        synchronized (FinoraControlPackageApplyLock.LOCK) {

            try {
                String rawState =
                    controlStore.read();

                if (rawState == null) {
                    return ApplyResult.failure(
                        "FINORA Control Store is unavailable."
                    );
                }

                JSONObject state =
                    new JSONObject(rawState);

                JSONObject installation =
                    state.optJSONObject("installation");

                if (installation == null) {
                    return ApplyResult.failure(
                        "FINORA installation identity is missing."
                    );
                }

                String installationId =
                    required(installation, "installationId");
                String ownerId =
                    required(installation, "ownerId");
                String businessId =
                    required(installation, "businessId");
                String branchId =
                    required(installation, "branchId");

                FinoraInstallationBindingCrypto.PublicBinding binding =
                    bindingService.get();

                if (
                    binding == null ||
                    !installationId.equals(binding.installationId)
                ) {
                    return ApplyResult.failure(
                        "FINORA native installation binding does not match."
                    );
                }

                Map<String, Object> packageMap =
                    FinoraJsonBridge.toMap(
                        signedPackage
                    );

                FinoraSignedControlPackageVerifier.Result verification =
                    FinoraSignedControlPackageVerifier.verify(
                        packageMap,
                        trustedKeys,
                        new FinoraSignedControlPackageVerifier.Target(
                            ownerId,
                            businessId,
                            branchId,
                            installationId,
                            binding.bindingKeyId,
                            "SHA-256",
                            binding.publicKeyFingerprint
                        ),
                        now
                    );

                if (
                    verification == null ||
                    !verification.valid
                ) {
                    return ApplyResult.failure(
                        verification == null
                            ? "FINORA Branch Access verification failed."
                            : verification.reason +
                                ": " +
                                verification.error
                    );
                }

                String purpose =
                    required(
                        signedPackage,
                        "purpose"
                    );

                if (!"BRANCH_ACCESS".equals(purpose)) {
                    return ApplyResult.failure(
                        "Verified FINORA package is not a valid BRANCH_ACCESS package."
                    );
                }

                String packageId =
                    required(
                        signedPackage,
                        "packageId"
                    );

                long sequence =
                    positiveLong(
                        signedPackage,
                        "sequence"
                    );

                if (
                    sequence <= 0L ||
                    sequence > MAX_SAFE_INTEGER
                ) {
                    return ApplyResult.failure(
                        "FINORA Branch Access sequence is invalid."
                    );
                }

                JSONObject issuer =
                    signedPackage.getJSONObject(
                        "issuer"
                    );

                String issuerId =
                    required(
                        issuer,
                        "issuerId"
                    );

                String signingKeyId =
                    required(
                        issuer,
                        "signingKeyId"
                    );

                JSONObject target =
                    signedPackage.getJSONObject(
                        "target"
                    );

                JSONObject payload =
                    signedPackage.getJSONObject(
                        "payload"
                    );

                if (
                    payload.optInt(
                        "schemaVersion",
                        -1
                    ) != 1
                ) {
                    return ApplyResult.failure(
                        "FINORA Branch Access payload schema is unsupported."
                    );
                }

                String action =
                    required(
                        payload,
                        "action"
                    );

                if (
                    !"ISSUE".equals(action) &&
                    !"RENEW".equals(action) &&
                    !"REPLACE".equals(action) &&
                    !"SUSPEND".equals(action) &&
                    !"RESUME".equals(action) &&
                    !"REVOKE".equals(action) &&
                    !"AUTHORIZE_CREDENTIAL".equals(action)
                ) {
                    return ApplyResult.failure(
                        "FINORA Branch Access lifecycle action is invalid."
                    );
                }

                boolean credentialAuthorizationOnly =
                    "AUTHORIZE_CREDENTIAL".equals(
                        action
                    );

                JSONObject accessGrant =
                    payload.optJSONObject(
                        "accessGrant"
                    );

                if (credentialAuthorizationOnly) {
                    if (accessGrant != null) {
                        return ApplyResult.failure(
                            "FINORA AUTHORIZE_CREDENTIAL must not contain an Access Grant snapshot."
                        );
                    }
                } else {
                    if (accessGrant == null) {
                        return ApplyResult.failure(
                            "FINORA Branch Access grant is required."
                        );
                    }

                    String grantError =
                        validateGrant(
                            accessGrant
                        );

                    if (grantError != null) {
                        return ApplyResult.failure(
                            grantError
                        );
                    }

                    if (
                        !ownerId.equals(
                            required(
                                accessGrant,
                                "ownerId"
                            )
                        ) ||
                        !businessId.equals(
                            required(
                                accessGrant,
                                "businessId"
                            )
                        ) ||
                        !branchId.equals(
                            required(
                                accessGrant,
                                "branchId"
                            )
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA Branch Access Grant does not match this installation."
                        );
                    }
                }

                JSONArray appliedPackages =
                    array(
                        state,
                        "appliedControlPackages"
                    );

                for (
                    int i = 0;
                    i < appliedPackages.length();
                    i++
                ) {
                    JSONObject record =
                        appliedPackages.optJSONObject(i);

                    if (record == null) {
                        return ApplyResult.failure(
                            "FINORA applied package state is malformed."
                        );
                    }

                    if (
                        packageId.equals(
                            record.optString(
                                "packageId",
                                null
                            )
                        )
                    ) {
                        return ApplyResult.failure(
                            "REPLAY_DETECTED: FINORA Control Package was already applied."
                        );
                    }
                }

                JSONArray sequenceStates =
                    array(
                        state,
                        "controlSequences"
                    );

                int sequenceIndex = -1;

                for (
                    int i = 0;
                    i < sequenceStates.length();
                    i++
                ) {
                    JSONObject record =
                        sequenceStates.optJSONObject(i);

                    if (record == null) {
                        return ApplyResult.failure(
                            "FINORA sequence state is malformed."
                        );
                    }

                    boolean matches =
                        issuerId.equals(
                            record.optString(
                                "issuerId",
                                null
                            )
                        ) &&
                        purpose.equals(
                            record.optString(
                                "purpose",
                                null
                            )
                        ) &&
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
                        ) &&
                        installationId.equals(
                            record.optString(
                                "installationId",
                                null
                            )
                        );

                    if (!matches) {
                        continue;
                    }

                    if (sequenceIndex >= 0) {
                        return ApplyResult.failure(
                            "FINORA duplicate Branch Access sequence scopes exist."
                        );
                    }

                    sequenceIndex = i;

                    long previous =
                        record.optLong(
                            "lastSequence",
                            -1L
                        );

                    if (sequence <= previous) {
                        return ApplyResult.failure(
                            "SEQUENCE_REJECTED: FINORA Branch Access sequence is not newer."
                        );
                    }
                }

                JSONArray grants =
                    array(
                        state,
                        "branchAccessGrants"
                    );

                int grantIndex = -1;
                JSONObject existingGrant = null;
                String nextStatus = null;

                if (!credentialAuthorizationOnly) {
                    grantIndex =
                        findGrant(
                            grants,
                            accessGrant
                        );

                    existingGrant =
                        grantIndex >= 0
                            ? grants.getJSONObject(
                                grantIndex
                            )
                            : null;

                    nextStatus =
                        required(
                            accessGrant,
                            "administrativeStatus"
                        );
                }

                if (
                    "ISSUE".equals(action) &&
                    !"ACTIVE".equals(nextStatus)
                ) {
                    return ApplyResult.failure(
                        "FINORA ISSUE action requires ACTIVE Branch Access."
                    );
                }

                if (
                    "SUSPEND".equals(action) &&
                    !"SUSPENDED".equals(nextStatus)
                ) {
                    return ApplyResult.failure(
                        "FINORA SUSPEND action requires SUSPENDED status."
                    );
                }

                if (
                    "RESUME".equals(action) &&
                    !"ACTIVE".equals(nextStatus)
                ) {
                    return ApplyResult.failure(
                        "FINORA RESUME action requires ACTIVE status."
                    );
                }

                if (
                    "REVOKE".equals(action) &&
                    !"REVOKED".equals(nextStatus)
                ) {
                    return ApplyResult.failure(
                        "FINORA REVOKE action requires REVOKED status."
                    );
                }

                if (!credentialAuthorizationOnly) {
                    if ("ISSUE".equals(action)) {

                    if (existingGrant != null) {
                        return ApplyResult.failure(
                            "FINORA ISSUE action requires that no current Branch Access grant exists for this scope."
                        );
                    }

                } else {

                    if (existingGrant == null) {
                        return ApplyResult.failure(
                            "FINORA Branch Access lifecycle action requires an existing current grant."
                        );
                    }

                    String currentStatus =
                        required(
                            existingGrant,
                            "administrativeStatus"
                        );

                    if (
                        "REVOKED".equals(
                            currentStatus
                        ) &&
                        !"REVOKED".equals(
                            nextStatus
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA revoked Branch Access is terminal."
                        );
                    }

                    if (
                        "SUSPEND".equals(action) &&
                        !"ACTIVE".equals(currentStatus)
                    ) {
                        return ApplyResult.failure(
                            "FINORA Branch Access administrative status transition is invalid."
                        );
                    }

                    if (
                        "RESUME".equals(action) &&
                        !"SUSPENDED".equals(currentStatus)
                    ) {
                        return ApplyResult.failure(
                            "FINORA Branch Access administrative status transition is invalid."
                        );
                    }

                    if (
                        "REVOKE".equals(action) &&
                        !"ACTIVE".equals(currentStatus) &&
                        !"SUSPENDED".equals(currentStatus)
                    ) {
                        return ApplyResult.failure(
                            "FINORA Branch Access administrative status transition is invalid."
                        );
                    }

                    if (
                        (
                            "RENEW".equals(action) ||
                            "REPLACE".equals(action)
                        ) &&
                        !currentStatus.equals(
                            nextStatus
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA signed Branch Access administrative status transition is invalid."
                        );
                    }

                    if (
                        "RENEW".equals(action) &&
                        !"REGISTERED".equals(
                            accessGrant.optString(
                                "accessType",
                                ""
                            )
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA RENEW action is valid only for REGISTERED access."
                        );
                    }

                    if (
                        "REPLACE".equals(action) &&
                        "REGISTERED".equals(
                            existingGrant.optString(
                                "accessType",
                                ""
                            )
                        ) &&
                        "DEMO".equals(
                            accessGrant.optString(
                                "accessType",
                                ""
                            )
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA REGISTERED access cannot be replaced with DEMO access."
                        );
                    }
                }

                }
                JSONObject credentialEnrollment =
                    payload.optJSONObject(
                        "credentialEnrollment"
                    );

                JSONObject signerEvidence =
                    null;

                if (
                    credentialAuthorizationOnly &&
                    credentialEnrollment == null
                ) {
                    return ApplyResult.failure(
                        "FINORA AUTHORIZE_CREDENTIAL requires credential enrollment authority."
                    );
                }

                if (credentialEnrollment != null) {

                    if (
                        !"ISSUE".equals(action) &&
                        !credentialAuthorizationOnly
                    ) {
                        return ApplyResult.failure(
                            "Credential enrollment authorization is permitted only with ISSUE or AUTHORIZE_CREDENTIAL."
                        );
                    }

                    String credentialError =
                        credentialAuthorizationOnly
                            ? validateCredentialAuthorizationForTarget(
                                credentialEnrollment,
                                ownerId,
                                businessId,
                                branchId
                            )
                            : validateCredentialEnrollment(
                                credentialEnrollment,
                                accessGrant
                            );

                    if (credentialError != null) {
                        return ApplyResult.failure(
                            credentialError
                        );
                    }

                    JSONArray credentials =
                        array(
                            state,
                            "branchCredentials"
                        );

                    String username =
                        required(
                            credentialEnrollment,
                            "username"
                        );

                    String canonicalUsername =
                        username
                            .trim()
                            .toLowerCase(
                                Locale.ROOT
                            );

                    for (
                        int i = 0;
                        i < credentials.length();
                        i++
                    ) {
                        JSONObject credential =
                            credentials.optJSONObject(i);

                        if (credential == null) {
                            return ApplyResult.failure(
                                "FINORA Branch Credential state is malformed."
                            );
                        }

                        String existingCanonical =
                            credential.optString(
                                "canonicalUsername",
                                ""
                            );

                        boolean sameScope =
                            required(
                                credentialEnrollment,
                                "userId"
                            ).equals(
                                credential.optString(
                                    "userId",
                                    null
                                )
                            ) &&
                            ownerId.equals(
                                credential.optString(
                                    "ownerId",
                                    null
                                )
                            ) &&
                            businessId.equals(
                                credential.optString(
                                    "businessId",
                                    null
                                )
                            ) &&
                            branchId.equals(
                                credential.optString(
                                    "branchId",
                                    null
                                )
                            );

                        if (
                            canonicalUsername.equals(
                                existingCanonical
                                    .trim()
                                    .toLowerCase(
                                        Locale.ROOT
                                    )
                            ) ||
                            sameScope
                        ) {
                            return ApplyResult.failure(
                                "FINORA Branch Credential already exists for this username or user scope."
                            );
                        }
                    }

                    JSONArray authorizations =
                        array(
                            state,
                            "branchCredentialEnrollmentAuthorizations"
                        );

                    String authorizationId =
                        required(
                            credentialEnrollment,
                            "authorizationId"
                        );

                    for (
                        int i = 0;
                        i < authorizations.length();
                        i++
                    ) {
                        JSONObject authorization =
                            authorizations.optJSONObject(i);

                        if (authorization == null) {
                            return ApplyResult.failure(
                                "FINORA credential authorization state is malformed."
                            );
                        }

                        if (
                            authorizationId.equals(
                                authorization.optString(
                                    "authorizationId",
                                    null
                                )
                            )
                        ) {
                            return ApplyResult.failure(
                                "FINORA credential enrollment authorization already exists."
                            );
                        }
                    }

                    FinoraSignedControlPackageVerifier.TrustedKey
                        verifiedTrustedKey =
                            findTrustedKey(
                                trustedKeys,
                                issuerId,
                                signingKeyId
                            );

                    if (verifiedTrustedKey == null) {
                        return ApplyResult.failure(
                            "FINORA verified Control signer evidence is unavailable."
                        );
                    }

                    signerEvidence =
                        trustedKeyJson(
                            verifiedTrustedKey
                        );

                    if (signerEvidence == null) {
                        return ApplyResult.failure(
                            "FINORA verified Control signer evidence is invalid."
                        );
                    }
                }

                if (portabilityAuthorityProof != null) {

                    if (credentialEnrollment == null) {
                        return ApplyResult.failure(
                            "FINORA portability authority proof is valid only with credential enrollment authority."
                        );
                    }

                    String credentialAuthorizationId =
                        required(
                            credentialEnrollment,
                            "authorizationId"
                        );

                    String portabilitySourceAuthorizationId =
                        required(
                            portabilityAuthorityProof,
                            "sourceAuthorizationId"
                        );

                    if (
                        !credentialAuthorizationId.equals(
                            portabilitySourceAuthorizationId
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA portability authority proof does not match the credential authorization."
                        );
                    }

                    if (
                        portabilityAuthorityProof.optInt(
                            "schemaVersion",
                            -1
                        ) != 1
                    ) {
                        return ApplyResult.failure(
                            "FINORA portability authority proof schema is invalid."
                        );
                    }

                    JSONObject signedPortabilityAuthorityPackage =
                        portabilityAuthorityProof.optJSONObject(
                            "signedPortabilityAuthorityPackage"
                        );

                    if (
                        signedPortabilityAuthorityPackage == null ||
                        !"BRANCH_PORTABILITY_AUTHORITY".equals(
                            signedPortabilityAuthorityPackage.optString(
                                "purpose",
                                null
                            )
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA signed Branch Portability Authority proof is invalid."
                        );
                    }

                    JSONObject portabilityPayload =
                        signedPortabilityAuthorityPackage.optJSONObject(
                            "payload"
                        );

                    if (
                        portabilityPayload == null ||
                        !credentialAuthorizationId.equals(
                            portabilityPayload.optString(
                                "sourceAuthorizationId",
                                null
                            )
                        )
                    ) {
                        return ApplyResult.failure(
                            "FINORA Branch Portability Authority source authorization does not match."
                        );
                    }
                }

                if (!credentialAuthorizationOnly) {
                    JSONObject grantCopy =
                        new JSONObject(
                            accessGrant.toString()
                        );

                    if (grantIndex >= 0) {
                        grants.put(
                            grantIndex,
                            grantCopy
                        );
                    } else {
                        grants.put(
                            grantCopy
                        );
                    }

                    state.put(
                        "branchAccessGrants",
                        grants
                    );
                }

                if (
                    "RENEW".equals(action)
                ) {
                    JSONArray renewalHistory =
                        array(
                            state,
                            "branchAccessRenewalHistory"
                        );

                    JSONObject renewal =
                        new JSONObject();

                    renewal.put(
                        "schemaVersion",
                        1
                    );
                    renewal.put(
                        "packageId",
                        packageId
                    );
                    renewal.put(
                        "issuerId",
                        issuerId
                    );
                    renewal.put(
                        "sequence",
                        sequence
                    );
                    renewal.put(
                        "action",
                        "RENEW"
                    );
                    renewal.put(
                        "ownerId",
                        ownerId
                    );
                    renewal.put(
                        "businessId",
                        businessId
                    );
                    renewal.put(
                        "branchId",
                        branchId
                    );
                    renewal.put(
                        "installationId",
                        installationId
                    );
                    renewal.put(
                        "accessGrant",
                        new JSONObject(
                            accessGrant.toString()
                        )
                    );
                    renewal.put(
                        "appliedAt",
                        now.toString()
                    );

                    renewalHistory.put(
                        renewal
                    );

                    state.put(
                        "branchAccessRenewalHistory",
                        renewalHistory
                    );
                }

                if (credentialEnrollment != null) {

                    JSONArray authorizations =
                        array(
                            state,
                            "branchCredentialEnrollmentAuthorizations"
                        );

                    authorizations.put(
                        new JSONObject(
                            credentialEnrollment.toString()
                        )
                    );

                    state.put(
                        "branchCredentialEnrollmentAuthorizations",
                        authorizations
                    );

                    JSONArray verificationEvidence =
                        array(
                            state,
                            "branchCredentialAuthorizationVerificationEvidence"
                        );

                    JSONObject evidence =
                        new JSONObject();

                    evidence.put(
                        "authorizationId",
                        required(
                            credentialEnrollment,
                            "authorizationId"
                        )
                    );
                    evidence.put(
                        "packageId",
                        packageId
                    );
                    evidence.put(
                        "issuerId",
                        issuerId
                    );
                    evidence.put(
                        "sequence",
                        sequence
                    );
                    evidence.put(
                        "verifiedControlSigner",
                        signerEvidence
                    );
                    evidence.put(
                        "verifiedAt",
                        now.toString()
                    );

                    if (portabilityAuthorityProof != null) {
                        evidence.put(
                            "portabilityAuthorityProof",
                            new JSONObject(
                                portabilityAuthorityProof.toString()
                            )
                        );
                    }

                    evidence.put(
                        "schemaVersion",
                        1
                    );

                    verificationEvidence.put(
                        evidence
                    );

                    state.put(
                        "branchCredentialAuthorizationVerificationEvidence",
                        verificationEvidence
                    );
                }

                JSONObject applied =
                    new JSONObject();

                applied.put(
                    "packageId",
                    packageId
                );
                applied.put(
                    "issuerId",
                    issuerId
                );
                applied.put(
                    "purpose",
                    purpose
                );
                applied.put(
                    "sequence",
                    sequence
                );
                applied.put(
                    "ownerId",
                    ownerId
                );
                applied.put(
                    "businessId",
                    businessId
                );
                applied.put(
                    "branchId",
                    branchId
                );
                applied.put(
                    "installationId",
                    installationId
                );
                applied.put(
                    "appliedAt",
                    now.toString()
                );

                appliedPackages.put(
                    applied
                );

                state.put(
                    "appliedControlPackages",
                    appliedPackages
                );

                JSONObject nextSequence =
                    new JSONObject();

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
                    now.toString()
                );

                if (sequenceIndex >= 0) {
                    sequenceStates.put(
                        sequenceIndex,
                        nextSequence
                    );
                } else {
                    sequenceStates.put(
                        nextSequence
                    );
                }

                state.put(
                    "controlSequences",
                    sequenceStates
                );

                state.put(
                    "updatedAt",
                    now.toString()
                );

                controlStore.write(
                    state.toString()
                );

                return ApplyResult.success(
                    packageId,
                    sequence
                );

            } catch (Exception error) {

                return ApplyResult.failure(
                    error.getMessage() != null
                        ? error.getMessage()
                        : "Unable to apply FINORA signed Branch Access package."
                );
            }
        }
    }

    private static String validateGrant(
        JSONObject value
    ) throws Exception {

        JSONObject validity =
            value.optJSONObject(
                "validity"
            );

        if (validity == null) {
            return "FINORA access validity is required.";
        }

        String accessType =
            required(
                value,
                "accessType"
            );

        Long registrationCycle =
            null;

        FinoraBranchAccessRuntimeEvaluator.RegistrationPayment
            payment =
                null;

        String demoId =
            null;

        if ("REGISTERED".equals(accessType)) {

            if (
                !value.has(
                    "registrationCycle"
                )
            ) {
                return "FINORA registration cycle is required.";
            }

            registrationCycle =
                Long.valueOf(
                    value.getLong(
                        "registrationCycle"
                    )
                );

            JSONObject paymentJson =
                value.optJSONObject(
                    "registrationPayment"
                );

            if (paymentJson == null) {
                return "FINORA registration payment metadata is required.";
            }

            String paymentMode =
                required(
                    paymentJson,
                    "paymentMode"
                );

            if (
                !"CASH".equals(paymentMode) &&
                !"UPI".equals(paymentMode) &&
                !"BANK_TRANSFER".equals(paymentMode) &&
                !"OTHER".equals(paymentMode)
            ) {
                return "FINORA registration payment mode is invalid.";
            }

            payment =
                new FinoraBranchAccessRuntimeEvaluator.RegistrationPayment(
                    paymentJson.getDouble(
                        "amount"
                    ),
                    required(
                        paymentJson,
                        "currency"
                    ),
                    required(
                        paymentJson,
                        "paidAt"
                    ),
                    Boolean.valueOf(
                        paymentJson.getBoolean(
                            "refundable"
                        )
                    )
                );

        } else if ("DEMO".equals(accessType)) {

            demoId =
                required(
                    value,
                    "demoId"
                );
        }

        FinoraBranchAccessRuntimeEvaluator.Grant grant =
            new FinoraBranchAccessRuntimeEvaluator.Grant(
                required(
                    value,
                    "grantId"
                ),
                required(
                    value,
                    "userId"
                ),
                required(
                    value,
                    "ownerId"
                ),
                required(
                    value,
                    "businessId"
                ),
                required(
                    value,
                    "branchId"
                ),
                required(
                    value,
                    "storageMode"
                ),
                required(
                    value,
                    "administrativeStatus"
                ),
                required(
                    validity,
                    "validFrom"
                ),
                required(
                    validity,
                    "validUntil"
                ),
                required(
                    value,
                    "createdAt"
                ),
                required(
                    value,
                    "updatedAt"
                ),
                Integer.valueOf(
                    value.getInt(
                        "schemaVersion"
                    )
                ),
                accessType,
                registrationCycle,
                payment,
                demoId
            );

        return FinoraBranchAccessRuntimeEvaluator
            .validateGrant(
                grant
            );
    }

    private static String validateCredentialAuthorizationForTarget(
        JSONObject authorization,
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

        if (
            authorization.optInt(
                "schemaVersion",
                -1
            ) != 1 ||
            !authorization.optBoolean(
                "oneTime",
                false
            ) ||
            !"SET_PASSWORD_ON_RECIPIENT".equals(
                authorization.optString(
                    "method",
                    null
                )
            )
        ) {
            return "FINORA credential enrollment authorization is invalid.";
        }

        String authorizationId =
            required(
                authorization,
                "authorizationId"
            );

        if (
            !authorizationId.startsWith(
                "FINORA-CREDENTIAL-ENROLLMENT-"
            )
        ) {
            return "FINORA credential enrollment authorization ID is invalid.";
        }

        required(
            authorization,
            "userId"
        );

        required(
            authorization,
            "username"
        );

        required(
            authorization,
            "fullName"
        );

        String role =
            required(
                authorization,
                "role"
            );

        if (
            !"ADMIN".equals(role) &&
            !"MANAGER".equals(role) &&
            !"COLLECTOR".equals(role) &&
            !"VIEWER".equals(role)
        ) {
            return "FINORA credential role is invalid.";
        }

        if (
            !ownerId.equals(
                required(
                    authorization,
                    "ownerId"
                )
            ) ||
            !businessId.equals(
                required(
                    authorization,
                    "businessId"
                )
            ) ||
            !branchId.equals(
                required(
                    authorization,
                    "branchId"
                )
            )
        ) {
            return "FINORA credential authorization does not match this installation target.";
        }

        String storageMode =
            required(
                authorization,
                "storageMode"
            );

        if (
            !"LOCAL".equals(storageMode) &&
            !"USB".equals(storageMode)
        ) {
            return "FINORA credential storage mode is invalid.";
        }

        String dataContext =
            required(
                authorization,
                "dataContext"
            );

        if (
            !"REAL".equals(dataContext) &&
            !"DEMO".equals(dataContext)
        ) {
            return "FINORA credential data context is invalid.";
        }

        if (
            "REAL".equals(dataContext) &&
            authorization.has(
                "demoId"
            )
        ) {
            return "FINORA REAL credential authorization must not contain demoId.";
        }

        if ("DEMO".equals(dataContext)) {
            required(
                authorization,
                "demoId"
            );
        }

        if (
            authorization.has(
                "credentialLifecycle"
            ) &&
            !"TEMPORARY_FIRST_LOGIN".equals(
                required(
                    authorization,
                    "credentialLifecycle"
                )
            )
        ) {
            return "FINORA credential lifecycle is invalid.";
        }

        return null;
    }
    private static String validateCredentialEnrollment(
        JSONObject authorization,
        JSONObject grant
    ) throws Exception {

        if (
            authorization.optInt(
                "schemaVersion",
                -1
            ) != 1 ||
            !authorization.optBoolean(
                "oneTime",
                false
            ) ||
            !"SET_PASSWORD_ON_RECIPIENT".equals(
                authorization.optString(
                    "method",
                    null
                )
            )
        ) {
            return "FINORA credential enrollment authorization is invalid.";
        }

        String authorizationId =
            required(
                authorization,
                "authorizationId"
            );

        if (
            !authorizationId.startsWith(
                "FINORA-CREDENTIAL-ENROLLMENT-"
            )
        ) {
            return "FINORA credential enrollment authorization ID is invalid.";
        }

        required(
            authorization,
            "username"
        );

        required(
            authorization,
            "fullName"
        );

        String role =
            required(
                authorization,
                "role"
            );

        if (
            !"ADMIN".equals(role) &&
            !"MANAGER".equals(role) &&
            !"COLLECTOR".equals(role) &&
            !"VIEWER".equals(role)
        ) {
            return "FINORA credential role is invalid.";
        }

        String expectedContext =
            "DEMO".equals(
                grant.optString(
                    "accessType",
                    ""
                )
            )
                ? "DEMO"
                : "REAL";

        if (
            !required(
                grant,
                "userId"
            ).equals(
                required(
                    authorization,
                    "userId"
                )
            ) ||
            !required(
                grant,
                "ownerId"
            ).equals(
                required(
                    authorization,
                    "ownerId"
                )
            ) ||
            !required(
                grant,
                "businessId"
            ).equals(
                required(
                    authorization,
                    "businessId"
                )
            ) ||
            !required(
                grant,
                "branchId"
            ).equals(
                required(
                    authorization,
                    "branchId"
                )
            ) ||
            !required(
                grant,
                "storageMode"
            ).equals(
                required(
                    authorization,
                    "storageMode"
                )
            ) ||
            !expectedContext.equals(
                required(
                    authorization,
                    "dataContext"
                )
            )
        ) {
            return "FINORA credential enrollment authorization does not match the Branch Access grant.";
        }

        if (
            "DEMO".equals(
                expectedContext
            ) &&
            !required(
                grant,
                "demoId"
            ).equals(
                required(
                    authorization,
                    "demoId"
                )
            )
        ) {
            return "FINORA credential DEMO scope does not match Branch Access."
            ;
        }

        return null;
    }

    private static int findGrant(
        JSONArray grants,
        JSONObject expected
    ) throws Exception {

        int found = -1;

        for (
            int i = 0;
            i < grants.length();
            i++
        ) {
            JSONObject candidate =
                grants.optJSONObject(i);

            if (candidate == null) {
                throw new IllegalStateException(
                    "FINORA Branch Access collection is malformed."
                );
            }

            boolean matches =
                required(
                    expected,
                    "userId"
                ).equals(
                    candidate.optString(
                        "userId",
                        null
                    )
                ) &&
                required(
                    expected,
                    "ownerId"
                ).equals(
                    candidate.optString(
                        "ownerId",
                        null
                    )
                ) &&
                required(
                    expected,
                    "businessId"
                ).equals(
                    candidate.optString(
                        "businessId",
                        null
                    )
                ) &&
                required(
                    expected,
                    "branchId"
                ).equals(
                    candidate.optString(
                        "branchId",
                        null
                    )
                );

            if (!matches) {
                continue;
            }

            if (found >= 0) {
                throw new IllegalStateException(
                    "FINORA duplicate Branch Access grants exist for this scope."
                );
            }

            found = i;
        }

        return found;
    }

    private static JSONArray array(
        JSONObject root,
        String key
    ) throws Exception {

        if (!root.has(key)) {
            return new JSONArray();
        }

        JSONArray value =
            root.optJSONArray(key);

        if (value == null) {
            throw new IllegalStateException(
                "FINORA Control Store collection is malformed: " +
                key
            );
        }

        return value;
    }

    private static String required(
        JSONObject object,
        String key
    ) throws Exception {

        String value =
            object.getString(
                key
            );

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA required property is invalid: " +
                key
            );
        }

        return value;
    }

    private static long positiveLong(
        JSONObject object,
        String key
    ) throws Exception {

        Object raw =
            object.get(
                key
            );

        if (!(raw instanceof Number)) {
            return -1L;
        }

        return ((Number) raw)
            .longValue();
    }

    private static FinoraSignedControlPackageVerifier.TrustedKey
        findTrustedKey(
            List<FinoraSignedControlPackageVerifier.TrustedKey> keys,
            String issuerId,
            String signingKeyId
        ) {

        for (
            FinoraSignedControlPackageVerifier.TrustedKey key :
            keys
        ) {
            if (
                issuerId.equals(
                    reflectedString(
                        key,
                        "issuerId"
                    )
                ) &&
                signingKeyId.equals(
                    reflectedString(
                        key,
                        "signingKeyId"
                    )
                )
            ) {
                return key;
            }
        }

        return null;
    }

    private static JSONObject trustedKeyJson(
        Object trustedKey
    ) {

        try {
            JSONObject result =
                new JSONObject();

            String[] requiredFields = {
                "issuerId",
                "signingKeyId",
                "algorithm",
                "format",
                "publicKey",
                "status",
                "validFrom"
            };

            for (
                String field :
                requiredFields
            ) {
                String value =
                    reflectedString(
                        trustedKey,
                        field
                    );

                if (
                    value == null ||
                    value.trim().isEmpty()
                ) {
                    return null;
                }

                result.put(
                    field,
                    value
                );
            }

            String validUntil =
                reflectedString(
                    trustedKey,
                    "validUntil"
                );

            if (
                validUntil != null &&
                !validUntil.trim().isEmpty()
            ) {
                result.put(
                    "validUntil",
                    validUntil
                );
            }

            return result;

        } catch (Exception error) {
            return null;
        }
    }

    private static String reflectedString(
        Object object,
        String fieldName
    ) {

        if (object == null) {
            return null;
        }

        try {
            Field field =
                object
                    .getClass()
                    .getDeclaredField(
                        fieldName
                    );

            field.setAccessible(
                true
            );

            Object value =
                field.get(
                    object
                );

            return value instanceof String
                ? (String) value
                : null;

        } catch (Exception error) {
            return null;
        }
    }
}