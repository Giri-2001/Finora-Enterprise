/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER RAIL

   HELPERS
=========================================================== */

import {

  DEFAULT_TITLE,

  DEFAULT_TOTAL_CUSTOMERS,

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
    : DEFAULT_TITLE;

}

/* ===========================================================
   BUILD TOTAL CUSTOMERS
=========================================================== */

export function buildTotalCustomers(
  totalCustomers?: number,
): number {

  if (
    typeof totalCustomers !== "number"
  ) {

    return DEFAULT_TOTAL_CUSTOMERS;

  }

  return Math.max(
    0,
    totalCustomers,
  );

}
