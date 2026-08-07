/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER WORKSPACE™

   HELPERS
=========================================================== */

import type {
  OfficeCustomer,
} from "../CustomerOffice/types";

/* ===========================================================
   CUSTOMER
=========================================================== */

export function hasCustomer(

  customer?: OfficeCustomer,

): boolean {

  return !!customer;

}

/* ===========================================================
   EMPTY STATE
=========================================================== */

export function buildEmptyWorkspace() {

  return {

    title:
      "Select a Customer",

    description:
      "Choose a customer from the Customer Cards to open the Customer Workspace.",

  };

}
