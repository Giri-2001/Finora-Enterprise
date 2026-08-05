/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   PAN VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { PAN_PATTERN } from "../constants/validationPatterns";

import { toTrimmedString } from "../utils/validationHelpers";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   PAN VALIDATOR
=========================================================== */

/**
 * Validates an Indian PAN number.
 */
export function panValidator(
  field: string,
  value: unknown,
): ValidationResult {
  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const pan = toTrimmedString(value).toUpperCase();

  if (!PAN_PATTERN.test(pan)) {
    return {
      valid: false,

      field,

      code: "INVALID_PAN",

      message: VALIDATION_MESSAGES.INVALID_PAN,

      value,
    };
  }

  return {
    valid: true,

    field,

    code: "",

    message: "",

    value: pan,
  };
}
