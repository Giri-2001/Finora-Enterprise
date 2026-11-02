import { Capacitor } from "@capacitor/core";
import { finoraControlShared } from "../finoraControlShared";

import type {
  FinoraSavedOwnerAccount,
} from "../../pages/auth/FinoraSavedOwnerLoginPicker";

// FINORA_C80_AUTH_R146_ANDROID_SAVED_OWNER_BRIDGE
// Android Keystore-backed native vault only.
// Never persist credentials in WebView localStorage or USB.

type Failed = {
  success: false;
  errorCode: string;
};

type NativeSavedOwnerPlugin = {
  listSavedOwnerLogins: () => Promise<{
    success: boolean;
    accounts?: FinoraSavedOwnerAccount[];
    errorCode?: string;
  }>;
  selectSavedOwnerLogin: (request: {
    id: string;
  }) => Promise<{
    success: boolean;
    username?: string;
    password?: string;
    branchId?: string;
    ownerId?: string;
    errorCode?: string;
  }>;
  saveSavedOwnerLogin: (request: {
    consent: boolean;
    sessionId: string;
    username: string;
    password: string;
  }) => Promise<{
    success: boolean;
    account?: FinoraSavedOwnerAccount;
    errorCode?: string;
  }>;
  removeSavedOwnerLogin: (request: {
    id: string;
  }) => Promise<{
    success: boolean;
    removed?: boolean;
    errorCode?: string;
  }>;
};

function nativePlugin(): NativeSavedOwnerPlugin {
  return finoraControlShared as NativeSavedOwnerPlugin;
}

function unavailable(): Failed {
  return {
    success: false,
    errorCode: "ANDROID_SAVED_OWNER_VAULT_UNAVAILABLE",
  };
}

export function isFinoraAndroidSavedOwnerAvailable(): boolean {
  return Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android";
}

export const finoraAndroidSavedOwnerBridge = {
  async list(): Promise<
    { success: true; accounts: FinoraSavedOwnerAccount[] } | Failed
  > {
    if (!isFinoraAndroidSavedOwnerAvailable()) {
      return unavailable();
    }

    try {
      const result = await nativePlugin().listSavedOwnerLogins();

      if (!result.success || !Array.isArray(result.accounts)) {
        return {
          success: false,
          errorCode: result.errorCode || "SAVED_LOGIN_LIST_FAILED",
        };
      }

      return {
        success: true,
        accounts: result.accounts,
      };
    } catch {
      return unavailable();
    }
  },

  async select(id: string): Promise<
    | {
        success: true;
        username: string;
        password: string;
        branchId: string;
        ownerId: string;
      }
    | Failed
  > {
    if (!isFinoraAndroidSavedOwnerAvailable() || !id) {
      return unavailable();
    }

    try {
      const result = await nativePlugin().selectSavedOwnerLogin({ id });

      if (
        !result.success ||
        !result.username ||
        !result.password ||
        !result.branchId ||
        !result.ownerId
      ) {
        return {
          success: false,
          errorCode: result.errorCode || "SAVED_ACCOUNT_SELECT_FAILED",
        };
      }

      return {
        success: true,
        username: result.username,
        password: result.password,
        branchId: result.branchId,
        ownerId: result.ownerId,
      };
    } catch {
      return unavailable();
    }
  },

  async save(request: {
    consent: boolean;
    sessionId: string;
    username: string;
    password: string;
  }): Promise<
    { success: true; account: FinoraSavedOwnerAccount } | Failed
  > {
    if (
      !isFinoraAndroidSavedOwnerAvailable() ||
      request.consent !== true ||
      !request.sessionId ||
      !request.username ||
      !request.password
    ) {
      return {
        success: false,
        errorCode: "INVALID_SAVE_LOGIN_REQUEST",
      };
    }

    try {
      const result = await nativePlugin().saveSavedOwnerLogin(request);

      if (!result.success || !result.account) {
        return {
          success: false,
          errorCode: result.errorCode || "SAVED_LOGIN_SAVE_FAILED",
        };
      }

      return {
        success: true,
        account: result.account,
      };
    } catch {
      return unavailable();
    }
  },

  async remove(id: string): Promise<
    { success: true; removed: boolean } | Failed
  > {
    if (!isFinoraAndroidSavedOwnerAvailable() || !id) {
      return unavailable();
    }

    try {
      const result = await nativePlugin().removeSavedOwnerLogin({ id });

      if (!result.success || typeof result.removed !== "boolean") {
        return {
          success: false,
          errorCode: result.errorCode || "SAVED_ACCOUNT_REMOVE_FAILED",
        };
      }

      return {
        success: true,
        removed: result.removed,
      };
    } catch {
      return unavailable();
    }
  },
};