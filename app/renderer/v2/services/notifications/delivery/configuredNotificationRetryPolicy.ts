// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// CONFIGURED NOTIFICATION RETRY POLICY
//
// RESPONSIBILITY:
//
// - Convert retry policy configuration into nextRetryAt values.
// - Keep retry timing deterministic and testable.
// - Stop automatic retries when configured attempts are exhausted.
// - Keep offline retry timing separate from provider failures.
//
// IMPORTANT:
//
// - No hardcoded production retry intervals.
// - No scheduler clock rules.
// - No storage access.
// - No provider calls.
// - No connectivity checks.
// - No random jitter.
// - Provider retry capacity is defined by configured delay arrays.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationRetryPolicy,
  NotificationRetryPolicyInput,
} from "./notificationDeliveryService";

/* ============================================================
   CONFIGURATION
============================================================ */

export interface ConfiguredNotificationRetryPolicyOptions {
  /*
   * Offline does not increment provider attemptCount.
   *
   * Therefore offline retry uses its own fixed configured delay.
   */

  offlineRetryDelayMs: number;

  /*
   * Each entry represents the delay after the corresponding
   * provider attempt.
   *
   * Example:
   *
   * [delayAfterAttempt1, delayAfterAttempt2, ...]
   *
   * An empty array disables automatic provider retries.
   */

  providerFailureRetryDelaysMs: readonly number[];

  /*
   * When omitted, provider exceptions use the same retry
   * schedule as normal retryable provider failures.
   */

  providerExceptionRetryDelaysMs?: readonly number[];
}

/* ============================================================
   VALIDATION
============================================================ */

function assertPositiveDelay(
  value: number,
  label: string,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${label} must be a finite number greater than zero.`,
    );
  }
}

function assertDelayList(
  values: readonly number[],
  label: string,
): void {
  values.forEach((value, index) => {
    assertPositiveDelay(
      value,
      `${label}[${index}]`,
    );
  });
}

/* ============================================================
   DATE CALCULATION
============================================================ */

function addDelay(
  now: string,
  delayMs: number,
): string | undefined {
  const timestamp =
    Date.parse(now);

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return new Date(
    timestamp + delayMs,
  ).toISOString();
}

/* ============================================================
   IMPLEMENTATION
============================================================ */

export class ConfiguredNotificationRetryPolicy
  implements NotificationRetryPolicy
{
  private readonly options:
    ConfiguredNotificationRetryPolicyOptions;

  constructor(
    options: ConfiguredNotificationRetryPolicyOptions,
  ) {
    assertPositiveDelay(
      options.offlineRetryDelayMs,
      "offlineRetryDelayMs",
    );

    assertDelayList(
      options.providerFailureRetryDelaysMs,
      "providerFailureRetryDelaysMs",
    );

    if (options.providerExceptionRetryDelaysMs) {
      assertDelayList(
        options.providerExceptionRetryDelaysMs,
        "providerExceptionRetryDelaysMs",
      );
    }

    this.options = {
      offlineRetryDelayMs:
        options.offlineRetryDelayMs,

      providerFailureRetryDelaysMs:
        [...options.providerFailureRetryDelaysMs],

      providerExceptionRetryDelaysMs:
        options.providerExceptionRetryDelaysMs
          ? [...options.providerExceptionRetryDelaysMs]
          : undefined,
    };
  }

  /* ==========================================================
     NEXT RETRY
  ========================================================== */

  getNextRetryAt(
    input: NotificationRetryPolicyInput,
  ): string | undefined {
    if (input.reason === "OFFLINE") {
      return addDelay(
        input.now,
        this.options.offlineRetryDelayMs,
      );
    }

    const delays =
      input.reason === "PROVIDER_EXCEPTION"
        ? (
            this.options.providerExceptionRetryDelaysMs ??
            this.options.providerFailureRetryDelaysMs
          )
        : this.options.providerFailureRetryDelaysMs;

    /*
     * Delivery Service increments attemptCount immediately
     * before the provider call.
     *
     * attemptCount = 1 therefore maps to delays[0].
     */

    const delayIndex =
      input.delivery.attemptCount - 1;

    if (
      delayIndex < 0 ||
      delayIndex >= delays.length
    ) {
      return undefined;
    }

    return addDelay(
      input.now,
      delays[delayIndex],
    );
  }
}

/* ============================================================
   END
============================================================ */
