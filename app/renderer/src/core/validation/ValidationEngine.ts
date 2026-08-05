/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   VALIDATION ENGINE
=========================================================== */

import type { ValidationResult } from "./models/ValidationResult";

/* ===========================================================
   TYPES
=========================================================== */

export type Validator<T = unknown> = (
  value: T
) => ValidationResult;

/* ===========================================================
   VALIDATION ENGINE
=========================================================== */

/**
 * Executes validators sequentially.
 * Stops on the first validation failure.
 */
export class ValidationEngine {
  public static validate<T>(
    value: T,
    validators: readonly Validator<T>[],
  ): ValidationResult {
    for (const validator of validators) {
      const result = validator(value);

      if (!result.valid) {
        return result;
      }
    }

    return {
      valid: true,
      field: "",
      code: "",
      message: "",
      value,
    };
  }

  /**
   * Executes all validators.
   * Returns every validation result.
   */
  public static validateAll<T>(
    value: T,
    validators: readonly Validator<T>[],
  ): ValidationResult[] {
    return validators.map((validator) => validator(value));
  }

  /**
   * Returns only failed validations.
   */
  public static validateErrors<T>(
    value: T,
    validators: readonly Validator<T>[],
  ): ValidationResult[] {
    return this.validateAll(value, validators).filter(
      (result) => !result.valid,
    );
  }
}
