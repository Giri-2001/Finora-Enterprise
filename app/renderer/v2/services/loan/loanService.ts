// ============================================================
// FINORA ENTERPRISE OS™
//
// LOAN SERVICE™
//
// BUSINESS LAYER
//
// RESPONSIBILITY:
//
// - Provide the application-level Loan service boundary
// - Delegate Loan operations to LoanRepository
// - Keep Loan UI components independent from repositories
// - Provide async Loan persistence operations
// - Provide Loan duplicate-check capability
// - Keep StorageManager details outside UI code
//
// IMPORTANT:
//
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No Loan UI logic.
// - No direct StorageManager access.
// - Repository owns persistence implementation.
// - Service owns application-level Loan operations.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";


import {
  addLoan,
  getLoanById,
  getLoans,
  updateLoanOutstanding,
} from "../../repositories/loan/loanRepository";


import type {
  StorageResult,
} from "../../storage/storage.types";


// ============================================================
// GET ALL LOANS
// ============================================================

export async function fetchLoans():
  Promise<Loan[]> {

  return getLoans();

}


// ============================================================
// GET LOAN
// ============================================================

export async function fetchLoan(
  loanId: string,
):
  Promise<Loan | undefined> {

  return getLoanById(
    loanId,
  );

}


// ============================================================
// CHECK EXISTING LOAN
// ============================================================
//
// Existing LoanStudio duplicate protection:
//
// - Customer ID
// - Loan title
// - Principal amount
//
// The UI must not inspect persisted Loan records directly.
//
// ============================================================

export async function hasExistingLoan(
  customerId: string | undefined,
  loanTitle: string,
  amount: number,
):
  Promise<boolean> {

  if (!customerId) {

    return false;

  }


  const loans =
    await getLoans();


  return loans.some(
    (loan: Loan) =>
      loan.customerId ===
        customerId &&

      loan.title ===
        loanTitle &&

      loan.amount ===
        amount,
  );

}


// ============================================================
// CREATE LOAN
// ============================================================

export async function createLoan(
  loan: Loan,
):
  Promise<StorageResult<Loan>> {

  return addLoan(
    loan,
  );

}


// ============================================================
// UPDATE LOAN OUTSTANDING
// ============================================================
//
// Collection workflows access Loan mutation through the
// LoanService boundary.
//
// The actual persistence remains inside LoanRepository.
//
// ============================================================

export async function updateLoanOutstandingAmount(
  loanId: string,
  paymentAmount: number,
):
  Promise<Loan | undefined> {

  return updateLoanOutstanding(
    loanId,
    paymentAmount,
  );

}


// ============================================================
// SINGLETON SERVICE
// ============================================================

export const loanService = {

  fetchLoans,

  fetchLoan,

  hasExistingLoan,

  createLoan,

  updateLoanOutstanding:
    updateLoanOutstandingAmount,

};


// ============================================================
// END
// ============================================================
