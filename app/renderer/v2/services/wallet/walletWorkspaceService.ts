/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET WORKSPACE SERVICE

   RESPONSIBILITY:
   - Initialize / resolve Wallet for authenticated scope
   - Load authoritative Wallet transaction history
   - Return one Wallet workspace snapshot to UI
   - Keep repository access outside Wallet pages

   IMPORTANT:
   - No React.
   - No UI.
   - No payment gateway calls.
   - No recharge credit execution.
   - No debit execution.
   - No direct StorageManager access.
============================================================ */

import type {
  WalletAccount,
  WalletScope,
  WalletTransaction,
} from "../../types/wallet/wallet.types";

import {
  ensureWalletForScope,
} from "./walletInitializationService";

import {
  getTransactionsByWalletResult,
} from "../../repositories/wallet/walletTransactionRepository";

/* ============================================================
   SNAPSHOT
============================================================ */

export interface WalletWorkspaceSnapshot {
  wallet:
    WalletAccount;

  transactions:
    WalletTransaction[];
}

/* ============================================================
   RESULT
============================================================ */

export interface WalletWorkspaceLoadSuccess {
  success:
    true;

  data:
    WalletWorkspaceSnapshot;
}

export interface WalletWorkspaceLoadFailure {
  success:
    false;

  errorCode:
    | "WALLET_INITIALIZATION_FAILED"
    | "TRANSACTION_HISTORY_FAILED";

  error:
    string;
}

export type WalletWorkspaceLoadResult =
  | WalletWorkspaceLoadSuccess
  | WalletWorkspaceLoadFailure;

/* ============================================================
   LOAD WORKSPACE
============================================================ */

export async function loadWalletWorkspace(
  scope: WalletScope,
): Promise<WalletWorkspaceLoadResult> {
  const walletResult =
    await ensureWalletForScope(scope);

  if (!walletResult.success) {
    return {
      success:
        false,

      errorCode:
        "WALLET_INITIALIZATION_FAILED",

      error:
        walletResult.error,
    };
  }

  const wallet =
    walletResult.data;

  const transactionsResult =
    await getTransactionsByWalletResult(
      wallet.walletId,
    );

  if (!transactionsResult.success) {
    return {
      success:
        false,

      errorCode:
        "TRANSACTION_HISTORY_FAILED",

      error:
        transactionsResult.error ??
        "Unable to load FINORA Wallet transaction history.",
    };
  }

  return {
    success:
      true,

    data: {
      wallet,

      transactions:
        transactionsResult.data ?? [],
    },
  };
}

/* ============================================================
   END
============================================================ */
