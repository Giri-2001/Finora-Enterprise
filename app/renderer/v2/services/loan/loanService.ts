/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN SERVICE™

   BUSINESS LAYER
=========================================================== */

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";

import {
  addLoan,
  getLoanById,
  getLoans,
} from "../../repositories/loan/loanRepository";

/* ===========================================================
   GET ALL LOANS
=========================================================== */

export function fetchLoans():
Loan[] {

  return getLoans();

}

/* ===========================================================
   GET LOAN
=========================================================== */

export function fetchLoan(

  loanId: string,

): Loan | undefined {

  return getLoanById(

    loanId,

  );

}

/* ===========================================================
   CREATE LOAN
=========================================================== */

export function createLoan(

  loan: Loan,

): void {

  addLoan(

    loan,

  );

}
