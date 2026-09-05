// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// BRANCH ACCESS EVALUATOR
//
// RESPONSIBILITY:
//
// - Evaluate REGISTERED / DEMO access at runtime
// - Generate exact 365-day REGISTERED validity windows
// - Validate configurable DEMO validity windows
// - Automatically deny expired grants
// - Fail closed on malformed access records
// - Keep access validity independent from FINORA Business Date
//
// TIME MODEL:
//
// validFrom  = inclusive
// validUntil = exclusive
//
// Example:
//
// validFrom  : 2026-09-05T10:00:00.000Z
// validUntil : 2027-09-05T10:00:00.000Z
//
// At exactly validUntil:
//   ACCESS = EXPIRED
//
// IMPORTANT:
//
// - Pure domain/service logic.
// - No localStorage.
// - No StorageManager.
// - No filesystem.
// - No Electron IPC.
// - No React.
// - No Business Date.
// - No wallet.
// - No pricing.
// - No mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraBranchAccessDecision,
  FinoraBranchAccessGrant,
  FinoraBranchAccessValidity,
} from "../../types/activation/finoraBranchAccess.types";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_REGISTERED_ACCESS_DAYS =
  365 as const;

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

export const FINORA_REGISTERED_ACCESS_DURATION_MS =
  FINORA_REGISTERED_ACCESS_DAYS *
  MILLISECONDS_PER_DAY;

// ============================================================
// INTERNAL HELPERS
// ============================================================

