/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET INITIALIZATION SERVICE

   RESPONSIBILITY:
   - Resolve deterministic Wallet identity
   - Load existing Wallet for scope
   - Create new Wallet with zero balance when absent
   - Preserve idempotent initialization behavior

   IMPORTANT:
   - No React.
   - No UI.
   - No payment gateway logic.
   - No direct storage access.
   - New Wallet balance is always zero.
   - Wallet scope is Owner + Business + Branch.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletAccount,
  WalletScope,
} from "../../types/wallet/wallet.types";

import {
  addWallet,
  getWalletByIdResult,
} from "../../repositories/wallet/walletRepository";

import {
  FINORA_WALLET_DEFAULT_BALANCE,
  FINORA_WALLET_DEFAULT_STATUS,
  FINORA_WALLET_SCHEMA_VERSION,
} from "./wallet.constants";

import {
  buildWalletId,
} from "./wallet.identity";

/* ============================================================
   RESULT
============================================================ */

export interface WalletInitializationFailure {
  success:
    false;

  errorCode:
    | "INVALID_SCOPE"
    | "WALLET_READ_FAILED"
    | "WALLET_CREATE_FAILED";

  error:
    string;
}

export interface WalletInitializationSuccess {
  success:
    true;

  data:
    WalletAccount;

  created:
    boolean;
}

export type WalletInitializationResult =
  | WalletInitializationSuccess
  | WalletInitializationFailure;

/* ============================================================
   SCOPE NORMALIZATION
============================================================ */

function normalizeScope(
  scope: WalletScope,
): WalletScope {
  return {
    ownerId:
      String(scope.ownerId ?? "").trim(),

    businessId:
      String(scope.businessId ?? "").trim(),

    branchId:
      String(scope.branchId ?? "").trim(),
  };
}

/* ============================================================
   ENSURE WALLET
============================================================ */

export async function ensureWalletForScope(
  scope: WalletScope,
): Promise<WalletInitializationResult> {
  const normalizedScope =
    normalizeScope(scope);

  if (
    !normalizedScope.ownerId ||
    !normalizedScope.businessId ||
    !normalizedScope.branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_SCOPE",

      error:
        "Owner, Business and Branch are required to initialize FINORA Wallet.",
    };
  }

  const walletId =
    buildWalletId(normalizedScope);

  /* ==========================================================
     LOAD EXISTING
  ========================================================== */

  const existingResult =
    await getWalletByIdResult(walletId);

  if (!existingResult.success) {
    return {
      success:
        false,

      errorCode:
        "WALLET_READ_FAILED",

      error:
        existingResult.error ??
        "Unable to load FINORA Wallet.",
    };
  }

  if (existingResult.data) {
    return {
      success:
        true,

      data:
        existingResult.data,

      created:
        false,
    };
  }

  /* ==========================================================
     CREATE ZERO-BALANCE WALLET
  ========================================================== */

  const now =
    new Date().toISOString();

  const wallet: WalletAccount = {
    entity:
      "WALLET",

    walletId,

    ownerId:
      normalizedScope.ownerId,

    businessId:
      normalizedScope.businessId,

    branchId:
      normalizedScope.branchId,

    balance:
      FINORA_WALLET_DEFAULT_BALANCE,

    status:
      FINORA_WALLET_DEFAULT_STATUS,

    transactionCount:
      0,

    createdAt:
      now,

    updatedAt:
      now,

    schemaVersion:
      FINORA_WALLET_SCHEMA_VERSION,
  };

  const createResult =
    await addWallet(wallet);

  if (createResult.success) {
    return {
      success:
        true,

      data:
        wallet,

      created:
        true,
    };
  }

  /* ==========================================================
     DUPLICATE / RACE RECOVERY

     Another initialization call may have created the same
     deterministic Wallet between the first read and save.
     Re-read before returning a hard failure.
  ========================================================== */

  const retryResult =
    await getWalletByIdResult(walletId);

  if (
    retryResult.success &&
    retryResult.data
  ) {
    return {
      success:
        true,

      data:
        retryResult.data,

      created:
        false,
    };
  }

  return {
    success:
      false,

    errorCode:
      "WALLET_CREATE_FAILED",

    error:
      createResult.error ??
      retryResult.error ??
      "Unable to create FINORA Wallet.",
  };
}

/* ============================================================
   END
============================================================ */
