/**
 * PAISARULE_C137_R109
 *
 * In-memory Loan projection for one overdue EMI penalty waiver.
 * No storage, USB, DB, Wallet, native IPC or receipt reservation.
 *
 * Not connected to Collection Save.
 */
import type {
  LoanScheduleInstallment,
} from "./loanRepository";

import {
  projectSelectedEmiWaiverSchedule,
} from "./selectedEmiWaiverSchedule";

export interface WaiverLoanProjectionInput {
  outstanding: number;
  schedule: readonly LoanScheduleInstallment[];
  selectedEmiNumbers: readonly number[];
  cashReceived: number;
  discountAmount: number;
  configuredLateFee: number;
  collectionDate: string;
  receiptNumber: string;
}

function cents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("WAIVER_LOAN_AMOUNT_INVALID");
  }

  const scaled = value * 100;
  const rounded = Math.round(scaled);

  if (
    !Number.isSafeInteger(rounded) ||
    Math.abs(scaled - rounded) > 0.000001
  ) {
    throw new Error("WAIVER_LOAN_PRECISION_INVALID");
  }

  return rounded;
}

export function projectSelectedEmiWaiverLoan(
  input: WaiverLoanProjectionInput,
): {
  outstanding: number;
  schedule: LoanScheduleInstallment[];
  emiReceived: number;
  penaltyReceived: number;
  penaltyWaived: number;
  cashReceived: number;
  status: "ACTIVE" | "CLOSED";
} {
  const previous = cents(input.outstanding);
  const cash = cents(input.cashReceived);
  const discount = cents(input.discountAmount);

  if (previous <= 0 || cash <= 0 || discount <= 0) {
    throw new Error("WAIVER_LOAN_EMPTY_SETTLEMENT");
  }

  const result = projectSelectedEmiWaiverSchedule({
    schedule: input.schedule,
    selectedEmiNumbers: input.selectedEmiNumbers,
    cashReceived: input.cashReceived,
    discountAmount: input.discountAmount,
    configuredLateFee: input.configuredLateFee,
    collectionDate: input.collectionDate,
    receiptNumber: input.receiptNumber,
  });

  const emi = cents(result.emiReceived);
  const penalty = cents(result.penaltyReceived);
  const waivedPenalty = cents(result.penaltyWaived);

  // Cash received = contractual EMI cash + penalty cash.
  if (
    emi + penalty !== cash ||
    waivedPenalty !== discount ||
    emi <= 0
  ) {
    throw new Error("WAIVER_LOAN_CASH_RECONCILIATION_FAILED");
  }

  // Penalty waiver does not reduce contractual loan outstanding.
  if (emi > previous) {
    throw new Error("WAIVER_LOAN_OVERSETTLEMENT");
  }

  const remaining = previous - emi;

  return {
    outstanding: remaining / 100,
    schedule: result.schedule,
    emiReceived: emi / 100,
    penaltyReceived: penalty / 100,
    penaltyWaived: waivedPenalty / 100,
    cashReceived: cash / 100,
    status: remaining === 0 ? "CLOSED" : "ACTIVE",
  };
}