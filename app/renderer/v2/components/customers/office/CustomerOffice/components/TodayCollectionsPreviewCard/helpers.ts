/* ===========================================================
   FINORA ENTERPRISE OS™
   TODAY COLLECTIONS PREVIEW CARD™

   HELPERS
=========================================================== */

import type {

  OfficeCustomer,

} from "../../types";

/* ===========================================================
   TODAY DUE
=========================================================== */

export function getTodayDueAmount(

  customer: OfficeCustomer,

): number {

  void customer;

  return 0;

}

/* ===========================================================
   TODAY COLLECTED
=========================================================== */

export function getTodayCollectedAmount(

  customer: OfficeCustomer,

): number {

  void customer;

  return 0;

}

/* ===========================================================
   TODAY PENDING
=========================================================== */

export function getTodayPendingAmount(

  customer: OfficeCustomer,

): number {

  return (

    getTodayDueAmount(customer) -

    getTodayCollectedAmount(customer)

  );

}
