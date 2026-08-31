// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION DELIVERY RUNTIME POLICY
//
// RESPONSIBILITY:
//
// - Define production Notification delivery retry timing.
// - Define delivery lifecycle recovery/discovery timing.
// - Keep timing policy outside Delivery Service and Lifecycle
//   implementation classes.
//
// IMPORTANT:
//
// - These are product/runtime policy values.
// - They are NOT 09:00 / 20:00 reminder scheduler rules.
// - Offline checks do not increment provider attemptCount.
// - Provider retry delays apply after actual provider attempts.
// - Provider exceptions currently reuse the provider-failure
//   retry schedule.
// - No React.
// - No storage access.
// - No provider calls.
//
// VERSION : 1.0
// STATUS  : Production Policy
// ============================================================

/* ============================================================
   TIME UNITS
============================================================ */

const MINUTE_MS =
  60 * 1000;

/* ============================================================
   OFFLINE RETRY
============================================================ */

/*
 * Offline is not a provider attempt.
 *
 * Re-check connectivity after five minutes while preserving
 * attemptCount.
 */

export const NOTIFICATION_OFFLINE_RETRY_DELAY_MS =
  5 * MINUTE_MS;

/* ============================================================
   PROVIDER FAILURE RETRIES
============================================================ */

/*
 * Each entry is the retry delay after the corresponding actual
 * provider attempt.
 *
 * attemptCount = 1 -> retry after 1 minute
 * attemptCount = 2 -> retry after 5 minutes
 * attemptCount = 3 -> retry after 15 minutes
 *
 * After the next provider attempt there is no further automatic
 * retry because the configured delay array is exhausted.
 */

export const NOTIFICATION_PROVIDER_FAILURE_RETRY_DELAYS_MS =
  [
    1 * MINUTE_MS,
    5 * MINUTE_MS,
    15 * MINUTE_MS,
  ] as const;

/* ============================================================
   SENDING CRASH RECOVERY
============================================================ */

/*
 * A durable SENDING record is considered stranded only after
 * ten minutes.
 *
 * This avoids reclaiming a legitimately slow in-flight provider
 * request while still guaranteeing bounded crash recovery.
 *
 * Recovery preserves the same deliveryId so the privileged
 * provider can apply idempotency where supported.
 */

export const NOTIFICATION_SENDING_STALE_AFTER_MS =
  10 * MINUTE_MS;

/* ============================================================
   DELIVERY LIFECYCLE DISCOVERY / RECOVERY
============================================================ */

/*
 * Maximum wait before the Delivery Lifecycle re-checks for:
 *
 * - newly-created delivery artifacts
 * - provider configuration becoming available
 * - temporary execution-boundary recovery
 *
 * This is NOT provider retry timing.
 */

export const NOTIFICATION_DELIVERY_FALLBACK_WAKEUP_MS =
  5 * MINUTE_MS;

/* ============================================================
   END
============================================================ */