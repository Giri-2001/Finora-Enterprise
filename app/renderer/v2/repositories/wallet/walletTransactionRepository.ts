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

import {
  isWalletPlatformChargeCode,
  isWalletPlatformChargeTransactionTypeMatch,
} from "../../types/wallet/wallet.transaction.types";

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
   RECOVERY SNAPSHOT VALIDATION
============================================================ */

function normalizeWalletPersistenceMoney(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

/* ============================================================
   PLATFORM CHARGE METADATA VALIDATION

   Historical Debit ledger records may predate chargeCode and
   therefore remain valid when the field is absent.

   Once chargeCode is present it is authoritative machine
   metadata and must:
   - be a canonical Wallet platform charge code
   - map to the exact canonical Wallet transaction type

   WALLET_RECHARGE is never a platform Debit and must never
   persist a runtime-injected chargeCode.
============================================================ */

function validatePlatformChargeMetadataForPersistence(
  transaction:
    WalletTransaction,
): string | undefined {

  const runtimeTransaction =
    transaction as WalletTransaction & {
      chargeCode?:
        unknown;
    };

  const chargeCode =
    runtimeTransaction.chargeCode;

  if (
    transaction.type ===
    "WALLET_RECHARGE"
  ) {
    if (
      chargeCode !==
      undefined
    ) {
      return "Wallet recharge transactions cannot carry a FINORA platform charge code.";
    }

    return undefined;
  }

  /*
   * Historical Debit compatibility:
   *
   * Old committed Debit records were created before chargeCode
   * became persisted machine-readable metadata.
   */
  if (
    chargeCode ===
    undefined
  ) {
    return undefined;
  }

  if (
    !isWalletPlatformChargeCode(
      chargeCode,
    )
  ) {
    return "Wallet Debit platform charge code is not canonical.";
  }

  if (
    !isWalletPlatformChargeTransactionTypeMatch(
      chargeCode,
      transaction.type,
    )
  ) {
    return "Wallet Debit platform charge code does not match the canonical transaction type.";
  }

  return undefined;
}
function validateRecoverySnapshotForPersistence(
  transaction: WalletTransaction,
): string | undefined {
  const snapshot =
    transaction.recoverySnapshot;

  /*
   * Historical Wallet transactions predate recovery snapshots.
   * Their absence remains valid for backward compatibility.
   */
  if (!snapshot) {
    return undefined;
  }

  if (snapshot.schemaVersion !== 1) {
    return "Wallet recovery snapshot schema version is invalid.";
  }

  const before =
    snapshot.walletBefore;

  const after =
    snapshot.walletAfter;

  if (
    !before ||
    !after
  ) {
    return "Wallet recovery snapshot requires before and after Wallet state.";
  }

  const beforeBalance =
    normalizeWalletPersistenceMoney(
      before.balance,
    );

  const afterBalance =
    normalizeWalletPersistenceMoney(
      after.balance,
    );

  const amount =
    normalizeWalletPersistenceMoney(
      transaction.amount,
    );

  const transactionAvailableBalance =
    normalizeWalletPersistenceMoney(
      transaction.availableBalance,
    );

  if (
    !Number.isFinite(beforeBalance) ||
    beforeBalance < 0 ||
    beforeBalance !== before.balance
  ) {
    return "Wallet recovery before-balance must be a canonical non-negative two-decimal amount.";
  }

  if (
    !Number.isFinite(afterBalance) ||
    afterBalance < 0 ||
    afterBalance !== after.balance
  ) {
    return "Wallet recovery after-balance must be a canonical non-negative two-decimal amount.";
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount !== transaction.amount
  ) {
    return "Wallet recovery transaction amount must be a canonical positive two-decimal amount.";
  }

  if (
    !Number.isFinite(
      transactionAvailableBalance,
    ) ||
    transactionAvailableBalance !==
      transaction.availableBalance ||
    transactionAvailableBalance !==
      afterBalance
  ) {
    return "Wallet recovery after-balance must match transaction available balance.";
  }

  if (
    !Number.isInteger(
      before.transactionCount,
    ) ||
    before.transactionCount < 0
  ) {
    return "Wallet recovery before transaction count must be a non-negative integer.";
  }

  if (
    !Number.isInteger(
      after.transactionCount,
    ) ||
    after.transactionCount < 1 ||
    after.transactionCount !==
      before.transactionCount + 1
  ) {
    return "Wallet recovery after transaction count must increment exactly once.";
  }

  if (
    !String(
      before.updatedAt ?? "",
    ).trim()
  ) {
    return "Wallet recovery before updated timestamp is required.";
  }

  if (
    !String(
      after.lastTransactionAt ?? "",
    ).trim() ||
    !String(
      after.updatedAt ?? "",
    ).trim()
  ) {
    return "Wallet recovery after mutation timestamps are required.";
  }

  if (
    after.lastTransactionAt !==
    after.updatedAt
  ) {
    return "Wallet recovery after mutation timestamps must match.";
  }

  let expectedAfterBalance:
    number;

  if (
    transaction.direction ===
    "DEBIT"
  ) {
    expectedAfterBalance =
      normalizeWalletPersistenceMoney(
        beforeBalance - amount,
      );
  } else if (
    transaction.direction ===
    "CREDIT"
  ) {
    expectedAfterBalance =
      normalizeWalletPersistenceMoney(
        beforeBalance + amount,
      );
  } else {
    return "Wallet recovery snapshot transaction direction is unsupported.";
  }

  if (
    !Number.isFinite(
      expectedAfterBalance,
    ) ||
    expectedAfterBalance < 0 ||
    expectedAfterBalance !==
      afterBalance
  ) {
    return "Wallet recovery snapshot financial transition is inconsistent.";
  }

  return undefined;
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

  const chargeMetadataError =
    validatePlatformChargeMetadataForPersistence(
      transaction,
    );

  if (chargeMetadataError) {
    return chargeMetadataError;
  }

  const recoverySnapshotError =
    validateRecoverySnapshotForPersistence(
      transaction,
    );

  if (recoverySnapshotError) {
    return recoverySnapshotError;
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
