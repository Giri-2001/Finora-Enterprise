// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// NUMBERING FORMATTER
//
// RESPONSIBILITY:
//
// - Validate FINORA numbering segments
// - Normalize system-owned Business / Branch codes
// - Format Customer Numbers
// - Format Loan Numbers
// - Format Collection Numbers
// - Format matching Receipt Numbers
//
// IMPORTANT:
//
// - PURE FUNCTIONS ONLY.
// - No sequence allocation.
// - No persistence.
// - No StorageManager access.
// - No repository access.
// - No React.
// - Previewing a number does not consume a sequence.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  COLLECTION_SEQUENCE_LENGTH,
  COLLECTION_SEQUENCE_MAX,
  COLLECTION_SEQUENCE_MIN,
  CUSTOMER_NUMBER_LENGTH,
  CUSTOMER_NUMBER_MAX,
  CUSTOMER_NUMBER_MIN,
  FINORA_COLLECTION_PREFIX,
  FINORA_CUSTOMER_PREFIX,
  FINORA_LOAN_PREFIX,
  FINORA_NUMBER_PREFIX,
  FINORA_NUMBER_SEPARATOR,
  FINORA_RECEIPT_PREFIX,
  LOAN_SEQUENCE_LENGTH,
  LOAN_SEQUENCE_MAX,
  LOAN_SEQUENCE_MIN,
} from "../../constants/numbering/numbering.constants";

import type {
  CollectionReceiptNumberPair,
} from "../../types/numbering/numbering.types";

// ============================================================
// CODE NORMALIZATION
// ============================================================

export function normalizeNumberingCode(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        "",
      );

  if (!normalized) {
    throw new Error(
      "FINORA numbering code cannot be empty.",
    );
  }

  return normalized;
}

// ============================================================
// INTEGER VALIDATION
// ============================================================

function assertIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  fieldName: string,
): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(
      `${fieldName} must be a safe integer.`,
    );
  }

  if (
    value < minimum ||
    value > maximum
  ) {
    throw new RangeError(
      `${fieldName} must be between ${minimum} and ${maximum}.`,
    );
  }
}

// ============================================================
// SEGMENT FORMATTING
// ============================================================

function formatNumericSegment(
  value: number,
  length: number,
): string {
  return String(value).padStart(
    length,
    "0",
  );
}

function joinNumberParts(
  parts: readonly string[],
): string {
  return parts.join(
    FINORA_NUMBER_SEPARATOR,
  );
}

// ============================================================
// CUSTOMER NUMBER
// ============================================================

export function formatCustomerId(
  businessCode: string,
  branchCode: string,
  customerNumber: number,
): string {
  assertIntegerInRange(
    customerNumber,
    CUSTOMER_NUMBER_MIN,
    CUSTOMER_NUMBER_MAX,
    "Customer number",
  );

  return joinNumberParts([
    FINORA_NUMBER_PREFIX,
    FINORA_CUSTOMER_PREFIX,
    normalizeNumberingCode(
      businessCode,
    ),
    normalizeNumberingCode(
      branchCode,
    ),
    formatNumericSegment(
      customerNumber,
      CUSTOMER_NUMBER_LENGTH,
    ),
  ]);
}

// ============================================================
// LOAN NUMBER
//
// Loan sequence is scoped to one Customer.
//
// Every Customer begins:
// 001, 002, 003 ...
// ============================================================

export function formatLoanNumber(
  businessCode: string,
  branchCode: string,
  customerNumber: number,
  loanSequence: number,
): string {
  assertIntegerInRange(
    customerNumber,
    CUSTOMER_NUMBER_MIN,
    CUSTOMER_NUMBER_MAX,
    "Customer number",
  );

  assertIntegerInRange(
    loanSequence,
    LOAN_SEQUENCE_MIN,
    LOAN_SEQUENCE_MAX,
    "Loan sequence",
  );

  return joinNumberParts([
    FINORA_NUMBER_PREFIX,
    FINORA_LOAN_PREFIX,
    normalizeNumberingCode(
      businessCode,
    ),
    normalizeNumberingCode(
      branchCode,
    ),
    formatNumericSegment(
      customerNumber,
      CUSTOMER_NUMBER_LENGTH,
    ),
    formatNumericSegment(
      loanSequence,
      LOAN_SEQUENCE_LENGTH,
    ),
  ]);
}

