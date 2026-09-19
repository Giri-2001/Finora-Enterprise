package com.finora.enterprise.control;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

// ============================================================
// FINORA ENTERPRISE OS
//
// ANDROID CONTROL
// FRESH-DEVICE TRUST AUTHORIZATION AUTHORITY
//
// PRECONDITION:
//
// Password authentication already succeeded.
//
// RESPONSIBILITY:
//
// - Accept Security Code only after Password success.
// - Consume an authenticated Portable Auth result.
// - Require exact current credential generation.
// - Require exact authenticated principal/payload equality.
// - Require independent portability-proof verification.
// - Require exact current Android native public binding.
// - Serialize Device Trust read/check/persist as one mutation.
// - Return ALREADY_TRUSTED idempotently for an exact trusted
//   current device.
// - Append exactly one Device Trust record for a new verified
//   current Android device.
//
// SECURITY:
//
// - Wrong Security Code/authentication => zero trust mutation.
// - Stale payload/authGeneration => zero trust mutation.
// - Principal/scope mismatch => zero trust mutation.
// - Portability proof failure => zero trust mutation.
// - Missing/corrupt native binding => zero trust mutation.
// - Ambiguous trust state => fail closed.
// - Private key is never read or persisted.
// - No renderer/WebView access.
//
// PRODUCTION DECRYPT / PORTABLE STORE ADAPTER:
// intentionally composed in a later bounded step.
//
// VERSION : 1.0
// ============================================================

public final class FinoraBranchDeviceTrustAuthorizationAuthority {

    public static final String STATUS_AUTHORIZED =
        "AUTHORIZED";

    public static final String STATUS_ALREADY_TRUSTED =
        "ALREADY_TRUSTED";

    public static final String ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED =
        "PORTABLE_AUTH_AUTHENTICATION_FAILED";

    public static final String ERROR_PORTABLE_AUTH_PAYLOAD_MISMATCH =
        "PORTABLE_AUTH_PAYLOAD_MISMATCH";

    public static final String ERROR_PORTABILITY_AUTH_VERIFICATION_FAILED =
        "PORTABILITY_AUTH_VERIFICATION_FAILED";

    public static final String ERROR_NATIVE_BINDING_UNAVAILABLE =
        "NATIVE_BINDING_UNAVAILABLE";

    public static final String ERROR_DEVICE_TRUST_STORE_FAILED =
        "DEVICE_TRUST_STORE_FAILED";

    public static final String ERROR_DEVICE_REVOKED =
        "DEVICE_REVOKED";

    public static final String ERROR_DEVICE_TRUST_PERSIST_FAILED =
        "DEVICE_TRUST_PERSIST_FAILED";

    private static final Pattern SHA256_HEX =
        Pattern.compile(
            "^[a-f0-9]{64}$"
        );

    // ========================================================
    // PASSWORD-AUTHENTICATED PRINCIPAL
    // ========================================================

    public static final class Principal {

        public final long authGeneration;

        public final String userId;
        public final String username;
        public final String fullName;
        public final String role;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String storageMode;
        public final String dataContext;
        public final String demoId;

        public Principal(
            long authGeneration,
            String userId,
            String username,
            String fullName,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId
        ) {

            this.authGeneration =
                authGeneration;

            this.userId =
                userId;

            this.username =
                username;

            this.fullName =
                fullName;

            this.role =
                role;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;
        }
    }

    // ========================================================
    // AUTHENTICATED PORTABLE AUTH STATE
    //
    // Production adapter may construct this only after:
    // - strict selected-store envelope read;
    // - authenticated Password + Security Code decrypt;
    // - outer/inner binding verification;
    // - canonical envelope fingerprint derivation.
    // ========================================================

    public static final class AuthenticatedPortableState {

        public final String authStateId;

        public final long authGeneration;

        public final String userId;
        public final String username;
        public final String canonicalUsername;
        public final String fullName;
        public final String role;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String storageMode;
        public final String dataContext;
        public final String demoId;

