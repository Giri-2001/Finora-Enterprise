package com.finora.enterprise.control;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT CLOCK HIGH-WATER AUTHORITY

   MODULE  : Control
   LAYER   : Native Recipient Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve authoritative Android installation identity
   - Serialize recipient clock observations in one process
   - Capture production wall clock only inside this authority
   - Initialize installation-local clock high-water state
   - Reject backward wall-clock movement
   - Preserve equality without unnecessary mutation
   - Advance persisted high-water only when time moves forward
   - Reject persisted installation identity mismatch

   PRODUCTION CLOCK CONTRACT:

   1. Acquire process-local authority lock
   2. Resolve existing native installation binding
   3. Capture Instant.now()
   4. Normalize to millisecond precision
   5. Load encrypted high-water state
   6. Initialize / reject rollback / preserve equality / advance

   SECURITY:

   - Public API accepts no caller-supplied timestamp.
   - No renderer / Capacitor API.
   - No environment-variable clock input.
   - No issuer or signing-key authority.
   - No private signing material.
   - No filesystem path input.

   LIMIT:

   - Serialization is same-process only.
   - No cross-process compare-and-swap guarantee is claimed.
============================================================ */

public final class FinoraClockHighWaterAuthorityService {

    // ========================================================
    // ERROR CODES
    // ========================================================

    public static final String
        ERROR_INSTALLATION_BINDING_UNAVAILABLE =
            "INSTALLATION_BINDING_UNAVAILABLE";

    public static final String
        ERROR_INVALID_OBSERVED_TIME =
            "INVALID_OBSERVED_TIME";

    public static final String
        ERROR_STORAGE_FAILED =
            "CLOCK_HIGH_WATER_STORAGE_FAILED";

    public static final String
        ERROR_INSTALLATION_ID_MISMATCH =
            "INSTALLATION_ID_MISMATCH";

    public static final String
        ERROR_CLOCK_ROLLBACK_DETECTED =
            "CLOCK_ROLLBACK_DETECTED";

    // ========================================================
    // FORMAT
    // ========================================================

    private static final DateTimeFormatter ISO_MILLIS_FORMATTER =
        DateTimeFormatter
            .ofPattern(
                "uuuu-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.ROOT
            )
            .withZone(
                ZoneOffset.UTC
            );

    // ========================================================
    // AUTHORITY LOCK
    // ========================================================

    private static final Object AUTHORITY_LOCK =
        new Object();

    // ========================================================
    // RESULT DATA
    // ========================================================

    public static final class AcceptedObservation {

        public final String installationId;

        public final String observedAt;

        public final String highWaterAt;

        public final boolean initialized;

        public final boolean advanced;

