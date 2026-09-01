/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET PAYMENT / RECHARGE CONTRACTS

   RESPONSIBILITY:
   - Define Wallet recharge request contracts
   - Define Wallet payment intent contracts
   - Define payment verification contracts
   - Define gateway-neutral success / failure metadata
   - Preserve provider independence

   IMPORTANT:
   - TYPES / CONTRACTS ONLY.
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No provider API calls.
   - No webhook execution.
   - No balance mutation.
============================================================ */

import type {
  WalletId,
  WalletPaymentReference,
  WalletRechargePaymentMethod,
  WalletPaymentSource,
  WalletScope,
} from "./wallet.types";

/* ============================================================
   RECHARGE REQUEST
============================================================ */

export interface WalletRechargeRequest
  extends WalletScope {
  walletId:
    WalletId;

  amount:
    number;

  paymentMethod:
    WalletRechargePaymentMethod;

  paymentSource:
    WalletPaymentSource;
}

/* ============================================================
   PAYMENT INTENT STATUS
============================================================ */

export type WalletPaymentIntentStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

/* ============================================================
   PAYMENT INTENT
============================================================ */

/**
 * Gateway-neutral payment intent.
 *
 * Provider-specific order / transaction identifiers are
 * retained as optional metadata.
 */
export interface WalletPaymentIntent
  extends WalletScope {
  walletId:
    WalletId;

  amount:
    number;

  paymentMethod:
    WalletRechargePaymentMethod;

  paymentSource:
    WalletPaymentSource;

  status:
    WalletPaymentIntentStatus;

  paymentReference:
    WalletPaymentReference;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

/* ============================================================
   PAYMENT VERIFICATION INPUT
============================================================ */

export interface WalletPaymentVerificationInput
  extends WalletScope {
  walletId:
    WalletId;

  amount:
    number;

  paymentReference:
    WalletPaymentReference;

  paymentSource:
    WalletPaymentSource;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;
}

/* ============================================================
   PAYMENT VERIFICATION SUCCESS
============================================================ */

export interface WalletPaymentVerificationSuccess {
  verified:
    true;

  amount:
    number;

  paymentReference:
    WalletPaymentReference;

  paymentSource:
    WalletPaymentSource;

  providerOrderId?:
    string;

  providerTransactionId?:
    string;

  verifiedAt:
    string;
}

/* ============================================================
   PAYMENT VERIFICATION FAILURE
============================================================ */

export interface WalletPaymentVerificationFailure {
  verified:
    false;

  errorCode:
    string;

  errorMessage:
    string;
}

/* ============================================================
   PAYMENT VERIFICATION RESULT
============================================================ */

export type WalletPaymentVerificationResult =
  | WalletPaymentVerificationSuccess
  | WalletPaymentVerificationFailure;

/* ============================================================
   RECHARGE COMPLETION RESULT
============================================================ */

export interface WalletRechargeCompletionResult {
  walletId:
    WalletId;

  amount:
    number;

  paymentReference:
    WalletPaymentReference;

  paymentSource:
    WalletPaymentSource;

  transactionId:
    string;

  availableBalance:
    number;

  completedAt:
    string;
}

/* ============================================================
   END
============================================================ */
