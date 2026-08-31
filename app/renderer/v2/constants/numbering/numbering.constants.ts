// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// NUMBERING CONSTANTS
//
// RESPONSIBILITY:
//
// - Define immutable FINORA numbering prefixes
// - Define permanent numeric segment lengths
// - Define safe numeric boundaries
// - Keep numbering vocabulary centralized
//
// IMPORTANT:
//
// - CONSTANTS ONLY.
// - No generation logic.
// - No persistence.
// - No owner-selected starting Customer number.
// - No business or branch code derivation.
// - Loan sequence is scoped per Customer.
// - Collection sequence is scoped per Loan.
// - Receipt uses the same Collection transaction sequence.
// - No React.
// - No StorageManager access.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// BRAND PREFIX
// ============================================================

export const FINORA_NUMBER_PREFIX =
  "FIN" as const;

// ============================================================
// ENTITY PREFIXES
// ============================================================

export const FINORA_CUSTOMER_PREFIX =
  "CUS" as const;

export const FINORA_LOAN_PREFIX =
  "LOAN" as const;

export const FINORA_COLLECTION_PREFIX =
  "COL" as const;

export const FINORA_RECEIPT_PREFIX =
  "RCP" as const;

// ============================================================
// NUMERIC SEGMENT LENGTHS
//
// Customer:
//
// - Permanent 6-digit branch-level Customer series.
//
// Loan:
//
// - 3-digit sequence scoped to one Customer.
// - Every Customer starts from 001.
//
// Collection:
//
// - 3-digit transaction sequence scoped to one Loan.
// - Every Loan starts from 001.
//
// Receipt:
//
// - No separate Receipt sequence.
// - Uses the same Collection transaction sequence.
// ============================================================

export const CUSTOMER_NUMBER_LENGTH =
  6 as const;

export const LOAN_SEQUENCE_LENGTH =
  3 as const;

export const COLLECTION_SEQUENCE_LENGTH =
  3 as const;

// ============================================================
// CUSTOMER NUMBER BOUNDARIES
//
// Owner chooses the starting Customer number during initial
// Customer Series setup.
//
// The permanent Customer segment remains exactly 6 digits.
//
// Examples:
//
// 1      -> 000001
// 100001 -> 100001
// 999999 -> 999999
// ============================================================

export const CUSTOMER_NUMBER_MIN =
  1 as const;

export const CUSTOMER_NUMBER_MAX =
  999999 as const;

// ============================================================
// LOAN SEQUENCE BOUNDARIES
//
// Sequence is local to each Customer.
//
// Customer A:
// 001 ... 999
//
// Customer B:
// 001 ... 999
//
// The complete hierarchical Loan Number remains unique because
// the Customer root number is part of the Loan Number.
// ============================================================

export const LOAN_SEQUENCE_MIN =
  1 as const;

export const LOAN_SEQUENCE_MAX =
  999 as const;

// ============================================================
// COLLECTION SEQUENCE BOUNDARIES
//
// Sequence is local to each Loan.
//
// Loan 001:
// 001 ... 999
//
// Loan 002:
// 001 ... 999
//
// Receipt mirrors this same Collection sequence.
// ============================================================

export const COLLECTION_SEQUENCE_MIN =
  1 as const;

export const COLLECTION_SEQUENCE_MAX =
  999 as const;

// ============================================================
// NUMBERING SEPARATOR
// ============================================================

export const FINORA_NUMBER_SEPARATOR =
  "-" as const;

// ============================================================
// END
// ============================================================
