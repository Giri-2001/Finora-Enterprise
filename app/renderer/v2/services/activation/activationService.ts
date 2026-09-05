// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// ACTIVATION SERVICE
//
// RESPONSIBILITY:
//
// - Provide the renderer service boundary for FINORA activation
// - Read the current installation identity
// - Read branch activation state
// - Check per-login LOCAL / USB storage entitlement
// - Keep UI independent from Electron / Android bridge details
//
// IMPORTANT:
//
// - READ / CHECK ONLY.
// - No activation creation.
// - No entitlement granting.
// - No entitlement status mutation.
// - No direct ipcRenderer access.
// - No direct Capacitor plugin access.
// - No direct filesystem access.
// - No localStorage access.
// - No StorageManager access.
// - No React state.
// - No pricing calculations.
// - No customer / loan / collection / Gold data.
//
// SECURITY:
//
// Paid activation and storage entitlement writes are deliberately
// unavailable through this renderer service.
//
// VERSION : 1.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  FinoraActivation,
} from "../../types/activation/finoraActivation.types";

import type {
  FinoraInstallationIdentity,
} from "../../types/activation/finoraInstallation.types";

import type {
  FinoraEntitlementStorageMode,
} from "../../types/activation/finoraStorageEntitlement.types";

import type {
  FinoraBranchAccessGrant,
} from "../../types/activation/finoraBranchAccess.types";
import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  getFinoraActivationControlBridge,
} from "./activationControlBridge";

// ============================================================
// HELPERS
// ============================================================

function isNonEmptyString(
  value: string,
): boolean {
  return value.trim().length > 0;
}

function bridgeUnavailable<T>():
  StorageResult<T> {
  return {
    success: false,

    error:
      "FINORA secure control bridge is unavailable.",
  };
}

// ============================================================
// INSTALLATION IDENTITY
// ============================================================

/**
 * Load the FINORA installation identity bound to this device.
 *
 * Undefined data means this installation has not yet been
 * provisioned.
 */
export async function loadFinoraInstallationIdentity():
  Promise<
    StorageResult<
      FinoraInstallationIdentity | undefined
    >
  > {
  const bridge =
    getFinoraActivationControlBridge();

  if (!bridge) {
    return bridgeUnavailable();
  }

  try {
    return await bridge.getInstallation();
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA installation identity.",
    };
  }
}

// ============================================================
// BRANCH ACTIVATION
// ============================================================

/**
 * Load activation state for one Owner / Business / Branch.
 */
export async function loadFinoraBranchActivation(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  StorageResult<
    FinoraActivation | undefined
  >
> {
  if (
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId)
  ) {
    return {
      success: false,

      error:
        "Owner ID, Business ID and Branch ID are required.",
    };
  }

  const bridge =
    getFinoraActivationControlBridge();

  if (!bridge) {
    return bridgeUnavailable();
  }

  try {
    return await bridge.findBranchActivation({
      ownerId,
      businessId,
      branchId,
    });
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA branch activation.",
    };
  }
}

// ============================================================
// ACTIVE BRANCH CHECK
// ============================================================

/**
 * Resolve whether the supplied branch currently has an ACTIVE
 * FINORA activation.
 */
export async function hasActiveFinoraBranchActivation(
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  StorageResult<boolean>
> {
  const result =
    await loadFinoraBranchActivation(
      ownerId,
      businessId,
      branchId,
    );

  if (!result.success) {
    return {
      success: false,

      error:
        result.error ??
        "Unable to verify FINORA branch activation.",
    };
  }

  return {
    success: true,

    data:
      result.data?.status ===
      "ACTIVE",
  };
}

// ============================================================
// STORAGE ENTITLEMENT
// ============================================================
// BRANCH ACCESS GRANT
// ============================================================

/**
 * Load the signed REGISTERED / DEMO access grant for the
 * authenticated login identity.
 *
 * Runtime validity is evaluated separately using trusted/system
 * current time. FINORA Business Date is never used here.
 */
export async function loadFinoraBranchAccessGrant(
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
): Promise<
  StorageResult<
    FinoraBranchAccessGrant | undefined
  >
> {
  if (
    !isNonEmptyString(userId) ||
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId)
  ) {
    return {
      success: false,

      error:
        "User ID, Owner ID, Business ID and Branch ID are required.",
    };
  }

  const bridge =
    getFinoraActivationControlBridge();

  if (!bridge) {
    return bridgeUnavailable();
  }

  try {
    return await bridge.findBranchAccessGrant({
      userId,
      ownerId,
      businessId,
      branchId,
    });
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA branch access grant.",
    };
  }
}
// ============================================================

/**
 * Check whether one authenticated FINORA user/login owns an
 * ACTIVE entitlement for the selected LOCAL or USB mode.
 */
export async function hasActiveFinoraStorageEntitlement(
  userId: string,
  ownerId: string,
  businessId: string,
  branchId: string,
  storageMode: FinoraEntitlementStorageMode,
): Promise<
  StorageResult<boolean>
> {
  if (
    !isNonEmptyString(userId) ||
    !isNonEmptyString(ownerId) ||
    !isNonEmptyString(businessId) ||
    !isNonEmptyString(branchId)
  ) {
    return {
      success: false,

      error:
        "User ID, Owner ID, Business ID and Branch ID are required.",
    };
  }

  if (
    storageMode !== "LOCAL" &&
    storageMode !== "USB"
  ) {
    return {
      success: false,

      error:
        "FINORA storage mode must be LOCAL or USB.",
    };
  }

  const bridge =
    getFinoraActivationControlBridge();

  if (!bridge) {
    return bridgeUnavailable();
  }

  try {
    return await bridge.hasActiveStorageEntitlement({
      userId,
      ownerId,
      businessId,
      branchId,
      storageMode,
    });
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to verify FINORA storage entitlement.",
    };
  }
}

// ============================================================
// END
// ============================================================