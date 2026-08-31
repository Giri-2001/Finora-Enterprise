// ============================================================
// FINORA ENTERPRISE OS(TM)
//
// NOTIFICATIONS ENGINE(TM)
// SCHEDULED NOTIFICATION CLOCK
//
// RESPONSIBILITY:
//
// - Define canonical MORNING / EVENING scheduler clock mapping
// - Resolve business-local calendar dates in an IANA time zone
// - Convert a business-local scheduler slot into a canonical instant
// - Keep scheduler clock calculations independent from device time zone
//
// IMPORTANT:
//
// - MORNING = 09:00 business-local time.
// - EVENING = 20:00 business-local time.
// - Persisted Business Settings time zone is authoritative.
// - No implicit device-time-zone fallback.
// - No timers.
// - No catch-up policy.
// - No orchestration.
// - No storage access.
// - No provider calls.
// - No React.
// - No UI.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import {
  isSupportedBusinessTimeZone,
} from "../../../constants/business/businessTimeZone.constants";

import type {
  ScheduledNotificationSlot,
} from "../generation/notificationGenerationIdentity";

/* ============================================================
   TYPES
============================================================ */

export interface ScheduledNotificationClockInput {
  timeZone: string;

  /**
   * Business-local calendar date.
   *
   * YYYY-MM-DD.
   */
  calendarDate: string;

  slot:
    ScheduledNotificationSlot;
}

export interface ScheduledNotificationClockResolution {
  timeZone: string;

  calendarDate: string;

  slot:
    ScheduledNotificationSlot;

  localHour: number;

  localMinute: number;

  /**
   * Canonical UTC instant representing the configured
   * business-local scheduler slot.
   */
  scheduledFor: string;
}

export type ScheduledNotificationClockResult =
  | {
      success: true;

      data:
        ScheduledNotificationClockResolution;
    }
  | {
      success: false;

      error: string;
    };

interface CalendarDateParts {
  year: number;

  month: number;

  day: number;
}

interface BusinessDateTimeParts
  extends CalendarDateParts {
  hour: number;

  minute: number;

  second: number;
}

/* ============================================================
   SLOT CLOCK
============================================================ */

const SCHEDULED_NOTIFICATION_SLOT_CLOCK:
  Readonly<
    Record<
      ScheduledNotificationSlot,
      {
        hour: number;

        minute: number;
      }
    >
  > = {
    MORNING: {
      hour: 9,

      minute: 0,
    },

    EVENING: {
      hour: 20,

      minute: 0,
    },
  };

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   CALENDAR DATE
============================================================ */

function parseCalendarDate(
  value: string,
): CalendarDateParts | undefined {
  const normalized =
    normalizeString(value);

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalized,
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

  if (
    year < 1000 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }

  const validationDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    return undefined;
  }

  return {
    year,

    month,

    day,
  };
}

function formatCalendarDate(
  parts:
    CalendarDateParts,
): string {
  const month =
    String(
      parts.month,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      parts.day,
    ).padStart(
      2,
      "0",
    );

  return `${parts.year}-${month}-${day}`;
}

/* ============================================================
   BUSINESS DATE-TIME PARTS
============================================================ */

function getBusinessDateTimeParts(
  timestamp:
    number,
  timeZone:
    string,
): BusinessDateTimeParts | undefined {
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  try {
    const parts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone,

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",

          hour:
            "2-digit",

          minute:
            "2-digit",

          second:
            "2-digit",

          hourCycle:
            "h23",
        },
      ).formatToParts(
        new Date(timestamp),
      );

    function readPart(
      type:
        Intl.DateTimeFormatPartTypes,
    ): number | undefined {
      const value =
        parts.find(
          (part) =>
            part.type === type,
        )?.value;

      if (!value) {
        return undefined;
      }

      const parsed =
        Number(value);

      return Number.isFinite(parsed)
        ? parsed
        : undefined;
    }

    const year =
      readPart("year");

    const month =
      readPart("month");

    const day =
      readPart("day");

    const hour =
      readPart("hour");

    const minute =
      readPart("minute");

    const second =
      readPart("second");

    if (
      year === undefined ||
      month === undefined ||
      day === undefined ||
      hour === undefined ||
      minute === undefined ||
      second === undefined
    ) {
      return undefined;
    }

    return {
      year,

      month,

      day,

      hour,

      minute,

      second,
    };
  } catch {
    return undefined;
  }
}

/* ============================================================
   BUSINESS CALENDAR DATE FROM INSTANT
============================================================ */

