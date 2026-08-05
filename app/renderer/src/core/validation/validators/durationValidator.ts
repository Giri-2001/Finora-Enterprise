/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   DURATION VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { VALIDATION_LIMITS } from "../constants/validationPatterns";

import { numericValidator } from "./numericValidator";

/* ===========================================================
   DURATION VALIDATOR
=========================================================== */

export function durationValidator(
  field: string,
  value: unknown,
): ValidationResult {
  return numericValidator({
    field,
    value,
    code: "INVALID_DURATION",
    message: VALIDATION_MESSAGES.INVALID_DURATION,
    min: VALIDATION_LIMITS.MIN_DURATION,
    max: VALIDATION_LIMITS.MAX_DURATION,
  });
}
