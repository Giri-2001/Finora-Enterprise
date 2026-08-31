// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// NOTIFICATION REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist canonical Notification records through StorageManager.
// - Preserve Owner / Business / Branch isolation.
// - Support Notification Center reads.
// - Support owner unread-count queries.
// - Keep Notification domain contracts storage-independent.
// - Use explicit NOTIFICATION entity persistence.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No scheduler rules.
// - No Loan eligibility rules.
// - No SMS / WhatsApp / Email provider logic.
// - No delivery retry logic.
// - Delivery records belong to NotificationDeliveryRepository.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  NotificationId,
  NotificationRecord,
} from "../../types/notifications/notification.types";

import {
  NOTIFICATION_ENTITY,
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

export interface NotificationRepositoryScope {
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
  scope: NotificationRepositoryScope,
): NotificationRepositoryScope {
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
  scope: NotificationRepositoryScope,
): string | undefined {
  if (!scope.ownerId) {
    return "Owner ID is required for Notification persistence.";
  }

  if (!scope.businessId) {
    return "Business ID is required for Notification persistence.";
  }

  if (!scope.branchId) {
    return "Branch ID is required for Notification persistence.";
  }

  return undefined;
}

/* ============================================================
   RECORD VALIDATION
============================================================ */

function validateNotificationRecord(
  scope: NotificationRepositoryScope,

  notification: NotificationRecord,
): string | undefined {
  const normalizedId = normalizeString(notification.id);

  const normalizedNotificationId =
    normalizeString(notification.notificationId);

  if (!normalizedId) {
    return "Notification ID is required.";
  }

  if (!normalizedNotificationId) {
    return "Notification compatibility ID is required.";
  }

  if (normalizedId !== normalizedNotificationId) {
    return "Notification id and notificationId must match.";
  }

  if (notification.entity !== NOTIFICATION_ENTITY) {
    return "Notification entity marker is invalid.";
  }

  if (normalizeString(notification.ownerId) !== scope.ownerId) {
    return "Notification Owner ID does not match the repository scope.";
  }

  if (normalizeString(notification.businessId) !== scope.businessId) {
    return "Notification Business ID does not match the repository scope.";
  }

  if (normalizeString(notification.branchId) !== scope.branchId) {
    return "Notification Branch ID does not match the repository scope.";
  }

  return undefined;
}

/* ============================================================
   SCOPE MATCH
============================================================ */

function belongsToScope(
  scope: NotificationRepositoryScope,

  notification: NotificationRecord,
): boolean {
  return (
    notification.entity === NOTIFICATION_ENTITY &&
    normalizeString(notification.ownerId) === scope.ownerId &&
    normalizeString(notification.businessId) === scope.businessId &&
    normalizeString(notification.branchId) === scope.branchId
  );
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildNotificationQuery(
  notificationId?: NotificationId,
): StorageQuery {
  return {
    entity: NOTIFICATION_ENTITY,

    id: notificationId,
  };
}

/* ============================================================
   REPOSITORY
============================================================ */

export class NotificationRepository {
  /* ==========================================================
     FIND ALL
  ========================================================== */

  async findAll(
    scope: NotificationRepositoryScope,
  ): Promise<StorageResult<NotificationRecord[]>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const result =
      await storageManager.getAll<NotificationRecord>(
        buildNotificationQuery(),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Notifications.",
      };
    }

    const notifications = (result.data ?? [])
      .filter((notification) =>
        belongsToScope(
          normalizedScope,

          notification,
        ),
      )
      .sort((left, right) =>
        String(right.createdAt).localeCompare(
          String(left.createdAt),
        ),
      );

    return {
      success: true,

      data: notifications,
    };
  }

  /* ==========================================================
     FIND BY ID
  ========================================================== */

  async findById(
    scope: NotificationRepositoryScope,

    notificationId: NotificationId,
  ): Promise<StorageResult<NotificationRecord | undefined>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const normalizedNotificationId =
      normalizeString(notificationId);

    if (!normalizedNotificationId) {
      return {
        success: false,

        error: "Notification ID is required.",
      };
    }

    const result =
      await storageManager.get<NotificationRecord>(
        buildNotificationQuery(
          normalizedNotificationId,
        ),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load Notification.",
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
     FIND OWNER NOTIFICATIONS
  ========================================================== */

  async findOwnerNotifications(
    scope: NotificationRepositoryScope,
  ): Promise<StorageResult<NotificationRecord[]>> {
    const allResult = await this.findAll(scope);

    if (!allResult.success) {
      return {
        success: false,

        error:
          allResult.error ??
          "Unable to load owner Notifications.",
      };
    }

    return {
      success: true,

      data: (allResult.data ?? []).filter(
        (notification) =>
          notification.audience === "OWNER",
      ),
    };
  }

  /* ==========================================================
     FIND UNREAD OWNER NOTIFICATIONS
  ========================================================== */

  async findUnreadOwnerNotifications(
    scope: NotificationRepositoryScope,
  ): Promise<StorageResult<NotificationRecord[]>> {
    const ownerResult =
      await this.findOwnerNotifications(scope);

    if (!ownerResult.success) {
      return {
        success: false,

        error:
          ownerResult.error ??
          "Unable to load unread owner Notifications.",
      };
    }

    return {
      success: true,

      data: (ownerResult.data ?? []).filter(
        (notification) =>
          notification.readState === "UNREAD",
      ),
    };
  }

  /* ==========================================================
     COUNT UNREAD OWNER NOTIFICATIONS
  ========================================================== */

  async countUnreadOwnerNotifications(
    scope: NotificationRepositoryScope,
  ): Promise<StorageResult<number>> {
    const unreadResult =
      await this.findUnreadOwnerNotifications(scope);

    if (!unreadResult.success) {
      return {
        success: false,

        error:
          unreadResult.error ??
          "Unable to count unread owner Notifications.",
      };
    }

    return {
      success: true,

      data: (unreadResult.data ?? []).length,
    };
  }

  /* ==========================================================
     FIND BY LOAN ID
  ========================================================== */

  async findByLoanId(
    scope: NotificationRepositoryScope,

    loanId: string,
  ): Promise<StorageResult<NotificationRecord[]>> {
    const normalizedLoanId =
      normalizeString(loanId);

    if (!normalizedLoanId) {
      return {
        success: false,

        error:
          "Loan ID is required to load Loan Notifications.",
      };
    }

    const allResult = await this.findAll(scope);

    if (!allResult.success) {
      return {
        success: false,

        error:
          allResult.error ??
          "Unable to load Loan Notifications.",
      };
    }

    return {
      success: true,

      data: (allResult.data ?? []).filter(
        (notification) =>
          normalizeString(
            notification.source.loanId ?? "",
          ) === normalizedLoanId,
      ),
    };
  }

  /* ==========================================================
     SAVE
  ========================================================== */

  async save(
    scope: NotificationRepositoryScope,

    notification: NotificationRecord,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<NotificationRecord>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const recordError =
      validateNotificationRecord(
        normalizedScope,

        notification,
      );

    if (recordError) {
      return {
        success: false,

        error: recordError,
      };
    }

    const existing = await this.findById(
      normalizedScope,

      notification.id,
    );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Notification.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error: "Notification already exists.",
      };
    }

    const result =
      await storageManager.save<NotificationRecord>(
        notification,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to save Notification.",
      };
    }

    return {
      success: true,

      data: notification,
    };
  }

  /* ==========================================================
     UPDATE
  ========================================================== */

  async update(
    scope: NotificationRepositoryScope,

    notification: NotificationRecord,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<NotificationRecord>> {
    const normalizedScope = normalizeScope(scope);

    const scopeError = validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    const recordError =
      validateNotificationRecord(
        normalizedScope,

        notification,
      );

    if (recordError) {
      return {
        success: false,

        error: recordError,
      };
    }

    const existing = await this.findById(
      normalizedScope,

      notification.id,
    );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify Notification.",
      };
    }

    if (!existing.data) {
      return {
        success: false,

        error: "Notification was not found.",
      };
    }

    const result =
      await storageManager.update<NotificationRecord>(
        notification,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to update Notification.",
      };
    }

    return {
      success: true,

      data: notification,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const notificationRepository =
  new NotificationRepository();

/* ============================================================
   END
============================================================ */
