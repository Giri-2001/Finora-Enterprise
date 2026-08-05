/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   RANGE VALIDATOR
=========================================================== */

import type { ValidationResult } from "../models/ValidationResult";

import { numericValidator } from "./numericValidator";

/* ===========================================================
   RANGE VALIDATOR
=========================================================== */

export interface RangeValidatorOptions {
  readonly field: string;
  readonly value: unknown;
  readonly code: string;
  readonly message: string;
  readonly min: number;
  readonly max: number;
}

export function rangeValidator(
  options: RangeValidatorOptions,
): ValidationResult {
  return numericValidator(options);
}
