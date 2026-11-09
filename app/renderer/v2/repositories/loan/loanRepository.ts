import { projectManualPenaltyScheduleSettlement } from "./manualPenaltyScheduleSettlement";
// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOAN REPOSITORY™
//
// REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist Loan records through StorageManager
// - Keep Loan domain model unchanged
// - Use Loan.id as persistent storage identity
// - Preserve existing Loan CRUD behavior
// - Preserve existing Loan outstanding update behavior
// - Persist selected EMI payment state
// - Persist manual collection allocation into EMI schedule
// - Support final settlement discount / waiver
// - Persist EMI receipt / paid-date information
// - Finalize EMI schedule when a Loan is fully settled
// - Repair legacy closed-loan schedule inconsistencies
// - Keep physical storage implementation outside Loan domain
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No UI logic.
// - No Collection UI logic.
// - No Payment UI logic.
// - Storage access goes through StorageManager.
//
// PAYMENT VS SETTLEMENT:
//
// Actual Payment:
//
//   Amount physically collected from the customer.
//
// Discount:
//
//   Approved waiver / settlement adjustment.
//   Discount reduces Loan liability but MUST NOT be written
//   into EMI paidAmount as though cash was received.
//
// Example:
//
//   Current outstanding = ₹9,250
//   Customer payment    = ₹9,100
//   Discount            = ₹  150
//
//   Settlement value    = ₹9,250
//   New outstanding     = ₹0
//
// EMI metadata:
//
//   paidAmount increases only by ₹9,100.
//
// The remaining ₹150 is waived.
//
// Because the Loan is now fully settled:
//
//   Loan status = CLOSED
//
// Any remaining non-paid schedule row becomes:
//
//   Preclosed
//
// so no future EMI remains collectible.
//
// SELECTED EMI COLLECTION:
//
// - When selectedEmiNumbers are supplied, actual payment metadata
//   is written ONLY into those selected EMI rows.
// - Paid / Preclosed rows remain immutable.
// - Partial EMI payments accumulate.
// - Only the remaining amount of a Partial EMI can be collected.
// - Any payment amount beyond selected EMI remaining value is
//   never incorrectly pushed into another EMI row.
//
// MANUAL COLLECTION:
//
// - When no selectedEmiNumbers are supplied, the collection is
//   treated as a manual Loan payment.
// - Manual collection still reduces the authoritative Loan
//   outstanding.
// - The actual payment is reflected in the existing EMI schedule.
// - Allocation begins from the earliest collectible installment.
// - Paid / Preclosed rows are skipped.
// - Partial rows consume only their remaining amount.
// - Payment continues sequentially into later collectible rows.
// - Original installmentAmount is NEVER mutated.
// - Existing paidAmount is accumulated.
//
// DISCOUNT:
//
// - Discount reduces authoritative Loan outstanding.
// - Discount never increases EMI paidAmount.
// - When payment + discount closes the Loan, remaining
//   contractual schedule liability becomes Preclosed.
// - Actual paidAmount remains preserved.
//
// EMI schedule is NEVER generated here.
// Existing persisted schedule is the only schedule source.
//
// LOAN CLOSURE:
//
// - Loan outstanding reaching zero is authoritative.
// - Loan status becomes CLOSED.
// - Fully-paid installments remain Paid.
// - Remaining unpaid / partially-paid installments become
//   Preclosed because no further amount is collectible.
// - Actual paidAmount is preserved.
// - No artificial payment is created.
// - Remaining installment outstandingBalance becomes zero when
//   that field already exists.
//
// VERSION : 2.6
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { Loan } from "../../components/customers/office/CustomerOffice/types";

import { storageManager } from "../../storage/storageManager";

import type { StorageQuery, StorageResult } from "../../storage/storage.types";

// ============================================================
// CONSTANTS
// ============================================================

const LOAN_ENTITY = "LOAN";

interface LoanStorageRecord extends Loan {
  entity: typeof LOAN_ENTITY;
}

function toLoanStorageRecord(loan: Loan): LoanStorageRecord {
  return {
    ...loan,
    entity: LOAN_ENTITY,
  };
}

// ============================================================
// TYPES
// ============================================================

export interface LoanScheduleInstallment {
  installmentNumber: number;

  dueDate?: string;

  installmentAmount?: number;

  principalAmount?: number;

  interestAmount?: number;

  outstandingBalance?: number;

  paidAmount?: number;
  waivedAmount?: number;

  penaltyAmount?: number;
  // PAISARULE_C125_R205_PENALTY_SETTLEMENT
  // penaltyAmount: assessed fee, never proof of payment.
  // Optional for backward compatibility with existing loans.
  penaltyPaidAmount?: number;
  penaltyWaivedAmount?: number;

  receiptNumber?: string;

  paidDate?: string;

  status?: string;
}

// ============================================================
// INTERNAL LOAN STORAGE SHAPE
// ============================================================

type LoanWithPossibleSchedule = Loan & {
  schedule?: unknown;

  emiSchedule?: unknown;

  installments?: unknown;
};

// ============================================================
// LOAN OUTSTANDING UPDATE OPTIONS
// ============================================================

export interface LoanOutstandingUpdateOptions {
  // ==========================================================
  // SELECTED EMI NUMBERS
  // ==========================================================

  selectedEmiNumbers?: number[];

  // ==========================================================
  // PAYMENT RECEIPT
  // ==========================================================

  receiptNumber?: string;

  // ==========================================================
  // PAYMENT DATE
  // ==========================================================

  paidDate?: string;

  // ==========================================================
  // DISCOUNT / WAIVER
  //
  // IMPORTANT:
  //
  // This reduces Loan liability.
  //
  // It does NOT become EMI paidAmount.
  // ==========================================================

  discountAmount?: number;
  manualPrincipalAmount?: number;
  penaltyAmount?: number;

  // PAISARULE_C141_R9B
  // Confirmed Preclose discount reduces Loan liability
  // without becoming EMI waivedAmount.
  allowPrecloseDiscount?: boolean;
}

// ============================================================
// NORMALIZE POSITIVE NUMBER
// ============================================================

function safePositiveNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

// ============================================================
// NORMALIZE STATUS
// ============================================================

function normalizeInstallmentStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

// ============================================================
// NORMALIZE EMI NUMBER LIST
// ============================================================

