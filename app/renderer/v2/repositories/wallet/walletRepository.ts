/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET REPOSITORY

   RESPONSIBILITY:
   - Persist FINORA Wallet accounts through StorageManager
   - Keep Wallet domain model independent from storage details
   - Use deterministic Wallet ID as persistent identity
   - Preserve owner / business / branch scope
   - Provide strict result-based Wallet CRUD operations
   - Prevent duplicate Wallet creation

   IMPORTANT:
   - No direct localStorage access.
   - No filesystem access.
   - No Electron IPC.
   - No React.
   - No UI logic.
   - No payment gateway logic.
   - No recharge calculations.
   - No debit calculations.
   - No direct balance mutation outside Wallet services.
   - Storage access goes through StorageManager.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

/* ============================================================
   IMPORTS
============================================================ */

import type {
  WalletAccount,
  WalletId,
} from "../../types/wallet/wallet.types";

import { storageManager } from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

/* ============================================================
   CONSTANTS
============================================================ */

const WALLET_ENTITY =
  "WALLET" as const;

/* ============================================================
   STORAGE RECORD
============================================================ */

interface WalletStorageRecord
  extends WalletAccount {
  id:
    string;

  entity:
    typeof WALLET_ENTITY;
}

/* ============================================================
   STORAGE CONVERSION
============================================================ */

function toWalletStorageRecord(
  wallet: WalletAccount,
): WalletStorageRecord {
  return {
    ...wallet,

    id:
      String(wallet.walletId).trim(),

    entity:
      WALLET_ENTITY,
  };
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildWalletQuery(
  query?: Partial<StorageQuery>,
): StorageQuery {
  return {
    entity:
      WALLET_ENTITY,

    id:
      query?.id,

    ownerId:
      query?.ownerId,

    demoId:
      query?.demoId,

    limit:
      query?.limit,

    offset:
      query?.offset,
  };
}

/* ============================================================
   VALIDATION
============================================================ */

function validateWalletForPersistence(
  wallet: WalletAccount,
): string | undefined {
  if (!wallet.walletId) {
    return "Wallet ID is required before saving a Wallet.";
  }

  if (!wallet.ownerId) {
    return "Wallet owner ID is required before saving a Wallet.";
  }

  if (!wallet.businessId) {
    return "Wallet business ID is required before saving a Wallet.";
  }

  if (!wallet.branchId) {
    return "Wallet branch ID is required before saving a Wallet.";
  }

  if (!Number.isFinite(wallet.balance)) {
    return "Wallet balance must be a finite number.";
  }

  if (wallet.balance < 0) {
    return "Wallet balance cannot be negative.";
  }

  return undefined;
}

/* ============================================================
   GET ALL WALLETS
============================================================ */

export async function getWalletsResult(
  query?: Partial<StorageQuery>,
): Promise<StorageResult<WalletAccount[]>> {
  try {
    const result =
      await storageManager.getAll<WalletStorageRecord>(
        buildWalletQuery(query),
      );

    if (!result.success) {
      return {
        success:
          false,

        error:
          result.error ??
          "Unable to load FINORA Wallet accounts.",
      };
    }

    return {
      success:
        true,

      data:
        result.data ?? [],
    };
  } catch (error) {
    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA Wallet accounts.",
    };
  }
}

/* ============================================================
   GET WALLET BY ID
============================================================ */

export async function getWalletByIdResult(
  walletId: WalletId,
): Promise<StorageResult<WalletAccount | undefined>> {
  const normalizedWalletId =
    String(walletId ?? "").trim();

  if (!normalizedWalletId) {
    return {
      success:
        false,

      error:
        "Wallet ID is required.",
    };
  }

  try {
    const result =
      await storageManager.get<WalletStorageRecord>(
        buildWalletQuery({
          id:
            normalizedWalletId,
        }),
      );

    if (!result.success) {
      return {
        success:
          false,

        error:
          result.error ??
          "Unable to load FINORA Wallet.",
      };
    }

    return {
      success:
        true,

      data:
        result.data,
    };
  } catch (error) {
    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA Wallet.",
    };
  }
}

/* ============================================================
   ADD WALLET
============================================================ */

export async function addWallet(
  wallet: WalletAccount,
): Promise<StorageResult<WalletAccount>> {
  const validationError =
    validateWalletForPersistence(wallet);

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

  const existing =
    await storageManager.get<WalletStorageRecord>(
      buildWalletQuery({
        id:
          wallet.walletId,
      }),
    );

  if (!existing.success) {
    return {
      success:
        false,

      error:
        existing.error ??
        "Unable to verify whether the Wallet already exists.",
    };
  }

  if (existing.data) {
    return {
      success:
        false,

      error:
        "FINORA Wallet already exists.",
    };
  }

  const result =
    await storageManager.save<WalletStorageRecord>(
      toWalletStorageRecord(wallet),
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to save FINORA Wallet.",
    };
  }

  return {
    success:
      true,

    data:
      wallet,
  };
}

/* ============================================================
   UPDATE WALLET
============================================================ */

export async function updateWallet(
  wallet: WalletAccount,
): Promise<StorageResult<WalletAccount>> {
  const validationError =
    validateWalletForPersistence(wallet);

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

  const existing =
    await storageManager.get<WalletStorageRecord>(
      buildWalletQuery({
        id:
          wallet.walletId,
      }),
    );

  if (!existing.success) {
    return {
      success:
        false,

      error:
        existing.error ??
        "Unable to verify FINORA Wallet before update.",
    };
  }

  if (!existing.data) {
    return {
      success:
        false,

      error:
        "FINORA Wallet was not found for update.",
    };
  }

  const result =
    await storageManager.update<WalletStorageRecord>(
      toWalletStorageRecord(wallet),
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to update FINORA Wallet.",
    };
  }

  return {
    success:
      true,

    data:
      wallet,
  };
}

/* ============================================================
   DELETE WALLET
============================================================ */

/**
 * Physical delete intended only for controlled persistence
 * compensation or development maintenance.
 *
 * Normal FINORA owner workflows must not expose Wallet deletion.
 */
export async function deleteWalletById(
  walletId: WalletId,
): Promise<StorageResult<void>> {
  const normalizedWalletId =
    String(walletId ?? "").trim();

  if (!normalizedWalletId) {
    return {
      success:
        false,

      error:
        "Wallet ID is required before deletion.",
    };
  }

  const existing =
    await storageManager.get<WalletStorageRecord>(
      buildWalletQuery({
        id:
          normalizedWalletId,
      }),
    );

  if (!existing.success) {
    return {
      success:
        false,

      error:
        existing.error ??
        "Unable to verify FINORA Wallet before deletion.",
    };
  }

  if (!existing.data) {
    return {
      success:
        false,

      error:
        "FINORA Wallet was not found for deletion.",
    };
  }

  const result =
    await storageManager.delete(
      buildWalletQuery({
        id:
          normalizedWalletId,
      }),
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to delete FINORA Wallet.",
    };
  }

  return {
    success:
      true,
  };
}

/* ============================================================
   COMPATIBILITY READ HELPERS
============================================================ */

export async function getWalletById(
  walletId: WalletId,
): Promise<WalletAccount | undefined> {
  const result =
    await getWalletByIdResult(walletId);

  if (!result.success) {
    return undefined;
  }

  return result.data;
}

export async function getWallets(): Promise<WalletAccount[]> {
  const result =
    await getWalletsResult();

  if (!result.success) {
    return [];
  }

  return result.data ?? [];
}

/* ============================================================
   END
============================================================ */
