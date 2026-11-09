/**
 * PAISARULE_C137_R106
 *
 * Pure, offline, single-EMI overdue penalty waiver projection.
 * No storage, database, wallet or native IPC access.
 *
 * This module is NOT connected to Collection Save.
 */
export interface OverdueWaiverInput {
  installmentNumber: number;
  installmentAmount: number;
  paidAmount: number;
  waivedAmount: number;
  penaltyAmount: number;
  penaltyPaidAmount: number;
  penaltyWaivedAmount: number;
  dueDate: string;
  status: string;
  configuredLateFee: number;
  collectionDate: string;
  receiptNumber: string;
  cashReceived: number;
  discountAmount: number;
}

export interface OverdueWaiverResult {
  installmentNumber: number;
  paidAmount: number;
  waivedAmount: number;
  penaltyAmount: number;
  penaltyPaidAmount: number;
  penaltyWaivedAmount: number;
  emiReceived: number;
  penaltyReceived: number;
  discountAmount: number;
  status: "Overdue Paid";
  receiptNumber: string;
  paidDate: string;
}

function toCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("WAIVER_INVALID_AMOUNT");
  }

  const scaled = value * 100;
  const rounded = Math.round(scaled);

  if (
    !Number.isSafeInteger(rounded) ||
    Math.abs(scaled - rounded) > 0.000001
  ) {
    throw new Error("WAIVER_INVALID_PRECISION");
  }

  return rounded;
}

function isoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value;
}

export function projectSingleOverduePenaltyWaiver(
  input: OverdueWaiverInput,
): OverdueWaiverResult {
  const {
    installmentNumber,
    installmentAmount,
    paidAmount,
    waivedAmount,
    penaltyAmount,
    penaltyPaidAmount,
    penaltyWaivedAmount,
    dueDate,
    status,
    configuredLateFee,
    collectionDate,
    receiptNumber,
    cashReceived,
    discountAmount,
  } = input;

  if (
    !Number.isSafeInteger(installmentNumber) ||
    installmentNumber <= 0 ||
    !isoDate(dueDate) ||
    !isoDate(collectionDate) ||
    collectionDate <= dueDate ||
    typeof receiptNumber !== "string" ||
    !receiptNumber.trim()
  ) {
    throw new Error("WAIVER_OVERDUE_EVIDENCE_REQUIRED");
  }

  const existingStatus = status.trim().toLowerCase();

  if (
    ["paid", "overdue paid", "preclosed"].includes(existingStatus)
  ) {
    throw new Error("WAIVER_SETTLED_EMI_IMMUTABLE");
  }

  const required = toCents(installmentAmount);
  const alreadyPaid = toCents(paidAmount);
  const alreadyWaived = toCents(waivedAmount);
  const assessedBefore = toCents(penaltyAmount);
  const fee = toCents(configuredLateFee);
  const feePaid = toCents(penaltyPaidAmount);
  const feeWaived = toCents(penaltyWaivedAmount);
  const cash = toCents(cashReceived);
  const discount = toCents(discountAmount);

  if (
    required <= 0 ||
    alreadyPaid + alreadyWaived >= required ||
    alreadyPaid + alreadyWaived > required ||
    feePaid + feeWaived > assessedBefore
  ) {
    throw new Error("WAIVER_INVALID_BASELINE");
  }

  // An unassessed overdue fee may be assessed once using
  // the configured fee. Existing assessed amounts are preserved.
  const assessed = assessedBefore > 0 ? assessedBefore : fee;
  const outstandingPenalty = assessed - feePaid - feeWaived;
  const remainingEmi = required - alreadyPaid - alreadyWaived;

  if (
    discount <= 0 ||
    outstandingPenalty <= 0 ||
    discount > outstandingPenalty
  ) {
    throw new Error("WAIVER_EXCEEDS_ELIGIBLE_PENALTY");
  }

  const newPenaltyCash = outstandingPenalty - discount;
  const expectedCash = remainingEmi + newPenaltyCash;

  // R106 supports exact full EMI settlement only.
  // Partial, multiple EMI and principal allocations need
  // separately verified contracts.
  if (cash !== expectedCash) {
    throw new Error("WAIVER_CASH_ALLOCATION_MISMATCH");
  }

  const nextPaid = alreadyPaid + remainingEmi;
  const nextPenaltyPaid = feePaid + newPenaltyCash;
  const nextPenaltyWaived = feeWaived + discount;

  if (
    nextPaid + alreadyWaived !== required ||
    nextPenaltyPaid + nextPenaltyWaived !== assessed ||
    remainingEmi + newPenaltyCash !== cash
  ) {
    throw new Error("WAIVER_RECONCILIATION_FAILED");
  }

  return {
    installmentNumber,
    paidAmount: nextPaid / 100,
    waivedAmount: alreadyWaived / 100,
    penaltyAmount: assessed / 100,
    penaltyPaidAmount: nextPenaltyPaid / 100,
    penaltyWaivedAmount: nextPenaltyWaived / 100,
    emiReceived: remainingEmi / 100,
    penaltyReceived: newPenaltyCash / 100,
    discountAmount: discount / 100,
    status: "Overdue Paid",
    receiptNumber: receiptNumber.trim(),
    paidDate: collectionDate,
  };
}