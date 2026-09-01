/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET CONSTANTS

   RESPONSIBILITY:
   - Define canonical Wallet schema/version constants
   - Define INR currency metadata
   - Define Wallet default state
   - Define transaction display labels
   - Define platform charge labels
   - Define safe Wallet amount boundaries

   IMPORTANT:
   - CONSTANTS ONLY.
   - No React.
   - No persistence.
   - No repository access.
   - No calculations.
   - No payment gateway calls.
   - No storage access.
============================================================ */

import type {
  WalletRechargePaymentMethod,
  WalletStatus,
  WalletTransactionType,
} from "../../types/wallet/wallet.types";

import type {
  WalletPlatformChargeCode,
} from "../../types/wallet/wallet.transaction.types";

/* ============================================================
   SCHEMA
============================================================ */

export const FINORA_WALLET_SCHEMA_VERSION =
  1 as const;

/* ============================================================
   CURRENCY
============================================================ */

export const FINORA_WALLET_CURRENCY =
  "INR" as const;

export const FINORA_WALLET_CURRENCY_SYMBOL =
  "₹" as const;

/**
 * Money calculations should ultimately use integer minor units.
 *
 * INR:
 * 1 rupee = 100 paise.
 */
export const FINORA_WALLET_MINOR_UNITS_PER_RUPEE =
  100 as const;

/* ============================================================
   DEFAULT WALLET STATE
============================================================ */

export const FINORA_WALLET_DEFAULT_BALANCE =
  0 as const;

export const FINORA_WALLET_DEFAULT_STATUS:
  WalletStatus =
  "ACTIVE";

/* ============================================================
   AMOUNT LIMITS
============================================================ */

/**
 * Recharge must be strictly greater than zero.
 *
 * Final gateway-specific min/max restrictions belong to the
 * payment integration layer.
 */
export const FINORA_WALLET_MIN_RECHARGE_AMOUNT =
  1 as const;

/**
 * Defensive application-level ceiling.
 *
 * Provider-specific limits may be lower.
 */
export const FINORA_WALLET_MAX_RECHARGE_AMOUNT =
  1_000_000 as const;

/* ============================================================
   PLATFORM CHARGE AMOUNTS
============================================================ */

/**
 * Charged exactly once after a Loan is successfully created
 * and any required Gold custody commit has completed.
 */
export const FINORA_WALLET_LOAN_DISBURSEMENT_PLATFORM_FEE =
  10 as const;

/* ============================================================
   TRANSACTION LABELS
============================================================ */

export const FINORA_WALLET_TRANSACTION_LABELS:
  Readonly<Record<WalletTransactionType, string>> = {
    WALLET_RECHARGE:
      "FINORA Wallet Recharge",

    LOAN_DISBURSEMENT_PLATFORM_FEE:
      "Loan Disbursement Platform Fee",

    LOAN_NUMBER_GENERATION_FEE:
      "Loan Number Generation Fee",

    CUSTOMER_NUMBER_GENERATION_FEE:
      "Customer Number Generation Fee",

    COLLECTION_PROCESSING_FEE:
      "Collection Processing Fee",

    RECEIPT_PROCESSING_FEE:
      "Receipt Processing Fee",

    CUSTOMER_ID_CARD_GENERATION_FEE:
      "Customer ID Card Generation Fee",

    OTHER_PLATFORM_FEE:
      "FINORA Platform Fee",
  };

/* ============================================================
   PLATFORM CHARGE LABELS
============================================================ */

export const FINORA_WALLET_PLATFORM_CHARGE_LABELS:
  Readonly<Record<WalletPlatformChargeCode, string>> = {
    LOAN_DISBURSEMENT:
      "Loan Disbursement Platform Fee",

    LOAN_NUMBER_GENERATION:
      "Loan Number Generation Fee",

    CUSTOMER_NUMBER_GENERATION:
      "Customer Number Generation Fee",

    COLLECTION_PROCESSING:
      "Collection Processing Fee",

    RECEIPT_PROCESSING:
      "Receipt Processing Fee",

    CUSTOMER_ID_CARD_GENERATION:
      "Customer ID Card Generation Fee",

    OTHER_PLATFORM_FEE:
      "FINORA Platform Fee",
  };

/* ============================================================
   RECHARGE METHOD LABELS
============================================================ */

export const FINORA_WALLET_RECHARGE_METHOD_LABELS:
  Readonly<Record<WalletRechargePaymentMethod, string>> = {
    UPI:
      "UPI",

    PHONEPE:
      "PhonePe",

    GOOGLE_PAY:
      "Google Pay",

    PAYTM:
      "Paytm",

    RAZORPAY:
      "Razorpay",

    BANK_TRANSFER:
      "Bank Transfer",

    OTHER:
      "Other",
  };

/* ============================================================
   OWNER-FACING DEFAULT TEXT
============================================================ */

export const FINORA_WALLET_RECHARGE_TITLE =
  "FINORA Wallet Recharge" as const;

export const FINORA_WALLET_RECHARGE_SUCCESS_REMARK =
  "FINORA Wallet recharge successfully" as const;

export const FINORA_WALLET_ACTIVE_LABEL =
  "ACTIVE" as const;

export const FINORA_WALLET_AVAILABLE_BALANCE_LABEL =
  "Avl. Bal" as const;

/* ============================================================
   END
============================================================ */
