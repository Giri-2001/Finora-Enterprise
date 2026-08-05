/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SMART WALL™

   HELPERS
=========================================================== */

import {

  SMART_WALL_TITLE,

  EMPTY_MESSAGE,

} from "./constants";

/* ===========================================================
   BUILD TITLE
=========================================================== */

export function buildTitle(
  title?: string,
): string {

  const value = title?.trim();

  return value && value.length > 0
    ? value
    : SMART_WALL_TITLE;

}

/* ===========================================================
   HAS CUSTOMERS
=========================================================== */

export function hasCustomers(
  total: number,
): boolean {

  return total > 0;

}

/* ===========================================================
   EMPTY LABEL
=========================================================== */

export function buildEmptyLabel(): string {

  return EMPTY_MESSAGE;

}
