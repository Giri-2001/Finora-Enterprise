/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   LOAN DISBURSEMENT CHARGE SERVICE

   RESPONSIBILITY:
   - Preflight the configured Loan disbursement platform fee
   - Block Loan creation when Wallet balance is insufficient
   - Commit one deterministic debit after successful Loan creation
   - Preserve generated Loan Number as the owner-facing reference
   - Delegate authoritative balance and ledger mutation to the
     Wallet Debit Service

   IMPORTANT:
   - No React.
   - No UI.
   - No direct storage access.
   - No payment gateway logic.
   - No Loan persistence.
   - No negative Wallet balance.
   - Preflight does not mutate Wallet state.
   - Commit remains deterministic and idempotent per Loan.

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
   PREFLIGHT RESULT
============================================================ */

export interface LoanWalletChargePreflightFailure {
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

export interface LoanWalletChargePreflightSuccess {
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

export type LoanWalletChargePreflightResult =
  | LoanWalletChargePreflightSuccess
  | LoanWalletChargePreflightFailure;

/* ============================================================
   COMMIT INPUT
============================================================ */

export interface CommitLoanDisbursementWalletChargeInput
  extends WalletScope {
  walletId:
    string;

  loanId:
    string;

  loanNumber:
    string;

  expectedPricingQuote:
    FinoraEffectivePriceQuote;
}

/* ============================================================
   SCOPE NORMALIZATION
============================================================ */

function normalizeScope(
  scope: WalletScope,
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

function areSameFinoraEffectivePriceQuotes(
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
    expected.overrideSetId === current.overrideSetId &&
    expected.overrideId === current.overrideId &&
    expected.validFrom === current.validFrom &&
    expected.validUntil === current.validUntil
  );
}

/* ============================================================
   PREFLIGHT
============================================================ */

export async function preflightLoanDisbursementWalletCharge(
  scope: WalletScope,
): Promise<LoanWalletChargePreflightResult> {
  const normalizedScope =
    normalizeScope(scope);

  if (
    !normalizedScope.ownerId ||
    !normalizedScope.businessId ||
    !normalizedScope.branchId
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

  const pricingResult =
    await resolveFinoraAuthoritativeEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      scope:
        normalizedScope,
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
      normalizedScope,
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
        "FINORA Wallet is not active. Loan creation cannot continue.",
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
        `Insufficient FINORA Wallet balance. A ₹${pricingQuote.amount} Loan platform fee is required.`,
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

      pricingQuote:
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

export async function commitLoanDisbursementWalletCharge(
  input: CommitLoanDisbursementWalletChargeInput,
): Promise<WalletDebitServiceResult> {
  const walletId =
    String(input.walletId ?? "").trim();

  const loanId =
    String(input.loanId ?? "").trim();

  const loanNumber =
    String(input.loanNumber ?? "").trim();

  if (
    !walletId ||
    !loanId ||
    !loanNumber ||
    !input.expectedPricingQuote
  ) {
    return {
      success:
        false,

      errorCode:
        "INVALID_INPUT",

      error:
        "Wallet ID, Loan ID and Loan Number are required for the Loan platform charge.",
    };
  }

  const pricingResult =
    await resolveFinoraAuthoritativeEffectivePrice({
      chargeCode:
        "LOAN_DISBURSEMENT",

      scope:
        normalizeScope(
          input,
        ),
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
    !areSameFinoraEffectivePriceQuotes(
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
        "FINORA Pricing changed after Loan preflight. The Wallet debit was not committed. Review the current platform fee before retrying.",
    };
  }

  return commitWalletDebit({
    walletId,

    ownerId:
      String(input.ownerId ?? "").trim(),

    businessId:
      String(input.businessId ?? "").trim(),

    branchId:
      String(input.branchId ?? "").trim(),

    type:
      pricingQuote.transactionType,

    amount:
      pricingQuote.amount,

    title:
      FINORA_WALLET_TRANSACTION_LABELS[
        pricingQuote.transactionType
      ],

    remarks:
      `Loan disbursed: ${loanNumber}`,

    sourceType:
      "LOAN",

    sourceReference:
      loanNumber,

    sourceId:
      loanId,
  });
}

/* ============================================================
   END
============================================================ */