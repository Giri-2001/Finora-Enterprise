/* ===========================================================

   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD BACK™

   TYPES

=========================================================== */

import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


/* ===========================================================
   CUSTOMER ID CARD BACK PROPS
=========================================================== */

export interface CustomerIdCardBackProps {

  /* =========================================================
     CUSTOMER ID
  ========================================================= */

  customerId:
    string;


  /* =========================================================
     CUSTOMER DETAILS
  ========================================================= */

  fatherName?:
    string;

  village?:
    string;

  mandal?:
    string;

  district?:
    string;

  customerSince?:
    string;


  /* =========================================================
     LOAN SUMMARY
  ========================================================= */

  totalLoans?:
    number;

  activeLoans?:
    number;

  closedLoans?:
    number;

  outstandingAmount?:
    number;

      /* =========================================================
     LAST PAYMENT
  ========================================================= */

  lastPaymentDate?:
    string;

  lastPaymentAmount?:
    number;


  /* =========================================================
     RESPONSIVE ENGINE
     ---------------------------------------------------------
     CustomerHanger already resolves the correct responsive
     token set.

     CustomerIdCardBack consumes that resolved token set.
  ========================================================= */

  responsiveTokens?:
    ResponsiveTokens;

}


/* ===========================================================
   END
=========================================================== */