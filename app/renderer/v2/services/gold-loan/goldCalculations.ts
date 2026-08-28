/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD CALCULATIONS

   MODULE  : Gold Loan
   LAYER   : Pure Business Calculations
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Calculate Net Gold Weight
   - Resolve purity percentage from Karat
   - Calculate Fine Gold Weight
   - Calculate assessed Gold value
   - Calculate Gold Loan eligibility
   - Calculate Gold Item totals
   - Recalculate Gold Item derived fields
   - Build aggregated valuation
   - Build requested / eligible / sanctioned amount summary
   - Validate financial limits

   IMPORTANT:

   - PURE FUNCTIONS ONLY.
   - No React.
   - No UI.
   - No DOM.
   - No persistence.
   - No StorageManager.
   - No repository access.
   - No mutable shared state.
   - No hardcoded LTV policy.

   GOLD FORMULA:

   Net Weight
     =
   Gross Weight
     - Stone Weight
     - Other Deduction Weight

   Fine Gold Weight
     =
   Net Weight
     × Purity Fraction

   Market Value
     =
   Fine Gold Weight
     × Reference Gold Rate Per Fine Gram

   Eligible Loan Amount
     =
   Market Value
     × Configured LTV %

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  GoldLoanAmounts,
  GoldLoanItem,
  GoldLoanItemTotals,
  GoldMarketValuation,
  GoldPurityKarat,
  GoldPurityOption,
  GoldValuationSource,
} from "../../types/gold-loan/goldLoan.types";

/* ===========================================================
   CALCULATION PRECISION
=========================================================== */

const WEIGHT_DECIMALS = 3;

const PERCENTAGE_DECIMALS = 4;

const MONEY_DECIMALS = 2;

/* ===========================================================
   SAFE NUMBER
=========================================================== */

export function getSafeGoldNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

/* ===========================================================
   ROUND NUMBER
=========================================================== */

function roundToDecimals(
  value: number,

  decimals: number,
): number {
  const safeValue = Number.isFinite(value) ? value : 0;

  const factor = 10 ** decimals;

  return Math.round((safeValue + Number.EPSILON) * factor) / factor;
}

/* ===========================================================
   ROUND WEIGHT
=========================================================== */

export function roundGoldWeight(value: number): number {
  return roundToDecimals(getSafeGoldNumber(value), WEIGHT_DECIMALS);
}

/* ===========================================================
   ROUND MONEY
=========================================================== */

export function roundGoldMoney(value: number): number {
  return roundToDecimals(getSafeGoldNumber(value), MONEY_DECIMALS);
}

/* ===========================================================
   ROUND PERCENTAGE
=========================================================== */

export function roundGoldPercentage(value: number): number {
  return roundToDecimals(getSafeGoldNumber(value), PERCENTAGE_DECIMALS);
}

/* ===========================================================
   PURITY PERCENTAGE

   Karat purity is derived from:

   Karat / 24 × 100

   Example:

   24K = 100%
   22K = 91.6667%
   18K = 75%
=========================================================== */

export function getGoldPurityPercentage(karat: GoldPurityKarat): number {
  return roundGoldPercentage((getSafeGoldNumber(karat) / 24) * 100);
}

/* ===========================================================
   PURITY FRACTION
=========================================================== */

export function getGoldPurityFraction(karat: GoldPurityKarat): number {
  return getGoldPurityPercentage(karat) / 100;
}

/* ===========================================================
   PURITY OPTIONS

   UI will import these options instead of duplicating
   Karat labels or purity percentages.
=========================================================== */

export const GOLD_PURITY_OPTIONS: GoldPurityOption[] = [
  {
    karat: 24,

    label: "24K (999 / Pure)",

    purityPercentage: getGoldPurityPercentage(24),
  },

  {
    karat: 23,

    label: "23K",

    purityPercentage: getGoldPurityPercentage(23),
  },

  {
    karat: 22,

    label: "22K (916)",

    purityPercentage: getGoldPurityPercentage(22),
  },

  {
    karat: 21,

    label: "21K",

    purityPercentage: getGoldPurityPercentage(21),
  },

  {
    karat: 20,

    label: "20K",

    purityPercentage: getGoldPurityPercentage(20),
  },

  {
    karat: 18,

    label: "18K (750)",

    purityPercentage: getGoldPurityPercentage(18),
  },

  {
    karat: 16,

    label: "16K",

    purityPercentage: getGoldPurityPercentage(16),
  },

  {
    karat: 14,

    label: "14K (585)",

    purityPercentage: getGoldPurityPercentage(14),
  },

  {
    karat: 12,

    label: "12K",

    purityPercentage: getGoldPurityPercentage(12),
  },

  {
    karat: 10,

    label: "10K (417)",

    purityPercentage: getGoldPurityPercentage(10),
  },

  {
    karat: 9,

    label: "9K (375)",

    purityPercentage: getGoldPurityPercentage(9),
  },

  {
    karat: 8,

    label: "8K (333)",

    purityPercentage: getGoldPurityPercentage(8),
  },
];