function normalizeSelectedEmiNumbers(values?: number[]): number[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

// ============================================================
// DETECT PERSISTED EMI SCHEDULE
// ============================================================

export function getPersistedSchedule(loan: Loan): {
  field: "schedule" | "emiSchedule" | "installments" | undefined;

  schedule: LoanScheduleInstallment[] | undefined;
} {
  const candidate = loan as LoanWithPossibleSchedule;

  if (Array.isArray(candidate.schedule)) {
    return {
      field: "schedule",

      schedule: candidate.schedule as LoanScheduleInstallment[],
    };
  }

  if (Array.isArray(candidate.emiSchedule)) {
    return {
      field: "emiSchedule",

      schedule: candidate.emiSchedule as LoanScheduleInstallment[],
    };
  }

  if (Array.isArray(candidate.installments)) {
    return {
      field: "installments",

      schedule: candidate.installments as LoanScheduleInstallment[],
    };
  }

  return {
    field: undefined,

    schedule: undefined,
  };
}

// ============================================================
// BUILD LOAN WITH PERSISTED SCHEDULE
// ============================================================

function applyUpdatedSchedule(
  loan: Loan,
  field: "schedule" | "emiSchedule" | "installments",
  updatedSchedule: LoanScheduleInstallment[],
): Loan {
  const candidate = loan as LoanWithPossibleSchedule;

  if (field === "schedule") {
    return {
      ...candidate,

      schedule: updatedSchedule,
    } as Loan;
  }

  if (field === "emiSchedule") {
    return {
      ...candidate,

      emiSchedule: updatedSchedule,
    } as Loan;
  }

  return {
    ...candidate,

    installments: updatedSchedule,
  } as Loan;
}

// ============================================================
// GET INSTALLMENT REMAINING AMOUNT
// ============================================================

function getInstallmentRemainingAmount(
  installment: LoanScheduleInstallment,
): number {
  const status = normalizeInstallmentStatus(installment.status);

  if (status === "paid" || status === "overdue paid" || status === "preclosed") {
    return 0;
  }

  const installmentAmount = safePositiveNumber(installment.installmentAmount);

  const paidAmount = safePositiveNumber(installment.paidAmount);

  const waivedAmount = safePositiveNumber(
    installment.waivedAmount,
  );

  return Math.max(
    0,

    installmentAmount - paidAmount - waivedAmount,
  );
}

// ============================================================
// APPLY ACTUAL PAYMENT TO INSTALLMENT
// ============================================================
//
// IMPORTANT:
//
// Only actual customer payment reaches this function.
//
// Discount / waiver is NEVER passed here.
//
// ============================================================

function applyPaymentToInstallment(
  installment: LoanScheduleInstallment,
  paymentAmount: number,
  receiptNumber: string,
  paidDate: string,
): {
  installment: LoanScheduleInstallment;

  consumedAmount: number;
} {
  const status = normalizeInstallmentStatus(installment.status);

  // ==========================================================
  // LOCKED FINAL STATUS
  // ==========================================================

  if (status === "paid" || status === "overdue paid" || status === "preclosed") {
    return {
      installment: {
        ...installment,
      },

      consumedAmount: 0,
    };
  }

  // ==========================================================
  // CONTRACTUAL INSTALLMENT AMOUNT
  // ==========================================================

  const installmentAmount = safePositiveNumber(installment.installmentAmount);

  if (installmentAmount <= 0) {
    return {
      installment: {
        ...installment,
      },

      consumedAmount: 0,
    };
  }

  // ==========================================================
  // EXISTING PAID AMOUNT
  // ==========================================================

  const existingPaidAmount = safePositiveNumber(installment.paidAmount);

  // ==========================================================
  // REMAINING INSTALLMENT AMOUNT
  // ==========================================================

  const remainingInstallmentAmount = Math.max(
    0,

    installmentAmount - existingPaidAmount,
  );

  // ==========================================================
  // ALREADY COMPLETE
  // ==========================================================

  // FINORA_C80_B23_C2_C10_D_OVERDUE_PAYMENT_STATUS
  // Preserve payment history: a fully paid late EMI is Overdue Paid.
  const dueDate = String(installment.dueDate ?? "").trim().slice(0, 10);
  const paymentDate = String(paidDate ?? "").trim().slice(0, 10);

  const validDate = /^\d{4}-\d{2}-\d{2}$/;

  const wasOverdueAtPayment =
    status === "overdue" ||
    (
      validDate.test(dueDate) &&
      validDate.test(paymentDate) &&
      dueDate < paymentDate
    );

  if (remainingInstallmentAmount <= 0) {
    const completedInstallment: LoanScheduleInstallment = {
      ...installment,

      paidAmount: installmentAmount,

      status: wasOverdueAtPayment ? "Overdue Paid" : "Paid",
    };

    if (typeof installment.outstandingBalance === "number") {
      completedInstallment.outstandingBalance = 0;
    }

    return {
      installment: completedInstallment,

      consumedAmount: 0,
    };
  }

  // ==========================================================
  // PAYMENT AVAILABLE
  // ==========================================================

  const availablePayment = safePositiveNumber(paymentAmount);

  if (availablePayment <= 0) {
    return {
      installment: {
        ...installment,
      },

      consumedAmount: 0,
    };
  }

  // ==========================================================
  // PAYMENT FOR THIS INSTALLMENT
  // ==========================================================

  const paymentForInstallment = Math.min(
    remainingInstallmentAmount,

    availablePayment,
  );

  // ==========================================================
  // NEW PAID AMOUNT
  // ==========================================================

  const newPaidAmount = Math.min(
    installmentAmount,

    existingPaidAmount + paymentForInstallment,
  );

  // ==========================================================
  // NEW STATUS
  // ==========================================================

  const newStatus =
    newPaidAmount >= installmentAmount
      ? wasOverdueAtPayment
        ? "Overdue Paid"
        : "Paid"
      : "Partial";

  // ==========================================================
  // UPDATED INSTALLMENT
  // ==========================================================

  const updatedInstallment: LoanScheduleInstallment = {
    ...installment,

    paidAmount: newPaidAmount,

    status: newStatus,

    ...(receiptNumber
      ? {
          receiptNumber,
        }
      : {}),

    ...(paidDate
      ? {
          paidDate,
        }
      : {}),
  };

  // ==========================================================
  // OPTIONAL ROW OUTSTANDING
  // ==========================================================

  if (typeof installment.outstandingBalance === "number") {
    updatedInstallment.outstandingBalance = Math.max(
      0,

      installment.outstandingBalance - paymentForInstallment,
    );
  }

  return {
    installment: updatedInstallment,

    consumedAmount: paymentForInstallment,
  };
}

// ============================================================
// ALLOCATE SELECTED EMI PAYMENT
// ============================================================

function allocateSelectedEmiPayment(
  schedule: LoanScheduleInstallment[],
  selectedEmiNumbers: number[],
  actualPaymentAmount: number,
  receiptNumber: string,
  paidDate: string,
): LoanScheduleInstallment[] {
  const selectedSet = new Set(selectedEmiNumbers);

  const selectedRemainingTotal = schedule.reduce((total, installment) => {
    const installmentNumber = Number(installment.installmentNumber);

    if (!selectedSet.has(installmentNumber)) {
      return total;
    }

    return total + getInstallmentRemainingAmount(installment);
  }, 0);

  let remainingEmiPayment = Math.min(
    safePositiveNumber(actualPaymentAmount),

    selectedRemainingTotal,
  );

  return schedule.map((installment) => {
    const installmentNumber = Number(installment.installmentNumber);

    if (!selectedSet.has(installmentNumber)) {
      return {
        ...installment,
      };
    }

    const result = applyPaymentToInstallment(
      installment,

      remainingEmiPayment,

      receiptNumber,

      paidDate,
    );

    remainingEmiPayment = Math.max(
      0,

      remainingEmiPayment - result.consumedAmount,
    );

    return result.installment;
  });
}

// ============================================================
// ALLOCATE MANUAL ACTUAL PAYMENT
// ============================================================
//
// Discount is intentionally excluded.
//
// Example:
//
// Actual payment = ₹9,100
// Discount       = ₹150
//
// Only ₹9,100 enters EMI paidAmount.
//
// ============================================================

// ============================================================
// APPLY DISCOUNT / WAIVER TO INSTALLMENT
// ============================================================
//
// IMPORTANT:
//
// Discount settles contractual liability but is NOT cash.
// Therefore:
//
// - paidAmount remains actual customer cash only.
// - waivedAmount records the waived contractual amount.
// - paidAmount + waivedAmount determines settlement state.
// ============================================================

function applyDiscountToInstallment(
  installment: LoanScheduleInstallment,
  discountAmount: number,
  receiptNumber: string,
  paidDate: string,
): {
  installment: LoanScheduleInstallment;
  consumedAmount: number;
} {
  const status = normalizeInstallmentStatus(
    installment.status,
  );

  if (
    status === "paid" ||
    status === "overdue paid" ||
    status === "preclosed"
  ) {
    return {
      installment: { ...installment },
      consumedAmount: 0,
    };
  }

  const remainingAmount =
    getInstallmentRemainingAmount(installment);

  if (remainingAmount <= 0) {
    return {
      installment: { ...installment },
      consumedAmount: 0,
    };
  }

  const consumedAmount = Math.min(
    safePositiveNumber(discountAmount),
    remainingAmount,
  );

  if (consumedAmount <= 0) {
    return {
      installment: { ...installment },
      consumedAmount: 0,
    };
  }

  const installmentAmount = safePositiveNumber(
    installment.installmentAmount,
  );

  const paidAmount = safePositiveNumber(
    installment.paidAmount,
  );

  const existingWaivedAmount = safePositiveNumber(
    installment.waivedAmount,
  );

  const nextWaivedAmount =
    existingWaivedAmount + consumedAmount;

  const fullySettled =
    paidAmount + nextWaivedAmount >= installmentAmount;

  const dueDate = String(installment.dueDate ?? "")
    .trim()
    .slice(0, 10);

  const normalizedPaidDate = String(paidDate ?? "")
    .trim()
    .slice(0, 10);

  const overdueByDate =
    dueDate.length === 10 &&
    normalizedPaidDate.length === 10 &&
    dueDate < normalizedPaidDate;

  const wasOverdue =
    status === "overdue" ||
    status === "overdue paid" ||
    overdueByDate;

  return {
    installment: {
      ...installment,

      waivedAmount: nextWaivedAmount,

      receiptNumber:
        receiptNumber || installment.receiptNumber,

      paidDate:
        paidDate || installment.paidDate,

      status: fullySettled
        ? wasOverdue
          ? "Overdue Paid"
          : "Paid"
        : "Partial",
    },

    consumedAmount,
  };
}

// ============================================================
// ALLOCATE MANUAL DISCOUNT
// ============================================================

function allocateManualDiscount(
  schedule: LoanScheduleInstallment[],
  discountAmount: number,
  receiptNumber: string,
  paidDate: string,
): LoanScheduleInstallment[] {
  let remainingDiscount = safePositiveNumber(
    discountAmount,
  );

  return schedule.map((installment) => {
    if (remainingDiscount <= 0) {
      return { ...installment };
    }

    const result = applyDiscountToInstallment(
      installment,
      remainingDiscount,
      receiptNumber,
      paidDate,
    );

    remainingDiscount = Math.max(
      0,
      remainingDiscount - result.consumedAmount,
    );

    return result.installment;
  });
}

// ============================================================
// ALLOCATE SELECTED EMI DISCOUNT
// ============================================================

function allocateSelectedEmiDiscount(
  schedule: LoanScheduleInstallment[],
  selectedEmiNumbers: number[],
  discountAmount: number,
  receiptNumber: string,
  paidDate: string,
): LoanScheduleInstallment[] {
  const selectedSet = new Set(selectedEmiNumbers);

  let remainingDiscount = safePositiveNumber(
    discountAmount,
  );

  return schedule.map((installment) => {
    if (remainingDiscount <= 0) {
      return { ...installment };
    }

    const installmentNumber = Number(
      installment.installmentNumber,
    );

    if (!selectedSet.has(installmentNumber)) {
      return { ...installment };
    }

    const result = applyDiscountToInstallment(
      installment,
      remainingDiscount,
      receiptNumber,
      paidDate,
    );

    remainingDiscount = Math.max(
      0,
      remainingDiscount - result.consumedAmount,
    );

    return result.installment;
  });
}


function allocateManualPayment(
  schedule: LoanScheduleInstallment[],
  actualPaymentAmount: number,
  receiptNumber: string,
  paidDate: string,
): LoanScheduleInstallment[] {
  let remainingManualPayment = safePositiveNumber(actualPaymentAmount);

  return schedule.map((installment) => {
    if (remainingManualPayment <= 0) {
      return {
        ...installment,
      };
    }

    const remainingInstallmentAmount =
      getInstallmentRemainingAmount(installment);

    if (remainingInstallmentAmount <= 0) {
      return {
        ...installment,
      };
    }

    const result = applyPaymentToInstallment(
      installment,

      remainingManualPayment,

      receiptNumber,

      paidDate,
    );

    remainingManualPayment = Math.max(
      0,

      remainingManualPayment - result.consumedAmount,
    );

    return result.installment;
  });
}

// ============================================================
// FINALIZE CLOSED-LOAN SCHEDULE
// ============================================================
//
// Outstanding = 0 means no future collectible liability.
//
// Paid:
//   stays Paid.
//
// Preclosed:
//   stays Preclosed.
//
// Pending / Partial / Overdue:
//   becomes Preclosed.
//
// paidAmount is preserved.
//
// ============================================================

function finalizeClosedSchedule(
  schedule: LoanScheduleInstallment[],
  closureDate?: string,
): {
  schedule: LoanScheduleInstallment[];

  changed: boolean;
} {
  let changed = false;

  const finalizedSchedule = schedule.map((installment) => {
    const normalizedStatus = normalizeInstallmentStatus(installment.status);

    // PAISARULE_C145_R15R3_OVERDUE_CLOSE_STATUS_AUTHORITY
    // Matured EMI + actually-paid penalty is Overdue Paid.
    // Only future / unmatured residual closure is Preclosed.
    const dueDate = String(installment.dueDate ?? "").slice(0, 10);
    const persistedPaidDate =
      String(installment.paidDate ?? "").slice(0, 10);
    const normalizedClosureDate =
      String(closureDate ?? "").slice(0, 10);
    const effectivePaidDate =
      persistedPaidDate || normalizedClosureDate;
    const penaltyPaid =
      safePositiveNumber(installment.penaltyPaidAmount);

    const closedAsOverduePaid =
      /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(effectivePaidDate) &&
      dueDate < effectivePaidDate &&
      penaltyPaid > 0;

    if (
      closedAsOverduePaid &&
      normalizedStatus !== "paid" &&
      normalizedStatus !== "overdue paid" &&
      normalizedStatus !== "preclosed"
    ) {
      changed = true;

      return {
        ...installment,
        status: "Overdue Paid",
      };
    }

    // ------------------------------------------------------
    // FINAL HISTORICAL STATES
    // ------------------------------------------------------

    if (
      normalizedStatus === "paid" ||
      normalizedStatus === "overdue paid" ||
      normalizedStatus === "preclosed"
    ) {
      return {
        ...installment,
      };
    }

    const installmentAmount = safePositiveNumber(installment.installmentAmount);

    const existingPaidAmount = safePositiveNumber(installment.paidAmount);

    // ------------------------------------------------------
    // ACTUALLY FULLY PAID
    // ------------------------------------------------------

    if (installmentAmount > 0 && existingPaidAmount >= installmentAmount) {
      changed = true;

      const updatedInstallment: LoanScheduleInstallment = {
        ...installment,

        paidAmount: installmentAmount,

        status: "Paid",
      };

      if (typeof installment.outstandingBalance === "number") {
        updatedInstallment.outstandingBalance = 0;
      }

      return updatedInstallment;
    }

    // ------------------------------------------------------
    // CLOSED WITH REMAINING WAIVED / PRECLOSED VALUE
    // ------------------------------------------------------

    changed = true;

    const updatedInstallment: LoanScheduleInstallment = {
      ...installment,

      paidAmount: existingPaidAmount,

      status: "Preclosed",
    };

    if (typeof installment.outstandingBalance === "number") {
      updatedInstallment.outstandingBalance = 0;
    }

    return updatedInstallment;
  });

  return {
    schedule: finalizedSchedule,

    changed,
  };
}

// ============================================================
// REPAIR CLOSED LOAN SCHEDULE
// ============================================================

function repairClosedLoanSchedule(loan: Loan): {
  loan: Loan;

  changed: boolean;
} {
  const outstanding = safePositiveNumber(loan.outstanding);

  const normalizedLoanStatus = String(loan.status ?? "")
    .trim()
    .toUpperCase();

  const isClosed = outstanding === 0 || normalizedLoanStatus === "CLOSED";

  if (!isClosed) {
    return {
      loan,

      changed: false,
    };
  }

  const persistedSchedule = getPersistedSchedule(loan);

  if (!persistedSchedule.field || !persistedSchedule.schedule) {
    return {
      loan,

      changed: false,
    };
  }

  const finalized = finalizeClosedSchedule(persistedSchedule.schedule);

  if (!finalized.changed) {
    return {
      loan,

      changed: false,
    };
  }

  return {
    loan: applyUpdatedSchedule(
      loan,

      persistedSchedule.field,

      finalized.schedule,
    ),

    changed: true,
  };
}

// ============================================================
// LOAN DATA NORMALIZATION
// ============================================================

function normalizeLoanBase(loan: Loan): Loan {
  let loanType = loan.loanType;

  let repaymentType = loan.repaymentType;

  let title = loan.title;

  // ==========================================================
  // DAILY
  // ==========================================================

  if (title?.toLowerCase().includes("daily")) {
    title = "Daily Loan";

    loanType = "DAILY";

    repaymentType = "DAILY";
  }

  // ==========================================================
  // WEEKLY
  // ==========================================================
  else if (title?.toLowerCase().includes("weekly")) {
    title = "Weekly Loan";

    loanType = "WEEKLY";

    repaymentType = "WEEKLY";
  }

  // ==========================================================
  // MONTHLY
  // ==========================================================
  else if (title?.toLowerCase().includes("monthly")) {
    title = "Monthly Loan";

    loanType = "MONTHLY";

    repaymentType = "MONTHLY";
  }

  // ==========================================================
  // YEARLY
  // ==========================================================

  else if (title?.toLowerCase().includes("yearly")) {
    title = "Yearly Loan";

    loanType = "YEARLY";

    repaymentType = "YEARLY";
  }

  return {
    ...loan,

    title,

    loanType,

    repaymentType,
  };
}

// ============================================================
// NORMALIZE LOAN
// ============================================================

function normalizeLoan(loan: Loan): Loan {
  const baseLoan = normalizeLoanBase(loan);

  return repairClosedLoanSchedule(baseLoan).loan;
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildLoanQuery(query?: Partial<StorageQuery>): StorageQuery {
  return {
    entity: LOAN_ENTITY,

    id: query?.id,

    ownerId: query?.ownerId,

    demoId: query?.demoId,

    limit: query?.limit,

    offset: query?.offset,
  };
}

// ============================================================
// GET ALL LOANS
// ============================================================

export async function getLoans(): Promise<Loan[]> {
  try {
    const result = await storageManager.getAll<Loan>(buildLoanQuery());

    if (!result.success || !result.data) {
      return [];
    }

    const loans: Loan[] = [];

    for (const storedLoan of result.data) {
      const baseLoan = normalizeLoanBase(storedLoan);

      const repaired = repairClosedLoanSchedule(baseLoan);

      if (repaired.changed) {
        await storageManager.update<LoanStorageRecord>(
          toLoanStorageRecord(repaired.loan),
        );
      }

      loans.push(repaired.loan);
    }

    return loans;
  } catch {
    return [];
  }
}

// ============================================================
// GET ALL LOANS - STRICT RESULT
// ============================================================
//
// NOTIFICATIONS ENGINE:
//
// - Distinguishes an empty Loan portfolio from a storage failure.
// - Preserves existing getLoans() compatibility behavior.
// - Uses the same normalization / closed-schedule repair rules.
// - Fails closed if authoritative repair persistence fails.
//
// ============================================================

export async function getLoansResult(): Promise<StorageResult<Loan[]>> {
  try {
    const result =
      await storageManager.getAll<Loan>(
        buildLoanQuery(),
      );

    if (!result.success) {
      return {
        success: false,

        error:
          result.error ??
          "Unable to load authoritative Loans.",
      };
    }

    const loans: Loan[] = [];

    for (const storedLoan of result.data ?? []) {
      const baseLoan =
        normalizeLoanBase(storedLoan);

      const repaired =
        repairClosedLoanSchedule(baseLoan);

      if (repaired.changed) {
        const repairResult =
          await storageManager.update<LoanStorageRecord>(
            toLoanStorageRecord(repaired.loan),
          );

        if (!repairResult.success) {
          return {
            success: false,

            error:
              repairResult.error ??
              `Unable to persist authoritative Loan repair for ${repaired.loan.id}.`,
          };
        }
      }

      loans.push(repaired.loan);
    }

    return {
      success: true,

      data: loans,
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load authoritative Loans.",
    };
  }
}

// ============================================================
// SAVE ALL LOANS
// ============================================================

export async function saveLoans(loans: Loan[]): Promise<StorageResult<void>> {
  const normalizedLoans = loans.map((loan) => {
    const baseLoan = normalizeLoanBase(loan);

    return repairClosedLoanSchedule(baseLoan).loan;
  });

  const storageRecords = normalizedLoans.map(toLoanStorageRecord);

  return storageManager.replaceAll<LoanStorageRecord>(storageRecords);
}

// ============================================================
// ADD LOAN
// ============================================================

export async function addLoan(loan: Loan): Promise<StorageResult<Loan>> {
  if (!loan.id) {
    return {
      success: false,

      error: "Loan ID is required before saving a loan.",
    };
  }

  /* ==========================================================
     AUTHORITATIVE SYSTEM AUDIT TIME

     The operational loanDate may be historical because it
     comes from the authenticated ERP Business Date.

     createdAt and updatedAt always record the actual system
     time at which this Loan persistence operation occurred.

     Caller-provided audit timestamps are intentionally ignored.
  ========================================================== */

  const systemTimestamp =
    new Date().toISOString();

  const normalizedBase =
    normalizeLoanBase({
      ...loan,

      createdAt:
        systemTimestamp,

      updatedAt:
        systemTimestamp,
    });

  const normalizedLoan =
    repairClosedLoanSchedule(
      normalizedBase,
    ).loan;

  const existing = await storageManager.get<Loan>({
    entity: LOAN_ENTITY,

    id: normalizedLoan.id,
  });

  if (!existing.success) {
    return {
      success: false,

      error:
        existing.error ?? "Unable to verify whether the loan already exists.",
    };
  }

  if (existing.data) {
    return {
      success: false,

      error: "Loan with this ID already exists.",
    };
  }

  // PAISARULE_C133_R10_UNIQUE_LOAN_NUMBER
  // Include Closed and Preclosed Loans. No repair or data mutation.
  // FIN and PAISA loan prefixes refer to the same displayed number.
  const canonicalLoanNumber = (value: unknown): string =>
    String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/^FIN-LOAN-/, "PAISA-LOAN-");

  const requestedLoanNumber =
    canonicalLoanNumber(normalizedLoan.loanNumber);

  if (!requestedLoanNumber) {
    return {
      success: false,
      error: "Loan Number is required before saving.",
    };
  }

  const historicalLoansResult =
    await storageManager.getAll<LoanStorageRecord>(
      buildLoanQuery(),
    );

  if (
    !historicalLoansResult.success ||
    !Array.isArray(historicalLoansResult.data)
  ) {
    return {
      success: false,
      error:
        historicalLoansResult.error ??
        "Unable to verify existing Loan Numbers. Loan Save blocked.",
    };
  }

  const duplicateLoanNumber =
    historicalLoansResult.data.some(
      (historicalLoan) =>
        canonicalLoanNumber(historicalLoan.loanNumber) ===
        requestedLoanNumber,
    );

  if (duplicateLoanNumber) {
    return {
      success: false,
      error:
        "Loan Number already exists. Loan Save blocked. " +
        "Refresh the Loan Number preview before retrying.",
    };
  }

  const result = await storageManager.save<LoanStorageRecord>(
    toLoanStorageRecord(normalizedLoan),
  );

  if (!result.success) {
    return {
      success: false,

      error: result.error ?? "Unable to save loan.",
    };
  }

  return {
    success: true,

    data: normalizedLoan,
  };
}

// ============================================================
// DELETE LOAN BY ID
//
// IMPORTANT:
//
// - This is a physical repository delete.
// - Intended for controlled persistence compensation only.
// - Example:
//     Gold Loan persisted successfully
//     Gold custody persistence failed
//     → remove the just-created Loan record
//
// - Normal business workflows must NOT use this as a user-facing
//   loan deletion feature.
// - StorageManager applies active owner/demo context.
// ============================================================

export async function deleteLoanById(
  loanId: string,
): Promise<StorageResult<void>> {
  const normalizedLoanId = String(loanId ?? "").trim();

  if (!normalizedLoanId) {
    return {
      success: false,

      error: "Loan ID is required before deleting a loan.",
    };
  }

  /* ==========================================================
     VERIFY AUTHORITATIVE RECORD EXISTS
  ========================================================== */

  const existing = await storageManager.get<Loan>(
    buildLoanQuery({
      id: normalizedLoanId,
    }),
  );

  if (!existing.success) {
    return {
      success: false,

      error: existing.error ?? "Unable to verify loan before deletion.",
    };
  }

  if (!existing.data) {
    return {
      success: false,

      error: "Loan was not found for deletion.",
    };
  }

  /* ==========================================================
     DELETE EXACT LOAN RECORD
  ========================================================== */

  const deleteResult = await storageManager.delete(
    buildLoanQuery({
      id: normalizedLoanId,
    }),
  );

  if (!deleteResult.success) {
    return {
      success: false,

      error: deleteResult.error ?? "Unable to delete loan.",
    };
  }

  return {
    success: true,
  };
}

// ============================================================
// GET LOAN BY ID
// ============================================================

/**
 * PAISARULE_C125_R233
 *
 * Read-only loan snapshot for financial preflight.
 *
 * This API must never repair or persist the Loan.
 * No getLoans(), getLoanById(), or repairClosedLoanSchedule().
 *
 * A missing or unavailable Loan fails closed.
 */
/**
 * PAISARULE_C125_R259
 *
 * Read Loan data without normalizeLoanBase or repair-on-read.
 * No Loan mutation, Collection mutation or fallback write.
 *
 * This is PRECOMMIT DATA only, NOT native USB authority.
 * The native exclusive-lock commit must independently read
 * and compare the current scoped persisted Loan.
 *
 * This reader follows the active storage mode; a caller
 * MUST enforce USB mode before constructing a USB commit.
 */
export async function getUnnormalizedLoanForAtomicPreflight(
  loanId: string,
): Promise<Loan | undefined> {
  if (
    typeof loanId !== "string" ||
    !loanId.trim()
  ) {
    return undefined;
  }

  try {
    const result = await storageManager.get<Loan>({
      entity: LOAN_ENTITY,
      id: loanId,
    });

    if (!result.success || !result.data) {
      return undefined;
    }

    const data: unknown = result.data;

    if (
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data)
    ) {
      return undefined;
    }

    const record = data as Record<string, unknown>;

    if (
      typeof record.id !== "string" ||
      record.id !== loanId
    ) {
      return undefined;
    }

    // Return the storage payload untouched.
    // Do not normalize dates, balances or schedule rows.
    return result.data;
  } catch {
    return undefined;
  }
}
export async function getLoanForCollectionPreflight(
  loanId: string,
): Promise<Loan | undefined> {
  if (typeof loanId !== "string" || !loanId.trim()) {
    return undefined;
  }

  try {
    const result = await storageManager.get<Loan>({
      entity: LOAN_ENTITY,
      id: loanId,
    });

    if (!result.success || !result.data) {
      return undefined;
    }

    // Normalize only in memory. Do not apply persistence repairs.
    return normalizeLoanBase(result.data);
  } catch {
    return undefined;
  }
}
/**
 * PAISARULE_C125_R234
 *
 * Non-mutating Manual Collection preview derived from
 * current authoritative USB Loan schedule.
 *
 * A preview is not a durable settlement authorization.
 * Native commit must revalidate current USB state.
 */
