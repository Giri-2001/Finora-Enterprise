/* ============================================================
   FINORA ENTERPRISE OS

   V2 WALLET ENGINE

   SIGNED WALLET RECHARGE DECLINE RESOLUTION SERVICE

   RESPONSIBILITY:
   - Discover the exact-scope PENDING Recharge intent
   - Reject ambiguous multiple PENDING intents
   - Resolve native-verified signed decline evidence
   - Treat no decline as a safe no-op
   - Treat unsupported native decline-read parity as a safe no-op
   - Transition only the exact verified PENDING intent to CANCELLED
   - Never mutate Wallet balance or Wallet transaction ledger

   IMPORTANT:
   - Signature verification remains native.
   - This service never creates decline authority.
   - requestedAt is signed evidence only; local Payment Intent does
     not own the request-export timestamp.
   - A newer request has a different paymentReference, so an old
     signed decline cannot cancel that newer PENDING intent.
============================================================ */

import {
  getPendingWalletRechargeIntentsForScope,
  updateWalletPaymentIntentStatus,
} from "./walletPaymentIntentService";

import {
  resolveSignedWalletRechargeDecline,
} from "./finoraWalletRechargeDeclineService";

/* ============================================================
   INPUT
============================================================ */

export interface ResolveSignedWalletRechargeDeclineForScopeInput {
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

export type ResolveSignedWalletRechargeDeclineForScopeResult =
  | {
      success:
        true;

      cancelled:
        false;

      supported:
        boolean;
    }
  | {
      success:
        true;

      cancelled:
        true;

      supported:
        true;

      paymentReference:
        string;

      declinePackageId:
        string;

      requestId:
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

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeRequiredText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* ============================================================
   RESOLVE + CANCEL
============================================================ */

/**
 * Resolve one exact signed decline and, only after that evidence
 * matches the one exact local PENDING Payment Intent, transition
 * that intent to CANCELLED.
 *
 * Wallet balance and Wallet transaction state are untouched.
 */
export async function resolveSignedWalletRechargeDeclineForScope(
  input:
    ResolveSignedWalletRechargeDeclineForScopeInput,
): Promise<ResolveSignedWalletRechargeDeclineForScopeResult> {

  const walletId =
    normalizeRequiredText(
      input.walletId,
    );

  const ownerId =
    normalizeRequiredText(
      input.ownerId,
    );

  const businessId =
    normalizeRequiredText(
      input.businessId,
    );

  const branchId =
    normalizeRequiredText(
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
        "Valid Wallet scope is required to resolve a signed Recharge decline.",
    };
  }

  const pendingResult =
    await getPendingWalletRechargeIntentsForScope({
      walletId,
      ownerId,
      businessId,
      branchId,
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
        true,

      cancelled:
        false,

      supported:
        true,
    };
  }

  if (pendingResult.data.length !== 1) {
    return {
      success:
        false,

      errorCode:
        "AMBIGUOUS_PENDING_RECHARGE",

      error:
        "Multiple pending Wallet Recharge requests exist. Automatic signed-decline cancellation is blocked.",
    };
  }

  const pendingIntent =
    pendingResult.data[0];

  const paymentReference =
    normalizeRequiredText(
      pendingIntent.paymentReference,
    );

  if (!paymentReference) {
    return {
      success:
        false,

      errorCode:
        "PENDING_RECHARGE_MISMATCH",

      error:
        "Pending Wallet Recharge request is missing its canonical payment reference.",
    };
  }

  const declineResult =
    await resolveSignedWalletRechargeDecline({
      walletId,
      ownerId,
      businessId,
      branchId,
      paymentReference,
    });

  if (!declineResult.success) {
    if (
      declineResult.errorCode ===
        "DECLINE_NOT_FOUND"
    ) {
      return {
        success:
          true,

        cancelled:
          false,

        supported:
          true,
      };
    }

    if (
      declineResult.errorCode ===
        "DECLINE_READ_UNAVAILABLE"
    ) {
      return {
        success:
          true,

        cancelled:
          false,

        supported:
          false,
      };
    }

    return {
      success:
        false,

      errorCode:
        declineResult.errorCode,

      error:
        declineResult.error,
    };
  }

  /*
   * The decline resolver has already re-read the local Payment
   * Intent by this exact paymentReference and verified:
   *
   * - PENDING status
   * - Wallet / Owner / Business / Branch scope
   * - amount in canonical INR minor units
   * - payment method / payment source
   * - native-verified signed decline evidence
   *
   * updateWalletPaymentIntentStatus re-reads current state again
   * and therefore rejects a concurrent terminal transition.
   */
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

    cancelled:
      true,

    supported:
      true,

    paymentReference,

    declinePackageId:
      declineResult.declinePackageId,

    requestId:
      declineResult.requestId,
  };
}

/* ============================================================
   END
============================================================ */