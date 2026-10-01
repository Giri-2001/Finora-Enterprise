import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  readFinoraWalletBranchCertificationDeviceVault,
  writeFinoraWalletBranchCertificationDeviceVault,
} from "./finoraWalletBranchCertificationDeviceVault.js";

import {
  installFinoraWalletBranchCertificationSessionAuthority,
} from "./finoraWalletBranchCertificationSessionAuthority.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraControlStorageMode,
} from "./finoraControlStore.js";

export interface RestoreFinoraWalletBranchCertificationAuthorityInput {
  ownerId: string;
  businessId: string;
  branchId: string;
  userId: string;
  username: string;
  fullName: string;

  role:
    | "ADMIN"
    | "MANAGER"
    | "COLLECTOR"
    | "VIEWER";

  authGeneration: number;

  storageMode:
    FinoraControlStorageMode;

  dataContext:
    | "REAL"
    | "DEMO";

  demoId?:
    string;

  password:
    string;

  securityCode?:
    string;

  portableStore:
    FinoraPortableBranchAuthStore;
}

export type RestoreFinoraWalletBranchCertificationAuthorityResult =
  | {
      success: true;
    }
  | {
      success: false;

      errorCode:
        | "SECURITY_CODE_REQUIRED"
        | "SECURITY_CODE_INVALID"
        | "CONTROL_STATE_FAILED";

      error:
        string;
    };

export async function restoreFinoraWalletBranchCertificationAuthority(
  input:
    RestoreFinoraWalletBranchCertificationAuthorityInput,
): Promise<
  RestoreFinoraWalletBranchCertificationAuthorityResult
> {
  let material;

  try {
    material =
      await readFinoraWalletBranchCertificationDeviceVault(
        input.ownerId,
        input.businessId,
        input.branchId,
      );
  }
  catch {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_FAILED",

      error:
        "FINORA Wallet Branch Certification secure vault could not be validated.",
    };
  }

  if (!material) {
    if (
      typeof input.securityCode !== "string" ||
      input.securityCode.trim().length === 0
    ) {
      return {
        success:
          false,

        errorCode:
          "SECURITY_CODE_REQUIRED",

        error:
          "Security Code is required once to secure Wallet Branch Certification on this device.",
      };
    }

    let envelope;

    try {
      envelope =
        await input.portableStore.read(
          input.storageMode,
        );
    }
    catch {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_FAILED",

        error:
          "FINORA Portable Branch Auth could not be read for Wallet Branch Certification.",
      };
    }

    if (!envelope) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_FAILED",

        error:
          "FINORA Portable Branch Auth is unavailable for Wallet Branch Certification.",
      };
    }

    let payload;

    try {
      payload =
        await decryptFinoraPortableBranchAuthEnvelopeV1(
          envelope,
          input.password,
          input.securityCode,
          {
            expectedScope: {
              ownerId:
                input.ownerId,

              businessId:
                input.businessId,

              branchId:
                input.branchId,
            },
          },
        );
    }
    catch {
      return {
        success:
          false,

        errorCode:
          "SECURITY_CODE_INVALID",

        error:
          "FINORA Security Code is invalid.",
      };
    }

    if (
      payload.branchCertificationKeyMaterial === undefined ||
      payload.authGeneration !== input.authGeneration ||
      payload.userId !== input.userId ||
      payload.username !== input.username ||
      payload.fullName !== input.fullName ||
      payload.role !== input.role ||
      payload.ownerId !== input.ownerId ||
      payload.businessId !== input.businessId ||
      payload.branchId !== input.branchId ||
      payload.storageMode !== input.storageMode ||
      payload.dataContext !== input.dataContext ||
      payload.demoId !== input.demoId
    ) {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_FAILED",

        error:
          "FINORA Portable Branch Auth does not match the authenticated Wallet branch.",
      };
    }

    material =
      payload.branchCertificationKeyMaterial;

    try {
      await writeFinoraWalletBranchCertificationDeviceVault(
        input.ownerId,
        input.businessId,
        input.branchId,
        material,
      );
    }
    catch {
      return {
        success:
          false,

        errorCode:
          "CONTROL_STATE_FAILED",

        error:
          "FINORA Wallet Branch Certification could not be secured on this device.",
      };
    }
  }

  try {
    installFinoraWalletBranchCertificationSessionAuthority(
      input.ownerId,
      input.businessId,
      input.branchId,
      material,
    );

    return {
      success:
        true,
    };
  }
  catch {
    return {
      success:
        false,

      errorCode:
        "CONTROL_STATE_FAILED",

      error:
        "FINORA Wallet Branch Certification runtime authority could not be restored.",
    };
  }
}
