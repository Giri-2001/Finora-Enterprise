/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE™

   HELPERS
=========================================================== */

import {

  EMPTY_TITLE,

  EMPTY_DESCRIPTION,

} from "./constants";

import type {

  OfficeCustomer,

} from "./types";

/* ===========================================================
   HAS CUSTOMER
=========================================================== */

export function hasCustomer(

  customer?: OfficeCustomer,

): boolean {

  return !!customer;

}

/* ===========================================================
   EMPTY DESK
=========================================================== */

export function buildEmptyDesk() {

  return {

    title: EMPTY_TITLE,

    description: EMPTY_DESCRIPTION,

  };

}
