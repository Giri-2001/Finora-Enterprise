/* ============================================================
   FINORA ENTERPRISE OS™

   COLLECTION DATE SERVICE

   RESPONSIBILITY:

   - Resolve operational dates from YYYY-MM-DD or ISO timestamps
   - Enforce Collection Date after Loan Date
   - Enforce Collection Date on or before Login Business Date
   - Preserve chronological Collection ledger order
   - Perform timezone-safe calendar-day calculations

   IMPORTANT:

   - Collection Date is an operational date.
   - Audit timestamps remain system-generated.
   - Multiple Collections on the same date are allowed.
============================================================ */

import {
  resolveBusinessDate,
} from "../business/businessDateService";

// ============================================================
// TYPES
// ============================================================

export interface CollectionDateValidationOptions {
  collectionDate: unknown;

  loanDate: unknown;

  activeBusinessDate: unknown;

  latestCollectionDate?: unknown;
}

export interface CollectionDateValidationResult {
  collectionDate: string;

  loanDate: string;

  minimumDate: string;

  maximumDate: string;

  latestCollectionDate?: string;
}

// ============================================================
// OPERATIONAL DATE RESOLUTION
// ============================================================
//
// Supports:
//
// YYYY-MM-DD
// YYYY-MM-DDTHH:mm:ss.sssZ
//
// Only the calendar-date portion is operational.
// ============================================================

export function resolveOperationalDate(
  value: unknown,
): string | undefined {
  const rawValue =
    String(value ?? "").trim();

  const match =
    /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(
      rawValue,
    );

  if (!match) {
    return undefined;
  }

  return resolveBusinessDate(
    match[1],
  );
}

// ============================================================
// ADD CALENDAR DAYS
// ============================================================

export function addOperationalCalendarDays(
  value: unknown,
  days: number,
): string | undefined {
  const operationalDate =
    resolveOperationalDate(value);

  if (
    !operationalDate ||
    !Number.isInteger(days)
  ) {
    return undefined;
  }

  const [
    year,
    month,
    day,
  ] =
    operationalDate
      .split("-")
      .map(Number);

  const calendarDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  calendarDate.setUTCDate(
    calendarDate.getUTCDate() + days,
  );

  return calendarDate
    .toISOString()
    .slice(0, 10);
}

// ============================================================
// MINIMUM COLLECTION DATE
// ============================================================
//
// First Collection:
//   Loan Date + 1 calendar day
//
// Later Collections:
//   Latest saved Collection Date
//
// Multiple Collections on the same operational date are valid.
// ============================================================

export function resolveMinimumCollectionDate(
  loanDate: unknown,
  _latestCollectionDate?: unknown,
): string | undefined {
  return addOperationalCalendarDays(
    loanDate,
    1,
  );
}

// ============================================================
// AUTHORITATIVE VALIDATION
// ============================================================

export function validateCollectionDate(
  options: CollectionDateValidationOptions,
): CollectionDateValidationResult {
  const collectionDate =
    resolveBusinessDate(
      String(
        options.collectionDate ?? "",
      ).trim(),
    );

  if (!collectionDate) {
    throw new Error(
      "Please select a valid Collection Date.",
    );
  }

  const loanDate =
    resolveOperationalDate(
      options.loanDate,
    );

  if (!loanDate) {
    throw new Error(
      "A valid Loan Date is required before Collection.",
    );
  }

  const activeBusinessDate =
    resolveBusinessDate(
      options.activeBusinessDate,
    );

  if (!activeBusinessDate) {
    throw new Error(
      "A valid FINORA Login Date is required before Collection.",
    );
  }

  const latestCollectionDate =
    resolveOperationalDate(
      options.latestCollectionDate,
    );

  const minimumDate =
    resolveMinimumCollectionDate(
      loanDate,
      latestCollectionDate,
    );

  if (!minimumDate) {
    throw new Error(
      "FINORA could not resolve the earliest allowed Collection Date.",
    );
  }

  if (minimumDate > activeBusinessDate) {
    throw new Error(
      "No valid Collection Date is available within the active FINORA Login Date.",
    );
  }

  if (collectionDate <= loanDate) {
    throw new Error(
      "Collection Date must be at least one calendar day after the Loan Date.",
    );
  }


  if (
    collectionDate >
    activeBusinessDate
  ) {
    throw new Error(
      "Collection Date cannot be later than the active FINORA Login Date.",
    );
  }

  return {
    collectionDate,

    loanDate,

    minimumDate,

    maximumDate:
      activeBusinessDate,

    latestCollectionDate,
  };
}

// ============================================================
// END
// ============================================================
