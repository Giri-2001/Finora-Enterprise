/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   PROCESSING FEE VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { VALIDATION_LIMITS } from "../constants/validationPatterns";

import { numericValidator } from "./numericValidator";

/* ===========================================================
   PROCESSING FEE VALIDATOR
=========================================================== */

export function processingFeeValidator(
  field: string,
  value: unknown,
): ValidationResult {
  return numericValidator({
    field,
    value,
    code: "INVALID_PROCESSING_FEE",
    message: VALIDATION_MESSAGES.INVALID_PROCESSING_FEE,
    min: VALIDATION_LIMITS.MIN_PROCESSING_FEE,
    max: VALIDATION_LIMITS.MAX_PROCESSING_FEE,
  });
}
