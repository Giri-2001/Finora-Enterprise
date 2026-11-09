/**
 * PAISARULE_C137_R110
 * Independent native-side validation of a single overdue
 * penalty waiver, without trusting renderer calculations.
 *
 * Pure verification only. NOT connected to native IPC.
 */
type Row = Record<string, unknown>;

export interface NativeWaiverEvidence {
  before: Row[];
  after: Row[];
  selectedEmiNumbers: number[];
  collectionDate: string;
  receiptNumber: string;
  configuredLateFee: number;
  cashReceived: number;
  discountAmount: number;
  penaltyReceived: number;
  previousOutstanding: number;
  remainingOutstanding: number;
  receiptInstallments: Row[];
}

function cents(value: unknown): number {
  if (typeof value !== "number" ||
      !Number.isFinite(value) || value < 0) {
    throw new Error("NATIVE_WAIVER_AMOUNT_INVALID");
  }
  const scaled = value * 100;
  const n = Math.round(scaled);
  if (!Number.isSafeInteger(n) ||
      Math.abs(scaled - n) > 0.000001) {
    throw new Error("NATIVE_WAIVER_PRECISION_INVALID");
  }
  return n;
}

function date(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("NATIVE_WAIVER_DATE_INVALID");
  }

  const normalized =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : /^\d{4}-\d{2}-\d{2}T/.test(value)
        ? value.slice(0, 10)
        : "";

  if (!normalized) {
    throw new Error("NATIVE_WAIVER_DATE_INVALID");
  }

  const t = Date.parse(normalized + "T00:00:00Z");

  if (!Number.isFinite(t) ||
      new Date(t).toISOString().slice(0, 10) !== normalized) {
    throw new Error("NATIVE_WAIVER_DATE_INVALID");
  }

  return normalized;
}

function id(row: Row): number {
  const n = row.installmentNumber;
  if (typeof n !== "number" ||
      !Number.isSafeInteger(n) || n <= 0) {
    throw new Error("NATIVE_WAIVER_ROW_ID_INVALID");
  }
  return n;
}