// ============================================================
// COLLECTION NUMBER
//
// Collection sequence is scoped to one Loan.
//
// Every Loan begins:
// 001, 002, 003 ...
// ============================================================

export function formatCollectionNumber(
  businessCode: string,
  branchCode: string,
  customerNumber: number,
  loanSequence: number,
  collectionSequence: number,
): string {
  assertIntegerInRange(
    customerNumber,
    CUSTOMER_NUMBER_MIN,
    CUSTOMER_NUMBER_MAX,
    "Customer number",
  );

  assertIntegerInRange(
    loanSequence,
    LOAN_SEQUENCE_MIN,
    LOAN_SEQUENCE_MAX,
    "Loan sequence",
  );

  assertIntegerInRange(
    collectionSequence,
    COLLECTION_SEQUENCE_MIN,
    COLLECTION_SEQUENCE_MAX,
    "Collection sequence",
  );

  return joinNumberParts([
    FINORA_NUMBER_PREFIX,
    FINORA_COLLECTION_PREFIX,
    normalizeNumberingCode(
      businessCode,
    ),
    normalizeNumberingCode(
      branchCode,
    ),
    formatNumericSegment(
      customerNumber,
      CUSTOMER_NUMBER_LENGTH,
    ),
    formatNumericSegment(
      loanSequence,
      LOAN_SEQUENCE_LENGTH,
    ),
    formatNumericSegment(
      collectionSequence,
      COLLECTION_SEQUENCE_LENGTH,
    ),
  ]);
}

// ============================================================
// RECEIPT NUMBER
//
// Receipt owns no separate sequence.
//
// It mirrors the Collection transaction sequence exactly.
// ============================================================

export function formatReceiptNumber(
  businessCode: string,
  branchCode: string,
  customerNumber: number,
  loanSequence: number,
  collectionSequence: number,
): string {
  assertIntegerInRange(
    customerNumber,
    CUSTOMER_NUMBER_MIN,
    CUSTOMER_NUMBER_MAX,
    "Customer number",
  );

  assertIntegerInRange(
    loanSequence,
    LOAN_SEQUENCE_MIN,
    LOAN_SEQUENCE_MAX,
    "Loan sequence",
  );

  assertIntegerInRange(
    collectionSequence,
    COLLECTION_SEQUENCE_MIN,
    COLLECTION_SEQUENCE_MAX,
    "Collection sequence",
  );

  return joinNumberParts([
    FINORA_NUMBER_PREFIX,
    FINORA_RECEIPT_PREFIX,
    normalizeNumberingCode(
      businessCode,
    ),
    normalizeNumberingCode(
      branchCode,
    ),
    formatNumericSegment(
      customerNumber,
      CUSTOMER_NUMBER_LENGTH,
    ),
    formatNumericSegment(
      loanSequence,
      LOAN_SEQUENCE_LENGTH,
    ),
    formatNumericSegment(
      collectionSequence,
      COLLECTION_SEQUENCE_LENGTH,
    ),
  ]);
}

// ============================================================
// COLLECTION + RECEIPT PAIR
// ============================================================

export function formatCollectionReceiptPair(
  businessCode: string,
  branchCode: string,
  customerNumber: number,
  loanSequence: number,
  collectionSequence: number,
): CollectionReceiptNumberPair {
  return {
    customerNumber,
    loanSequence,
    collectionSequence,

    collectionNumber:
      formatCollectionNumber(
        businessCode,
        branchCode,
        customerNumber,
        loanSequence,
        collectionSequence,
      ),

    receiptNumber:
      formatReceiptNumber(
        businessCode,
        branchCode,
        customerNumber,
        loanSequence,
        collectionSequence,
      ),
  };
}

// ============================================================
// END
// ============================================================