        public final String portableAuthFingerprint;

        public final int portableAuthSchemaVersion;

        public final String sourceAuthorizationId;

        public final FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence
                sourceAuthorizationVerificationEvidence;

        public AuthenticatedPortableState(
            String authStateId,
            long authGeneration,
            String userId,
            String username,
            String canonicalUsername,
            String fullName,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            String portableAuthFingerprint
        ) {
            this(
                authStateId,
                authGeneration,
                userId,
                username,
                canonicalUsername,
                fullName,
                role,
                ownerId,
                businessId,
                branchId,
                storageMode,
                dataContext,
                demoId,
                portableAuthFingerprint,
                0,
                null,
                null
            );
        }

        public AuthenticatedPortableState(
            String authStateId,
            long authGeneration,
            String userId,
            String username,
            String canonicalUsername,
            String fullName,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            String portableAuthFingerprint,
            int portableAuthSchemaVersion,
            String sourceAuthorizationId,
            FinoraPortableBranchAuthPayloadCodec
                .SourceAuthorizationEvidence
                    sourceAuthorizationVerificationEvidence
        ) {

            this.authStateId =
                authStateId;

            this.authGeneration =
                authGeneration;

            this.userId =
                userId;

            this.username =
                username;

            this.canonicalUsername =
                canonicalUsername;

            this.fullName =
                fullName;

            this.role =
                role;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.portableAuthFingerprint =
                portableAuthFingerprint;

            this.portableAuthSchemaVersion =
                portableAuthSchemaVersion;

            this.sourceAuthorizationId =
                sourceAuthorizationId;

            this.sourceAuthorizationVerificationEvidence =
                sourceAuthorizationVerificationEvidence;
        }
    }

