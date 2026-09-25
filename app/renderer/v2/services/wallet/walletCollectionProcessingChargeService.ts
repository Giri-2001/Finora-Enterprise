/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   COLLECTION PROCESSING WALLET CHARGE SERVICE

   RESPONSIBILITY:
   - Resolve canonical Collection Processing slab pricing
   - Preflight Wallet balance before Collection mutation
   - Preserve the exact slab quote through commit
   - Re-resolve the same payment amount immediately before debit
   - Commit one idempotent Collection Processing debit

   IMPORTANT:
   - No React.
   - No UI.
   - No direct repository access.
   - No Pricing Override consumption.
   - Slab basis is the actual Collection payment amount.
   - Wallet Debit Service remains the mutation authority.
============================================================ */

import type {
  WalletScope,
} from "../../types/wallet/wallet.types";

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

import {
  resolveFinoraCollectionProcessingPrice,
} from "../pricing/finoraCollectionProcessingPricing";

import type {
  FinoraCollectionProcessingPriceQuote,
} from "../pricing/finoraCollectionProcessingPricing";

/* ============================================================
   PREFLIGHT
============================================================ */

export interface PreflightCollectionProcessingWalletChargeInput
  extends WalletScope {

  collectionAmount:
    number;
}

export interface CollectionProcessingWalletChargePreflightFailure {

  success:
    false;

  errorCode:
    | "INVALID_SCOPE"
    | "INVALID_COLLECTION_AMOUNT"
    | "WALLET_UNAVAILABLE"
    | "WALLET_NOT_ACTIVE"
    | "INSUFFICIENT_BALANCE";

  error:
    string;
}

export interface CollectionProcessingWalletChargePreflightSuccess {

  success:
    true;

  data: {

    walletId:
      string;

    amount:
      number;

    collectionAmount:
      number;

    pricingQuote:
      FinoraCollectionProcessingPriceQuote;

    availableBalance:
      number;

    availableBalanceAfterCharge:
      number;
  };
}

export type CollectionProcessingWalletChargePreflightResult =
  | CollectionProcessingWalletChargePreflightSuccess
  | CollectionProcessingWalletChargePreflightFailure;

function normalizeScope(
  scope:
    WalletScope,
): WalletScope {

  return {
    ownerId:
      String(
        scope.ownerId ?? "",
      ).trim(),

    businessId:
      String(
        scope.businessId ?? "",
      ).trim(),

    branchId:
      String(
        scope.branchId ?? "",
      ).trim(),
  };
}

export async function preflightCollectionProcessingWalletCharge(
  input:
    PreflightCollectionProcessingWalletChargeInput,
): Promise<CollectionProcessingWalletChargePreflightResult> {

  const scope =
    normalizeScope(
      input,
    );

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
        "Authenticated Owner, Business and Branch are required for the FINORA Collection Processing Wallet charge.",
    };
  }

  const pricingResult =
    resolveFinoraCollectionProcessingPrice(
      input.collectionAmount,
      scope,
    );

  if (!pricingResult.success) {

    return {
      success:
        false,

      errorCode:
        "INVALID_COLLECTION_AMOUNT",

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

  if (
    wallet.status !==
    "ACTIVE"
  ) {

    return {
      success:
        false,

      errorCode:
        "WALLET_NOT_ACTIVE",

      error:
        "FINORA Wallet is not active. Collection Processing cannot continue.",
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
        `Insufficient FINORA Wallet balance. A ₹${pricingQuote.amount} Collection Processing fee is required.`,
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

      collectionAmount:
        pricingQuote.basisAmount,

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

export interface CommitCollectionProcessingWalletChargeInput
  extends WalletScope {

  walletId:
    string;

  collectionId:
    string;

  collectionNumber:
    string;

  collectionAmount:
    number;

  expectedPricingQuote:
    FinoraCollectionProcessingPriceQuote;
}

function areSameCollectionProcessingQuotes(
  expected:
    FinoraCollectionProcessingPriceQuote,

  current:
    FinoraCollectionProcessingPriceQuote,
): boolean {

  return (
    expected.chargeCode ===
      current.chargeCode &&
    expected.transactionType ===
      current.transactionType &&
    expected.pricingModel ===
      current.pricingModel &&
    expected.basis ===
      current.basis &&
    expected.basisAmount ===
      current.basisAmount &&
    expected.tier ===
      current.tier &&
    expected.amount ===
      current.amount &&
    expected.currency ===
      current.currency &&
    expected.schemaVersion ===
      current.schemaVersion
  );
}

export async function commitCollectionProcessingWalletCharge(
  input:
    CommitCollectionProcessingWalletChargeInput,
): Promise<WalletDebitServiceResult> {

  const scope =
    normalizeScope(
      input,
    );

  const walletId =
    String(
      input.walletId ?? "",
    ).trim();

  const collectionId =
    String(
      input.collectionId ?? "",
    ).trim();

  const collectionNumber =
    String(
      input.collectionNumber ?? "",
    ).trim();

  if (
    !scope.ownerId ||
    !scope.businessId ||
    !scope.branchId ||
    !walletId ||
    !collectionId ||
    !collectionNumber ||
    !input.expectedPricingQuote
  ) {

    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet ID, authenticated scope, Collection identity, Collection number and expected pricing quote are required for the FINORA Collection Processing charge.",
    };
  }

  const pricingResult =
    resolveFinoraCollectionProcessingPrice(
      input.collectionAmount,
      scope,
    );

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
    !areSameCollectionProcessingQuotes(
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
        "FINORA Collection Processing pricing changed after Wallet preflight. The Wallet debit was not committed.",
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
      "COLLECTION_PROCESSING",

    type:
      "COLLECTION_PROCESSING_FEE",

    amount:
      pricingQuote.amount,

    title:
      FINORA_WALLET_TRANSACTION_LABELS
        .COLLECTION_PROCESSING_FEE,

    remarks:
      `Collection processed: ${collectionNumber}`,

    sourceType:
      "COLLECTION",

    sourceReference:
      collectionNumber,

    sourceId:
      collectionId,
  });
}

/* ============================================================
   END
============================================================ */