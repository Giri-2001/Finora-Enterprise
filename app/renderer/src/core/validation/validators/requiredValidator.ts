/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   REQUIRED VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";

import { isEmpty } from "../utils/validationHelpers";

/* ===========================================================
   REQUIRED VALIDATOR
=========================================================== */

/**
 * Validates whether a value is present.
 */
export function requiredValidator(
  field: string,
  value: unknown,
): ValidationResult {
  if (isEmpty(value)) {
    return {
      valid: false,

      field,

      code: "REQUIRED",

      message: VALIDATION_MESSAGES.REQUIRED,

      value,
    };
  }

  return {
    valid: true,

    field,

    code: "",

    message: "",

    value,
  };
}
