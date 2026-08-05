/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   MOBILE VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";

import { MOBILE_PATTERN } from "../constants/validationPatterns";

import { toTrimmedString } from "../utils/validationHelpers";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   MOBILE VALIDATOR
=========================================================== */

/**
 * Validates an Indian mobile number.
 */
export function mobileValidator(
  field: string,
  value: unknown,
): ValidationResult {
  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const mobile = toTrimmedString(value);

  if (!MOBILE_PATTERN.test(mobile)) {
    return {
      valid: false,

      field,

      code: "INVALID_MOBILE",

      message: VALIDATION_MESSAGES.INVALID_MOBILE,

      value,
    };
  }

  return {
    valid: true,

    field,

    code: "",

    message: "",

    value: mobile,
  };
}
