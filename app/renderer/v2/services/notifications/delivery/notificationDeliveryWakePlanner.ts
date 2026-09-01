// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION DELIVERY WAKE PLANNER
//
// RESPONSIBILITY:
//
// - Inspect persisted Notification Delivery lifecycle state.
// - Determine how many deliveries are currently due.
// - Determine the earliest future automatic delivery wake-up.
// - Respect explicit retry timing.
// - Respect logical Notification scheduledFor timing.
//
// IMPORTANT:
//
// - No provider calls.
// - No retry interval decisions.
// - No timers.
// - No React.
// - No UI.
// - No mutation of Notification or Delivery records.
// - SENDING crash recovery is intentionally not handled here.
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

import {
  notificationRepository,
} from "../../../repositories/notifications/notificationRepository";

/* ============================================================
   RESULT
============================================================ */

export interface NotificationDeliveryWakePlan {
  evaluatedAt:
    string;

  scanned:
    number;

  dueCount:
    number;

  nextWakeAt?:
    string;

  errors:
    string[];
}

export type NotificationDeliveryWakePlanResult =
  | {
      success: true;

      plan:
        NotificationDeliveryWakePlan;
    }
  | {
      success: false;

      error:
        string;

      plan?:
        NotificationDeliveryWakePlan;
    };

/* ============================================================
   TIME
============================================================ */

function parseTimestamp(
  value:
    string,
): number | undefined {
  const timestamp =
    Date.parse(value);

  return Number.isFinite(timestamp)
    ? timestamp
    : undefined;
}

function normalizeNow(
  now?:
    string | number | Date,
): {
  iso?: string;
  timestamp?: number;
} {
  const date =
    now === undefined
      ? new Date()
      : new Date(now);

  const timestamp =
    date.getTime();

  if (!Number.isFinite(timestamp)) {
    return {};
  }

  return {
    iso:
      date.toISOString(),

    timestamp,
  };
}

/* ============================================================
   PLANNER
============================================================ */

export class NotificationDeliveryWakePlanner {
  async plan(
    scope:
      NotificationDeliveryRepositoryScope,

    now?:
      string | number | Date,
  ): Promise<
    NotificationDeliveryWakePlanResult
  > {
    const normalizedNow =
      normalizeNow(now);

    if (
      !normalizedNow.iso ||
      normalizedNow.timestamp === undefined
    ) {
      return {
        success: false,

        error:
          "Notification Delivery wake planner received an invalid current timestamp.",
      };
    }

    const deliveriesResult =
      await notificationDeliveryRepository.findAll(
        scope,
      );

    if (!deliveriesResult.success) {
      return {
        success: false,

        error:
          deliveriesResult.error ??
          "Unable to load Notification deliveries for wake planning.",
      };
    }

    const deliveries =
      deliveriesResult.data ?? [];

    const plan:
      NotificationDeliveryWakePlan = {
        evaluatedAt:
          normalizedNow.iso,

        scanned:
          deliveries.length,

        dueCount:
          0,

        nextWakeAt:
          undefined,

        errors: [],
      };

    let earliestFutureTimestamp:
      number | undefined;

    const considerTimestamp = (
      delivery:
        NotificationDeliveryRecord,

      value:
        string,

      label:
        string,
    ): void => {
      const timestamp =
        parseTimestamp(value);

      if (timestamp === undefined) {
        plan.errors.push(
          `Notification delivery ${delivery.id} has an invalid ${label} timestamp.`,
        );

        return;
      }

      if (
        timestamp <=
        normalizedNow.timestamp!
      ) {
        plan.dueCount +=
          1;

        return;
      }

      if (
        earliestFutureTimestamp === undefined ||
        timestamp < earliestFutureTimestamp
      ) {
        earliestFutureTimestamp =
          timestamp;
      }
    };

    for (const delivery of deliveries) {
      // ------------------------------------------------------
      // FAILED RETRY
      //
      // No nextRetryAt means automatic retries are exhausted
      // or intentionally disabled.
      // ------------------------------------------------------

      if (delivery.status === "FAILED") {
        if (!delivery.nextRetryAt) {
          continue;
        }

        considerTimestamp(
          delivery,
          delivery.nextRetryAt,
          "nextRetryAt",
        );

        continue;
      }

      // ------------------------------------------------------
      // ONLY SCHEDULED DELIVERIES ENTER INITIAL / OFFLINE
      // AUTOMATIC WAKE PLANNING.
      // ------------------------------------------------------

      if (delivery.status !== "SCHEDULED") {
        continue;
      }

      // ------------------------------------------------------
      // EXPLICIT SCHEDULED RETRY
      //
      // nextRetryAt is authoritative when present.
      // ------------------------------------------------------

      if (delivery.nextRetryAt) {
        considerTimestamp(
          delivery,
          delivery.nextRetryAt,
          "nextRetryAt",
        );

        continue;
      }

      // ------------------------------------------------------
      // MANUAL RESEND
      //
      // A manual resend is a new SCHEDULED Delivery whose
      // resendRequestedAt is the explicit command timestamp.
      //
      // nextRetryAt remains authoritative above if the resend
      // was subsequently deferred by offline/retry handling.
      // ------------------------------------------------------

      if (delivery.resendRequestedAt) {
        considerTimestamp(
          delivery,
          delivery.resendRequestedAt,
          "resendRequestedAt",
        );

        continue;
      }

      // ------------------------------------------------------
      // INITIAL NOTIFICATION SCHEDULE
      // ------------------------------------------------------

      const notificationResult =
        await notificationRepository.findById(
          scope,
          delivery.notificationId,
        );

      if (!notificationResult.success) {
        plan.errors.push(
          notificationResult.error ??
          `Unable to load Notification ${delivery.notificationId} for Delivery wake planning.`,
        );

        continue;
      }

      const notification =
        notificationResult.data;

      if (!notification) {
        plan.errors.push(
          `Notification ${delivery.notificationId} was not found for Delivery ${delivery.id}.`,
        );

        continue;
      }

      /*
       * No scheduledFor means immediately eligible.
       */

      if (!notification.scheduledFor) {
        plan.dueCount +=
          1;

        continue;
      }

      considerTimestamp(
        delivery,
        notification.scheduledFor,
        "scheduledFor",
      );
    }

    if (
      earliestFutureTimestamp !==
      undefined
    ) {
      plan.nextWakeAt =
        new Date(
          earliestFutureTimestamp,
        ).toISOString();
    }

    if (plan.errors.length > 0) {
      return {
        success: false,

        error:
          plan.errors.join(" | "),

        plan,
      };
    }

    return {
      success: true,

      plan,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const notificationDeliveryWakePlanner =
  new NotificationDeliveryWakePlanner();

/* ============================================================
   END
============================================================ */
