/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   LOAN DISBURSEMENT CHARGE ADAPTER

   RESPONSIBILITY:
   - Preserve the Loan Studio Wallet-charge public contract
   - Bind Loan disbursement to LOAN_DISBURSEMENT charge code
   - Bind Loan identity to the generic platform-charge service
   - Preserve Loan Number as the owner-facing source reference
   - Preserve Loan-specific user-facing failure wording

   IMPORTANT:
   - No React.
   - No UI.
   - No direct storage access.
   - No Business Date dependency.
   - No direct pricing resolution.
   - No direct Wallet balance calculation.
   - No direct Wallet debit mutation.
   - Generic Platform Charge Service owns charge orchestration.

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

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
  commitWalletPlatformCharge,
  preflightWalletPlatformCharge,
} from "./walletPlatformChargeService";

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
   PREFLIGHT
============================================================ */

export async function preflightLoanDisbursementWalletCharge(
  scope:
    WalletScope,
): Promise<LoanWalletChargePreflightResult> {

  const result =
    await preflightWalletPlatformCharge({
      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      chargeCode:
        "LOAN_DISBURSEMENT",
    });

  if (result.success) {
    return {
      success:
        true,

      data:
        result.data,
    };
  }

  if (
    result.errorCode ===
    "WALLET_NOT_ACTIVE"
  ) {
    return {
      success:
        false,

      errorCode:
        result.errorCode,

      error:
        "FINORA Wallet is not active. Loan creation cannot continue.",
    };
  }

  if (
    result.errorCode ===
    "INSUFFICIENT_BALANCE"
  ) {
    return {
      success:
        false,

      errorCode:
        result.errorCode,

      error:
        result.error.replace(
          " platform fee is required.",
          " Loan platform fee is required.",
        ),
    };
  }

  return {
    success:
      false,

    errorCode:
      result.errorCode,

    error:
      result.error,
  };
}

/* ============================================================
   COMMIT
============================================================ */

export async function commitLoanDisbursementWalletCharge(
  input:
    CommitLoanDisbursementWalletChargeInput,
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

  const result =
    await commitWalletPlatformCharge({
      walletId,

      ownerId:
        String(input.ownerId ?? "").trim(),

      businessId:
        String(input.businessId ?? "").trim(),

      branchId:
        String(input.branchId ?? "").trim(),

      chargeCode:
        "LOAN_DISBURSEMENT",

      sourceType:
        "LOAN",

      sourceId:
        loanId,

      sourceReference:
        loanNumber,

      remarks:
        `Loan disbursed: ${loanNumber}`,

      expectedPricingQuote:
        input.expectedPricingQuote,
    });

  if (
    !result.success &&
    result.errorCode ===
      "INVALID_INPUT" &&
    result.error ===
      "FINORA Pricing changed after platform-charge preflight. The Wallet debit was not committed. Review the current platform fee before retrying."
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

  return result;
}

/* ============================================================
   END
============================================================ */
