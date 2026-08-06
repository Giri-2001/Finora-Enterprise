/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PREVIEW CARD™

   HELPERS
=========================================================== */

import type {

  OfficeCustomer,

} from "../../types";

/* ===========================================================
   RUNNING LOANS
=========================================================== */

export function getRunningLoans(

  customer: OfficeCustomer,

) {

  return (

    customer.loans ?? []

  ).filter(

    (loan) =>

      loan.status === "ACTIVE" ||

      loan.status === "RUNNING",

  );

}

/* ===========================================================
   CLOSED LOANS
=========================================================== */

export function getClosedLoans(

  customer: OfficeCustomer,

) {

  return (

    customer.loans ?? []

  ).filter(

    (loan) =>

      loan.status === "CLOSED",

  );

}

/* ===========================================================
   OUTSTANDING
=========================================================== */

export function getOutstandingAmount(

  customer: OfficeCustomer,

) {

  return (

    customer.loans ?? []

  ).reduce(

    (total, loan) =>

      total + loan.outstanding,

    0,

  );

}
