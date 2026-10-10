package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Fresh-device atomic native Control State hydration.
 *
 * INPUTS MUST ALREADY BE VERIFIED:
 * - authenticated/decrypted Portable Branch Auth credential;
 * - cryptographically verified Runtime Authority payload;
 * - canonical Portable Auth fingerprint;
 * - current native installation binding.
 *
 * SECURITY:
 * - refuses an existing Control Store;
 * - validates exact authority/credential continuity;
 * - binds storage entitlement to CURRENT native device identity;
 * - performs exactly one complete-root write;
 * - does not authorize Device Trust by itself.
 */
public final class
    FinoraPortableFreshDeviceHydrationService {

    public static final String STATUS_HYDRATED =
        "HYDRATED";

    public static final String ERROR_INVALID_INPUT =
        "INVALID_HYDRATION_INPUT";

    public static final String ERROR_AUTHORITY_MISMATCH =
        "RUNTIME_AUTHORITY_MISMATCH";

    public static final String ERROR_CONTROL_STATE_EXISTS =
        "CONTROL_STATE_ALREADY_EXISTS";

    public static final String ERROR_HYDRATION_FAILED =
        "FRESH_DEVICE_HYDRATION_FAILED";

    private static final String CONTROL_VERSION =
        "1.0";

    public interface ControlStatePort {

        String read()
            throws Exception;

        void write(
            String serialized
        )
            throws Exception;
    }

    public static final class NativeBinding {

        public final String installationId;
        public final String bindingKeyId;
        public final String fingerprintAlgorithm;
        public final String publicKeyFingerprint;

        public NativeBinding(
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint
        ) {
            this.installationId =
                require(
                    installationId,
                    "installationId"
                );

            this.bindingKeyId =
                require(
                    bindingKeyId,
                    "bindingKeyId"
                );

            this.fingerprintAlgorithm =
                require(
                    fingerprintAlgorithm,
                    "fingerprintAlgorithm"
                );

            this.publicKeyFingerprint =
                require(
                    publicKeyFingerprint,
                    "publicKeyFingerprint"
                );
        }
    }

    public static final class Request {

        public final FinoraBranchCredentialContract.Credential
            credential;

        public final FinoraPortableFreshDeviceRuntimeAuthorityContract
            .Payload runtimeAuthority;

        public final String portableAuthFingerprint;

        public final NativeBinding nativeBinding;

        public final String hydratedAt;

        public Request(
            FinoraBranchCredentialContract.Credential credential,
            FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload
                runtimeAuthority,
            String portableAuthFingerprint,
            NativeBinding nativeBinding,
            String hydratedAt
        ) {
            this.credential =
                credential;

            this.runtimeAuthority =
                runtimeAuthority;

            this.portableAuthFingerprint =
                portableAuthFingerprint;

            this.nativeBinding =
                nativeBinding;

            this.hydratedAt =
                hydratedAt;
        }
    }

    public static final class Result {

        public final boolean success;
        public final String status;
        public final String errorCode;
        public final String error;

        private Result(
            boolean success,
            String status,
            String errorCode,
            String error
        ) {
            this.success =
                success;

            this.status =
                status;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result success() {
            return new Result(
                true,
                STATUS_HYDRATED,
                null,
                null
            );
        }

        static Result failure(
            String errorCode,
            String error
        ) {
            return new Result(
                false,
                null,
                errorCode,
                error
            );
        }
    }

    private final ControlStatePort controlState;

    public FinoraPortableFreshDeviceHydrationService(
        ControlStatePort controlState
    ) {
        if (controlState == null) {
            throw new IllegalArgumentException(
                "FINORA fresh-device Control State port is required."
            );
        }

        this.controlState =
            controlState;
    }

    public Result hydrate(
        Request request
    ) {
        if (
            request == null ||
            request.credential == null ||
            request.runtimeAuthority == null ||
            request.nativeBinding == null ||
            isBlank(
                request.portableAuthFingerprint
            ) ||
            isBlank(
                request.hydratedAt
            )
        ) {
            return Result.failure(
                ERROR_INVALID_INPUT,
                "FINORA fresh-device hydration input is incomplete."
            );
        }

        String p128Stage = "AUTHORITY";
        // FINORA_P128_STAGE
        try {
assertAuthorityContinuity(
                request
            );

            /*
             * Re-serialize/re-parse the credential before it is
             * included in the root. This preserves the same
             * canonical validation boundary as BranchCredentialStore.
             */
            p128Stage = "CREDENTIAL_SERIALIZE";
            String credentialSerialized =
                FinoraBranchCredentialContract
                    .serialize(
                        request.credential
                    );

            FinoraBranchCredentialContract.Credential
                validatedCredential =
                    FinoraBranchCredentialContract
                        .parse(
                            credentialSerialized
                        );

            p128Stage = "ROOT_BUILD";
            synchronized (
                FinoraControlPackageApplyLock.LOCK
            ) {
                                /*
                 * PORTABLE_USB ANY-DEVICE AUTHORITY
                 *
                 * This hydration request has already passed the
                 * portable credential / runtime-authority recovery
                 * pipeline before reaching this commit boundary.
                 *
                 * A device-local Control Store is therefore NOT
                 * branch ownership authority.
                 *
                 * The same owner must be able to use an authorized
                 * FINORA USB on a new phone, tablet, laptop, or on
                 * a device that previously opened another branch.
                 *
                 * The verified portable branch state below replaces
                 * the current local runtime Control Store atomically.
                 *
                 * Authentication still requires the verified USB
                 * authority plus Owner User ID / Password and the
                 * Security Code challenge for an unknown device.
                 */

                JSONObject root =
                    buildRoot(
                        validatedCredential,
                        request.runtimeAuthority,
                        request.portableAuthFingerprint,
                        request.nativeBinding,
                        request.hydratedAt
                    );

                /*
                 * Exactly one production write.
                 *
                 * Production adapter delegates this to
                 * FinoraControlStore.write(), which provides
                 * Android Keystore AES-GCM + AtomicFile semantics.
                 */
                p128Stage = "CONTROL_WRITE";
                controlState.write(
                    root.toString()
                );
            }

            return Result.success();
        }
        catch (AuthorityMismatchException error) {
            return Result.failure(
                ERROR_AUTHORITY_MISMATCH,
                error.getMessage()
            );
        }
        catch (Exception error) {
            // FINORA_P146_ARGUMENT_DIAGNOSTIC
            // Fixed categories only. Never expose raw exception values.
            if (error instanceof IllegalArgumentException) {
                String p146Message = error.getMessage();

                String p146Category =
                    "FINORA REGISTERED Runtime Authority payment is required."
                        .equals(p146Message)
                            ? "PAYMENT_REQUIRED"
                            : "OTHER";

                return Result.failure(
                    ERROR_HYDRATION_FAILED +
                        "_P146_" + p128Stage +
                        "_ARGUMENT_" + p146Category,
                    "FINORA native hydration argument validation failed."
                );
            }

            // FINORA_P142_ROOT_DIAGNOSTIC
            // Diagnostic is limited to exception class, never values.
            String p142Class =
                error instanceof org.json.JSONException
                    ? "JSON"
                    : error instanceof SecurityException
                        ? "SECURITY"
                        : error instanceof IllegalArgumentException
                            ? "ARGUMENT"
                            : error instanceof NullPointerException
                                ? "NULL"
                                : "OTHER";

            return Result.failure(
                ERROR_HYDRATION_FAILED + "_P142_" +
                    p128Stage + "_" + p142Class,
                messageOrDefault(
                    error,
                    "FINORA fresh-device native hydration failed."
                )
            );
        }
    }

    static JSONObject buildRoot(
        FinoraBranchCredentialContract.Credential credential,
        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtime,
        String portableAuthFingerprint,
        NativeBinding binding,
        String hydratedAt
    ) throws Exception {

        JSONObject root =
            new JSONObject();

        root.put(
            "version",
            CONTROL_VERSION
        );

        try { android.util.Log.i("FINORA_P135", "ROOT_STAGE=INSTALLATION"); } catch (RuntimeException ignored) {} // FINORA_P135_ROOT_STAGE
        root.put(
            "installation",
            buildInstallation(
                runtime,
                binding,
                hydratedAt
            )
        );

        JSONArray activations =
            new JSONArray();

        try { android.util.Log.i("FINORA_P135", "ROOT_STAGE=ACTIVATION"); } catch (RuntimeException ignored) {} // FINORA_P135_ROOT_STAGE
        activations.put(
            buildActivation(
                runtime
            )
        );

        root.put(
            "activations",
            activations
        );

        JSONArray entitlements =
            new JSONArray();

        try { android.util.Log.i("FINORA_P135", "ROOT_STAGE=ENTITLEMENT"); } catch (RuntimeException ignored) {} // FINORA_P135_ROOT_STAGE
        entitlements.put(
            buildStorageEntitlement(
                runtime,
                binding
            )
        );

        root.put(
            "storageEntitlements",
            entitlements
        );

        JSONArray grants =
            new JSONArray();

        try { android.util.Log.i("FINORA_P135", "ROOT_STAGE=BRANCH_ACCESS"); } catch (RuntimeException ignored) {} // FINORA_P135_ROOT_STAGE
        grants.put(
            buildBranchAccessGrant(
                runtime
            )
        );

        root.put(
            "branchAccessGrants",
            grants
        );

        JSONArray businessProfiles =
            new JSONArray();

        if (runtime.businessProfile != null) {
            try { android.util.Log.i("FINORA_P135", "ROOT_STAGE=BUSINESS_PROFILE"); } catch (RuntimeException ignored) {} // FINORA_P135_ROOT_STAGE
            businessProfiles.put(
                buildBusinessProfile(
                    runtime.businessProfile
                )
            );
        }

        root.put(
            "businessProfiles",
            businessProfiles
        );

        JSONArray credentials =
            new JSONArray();

        try { android.util.Log.i("FINORA_P135", "ROOT_STAGE=CREDENTIAL"); } catch (RuntimeException ignored) {} // FINORA_P135_ROOT_STAGE
        credentials.put(
            new JSONObject(
                FinoraBranchCredentialContract
                    .serialize(
                        credential
                    )
            )
        );

        root.put(
            "branchCredentials",
            credentials
        );

        root.put(
            "updatedAt",
            hydratedAt
        );

        /*
         * Evidence is deliberately additive and ignored by existing
         * runtime readers. It binds the local hydration event to the
         * verified Portable Auth artifact without changing authority.
         */
        JSONObject hydrationEvidence =
            new JSONObject();

        hydrationEvidence.put(
            "authorityId",
            runtime.authorityId
        );

        hydrationEvidence.put(
            "portableAuthFingerprint",
            portableAuthFingerprint
        );

        hydrationEvidence.put(
            "hydratedAt",
            hydratedAt
        );

        hydrationEvidence.put(
            "schemaVersion",
            1
        );

        root.put(
            "freshDeviceHydrationEvidence",
            hydrationEvidence
        );

        return root;
    }

    private static JSONObject buildInstallation(
        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtime,
        NativeBinding binding,
        String hydratedAt
    ) throws Exception {

        JSONObject installation =
            new JSONObject();

        installation.put(
            "installationId",
            binding.installationId
        );

        installation.put(
            "ownerId",
            runtime.ownerId
        );

        installation.put(
            "businessId",
            runtime.businessId
        );

        installation.put(
            "branchId",
            runtime.branchId
        );

        if (runtime.businessCode != null) {
            installation.put(
                "businessCode",
                runtime.businessCode
            );
        }

        if (runtime.branchCode != null) {
            installation.put(
                "branchCode",
                runtime.branchCode
            );
        }

        installation.put(
            "createdAt",
            hydratedAt
        );

        installation.put(
            "updatedAt",
            hydratedAt
        );

        installation.put(
            "schemaVersion",
            1
        );

        return installation;
    }

    private static JSONObject buildActivation(
        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtime
    ) throws Exception {

        JSONObject activation =
            new JSONObject();

        activation.put(
            "activationId",
            runtime.activationId
        );

        activation.put(
            "ownerId",
            runtime.ownerId
        );

        activation.put(
            "businessId",
            runtime.businessId
        );

        activation.put(
            "branchId",
            runtime.branchId
        );

        activation.put(
            "status",
            runtime.activationStatus
        );

        if (runtime.activationActivatedAt != null) {
            activation.put(
                "activatedAt",
                runtime.activationActivatedAt
            );
        }

        activation.put(
            "createdAt",
            runtime.activationCreatedAt
        );

        activation.put(
            "updatedAt",
            runtime.activationUpdatedAt
        );

        activation.put(
            "schemaVersion",
            1
        );

        return activation;
    }

    private static JSONObject buildStorageEntitlement(
        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtime,
        NativeBinding binding
    ) throws Exception {

        JSONObject entitlement =
            new JSONObject();

        entitlement.put(
            "entitlementId",
            runtime.storageEntitlementId
        );

        entitlement.put(
            "userId",
            runtime.userId
        );

        entitlement.put(
            "ownerId",
            runtime.ownerId
        );

        entitlement.put(
            "businessId",
            runtime.businessId
        );

        entitlement.put(
            "branchId",
            runtime.branchId
        );

        entitlement.put(
            "installationId",
            binding.installationId
        );

        entitlement.put(
            "bindingKeyId",
            binding.bindingKeyId
        );

        entitlement.put(
            "fingerprintAlgorithm",
            binding.fingerprintAlgorithm
        );

        entitlement.put(
            "publicKeyFingerprint",
            binding.publicKeyFingerprint
        );

        entitlement.put(
            "storageMode",
            runtime.storageMode
        );

        entitlement.put(
            "status",
            runtime.storageEntitlementStatus
        );

        entitlement.put(
            "activatedAt",
            runtime.storageEntitlementActivatedAt
        );

        entitlement.put(
            "createdAt",
            runtime.storageEntitlementCreatedAt
        );

        entitlement.put(
            "updatedAt",
            runtime.storageEntitlementUpdatedAt
        );

        entitlement.put(
            "schemaVersion",
            1
        );

        return entitlement;
    }

    private static JSONObject buildBranchAccessGrant(
        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtime
    ) throws Exception {

        JSONObject grant =
            new JSONObject();

        grant.put(
            "grantId",
            runtime.branchAccessGrantId
        );

        grant.put(
            "userId",
            runtime.userId
        );

        grant.put(
            "ownerId",
            runtime.ownerId
        );

        grant.put(
            "businessId",
            runtime.businessId
        );

        grant.put(
            "branchId",
            runtime.branchId
        );

        grant.put(
            "storageMode",
            runtime.storageMode
        );

        grant.put(
            "accessType",
            runtime.branchAccessType
        );

        /*
         * Runtime Authority accessMode represents evaluated
         * operational mode. The persisted grant itself remains
         * administratively ACTIVE; validity carries expiry.
         */
        grant.put(
            "administrativeStatus",
            "ACTIVE"
        );

        JSONObject validity =
            new JSONObject();

        validity.put(
            "validFrom",
            runtime.accessValidFrom
        );

        if (runtime.accessValidUntil == null) {
            validity.put(
                "validUntil",
                JSONObject.NULL
            );
        }
        else {
            validity.put(
                "validUntil",
                runtime.accessValidUntil
            );
        }

        grant.put(
            "validity",
            validity
        );

        if (
            "REGISTERED".equals(
                runtime.branchAccessType
            )
        ) {
            // FINORA_P150_SERVER_FIRST_PAYMENT_PARITY
            // The signed server-first REGISTERED authority may
            // legitimately carry a null payment/cycle pair.
            // Partial metadata is never accepted.
            if (
                (runtime.registrationPayment == null) !=
                (runtime.registrationCycle == null)
            ) {
                throw new SecurityException(
                    "FINORA REGISTERED payment metadata is inconsistent."
                );
            }

            if (runtime.registrationPayment == null) {
                grant.put(
                    "registrationPayment",
                    JSONObject.NULL
                );
                grant.put(
                    "registrationCycle",
                    JSONObject.NULL
                );
            }
            else {
                grant.put(
                    "registrationPayment",
                    buildRegistrationPayment(
                        runtime.registrationPayment
                    )
                );
                grant.put(
                    "registrationCycle",
                    runtime.registrationCycle
                );
            }
        }
        else {
            grant.put(
                "demoId",
                runtime.demoId
            );
        }

        if (runtime.demoRemarks != null) {
            grant.put(
                "demoRemarks",
                runtime.demoRemarks
            );
        }

        grant.put(
            "createdAt",
            runtime.branchAccessCreatedAt
        );

        grant.put(
            "updatedAt",
            runtime.branchAccessUpdatedAt
        );

        grant.put(
            "schemaVersion",
            1
        );

        return grant;
    }

    private static JSONObject buildRegistrationPayment(
        FinoraPortableFreshDeviceRuntimeAuthorityContract
            .RegistrationPayment payment
    ) throws Exception {

        if (payment == null) {
            throw new IllegalArgumentException(
                "FINORA REGISTERED Runtime Authority payment is required."
            );
        }

        JSONObject value =
            new JSONObject();

        value.put(
            "amount",
            payment.amount
        );

        value.put(
            "currency",
            payment.currency
        );

        value.put(
            "paymentMode",
            payment.paymentMode
        );

        value.put(
            "paidAt",
            payment.paidAt
        );

        if (payment.reference != null) {
            value.put(
                "reference",
                payment.reference
            );
        }

        if (payment.remarks != null) {
            value.put(
                "remarks",
                payment.remarks
            );
        }

        value.put(
            "refundable",
            payment.refundable
        );

        return value;
    }

    private static void assertAuthorityContinuity(
        Request request
    ) throws AuthorityMismatchException {

        FinoraBranchCredentialContract.Credential credential =
            request.credential;

        FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload runtime =
            request.runtimeAuthority;

        if (
            !"ACTIVE".equals(
                credential.status
            ) ||
            credential.authGeneration == null ||
            !same(
                credential.credentialId,
                runtime.credentialId
            ) ||
            !same(
                credential.sourceAuthorizationId,
                runtime.sourceAuthorizationId
            ) ||
            credential.authGeneration.longValue() !=
                runtime.authGeneration ||
            !same(
                credential.userId,
                runtime.userId
            ) ||
            !same(
                credential.username,
                runtime.username
            ) ||
            !same(
                credential.canonicalUsername,
                runtime.canonicalUsername
            ) ||
            !same(
                credential.fullName,
                runtime.fullName
            ) ||
            !same(
                credential.role,
                runtime.role
            ) ||
            !same(
                credential.ownerId,
                runtime.ownerId
            ) ||
            !same(
                credential.businessId,
                runtime.businessId
            ) ||
            !same(
                credential.branchId,
                runtime.branchId
            ) ||
            !same(
                credential.storageMode,
                runtime.storageMode
            ) ||
            !same(
                credential.dataContext,
                runtime.dataContext
            ) ||
            !sameNullable(
                credential.demoId,
                runtime.demoId
            ) ||
            !same(
                request.portableAuthFingerprint,
                runtime.portableAuthFingerprint
            )
        ) {
            throw new AuthorityMismatchException(
                "FINORA Runtime Authority does not match the authenticated Portable Branch Auth credential."
            );
        }

        if (
            !"SHA-256".equals(
                request.nativeBinding.fingerprintAlgorithm
            ) ||
            !request.nativeBinding.publicKeyFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            throw new AuthorityMismatchException(
                "FINORA current native installation binding is invalid."
            );
        }
    }

    private static boolean same(
        String left,
        String right
    ) {
        return
            left != null &&
            left.equals(
                right
            );
    }

    private static boolean sameNullable(
        String left,
        String right
    ) {
        if (left == null) {
            return right == null;
        }

        return left.equals(
            right
        );
    }

    private static String require(
        String value,
        String label
    ) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(
                "FINORA " +
                label +
                " is required."
            );
        }

        return value;
    }

    private static boolean isBlank(
        String value
    ) {
        return
            value == null ||
            value.trim().isEmpty();
    }

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {
        if (error == null) {
            return fallback;
        }

        String message =
            error.getMessage();

        return isBlank(message)
            ? fallback
            : message;
    }

    private static final class AuthorityMismatchException
        extends Exception {

        AuthorityMismatchException(
            String message
        ) {
            super(
                message
            );
        }
    }
    private static JSONObject buildBusinessProfile(
        FinoraPortableFreshDeviceRuntimeAuthorityContract.BusinessProfile
            profile
    ) throws Exception {
        JSONObject result =
            new JSONObject();

        result.put(
            "profileId",
            profile.profileId
        );

        result.put(
            "ownerId",
            profile.ownerId
        );

        result.put(
            "businessId",
            profile.businessId
        );

        result.put(
            "branchId",
            profile.branchId
        );

        result.put(
            "businessCode",
            profile.businessCode
        );

        result.put(
            "branchCode",
            profile.branchCode
        );

        result.put(
            "businessName",
            profile.businessName
        );

        result.put(
            "branchName",
            profile.branchName
        );

        result.put(
            "installationId",
            profile.installationId
        );

        result.put(
            "bindingKeyId",
            profile.bindingKeyId
        );

        result.put(
            "fingerprintAlgorithm",
            profile.fingerprintAlgorithm
        );

        result.put(
            "publicKeyFingerprint",
            profile.publicKeyFingerprint
        );

        result.put(
            "createdAt",
            profile.createdAt
        );

        result.put(
            "updatedAt",
            profile.updatedAt
        );

        result.put(
            "schemaVersion",
            profile.schemaVersion
        );

        return result;
    }
}