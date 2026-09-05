/* ===========================================================
   FINORA ENTERPRISE OS™

   COMMERCIAL WRITE RUNTIME GUARD

   MODULE  : Activation / Commercial Access
   LAYER   : Runtime Authorization
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Authorize one FINORA commercial write immediately before
     an irreversible commercial workflow begins
   - Reload the current signed Branch Access Grant
   - Re-evaluate commercial validity using actual runtime time
   - Verify authenticated session identity and REAL / DEMO scope
   - Verify the active StorageManager physical mode
   - Verify the active StorageManager data-isolation context
   - Re-check the signed LOCAL / USB storage entitlement
   - Re-load and verify the signed Business / Branch Profile
   - Fail closed on missing, stale, mismatched or invalid state

   IMPORTANT:

   - FINORA Business Date is never an entitlement clock.
   - Every invocation evaluates access using current system time.
   - REGISTERED expiry may remain readable elsewhere, but this
     guard denies commercial writes immediately at validUntil.
   - DEMO access must match the exact Demo ID.
   - CLOUD is not licensed by the current offline entitlement
     model and therefore cannot pass this guard.
   - This service performs authorization checks only.
   - It does not mutate customer, loan or collection data.
=========================================================== */

import type {
  FinoraBranchAccessGrant,
  FinoraCommercialWriteCapability,
} from "../../types/activation/finoraBranchAccess.types";

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../types/business/finoraBusinessProfileControl.types";

import type {
  FinoraEntitlementStorageMode,
} from "../../types/activation/finoraStorageEntitlement.types";

import {
  StorageMode,
} from "../../storage/storage.types";

import {
  storageManager,
} from "../../storage/storageManager";

import {
  getSession,
} from "../../store/authStore";

import {
  hasActiveFinoraStorageEntitlement,
  loadFinoraBusinessProfile,
  loadFinoraBranchAccessGrant,
} from "./activationService";

import {
  evaluateFinoraCommercialWrite,
} from "./finoraCommercialWritePolicy";

// ============================================================
// ALLOWED DECISION
// ============================================================

export interface FinoraCommercialWriteGuardAllowedDecision {
  allowed:
    true;

  capability:
    FinoraCommercialWriteCapability;

  grant:
    FinoraBranchAccessGrant;

  businessProfile:
    FinoraProvisionedBusinessProfileV1;

  storageMode:
    FinoraEntitlementStorageMode;
}

// ============================================================
// DENIED DECISION
// ============================================================

export interface FinoraCommercialWriteGuardDeniedDecision {
  allowed:
    false;

  capability:
    FinoraCommercialWriteCapability;

  reason:
    string;
}

// ============================================================
// DECISION
// ============================================================

export type FinoraCommercialWriteGuardDecision =
  | FinoraCommercialWriteGuardAllowedDecision
  | FinoraCommercialWriteGuardDeniedDecision;

// ============================================================
// DENY
// ============================================================

function denyCommercialWrite(
  capability:
    FinoraCommercialWriteCapability,

  reason:
    string,
): FinoraCommercialWriteGuardDeniedDecision {

  return {
    allowed:
      false,

    capability,

    reason,
  };
}

// ============================================================
// EXACT PROFILE SCOPE
// ============================================================

function businessProfileMatchesScope(
  profile:
    FinoraProvisionedBusinessProfileV1,

  ownerId:
    string,

  businessId:
    string,

  branchId:
    string,
): boolean {

  return (
    profile.ownerId === ownerId &&
    profile.businessId === businessId &&
    profile.branchId === branchId
  );
}

// ============================================================
// ASSERT COMMERCIAL WRITE
// ============================================================

/**
 * Resolve whether the current authenticated FINORA runtime may
 * perform one commercial write capability RIGHT NOW.
 *
 * Callers must invoke this before the first irreversible
 * commercial side effect of their workflow.
 */
