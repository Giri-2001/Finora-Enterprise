/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   PENDING WALLET MUTATION RECOVERY SERVICE

   RESPONSIBILITY:
   - Recover one interrupted Wallet two-phase mutation
   - Detect whether the Wallet mutation was already applied
   - Resume a proven not-applied Wallet mutation exactly once
   - Finalize recovered PENDING ledger records as SUCCESS
   - Fail closed on legacy or ambiguous recovery evidence
   - Share the same per-Wallet serialization boundary as normal
     Debit and Recharge mutations

   IMPORTANT:
   - No React.
   - No UI.
   - No Business Date.
   - No direct StorageManager access.
   - No new financial calculation is invented during recovery.
   - recoverySnapshot is the persisted mutation authority.
   - Multiple PENDING records are never guessed through.
   - Historical PENDING records without recoverySnapshot are not
     automatically mutated.
============================================================ */

import type {
  WalletAccount,
  WalletTransaction,
  WalletMutationRecoverySnapshot,
} from "../../types/wallet/wallet.types";

import {
  getWalletByIdResult,
  updateWallet,
} from "../../repositories/wallet/walletRepository";

import {
  finalizePendingWalletTransaction,
  getTransactionsByWalletResult,
} from "../../repositories/wallet/walletTransactionRepository";

import {
  classifyPendingWalletMutationBalance,
} from "./walletPendingMutationRecoveryEngine";

import {
  runSerializedWalletMutation,
} from "./walletMutationCoordinator";

import {
  publishWalletBalanceUpdate,
} from "./walletBalanceEvent";

import {
  FINORA_WALLET_RECHARGE_SUCCESS_REMARK,
} from "./wallet.constants";

/* ============================================================
   INPUT
============================================================ */

export interface RecoverPendingWalletMutationInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

/* ============================================================
   RESULT
============================================================ */

export type WalletPendingMutationRecoveryStatus =
  | "NO_PENDING"
  | "RECOVERED_ALREADY_APPLIED"
  | "RECOVERED_BY_APPLYING";

export interface WalletPendingMutationRecoverySuccess {
  success:
    true;

  data: {
    status:
      WalletPendingMutationRecoveryStatus;

    walletId:
      string;

    transactionId?:
      string;

    availableBalance:
      number;
  };
}

export interface WalletPendingMutationRecoveryFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "WALLET_NOT_FOUND"
    | "WALLET_READ_FAILED"
    | "SCOPE_MISMATCH"
    | "HISTORY_READ_FAILED"
    | "MULTIPLE_PENDING"
    | "LEGACY_PENDING_UNRECOVERABLE"
    | "RECOVERY_AMBIGUOUS"
    | "WALLET_UPDATE_FAILED"
    | "LEDGER_FINALIZE_FAILED";

  error:
    string;
}

export type WalletPendingMutationRecoveryResult =
  | WalletPendingMutationRecoverySuccess
  | WalletPendingMutationRecoveryFailure;

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeRequiredId(
  value: string,
): string {
  return String(
    value ?? "",
  ).trim();
}

function normalizeOptionalTimestamp(
  value: string | undefined,
): string | undefined {
  const normalized =
    String(
      value ?? "",
    ).trim();

  return normalized ||
    undefined;
}

/* ============================================================
   SCOPE
============================================================ */

function transactionMatchesWalletScope(
  wallet: WalletAccount,
  transaction: WalletTransaction,
): boolean {
  return (
    transaction.walletId ===
      wallet.walletId &&
    transaction.ownerId ===
      wallet.ownerId &&
    transaction.businessId ===
      wallet.businessId &&
    transaction.branchId ===
      wallet.branchId
  );
}

/* ============================================================
   SNAPSHOT STRUCTURE
============================================================ */

