/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   DATE VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   DATE VALIDATOR
=========================================================== */

export function dateValidator(
  field: string,
  value: unknown,
): ValidationResult {
  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      field,
      code: "INVALID_DATE",
      message: VALIDATION_MESSAGES.INVALID_DATE,
      value,
    };
  }

  return {
    valid: true,
    field,
    code: "",
    message: "",
    value: date,
  };
}
