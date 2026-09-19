package com.finora.enterprise.control;

/**
 * Native Android password-first login orchestration core.
 *
 * Decision order:
 *
 * 1. Username + Password authentication.
 * 2. Password failure returns immediately.
 * 3. Only after Password success, check current Device Trust.
 * 4. Trusted device completes the native trust gate without
 *    requesting Security Code.
 * 5. Unknown device without Security Code returns
 *    SECURITY_CODE_REQUIRED.
 * 6. Only an already Password-authenticated unknown-device
 *    request may invoke fresh-device authorization.
 *
 * Explicitly excluded:
 * - Capacitor / renderer IPC;
 * - login-session persistence or creation;
 * - UI state;
 * - direct Portable Auth decrypt;
 * - direct Device Trust persistence.
 */
public final class FinoraBranchPasswordFirstLoginAuthority {

    public static final String
        ERROR_PASSWORD_AUTHENTICATION_FAILED =
            "PASSWORD_AUTHENTICATION_FAILED";

    public static final String
        ERROR_DEVICE_TRUST_CHECK_FAILED =
            "DEVICE_TRUST_CHECK_FAILED";

    public static final String
        ERROR_DEVICE_AUTHORIZATION_FAILED =
            "DEVICE_AUTHORIZATION_FAILED";

    public static final String
        ERROR_UNEXPECTED_AUTH_STATE =
            "UNEXPECTED_AUTH_STATE";

    interface PasswordAuthenticationPort {

        PasswordAuthenticationResult authenticate(
            String username,
            String password
        ) throws Exception;
    }

    interface DeviceTrustCheckPort {

        FinoraBranchDeviceTrustAuthority.Result check(
            FinoraBranchDeviceTrustAuthority.Principal principal
        ) throws Exception;
    }

    interface DeviceTrustAuthorizationPort {

        FinoraBranchDeviceTrustAuthorizationAuthority.Result
            authorize(
                FinoraBranchDeviceTrustAuthorizationAuthority
                    .Principal principal,
                String password,
                String securityCode
            ) throws Exception;
    }

    public static final class Request {

        public final String username;
        public final String password;
        public final String securityCode;

        public Request(
            String username,
            String password,
            String securityCode
        ) {

            this.username =
                username;

            this.password =
                password;

            this.securityCode =
                securityCode;
        }
    }

    public static final class AuthenticatedIdentity {

        public final String credentialId;
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

        public final String authenticatedAt;

        public AuthenticatedIdentity(
            String credentialId,
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
            String demoId,
            String authenticatedAt
        ) {

            this.credentialId =
                credentialId;

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

            this.authenticatedAt =
                authenticatedAt;
        }
    }

    static final class PasswordAuthenticationResult {

        final boolean success;

        final AuthenticatedIdentity data;

        final String errorCode;
        final String error;

        private PasswordAuthenticationResult(
            boolean success,
            AuthenticatedIdentity data,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.data =
                data;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static PasswordAuthenticationResult success(
            AuthenticatedIdentity data
        ) {

            return new PasswordAuthenticationResult(
                true,
                data,
                null,
                null
            );
        }

        static PasswordAuthenticationResult failure(
            String errorCode,
            String error
        ) {

            return new PasswordAuthenticationResult(
                false,
                null,
                errorCode,
                error
            );
        }
    }

    public static final class Result {

        public final boolean success;

        public final String status;

        public final AuthenticatedIdentity data;

        public final String errorCode;
        public final String error;

