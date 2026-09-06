/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET DEBIT SERVICE

   RESPONSIBILITY:
   - Commit billable FINORA platform charges
   - Prevent duplicate Wallet debits
   - Enforce sufficient Wallet balance
   - Calculate authoritative debit transition
   - Persist recoverable PENDING ledger intent first
   - Persist updated Wallet account second
   - Finalize immutable Wallet ledger result

   IMPORTANT:
   - No React.
   - No UI.
   - No direct storage access.
   - No payment gateway logic.
   - No negative Wallet balance.
   - StorageManager does not expose atomic transactions.
   - Debit therefore uses a recoverable two-phase flow.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletAccount,
  WalletDebitTransaction,
  WalletMutationRecoverySnapshot,
  WalletTransactionType,
} from "../../types/wallet/wallet.types";

import type {
  WalletPlatformChargeCode,
  WalletTransactionSourceType,
} from "../../types/wallet/wallet.transaction.types";

import {
  getWalletByIdResult,
  updateWallet,
} from "../../repositories/wallet/walletRepository";

import {
  appendWalletTransaction,
  finalizePendingWalletTransaction,
  getWalletTransactionByIdResult,
} from "../../repositories/wallet/walletTransactionRepository";

import {
  calculateWalletDebit,
} from "./walletBalanceService";

import {
  buildWalletDebitIdempotencyKey,
  buildWalletTransactionId,
} from "./wallet.identity";
import {
  publishWalletBalanceUpdate,
} from "./walletBalanceEvent";

import {
  runSerializedWalletMutation,
} from "./walletMutationCoordinator";
import {
  recoverPendingWalletMutationWithinSerializedBoundary,
} from "./walletPendingMutationRecoveryService";

/* ============================================================
   RESULT
============================================================ */

export interface WalletDebitServiceFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "WALLET_NOT_FOUND"
    | "WALLET_NOT_ACTIVE"
    | "INSUFFICIENT_BALANCE"
    | "DUPLICATE_DEBIT"
    | "PENDING_RECOVERY_FAILED"
    | "DEBIT_IN_PROGRESS"
    | "LEDGER_WRITE_FAILED"
    | "WALLET_UPDATE_FAILED"
    | "LEDGER_FINALIZE_FAILED";

  error:
    string;
}

export interface WalletDebitServiceSuccess {
  success:
    true;

  data: {
    walletId:
      string;

    transactionId:
      string;

    amount:
      number;

    availableBalance:
      number;

    completedAt:
      string;
  };
}

export type WalletDebitServiceResult =
  | WalletDebitServiceSuccess
  | WalletDebitServiceFailure;

/* ============================================================
   INPUT
============================================================ */

export interface CommitWalletDebitInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  chargeCode:
    WalletPlatformChargeCode;

  type:
    WalletTransactionType;

  amount:
    number;

  title:
    string;

  remarks:
    string;

  sourceType:
    WalletTransactionSourceType;

  sourceReference:
    string;

  sourceId:
    string;
}

/* ============================================================
   COMMIT DEBIT
============================================================ */

