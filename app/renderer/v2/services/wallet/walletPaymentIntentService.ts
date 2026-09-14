/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET PAYMENT INTENT SERVICE

   RESPONSIBILITY:
   - Create Wallet recharge payment intents
   - Move payment intents through controlled lifecycle states
   - Preserve gateway-neutral provider metadata
   - Prevent unsafe lifecycle rewrites

   IMPORTANT:
   - No React.
   - No UI.
   - No direct StorageManager access.
   - No balance mutation.
   - No payment verification.
   - No gateway API calls.
   - Wallet credit happens only after verified payment elsewhere.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import type {
  WalletPaymentIntent,
  WalletPaymentIntentStatus,
  WalletRechargeRequest,
} from "../../types/wallet/wallet.payment.types";

import {
  addWalletPaymentIntent,
  getWalletPaymentIntentByReferenceResult,
  getWalletPaymentIntentsResult,
  updateWalletPaymentIntent,
} from "../../repositories/wallet/walletPaymentIntentRepository";

/* ============================================================
   RESULT
============================================================ */

export interface WalletPaymentIntentServiceFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "PAYMENT_INTENT_NOT_FOUND"
    | "DUPLICATE_PAYMENT_INTENT"
    | "INVALID_STATUS_TRANSITION"
    | "PAYMENT_INTENT_READ_FAILED"
    | "PAYMENT_INTENT_WRITE_FAILED";

  error:
    string;
}

export interface WalletPaymentIntentServiceSuccess {
  success:
    true;

  data:
    WalletPaymentIntent;
}

export type WalletPaymentIntentServiceResult =
  | WalletPaymentIntentServiceSuccess
  | WalletPaymentIntentServiceFailure;

/* ============================================================
   CREATE INPUT
============================================================ */

export interface CreateWalletPaymentIntentInput
  extends WalletRechargeRequest {
  paymentReference:
    string;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;
}

/* ============================================================
   UPDATE INPUT
============================================================ */

export interface UpdateWalletPaymentIntentStatusInput {
  paymentReference:
    string;

  status:
    WalletPaymentIntentStatus;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;
  cancellationReason?:
    string;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeText(
  value: string | undefined,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   STATUS TRANSITIONS
============================================================ */

function canTransitionPaymentIntent(
  current: WalletPaymentIntentStatus,
  next: WalletPaymentIntentStatus,
): boolean {
  if (current === next) {
    return true;
  }

  switch (current) {
    case "CREATED":
      return (
        next === "PENDING" ||
        next === "SUCCESS" ||
        next === "FAILED" ||
        next === "CANCELLED"
      );

    case "PENDING":
      return (
        next === "SUCCESS" ||
        next === "FAILED" ||
        next === "CANCELLED"
      );

    case "SUCCESS":
    case "FAILED":
    case "CANCELLED":
      return false;

    default:
      return false;
  }
}

/* ============================================================
   CREATE PAYMENT INTENT
============================================================ */

export async function createWalletPaymentIntent(
  input: CreateWalletPaymentIntentInput,
): Promise<WalletPaymentIntentServiceResult> {
  const walletId =
    normalizeText(input.walletId);

  const ownerId =
    normalizeText(input.ownerId);

  const businessId =
    normalizeText(input.businessId);

  const branchId =
    normalizeText(input.branchId);

  const paymentReference =
    normalizeText(input.paymentReference);

  if (
    !walletId ||
    !ownerId ||
    !businessId ||
    !branchId ||
    !paymentReference ||
    !Number.isFinite(input.amount) ||
    input.amount <= 0
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Valid Wallet scope, payment reference and recharge amount are required.",
    };
  }

  const existingResult =
    await getWalletPaymentIntentByReferenceResult(
      paymentReference,
    );

  if (!existingResult.success) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_READ_FAILED",

      error:
        existingResult.error ??
        "Unable to verify existing Wallet payment intent.",
    };
  }

  if (existingResult.data) {
    return {
      success:
        false,

      errorCode:
        "DUPLICATE_PAYMENT_INTENT",

      error:
        "Wallet payment intent already exists.",
    };
  }

  const now =
    new Date().toISOString();

  const intent: WalletPaymentIntent = {
    walletId,

    ownerId,

    businessId,

    branchId,

    amount:
      input.amount,

    paymentMethod:
      input.paymentMethod,

    paymentSource:
      input.paymentSource,

    status:
      "CREATED",

    paymentReference,

    providerOrderId:
      normalizeText(input.providerOrderId) ||
      undefined,

    providerTransactionId:
      normalizeText(input.providerTransactionId) ||
      undefined,

    createdAt:
      now,

    updatedAt:
      now,
  };

  const saveResult =
    await addWalletPaymentIntent(intent);

  if (!saveResult.success) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_WRITE_FAILED",

      error:
        saveResult.error ??
        "Unable to create Wallet payment intent.",
    };
  }

  return {
    success:
      true,

    data:
      saveResult.data ?? intent,
  };
}

