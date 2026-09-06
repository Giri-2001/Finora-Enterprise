/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   GENERIC PLATFORM CHARGE SERVICE

   RESPONSIBILITY:
   - Preflight any canonically configured FINORA platform charge
   - Resolve authoritative effective pricing
   - Enforce Wallet readiness and available balance
   - Preserve the exact pricing quote between preflight and commit
   - Re-resolve authoritative pricing immediately before commit
   - Reject pricing drift before Wallet mutation
   - Delegate financial mutation to Wallet Debit Service

   IMPORTANT:
   - No React.
   - No UI.
   - No direct storage access.
   - No Business Date dependency.
   - No payment gateway logic.
   - No business-entity persistence.
   - Disabled pricing rules remain non-billable.
   - This service does not enable latent platform charges.
   - Preflight performs no Wallet debit.
   - Commit requires stable source identity.
   - Wallet Debit Service remains the mutation authority.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

import {
  resolveFinoraAuthoritativeEffectivePrice,
} from "../pricing/finoraEffectivePricingAuthorityService";

import type {
  FinoraEffectivePriceQuote,
} from "../../types/pricing/finoraEffectivePricing.types";

import type {
  WalletScope,
} from "../../types/wallet/wallet.types";

import type {
  WalletPlatformChargeCode,
  WalletTransactionSourceType,
} from "../../types/wallet/wallet.transaction.types";

import type {
  WalletDebitServiceResult,
} from "./walletDebitService";

import {
  ensureWalletForScope,
} from "./walletInitializationService";

import {
  calculateWalletDebit,
} from "./walletBalanceService";

import {
  commitWalletDebit,
} from "./walletDebitService";

import {
  FINORA_WALLET_TRANSACTION_LABELS,
} from "./wallet.constants";

/* ============================================================
   PREFLIGHT INPUT
============================================================ */

export interface PreflightWalletPlatformChargeInput
  extends WalletScope {

  chargeCode:
    WalletPlatformChargeCode;
}

/* ============================================================
   PREFLIGHT RESULT
============================================================ */

export interface WalletPlatformChargePreflightFailure {
  success:
    false;

  errorCode:
    | "INVALID_SCOPE"
    | "WALLET_UNAVAILABLE"
    | "WALLET_NOT_ACTIVE"
    | "PRICING_UNAVAILABLE"
    | "INSUFFICIENT_BALANCE";

  error:
    string;
}

export interface WalletPlatformChargePreflightSuccess {
  success:
    true;

  data: {
    walletId:
      string;

    amount:
      number;

    pricingQuote:
      FinoraEffectivePriceQuote;

    availableBalance:
      number;

    availableBalanceAfterCharge:
      number;
  };
}

export type WalletPlatformChargePreflightResult =
  | WalletPlatformChargePreflightSuccess
  | WalletPlatformChargePreflightFailure;

/* ============================================================
   COMMIT INPUT
============================================================ */

export interface CommitWalletPlatformChargeInput
  extends WalletScope {

  walletId:
    string;

  chargeCode:
    WalletPlatformChargeCode;

  sourceType:
    WalletTransactionSourceType;

  sourceId:
    string;

  sourceReference:
    string;

  remarks:
    string;

  expectedPricingQuote:
    FinoraEffectivePriceQuote;
}

/* ============================================================
   SCOPE NORMALIZATION
============================================================ */

function normalizeScope(
  scope:
    WalletScope,
): WalletScope {

  return {
    ownerId:
      String(scope.ownerId ?? "").trim(),

    businessId:
      String(scope.businessId ?? "").trim(),

    branchId:
      String(scope.branchId ?? "").trim(),
  };
}

/* ============================================================
   EFFECTIVE PRICE QUOTE CONSISTENCY
============================================================ */

export function areSameWalletPlatformChargePricingQuotes(
  expected:
    FinoraEffectivePriceQuote,

  current:
    FinoraEffectivePriceQuote,
): boolean {

  if (
    expected.chargeCode !==
      current.chargeCode ||
    expected.transactionType !==
      current.transactionType ||
    expected.pricingModel !==
      current.pricingModel ||
    expected.amount !==
      current.amount ||
    expected.currency !==
      current.currency ||
    expected.source !==
      current.source ||
    expected.schemaVersion !==
      current.schemaVersion
  ) {
    return false;
  }

  if (
    expected.source === "BASE" &&
    current.source === "BASE"
  ) {
    return true;
  }

  if (
    expected.source !== "PRICING_OVERRIDE" ||
    current.source !== "PRICING_OVERRIDE"
  ) {
    return false;
  }

  return (
    expected.overrideSetId ===
      current.overrideSetId &&
    expected.overrideId ===
      current.overrideId &&
    expected.validFrom ===
      current.validFrom &&
    expected.validUntil ===
      current.validUntil
  );
}