/* ===========================================================
   NET GOLD WEIGHT
=========================================================== */

export function calculateNetGoldWeight(
  grossWeightGrams: number,

  stoneWeightGrams: number,

  otherDeductionWeightGrams: number,
): number {
  const grossWeight = getSafeGoldNumber(grossWeightGrams);

  const stoneWeight = getSafeGoldNumber(stoneWeightGrams);

  const otherDeduction = getSafeGoldNumber(otherDeductionWeightGrams);

  return roundGoldWeight(
    Math.max(0, grossWeight - stoneWeight - otherDeduction),
  );
}

/* ===========================================================
   FINE GOLD WEIGHT
=========================================================== */

export function calculateFineGoldWeight(
  netWeightGrams: number,

  purityKarat: GoldPurityKarat,
): number {
  const netWeight = getSafeGoldNumber(netWeightGrams);

  const purityFraction = getGoldPurityFraction(purityKarat);

  return roundGoldWeight(netWeight * purityFraction);
}

/* ===========================================================
   ASSESSED GOLD VALUE

   IMPORTANT:

   marketRatePerGram represents the reference price per
   FINE GOLD GRAM.

   Therefore:

   Fine Gold Weight × Rate = Assessed Value
=========================================================== */

export function calculateGoldAssessedValue(
  fineGoldWeightGrams: number,

  marketRatePerGram: number,
): number {
  const fineWeight = getSafeGoldNumber(fineGoldWeightGrams);

  const marketRate = getSafeGoldNumber(marketRatePerGram);

  return roundGoldMoney(fineWeight * marketRate);
}

/* ===========================================================
   ELIGIBLE LOAN AMOUNT
=========================================================== */

export function calculateGoldEligibleAmount(
  marketValue: number,

  maxLoanToValuePercentage: number,
): number {
  const value = getSafeGoldNumber(marketValue);

  const requestedLtv = getSafeGoldNumber(maxLoanToValuePercentage);

  const ltv = Math.min(100, requestedLtv);

  return roundGoldMoney(value * (ltv / 100));
}

/* ===========================================================
   ELIGIBILITY BUFFER

   Eligible Amount - Sanctioned Amount
=========================================================== */

export function calculateGoldEligibilityBuffer(
  eligibleAmount: number,

  sanctionedAmount: number,
): number {
  return roundGoldMoney(
    Math.max(
      0,
      getSafeGoldNumber(eligibleAmount) - getSafeGoldNumber(sanctionedAmount),
    ),
  );
}

/* ===========================================================
   GOLD ITEM CALCULATION INPUT
=========================================================== */

export interface GoldItemCalculationInput {
  grossWeightGrams: number;

  stoneWeightGrams: number;

  otherDeductionWeightGrams: number;

  purityKarat: GoldPurityKarat;

  marketRatePerGram: number;
}

/* ===========================================================
   GOLD ITEM CALCULATION RESULT
=========================================================== */

export interface GoldItemCalculationResult {
  netWeightGrams: number;

  purityPercentage: number;

  fineGoldWeightGrams: number;

  assessedValue: number;
}

/* ===========================================================
   CALCULATE GOLD ITEM VALUES
=========================================================== */

export function calculateGoldItemValues(
  input: GoldItemCalculationInput,
): GoldItemCalculationResult {
  const netWeightGrams = calculateNetGoldWeight(
    input.grossWeightGrams,
    input.stoneWeightGrams,
    input.otherDeductionWeightGrams,
  );

  const purityPercentage = getGoldPurityPercentage(input.purityKarat);

  const fineGoldWeightGrams = calculateFineGoldWeight(
    netWeightGrams,
    input.purityKarat,
  );

  const assessedValue = calculateGoldAssessedValue(
    fineGoldWeightGrams,
    input.marketRatePerGram,
  );

  return {
    netWeightGrams,

    purityPercentage,

    fineGoldWeightGrams,

    assessedValue,
  };
}