export async function previewManualCollectionSettlement(
  loanId: string,
  cashAmount: number,
  principalAmount: number,
  receiptNumber: string,
  paidDate: string,
): Promise<
  | {
      success: true;
      loanId: string;
      plan: ReturnType<
        typeof projectManualPenaltyScheduleSettlement
      >;
    }
  | {
      success: false;
      error: string;
    }
> {
  if (typeof loanId !== "string" || !loanId.trim()) {
    return {
      success: false,
      error: "LOAN_ID_REQUIRED",
    };
  }

  const loan = await getLoanForCollectionPreflight(loanId);

  if (!loan) {
    return {
      success: false,
      error: "AUTHORITATIVE_LOAN_UNAVAILABLE",
    };
  }

  if (
    loan.status === "CLOSED" ||
    !(Number(loan.outstanding) > 0)
  ) {
    return {
      success: false,
      error: "LOAN_NOT_COLLECTIBLE",
    };
  }

  const persisted = getPersistedSchedule(loan);

  if (
    !persisted.field ||
    !persisted.schedule ||
    persisted.schedule.length === 0
  ) {
    return {
      success: false,
      error: "AUTHORITATIVE_EMI_SCHEDULE_REQUIRED",
    };
  }

  try {
    const plan = projectManualPenaltyScheduleSettlement(
      persisted.schedule,
      cashAmount,
      principalAmount,
      receiptNumber,
      paidDate,
      Number((loan as Loan & { lateFee?: number }).lateFee ?? 0),
      Number(loan.outstanding),
    );

    return {
      success: true,
      loanId,
      plan,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "PENALTY_PREFLIGHT_FAILED",
    };
  }
}
export async function getLoanById(loanId: string): Promise<Loan | undefined> {
  if (!loanId) {
    return undefined;
  }

  const result = await storageManager.get<Loan>({
    entity: LOAN_ENTITY,

    id: loanId,
  });

  if (!result.success || !result.data) {
    return undefined;
  }

  const baseLoan = normalizeLoanBase(result.data);

  const repaired = repairClosedLoanSchedule(baseLoan);

  if (repaired.changed) {
    await storageManager.update<LoanStorageRecord>(
      toLoanStorageRecord(repaired.loan),
    );
  }

  return repaired.loan;
}

