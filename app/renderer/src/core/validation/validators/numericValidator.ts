/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   NUMERIC VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import {
  isNumeric,
  toNumber,
} from "../utils/validationHelpers";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   TYPES
=========================================================== */

export interface NumericValidatorOptions {
  readonly field: string;

  readonly value: unknown;

  readonly code: string;

  readonly message: string;

  readonly min: number;

  readonly max: number;
}

/* ===========================================================
   NUMERIC VALIDATOR
=========================================================== */

/**
 * Shared numeric validation for finance fields.
 */
export function numericValidator(
  options: NumericValidatorOptions,
): ValidationResult {
  const {
    field,
    value,
    code,
    message,
    min,
    max,
  } = options;

  const requiredResult = requiredValidator(
    field,
    value,
  );

  if (!requiredResult.valid) {
    return requiredResult;
  }

  if (!isNumeric(value)) {
    return {
      valid: false,
      field,
      code,
      message,
      value,
    };
  }

  const numericValue = toNumber(value)!;

  if (
    numericValue < min ||
    numericValue > max
  ) {
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
    value: numericValue,
  };
}
