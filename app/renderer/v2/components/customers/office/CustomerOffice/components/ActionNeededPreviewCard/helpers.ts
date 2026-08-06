/* ===========================================================
   FINORA ENTERPRISE OS™
   ACTION NEEDED PREVIEW CARD™

   HELPERS
=========================================================== */

import type {

  OfficeCustomer,

} from "../../types";

import {

  ACTIVE_STATUS,
  INACTIVE_STATUS,
  NO_OUTSTANDING_MESSAGE,
  PENDING_SUFFIX,

} from "./constants";

/* ===========================================================
   OUTSTANDING
=========================================================== */

export function hasOutstanding(

  customer: OfficeCustomer,

): boolean {

  return customer.outstandingAmount > 0;

}

/* ===========================================================
   OUTSTANDING MESSAGE
=========================================================== */

export function getOutstandingMessage(

  customer: OfficeCustomer,

): string {

  if (!hasOutstanding(customer)) {

    return NO_OUTSTANDING_MESSAGE;

  }

  return `₹${customer.outstandingAmount.toLocaleString()} ${PENDING_SUFFIX}`;

}

/* ===========================================================
   CUSTOMER STATUS
=========================================================== */

export function getCustomerStatus(

  customer: OfficeCustomer,

): string {

  return customer.active

    ? ACTIVE_STATUS

    : INACTIVE_STATUS;

}

/* ===========================================================
   NEXT COLLECTION
=========================================================== */

export function getNextCollectionDate(

  customer: OfficeCustomer,

): string {

  return customer.nextCollectionDate;

}