// ============================================================
// UPDATE LOAN OUTSTANDING
// ============================================================
//
// AUTHORITATIVE SETTLEMENT FORMULA:
//
// balanceReduction
//   = actualPayment
//     + discount
//
// newOutstanding
//   = currentOutstanding
//     - balanceReduction
//
// EMI paidAmount:
//
//   receives actualPayment only.
//
// Discount:
//
//   never becomes paidAmount.
//
// ============================================================

// ============================================================
// MANUAL PRINCIPAL - INTEREST ONLY HELPERS
// ============================================================

function getInterestOnlyPeriodicRate(
  monthlyInterestRate: number,
  repaymentType: unknown,
): number {
  const safeMonthlyRate = Math.max(
    0,
    Number(monthlyInterestRate) || 0,
  );

  const frequency = String(repaymentType ?? "")
    .trim()
    .toLowerCase();

  if (frequency === "daily") {
    return safeMonthlyRate / 30;
  }

  if (frequency === "weekly") {
    return safeMonthlyRate * 7 / 30;
  }

  if (frequency === "yearly") {
    return safeMonthlyRate * 12;
  }

  return safeMonthlyRate;
}

function getScheduleRemainingTotal(
  schedule: LoanScheduleInstallment[],
): number {
  return schedule.reduce(
    (total, installment) =>
      total + getInstallmentRemainingAmount(installment),
    0,
  );
}

