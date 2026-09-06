/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   SIGNED WALLET RECHARGE AUTHORIZATION SERVICE

   RESPONSIBILITY:
   - Read native-verified signed Wallet Recharge authorization
   - Bind authorization to one persisted local Payment Intent
   - Enforce exact Wallet / Owner / Business / Branch scope
   - Enforce exact stable paymentReference identity
   - Enforce exact INR minor-unit amount equality
   - Enforce exact payment method / source metadata
   - Enforce exact optional provider metadata
   - Produce the existing Wallet payment verification contract
   - Keep Wallet mutation outside this service

   SECURITY:
   - No signature verification in renderer.
   - No signed-package apply authority.
   - No private signing material.
   - Native installation binding remains outside renderer.
   - verifiedAt is verification evidence only.
   - This service never mutates Wallet balance or ledger state.
============================================================ */

import type {
  WalletPaymentVerificationSuccess,
} from "../../types/wallet/wallet.payment.types";

import type {
  WalletRechargePaymentMethod,
} from "../../types/wallet/wallet.types";

import {
  getWalletPaymentIntentByReferenceResult,
} from "../../repositories/wallet/walletPaymentIntentRepository";

import {
  getFinoraActivationControlBridge,
} from "../activation/activationControlBridge";

import {
  convertWalletMoneyToMinorUnits,
  normalizeWalletMoney,
} from "./walletBalanceService";

/* ============================================================
   INPUT
============================================================ */

export interface ResolveSignedWalletRechargeAuthorizationInput {
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

/* ============================================================
   RESULT
============================================================ */

export interface ResolveSignedWalletRechargeAuthorizationSuccess {
  success:
    true;

  verification:
    WalletPaymentVerificationSuccess;

  authorizationPackageId:
    string;

  paymentMethod:
    WalletRechargePaymentMethod;
}

export interface ResolveSignedWalletRechargeAuthorizationFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "CONTROL_BRIDGE_UNAVAILABLE"
    | "PAYMENT_INTENT_READ_FAILED"
    | "PAYMENT_INTENT_NOT_FOUND"
    | "PAYMENT_INTENT_NOT_PENDING"
    | "PAYMENT_INTENT_MISMATCH"
    | "AUTHORIZATION_READ_FAILED"
    | "AUTHORIZATION_NOT_FOUND"
    | "AUTHORIZATION_INVALID"
    | "AUTHORIZATION_MISMATCH";

  error:
    string;
}

export type ResolveSignedWalletRechargeAuthorizationResult =
  | ResolveSignedWalletRechargeAuthorizationSuccess
  | ResolveSignedWalletRechargeAuthorizationFailure;

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

function normalizeOptionalText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* ============================================================
   RESOLVE SIGNED AUTHORIZATION
============================================================ */

/**
 * Resolve one native-verified signed Wallet Recharge
 * authorization into the existing Wallet verification contract.
 *
 * IMPORTANT:
 *
 * `verified: true` is produced only after the secure native
 * Control bridge returns a previously verified authorization
 * and that authorization exactly matches the local Payment
 * Intent.
 *
 * This renderer service does not verify signatures itself.
 */
