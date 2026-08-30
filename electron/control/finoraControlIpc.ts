// ============================================================
// FINORA ENTERPRISE OS™
//
// ELECTRON CONTROL IPC
//
// RESPONSIBILITY:
//
// - Expose narrow read-only FINORA control-state operations
// - Support pre-login installation / activation checks
// - Support per-login LOCAL / USB entitlement checks
// - Enforce trusted-renderer validation on every request
//
// SECURITY:
//
// Renderer MAY:
// - Read installation identity
// - Read branch activation state
// - Check whether one storage entitlement is ACTIVE
//
// Renderer MUST NOT:
// - Create branch activation
// - Modify branch activation
// - Create LOCAL / USB entitlement
// - Modify entitlement status
//
// Paid activation and entitlement writes remain inside trusted
// FINORA provisioning / main-process flows.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  ipcMain,
} from "electron";

import {
  findFinoraBranchActivation,
  getFinoraInstallationIdentity,
  hasActiveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

// ============================================================
// IPC CHANNELS
// ============================================================

const CONTROL_IPC_CHANNELS = {
  GET_INSTALLATION:
    "finora:control:get-installation",

  FIND_BRANCH_ACTIVATION:
    "finora:control:find-branch-activation",

  HAS_ACTIVE_STORAGE_ENTITLEMENT:
    "finora:control:has-active-storage-entitlement",
} as const;

// ============================================================
// TRUST VALIDATOR
// ============================================================

export type FinoraControlRendererValidator = (
  senderFrame:
    Electron.WebFrameMain | null,
) => boolean;

// ============================================================
// REQUEST TYPES
// ============================================================

interface FindBranchActivationRequest {
  ownerId: string;

  businessId: string;

  branchId: string;
}

interface StorageEntitlementCheckRequest {
  userId: string;

  ownerId: string;

  businessId: string;

  branchId: string;

  storageMode: FinoraControlStorageMode;
}

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  error: string,
) {
  return {
    success: false,
    error,
  };
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isStorageMode(
  value: unknown,
): value is FinoraControlStorageMode {
  return (
    value === "LOCAL" ||
    value === "USB"
  );
}

// ============================================================
// REQUEST VALIDATION
// ============================================================

function isFindBranchActivationRequest(
  value: unknown,
): value is FindBranchActivationRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(request.ownerId) &&
    isNonEmptyString(request.businessId) &&
    isNonEmptyString(request.branchId)
  );
}

function isStorageEntitlementCheckRequest(
  value: unknown,
): value is StorageEntitlementCheckRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const request =
    value as Record<string, unknown>;

  return (
    isNonEmptyString(request.userId) &&
    isNonEmptyString(request.ownerId) &&
    isNonEmptyString(request.businessId) &&
    isNonEmptyString(request.branchId) &&
    isStorageMode(request.storageMode)
  );
}

// ============================================================
// REGISTRATION STATE
// ============================================================

let controlHandlersRegistered =
  false;

// ============================================================
// REGISTER CONTROL IPC HANDLERS
// ============================================================

export function registerFinoraControlHandlers(
  isTrustedRenderer:
    FinoraControlRendererValidator,
): void {
  if (controlHandlersRegistered) {
    return;
  }

  controlHandlersRegistered = true;

  // ----------------------------------------------------------
  // INSTALLATION IDENTITY
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.GET_INSTALLATION,
    async (event) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      return getFinoraInstallationIdentity();
    },
  );

  // ----------------------------------------------------------
  // BRANCH ACTIVATION
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_BRANCH_ACTIVATION,
    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      if (
        !isFindBranchActivationRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA branch activation request is required.",
        );
      }

      return findFinoraBranchActivation(
        request.ownerId,
        request.businessId,
        request.branchId,
      );
    },
  );

  // ----------------------------------------------------------
  // STORAGE ENTITLEMENT CHECK
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.HAS_ACTIVE_STORAGE_ENTITLEMENT,
    async (
      event,
      request: unknown,
    ) => {
      if (
        !isTrustedRenderer(
          event.senderFrame,
        )
      ) {
        return failure(
          "Untrusted renderer.",
        );
      }

      if (
        !isStorageEntitlementCheckRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA storage entitlement request is required.",
        );
      }

      return hasActiveFinoraStorageEntitlement(
        request.userId,
        request.ownerId,
        request.businessId,
        request.branchId,
        request.storageMode,
      );
    },
  );
}

// ============================================================
// END
// ============================================================