function recalculateInterestOnlyAfterCurtailment(
  schedule: LoanScheduleInstallment[],
  reducedPrincipal: number,
  monthlyInterestRate: number,
  repaymentType: unknown,
  paidDate: string,
): LoanScheduleInstallment[] | undefined {
  const normalizedPaidDate = String(paidDate ?? "")
    .trim()
    .slice(0, 10);

  if (normalizedPaidDate.length !== 10) {
    return undefined;
  }

  const eligibleIndexes: number[] = [];

  schedule.forEach((installment, index) => {
    const status = normalizeInstallmentStatus(
      installment.status,
    );

    if (
      status === "paid" ||
      status === "overdue paid" ||
      status === "preclosed"
    ) {
      return;
    }

    if (safePositiveNumber(installment.paidAmount) > 0) {
      return;
    }

    const dueDate = String(installment.dueDate ?? "")
      .trim()
      .slice(0, 10);

    if (dueDate.length !== 10) {
      return;
    }

    if (dueDate <= normalizedPaidDate) {
      return;
    }

    eligibleIndexes.push(index);
  });

  if (eligibleIndexes.length === 0) {
    return undefined;
  }

  const finalEligibleIndex =
    eligibleIndexes[eligibleIndexes.length - 1];

  const periodicRate = getInterestOnlyPeriodicRate(
    monthlyInterestRate,
    repaymentType,
  );

  const revisedInterest = Math.max(
    0,
    Math.round(
      reducedPrincipal * (periodicRate / 100),
    ),
  );

  const eligibleSet = new Set(eligibleIndexes);

  return schedule.map((installment, index) => {
    if (!eligibleSet.has(index)) {
      return {
        ...installment,
      };
    }

    const isFinalPrincipalRow =
      index === finalEligibleIndex;

    return {
      ...installment,

      installmentAmount: isFinalPrincipalRow
        ? reducedPrincipal + revisedInterest
        : revisedInterest,

      principalAmount: isFinalPrincipalRow
        ? reducedPrincipal
        : 0,

      interestAmount: revisedInterest,

      outstandingBalance: isFinalPrincipalRow
        ? 0
        : reducedPrincipal,

      paidAmount: 0,

      penaltyAmount:
        safePositiveNumber(installment.penaltyAmount),

      receiptNumber: installment.receiptNumber ?? "",

      paidDate: installment.paidDate ?? "",

      status: "Pending",
    };
  });
}


