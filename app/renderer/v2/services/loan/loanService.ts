// ============================================================
// FINORA ENTERPRISE OS™
//
// LOAN SERVICE™
//
// BUSINESS LAYER
//
// RESPONSIBILITY:
//
// - Provide the application-level Loan service boundary.
// - Delegate Loan persistence to LoanRepository.
// - Keep Loan UI components independent from repositories.
// - Provide async Loan persistence operations.
// - Provide Loan duplicate-check capability.
// - Forward collection EMI metadata to LoanRepository so that
//   selected EMI rows become permanently Paid/locked.
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
// - ACTIVE / RUNNING / PENDING / APPROVED / DISBURSED
//   loans block creation of another matching active loan.
//
// - CLOSED / REJECTED loans do NOT block a new loan.
//
// - Customer + Loan Type + Amount alone must NEVER make
//   a historical loan permanently unique.
//
// COLLECTION EMI RULE:
//
// - PaymentDetails sends selectedEmiNumbers, receiptNumber,
//   and paidDate.
// - This service MUST forward those values unchanged to the
//   repository.
// - The repository is responsible for mutating the persisted
//   schedule rows and saving the complete Loan.
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  FinoraCommercialWriteOperationAuthorization,
} from "../activation/finoraCommercialWriteOperation";

import {
  consumeFinoraPostCollectionOperationStage,
} from "../activation/finoraCommercialWriteOperation";

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import {
  addLoan,
  deleteLoanById,
  getLoanById,
  getLoans,
  getPersistedSchedule,
  updateLoanOutstanding,
} from "../../repositories/loan/loanRepository";

import type { LoanOutstandingUpdateOptions } from "../../repositories/loan/loanRepository";

import type { StorageResult } from "../../storage/storage.types";

import {
  authorizeFinoraCommercialWrite,
} from "../activation/finoraCommercialWriteGuard";

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
// GET AUTHORITATIVE PRINCIPAL DUE
// ============================================================
//
// Principal Due is derived from the persisted Loan schedule.
//
// IMPORTANT:
//
// - paymentAmount is NOT principal repayment.
// - interest payments do NOT reduce principal.
// - penalty / late fee does NOT reduce principal.
// - paidAmount is installment-level debt payment.
// - principalAmount and interestAmount provide the contractual
//   installment split.
//
// Payment allocation interpretation:
//
//   interest first
//   principal second
//
// principalPaidForInstallment:
//
//   min(
//     principalAmount,
//     max(0, settledAmount - interestAmount)
//   )
//
// ============================================================

export async function fetchLoanPrincipalDue(
  loanId: string,
): Promise<number | undefined> {
  if (!loanId) {
    return undefined;
  }

  const loan = await getLoanById(loanId);

  if (!loan) {
    return undefined;
  }

  const rawPrincipal = Number(
    (
      loan as Loan & {
        amount?: unknown;
      }
    ).amount,
  );

  const originalPrincipal =
    Number.isFinite(rawPrincipal) && rawPrincipal > 0
      ? rawPrincipal
      : 0;

  // ==========================================================
  // MANUAL PRINCIPAL CURTAILMENTS
  //
  // These are direct reductions of contractual principal.
  // They are already part of Collection cash and must not
  // be inferred from EMI paidAmount.
  // ==========================================================

  const manualPrincipalCurtailmentTotal = Array.isArray(
    loan.principalCurtailments,
  )
    ? loan.principalCurtailments.reduce(
        (total, curtailment) =>
          total + Math.max(
            0,
            Number(curtailment?.amount) || 0,
          ),
        0,
      )
    : 0;

  if (originalPrincipal <= 0) {
    return 0;
  }

  const persistedSchedule =
    getPersistedSchedule(loan);

  const schedule =
    persistedSchedule.schedule;

  if (!schedule || schedule.length === 0) {
    return originalPrincipal;
  }

  const principalPaid =
    schedule.reduce(
      (total, installment) => {
        const rawPrincipalAmount =
          Number(installment.principalAmount ?? 0);

        const rawInterestAmount =
          Number(installment.interestAmount ?? 0);

        const rawPaidAmount =
          Number(installment.paidAmount ?? 0);


        const rawWaivedAmount =
          Number(installment.waivedAmount ?? 0);
        const principalAmount =
          Number.isFinite(rawPrincipalAmount)
            ? Math.max(0, rawPrincipalAmount)
            : 0;

        const interestAmount =
          Number.isFinite(rawInterestAmount)
            ? Math.max(0, rawInterestAmount)
            : 0;

        const paidAmount =
          Number.isFinite(rawPaidAmount)
            ? Math.max(0, rawPaidAmount)
            : 0;

        const waivedAmount =
          Number.isFinite(rawWaivedAmount)
            ? Math.max(0, rawWaivedAmount)
            : 0;

        const settledAmount =
          paidAmount + waivedAmount;

        if (
          principalAmount <= 0 ||
          settledAmount <= interestAmount
        ) {
          return total;
        }

        const principalPaidForInstallment =
          Math.min(
            principalAmount,
            Math.max(
              0,
              settledAmount - interestAmount,
            ),
          );

        return (
          total +
          principalPaidForInstallment
        );
      },
      0,
    );

  return Math.max(
    0,
    originalPrincipal - principalPaid - manualPrincipalCurtailmentTotal,
  );
}


