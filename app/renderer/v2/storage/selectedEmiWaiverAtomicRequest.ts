/**
 * PAISARULE_C137_R118
 * Selected EMI penalty-waiver atomic request preflight.
 *
 * Pure request preparation: no I/O, no USB, no Wallet,
 * no database mutation and no receipt-number reservation.
 *
 * Not connected to the Save button.
 */
type Data = Record<string, unknown>;

function object(value: unknown, label: string): Data {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(label);
  }
  return value as Data;
}

function cents(value: unknown): number {
  if (typeof value !== "number" ||
      !Number.isFinite(value) || value < 0) {
    throw new Error("WAIVER_REQUEST_AMOUNT_INVALID");
  }
  const raw = value * 100;
  const result = Math.round(raw);
  if (!Number.isSafeInteger(result) ||
      Math.abs(raw - result) > 0.000001) {
    throw new Error("WAIVER_REQUEST_PRECISION_INVALID");
  }
  return result;
}

function rowNumber(row: Data, receipt: boolean): number {
  const n = receipt ? row.number : row.installmentNumber;
  if (typeof n !== "number" ||
      !Number.isSafeInteger(n) || n <= 0) {
    throw new Error("WAIVER_REQUEST_EMI_ID_INVALID");
  }
  return n;
}

function rows(value: unknown, receipt: boolean): Map<number, Data> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("WAIVER_REQUEST_SCHEDULE_REQUIRED");
  }
  const map = new Map<number, Data>();
  for (const entry of value) {
    const row = object(entry, "WAIVER_REQUEST_ROW_INVALID");
    const number = rowNumber(row, receipt);
    if (map.has(number)) {
      throw new Error("WAIVER_REQUEST_DUPLICATE_EMI");
    }
    map.set(number, row);
  }
  return map;
}

