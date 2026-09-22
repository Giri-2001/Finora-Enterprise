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

        try {
            assertAuthorityContinuity(
                request
            );

            /*
             * Re-serialize/re-parse the credential before it is
             * included in the root. This preserves the same
             * canonical validation boundary as BranchCredentialStore.
             */
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

            synchronized (
                FinoraControlPackageApplyLock.LOCK
            ) {
                String existing =
                    controlState.read();

                if (existing != null) {
                    return Result.failure(
                        ERROR_CONTROL_STATE_EXISTS,
                        "FINORA fresh-device hydration refuses to replace an existing Control Store."
                    );
                }

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
            return Result.failure(
                ERROR_HYDRATION_FAILED,
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