/**
 * PAISARULE_C125_R264
 *
 * Financial projection only. No storage reads or writes.
 * The caller must supply a Loan from the correct authority.
 *
 * No persisted mutation happens in this function.
 */
export function projectLoanOutstandingWithoutPersistence(
  rawLoan: Loan,
  loanId: string,
  paymentAmount: number,
  options?: LoanOutstandingUpdateOptions,
): Loan | undefined {
  // ==========================================================
  // VALIDATE LOAN ID
  // ==========================================================

  if (!loanId) {
    return undefined;
  }

  // ==========================================================
  // ACTUAL CUSTOMER PAYMENT
  // ==========================================================

  const actualPaymentAmount = safePositiveNumber(paymentAmount);

  // ==========================================================
  // DISCOUNT / WAIVER
  // ==========================================================

  const requestedDiscountAmount =
    safePositiveNumber(options?.discountAmount);

  const allowPrecloseDiscount =
    options?.allowPrecloseDiscount === true;

  const discountAmount =
    allowPrecloseDiscount ? 0 : requestedDiscountAmount;

  const penaltyAmount = safePositiveNumber(options?.penaltyAmount);

  // PAISARULE C132-R39:
  // Temporary fail-closed protection until the overdue-only
  // waiver is reconciled and committed atomically.
  // Never reduce contractual outstanding using an overdue waiver.
  if (
    requestedDiscountAmount > 0 &&
    !allowPrecloseDiscount
  ) {
    return undefined;
  }

  // ==========================================================
  // MANUAL PRINCIPAL
  // ==========================================================

  const requestedManualPrincipalAmount =
    safePositiveNumber(options?.manualPrincipalAmount);

  // ==========================================================
  // NOTHING TO SETTLE
  // ==========================================================

  if (actualPaymentAmount <= 0 && discountAmount <= 0) {
    return undefined;
  }

  if (penaltyAmount > actualPaymentAmount) {
    return undefined;
  }

  const loan = normalizeLoan(rawLoan);

  // ==========================================================
  // CURRENT OUTSTANDING
  // ==========================================================

  const currentOutstanding = safePositiveNumber(loan.outstanding);

  if (currentOutstanding <= 0) {
    return undefined;
  }

  // ==========================================================
  // TOTAL SETTLEMENT REDUCTION
  // ==========================================================

  const debtPaymentAmount = Math.max(0, actualPaymentAmount - penaltyAmount);

  // ==========================================================
  // MANUAL PRINCIPAL CASH CLASSIFICATION
  //
  // IMPORTANT:
  //
  // Manual Principal is PART OF debtPaymentAmount.
  // It is never additional settlement cash.
  //
  // Example:
  //
  // actual cash       = 21,000
  // manual principal  = 20,000
  // normal EMI cash   = 1,000
  // ==========================================================

  if (requestedManualPrincipalAmount > debtPaymentAmount) {
    return undefined;
  }

  const manualPrincipalAmount =
    requestedManualPrincipalAmount;

  const emiPaymentAmount = Math.max(
    0,
    debtPaymentAmount - manualPrincipalAmount,
  );
  const settlementReduction =
    debtPaymentAmount +
    (allowPrecloseDiscount ? requestedDiscountAmount : 0);

  // ==========================================================
  // MANUAL PRINCIPAL SPECIAL PATH
  // ==========================================================

  if (
    manualPrincipalAmount > 0 &&
    loan.interestType !== "interestOnly"
  ) {
    return undefined;
  }

  // ==========================================================
  // REJECT OVER-SETTLEMENT
  // ==========================================================

  if (settlementReduction > currentOutstanding) {
    return undefined;
  }

  // ==========================================================
  // NEW OUTSTANDING
  // ==========================================================

  let newOutstanding = Math.max(
    0,

    currentOutstanding - settlementReduction,
  );

  // ==========================================================
  // SELECTED EMI NUMBERS
  // ==========================================================

  const selectedEmiNumbers = normalizeSelectedEmiNumbers(
    options?.selectedEmiNumbers,
  );

  // ==========================================================
  // RECEIPT / DATE
  // ==========================================================

  const receiptNumber = String(options?.receiptNumber ?? "").trim();

  const paidDate = String(options?.paidDate ?? "").trim();

  // ==========================================================
  // EXISTING SCHEDULE
  // ==========================================================

  const persistedSchedule = getPersistedSchedule(loan);

  // PAISARULE_C125_R229
  // Reject Manual Collection when authoritative EMI evidence is absent.
  if (
    selectedEmiNumbers.length === 0 &&
    (
      !persistedSchedule.field ||
      !persistedSchedule.schedule ||
      persistedSchedule.schedule.length === 0
    )
  ) {
    return undefined;
  }

  // ==========================================================
  // BASE LOAN UPDATE
  // ==========================================================

  let updatedLoan: Loan = {
    ...loan,

    outstanding: newOutstanding,

    status: newOutstanding === 0 ? "CLOSED" : "ACTIVE",
  };

  // ==========================================================
  // APPLY ACTUAL PAYMENT TO SCHEDULE
  //
  // IMPORTANT:
  //
  // Discount NEVER enters this allocation.
  // ==========================================================

  if (
    persistedSchedule.field &&
    persistedSchedule.schedule &&
    actualPaymentAmount > 0
  ) {
    let updatedSchedule: LoanScheduleInstallment[];

    // ========================================================
    // SELECTED EMI PAYMENT
    // ========================================================

    if (selectedEmiNumbers.length > 0) {
      updatedSchedule = allocateSelectedEmiPayment(
        persistedSchedule.schedule,

        selectedEmiNumbers,

        emiPaymentAmount,

        receiptNumber,

        paidDate,
      );
    }

    // ========================================================
    // MANUAL PAYMENT
    // ========================================================
    else {
      // PAISARULE_C125_R229
      // Allocate unpaid penalty before EMI on each Manual row.
      let projection: ReturnType<
        typeof projectManualPenaltyScheduleSettlement
      >;

      try {
        projection = projectManualPenaltyScheduleSettlement(
          persistedSchedule.schedule,
          actualPaymentAmount,
          manualPrincipalAmount,
          receiptNumber,
          paidDate,
          Number((rawLoan as Loan & { lateFee?: number }).lateFee ?? 0),
   currentOutstanding,
        );
      } catch {
        return undefined;
      }

      const projectedPenaltyCents = Math.round(
        projection.penaltyReceived * 100,
      );

      const suppliedPenaltyCents = Math.round(
        penaltyAmount * 100,
      );

      // UI and authoritative schedule must reconcile exactly.
      if (projectedPenaltyCents !== suppliedPenaltyCents) {
        return undefined;
      }

      if (
        Math.round(projection.principalReceived * 100) !==
          Math.round(manualPrincipalAmount * 100) ||
        Math.round(projection.emiReceived * 100) !==
          Math.round(emiPaymentAmount * 100)
      ) {
        return undefined;
      }

      updatedSchedule = projection.schedule;
    }



      // PAISARULE C132-R43:
      // Legacy contractual EMI discount allocation retired.
      // Discount remains blocked by R39 until the overdue-only
      // projection and Native Atomic settlement are integrated.
// ========================================================
    // PRESERVE OVERDUE PENALTY AFTER PAYMENT
    // ========================================================
    //
    // Overdue fee is separate income and must remain visible
    // after the contractual EMI has been fully paid.
    //
    // Example:
    //   EMI            = 200
    //   Overdue fee    = 100
    //   Cash received  = 300
    //
    // Stored schedule:
    //   paidAmount     = 200
    //   penaltyAmount  = 100
    //   status         = Overdue Paid
    //
    // The penalty is NEVER added to paidAmount.
    // ========================================================

    const loanLateFee = safePositiveNumber(
      (loan as Loan & { lateFee?: number }).lateFee,
    );

    const singleSelectedPenalty =
      selectedEmiNumbers.length === 1
        ? penaltyAmount
        : 0;

    updatedSchedule = updatedSchedule.map(
      (installment, index) => {
        const originalInstallment =
          persistedSchedule.schedule?.[index];

        if (!originalInstallment) {
          return installment;
        }

        const originalPaidAmount =
          safePositiveNumber(
            originalInstallment.paidAmount,
          );

        const paidAmount =
          safePositiveNumber(
            installment.paidAmount,
          );

        const paymentIncreased =
          paidAmount > originalPaidAmount;

        if (!paymentIncreased) {
          return installment;
        }

        const originalStatus =
          normalizeInstallmentStatus(
            originalInstallment.status,
          );

        const dueDate = String(
          originalInstallment.dueDate ?? "",
        )
          .trim()
          .slice(0, 10);

        const normalizedPaidDate = String(
          paidDate ?? "",
        )
          .trim()
          .slice(0, 10);

        const overdueByDate =
          dueDate.length === 10 &&
          normalizedPaidDate.length === 10 &&
          dueDate < normalizedPaidDate;

        const wasOverdue =
          originalStatus === "overdue" ||
          originalStatus === "overdue paid" ||
          overdueByDate;

        if (!wasOverdue) {
          return installment;
        }

        const originalPenalty =
          safePositiveNumber(
            originalInstallment.penaltyAmount,
          );

        // PAISARULE R96:
        // Manual projection has already assessed the overdue fee.
        // Preserve that authoritative assessed amount, not zero.
        const preservedPenalty =
          selectedEmiNumbers.length === 0
            ? safePositiveNumber(installment.penaltyAmount)
            : originalPenalty > 0
              ? originalPenalty
              : singleSelectedPenalty > 0
                ? singleSelectedPenalty
                : loanLateFee;



        const installmentAmount =
          safePositiveNumber(
            installment.installmentAmount,
          );

        const fullyPaid =
          installmentAmount > 0 &&
          paidAmount >= installmentAmount;

        return {
          ...installment,

          penaltyAmount:
            preservedPenalty,

          status:
            fullyPaid
              ? "Overdue Paid"
              : "Partial",
        };
      },
    );


      // ========================================================
      // MANUAL PRINCIPAL INTEREST ONLY RECALCULATION
      //
      // IMPORTANT:
      //
      // - Manual Principal never enters paidAmount.
      // - Historical/current rows are preserved.
      // - Only future untouched rows are recalculated.
      // - Outstanding becomes revised schedule remaining total.
      // ========================================================

      if (manualPrincipalAmount > 0) {
        const principalBearingRows =
          updatedSchedule.filter(
            (installment) =>
              safePositiveNumber(
                installment.principalAmount,
              ) > 0,
          );

        const currentPrincipalBeforeCurtailment =
          principalBearingRows.reduce(
            (maximum, installment) =>
              Math.max(
                maximum,
                safePositiveNumber(
                  installment.principalAmount,
                ),
              ),
            0,
          );

        if (
          currentPrincipalBeforeCurtailment <= 0 ||
          manualPrincipalAmount >
            currentPrincipalBeforeCurtailment
        ) {
          return undefined;
        }

        const reducedPrincipal = Math.max(
          0,
          currentPrincipalBeforeCurtailment -
            manualPrincipalAmount,
        );

        const recalculatedSchedule =
          recalculateInterestOnlyAfterCurtailment(
            updatedSchedule,
            reducedPrincipal,
            safePositiveNumber(loan.interest),
            loan.repaymentType,
            paidDate,
          );

        if (!recalculatedSchedule) {
          return undefined;
        }

        updatedSchedule = recalculatedSchedule;

        newOutstanding =
          getScheduleRemainingTotal(updatedSchedule);

        const existingCurtailments = Array.isArray(
          loan.principalCurtailments,
        )
          ? loan.principalCurtailments
          : [];

        updatedLoan = {
          ...updatedLoan,

          outstanding: newOutstanding,

          status:
            newOutstanding === 0 ? "CLOSED" : "ACTIVE",

          principalCurtailments: [
            ...existingCurtailments,
            {
              amount: manualPrincipalAmount,
              effectiveDate: paidDate,
              receiptNumber:
                receiptNumber || undefined,
            },
          ],
        };
      }

    // ========================================================
    // APPLY UPDATED SCHEDULE
    // ========================================================
    updatedLoan = applyUpdatedSchedule(
      updatedLoan,

      persistedSchedule.field,

      updatedSchedule,
    );
  }

  // ==========================================================
  // AUTHORITATIVE LOAN CLOSURE
  //
  // Payment + discount may close the Loan.
  //
  // Example:
  //
  // Outstanding = 9,250
  // Payment     = 9,100
  // Discount    =   150
  //
  // New outstanding = 0.
  //
  // ₹9,100 is allocated as actual payment.
  //
  // Remaining ₹150 contractual liability is then Preclosed.
  // ==========================================================

  if (newOutstanding === 0) {
    const scheduleAfterPayment = getPersistedSchedule(updatedLoan);

    if (scheduleAfterPayment.field && scheduleAfterPayment.schedule) {
      const finalized = finalizeClosedSchedule(scheduleAfterPayment.schedule, paidDate);

      updatedLoan = applyUpdatedSchedule(
        updatedLoan,

        scheduleAfterPayment.field,

        finalized.schedule,
      );
    }

    updatedLoan = {
      ...updatedLoan,

      outstanding: 0,

      status: "CLOSED",
    };
  }

  // ==========================================================
  // AUTHORITATIVE SYSTEM UPDATE TIME
  //
  // paidDate remains the operational Collection Business Date.
  //
  // updatedAt records when FINORA actually persisted this
  // Loan balance / schedule mutation.
  // ==========================================================

  updatedLoan = {
    ...updatedLoan,

    updatedAt:
      new Date().toISOString(),
  };

  return updatedLoan;
}

