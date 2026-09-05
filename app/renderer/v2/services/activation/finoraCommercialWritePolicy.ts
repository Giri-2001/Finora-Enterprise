/* ===========================================================
   FINORA ENTERPRISE OS™

   COMMERCIAL WRITE POLICY

   MODULE  : Activation / Commercial Access
   LAYER   : Pure Domain Policy
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Evaluate whether a signed FINORA Branch Access Grant
     currently permits a commercial write capability
   - Reuse the authoritative Branch Access evaluator
   - Deny expired REGISTERED writes while preserving the
     separate application-level read-only access policy
   - Deny expired DEMO writes
   - Deny suspended / revoked / malformed / missing access
   - Keep FINORA Business Date completely outside entitlement
     evaluation

   IMPORTANT:

   - Pure policy only.
   - No React.
   - No StorageManager.
   - No localStorage / sessionStorage.
   - No Electron IPC.
   - No Capacitor access.
   - No filesystem.
   - No mutation.
   - No Business Date.
=========================================================== */

import type {
  FinoraBranchAccessGrant,
  FinoraBranchAccessRuntimeState,
  FinoraCommercialWriteCapability,
} from "../../types/activation/finoraBranchAccess.types";

import {
  evaluateFinoraBranchAccess,
} from "./finoraBranchAccessEvaluator";

// ============================================================
// COMMERCIAL WRITE DECISION
// ============================================================

export interface FinoraCommercialWriteAllowedDecision {
  allowed:
    true;

  capability:
    FinoraCommercialWriteCapability;

  state:
    "ACTIVE";

  grant:
    FinoraBranchAccessGrant;
}

export interface FinoraCommercialWriteDeniedDecision {
  allowed:
    false;

  capability:
    FinoraCommercialWriteCapability;

  state:
    Exclude<
      FinoraBranchAccessRuntimeState,
      "ACTIVE"
    >;

  reason:
    string;

  grant?:
    FinoraBranchAccessGrant;
}

export type FinoraCommercialWriteDecision =
  | FinoraCommercialWriteAllowedDecision
  | FinoraCommercialWriteDeniedDecision;

// ============================================================
// SUPPORTED CAPABILITY CHECK
// ============================================================

function isFinoraCommercialWriteCapability(
  value:
    unknown,
): value is FinoraCommercialWriteCapability {

  return (
    value === "CREATE_CUSTOMER" ||
    value === "DISBURSE_LOAN" ||
    value === "POST_COLLECTION"
  );
}

// ============================================================
// EVALUATE COMMERCIAL WRITE
// ============================================================

/**
 * Evaluate one FINORA commercial write capability at the
 * current trusted runtime timestamp supplied by the caller.
 *
 * COMMERCIAL RULE:
 *
 * ACTIVE signed Branch Access
 *   -> commercial write allowed.
 *
 * REGISTERED EXPIRED
 *   -> commercial write denied.
 *   -> historical/reporting reads may remain available through
 *      the separate application read-only policy.
 *
 * DEMO EXPIRED
 *   -> denied.
 *
 * SUSPENDED / REVOKED / NOT_YET_VALID / INVALID / MISSING
 *   -> denied.
 *
 * The active REAL / DEMO storage scope is validated separately
 * by the runtime commercial write guard.
 */
export function evaluateFinoraCommercialWrite(
  grant:
    FinoraBranchAccessGrant |
    undefined,

  capability:
    FinoraCommercialWriteCapability,

  now:
    Date = new Date(),
): FinoraCommercialWriteDecision {

  // ----------------------------------------------------------
  // CAPABILITY VALIDATION
  //
  // TypeScript already constrains normal callers, but this
  // runtime check keeps the policy fail-closed when invoked
  // through untyped JavaScript boundaries.
  // ----------------------------------------------------------

  if (
    !isFinoraCommercialWriteCapability(
      capability,
    )
  ) {
    return {
      allowed:
        false,

      capability,

      state:
        "INVALID",

      reason:
        "FINORA commercial write capability is unsupported.",
    };
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE ACCESS EVALUATION
  // ----------------------------------------------------------

  const accessDecision =
    evaluateFinoraBranchAccess(
      grant,
      now,
    );

  if (!accessDecision.allowed) {
    return {
      allowed:
        false,

      capability,

      state:
        accessDecision.state,

      reason:
        accessDecision.state === "EXPIRED" &&
        accessDecision.grant?.accessType ===
          "REGISTERED"
          ? "FINORA annual registration has expired. Commercial writes are disabled until renewal."
          : accessDecision.reason,

      grant:
        accessDecision.grant,
    };
  }

  // ----------------------------------------------------------
  // ACTIVE
  // ----------------------------------------------------------

  return {
    allowed:
      true,

    capability,

    state:
      "ACTIVE",

    grant:
      accessDecision.grant,
  };
}

// ============================================================
// BOOLEAN CONVENIENCE CHECK
// ============================================================

export function hasFinoraCommercialWriteAccess(
  grant:
    FinoraBranchAccessGrant |
    undefined,

  capability:
    FinoraCommercialWriteCapability,

  now:
    Date = new Date(),
): boolean {

  return evaluateFinoraCommercialWrite(
    grant,
    capability,
    now,
  ).allowed;
}

// ============================================================
// END
// ============================================================