        private Result(
            boolean success,
            String status,
            AuthenticatedIdentity data,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.status =
                status;

            this.data =
                data;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result success(
            String status,
            AuthenticatedIdentity data
        ) {

            return new Result(
                true,
                status,
                data,
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

    private final PasswordAuthenticationPort
        passwordAuthentication;

    private final DeviceTrustCheckPort
        deviceTrustCheck;

    private final DeviceTrustAuthorizationPort
        deviceTrustAuthorization;

    FinoraBranchPasswordFirstLoginAuthority(
        PasswordAuthenticationPort passwordAuthentication,
        DeviceTrustCheckPort deviceTrustCheck,
        DeviceTrustAuthorizationPort deviceTrustAuthorization
    ) {

        if (
            passwordAuthentication == null ||
            deviceTrustCheck == null ||
            deviceTrustAuthorization == null
        ) {
            throw new IllegalArgumentException(
                "FINORA password-first login dependencies are required."
            );
        }

        this.passwordAuthentication =
            passwordAuthentication;

        this.deviceTrustCheck =
            deviceTrustCheck;

        this.deviceTrustAuthorization =
            deviceTrustAuthorization;
    }

    public Result login(
        Request request
    ) {

        String username =
            request == null
                ? null
                : request.username;

        String password =
            request == null
                ? null
                : request.password;

        String securityCode =
            request == null
                ? null
                : request.securityCode;

        final PasswordAuthenticationResult
            passwordResult;

        try {
            passwordResult =
                passwordAuthentication.authenticate(
                    username,
                    password
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_PASSWORD_AUTHENTICATION_FAILED,
                "FINORA Password authentication could not be completed."
            );
        }

        if (passwordResult == null) {
            return Result.failure(
                ERROR_PASSWORD_AUTHENTICATION_FAILED,
                "FINORA Password authentication could not be completed."
            );
        }

        if (!passwordResult.success) {
            return Result.failure(
                passwordResult.errorCode,
                passwordResult.error
            );
        }

        AuthenticatedIdentity identity =
            passwordResult.data;

        if (identity == null) {
            return Result.failure(
                ERROR_PASSWORD_AUTHENTICATION_FAILED,
                "FINORA Password authentication returned invalid state."
            );
        }

        FinoraBranchDeviceTrustAuthority.Principal
            checkPrincipal =
                new FinoraBranchDeviceTrustAuthority
                    .Principal(
                        identity.authGeneration,
                        identity.userId,
                        identity.username,
                        identity.ownerId,
                        identity.businessId,
                        identity.branchId,
                        identity.storageMode,
                        identity.dataContext,
                        identity.demoId
                    );

        final FinoraBranchDeviceTrustAuthority.Result
            trustResult;

        try {
            trustResult =
                deviceTrustCheck.check(
                    checkPrincipal
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_DEVICE_TRUST_CHECK_FAILED,
                "FINORA Device Trust check could not be completed."
            );
        }

        if (trustResult == null) {
            return Result.failure(
                ERROR_DEVICE_TRUST_CHECK_FAILED,
                "FINORA Device Trust check could not be completed."
            );
        }

        if (!trustResult.success) {
            return Result.failure(
                trustResult.errorCode,
                trustResult.error
            );
        }

        if (
            FinoraBranchDeviceTrustAuthority
                .STATUS_TRUSTED
                .equals(
                    trustResult.status
                )
        ) {
            return Result.success(
                FinoraBranchDeviceTrustAuthority
                    .STATUS_TRUSTED,
                identity
            );
        }

        if (
            !FinoraBranchDeviceTrustAuthority
                .STATUS_SECURITY_CODE_REQUIRED
                .equals(
                    trustResult.status
                )
        ) {
            return Result.failure(
                ERROR_UNEXPECTED_AUTH_STATE,
                "FINORA Device Trust returned an unexpected state."
            );
        }

        /*
         * CRITICAL PASSWORD-FIRST CHALLENGE BOUNDARY.
         *
         * Reaching here proves:
         * - Username + Password authentication succeeded;
         * - current Device Trust check succeeded;
         * - current device is not yet trusted.
         *
         * Security Code is never requested/consumed before this.
         */
        if (securityCode == null) {
            return Result.success(
                FinoraBranchDeviceTrustAuthority
                    .STATUS_SECURITY_CODE_REQUIRED,
                identity
            );
        }

        FinoraBranchDeviceTrustAuthorizationAuthority.Principal
            authorizationPrincipal =
                new FinoraBranchDeviceTrustAuthorizationAuthority
                    .Principal(
                        identity.authGeneration,
                        identity.userId,
                        identity.username,
                        identity.fullName,
                        identity.role,
                        identity.ownerId,
                        identity.businessId,
                        identity.branchId,
                        identity.storageMode,
                        identity.dataContext,
                        identity.demoId
                    );

        final FinoraBranchDeviceTrustAuthorizationAuthority.Result
            authorizationResult;

        try {
            authorizationResult =
                deviceTrustAuthorization.authorize(
                    authorizationPrincipal,
                    password,
                    securityCode
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_DEVICE_AUTHORIZATION_FAILED,
                "FINORA Device Trust authorization could not be completed."
            );
        }

        if (authorizationResult == null) {
            return Result.failure(
                ERROR_DEVICE_AUTHORIZATION_FAILED,
                "FINORA Device Trust authorization could not be completed."
            );
        }

        if (!authorizationResult.success) {
            return Result.failure(
                authorizationResult.errorCode,
                authorizationResult.error
            );
        }

        if (
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_AUTHORIZED
                .equals(
                    authorizationResult.status
                ) ||
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_ALREADY_TRUSTED
                .equals(
                    authorizationResult.status
                )
        ) {
            return Result.success(
                authorizationResult.status,
                identity
            );
        }

        return Result.failure(
            ERROR_UNEXPECTED_AUTH_STATE,
            "FINORA Device Trust authorization returned an unexpected state."
        );
    }
}