/**
 * Existing persistent Loan update.
 *
 * The calculation is shared with the non-persistent
 * Atomic Collection projection.
 */
export async function updateLoanOutstanding(
  loanId: string,
  paymentAmount: number,
  options?: LoanOutstandingUpdateOptions,
): Promise<Loan | undefined> {
  if (!loanId) {
    return undefined;
  }

  const result = await storageManager.get<Loan>({
    entity: LOAN_ENTITY,
    id: loanId,
  });

  if (!result.success || !result.data) {
    return undefined;
  }

  const updatedLoan =
    projectLoanOutstandingWithoutPersistence(
      result.data,
      loanId,
      paymentAmount,
      options,
    );

  if (!updatedLoan) {
    return undefined;
  }

  const updateResult =
    await storageManager.update<LoanStorageRecord>(
      toLoanStorageRecord(updatedLoan),
    );

  if (!updateResult.success) {
    return undefined;
  }

  return updatedLoan;
}

// ============================================================
// COMPATIBILITY ALIAS
// ============================================================

/**
 * PAISARULE_C125_R266
 *
 * Prepare a Manual Collection Loan update entirely in memory.
 *
 * - Never invokes storageManager.save/update.
 * - Never changes the supplied raw Loan.
 * - Never substitutes LOCAL for USB.
 * - Uses the existing financial calculation.
 *
 * The caller must enforce authoritative USB mode and obtain
 * native authenticated settlement authorization.
 *
 * This does NOT commit a Collection or authorize a payment.
 */
