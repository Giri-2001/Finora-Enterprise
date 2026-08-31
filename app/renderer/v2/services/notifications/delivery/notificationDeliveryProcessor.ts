// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// NOTIFICATION DELIVERY PROCESSOR
//
// RESPONSIBILITY:
//
// - Find customer deliveries eligible for automatic execution.
// - Respect initial Notification scheduling.
// - Respect explicit retry scheduling.
// - Preserve offline retry timing.
// - Execute eligible deliveries sequentially through
//   NotificationDeliveryService.
//
// IMPORTANT:
//
// - No provider calls directly from this processor.
// - No provider secrets.
// - No hardcoded retry intervals.
// - No 09:00 / 20:00 scheduler clock rules.
// - No Loan eligibility rules.
// - No React.
// - No UI.
// - No direct storage access.
// - SENDING recovery is intentionally not handled here.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  NotificationDeliveryId,
  NotificationDeliveryRecord,
  NotificationDeliveryStatus,
} from "../../../types/notifications/notification.types";

import {
  notificationDeliveryRepository,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  NotificationDeliveryRepositoryScope,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import {
  notificationRepository,
} from "../../../repositories/notifications/notificationRepository";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

import type {
  NotificationDeliveryService,
} from "./notificationDeliveryService";

/* ============================================================
   DEPENDENCIES
============================================================ */

export interface NotificationDeliveryProcessorDependencies {
  deliveryService: NotificationDeliveryService;

  /*
   * Required environment/configuration execution gate.
   *
   * Returning false defers a due Delivery without mutating
   * its durable lifecycle state.
   *
   * Typical reasons:
   * - Privileged provider bridge unavailable
   * - Channel provider not configured yet
   *
   * No provider delivery may execute without this gate.
   */

  canExecute:
    (
      delivery:
        NotificationDeliveryRecord,
    ) =>
      boolean | Promise<boolean>;

  now?: () => string;
}

/* ============================================================
   PROCESS ITEM
============================================================ */

export interface NotificationDeliveryProcessItem {
  deliveryId: NotificationDeliveryId;

  executed: boolean;

  status?: NotificationDeliveryStatus;

  error?: string;
}

/* ============================================================
   PROCESS RESULT
============================================================ */

export interface NotificationDeliveryProcessResult {
  scanned: number;

  eligible: number;

  executed: number;

  sent: number;

  deferred: number;

  deliveryFailed: number;

  skipped: number;

  errors: number;

  items: NotificationDeliveryProcessItem[];
}

/* ============================================================
   TIME HELPERS
============================================================ */

function parseTimestamp(
  value: string,
): number | undefined {
  const timestamp =
    Date.parse(value);

  return Number.isFinite(timestamp)
    ? timestamp
    : undefined;
}

function isTimestampDue(
  value: string,
  nowTimestamp: number,
): boolean | undefined {
  const timestamp =
    parseTimestamp(value);

  if (timestamp === undefined) {
    return undefined;
  }

  return timestamp <= nowTimestamp;
}

/* ============================================================
   PROCESSOR
============================================================ */

export class NotificationDeliveryProcessor {
  constructor(
    private readonly dependencies:
      NotificationDeliveryProcessorDependencies,
  ) {}

  /* ==========================================================
     PROCESS DUE
  ========================================================== */

  async processDue(
    scope: NotificationDeliveryRepositoryScope,

    options?: RepositoryWriteOptions,
  ): Promise<NotificationDeliveryProcessResult> {
    const items: NotificationDeliveryProcessItem[] = [];

    const now =
      this.dependencies.now?.() ??
      new Date().toISOString();

    const nowTimestamp =
      parseTimestamp(now);

    if (nowTimestamp === undefined) {
      return {
        scanned: 0,

        eligible: 0,

        executed: 0,

        sent: 0,

        deferred: 0,

        deliveryFailed: 0,

        skipped: 0,

        errors: 1,

        items: [
          {
            deliveryId: "",

            executed: false,

            error:
              "Notification Delivery Processor received an invalid current timestamp.",
          },
        ],
      };
    }

    const deliveriesResult =
      await notificationDeliveryRepository.findAll(
        scope,
      );

    if (!deliveriesResult.success) {
      return {
        scanned: 0,

        eligible: 0,

        executed: 0,

        sent: 0,

        deferred: 0,

        deliveryFailed: 0,

        skipped: 0,

        errors: 1,

        items: [
          {
            deliveryId: "",

            executed: false,

            error:
              deliveriesResult.error ??
              "Unable to load Notification deliveries for processing.",
          },
        ],
      };
    }

    const deliveries =
      deliveriesResult.data ?? [];

    let eligible = 0;
    let executed = 0;
    let sent = 0;
    let deferred = 0;
    let deliveryFailed = 0;
    let skipped = 0;
    let errors = 0;

    /*
     * Execute sequentially.
     *
     * This keeps lifecycle persistence ordered inside the
     * current renderer process and avoids creating an
     * unnecessary burst of concurrent provider attempts.
     */

    for (const delivery of deliveries) {
      const eligibility =
        await this.resolveEligibility(
          scope,

          delivery,

          nowTimestamp,
        );

      if (eligibility.error) {
        errors += 1;

        items.push({
          deliveryId:
            delivery.id,

          executed: false,

          error:
            eligibility.error,
        });

        continue;
      }

      if (!eligibility.eligible) {
        continue;
      }

      eligible += 1;

        /*
         * A due Delivery may still be temporarily unavailable
         * because its privileged provider channel is not
         * configured.
         *
         * Preserve the durable Delivery state in that case.
         * Configuration absence must not become a permanent
         * FAILED Delivery merely because the processor woke up.
         */

      let canExecute =
        false;

      try {
        canExecute =
          await this.dependencies.canExecute(
            delivery,
          );
      } catch (error) {
        errors += 1;

        items.push({
          deliveryId:
            delivery.id,

          executed:
            false,

          status:
            delivery.status,

          error:
            error instanceof Error
              ? error.message
              : "Unable to verify Notification delivery execution availability.",
        });

        continue;
      }

      if (!canExecute) {
        deferred += 1;

        items.push({
          deliveryId:
            delivery.id,

          executed:
            false,

          status:
            delivery.status,
        });

        continue;
      }

      const executionResult =
        await this.dependencies.deliveryService.execute(
          scope,

          {
            deliveryId:
              delivery.id,
          },

          options,
        );

      executed += 1;

      if (!executionResult.success) {
        errors += 1;

        items.push({
          deliveryId:
            delivery.id,

          executed: true,

          error:
            executionResult.error,
        });

        continue;
      }

      const finalStatus =
        executionResult.delivery.status;

      if (
        finalStatus === "SENT" ||
        finalStatus === "DELIVERED"
      ) {
        sent += 1;
      } else if (finalStatus === "SCHEDULED") {
        deferred += 1;
      } else if (finalStatus === "FAILED") {
        deliveryFailed += 1;
      } else if (finalStatus === "SKIPPED") {
        skipped += 1;
      } else {
        errors += 1;

        items.push({
          deliveryId:
            delivery.id,

          executed: true,

          status:
            finalStatus,

          error:
            `Notification delivery ended in unexpected ${finalStatus} state.`,
        });

        continue;
      }

      items.push({
        deliveryId:
          delivery.id,

        executed: true,

        status:
          finalStatus,
      });
    }

    return {
      scanned:
        deliveries.length,

      eligible,

      executed,

      sent,

      deferred,

      deliveryFailed,

      skipped,

      errors,

      items,
    };
  }

  /* ==========================================================
     ELIGIBILITY
  ========================================================== */

  private async resolveEligibility(
    scope: NotificationDeliveryRepositoryScope,

    delivery: NotificationDeliveryRecord,

    nowTimestamp: number,
  ): Promise<{
    eligible: boolean;

    error?: string;
  }> {
    /* --------------------------------------------------------
       FAILED

       FAILED deliveries require an explicit nextRetryAt.

       No nextRetryAt means automatic retries are exhausted
       or intentionally disabled.
    -------------------------------------------------------- */

    if (delivery.status === "FAILED") {
      if (!delivery.nextRetryAt) {
        return {
          eligible: false,
        };
      }

      const retryDue =
        isTimestampDue(
          delivery.nextRetryAt,

          nowTimestamp,
        );

      if (retryDue === undefined) {
        return {
          eligible: false,

          error:
            `Notification delivery ${delivery.id} has an invalid nextRetryAt timestamp.`,
        };
      }

      return {
        eligible:
          retryDue,
      };
    }

    /* --------------------------------------------------------
       SCHEDULED
    -------------------------------------------------------- */

    if (delivery.status !== "SCHEDULED") {
      return {
        eligible: false,
      };
    }

    /* --------------------------------------------------------
       OFFLINE / DEFERRED SCHEDULED RETRY

       When nextRetryAt exists on a SCHEDULED delivery, it is
       authoritative.

       This prevents an offline delivery whose original
       Notification scheduledFor is already in the past from
       being retried on every processor invocation.
    -------------------------------------------------------- */

    if (delivery.nextRetryAt) {
      const retryDue =
        isTimestampDue(
          delivery.nextRetryAt,

          nowTimestamp,
        );

      if (retryDue === undefined) {
        return {
          eligible: false,

          error:
            `Notification delivery ${delivery.id} has an invalid nextRetryAt timestamp.`,
        };
      }

      return {
        eligible:
          retryDue,
      };
    }

    /* --------------------------------------------------------
       INITIAL SCHEDULE

       Initial scheduling belongs to the canonical logical
       Notification record.
    -------------------------------------------------------- */

    const notificationResult =
      await notificationRepository.findById(
        scope,

        delivery.notificationId,
      );

    if (!notificationResult.success) {
      return {
        eligible: false,

        error:
          notificationResult.error ??
          `Unable to load Notification ${delivery.notificationId} for delivery eligibility.`,
      };
    }

    if (!notificationResult.data) {
      return {
        eligible: false,

        error:
          `Notification ${delivery.notificationId} was not found for delivery ${delivery.id}.`,
      };
    }

    const scheduledFor =
      notificationResult.data.scheduledFor;

    /*
     * No scheduledFor means the logical Notification is
     * immediately eligible.
     */

    if (!scheduledFor) {
      return {
        eligible: true,
      };
    }

    const scheduledDue =
      isTimestampDue(
        scheduledFor,

        nowTimestamp,
      );

    if (scheduledDue === undefined) {
      return {
        eligible: false,

        error:
          `Notification ${notificationResult.data.id} has an invalid scheduledFor timestamp.`,
      };
    }

    return {
      eligible:
        scheduledDue,
    };
  }
}

/* ============================================================
   END
============================================================ */