export async function commitWalletDebit(
  input: CommitWalletDebitInput,
): Promise<WalletDebitServiceResult> {
  const walletId =
    String(input.walletId ?? "").trim();

  const sourceType =
    input.sourceType;

  const chargeCode =
    input.chargeCode;

  const sourceReference =
    String(input.sourceReference ?? "").trim();

  const sourceId =
    String(input.sourceId ?? "").trim();

  const title =
    String(input.title ?? "").trim();

  const remarks =
    String(input.remarks ?? "").trim();

  if (
    !walletId ||
    !sourceType ||
    !chargeCode ||
    !sourceReference ||
    !sourceId ||
    !title ||
    !remarks ||
    !Number.isFinite(input.amount) ||
    input.amount <= 0
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Valid Wallet debit input is required.",
    };
  }

  if (input.type === "WALLET_RECHARGE") {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet Recharge cannot be processed as a Wallet debit.",
    };
  }

  return runSerializedWalletMutation(
    walletId,
    async () => {
  /* ==========================================================
     RECOVER INTERRUPTED WALLET MUTATION

     The same-Wallet serialization boundary is already owned
     by this Debit commit. Recovery must not acquire it again.
  ========================================================== */

  const recoveryResult =
    await recoverPendingWalletMutationWithinSerializedBoundary({
      walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,
    });

  if (!recoveryResult.success) {
    return {
      success:
        false,

      errorCode:
        "PENDING_RECOVERY_FAILED",

      error:
        `FINORA Wallet has an unresolved PENDING mutation: ${recoveryResult.error}`,
    };
  }

  /* ==========================================================
     LOAD WALLET
  ========================================================== */

  const walletResult =
    await getWalletByIdResult(walletId);

  if (!walletResult.success) {
    return {
      success:
        false,

      errorCode:
        "WALLET_NOT_FOUND",

      error:
        walletResult.error ??
        "Unable to load FINORA Wallet.",
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
        "FINORA Wallet was not found.",
    };
  }

  if (wallet.status !== "ACTIVE") {
    return {
      success:
        false,

      errorCode:
        "WALLET_NOT_ACTIVE",

      error:
        "FINORA Wallet is not active.",
    };
  }

  /* ==========================================================
     SCOPE CHECK
  ========================================================== */

  if (
    wallet.ownerId !== input.ownerId ||
    wallet.businessId !== input.businessId ||
    wallet.branchId !== input.branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet debit scope does not match the authoritative Wallet.",
    };
  }

  /* ==========================================================
     DETERMINISTIC IDS

     New platform Debit identity is charge-aware and uses the
     stable source entity ID.

     legacyTransactionId preserves detection of historical
     Debit records created before charge-aware identity.
  ========================================================== */

  const transactionId =
    buildWalletDebitIdempotencyKey({
      walletId:
        wallet.walletId,

      sourceType,

      sourceId,

      chargeCode,
    });

  const legacyTransactionId =
    buildWalletTransactionId({
      walletId:
        wallet.walletId,

      sourceType,

      sourceReference,

      transactionKind:
        "DEBIT",
    });

  /* ==========================================================
     CHARGE-AWARE IDEMPOTENCY CHECK
  ========================================================== */

  const existingTransaction =
    await getWalletTransactionByIdResult(
      transactionId,
    );

  if (!existingTransaction.success) {
    return {
      success:
        false,

      errorCode:
        "LEDGER_WRITE_FAILED",

      error:
        existingTransaction.error ??
        "Unable to verify charge-aware Wallet debit idempotency.",
    };
  }

  if (existingTransaction.data) {
    if (
      existingTransaction.data.status ===
      "PENDING"
    ) {
      return {
        success:
          false,

        errorCode:
          "DEBIT_IN_PROGRESS",

        error:
          "This FINORA Wallet debit already has a pending charge-aware ledger record.",
      };
    }

    return {
      success:
        false,

      errorCode:
        "DUPLICATE_DEBIT",

      error:
        "This FINORA Wallet charge has already been processed.",
    };
  }

  /* ==========================================================
     LEGACY IDEMPOTENCY COMPATIBILITY

     Historical Debit records used:
       Wallet + DEBIT + sourceType + sourceReference

     They did not include sourceId + chargeCode in transaction
     identity. Keep checking that identity so an existing Loan
     platform fee cannot be charged again after migration.
  ========================================================== */

  const legacyExistingTransaction =
    await getWalletTransactionByIdResult(
      legacyTransactionId,
    );

  if (!legacyExistingTransaction.success) {
    return {
      success:
        false,

      errorCode:
        "LEDGER_WRITE_FAILED",

      error:
        legacyExistingTransaction.error ??
        "Unable to verify historical Wallet debit idempotency.",
    };
  }

  if (legacyExistingTransaction.data) {
    if (
      legacyExistingTransaction.data.status ===
      "PENDING"
    ) {
      return {
        success:
          false,

        errorCode:
          "DEBIT_IN_PROGRESS",

        error:
          "This FINORA Wallet debit already has a historical pending ledger record.",
      };
    }

    return {
      success:
        false,

      errorCode:
        "DUPLICATE_DEBIT",

      error:
        "This FINORA Wallet charge was already processed under the historical Debit identity.",
    };
  }
  /* ==========================================================
     BALANCE TRANSITION
  ========================================================== */

  const balanceResult =
    calculateWalletDebit(
      wallet.balance,
      input.amount,
    );

  if (!balanceResult.success) {
    return {
      success:
        false,

      errorCode:
        balanceResult.errorCode ===
        "INSUFFICIENT_BALANCE"
          ? "INSUFFICIENT_BALANCE"
          : "INVALID_INPUT",

      error:
        balanceResult.error,
    };
  }

  const now =
    new Date().toISOString();

  const recoverySnapshot:
    WalletMutationRecoverySnapshot = {
      walletBefore: {
        balance:
          wallet.balance,

        transactionCount:
          wallet.transactionCount,

        lastTransactionAt:
          wallet.lastTransactionAt,

        updatedAt:
          wallet.updatedAt,
      },

      walletAfter: {
        balance:
          balanceResult.transition.balanceAfter,

        transactionCount:
          wallet.transactionCount + 1,

        lastTransactionAt:
          now,

        updatedAt:
          now,
      },

      schemaVersion:
        1,
    };

  /* ==========================================================
     PENDING LEDGER
  ========================================================== */

  const pendingTransaction:
    WalletDebitTransaction = {
      id:
        transactionId,

      entity:
        "WALLET_TRANSACTION",

      walletId:
        wallet.walletId,

      ownerId:
        wallet.ownerId,

      businessId:
        wallet.businessId,

      branchId:
        wallet.branchId,

      type:
        input.type,

      direction:
        "DEBIT",

      moneyFlow:
        "MONEY_OUT",

      status:
        "PENDING",

      amount:
        balanceResult.transition.amount,

      title,

      remarks,

      occurredAt:
        now,

      availableBalance:
        balanceResult.transition.balanceAfter,

      recoverySnapshot,

      referenceId:
        sourceReference,

      sourceId,

      sourceType,

      chargeCode,

      chargeReason:
        input.type,

      createdAt:
        now,

      updatedAt:
        now,

      schemaVersion:
        1,
    };

  /* ==========================================================
     PHASE 1 - APPEND PENDING LEDGER
  ========================================================== */

  const pendingLedgerResult =
    await appendWalletTransaction(
      pendingTransaction,
    );

  if (!pendingLedgerResult.success) {
    return {
      success:
        false,

      errorCode:
        "LEDGER_WRITE_FAILED",

      error:
        pendingLedgerResult.error ??
        "Unable to create pending FINORA Wallet debit ledger record.",
    };
  }

  /* ==========================================================
     UPDATE WALLET
  ========================================================== */

  const updatedWallet: WalletAccount = {
    ...wallet,

    balance:
      recoverySnapshot.walletAfter.balance,

    transactionCount:
      recoverySnapshot.walletAfter.transactionCount,

    lastTransactionAt:
      recoverySnapshot.walletAfter.lastTransactionAt,

    updatedAt:
      recoverySnapshot.walletAfter.updatedAt,
  };

  /* ==========================================================
     PHASE 2 - UPDATE WALLET
  ========================================================== */

  const walletUpdateResult =
    await updateWallet(updatedWallet);

  if (!walletUpdateResult.success) {
    const failedTransaction:
      WalletDebitTransaction = {
        ...pendingTransaction,

        status:
          "FAILED",

        remarks:
          `${remarks} Debit could not be committed.`,

        updatedAt:
          new Date().toISOString(),
      };

    await finalizePendingWalletTransaction(
      failedTransaction,
    );

    return {
      success:
        false,

      errorCode:
        "WALLET_UPDATE_FAILED",

      error:
        walletUpdateResult.error ??
        "Unable to update FINORA Wallet after debit.",
    };
  }

  /* ==========================================================
     PHASE 3 - FINALIZE SUCCESS
  ========================================================== */

  const successTransaction:
    WalletDebitTransaction = {
      ...pendingTransaction,

      status:
        "SUCCESS",

      updatedAt:
        new Date().toISOString(),
    };

  const ledgerFinalizeResult =
    await finalizePendingWalletTransaction(
      successTransaction,
    );

  if (!ledgerFinalizeResult.success) {
    return {
      success:
        false,

      errorCode:
        "LEDGER_FINALIZE_FAILED",

      error:
        ledgerFinalizeResult.error ??
        "FINORA Wallet balance was debited, but ledger finalization is pending recovery.",
    };
  }


  publishWalletBalanceUpdate({
    walletId:
      wallet.walletId,

    availableBalance:
      successTransaction.availableBalance,
  });

  return {
    success:
      true,

    data: {
      walletId:
        wallet.walletId,

      transactionId:
        successTransaction.id,

      amount:
        successTransaction.amount,

      availableBalance:
        successTransaction.availableBalance,

      completedAt:
        now,
    },
  };
  });
}

/* ============================================================
   END
============================================================ */