export function prepareManualLoanForAtomicSettlement(
  rawLoan: Loan,
  cashAmount: number,
  options: LoanOutstandingUpdateOptions,
): Loan | undefined {
  if (
    !rawLoan ||
    typeof rawLoan.id !== "string" ||
    !rawLoan.id.trim() ||
    !options ||
    !Number.isFinite(cashAmount) ||
    cashAmount <= 0
  ) {
    return undefined;
  }

  // This entry point is exclusively for Manual Collection.
  if (
    options.selectedEmiNumbers !== undefined &&
    (
      !Array.isArray(options.selectedEmiNumbers) ||
      options.selectedEmiNumbers.length !== 0
    )
  ) {
    return undefined;
  }

  // Native R244 currently rejects discount settlement.
  if (
    options.discountAmount !== undefined &&
    options.discountAmount !== 0 &&
    options.allowPrecloseDiscount !== true
  ) {
    return undefined;
  }

  if (
    typeof options.receiptNumber !== "string" ||
    !options.receiptNumber.trim() ||
    typeof options.paidDate !== "string" ||
    !options.paidDate.trim()
  ) {
    return undefined;
  }

  const persisted = getPersistedSchedule(rawLoan);

  if (
    !persisted.field ||
    !persisted.schedule ||
    persisted.schedule.length === 0
  ) {
    return undefined;
  }

  // Detect accidental input mutation while preparing.
  const before = JSON.stringify(rawLoan);

  const updated = projectLoanOutstandingWithoutPersistence(
    rawLoan,
    rawLoan.id,
    cashAmount,
    {
      ...options,
      selectedEmiNumbers: [],
    },
  );

  if (
    !updated ||
    JSON.stringify(rawLoan) !== before
  ) {
    return undefined;
  }

  const projectedSchedule = getPersistedSchedule(updated);

  if (
    projectedSchedule.field !== persisted.field ||
    !projectedSchedule.schedule ||
    projectedSchedule.schedule.length !==
      persisted.schedule.length
  ) {
    return undefined;
  }

  return updated;
}
export const updateLoanOutstandingAmount = updateLoanOutstanding;

// ============================================================
// END
// ============================================================

