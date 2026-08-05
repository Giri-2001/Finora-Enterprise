/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   LOAN AMOUNT VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { VALIDATION_MESSAGES } from "../constants/validationMessages";

import { VALIDATION_LIMITS } from "../constants/validationPatterns";

import {
  isNumeric,
  toNumber,
} from "../utils/validationHelpers";

import { requiredValidator } from "./requiredValidator";

/* ===========================================================
   LOAN AMOUNT VALIDATOR
=========================================================== */

/**
 * Validates a loan amount.
 */
export function loanAmountValidator(
  field: string,
  value: unknown,
): ValidationResult {
  const requiredResult = requiredValidator(field, value);

  if (!requiredResult.valid) {
    return requiredResult;
  }

  if (!isNumeric(value)) {
    return {
      valid: false,
      field,
      code: "INVALID_LOAN_AMOUNT",
      message: VALIDATION_MESSAGES.INVALID_LOAN_AMOUNT,
      value,
    };
  }

  const amount = toNumber(value)!;

  if (
    amount < VALIDATION_LIMITS.MIN_LOAN_AMOUNT ||
    amount > VALIDATION_LIMITS.MAX_LOAN_AMOUNT
  ) {
    return {
      valid: false,
      field,
      code: "INVALID_LOAN_AMOUNT",
      message: VALIDATION_MESSAGES.INVALID_LOAN_AMOUNT,
      value,
    };
  }

  return {
    valid: true,
    field,
    code: "",
    message: "",
    value: amount,
  };
}