function snapshotMatchesTransaction(
  transaction: WalletTransaction,
  snapshot: WalletMutationRecoverySnapshot,
): boolean {
  const balanceDecision =
    classifyPendingWalletMutationBalance(
      snapshot.walletBefore.balance,
      transaction,
    );

  if (
    balanceDecision.state !==
    "NOT_APPLIED"
  ) {
    return false;
  }

  if (
    balanceDecision.expectedBalanceBefore !==
      snapshot.walletBefore.balance ||
    balanceDecision.expectedBalanceAfter !==
      snapshot.walletAfter.balance
  ) {
    return false;
  }

  if (
    snapshot.walletAfter.balance !==
    transaction.availableBalance
  ) {
    return false;
  }

  if (
    !Number.isInteger(
      snapshot.walletBefore.transactionCount,
    ) ||
    snapshot.walletBefore.transactionCount < 0 ||
    !Number.isInteger(
      snapshot.walletAfter.transactionCount,
    ) ||
    snapshot.walletAfter.transactionCount !==
      snapshot.walletBefore.transactionCount + 1
  ) {
    return false;
  }

  const afterLastTransactionAt =
    normalizeOptionalTimestamp(
      snapshot.walletAfter.lastTransactionAt,
    );

  const afterUpdatedAt =
    normalizeOptionalTimestamp(
      snapshot.walletAfter.updatedAt,
    );

  if (
    !afterLastTransactionAt ||
    !afterUpdatedAt ||
    afterLastTransactionAt !==
      afterUpdatedAt
  ) {
    return false;
  }

  if (
    !normalizeOptionalTimestamp(
      snapshot.walletBefore.updatedAt,
    )
  ) {
    return false;
  }

  return snapshot.schemaVersion === 1;
}

/* ============================================================
   WALLET SNAPSHOT COMPARISON
============================================================ */

function walletMatchesBeforeSnapshot(
  wallet: WalletAccount,
  snapshot: WalletMutationRecoverySnapshot,
): boolean {
  return (
    wallet.balance ===
      snapshot.walletBefore.balance &&
    wallet.transactionCount ===
      snapshot.walletBefore.transactionCount &&
    normalizeOptionalTimestamp(
      wallet.lastTransactionAt,
    ) ===
      normalizeOptionalTimestamp(
        snapshot.walletBefore.lastTransactionAt,
      ) &&
    wallet.updatedAt ===
      snapshot.walletBefore.updatedAt
  );
}

function walletMatchesAfterSnapshot(
  wallet: WalletAccount,
  snapshot: WalletMutationRecoverySnapshot,
): boolean {
  return (
    wallet.balance ===
      snapshot.walletAfter.balance &&
    wallet.transactionCount ===
      snapshot.walletAfter.transactionCount &&
    normalizeOptionalTimestamp(
      wallet.lastTransactionAt,
    ) ===
      normalizeOptionalTimestamp(
        snapshot.walletAfter.lastTransactionAt,
      ) &&
    wallet.updatedAt ===
      snapshot.walletAfter.updatedAt
  );
}

/* ============================================================
   SUCCESS REMARK
============================================================ */

function resolveRecoveredSuccessRemark(
  transaction: WalletTransaction,
): string {
  if (
    transaction.type ===
    "WALLET_RECHARGE"
  ) {
    return FINORA_WALLET_RECHARGE_SUCCESS_REMARK;
  }

  return transaction.remarks;
}

/* ============================================================
   FINALIZE RECOVERED SUCCESS
============================================================ */

async function finalizeRecoveredSuccess(
  transaction: WalletTransaction,
): Promise<WalletPendingMutationRecoveryFailure | undefined> {
  const successTransaction:
    WalletTransaction = {
      ...transaction,

      status:
        "SUCCESS",

      remarks:
        resolveRecoveredSuccessRemark(
          transaction,
        ),

      updatedAt:
        new Date().toISOString(),
    };

  const finalizeResult =
    await finalizePendingWalletTransaction(
      successTransaction,
    );

  if (!finalizeResult.success) {
    return {
      success:
        false,

      errorCode:
        "LEDGER_FINALIZE_FAILED",

      error:
        finalizeResult.error ??
        "FINORA Wallet recovery applied the Wallet state, but ledger finalization is still pending.",
    };
  }

  return undefined;
}

/* ============================================================
   RECOVERY INSIDE EXISTING SERIALIZED BOUNDARY
============================================================ */