export async function authorizeFinoraCommercialWrite(
  capability:
    FinoraCommercialWriteCapability,
): Promise<
  FinoraCommercialWriteGuardDecision
> {

  // ----------------------------------------------------------
  // AUTHENTICATED SESSION
  // ----------------------------------------------------------

  const session =
    getSession();

  if (!session) {
    return denyCommercialWrite(
      capability,
      "An authenticated FINORA session is required for commercial writes.",
    );
  }

  const userId =
    String(
      session.userId ?? "",
    ).trim();

  const ownerId =
    String(
      session.ownerId ?? "",
    ).trim();

  const businessId =
    String(
      session.businessId ?? "",
    ).trim();

  const branchId =
    String(
      session.branchId ?? "",
    ).trim();

  if (
    !userId ||
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    return denyCommercialWrite(
      capability,
      "The authenticated FINORA session does not contain a complete commercial scope.",
    );
  }

  if (
    session.dataContext === "DEMO" &&
    !String(
      session.demoId ?? "",
    ).trim()
  ) {
    return denyCommercialWrite(
      capability,
      "The authenticated FINORA Demo session does not contain a valid Demo ID.",
    );
  }

  if (
    session.dataContext !== "REAL" &&
    session.dataContext !== "DEMO"
  ) {
    return denyCommercialWrite(
      capability,
      "The authenticated FINORA data context is invalid.",
    );
  }

  // ----------------------------------------------------------
  // FRESH SIGNED BRANCH ACCESS GRANT
  // ----------------------------------------------------------

  const accessGrantResult =
    await loadFinoraBranchAccessGrant(
      userId,
      ownerId,
      businessId,
      branchId,
    );

  if (
    !accessGrantResult.success ||
    !accessGrantResult.data
  ) {
    return denyCommercialWrite(
      capability,
      accessGrantResult.error ??
        "A current signed FINORA Branch Access Grant is required for commercial writes.",
    );
  }

  const accessGrant =
    accessGrantResult.data;

  // ----------------------------------------------------------
  // EXACT SESSION / GRANT IDENTITY
  // ----------------------------------------------------------

  if (
    accessGrant.userId !== userId ||
    accessGrant.ownerId !== ownerId ||
    accessGrant.businessId !== businessId ||
    accessGrant.branchId !== branchId
  ) {
    return denyCommercialWrite(
      capability,
      "The authenticated FINORA session does not match its signed Branch Access Grant.",
    );
  }

  // ----------------------------------------------------------
  // EXACT REAL / DEMO GRANT CONTEXT
  // ----------------------------------------------------------

  if (session.dataContext === "DEMO") {

    if (
      accessGrant.accessType !== "DEMO" ||
      accessGrant.demoId !== session.demoId
    ) {
      return denyCommercialWrite(
        capability,
        "The authenticated FINORA Demo session does not match its signed Demo access grant.",
      );
    }

  } else {

    if (
      accessGrant.accessType !== "REGISTERED" ||
      session.demoId !== undefined
    ) {
      return denyCommercialWrite(
        capability,
        "The authenticated FINORA REAL session does not match a REGISTERED access grant.",
      );
    }
  }

  // ----------------------------------------------------------
  // CURRENT-TIME COMMERCIAL ACCESS
  //
  // This is intentionally evaluated on every invocation.
  // An application reload is not required for expiry to take
  // effect.
  // ----------------------------------------------------------

  const commercialDecision =
    evaluateFinoraCommercialWrite(
      accessGrant,
      capability,
      new Date(),
    );

  if (!commercialDecision.allowed) {
    return denyCommercialWrite(
      capability,
      commercialDecision.reason,
    );
  }

  // ----------------------------------------------------------
  // ACTIVE PHYSICAL STORAGE MODE
  // ----------------------------------------------------------

  const activeStorageMode =
    storageManager.getStorageMode();

  if (
    activeStorageMode !== StorageMode.LOCAL &&
    activeStorageMode !== StorageMode.USB
  ) {
    return denyCommercialWrite(
      capability,
      "Commercial writes require an entitled FINORA LOCAL or USB storage mode.",
    );
  }

  const entitlementStorageMode:
    FinoraEntitlementStorageMode =
      activeStorageMode === StorageMode.USB
        ? "USB"
        : "LOCAL";

  if (
    accessGrant.storageMode !==
      entitlementStorageMode
  ) {
    return denyCommercialWrite(
      capability,
      `FINORA ${accessGrant.accessType} access is licensed for ${accessGrant.storageMode} storage, but the active runtime is using ${entitlementStorageMode}.`,
    );
  }

  // ----------------------------------------------------------
  // ACTIVE STORAGE DATA CONTEXT
  // ----------------------------------------------------------

  const storageConfiguration =
    storageManager.getConfiguration();

  if (
    String(
      storageConfiguration.dataContext,
    ) !== session.dataContext
  ) {
    return denyCommercialWrite(
      capability,
      "The active FINORA storage data context does not match the authenticated session.",
    );
  }

  // ----------------------------------------------------------
  // ACTIVE STORAGE OWNER / DEMO SCOPE
  // ----------------------------------------------------------

  if (session.dataContext === "REAL") {

    if (
      storageConfiguration.ownerId !==
        ownerId ||
      storageConfiguration.demoId !==
        undefined
    ) {
      return denyCommercialWrite(
        capability,
        "The active FINORA REAL storage scope does not match the authenticated Owner.",
      );
    }

  } else {

    if (
      storageConfiguration.demoId !==
        session.demoId
    ) {
      return denyCommercialWrite(
        capability,
        "The active FINORA Demo storage scope does not match the authenticated Demo ID.",
      );
    }
  }

  // ----------------------------------------------------------
  // FRESH STORAGE ENTITLEMENT
  // ----------------------------------------------------------

  const entitlementResult =
    await hasActiveFinoraStorageEntitlement(
      userId,
      ownerId,
      businessId,
      branchId,
      entitlementStorageMode,
    );

  if (
    !entitlementResult.success ||
    entitlementResult.data !== true
  ) {
    return denyCommercialWrite(
      capability,
      entitlementResult.error ??
        `No active FINORA ${entitlementStorageMode} storage entitlement is available for this commercial write.`,
    );
  }

  // ----------------------------------------------------------
  // FRESH SIGNED BUSINESS / BRANCH PROFILE
  // ----------------------------------------------------------

  const businessProfileResult =
    await loadFinoraBusinessProfile(
      ownerId,
      businessId,
      branchId,
    );

  if (
    !businessProfileResult.success ||
    !businessProfileResult.data
  ) {
    return denyCommercialWrite(
      capability,
      businessProfileResult.error ??
        "The signed FINORA Business Profile is required for commercial writes.",
    );
  }

  const businessProfile =
    businessProfileResult.data;

  if (
    !businessProfileMatchesScope(
      businessProfile,
      ownerId,
      businessId,
      branchId,
    )
  ) {
    return denyCommercialWrite(
      capability,
      "The signed FINORA Business Profile does not match the authenticated commercial scope.",
    );
  }

  // ----------------------------------------------------------
  // ALLOW
  // ----------------------------------------------------------

  return {
    allowed:
      true,

    capability,

    grant:
      accessGrant,

    businessProfile,

    storageMode:
      entitlementStorageMode,
  };
}

// ============================================================
// THROWING CONVENIENCE BOUNDARY
// ============================================================

/**
 * Convenience helper for workflows whose existing error model
 * already uses exceptions.
 */
export async function assertFinoraCommercialWriteAuthorized(
  capability:
    FinoraCommercialWriteCapability,
): Promise<void> {

  const decision =
    await authorizeFinoraCommercialWrite(
      capability,
    );

  if (!decision.allowed) {
    throw new Error(
      decision.reason,
    );
  }
}

// ============================================================
// END
// ============================================================