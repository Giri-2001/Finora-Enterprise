/* ===========================================================
   FINORA ENTERPRISE OS™

   BRANCH ACCESS AUTHORITY SERVICE

   MODULE  : Electron Control Plane
   LAYER   : Main-Process Runtime Authorization
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve current REGISTERED / DEMO Branch Access authority
   - Observe installation-local clock high-water before access
     validity evaluation
   - Load the persisted Branch Access Grant from the trusted
     Control Store
   - Deny missing / malformed / suspended / revoked /
     not-yet-valid / expired access
   - Preserve validUntil as an exclusive expiry boundary
   - Return one authoritative runtime decision to trusted
     main-process callers / IPC adapters

   SECURITY:

   - Caller supplies branch identity only.
   - Caller does not supply current time.
   - Caller does not supply installationId.
   - Caller does not supply a Branch Access Grant.
   - Caller does not supply validFrom / validUntil.
   - FINORA Business Date is not an entitlement clock.
   - Clock rollback / high-water failure is fail-closed.
   - No renderer.
   - No IPC.
   - No localStorage / sessionStorage.
   - No StorageManager.
   - No cross-process CAS guarantee.

   NOTE:

   The encrypted clock high-water record protects against wall
   clock rollback while that persisted record remains intact.
   This does not claim resistance to arbitrary replacement with
   an older valid historical encrypted high-water file.
=========================================================== */

import {
  observeFinoraAuthoritativeWallClock,
} from "./finoraClockHighWaterAuthorityService.js";

import type {
  FinoraClockHighWaterAuthorityErrorCode,
} from "./finoraClockHighWaterAuthorityService.js";

import {
  findFinoraBranchAccessGrant,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchAccessGrant,
} from "./finoraControlStore.js";

// ============================================================
// REQUEST
// ============================================================

export interface FinoraBranchAccessAuthorityRequest {
  userId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

// ============================================================
// RUNTIME STATE
// ============================================================

export type FinoraBranchAccessAuthorityState =
  | "MISSING"
  | "INVALID"
  | "REVOKED"
  | "SUSPENDED"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "ACTIVE";

// ============================================================
// DECISION
// ============================================================

export interface FinoraBranchAccessAuthorityDecision {
  allowed:
    boolean;

  state:
    FinoraBranchAccessAuthorityState;

  reason:
    string;

  observedAt:
    string;

