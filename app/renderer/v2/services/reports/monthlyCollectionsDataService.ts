// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// MONTHLY COLLECTIONS DATA SERVICE
//
// RESPONSIBILITY:
//
// - Build authoritative Monthly Collections report data
// - Resolve selected YYYY-MM month boundaries
// - Load collections through reportDataService
// - Aggregate actual cash collected
// - Aggregate explicit discounts
// - Calculate liability reduction
// - Calculate unique Customer / Loan counts
// - Build payment-mode summaries
//
// IMPORTANT:
//
// - No repository access
// - No StorageManager access
// - No localStorage access
// - No PDF logic
// - No UI logic
//
// REPORTING RULES:
//
// Total Collected
//   = SUM(Collection.paymentAmount)
//
// Total Discount
//   = SUM(Collection.discountAmount)
//
// Liability Reduction
//   = Total Collected + Total Discount
//
// Historical Collection.outstandingBalance is displayed only
// as a transaction snapshot.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { getCollectionsForReportRange } from "./reportDataService";

import type { ReportCollectionRecord } from "./reportDataService";

// ============================================================
// TYPES
// ============================================================

export interface MonthlyPaymentModeSummary {
  paymentMethod: string;

  transactionCount: number;

  totalCollected: number;

  totalDiscount: number;

  liabilityReduction: number;
}

export interface MonthlyCollectionsReport {
  monthKey: string;

  year: number;

  month: number;

  monthLabel: string;

  fromDate: string;

  toDate: string;

  collections: ReportCollectionRecord[];

  transactionCount: number;

  customerCount: number;

  loanCount: number;

  totalCollected: number;

  totalDiscount: number;

  liabilityReduction: number;

  averageCollection: number;

  paymentModes: MonthlyPaymentModeSummary[];
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
// PAD
// ============================================================

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

// ============================================================
// MONTH RANGE
// ============================================================

interface MonthRange {
  monthKey: string;

  year: number;

  month: number;

  monthLabel: string;

  fromDate: string;

  toDate: string;
}

function resolveMonthRange(monthKey: string): MonthRange {
  const normalized = safeString(monthKey);

  const match = /^(\d{4})-(\d{2})$/.exec(normalized);

  if (!match) {
    throw new Error("Invalid report month. Expected YYYY-MM.");
  }

  const year = Number(match[1]);

  const month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid Monthly Collections report month.");
  }

  const lastDay = new Date(year, month, 0).getDate();

  const fromDate = `${year}-${pad2(month)}-01`;

  const toDate = `${year}-${pad2(month)}-${pad2(lastDay)}`;

  const labelDate = new Date(year, month - 1, 1);

  const monthLabel = labelDate.toLocaleDateString("en-IN", {
    month: "long",

    year: "numeric",
  });

  return {
    monthKey: `${year}-${pad2(month)}`,

    year,

    month,

    monthLabel,

    fromDate,

    toDate,
  };
}

// ============================================================
// PAYMENT MODE
// ============================================================

function normalizePaymentMethod(value: unknown): string {
  const method = safeString(value).toUpperCase();

  return method || "UNKNOWN";
}

// ============================================================
// BUILD PAYMENT MODE SUMMARY
// ============================================================

function buildPaymentModeSummary(
  collections: ReportCollectionRecord[],
): MonthlyPaymentModeSummary[] {
  const summary = new Map<string, MonthlyPaymentModeSummary>();

  for (const collection of collections) {
    const paymentMethod = normalizePaymentMethod(collection.paymentMethod);

    const paymentAmount = safeNumber(collection.paymentAmount);

    const discountAmount = safeNumber(collection.discountAmount);

    const existing = summary.get(paymentMethod);

    if (existing) {
      existing.transactionCount += 1;

      existing.totalCollected += paymentAmount;

      existing.totalDiscount += discountAmount;

      existing.liabilityReduction += paymentAmount + discountAmount;

      continue;
    }

    summary.set(paymentMethod, {
      paymentMethod,

      transactionCount: 1,

      totalCollected: paymentAmount,

      totalDiscount: discountAmount,

      liabilityReduction: paymentAmount + discountAmount,
    });
  }

  return Array.from(summary.values()).sort((left, right) => {
    if (right.totalCollected !== left.totalCollected) {
      return right.totalCollected - left.totalCollected;
    }

    return left.paymentMethod.localeCompare(right.paymentMethod);
  });
}

// ============================================================
// BUILD MONTHLY COLLECTIONS REPORT
// ============================================================

export async function buildMonthlyCollectionsReport(
  monthKey: string,
): Promise<MonthlyCollectionsReport> {
  const range = resolveMonthRange(monthKey);

  const collections = await getCollectionsForReportRange(
    range.fromDate,
    range.toDate,
  );

  // ==========================================================
  // TOTAL COLLECTED
  // ==========================================================

  const totalCollected = collections.reduce(
    (total, collection) => total + safeNumber(collection.paymentAmount),
    0,
  );

  // ==========================================================
  // TOTAL DISCOUNT
  // ==========================================================

  const totalDiscount = collections.reduce(
    (total, collection) => total + safeNumber(collection.discountAmount),
    0,
  );

  // ==========================================================
  // LIABILITY REDUCTION
  // ==========================================================

  const liabilityReduction = totalCollected + totalDiscount;

  // ==========================================================
  // UNIQUE CUSTOMERS
  // ==========================================================

  const customerIds = new Set(
    collections
      .map((collection) => safeString(collection.customerId))
      .filter(Boolean),
  );

  // ==========================================================
  // UNIQUE LOANS
  // ==========================================================

  const loanIds = new Set(
    collections
      .map((collection) => safeString(collection.loanId))
      .filter(Boolean),
  );

  // ==========================================================
  // TRANSACTION COUNT
  // ==========================================================

  const transactionCount = collections.length;

  // ==========================================================
  // AVERAGE ACTUAL COLLECTION
  // ==========================================================

  const averageCollection =
    transactionCount > 0 ? totalCollected / transactionCount : 0;

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    ...range,

    collections,

    transactionCount,

    customerCount: customerIds.size,

    loanCount: loanIds.size,

    totalCollected,

    totalDiscount,

    liabilityReduction,

    averageCollection,

    paymentModes: buildPaymentModeSummary(collections),
  };
}

// ============================================================
// CURRENT MONTH KEY
// ============================================================

export function getCurrentReportMonthKey(): string {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

// ============================================================
// END
// ============================================================
