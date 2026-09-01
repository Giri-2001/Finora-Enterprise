// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION CENTER SERVICE
//
// RESPONSIBILITY:
//
// - Load the authoritative Notification Center snapshot.
// - Load the global Owner unread count.
// - Join Customer logical Notifications with Delivery records.
// - Mark Owner Notifications as read.
// - Mark all Owner Notifications as read.
// - Orchestrate explicit manual resend requests.
// - Wake the authenticated Delivery lifecycle after resend.
// - Publish renderer-local Notification data change signals.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage.
// - No sessionStorage.
// - No filesystem access.
// - No Electron IPC.
// - No provider secrets.
// - No provider calls.
// - Scope is supplied by the authenticated App boundary.
// - Delivery execution remains owned by the Delivery lifecycle.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CustomerNotificationRecord,
  NotificationDeliveryId,
  NotificationDeliveryRecord,
  NotificationId,
  NotificationRecord,
  OwnerNotificationRecord,
} from "../../../types/notifications/notification.types";

import {
  notificationRepository,
} from "../../../repositories/notifications/notificationRepository";

import type {
  NotificationRepositoryScope,
} from "../../../repositories/notifications/notificationRepository";

import {
  notificationDeliveryRepository,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

import {
  notificationManualResendService,
} from "../delivery/notificationManualResendService";

import type {
  NotificationManualResendResult,
} from "../delivery/notificationManualResendService";

import {
  notificationDeliveryLifecycle,
} from "../delivery/productionNotificationDeliveryRuntime";

import {
  emitNotificationDataChanged,
} from "../notificationDataChangeSignal";

/* ============================================================
   SCOPE
============================================================ */

export type NotificationCenterScope =
  NotificationRepositoryScope;

/* ============================================================
   DELIVERY ROW
============================================================ */

export interface NotificationCenterDeliveryRow {
  delivery:
    NotificationDeliveryRecord;

  notification?:
    CustomerNotificationRecord;
}

/* ============================================================
   SNAPSHOT
============================================================ */

export interface NotificationCenterSnapshot {
  ownerNotifications:
    OwnerNotificationRecord[];

  deliveryRows:
    NotificationCenterDeliveryRow[];

  unreadCount:
    number;

  loadedAt:
    string;
}

/* ============================================================
   SNAPSHOT RESULT
============================================================ */

export type NotificationCenterSnapshotResult =
  | {
      success: true;

      snapshot:
        NotificationCenterSnapshot;
    }
  | {
      success: false;

      error:
        string;
    };

/* ============================================================
   MARK READ RESULT
============================================================ */

export type NotificationCenterMarkReadDisposition =
  | "UPDATED"
  | "UNCHANGED";

export type NotificationCenterMarkReadResult =
  | {
      success: true;

      disposition:
        NotificationCenterMarkReadDisposition;

      notification:
        OwnerNotificationRecord;
    }
  | {
      success: false;

      error:
        string;
    };

/* ============================================================
   MARK ALL READ REPORT
============================================================ */

export interface NotificationCenterMarkAllReadReport {
  scanned:
    number;

  updated:
    number;

  errors:
    string[];
}

export type NotificationCenterMarkAllReadResult =
  | {
      success: true;

      report:
        NotificationCenterMarkAllReadReport;
    }
  | {
      success: false;

      error:
        string;

      report:
        NotificationCenterMarkAllReadReport;
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

function normalizeScope(
  scope:
    NotificationCenterScope,
): NotificationCenterScope {
  return {
    ownerId:
      normalizeString(
        scope.ownerId,
      ),

    businessId:
      normalizeString(
        scope.businessId,
      ),

    branchId:
      normalizeString(
        scope.branchId,
      ),
  };
}

/* ============================================================
   TYPE GUARDS
============================================================ */

function isOwnerNotification(
  notification:
    NotificationRecord,
): notification is OwnerNotificationRecord {
  return (
    notification.audience ===
    "OWNER"
  );
}

function isCustomerNotification(
  notification:
    NotificationRecord,
): notification is CustomerNotificationRecord {
  return (
    notification.audience ===
    "CUSTOMER"
  );
}

/* ============================================================
   SERVICE
============================================================ */

export class NotificationCenterService {
  /* ==========================================================
     LOAD SNAPSHOT
  ========================================================== */

  async loadSnapshot(
    inputScope:
      NotificationCenterScope,
  ): Promise<
    NotificationCenterSnapshotResult
  > {
    const scope =
      normalizeScope(
        inputScope,
      );

    const [
      notificationResult,
      deliveryResult,
    ] =
      await Promise.all([
        notificationRepository.findAll(
          scope,
        ),

        notificationDeliveryRepository.findAll(
          scope,
        ),
      ]);

    if (!notificationResult.success) {
      return {
        success: false,

        error:
          notificationResult.error ??
          "Unable to load Notification Center records.",
      };
    }

    if (!deliveryResult.success) {
      return {
        success: false,

        error:
          deliveryResult.error ??
          "Unable to load Notification Delivery records.",
      };
    }

    const notifications =
      notificationResult.data ?? [];

    const ownerNotifications =
      notifications.filter(
        isOwnerNotification,
      );

    const customerNotifications =
      notifications.filter(
        isCustomerNotification,
      );

    const customerNotificationById =
      new Map<
        string,
        CustomerNotificationRecord
      >();

    for (
      const notification
      of customerNotifications
    ) {
      customerNotificationById.set(
        notification.id,
        notification,
      );
    }

    const deliveries =
      deliveryResult.data ?? [];

    const deliveryRows:
      NotificationCenterDeliveryRow[] =
      deliveries.map(
        (delivery) => ({
          delivery,

          notification:
            customerNotificationById.get(
              delivery.notificationId,
            ),
        }),
      );

    return {
      success: true,

      snapshot: {
        ownerNotifications,

        deliveryRows,

        unreadCount:
          ownerNotifications.filter(
            (notification) =>
              notification.readState ===
              "UNREAD",
          ).length,

        loadedAt:
          new Date().toISOString(),
      },
    };
  }

  /* ==========================================================
     LOAD UNREAD COUNT
  ========================================================== */

  async loadUnreadCount(
    inputScope:
      NotificationCenterScope,
  ): Promise<{
    success: boolean;

    count: number;

    error?: string;
  }> {
    const scope =
      normalizeScope(
        inputScope,
      );

    const result =
      await notificationRepository
        .countUnreadOwnerNotifications(
          scope,
        );

    if (!result.success) {
      return {
        success: false,

        count:
          0,

        error:
          result.error ??
          "Unable to load Owner unread Notification count.",
      };
    }

    return {
      success: true,

      count:
        result.data ?? 0,
    };
  }

  /* ==========================================================
     MARK OWNER NOTIFICATION READ
  ========================================================== */

  async markOwnerNotificationRead(
    inputScope:
      NotificationCenterScope,

    notificationId:
      NotificationId,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    NotificationCenterMarkReadResult
  > {
    const scope =
      normalizeScope(
        inputScope,
      );

    const normalizedNotificationId =
      normalizeString(
        notificationId,
      );

    if (!normalizedNotificationId) {
      return {
        success: false,

        error:
          "Owner Notification ID is required.",
      };
    }

    const existingResult =
      await notificationRepository.findById(
        scope,

        normalizedNotificationId,
      );

    if (!existingResult.success) {
      return {
        success: false,

        error:
          existingResult.error ??
          "Unable to load Owner Notification.",
      };
    }

    if (!existingResult.data) {
      return {
        success: false,

        error:
          "Owner Notification was not found.",
      };
    }

    if (
      !isOwnerNotification(
        existingResult.data,
      )
    ) {
      return {
        success: false,

        error:
          "Customer Notifications do not participate in the Owner read lifecycle.",
      };
    }

    if (
      existingResult.data.readState ===
      "READ"
    ) {
      return {
        success: true,

        disposition:
          "UNCHANGED",

        notification:
          existingResult.data,
      };
    }

    const readAt =
      new Date().toISOString();

    const updatedNotification:
      OwnerNotificationRecord = {
        ...existingResult.data,

        readState:
          "READ",

        readAt,

        updatedAt:
          readAt,
      };

    const updateResult =
      await notificationRepository.update(
        scope,

        updatedNotification,

        options,
      );

    if (
      !updateResult.success ||
      !updateResult.data
    ) {
      return {
        success: false,

        error:
          updateResult.error ??
          "Unable to mark Owner Notification as read.",
      };
    }

    if (
      !isOwnerNotification(
        updateResult.data,
      )
    ) {
      return {
        success: false,

        error:
          "Updated Notification no longer matches the Owner Notification contract.",
      };
    }

    emitNotificationDataChanged({
      ownerId:
        updateResult.data.ownerId,

      businessId:
        updateResult.data.businessId,

      branchId:
        updateResult.data.branchId,

      resource:
        "NOTIFICATION",

      operation:
        "UPDATED",

      notificationId:
        updateResult.data.id,
    });

    return {
      success: true,

      disposition:
        "UPDATED",

      notification:
        updateResult.data,
    };
  }

  /* ==========================================================
     MARK ALL OWNER NOTIFICATIONS READ
  ========================================================== */

  async markAllOwnerNotificationsRead(
    inputScope:
      NotificationCenterScope,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    NotificationCenterMarkAllReadResult
  > {
    const scope =
      normalizeScope(
        inputScope,
      );

    const unreadResult =
      await notificationRepository
        .findUnreadOwnerNotifications(
          scope,
        );

    if (!unreadResult.success) {
      return {
        success: false,

        error:
          unreadResult.error ??
          "Unable to load unread Owner Notifications.",

        report: {
          scanned:
            0,

          updated:
            0,

          errors: [],
        },
      };
    }

    const unreadNotifications =
      (unreadResult.data ?? [])
        .filter(
          isOwnerNotification,
        );

    const report:
      NotificationCenterMarkAllReadReport = {
        scanned:
          unreadNotifications.length,

        updated:
          0,

        errors: [],
      };

    if (
      unreadNotifications.length ===
      0
    ) {
      return {
        success: true,

        report,
      };
    }

    const readAt =
      new Date().toISOString();

    for (
      const notification
      of unreadNotifications
    ) {
      const updatedNotification:
        OwnerNotificationRecord = {
          ...notification,

          readState:
            "READ",

          readAt,

          updatedAt:
            readAt,
        };

      const updateResult =
        await notificationRepository.update(
          scope,

          updatedNotification,

          options,
        );

      if (
        !updateResult.success ||
        !updateResult.data
      ) {
        report.errors.push(
          updateResult.error ??
            `Unable to mark Owner Notification ${notification.id} as read.`,
        );

        continue;
      }

      report.updated +=
        1;
    }

    if (report.updated > 0) {
      emitNotificationDataChanged({
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        resource:
          "NOTIFICATION",

        operation:
          "UPDATED",
      });
    }

    if (report.errors.length > 0) {
      return {
        success: false,

        error:
          report.errors.join(
            " | ",
          ),

        report,
      };
    }

    return {
      success: true,

      report,
    };
  }

  /* ==========================================================
     MANUAL RESEND
  ========================================================== */

  async requestManualResend(
    inputScope:
      NotificationCenterScope,

    sourceDeliveryId:
      NotificationDeliveryId,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    NotificationManualResendResult
  > {
    const scope =
      normalizeScope(
        inputScope,
      );

    const result =
      await notificationManualResendService
        .requestResend(
          scope,

          {
            sourceDeliveryId:
              normalizeString(
                sourceDeliveryId,
              ),

            resendRequestedAt:
              new Date().toISOString(),
          },

          options,
        );

    if (result.success) {
      notificationDeliveryLifecycle
        .refresh();
    }

    return result;
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const notificationCenterService =
  new NotificationCenterService();

/* ============================================================
   END
============================================================ */