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
// DUPLICATE LOAN RULE:
//
// - An ACTIVE / RUNNING / PENDING / APPROVED / DISBURSED
//   loan blocks creation of another matching active loan.
//
// - CLOSED / REJECTED loans do NOT block a new loan.
//
// - Customer + Loan Type + Amount alone must NEVER make
//   a historical loan permanently unique.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import {
  addLoan,
  getLoanById,
  getLoans,
  updateLoanOutstanding,
} from "../../repositories/loan/loanRepository";

import type { StorageResult } from "../../storage/storage.types";

// ============================================================
// GET ALL LOANS
// ============================================================

export async function fetchLoans(): Promise<Loan[]> {
  return getLoans();
}

// ============================================================
// GET LOAN
// ============================================================

export async function fetchLoan(loanId: string): Promise<Loan | undefined> {
  return getLoanById(loanId);
}

// ============================================================
// LOAN STATUS HELPERS
// ============================================================
//
// Only an unresolved / active loan should block creation
// of another matching loan.
//
// Historical loans such as CLOSED or REJECTED must not
// permanently prevent future borrowing.
//
// ============================================================

function normalizeLoanStatus(
  status: Loan["status"] | string | undefined,
): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

function isBlockingLoanStatus(
  status: Loan["status"] | string | undefined,
): boolean {
  const normalizedStatus = normalizeLoanStatus(status);

  // ==========================================================
  // ACTIVE / UNRESOLVED LOAN STATUSES
  // ==========================================================
  //
  // These statuses represent a loan that is still active,
  // being processed, approved, or already disbursed.
  //
  // Such a loan should block another matching active loan.
  //
  // ==========================================================

  return (
    normalizedStatus === "ACTIVE" ||
    normalizedStatus === "RUNNING" ||
    normalizedStatus === "PENDING" ||
    normalizedStatus === "PENDING APPROVAL" ||
    normalizedStatus === "APPROVED" ||
    normalizedStatus === "DISBURSED"
  );
}

// ============================================================
// CHECK EXISTING ACTIVE LOAN
// ============================================================
//
// BUSINESS RULE:
//
// Customer + Loan Title + Principal Amount is checked only
// against an ACTIVE / UNRESOLVED loan.
//
// CLOSED / REJECTED historical loans are ignored.
//
// This prevents duplicate active loans without preventing
// legitimate future loans after an old loan is completed.
//
// ============================================================

export async function hasExistingLoan(
  customerId: string | undefined,
  loanTitle: string,
  amount: number,
): Promise<boolean> {
  // ==========================================================
  // CUSTOMER VALIDATION
  // ==========================================================

  if (!customerId) {
    return false;
  }

  // ==========================================================
  // AMOUNT VALIDATION
  // ==========================================================

  if (!Number.isFinite(amount)) {
    return false;
  }

  // ==========================================================
  // LOAD LOANS THROUGH REPOSITORY
  // ==========================================================

  const loans = await getLoans();

  // ==========================================================
  // NORMALIZE SEARCH VALUES
  // ==========================================================

  const normalizedCustomerId = customerId.trim();

  const normalizedLoanTitle = loanTitle.trim().toLowerCase();

  // ==========================================================
  // ACTIVE DUPLICATE CHECK
  // ==========================================================

  return loans.some((loan: Loan) => {
    // ========================================================
    // CUSTOMER MATCH
    // ========================================================

    const sameCustomer =
      String(loan.customerId ?? "").trim() === normalizedCustomerId;

    if (!sameCustomer) {
      return false;
    }

    // ========================================================
    // LOAN TITLE MATCH
    // ========================================================

    const sameLoanTitle =
      String(loan.title ?? "")
        .trim()
        .toLowerCase() === normalizedLoanTitle;

    if (!sameLoanTitle) {
      return false;
    }

    // ========================================================
    // PRINCIPAL AMOUNT MATCH
    // ========================================================

    const sameAmount = Number(loan.amount ?? 0) === amount;

    if (!sameAmount) {
      return false;
    }

    // ========================================================
    // ACTIVE STATUS CHECK
    // ========================================================
    //
    // CLOSED / REJECTED historical loans are intentionally
    // ignored.
    //
    // ========================================================

    return isBlockingLoanStatus(loan.status);
  });
}

// ============================================================
// CREATE LOAN
// ============================================================

export async function createLoan(loan: Loan): Promise<StorageResult<Loan>> {
  return addLoan(loan);
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
): Promise<Loan | undefined> {
  return updateLoanOutstanding(loanId, paymentAmount);
}

// ============================================================
// SINGLETON SERVICE
// ============================================================

export const loanService = {
  fetchLoans,

  fetchLoan,

  hasExistingLoan,

  createLoan,

  updateLoanOutstanding: updateLoanOutstandingAmount,
};

// ============================================================
// END
// ============================================================
