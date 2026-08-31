// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// NOTIFICATION DELIVERY REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist customer delivery records through StorageManager.
// - Preserve Owner / Business / Branch isolation.
// - Track SMS / WhatsApp / Email delivery lifecycle.
// - Support retry / resend / delivery-status queries.
// - Keep delivery persistence separate from logical Notifications.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No provider API calls.
// - No scheduler eligibility rules.
// - No fake-success behavior.
// - Retry timing decisions belong to Delivery Service.
// - Storage access goes only through StorageManager.
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
  NotificationId,
} from "../../types/notifications/notification.types";

import {
  NOTIFICATION_DELIVERY_ENTITY,
} from "../../types/notifications/notification.types";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

import type {
  RepositoryWriteOptions,
} from "../repository.types";

/* ============================================================
   SCOPE
============================================================ */

export interface NotificationDeliveryRepositoryScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(value: string): string {
  return String(value ?? "").trim();
}

function normalizeScope(
  scope: NotificationDeliveryRepositoryScope,
): NotificationDeliveryRepositoryScope {
  return {
    ownerId: normalizeString(scope.ownerId),

    businessId: normalizeString(scope.businessId),

    branchId: normalizeString(scope.branchId),
  };
}

/* ============================================================
   SCOPE VALIDATION
============================================================ */

function validateScope(
  scope: NotificationDeliveryRepositoryScope,
): string | undefined {
  if (!scope.ownerId) {
    return "Owner ID is required for Notification delivery persistence.";
  }

  if (!scope.businessId) {
    return "Business ID is required for Notification delivery persistence.";
  }

  if (!scope.branchId) {
    return "Branch ID is required for Notification delivery persistence.";
  }

  return undefined;
}

/* ============================================================
   RECORD VALIDATION
============================================================ */

function validateDeliveryRecord(
  scope: NotificationDeliveryRepositoryScope,

  delivery: NotificationDeliveryRecord,
): string | undefined {
  if (!normalizeString(delivery.id)) {
    return "Notification Delivery ID is required.";
  }

  if (!normalizeString(delivery.notificationId)) {
    return "Notification ID is required for a delivery record.";
  }

  if (delivery.entity !== NOTIFICATION_DELIVERY_ENTITY) {
    return "Notification Delivery entity marker is invalid.";
  }

  if (normalizeString(delivery.ownerId) !== scope.ownerId) {
    return "Notification Delivery Owner ID does not match the repository scope.";
  }

  if (normalizeString(delivery.businessId) !== scope.businessId) {
    return "Notification Delivery Business ID does not match the repository scope.";
  }

  if (normalizeString(delivery.branchId) !== scope.branchId) {
    return "Notification Delivery Branch ID does not match the repository scope.";
  }

  if (!normalizeString(delivery.recipient.customerId)) {
    return "Customer ID is required for Notification delivery.";
  }

  if (
    !Number.isInteger(delivery.attemptCount) ||
    delivery.attemptCount < 0
  ) {
    return "Notification Delivery attempt count is invalid.";
  }

  return undefined;
}

/* ============================================================
   SCOPE MATCH
============================================================ */