export async function resolveSignedWalletRechargeAuthorization(
  input: ResolveSignedWalletRechargeAuthorizationInput,
): Promise<ResolveSignedWalletRechargeAuthorizationResult> {

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

  const paymentReference =
    normalizeRequiredText(
      input.paymentReference,
    );

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
        "Wallet ID, Wallet scope and payment reference are required.",
    };
  }

  /* ==========================================================
     LOCAL PAYMENT INTENT
  ========================================================== */

  const intentResult =
    await getWalletPaymentIntentByReferenceResult(
      paymentReference,
    );

  if (!intentResult.success) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_READ_FAILED",

      error:
        intentResult.error ??
        "Unable to load Wallet payment intent.",
    };
  }

  const intent =
    intentResult.data;

  if (!intent) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_NOT_FOUND",

      error:
        "Wallet payment intent was not found.",
    };
  }

  if (intent.status !== "PENDING") {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_NOT_PENDING",

      error:
        `Wallet payment intent must be PENDING before signed Recharge completion. Current status: ${intent.status}.`,
    };
  }

  if (
    normalizeRequiredText(
      intent.walletId,
    ) !== walletId ||
    normalizeRequiredText(
      intent.ownerId,
    ) !== ownerId ||
    normalizeRequiredText(
      intent.businessId,
    ) !== businessId ||
    normalizeRequiredText(
      intent.branchId,
    ) !== branchId ||
    normalizeRequiredText(
      intent.paymentReference,
    ) !== paymentReference
  ) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_MISMATCH",

      error:
        "Wallet payment intent identity or scope does not match the Recharge request.",
    };
  }

  const intentAmount =
    normalizeWalletMoney(
      intent.amount,
    );

  const intentAmountMinor =
    convertWalletMoneyToMinorUnits(
      intentAmount,
    );

  if (
    !Number.isFinite(intentAmount) ||
    intentAmount <= 0 ||
    !Number.isSafeInteger(intentAmountMinor) ||
    intentAmountMinor <= 0
  ) {
    return {
      success:
        false,

      errorCode:
        "PAYMENT_INTENT_MISMATCH",

      error:
        "Wallet payment intent contains an invalid Recharge amount.",
    };
  }

  /* ==========================================================
     SECURE NATIVE CONTROL AUTHORITY
  ========================================================== */

  const controlBridge =
    getFinoraActivationControlBridge();

  if (!controlBridge) {
    return {
      success:
        false,

      errorCode:
        "CONTROL_BRIDGE_UNAVAILABLE",

      error:
        "FINORA secure Control bridge is unavailable.",
    };
  }

  const authorizationResult =
    await controlBridge.findWalletRechargeAuthorization({
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
        "AUTHORIZATION_READ_FAILED",

      error:
        authorizationResult.error ??
        "Unable to read verified Wallet Recharge authorization.",
    };
  }

  const authorization =
    authorizationResult.data;

  if (!authorization) {
    return {
      success:
        false,

      errorCode:
        "AUTHORIZATION_NOT_FOUND",

      error:
        "No verified signed Wallet Recharge authorization exists for this payment reference.",
    };
  }

  /* ==========================================================
     AUTHORIZATION STRUCTURAL VALIDATION
  ========================================================== */

  if (
    normalizeRequiredText(
      authorization.packageId,
    ).length === 0 ||
    normalizeRequiredText(
      authorization.issuerId,
    ).length === 0 ||
    normalizeRequiredText(
      authorization.signingKeyId,
    ).length === 0 ||
    authorization.purpose !==
      "WALLET_RECHARGE" ||
    authorization.currency !==
      "INR" ||
    authorization.schemaVersion !==
      1 ||
    !Number.isSafeInteger(
      authorization.amountMinor,
    ) ||
    authorization.amountMinor <= 0 ||
    normalizeRequiredText(
      authorization.issuedAt,
    ).length === 0 ||
    normalizeRequiredText(
      authorization.verifiedAt,
    ).length === 0
  ) {
    return {
      success:
        false,

      errorCode:
        "AUTHORIZATION_INVALID",

      error:
        "Verified Wallet Recharge authorization contains invalid public evidence.",
    };
  }

  /* ==========================================================
     EXACT SCOPE / PAYMENT IDENTITY
  ========================================================== */

  if (
    normalizeRequiredText(
      authorization.scope.ownerId,
    ) !== ownerId ||
    normalizeRequiredText(
      authorization.scope.businessId,
    ) !== businessId ||
    normalizeRequiredText(
      authorization.scope.branchId,
    ) !== branchId ||
    normalizeRequiredText(
      authorization.paymentReference,
    ) !== paymentReference
  ) {
    return {
      success:
        false,

      errorCode:
        "AUTHORIZATION_MISMATCH",

      error:
        "Verified Wallet Recharge authorization scope or payment reference does not match the local payment intent.",
    };
  }

  /* ==========================================================
     EXACT MONEY MATCH
  ========================================================== */

  if (
    authorization.amountMinor !==
    intentAmountMinor
  ) {
    return {
      success:
        false,

      errorCode:
        "AUTHORIZATION_MISMATCH",

      error:
        "Verified Wallet Recharge authorization amount does not match the local payment intent.",
    };
  }

  /* ==========================================================
     EXACT PAYMENT CHANNEL MATCH
  ========================================================== */

  if (
    authorization.paymentMethod !==
      intent.paymentMethod ||
    authorization.paymentSource !==
      intent.paymentSource
  ) {
    return {
      success:
        false,

      errorCode:
        "AUTHORIZATION_MISMATCH",

      error:
        "Verified Wallet Recharge payment method or source does not match the local payment intent.",
    };
  }

  /* ==========================================================
     PROVIDER METADATA CONSISTENCY

     Provider identifiers may first become known only after the
     external payment has completed and the signed authorization
     is issued.

     Therefore:
     - If the local Payment Intent already knows an identifier,
       the signed authorization MUST match it exactly.
     - If the local Payment Intent does not yet know it, the
       native-verified authorization may supply it.
  ========================================================== */

  const intentProviderOrderId =
    normalizeOptionalText(
      intent.providerOrderId,
    );

  const authorizationProviderOrderId =
    normalizeOptionalText(
      authorization.providerOrderId,
    );

  const intentProviderTransactionId =
    normalizeOptionalText(
      intent.providerTransactionId,
    );

  const authorizationProviderTransactionId =
    normalizeOptionalText(
      authorization.providerTransactionId,
    );

  if (
    (
      intentProviderOrderId.length > 0 &&
      authorizationProviderOrderId !==
        intentProviderOrderId
    ) ||
    (
      intentProviderTransactionId.length > 0 &&
      authorizationProviderTransactionId !==
        intentProviderTransactionId
    )
  ) {
    return {
      success:
        false,

      errorCode:
        "AUTHORIZATION_MISMATCH",

      error:
        "Verified Wallet Recharge provider metadata conflicts with the local payment intent.",
    };
  }

  /* ==========================================================
     VERIFIED PAYMENT CONTRACT
  ========================================================== */

  return {
    success:
      true,

    authorizationPackageId:
      authorization.packageId,

    paymentMethod:
      authorization.paymentMethod,

    verification: {
      verified:
        true,

      amount:
        intentAmount,

      paymentReference,

      paymentSource:
        authorization.paymentSource,

      providerOrderId:
        normalizeOptionalText(
          authorization.providerOrderId,
        ) ||
        undefined,

      providerTransactionId:
        normalizeOptionalText(
          authorization.providerTransactionId,
        ) ||
        undefined,

      /*
       * Evidence only.
       *
       * walletRechargeService MUST use a fresh system clock for
       * all Wallet financial mutation timestamps.
       */
      verifiedAt:
        authorization.verifiedAt,
    },
  };
}

/* ============================================================
   END
============================================================ */