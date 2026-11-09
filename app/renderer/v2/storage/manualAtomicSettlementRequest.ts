import {
  verifyInterestOnlyCurtailment,
} from "./manualInterestCurtailmentAudit";
/**
 * PAISARULE C126-R98
 *
 * Prepares the three financial inputs expected by the native
 * atomic settlement core.
 *
 * IMPORTANT:
 * - Validation only; NO financial persistence.
 * - Native process MUST resolve authenticated tenant authority.
 * - Native process MUST re-read and reconcile USB loan state.
 * - Not a replacement for native financial validation.
 */

export interface ManualCurtailmentEvidence {
  cashAllocatedSchedule: unknown;
}
type UnknownRecord = Record<string, unknown>;

export interface ManualAtomicSettlementRequest {
  expectedLoanData: UnknownRecord;
  loanInput: {
    id: string;
    entity: "LOAN";
    data: UnknownRecord;
  };
  collectionInput: {
    id: string;
    entity: "COLLECTION";
    data: UnknownRecord;
  };
}

function object(value: unknown): UnknownRecord {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("ATOMIC_REQUEST_INVALID_RECORD");
  }

  return value as UnknownRecord;
}

function identity(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("ATOMIC_REQUEST_INVALID_IDENTITY");
  }

  return value.trim();
}

function cents(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error("ATOMIC_REQUEST_INVALID_AMOUNT");
  }

  const result = Math.round(value * 100);

  if (
    !Number.isSafeInteger(result) ||
    Math.abs(value * 100 - result) > 0.000001
  ) {
    throw new Error("ATOMIC_REQUEST_INVALID_PRECISION");
  }

  return result;
}

