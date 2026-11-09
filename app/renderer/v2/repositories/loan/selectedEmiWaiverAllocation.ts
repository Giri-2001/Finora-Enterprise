/**
 * PAISARULE C132: Selected EMI discount accounting.
 *
 * Discount priority:
 * 1. Waive unpaid overdue.
 * EMI/principal/interest waiver is prohibited.
 *
 * Cash is allocated only after discount:
 * 1. Remaining overdue.
 * 2. Remaining EMI.
 *
 * This module is pure. It performs no persistence.
 */

export interface SelectedEmiWaiverInput {
  emiRemaining: number;
  overdueRemaining: number;
  cash: number;
  discount: number;
}

export interface SelectedEmiWaiverResult {
  overdueWaived: number;
  emiWaived: number;
  overdueCollected: number;
  emiCollected: number;
  overdueRemaining: number;
  emiRemaining: number;
  contractualReduction: number;
  fullySettled: boolean;
}

function moneyCents(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

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

export function allocateSelectedEmiWaiver(
  input: SelectedEmiWaiverInput,
): SelectedEmiWaiverResult | null {
  const emi = moneyCents(input.emiRemaining);
  const overdue = moneyCents(input.overdueRemaining);
  const cash = moneyCents(input.cash);
  const discount = moneyCents(input.discount);

  if (
    emi === null ||
    overdue === null ||
    cash === null ||
    discount === null
  ) {
    return null;
  }

  if (discount > overdue) {
    return null;
  }

  const overdueWaived = Math.min(discount, overdue);
  const emiWaived = 0;

  const dueOverdue = overdue - overdueWaived;
  const dueEmi = emi - emiWaived;

  if (cash > dueOverdue + dueEmi) {
    return null;
  }

  const overdueCollected = Math.min(cash, dueOverdue);
  const emiCollected = Math.min(
    cash - overdueCollected,
    dueEmi,
  );

  const remainingOverdue = dueOverdue - overdueCollected;
  const remainingEmi = dueEmi - emiCollected;

  return {
    overdueWaived: overdueWaived / 100,
    emiWaived: emiWaived / 100,
    overdueCollected: overdueCollected / 100,
    emiCollected: emiCollected / 100,
    overdueRemaining: remainingOverdue / 100,
    emiRemaining: remainingEmi / 100,
    contractualReduction: (emiCollected + emiWaived) / 100,
    fullySettled: remainingOverdue === 0 && remainingEmi === 0,
  };
}