export function getBusinessCalendarDate(
  value:
    string | number | Date,
  timeZone:
    string,
): string | undefined {
  const normalizedTimeZone =
    normalizeString(
      timeZone,
    );

  if (
    !normalizedTimeZone ||
    !isSupportedBusinessTimeZone(
      normalizedTimeZone,
    )
  ) {
    return undefined;
  }

  const timestamp =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
        ? value
        : new Date(
            normalizeString(value),
          ).getTime();

  const parts =
    getBusinessDateTimeParts(
      timestamp,
      normalizedTimeZone,
    );

  if (!parts) {
    return undefined;
  }

  return formatCalendarDate(
    parts,
  );
}

/* ============================================================
   TIME-ZONE OFFSET
============================================================ */

function getTimeZoneOffsetMilliseconds(
  timestamp:
    number,
  timeZone:
    string,
): number | undefined {
  const parts =
    getBusinessDateTimeParts(
      timestamp,
      timeZone,
    );

  if (!parts) {
    return undefined;
  }

  const localPartsAsUtc =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );

  const timestampAtSecondPrecision =
    Math.floor(
      timestamp / 1000,
    ) * 1000;

  return (
    localPartsAsUtc -
    timestampAtSecondPrecision
  );
}

/* ============================================================
   LOCAL SLOT -> CANONICAL INSTANT
============================================================ */

function resolveBusinessLocalDateTimeToInstant(
  calendarDate:
    CalendarDateParts,
  hour:
    number,
  minute:
    number,
  timeZone:
    string,
): number | undefined {
  const targetAsUtc =
    Date.UTC(
      calendarDate.year,
      calendarDate.month - 1,
      calendarDate.day,
      hour,
      minute,
      0,
      0,
    );

  let candidate =
    targetAsUtc;

  for (
    let attempt = 0;
    attempt < 4;
    attempt += 1
  ) {
    const offset =
      getTimeZoneOffsetMilliseconds(
        candidate,
        timeZone,
      );

    if (offset === undefined) {
      return undefined;
    }

    const nextCandidate =
      targetAsUtc -
      offset;

    if (
      nextCandidate ===
      candidate
    ) {
      break;
    }

    candidate =
      nextCandidate;
  }

  const resolvedParts =
    getBusinessDateTimeParts(
      candidate,
      timeZone,
    );

  if (!resolvedParts) {
    return undefined;
  }

  if (
    resolvedParts.year !==
      calendarDate.year ||
    resolvedParts.month !==
      calendarDate.month ||
    resolvedParts.day !==
      calendarDate.day ||
    resolvedParts.hour !==
      hour ||
    resolvedParts.minute !==
      minute
  ) {
    return undefined;
  }

  return candidate;
}

/* ============================================================
   SLOT RESOLUTION
============================================================ */

export function resolveScheduledNotificationClock(
  input:
    ScheduledNotificationClockInput,
): ScheduledNotificationClockResult {
  const timeZone =
    normalizeString(
      input.timeZone,
    );

  if (!timeZone) {
    return {
      success: false,

      error:
        "Business time zone is required for scheduled Notification clock resolution.",
    };
  }

  if (
    !isSupportedBusinessTimeZone(
      timeZone,
    )
  ) {
    return {
      success: false,

      error:
        "Business time zone is invalid for scheduled Notification clock resolution.",
    };
  }

  const calendarDateParts =
    parseCalendarDate(
      input.calendarDate,
    );

  if (!calendarDateParts) {
    return {
      success: false,

      error:
        "Business-local calendar date is invalid for scheduled Notification clock resolution.",
    };
  }

  const slotClock =
    SCHEDULED_NOTIFICATION_SLOT_CLOCK[
      input.slot
    ];

  if (!slotClock) {
    return {
      success: false,

      error:
        "Scheduler slot is invalid for scheduled Notification clock resolution.",
    };
  }

  const scheduledTimestamp =
    resolveBusinessLocalDateTimeToInstant(
      calendarDateParts,
      slotClock.hour,
      slotClock.minute,
      timeZone,
    );

  if (
    scheduledTimestamp ===
    undefined
  ) {
    return {
      success: false,

      error:
        "Unable to resolve the business-local scheduler slot to a canonical timestamp.",
    };
  }

  return {
    success: true,

    data: {
      timeZone,

      calendarDate:
        formatCalendarDate(
          calendarDateParts,
        ),

      slot:
        input.slot,

      localHour:
        slotClock.hour,

      localMinute:
        slotClock.minute,

      scheduledFor:
        new Date(
          scheduledTimestamp,
        ).toISOString(),
    },
  };
}

/* ============================================================
   END
============================================================ */