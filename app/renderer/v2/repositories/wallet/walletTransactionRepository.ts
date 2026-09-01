/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET TRANSACTION REPOSITORY

   RESPONSIBILITY:
   - Persist FINORA Wallet ledger records through StorageManager
   - Preserve append-only transaction history
   - Prevent duplicate transaction identifiers
   - Support Wallet-scoped transaction reads
   - Keep transaction persistence independent from UI
   - Keep financial calculation logic outside the repository

   IMPORTANT:
   - No direct localStorage access.
   - No filesystem access.
   - No Electron IPC.
   - No React.
   - No UI logic.
   - No payment gateway logic.
   - No balance calculations.
   - No recharge calculations.
   - No debit calculations.
   - Successful historical ledger entries are immutable.
   - Normal business workflows must not update or delete
     committed Wallet transactions.

   VERSION : 1.1
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletId,
  WalletTransaction,
  WalletTransactionId,
} from "../../types/wallet/wallet.types";

import { storageManager } from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

/* ============================================================
   CONSTANTS
============================================================ */

const WALLET_TRANSACTION_ENTITY =
  "WALLET_TRANSACTION" as const;

/* ============================================================
   STORAGE RECORD
============================================================ */

type WalletTransactionStorageRecord =
  WalletTransaction & {
    entity:
      typeof WALLET_TRANSACTION_ENTITY;
  };

/* ============================================================
   STORAGE CONVERSION
============================================================ */

function toWalletTransactionStorageRecord(
  transaction: WalletTransaction,
): WalletTransactionStorageRecord {
  return {
    ...transaction,

    entity:
      WALLET_TRANSACTION_ENTITY,
  };
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildWalletTransactionQuery(
  query?: Partial<StorageQuery>,
): StorageQuery {
  return {
    entity:
      WALLET_TRANSACTION_ENTITY,

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

function validateTransactionForPersistence(
  transaction: WalletTransaction,
): string | undefined {
  if (!transaction.id) {
    return "Wallet transaction ID is required.";
  }

  if (!transaction.walletId) {
    return "Wallet ID is required for Wallet transaction persistence.";
  }

  if (!transaction.ownerId) {
    return "Wallet transaction owner ID is required.";
  }

  if (!transaction.businessId) {
    return "Wallet transaction business ID is required.";
  }

  if (!transaction.branchId) {
    return "Wallet transaction branch ID is required.";
  }

  if (
    !Number.isFinite(transaction.amount) ||
    transaction.amount <= 0
  ) {
    return "Wallet transaction amount must be greater than zero.";
  }

  if (
    !Number.isFinite(transaction.availableBalance) ||
    transaction.availableBalance < 0
  ) {
    return "Wallet available balance must be a non-negative finite number.";
  }

  return undefined;
}

/* ============================================================
   GET ALL WALLET TRANSACTIONS
============================================================ */

export async function getWalletTransactionsResult(
  query?: Partial<StorageQuery>,
): Promise<StorageResult<WalletTransaction[]>> {
  try {
    const result =
      await storageManager.getAll<WalletTransactionStorageRecord>(
        buildWalletTransactionQuery(query),
      );

    if (!result.success) {
      return {
        success:
          false,

        error:
          result.error ??
          "Unable to load FINORA Wallet transactions.",
      };
    }

    const transactions: WalletTransaction[] =
      (result.data ?? []).map(
        (record) => record,
      );

    return {
      success:
        true,

      data:
        transactions,
    };
  } catch (error) {
    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA Wallet transactions.",
    };
  }
}

/* ============================================================
   GET TRANSACTION BY ID
============================================================ */

export async function getWalletTransactionByIdResult(
  transactionId: WalletTransactionId,
): Promise<StorageResult<WalletTransaction | undefined>> {
  const normalizedTransactionId =
    String(transactionId ?? "").trim();

  if (!normalizedTransactionId) {
    return {
      success:
        false,

      error:
        "Wallet transaction ID is required.",
    };
  }

  try {
    const result =
      await storageManager.get<WalletTransactionStorageRecord>(
        buildWalletTransactionQuery({
          id:
            normalizedTransactionId,
        }),
      );

    if (!result.success) {
      return {
        success:
          false,

        error:
          result.error ??
          "Unable to load FINORA Wallet transaction.",
      };
    }

    const transaction:
      WalletTransaction | undefined =
      result.data;

    return {
      success:
        true,

      data:
        transaction,
    };
  } catch (error) {
    return {
      success:
        false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to load FINORA Wallet transaction.",
    };
  }
}

/* ============================================================
   APPEND TRANSACTION
============================================================ */

export async function appendWalletTransaction(
  transaction: WalletTransaction,
): Promise<StorageResult<WalletTransaction>> {
  const validationError =
    validateTransactionForPersistence(transaction);

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

  const existing =
    await storageManager.get<WalletTransactionStorageRecord>(
      buildWalletTransactionQuery({
        id:
          transaction.id,
      }),
    );

  if (!existing.success) {
    return {
      success:
        false,

      error:
        existing.error ??
        "Unable to verify Wallet transaction uniqueness.",
    };
  }

  if (existing.data) {
    return {
      success:
        false,

      error:
        "FINORA Wallet transaction already exists.",
    };
  }

  const result =
    await storageManager.save<WalletTransactionStorageRecord>(
      toWalletTransactionStorageRecord(transaction),
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to persist FINORA Wallet transaction.",
    };
  }

  return {
    success:
      true,

    data:
      transaction,
  };
}

/* ============================================================
   GET TRANSACTIONS BY WALLET
============================================================ */

export async function getTransactionsByWalletResult(
  walletId: WalletId,
): Promise<StorageResult<WalletTransaction[]>> {
  const normalizedWalletId =
    String(walletId ?? "").trim();

  if (!normalizedWalletId) {
    return {
      success:
        false,

      error:
        "Wallet ID is required before loading transaction history.",
    };
  }

  const result =
    await getWalletTransactionsResult();

  if (!result.success) {
    return result;
  }

  const transactions =
    (result.data ?? [])
      .filter(
        (transaction) =>
          transaction.walletId === normalizedWalletId,
      )
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      );

  return {
    success:
      true,

    data:
      transactions,
  };
}

