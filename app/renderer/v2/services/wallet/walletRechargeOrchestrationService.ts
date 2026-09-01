/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET RECHARGE ORCHESTRATION SERVICE

   RESPONSIBILITY:
   - Create provider-neutral Wallet recharge payment intents
   - Move created intents into PENDING state
   - Accept trusted verified payment results
   - Commit verified Wallet recharge through Wallet service
   - Finalize successful payment intent status

   IMPORTANT:
   - No React.
   - No UI.
   - No direct repository access.
   - No direct StorageManager access.
   - No gateway API calls.
   - No fake payment verification.
   - Wallet balance is credited only after verified payment.
============================================================ */

import type {
  WalletPaymentVerificationSuccess,
  WalletRechargeRequest,
} from "../../types/wallet/wallet.payment.types";

import {
  createWalletPaymentIntent,
  updateWalletPaymentIntentStatus,
} from "./walletPaymentIntentService";

import {
  commitVerifiedWalletRecharge,
} from "./walletRechargeService";

/* ============================================================
   START INPUT
============================================================ */

export interface StartWalletRechargeInput
  extends WalletRechargeRequest {
  paymentReference:
    string;

  providerOrderId?:
    string;
}

/* ============================================================
   COMPLETE INPUT
============================================================ */

export interface CompleteVerifiedWalletRechargeInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  verification:
    WalletPaymentVerificationSuccess;
}

/* ============================================================
   START RESULT
============================================================ */

export interface StartWalletRechargeSuccess {
  success:
    true;

  paymentReference:
    string;
}

export interface StartWalletRechargeFailure {
  success:
    false;

  errorCode:
    string;

  error:
    string;
}

export type StartWalletRechargeResult =
  | StartWalletRechargeSuccess
  | StartWalletRechargeFailure;

/* ============================================================
   COMPLETE RESULT
============================================================ */

export interface CompleteWalletRechargeSuccess {
  success:
    true;

  availableBalance:
    number;

  transactionId:
    string;
}

export interface CompleteWalletRechargeFailure {
  success:
    false;

  errorCode:
    string;

  error:
    string;
}

export type CompleteWalletRechargeResult =
  | CompleteWalletRechargeSuccess
  | CompleteWalletRechargeFailure;

/* ============================================================
   START RECHARGE
============================================================ */

export async function startWalletRecharge(
  input: StartWalletRechargeInput,
): Promise<StartWalletRechargeResult> {
  const paymentReference =
    String(input.paymentReference ?? "").trim();

  if (!paymentReference) {
    return {
      success:
        false,

      errorCode:
        "INVALID_PAYMENT_REFERENCE",

      error:
        "Wallet recharge payment reference is required.",
    };
  }

  const createResult =
    await createWalletPaymentIntent({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      amount:
        input.amount,

      paymentMethod:
        input.paymentMethod,

      paymentSource:
        input.paymentSource,

      paymentReference,

      providerOrderId:
        input.providerOrderId,
    });

  if (!createResult.success) {
    return {
      success:
        false,

      errorCode:
        createResult.errorCode,

      error:
        createResult.error,
    };
  }

  const pendingResult =
    await updateWalletPaymentIntentStatus({
      paymentReference,

      status:
        "PENDING",

      providerOrderId:
        input.providerOrderId,
    });

  if (!pendingResult.success) {
    return {
      success:
        false,

      errorCode:
        pendingResult.errorCode,

      error:
        pendingResult.error,
    };
  }

  return {
    success:
      true,

    paymentReference,
  };
}

/* ============================================================
   COMPLETE VERIFIED RECHARGE
============================================================ */

export async function completeVerifiedWalletRecharge(
  input: CompleteVerifiedWalletRechargeInput,
): Promise<CompleteWalletRechargeResult> {
  const rechargeResult =
    await commitVerifiedWalletRecharge({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      verification:
        input.verification,
    });

  if (!rechargeResult.success) {
    return {
      success:
        false,

      errorCode:
        rechargeResult.errorCode,

      error:
        rechargeResult.error,
    };
  }

  const intentResult =
    await updateWalletPaymentIntentStatus({
      paymentReference:
        input.verification.paymentReference,

      status:
        "SUCCESS",

      providerOrderId:
        input.verification.providerOrderId,

      providerTransactionId:
        input.verification.providerTransactionId,
    });

  if (!intentResult.success) {
    return {
      success:
        false,

      errorCode:
        intentResult.errorCode,

      error:
        intentResult.error,
    };
  }

  return {
    success:
      true,

    availableBalance:
      rechargeResult.data.availableBalance,

    transactionId:
      rechargeResult.data.transactionId,
  };
}

/* ============================================================
   END
============================================================ */