function isNonEmptyString(
  value: unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function parseTimestamp(
  value: unknown,
): number | undefined {

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function invalidDecision(
  reason: string,
  grant?:
    FinoraBranchAccessGrant,
): FinoraBranchAccessDecision {

  return {
    allowed:
      false,

    state:
      "INVALID",

    reason,

    grant,
  };
}

function validateCommonGrant(
  grant:
    FinoraBranchAccessGrant,
): string | undefined {

  if (
    grant.schemaVersion !==
      1
  ) {
    return "FINORA access grant schema is unsupported.";
  }

  if (
    !isNonEmptyString(
      grant.grantId,
    ) ||
    !isNonEmptyString(
      grant.userId,
    ) ||
    !isNonEmptyString(
      grant.ownerId,
    ) ||
    !isNonEmptyString(
      grant.businessId,
    ) ||
    !isNonEmptyString(
      grant.branchId,
    )
  ) {
    return "FINORA access grant identity is incomplete.";
  }
  if (
    grant.storageMode !==
      "LOCAL" &&
    grant.storageMode !==
      "USB"
  ) {
    return "FINORA access grant storage mode must be LOCAL or USB.";
  }

  if (
    grant.administrativeStatus !==
      "ACTIVE" &&
    grant.administrativeStatus !==
      "SUSPENDED" &&
    grant.administrativeStatus !==
      "REVOKED"
  ) {
    return "FINORA access grant administrative status is invalid.";
  }

  if (
    !parseTimestamp(
      grant.createdAt,
    ) ||
    !parseTimestamp(
      grant.updatedAt,
    )
  ) {
    return "FINORA access grant audit timestamps are invalid.";
  }

  return undefined;
}

// ============================================================
// REGISTERED VALIDITY
// ============================================================

/**
 * Create the exact FINORA annual registration validity window.
 *
 * This is 365 x 24 hours from the activation instant.
 *
 * Business Date is intentionally not accepted.
 */
export function createFinoraRegisteredAccessValidity(
  activatedAt:
    string,
): FinoraBranchAccessValidity {

  const start =
    parseTimestamp(
      activatedAt,
    );

  if (start === undefined) {
    throw new Error(
      "A valid FINORA registration activation timestamp is required.",
    );
  }

  const end =
    start +
    FINORA_REGISTERED_ACCESS_DURATION_MS;

  return {
    validFrom:
      new Date(
        start,
      ).toISOString(),

    validUntil:
      new Date(
        end,
      ).toISOString(),
  };
}

// ============================================================
// DEMO VALIDITY
// ============================================================

/**
 * Create an administrator-selected Demo validity window.
 *
 * No fixed 2-day / 7-day / 10-day duration exists here.
 */
export function createFinoraDemoAccessValidity(
  validFrom:
    string,

  validUntil:
    string,
): FinoraBranchAccessValidity {

  const start =
    parseTimestamp(
      validFrom,
    );

  const end =
    parseTimestamp(
      validUntil,
    );

  if (
    start === undefined ||
    end === undefined
  ) {
    throw new Error(
      "Valid FINORA Demo start and expiry timestamps are required.",
    );
  }

  if (end <= start) {
    throw new Error(
      "FINORA Demo expiry must be later than its start timestamp.",
    );
  }

  return {
    validFrom:
      new Date(
        start,
      ).toISOString(),

    validUntil:
      new Date(
        end,
      ).toISOString(),
  };
}

// ============================================================
// GRANT VALIDATION
// ============================================================

export interface FinoraBranchAccessGrantValidation {

  valid:
    boolean;

  error?:
    string;
}

export function validateFinoraBranchAccessGrant(
  grant:
    FinoraBranchAccessGrant,
): FinoraBranchAccessGrantValidation {

  const commonError =
    validateCommonGrant(
      grant,
    );

  if (commonError) {
    return {
      valid:
        false,

      error:
        commonError,
    };
  }

  const validFrom =
    parseTimestamp(
      grant.validity.validFrom,
    );

  const validUntil =
    parseTimestamp(
      grant.validity.validUntil,
    );

  if (
    validFrom === undefined ||
    validUntil === undefined
  ) {
    return {
      valid:
        false,

      error:
        "FINORA access validity timestamps are invalid.",
    };
  }

  if (
    validUntil <=
      validFrom
  ) {
    return {
      valid:
        false,

      error:
        "FINORA access expiry must be later than its start timestamp.",
    };
  }


  // ----------------------------------------------------------
  // REGISTERED
  // ----------------------------------------------------------

  if (
    grant.accessType ===
      "REGISTERED"
  ) {

    if (
      validUntil -
        validFrom !==
      FINORA_REGISTERED_ACCESS_DURATION_MS
    ) {
      return {
        valid:
          false,

        error:
          "FINORA registered access must have exactly 365 days of validity.",
      };
    }

    if (
      !Number.isSafeInteger(
        grant.registrationCycle,
      ) ||
      grant.registrationCycle <=
        0
    ) {
      return {
        valid:
          false,

        error:
          "FINORA registration cycle must be a positive integer.",
      };
    }

    const payment =
      grant.registrationPayment;

    if (
      !Number.isFinite(
        payment.amount,
      ) ||
      payment.amount <=
        0 ||
      !isNonEmptyString(
        payment.currency,
      ) ||
      parseTimestamp(
        payment.paidAt,
      ) === undefined ||
      payment.refundable !==
        false
    ) {
      return {
        valid:
          false,

        error:
          "FINORA registration payment metadata is invalid.",
      };
    }

    return {
      valid:
        true,
    };
  }


  // ----------------------------------------------------------
  // DEMO
  // ----------------------------------------------------------

  if (
    grant.accessType ===
      "DEMO"
  ) {

    if (
      !isNonEmptyString(
        grant.demoId,
      )
    ) {
      return {
        valid:
          false,

        error:
          "FINORA Demo ID is required.",
      };
    }

    return {
      valid:
        true,
    };
  }


  return {
    valid:
      false,

    error:
      "FINORA access type is unsupported.",
  };
}

// ============================================================
// RUNTIME ACCESS EVALUATOR
// ============================================================

/**
 * Evaluate whether FINORA access is valid RIGHT NOW.
 *
 * The supplied Date represents trusted/system runtime time.
 *
 * FINORA Business Date MUST NOT be passed here.
 */
export function evaluateFinoraBranchAccess(
  grant:
    FinoraBranchAccessGrant |
    undefined,

  now:
    Date = new Date(),
): FinoraBranchAccessDecision {

  // ----------------------------------------------------------
  // MISSING
  // ----------------------------------------------------------

  if (!grant) {
    return {
      allowed:
        false,

      state:
        "MISSING",

      reason:
        "FINORA registration or Demo access is required.",
    };
  }


  // ----------------------------------------------------------
  // FAIL-CLOSED VALIDATION
  // ----------------------------------------------------------

  const validation =
    validateFinoraBranchAccessGrant(
      grant,
    );

  if (!validation.valid) {
    return invalidDecision(
      validation.error ??
        "FINORA access grant is invalid.",
      grant,
    );
  }


  // ----------------------------------------------------------
  // ADMINISTRATIVE RESTRICTIONS
  // ----------------------------------------------------------

  if (
    grant.administrativeStatus ===
      "REVOKED"
  ) {
    return {
      allowed:
        false,

      state:
        "REVOKED",

      reason:
        "FINORA access has been revoked.",

      grant,
    };
  }

  if (
    grant.administrativeStatus ===
      "SUSPENDED"
  ) {
    return {
      allowed:
        false,

      state:
        "SUSPENDED",

      reason:
        "FINORA access is currently suspended.",

      grant,
    };
  }


  // ----------------------------------------------------------
  // CURRENT TIME
  // ----------------------------------------------------------

  const currentTime =
    now.getTime();

  if (!Number.isFinite(currentTime)) {
    return invalidDecision(
      "FINORA runtime clock is invalid.",
      grant,
    );
  }

  const validFrom =
    Date.parse(
      grant.validity.validFrom,
    );

  const validUntil =
    Date.parse(
      grant.validity.validUntil,
    );


  // ----------------------------------------------------------
  // NOT YET VALID
  // ----------------------------------------------------------

  if (
    currentTime <
      validFrom
  ) {
    return {
      allowed:
        false,

      state:
        "NOT_YET_VALID",

      reason:
        "FINORA access validity has not started yet.",

      grant,
    };
  }


  // ----------------------------------------------------------
  // EXPIRED
  //
  // validUntil is EXCLUSIVE.
  //
  // At exactly validUntil:
  // ACCESS = EXPIRED
  // ----------------------------------------------------------

  if (
    currentTime >=
      validUntil
  ) {
    return {
      allowed:
        false,

      state:
        "EXPIRED",

      reason:
        grant.accessType ===
          "DEMO"
          ? "FINORA Demo access has expired."
          : "FINORA annual registration has expired.",

      grant,
    };
  }


  // ----------------------------------------------------------
  // ACTIVE
  // ----------------------------------------------------------

  return {
    allowed:
      true,

    state:
      "ACTIVE",

    grant,
  };
}

// ============================================================
// SIMPLE BOOLEAN CHECK
// ============================================================

export function hasActiveFinoraBranchAccess(
  grant:
    FinoraBranchAccessGrant |
    undefined,

  now:
    Date = new Date(),
): boolean {

  return evaluateFinoraBranchAccess(
    grant,
    now,
  ).allowed;
}

// ============================================================
// END
// ============================================================