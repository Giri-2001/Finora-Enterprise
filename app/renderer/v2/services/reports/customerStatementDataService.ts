// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// CUSTOMER STATEMENT DATA SERVICE
//
// RESPONSIBILITY:
//
// - Load authoritative Customer profile
// - Join Customer → Loans → Collections
// - Build Customer Statement financial summary
// - Preserve Loan authoritative outstanding
// - Preserve Collection actual payment values
// - Calculate settlement adjustments separately
//
// IMPORTANT:
//
// - Customer comes through CustomerService
// - Loans come through LoanService
// - Collections come through CollectionService
// - No repository access
// - No StorageManager access
// - No PDF logic
// - No UI logic
//
// REPORTING RULE:
//
// Current Outstanding:
//
//   SUM(active/running Loan.outstanding)
//
// Total Collected:
//
//   SUM(Collection.paymentAmount)
//
// Settlement Adjustment:
//
//   Closed Loan contractual value
//   not represented by actual payment / explicit discount.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CustomerProfile } from "../../types/customers";

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import { customerService } from "../customer/customerService";

import { fetchLoans } from "../loan/loanService";

import { loadCollections } from "../collection/collectionService";

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

// ============================================================
// TYPES
// ============================================================

export interface CustomerStatementLoanRecord {
  id: string;

  loanNumber: string;

  title: string;

  status: string;

  repaymentType: string;

  loanDate: string;

  principal: number;

  totalPayable: number;

  totalCollected: number;

  totalDiscount: number;

  settlementAdjustment: number;

  currentOutstanding: number;

  collectionCount: number;
}

export interface CustomerStatementCollectionRecord {
  receiptNumber: string;

  receiptDate: string;

  loanId: string;

  loanNumber: string;

  paymentAmount: number;

  discountAmount: number;

  outstandingBalance: number;

  paymentMethod: string;

  paymentReference: string;

  remarks: string;
}

export interface CustomerStatementAddress {
  houseNumber: string;

  street: string;

  landmark: string;

  area: string;

  village: string;

  mandal: string;

  city: string;

  district: string;

  state: string;

  country: string;

  pinCode: string;
}

export interface CustomerReportStatement {
  customer: CustomerProfile;

  customerId: string;

  customerName: string;

  displayName: string;

  mobileNumber: string;

  whatsappNumber: string;

  email: string;

  fatherName: string;

  branchId: string;

  businessName: string;

  customerSince: string;

  status: string;

  risk: string;

  rating: number;

  address: CustomerStatementAddress;

  loans: CustomerStatementLoanRecord[];

  collections: CustomerStatementCollectionRecord[];

  totalLoans: number;

  activeLoans: number;

  closedLoans: number;

  totalPrincipal: number;

  totalPayable: number;

  totalCollected: number;

  totalDiscount: number;

  settlementAdjustment: number;

  currentOutstanding: number;

