package com.finora.enterprise.control;

/**
 * Fresh-device login recovery orchestration boundary.
 *
 * This coordinator deliberately stays outside the normal local
 * Branch Credential Password-first authority.
 *
 * Ordering:
 *
 * 1. If a local ACTIVE Branch Credential exists, recovery is
 *    NOT_APPLICABLE and the caller must use normal local login.
 * 2. If no local credential exists, verify Username + Password
 *    against Portable Branch Auth using only the explicitly
 *    selected storage mode.
 * 3. Wrong Username/Password fail before Security Code.
 * 4. Correct Password without Security Code returns only
 *    SECURITY_CODE_REQUIRED.
 * 5. Only after Password proof and Security Code presence may the
 *    completion port decrypt/verify/hydrate native control state.
 * 6. After RECOVERED, the caller must re-run normal local login.
 *
 * This class does not fabricate an AuthenticatedIdentity and does
 * not itself create a login session.
 */
public final class
    FinoraPortableFreshDeviceLoginRecoveryCoordinator {

    public static final String
        STATUS_NOT_APPLICABLE =
            "NOT_APPLICABLE";

    public static final String
        STATUS_SECURITY_CODE_REQUIRED =
            "SECURITY_CODE_REQUIRED";

    public static final String
        STATUS_RECOVERED =
            "RECOVERED";

    public static final String
        ERROR_LOCAL_CREDENTIAL_CHECK_FAILED =
            "LOCAL_CREDENTIAL_CHECK_FAILED";

    public static final String
        ERROR_PASSWORD_PREAUTH_FAILED =
            "PASSWORD_PREAUTH_FAILED";

    public static final String
        ERROR_RECOVERY_COMPLETION_FAILED =
            "RECOVERY_COMPLETION_FAILED";

    interface LocalCredentialPresencePort {

        boolean exists(
            String username
        ) throws Exception;
    }

    interface PasswordPreAuthPort {

        FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            authenticate(
                String username,
                String password,
                String storageMode
            ) throws Exception;
    }

    interface RecoveryCompletionPort {

        CompletionResult complete(
            Request request
        ) throws Exception;
    }

    public static final class Request {

        public final String username;
        public final String password;
        public final String storageMode;
        public final String securityCode;

        public Request(
            String username,
            String password,
            String storageMode,
            String securityCode
        ) {
            this.username =
                username;

            this.password =
                password;

            this.storageMode =
                storageMode;

            this.securityCode =
                securityCode;
        }
    }

    public static final class CompletionResult {

        public final boolean success;
        public final String errorCode;
        public final String error;

        private CompletionResult(
            boolean success,
            String errorCode,
            String error
        ) {
            this.success =
                success;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        public static CompletionResult success() {
            return new CompletionResult(
                true,
                null,
                null
            );
        }

        public static CompletionResult failure(
            String errorCode,
            String error
        ) {
            return new CompletionResult(
                false,
                errorCode,
                error
            );
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

        static Result notApplicable() {
            return new Result(
                true,
                STATUS_NOT_APPLICABLE,
                null,
                null
            );
        }

        static Result securityCodeRequired() {
            return new Result(
                true,
                STATUS_SECURITY_CODE_REQUIRED,
                null,
                null
            );
        }

        static Result recovered() {
            return new Result(
                true,
                STATUS_RECOVERED,
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

    private final LocalCredentialPresencePort
        localCredentialPresence;

    private final PasswordPreAuthPort
        passwordPreAuth;

    private final RecoveryCompletionPort
        recoveryCompletion;

    FinoraPortableFreshDeviceLoginRecoveryCoordinator(
        LocalCredentialPresencePort localCredentialPresence,
        PasswordPreAuthPort passwordPreAuth,
        RecoveryCompletionPort recoveryCompletion
    ) {
        if (
            localCredentialPresence == null ||
            passwordPreAuth == null ||
            recoveryCompletion == null
        ) {
            throw new IllegalArgumentException(
                "FINORA fresh-device login recovery dependencies are required."
            );
        }

        this.localCredentialPresence =
            localCredentialPresence;

        this.passwordPreAuth =
            passwordPreAuth;

        this.recoveryCompletion =
            recoveryCompletion;
    }

    public Result recover(
        Request request
    ) {
        String username =
            request == null
                ? null
                : request.username;

        boolean hasLocalCredential;

        try {
            hasLocalCredential =
                localCredentialPresence.exists(
                    username
                );
        }
        catch (IllegalArgumentException error) {
            /*
             * Invalid Username shape must remain indistinguishable
             * from invalid credentials once the fresh path is used.
             */
            hasLocalCredential =
                false;
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_LOCAL_CREDENTIAL_CHECK_FAILED,
                "FINORA local Branch Credential state could not be inspected."
            );
        }

        if (hasLocalCredential) {
            return Result.notApplicable();
        }

        final FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            passwordResult;

        try {
            passwordResult =
                passwordPreAuth.authenticate(
                    username,
                    request == null
                        ? null
                        : request.password,
                    request == null
                        ? null
                        : request.storageMode
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_PASSWORD_PREAUTH_FAILED,
                "FINORA fresh-device Password authentication could not be completed."
            );
        }

        if (passwordResult == null) {
            return Result.failure(
                ERROR_PASSWORD_PREAUTH_FAILED,
                "FINORA fresh-device Password authentication could not be completed."
            );
        }

        if (!passwordResult.success) {
            return Result.failure(
                passwordResult.errorCode,
                passwordResult.error
            );
        }

        if (
            !FinoraPortableFreshDevicePasswordPreAuthAuthority
                .STATUS_SECURITY_CODE_REQUIRED
                .equals(
                    passwordResult.status
                )
        ) {
            return Result.failure(
                ERROR_PASSWORD_PREAUTH_FAILED,
                "FINORA fresh-device Password authentication returned an unexpected state."
            );
        }

        String securityCode =
            request == null
                ? null
                : request.securityCode;

        if (securityCode == null) {
            return Result.securityCodeRequired();
        }

        final CompletionResult completionResult;

        try {
            completionResult =
                recoveryCompletion.complete(
                    request
                );
        }
        catch (Exception error) {
            return Result.failure(
                ERROR_RECOVERY_COMPLETION_FAILED,
                "FINORA fresh-device recovery could not be completed."
            );
        }

        if (completionResult == null) {
            return Result.failure(
                ERROR_RECOVERY_COMPLETION_FAILED,
                "FINORA fresh-device recovery could not be completed."
            );
        }

        if (!completionResult.success) {
            return Result.failure(
                completionResult.errorCode,
                completionResult.error
            );
        }

        return Result.recovered();
    }
}