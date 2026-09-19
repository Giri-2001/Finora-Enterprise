package com.finora.enterprise.control;

/**
 * Renderer-facing result normalization for Android password-first
 * branch login.
 *
 * This contract carries no Password or Security Code.
 *
 * SECURITY:
 * - SECURITY_CODE_REQUIRED is a challenge, never login success.
 * - Wrong Security Code is normalized to SECURITY_CODE_INVALID.
 * - Authenticated identity is exposed only after TRUSTED,
 *   AUTHORIZED or ALREADY_TRUSTED.
 * - No session token is created here.
 */
public final class FinoraBranchPasswordFirstLoginBridgeContract {

    public static final String SECURITY_CODE_REQUIRED =
        "SECURITY_CODE_REQUIRED";

    public static final String SECURITY_CODE_INVALID =
        "SECURITY_CODE_INVALID";

    public static final String PASSWORD_FIRST_LOGIN_FAILED =
        "PASSWORD_FIRST_LOGIN_FAILED";

    private FinoraBranchPasswordFirstLoginBridgeContract() {
    }

    public static final class Data {

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

        private Data(
            FinoraBranchPasswordFirstLoginAuthority
                .AuthenticatedIdentity source
        ) {

            this.credentialId =
                source.credentialId;

            this.authGeneration =
                source.authGeneration;

            this.userId =
                source.userId;

            this.username =
                source.username;

            this.fullName =
                source.fullName;

            this.role =
                source.role;

            this.ownerId =
                source.ownerId;

            this.businessId =
                source.businessId;

            this.branchId =
                source.branchId;

            this.storageMode =
                source.storageMode;

            this.dataContext =
                source.dataContext;

            this.demoId =
                source.demoId;

            this.authenticatedAt =
                source.authenticatedAt;
        }
    }

    public static final class Response {

        public final boolean success;

        public final String status;

        public final Data data;

        public final String errorCode;
        public final String error;

        private Response(
            boolean success,
            String status,
            Data data,
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

        static Response success(
            String status,
            Data data
        ) {

            return new Response(
                true,
                status,
                data,
                null,
                null
            );
        }

        static Response failure(
            String errorCode,
            String error
        ) {

            return new Response(
                false,
                null,
                null,
                errorCode,
                error
            );
        }
    }

    public static Response fromAuthorityResult(
        FinoraBranchPasswordFirstLoginAuthority.Result result
    ) {

        if (result == null) {
            return Response.failure(
                PASSWORD_FIRST_LOGIN_FAILED,
                "FINORA Password-first login could not be completed."
            );
        }

        if (!result.success) {

            if (
                FinoraBranchDeviceTrustAuthorizationAuthority
                    .ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED
                    .equals(
                        result.errorCode
                    )
            ) {
                return Response.failure(
                    SECURITY_CODE_INVALID,
                    "Invalid Security Code."
                );
            }

            return Response.failure(
                result.errorCode != null
                    ? result.errorCode
                    : PASSWORD_FIRST_LOGIN_FAILED,
                result.error != null
                    ? result.error
                    : "FINORA Password-first login could not be completed."
            );
        }

        if (
            FinoraBranchDeviceTrustAuthority
                .STATUS_SECURITY_CODE_REQUIRED
                .equals(
                    result.status
                )
        ) {
            return Response.failure(
                SECURITY_CODE_REQUIRED,
                "Security Code is required to authorize this device."
            );
        }

        boolean authenticatedStatus =
            FinoraBranchDeviceTrustAuthority
                .STATUS_TRUSTED
                .equals(
                    result.status
                ) ||
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_AUTHORIZED
                .equals(
                    result.status
                ) ||
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_ALREADY_TRUSTED
                .equals(
                    result.status
                );

        if (
            !authenticatedStatus ||
            result.data == null
        ) {
            return Response.failure(
                FinoraBranchPasswordFirstLoginAuthority
                    .ERROR_UNEXPECTED_AUTH_STATE,
                "FINORA Password-first login returned an unexpected state."
            );
        }

        return Response.success(
            result.status,
            new Data(
                result.data
            )
        );
    }
}