  collectionCount: number;
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

function isActiveLoan(loan: Loan): boolean {
  const status = normalizeStatus(loan.status);

  return status === "ACTIVE" || status === "RUNNING";
}

// ============================================================
// CLOSED LOAN
// ============================================================

function isClosedLoan(loan: Loan): boolean {
  return normalizeStatus(loan.status) === "CLOSED";
}

// ============================================================
// LOAN SCHEDULE
// ============================================================

function getLoanSchedule(loan: Loan): Array<Record<string, unknown>> {
  const record = loan as Loan & Record<string, unknown>;

  if (Array.isArray(record.schedule)) {
    return record.schedule as unknown as Array<Record<string, unknown>>;
  }

  if (Array.isArray(record.emiSchedule)) {
    return record.emiSchedule as Array<Record<string, unknown>>;
  }

  if (Array.isArray(record.installments)) {
    return record.installments as Array<Record<string, unknown>>;
  }

  return [];
}

// ============================================================
// TOTAL PAYABLE
// ============================================================

function resolveLoanTotalPayable(loan: Loan): number {
  const record = loan as Loan & Record<string, unknown>;

  // ==========================================================
  // EXPLICIT TOTAL
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
  // PERSISTED SCHEDULE
  // ==========================================================

  const schedule = getLoanSchedule(loan);

  const scheduleTotal = schedule.reduce(
    (total, installment) =>
      total +
      safeNumber(
        installment.installmentAmount ??
          installment.amount ??
          installment.emiAmount,
      ),
    0,
  );

  if (scheduleTotal > 0) {
    return scheduleTotal;
  }

  // ==========================================================
  // PRINCIPAL + TOTAL INTEREST
  // ==========================================================

  const principal = safeNumber(loan.amount);

  const interestCandidates = [
    record.totalInterest,
    record.interestAmount,
    record.totalInterestAmount,
  ];

  for (const candidate of interestCandidates) {
    const interest = safeNumber(candidate);

    if (interest > 0) {
      return principal + interest;
    }
  }

  return principal;
}

// ============================================================
// COLLECTION TIMESTAMP
// ============================================================

function getCollectionTimestamp(collection: CollectionReviewData): number {
  const source =
    safeString(collection.createdAt) || safeString(collection.receiptDate);

  const timestamp = new Date(source).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

// ============================================================
// NORMALIZE COLLECTION
// ============================================================

function normalizeCollection(
  collection: CollectionReviewData,
): CustomerStatementCollectionRecord {
  return {
    receiptNumber: safeString(collection.receiptNumber),

    receiptDate: safeString(collection.receiptDate),

    loanId: safeString(collection.loanId),

    loanNumber: safeString(collection.loanNumber),

    paymentAmount: safeNumber(collection.paymentAmount),

    discountAmount: safeNumber(collection.discountAmount),

    outstandingBalance: safeNumber(collection.outstandingBalance),

    paymentMethod: safeString(collection.paymentMethod),

    paymentReference: safeString(collection.paymentReference),

    remarks: safeString(collection.remarks),
  };
}

// ============================================================
// BUILD CUSTOMER STATEMENT
// ============================================================

// FINORA_C80_B23_D3_C_LIFETIME_REPAYMENT_RATING
// Report-only customer repayment evidence. No profile mutation.
// PARTIAL is not itself a negative credit event.
// Unverifiable schedules cannot receive an assumed perfect score.

function calculateCustomerRepaymentRating(
  loans: Loan[],
): { risk: string; rating: number } {
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const toDate = (value: unknown): string => {
    if (typeof value !== "string") {
      return "";
    }

    const date = value.trim().slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return "";
    }

    const parsed = new Date(`${date}T00:00:00Z`);

    return Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
      ? date
      : "";
  };

  const events: Array<{
    date: string;
    overdue: boolean;
    onTime: boolean;
  }> = [];

  let incompleteEvidence = false;

  // FINORA_C80_B23_D6_B_UNPAID_OVERDUE_HIGH
  // An unresolved overdue blocks LOW/MEDIUM classification.
  let hasUnpaidOverdue = false;

  for (const loan of loans) {
    const schedule = getLoanSchedule(loan);

    if (schedule.length === 0) {
      incompleteEvidence = true;
      continue;
    }

    for (const installment of schedule) {
      const dueDate = toDate(installment.dueDate);
      const paidDate = toDate(installment.paidDate);

      const status = String(installment.status ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

      const amount = safeNumber(
        installment.installmentAmount ??
          installment.amount ??
          installment.emiAmount,
      );

      const paid = safeNumber(installment.paidAmount);
      const waived = safeNumber(installment.waivedAmount);

      if (!dueDate || amount <= 0) {
        incompleteEvidence = true;
        continue;
      }

      const fullySettled = paid + waived >= amount;
      const isFinal =
        status === "paid" ||
        status === "overdue paid" ||
        status === "preclosed";

      // PRE-CLOSED is not treated as on-time payment evidence.
      if (status === "preclosed") {
        continue;
      }

      const historicalOverdue = status === "overdue paid";
      const latePayment = Boolean(
        paidDate && paidDate > dueDate && fullySettled,
      );

      const unpaidPastDue =
        dueDate < today &&
        !fullySettled &&
        !isFinal;

      const isOverdue =
        historicalOverdue ||
        latePayment ||
        unpaidPastDue ||
        (status === "overdue" && !fullySettled);

      if (isOverdue) {
        if (
          !fullySettled &&
          (unpaidPastDue || status === "overdue")
        ) {
          hasUnpaidOverdue = true;
        }

        events.push({
          date: paidDate || dueDate,
          overdue: true,
          onTime: false,
        });

        continue;
      }

      if (fullySettled) {
        // Without a payment date, punctuality cannot be proven.
        // Waiver alone is not successful repayment evidence.
        if (!paidDate || paid < amount) {
          incompleteEvidence = true;
          continue;
        }

        events.push({
          date: paidDate,
          overdue: false,
          onTime: paidDate <= dueDate,
        });

        continue;
      }

      // A future PARTIAL can represent advance payment.
      // It does not count as negative or positive evidence.
      if (dueDate >= today) {
        continue;
      }

      incompleteEvidence = true;
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  let overdueCount = 0;
  let recoveryStreak = 0;
  let verifiedOnTime = 0;

  for (const event of events) {
    if (event.overdue) {
      overdueCount += 1;
      recoveryStreak = 0;
    } else if (event.onTime) {
      verifiedOnTime += 1;

      if (overdueCount > 0) {
        recoveryStreak += 1;
      }
    }
  }

  if (overdueCount === 0) {
    if (incompleteEvidence) {
      return { risk: "UNVERIFIED", rating: 0 };
    }

    if (verifiedOnTime === 0) {
      return { risk: "NOT RATED", rating: 0 };
    }

    return { risk: "LOW", rating: 5 };
  }

  // Historical overdue is permanent evidence.
  // Every two consecutive verified on-time payments
  // following the latest breach recover 0.5 rating.
  const penalty = overdueCount * 1.5;
  const recovery = Math.floor(recoveryStreak / 2) * 0.5;

  const rawRating = Math.max(
    1,
    Math.min(4.5, 5 - penalty + recovery),
  );

  const rating = Math.round(rawRating * 2) / 2;

  const risk =
    hasUnpaidOverdue
      ? "HIGH"
      : recoveryStreak >= 6 && !incompleteEvidence
        ? "LOW"
        : recoveryStreak >= 3
          ? "MEDIUM"
          : "HIGH";

  return { risk, rating };
}
export async function buildCustomerReportStatement(
  customerId: string,
): Promise<CustomerReportStatement | null> {
  const normalizedCustomerId = safeString(customerId);

  if (!normalizedCustomerId) {
    return null;
  }

  // ==========================================================
  // LOAD AUTHORITATIVE DATA
  // ==========================================================

  const [customerResult, loans, collections] = await Promise.all([
    customerService.getAll(),
    fetchLoans(),
    loadCollections(),
  ]);

  if (!customerResult.success) {
    throw new Error(customerResult.error ?? "Unable to load Customer records.");
  }

  const customers = customerResult.data ?? [];

  // ==========================================================
  // SELECT CUSTOMER
  // ==========================================================

  const customer = customers.find(
    (item) => safeString(item.identity.customerId) === normalizedCustomerId,
  );

  if (!customer) {
    return null;
  }

  // ==========================================================
  // CUSTOMER LOANS
  // ==========================================================

  const customerLoans = loans.filter(
    (loan) => safeString(loan.customerId) === normalizedCustomerId,
  );

  const repaymentRating =
    calculateCustomerRepaymentRating(customerLoans);

  const customerLoanIds = new Set(
    customerLoans.map((loan) => safeString(loan.id)),
  );

  // ==========================================================
  // CUSTOMER COLLECTIONS
  //
  // Match by authoritative Loan identity.
  // ==========================================================

  const customerCollections = collections
    .filter((collection) => customerLoanIds.has(safeString(collection.loanId)))
    .sort(
      (left, right) =>
        getCollectionTimestamp(left) - getCollectionTimestamp(right),
    );

  // ==========================================================
  // BUILD LOAN REPORT ROWS
  // ==========================================================

  const reportLoans: CustomerStatementLoanRecord[] = customerLoans.map(
    (loan) => {
      const loanId = safeString(loan.id);

      const loanCollections = customerCollections.filter(
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

      const totalPayable = resolveLoanTotalPayable(loan);

      const currentOutstanding = safeNumber(loan.outstanding);

      const settlementAdjustment = isClosedLoan(loan)
        ? Math.max(
            0,
            totalPayable - totalCollected - totalDiscount - currentOutstanding,
          )
        : 0;

      const record = loan as Loan & Record<string, unknown>;

      return {
        id: loanId,

        loanNumber: safeString(loan.loanNumber || loan.id),

        title: safeString(loan.title ?? record.loanTitle ?? record.purpose),

        status: normalizeStatus(loan.status),

        repaymentType: safeString(record.repaymentType ?? record.loanType),

        loanDate: safeString(loan.loanDate),

        principal: safeNumber(loan.amount),

        totalPayable,

        totalCollected,

        totalDiscount,

        settlementAdjustment,

        currentOutstanding,

        collectionCount: loanCollections.length,
      };
    },
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalPrincipal = reportLoans.reduce(
    (total, loan) => total + loan.principal,
    0,
  );

  const totalPayable = reportLoans.reduce(
    (total, loan) => total + loan.totalPayable,
    0,
  );

  const totalCollected = reportLoans.reduce(
    (total, loan) => total + loan.totalCollected,
    0,
  );

  const totalDiscount = reportLoans.reduce(
    (total, loan) => total + loan.totalDiscount,
    0,
  );

  const settlementAdjustment = reportLoans.reduce(
    (total, loan) => total + loan.settlementAdjustment,
    0,
  );

  const currentOutstanding = reportLoans
    .filter((loan) => loan.status === "ACTIVE" || loan.status === "RUNNING")
    .reduce((total, loan) => total + loan.currentOutstanding, 0);

  // ==========================================================
  // ADDRESS
  // ==========================================================

  const currentAddress = customer.address.currentAddress;

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    customer,

    customerId: customer.identity.customerId,

    customerName: safeString(customer.basic.fullName),

    displayName: safeString(customer.basic.displayName),

    mobileNumber: safeString(customer.basic.mobileNumber),

    whatsappNumber: safeString(
      customer.basic.whatsappNumber ?? customer.basic.mobileNumber,
    ),

    email: safeString(customer.basic.email),

    fatherName: safeString(customer.basic.fatherName),

    branchId: safeString(
      customer.internal.branchId || customer.identity.branchId,
    ),

    businessName: safeString(customer.identity.businessName),

    customerSince: safeString(
      customer.internal.customerSince || customer.identity.createdAt,
    ),

    status: safeString(customer.internal.status),

    risk: repaymentRating.risk,

    rating: repaymentRating.rating,

    address: {
      houseNumber: safeString(currentAddress.houseNumber),

      street: safeString(currentAddress.street),

      landmark: safeString(currentAddress.landmark),

      area: safeString(currentAddress.area),

      village: safeString(currentAddress.village),

      mandal: safeString(currentAddress.mandal),

      city: safeString(currentAddress.city),

      district: safeString(currentAddress.district),

      state: safeString(currentAddress.state),

      country: safeString(currentAddress.country),

      pinCode: safeString(currentAddress.pinCode),
    },

    loans: reportLoans,

    collections: customerCollections.map(normalizeCollection),

    totalLoans: reportLoans.length,

    activeLoans: customerLoans.filter(isActiveLoan).length,

    closedLoans: customerLoans.filter(isClosedLoan).length,

    totalPrincipal,

    totalPayable,

    totalCollected,

    totalDiscount,

    settlementAdjustment,

    currentOutstanding,

    collectionCount: customerCollections.length,
  };
}

// ============================================================
// LOAD REPORT CUSTOMERS
// ============================================================

export async function loadCustomerReportCustomers(): Promise<
  CustomerProfile[]
> {
  const result = await customerService.getAll();

  if (!result.success) {
    throw new Error(result.error ?? "Unable to load Customer records.");
  }

  return (result.data ?? [])
    .filter(
      (customer) =>
        customer.identity.isActive &&
        !customer.identity.isDeleted &&
        !customer.internal.isDeleted,
    )
    .sort((left, right) =>
      safeString(left.basic.fullName).localeCompare(
        safeString(right.basic.fullName),
      ),
    );
}

// ============================================================
// END
// ============================================================
