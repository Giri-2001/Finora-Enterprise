import { isFinoraAndroidWallet } from "../wallet/finoraAndroidWalletBridge";
import { getFinoraAndroidPricing } from "../wallet/finoraAndroidWalletReads";
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
  getFinoraServerWalletBridge,
} from "../wallet/finoraServerWalletBridge";
import {
  getSession,
} from "../../store/authStore";

import {
  validateFinoraServerGuardSession,
} from "../auth/finoraServerReceptionGuardLifecycle";

import {
  evaluateAuthoritativeFinoraBranchAccess,
  hasActiveFinoraStorageEntitlement,
  loadFinoraBusinessProfile,
} from "./activationService";

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

export interface FinoraCommercialWriteGuardServerAllowedDecision {
  allowed: true;
  capability: FinoraCommercialWriteCapability;
  authority: "SERVER";
  storageMode: "USB";
}

export type FinoraCommercialWriteGuardDecision =
  | FinoraCommercialWriteGuardAllowedDecision
  | FinoraCommercialWriteGuardServerAllowedDecision
  | FinoraCommercialWriteGuardDeniedDecision;

// ============================================================
// CAPABILITY VALIDATION
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
  // CAPABILITY
  // ----------------------------------------------------------

  if (
    !isFinoraCommercialWriteCapability(
      capability,
    )
  ) {
    return denyCommercialWrite(
      capability,
      "The requested FINORA commercial write capability is invalid.",
    );
  }

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
  // AUTHORITATIVE BRANCH ACCESS
  //
  // This is intentionally evaluated on every invocation.
  // Expiry takes effect without an application reload.
  //
  // Renderer supplies identity only. Current-time evaluation and
  // persisted clock rollback defense remain in Electron main.
  // ----------------------------------------------------------

  // FINORA_P1_719F_SERVER_COMMERCIAL_AUTHORITY
  // A server-shaped session ID is never sufficient by itself.
  // Revalidate with Electron Main for every commercial operation.
  // Legacy and DEMO sessions retain the signed-grant checks below.
  if (/^[a-f0-9]{64}$/.test(session.sessionId ?? "")) {
    const verified = await validateFinoraServerGuardSession(
      session.sessionId,
    );

    if (
      !verified.success ||
      verified.data.sessionId !== session.sessionId ||
      verified.data.userId !== userId ||
      verified.data.username !== session.username ||
      verified.data.ownerId !== ownerId ||
      verified.data.businessId !== businessId ||
      verified.data.branchId !== branchId ||
      verified.data.role !== "OWNER" ||
      session.role !== "OWNER" ||
      verified.data.dataContext !== "REAL" ||
      session.dataContext !== "REAL" ||
      verified.data.storageMode !== "USB" ||
      session.demoId !== undefined
    ) {
      return denyCommercialWrite(
        capability,
        "FINORA server commercial session verification failed.",
      );
    }

    if (storageManager.getStorageMode() !== StorageMode.USB) {
      return denyCommercialWrite(
        capability,
        "FINORA commercial operation requires authorized USB storage.",
      );
    }

    const storage = storageManager.getConfiguration();

    if (
      storage.dataContext !== "REAL" ||
      storage.ownerId !== ownerId ||
      storage.demoId !== undefined
    ) {
      return denyCommercialWrite(
        capability,
        "FINORA commercial storage Owner scope mismatch.",
      );
    }

    // Server pricing verifies the exact branch and active subscription.
    // Wallet Entry Gate independently checks the fee and live balance.
    // FINORA_P1_723R_ANDROID_PRICING
    // Use native authenticated PostgreSQL pricing on Android.
    const android = isFinoraAndroidWallet();
    const wallet = android ? null : getFinoraServerWalletBridge();
    const pricing = android
      ? await getFinoraAndroidPricing()
      : wallet ? await wallet.pricing() : null;

    if (
      !pricing?.success ||
      pricing.data.source !== "FINORA_POSTGRESQL_PRICING" ||
      pricing.data.branchId !== branchId ||
      !Array.isArray(pricing.data.plans) ||
      pricing.data.plans.length !== 4
    ) {
      return denyCommercialWrite(
        capability,
        "Authoritative FINORA branch pricing is unavailable.",
      );
    }

    const subscription = pricing.data.currentSubscription;

    if (!subscription || subscription.status !== "ACTIVE") {
      return denyCommercialWrite(
        capability,
        "An ACTIVE FINORA server subscription is required.",
      );
    }

    const start = Date.parse(subscription.startsAt);
    const expiry = Date.parse(subscription.expiresAt);
    const serverNow = Date.parse(subscription.serverNow);

    const months = subscription.selectedPlanMonths ??
      Number(
        /^SUBSCRIPTION_(1|3|6|12)_MONTHS?$/.exec(
          subscription.planCode,
        )?.[1] ?? 0,
      );

    if (
      ![1, 3, 6, 12].includes(months) ||
      !Number.isFinite(start) ||
      !Number.isFinite(expiry) ||
      !Number.isFinite(serverNow) ||
      start > serverNow ||
      serverNow >= expiry
    ) {
      return denyCommercialWrite(
        capability,
        "FINORA server subscription validity check failed.",
      );
    }

    return {
      allowed: true,
      capability,
      authority: "SERVER",
      storageMode: "USB",
    };
  }

  const accessAuthorityResult =
    await evaluateAuthoritativeFinoraBranchAccess(
      userId,
      ownerId,
      businessId,
      branchId,
    );

  if (
    !accessAuthorityResult.success ||
    !accessAuthorityResult.data
  ) {
    return denyCommercialWrite(
      capability,
      accessAuthorityResult.error ??
        "Authoritative FINORA Branch Access evaluation is required for commercial writes.",
    );
  }

  const accessDecision =
    accessAuthorityResult.data;

  const accessGrant =
    accessDecision.grant;

  if (!accessGrant) {
    return denyCommercialWrite(
      capability,
      accessDecision.reason,
    );
  }

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
  // ----------------------------------------------------------

  // P1-667C: Fresh server subscription, scoped to the signed
  // authenticated REAL branch. DEMO follows existing grant rules.
  let serverSubscriptionActive = false;

  if (session.dataContext === "REAL") {
    try {
      const bridge = getFinoraServerWalletBridge();
      const pricing = bridge ? await bridge.pricing() : null;

      if (
        pricing?.success === true &&
        pricing.data.source === "FINORA_POSTGRESQL_PRICING" &&
        pricing.data.branchId === branchId &&
        Array.isArray(pricing.data.plans) &&
        pricing.data.plans.length === 4
      ) {
        const subscription = pricing.data.currentSubscription;

        if (subscription && subscription.status === "ACTIVE") {
          const start = Date.parse(subscription.startsAt);
          const expiry = Date.parse(subscription.expiresAt);
          const now = Date.parse(subscription.serverNow);

          const months = subscription.selectedPlanMonths ??
            Number(
              /^SUBSCRIPTION_(1|3|6|12)_MONTHS?$/.exec(
                subscription.planCode
              )?.[1] ?? 0
            );

          serverSubscriptionActive =
            [1, 3, 6, 12].includes(months) &&
            Number.isFinite(start) &&
            Number.isFinite(expiry) &&
            Number.isFinite(now) &&
            start <= now &&
            now < expiry;
        }
      }
    } catch {
      serverSubscriptionActive = false;
    }

    if (!serverSubscriptionActive) {
      return denyCommercialWrite(
        capability,
        "An ACTIVE FINORA server subscription is required.",
      );
    }
  }

  const legacyRegistrationExpired =
    session.dataContext === "REAL" &&
    accessDecision.state === "EXPIRED" &&
    accessDecision.reason === "FINORA annual registration has expired." &&
    serverSubscriptionActive;
  if (
    (!accessDecision.allowed ||
     accessDecision.state !== "ACTIVE") &&
    !legacyRegistrationExpired
  ) {
    return denyCommercialWrite(
      capability,
      accessDecision.reason,
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