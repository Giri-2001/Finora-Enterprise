/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   VALIDATION HELPERS
=========================================================== */

/* ===========================================================
   HELPER FUNCTIONS
=========================================================== */

/**
 * Returns true when the value is null, undefined,
 * or an empty string after trimming.
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  return false;
}

/**
 * Safely converts any value into a trimmed string.
 */
export function toTrimmedString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

/**
 * Returns true when the value is numeric.
 */
export function isNumeric(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return false;
    }

    return !Number.isNaN(Number(trimmed));
  }

  return false;
}

/**
 * Converts a numeric value safely.
 */
export function toNumber(value: unknown): number | null {
  if (!isNumeric(value)) {
    return null;
  }

  return Number(value);
}
