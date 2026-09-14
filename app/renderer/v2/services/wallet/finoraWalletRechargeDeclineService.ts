/* ============================================================
   FINORA ENTERPRISE OS

   V2 WALLET ENGINE

   SIGNED WALLET RECHARGE DECLINE SERVICE

   RESPONSIBILITY:
   - Read one native-verified signed Wallet Recharge decline
   - Bind it to one persisted local PENDING Payment Intent
   - Enforce exact Wallet / Owner / Business / Branch scope
   - Enforce exact stable paymentReference identity
   - Enforce exact INR minor-unit amount equality
   - Enforce exact payment method / source metadata
   - Validate signed decline public evidence structurally
   - Keep Payment Intent mutation outside this service
   - Keep Wallet balance / ledger mutation outside this service

   SECURITY:
   - No signature verification in renderer.
   - No signed-package apply authority.
   - No private signing material.
   - Native installation binding remains outside renderer.
   - Native bridge must already have revalidated current binding.
   - Missing native decline-read support fails closed.
============================================================ */

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

export interface ResolveSignedWalletRechargeDeclineInput {
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

export interface ResolveSignedWalletRechargeDeclineSuccess {
  success:
    true;

  declinePackageId:
    string;

  requestId:
    string;

  paymentReference:
    string;

  verifiedAt:
    string;
}

export interface ResolveSignedWalletRechargeDeclineFailure {
  success:
    false;

  errorCode:
    | "INVALID_INPUT"
    | "CONTROL_BRIDGE_UNAVAILABLE"
    | "DECLINE_READ_UNAVAILABLE"
    | "PAYMENT_INTENT_READ_FAILED"
    | "PAYMENT_INTENT_NOT_FOUND"
    | "PAYMENT_INTENT_NOT_PENDING"
    | "PAYMENT_INTENT_MISMATCH"
    | "DECLINE_READ_FAILED"
    | "DECLINE_NOT_FOUND"
    | "DECLINE_INVALID"
    | "DECLINE_MISMATCH";

