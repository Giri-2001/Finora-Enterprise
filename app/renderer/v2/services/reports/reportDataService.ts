// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// REPORT DATA SERVICE
//
// RESPONSIBILITY:
//
// - Load authoritative Loan data through LoanService
// - Load authoritative Collection data through CollectionService
// - Build report-ready Loan statements
// - Build report-ready portfolio summaries
// - Normalize persisted EMI schedules
// - Join collections to their authoritative Loan
// - Keep PDF/UI layers free from financial aggregation logic
//
// IMPORTANT:
//
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No PDF generation
// - No UI logic
//
// AUTHORITATIVE REPORTING RULES:
//
// Current Outstanding:
//
//   ACTIVE / RUNNING Loan.outstanding
//   each Loan exactly once.
//
// NEVER:
//
//   SUM(Collection.outstandingBalance)
//
// because Collection.outstandingBalance is a historical
// post-transaction snapshot.
//
// Total Collected:
//
//   SUM(Collection.paymentAmount)
//
// Total Discount:
//
//   SUM(Collection.discountAmount)
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

import { fetchLoans } from "../loan/loanService";

import { loadCollections } from "../collection/collectionService";

// ============================================================
// REPORT TYPES
// ============================================================

export interface ReportEmiRecord {
  installmentNumber: number;

  dueDate: string;

  installmentAmount: number;

  paidAmount: number;

  status: string;

  receiptNumber: string;

  paidDate: string;
}

export interface ReportCollectionRecord {
  id: string;

  receiptNumber: string;

  receiptDate: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  loanId: string;

  loanNumber: string;

  paymentAmount: number;

  discountAmount: number;

  outstandingBalance: number;

  paymentMethod: string;

  paymentReference: string;

  remarks: string;

  collectionType: string;

  status: string;

  createdAt: string;
}

export interface LoanReportStatement {
  loan: Loan;

  loanId: string;

  loanNumber: string;

  customerId: string;

  principal: number;

  interestRate: number;

  totalPayable: number;

  currentOutstanding: number;

  totalCollected: number;

  totalDiscount: number;

  settlementAdjustment: number;

  collectionCount: number;

  status: string;

  loanDate: string;

  repaymentType: string;

  schedule: ReportEmiRecord[];

  collections: ReportCollectionRecord[];
}

export interface PortfolioReportSummary {
  totalLoans: number;

  activeLoans: number;

  closedLoans: number;

  otherLoans: number;

  totalPrincipal: number;

  totalCollected: number;

  totalDiscount: number;

  totalOutstanding: number;

  collectionCount: number;

  averageCollection: number;

  recoveryPercentage: number;
}

export interface ReportDataSnapshot {
  loans: Loan[];

  collections: CollectionReviewData[];

