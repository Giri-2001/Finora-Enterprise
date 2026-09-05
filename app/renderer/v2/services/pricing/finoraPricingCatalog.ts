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
        "LOAN_DISBURSEMENT_PLATFORM_FEE",

      enabled:
        true,

      pricingModel:
        "FIXED",

      amount:
        10,

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    LOAN_NUMBER_GENERATION: Object.freeze({
      chargeCode:
        "LOAN_NUMBER_GENERATION",

      transactionType:
        "LOAN_NUMBER_GENERATION_FEE",

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
        "CUSTOMER_NUMBER_GENERATION_FEE",

      enabled:
        false,

      pricingModel:
        "FIXED",

      currency:
        "INR",

      schemaVersion:
        1,
    }),

    COLLECTION_PROCESSING: Object.freeze({
      chargeCode:
        "COLLECTION_PROCESSING",

      transactionType:
        "COLLECTION_PROCESSING_FEE",

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
        "RECEIPT_PROCESSING_FEE",

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
        "CUSTOMER_ID_CARD_GENERATION_FEE",

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
        "OTHER_PLATFORM_FEE",

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