/* ===========================================================
   FINORA ENTERPRISE OS™

   BASE PRICING ENGINE SELF-TEST
=========================================================== */

import type {
  WalletPlatformChargeCode,
} from "../../types/wallet/wallet.transaction.types";

import {
  FINORA_BASE_PRICING_CATALOG,
} from "./finoraPricingCatalog";

import {
  requireFinoraBasePrice,
  resolveFinoraBasePrice,
} from "./finoraPricingEngine";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    boolean,

  message:
    string,
): void {

  if (!condition) {
    throw new Error(
      `FINORA PRICING SELF-TEST FAILED: ${message}`,
    );
  }
}

function pass(
  message:
    string,
): void {

  console.log(
    `PASS: ${message}`,
  );
}

// ============================================================
// RUN
// ============================================================

export function runFinoraPricingEngineSelfTest():
  void {

  const chargeCodes:
    WalletPlatformChargeCode[] = [
      "LOAN_DISBURSEMENT",
      "LOAN_NUMBER_GENERATION",
      "CUSTOMER_NUMBER_GENERATION",
      "COLLECTION_PROCESSING",
      "RECEIPT_PROCESSING",
      "CUSTOMER_ID_CARD_GENERATION",
      "OTHER_PLATFORM_FEE",
    ];

  // ----------------------------------------------------------
  // COMPLETE CANONICAL CATALOG
  // ----------------------------------------------------------

  assert(
    Object.keys(
      FINORA_BASE_PRICING_CATALOG,
    ).length ===
      chargeCodes.length,
    "Pricing catalog must contain exactly seven canonical charge codes.",
  );

  for (const chargeCode of chargeCodes) {
    assert(
      Boolean(
        FINORA_BASE_PRICING_CATALOG[
          chargeCode
        ],
      ),
      `Missing pricing rule: ${chargeCode}`,
    );
  }

  pass(
    "all seven canonical platform charge codes are represented",
  );

  // ----------------------------------------------------------
  // CURRENT LIVE LOAN PRICE
  // ----------------------------------------------------------

  const loanResult =
    resolveFinoraBasePrice(
      "LOAN_DISBURSEMENT",
    );

  assert(
    loanResult.success,
    "Loan Disbursement must currently be billable.",
  );

  if (!loanResult.success) {
    throw new Error(
      loanResult.reason,
    );
  }

  assert(
    loanResult.quote.amount ===
      10,
    "Loan Disbursement base price must preserve INR 10.",
  );

  assert(
    loanResult.quote.currency ===
      "INR",
    "Loan Disbursement currency must be INR.",
  );

  assert(
    loanResult.quote.transactionType ===
      "LOAN_DISBURSEMENT_PLATFORM_FEE",
    "Loan Disbursement transaction type mapping is invalid.",
  );

  assert(
    loanResult.quote.pricingModel ===
      "FIXED",
    "Loan Disbursement pricing model must be FIXED.",
  );

  assert(
    Object.isFrozen(
      loanResult.quote,
    ),
    "Resolved pricing quote must be immutable.",
  );

  pass(
    "Loan Disbursement preserves FIXED INR 10 base pricing",
  );

  // ----------------------------------------------------------
  // LATENT CHARGES MUST REMAIN NON-BILLABLE
  // ----------------------------------------------------------

  const latentCodes:
    WalletPlatformChargeCode[] = [
      "LOAN_NUMBER_GENERATION",
      "CUSTOMER_NUMBER_GENERATION",
      "COLLECTION_PROCESSING",
      "RECEIPT_PROCESSING",
      "CUSTOMER_ID_CARD_GENERATION",
      "OTHER_PLATFORM_FEE",
    ];

  for (
    const chargeCode of latentCodes
  ) {

    const result =
      resolveFinoraBasePrice(
        chargeCode,
      );

    assert(
      !result.success,
      `${chargeCode} must remain disabled.`,
    );

    const rule =
      FINORA_BASE_PRICING_CATALOG[
        chargeCode
      ];

    assert(
      rule.enabled ===
        false,
      `${chargeCode} must be explicitly disabled.`,
    );

    assert(
      rule.amount ===
        undefined,
      `${chargeCode} must not carry a latent billable amount.`,
    );
  }

  pass(
    "all six latent platform charges remain disabled and unpriced",
  );

  // ----------------------------------------------------------
  // REQUIRE API
  // ----------------------------------------------------------

  const requiredLoanQuote =
    requireFinoraBasePrice(
      "LOAN_DISBURSEMENT",
    );

  assert(
    requiredLoanQuote.amount ===
      10,
    "requireFinoraBasePrice must return the live Loan quote.",
  );

  let disabledThrow =
    false;

  try {
    requireFinoraBasePrice(
      "COLLECTION_PROCESSING",
    );
  } catch {
    disabledThrow =
      true;
  }

  assert(
    disabledThrow,
    "requireFinoraBasePrice must fail closed for disabled pricing.",
  );

  pass(
    "required pricing API fails closed for disabled charge rules",
  );

    // ----------------------------------------------------------
  // MALFORMED RUNTIME CHARGE CODE
  // ----------------------------------------------------------

  let malformedThrew =
    false;

  let malformedResult:
    ReturnType<
      typeof resolveFinoraBasePrice
    > | undefined;

  try {
    malformedResult =
      resolveFinoraBasePrice(
        "MALFORMED_RUNTIME_CHARGE" as WalletPlatformChargeCode,
      );
  } catch {
    malformedThrew =
      true;
  }

  assert(
    !malformedThrew,
    "Malformed runtime charge code must not throw.",
  );

  assert(
    malformedResult !==
      undefined &&
    malformedResult.success ===
      false,
    "Malformed runtime charge code must fail closed.",
  );

  if (
    malformedResult &&
    !malformedResult.success
  ) {
    assert(
      malformedResult.reason.includes(
        "not recognized",
      ),
      "Malformed runtime charge denial must identify an unknown pricing rule.",
    );
  }

  pass(
    "malformed runtime charge code fails closed without throwing",
  );

  console.log(
    "PASS: FINORA Base Pricing Engine rules verified",
  );
}

runFinoraPricingEngineSelfTest();

// ============================================================
// END
// ============================================================