    // ========================================================
    // NATIVE PUBLIC BINDING
    // ========================================================

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
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;
        }
    }

    // ========================================================
    // PORTS
    // ========================================================

    interface AuthenticatedPortableAuthPort {

        AuthenticatedPortableState authenticate(
            Principal principal,
            String password,
            String securityCode
        ) throws Exception;
    }

    interface PortabilityVerificationPort {

        boolean verify(
            AuthenticatedPortableState state
        ) throws Exception;
    }

    interface NativeBindingPort {

        NativeBinding get()
            throws Exception;
    }

    interface DeviceTrustStorePort {

        List<
            FinoraBranchDeviceTrustStore.Record
        > readAll()
            throws Exception;

        void persist(
            List<
                FinoraBranchDeviceTrustStore.Record
            > records,
            String updatedAt
        ) throws Exception;
    }

    interface ClockPort {

        String nowIso();
    }

    private final AuthenticatedPortableAuthPort
        authenticatedPortableAuth;

    private final PortabilityVerificationPort
        portabilityVerification;

    private final NativeBindingPort
        nativeBinding;

    private final DeviceTrustStorePort
        deviceTrustStore;

    private final ClockPort
        clock;

    FinoraBranchDeviceTrustAuthorizationAuthority(
        AuthenticatedPortableAuthPort authenticatedPortableAuth,
        PortabilityVerificationPort portabilityVerification,
        NativeBindingPort nativeBinding,
        DeviceTrustStorePort deviceTrustStore,
        ClockPort clock
    ) {

        if (
            authenticatedPortableAuth == null ||
            portabilityVerification == null ||
            nativeBinding == null ||
            deviceTrustStore == null ||
            clock == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Device Trust authorization dependencies are required."
            );
        }

        this.authenticatedPortableAuth =
            authenticatedPortableAuth;

        this.portabilityVerification =
            portabilityVerification;

        this.nativeBinding =
            nativeBinding;

        this.deviceTrustStore =
            deviceTrustStore;

        this.clock =
            clock;
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final String status;

        public final FinoraBranchDeviceTrustStore.Record
            record;

        public final String errorCode;
        public final String error;

        private Result(
            boolean success,
            String status,
            FinoraBranchDeviceTrustStore.Record record,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.status =
                status;

            this.record =
                record;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result success(
            String status,
            FinoraBranchDeviceTrustStore.Record record
        ) {

            return new Result(
                true,
                status,
                record,
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
                null,
                errorCode,
                error
            );
        }
    }

    // ========================================================
    // AUTHORIZE
    // ========================================================

    public Result authorize(
        Principal principal,
        String password,
        String securityCode
    ) {

        requirePrincipal(
            principal
        );

        if (password == null) {
            throw new IllegalArgumentException(
                "FINORA authenticated Password is required."
            );
        }

        if (securityCode == null) {
            throw new IllegalArgumentException(
                "FINORA Security Code is required."
            );
        }

        synchronized (
            FinoraControlPackageApplyLock.LOCK
        ) {

            return authorizeLocked(
                principal,
                password,
                securityCode
            );
        }
    }

    private Result authorizeLocked(
        Principal principal,
        String password,
        String securityCode
    ) {

        final AuthenticatedPortableState
            portableState;

        try {
            portableState =
                authenticatedPortableAuth.authenticate(
                    principal,
                    password,
                    securityCode
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED,
                "FINORA Portable Branch Auth authentication failed."
            );
        }

        if (portableState == null) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED,
                "FINORA Portable Branch Auth authentication failed."
            );
        }

        if (
            !portableStateMatchesPrincipal(
                portableState,
                principal
            )
        ) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_PAYLOAD_MISMATCH,
                "FINORA Portable Branch Auth payload does not match the authenticated principal."
            );
        }

        if (
            portableState.portableAuthFingerprint == null ||
            !SHA256_HEX
                .matcher(
                    portableState
                        .portableAuthFingerprint
                )
                .matches()
        ) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_PAYLOAD_MISMATCH,
                "FINORA Portable Branch Auth fingerprint is invalid."
            );
        }

        final boolean
            portabilityVerified;

        try {
            portabilityVerified =
                portabilityVerification.verify(
                    portableState
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_PORTABILITY_AUTH_VERIFICATION_FAILED,
                "FINORA Portable Branch Auth authorization evidence could not be verified."
            );
        }

        if (!portabilityVerified) {
            return Result.failure(
                ERROR_PORTABILITY_AUTH_VERIFICATION_FAILED,
                "FINORA Portable Branch Auth authorization evidence could not be verified."
            );
        }

        final NativeBinding
            currentBinding;

        try {
            currentBinding =
                nativeBinding.get();
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_NATIVE_BINDING_UNAVAILABLE,
                "FINORA native installation binding is unavailable."
            );
        }

        if (
            currentBinding == null ||
            !validNativeBinding(
                currentBinding
            )
        ) {
            return Result.failure(
                ERROR_NATIVE_BINDING_UNAVAILABLE,
                "FINORA native installation binding is unavailable."
            );
        }

        final List<
            FinoraBranchDeviceTrustStore.Record
        > existing;

        try {
            existing =
                deviceTrustStore.readAll();
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_DEVICE_TRUST_STORE_FAILED,
                "FINORA Device Trust state could not be validated."
            );
        }

        if (existing == null) {
            return Result.failure(
                ERROR_DEVICE_TRUST_STORE_FAILED,
                "FINORA Device Trust state could not be validated."
            );
        }

        FinoraBranchDeviceTrustStore.Record
            existingExact =
                null;

        int currentDeviceMatches =
            0;

        for (
            FinoraBranchDeviceTrustStore.Record record :
            existing
        ) {

            if (record == null) {
                return Result.failure(
                    ERROR_DEVICE_TRUST_STORE_FAILED,
                    "FINORA Device Trust state could not be validated."
                );
            }

            if (
                principalMatchesRecord(
                    record,
                    principal
                ) &&
                bindingMatchesRecord(
                    record,
                    currentBinding
                )
            ) {
                currentDeviceMatches++;
                existingExact =
                    record;
            }
        }

        if (currentDeviceMatches > 1) {
            return Result.failure(
                ERROR_DEVICE_TRUST_STORE_FAILED,
                "FINORA Device Trust state contains ambiguous current-device authority."
            );
        }

        if (
            currentDeviceMatches == 1 &&
            existingExact != null
        ) {
            if (
                FinoraBranchDeviceTrustLifecycle.isRevoked(
                    existingExact.status
                )
            ) {
                return Result.failure(
                    ERROR_DEVICE_REVOKED,
                    "FINORA current device has been revoked."
                );
            }

            return Result.success(
                STATUS_ALREADY_TRUSTED,
                existingExact
            );
        }

        final String
            trustedAt =
                clock.nowIso();

        if (
            trustedAt == null ||
            trustedAt.trim().isEmpty()
        ) {
            return Result.failure(
                ERROR_DEVICE_TRUST_PERSIST_FAILED,
                "FINORA could not establish Device Trust persistence time."
            );
        }

        String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    principal.username
                );

        FinoraBranchDeviceTrustStore.Record
            record =
                new FinoraBranchDeviceTrustStore.Record(
                    portableState.authStateId,
                    principal.userId,
                    canonicalUsername,
                    principal.ownerId,
                    principal.businessId,
                    principal.branchId,
                    principal.storageMode,
                    principal.dataContext,
                    principal.demoId,
                    principal.authGeneration,
                    "SHA256",
                    portableState
                        .portableAuthFingerprint,
                    "ANDROID",
                    currentBinding.installationId,
                    currentBinding.bindingKeyId,
                    currentBinding.fingerprintAlgorithm,
                    currentBinding.publicKeyFingerprint,
                    trustedAt,
                    trustedAt,
                    FinoraBranchDeviceTrustStore
                        .RECORD_SCHEMA_VERSION
                );

        List<
            FinoraBranchDeviceTrustStore.Record
        > next =
            new ArrayList<>(
                existing
            );

        next.add(
            record
        );

        try {
            deviceTrustStore.persist(
                next,
                trustedAt
            );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_DEVICE_TRUST_PERSIST_FAILED,
                "FINORA could not persist the authorized device trust."
            );
        }

        return Result.success(
            STATUS_AUTHORIZED,
            record
        );
    }

    // ========================================================
    // CURRENT PAYLOAD / PRINCIPAL EQUALITY
    // ========================================================

    private static boolean portableStateMatchesPrincipal(
        AuthenticatedPortableState state,
        Principal principal
    ) {

        String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    principal.username
                );

        return (
            nonEmpty(
                state.authStateId
            ) &&
            state.authGeneration ==
                principal.authGeneration &&
            state.userId.equals(
                principal.userId
            ) &&
            state.username.equals(
                principal.username
            ) &&
            state.canonicalUsername.equals(
                canonicalUsername
            ) &&
            state.fullName.equals(
                principal.fullName
            ) &&
            state.role.equals(
                principal.role
            ) &&
            state.ownerId.equals(
                principal.ownerId
            ) &&
            state.businessId.equals(
                principal.businessId
            ) &&
            state.branchId.equals(
                principal.branchId
            ) &&
            state.storageMode.equals(
                principal.storageMode
            ) &&
            contextsEqual(
                principal,
                state.dataContext,
                state.demoId
            )
        );
    }

    // ========================================================
    // EXISTING TRUST MATCH
    // ========================================================

    private static boolean principalMatchesRecord(
        FinoraBranchDeviceTrustStore.Record record,
        Principal principal
    ) {

        String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    principal.username
                );

        return (
            record.userId.equals(
                principal.userId
            ) &&
            record.canonicalUsername.equals(
                canonicalUsername
            ) &&
            record.ownerId.equals(
                principal.ownerId
            ) &&
            record.businessId.equals(
                principal.businessId
            ) &&
            record.branchId.equals(
                principal.branchId
            ) &&
            record.storageMode.equals(
                principal.storageMode
            ) &&
            contextsEqual(
                principal,
                record.dataContext,
                record.demoId
            )
        );
    }

    private static boolean bindingMatchesRecord(
        FinoraBranchDeviceTrustStore.Record record,
        NativeBinding binding
    ) {

        return (
            "ANDROID".equals(
                record.platform
            ) &&
            record.installationId.equals(
                binding.installationId
            ) &&
            record.bindingKeyId.equals(
                binding.bindingKeyId
            ) &&
            record.fingerprintAlgorithm.equals(
                binding.fingerprintAlgorithm
            ) &&
            record.publicKeyFingerprint.equals(
                binding.publicKeyFingerprint
            )
        );
    }

    // ========================================================
    // CONTEXT
    // ========================================================

    private static boolean contextsEqual(
        Principal principal,
        String dataContext,
        String demoId
    ) {

        if (
            dataContext == null ||
            !principal.dataContext.equals(
                dataContext
            )
        ) {
            return false;
        }

        if ("REAL".equals(principal.dataContext)) {
            return (
                principal.demoId == null &&
                demoId == null
            );
        }

        return (
            "DEMO".equals(
                principal.dataContext
            ) &&
            principal.demoId != null &&
            principal.demoId.equals(
                demoId
            )
        );
    }

    // ========================================================
    // VALIDATION
    // ========================================================

    private static void requirePrincipal(
        Principal principal
    ) {

        if (principal == null) {
            throw new IllegalArgumentException(
                "FINORA authenticated principal is required."
            );
        }

        if (principal.authGeneration < 1L) {
            throw new IllegalArgumentException(
                "FINORA principal authGeneration must be positive."
            );
        }

        requireNonEmpty(
            principal.userId,
            "userId"
        );

        requireNonEmpty(
            principal.username,
            "username"
        );

        requireNonEmpty(
            principal.fullName,
            "fullName"
        );

        requireNonEmpty(
            principal.role,
            "role"
        );

        requireNonEmpty(
            principal.ownerId,
            "ownerId"
        );

        requireNonEmpty(
            principal.businessId,
            "businessId"
        );

        requireNonEmpty(
            principal.branchId,
            "branchId"
        );

        if (
            !"LOCAL".equals(
                principal.storageMode
            ) &&
            !"USB".equals(
                principal.storageMode
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA principal storageMode must be LOCAL or USB."
            );
        }

        if (
            !"REAL".equals(
                principal.dataContext
            ) &&
            !"DEMO".equals(
                principal.dataContext
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA principal dataContext must be REAL or DEMO."
            );
        }

        if (
            "REAL".equals(
                principal.dataContext
            )
        ) {
            if (principal.demoId != null) {
                throw new IllegalArgumentException(
                    "FINORA REAL principal must not contain demoId."
                );
            }
        }
        else {
            requireNonEmpty(
                principal.demoId,
                "demoId"
            );
        }
    }

    private static boolean validNativeBinding(
        NativeBinding binding
    ) {

        return (
            nonEmpty(
                binding.installationId
            ) &&
            nonEmpty(
                binding.bindingKeyId
            ) &&
            "SHA-256".equals(
                binding.fingerprintAlgorithm
            ) &&
            binding.publicKeyFingerprint != null &&
            SHA256_HEX
                .matcher(
                    binding.publicKeyFingerprint
                        .toLowerCase(
                            java.util.Locale.ROOT
                        )
                )
                .matches()
        );
    }

    private static boolean nonEmpty(
        String value
    ) {

        return (
            value != null &&
            !value.trim().isEmpty()
        );
    }

    private static void requireNonEmpty(
        String value,
        String field
    ) {

        if (!nonEmpty(value)) {
            throw new IllegalArgumentException(
                "FINORA principal field is invalid: " +
                field
            );
        }
    }
}