/* ============================================================
   UPDATE PAYMENT INTENT STATUS
============================================================ */

export async function updateWalletPaymentIntentStatus(
  input: UpdateWalletPaymentIntentStatusInput,
): Promise<WalletPaymentIntentServiceResult> {
  const paymentReference =
    normalizeText(input.paymentReference);

  const cancellationReason =
    normalizeText(input.cancellationReason);

  if (!paymentReference) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Payment reference is required.",
    };
  }

  const existingResult =
    await getWalletPaymentIntentByReferenceResult(
      paymentReference,
    );

  if (!existingResult.success) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_READ_FAILED",

      error:
        existingResult.error ??
        "Unable to load Wallet payment intent.",
    };
  }

  const existing =
    existingResult.data;

  if (
    input.status === "CANCELLED" &&
    cancellationReason &&
    cancellationReason.replace(/\s/g, "").length <
      15
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet Recharge cancellation reason must contain at least 15 non-whitespace characters.",
    };
  }

  if (!existing) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_NOT_FOUND",

      error:
        "Wallet payment intent was not found.",
    };
  }

  if (
    !canTransitionPaymentIntent(
      existing.status,
      input.status,
    )
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_STATUS_TRANSITION",

      error:
        `Wallet payment intent cannot move from ${existing.status} to ${input.status}.`,
    };
  }

  const updatedAt =
    new Date().toISOString();

  const updated: WalletPaymentIntent = {
    ...existing,

    status:
      input.status,

    providerOrderId:
      normalizeText(input.providerOrderId) ||
      existing.providerOrderId,

    providerTransactionId:
      normalizeText(input.providerTransactionId) ||
      existing.providerTransactionId,

    cancellationReason:
      input.status === "CANCELLED" &&
      cancellationReason
        ? cancellationReason
        : existing.cancellationReason,

    cancelledAt:
      input.status === "CANCELLED"
        ? existing.cancelledAt ?? updatedAt
        : existing.cancelledAt,

    updatedAt,
  };

  const updateResult =
    await updateWalletPaymentIntent(updated);

  if (!updateResult.success) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_WRITE_FAILED",

      error:
        updateResult.error ??
        "Unable to update Wallet payment intent.",
    };
  }

  return {
    success:
      true,

    data:
      updateResult.data ?? updated,
  };
}

/* ============================================================
   PENDING RECHARGE DISCOVERY
============================================================ */

export interface GetPendingWalletRechargeIntentsInput {
  walletId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export type GetPendingWalletRechargeIntentsResult =
  | {
      success:
        true;

      data:
        WalletPaymentIntent[];
    }
  | {
      success:
        false;

      errorCode:
        | "INVALID_INPUT"
        | "PAYMENT_INTENT_READ_FAILED";

      error:
        string;
    };

/**
 * Load resumable PENDING Recharge intents for one exact
 * Wallet scope.
 *
 * StorageQuery can constrain ownerId, but it cannot query
 * walletId, businessId, branchId or status. Those fields
 * are therefore revalidated here before any intent is
 * exposed to higher layers.
 */
export async function getPendingWalletRechargeIntentsForScope(
  input: GetPendingWalletRechargeIntentsInput,
): Promise<GetPendingWalletRechargeIntentsResult> {
  const walletId =
    normalizeText(input.walletId);

  const ownerId =
    normalizeText(input.ownerId);

  const businessId =
    normalizeText(input.businessId);

  const branchId =
    normalizeText(input.branchId);

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
        "Valid Wallet scope is required to load pending Recharge intents.",
    };
  }

  const intentsResult =
    await getWalletPaymentIntentsResult({
      ownerId,
    });

  if (!intentsResult.success) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_READ_FAILED",

      error:
        intentsResult.error ??
        "Unable to load pending Wallet Recharge intents.",
    };
  }

  const pendingIntents =
    (intentsResult.data ?? [])
      .filter(
        (intent) =>
          normalizeText(intent.walletId) === walletId &&
          normalizeText(intent.ownerId) === ownerId &&
          normalizeText(intent.businessId) === businessId &&
          normalizeText(intent.branchId) === branchId &&
          intent.status === "PENDING",
      )
      .sort(
        (left, right) =>
          String(right.createdAt).localeCompare(
            String(left.createdAt),
          ),
      );

  return {
    success:
      true,

    data:
      pendingIntents,
  };
}
/* ============================================================
   END
============================================================ */
