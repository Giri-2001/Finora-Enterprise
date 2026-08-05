/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   VALIDATION MESSAGES
=========================================================== */

/* ===========================================================
   VALIDATION MESSAGES
=========================================================== */

export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required.",

  INVALID_MOBILE:
    "Mobile number must contain exactly 10 digits.",

  INVALID_AADHAAR:
    "Aadhaar number must contain exactly 12 digits.",

  INVALID_PAN:
    "PAN number format is invalid.",

  INVALID_EMAIL:
    "Email address is invalid.",

  INVALID_LOAN_AMOUNT:
    "Loan amount is invalid.",

  INVALID_INTEREST:
    "Interest value is invalid.",

  INVALID_PROCESSING_FEE:
    "Processing fee is invalid.",

  INVALID_ADVANCE_DEDUCTION:
    "Advance deduction is invalid.",

  INVALID_DURATION:
    "Duration is invalid.",

  INVALID_DATE:
    "Date is invalid.",

  INVALID_TEXT_LENGTH:
    "Text length is invalid.",

  INVALID_RANGE:
    "Value is outside the allowed range.",
} as const;
