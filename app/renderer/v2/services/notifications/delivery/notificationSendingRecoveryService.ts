// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// SENDING DELIVERY CRASH RECOVERY SERVICE
//
// RESPONSIBILITY:
//
// - Detect stale durable SENDING delivery records.
// - Recover stranded SENDING state after application/process crash.
// - Preserve the original deliveryId for provider idempotency.
// - Return recovered deliveries to normal retry processing.
//
// SAFETY:
//
// - No provider calls.
// - No React.
// - No UI.
// - No direct localStorage access.
// - No Electron IPC.
// - No provider secrets.
// - No hardcoded stale timeout.
// - Fresh/in-flight SENDING records are never touched.
// - Recovery does not increment attemptCount.
// - Recovery never records SENT or DELIVERED.
//
// IDEMPOTENCY:
//
// The original deliveryId is intentionally preserved.
//
// A provider implementation MUST use deliveryId as its
// idempotency key whenever the provider supports idempotent
// request semantics. This allows a recovered delivery to be
// retried without inventing a new outbound identity.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationDeliveryRecord,
} from "../../../types/notifications/notification.types";

import {
  notificationDeliveryRepository,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  NotificationDeliveryRepositoryScope,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

/* ============================================================
   CONFIGURATION
============================================================ */

export interface NotificationSendingRecoveryPolicy {
  /*
   * Maximum age of SENDING before it is considered stranded.
   */
  staleAfterMs:
    number;
}

/* ============================================================
   RESULT
============================================================ */

export interface NotificationSendingRecoveryItem {
  deliveryId:
    string;

  recovered:
    boolean;

  previousStatus:
    NotificationDeliveryRecord["status"];

  finalStatus:
    NotificationDeliveryRecord["status"];

  error?:
    string;
}

export interface NotificationSendingRecoveryReport {
  scanned:
    number;

  sending:
    number;

  stale:
    number;

  recovered:
    number;

  fresh:
    number;

  errors:
    number;

  items:
    NotificationSendingRecoveryItem[];
}

export type NotificationSendingRecoveryResult =
  | {
      success: true;

      report:
        NotificationSendingRecoveryReport;
    }
  | {
      success: false;

      report:
        NotificationSendingRecoveryReport;

      error:
        string;
    };

/* ============================================================
   VALIDATION
============================================================ */

function assertPositiveDelay(
  value: number,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      "Notification SENDING recovery staleAfterMs must be greater than zero.",
    );
  }
}

/* ============================================================
   TIMESTAMP
============================================================ */

function resolveSendingStartedAt(
  delivery:
    NotificationDeliveryRecord,
): number | undefined {
  const value =
    delivery.lastAttemptAt ??
    delivery.updatedAt;

  const timestamp =
    Date.parse(value);

  return Number.isFinite(timestamp)
    ? timestamp
    : undefined;
}

/* ============================================================
   SERVICE
============================================================ */

export class NotificationSendingRecoveryService {
  constructor(
    private readonly policy:
      NotificationSendingRecoveryPolicy,

    private readonly now:
      () => string =
        () => new Date().toISOString(),
  ) {
    assertPositiveDelay(
      policy.staleAfterMs,
    );
  }

  async recover(
    scope:
      NotificationDeliveryRepositoryScope,

    options?:
      RepositoryWriteOptions,
  ): Promise<NotificationSendingRecoveryResult> {
    const report:
      NotificationSendingRecoveryReport = {
        scanned:
          0,

        sending:
          0,

        stale:
          0,

        recovered:
          0,

        fresh:
          0,

        errors:
          0,

        items:
          [],
      };

    const allResult =
      await notificationDeliveryRepository.findAll(
        scope,
      );

    if (!allResult.success) {
      return {
        success: false,

        report,

        error:
          allResult.error ??
          "Unable to load Notification deliveries for SENDING recovery.",
      };
    }

    const deliveries =
      allResult.data ?? [];

    report.scanned =
      deliveries.length;

    const now =
      this.now();

    const nowTimestamp =
      Date.parse(now);

    if (!Number.isFinite(nowTimestamp)) {
      return {
        success: false,

        report,

        error:
          "Notification SENDING recovery clock returned an invalid timestamp.",
      };
    }

    for (const delivery of deliveries) {
      if (delivery.status !== "SENDING") {
        continue;
      }

      report.sending +=
        1;

      const sendingStartedAt =
        resolveSendingStartedAt(
          delivery,
        );

      if (sendingStartedAt === undefined) {
        report.errors +=
          1;

        report.items.push({
          deliveryId:
            delivery.id,

          recovered:
            false,

          previousStatus:
            delivery.status,

          finalStatus:
            delivery.status,

          error:
            "SENDING delivery does not contain a valid recovery timestamp.",
        });

        continue;
      }

      const ageMs =
        nowTimestamp -
        sendingStartedAt;

      if (
        ageMs <
        this.policy.staleAfterMs
      ) {
        report.fresh +=
          1;

        report.items.push({
          deliveryId:
            delivery.id,

          recovered:
            false,

          previousStatus:
            delivery.status,

          finalStatus:
            delivery.status,
        });

        continue;
      }

      report.stale +=
        1;

      const recoveredDelivery:
        NotificationDeliveryRecord = {
          ...delivery,

          status:
            "FAILED",

          /*
           * Recovery itself is not a new provider attempt.
           * Keep attemptCount and lastAttemptAt unchanged.
           *
           * Immediate eligibility is deliberate once the stale
           * threshold has already expired.
           */

          nextRetryAt:
            now,

          failureCode:
            "SENDING_RECOVERED_AFTER_CRASH",

          failureMessage:
            "Notification delivery was recovered from a stale SENDING state after an interrupted provider attempt.",

          updatedAt:
            now,
        };

      const updateResult =
        await notificationDeliveryRepository.update(
          scope,

          recoveredDelivery,

          options,
        );

      if (
        !updateResult.success ||
        !updateResult.data
      ) {
        report.errors +=
          1;

        report.items.push({
          deliveryId:
            delivery.id,

          recovered:
            false,

          previousStatus:
            delivery.status,

          finalStatus:
            delivery.status,

          error:
            updateResult.error ??
            "Unable to persist recovered Notification delivery.",
        });

        continue;
      }

      report.recovered +=
        1;

      report.items.push({
        deliveryId:
          delivery.id,

        recovered:
          true,

        previousStatus:
          delivery.status,

        finalStatus:
          updateResult.data.status,
      });
    }

    if (report.errors > 0) {
      return {
        success: false,

        report,

        error:
          "Notification SENDING recovery completed with one or more errors.",
      };
    }

    return {
      success: true,

      report,
    };
  }
}

/* ============================================================
   END
============================================================ */