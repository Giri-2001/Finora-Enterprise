/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SEARCH BAR

   HELPERS
=========================================================== */

import {
  DEFAULT_PLACEHOLDER,
  MAX_SEARCH_LENGTH,
} from "./constants";

/* ===========================================================
   BUILD PLACEHOLDER
=========================================================== */

export function buildPlaceholder(
  placeholder?: string,
): string {

  const value = placeholder?.trim();

  return value && value.length > 0
    ? value
    : DEFAULT_PLACEHOLDER;

}

/* ===========================================================
   SANITIZE SEARCH
=========================================================== */

export function sanitizeSearch(
  value: string,
): string {

  return value
    .trimStart()
    .slice(0, MAX_SEARCH_LENGTH);

}