/* ===========================================================
   RECALCULATE COMPLETE GOLD ITEM

   Returns a NEW object.

   The supplied GoldLoanItem is never mutated.
=========================================================== */

export function recalculateGoldLoanItem(item: GoldLoanItem): GoldLoanItem {
  const calculated = calculateGoldItemValues({
    grossWeightGrams: item.grossWeightGrams,

    stoneWeightGrams: item.stoneWeightGrams,

    otherDeductionWeightGrams: item.otherDeductionWeightGrams,

    purityKarat: item.purityKarat,

    marketRatePerGram: item.marketRatePerGram,
  });

  return {
    ...item,

    quantity: Math.max(1, Math.trunc(getSafeGoldNumber(item.quantity))),

    grossWeightGrams: roundGoldWeight(item.grossWeightGrams),

    stoneWeightGrams: roundGoldWeight(item.stoneWeightGrams),

    otherDeductionWeightGrams: roundGoldWeight(item.otherDeductionWeightGrams),

    marketRatePerGram: roundGoldMoney(item.marketRatePerGram),

    netWeightGrams: calculated.netWeightGrams,

    purityPercentage: calculated.purityPercentage,

    fineGoldWeightGrams: calculated.fineGoldWeightGrams,

    assessedValue: calculated.assessedValue,
  };
}

/* ===========================================================
   GOLD ITEM TOTALS
=========================================================== */

export function calculateGoldLoanItemTotals(
  items: GoldLoanItem[],
): GoldLoanItemTotals {
  const normalizedItems = items.map((item) => recalculateGoldLoanItem(item));

  const totalQuantity = normalizedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const totalGrossWeightGrams = normalizedItems.reduce(
    (total, item) => total + item.grossWeightGrams,
    0,
  );

  const totalStoneWeightGrams = normalizedItems.reduce(
    (total, item) => total + item.stoneWeightGrams,
    0,
  );

  const totalOtherDeductionWeightGrams = normalizedItems.reduce(
    (total, item) => total + item.otherDeductionWeightGrams,
    0,
  );

  const totalNetWeightGrams = normalizedItems.reduce(
    (total, item) => total + item.netWeightGrams,
    0,
  );

  const totalFineGoldWeightGrams = normalizedItems.reduce(
    (total, item) => total + item.fineGoldWeightGrams,
    0,
  );

  const totalAssessedValue = normalizedItems.reduce(
    (total, item) => total + item.assessedValue,
    0,
  );

  return {
    itemCount: normalizedItems.length,

    totalQuantity,

    totalGrossWeightGrams: roundGoldWeight(totalGrossWeightGrams),

    totalStoneWeightGrams: roundGoldWeight(totalStoneWeightGrams),

    totalOtherDeductionWeightGrams: roundGoldWeight(
      totalOtherDeductionWeightGrams,
    ),

    totalNetWeightGrams: roundGoldWeight(totalNetWeightGrams),

    totalFineGoldWeightGrams: roundGoldWeight(totalFineGoldWeightGrams),

    totalAssessedValue: roundGoldMoney(totalAssessedValue),
  };
}

/* ===========================================================
   GOLD MARKET VALUATION INPUT
=========================================================== */

export interface GoldMarketValuationInput {
  items: GoldLoanItem[];

  valuationSource: GoldValuationSource;

  valuationDate: string;

  marketRatePerGram: number;

  defaultPurityKarat: GoldPurityKarat;

  maxLoanToValuePercentage: number;
}

/* ===========================================================
   BUILD GOLD MARKET VALUATION
=========================================================== */

export function calculateGoldMarketValuation(
  input: GoldMarketValuationInput,
): GoldMarketValuation {
  const itemTotals = calculateGoldLoanItemTotals(input.items);

  const marketRatePerGram = roundGoldMoney(input.marketRatePerGram);

  const maxLoanToValuePercentage = Math.min(
    100,
    roundGoldPercentage(input.maxLoanToValuePercentage),
  );

  /*
   * Aggregated market value is derived from the actual
   * per-item assessed values.
   *
   * This allows one Gold Loan to contain items of different
   * purity while preserving correct valuation.
   */

  const marketValue = itemTotals.totalAssessedValue;

  const eligibleLoanAmount = calculateGoldEligibleAmount(
    marketValue,
    maxLoanToValuePercentage,
  );

  return {
    valuationSource: input.valuationSource,

    valuationDate: String(input.valuationDate ?? "").trim(),

    marketRatePerGram,

    defaultPurityKarat: input.defaultPurityKarat,

    maxLoanToValuePercentage,

    grossWeightGrams: itemTotals.totalGrossWeightGrams,

    stoneWeightGrams: itemTotals.totalStoneWeightGrams,

    otherDeductionWeightGrams: itemTotals.totalOtherDeductionWeightGrams,

    netWeightGrams: itemTotals.totalNetWeightGrams,

    fineGoldWeightGrams: itemTotals.totalFineGoldWeightGrams,

    marketValue,

    eligibleLoanAmount,
  };
}

