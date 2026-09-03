/* ============================================================
   FINORA ENTERPRISE OS™

   ERP BUSINESS DATE SERVICE

   RESPONSIBILITY:

   - Normalize the Owner-selected operational Business Date
   - Validate one exact YYYY-MM-DD calendar date
   - Resolve the current device-local calendar date for UI defaults
   - Format the stored Business Date as DD-MM-YYYY for display
   - Keep operational dates separate from audit timestamps

   IMPORTANT:

   - Business Date is selected before authenticated session commit.
   - Past and future valid calendar dates are supported.
   - This service does not generate audit timestamps.
   - loginTime, createdAt and updatedAt remain system-generated.
   - No React.
   - No UI.
   - No storage access.
   - No Loan or Collection persistence.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

/* ============================================================
   CONSTANTS
============================================================ */

const BUSINESS_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/;

/* ============================================================
   NORMALIZATION
============================================================ */

export function normalizeBusinessDate(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* ============================================================
   VALIDATION
============================================================ */

export function isValidBusinessDate(
  value:
    unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match =
    BUSINESS_DATE_PATTERN.exec(
      value,
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

  const resolvedDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  return (
    resolvedDate.getUTCFullYear() ===
      year &&
    resolvedDate.getUTCMonth() ===
      month - 1 &&
    resolvedDate.getUTCDate() ===
      day
  );
}

/* ============================================================
   RESOLUTION
============================================================ */

export function resolveBusinessDate(
  value:
    unknown,
): string | undefined {
  const normalizedValue =
    normalizeBusinessDate(
      value,
    );

  return isValidBusinessDate(
    normalizedValue,
  )
    ? normalizedValue
    : undefined;
}

/* ============================================================
   CURRENT LOCAL CALENDAR DATE
============================================================ */

export function getCurrentLocalBusinessDate(
  now:
    Date = new Date(),
): string {
  if (
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    throw new Error(
      "A valid system date is required to resolve the current FINORA Business Date.",
    );
  }

  const year =
    String(
      now.getFullYear(),
    ).padStart(
      4,
      "0",
    );

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      "0",
    );

  const businessDate =
    `${year}-${month}-${day}`;

  if (
    !isValidBusinessDate(
      businessDate,
    )
  ) {
    throw new Error(
      "Unable to resolve the current FINORA Business Date.",
    );
  }

  return businessDate;
}

/* ============================================================
   DISPLAY
============================================================ */

export function formatBusinessDateForDisplay(
  value:
    unknown,
): string {
  const businessDate =
    resolveBusinessDate(
      value,
    );

  if (!businessDate) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    businessDate.split(
      "-",
    );

  return `${day}-${month}-${year}`;
}

/* ============================================================
   END
============================================================ */