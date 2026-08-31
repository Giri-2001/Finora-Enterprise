// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// MANUAL NOTIFICATION RESEND SERVICE
//
// RESPONSIBILITY:
//
// - Create a new Delivery attempt for an explicit manual resend.
// - Preserve the original Delivery record unchanged.
// - Reuse the canonical Notification + channel + recipient.
// - Use deterministic resend Delivery identity.
// - Keep repeated identical resend requests idempotent.
//
// IMPORTANT:
//
// - No provider calls.
// - No React.
// - No UI.
// - No localStorage access.
// - No Electron IPC.
// - No provider secrets.
// - SCHEDULED / SENDING deliveries cannot be manually resent.
// - Policy is re-checked later by NotificationDeliveryService.
// - A resend never resets or overwrites the source Delivery.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationDeliveryId,
  NotificationDeliveryRecord,
} from "../../../types/notifications/notification.types";

import {
  NOTIFICATION_DELIVERY_ENTITY,
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

import {
  buildManualResendNotificationDeliveryId,
} from "../generation/notificationGenerationIdentity";

/* ============================================================
   REQUEST
============================================================ */

export interface NotificationManualResendRequest {
  sourceDeliveryId:
    NotificationDeliveryId;

  /*
   * Capture once at the command boundary.
   *
   * Reusing this timestamp makes repeated command execution
   * deterministic and prevents duplicate resend artifacts.
   */
  resendRequestedAt:
    string;
}

/* ============================================================
   RESULT
============================================================ */

export type NotificationManualResendDisposition =
  | "CREATED"
  | "EXISTING";

export type NotificationManualResendResult =
  | {
      success: true;

      disposition:
        NotificationManualResendDisposition;

      sourceDelivery:
        NotificationDeliveryRecord;

      resendDelivery:
        NotificationDeliveryRecord;
    }
  | {
      success: false;

      sourceDelivery?:
        NotificationDeliveryRecord;

      error:
        string;
    };

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* ============================================================
   SOURCE STATE
============================================================ */

function canCreateManualResend(
  delivery:
    NotificationDeliveryRecord,
): boolean {
  return (
    delivery.status === "FAILED" ||
    delivery.status === "SENT" ||
    delivery.status === "DELIVERED" ||
    delivery.status === "SKIPPED" ||
    delivery.status === "CANCELLED"
  );
}

/* ============================================================
   EXISTING RESEND CONSISTENCY
============================================================ */

function matchesExpectedResend(
  existing:
    NotificationDeliveryRecord,

  source:
    NotificationDeliveryRecord,

  resendRequestedAt:
    string,
): boolean {
  return (
    existing.entity ===
      NOTIFICATION_DELIVERY_ENTITY &&
    existing.notificationId ===
      source.notificationId &&
    existing.ownerId ===
      source.ownerId &&
    existing.businessId ===
      source.businessId &&
    existing.branchId ===
      source.branchId &&
    existing.channel ===
      source.channel &&
    existing.recipient.customerId ===
      source.recipient.customerId &&
    existing.resendRequestedAt ===
      resendRequestedAt
  );
}

/* ============================================================
   SERVICE
============================================================ */

export class NotificationManualResendService {
  async requestResend(
    scope:
      NotificationDeliveryRepositoryScope,

    request:
      NotificationManualResendRequest,

    options?:
      RepositoryWriteOptions,
  ): Promise<NotificationManualResendResult> {
    const sourceDeliveryId =
      normalizeString(
        request.sourceDeliveryId,
      );

    if (!sourceDeliveryId) {
      return {
        success: false,

        error:
          "Source Notification Delivery ID is required for manual resend.",
      };
    }

    const requestedAtInput =
      normalizeString(
        request.resendRequestedAt,
      );

    const requestedAtTimestamp =
      Date.parse(
        requestedAtInput,
      );

    if (
      !requestedAtInput ||
      !Number.isFinite(
        requestedAtTimestamp,
      )
    ) {
      return {
        success: false,

        error:
          "Manual resend request timestamp is invalid.",
      };
    }

    const resendRequestedAt =
      new Date(
        requestedAtTimestamp,
      ).toISOString();

    /* --------------------------------------------------------
       AUTHORITATIVE SOURCE DELIVERY
    -------------------------------------------------------- */

    const sourceResult =
      await notificationDeliveryRepository.findById(
        scope,

        sourceDeliveryId,
      );

    if (!sourceResult.success) {
      return {
        success: false,

        error:
          sourceResult.error ??
          "Unable to load source Notification Delivery for manual resend.",
      };
    }

    if (!sourceResult.data) {
      return {
        success: false,

        error:
          "Source Notification Delivery was not found for manual resend.",
      };
    }

    const sourceDelivery =
      sourceResult.data;

    if (
      !canCreateManualResend(
        sourceDelivery,
      )
    ) {
      return {
        success: false,

        sourceDelivery,

        error:
          `Notification Delivery cannot be manually resent from ${sourceDelivery.status} state.`,
      };
    }

    /* --------------------------------------------------------
       DETERMINISTIC RESEND IDENTITY
    -------------------------------------------------------- */

    const identity =
      buildManualResendNotificationDeliveryId({
        notificationId:
          sourceDelivery.notificationId,

        channel:
          sourceDelivery.channel,

        resendRequestedAt,
      });

    if (!identity.success) {
      return {
        success: false,

        sourceDelivery,

        error:
          identity.error,
      };
    }

    /* --------------------------------------------------------
       IDEMPOTENT REPLAY
    -------------------------------------------------------- */

    const existingResult =
      await notificationDeliveryRepository.findById(
        scope,

        identity.id,
      );

    if (!existingResult.success) {
      return {
        success: false,

        sourceDelivery,

        error:
          existingResult.error ??
          "Unable to verify existing manual resend Delivery.",
      };
    }

    if (existingResult.data) {
      if (
        !matchesExpectedResend(
          existingResult.data,

          sourceDelivery,

          resendRequestedAt,
        )
      ) {
        return {
          success: false,

          sourceDelivery,

          error:
            "Existing manual resend Delivery does not match the expected resend identity.",
        };
      }

      return {
        success: true,

        disposition:
          "EXISTING",

        sourceDelivery,

        resendDelivery:
          existingResult.data,
      };
    }

    /* --------------------------------------------------------
       NEW RESEND DELIVERY
    -------------------------------------------------------- */

    const resendDelivery:
      NotificationDeliveryRecord = {
        id:
          identity.id,

        entity:
          NOTIFICATION_DELIVERY_ENTITY,

        notificationId:
          sourceDelivery.notificationId,

        ownerId:
          sourceDelivery.ownerId,

        businessId:
          sourceDelivery.businessId,

        branchId:
          sourceDelivery.branchId,

        channel:
          sourceDelivery.channel,

        recipient: {
          ...sourceDelivery.recipient,
        },

        status:
          "SCHEDULED",

        attemptCount:
          0,

        resendRequestedAt,

        createdAt:
          resendRequestedAt,

        updatedAt:
          resendRequestedAt,
      };

    const saveResult =
      await notificationDeliveryRepository.save(
        scope,

        resendDelivery,

        options,
      );

    if (
      !saveResult.success ||
      !saveResult.data
    ) {
      return {
        success: false,

        sourceDelivery,

        error:
          saveResult.error ??
          "Unable to create manual resend Notification Delivery.",
      };
    }

    return {
      success: true,

      disposition:
        "CREATED",

      sourceDelivery,

      resendDelivery:
        saveResult.data,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const notificationManualResendService =
  new NotificationManualResendService();

/* ============================================================
   END
============================================================ */