/* ===========================================================
   GOLD LOAN AMOUNT INPUT
=========================================================== */

export interface GoldLoanAmountsInput {
  requestedAmount: number;

  eligibleAmount: number;

  sanctionedAmount: number;
}

/* ===========================================================
   BUILD GOLD LOAN AMOUNTS
=========================================================== */

export function calculateGoldLoanAmounts(
  input: GoldLoanAmountsInput,
): GoldLoanAmounts {
  const requestedAmount = roundGoldMoney(input.requestedAmount);

  const eligibleAmount = roundGoldMoney(input.eligibleAmount);

  const sanctionedAmount = roundGoldMoney(input.sanctionedAmount);

  return {
    requestedAmount,

    eligibleAmount,

    sanctionedAmount,

    eligibilityBuffer: calculateGoldEligibilityBuffer(
      eligibleAmount,
      sanctionedAmount,
    ),
  };
}

/* ===========================================================
   SANCTION WITHIN ELIGIBILITY
=========================================================== */

export function isGoldSanctionWithinEligibility(
  sanctionedAmount: number,

  eligibleAmount: number,
): boolean {
  return (
    getSafeGoldNumber(sanctionedAmount) <= getSafeGoldNumber(eligibleAmount)
  );
}

/* ===========================================================
   REQUEST WITHIN ELIGIBILITY
=========================================================== */

export function isGoldRequestWithinEligibility(
  requestedAmount: number,

  eligibleAmount: number,
): boolean {
  return (
    getSafeGoldNumber(requestedAmount) <= getSafeGoldNumber(eligibleAmount)
  );
}

/* ===========================================================
   VALID WEIGHT RELATIONSHIP

   Gross Weight must never be lower than total deductions.
=========================================================== */

export function isGoldWeightRelationshipValid(
  grossWeightGrams: number,

  stoneWeightGrams: number,

  otherDeductionWeightGrams: number,
): boolean {
  const gross = getSafeGoldNumber(grossWeightGrams);

  const deductions =
    getSafeGoldNumber(stoneWeightGrams) +
    getSafeGoldNumber(otherDeductionWeightGrams);

  return deductions <= gross;
}

/* ===========================================================
   VALID LTV
=========================================================== */

export function isGoldLoanToValueValid(percentage: number): boolean {
  const value = Number(percentage);

  return Number.isFinite(value) && value >= 0 && value <= 100;
}

/* ===========================================================
   GOLD CALCULATION SNAPSHOT

   Useful for Step-1 summary without repeating calculations
   inside React components.
=========================================================== */

export interface GoldCalculationSnapshot {
  items: GoldLoanItem[];

  totals: GoldLoanItemTotals;

  valuation: GoldMarketValuation;

  amounts: GoldLoanAmounts;
}

/* ===========================================================
   BUILD COMPLETE GOLD CALCULATION SNAPSHOT
=========================================================== */

export function buildGoldCalculationSnapshot(
  items: GoldLoanItem[],

  valuationInput: Omit<GoldMarketValuationInput, "items">,

  amountInput: Omit<GoldLoanAmountsInput, "eligibleAmount">,
): GoldCalculationSnapshot {
  const calculatedItems = items.map((item) => recalculateGoldLoanItem(item));

  const totals = calculateGoldLoanItemTotals(calculatedItems);

  const valuation = calculateGoldMarketValuation({
    ...valuationInput,

    items: calculatedItems,
  });

  const amounts = calculateGoldLoanAmounts({
    ...amountInput,

    eligibleAmount: valuation.eligibleLoanAmount,
  });

  return {
    items: calculatedItems,

    totals,

    valuation,

    amounts,
  };
}

/* ===========================================================
   END
=========================================================== */
