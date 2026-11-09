/**
 * PAISARULE_C137_R57_PRECLOSE_WAIVER_EVIDENCE
 *
 * Pure schedule evidence verification. No storage writes.
 *
 * This is NOT an authorization or a complete Loan projector.
 * The native process must independently read the USB Loan,
 * determine the valid paid-through cycle and verify all
 * principal, penalty, EMI and receipt allocations.
 */

export interface PrecloseEvidenceRow {
  installmentNumber: number;
  dueDate: string;
  interestAmount: number;
  paidAmount: number;
  waivedAmount?: number;
  status: string;
}

export interface PrecloseWaiverEvidenceInput {
  confirmed: boolean;
  precloseDate: string;

  // Must be independently determined from authoritative
  // contract and collection-cycle rules.
  paidThroughDate: string;

  expectedFutureInterestWaiver: number;
  originalRows: readonly PrecloseEvidenceRow[];
}

export interface PrecloseWaiverAllocation {
  installmentNumber: number;
  dueDate: string;
  additionalWaiverCents: number;
}

export interface VerifiedPrecloseWaiverEvidence {
  totalWaiverCents: number;
  allocations: PrecloseWaiverAllocation[];
}

function cents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("PRECLOSE_WAIVER_INVALID_AMOUNT");
  }

  const scaled = value * 100;
  const rounded = Math.round(scaled);

  if (
    !Number.isSafeInteger(rounded) ||
    Math.abs(scaled - rounded) > 0.000001
  ) {
    throw new Error("PRECLOSE_WAIVER_INVALID_PRECISION");
  }

  return rounded;
}

function validDate(value: string): boolean {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(value + "T00:00:00.000Z");

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function verifyPrecloseWaiverEvidence(
  input: PrecloseWaiverEvidenceInput,
): VerifiedPrecloseWaiverEvidence {
  if (input.confirmed !== true) {
    throw new Error("PRECLOSE_WAIVER_CONFIRMATION_REQUIRED");
  }

  if (
    !validDate(input.precloseDate) ||
    !validDate(input.paidThroughDate) ||
    input.paidThroughDate < input.precloseDate
  ) {
    throw new Error("PRECLOSE_WAIVER_CYCLE_DATE_INVALID");
  }

  if (
    !Array.isArray(input.originalRows) ||
    input.originalRows.length === 0
  ) {
    throw new Error("PRECLOSE_WAIVER_SCHEDULE_REQUIRED");
  }

  const expected = cents(input.expectedFutureInterestWaiver);

  if (expected <= 0) {
    throw new Error("PRECLOSE_WAIVER_POSITIVE_AMOUNT_REQUIRED");
  }

  const seen = new Set<number>();
  const allocations: PrecloseWaiverAllocation[] = [];

  let total = 0;

  for (const row of input.originalRows) {
    if (
      !row ||
      !Number.isSafeInteger(row.installmentNumber) ||
      row.installmentNumber <= 0 ||
      seen.has(row.installmentNumber) ||
      !validDate(row.dueDate)
    ) {
      throw new Error("PRECLOSE_WAIVER_EMI_IDENTITY_INVALID");
    }

    seen.add(row.installmentNumber);

    const interest = cents(row.interestAmount);
    const paid = cents(row.paidAmount);
    const waived = cents(row.waivedAmount ?? 0);

    const status = String(row.status ?? "")
      .trim()
      .toLowerCase();

    const settled = (
      status === "paid" ||
      status === "overdue paid" ||
      status === "preclosed"
    );

    // Never waive a settled historical row.
    // Do not grant concessions on interest already satisfied.
    if (settled || row.dueDate <= input.paidThroughDate) {
      continue;
    }

    const alreadySatisfied = Math.min(
      interest,
      paid + waived,
    );

    const eligible = interest - alreadySatisfied;

    if (eligible > 0) {
      total += eligible;

      if (!Number.isSafeInteger(total)) {
        throw new Error("PRECLOSE_WAIVER_TOTAL_OVERFLOW");
      }

      allocations.push({
        installmentNumber: row.installmentNumber,
        dueDate: row.dueDate,
        additionalWaiverCents: eligible,
      });
    }
  }

  // No arbitrary remainder, partial future waiver,
  // extra discount or renderer-supplied adjustment.
  if (total !== expected) {
    throw new Error(
      "PRECLOSE_WAIVER_SCHEDULE_TOTAL_MISMATCH",
    );
  }

  return {
    totalWaiverCents: total,
    allocations: allocations.sort(
      (left, right) =>
        left.installmentNumber - right.installmentNumber,
    ),
  };
}