/* ============================================================
   PREFLIGHT
============================================================ */

export async function preflightWalletPlatformCharge(
  input:
    PreflightWalletPlatformChargeInput,
): Promise<WalletPlatformChargePreflightResult> {

  const scope =
    normalizeScope(
      input,
    );

  const chargeCode =
    input.chargeCode;

  if (
    !scope.ownerId ||
    !scope.businessId ||
    !scope.branchId
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_SCOPE",

      error:
        "Authenticated Owner, Business and Branch are required for the FINORA Wallet charge.",
    };
  }

  if (!chargeCode) {
    return {
      success:
        false,

      errorCode:
        "PRICING_UNAVAILABLE",

      error:
        "A canonical FINORA platform charge code is required.",
    };
  }

  const pricingResult =
    await resolveFinoraAuthoritativeEffectivePrice({
      chargeCode,

      scope,
    });

  if (!pricingResult.success) {
    return {
      success:
        false,

      errorCode:
        "PRICING_UNAVAILABLE",

      error:
        pricingResult.error,
    };
  }

  const pricingQuote =
    pricingResult.quote;

  const walletResult =
    await ensureWalletForScope(
      scope,
    );

  if (!walletResult.success) {
    return {
      success:
        false,

      errorCode:
        walletResult.errorCode ===
        "INVALID_SCOPE"
          ? "INVALID_SCOPE"
          : "WALLET_UNAVAILABLE",

      error:
        walletResult.error,
    };
  }

  const wallet =
    walletResult.data;

  if (wallet.status !== "ACTIVE") {
    return {
      success:
        false,

      errorCode:
        "WALLET_NOT_ACTIVE",

      error:
        "FINORA Wallet is not active. This platform charge cannot continue.",
    };
  }

  const balanceResult =
    calculateWalletDebit(
      wallet.balance,
      pricingQuote.amount,
    );

  if (!balanceResult.success) {
    return {
      success:
        false,

      errorCode:
        "INSUFFICIENT_BALANCE",

      error:
        `Insufficient FINORA Wallet balance. A ₹${pricingQuote.amount} platform fee is required.`,
    };
  }

  return {
    success:
      true,

    data: {
      walletId:
        wallet.walletId,

      amount:
        pricingQuote.amount,

      pricingQuote,

      availableBalance:
        wallet.balance,

      availableBalanceAfterCharge:
        balanceResult.transition.balanceAfter,
    },
  };
}

/* ============================================================
   COMMIT
============================================================ */

export async function commitWalletPlatformCharge(
  input:
    CommitWalletPlatformChargeInput,
): Promise<WalletDebitServiceResult> {

  const walletId =
    String(input.walletId ?? "").trim();

  const sourceId =
    String(input.sourceId ?? "").trim();

  const sourceReference =
    String(input.sourceReference ?? "").trim();

  const remarks =
    String(input.remarks ?? "").trim();

  const scope =
    normalizeScope(
      input,
    );

  const chargeCode =
    input.chargeCode;

  const sourceType =
    input.sourceType;

  if (
    !walletId ||
    !scope.ownerId ||
    !scope.businessId ||
    !scope.branchId ||
    !chargeCode ||
    !sourceType ||
    !sourceId ||
    !sourceReference ||
    !remarks ||
    !input.expectedPricingQuote
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet ID, authenticated scope, charge code, source identity, reference and expected pricing quote are required for the FINORA platform charge.",
    };
  }

  const pricingResult =
    await resolveFinoraAuthoritativeEffectivePrice({
      chargeCode,

      scope,
    });

  if (!pricingResult.success) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        pricingResult.error,
    };
  }

  const pricingQuote =
    pricingResult.quote;

  if (
    !areSameWalletPlatformChargePricingQuotes(
      input.expectedPricingQuote,
      pricingQuote,
    )
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "FINORA Pricing changed after platform-charge preflight. The Wallet debit was not committed. Review the current platform fee before retrying.",
    };
  }

  return commitWalletDebit({
    walletId,

    ownerId:
      scope.ownerId,

    businessId:
      scope.businessId,

    branchId:
      scope.branchId,

    chargeCode:
      pricingQuote.chargeCode,

    type:
      pricingQuote.transactionType,

    amount:
      pricingQuote.amount,

    title:
      FINORA_WALLET_TRANSACTION_LABELS[
        pricingQuote.transactionType
      ],

    remarks,

    sourceType,

    sourceReference,

    sourceId,
  });
}

/* ============================================================
   END
============================================================ */
