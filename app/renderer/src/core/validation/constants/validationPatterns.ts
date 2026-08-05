/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   VALIDATION PATTERNS
=========================================================== */

/* ===========================================================
   REGULAR EXPRESSIONS
=========================================================== */

/**
 * Exactly 10 numeric digits.
 */
export const MOBILE_PATTERN = /^\d{10}$/;

/**
 * Exactly 12 numeric digits.
 */
export const AADHAAR_PATTERN = /^\d{12}$/;

/**
 * Indian PAN format.
 * Example: ABCDE1234F
 */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Standard email validation.
 */
export const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===========================================================
   VALIDATION LIMITS
=========================================================== */

export const VALIDATION_LIMITS = {
  MOBILE_LENGTH: 10,

  AADHAAR_LENGTH: 12,

  PAN_LENGTH: 10,

  MIN_LOAN_AMOUNT: 1,

  MAX_LOAN_AMOUNT: Number.MAX_SAFE_INTEGER,

  MIN_INTEREST: 0,

  MAX_INTEREST: 100,

  MIN_PROCESSING_FEE: 0,

  MAX_PROCESSING_FEE: Number.MAX_SAFE_INTEGER,

  MIN_ADVANCE_DEDUCTION: 0,

  MAX_ADVANCE_DEDUCTION: Number.MAX_SAFE_INTEGER,

  MIN_DURATION: 1,

  MAX_DURATION: 1200,
} as const;
