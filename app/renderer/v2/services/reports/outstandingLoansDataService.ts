// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// OUTSTANDING LOANS DATA SERVICE
//
// RESPONSIBILITY:
//
// - Build authoritative Outstanding Loans report data
// - Include ACTIVE / RUNNING Loans with outstanding > 0
// - Calculate current receivables from Loan.outstanding
// - Aggregate actual Collections separately
// - Resolve Customer names / mobile numbers
//
// IMPORTANT:
//
// - Current Outstanding comes ONLY from Loan.outstanding
// - Collection.outstandingBalance is NEVER summed
// - Each active Loan is counted exactly once
// - No repository access
// - No StorageManager access
// - No PDF logic
// - No UI logic
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import {
  isReportActiveLoan,
  loadReportDataSnapshot,
} from "./reportDataService";

import { loadCustomerReportCustomers } from "./customerStatementDataService";

// ============================================================
// TYPES
// ============================================================

export interface OutstandingLoanReportRow {
  loanId: string;

  loanNumber: string;

  customerId: string;

  customerName: string;

  customerMobile: string;

  loanDate: string;

  repaymentType: string;

  status: string;

  principal: number;

  totalCollected: number;

  totalDiscount: number;

  outstanding: number;

  collectionCount: number;
}

export interface OutstandingLoansReport {
  generatedLoans: OutstandingLoanReportRow[];

  loanCount: number;

  customerCount: number;

  totalPrincipal: number;

  totalCollected: number;

  totalDiscount: number;

  totalOutstanding: number;

  averageOutstanding: number;

  highestOutstanding: number;
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
// BUILD REPORT
// ============================================================

export async function buildOutstandingLoansReport(): Promise<OutstandingLoansReport> {
  // ==========================================================
  // LOAD AUTHORITATIVE DATA
  // ==========================================================

  const [snapshot, customers] = await Promise.all([
    loadReportDataSnapshot(),

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
  // ACTIVE OUTSTANDING LOANS
  // ==========================================================

  const outstandingLoans = snapshot.loans
    .filter(
      (loan) => isReportActiveLoan(loan) && safeNumber(loan.outstanding) > 0,
    )
    .sort(
      (left, right) =>
        safeNumber(right.outstanding) - safeNumber(left.outstanding),
    );

  // ==========================================================
  // BUILD ROWS
  // ==========================================================

  const generatedLoans: OutstandingLoanReportRow[] = outstandingLoans.map(
    (loan) => {
      const loanId = safeString(loan.id);

      const customerId = safeString(loan.customerId);

      const customer = customerMap.get(customerId);

      const loanCollections = snapshot.collections.filter(
        (collection) => safeString(collection.loanId) === loanId,
      );

      const totalCollected = loanCollections.reduce(
        (total, collection) => total + safeNumber(collection.paymentAmount),
        0,
      );

      const totalDiscount = loanCollections.reduce(
        (total, collection) => total + safeNumber(collection.discountAmount),
        0,
      );

      const record = loan as Loan & Record<string, unknown>;

      return {
        loanId,

        loanNumber: safeString(loan.loanNumber || loan.id),

        customerId,

        customerName:
          safeString(customer?.basic.fullName ?? customer?.basic.displayName) ||
          customerId ||
          "--",

        customerMobile: safeString(customer?.basic.mobileNumber),

        loanDate: safeString(loan.loanDate),

        repaymentType: safeString(record.repaymentType ?? record.loanType),

        status: safeString(loan.status).toUpperCase(),

        principal: safeNumber(loan.amount),

        totalCollected,

        totalDiscount,

        outstanding: safeNumber(loan.outstanding),

        collectionCount: loanCollections.length,
      };
    },
  );

  // ==========================================================
  // UNIQUE CUSTOMERS
  // ==========================================================

  const customerIds = new Set(
    generatedLoans.map((loan) => loan.customerId).filter(Boolean),
  );

  // ==========================================================
  // TOTALS
  // ==========================================================

  const totalPrincipal = generatedLoans.reduce(
    (total, loan) => total + loan.principal,
    0,
  );

  const totalCollected = generatedLoans.reduce(
    (total, loan) => total + loan.totalCollected,
    0,
  );

  const totalDiscount = generatedLoans.reduce(
    (total, loan) => total + loan.totalDiscount,
    0,
  );

  // ==========================================================
  // AUTHORITATIVE CURRENT RECEIVABLE
  //
  // IMPORTANT:
  //
  // Each active Loan.outstanding exactly once.
  // ==========================================================

  const totalOutstanding = generatedLoans.reduce(
    (total, loan) => total + loan.outstanding,
    0,
  );

  const loanCount = generatedLoans.length;

  const averageOutstanding = loanCount > 0 ? totalOutstanding / loanCount : 0;

  const highestOutstanding = generatedLoans.reduce(
    (highest, loan) => Math.max(highest, loan.outstanding),
    0,
  );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    generatedLoans,

    loanCount,

    customerCount: customerIds.size,

    totalPrincipal,

    totalCollected,

    totalDiscount,

    totalOutstanding,

    averageOutstanding,

    highestOutstanding,
  };
}

// ============================================================
// END
// ============================================================
