/**
 * PAISARULE_C137_R60_NATIVE_PRECLOSE_WAIVER_CORE
 *
 * Independent native-side eligibility calculation.
 * PURE FUNCTION: no USB, database or wallet operations.
 *
 * IMPORTANT:
 * - The caller must supply rows read from authoritative USB.
 * - cutoffDate must be determined independently in Native
 *   from the governing loan contract and settlement policy.
 * - Never accept a renderer-controlled cutoff as authority.
 * - This function does not authorize a settlement or commit.
 */

export interface NativePrecloseEmiRow {
  installmentNumber: number;
  dueDate: string;
  installmentAmount: number;
  interestAmount: number;
  principalAmount: number;
  paidAmount: number;
  waivedAmount?: number;
  status: string;
}

export interface NativePrecloseWaiverInput {
  settlementDate: string;
  cutoffDate: string;
  originalRows: readonly NativePrecloseEmiRow[];
}

export interface NativePrecloseWaiverAllocation {
  installmentNumber: number;
  dueDate: string;
  additionalWaiverCents: number;
}

export interface NativePrecloseWaiverResult {
  totalWaiverCents: number;
  allocations: NativePrecloseWaiverAllocation[];
}

function asCents(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("NATIVE_PRECLOSE_INVALID_AMOUNT");
  }

  const scaled = value * 100;
  const rounded = Math.round(scaled);

  if (
    !Number.isSafeInteger(rounded) ||
    Math.abs(scaled - rounded) > 0.000001
  ) {
    throw new Error("NATIVE_PRECLOSE_INVALID_PRECISION");
  }

  return rounded;
}

function validDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/**
 * Calculates eligibility from original authoritative EMI rows.
 *
 * This deliberately DOES NOT modify the rows or infer how
 * cash was allocated. Those checks are separate native duties.
 */
export function calculateNativePrecloseWaiver(
  input: NativePrecloseWaiverInput,
): NativePrecloseWaiverResult {
  if (
    !validDate(input.settlementDate) ||
    !validDate(input.cutoffDate) ||
    input.cutoffDate < input.settlementDate
  ) {
    throw new Error("NATIVE_PRECLOSE_INVALID_CUTOFF");
  }

  if (
    !Array.isArray(input.originalRows) ||
    input.originalRows.length === 0
  ) {
    throw new Error("NATIVE_PRECLOSE_SCHEDULE_REQUIRED");
  }

  const seen = new Set<number>();
  const allocations: NativePrecloseWaiverAllocation[] = [];
  let total = 0;

  for (const row of input.originalRows) {
    if (
      !row ||
      !Number.isSafeInteger(row.installmentNumber) ||
      row.installmentNumber <= 0 ||
      seen.has(row.installmentNumber) ||
      !validDate(row.dueDate)
    ) {
      throw new Error("NATIVE_PRECLOSE_EMI_IDENTITY_INVALID");
    }

    seen.add(row.installmentNumber);

    const installment = asCents(row.installmentAmount);
    const interest = asCents(row.interestAmount);
    const principal = asCents(row.principalAmount);
    const paid = asCents(row.paidAmount);
    const waived = asCents(row.waivedAmount ?? 0);

    if (
      installment <= 0 ||
      interest + principal !== installment ||
      paid + waived > installment
    ) {
      throw new Error("NATIVE_PRECLOSE_EMI_ACCOUNTING_INVALID");
    }

    const status = String(row.status ?? "").trim().toLowerCase();

    const settled =
      status === "paid" ||
      status === "overdue paid" ||
      status === "preclosed";

    if (settled && paid + waived !== installment) {
      throw new Error("NATIVE_PRECLOSE_SETTLED_EMI_INCONSISTENT");
    }

    if (row.dueDate <= input.cutoffDate || settled) {
      continue;
    }

    // Interest-first paid allocation. Never waive interest
    // that has already been settled by cash or earlier waiver.
    const satisfiedInterest = Math.min(interest, paid + waived);
    const eligible = interest - satisfiedInterest;

    if (eligible > 0) {
      total += eligible;

      if (!Number.isSafeInteger(total)) {
        throw new Error("NATIVE_PRECLOSE_WAIVER_OVERFLOW");
      }

      allocations.push({
        installmentNumber: row.installmentNumber,
        dueDate: row.dueDate,
        additionalWaiverCents: eligible,
      });
    }
  }

  return {
    totalWaiverCents: total,
    allocations: allocations.sort(
      (a, b) => a.installmentNumber - b.installmentNumber,
    ),
  };
}