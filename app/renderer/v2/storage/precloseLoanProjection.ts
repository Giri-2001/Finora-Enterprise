/**
 * PAISARULE_C137_R62_PRECLOSE_LOAN_PROJECTOR
 * In-memory preclose projection only. Never writes storage.
 * Native process must independently verify schedule and cutoff.
 */
import type { Loan } from "../components/customers/office/CustomerOffice/types";
import {
  getPersistedSchedule,
  type LoanScheduleInstallment,
} from "../repositories/loan/loanRepository";
import { preparePrecloseSettlementPreflight } from "./precloseSettlementPreflight";

export interface PrecloseProjectionInput {
  loan: Loan;
  receiptDate: string;
  receiptNumber: string;
  paidThroughDate: string;
  cashReceived: number;
  penaltyReceived: number;
  futureInterestWaiver: number;
}

const cents = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("PRECLOSE_PROJECTOR_AMOUNT_INVALID");
  }
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (!Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > 1e-6) {
    throw new Error("PRECLOSE_PROJECTOR_PRECISION_INVALID");
  }
  return rounded;
};

const money = (value: number): number => value / 100;
const settledStatuses = new Set(["paid", "overdue paid", "preclosed"]);

/** In-memory only: cash to due interest/principal, waiver to future interest. */
export function preparePrecloseLoanProjection(
  input: PrecloseProjectionInput,
): Loan {
  const { loan, receiptDate, receiptNumber, paidThroughDate } = input;
  if (!loan || typeof loan.id !== "string" || !loan.id.trim() ||
      !receiptNumber?.trim() || loan.interestType !== "interestOnly") {
    throw new Error("PRECLOSE_PROJECTOR_INTEREST_ONLY_LOAN_REQUIRED");
  }
  const persisted = getPersistedSchedule(loan);
  if (!persisted.field || !persisted.schedule?.length) {
    throw new Error("PRECLOSE_PROJECTOR_PERSISTED_SCHEDULE_REQUIRED");
  }
  const original = persisted.schedule;
  const before = JSON.stringify(loan);
  let scheduleBalance = 0;
  let scheduledPenalty = 0;
  const seen = new Set<number>();
  const rows = original.map((row) => {
    const n = row.installmentNumber;
    if (!Number.isSafeInteger(n) || n <= 0 || seen.has(n) ||
        typeof row.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.dueDate)) {
      throw new Error("PRECLOSE_PROJECTOR_EMI_IDENTITY_INVALID");
    }
    seen.add(n);
    const amount = cents(row.installmentAmount);
    const interest = cents(row.interestAmount);
    const principal = cents(row.principalAmount ?? 0);
    const paid = cents(row.paidAmount ?? 0);
    const waived = cents(row.waivedAmount ?? 0);
    if (!amount || amount !== interest + principal || paid + waived > amount) {
      throw new Error("PRECLOSE_PROJECTOR_EMI_ACCOUNTING_INVALID");
    }
    const status = String(row.status ?? "").trim().toLowerCase();
    if (settledStatuses.has(status) && paid + waived !== amount) {
      throw new Error("PRECLOSE_PROJECTOR_SETTLED_HISTORY_INVALID");
    }
    scheduleBalance += amount - paid - waived;
    if (!Number.isSafeInteger(scheduleBalance)) {
      throw new Error("PRECLOSE_PROJECTOR_SUM_OVERFLOW");
    }
    const penalty = cents(row.penaltyAmount ?? 0);
    const penaltyPaid = cents(row.penaltyPaidAmount ?? 0);
    const penaltyWaived = cents(row.penaltyWaivedAmount ?? 0);
    if (penaltyPaid + penaltyWaived > penalty) {
      throw new Error("PRECLOSE_PROJECTOR_PENALTY_EVIDENCE_INVALID");
    }
    // Older settled EMI evidence is preserved, never fabricated.
    if (settledStatuses.has(status)) {
      if (penalty > 0 && (row.penaltyPaidAmount === undefined ||
          row.penaltyWaivedAmount === undefined)) {
        throw new Error("PRECLOSE_PROJECTOR_LEGACY_PENALTY_UNVERIFIABLE");
      }
    } else {
      const lateFee = cents(loan.lateFee ?? 0);
      const assessed = row.dueDate < receiptDate && paid + waived < amount
        ? Math.max(penalty, lateFee) : penalty;
      scheduledPenalty += assessed - penaltyPaid - penaltyWaived;
    }
    return row;
  });
  if (scheduleBalance !== cents(loan.outstanding)) {
    throw new Error("PRECLOSE_PROJECTOR_SCHEDULE_OUTSTANDING_MISMATCH");
  }
  if (scheduledPenalty !== cents(input.penaltyReceived)) {
    throw new Error("PRECLOSE_PROJECTOR_PENALTY_TOTAL_MISMATCH");
  }
  const verified = preparePrecloseSettlementPreflight({
    confirmed: true,
    outstanding: loan.outstanding,
    cashReceived: input.cashReceived,
    penaltyReceived: input.penaltyReceived,
    futureInterestWaiver: input.futureInterestWaiver,
    manualPrincipal: 0,
    precloseDate: receiptDate,
    paidThroughDate,
    originalRows: rows.map(row => ({
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate ?? "",
      interestAmount: row.interestAmount ?? 0,
      paidAmount: row.paidAmount ?? 0,
      waivedAmount: row.waivedAmount ?? 0,
      status: row.status ?? "",
    })),
  });
  const waiverByNumber = new Map(verified.allocations.map(row => [
    row.installmentNumber, row.additionalWaiverCents,
  ]));
  let appliedDebt = 0;
  let appliedPenalty = 0;
  const projected = rows.map((row): LoanScheduleInstallment => {
    const amount = cents(row.installmentAmount);
    const oldPaid = cents(row.paidAmount ?? 0);
    const oldWaived = cents(row.waivedAmount ?? 0);
    const oldPenaltyPaid = cents(row.penaltyPaidAmount ?? 0);
    const oldPenaltyWaived = cents(row.penaltyWaivedAmount ?? 0);
    const oldPenalty = cents(row.penaltyAmount ?? 0);
    const status = String(row.status ?? "").toLowerCase();
    if (settledStatuses.has(status)) return { ...row };
    const newPenalty = row.dueDate! < receiptDate && oldPaid + oldWaived < amount
      ? Math.max(oldPenalty, cents(loan.lateFee ?? 0)) : oldPenalty;
    const penaltyDelta = newPenalty - oldPenaltyPaid - oldPenaltyWaived;
    const waiveDelta = waiverByNumber.get(row.installmentNumber) ?? 0;
    if (waiveDelta > cents(row.interestAmount ?? 0) ||
        oldPaid + oldWaived + waiveDelta > amount) {
      throw new Error("PRECLOSE_PROJECTOR_WAIVER_ALLOCATION_INVALID");
    }
    const cashDelta = amount - oldPaid - oldWaived - waiveDelta;
    appliedDebt += cashDelta;
    appliedPenalty += penaltyDelta;
    if (!Number.isSafeInteger(appliedDebt) || !Number.isSafeInteger(appliedPenalty)) {
      throw new Error("PRECLOSE_PROJECTOR_TOTAL_OVERFLOW");
    }
    const nextStatus = waiveDelta > 0 ? "Preclosed" :
      row.dueDate! < receiptDate ? "Overdue Paid" : "Paid";
    return {
      ...row,
      paidAmount: money(oldPaid + cashDelta),
      waivedAmount: money(oldWaived + waiveDelta),
      penaltyAmount: money(newPenalty),
      penaltyPaidAmount: money(oldPenaltyPaid + penaltyDelta),
      penaltyWaivedAmount: money(oldPenaltyWaived),
      status: nextStatus,
      paidDate: receiptDate,
      receiptNumber,
      ...(row.outstandingBalance === undefined ? {} : { outstandingBalance: 0 }),
    };
  });
  if (appliedDebt !== verified.debtCashCents ||
      appliedPenalty !== verified.penaltyReceivedCents) {
    throw new Error("PRECLOSE_PROJECTOR_CASH_ALLOCATION_MISMATCH");
  }
  if (JSON.stringify(loan) !== before) {
    throw new Error("PRECLOSE_PROJECTOR_ORIGINAL_MUTATED");
  }
  return {
    ...loan,
    [persisted.field]: projected,
    outstanding: 0,
    status: "CLOSED",
    updatedAt: new Date().toISOString(),
  } as Loan;
}
