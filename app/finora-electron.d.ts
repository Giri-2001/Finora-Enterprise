// ============================================================
// FINORA ENTERPRISE OS™
//
// RENDERER ELECTRON BRIDGE DECLARATIONS
//
// RESPONSIBILITY:
//
// - Type the secure Electron preload API exposed as window.finora
// - Type read-only FINORA Control Store operations
// - Preserve the existing USB runtime namespace
//
// SECURITY:
//
// Renderer MAY:
// - Read installation identity
// - Read branch activation state
// - Check LOCAL / USB entitlement status
//
// Renderer MUST NOT:
// - Create or modify branch activation
// - Grant LOCAL / USB entitlement
// - Modify entitlement status
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraActivation,
} from "./renderer/v2/types/activation/finoraActivation.types";

import type {
  FinoraInstallationIdentity,
} from "./renderer/v2/types/activation/finoraInstallation.types";

import type {
  FinoraEntitlementStorageMode,
} from "./renderer/v2/types/activation/finoraStorageEntitlement.types";

// ============================================================
// GENERIC BRIDGE RESULT
// ============================================================

interface FinoraElectronResult<T> {
  success: boolean;

  data?: T;

  error?: string;
}

// ============================================================
// REQUEST CONTRACTS
// ============================================================

interface FinoraFindBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface FinoraStorageEntitlementCheckRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraEntitlementStorageMode;
}

// ============================================================
// CONTROL BRIDGE
// ============================================================

interface FinoraElectronControlBridge {

  /**
   * Returns the device-level FINORA installation identity.
   *
   * Undefined means this installation has not yet been
   * provisioned.
   */
  getInstallation():
    Promise<
      FinoraElectronResult<
        FinoraInstallationIdentity | undefined
      >
    >;

  /**
   * Returns activation state for one Owner / Business / Branch.
   */
  findBranchActivation(
    request:
      FinoraFindBranchActivationRequest,
  ):
    Promise<
      FinoraElectronResult<
        FinoraActivation | undefined
      >
    >;

  /**
   * Checks whether one user/login currently owns an ACTIVE
   * entitlement for the selected LOCAL or USB storage mode.
   */
  hasActiveStorageEntitlement(
    request:
      FinoraStorageEntitlementCheckRequest,
  ):
    Promise<
      FinoraElectronResult<boolean>
    >;
}

// ============================================================
// ROOT FINORA BRIDGE
// ============================================================

interface FinoraElectronRendererBridge {

  /**
   * Preload bridge version.
   */
  version: string;

  /**
   * Existing V2 USB bridge.
   *
   * USBStorageAdapter currently maintains its own narrow bridge
   * contract, so it remains intentionally opaque here.
   */
  usb: unknown;

  /**
   * Read-only FINORA device control API.
   */
  control: FinoraElectronControlBridge;
}

// ============================================================
// GLOBAL WINDOW AUGMENTATION
// ============================================================

declare global {
  interface Window {
    finora?: FinoraElectronRendererBridge;
  }
}

export {};
