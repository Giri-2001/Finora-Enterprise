/* ===========================================================
   FINORA ENTERPRISE OS™
   Enterprise Validation Engine

   VALIDATION RESULT MODEL
=========================================================== */

/* ===========================================================
   VALIDATION RESULT
=========================================================== */

export interface ValidationResult {
  /**
   * Indicates whether validation passed.
   */
  readonly valid: boolean;

  /**
   * Name of the validated field.
   * Example: "mobile", "loanAmount"
   */
  readonly field: string;

  /**
   * Enterprise validation code.
   * Example: INVALID_MOBILE
   */
  readonly code: string;

  /**
   * Human-readable validation message.
   */
  readonly message: string;

  /**
   * Original value that was validated.
   */
  readonly value?: unknown;
}
