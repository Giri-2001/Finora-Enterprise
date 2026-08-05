/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   ADVANCE DEDUCTION VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { VALIDATION_LIMITS } from "../constants/validationPatterns";

import { numericValidator } from "./numericValidator";

/* ===========================================================
   ADVANCE DEDUCTION VALIDATOR
=========================================================== */

export function advanceDeductionValidator(
  field: string,
  value: unknown,
): ValidationResult {
  return numericValidator({
    field,
    value,
    code: "INVALID_ADVANCE_DEDUCTION",
    message: VALIDATION_MESSAGES.INVALID_ADVANCE_DEDUCTION,
    min: VALIDATION_LIMITS.MIN_ADVANCE_DEDUCTION,
    max: VALIDATION_LIMITS.MAX_ADVANCE_DEDUCTION,
  });
}
