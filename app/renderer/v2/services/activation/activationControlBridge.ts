// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// ACTIVATION CONTROL BRIDGE
//
// RESPONSIBILITY:
//
// - Resolve the secure FINORA control bridge per runtime
// - Use Electron preload control API on desktop
// - Use native FinoraControl Capacitor plugin on Android
// - Keep activationService independent from platform details
//
// IMPORTANT:
//
// - READ / CHECK ONLY.
// - No branch activation writes.
// - No LOCAL / USB entitlement grants.
// - No direct filesystem access.
// - No localStorage.
// - No customer / loan / collection / Gold data.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../types/business/finoraBusinessProfileControl.types";

import type {
  FinoraPricingOverrideSetV1,
} from "../../types/pricing/finoraPricingOverride.types";

import type {
  FinoraVerifiedWalletRechargeAuthorization,
} from "../../types/wallet/finoraWalletRechargeControl.types";

import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

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

// ============================================================
// WALLET RECHARGE AUTHORIZATION VIEW
// ============================================================

export type FinoraWalletRechargeAuthorizationView =
  Omit<
    FinoraVerifiedWalletRechargeAuthorization,
    "installationBinding"
  >;

// ============================================================
// REQUEST TYPES
// ============================================================

export interface FinoraBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

export interface FinoraBusinessProfileRequest {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraPricingPolicyRequest {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraWalletRechargeAuthorizationRequest {

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  paymentReference:
    string;
}

export interface FinoraBranchAccessGrantRequest {

userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;
}
export interface FinoraStorageEntitlementRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraEntitlementStorageMode;
}

// ============================================================
// CONTROL BRIDGE CONTRACT
// ============================================================

export interface FinoraActivationControlBridge {

  getInstallation():
    Promise<
      StorageResult<
        FinoraInstallationIdentity | undefined
      >
    >;

  findBranchActivation(
    request:
      FinoraBranchActivationRequest,
  ):
    Promise<
      StorageResult<
        FinoraActivation | undefined
      >
    >;

  /**
   * Read the current signed FINORA Business / Branch Profile.
   *
   * Optional only until Android native Business Profile read
   * parity is installed in the next Phase-4 substep.
   *
   * READ ONLY.
   */
  findBusinessProfile(
    request:
      FinoraBusinessProfileRequest,
  ):
    Promise<
      StorageResult<
        FinoraProvisionedBusinessProfileV1 | undefined
      >
    >;

  /**
   * Read the current verified FINORA Pricing Override set.
   *
   * READ ONLY.
   *
   * Native installation-binding metadata and signed-package
   * mutation authority remain outside the renderer.
   */
  findPricingPolicy(
    request:
      FinoraPricingPolicyRequest,
  ):
    Promise<
      StorageResult<
        FinoraPricingOverrideSetV1 | undefined
      >
    >;

  /**
   * Read one previously verified signed Wallet Recharge
   * authorization for the exact branch/payment reference.
   *
   * READ ONLY.
   *
   * Native installation binding, signature verification and
   * signed-package apply authority remain outside the renderer.
   */
  findWalletRechargeAuthorization(
    request:
      FinoraWalletRechargeAuthorizationRequest,
  ):
    Promise<
      StorageResult<
        FinoraWalletRechargeAuthorizationView | undefined
      >
    >;

  findBranchAccessGrant(
    request:
      FinoraBranchAccessGrantRequest,
  ):
    Promise<
      StorageResult<
        FinoraBranchAccessGrant | undefined
      >
    >;
  hasActiveStorageEntitlement(
    request:
      FinoraStorageEntitlementRequest,
  ):
    Promise<
      StorageResult<boolean>
    >;
}

// ============================================================
// ANDROID CAPACITOR PLUGIN
// ============================================================

const finoraAndroidControlPlugin =
  registerPlugin<
    FinoraActivationControlBridge
  >(
    "FinoraControl",
  );

// ============================================================
// ELECTRON BRIDGE RESOLUTION
// ============================================================

function getElectronControlBridge():
  FinoraActivationControlBridge | undefined {

  const bridge =
    window.finora?.control;

  if (!bridge) {
    return undefined;
  }

  return bridge as unknown as FinoraActivationControlBridge;
}

// ============================================================
// ANDROID BRIDGE RESOLUTION
// ============================================================

function getAndroidControlBridge():
  FinoraActivationControlBridge | undefined {

  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }

  if (
    Capacitor.getPlatform() !==
    "android"
  ) {
    return undefined;
  }

  if (
    !Capacitor.isPluginAvailable(
      "FinoraControl",
    )
  ) {
    return undefined;
  }

  return finoraAndroidControlPlugin;
}

// ============================================================
// PUBLIC RESOLVER
// ============================================================

/**
 * Resolve the secure FINORA control API for the current runtime.
 *
 * Priority:
 *
 * 1. Electron preload bridge
 * 2. Android Capacitor native plugin
 *
 * Undefined means the current runtime does not expose a FINORA
 * secure control-state implementation.
 */
export function getFinoraActivationControlBridge():
  FinoraActivationControlBridge | undefined {

  const electronBridge =
    getElectronControlBridge();

  if (electronBridge) {
    return electronBridge;
  }

  return getAndroidControlBridge();
}

// ============================================================
// END
// ============================================================
