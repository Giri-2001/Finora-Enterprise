/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   EMAIL VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";
import { EMAIL_PATTERN } from "../constants/validationPatterns";

import { toTrimmedString } from "../utils/validationHelpers";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   EMAIL VALIDATOR
=========================================================== */

/**
 * Validates an email address.
 */
export function emailValidator(
  field: string,
  value: unknown,
): ValidationResult {
  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const email = toTrimmedString(value).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return {
      valid: false,

      field,

      code: "INVALID_EMAIL",

      message: VALIDATION_MESSAGES.INVALID_EMAIL,

      value,
    };
  }

  return {
    valid: true,

    field,

    code: "",

    message: "",

    value: email,
  };
}
