package com.finora.enterprise.control;

import java.util.List;
import java.util.regex.Pattern;

// ============================================================
// FINORA ENTERPRISE OS
//
// ANDROID CONTROL
// BRANCH DEVICE TRUST CHECK AUTHORITY
//
// RESPONSIBILITY:
//
// - Execute only after successful Branch Credential Password auth.
// - Validate current Portable Auth outer branch identity.
// - Require the current Android native public device binding.
// - Evaluate existing Device Trust records.
// - Return TRUSTED or SECURITY_CODE_REQUIRED.
// - Fail closed on unavailable / ambiguous authority state.
//
// EXPLICITLY EXCLUDED:
//
// - Password authentication.
// - Security Code verification.
// - Portable Auth decryption.
// - Device Trust mutation.
// - Session creation.
// - Renderer / WebView access.
//
// TRUSTED DEVICE CONTINUITY:
//
// Historical authGeneration and portableAuthFingerprint on an
// existing Device Trust record are authorization evidence.
// They are not compared on the Password-only trusted-device
// continuity path.
//
// Current continuity requires:
// - exact authenticated principal identity/scope/storage/context;
// - exact current Android native public binding;
// - exactly one matching Device Trust record.
//
// VERSION : 1.0
// ============================================================

public final class FinoraBranchDeviceTrustAuthority {

    public static final String STATUS_TRUSTED =
        "TRUSTED";

    public static final String STATUS_SECURITY_CODE_REQUIRED =
        "SECURITY_CODE_REQUIRED";

    public static final String ERROR_PORTABLE_AUTH_UNAVAILABLE =
        "PORTABLE_AUTH_UNAVAILABLE";

    public static final String ERROR_PORTABLE_AUTH_MISMATCH =
        "PORTABLE_AUTH_MISMATCH";

    public static final String ERROR_NATIVE_BINDING_UNAVAILABLE =
        "NATIVE_BINDING_UNAVAILABLE";

    public static final String ERROR_DEVICE_TRUST_STORE_FAILED =
        "DEVICE_TRUST_STORE_FAILED";

    public static final String ERROR_DEVICE_REVOKED =
        "DEVICE_REVOKED";

    private static final Pattern SHA256_HEX =
        Pattern.compile(
            "^[a-f0-9]{64}$"
        );

    // ========================================================
    // AUTHENTICATED PRINCIPAL
    // ========================================================

    public static final class Principal {

        public final long authGeneration;

        public final String userId;
        public final String username;

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
    // PORTABLE AUTH OUTER IDENTITY
    // ========================================================

    public static final class PortableAuthIdentity {

        public final String canonicalUsername;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String portableAuthFingerprint;

        public PortableAuthIdentity(
            String canonicalUsername,
            String ownerId,
            String businessId,
            String branchId,
            String portableAuthFingerprint
        ) {

            this.canonicalUsername =
                canonicalUsername;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.portableAuthFingerprint =
                portableAuthFingerprint;
        }
    }

    // ========================================================
    // CURRENT NATIVE PUBLIC BINDING
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
    // DEPENDENCY PORTS
    // ========================================================

    interface PortableAuthPort {

        PortableAuthIdentity read(
            String storageMode
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
    }

    private final PortableAuthPort
        portableAuth;

    private final NativeBindingPort
        nativeBinding;

    private final DeviceTrustStorePort
        deviceTrustStore;

    FinoraBranchDeviceTrustAuthority(
        PortableAuthPort portableAuth,
        NativeBindingPort nativeBinding,
        DeviceTrustStorePort deviceTrustStore
    ) {

        if (
            portableAuth == null ||
            nativeBinding == null ||
            deviceTrustStore == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Device Trust authority dependencies are required."
            );
        }

        this.portableAuth =
            portableAuth;

        this.nativeBinding =
            nativeBinding;

        this.deviceTrustStore =
            deviceTrustStore;
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final String status;

        public final String portableAuthFingerprint;

        public final String errorCode;
        public final String error;

