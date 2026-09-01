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
  WalletTransactionType,
} from "../../types/wallet/wallet.types";

import type {
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
  buildWalletTransactionId,
} from "./wallet.identity";

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

  sourceId?:
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

  const sourceReference =
    String(input.sourceReference ?? "").trim();

  const title =
    String(input.title ?? "").trim();

  const remarks =
    String(input.remarks ?? "").trim();

  if (
    !walletId ||
    !sourceType ||
    !sourceReference ||
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
  ========================================================== */

  const transactionId =
    buildWalletTransactionId({
      walletId:
        wallet.walletId,

      sourceType,

      sourceReference,

      transactionKind:
        "DEBIT",
    });

  /* ==========================================================
     IDEMPOTENCY CHECK
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
        "Unable to verify Wallet debit idempotency.",
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
          "This FINORA Wallet debit already has a pending ledger record.",
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

      referenceId:
        sourceReference,

      sourceId:
        input.sourceId ?? sourceReference,

      sourceType,

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
      balanceResult.transition.balanceAfter,

    transactionCount:
      wallet.transactionCount + 1,

    lastTransactionAt:
      now,

    updatedAt:
      now,
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
}

/* ============================================================
   END
============================================================ */
