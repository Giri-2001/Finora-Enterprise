// ============================================================
// FINORA ENTERPRISE OS
// LOAN STUDIO — STEP 1 TYPES
//
// RESPONSIBILITY:
// - Define only the presentation contract required by Step 1.
//
// ARCHITECTURE:
// - No business logic.
// - No storage access.
// - No service access.
// - No responsive logic.
// - No inline styles.
// - Existing Loan Studio view-model remains the source of truth.
// ============================================================

import type {
  LoanStudioViewModel,
} from "../LoanStudio.types";

// ============================================================
// STEP 1 VIEW PROPS
// ============================================================

export type LoanStudioStep1Props =
  Pick<
    LoanStudioViewModel,
    | "customerName"
    | "customerId"
    | "phoneNumber"
    | "customers"
    | "selectedCustomer"
    | "setSelectedCustomer"
    | "loanCustomerOptions"
    | "activeCustomerId"
    | "activeCustomerName"
    | "activeCustomerPhone"
    | "documents"
    | "loanAmount"
    | "setLoanAmount"
    | "interest"
    | "setInterest"
    | "processingFee"
    | "setProcessingFee"
    | "advanceDeduction"
    | "setAdvanceDeduction"
    | "lateFee"
    | "setLateFee"
    | "emiCalculation"
    | "setEMICalculation"
    | "repaymentType"
    | "setRepaymentType"
    | "duration"
    | "setDuration"
    | "setDurationType"
    | "durationType"
    | "purpose"
    | "setPurpose"
    | "remarks"
    | "setRemarks"
    | "loanStatistics"
    | "principal"
    | "totalInterest"
    | "totalPayable"
    | "installmentAmount"
    | "loanDate"
    | "maturityDate"
    | "loanTypeLabel"
  >;