/* ============================================================
   FINALIZE PENDING TRANSACTION
============================================================ */

/**
 * Controlled lifecycle update for a transaction that was
 * already appended in PENDING state.
 *
 * ALLOWED:
 *
 *   PENDING -> SUCCESS
 *   PENDING -> FAILED
 *
 * NOT ALLOWED:
 *
 * - Editing SUCCESS history
 * - Editing FAILED history
 * - Changing transaction identity
 * - Changing Wallet scope
 * - Changing amount
 *
 * This exception preserves append-only financial history while
 * allowing crash-recoverable two-phase Wallet commits.
 */
export async function finalizePendingWalletTransaction(
  transaction: WalletTransaction,
): Promise<StorageResult<WalletTransaction>> {
  const validationError =
    validateTransactionForPersistence(transaction);

  if (validationError) {
    return {
      success:
        false,

      error:
        validationError,
    };
  }

  if (
    transaction.status !== "SUCCESS" &&
    transaction.status !== "FAILED"
  ) {
    return {
      success:
        false,

      error:
        "Pending Wallet transaction may only finalize as SUCCESS or FAILED.",
    };
  }

  const existingResult =
    await storageManager.get<WalletTransactionStorageRecord>(
      buildWalletTransactionQuery({
        id:
          transaction.id,
      }),
    );

  if (!existingResult.success) {
    return {
      success:
        false,

      error:
        existingResult.error ??
        "Unable to load pending Wallet transaction for finalization.",
    };
  }

  const existing =
    existingResult.data;

  if (!existing) {
    return {
      success:
        false,

      error:
        "Pending Wallet transaction was not found.",
    };
  }

  if (existing.status !== "PENDING") {
    return {
      success:
        false,

      error:
        "Only a PENDING Wallet transaction may be finalized.",
    };
  }

  if (
    existing.walletId !== transaction.walletId ||
    existing.ownerId !== transaction.ownerId ||
    existing.businessId !== transaction.businessId ||
    existing.branchId !== transaction.branchId ||
    existing.type !== transaction.type ||
    existing.direction !== transaction.direction ||
    existing.amount !== transaction.amount
  ) {
    return {
      success:
        false,

      error:
        "Wallet transaction immutable financial fields cannot be changed.",
    };
  }

  /*
   * Finalization is intentionally allow-listed.
   *
   * The authoritative PENDING ledger record owns all
   * financial, identity, source and descriptive metadata.
   *
   * Only lifecycle fields required by the two-phase commit
   * may change during finalization:
   *
   * - status
   * - remarks
   * - updatedAt
   */
  const finalizedRecord:
    WalletTransactionStorageRecord = {
      ...existing,

      status:
        transaction.status,

      remarks:
        transaction.remarks,

      updatedAt:
        transaction.updatedAt,

      entity:
        WALLET_TRANSACTION_ENTITY,
    };

  const result =
    await storageManager.update<WalletTransactionStorageRecord>(
      finalizedRecord,
    );

  if (!result.success) {
    return {
      success:
        false,

      error:
        result.error ??
        "Unable to finalize pending Wallet transaction.",
    };
  }

  return {
    success:
      true,

    data:
      finalizedRecord,
  };
}
/* ============================================================
   COMPATIBILITY READ HELPERS
============================================================ */

export async function getWalletTransactionById(
  transactionId: WalletTransactionId,
): Promise<WalletTransaction | undefined> {
  const result =
    await getWalletTransactionByIdResult(transactionId);

  if (!result.success) {
    return undefined;
  }

  return result.data;
}

export async function getTransactionsByWallet(
  walletId: WalletId,
): Promise<WalletTransaction[]> {
  const result =
    await getTransactionsByWalletResult(walletId);

  if (!result.success) {
    return [];
  }

  return result.data ?? [];
}

/* ============================================================
   END
============================================================ */
