/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   INTEREST VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";

import { VALIDATION_LIMITS } from "../constants/validationPatterns";

import { numericValidator } from "./numericValidator";

/* ===========================================================
   INTEREST VALIDATOR
=========================================================== */

/**
 * Validates an interest percentage.
 */
export function interestValidator(
  field: string,
  value: unknown,
): ValidationResult {
  return numericValidator({
    field,
    value,
    code: "INVALID_INTEREST",
    message: VALIDATION_MESSAGES.INVALID_INTEREST,
    min: VALIDATION_LIMITS.MIN_INTEREST,
    max: VALIDATION_LIMITS.MAX_INTEREST,
  });
}
