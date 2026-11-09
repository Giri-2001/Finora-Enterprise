/**
 * PAISARULE C126-R88
 * Pure next-EMI projection from the UPDATED authoritative schedule.
 * No storage, receipt numbering, UI state or financial writes.
 */

export interface NextEmiScheduleRow {
  installmentNumber: number;
  dueDate: string;
  installmentAmount: number;
  paidAmount?: number;
  waivedAmount?: number;
  penaltyAmount?: number;
  penaltyPaidAmount?: number;
  penaltyWaivedAmount?: number;
}

export interface NextEmiDetails {
  installmentNumber: number;
  dueDate: string;
  emiRemaining: number;
  penaltyRemaining: number;
  totalPayable: number;
}

function money(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("NEXT_EMI_INVALID_AMOUNT");
  }

  const cents = Math.round(value * 100);

  if (
    !Number.isSafeInteger(cents) ||
    Math.abs(cents / 100 - value) > 0.000001
  ) {
    throw new Error("NEXT_EMI_INVALID_PRECISION");
  }

  return cents;
}

export function getManualCollectionNextEmi(
  schedule: readonly NextEmiScheduleRow[],
): NextEmiDetails | null {
  const seen = new Set<number>();

  const prepared = schedule.map((row) => {
    if (
      !Number.isSafeInteger(row.installmentNumber) ||
      row.installmentNumber <= 0 ||
      seen.has(row.installmentNumber) ||
      typeof row.dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.dueDate.slice(0, 10))
    ) {
      throw new Error("NEXT_EMI_INVALID_SCHEDULE");
    }

    seen.add(row.installmentNumber);

    const amount = money(row.installmentAmount);
    const paid = money(row.paidAmount ?? 0);
    const waived = money(row.waivedAmount ?? 0);
    const penalty = money(row.penaltyAmount ?? 0);

    if (paid + waived > amount) {
      throw new Error("NEXT_EMI_OVER_SETTLED");
    }

    if (
      penalty > 0 &&
      (
        row.penaltyPaidAmount === undefined ||
        row.penaltyWaivedAmount === undefined
      )
    ) {
      throw new Error("NEXT_EMI_PENALTY_EVIDENCE_REQUIRED");
    }

    const penaltyPaid = money(row.penaltyPaidAmount ?? 0);
    const penaltyWaived = money(row.penaltyWaivedAmount ?? 0);

    if (penaltyPaid + penaltyWaived > penalty) {
      throw new Error("NEXT_EMI_PENALTY_OVER_SETTLED");
    }

    return {
      number: row.installmentNumber,
      date: row.dueDate.slice(0, 10),
      emiRemainingCents: amount - paid - waived,
      penaltyRemainingCents: penalty - penaltyPaid - penaltyWaived,
    };
  });

  prepared.sort((a, b) => a.number - b.number);

  const next = prepared.find(
    (row) =>
      row.emiRemainingCents > 0 ||
      row.penaltyRemainingCents > 0
  );

  if (!next) {
    return null;
  }

  return {
    installmentNumber: next.number,
    dueDate: next.date,
    emiRemaining: next.emiRemainingCents / 100,
    penaltyRemaining: next.penaltyRemainingCents / 100,
    totalPayable:
      (next.emiRemainingCents + next.penaltyRemainingCents) / 100,
  };
}