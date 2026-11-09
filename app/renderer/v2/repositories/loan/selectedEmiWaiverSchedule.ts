/**
 * PAISARULE_C137_R108
 *
 * Pure selected-EMI overdue penalty waiver projection.
 * No storage reads/writes, native IPC or wallet access.
 * NOT connected to Collection Save.
 */
import type {
  LoanScheduleInstallment,
} from "./loanRepository";

import {
  projectSingleOverduePenaltyWaiver,
} from "./overduePenaltyWaiver";

export interface SelectedEmiWaiverRequest {
  schedule: readonly LoanScheduleInstallment[];
  selectedEmiNumbers: readonly number[];
  cashReceived: number;
  discountAmount: number;
  configuredLateFee: number;
  collectionDate: string;
  receiptNumber: string;
}

// PAISARULE_C138_R9_STRICT_DATE_NORMALIZATION
// Accept a calendar date or a complete ISO timestamp.
// Never invent a missing day, use local timezone conversion,
// or reinterpret ambiguous regional date formats.
function canonicalWaiverDate(value: string): string {
  const raw = value.trim();

  const validShape =
    /^\d{4}-\d{2}-\d{2}$/.test(raw) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw);

  if (!validShape) return raw;

  const day = raw.slice(0, 10);
  const midnight = Date.parse(day + "T00:00:00Z");

  if (
    !Number.isFinite(midnight) ||
    new Date(midnight).toISOString().slice(0, 10) !== day
  ) {
    return raw;
  }

  if (raw.length > 10 && !Number.isFinite(Date.parse(raw))) {
    return raw;
  }

  return day;
}
export function projectSelectedEmiWaiverSchedule(
  request: SelectedEmiWaiverRequest,
): {
  schedule: LoanScheduleInstallment[];
  emiReceived: number;
  penaltyReceived: number;
  penaltyWaived: number;
} {
  if (
    !Array.isArray(request.schedule) ||
    request.schedule.length === 0 ||
    !Array.isArray(request.selectedEmiNumbers) ||
    request.selectedEmiNumbers.length !== 1
  ) {
    throw new Error("WAIVER_SINGLE_SELECTED_EMI_REQUIRED");
  }

  const number = request.selectedEmiNumbers[0];

  if (
    !Number.isSafeInteger(number) ||
    number <= 0
  ) {
    throw new Error("WAIVER_INVALID_EMI_NUMBER");
  }

  const seen = new Set<number>();

  for (const row of request.schedule) {
    if (!row || typeof row !== "object") {
      throw new Error("WAIVER_SCHEDULE_ROW_INVALID");
    }

    const id = Number(row.installmentNumber);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      seen.has(id)
    ) {
      throw new Error("WAIVER_SCHEDULE_ID_INVALID");
    }

    seen.add(id);
  }

  const target = request.schedule.find(
    (row) => Number(row.installmentNumber) === number,
  );

  if (!target) {
    throw new Error("WAIVER_SELECTED_EMI_NOT_FOUND");
  }

  const result = projectSingleOverduePenaltyWaiver({
    installmentNumber: number,
    installmentAmount: Number(target.installmentAmount),
    paidAmount: Number(target.paidAmount ?? 0),
    waivedAmount: Number(target.waivedAmount ?? 0),
    penaltyAmount: Number(target.penaltyAmount ?? 0),
    penaltyPaidAmount: Number(target.penaltyPaidAmount ?? 0),
    penaltyWaivedAmount: Number(target.penaltyWaivedAmount ?? 0),
    dueDate: canonicalWaiverDate(String(target.dueDate ?? "")),
    status: String(target.status ?? ""),
    configuredLateFee: request.configuredLateFee,
    collectionDate: canonicalWaiverDate(request.collectionDate),
    receiptNumber: request.receiptNumber,
    cashReceived: request.cashReceived,
    discountAmount: request.discountAmount,
  });

  const schedule = request.schedule.map((row) => {
    if (Number(row.installmentNumber) !== number) {
      // Preserve historical rows without changing any fields.
      return { ...row };
    }

    return {
      ...row,
      paidAmount: result.paidAmount,
      waivedAmount: result.waivedAmount,
      penaltyAmount: result.penaltyAmount,
      penaltyPaidAmount: result.penaltyPaidAmount,
      penaltyWaivedAmount: result.penaltyWaivedAmount,
      status: result.status,
      receiptNumber: result.receiptNumber,
      paidDate: result.paidDate,
    };
  });

  return {
    schedule,
    emiReceived: result.emiReceived,
    penaltyReceived: result.penaltyReceived,
    penaltyWaived: result.discountAmount,
  };
}