        private Result(
            boolean success,
            String status,
            String portableAuthFingerprint,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.status =
                status;

            this.portableAuthFingerprint =
                portableAuthFingerprint;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result success(
            String status,
            String portableAuthFingerprint
        ) {

            return new Result(
                true,
                status,
                portableAuthFingerprint,
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
    // CHECK CURRENT DEVICE
    // ========================================================

    public Result check(
        Principal principal
    ) {

        requirePrincipal(
            principal
        );

        final PortableAuthIdentity
            portableIdentity;

        try {
            portableIdentity =
                portableAuth.read(
                    principal.storageMode
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_UNAVAILABLE,
                "FINORA Portable Branch Auth state is unavailable."
            );
        }

        if (portableIdentity == null) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_UNAVAILABLE,
                "FINORA Portable Branch Auth state is unavailable."
            );
        }

        if (
            !portableIdentityMatchesPrincipal(
                portableIdentity,
                principal
            )
        ) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_MISMATCH,
                "FINORA Portable Branch Auth does not match the authenticated branch identity."
            );
        }

        if (
            portableIdentity.portableAuthFingerprint == null ||
            !SHA256_HEX
                .matcher(
                    portableIdentity
                        .portableAuthFingerprint
                )
                .matches()
        ) {
            return Result.failure(
                ERROR_PORTABLE_AUTH_MISMATCH,
                "FINORA Portable Branch Auth fingerprint is invalid."
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

        if (currentBinding == null) {
            return Result.failure(
                ERROR_NATIVE_BINDING_UNAVAILABLE,
                "FINORA native installation binding is unavailable."
            );
        }

        if (!validNativeBinding(currentBinding)) {
            return Result.failure(
                ERROR_NATIVE_BINDING_UNAVAILABLE,
                "FINORA native installation binding is unavailable."
            );
        }

        final List<
            FinoraBranchDeviceTrustStore.Record
        > records;

        try {
            records =
                deviceTrustStore.readAll();
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_DEVICE_TRUST_STORE_FAILED,
                "FINORA Device Trust state could not be validated."
            );
        }

        if (records == null) {
            return Result.failure(
                ERROR_DEVICE_TRUST_STORE_FAILED,
                "FINORA Device Trust state could not be validated."
            );
        }

        int matchingRecords =
            0;

        int revokedMatchingRecords =
            0;

        for (
            FinoraBranchDeviceTrustStore.Record record :
            records
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
                if (
                    FinoraBranchDeviceTrustLifecycle.isRevoked(
                        record.status
                    )
                ) {
                    revokedMatchingRecords++;
                }
                else {
                    matchingRecords++;
                }
            }
        }

        if (revokedMatchingRecords > 0) {
            return Result.failure(
                ERROR_DEVICE_REVOKED,
                "FINORA current device has been revoked."
            );
        }

        if (matchingRecords == 0) {
            return Result.success(
                STATUS_SECURITY_CODE_REQUIRED,
                portableIdentity
                    .portableAuthFingerprint
            );
        }

        if (matchingRecords != 1) {
            return Result.failure(
                ERROR_DEVICE_TRUST_STORE_FAILED,
                "FINORA Device Trust state contains ambiguous current-device authority."
            );
        }

        return Result.success(
            STATUS_TRUSTED,
            portableIdentity
                .portableAuthFingerprint
        );
    }

    // ========================================================
    // OUTER ENVELOPE IDENTITY
    // ========================================================

    private static boolean
        portableIdentityMatchesPrincipal(
            PortableAuthIdentity portableIdentity,
            Principal principal
        ) {

        String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    principal.username
                );

        return (
            canonicalUsername != null &&
            canonicalUsername.equals(
                portableIdentity.canonicalUsername
            ) &&
            principal.ownerId.equals(
                portableIdentity.ownerId
            ) &&
            principal.businessId.equals(
                portableIdentity.businessId
            ) &&
            principal.branchId.equals(
                portableIdentity.branchId
            )
        );
    }

    // ========================================================
    // PRINCIPAL MATCH
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

    // ========================================================
    // NATIVE BINDING MATCH
    // ========================================================

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

        requireNonEmpty(
            principal.userId,
            "userId"
        );

        requireNonEmpty(
            principal.username,
            "username"
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
            ) &&
            principal.demoId != null
        ) {
            throw new IllegalArgumentException(
                "FINORA REAL principal must not contain demoId."
            );
        }

        if (
            "DEMO".equals(
                principal.dataContext
            )
        ) {
            requireNonEmpty(
                principal.demoId,
                "demoId"
            );
        }

        if (principal.authGeneration < 1L) {
            throw new IllegalArgumentException(
                "FINORA principal authGeneration must be positive."
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