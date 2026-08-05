/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   AADHAAR VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";

import { AADHAAR_PATTERN } from "../constants/validationPatterns";

import { toTrimmedString } from "../utils/validationHelpers";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   AADHAAR VALIDATOR
=========================================================== */

/**
 * Validates an Indian Aadhaar number.
 */
export function aadhaarValidator(
  field: string,
  value: unknown,
): ValidationResult {
  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const aadhaar = toTrimmedString(value);

  if (!AADHAAR_PATTERN.test(aadhaar)) {
    return {
      valid: false,

      field,

      code: "INVALID_AADHAAR",

      message: VALIDATION_MESSAGES.INVALID_AADHAAR,

      value,
    };
  }

  return {
    valid: true,

    field,

    code: "",

    message: "",

    value: aadhaar,
  };
}
