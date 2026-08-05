/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN REPOSITORY™

   REPOSITORY
=========================================================== */

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";

/* ===========================================================
   STORAGE KEY
=========================================================== */

const STORAGE_KEY =
  "FINORA_LOANS_V2";

/* ===========================================================
   LOAD
=========================================================== */

export function getLoans():
Loan[] {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {

      return [];

    }

    return JSON.parse(raw);

  } catch {

    return [];

  }

}

/* ===========================================================
   SAVE
=========================================================== */

export function saveLoans(

  loans: Loan[],

): void {

  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(loans),

  );

}

/* ===========================================================
   ADD LOAN
=========================================================== */

export function addLoan(

  loan: Loan,

): void {

  const loans =

    getLoans();

  loans.push(

    loan,

  );

  saveLoans(

    loans,

  );

}

/* ===========================================================
   GET LOAN BY ID
=========================================================== */

export function getLoanById(

  loanId: string,

): Loan | undefined {

  return getLoans().find(

    (loan) =>

      loan.id === loanId,

  );

}
