package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OSâ„¢

   ANDROID CONTROL BUNDLE IMPORT COORDINATOR

   MODULE  : Control
   LAYER   : Native Recipient Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept one already-parsed signed CONTROL_BUNDLE
   - Load recipient trusted public keys authoritatively
   - Resolve exact persisted installation business scope
   - Resolve exact current Android installation binding
   - Obtain accepted verification time from clock high-water
   - Verify the outer signed CONTROL_BUNDLE
   - Preflight every signed child before any child mutation
   - Enforce FINORA_CONTROL_BUNDLE_V1 composition policy
   - Reject nested bundles
   - Reject duplicate child package IDs
   - Reject duplicate child purposes
   - Dispatch children only to existing authoritative services

   SUPPORTED CHILD PURPOSES:

   - BRANCH_ACTIVATION
   - STORAGE_ENTITLEMENT
   - BUSINESS_PROFILE
   - PRICING_POLICY
   - WALLET_RECHARGE

   SECURITY BOUNDARY:

   - Public apply input is the signed bundle only.
   - Caller supplies no trusted keys.
   - Caller supplies no verification timestamp.
   - Caller supplies no expected target.
   - Caller supplies no installation binding metadata.
   - Caller supplies no filesystem path or raw file bytes.
   - Recipient trust is loaded from encrypted native storage.
   - Target identity is derived from Control Store + native key.
   - Clock time is obtained from installation-bound high-water.
   - This class exposes no renderer / Capacitor API.
   - This class contains no private signing material.

   ATOMICITY:

   - All cryptographic and composition preflight completes
     before the first child mutation.
   - Child purpose mutations remain intentionally non-atomic.
   - A later child failure may leave earlier children applied.
   - Existing purpose-specific replay / sequence engines remain
     authoritative for each individual child package.

   CONCURRENCY:

   - CONTROL_BUNDLE imports are serialized in this process.
   - No cross-process compare-and-swap guarantee is claimed.
============================================================ */

public final class FinoraControlBundleImportCoordinator {

    // ========================================================
    // BUNDLE CONTRACT
    // ========================================================

    private static final int SCHEMA_VERSION =
        1;

    private static final int PAYLOAD_VERSION =
        1;

    private static final String PURPOSE_CONTROL_BUNDLE =
        "CONTROL_BUNDLE";

    private static final String BUNDLE_FORMAT =
        "FINORA_CONTROL_BUNDLE_V1";

    private static final int MAX_CHILD_PACKAGES = 7;

    private static final BigInteger MAX_SAFE_INTEGER =
        new BigInteger(
            "9007199254740991"
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

    private static final Set<String> SUPPORTED_CHILD_PURPOSES;

    static {
        Set<String> purposes =
            new HashSet<>();

        purposes.add(
            "BRANCH_ACTIVATION"
        );

        purposes.add(
            "BRANCH_ACCESS"
        );

        purposes.add(
            "BRANCH_PORTABILITY_AUTHORITY"
        );

        purposes.add(
            "STORAGE_ENTITLEMENT"
        );

        purposes.add(
            "BUSINESS_PROFILE"
        );

        purposes.add(
            "PRICING_POLICY"
        );

        purposes.add(
            "WALLET_RECHARGE"
        );

        SUPPORTED_CHILD_PURPOSES =
            Collections.unmodifiableSet(
                purposes
            );
    }

    // ========================================================
    // IMPORT LOCK
    // ========================================================

    private static final Object IMPORT_LOCK =
        new Object();

    // ========================================================
    // APPLIED CHILD
    // ========================================================

    public static final class AppliedChild {

        public final String purpose;

        public final String packageId;

        public final Long sequence;

        private AppliedChild(
            String purpose,
            String packageId,
            Long sequence
        ) {
            this.purpose =
                purpose;

            this.packageId =
                packageId;

            this.sequence =
                sequence;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final String bundlePackageId;

        public final String verifiedAt;

        public final List<AppliedChild> appliedChildren;

        public final String errorCode;

        public final String error;

        private Result(
            boolean success,
            String bundlePackageId,
            String verifiedAt,
            List<AppliedChild> appliedChildren,
            String errorCode,
            String error
        ) {
            this.success =
                success;

            this.bundlePackageId =
                bundlePackageId;

            this.verifiedAt =
                verifiedAt;

            this.appliedChildren =
                Collections.unmodifiableList(
                    new ArrayList<>(
                        appliedChildren
                    )
                );

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        private static Result success(
            String bundlePackageId,
            String verifiedAt,
            List<AppliedChild> appliedChildren
        ) {
            return new Result(
                true,
                bundlePackageId,
                verifiedAt,
                appliedChildren,
                null,
                null
            );
        }

        private static Result failure(
            String bundlePackageId,
            String verifiedAt,
            List<AppliedChild> appliedChildren,
            String errorCode,
            String error
        ) {
            return new Result(
                false,
                bundlePackageId,
                verifiedAt,
                appliedChildren,
                errorCode,
                error
            );
        }
    }

    // ========================================================
    // VALIDATED BUNDLE
    // ========================================================

    private static final class ValidatedBundle {

        private final String packageId;

        private final String issuedAt;

        private final List<JSONObject> children;

        private ValidatedBundle(
            String packageId,
            String issuedAt,
            List<JSONObject> children
        ) {
            this.packageId =
                packageId;

            this.issuedAt =
                issuedAt;

            this.children =
                Collections.unmodifiableList(
                    new ArrayList<>(
                        children
                    )
                );
        }
    }

    // ========================================================
    // GENERIC CHILD APPLY RESULT
    // ========================================================

    private static final class ChildApplyResult {

        private final boolean success;

        private final String error;

        private final String packageId;

        private final Long sequence;

        private ChildApplyResult(
            boolean success,
            String error,
            String packageId,
            Long sequence
        ) {
            this.success =
                success;

            this.error =
                error;

            this.packageId =
                packageId;

            this.sequence =
                sequence;
        }
    }

    // ========================================================
    // DEPENDENCIES
    // ========================================================

    private final FinoraControlStore controlStore;

    private final FinoraInstallationBindingService bindingService;

    private final FinoraRecipientTrustStore trustStore;

    private final FinoraClockHighWaterAuthorityService
        clockHighWaterAuthority;

    private final FinoraBranchActivationPackageApplyService
        branchActivationService;

    private final FinoraBranchAccessPackageApplyService
        branchAccessService;

    private final FinoraBranchCredentialEnrollmentPairApplyService
        credentialEnrollmentPairService;

    private final FinoraBranchPortabilityAuthorityRecoveryService
        portabilityAuthorityRecoveryService;

    private final FinoraBusinessProfilePackageApplyService
        businessProfileService;

    private final FinoraPricingPolicyPackageApplyService
        pricingPolicyService;

    private final FinoraStorageEntitlementPackageApplyService
        storageEntitlementService;

    private final FinoraWalletRechargePackageApplyService
        walletRechargeService;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraControlBundleImportCoordinator(
        FinoraControlStore controlStore,
        FinoraInstallationBindingService bindingService,
        FinoraRecipientTrustStore trustStore,
        FinoraClockHighWaterAuthorityService clockHighWaterAuthority
    ) {
        if (controlStore == null) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle import requires Control Store."
            );
        }

        if (bindingService == null) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle import requires installation binding service."
            );
        }