  error:
    string;
}

export type ResolveSignedWalletRechargeDeclineResult =
  | ResolveSignedWalletRechargeDeclineSuccess
  | ResolveSignedWalletRechargeDeclineFailure;

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

function isCanonicalIsoTimestamp(
  value: string,
): boolean {
  const parsed =
    new Date(value);

  return (
    !Number.isNaN(
      parsed.getTime(),
    ) &&
    parsed.toISOString() ===
      value
  );
}

function isCanonicalRequestId(
  value: string,
): boolean {
  return /^FINORA-WAL-REQ-[0-9A-F]{64}$/.test(
    value,
  );
}

/* ============================================================
   RESOLVE SIGNED DECLINE
============================================================ */

/**
 * Resolve one native-verified signed Wallet Recharge decline
 * against one exact local PENDING Payment Intent.
 *
 * IMPORTANT:
 *
 * This service only returns verified decline evidence.
 * It does NOT transition the Payment Intent to CANCELLED.
 */
export async function resolveSignedWalletRechargeDecline(
  input:
    ResolveSignedWalletRechargeDeclineInput,
): Promise<ResolveSignedWalletRechargeDeclineResult> {

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
        "Wallet ID, Wallet scope and payment reference are required to resolve a signed Recharge decline.",
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
        `Wallet payment intent must be PENDING before signed decline resolution. Current status: ${intent.status}.`,
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
        "Wallet payment intent identity or scope does not match the signed decline lookup.",
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
    !Number.isFinite(
      intentAmount,
    ) ||
    intentAmount <= 0 ||
    !Number.isSafeInteger(
      intentAmountMinor,
    ) ||
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

  const findDecline =
    controlBridge.findWalletRechargeDecline;

  if (
    typeof findDecline !==
      "function"
  ) {
    return {
      success:
        false,

      errorCode:
        "DECLINE_READ_UNAVAILABLE",

      error:
        "FINORA signed Wallet Recharge decline verification is unavailable in this runtime.",
    };
  }

  const declineResult =
    await findDecline({
      ownerId,
      businessId,
      branchId,
      paymentReference,
    });

  if (!declineResult.success) {
    return {
      success:
        false,

      errorCode:
        "DECLINE_READ_FAILED",

      error:
        declineResult.error ??
        "Unable to read verified Wallet Recharge decline evidence.",
    };
  }

  const decline =
    declineResult.data;

  if (!decline) {
    return {
      success:
        false,

      errorCode:
        "DECLINE_NOT_FOUND",

      error:
        "No verified signed Wallet Recharge decline exists for this payment reference.",
    };
  }

  /* ==========================================================
     DECLINE STRUCTURAL VALIDATION
  ========================================================== */

  const requestId =
    normalizeRequiredText(
      decline.requestId,
    );

  const requestedAt =
    normalizeRequiredText(
      decline.requestedAt,
    );

  const issuedAt =
    normalizeRequiredText(
      decline.issuedAt,
    );

  const verifiedAt =
    normalizeRequiredText(
      decline.verifiedAt,
    );

  if (
    normalizeRequiredText(
      decline.packageId,
    ).length === 0 ||
    normalizeRequiredText(
      decline.issuerId,
    ).length === 0 ||
    normalizeRequiredText(
      decline.signingKeyId,
    ).length === 0 ||
    decline.purpose !==
      "WALLET_RECHARGE_DECLINE" ||
    !Number.isSafeInteger(
      decline.sequence,
    ) ||
    decline.sequence <= 0 ||
    normalizeRequiredText(
      decline.installationId,
    ).length === 0 ||
    normalizeRequiredText(
      decline.bindingKeyId,
    ).length === 0 ||
    decline.fingerprintAlgorithm !==
      "SHA-256" ||
    normalizeRequiredText(
      decline.publicKeyFingerprint,
    ).length === 0 ||
    !isCanonicalRequestId(
      requestId,
    ) ||
    decline.currency !==
      "INR" ||
    !Number.isSafeInteger(
      decline.amountMinor,
    ) ||
    decline.amountMinor <= 0 ||
    decline.outcome !==
      "DECLINED" ||
    decline.schemaVersion !==
      1 ||
    !isCanonicalIsoTimestamp(
      requestedAt,
    ) ||
    !isCanonicalIsoTimestamp(
      issuedAt,
    ) ||
    !isCanonicalIsoTimestamp(
      verifiedAt,
    ) ||
    requestedAt >
      issuedAt ||
    issuedAt >
      verifiedAt
  ) {
    return {
      success:
        false,

      errorCode:
        "DECLINE_INVALID",

      error:
        "Verified Wallet Recharge decline contains invalid public evidence.",
    };
  }

  /* ==========================================================
     EXACT SCOPE / PAYMENT IDENTITY
  ========================================================== */

  if (
    normalizeRequiredText(
      decline.ownerId,
    ) !== ownerId ||
    normalizeRequiredText(
      decline.businessId,
    ) !== businessId ||
    normalizeRequiredText(
      decline.branchId,
    ) !== branchId ||
    normalizeRequiredText(
      decline.paymentReference,
    ) !== paymentReference
  ) {
    return {
      success:
        false,

      errorCode:
        "DECLINE_MISMATCH",

      error:
        "Verified Wallet Recharge decline scope or payment reference does not match the local Payment Intent.",
    };
  }

  /* ==========================================================
     EXACT MONEY / CHANNEL MATCH
  ========================================================== */

  if (
    decline.amountMinor !==
      intentAmountMinor ||
    decline.paymentMethod !==
      intent.paymentMethod ||
    decline.paymentSource !==
      intent.paymentSource
  ) {
    return {
      success:
        false,

      errorCode:
        "DECLINE_MISMATCH",

      error:
        "Verified Wallet Recharge decline amount, payment method or source does not match the local Payment Intent.",
    };
  }

  return {
    success:
      true,

    declinePackageId:
      decline.packageId,

    requestId,

    paymentReference,

    verifiedAt,
  };
}

/* ============================================================
   END
============================================================ */