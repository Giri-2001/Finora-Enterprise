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
  WalletMutationRecoverySnapshot,
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
  convertWalletMoneyToMinorUnits,
} from "./walletBalanceService";

import {
  buildWalletRechargeIdempotencyKey,
  buildWalletTransactionId,
} from "./wallet.identity";

import {
  FINORA_WALLET_RECHARGE_SUCCESS_REMARK,
  FINORA_WALLET_RECHARGE_TITLE,
} from "./wallet.constants";
import {
  publishWalletBalanceUpdate,
} from "./walletBalanceEvent";

import {
  runSerializedWalletMutation,
} from "./walletMutationCoordinator";
import {
  recoverPendingWalletMutationWithinSerializedBoundary,
} from "./walletPendingMutationRecoveryService";

import {
  resolveSignedWalletRechargeAuthorization,
} from "./finoraWalletRechargeAuthorizationService";

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
    | "PENDING_RECOVERY_FAILED"
    | "SIGNED_AUTHORIZATION_FAILED"
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

  verification:
    WalletPaymentVerificationSuccess;

  paymentMethod:
    WalletRechargeTransaction["paymentMethod"];
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

  /**
   * Authoritative completion lookup key.
   *
   * Signed amount/source/method/provider evidence is resolved
   * internally from the native-verified authorization.
   */
  paymentReference:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}


/* ============================================================
   COMMIT VERIFIED RECHARGE
============================================================ */

export async function commitVerifiedWalletRecharge(
  input: CommitVerifiedWalletRechargeInput,
): Promise<WalletRechargeServiceResult> {
  const walletId =
    String(input.walletId ?? "").trim();

  const ownerId =
    String(input.ownerId ?? "").trim();

  const businessId =
    String(input.businessId ?? "").trim();

  const branchId =
    String(input.branchId ?? "").trim();

  /*
   * The incoming verification object is NOT a trust boundary.
   *
   * Only its paymentReference is used as a lookup key.
   * Amount/source/provider evidence is re-resolved from the
   * native-verified signed authorization inside the serialized
   * Wallet mutation boundary.
   */
  const paymentReference =
    String(
      input.paymentReference ?? "",
    ).trim();

  if (
    !walletId ||
    !ownerId ||
    !businessId ||
    !branchId ||
    !paymentReference
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Valid Wallet ID, Wallet scope and payment reference are required.",
    };
  }

  return runSerializedWalletMutation(
    walletId,
    async () => {
  /* ==========================================================
     RECOVER INTERRUPTED WALLET MUTATION

     The same-Wallet serialization boundary is already owned
     by this Recharge commit. Recovery must not acquire it again.
  ========================================================== */

  const recoveryResult =
    await recoverPendingWalletMutationWithinSerializedBoundary({
      walletId,

      ownerId,

      businessId,

      branchId,
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
     RESOLVE NATIVE-VERIFIED SIGNED RECHARGE AUTHORIZATION

     Security order:

     1. Same-Wallet serialization already acquired.
     2. Existing PENDING mutation recovered first.
     3. Native-verified signed authorization resolved now.
     4. Fresh Wallet state loaded only after authorization passes.

     The caller-provided `verification` object does not authorize
     any balance mutation.
  ========================================================== */

  const authorizationResult =
    await resolveSignedWalletRechargeAuthorization({
      walletId,
      ownerId,
      businessId,
      branchId,
      paymentReference,
    });

  if (!authorizationResult.success) {
    return {
      success:
        false,

      errorCode:
        "SIGNED_AUTHORIZATION_FAILED",

      error:
        authorizationResult.error,
    };
  }

  const verification =
    authorizationResult.verification;

  const paymentMethod =
    authorizationResult.paymentMethod;

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
    wallet.ownerId !== ownerId ||
    wallet.businessId !== businessId ||
    wallet.branchId !== branchId
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
    const existingRecharge =
      existingTransaction.data;

    if (
      existingRecharge.status ===
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

    /*
     * Recovery-safe idempotent completion:
     *
     * Wallet credit may have succeeded while the Payment Intent
     * SUCCESS update failed afterwards. A retry must not credit
     * the Wallet again, but it may return the exact existing
     * successful Recharge so orchestration can finalize the
     * Payment Intent.
     */
    /*
     * Narrow the Wallet transaction union before reading
     * Recharge-only payment fields.
     */
    if (
      existingRecharge.type ===
      "WALLET_RECHARGE"
    ) {
      if (
        existingRecharge.status === "SUCCESS" &&
        existingRecharge.walletId === wallet.walletId &&
        existingRecharge.ownerId === ownerId &&
        existingRecharge.businessId === businessId &&
        existingRecharge.branchId === branchId &&
        existingRecharge.sourceType === "PAYMENT" &&
        existingRecharge.paymentReference === paymentReference &&
        existingRecharge.paymentSource ===
          verification.paymentSource &&
        existingRecharge.paymentMethod === paymentMethod &&
        Number.isSafeInteger(
          convertWalletMoneyToMinorUnits(
            existingRecharge.amount,
          ),
        ) &&
        convertWalletMoneyToMinorUnits(
          existingRecharge.amount,
        ) ===
          convertWalletMoneyToMinorUnits(
            verification.amount,
          )
      ) {
        return {
          success:
            true,

          data: {
            walletId:
              existingRecharge.walletId,

            amount:
              existingRecharge.amount,

            paymentReference,

            paymentSource:
              existingRecharge.paymentSource,

            transactionId:
              existingRecharge.id,

            availableBalance:
              existingRecharge.availableBalance,

            completedAt:
              existingRecharge.occurredAt,
          },

          verification,

          paymentMethod,
        };
      }
    }

    return {
      success:
        false,

      errorCode:
        "DUPLICATE_RECHARGE",

      error:
        "A Wallet transaction already exists for this payment reference but does not exactly match the signed Recharge authorization.",
    };
  }

  /* ==========================================================
     BALANCE TRANSITION
  ========================================================== */

  const balanceResult =
    calculateWalletRecharge(
      wallet.balance,
      verification.amount,
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

  /*
   * Wallet financial mutation time MUST come from the actual
   * system clock at commit time.
   *
   * Payment/native verifiedAt is verification evidence only and
   * must never drive occurredAt, createdAt, updatedAt,
   * lastTransactionAt or recoverySnapshot timestamps.
   */
  const now =
    new Date().toISOString();

  const idempotencyKey =
    buildWalletRechargeIdempotencyKey({
      walletId:
        wallet.walletId,

      paymentReference,
    });

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

      recoverySnapshot,

      referenceId:
        idempotencyKey,

      sourceId:
        paymentReference,

      sourceType:
        "PAYMENT",

      paymentReference,

      paymentMethod,

      paymentSource:
        verification.paymentSource,

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

  publishWalletBalanceUpdate({
    walletId:
      wallet.walletId,

    availableBalance:
      successTransaction.availableBalance,
  });

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

    verification,

    paymentMethod,
  };
  });
}

/* ============================================================
   END
============================================================ */
