/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET RECHARGE SERVICE

   RESPONSIBILITY:
   - Commit verified Wallet Recharge payments
   - Prevent duplicate payment credits
   - Calculate authoritative Wallet balance transition
   - Persist recoverable PENDING ledger intent first
   - Persist updated Wallet account second
   - Finalize immutable Wallet ledger result
   - Preserve provider-neutral payment metadata

   IMPORTANT:
   - No payment gateway API calls.
   - No webhook transport logic.
   - No React.
   - No UI.
   - No direct localStorage access.
   - No filesystem access.
   - Only VERIFIED payments may credit the Wallet.
   - StorageManager does not expose atomic transactions.
   - Recharge therefore uses a recoverable two-phase flow.

   VERSION : 1.1
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletAccount,
  WalletRechargeTransaction,
} from "../../types/wallet/wallet.types";

import type {
  WalletPaymentVerificationSuccess,
  WalletRechargeCompletionResult,
} from "../../types/wallet/wallet.payment.types";

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
  calculateWalletRecharge,
} from "./walletBalanceService";

import {
  buildWalletRechargeIdempotencyKey,
  buildWalletTransactionId,
} from "./wallet.identity";

import {
  FINORA_WALLET_RECHARGE_SUCCESS_REMARK,
  FINORA_WALLET_RECHARGE_TITLE,
} from "./wallet.constants";

/* ============================================================
   RESULT
============================================================ */

export interface WalletRechargeServiceFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "WALLET_NOT_FOUND"
    | "WALLET_NOT_ACTIVE"
    | "DUPLICATE_RECHARGE"
    | "RECHARGE_IN_PROGRESS"
    | "BALANCE_ERROR"
    | "LEDGER_WRITE_FAILED"
    | "WALLET_UPDATE_FAILED"
    | "LEDGER_FINALIZE_FAILED";

  error:
    string;
}

export interface WalletRechargeServiceSuccess {
  success:
    true;

  data:
    WalletRechargeCompletionResult;
}

export type WalletRechargeServiceResult =
  | WalletRechargeServiceSuccess
  | WalletRechargeServiceFailure;

/* ============================================================
   INPUT
============================================================ */

export interface CommitVerifiedWalletRechargeInput {
  walletId:
    string;

  verification:
    WalletPaymentVerificationSuccess;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

/* ============================================================
   PAYMENT METHOD RESOLUTION
============================================================ */

function resolveRechargePaymentMethod(
  paymentSource: WalletPaymentVerificationSuccess["paymentSource"],
): WalletRechargeTransaction["paymentMethod"] {
  switch (paymentSource) {
    case "PHONEPE":
      return "PHONEPE";

    case "GOOGLE_PAY":
      return "GOOGLE_PAY";

    case "PAYTM":
      return "PAYTM";

    case "RAZORPAY":
      return "RAZORPAY";

    case "BANK_TRANSFER":
      return "BANK_TRANSFER";

    default:
      return "UPI";
  }
}

/* ============================================================
   COMMIT VERIFIED RECHARGE
============================================================ */

export async function commitVerifiedWalletRecharge(
  input: CommitVerifiedWalletRechargeInput,
): Promise<WalletRechargeServiceResult> {
  const walletId =
    String(input.walletId ?? "").trim();

  const paymentReference =
    String(
      input.verification.paymentReference ?? "",
    ).trim();

  if (
    !walletId ||
    !paymentReference ||
    !Number.isFinite(input.verification.amount) ||
    input.verification.amount <= 0
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Valid Wallet ID, payment reference and recharge amount are required.",
    };
  }

  /* ==========================================================
     LOAD AUTHORITATIVE WALLET
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
        "Wallet Recharge scope does not match the authoritative Wallet.",
    };
  }

  /* ==========================================================
     DETERMINISTIC TRANSACTION ID
  ========================================================== */

  const transactionId =
    buildWalletTransactionId({
      walletId:
        wallet.walletId,

      sourceType:
        "PAYMENT",

      sourceReference:
        paymentReference,

      transactionKind:
        "RECHARGE",
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
        "Unable to verify Wallet Recharge idempotency.",
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
          "RECHARGE_IN_PROGRESS",

        error:
          "This FINORA Wallet Recharge already has a pending ledger record.",
      };
    }

    return {
      success:
        false,

      errorCode:
        "DUPLICATE_RECHARGE",

      error:
        "This Wallet Recharge payment has already been processed.",
    };
  }

  /* ==========================================================
     BALANCE TRANSITION
  ========================================================== */

  const balanceResult =
    calculateWalletRecharge(
      wallet.balance,
      input.verification.amount,
    );

  if (!balanceResult.success) {
    return {
      success:
        false,

      errorCode:
        "BALANCE_ERROR",

      error:
        balanceResult.error,
    };
  }

  const now =
    input.verification.verifiedAt ||
    new Date().toISOString();

  const idempotencyKey =
    buildWalletRechargeIdempotencyKey({
      walletId:
        wallet.walletId,

      paymentReference,
    });

  /* ==========================================================
     PENDING LEDGER RECORD
  ========================================================== */

  const pendingTransaction:
    WalletRechargeTransaction = {
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
        "WALLET_RECHARGE",

      direction:
        "CREDIT",

      moneyFlow:
        "MONEY_IN",

      status:
        "PENDING",

      amount:
        balanceResult.transition.amount,

      title:
        FINORA_WALLET_RECHARGE_TITLE,

      remarks:
        "FINORA Wallet recharge is being committed.",

      occurredAt:
        now,

      availableBalance:
        balanceResult.transition.balanceAfter,

      referenceId:
        idempotencyKey,

      sourceId:
        paymentReference,

      sourceType:
        "PAYMENT",

      paymentReference,

      paymentMethod:
        resolveRechargePaymentMethod(
          input.verification.paymentSource,
        ),

      paymentSource:
        input.verification.paymentSource,

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
        "Unable to create pending FINORA Wallet Recharge ledger record.",
    };
  }

  /* ==========================================================
     UPDATED WALLET
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
      WalletRechargeTransaction = {
        ...pendingTransaction,

        status:
          "FAILED",

        remarks:
          "FINORA Wallet recharge could not be committed.",

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
        "Unable to update FINORA Wallet after Recharge.",
    };
  }

  /* ==========================================================
     PHASE 3 - FINALIZE SUCCESS LEDGER
  ========================================================== */

  const successTransaction:
    WalletRechargeTransaction = {
      ...pendingTransaction,

      status:
        "SUCCESS",

      remarks:
        FINORA_WALLET_RECHARGE_SUCCESS_REMARK,

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
        "FINORA Wallet balance was updated, but Recharge ledger finalization is pending recovery.",
    };
  }

  /* ==========================================================
     SUCCESS
  ========================================================== */

  return {
    success:
      true,

    data: {
      walletId:
        wallet.walletId,

      amount:
        successTransaction.amount,

      paymentReference,

      paymentSource:
        successTransaction.paymentSource,

      transactionId:
        successTransaction.id,

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