export function prepareManualAtomicSettlementRequest(
  expectedLoanInput: unknown,
  updatedLoanInput: unknown,
  collectionRecordInput: unknown,
  curtailmentEvidence?: ManualCurtailmentEvidence,
): ManualAtomicSettlementRequest {
  const expectedLoan = object(expectedLoanInput);
  const updatedLoan = object(updatedLoanInput);
  const collection = object(collectionRecordInput);

  const loanId = identity(expectedLoan.id);

  if (
    identity(updatedLoan.id) !== loanId ||
    identity(collection.loanId) !== loanId
  ) {
    throw new Error("ATOMIC_REQUEST_LOAN_SCOPE_MISMATCH");
  }

  const collectionId = identity(collection.id);
  identity(collection.receiptNumber);
  identity(collection.collectionNumber);

  if (collectionId === loanId) {
    throw new Error("ATOMIC_REQUEST_RECORD_ID_COLLISION");
  }

  const cash = cents(collection.paymentAmount);
  const penalty = cents(collection.penaltyAmount);
  const principal = cents(collection.advanceAdjustment);
  const discount = cents(collection.discountAmount);
  cents(expectedLoan.outstanding);
  cents(updatedLoan.outstanding);
  cents(collection.outstandingBalance);

  if (
    penalty > cash ||
    principal > cash - penalty
  ) {
    throw new Error("ATOMIC_REQUEST_INVALID_ALLOCATION");
  }

  if (
    cents(updatedLoan.outstanding) !==
    cents(collection.outstandingBalance)
  ) {
    throw new Error("ATOMIC_REQUEST_BALANCE_MISMATCH");
  }

  // PAISARULE_C141_R11B_PRECLOSE_DISCOUNT_AUTHORITY
  // Generic Manual discount remains fail-closed.
  // A discount is allowed only when the proposed records already
  // prove a complete Preclose settlement.
  const previousOutstanding = cents(expectedLoan.outstanding);
  const revisedOutstanding = cents(updatedLoan.outstanding);

  const selectedEmiNumbers = collection.selectedEmiNumbers;

  const verifiedPrecloseDiscount =
    discount > 0 &&
    previousOutstanding > 0 &&
    revisedOutstanding === 0 &&
    String(updatedLoan.status ?? "").trim().toUpperCase() === "CLOSED" &&
    Array.isArray(selectedEmiNumbers) &&
    selectedEmiNumbers.length === 0 &&
    principal === 0 &&
    previousOutstanding === cash - penalty + discount;

  if (discount !== 0 && !verifiedPrecloseDiscount) {
    throw new Error("ATOMIC_REQUEST_DISCOUNT_NOT_SUPPORTED");
  }

  // PAISARULE_C126_R105_VERIFIED_INTEREST_SAVING
  // Cash settlement and future-interest reduction are distinct.
  // This is renderer preflight, NOT native financial authority.
  let futureInterestSavingCents = 0;

  if (curtailmentEvidence) {
    // PAISARULE_C126_R106_HISTORICAL_EVIDENCE
    // Bind caller-supplied intermediate rows to the original
    // Loan baseline. Native authority must verify this again.
    if (
      !Array.isArray(expectedLoan.schedule) ||
      !Array.isArray(curtailmentEvidence.cashAllocatedSchedule)
    ) {
      throw new Error(
        "ATOMIC_REQUEST_BASELINE_SCHEDULE_REQUIRED",
      );
    }

    const baseline = expectedLoan.schedule;
    const intermediate =
      curtailmentEvidence.cashAllocatedSchedule;

    if (baseline.length === 0 ||
        baseline.length !== intermediate.length) {
      throw new Error(
        "ATOMIC_REQUEST_BASELINE_SCHEDULE_MISMATCH",
      );
    }

    for (let i = 0; i < baseline.length; i++) {
      const oldRow = object(baseline[i]);
      const cashRow = object(intermediate[i]);

      if (
        oldRow.installmentNumber !== cashRow.installmentNumber ||
        oldRow.dueDate !== cashRow.dueDate ||
        cents(oldRow.installmentAmount) !==
          cents(cashRow.installmentAmount) ||
        cents(oldRow.penaltyAmount ?? 0) !==
          cents(cashRow.penaltyAmount ?? 0) ||
        cents(oldRow.waivedAmount ?? 0) !==
          cents(cashRow.waivedAmount ?? 0) ||
        cents(oldRow.penaltyWaivedAmount ?? 0) !==
          cents(cashRow.penaltyWaivedAmount ?? 0)
      ) {
        throw new Error(
          "ATOMIC_REQUEST_BASELINE_ROW_CHANGED",
        );
      }

      const oldPaid = cents(oldRow.paidAmount ?? 0);
      const nextPaid = cents(cashRow.paidAmount ?? 0);

      if (nextPaid < oldPaid) {
        throw new Error(
          "ATOMIC_REQUEST_PAID_AMOUNT_REVERSED",
        );
      }

      const oldStatus = String(oldRow.status ?? "")
        .trim().toLowerCase();

      if (
        ["paid", "overdue paid", "preclosed"]
          .includes(oldStatus) &&
        (
          oldPaid !== nextPaid ||
          String(cashRow.status ?? "")
            .trim().toLowerCase() !== oldStatus
        )
      ) {
        throw new Error(
          "ATOMIC_REQUEST_SETTLED_HISTORY_CHANGED",
        );
      }
    }

    if (principal <= 0) {
      throw new Error(
        "ATOMIC_REQUEST_UNEXPECTED_CURTAILMENT_EVIDENCE",
      );
    }

    if (!Array.isArray(updatedLoan.schedule)) {
      throw new Error(
        "ATOMIC_REQUEST_UPDATED_SCHEDULE_REQUIRED",
      );
    }

    const audit = verifyInterestOnlyCurtailment(
      curtailmentEvidence.cashAllocatedSchedule,
      updatedLoan.schedule,
      principal / 100,
      expectedLoan.interest as number,
      expectedLoan.repaymentType,
      collection.receiptDate as string,
    );

    if (audit.principalReductionCents !== principal) {
      throw new Error(
        "ATOMIC_REQUEST_PRINCIPAL_AUDIT_MISMATCH",
      );
    }

    futureInterestSavingCents =
      audit.futureInterestSavingCents;
  }

  // A principal curtailment must never be counted twice.
  // Additional reduction is permitted only with a
  // validated deterministic future-interest projection.
  if (
    previousOutstanding - revisedOutstanding !==
    cash - penalty + discount + futureInterestSavingCents
  ) {
    throw new Error(
      "ATOMIC_REQUEST_SETTLEMENT_REDUCTION_MISMATCH",
    );
  }

  return {
    expectedLoanData: expectedLoan,
    loanInput: {
      id: loanId,
      entity: "LOAN",
      data: updatedLoan,
    },
    collectionInput: {
      id: collectionId,
      entity: "COLLECTION",
      data: collection,
    },
  };
}