        if (trustStore == null) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle import requires recipient trust store."
            );
        }

        if (clockHighWaterAuthority == null) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle import requires clock high-water authority."
            );
        }

        this.controlStore =
            controlStore;

        this.bindingService =
            bindingService;

        this.trustStore =
            trustStore;

        this.clockHighWaterAuthority =
            clockHighWaterAuthority;

        this.branchActivationService =
            new FinoraBranchActivationPackageApplyService(
                controlStore,
                bindingService
            );

        this.branchAccessService =
            new FinoraBranchAccessPackageApplyService(
                controlStore,
                bindingService
            );

        this.credentialEnrollmentPairService =
            new FinoraBranchCredentialEnrollmentPairApplyService(
                this.branchAccessService
            );

        this.portabilityAuthorityRecoveryService =
            new FinoraBranchPortabilityAuthorityRecoveryService(
                controlStore
            );

        this.businessProfileService =
            new FinoraBusinessProfilePackageApplyService(
                controlStore,
                bindingService
            );

        this.pricingPolicyService =
            new FinoraPricingPolicyPackageApplyService(
                controlStore,
                bindingService
            );

        this.storageEntitlementService =
            new FinoraStorageEntitlementPackageApplyService(
                controlStore,
                bindingService
            );

        this.walletRechargeService =
            new FinoraWalletRechargePackageApplyService(
                controlStore,
                bindingService
            );
    }

    // ========================================================
    // PUBLIC APPLY
    // ========================================================

    /**
     * Repair one historically skipped BRANCH_ACCESS child from
     * its original signed CONTROL_BUNDLE.
     *
     * SECURITY:
     * - validates original bundle structure;
     * - loads native recipient trust;
     * - resolves authoritative current installation/binding;
     * - obtains verification time from native clock authority;
     * - verifies the original outer CONTROL_BUNDLE signature;
     * - verifies the unchanged BRANCH_ACCESS child signature;
     * - applies ONLY that child through the dedicated service;
     * - normal replay / sequence protection remains authoritative.
     *
     * No other bundle child is dispatched.
     */
    public FinoraBranchAccessPackageApplyService.ApplyResult
        recoverBranchAccessFromBundle(
            JSONObject signedBundle
        ) {

        synchronized (
            IMPORT_LOCK
        ) {

            try {

                ValidatedBundle bundle =
                    validateBundleStructure(
                        signedBundle
                    );

                JSONObject branchAccessChild =
                    null;

                for (
                    JSONObject child :
                    bundle.children
                ) {

                    String purpose =
                        requireNonEmptyString(
                            child,
                            "purpose"
                        );

                    if (
                        "BRANCH_ACCESS".equals(
                            purpose
                        )
                    ) {

                        if (
                            branchAccessChild !=
                                null
                        ) {
                            return FinoraBranchAccessPackageApplyService
                                .ApplyResult
                                .failure(
                                    "FINORA Control Bundle contains multiple BRANCH_ACCESS children."
                                );
                        }

                        branchAccessChild =
                            child;
                    }
                }

                if (
                    branchAccessChild ==
                        null
                ) {
                    return FinoraBranchAccessPackageApplyService
                        .ApplyResult
                        .failure(
                            "FINORA Control Bundle does not contain a BRANCH_ACCESS child."
                        );
                }

                String serializedTrust =
                    trustStore.read();

                if (
                    serializedTrust ==
                        null
                ) {
                    return FinoraBranchAccessPackageApplyService
                        .ApplyResult
                        .failure(
                            "FINORA recipient operational trust has not been bootstrapped."
                        );
                }

                FinoraRecipientTrustState.State
                    trustState =
                        FinoraRecipientTrustState.parse(
                            serializedTrust
                        );

                List<
                    FinoraSignedControlPackageVerifier.TrustedKey
                > trustedKeys =
                    createVerifierTrustedKeys(
                        trustState
                    );

                FinoraSignedControlPackageVerifier.Target
                    expectedTarget =
                        resolveAuthoritativeTarget(
                            false
                        );

                FinoraClockHighWaterAuthorityService.Result
                    clockResult =
                        clockHighWaterAuthority.observe();

                if (
                    !clockResult.success ||
                    clockResult.data ==
                        null
                ) {
                    return FinoraBranchAccessPackageApplyService
                        .ApplyResult
                        .failure(
                            clockResult.error != null
                                ? clockResult.error
                                : "FINORA recipient clock authority rejected Branch Access recovery."
                        );
                }

                Instant acceptedNow =
                    Instant.parse(
                        clockResult.data.observedAt
                    );

                FinoraSignedControlPackageVerifier.Result
                    outerVerification =
                        verifySignedPackage(
                            signedBundle,
                            trustedKeys,
                            expectedTarget,
                            acceptedNow
                        );

                if (
                    !outerVerification.valid
                ) {
                    return FinoraBranchAccessPackageApplyService
                        .ApplyResult
                        .failure(
                            "FINORA Control Bundle verification failed: " +
                            verificationError(
                                outerVerification
                            )
                        );
                }

                FinoraSignedControlPackageVerifier.Result
                    childVerification =
                        verifySignedPackage(
                            branchAccessChild,
                            trustedKeys,
                            expectedTarget,
                            acceptedNow
                        );

                if (
                    !childVerification.valid
                ) {
                    return FinoraBranchAccessPackageApplyService
                        .ApplyResult
                        .failure(
                            "FINORA BRANCH_ACCESS child verification failed: " +
                            verificationError(
                                childVerification
                            )
                        );
                }

                return branchAccessService.apply(
                    branchAccessChild,
                    trustedKeys,
                    acceptedNow
                );

            } catch (
                Exception error
            ) {

                return FinoraBranchAccessPackageApplyService
                    .ApplyResult
                    .failure(
                        error.getMessage() != null
                            ? error.getMessage()
                            : "FINORA Branch Access recovery failed."
                    );
            }
        }
    }

    /**
     * Targeted migration path for historical USB credential
     * authorization state that already contains verified
     * BRANCH_ACCESS evidence but is missing only the signed
     * BRANCH_PORTABILITY_AUTHORITY proof.
     *
     * This method never dispatches or reapplies BRANCH_ACCESS.
     */
    public FinoraBranchPortabilityAuthorityRecoveryService.Result
        recoverCredentialPortabilityAuthority(
            JSONObject signedPortabilityAuthorityPackage
        ) {

        synchronized (
            IMPORT_LOCK
        ) {

            try {

                if (
                    signedPortabilityAuthorityPackage == null
                ) {
                    return FinoraBranchPortabilityAuthorityRecoveryService
                        .Result
                        .failure(
                            "FINORA signed Branch Portability Authority package is required."
                        );
                }

                String serializedTrust =
                    trustStore.read();

                if (
                    serializedTrust == null
                ) {
                    return FinoraBranchPortabilityAuthorityRecoveryService
                        .Result
                        .failure(
                            "FINORA recipient operational trust has not been bootstrapped."
                        );
                }

                FinoraRecipientTrustState.State
                    trustState =
                        FinoraRecipientTrustState.parse(
                            serializedTrust
                        );

                List<
                    FinoraSignedControlPackageVerifier.TrustedKey
                > trustedKeys =
                    createVerifierTrustedKeys(
                        trustState
                    );

                FinoraSignedControlPackageVerifier.Target
                    expectedTarget =
                        resolveAuthoritativeTarget(
                            false
                        );

                FinoraClockHighWaterAuthorityService.Result
                    clockResult =
                        clockHighWaterAuthority.observe();

                if (
                    !clockResult.success ||
                    clockResult.data == null
                ) {
                    return FinoraBranchPortabilityAuthorityRecoveryService
                        .Result
                        .failure(
                            clockResult.error != null
                                ? clockResult.error
                                : "FINORA recipient clock authority rejected portability recovery."
                        );
                }

                Instant acceptedNow =
                    Instant.parse(
                        clockResult.data.observedAt
                    );

                return portabilityAuthorityRecoveryService
                    .recover(
                        signedPortabilityAuthorityPackage,
                        trustedKeys,
                        expectedTarget,
                        acceptedNow
                    );

            } catch (
                Exception error
            ) {

                return FinoraBranchPortabilityAuthorityRecoveryService
                    .Result
                    .failure(
                        error.getMessage() != null
                            ? error.getMessage()
                            : "FINORA portability authority recovery failed."
                    );
            }
        }
    }

    public Result apply(
        JSONObject signedBundle
    ) {
        synchronized (
            IMPORT_LOCK
        ) {
            return applyLocked(
                signedBundle
            );
        }
    }

    // ========================================================
    // APPLY LOCKED
    // ========================================================

    private Result applyLocked(
        JSONObject signedBundle
    ) {

        List<AppliedChild> appliedChildren =
            new ArrayList<>();

        String bundlePackageId =
            null;

        String verifiedAt =
            null;

        try {
            // ------------------------------------------------
            // PURE STRUCTURAL / COMPOSITION PREFLIGHT
            //
            // No clock observation or mutation before basic
            // CONTROL_BUNDLE structure is established.
            // ------------------------------------------------

            ValidatedBundle bundle =
                validateBundleStructure(
                    signedBundle
                );

            bundlePackageId =
                bundle.packageId;

            // ------------------------------------------------
            // AUTHORITATIVE RECIPIENT TRUST
            // ------------------------------------------------

            String serializedTrust =
                trustStore.read();

            if (serializedTrust == null) {
                return Result.failure(
                    bundlePackageId,
                    null,
                    appliedChildren,
                    "RECIPIENT_TRUST_UNAVAILABLE",
                    "FINORA recipient operational trust has not been bootstrapped."
                );
            }

            FinoraRecipientTrustState.State trustState =
                FinoraRecipientTrustState.parse(
                    serializedTrust
                );

            List<
                FinoraSignedControlPackageVerifier.TrustedKey
            > trustedKeys =
                createVerifierTrustedKeys(
                    trustState
                );

            // ------------------------------------------------
            // AUTHORITATIVE EXPECTED TARGET
            //
            // owner/business/branch/installation come from the
            // encrypted Control Store.
            //
            // binding identity comes from AndroidKeyStore-backed
            // installation binding service.
            // ------------------------------------------------

            FinoraSignedControlPackageVerifier.Target expectedTarget =
                resolveAuthoritativeTarget(
                    (
                        bundle.children.size() == 1 &&
                        "WALLET_RECHARGE".equals(
                            bundle.children
                                .get(0)
                                .optString(
                                    "purpose",
                                    null
                                )
                        )
                    )
                );

            // ------------------------------------------------
            // AUTHORITATIVE ACCEPTED NOW
            //
            // Caller cannot inject time.
            // High-water authority captures native wall clock
            // and rejects rollback before verification.
            // ------------------------------------------------

            FinoraClockHighWaterAuthorityService.Result
                clockResult =
                    clockHighWaterAuthority.observe();

            if (
                !clockResult.success ||
                clockResult.data == null
            ) {
                return Result.failure(
                    bundlePackageId,
                    null,
                    appliedChildren,
                    clockResult.errorCode != null
                        ? clockResult.errorCode
                        : "CLOCK_AUTHORITY_FAILED",
                    clockResult.error != null
                        ? clockResult.error
                        : "FINORA recipient clock authority rejected the Control Bundle import."
                );
            }

            verifiedAt =
                clockResult.data.observedAt;

            Instant acceptedNow =
                Instant.parse(
                    verifiedAt
                );

            // ------------------------------------------------
            // OUTER CRYPTOGRAPHIC PREFLIGHT
            // ------------------------------------------------

            FinoraSignedControlPackageVerifier.Result
                outerVerification =
                    verifySignedPackage(
                        signedBundle,
                        trustedKeys,
                        expectedTarget,
                        acceptedNow
                    );

            if (!outerVerification.valid) {
                return Result.failure(
                    bundlePackageId,
                    verifiedAt,
                    appliedChildren,
                    "CONTROL_BUNDLE_VERIFICATION_FAILED",
                    verificationError(
                        outerVerification
                    )
                );
            }

            // ------------------------------------------------
            // ALL CHILD CRYPTOGRAPHIC PREFLIGHT
            //
            // Every child must pass before the first purpose
            // mutation is allowed to begin.
            // ------------------------------------------------


            for (
                JSONObject child :
                bundle.children
            ) {
                String childPurpose =
                    requireNonEmptyString(
                        child,
                        "purpose"
                    );

                FinoraSignedControlPackageVerifier.Result
                    childVerification;

                if (
                    "BRANCH_PORTABILITY_AUTHORITY".equals(
                        childPurpose
                    )
                ) {
                    childVerification =
                        FinoraSignedControlPackageVerifier
                            .verifyBranchScope(
                                FinoraJsonBridge.toMap(
                                    child
                                ),
                                trustedKeys,
                                expectedTarget.ownerId,
                                expectedTarget.businessId,
                                expectedTarget.branchId,
                                acceptedNow
                            );
                } else {
                    childVerification =
                        verifySignedPackage(
                            child,
                            trustedKeys,
                            expectedTarget,
                            acceptedNow
                        );
                }

                if (!childVerification.valid) {
                    return Result.failure(
                        bundlePackageId,
                        verifiedAt,
                        appliedChildren,
                        "CONTROL_BUNDLE_CHILD_PREFLIGHT_FAILED",
                        (
                            "FINORA Control Bundle child preflight failed for purpose " +
                            childPurpose +
                            ": " +
                            verificationError(
                                childVerification
                            )
                        )
                    );
                }
            }

            // ------------------------------------------------
            // OPTIONAL ONE-FILE CREDENTIAL ENROLLMENT PAIR
            // ------------------------------------------------

            JSONObject pairedBranchAccessChild =
                null;

            JSONObject pairedPortabilityChild =
                null;

            for (
                JSONObject candidate :
                bundle.children
            ) {
                String candidatePurpose =
                    requireNonEmptyString(
                        candidate,
                        "purpose"
                    );

                if (
                    "BRANCH_ACCESS".equals(
                        candidatePurpose
                    )
                ) {
                    pairedBranchAccessChild =
                        candidate;
                } else if (
                    "BRANCH_PORTABILITY_AUTHORITY".equals(
                        candidatePurpose
                    )
                ) {
                    pairedPortabilityChild =
                        candidate;
                }
            }

            if (
                pairedPortabilityChild != null &&
                pairedBranchAccessChild == null
            ) {
                return Result.failure(
                    bundlePackageId,
                    verifiedAt,
                    appliedChildren,
                    "CONTROL_BUNDLE_CREDENTIAL_PAIR_INVALID",
                    "FINORA Branch Portability Authority requires a BRANCH_ACCESS child."
                );
            }

            boolean credentialPairApplied =
                false;

            // ------------------------------------------------
            // APPLY CHILDREN IN BUNDLE ORDER
            //
            // BRANCH_ACCESS + BRANCH_PORTABILITY_AUTHORITY are
            // one verified credential-enrollment operation.
            // ------------------------------------------------

            for (
                JSONObject child :
                bundle.children
            ) {
                String purpose =
                    requireNonEmptyString(
                        child,
                        "purpose"
                    );

                /*
                 * Never independently mutate state for the
                 * portability child.
                 *
                 * Its complete signed package becomes proof inside
                 * the correlated Branch Access authorization
                 * evidence.
                 */
                if (
                    "BRANCH_PORTABILITY_AUTHORITY".equals(
                        purpose
                    )
                ) {
                    continue;
                }

                ChildApplyResult childResult;

                if (
                    "BRANCH_ACCESS".equals(
                        purpose
                    ) &&
                    pairedPortabilityChild != null
                ) {

                    FinoraBranchCredentialEnrollmentPairApplyService.Result
                        pairResult =
                            credentialEnrollmentPairService.apply(
                                child,
                                pairedPortabilityChild,
                                trustedKeys,
                                expectedTarget,
                                acceptedNow
                            );

                    childResult =
                        new ChildApplyResult(
                            pairResult.success,
                            pairResult.error,
                            pairResult.packageId,
                            pairResult.sequence
                        );

                    credentialPairApplied =
                        pairResult.success;

                } else {

                    childResult =
                        dispatchChild(
                            purpose,
                            child,
                            trustedKeys,
                            acceptedNow
                        );
                }

                /*
                 * A CONTROL_BUNDLE may be retried after an earlier
                 * attempt applied some provisioning children and then
                 * stopped on a later child.
                 *
                 * These provisioning purposes are state-setting and
                 * may treat the exact already-applied signed package
                 * as satisfied after full bundle/child preflight.
                 *
                 * BRANCH_ACCESS and WALLET_RECHARGE deliberately stay
                 * strict. Their replay / sequence protections must not
                 * be converted into bundle-level success.
                 */
                boolean replaySafeProvisioningPurpose =
                    (
                        "BRANCH_ACTIVATION".equals(
                            purpose
                        ) ||
                        "STORAGE_ENTITLEMENT".equals(
                            purpose
                        ) ||
                        "BUSINESS_PROFILE".equals(
                            purpose
                        ) ||
                        "PRICING_POLICY".equals(
                            purpose
                        )
                    );

                boolean alreadyAppliedSafeProvisioningChild =
                    (
                        !childResult.success &&
                        replaySafeProvisioningPurpose &&
                        childResult.error != null &&
                        childResult.error.contains(
                            "REPLAYED_PACKAGE"
                        )
                    );

                /*
                 * Credential enrollment is applied together with its
                 * verified portability proof in one Branch Access
                 * Control Store mutation.
                 *
                 * On a CONTROL_BUNDLE retry, REPLAY_DETECTED means the
                 * exact BRANCH_ACCESS packageId is already present in
                 * appliedPackages. Treat only that exact replay as an
                 * already-satisfied bundle child.
                 *
                 * SEQUENCE_REJECTED remains a hard failure.
                 */
                boolean alreadyAppliedExactBranchAccessChild =
                    (
                        !childResult.success &&
                        "BRANCH_ACCESS".equals(
                            purpose
                        ) &&
                        childResult.error != null &&
                        childResult.error.contains(
                            "REPLAY_DETECTED"
                        )
                    );

                /*
                 * WALLET_RECHARGE remains financially strict.
                 * Only the exact signed package replay is
                 * considered already satisfied on bundle retry.
                 * Different-package payment-reference duplicates
                 * and sequence failures remain hard failures.
                 */
                boolean alreadyAppliedExactWalletRechargeChild =
                    (
                        !childResult.success &&
                        "WALLET_RECHARGE".equals(
                            purpose
                        ) &&
                        childResult.error != null &&
                        childResult.error.contains(
                            "FINORA Wallet Recharge signed package has already been applied."
                        )
                    );

                if (
                    alreadyAppliedSafeProvisioningChild ||
                    alreadyAppliedExactBranchAccessChild ||
                    alreadyAppliedExactWalletRechargeChild
                ) {
                    childResult =
                        new ChildApplyResult(
                            true,
                            null,
                            childResult.packageId,
                            childResult.sequence
                        );

                    /*
                     * Exact BRANCH_ACCESS replay proves that the
                     * earlier credential-enrollment pair mutation
                     * already persisted Branch Access together with
                     * its verified portability proof.
                     *
                     * Only REPLAY_DETECTED reaches this condition.
                     * Sequence and other failures remain strict.
                     */
                    if (
                        alreadyAppliedExactBranchAccessChild &&
                        pairedPortabilityChild != null
                    ) {
                        credentialPairApplied = true;
                    }
                }
                if (!childResult.success) {
                    return Result.failure(
                        bundlePackageId,
                        verifiedAt,
                        appliedChildren,
                        "CONTROL_BUNDLE_CHILD_APPLY_FAILED",
                        (
                            "FINORA Control Bundle child apply failed for purpose " +
                            purpose +
                            ": " +
                            (
                                childResult.error != null
                                    ? childResult.error
                                    : "Unknown child apply failure."
                            )
                        )
                    );
                }

                appliedChildren.add(
                    new AppliedChild(
                        purpose,
                        childResult.packageId,
                        childResult.sequence
                    )
                );

                if (
                    "BRANCH_ACCESS".equals(
                        purpose
                    ) &&
                    pairedPortabilityChild != null &&
                    credentialPairApplied
                ) {
                    long portabilitySequence =
                        pairedPortabilityChild.getLong(
                            "sequence"
                        );

                    if (portabilitySequence <= 0L) {
                        return Result.failure(
                            bundlePackageId,
                            verifiedAt,
                            appliedChildren,
                            "CONTROL_BUNDLE_CREDENTIAL_PAIR_INVALID",
                            "FINORA Branch Portability Authority sequence is invalid."
                        );
                    }

                    appliedChildren.add(
                        new AppliedChild(
                            "BRANCH_PORTABILITY_AUTHORITY",
                            requireNonEmptyString(
                                pairedPortabilityChild,
                                "packageId"
                            ),
                            Long.valueOf(
                                portabilitySequence
                            )
                        )
                    );
                }
            }

            if (
                pairedPortabilityChild != null &&
                !credentialPairApplied
            ) {
                return Result.failure(
                    bundlePackageId,
                    verifiedAt,
                    appliedChildren,
                    "CONTROL_BUNDLE_CREDENTIAL_PAIR_NOT_APPLIED",
                    "FINORA credential enrollment pair was not applied."
                );
            }
            return Result.success(
                bundlePackageId,
                verifiedAt,
                appliedChildren
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                bundlePackageId,
                verifiedAt,
                appliedChildren,
                "CONTROL_BUNDLE_IMPORT_FAILED",
                messageOrDefault(
                    error,
                    "FINORA Control Bundle import failed."
                )
            );
        }
    }

    // ========================================================
    // STRUCTURAL BUNDLE VALIDATION
    // ========================================================

    private static ValidatedBundle validateBundleStructure(
        JSONObject signedBundle
    ) throws Exception {

        if (signedBundle == null) {
            throw new IllegalArgumentException(
                "FINORA signed Control Bundle is required."
            );
        }

        requireExactPositiveInteger(
            signedBundle,
            "schemaVersion",
            SCHEMA_VERSION,
            "FINORA Control Bundle schemaVersion is unsupported."
        );

        String packageId =
            requireNonEmptyString(
                signedBundle,
                "packageId"
            );

        String purpose =
            requireNonEmptyString(
                signedBundle,
                "purpose"
            );

        if (
            !PURPOSE_CONTROL_BUNDLE.equals(
                purpose
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA imported package purpose must be CONTROL_BUNDLE."
            );
        }

        String issuedAt =
            requireCanonicalTimestamp(
                signedBundle,
                "issuedAt",
                "FINORA Control Bundle issuedAt is invalid."
            );

        requirePositiveSafeInteger(
            signedBundle,
            "sequence",
            "FINORA Control Bundle sequence is invalid."
        );

        requireExactPositiveInteger(
            signedBundle,
            "payloadVersion",
            PAYLOAD_VERSION,
            "FINORA Control Bundle payloadVersion is unsupported."
        );

        if (
            signedBundle.optJSONObject(
                "issuer"
            ) == null ||
            signedBundle.optJSONObject(
                "target"
            ) == null ||
            signedBundle.optJSONObject(
                "payloadDigest"
            ) == null ||
            signedBundle.optJSONObject(
                "signature"
            ) == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle signed envelope is incomplete."
            );
        }

        JSONObject payload =
            signedBundle.optJSONObject(
                "payload"
            );

        if (payload == null) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle payload is invalid."
            );
        }

        requireExactPositiveInteger(
            payload,
            "schemaVersion",
            SCHEMA_VERSION,
            "FINORA Control Bundle payload schemaVersion is unsupported."
        );

        if (
            !BUNDLE_FORMAT.equals(
                requireNonEmptyString(
                    payload,
                    "bundleFormat"
                )
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle format is unsupported."
            );
        }

        String payloadIssuedAt =
            requireCanonicalTimestamp(
                payload,
                "issuedAt",
                "FINORA Control Bundle payload issuedAt is invalid."
            );

        if (
            !issuedAt.equals(
                payloadIssuedAt
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle payload and envelope issuedAt timestamps must match exactly."
            );
        }

        JSONArray packages =
            payload.optJSONArray(
                "packages"
            );

        if (
            packages == null ||
            packages.length() < 1 ||
            packages.length() >
                MAX_CHILD_PACKAGES
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle must contain between one and seven signed child packages."
            );
        }

        Set<String> packageIds =
            new HashSet<>();

        Set<String> purposes =
            new HashSet<>();

        List<JSONObject> children =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                packages.length();
            index++
        ) {
            JSONObject child =
                packages.optJSONObject(
                    index
                );

            if (child == null) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle contains an invalid child package."
                );
            }

            String childPackageId =
                requireNonEmptyString(
                    child,
                    "packageId"
                );

            String childPurpose =
                requireNonEmptyString(
                    child,
                    "purpose"
                );

            if (
                !SUPPORTED_CHILD_PURPOSES.contains(
                    childPurpose
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle contains an unsupported or nested child purpose."
                );
            }

            if (
                !packageIds.add(
                    childPackageId
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle contains a duplicate child package ID."
                );
            }

            if (
                !purposes.add(
                    childPurpose
                )
            ) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle v1 allows only one child package per purpose."
                );
            }

            if (
                child.optJSONObject(
                    "target"
                ) == null
            ) {
                throw new IllegalArgumentException(
                    "FINORA Control Bundle child target is invalid."
                );
            }

            children.add(
                child
            );
        }

        return new ValidatedBundle(
            packageId,
            issuedAt,
            children
        );
    }

    // ========================================================
    // RECIPIENT TRUST -> VERIFIER TRUST
    // ========================================================

    private static List<
        FinoraSignedControlPackageVerifier.TrustedKey
    > createVerifierTrustedKeys(
        FinoraRecipientTrustState.State trustState
    ) {

        if (
            trustState == null ||
            trustState.trustedKeys == null ||
            trustState.trustedKeys.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust contains no trusted signing keys."
            );
        }

        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > result =
            new ArrayList<>();

        for (
            FinoraRecipientTrustState.TrustedKeyRecord record :
            trustState.trustedKeys
        ) {
            result.add(
                new FinoraSignedControlPackageVerifier.TrustedKey(
                    record.issuerId,
                    record.signingKeyId,
                    record.algorithm,
                    record.format,
                    record.publicKey,
                    record.status,
                    record.validFrom,
                    record.validUntil
                )
            );
        }

        return Collections.unmodifiableList(
            result
        );
    }

    // ========================================================
    // AUTHORITATIVE EXPECTED TARGET
    // ========================================================

    private FinoraSignedControlPackageVerifier.Target
        resolveAuthoritativeTarget(
            boolean allowPortableWalletRecharge
        )
            throws Exception {

        String rawControlState =
            controlStore.read();

        if (rawControlState == null) {
            throw new IllegalStateException(
                "FINORA installation identity is required before importing a Control Bundle."
            );
        }

        JSONObject controlState =
            new JSONObject(
                rawControlState
            );

        JSONObject installation =
            controlState.optJSONObject(
                "installation"
            );

        if (installation == null) {
            throw new IllegalStateException(
                "FINORA Control Store installation identity is missing."
            );
        }

        String installationId =
            requireNonEmptyString(
                installation,
                "installationId"
            );

        String ownerId =
            requireNonEmptyString(
                installation,
                "ownerId"
            );

        String businessId =
            requireNonEmptyString(
                installation,
                "businessId"
            );

        String branchId =
            requireNonEmptyString(
                installation,
                "branchId"
            );

        FinoraInstallationBindingCrypto.PublicBinding binding =
            bindingService.get();

        if (binding == null) {
            throw new IllegalStateException(
                "FINORA Android native installation binding is required before importing a Control Bundle."
            );
        }

        if (
            binding.installationId == null ||
            (
                !allowPortableWalletRecharge &&
                !installationId.equals(
                    binding.installationId
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA native installation binding does not match the Control Store installation identity."
            );
        }

        return new FinoraSignedControlPackageVerifier.Target(
            ownerId,
            businessId,
            branchId,
            (
                allowPortableWalletRecharge
                    ? binding.installationId
                    : installationId
            ),
            binding.bindingKeyId,
            binding.fingerprintAlgorithm,
            binding.publicKeyFingerprint
        );
    }

    // ========================================================
    // GENERIC SIGNED PACKAGE PREFLIGHT
    // ========================================================

    private static FinoraSignedControlPackageVerifier.Result
        verifySignedPackage(
            JSONObject signedPackage,
            List<
                FinoraSignedControlPackageVerifier.TrustedKey
            > trustedKeys,
            FinoraSignedControlPackageVerifier.Target expectedTarget,
            Instant acceptedNow
        ) throws Exception {

        Map<String, Object> packageMap =
            FinoraJsonBridge.toMap(
                signedPackage
            );

        return FinoraSignedControlPackageVerifier.verify(
            packageMap,
            trustedKeys,
            expectedTarget,
            acceptedNow
        );
    }

    // ========================================================
    // CHILD DISPATCH
    // ========================================================

    private ChildApplyResult dispatchChild(
        String purpose,
        JSONObject child,
        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys,
        Instant acceptedNow
    ) {

        if (
            "BRANCH_ACTIVATION".equals(
                purpose
            )
        ) {
            FinoraBranchActivationPackageApplyService.ApplyResult
                result =
                    branchActivationService.apply(
                        child,
                        trustedKeys,
                        acceptedNow
                    );

            return new ChildApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }

                if (
            "BRANCH_ACCESS".equals(
                purpose
            )
        ) {
            FinoraBranchAccessPackageApplyService.ApplyResult
                result =
                    branchAccessService.apply(
                        child,
                        trustedKeys,
                        acceptedNow
                    );

            return new ChildApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }

        if (
            "STORAGE_ENTITLEMENT".equals(
                purpose
            )
        ) {
            FinoraStorageEntitlementPackageApplyService.ApplyResult
                result =
                    storageEntitlementService.apply(
                        child,
                        trustedKeys,
                        acceptedNow
                    );

            return new ChildApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }

        if (
            "BUSINESS_PROFILE".equals(
                purpose
            )
        ) {
            FinoraBusinessProfilePackageApplyService.ApplyResult
                result =
                    businessProfileService.apply(
                        child,
                        trustedKeys,
                        acceptedNow
                    );

            return new ChildApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }

        if (
            "PRICING_POLICY".equals(
                purpose
            )
        ) {
            FinoraPricingPolicyPackageApplyService.ApplyResult
                result =
                    pricingPolicyService.apply(
                        child,
                        trustedKeys,
                        acceptedNow
                    );

            return new ChildApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }

        if (
            "WALLET_RECHARGE".equals(
                purpose
            )
        ) {
            FinoraWalletRechargePackageApplyService.ApplyResult
                result =
                    walletRechargeService.apply(
                        child,
                        trustedKeys,
                        acceptedNow
                    );

            return new ChildApplyResult(
                result.success,
                result.error,
                result.packageId,
                result.sequence
            );
        }

        return new ChildApplyResult(
            false,
            "FINORA Control Bundle child purpose is unsupported.",
            null,
            null
        );
    }

    // ========================================================
    // VERIFICATION FAILURE MESSAGE
    // ========================================================

    private static String verificationError(
        FinoraSignedControlPackageVerifier.Result result
    ) {

        if (result == null) {
            return "FINORA signed package verification returned no result.";
        }

        String reason =
            result.reason != null
                ? result.reason
                : "VERIFICATION_FAILED";

        String error =
            result.error != null
                ? result.error
                : "FINORA signed package verification failed.";

        return (
            reason +
            ": " +
            error
        );
    }

    // ========================================================
    // JSON STRING
    // ========================================================

    private static String requireNonEmptyString(
        JSONObject value,
        String key
    ) {

        if (
            value == null ||
            key == null ||
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle property is missing: " +
                key
            );
        }

        Object raw;

        try {
            raw =
                value.get(
                    key
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle property could not be read: " +
                key,
                error
            );
        }

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle property " +
                key +
                " must be a string."
            );
        }

        String result =
            (String) raw;

        if (
            result.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Bundle property " +
                key +
                " must not be empty."
            );
        }

        return result;
    }

    // ========================================================
    // CANONICAL TIMESTAMP
    // ========================================================

    private static String requireCanonicalTimestamp(
        JSONObject value,
        String key,
        String errorMessage
    ) {

        String timestamp =
            requireNonEmptyString(
                value,
                key
            );

        if (
            !CANONICAL_ISO_MILLIS
                .matcher(
                    timestamp
                )
                .matches()
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }

        try {
            Instant parsed =
                Instant.parse(
                    timestamp
                );

            if (
                !ISO_MILLIS_FORMATTER
                    .format(
                        parsed
                    )
                    .equals(
                        timestamp
                    )
            ) {
                throw new IllegalArgumentException(
                    errorMessage
                );
            }

            return timestamp;
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
    // EXACT POSITIVE INTEGER
    // ========================================================

    private static void requireExactPositiveInteger(
        JSONObject value,
        String key,
        int expected,
        String errorMessage
    ) {

        BigInteger actual =
            requireInteger(
                value,
                key,
                errorMessage
            );

        if (
            !actual.equals(
                BigInteger.valueOf(
                    expected
                )
            )
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }
    }

    // ========================================================
    // POSITIVE SAFE INTEGER
    // ========================================================

    private static long requirePositiveSafeInteger(
        JSONObject value,
        String key,
        String errorMessage
    ) {

        BigInteger actual =
            requireInteger(
                value,
                key,
                errorMessage
            );

        if (
            actual.signum() <= 0 ||
            actual.compareTo(
                MAX_SAFE_INTEGER
            ) > 0
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }

        return actual.longValue();
    }

    private static BigInteger requireInteger(
        JSONObject value,
        String key,
        String errorMessage
    ) {

        if (
            value == null ||
            !value.has(
                key
            ) ||
            value.isNull(
                key
            )
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }

        Object raw;

        try {
            raw =
                value.get(
                    key
                );
        } catch (
            Exception error
        ) {
            throw new IllegalArgumentException(
                errorMessage,
                error
            );
        }

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                errorMessage
            );
        }

        try {
            return new BigDecimal(
                raw.toString()
            ).toBigIntegerExact();
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
    // ERROR MESSAGE
    // ========================================================

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {

        if (
            error == null ||
            error.getMessage() == null ||
            error.getMessage()
                .trim()
                .isEmpty()
        ) {
            return fallback;
        }

        return error.getMessage();
    }
}

/* ============================================================
   END
============================================================ */

