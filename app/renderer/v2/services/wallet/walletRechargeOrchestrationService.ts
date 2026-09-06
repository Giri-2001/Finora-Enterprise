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
  WalletRechargeRequest,
} from "../../types/wallet/wallet.payment.types";

import {
  createWalletPaymentIntent,
  getPendingWalletRechargeIntentsForScope,
  updateWalletPaymentIntentStatus,
} from "./walletPaymentIntentService";

import {
  commitVerifiedWalletRecharge,
} from "./walletRechargeService";
import {
  resolveSignedWalletRechargeResumeCandidate,
} from "./walletSignedRechargeResumeService";

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

  /**
   * Signed Recharge lookup key only.
   *
   * Amount, method, source and provider evidence are
   * resolved internally from native-verified authority.
   */
  paymentReference:
    string;
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

  /* ==========================================================
     SINGLE PENDING RECHARGE INVARIANT

     paymentReference is the external Signed Recharge identity.
     Do not create another unresolved PENDING request for the
     same exact Wallet scope.
  ========================================================== */

  const existingPendingResult =
    await getPendingWalletRechargeIntentsForScope({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,
    });

  if (!existingPendingResult.success) {
    return {
      success:
        false,

      errorCode:
        existingPendingResult.errorCode,

      error:
        existingPendingResult.error,
    };
  }

  if (existingPendingResult.data.length > 0) {
    return {
      success:
        false,

      errorCode:
        "PENDING_RECHARGE_EXISTS",

      error:
        "A Wallet Recharge request is already pending. Complete or cancel the existing request before creating another.",
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

      paymentReference:
        input.paymentReference,
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
        rechargeResult.verification.paymentReference,

      status:
        "SUCCESS",

      providerOrderId:
        rechargeResult.verification.providerOrderId,

      providerTransactionId:
        rechargeResult.verification.providerTransactionId,
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
   RESUME SIGNED RECHARGE
============================================================ */

export interface ResumeSignedWalletRechargeInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export type ResumeSignedWalletRechargeResult =
  | {
      success:
        true;

      completed:
        false;
    }
  | {
      success:
        true;

      completed:
        true;

      paymentReference:
        string;

      availableBalance:
        number;

      transactionId:
        string;
    }
  | {
      success:
        false;

      errorCode:
        string;

      error:
        string;
    };

/**
 * Resume one exact signed Wallet Recharge.
 *
 * Candidate discovery never authorizes credit by itself.
 * completeVerifiedWalletRecharge re-enters the secured Wallet
 * mutation path, where signed authorization is resolved again
 * inside the serialized mutation boundary.
 */
export async function resumeSignedWalletRecharge(
  input: ResumeSignedWalletRechargeInput,
): Promise<ResumeSignedWalletRechargeResult> {
  const candidateResult =
    await resolveSignedWalletRechargeResumeCandidate({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,
    });

  if (!candidateResult.success) {
    return {
      success:
        false,

      errorCode:
        candidateResult.errorCode,

      error:
        candidateResult.error,
    };
  }

  const paymentReference =
    candidateResult.paymentReference;

  if (!paymentReference) {
    return {
      success:
        true,

      completed:
        false,
    };
  }

  const completionResult =
    await completeVerifiedWalletRecharge({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      paymentReference,
    });

  if (!completionResult.success) {
    return {
      success:
        false,

      errorCode:
        completionResult.errorCode,

      error:
        completionResult.error,
    };
  }

  return {
    success:
      true,

    completed:
      true,

    paymentReference,

    availableBalance:
      completionResult.availableBalance,

    transactionId:
      completionResult.transactionId,
  };
}
/* ============================================================
   CANCEL PENDING SIGNED RECHARGE
============================================================ */

export interface CancelPendingSignedWalletRechargeInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  paymentReference:
    string;
}

export type CancelPendingSignedWalletRechargeResult =
  | {
      success:
        true;

      paymentReference:
        string;
    }
  | {
      success:
        false;

      errorCode:
        string;

      error:
        string;
    };

/**
 * Cancel one exact-scope PENDING Wallet Recharge request.
 *
 * Cancellation is allowed only when the deterministic
 * Signed Recharge resolver confirms that no verified
 * authorization is currently available for completion.
 */
export async function cancelPendingSignedWalletRecharge(
  input: CancelPendingSignedWalletRechargeInput,
): Promise<CancelPendingSignedWalletRechargeResult> {
  const paymentReference =
    String(
      input.paymentReference ?? "",
    ).trim();

  if (!paymentReference) {
    return {
      success:
        false,

      errorCode:
        "INVALID_PAYMENT_REFERENCE",

      error:
        "Wallet Recharge payment reference is required for cancellation.",
    };
  }

  const pendingResult =
    await getPendingWalletRechargeIntentsForScope({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,
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

  if (pendingResult.data.length === 0) {
    return {
      success:
        false,

      errorCode:
        "PENDING_RECHARGE_NOT_FOUND",

      error:
        "No pending Wallet Recharge request exists for this Wallet.",
    };
  }

  if (pendingResult.data.length !== 1) {
    return {
      success:
        false,

      errorCode:
        "AMBIGUOUS_PENDING_RECHARGE",

      error:
        "Multiple pending Wallet Recharge requests exist. Automatic cancellation is blocked.",
    };
  }

  const pendingIntent =
    pendingResult.data[0];

  const pendingPaymentReference =
    String(
      pendingIntent.paymentReference ?? "",
    ).trim();

  if (
    !pendingPaymentReference ||
    pendingPaymentReference !== paymentReference
  ) {
    return {
      success:
        false,

      errorCode:
        "PENDING_RECHARGE_MISMATCH",

      error:
        "Pending Wallet Recharge payment reference does not match the cancellation request.",
    };
  }

  const candidateResult =
    await resolveSignedWalletRechargeResumeCandidate({
      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,
    });

  if (!candidateResult.success) {
    return {
      success:
        false,

      errorCode:
        candidateResult.errorCode,

      error:
        candidateResult.error,
    };
  }

  if (candidateResult.paymentReference) {
    return {
      success:
        false,

      errorCode:
        "SIGNED_AUTHORIZATION_AVAILABLE",

      error:
        "Signed Wallet Recharge authorization is already available. Refresh the Wallet to complete the Recharge instead of cancelling it.",
    };
  }

  const cancelResult =
    await updateWalletPaymentIntentStatus({
      paymentReference,

      status:
        "CANCELLED",
    });

  if (!cancelResult.success) {
    return {
      success:
        false,

      errorCode:
        cancelResult.errorCode,

      error:
        cancelResult.error,
    };
  }

  return {
    success:
      true,

    paymentReference,
  };
}
/* ============================================================
   END
============================================================ */
