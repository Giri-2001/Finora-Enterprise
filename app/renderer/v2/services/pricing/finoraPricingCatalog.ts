/* ===========================================================
   FINORA ENTERPRISE OS™

   BASE PRICING CATALOG

   MODULE  : Pricing
   LAYER   : Pure Pricing Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   CURRENT COMMERCIAL POLICY:

   - Loan Disbursement Platform Fee:
       ENABLED
       FIXED INR 10

   - All other known platform charge codes:
       DISABLED / LATENT

   IMPORTANT:

   Disabled rules are intentionally retained in the catalog so
   known platform charge identities remain explicit without
   accidentally becoming billable.
=========================================================== */

import {
  FINORA_INCOME_PRICING_DEFAULTS,
} from "./finoraIncomePricingDefaults.generated";

import {
  FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES,
} from "../../types/wallet/wallet.transaction.types";

import type {
  WalletPlatformChargeCode,
} from "../../types/wallet/wallet.transaction.types";

import type {
  FinoraBasePricingRule,
} from "../../types/pricing/finoraPricing.types";

// ============================================================
// CANONICAL BASE RULES
// ============================================================

export const FINORA_BASE_PRICING_CATALOG:
  Readonly<
    Record<
      WalletPlatformChargeCode,
      FinoraBasePricingRule
    >
  > = Object.freeze({
    LOAN_DISBURSEMENT: Object.freeze({
      chargeCode:
        "LOAN_DISBURSEMENT",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.LOAN_DISBURSEMENT,

      enabled:
        true,

      pricingModel:
        "FIXED",

      amount:
        FINORA_INCOME_PRICING_DEFAULTS.loanDisbursementFee,

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    LOAN_NUMBER_GENERATION: Object.freeze({
      chargeCode:
        "LOAN_NUMBER_GENERATION",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.LOAN_NUMBER_GENERATION,

      enabled:
        false,

      pricingModel:
        "FIXED",

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    CUSTOMER_NUMBER_GENERATION: Object.freeze({
      chargeCode:
        "CUSTOMER_NUMBER_GENERATION",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.CUSTOMER_NUMBER_GENERATION,

      enabled:
        true,

      pricingModel:
        "FIXED",

      amount:
        FINORA_INCOME_PRICING_DEFAULTS.customerCreateFee,

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    COLLECTION_PROCESSING: Object.freeze({
      chargeCode:
        "COLLECTION_PROCESSING",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.COLLECTION_PROCESSING,

      enabled:
        false,

      pricingModel:
        "FIXED",

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    RECEIPT_PROCESSING: Object.freeze({
      chargeCode:
        "RECEIPT_PROCESSING",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.RECEIPT_PROCESSING,

      enabled:
        false,

      pricingModel:
        "FIXED",

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    CUSTOMER_ID_CARD_GENERATION: Object.freeze({
      chargeCode:
        "CUSTOMER_ID_CARD_GENERATION",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.CUSTOMER_ID_CARD_GENERATION,

      enabled:
        false,

      pricingModel:
        "FIXED",

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    OTHER_PLATFORM_FEE: Object.freeze({
      chargeCode:
        "OTHER_PLATFORM_FEE",

      transactionType:
        FINORA_WALLET_PLATFORM_CHARGE_TRANSACTION_TYPES.OTHER_PLATFORM_FEE,

      enabled:
        false,

      pricingModel:
        "FIXED",

      currency:
        "INR",

      schemaVersion:
        1,
    }),
  });

// ============================================================
// END
// ============================================================
