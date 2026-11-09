/**
 * PAISARULE C132: overdue-only settlement reconciliation.
 * Pure validation; does not mutate or persist financial records.
 *
 * Monetary amounts use two decimal places at most.
 * A discount can waive overdue only, never contractual debt.
 */

export interface OverdueSettlementEvidence {
  previousOutstanding: number;
  nextOutstanding: number;
  emiDue: number;
  overdueDue: number;
  cash: number;
  discount: number;
  overdueCollected: number;
  emiCollected: number;
  principalCollected: number;
  overdueWaived: number;
  emiWaived: number;
  futureInterestSaving: number;
}

export interface OverdueSettlementVerification {
  contractualReduction: number;
  remainingEmi: number;
  remainingOverdue: number;
  fullySettled: boolean;
}

function cents(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;

  const scaled = value * 100;
  const rounded = Math.round(scaled);

  if (
    !Number.isSafeInteger(rounded) ||
    Math.abs(scaled - rounded) > 0.000001
  ) {
    return null;
  }

  return rounded;
}

export function verifyOverdueOnlySettlement(
  evidence: OverdueSettlementEvidence,
): OverdueSettlementVerification | null {
  const fields = [
    evidence.previousOutstanding,
    evidence.nextOutstanding,
    evidence.emiDue,
    evidence.overdueDue,
    evidence.cash,
    evidence.discount,
    evidence.overdueCollected,
    evidence.emiCollected,
    evidence.principalCollected,
    evidence.overdueWaived,
    evidence.emiWaived,
    evidence.futureInterestSaving,
  ];

  const values = fields.map(cents);

  if (values.some((value) => value === null)) return null;

  const [
    previous,
    next,
    emiDue,
    overdueDue,
    cash,
    discount,
    overdueCash,
    emiCash,
    principalCash,
    overdueWaived,
    emiWaived,
    interestSaving,
  ] = values as number[];

  // Discount cannot exceed the eligible unpaid overdue.
  if (discount > overdueDue) return null;

  // Waiver evidence must reconcile exactly.
  if (overdueWaived !== discount || emiWaived !== 0) return null;

  // No overpayment or over-allocation.
  if (overdueCash + overdueWaived > overdueDue) return null;
  if (emiCash > emiDue) return null;

  // Cash is always distinct from discount.
  if (cash !== overdueCash + emiCash + principalCash) return null;

  // A waived late fee never reduces contractual outstanding.
  const contractualReduction =
    emiCash + principalCash + interestSaving;

  if (contractualReduction > previous) return null;

  if (previous - next !== contractualReduction) return null;

  const remainingEmi = emiDue - emiCash;
  const remainingOverdue =
    overdueDue - overdueCash - overdueWaived;

  // Never accept a CLOSED balance while any EMI or overdue
  // liability remains unpaid or unwaived.
  if (
    next === 0 &&
    (remainingEmi !== 0 || remainingOverdue !== 0)
  ) {
    return null;
  }

  return {
    contractualReduction: contractualReduction / 100,
    remainingEmi: remainingEmi / 100,
    remainingOverdue: remainingOverdue / 100,
    fullySettled:
      next === 0 &&
      remainingEmi === 0 &&
      remainingOverdue === 0,
  };
}