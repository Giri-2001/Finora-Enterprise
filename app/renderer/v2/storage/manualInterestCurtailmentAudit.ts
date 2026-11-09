/**
 * PAISARULE C126-R104
 *
 * Independent validation of the interest-only future schedule
 * after cash allocation but before atomic USB publication.
 *
 * This module performs NO persistence.
 */

type Row = Record<string, unknown>;

export interface InterestCurtailmentAudit {
  principalReductionCents: number;
  futureInterestSavingCents: number;
  beforeRemainingCents: number;
  afterRemainingCents: number;
}

function cents(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error("CURTAILMENT_INVALID_AMOUNT");
  }

  const scaled = value * 100;
  const rounded = Math.round(scaled);

  if (
    !Number.isSafeInteger(rounded) ||
    Math.abs(scaled - rounded) > 0.000001
  ) {
    throw new Error("CURTAILMENT_INVALID_PRECISION");
  }

  return rounded;
}

function rows(value: unknown): Row[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (row) =>
        !row ||
        typeof row !== "object" ||
        Array.isArray(row),
    )
  ) {
    throw new Error("CURTAILMENT_INVALID_SCHEDULE");
  }

  return value as Row[];
}

function status(row: Row): string {
  return String(row.status ?? "").trim().toLowerCase();
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return "[" + value.map(canonical).join(",") + "]";
  }

  if (value && typeof value === "object") {
    const record = value as Row;
    return "{" + Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map(
        (key) =>
          JSON.stringify(key) + ":" + canonical(record[key]),
      )
      .join(",") + "}";
  }

  return JSON.stringify(value) ?? "undefined";
}

function remaining(schedule: Row[]): number {
  return schedule.reduce((total, row) => {
    const settled = new Set([
      "paid", "overdue paid", "preclosed",
    ]);

    const amount = cents(row.installmentAmount);
    const paid = cents(row.paidAmount ?? 0);
    const waived = cents(row.waivedAmount ?? 0);

    if (paid + waived > amount) {
      throw new Error("CURTAILMENT_OVERPAID_EMI");
    }

    return total + (
      settled.has(status(row))
        ? 0
        : amount - paid - waived
    );
  }, 0);
}

export function verifyInterestOnlyCurtailment(
  cashAllocatedInput: unknown,
  revisedInput: unknown,
  principalPayment: number,
  monthlyRate: number,
  repaymentType: unknown,
  paidDate: string,
): InterestCurtailmentAudit {
  const before = rows(cashAllocatedInput);
  const after = rows(revisedInput);

  if (before.length !== after.length) {
    throw new Error("CURTAILMENT_LENGTH_MISMATCH");
  }

  const principalCents = cents(principalPayment);

  if (principalCents <= 0) {
    throw new Error("CURTAILMENT_PRINCIPAL_REQUIRED");
  }

  if (
    typeof monthlyRate !== "number" ||
    !Number.isFinite(monthlyRate) ||
    monthlyRate < 0
  ) {
    throw new Error("CURTAILMENT_INVALID_RATE");
  }

  const date = String(paidDate ?? "").trim().slice(0, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  ) {
    throw new Error("CURTAILMENT_INVALID_DATE");
  }

  const numbers = new Set<number>();

  for (let index = 0; index < before.length; index++) {
    const number = before[index].installmentNumber;

    if (
      typeof number !== "number" ||
      !Number.isSafeInteger(number) ||
      number <= 0 ||
      numbers.has(number) ||
      after[index].installmentNumber !== number
    ) {
      throw new Error("CURTAILMENT_EMI_IDENTITY_MISMATCH");
    }

    numbers.add(number);
  }

  const originalPrincipal = Math.max(
    0,
    ...before.map((row) => Number(row.principalAmount ?? 0)),
  );

  const originalPrincipalCents = cents(originalPrincipal);

  if (
    originalPrincipalCents <= 0 ||
    principalCents > originalPrincipalCents
  ) {
    throw new Error("CURTAILMENT_PRINCIPAL_EXCEEDS_BALANCE");
  }

  const reducedPrincipal =
    (originalPrincipalCents - principalCents) / 100;

  const eligible: number[] = [];

  before.forEach((row, index) => {
    const dueDate = String(row.dueDate ?? "").trim().slice(0, 10);

    const settled = [
      "paid", "overdue paid", "preclosed",
    ].includes(status(row));

    if (
      !settled &&
      cents(row.paidAmount ?? 0) === 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
      dueDate > date
    ) {
      eligible.push(index);
    }
  });

  if (eligible.length === 0) {
    throw new Error("CURTAILMENT_NO_FUTURE_EMIS");
  }

  const frequency = String(repaymentType ?? "")
    .trim()
    .toLowerCase();

  const periodicRate =
    frequency === "daily"
      ? monthlyRate / 30
      : frequency === "weekly"
        ? monthlyRate * 7 / 30
        : frequency === "yearly"
          ? monthlyRate * 12
          : monthlyRate;

  const interest = Math.max(
    0,
    Math.round(reducedPrincipal * periodicRate / 100),
  );

  const finalIndex = eligible[eligible.length - 1];
  const eligibleSet = new Set(eligible);

  const expected = before.map((row, index) => {
    if (!eligibleSet.has(index)) {
      return { ...row };
    }

    const last = index === finalIndex;

    return {
      ...row,
      installmentAmount: last
        ? reducedPrincipal + interest
        : interest,
      principalAmount: last ? reducedPrincipal : 0,
      interestAmount: interest,
      outstandingBalance: last ? 0 : reducedPrincipal,
      paidAmount: 0,
      penaltyAmount: Number(row.penaltyAmount ?? 0),
      receiptNumber: row.receiptNumber ?? "",
      paidDate: row.paidDate ?? "",
      status: "Pending",
    };
  });

  for (let index = 0; index < expected.length; index++) {
    if (
      canonical(expected[index]) !== canonical(after[index])
    ) {
      throw new Error(
        "CURTAILMENT_FUTURE_SCHEDULE_MISMATCH",
      );
    }
  }

  const beforeRemainingCents = remaining(before);
  const afterRemainingCents = remaining(after);

  const saving =
    beforeRemainingCents -
    afterRemainingCents -
    principalCents;

  if (saving < 0) {
    throw new Error("CURTAILMENT_NEGATIVE_INTEREST_SAVING");
  }

  return {
    principalReductionCents: principalCents,
    futureInterestSavingCents: saving,
    beforeRemainingCents,
    afterRemainingCents,
  };
}