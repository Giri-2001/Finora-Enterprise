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
  findFinoraBranchAccessGrant,
  findFinoraBranchActivation,
  getFinoraInstallationIdentity,
  hasActiveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

import {
  findFinoraBusinessProfile,
} from "./finoraControlStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";
// ============================================================
// IPC CHANNELS
// ============================================================

const CONTROL_IPC_CHANNELS = {
  GET_INSTALLATION:
    "finora:control:get-installation",

  FIND_BRANCH_ACTIVATION:
    "finora:control:find-branch-activation",

  FIND_BRANCH_ACCESS_GRANT:
    "finora:control:find-branch-access-grant",
  FIND_BUSINESS_PROFILE:
    "finora:control:find-business-profile",
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

interface FindBranchAccessGrantRequest {
  userId: string;

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

function isFindBranchAccessGrantRequest(
  value: unknown,
): value is FindBranchAccessGrantRequest {
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
  // BRANCH ACCESS GRANT
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_BRANCH_ACCESS_GRANT,
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
        !isFindBranchAccessGrantRequest(
          request,
        )
      ) {
        return failure(
          "A valid FINORA branch access request is required.",
        );
      }

      return findFinoraBranchAccessGrant(
        request.userId,
        request.ownerId,
        request.businessId,
        request.branchId,
      );
    },
  );
  // ----------------------------------------------------------
  // BUSINESS PROFILE
  //
  // READ ONLY.
  //
  // Native installation-binding metadata remains inside
  // Electron main. Renderer receives only provisioned identity.
  // ----------------------------------------------------------

  ipcMain.handle(
    CONTROL_IPC_CHANNELS.FIND_BUSINESS_PROFILE,
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
          "FINORA Control Business Profile access is restricted to the trusted renderer.",
        );
      }

      if (
        typeof request !==
          "object" ||
        request ===
          null ||
        Array.isArray(
          request,
        )
      ) {
        return failure(
          "A valid FINORA Business Profile request is required.",
        );
      }

      const record =
        request as Record<string, unknown>;

      const ownerId =
        typeof record.ownerId ===
          "string"
          ? record.ownerId.trim()
          : "";

      const businessId =
        typeof record.businessId ===
          "string"
          ? record.businessId.trim()
          : "";

      const branchId =
        typeof record.branchId ===
          "string"
          ? record.branchId.trim()
          : "";

      if (
        !ownerId ||
        !businessId ||
        !branchId
      ) {
        return failure(
          "Owner ID, Business ID and Branch ID are required to read the FINORA Business Profile.",
        );
      }

      const result =
        await findFinoraBusinessProfile(
          ownerId,
          businessId,
          branchId,
        );

      if (!result.success) {
        return result;
      }

      if (!result.data) {
        return {
          success:
            true,

          data:
            undefined,
        };
      }

      const profile =
        result.data;

      return {
        success:
          true,

        data: {
          profileId:
            profile.profileId,

          ownerId:
            profile.ownerId,

          businessId:
            profile.businessId,

          branchId:
            profile.branchId,

          businessCode:
            profile.businessCode,

          branchCode:
            profile.branchCode,

          businessName:
            profile.businessName,

          branchName:
            profile.branchName,

          createdAt:
            profile.createdAt,

          updatedAt:
            profile.updatedAt,

          schemaVersion:
            1 as const,
        },
      };
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

      const nativeBinding =
        await getFinoraWindowsInstallationBinding();

      if (!nativeBinding) {
        return failure(
          "FINORA Windows native installation binding is unavailable.",
        );
      }

      return hasActiveFinoraStorageEntitlement(
        request.userId,
        request.ownerId,
        request.businessId,
        request.branchId,
        request.storageMode,
        {
          installationId:
            nativeBinding.installationId,

          bindingKeyId:
            nativeBinding.bindingKeyId,

          fingerprintAlgorithm:
            nativeBinding.fingerprintAlgorithm,

          publicKeyFingerprint:
            nativeBinding.publicKeyFingerprint,
        },
      );
    },
  );
}

// ============================================================
// END
// ============================================================
