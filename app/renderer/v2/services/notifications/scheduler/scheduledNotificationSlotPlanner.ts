// ============================================================
// FINORA ENTERPRISE OS(TM)
//
// NOTIFICATIONS ENGINE(TM)
// SCHEDULED NOTIFICATION SLOT PLANNER
//
// RESPONSIBILITY:
//
// - Resolve the current business-local calendar date
// - Identify scheduler slots already due for that calendar date
// - Resolve the next canonical scheduler slot
// - Support deterministic startup / resume catch-up planning
//
// IMPORTANT:
//
// - Pure planning only.
// - No timers.
// - No storage access.
// - No orchestration.
// - No provider calls.
// - No React.
// - Persisted Business Settings time zone is authoritative.
// - Device-local time is never scheduler authority.
// - Due-slot planning is limited to the current business-local day.
// - Repeated due-slot execution is safe because durable generation
//   identity provides restart / catch-up deduplication.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  ScheduledNotificationSlot,
} from "../generation/notificationGenerationIdentity";

import {
  getBusinessCalendarDate,
  resolveScheduledNotificationClock,
} from "./scheduledNotificationClock";

import type {
  ScheduledNotificationClockResolution,
} from "./scheduledNotificationClock";

/* ============================================================
   TYPES
============================================================ */

export interface ScheduledNotificationSlotPlannerInput {
  timeZone: string;

  /**
   * Actual scheduler evaluation time.
   *
   * Defaults to Date.now() when omitted.
   */
  now?:
    string | number | Date;
}

export interface ScheduledNotificationSlotPlan {
  timeZone: string;

  /**
   * Actual evaluation timestamp.
   */
  evaluatedAt: string;

  /**
   * Business-local calendar date containing evaluatedAt.
   */
  calendarDate: string;

  /**
   * Current-day slots whose canonical scheduledFor instant
   * is less than or equal to evaluatedAt.
   */
  dueSlots:
    ScheduledNotificationClockResolution[];

  /**
   * First canonical scheduler slot strictly after evaluatedAt.
   */
  nextSlot:
    ScheduledNotificationClockResolution;
}

export type ScheduledNotificationSlotPlannerResult =
  | {
      success: true;

      data:
        ScheduledNotificationSlotPlan;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   SLOT ORDER
============================================================ */

const SLOT_ORDER:
  readonly ScheduledNotificationSlot[] = [
    "MORNING",
    "EVENING",
  ];

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   NOW
============================================================ */

function resolveNowTimestamp(
  value:
    string | number | Date | undefined,
): number | undefined {
  if (value === undefined) {
    return Date.now();
  }

  if (value instanceof Date) {
    const timestamp =
      value.getTime();

    return Number.isFinite(timestamp)
      ? timestamp
      : undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : undefined;
  }

  const normalized =
    normalizeString(value);

  if (!normalized) {
    return undefined;
  }

  const timestamp =
    new Date(
      normalized,
    ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : undefined;
}

/* ============================================================
   NEXT CALENDAR DATE
============================================================ */

function getNextCalendarDate(
  calendarDate:
    string,
): string | undefined {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalizeString(
        calendarDate,
      ),
    );

  if (!match) {
    return undefined;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  date.setUTCDate(
    date.getUTCDate() + 1,
  );

  const nextYear =
    date.getUTCFullYear();

  const nextMonth =
    String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const nextDay =
    String(
      date.getUTCDate(),
    ).padStart(
      2,
      "0",
    );

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/* ============================================================
   PLANNER
============================================================ */

export function planScheduledNotificationSlots(
  input:
    ScheduledNotificationSlotPlannerInput,
): ScheduledNotificationSlotPlannerResult {
  const timeZone =
    normalizeString(
      input.timeZone,
    );

  if (!timeZone) {
    return {
      success: false,

      error:
        "Business time zone is required for scheduled Notification slot planning.",
    };
  }

  const nowTimestamp =
    resolveNowTimestamp(
      input.now,
    );

  if (nowTimestamp === undefined) {
    return {
      success: false,

      error:
        "Scheduler evaluation timestamp is invalid.",
    };
  }

  const evaluatedAt =
    new Date(
      nowTimestamp,
    ).toISOString();

  const calendarDate =
    getBusinessCalendarDate(
      nowTimestamp,
      timeZone,
    );

  if (!calendarDate) {
    return {
      success: false,

      error:
        "Unable to resolve the business-local scheduler calendar date.",
    };
  }

  const dueSlots:
    ScheduledNotificationClockResolution[] = [];

  let nextSlot:
    ScheduledNotificationClockResolution | undefined;

  for (const slot of SLOT_ORDER) {
    const resolution =
      resolveScheduledNotificationClock({
        timeZone,

        calendarDate,

        slot,
      });

    if (!resolution.success) {
      return {
        success: false,

        error:
          resolution.error,
      };
    }

    const scheduledTimestamp =
      new Date(
        resolution.data.scheduledFor,
      ).getTime();

    if (
      scheduledTimestamp <=
      nowTimestamp
    ) {
      dueSlots.push(
        resolution.data,
      );

      continue;
    }

    if (!nextSlot) {
      nextSlot =
        resolution.data;
    }
  }

  if (!nextSlot) {
    const nextCalendarDate =
      getNextCalendarDate(
        calendarDate,
      );

    if (!nextCalendarDate) {
      return {
        success: false,

        error:
          "Unable to resolve the next business-local scheduler calendar date.",
      };
    }

    const resolution =
      resolveScheduledNotificationClock({
        timeZone,

        calendarDate:
          nextCalendarDate,

        slot:
          "MORNING",
      });

    if (!resolution.success) {
      return {
        success: false,

        error:
          resolution.error,
      };
    }

    nextSlot =
      resolution.data;
  }

  return {
    success: true,

    data: {
      timeZone,

      evaluatedAt,

      calendarDate,

      dueSlots,

      nextSlot,
    },
  };
}

/* ============================================================
   END
============================================================ */