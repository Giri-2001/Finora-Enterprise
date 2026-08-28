// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// CLOSED LOANS DATA SERVICE
//
// RESPONSIBILITY:
//
// - Build authoritative Closed Loans report data
// - Include CLOSED Loans only
// - Reuse authoritative Loan Statement financial calculations
// - Resolve Customer names and mobile numbers
// - Aggregate principal / payable / collected / discount
// - Aggregate settlement adjustments
// - Audit residual outstanding on closed Loans
//
// IMPORTANT:
//
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No PDF logic
// - No UI logic
//
// FINANCIAL RULE:
//
// Closed Loan reconciliation:
//
// Total Payable
//   - Total Collected
//   - Total Discount
//   - Settlement Adjustment
//   = Current Outstanding
//
// Normally CLOSED Loans must have:
//
//   Current Outstanding = 0
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  buildLoanReportStatement,
  getClosedReportLoans,
} from "./reportDataService";

import { loadCustomerReportCustomers } from "./customerStatementDataService";

// ============================================================
// TYPES
// ============================================================

export interface ClosedLoanReportRow {
  loanId: string;

  loanNumber: string;

  customerId: string;

  customerName: string;

  customerMobile: string;

  loanDate: string;

  repaymentType: string;

  status: string;

  principal: number;

  totalPayable: number;

  totalCollected: number;

  totalDiscount: number;

  settlementAdjustment: number;

  currentOutstanding: number;

  collectionCount: number;
}

export interface ClosedLoansReport {
  loans: ClosedLoanReportRow[];

  loanCount: number;

  customerCount: number;

  collectionCount: number;

  totalPrincipal: number;

  totalPayable: number;

  totalCollected: number;

  totalDiscount: number;

  settlementAdjustment: number;

  totalResidualOutstanding: number;

  settlementValue: number;

  averageCollectedPerLoan: number;

  residualLoanCount: number;
}

// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

// ============================================================
// SAFE STRING
// ============================================================

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

// ============================================================
// BUILD CLOSED LOANS REPORT
// ============================================================

export async function buildClosedLoansReport(): Promise<ClosedLoansReport> {
  // ==========================================================
  // LOAD CLOSED LOANS + CUSTOMERS
  // ==========================================================

  const [closedLoans, customers] = await Promise.all([
    getClosedReportLoans(),

    loadCustomerReportCustomers(),
  ]);

  // ==========================================================
  // CUSTOMER LOOKUP
  // ==========================================================

  const customerMap = new Map(
    customers.map((customer) => [
      safeString(customer.identity.customerId),

      customer,
    ]),
  );

  // ==========================================================
  // BUILD AUTHORITATIVE LOAN STATEMENTS
  //
  // Reuse the exact Loan Statement financial engine.
  // This prevents Closed Loans report math from drifting away
  // from Loan Statement / Customer Statement calculations.
  // ==========================================================

  const statements = await Promise.all(
    closedLoans.map((loan) => buildLoanReportStatement(safeString(loan.id))),
  );

  // ==========================================================
  // BUILD ROWS
  // ==========================================================

  const loans: ClosedLoanReportRow[] = statements
    .filter(
      (statement): statement is NonNullable<typeof statement> =>
        statement !== null,
    )
    .map((statement) => {
      const customer = customerMap.get(statement.customerId);

      return {
        loanId: statement.loanId,

        loanNumber: statement.loanNumber,

        customerId: statement.customerId,

        customerName:
          safeString(customer?.basic.fullName ?? customer?.basic.displayName) ||
          statement.customerId ||
          "--",

        customerMobile: safeString(customer?.basic.mobileNumber),

        loanDate: statement.loanDate,

        repaymentType: statement.repaymentType,

        status: safeString(statement.status).toUpperCase(),

        principal: safeNumber(statement.principal),

        totalPayable: safeNumber(statement.totalPayable),

        totalCollected: safeNumber(statement.totalCollected),

        totalDiscount: safeNumber(statement.totalDiscount),

        settlementAdjustment: safeNumber(statement.settlementAdjustment),

        currentOutstanding: safeNumber(statement.currentOutstanding),

        collectionCount: statement.collectionCount,
      };
    })
    .sort((left, right) => {
      const leftDate = new Date(left.loanDate).getTime();

      const rightDate = new Date(right.loanDate).getTime();

      const safeLeftDate = Number.isFinite(leftDate) ? leftDate : 0;

      const safeRightDate = Number.isFinite(rightDate) ? rightDate : 0;

      return safeRightDate - safeLeftDate;
    });

  // ==========================================================
  // UNIQUE CUSTOMERS
  // ==========================================================

  const customerIds = new Set(
    loans.map((loan) => loan.customerId).filter(Boolean),
  );

  // ==========================================================
  // TOTAL PRINCIPAL
  // ==========================================================

  const totalPrincipal = loans.reduce(
    (total, loan) => total + loan.principal,
    0,
  );

  // ==========================================================
  // TOTAL PAYABLE
  // ==========================================================

  const totalPayable = loans.reduce(
    (total, loan) => total + loan.totalPayable,
    0,
  );

  // ==========================================================
  // TOTAL COLLECTED
  // ==========================================================

  const totalCollected = loans.reduce(
    (total, loan) => total + loan.totalCollected,
    0,
  );

  // ==========================================================
  // TOTAL DISCOUNT
  // ==========================================================

  const totalDiscount = loans.reduce(
    (total, loan) => total + loan.totalDiscount,
    0,
  );

  // ==========================================================
  // SETTLEMENT ADJUSTMENT
  // ==========================================================

  const settlementAdjustment = loans.reduce(
    (total, loan) => total + loan.settlementAdjustment,
    0,
  );

  // ==========================================================
  // RESIDUAL OUTSTANDING
  //
  // Closed Loans should normally resolve to zero.
  // This remains visible as an integrity audit.
  // ==========================================================

  const totalResidualOutstanding = loans.reduce(
    (total, loan) => total + loan.currentOutstanding,
    0,
  );

  const residualLoanCount = loans.filter(
    (loan) => loan.currentOutstanding > 0,
  ).length;

  // ==========================================================
  // COLLECTION COUNT
  // ==========================================================

  const collectionCount = loans.reduce(
    (total, loan) => total + loan.collectionCount,
    0,
  );

  // ==========================================================
  // SETTLEMENT VALUE
  //
  // Represents all value used to extinguish contractual
  // liability:
  //
  // Collected + Discount + Settlement Adjustment
  // ==========================================================

  const settlementValue = totalCollected + totalDiscount + settlementAdjustment;

  // ==========================================================
  // AVERAGE ACTUAL COLLECTION PER CLOSED LOAN
  // ==========================================================

  const loanCount = loans.length;

  const averageCollectedPerLoan =
    loanCount > 0 ? totalCollected / loanCount : 0;

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    loans,

    loanCount,

    customerCount: customerIds.size,

    collectionCount,

    totalPrincipal,

    totalPayable,

    totalCollected,

    totalDiscount,

    settlementAdjustment,

    totalResidualOutstanding,

    settlementValue,

    averageCollectedPerLoan,

    residualLoanCount,
  };
}

// ============================================================
// END
// ============================================================
