/**
 * PAISARULE_C137_R59_INTEGRATED_PRECLOSE_PREFLIGHT
 *
 * Financial preflight only. This module does not authorize
 * settlement, generate a native commit or write to storage.
 *
 * The native process MUST independently resolve tenant/session,
 * USB loan snapshot, cutoff cycle, penalty and EMI allocations.
 */

import {
  verifyPrecloseFinancialGate,
  type PrecloseFinancialInput,
} from "./precloseFinancialGate";

import {
  verifyPrecloseWaiverEvidence,
  type PrecloseEvidenceRow,
} from "./precloseWaiverEvidence";

export interface PrecloseSettlementPreflightInput
  extends PrecloseFinancialInput {
  precloseDate: string;
  paidThroughDate: string;
  originalRows: readonly PrecloseEvidenceRow[];
}

export interface PrecloseSettlementPreflightResult {
  originalOutstandingCents: number;
  cashReceivedCents: number;
  penaltyReceivedCents: number;
  debtCashCents: number;
  futureInterestWaiverCents: number;
  remainingOutstandingCents: 0;
  allocations: Array<{
    installmentNumber: number;
    dueDate: string;
    additionalWaiverCents: number;
  }>;
}

export function preparePrecloseSettlementPreflight(
  input: PrecloseSettlementPreflightInput,
): PrecloseSettlementPreflightResult {
  // First prove cash/penalty/discount arithmetic.
  const financial = verifyPrecloseFinancialGate(input);

  // Separately prove the proposed future-interest concession
  // from the supplied EMI schedule.
  const evidence = verifyPrecloseWaiverEvidence({
    confirmed: input.confirmed,
    precloseDate: input.precloseDate,
    paidThroughDate: input.paidThroughDate,
    expectedFutureInterestWaiver:
      input.futureInterestWaiver,
    originalRows: input.originalRows,
  });

  if (
    evidence.totalWaiverCents !== financial.waiverCents
  ) {
    throw new Error(
      "PRECLOSE_PREFLIGHT_WAIVER_EVIDENCE_MISMATCH",
    );
  }

  return {
    originalOutstandingCents:
      financial.originalOutstandingCents,
    cashReceivedCents: financial.cashReceivedCents,
    penaltyReceivedCents:
      financial.penaltyReceivedCents,
    debtCashCents: financial.debtCashCents,
    futureInterestWaiverCents:
      evidence.totalWaiverCents,
    remainingOutstandingCents: 0,
    allocations: evidence.allocations,
  };
}