/**
 * Use this entry only when the caller already owns the
 * runSerializedWalletMutation boundary for this Wallet ID.
 *
 * Debit and Recharge services use this form to avoid nested
 * same-Wallet queue acquisition.
 */
export async function recoverPendingWalletMutationWithinSerializedBoundary(
  input: RecoverPendingWalletMutationInput,
): Promise<WalletPendingMutationRecoveryResult> {
  const walletId =
    normalizeRequiredId(
      input.walletId,
    );

  const ownerId =
    normalizeRequiredId(
      input.ownerId,
    );

  const businessId =
    normalizeRequiredId(
      input.businessId,
    );

  const branchId =
    normalizeRequiredId(
      input.branchId,
    );

  if (
    !walletId ||
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet recovery requires Wallet, owner, business and branch identity.",
    };
  }

  /* ==========================================================
     LOAD AUTHORITATIVE WALLET
  ========================================================== */

  const walletResult =
    await getWalletByIdResult(
      walletId,
    );

  if (!walletResult.success) {
    return {
      success:
        false,

      errorCode:
        "WALLET_READ_FAILED",

      error:
        walletResult.error ??
        "Unable to load FINORA Wallet for recovery.",
    };
  }

  const wallet =
    walletResult.data;

  if (!wallet) {
    return {
      success:
        false,

      errorCode:
        "WALLET_NOT_FOUND",

      error:
        "FINORA Wallet was not found for recovery.",
    };
  }

  if (
    wallet.ownerId !== ownerId ||
    wallet.businessId !== businessId ||
    wallet.branchId !== branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "SCOPE_MISMATCH",

      error:
        "Wallet recovery scope does not match the authoritative Wallet.",
    };
  }

  /* ==========================================================
     LOAD WALLET LEDGER
  ========================================================== */

  const historyResult =
    await getTransactionsByWalletResult(
      wallet.walletId,
    );

  if (!historyResult.success) {
    return {
      success:
        false,

      errorCode:
        "HISTORY_READ_FAILED",

      error:
        historyResult.error ??
        "Unable to load FINORA Wallet ledger for recovery.",
    };
  }

  const history =
    historyResult.data ?? [];

  /*
   * A corrupted same-wallet transaction with a different
   * owner/business/branch scope invalidates automatic recovery.
   */
  if (
    history.some(
      (transaction) =>
        !transactionMatchesWalletScope(
          wallet,
          transaction,
        ),
    )
  ) {
    return {
      success:
        false,

      errorCode:
        "RECOVERY_AMBIGUOUS",

      error:
        "Wallet ledger scope is inconsistent. Automatic recovery was blocked.",
    };
  }

  const pendingTransactions =
    history.filter(
      (transaction) =>
        transaction.status ===
        "PENDING",
    );

  if (
    pendingTransactions.length === 0
  ) {
    return {
      success:
        true,

      data: {
        status:
          "NO_PENDING",

        walletId:
          wallet.walletId,

        availableBalance:
          wallet.balance,
      },
    };
  }

  if (
    pendingTransactions.length > 1
  ) {
    return {
      success:
        false,

      errorCode:
        "MULTIPLE_PENDING",

      error:
        "Multiple PENDING Wallet transactions require controlled manual recovery.",
    };
  }

  const pendingTransaction =
    pendingTransactions[0];

  const snapshot =
    pendingTransaction.recoverySnapshot;

  if (!snapshot) {
    return {
      success:
        false,

      errorCode:
        "LEGACY_PENDING_UNRECOVERABLE",

      error:
        "This historical PENDING Wallet transaction has no recovery snapshot and cannot be automatically resumed.",
    };
  }

  if (
    !snapshotMatchesTransaction(
      pendingTransaction,
      snapshot,
    )
  ) {
    return {
      success:
        false,

      errorCode:
        "RECOVERY_AMBIGUOUS",

      error:
        "Wallet recovery snapshot is inconsistent with the PENDING transaction.",
    };
  }

  const successfulTransactionCount =
    history.filter(
      (transaction) =>
        transaction.status ===
        "SUCCESS",
    ).length;

  const balanceDecision =
    classifyPendingWalletMutationBalance(
      wallet.balance,
      pendingTransaction,
    );

  if (
    balanceDecision.state ===
    "AMBIGUOUS"
  ) {
    return {
      success:
        false,

      errorCode:
        "RECOVERY_AMBIGUOUS",

      error:
        balanceDecision.reason,
    };
  }

  /* ==========================================================
     APPLIED
  ========================================================== */

  if (
    balanceDecision.state ===
    "APPLIED"
  ) {
    const metadataMatches =
      walletMatchesAfterSnapshot(
        wallet,
        snapshot,
      );

    const ledgerCountMatches =
      wallet.transactionCount ===
        successfulTransactionCount + 1 &&
      snapshot.walletAfter.transactionCount ===
        successfulTransactionCount + 1;

    if (
      !metadataMatches ||
      !ledgerCountMatches
    ) {
      return {
        success:
          false,

        errorCode:
          "RECOVERY_AMBIGUOUS",

        error:
          "Wallet balance appears applied, but Wallet metadata or ledger count does not match the persisted recovery after-state.",
      };
    }

    const finalizeFailure =
      await finalizeRecoveredSuccess(
        pendingTransaction,
      );

    if (finalizeFailure) {
      return finalizeFailure;
    }

    publishWalletBalanceUpdate({
      walletId:
        wallet.walletId,

      availableBalance:
        wallet.balance,
    });

    return {
      success:
        true,

      data: {
        status:
          "RECOVERED_ALREADY_APPLIED",

        walletId:
          wallet.walletId,

        transactionId:
          pendingTransaction.id,

        availableBalance:
          wallet.balance,
      },
    };
  }

  /* ==========================================================
     NOT APPLIED
  ========================================================== */

  const metadataMatches =
    walletMatchesBeforeSnapshot(
      wallet,
      snapshot,
    );

  const ledgerCountMatches =
    wallet.transactionCount ===
      successfulTransactionCount &&
    snapshot.walletBefore.transactionCount ===
      successfulTransactionCount;

  if (
    !metadataMatches ||
    !ledgerCountMatches
  ) {
    return {
      success:
        false,

      errorCode:
        "RECOVERY_AMBIGUOUS",

      error:
        "Wallet balance appears not applied, but Wallet metadata or ledger count does not match the persisted recovery before-state.",
    };
  }

  const recoveredWallet:
    WalletAccount = {
      ...wallet,

      balance:
        snapshot.walletAfter.balance,

      transactionCount:
        snapshot.walletAfter.transactionCount,

      lastTransactionAt:
        snapshot.walletAfter.lastTransactionAt,

      updatedAt:
        snapshot.walletAfter.updatedAt,
    };

  const walletUpdateResult =
    await updateWallet(
      recoveredWallet,
    );

  if (!walletUpdateResult.success) {
    return {
      success:
        false,

      errorCode:
        "WALLET_UPDATE_FAILED",

      error:
        walletUpdateResult.error ??
        "Unable to apply the proven PENDING FINORA Wallet mutation during recovery.",
    };
  }

  const finalizeFailure =
    await finalizeRecoveredSuccess(
      pendingTransaction,
    );

  if (finalizeFailure) {
    return finalizeFailure;
  }

  publishWalletBalanceUpdate({
    walletId:
      recoveredWallet.walletId,

    availableBalance:
      recoveredWallet.balance,
  });

  return {
    success:
      true,

    data: {
      status:
        "RECOVERED_BY_APPLYING",

      walletId:
        recoveredWallet.walletId,

      transactionId:
        pendingTransaction.id,

      availableBalance:
        recoveredWallet.balance,
    },
  };
}

/* ============================================================
   PUBLIC SERIALIZED RECOVERY
============================================================ */

export async function recoverPendingWalletMutation(
  input: RecoverPendingWalletMutationInput,
): Promise<WalletPendingMutationRecoveryResult> {
  const walletId =
    normalizeRequiredId(
      input.walletId,
    );

  if (!walletId) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet ID is required before Wallet recovery.",
    };
  }

  return runSerializedWalletMutation(
    walletId,
    async () =>
      recoverPendingWalletMutationWithinSerializedBoundary(
        input,
      ),
  );
}

/* ============================================================
   END
============================================================ */