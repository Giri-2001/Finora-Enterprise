// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// NOTIFICATION GENERATION IDENTITY
//
// RESPONSIBILITY:
//
// - Build deterministic scheduled Loan Notification IDs.
// - Build deterministic initial Customer Delivery IDs.
// - Prevent duplicate generation across restart / catch-up runs.
// - Keep mutable Loan values out of durable identity.
// - Reserve separate identity space for future manual resends.
//
// IMPORTANT:
//
// - PURE IDENTITY LOGIC ONLY.
// - No storage access.
// - No scheduler execution.
// - No provider calls.
// - No Notification persistence.
// - No Delivery persistence.
// - No UI.
// - No random IDs.
// - No Customer names, phone numbers, or email addresses.
// - Rule basis is intentionally excluded from Notification ID.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  CustomerNotificationChannel,
  NotificationAudience,
  NotificationDeliveryId,
  NotificationEventType,
  NotificationId,
} from "../../../types/notifications/notification.types";

/* ============================================================
   SCHEDULE SLOT
============================================================ */

/**
 * Semantic scheduler slots.
 *
 * Scheduler configuration later maps:
 *
 * MORNING -> 09:00
 * EVENING -> 20:00
 *
 * The semantic slot remains stable even if scheduler execution
 * implementation changes.
 */
export type ScheduledNotificationSlot =
  | "MORNING"
  | "EVENING";

/* ============================================================
   LOAN REMINDER EVENT
============================================================ */

export type ScheduledLoanNotificationEventType =
  Extract<
    NotificationEventType,
    "LOAN_DUE" | "LOAN_OVERDUE" | "LOAN_MATURITY"
  >;

/* ============================================================
   SCHEDULED LOAN IDENTITY INPUT
============================================================ */

export interface ScheduledLoanNotificationIdentityInput {
  ownerId: string;

  businessId: string;

  branchId: string;

  audience: NotificationAudience;

  customerId: string;

  loanId: string;

  eventType:
    ScheduledLoanNotificationEventType;

  /**
   * Business-local calendar date in YYYY-MM-DD form.
   *
   * This is a calendar identity, not a UTC instant.
   */
  calendarDate: string;

  slot: ScheduledNotificationSlot;
}

/* ============================================================
   INITIAL DELIVERY IDENTITY INPUT
============================================================ */

export interface InitialNotificationDeliveryIdentityInput {
  notificationId: NotificationId;

  channel: CustomerNotificationChannel;
}

/* ============================================================
   BUILD RESULT
============================================================ */

export type NotificationIdentityBuildResult<TId extends string> =
  | {
      success: true;

      id: TId;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   CANONICAL VALUES
============================================================ */

const VALID_AUDIENCES:
  readonly NotificationAudience[] = [
    "OWNER",
    "CUSTOMER",
  ];

const VALID_LOAN_EVENTS:
  readonly ScheduledLoanNotificationEventType[] = [
    "LOAN_DUE",
    "LOAN_OVERDUE",
    "LOAN_MATURITY",
  ];

const VALID_SLOTS:
  readonly ScheduledNotificationSlot[] = [
    "MORNING",
    "EVENING",
  ];

const VALID_CUSTOMER_CHANNELS:
  readonly CustomerNotificationChannel[] = [
    "SMS",
    "WHATSAPP",
    "EMAIL",
  ];

/* ============================================================
   STRING NORMALIZATION
============================================================ */

function normalizeString(
  value: string,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   ID SEGMENT
============================================================ */

function encodeIdentitySegment(
  value: string,
): string {
  return encodeURIComponent(
    normalizeString(value),
  );
}

/* ============================================================
   CALENDAR DATE VALIDATION
============================================================ */

function isValidCalendarDate(
  value: string,
): boolean {
  const normalized =
    normalizeString(value);

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalized,
    );

  if (!match) {
    return false;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    year < 1000 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  const validationDate =
    new Date(
      year,
      month - 1,
      day,
    );

  return (
    validationDate.getFullYear() === year &&
    validationDate.getMonth() === month - 1 &&
    validationDate.getDate() === day
  );
}

/* ============================================================
   SCHEDULED LOAN NOTIFICATION ID
============================================================ */

export function buildScheduledLoanNotificationId(
  input: ScheduledLoanNotificationIdentityInput,
): NotificationIdentityBuildResult<NotificationId> {
  const ownerId =
    normalizeString(input.ownerId);

  const businessId =
    normalizeString(input.businessId);

  const branchId =
    normalizeString(input.branchId);

  const customerId =
    normalizeString(input.customerId);

  const loanId =
    normalizeString(input.loanId);

  const calendarDate =
    normalizeString(input.calendarDate);

  if (!ownerId) {
    return {
      success: false,

      error:
        "Owner ID is required to build scheduled Notification identity.",
    };
  }

  if (!businessId) {
    return {
      success: false,

      error:
        "Business ID is required to build scheduled Notification identity.",
    };
  }

  if (!branchId) {
    return {
      success: false,

      error:
        "Branch ID is required to build scheduled Notification identity.",
    };
  }

  if (!customerId) {
    return {
      success: false,

      error:
        "Customer ID is required to build scheduled Notification identity.",
    };
  }

  if (!loanId) {
    return {
      success: false,

      error:
        "Loan ID is required to build scheduled Notification identity.",
    };
  }

  if (
    !VALID_AUDIENCES.includes(
      input.audience,
    )
  ) {
    return {
      success: false,

      error:
        "Notification audience is invalid for scheduled Notification identity.",
    };
  }

  if (
    !VALID_LOAN_EVENTS.includes(
      input.eventType,
    )
  ) {
    return {
      success: false,

      error:
        "Notification event is invalid for scheduled Loan Notification identity.",
    };
  }

  if (!isValidCalendarDate(calendarDate)) {
    return {
      success: false,

      error:
        "Business-local calendar date is invalid for scheduled Notification identity.",
    };
  }

  if (
    !VALID_SLOTS.includes(
      input.slot,
    )
  ) {
    return {
      success: false,

      error:
        "Scheduler slot is invalid for scheduled Notification identity.",
    };
  }

  const id =
    [
      "NTF",
      ownerId,
      businessId,
      branchId,
      input.audience,
      customerId,
      loanId,
      input.eventType,
      calendarDate,
      input.slot,
    ]
      .map(encodeIdentitySegment)
      .join("::");

  return {
    success: true,

    id,
  };
}

/* ============================================================
   INITIAL CUSTOMER DELIVERY ID
============================================================ */

export function buildInitialNotificationDeliveryId(
  input: InitialNotificationDeliveryIdentityInput,
): NotificationIdentityBuildResult<NotificationDeliveryId> {
  const notificationId =
    normalizeString(input.notificationId);

  if (!notificationId) {
    return {
      success: false,

      error:
        "Notification ID is required to build initial Delivery identity.",
    };
  }

  if (
    !VALID_CUSTOMER_CHANNELS.includes(
      input.channel,
    )
  ) {
    return {
      success: false,

      error:
        "Customer Notification channel is invalid for initial Delivery identity.",
    };
  }

  const id =
    [
      "DLV",
      notificationId,
      input.channel,
      "INITIAL",
    ]
      .map(encodeIdentitySegment)
      .join("::");

  return {
    success: true,

    id,
  };
}

/* ============================================================
   END
============================================================ */
