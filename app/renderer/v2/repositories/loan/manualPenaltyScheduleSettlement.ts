import type { LoanScheduleInstallment } from "./loanRepository";
import {
  planSequentialManualCollection,
} from "./manualPenaltyAllocation";

function cents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("INVALID_SETTLEMENT_AMOUNT");
  }

  const result = Math.round(value * 100);

  if (
    !Number.isSafeInteger(result) ||
    Math.abs(result / 100 - value) > 0.000001
  ) {
    throw new Error("INVALID_SETTLEMENT_PRECISION");
  }

  return result;
}

/**
 * Missing installmentAmount is NOT equivalent to zero.
 * Reject malformed/legacy rows rather than inventing
 * a financial value.
 */
function requiredEmiAmount(
  row: LoanScheduleInstallment,
): number {
  if (
    typeof row.installmentAmount !== "number" ||
    !Number.isFinite(row.installmentAmount)
  ) {
    throw new Error("EMI_AMOUNT_EVIDENCE_REQUIRED");
  }

  return cents(row.installmentAmount);
}

/**
 * Offline projection only.
 * No USB writes, no Collection save, no status mutation.
 */
export function projectManualPenaltyScheduleSettlement(
  schedule: readonly LoanScheduleInstallment[],
  cashAmount: number,
  principalAmount: number,
  receiptNumber: string,
  paidDate: string,
) {
  if (!receiptNumber.trim() || !paidDate.trim()) {
    throw new Error("RECEIPT_AND_DATE_REQUIRED");
  }

  const rows = schedule.map((row) => {
    const amount = requiredEmiAmount(row);
    const paid = cents(row.paidAmount ?? 0);
    const waived = cents(row.waivedAmount ?? 0);

    if (paid + waived > amount) {
      throw new Error("EMI_OVER_SETTLED");
    }

    const assessed = cents(row.penaltyAmount ?? 0);

    if (
      assessed > 0 &&
      (
        row.penaltyPaidAmount === undefined ||
        row.penaltyWaivedAmount === undefined
      )
    ) {
      throw new Error("LEGACY_PENALTY_EVIDENCE_REQUIRED");
    }

    return {
      installmentNumber: row.installmentNumber,
      emiRemaining: (amount - paid - waived) / 100,
      penaltyAssessed: assessed / 100,
      penaltyPaid: row.penaltyPaidAmount,
      penaltyWaived: row.penaltyWaivedAmount,
    };
  });

  const plan = planSequentialManualCollection(
    rows,
    cashAmount,
    principalAmount,
  );

  if (cents(plan.unallocatedCash) !== 0) {
    throw new Error("UNALLOCATED_CASH_NOT_ALLOWED");
  }

  const allocations = new Map(
    plan.lines.map((line) => [
      line.installmentNumber,
      line,
    ]),
  );

  const nextSchedule = schedule.map((row) => {
    const allocation = allocations.get(row.installmentNumber);

    if (!allocation) {
      throw new Error("MISSING_ALLOCATION");
    }

    const addedEmi = cents(allocation.emiReceived);
    const addedPenalty = cents(allocation.penaltyReceived);

    if (addedEmi === 0 && addedPenalty === 0) {
      return { ...row };
    }

    const previousPaid = cents(row.paidAmount ?? 0);
    const previousPenaltyPaid = cents(
      row.penaltyPaidAmount ?? 0,
    );

    const nextPaid = previousPaid + addedEmi;
    const nextPenaltyPaid =
      previousPenaltyPaid + addedPenalty;

    if (
      nextPaid + cents(row.waivedAmount ?? 0) >
      requiredEmiAmount(row)
    ) {
      throw new Error("EMI_BALANCE_EXCEEDED");
    }

    if (
      nextPenaltyPaid +
        cents(row.penaltyWaivedAmount ?? 0) >
      cents(row.penaltyAmount ?? 0)
    ) {
      throw new Error("PENALTY_BALANCE_EXCEEDED");
    }

    return {
      ...row,
      paidAmount: nextPaid / 100,
      penaltyPaidAmount: nextPenaltyPaid / 100,
      receiptNumber: row.receiptNumber || receiptNumber,
      paidDate: row.paidDate || paidDate,
    };
  });

  return {
    ...plan,
    schedule: nextSchedule,
  };
}