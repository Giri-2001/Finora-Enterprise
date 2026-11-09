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
  loanLateFee = 0,
  authoritativeDebtCeiling?: number,
) {
  if (!receiptNumber.trim() || !paidDate.trim()) {
    throw new Error("RECEIPT_AND_DATE_REQUIRED");
  }

  // R54-R1: Apply the Loan's configured late fee only
  // to unpaid overdue EMIs. Preserve settled history.
  const feeCents = cents(loanLateFee);
  const paymentDate = paidDate.trim().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    throw new Error("INVALID_COLLECTION_DATE");
  }

  const effectiveSchedule = schedule.map((row) => {
    const state = String(row.status ?? "").trim().toLowerCase();

    const settled =
      ["paid", "overdue paid", "preclosed"].includes(state);

    const required = requiredEmiAmount(row);
    const paid = cents(row.paidAmount ?? 0);
    const waived = cents(row.waivedAmount ?? 0);
    const existingFee = cents(row.penaltyAmount ?? 0);
    const dueDate = String(row.dueDate ?? "").trim().slice(0, 10);

    const assess =
      !settled &&
      paid + waived < required &&
      /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
      dueDate < paymentDate &&
      existingFee === 0 &&
      feeCents > 0;

    if (!assess) {
      return row;
    }

    return {
      ...row,
      penaltyAmount: feeCents / 100,
      penaltyPaidAmount: 0,
      penaltyWaivedAmount: 0,
      status: "Overdue",
    };
  });

  const rows = effectiveSchedule.map((row) => {
    const amount = requiredEmiAmount(row);
    const paid = cents(row.paidAmount ?? 0);
    const waived = cents(row.waivedAmount ?? 0);

    if (paid + waived > amount) {
      throw new Error("EMI_OVER_SETTLED");
    }

    const assessed = cents(row.penaltyAmount ?? 0);

    // R39-FIX: Preserve fully settled historical EMI rows.
    // Missing legacy penalty evidence is not new payment evidence.
    const historicalStatus =
      String(row.status ?? "").trim().toLowerCase();

    const historicalSettled =
      ["paid", "overdue paid", "preclosed"].includes(
        historicalStatus,
      ) &&
      paid + waived === amount;

    const missingPenaltyEvidence =
      assessed > 0 &&
      (
        row.penaltyPaidAmount === undefined ||
        row.penaltyWaivedAmount === undefined
      );

    if (missingPenaltyEvidence && !historicalSettled) {
      throw new Error("LEGACY_PENALTY_EVIDENCE_REQUIRED");
    }

    return {
      installmentNumber: row.installmentNumber,
      emiRemaining: (amount - paid - waived) / 100,
      penaltyAssessed:
        historicalSettled && missingPenaltyEvidence
          ? 0
          : assessed / 100,
      penaltyPaid:
        historicalSettled && missingPenaltyEvidence
          ? 0
          : row.penaltyPaidAmount,
      penaltyWaived:
        historicalSettled && missingPenaltyEvidence
          ? 0
          : row.penaltyWaivedAmount,
    };
  });  // PAISARULE_C145_R9_AUTHORITATIVE_DEBT_CEILING
  // Loan outstanding is the authoritative contractual debt ceiling.
  // A legacy schedule may contain a higher residual after a prior
  // discount. Trim allocation capacity only on an overdue unsettled
  // row; never alter persisted installmentAmount or settled history.
  let allocationRows = rows.map((row) => ({ ...row }));

  if (
    authoritativeDebtCeiling !== undefined &&
    cents(principalAmount) === 0
  ) {
    const debtCeiling = cents(authoritativeDebtCeiling);
    const scheduleDebt = allocationRows.reduce(
      (sum, row) => sum + cents(row.emiRemaining),
      0,
    );

    let excessScheduleDebt = Math.max(0, scheduleDebt - debtCeiling);

    if (excessScheduleDebt > 0) {
      for (
        let index = allocationRows.length - 1;
        index >= 0 && excessScheduleDebt > 0;
        index--
      ) {
        const source = effectiveSchedule[index];
        const status = String(source.status ?? "")
          .trim()
          .toLowerCase();

        const previouslySettled =
          status === "paid" ||
          status === "overdue paid" ||
          status === "preclosed";

        const dueDate = String(source.dueDate ?? "")
          .trim()
          .slice(0, 10);

        const overdueEligible =
          !previouslySettled &&
          dueDate.length === 10 &&
          dueDate < paymentDate;

        if (!overdueEligible) {
          continue;
        }

        const rowDebt = cents(allocationRows[index].emiRemaining);

        if (rowDebt <= 0) {
          continue;
        }

        const reduction = Math.min(rowDebt, excessScheduleDebt);

        allocationRows[index] = {
          ...allocationRows[index],
          emiRemaining: (rowDebt - reduction) / 100,
        };

        excessScheduleDebt -= reduction;
      }

      if (excessScheduleDebt !== 0) {
        throw new Error("AUTHORITATIVE_DEBT_CEILING_UNRECONCILED");
      }
    }
  }

  // PAISARULE_C131_R3_EXTRA_OVERDUE
  // Fully settle authoritative contractual debt and assessed penalties first.
  // Extra cash is eligible only for an overdue unsettled EMI.
  // Keep extra payment inside existing penalty accounting.
  let plan = planSequentialManualCollection(
    allocationRows,
    cashAmount,
    principalAmount,
  );

  let settlementSchedule = effectiveSchedule;

  if (cents(plan.unallocatedCash) > 0) {
    const hasUnsettledObligation = plan.lines.some(
      (line) =>
        cents(line.emiRemaining) > 0 ||
        cents(line.penaltyRemaining) > 0,
    );

    if (hasUnsettledObligation) {
      throw new Error("UNALLOCATED_CASH_NOT_ALLOWED");
    }

    const collectionDate = paidDate.trim().slice(0, 10);

    // Select the latest previously unpaid overdue installment.
    // Never change an already settled historical EMI.
    let overdueTarget: LoanScheduleInstallment | undefined;

    for (let index = effectiveSchedule.length - 1; index >= 0; index--) {
      const row = effectiveSchedule[index];
      const status = String(row.status ?? "").trim().toLowerCase();
      const dueDate = String(row.dueDate ?? "").trim().slice(0, 10);

      const previouslySettled =
        status === "paid" ||
        status === "overdue paid" ||
        status === "preclosed";

      const previouslyUnpaid =
        cents(row.paidAmount ?? 0) +
          cents(row.waivedAmount ?? 0) <
        requiredEmiAmount(row);

      if (
        !previouslySettled &&
        previouslyUnpaid &&
        /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
        dueDate < collectionDate
      ) {
        overdueTarget = row;
        break;
      }
    }

    if (!overdueTarget) {
      throw new Error("EXTRA_OVERDUE_REQUIRES_OVERDUE_EMI");
    }

    const extraCents = cents(plan.unallocatedCash);
    const extraAmount = extraCents / 100;
    const targetNumber = overdueTarget.installmentNumber;

    settlementSchedule = effectiveSchedule.map((row) =>
      row.installmentNumber === targetNumber
        ? {
            ...row,
            penaltyAmount:
              (cents(row.penaltyAmount ?? 0) + extraCents) / 100,
          }
        : row,
    );

    const adjustedRows = allocationRows.map((row) =>
      row.installmentNumber === targetNumber
        ? {
            ...row,
            penaltyAssessed: row.penaltyAssessed + extraAmount,
          }
        : row,
    );

    plan = planSequentialManualCollection(
      adjustedRows,
      cashAmount,
      principalAmount,
    );
  }

  // Preserve the existing strict cash reconciliation.
  if (cents(plan.unallocatedCash) !== 0) {
    throw new Error("UNALLOCATED_CASH_NOT_ALLOWED");
  }

  const allocations = new Map(
    plan.lines.map((line) => [
      line.installmentNumber,
      line,
    ]),
  );

  const nextSchedule = settlementSchedule.map((row) => {
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
      // PAISARULE_C126_R87_MANUAL_EMI_STATUS
      status:
        nextPaid + cents(row.waivedAmount ?? 0) >=
          requiredEmiAmount(row) &&
        nextPenaltyPaid + cents(row.penaltyWaivedAmount ?? 0) >=
          cents(row.penaltyAmount ?? 0)
          ? (
              String(row.status ?? "").trim().toLowerCase() === "overdue" ||
              String(row.status ?? "").trim().toLowerCase() === "overdue paid" ||
              (
                String(row.dueDate ?? "").trim().slice(0, 10) <
                paidDate.trim().slice(0, 10)
              )
            )
            ? "Overdue Paid"
            : "Paid"
          : "Partial",
      receiptNumber: row.receiptNumber || receiptNumber,
      paidDate: row.paidDate || paidDate,
    };
  });

  return {
    ...plan,
    schedule: nextSchedule,
  };
}