        private AcceptedObservation(
            String installationId,
            String observedAt,
            String highWaterAt,
            boolean initialized,
            boolean advanced
        ) {
            this.installationId =
                installationId;

            this.observedAt =
                observedAt;

            this.highWaterAt =
                highWaterAt;

            this.initialized =
                initialized;

            this.advanced =
                advanced;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final AcceptedObservation data;

        public final String errorCode;

        public final String error;

        private Result(
            boolean success,
            AcceptedObservation data,
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

        public static Result success(
            AcceptedObservation data
        ) {
            return new Result(
                true,
                data,
                null,
                null
            );
        }

        public static Result failure(
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

    // ========================================================
    // DEPENDENCIES
    // ========================================================

    private final FinoraClockHighWaterStore highWaterStore;

    private final FinoraInstallationBindingService
        bindingService;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraClockHighWaterAuthorityService(
        FinoraClockHighWaterStore highWaterStore,
        FinoraInstallationBindingService bindingService
    ) {
        if (highWaterStore == null) {
            throw new IllegalArgumentException(
                "FINORA clock high-water authority requires a high-water store."
            );
        }

        if (bindingService == null) {
            throw new IllegalArgumentException(
                "FINORA clock high-water authority requires installation binding service."
            );
        }

        this.highWaterStore =
            highWaterStore;

        this.bindingService =
            bindingService;
    }

    // ========================================================
    // PUBLIC AUTHORITY
    // ========================================================

    public Result observe() {

        synchronized (
            AUTHORITY_LOCK
        ) {
            return observeInternal();
        }
    }

    // ========================================================
    // INTERNAL OBSERVATION
    // ========================================================

    private Result observeInternal() {

        FinoraInstallationBindingCrypto.PublicBinding
            authoritativeBinding;

        try {
            authoritativeBinding =
                bindingService.get();
        } catch (
            Exception error
        ) {
            return Result.failure(
                ERROR_INSTALLATION_BINDING_UNAVAILABLE,
                messageOrDefault(
                    error,
                    "FINORA native installation binding could not be resolved."
                )
            );
        }

        if (
            authoritativeBinding == null ||
            authoritativeBinding.installationId == null ||
            authoritativeBinding.installationId
                .trim()
                .isEmpty()
        ) {
            return Result.failure(
                ERROR_INSTALLATION_BINDING_UNAVAILABLE,
                "FINORA native installation binding is required before observing recipient clock high-water."
            );
        }

        /*
         * Production wall clock is intentionally captured only
         * after authoritative installation identity is resolved
         * and while this operation owns AUTHORITY_LOCK.
         */
        Instant observedInstant;

        try {
            observedInstant =
                Instant.ofEpochMilli(
                    Instant
                        .now()
                        .toEpochMilli()
                );
        } catch (
            Exception error
        ) {
            return Result.failure(
                ERROR_INVALID_OBSERVED_TIME,
                "FINORA clock high-water observation time is invalid."
            );
        }

        String observedAt =
            ISO_MILLIS_FORMATTER.format(
                observedInstant
            );

        FinoraClockHighWaterStore.State persisted;

        try {
            persisted =
                highWaterStore.read();
        } catch (
            Exception error
        ) {
            return Result.failure(
                ERROR_STORAGE_FAILED,
                messageOrDefault(
                    error,
                    "FINORA clock high-water state could not be loaded."
                )
            );
        }

        // ----------------------------------------------------
        // GENESIS
        // ----------------------------------------------------

        if (persisted == null) {
            FinoraClockHighWaterStore.State initialState =
                new FinoraClockHighWaterStore.State(
                    FinoraClockHighWaterStore.SCHEMA_VERSION,
                    authoritativeBinding.installationId,
                    observedAt
                );

            try {
                highWaterStore.write(
                    initialState
                );
            } catch (
                Exception error
            ) {
                return Result.failure(
                    ERROR_STORAGE_FAILED,
                    messageOrDefault(
                        error,
                        "FINORA clock high-water initial state could not be persisted."
                    )
                );
            }

            return Result.success(
                new AcceptedObservation(
                    authoritativeBinding.installationId,
                    observedAt,
                    observedAt,
                    true,
                    true
                )
            );
        }

        // ----------------------------------------------------
        // EXACT INSTALLATION BINDING
        // ----------------------------------------------------

        if (
            !authoritativeBinding.installationId.equals(
                persisted.installationId
            )
        ) {
            return Result.failure(
                ERROR_INSTALLATION_ID_MISMATCH,
                "FINORA clock high-water state does not belong to the authoritative native installation."
            );
        }

        // ----------------------------------------------------
        // EXISTING HIGH-WATER
        // ----------------------------------------------------

        Instant highWaterInstant;

        try {
            highWaterInstant =
                Instant.parse(
                    persisted.highWaterAt
                );
        } catch (
            Exception error
        ) {
            return Result.failure(
                ERROR_STORAGE_FAILED,
                "FINORA persisted clock high-water timestamp is invalid."
            );
        }

        int comparison =
            observedInstant.compareTo(
                highWaterInstant
            );

        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

        if (comparison < 0) {
            return Result.failure(
                ERROR_CLOCK_ROLLBACK_DETECTED,
                "FINORA detected system clock rollback below the persisted high-water timestamp."
            );
        }

        // ----------------------------------------------------
        // EQUALITY
        // ----------------------------------------------------

        if (comparison == 0) {
            return Result.success(
                new AcceptedObservation(
                    authoritativeBinding.installationId,
                    observedAt,
                    persisted.highWaterAt,
                    false,
                    false
                )
            );
        }

        // ----------------------------------------------------
        // ADVANCE
        // ----------------------------------------------------

        FinoraClockHighWaterStore.State advancedState =
            new FinoraClockHighWaterStore.State(
                FinoraClockHighWaterStore.SCHEMA_VERSION,
                authoritativeBinding.installationId,
                observedAt
            );

        try {
            highWaterStore.write(
                advancedState
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                ERROR_STORAGE_FAILED,
                messageOrDefault(
                    error,
                    "FINORA clock high-water state could not be advanced."
                )
            );
        }

        return Result.success(
            new AcceptedObservation(
                authoritativeBinding.installationId,
                observedAt,
                observedAt,
                false,
                true
            )
        );
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