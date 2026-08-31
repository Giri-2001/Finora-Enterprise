// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// SCHEDULED LOAN NOTIFICATION PRIORITY
//
// RESPONSIBILITY:
//
// - Resolve canonical priority for scheduled Loan reminders.
// - Keep reminder severity explicit and deterministic.
// - Avoid inheriting old UI scaffold defaults.
//
// IMPORTANT:
//
// - PURE POLICY ONLY.
// - No storage access.
// - No scheduler execution.
// - No provider calls.
// - No Notification persistence.
// - No UI.
// - CRITICAL is intentionally reserved for future critical events.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  NotificationPriority,
} from "../../../types/notifications/notification.types";

import type {
  ScheduledLoanNotificationEventType,
} from "./notificationGenerationIdentity";

/* ============================================================
   PRIORITY POLICY
============================================================ */

/**
 * Scheduled Loan reminder priority policy:
 *
 * LOAN_DUE
 *   Normal same-day payment reminder.
 *
 * LOAN_OVERDUE
 *   High priority because the contractual payment date
 *   has already passed.
 *
 * LOAN_MATURITY
 *   High priority because contractual Loan maturity
 *   is reached while an outstanding balance still exists.
 *
 * CRITICAL is deliberately not assigned to normal scheduled
 * Loan reminders.
 */
export function resolveScheduledLoanNotificationPriority(
  eventType:
    ScheduledLoanNotificationEventType,
): NotificationPriority {
  switch (eventType) {
    case "LOAN_DUE":
      return "NORMAL";

    case "LOAN_OVERDUE":
      return "HIGH";

    case "LOAN_MATURITY":
      return "HIGH";
  }
}

/* ============================================================
   END
============================================================ */