// ============================================================
// GET CONTRACTUAL TOTAL INTEREST
// ============================================================
//
// The persisted schedule is the authoritative source for the
// maximum contractual interest generated by the Loan.
//
// This protects day-based accrued-interest display from
// exceeding the Loan's contractual interest at / after maturity.
//
// Example:
//
//   Principal        = ₹10,000
//   Monthly Interest = ₹200
//   Duration         = 5 months
//
//   Contractual Interest = ₹1,000
//
// Even if calendar-day calculation produces ₹1,007 at maturity,
// Interest Generated is capped at ₹1,000.
//
// ============================================================

export async function fetchLoanContractualInterest(
  loanId: string,
): Promise<number | undefined> {
  if (!loanId) {
    return undefined;
  }

  const loan = await getLoanById(loanId);

  if (!loan) {
    return undefined;
  }

  const persistedSchedule =
    getPersistedSchedule(loan);

  const schedule =
    persistedSchedule.schedule;

  if (!schedule || schedule.length === 0) {
    return undefined;
  }

  const totalInterest =
    schedule.reduce(
      (total, installment) => {
        const rawInterestAmount =
          Number(
            installment.interestAmount ?? 0,
          );

        const interestAmount =
          Number.isFinite(rawInterestAmount)
            ? Math.max(0, rawInterestAmount)
            : 0;

        return total + interestAmount;
      },
      0,
    );

  return Math.max(
    0,
    totalInterest,
  );
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

    return isBlockingLoanStatus(loan.status);
  });
}

// ============================================================
// CREATE LOAN
// ============================================================

export async function createLoan(
  loan: Loan,
): Promise<StorageResult<Loan>> {

  const commercialWriteDecision =
    await authorizeFinoraCommercialWrite(
      "DISBURSE_LOAN",
    );

  if (!commercialWriteDecision.allowed) {
    return {
      success:
        false,

      error:
        commercialWriteDecision.reason,
    };
  }

  return addLoan(
    loan,
  );
}

// ============================================================
// ROLLBACK JUST-CREATED LOAN
//
// IMPORTANT:
//
// - Internal persistence compensation only.
// - Used when a Gold Loan record was saved successfully but
//   its mandatory physical custody allocation failed.
// - This is NOT a normal user-facing loan deletion workflow.
// ============================================================

export async function rollbackCreatedLoan(
  loanId: string,
): Promise<StorageResult<void>> {
  return deleteLoanById(loanId);
}

// ============================================================
// UPDATE LOAN OUTSTANDING + EMI PAYMENT STATE
// ============================================================
//
// This is the critical collection boundary.
//
// PaymentDetails supplies:
//
//   selectedEmiNumbers
//   receiptNumber
//   paidDate
//
// Those values MUST reach LoanRepository.
//
// The repository then:
//
//   1. Loads the authoritative persisted Loan.
//   2. Reduces outstanding by the actual collection.
//   3. Finds the selected EMI rows.
//   4. Marks fully paid rows as "Paid".
//   5. Persists receiptNumber / paidDate on those rows.
//   6. Saves the complete updated Loan.
//
// IMPORTANT:
//
// Do NOT remove the third parameter.
// Without forwarding it, collection history can save while
// the EMI schedule remains Pending after reload.
//
// ============================================================

export async function updateLoanOutstandingAmount(
  loanId: string,
  paymentAmount: number,
  options:
    LoanOutstandingUpdateOptions | undefined,
  authorization:
    FinoraCommercialWriteOperationAuthorization,
): Promise<Loan | undefined> {
  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!loanId) {
    return undefined;
  }

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return undefined;
  }

  // ==========================================================
  // FORWARD AUTHORITATIVE COLLECTION METADATA
  // ==========================================================
  //
  // Do not rebuild, reorder, or discard selected EMI numbers.
  // PaymentDetails already carries the exact user selection.
  //
  // ==========================================================

  consumeFinoraPostCollectionOperationStage(
    authorization,
    "LOAN_UPDATED",
  );

  return updateLoanOutstanding(
    loanId,
    paymentAmount,
    options,
  );
}

// ============================================================
// SINGLETON SERVICE
// ============================================================
//
// Existing consumers may use either the named functions above
// or the singleton service object below.
//
// ============================================================

export const loanService = {
  fetchLoans,
  fetchLoan,
  fetchLoanPrincipalDue,
  fetchLoanContractualInterest,
  hasExistingLoan,
  createLoan,
  rollbackCreatedLoan,
  updateLoanOutstanding: updateLoanOutstandingAmount,
};

// ============================================================
// END
// ============================================================
