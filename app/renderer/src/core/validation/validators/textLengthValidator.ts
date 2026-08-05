/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   TEXT LENGTH VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { requiredValidator } from "./requiredValidator";

import { toTrimmedString } from "../utils/validationHelpers";

/* ===========================================================
   TYPES
=========================================================== */

export interface TextLengthValidatorOptions {
  readonly field: string;
  readonly value: unknown;
  readonly code: string;
  readonly message: string;
  readonly min: number;
  readonly max: number;
}

/* ===========================================================
   TEXT LENGTH VALIDATOR
=========================================================== */

export function textLengthValidator(
  options: TextLengthValidatorOptions,
): ValidationResult {
  const {
    field,
    value,
    code,
    message,
    min,
    max,
  } = options;

  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  const text = toTrimmedString(value);

  if (text.length < min || text.length > max) {
    return {
      valid: false,
      field,
      code,
      message,
      value,
    };
  }

  return {
    valid: true,
    field,
    code: "",
    message: "",
    value: text,
  };
}
