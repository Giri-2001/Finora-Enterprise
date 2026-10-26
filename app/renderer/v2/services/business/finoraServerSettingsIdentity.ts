/**
 * FINORA_P1_725S_SETTINGS_IDENTITY
 *
 * Read-only PostgreSQL Business/Branch identity.
 * Windows: authenticated Electron Main IPC.
 * Android: authenticated native Wallet session.
 *
 * Never manufactures a Signed Business Profile.
 * Never accepts a renderer-selected server URL or branch.
 */

import {
  getFinoraAndroidBusinessIdentity,
} from "../wallet/finoraAndroidWalletReads";

import {
  isFinoraAndroidWallet,
} from "../wallet/finoraAndroidWalletBridge";

export interface FinoraServerSettingsIdentity {
  ownerId: string;
  businessId: string;
  branchId: string;
  businessName: string;
  branchName: string;
  storageMode: "USB";
}

type IdentityResult =
  | {
      success: true;
      data: FinoraServerSettingsIdentity;
    }
  | {
      success: false;
      errorCode: string;
    };

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function validateIdentity(
  value: unknown,
  scope: {
    ownerId: string;
    businessId: string;
    branchId: string;
  },
): IdentityResult {
  if (!isRecord(value)) {
    return {
      success: false,
      errorCode: "INVALID_SERVER_IDENTITY",
    };
  }

  if (
    value.ownerId !== scope.ownerId ||
    value.businessId !== scope.businessId ||
    value.branchId !== scope.branchId ||
    typeof value.businessName !== "string" ||
    !value.businessName.trim() ||
    typeof value.branchName !== "string" ||
    !value.branchName.trim() ||
    value.storageMode !== "USB"
  ) {
    return {
      success: false,
      errorCode: "BUSINESS_IDENTITY_SCOPE_MISMATCH",
    };
  }

  return {
    success: true,
    data: {
      ownerId: scope.ownerId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      businessName: value.businessName,
      branchName: value.branchName,
      storageMode: "USB",
    },
  };
}

export async function loadFinoraServerSettingsIdentity(
  scope: {
    ownerId: string;
    businessId: string;
    branchId: string;
  },
): Promise<IdentityResult> {
  if (
    !scope ||
    ![scope.ownerId, scope.businessId, scope.branchId].every(
      value => typeof value === "string" && value.trim().length > 0
    )
  ) {
    return {
      success: false,
      errorCode: "BUSINESS_SCOPE_REQUIRED",
    };
  }

  try {
    if (isFinoraAndroidWallet()) {
      const result = await getFinoraAndroidBusinessIdentity();

      if (!result.success) {
        return {
          success: false,
          errorCode: "ANDROID_IDENTITY_UNAVAILABLE",
        };
      }

      return validateIdentity(result.data, scope);
    }

    const host = window as Window & {
      finoraAccountBusinessIdentity?: {
        get: () => Promise<unknown>;
      };
    };

    if (
      typeof host.finoraAccountBusinessIdentity?.get !== "function"
    ) {
      return {
        success: false,
        errorCode: "WINDOWS_IDENTITY_BRIDGE_UNAVAILABLE",
      };
    }

    const response: unknown =
      await host.finoraAccountBusinessIdentity.get();

    if (
      !isRecord(response) ||
      response.success !== true
    ) {
      return {
        success: false,
        errorCode: "SERVER_IDENTITY_UNAVAILABLE",
      };
    }

    return validateIdentity(response.identity, scope);
  } catch {
    return {
      success: false,
      errorCode: "SERVER_IDENTITY_READ_FAILED",
    };
  }
}