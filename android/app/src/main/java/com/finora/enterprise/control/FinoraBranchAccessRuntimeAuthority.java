package com.finora.enterprise.control;

public final class FinoraBranchAccessRuntimeAuthority {
    public static final String ERROR_INVALID_REQUEST = "INVALID_REQUEST";
    public static final String ERROR_CLOCK_AUTHORITY_FAILED = "CLOCK_AUTHORITY_FAILED";
    public static final String ERROR_CONTROL_STORE_FAILED = "CONTROL_STORE_FAILED";

    public interface GrantPort {
        FinoraBranchAccessRuntimeEvaluator.Grant find(
            String userId,
            String ownerId,
            String businessId,
            String branchId
        ) throws Exception;
    }

    public interface ClockPort {
        ClockResult observe();
    }

    public static final class ClockResult {
        public final boolean success;
        public final String observedAt;
        public final String errorCode;
        public final String error;

        private ClockResult(
            boolean success,
            String observedAt,
            String errorCode,
            String error
        ) {
            this.success = success;
            this.observedAt = observedAt;
            this.errorCode = errorCode;
            this.error = error;
        }

        public static ClockResult success(String observedAt) {
            return new ClockResult(true, observedAt, null, null);
        }

        public static ClockResult failure(String errorCode, String error) {
            return new ClockResult(false, null, errorCode, error);
        }
    }

    public static final class Decision {
        public final boolean allowed;
        public final String state;
        public final String reason;
        public final String observedAt;
        public final FinoraBranchAccessRuntimeEvaluator.Grant grant;

        private Decision(
            FinoraBranchAccessRuntimeEvaluator.Decision source,
            String observedAt
        ) {
            this.allowed = source.allowed;
            this.state = source.state;
            this.reason = source.reason;
            this.observedAt = observedAt;
            this.grant = source.grant;
        }
    }

    public static final class Result {
        public final boolean success;
        public final Decision data;
        public final String errorCode;
        public final String clockErrorCode;
        public final String error;

        private Result(
            boolean success,
            Decision data,
            String errorCode,
            String clockErrorCode,
            String error
        ) {
            this.success = success;
            this.data = data;
            this.errorCode = errorCode;
            this.clockErrorCode = clockErrorCode;
            this.error = error;
        }

        public static Result success(Decision data) {
            return new Result(true, data, null, null, null);
        }

        public static Result failure(
            String errorCode,
            String clockErrorCode,
            String error
        ) {
            return new Result(false, null, errorCode, clockErrorCode, error);
        }
    }

    private final GrantPort grantPort;
    private final ClockPort clockPort;

    public FinoraBranchAccessRuntimeAuthority(
        GrantPort grantPort,
        ClockPort clockPort
    ) {
        if (grantPort == null || clockPort == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Access authority dependencies are required."
            );
        }

        this.grantPort = grantPort;
        this.clockPort = clockPort;
    }

    public Result evaluate(
        String userId,
        String ownerId,
        String businessId,
        String branchId
    ) {
        if (
            !text(userId) ||
            !text(ownerId) ||
            !text(businessId) ||
            !text(branchId)
        ) {
            return Result.failure(
                ERROR_INVALID_REQUEST,
                null,
                "User ID, Owner ID, Business ID and Branch ID are required."
            );
        }

        final FinoraBranchAccessRuntimeEvaluator.Grant grant;

        try {
            grant = grantPort.find(userId, ownerId, businessId, branchId);
        } catch (Exception error) {
            return Result.failure(
                ERROR_CONTROL_STORE_FAILED,
                null,
                message(
                    error,
                    "Unable to read authoritative FINORA Branch Access state."
                )
            );
        }

        final ClockResult clockResult;

        try {
            clockResult = clockPort.observe();
        } catch (Exception error) {
            return Result.failure(
                ERROR_CLOCK_AUTHORITY_FAILED,
                null,
                message(
                    error,
                    "Unable to observe authoritative FINORA runtime clock."
                )
            );
        }

        if (clockResult == null || !clockResult.success) {
            return Result.failure(
                ERROR_CLOCK_AUTHORITY_FAILED,
                clockResult == null ? null : clockResult.errorCode,
                clockResult == null
                    ? "FINORA authoritative runtime clock returned no result."
                    : valueOrDefault(
                        clockResult.error,
                        "Unable to observe authoritative FINORA runtime clock."
                    )
            );
        }

        FinoraBranchAccessRuntimeEvaluator.Decision decision =
            FinoraBranchAccessRuntimeEvaluator.evaluate(
                grant,
                clockResult.observedAt
            );

        return Result.success(
            new Decision(decision, clockResult.observedAt)
        );
    }

    private static boolean text(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String message(Exception error, String fallback) {
        return error != null && text(error.getMessage())
            ? error.getMessage()
            : fallback;
    }

    private static String valueOrDefault(String value, String fallback) {
        return text(value) ? value : fallback;
    }
}
