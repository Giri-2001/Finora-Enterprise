/* ===========================================================
   FINORA ENTERPRISE OS™
   ADD CUSTOMER BUTTON

   HELPERS
=========================================================== */

import {
  DEFAULT_LABEL,
} from "./constants";

/* ===========================================================
   BUILD LABEL
=========================================================== */

export function buildLabel(
  label?: string,
): string {

  const value = label?.trim();

  return value && value.length > 0
    ? value
    : DEFAULT_LABEL;

}

/* ===========================================================
   BUTTON STATE
=========================================================== */

export function isButtonDisabled(
  disabled?: boolean,
): boolean {

  return disabled === true;

}