  summary: PortfolioReportSummary;
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
// STATUS
// ============================================================

function normalizeStatus(value: unknown): string {
  return safeString(value).toUpperCase();
}

// ============================================================
// ACTIVE LOAN
// ============================================================

export function isReportActiveLoan(loan: Loan): boolean {
  const status = normalizeStatus(loan.status);

  return status === "ACTIVE" || status === "RUNNING";
}

// ============================================================
// CLOSED LOAN
// ============================================================

export function isReportClosedLoan(loan: Loan): boolean {
  return normalizeStatus(loan.status) === "CLOSED";
}

// ============================================================
// TOTAL PAYABLE
// ============================================================
//
// SOURCE PRIORITY:
//
// 1. Explicit persisted total-payable fields
// 2. Persisted EMI schedule contractual total
// 3. Principal + persisted total-interest field
// 4. Principal as final legacy fallback
//
// IMPORTANT:
//
// We DO NOT recalculate interest from rate × duration here.
//
// The persisted EMI schedule is the authoritative contractual
// repayment schedule when an explicit total-payable field does
// not exist.
// ============================================================

function resolveTotalPayable(loan: Loan): number {
  const record = loan as Loan & Record<string, unknown>;

  // ==========================================================
  // 1. EXPLICIT TOTAL PAYABLE
  // ==========================================================

  const directCandidates = [
    record.totalPayable,
    record.totalAmount,
    record.payableAmount,
    record.totalRepayment,
  ];

  for (const candidate of directCandidates) {
    const amount = safeNumber(candidate);

    if (amount > 0) {
      return amount;
    }
  }

  // ==========================================================
  // 2. PERSISTED EMI SCHEDULE TOTAL
  // ==========================================================

  const schedule = extractLoanSchedule(loan);

  const scheduleTotal = schedule.reduce(
    (total, installment) => total + safeNumber(installment.installmentAmount),
    0,
  );

  if (scheduleTotal > 0) {
    return scheduleTotal;
  }

  // ==========================================================
  // 3. PRINCIPAL + PERSISTED TOTAL INTEREST
  // ==========================================================

  const principal = safeNumber(loan.amount);

  const totalInterestCandidates = [
    record.totalInterest,
    record.interestAmount,
    record.totalInterestAmount,
  ];

  for (const candidate of totalInterestCandidates) {
    const totalInterest = safeNumber(candidate);

    if (totalInterest > 0) {
      return principal + totalInterest;
    }
  }

  // ==========================================================
  // 4. LEGACY FALLBACK
  // ==========================================================

  return principal;
}

// ============================================================
// SCHEDULE EXTRACTION
// ============================================================
//
// FINORA historical Loan records may expose:
//
// - schedule
// - emiSchedule
// - installments
//
// Reporting must remain compatible with all three.
// ============================================================

function extractLoanSchedule(loan: Loan): ReportEmiRecord[] {
  const record = loan as Loan & Record<string, unknown>;

  const rawSchedule = Array.isArray(record.schedule)
    ? record.schedule
    : Array.isArray(record.emiSchedule)
      ? record.emiSchedule
      : Array.isArray(record.installments)
        ? record.installments
        : [];

  return rawSchedule
    .map((value): ReportEmiRecord => {
      const installment =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : {};

      return {
        installmentNumber: Math.max(
          0,
          Math.trunc(
            safeNumber(
              installment.installmentNumber ??
                installment.emiNumber ??
                installment.number,
            ),
          ),
        ),

        dueDate: safeString(installment.dueDate ?? installment.date),

        installmentAmount: safeNumber(
          installment.installmentAmount ??
            installment.amount ??
            installment.emiAmount,
        ),

        paidAmount: safeNumber(installment.paidAmount),

        status: safeString(installment.status || "Pending"),

        receiptNumber: safeString(installment.receiptNumber),

        paidDate: safeString(installment.paidDate),
      };
    })
    .filter((installment) => installment.installmentNumber > 0)
    .sort((left, right) => left.installmentNumber - right.installmentNumber);
}

// ============================================================
// COLLECTION NORMALIZATION
// ============================================================

function normalizeCollection(
  collection: CollectionReviewData,
): ReportCollectionRecord {
  const record = collection as CollectionReviewData & Record<string, unknown>;

  return {
    id: safeString(
      record.id ?? record.collectionId ?? collection.receiptNumber,
    ),

    receiptNumber: safeString(collection.receiptNumber),

    receiptDate: safeString(collection.receiptDate),

    customerId: safeString(collection.customerId),

    customerName: safeString(collection.customerName),

    customerPhone: safeString(collection.customerPhone),

    loanId: safeString(collection.loanId),

    loanNumber: safeString(collection.loanNumber),

    paymentAmount: safeNumber(collection.paymentAmount),

    discountAmount: safeNumber(collection.discountAmount),

    outstandingBalance: safeNumber(collection.outstandingBalance),

    paymentMethod: safeString(collection.paymentMethod),

    paymentReference: safeString(collection.paymentReference),

    remarks: safeString(collection.remarks),

    collectionType: safeString(collection.collectionType),

    status: safeString(collection.status),

    createdAt: safeString(collection.createdAt),
  };
}

// ============================================================
// COLLECTION SORT DATE
// ============================================================

function getCollectionTimestamp(collection: ReportCollectionRecord): number {
  const source = collection.createdAt || collection.receiptDate;

  const timestamp = new Date(source).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

// ============================================================
// LOAD REPORT SNAPSHOT
// ============================================================

export async function loadReportDataSnapshot(): Promise<ReportDataSnapshot> {
  const [loans, collections] = await Promise.all([
    fetchLoans(),
    loadCollections(),
  ]);

  const totalPrincipal = loans.reduce(
    (total, loan) => total + safeNumber(loan.amount),
    0,
  );

  const activeLoans = loans.filter(isReportActiveLoan);

  const closedLoans = loans.filter(isReportClosedLoan);

  const totalOutstanding = activeLoans.reduce(
    (total, loan) => total + safeNumber(loan.outstanding),
    0,
  );

  const totalCollected = collections.reduce(
    (total, collection) => total + safeNumber(collection.paymentAmount),
    0,
  );

  const totalDiscount = collections.reduce(
    (total, collection) => total + safeNumber(collection.discountAmount),
    0,
  );

  const collectionCount = collections.length;

  const averageCollection =
    collectionCount > 0 ? totalCollected / collectionCount : 0;

  const recoveryBase = totalCollected + totalOutstanding;

  const recoveryPercentage =
    recoveryBase > 0 ? (totalCollected / recoveryBase) * 100 : 0;

  return {
    loans,

    collections,

    summary: {
      totalLoans: loans.length,

      activeLoans: activeLoans.length,

      closedLoans: closedLoans.length,

      otherLoans: Math.max(
        0,
        loans.length - activeLoans.length - closedLoans.length,
      ),

      totalPrincipal,

      totalCollected,

      totalDiscount,

      totalOutstanding,

      collectionCount,

      averageCollection,

      recoveryPercentage,
    },
  };
}

// ============================================================
// BUILD SINGLE LOAN STATEMENT
// ============================================================

export async function buildLoanReportStatement(
  loanId: string,
): Promise<LoanReportStatement | null> {
  const normalizedLoanId = safeString(loanId);

  if (!normalizedLoanId) {
    return null;
  }

  const [loans, collections] = await Promise.all([
    fetchLoans(),
    loadCollections(),
  ]);

  const loan = loans.find((item) => safeString(item.id) === normalizedLoanId);

  if (!loan) {
    return null;
  }

  const loanCollections = collections
    .filter((collection) => safeString(collection.loanId) === normalizedLoanId)
    .map(normalizeCollection)
    .sort(
      (left, right) =>
        getCollectionTimestamp(left) - getCollectionTimestamp(right),
    );

  const totalCollected = loanCollections.reduce(
    (total, collection) => total + collection.paymentAmount,
    0,
  );

  const totalDiscount = loanCollections.reduce(
    (total, collection) => total + collection.discountAmount,
    0,
  );

  const record = loan as Loan & Record<string, unknown>;

  const totalPayable = resolveTotalPayable(loan);

  const currentOutstanding = safeNumber(loan.outstanding);

  const settlementAdjustment = isReportClosedLoan(loan)
    ? Math.max(
        0,
        totalPayable - totalCollected - totalDiscount - currentOutstanding,
      )
    : 0;

  return {
    loan,

    loanId: safeString(loan.id),

    loanNumber: safeString(loan.loanNumber || loan.id),

    customerId: safeString(loan.customerId),

    principal: safeNumber(loan.amount),

    interestRate: safeNumber(loan.interest),

    totalPayable,

    currentOutstanding,

    totalCollected,

    totalDiscount,

    settlementAdjustment,

    collectionCount: loanCollections.length,

    status: safeString(loan.status),

    loanDate: safeString(loan.loanDate),

    repaymentType: safeString(record.repaymentType ?? record.loanType),

    schedule: extractLoanSchedule(loan),

    collections: loanCollections,
  };
}

// ============================================================
// GET ACTIVE LOANS FOR OUTSTANDING REPORT
// ============================================================

export async function getOutstandingReportLoans(): Promise<Loan[]> {
  const loans = await fetchLoans();

  return loans
    .filter(
      (loan) => isReportActiveLoan(loan) && safeNumber(loan.outstanding) > 0,
    )
    .sort(
      (left, right) =>
        safeNumber(right.outstanding) - safeNumber(left.outstanding),
    );
}

// ============================================================
// GET CLOSED LOANS
// ============================================================

export async function getClosedReportLoans(): Promise<Loan[]> {
  const loans = await fetchLoans();

  return loans.filter(isReportClosedLoan);
}

// ============================================================
// GET COLLECTIONS BY DATE RANGE
// ============================================================

export async function getCollectionsForReportRange(
  fromDate: string,
  toDate: string,
): Promise<ReportCollectionRecord[]> {
  const collections = await loadCollections();

  const fromTimestamp = fromDate
    ? new Date(`${fromDate}T00:00:00`).getTime()
    : Number.NEGATIVE_INFINITY;

  const toTimestamp = toDate
    ? new Date(`${toDate}T23:59:59.999`).getTime()
    : Number.POSITIVE_INFINITY;

  return collections
    .map(normalizeCollection)
    .filter((collection) => {
      const timestamp = getCollectionTimestamp(collection);

      return timestamp >= fromTimestamp && timestamp <= toTimestamp;
    })
    .sort(
      (left, right) =>
        getCollectionTimestamp(left) - getCollectionTimestamp(right),
    );
}

// ============================================================
// END
// ============================================================
