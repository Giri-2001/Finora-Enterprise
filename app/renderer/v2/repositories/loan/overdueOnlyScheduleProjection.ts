import { allocateSelectedEmiWaiver } from "./selectedEmiWaiverAllocation";

export interface OverdueScheduleRow {
  installmentAmount: number;
  paidAmount: number;
  waivedAmount?: number;
  penaltyAmount: number;
  penaltyPaidAmount?: number;
  penaltyWaivedAmount?: number;
  status: string;
}

export interface OverdueScheduleResult<T extends OverdueScheduleRow> {
  installment: T;
  overdueCollected: number;
  overdueWaived: number;
  emiCollected: number;
  contractualReduction: number;
  fullySettled: boolean;
}

/**
 * Pure, non-persistent EMI projection.
 * Caller must independently verify overdue eligibility,
 * collection date, loan scope and authoritative baseline.
 */
export function projectOverdueOnlyScheduleRow<T extends OverdueScheduleRow>(
  original: T,
  cash: number,
  discount: number,
  overdueEligible: boolean,
): OverdueScheduleResult<T> | null {
  const cents = (value: number): number | null => {
    if (!Number.isFinite(value) || value < 0) return null;
    const scaled = value * 100;
    const rounded = Math.round(scaled);
    if (
      !Number.isSafeInteger(rounded) ||
      Math.abs(scaled - rounded) > 0.000001
    ) return null;
    return rounded;
  };

  const amount = cents(original.installmentAmount);
  const paid = cents(original.paidAmount);
  const waived = cents(original.waivedAmount ?? 0);
  const penalty = cents(original.penaltyAmount);
  const penaltyPaid = cents(original.penaltyPaidAmount ?? 0);
  const penaltyWaived = cents(original.penaltyWaivedAmount ?? 0);
  const cashCents = cents(cash);
  const discountCents = cents(discount);

  if (
    amount === null || paid === null || waived === null ||
    penalty === null || penaltyPaid === null ||
    penaltyWaived === null || cashCents === null ||
    discountCents === null
  ) return null;

  if (
    paid + waived > amount ||
    penaltyPaid + penaltyWaived > penalty
  ) return null;

  const status = String(original.status ?? "").trim().toLowerCase();

  if (["paid", "overdue paid", "preclosed"].includes(status)) {
    return null;
  }

  if (discountCents > 0 && !overdueEligible) return null;

  const emiRemaining = (amount - paid - waived) / 100;
  const overdueRemaining =
    (penalty - penaltyPaid - penaltyWaived) / 100;

  const allocation = allocateSelectedEmiWaiver({
    emiRemaining,
    overdueRemaining,
    cash,
    discount,
  });

  if (!allocation || allocation.emiWaived !== 0) return null;

  const nextPaid = paid + Math.round(allocation.emiCollected * 100);
  const nextPenaltyPaid =
    penaltyPaid + Math.round(allocation.overdueCollected * 100);
  const nextPenaltyWaived =
    penaltyWaived + Math.round(allocation.overdueWaived * 100);

  const fullySettled =
    nextPaid + waived === amount &&
    nextPenaltyPaid + nextPenaltyWaived === penalty;

  const nextStatus = fullySettled
    ? overdueEligible ? "Overdue Paid" : "Paid"
    : cashCents > 0 ? "Partial" : original.status;

  return {
    installment: {
      ...original,
      paidAmount: nextPaid / 100,
      penaltyPaidAmount: nextPenaltyPaid / 100,
      penaltyWaivedAmount: nextPenaltyWaived / 100,
      status: nextStatus,
    },
    overdueCollected: allocation.overdueCollected,
    overdueWaived: allocation.overdueWaived,
    emiCollected: allocation.emiCollected,
    contractualReduction: allocation.contractualReduction,
    fullySettled,
  };
}