function belongsToScope(
  scope: NotificationDeliveryRepositoryScope,

  delivery: NotificationDeliveryRecord,
): boolean {
  return (
    delivery.entity === NOTIFICATION_DELIVERY_ENTITY &&
    normalizeString(delivery.ownerId) === scope.ownerId &&
    normalizeString(delivery.businessId) === scope.businessId &&
    normalizeString(delivery.branchId) === scope.branchId
  );
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildDeliveryQuery(
  deliveryId?: NotificationDeliveryId,
): StorageQuery {
  return {
    entity: NOTIFICATION_DELIVERY_ENTITY,

    id: deliveryId,
  };
}

/* ============================================================
   REPOSITORY
============================================================ */

export class NotificationDeliveryRepository {
  /* ==========================================================
     FIND ALL
  ========================================================== */

  async findAll(
    scope: NotificationDeliveryRepositoryScope,
  ): Promise<StorageResult<NotificationDeliveryRecord[]>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const result =
      await storageManager.getAll<NotificationDeliveryRecord>(
        buildDeliveryQuery(),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Notification deliveries.",
      };
    }

    const deliveries = (result.data ?? [])
      .filter((delivery) =>
        belongsToScope(
          normalizedScope,

          delivery,
        ),
      )
      .sort((left, right) =>
        String(right.createdAt).localeCompare(
          String(left.createdAt),
        ),
      );

    return {
      success: true,

      data: deliveries,
    };
  }

  /* ==========================================================
     FIND BY ID
  ========================================================== */

  async findById(
    scope: NotificationDeliveryRepositoryScope,

    deliveryId: NotificationDeliveryId,
  ): Promise<StorageResult<NotificationDeliveryRecord | undefined>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const normalizedDeliveryId =
      normalizeString(deliveryId);

    if (!normalizedDeliveryId) {
      return {
        success: false,

        error: "Notification Delivery ID is required.",
      };
    }

    const result =
      await storageManager.get<NotificationDeliveryRecord>(
        buildDeliveryQuery(
          normalizedDeliveryId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Notification delivery.",
      };
    }

    if (!result.data) {
      return {
        success: true,

        data: undefined,
      };
    }

    if (
      !belongsToScope(
        normalizedScope,

        result.data,
      )
    ) {
      return {
        success: true,

        data: undefined,
      };
    }

    return {
      success: true,

      data: result.data,
    };
  }

  /* ==========================================================
     FIND BY NOTIFICATION ID
  ========================================================== */

  async findByNotificationId(
    scope: NotificationDeliveryRepositoryScope,

    notificationId: NotificationId,
  ): Promise<StorageResult<NotificationDeliveryRecord[]>> {
    const normalizedNotificationId =
      normalizeString(notificationId);

    if (!normalizedNotificationId) {
      return {
        success: false,

        error:
          "Notification ID is required to load delivery records.",
      };
    }

    const allResult = await this.findAll(scope);

    if (!allResult.success) {
      return {
        success: false,

        error:
          allResult.error ??
          "Unable to load Notification delivery records.",
      };
    }

    return {
      success: true,

      data: (allResult.data ?? []).filter(
        (delivery) =>
          normalizeString(delivery.notificationId) ===
          normalizedNotificationId,
      ),
    };
  }

  /* ==========================================================
     FIND BY STATUS
  ========================================================== */

  async findByStatus(
    scope: NotificationDeliveryRepositoryScope,

    status: NotificationDeliveryStatus,
  ): Promise<StorageResult<NotificationDeliveryRecord[]>> {
    const allResult = await this.findAll(scope);

    if (!allResult.success) {
      return {
        success: false,

        error:
          allResult.error ??
          "Unable to load Notification deliveries by status.",
      };
    }

    return {
      success: true,

      data: (allResult.data ?? []).filter(
        (delivery) =>
          delivery.status === status,
      ),
    };
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  async save(
    scope: NotificationDeliveryRepositoryScope,

    delivery: NotificationDeliveryRecord,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<NotificationDeliveryRecord>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const recordError =
      validateDeliveryRecord(
        normalizedScope,

        delivery,
      );

    if (recordError) {
      return {
        success: false,

        error: recordError,
      };
    }

    const existing = await this.findById(
      normalizedScope,

      delivery.id,
    );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Notification delivery.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error:
          "Notification delivery already exists.",
      };
    }

    const result =
      await storageManager.save<NotificationDeliveryRecord>(
        delivery,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Notification delivery.",
      };
    }

    return {
      success: true,

      data: delivery,
    };
  }

  /* ==========================================================
     UPDATE
  ========================================================== */

  async update(
    scope: NotificationDeliveryRepositoryScope,

    delivery: NotificationDeliveryRecord,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<NotificationDeliveryRecord>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const recordError =
      validateDeliveryRecord(
        normalizedScope,

        delivery,
      );

    if (recordError) {
      return {
        success: false,

        error: recordError,
      };
    }

    const existing = await this.findById(
      normalizedScope,

      delivery.id,
    );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify Notification delivery.",
      };
    }

    if (!existing.data) {
      return {
        success: false,

        error:
          "Notification delivery was not found.",
      };
    }

    const result =
      await storageManager.update<NotificationDeliveryRecord>(
        delivery,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Notification delivery.",
      };
    }

    return {
      success: true,

      data: delivery,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const notificationDeliveryRepository =
  new NotificationDeliveryRepository();

/* ============================================================
   END
============================================================ */
