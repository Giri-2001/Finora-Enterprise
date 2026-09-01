// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION DATA CHANGE SIGNAL
//
// RESPONSIBILITY:
//
// - Publish renderer-local Notification data change signals.
// - Allow Notification Center and global unread badge refresh.
// - Preserve Owner / Business / Branch scope in every signal.
// - Avoid scattering raw browser event names across the app.
//
// IMPORTANT:
//
// - No persistence.
// - No repositories.
// - No provider calls.
// - No React.
// - No localStorage.
// - No sessionStorage.
// - No Electron IPC.
// - This signal is advisory UI refresh coordination only.
// - A failed/malformed signal must never affect persisted data.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   EVENT
============================================================ */

export const FINORA_NOTIFICATION_DATA_CHANGED_EVENT =
  "FINORA_NOTIFICATION_DATA_CHANGED" as const;

/* ============================================================
   CHANGE CONTRACT
============================================================ */

export type NotificationDataChangeResource =
  | "NOTIFICATION"
  | "DELIVERY";

export type NotificationDataChangeOperation =
  | "CREATED"
  | "UPDATED";

export interface NotificationDataChangeDetail {
  ownerId: string;

  businessId: string;

  branchId: string;

  resource:
    NotificationDataChangeResource;

  operation:
    NotificationDataChangeOperation;

  notificationId?: string;

  deliveryId?: string;
}

/* ============================================================
   LISTENER
============================================================ */

export type NotificationDataChangeListener =
  (
    detail:
      NotificationDataChangeDetail,
  ) => void;

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

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isResource(
  value:
    unknown,
): value is NotificationDataChangeResource {
  return (
    value ===
      "NOTIFICATION" ||
    value ===
      "DELIVERY"
  );
}

function isOperation(
  value:
    unknown,
): value is NotificationDataChangeOperation {
  return (
    value ===
      "CREATED" ||
    value ===
      "UPDATED"
  );
}

function normalizeRequiredString(
  value:
    unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return normalizeString(
    value,
  );
}

function normalizeOptionalString(
  value:
    unknown,
): string | undefined {
  const normalized =
    normalizeRequiredString(
      value,
    );

  return (
    normalized ||
    undefined
  );
}

function normalizeDetail(
  detail:
    unknown,
): NotificationDataChangeDetail | undefined {
  if (
    !isRecord(
      detail,
    )
  ) {
    return undefined;
  }

  const ownerId =
    normalizeRequiredString(
      detail.ownerId,
    );

  const businessId =
    normalizeRequiredString(
      detail.businessId,
    );

  const branchId =
    normalizeRequiredString(
      detail.branchId,
    );

  if (
    !ownerId ||
    !businessId ||
    !branchId ||
    !isResource(
      detail.resource,
    ) ||
    !isOperation(
      detail.operation,
    )
  ) {
    return undefined;
  }

  const notificationId =
    normalizeOptionalString(
      detail.notificationId,
    );

  const deliveryId =
    normalizeOptionalString(
      detail.deliveryId,
    );

  return {
    ownerId,

    businessId,

    branchId,

    resource:
      detail.resource,

    operation:
      detail.operation,

    ...(notificationId
      ? {
          notificationId,
        }
      : {}),

    ...(deliveryId
      ? {
          deliveryId,
        }
      : {}),
  };
}

/* ============================================================
   EMIT
============================================================ */

export function emitNotificationDataChanged(
  detail:
    NotificationDataChangeDetail,
): boolean {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  const normalizedDetail =
    normalizeDetail(
      detail,
    );

  if (!normalizedDetail) {
    return false;
  }

  try {
    window.dispatchEvent(
      new CustomEvent<NotificationDataChangeDetail>(
        FINORA_NOTIFICATION_DATA_CHANGED_EVENT,

        {
          detail:
            normalizedDetail,
        },
      ),
    );

    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   SUBSCRIBE
============================================================ */

export function subscribeNotificationDataChanged(
  listener:
    NotificationDataChangeListener,
): () => void {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {};
  }

  const handler =
    (
      event:
        Event,
    ): void => {
      if (
        typeof CustomEvent ===
          "undefined" ||
        !(event instanceof CustomEvent)
      ) {
        return;
      }

      const detail =
        normalizeDetail(
          event.detail,
        );

      if (!detail) {
        return;
      }

      listener(
        detail,
      );
    };

  window.addEventListener(
    FINORA_NOTIFICATION_DATA_CHANGED_EVENT,

    handler,
  );

  return () => {
    window.removeEventListener(
      FINORA_NOTIFICATION_DATA_CHANGED_EVENT,

      handler,
    );
  };
}

/* ============================================================
   SCOPE MATCH
============================================================ */

export function notificationDataChangeMatchesScope(
  detail:
    NotificationDataChangeDetail,

  scope: {
    ownerId: string;

    businessId: string;

    branchId: string;
  },
): boolean {
  return (
    normalizeString(
      detail.ownerId,
    ) ===
      normalizeString(
        scope.ownerId,
      ) &&
    normalizeString(
      detail.businessId,
    ) ===
      normalizeString(
        scope.businessId,
      ) &&
    normalizeString(
      detail.branchId,
    ) ===
      normalizeString(
        scope.branchId,
      )
  );
}

/* ============================================================
   END
============================================================ */