  grant?:
    FinoraControlBranchAccessGrant;
}

// ============================================================
// RESULT
// ============================================================

export type FinoraBranchAccessAuthorityErrorCode =
  | "INVALID_REQUEST"
  | "CLOCK_AUTHORITY_FAILED"
  | "CONTROL_STORE_FAILED";

export type FinoraBranchAccessAuthorityResult =
  | {
      success:
        true;

      data:
        FinoraBranchAccessAuthorityDecision;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchAccessAuthorityErrorCode;

      error:
        string;

      clockErrorCode?:
        FinoraClockHighWaterAuthorityErrorCode;
    };

// ============================================================
// INTERNAL HELPERS
// ============================================================

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function failure(
  errorCode:
    FinoraBranchAccessAuthorityErrorCode,
  error:
    string,
  clockErrorCode?:
    FinoraClockHighWaterAuthorityErrorCode,
): FinoraBranchAccessAuthorityResult {
  return {
    success:
      false,

    errorCode,

    error,

    clockErrorCode,
  };
}

function decision(
  observedAt:
    string,
  state:
    FinoraBranchAccessAuthorityState,
  allowed:
    boolean,
  reason:
    string,
  grant?:
    FinoraControlBranchAccessGrant,
): FinoraBranchAccessAuthorityResult {
  return {
    success:
      true,

    data: {
      allowed,

      state,

      reason,

      observedAt,

      grant,
    },
  };
}

// ============================================================
// REQUEST VALIDATION
// ============================================================

function validateRequest(
  request:
    FinoraBranchAccessAuthorityRequest,
): string | undefined {
  if (
    !isNonEmptyString(
      request.userId,
    ) ||
    !isNonEmptyString(
      request.ownerId,
    ) ||
    !isNonEmptyString(
      request.businessId,
    ) ||
    !isNonEmptyString(
      request.branchId,
    )
  ) {
    return "User ID, Owner ID, Business ID and Branch ID are required for FINORA Branch Access authorization.";
  }

  return undefined;
}

// ============================================================
// AUTHORITATIVE ACCESS
// ============================================================

export async function evaluateFinoraAuthoritativeBranchAccess(
  request:
    FinoraBranchAccessAuthorityRequest,
): Promise<
  FinoraBranchAccessAuthorityResult
> {
  const requestError =
    validateRequest(
      request,
    );

  if (requestError) {
    return failure(
      "INVALID_REQUEST",
      requestError,
    );
  }

  // ----------------------------------------------------------
  // AUTHORITATIVE WALL CLOCK
  //
  // No renderer-provided or caller-provided current time exists
  // on this production authorization API.
  // ----------------------------------------------------------

  const clockResult =
    await observeFinoraAuthoritativeWallClock();

  if (!clockResult.success) {
    return failure(
      "CLOCK_AUTHORITY_FAILED",
      clockResult.error,
      clockResult.errorCode,
    );
  }

  const observedAt =
    clockResult.data.observedAt;

  const currentTime =
    Date.parse(
      observedAt,
    );

  if (!Number.isFinite(currentTime)) {
    return failure(
      "CLOCK_AUTHORITY_FAILED",
      "FINORA authoritative wall-clock observation is invalid.",
    );
  }

  // ----------------------------------------------------------
  // TRUSTED CONTROL STORE
  //
  // readFinoraControlStore() owns persistence schema validation.
  // findFinoraBranchAccessGrant() returns only the matching
  // persisted grant for this exact branch identity.
  // ----------------------------------------------------------

  const grantResult =
    await findFinoraBranchAccessGrant(
      request.userId,
      request.ownerId,
      request.businessId,
      request.branchId,
    );

  if (!grantResult.success) {
    return failure(
      "CONTROL_STORE_FAILED",
      grantResult.error ??
        "Unable to load FINORA Branch Access Grant.",
    );
  }

  const grant =
    grantResult.data;

  if (!grant) {
    return decision(
      observedAt,
      "MISSING",
      false,
      "FINORA registration or Demo access is required.",
    );
  }

  // ----------------------------------------------------------
  // EXACT IDENTITY DEFENCE
  // ----------------------------------------------------------

  if (
    grant.userId !==
      request.userId ||
    grant.ownerId !==
      request.ownerId ||
    grant.businessId !==
      request.businessId ||
    grant.branchId !==
      request.branchId
  ) {
    return decision(
      observedAt,
      "INVALID",
      false,
      "The persisted FINORA Branch Access Grant does not match the requested branch identity.",
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
    return decision(
      observedAt,
      "REVOKED",
      false,
      "FINORA access has been revoked.",
      grant,
    );
  }

  if (
    grant.administrativeStatus ===
      "SUSPENDED"
  ) {
    return decision(
      observedAt,
      "SUSPENDED",
      false,
      "FINORA access is currently suspended.",
      grant,
    );
  }

  if (
    grant.administrativeStatus !==
      "ACTIVE"
  ) {
    return decision(
      observedAt,
      "INVALID",
      false,
      "FINORA Branch Access administrative status is invalid.",
      grant,
    );
  }

  // ----------------------------------------------------------
  // VALIDITY
  // ----------------------------------------------------------

  const validFrom =
    Date.parse(
      grant.validity.validFrom,
    );

  const validUntil =
    Date.parse(
      grant.validity.validUntil,
    );

  if (
    !Number.isFinite(
      validFrom,
    ) ||
    !Number.isFinite(
      validUntil,
    ) ||
    validUntil <=
      validFrom
  ) {
    return decision(
      observedAt,
      "INVALID",
      false,
      "FINORA Branch Access validity timestamps are invalid.",
      grant,
    );
  }

  if (
    currentTime <
      validFrom
  ) {
    return decision(
      observedAt,
      "NOT_YET_VALID",
      false,
      "FINORA access validity has not started yet.",
      grant,
    );
  }

  // ----------------------------------------------------------
  // EXPIRED
  //
  // validUntil is exclusive.
  // At exactly validUntil the grant is expired.
  // ----------------------------------------------------------

  if (
    currentTime >=
      validUntil
  ) {
    return decision(
      observedAt,
      "EXPIRED",
      false,
      grant.accessType ===
        "DEMO"
        ? "FINORA Demo access has expired."
        : "FINORA annual registration has expired.",
      grant,
    );
  }

  // ----------------------------------------------------------
  // ACTIVE
  // ----------------------------------------------------------

  return decision(
    observedAt,
    "ACTIVE",
    true,
    "FINORA Branch Access is active.",
    grant,
  );
}

// ============================================================
// END
// ============================================================