export function prepareSelectedEmiWaiverAtomicRequest(
  originalUnknown: unknown,
  projectedUnknown: unknown,
  collectionRecordUnknown: unknown,
): {
  expectedLoanData: Data;
  loanInput: { id: string; entity: "LOAN"; data: Data };
  collectionInput: Data;
} {
  const original = object(
    originalUnknown, "WAIVER_REQUEST_ORIGINAL_LOAN_REQUIRED",
  );
  const projected = object(
    projectedUnknown, "WAIVER_REQUEST_PROJECTED_LOAN_REQUIRED",
  );
  const collectionRecord = object(
    collectionRecordUnknown, "WAIVER_REQUEST_COLLECTION_REQUIRED",
  );
  const collection = object(
    // PAISARULE_C138_R25_FLAT_COLLECTION_NATIVE_PARITY
    collectionRecord.data ?? collectionRecord,
    "WAIVER_REQUEST_COLLECTION_DATA_REQUIRED",
  );

  const loanId = String(original.id ?? "").trim();
  const collectionId = String(collectionRecord.id ?? "").trim();
  const receipt = String(collection.receiptNumber ?? "").trim();

  if (!loanId ||
      String(projected.id ?? "").trim() !== loanId ||
      String(collection.loanId ?? "").trim() !== loanId ||
      !collectionId ||
      String(collection.id ?? "").trim() !== collectionId ||
      collectionRecord.entity !== "COLLECTION" ||
      collection.status !== "Approved" ||
      !receipt) {
    throw new Error("WAIVER_REQUEST_IDENTITY_INVALID");
  }

  const selected = collection.selectedEmiNumbers;
  const snapshot = object(
    collection.receiptSnapshot,
    "WAIVER_REQUEST_RECEIPT_REQUIRED",
  );

  if (!Array.isArray(selected) ||
      selected.length !== 1 ||
      typeof selected[0] !== "number" ||
      !Number.isSafeInteger(selected[0]) ||
      selected[0] <= 0 ||
      !Array.isArray(snapshot.selectedEmiNumbers) ||
      snapshot.selectedEmiNumbers.length !== 1 ||
      snapshot.selectedEmiNumbers[0] !== selected[0] ||
      snapshot.scheduleAvailable !== true ||
      snapshot.version !== 1) {
    throw new Error("WAIVER_REQUEST_SINGLE_EMI_REQUIRED");
  }

  const before = rows(original.schedule, false);
  const after = rows(projected.schedule, false);
  const receiptRows = rows(snapshot.installments, true);
  const target = selected[0] as number;

  if (before.size !== after.size ||
      before.size !== receiptRows.size ||
      !before.has(target)) {
    throw new Error("WAIVER_REQUEST_SCHEDULE_MISMATCH");
  }

  const paidStatuses = new Set([
    "paid", "overdue paid", "preclosed",
  ]);

  let remainingEmis = 0;

  for (const [number, old] of before) {
    const next = after.get(number);
    const snap = receiptRows.get(number);
    if (!next || !snap) {
      throw new Error("WAIVER_REQUEST_SCHEDULE_MISMATCH");
    }

    if (number !== target &&
        JSON.stringify(old) !== JSON.stringify(next)) {
      throw new Error("WAIVER_REQUEST_HISTORY_CHANGED");
    }

    for (const [loanKey, receiptKey] of [
      ["installmentAmount", "amount"],
      ["paidAmount", "paidAmount"],
      ["waivedAmount", "waivedAmount"],
      ["penaltyAmount", "penaltyAmount"],
      ["penaltyPaidAmount", "penaltyPaidAmount"],
      ["penaltyWaivedAmount", "penaltyWaivedAmount"],
    ]) {
      if (cents(next[loanKey] ?? 0) !==
          cents(snap[receiptKey] ?? 0)) {
        throw new Error("WAIVER_REQUEST_RECEIPT_ROW_MISMATCH");
      }
    }

    if (String(next.status).trim().toLowerCase() !==
        String(snap.status).trim().toLowerCase() ||
        String(next.dueDate) !== String(snap.dueDate)) {
      throw new Error("WAIVER_REQUEST_RECEIPT_ROW_MISMATCH");
    }

    if (!paidStatuses.has(
      String(next.status).trim().toLowerCase(),
    )) {
      remainingEmis += 1;
    }
  }

  if (snapshot.totalEmis !== after.size ||
      snapshot.remainingEmis !== remainingEmis) {
    throw new Error("WAIVER_REQUEST_RECEIPT_COUNT_MISMATCH");
  }

  const old = before.get(target)!;
  const next = after.get(target)!;

  const required = cents(old.installmentAmount);
  const priorPaid = cents(old.paidAmount ?? 0);
  const priorContractWaived = cents(old.waivedAmount ?? 0);
  const priorPenaltyPaid = cents(old.penaltyPaidAmount ?? 0);
  const priorPenaltyWaived = cents(old.penaltyWaivedAmount ?? 0);

  const emiCash = cents(next.paidAmount) - priorPaid;
  const penaltyCash =
    cents(next.penaltyPaidAmount ?? 0) - priorPenaltyPaid;
  const penaltyWaiver =
    cents(next.penaltyWaivedAmount ?? 0) - priorPenaltyWaived;

  const cash = cents(collection.paymentAmount);
  const discount = cents(collection.discountAmount);
  const collectionPenalty = cents(collection.penaltyAmount);
  const oldOutstanding = cents(original.outstanding);
  const newOutstanding = cents(projected.outstanding);

  if (required <= 0 ||
      priorPaid + priorContractWaived >= required ||
      emiCash !== required - priorPaid - priorContractWaived ||
      cents(next.waivedAmount ?? 0) !== priorContractWaived ||
      penaltyWaiver <= 0 ||
      penaltyWaiver !== discount ||
      penaltyCash < 0 ||
      penaltyCash !== collectionPenalty ||
      emiCash + penaltyCash !== cash ||
      oldOutstanding - newOutstanding !== emiCash ||
      cents(next.penaltyPaidAmount ?? 0) +
        cents(next.penaltyWaivedAmount ?? 0) !==
        cents(next.penaltyAmount ?? 0) ||
      String(next.status).trim().toLowerCase() !== "overdue paid" ||
      String(next.receiptNumber ?? "").trim() !== receipt ||
      String(next.paidDate ?? "").slice(0, 10) !==
        String(collection.receiptDate ?? "").slice(0, 10) ||
      cents(collection.outstandingBalance) !== newOutstanding ||
      cents(snapshot.previousOutstanding) !== oldOutstanding ||
      cents(snapshot.remainingOutstanding) !== newOutstanding ||
      cents(snapshot.amountReceived) !== cash ||
      cents(snapshot.penaltyReceived) !== penaltyCash ||
      cents(snapshot.discountAmount) !== discount ||
      cents(collection.advanceAdjustment ?? 0) !== 0) {
    throw new Error("WAIVER_REQUEST_FINANCIAL_RECONCILIATION_FAILED");
  }

  // Native process must independently verify the source Loan,
  // authoritative late fee, receipt evidence and tenant scope.
  return {
    expectedLoanData: original,
    loanInput: {
      id: loanId,
      entity: "LOAN",
      data: projected,
    },
    collectionInput: collectionRecord,
  };
}