export function verifyNativeSelectedEmiWaiver(
  input: NativeWaiverEvidence,
): true {
  if (!Array.isArray(input.selectedEmiNumbers) ||
      input.selectedEmiNumbers.length !== 1 ||
      !Number.isSafeInteger(input.selectedEmiNumbers[0]) ||
      input.selectedEmiNumbers[0] <= 0 ||
      !Array.isArray(input.before) ||
      !Array.isArray(input.after) ||
      !Array.isArray(input.receiptInstallments) ||
      input.before.length === 0 ||
      input.before.length !== input.after.length ||
      input.after.length !== input.receiptInstallments.length ||
      typeof input.receiptNumber !== "string" ||
      !input.receiptNumber.trim()) {
    throw new Error("NATIVE_WAIVER_EVIDENCE_INVALID");
  }

  const selected = input.selectedEmiNumbers[0];
  const collectedDate = date(input.collectionDate);
  const prior = new Map<number, Row>();
  const next = new Map<number, Row>();
  const receipt = new Map<number, Row>();

  for (const [rows, map, receiptMode] of [
    [input.before, prior, false],
    [input.after, next, false],
    [input.receiptInstallments, receipt, true],
  ] as const) {
    for (const row of rows) {
      if (!row || typeof row !== "object" ||
          Array.isArray(row)) {
        throw new Error("NATIVE_WAIVER_ROW_INVALID");
      }
      // PAISARULE_C139_R4_RECEIPT_EMI_ID_COMPAT
      // Receipt snapshots may preserve the canonical Loan
      // `installmentNumber` field or expose the receipt-facing
      // `number` alias. Both identify the same EMI row.
      // No financial value or allocation rule is relaxed here.
      const number = receiptMode
        ? (
            typeof row.number === "number"
              ? row.number
              : row.installmentNumber
          )
        : id(row);
      if (typeof number !== "number" ||
          !Number.isSafeInteger(number) ||
          number <= 0 || map.has(number)) {
        throw new Error("NATIVE_WAIVER_DUPLICATE_ROW");
      }
      map.set(number, row);
    }
  }

  if (!prior.has(selected) ||
      !next.has(selected) ||
      !receipt.has(selected)) {
    throw new Error("NATIVE_WAIVER_SELECTED_ROW_MISSING");
  }

  for (const [number, old] of prior) {
    const updated = next.get(number);
    const snapshot = receipt.get(number);
    if (!updated || !snapshot) {
      throw new Error("NATIVE_WAIVER_SCHEDULE_MISMATCH");
    }

    if (number !== selected &&
        JSON.stringify(old) !== JSON.stringify(updated)) {
      throw new Error("NATIVE_WAIVER_HISTORY_CHANGED");
    }

    const fields = [
      ["installmentAmount", "amount"],
      ["paidAmount", "paidAmount"],
      ["waivedAmount", "waivedAmount"],
      ["penaltyAmount", "penaltyAmount"],
      ["penaltyPaidAmount", "penaltyPaidAmount"],
      ["penaltyWaivedAmount", "penaltyWaivedAmount"],
    ] as const;

    for (const [loanField, receiptField] of fields) {
      const a = cents(updated[loanField] ?? 0);
      const b = cents(snapshot[receiptField] ?? 0);
      if (a !== b) {
        throw new Error("NATIVE_WAIVER_RECEIPT_MISMATCH");
      }
    }
    if (String(updated.status).toLowerCase() !==
        String(snapshot.status).toLowerCase() ||
        String(updated.dueDate) !== String(snapshot.dueDate)) {
      throw new Error("NATIVE_WAIVER_RECEIPT_MISMATCH");
    }
  }

  const old = prior.get(selected)!;
  const updated = next.get(selected)!;

  const dueDate = date(old.dueDate);
  if (collectedDate <= dueDate ||
      ["paid", "overdue paid", "preclosed"].includes(
        String(old.status).trim().toLowerCase()
      )) {
    throw new Error("NATIVE_WAIVER_NOT_ELIGIBLE");
  }

  const required = cents(old.installmentAmount);
  const paid = cents(old.paidAmount ?? 0);
  const contractualWaived = cents(old.waivedAmount ?? 0);
  const priorAssessed = cents(old.penaltyAmount ?? 0);
  const priorPenaltyPaid = cents(old.penaltyPaidAmount ?? 0);
  const priorPenaltyWaived = cents(old.penaltyWaivedAmount ?? 0);

  const assessed = priorAssessed > 0
    ? priorAssessed
    : cents(input.configuredLateFee);
  const discount = cents(input.discountAmount);
  const cash = cents(input.cashReceived);
  const penaltyCash = cents(input.penaltyReceived);
  const emiDue = required - paid - contractualWaived;
  const penaltyDue = assessed -
    priorPenaltyPaid - priorPenaltyWaived;

  if (required <= 0 || emiDue <= 0 ||
      priorPenaltyPaid + priorPenaltyWaived > priorAssessed ||
      discount <= 0 || discount > penaltyDue ||
      penaltyCash !== penaltyDue - discount ||
      cash !== emiDue + penaltyCash) {
    throw new Error("NATIVE_WAIVER_ALLOCATION_INVALID");
  }

  if (cents(updated.installmentAmount) !== required ||
      cents(updated.paidAmount) !== paid + emiDue ||
      cents(updated.waivedAmount ?? 0) !== contractualWaived ||
      cents(updated.penaltyAmount ?? 0) !== assessed ||
      cents(updated.penaltyPaidAmount ?? 0) !==
        priorPenaltyPaid + penaltyCash ||
      cents(updated.penaltyWaivedAmount ?? 0) !==
        priorPenaltyWaived + discount ||
      String(updated.status).trim().toLowerCase() !==
        "overdue paid" ||
      String(updated.receiptNumber ?? "").trim() !==
        input.receiptNumber.trim() ||
      String(updated.paidDate ?? "").slice(0, 10) !== collectedDate) {
    throw new Error("NATIVE_WAIVER_ROW_RECONCILIATION_FAILED");
  }

  const previous = cents(input.previousOutstanding);
  const remaining = cents(input.remainingOutstanding);
  if (previous < emiDue ||
      previous - remaining !== emiDue) {
    throw new Error("NATIVE_WAIVER_OUTSTANDING_MISMATCH");
  }

  return true;
}