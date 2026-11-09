/**
 * PAISARULE_C137_R47_PRECLOSE_FINANCIAL_GATE
 *
 * Pure accounting preflight only.
 * NOT a save authorization.
 * Native USB authority must independently verify every
 * original EMI, penalty, waiver and final status.
 */

export interface PrecloseFinancialInput {
  confirmed: boolean;
  outstanding: number;
  cashReceived: number;
  penaltyReceived: number;
  futureInterestWaiver: number;
  manualPrincipal: number;
}

export interface PrecloseFinancialResult {
  cashReceivedCents: number;
  penaltyReceivedCents: number;
  debtCashCents: number;
  waiverCents: number;
  originalOutstandingCents: number;
  remainingOutstandingCents: 0;
}

function toCents(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`PRECLOSE_INVALID_${name}`);
  }

  const scaled = value * 100;
  const cents = Math.round(scaled);

  if (
    !Number.isSafeInteger(cents) ||
    Math.abs(scaled - cents) > 0.000001
  ) {
    throw new Error(`PRECLOSE_INVALID_PRECISION_${name}`);
  }

  return cents;
}

/**
 * Verifies aggregate preclose settlement:
 *
 * outstanding = (cash - penalty) + futureInterestWaiver
 *
 * Does not validate EMI-level waiver eligibility.
 * Does not permit a discount in ordinary collections.
 */
export function verifyPrecloseFinancialGate(
  input: PrecloseFinancialInput,
): PrecloseFinancialResult {
  if (input.confirmed !== true) {
    throw new Error("PRECLOSE_CONFIRMATION_REQUIRED");
  }

  const outstanding = toCents(
    input.outstanding,
    "OUTSTANDING",
  );
  const cash = toCents(
    input.cashReceived,
    "CASH",
  );
  const penalty = toCents(
    input.penaltyReceived,
    "PENALTY",
  );
  const waiver = toCents(
    input.futureInterestWaiver,
    "WAIVER",
  );
  const manualPrincipal = toCents(
    input.manualPrincipal,
    "MANUAL_PRINCIPAL",
  );

  if (outstanding <= 0 || cash <= 0) {
    throw new Error("PRECLOSE_POSITIVE_BALANCE_REQUIRED");
  }

  if (manualPrincipal !== 0) {
    throw new Error("PRECLOSE_MANUAL_PRINCIPAL_MUST_BE_ZERO");
  }

  if (penalty > cash) {
    throw new Error("PRECLOSE_PENALTY_EXCEEDS_CASH");
  }

  const debtCash = cash - penalty;

  if (debtCash > outstanding) {
    throw new Error("PRECLOSE_DEBT_CASH_EXCEEDS_OUTSTANDING");
  }

  if (debtCash + waiver !== outstanding) {
    throw new Error("PRECLOSE_CASH_WAIVER_RECONCILIATION_FAILED");
  }

  return {
    cashReceivedCents: cash,
    penaltyReceivedCents: penalty,
    debtCashCents: debtCash,
    waiverCents: waiver,
    originalOutstandingCents: outstanding,
    remainingOutstandingCents: 0,
  };
}