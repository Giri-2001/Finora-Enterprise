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
  StorageResult,
} from "../../storage/storage.types";

// ============================================================
// REQUEST TYPES
// ============================================================

export interface FinoraBranchActivationRequest {
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

  return bridge;
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
