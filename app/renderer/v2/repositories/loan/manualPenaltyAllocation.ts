/**
 * PAISARULE C125-R203-R1
 * Pure, side-effect-free sequential repayment planner.
 * Not connected to any live financial write.
 */

export interface ManualAllocationRow {
  installmentNumber: number;
  emiRemaining: number;
  penaltyAssessed: number;
  penaltyPaid?: number;
  penaltyWaived?: number;
}

export interface ManualAllocationLine {
  installmentNumber: number;
  penaltyReceived: number;
  emiReceived: number;
  penaltyRemaining: number;
  emiRemaining: number;
}

export interface ManualAllocationPlan {
  cashReceived: number;
  principalReceived: number;
  penaltyReceived: number;
  emiReceived: number;
  unallocatedCash: number;
  lines: ManualAllocationLine[];
}

function toCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("INVALID_NONNEGATIVE_AMOUNT");
  }

  const result = Math.round(value * 100);

  if (
    !Number.isSafeInteger(result) ||
    Math.abs(result / 100 - value) > 0.000001
  ) {
    throw new Error("INVALID_MONEY_PRECISION");
  }

  return result;
}

function fromCents(value: number): number {
  return value / 100;
}

export function planSequentialManualCollection(
  rows: readonly ManualAllocationRow[],
  cashAmount: number,
  principalAmount: number,
): ManualAllocationPlan {
  const cash = toCents(cashAmount);
  const principal = toCents(principalAmount);

  if (principal > cash) {
    throw new Error("PRINCIPAL_EXCEEDS_CASH");
  }

  const seen = new Set<number>();

  const prepared = rows.map((row) => {
    const number = row.installmentNumber;

    if (
      !Number.isSafeInteger(number) ||
      number <= 0 ||
      seen.has(number)
    ) {
      throw new Error("INVALID_OR_DUPLICATE_EMI_NUMBER");
    }

    seen.add(number);

    const emi = toCents(row.emiRemaining);
    const assessed = toCents(row.penaltyAssessed);

    if (
      assessed > 0 &&
      (
        row.penaltyPaid === undefined ||
        row.penaltyWaived === undefined
      )
    ) {
      throw new Error("PENALTY_SETTLEMENT_EVIDENCE_REQUIRED");
    }

    const paid = toCents(row.penaltyPaid ?? 0);
    const waived = toCents(row.penaltyWaived ?? 0);

    if (paid + waived > assessed) {
      throw new Error("PENALTY_OVER_SETTLED");
    }

    return {
      number,
      emi,
      penalty: assessed - paid - waived,
    };
  }).sort((a, b) => a.number - b.number);

  let remaining = cash - principal;
  let totalPenalty = 0;
  let totalEmi = 0;

  const lines: ManualAllocationLine[] = [];

  for (const row of prepared) {
    const penaltyReceived = Math.min(remaining, row.penalty);

    remaining -= penaltyReceived;
    totalPenalty += penaltyReceived;

    const emiReceived = Math.min(remaining, row.emi);

    remaining -= emiReceived;
    totalEmi += emiReceived;

    lines.push({
      installmentNumber: row.number,
      penaltyReceived: fromCents(penaltyReceived),
      emiReceived: fromCents(emiReceived),
      penaltyRemaining: fromCents(row.penalty - penaltyReceived),
      emiRemaining: fromCents(row.emi - emiReceived),
    });
  }

  if (
    principal + totalPenalty + totalEmi + remaining !== cash
  ) {
    throw new Error("CASH_RECONCILIATION_FAILED");
  }

  return {
    cashReceived: fromCents(cash),
    principalReceived: fromCents(principal),
    penaltyReceived: fromCents(totalPenalty),
    emiReceived: fromCents(totalEmi),
    unallocatedCash: fromCents(remaining),
    lines,
  };
}