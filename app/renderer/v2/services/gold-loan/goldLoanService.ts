/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN SERVICE

   MODULE  : Gold Loan
   LAYER   : Domain / Workflow Service
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Validate Gold Loan Step-1 domain data
   - Normalize customer / valuation / custody input
   - Recalculate authoritative Gold Item totals
   - Recalculate authoritative eligible amount
   - Prevent invalid LTV / requested / sanctioned amounts
   - Prepare Gold Step-1 domain snapshot
   - Prepare physical custody allocation request
   - Coordinate Gold custody allocation
   - Prepare existing Loan Studio Step-2 handoff
   - Keep STANDARD Loan workflow untouched

   IMPORTANT:

   - No React.
   - No UI.
   - No direct StorageManager access.
   - No repository access.
   - No localStorage.
   - No sessionStorage.
   - No theme logic.
   - No responsive logic.
   - No Loan Studio mutation.
   - Existing Loan persistence remains authoritative later.
   - Storage capacity is re-checked by goldStorageService.ts.
   - Gold calculations are re-run here before handoff.
   - UI-calculated monetary values are NEVER trusted blindly.

   ENTRY MODEL:

   STANDARD LOAN
      Existing Step 1
            ↓
         Step 2–6

   GOLD LOAN
      Gold Step 1
            ↓
         Step 2–6

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  calculateGoldEligibleAmount,
  calculateGoldLoanItemTotals,
  recalculateGoldLoanItem,
} from "./goldCalculations";

import { allocateGoldStorage } from "./goldStorageService";

import type {
  GoldStorageAllocationMutationResult,
  GoldStorageState,
} from "./goldStorageService";

import type { GoldLoanItem } from "../../types/gold-loan/goldLoan.types";

import type {
  GoldLockerId,
  GoldRackId,
  GoldRoomId,
  GoldStorageAllocationRequest,
} from "../../types/gold-loan/goldStorage.types";

/* ===========================================================
   ENTRY MODE
=========================================================== */

export type GoldLoanEntryMode = "GOLD";

/* ===========================================================
   CUSTOMER
=========================================================== */

export interface GoldLoanServiceCustomer {
  customerId: string;

  customerName: string;

  phoneNumber: string;

  photo?: string;
}

/* ===========================================================
   STEP-1 INPUT

   This is intentionally independent from React component
   props.

   GoldLoanForm can map its output into this contract.
=========================================================== */

export interface GoldLoanStepOneServiceInput {
  customer: GoldLoanServiceCustomer;

  items: GoldLoanItem[];

  roomId: GoldRoomId;

  lockerId: GoldLockerId;

  rackId: GoldRackId;

  bagNumber: string;

  packetReference: string;

  sealReference: string;

  maxLtvPercentage: number;

  requestedAmount: number;

  sanctionedAmount: number;

  valuerName: string;

  valuerLicenseNumber: string;

  valuationDate: string;

  valuationRemarks: string;
}

/* ===========================================================
   VALIDATION ERROR
=========================================================== */

export interface GoldLoanServiceValidationError {
  field: string;

  message: string;
}

/* ===========================================================
   VALIDATION RESULT
=========================================================== */

export interface GoldLoanServiceValidationResult {
  valid: boolean;

  errors: GoldLoanServiceValidationError[];
}

/* ===========================================================
   AUTHORITATIVE TOTALS
=========================================================== */

export type GoldLoanAuthoritativeTotals = ReturnType<
  typeof calculateGoldLoanItemTotals
>;

/* ===========================================================
   PREPARED STEP-1
=========================================================== */

export interface GoldLoanPreparedStepOne {
  entryMode: GoldLoanEntryMode;

  customer: GoldLoanServiceCustomer;

  items: GoldLoanItem[];

  totals: GoldLoanAuthoritativeTotals;

  valuation: {
    assessedValue: number;

    maxLtvPercentage: number;

    eligibleAmount: number;
  };

  amounts: {
    requestedAmount: number;

    sanctionedAmount: number;

    eligibilityBuffer: number;
  };

  custody: {
    roomId: GoldRoomId;

    lockerId: GoldLockerId;

    rackId: GoldRackId;

    bagNumber: number;

    packetReference: string;

    sealReference: string;
  };

  valuer: {
    name: string;

    licenseNumber: string;

    valuationDate: string;

    remarks: string;
  };

  preparedAt: string;
}

/* ===========================================================
   PREPARE RESULT
=========================================================== */

export interface GoldLoanPreparationResult {
  success: boolean;

  value?: GoldLoanPreparedStepOne;

  validation: GoldLoanServiceValidationResult;

  error?: string;
}

/* ===========================================================
   LOAN IDENTITY

   Existing Loan Studio / Loan Repository can provide these
   final values before custody allocation.
=========================================================== */

export interface GoldLoanPersistenceIdentity {
  loanId: string;

  loanNumber: string;

  allocatedBy: string;
}

/* ===========================================================
   CUSTODY COMMIT RESULT
=========================================================== */

export interface GoldLoanCustodyCommitResult {
  success: boolean;

  storage: GoldStorageAllocationMutationResult;

  error?: string;
}

/* ===========================================================
   STEP-2 HANDOFF

   This contract is deliberately small.

   Existing Loan Studio Step 2 remains authoritative for:

   - Interest
   - Repayment Type
   - Duration
   - EMI calculation
   - Processing Fee
   - Penalty
   - Existing Steps 3–6

   Gold Step 1 supplies the principal and Gold metadata.
=========================================================== */

export interface GoldLoanStudioStepTwoHandoff {
  entryMode: GoldLoanEntryMode;

  targetStep: 2;

  customer: GoldLoanServiceCustomer;

  loanAmount: number;

  goldStepOne: GoldLoanPreparedStepOne;
}

/* ===========================================================
   SAFE STRING
=========================================================== */

function normalizeGoldLoanString(value: string): string {
  return String(value ?? "").trim();
}

/* ===========================================================
   SAFE POSITIVE NUMBER
=========================================================== */

function normalizeGoldLoanNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

/* ===========================================================
   MONEY ROUNDING
=========================================================== */

function roundGoldLoanMoney(value: number): number {
  const safeValue = normalizeGoldLoanNumber(value);

  return Number(safeValue.toFixed(2));
}

/* ===========================================================
   PERCENTAGE ROUNDING
=========================================================== */

function roundGoldLoanPercentage(value: number): number {
  const safeValue = normalizeGoldLoanNumber(value);

  return Number(safeValue.toFixed(4));
}

/* ===========================================================
   BAG NUMBER

   Physical Bag / Packet number must be a positive integer.
=========================================================== */

function parseGoldLoanBagNumber(value: string): number | null {
  const normalized = normalizeGoldLoanString(value);

  if (!normalized) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/* ===========================================================
   DATE CHECK

   We only require a stable YYYY-MM-DD domain value here.

   UI can later provide richer date control.
=========================================================== */

function isValidGoldLoanDate(value: string): boolean {
  const normalized = normalizeGoldLoanString(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return false;
  }

  const parsed = new Date(`${normalized}T00:00:00`);

  return !Number.isNaN(parsed.getTime());
}

/* ===========================================================
   NORMALIZE CUSTOMER
=========================================================== */

function normalizeGoldLoanCustomer(
  customer: GoldLoanServiceCustomer,
): GoldLoanServiceCustomer {
  return {
    customerId: normalizeGoldLoanString(customer.customerId),

    customerName: normalizeGoldLoanString(customer.customerName),

    phoneNumber: normalizeGoldLoanString(customer.phoneNumber),

    photo: customer.photo,
  };
}

/* ===========================================================
   NORMALIZE ITEMS

   Every item is recalculated through authoritative formulas.
=========================================================== */

export function normalizeGoldLoanItems(items: GoldLoanItem[]): GoldLoanItem[] {
  return items.map((item) => recalculateGoldLoanItem(item));
}

/* ===========================================================
   VALIDATE GOLD ITEMS
=========================================================== */

function validateGoldLoanItems(
  items: GoldLoanItem[],
): GoldLoanServiceValidationError[] {
  const errors: GoldLoanServiceValidationError[] = [];

  if (items.length === 0) {
    errors.push({
      field: "items",

      message: "At least one pledged Gold Item is required.",
    });

    return errors;
  }

  items.forEach((item, index) => {
    const fieldPrefix = `items.${index}`;

    if (normalizeGoldLoanNumber(item.quantity) < 1) {
      errors.push({
        field: `${fieldPrefix}.quantity`,

        message: `Gold Item ${index + 1} must have a valid quantity.`,
      });
    }

    if (normalizeGoldLoanNumber(item.grossWeightGrams) <= 0) {
      errors.push({
        field: `${fieldPrefix}.grossWeightGrams`,

        message: `Gold Item ${index + 1} must have positive Gross Weight.`,
      });
    }

    const totalDeduction =
      normalizeGoldLoanNumber(item.stoneWeightGrams) +
      normalizeGoldLoanNumber(item.otherDeductionWeightGrams);

    if (totalDeduction > normalizeGoldLoanNumber(item.grossWeightGrams)) {
      errors.push({
        field: `${fieldPrefix}.deductions`,

        message: `Gold Item ${index + 1} deductions cannot exceed Gross Weight.`,
      });
    }

    if (normalizeGoldLoanNumber(item.netWeightGrams) <= 0) {
      errors.push({
        field: `${fieldPrefix}.netWeightGrams`,

        message: `Gold Item ${index + 1} must produce positive Net Gold Weight.`,
      });
    }

    if (
      normalizeGoldLoanNumber(item.purityPercentage) <= 0 ||
      normalizeGoldLoanNumber(item.purityPercentage) > 100
    ) {
      errors.push({
        field: `${fieldPrefix}.purityPercentage`,

        message: `Gold Item ${index + 1} has invalid purity.`,
      });
    }

    if (normalizeGoldLoanNumber(item.fineGoldWeightGrams) <= 0) {
      errors.push({
        field: `${fieldPrefix}.fineGoldWeightGrams`,

        message: `Gold Item ${index + 1} must produce positive Fine Gold Weight.`,
      });
    }

    if (normalizeGoldLoanNumber(item.marketRatePerGram) <= 0) {
      errors.push({
        field: `${fieldPrefix}.marketRatePerGram`,

        message: `Gold Item ${index + 1} requires a Fine Gold rate per gram.`,
      });
    }

    if (normalizeGoldLoanNumber(item.assessedValue) <= 0) {
      errors.push({
        field: `${fieldPrefix}.assessedValue`,

        message: `Gold Item ${index + 1} must produce a positive assessed value.`,
      });
    }
  });

  return errors;
}

/* ===========================================================
   VALIDATE STEP-1
=========================================================== */

export function validateGoldLoanStepOne(
  input: GoldLoanStepOneServiceInput,
): GoldLoanServiceValidationResult {
  const errors: GoldLoanServiceValidationError[] = [];

  const customer = normalizeGoldLoanCustomer(input.customer);

  if (!customer.customerId) {
    errors.push({
      field: "customer.customerId",

      message: "Customer is required.",
    });
  }

  if (!customer.customerName) {
    errors.push({
      field: "customer.customerName",

      message: "Customer name is required.",
    });
  }

  errors.push(...validateGoldLoanItems(normalizeGoldLoanItems(input.items)));

  if (!normalizeGoldLoanString(input.roomId)) {
    errors.push({
      field: "roomId",

      message: "Gold Locker Room is required.",
    });
  }

  if (!normalizeGoldLoanString(input.lockerId)) {
    errors.push({
      field: "lockerId",

      message: "Gold Locker is required.",
    });
  }

  if (!normalizeGoldLoanString(input.rackId)) {
    errors.push({
      field: "rackId",

      message: "Gold Rack is required.",
    });
  }

  if (parseGoldLoanBagNumber(input.bagNumber) === null) {
    errors.push({
      field: "bagNumber",

      message: "Bag / Packet number must be a positive whole number.",
    });
  }

  const maxLtvPercentage = normalizeGoldLoanNumber(input.maxLtvPercentage);

  if (maxLtvPercentage <= 0 || maxLtvPercentage > 100) {
    errors.push({
      field: "maxLtvPercentage",

      message: "Max LTV must be greater than 0 and not exceed 100%.",
    });
  }

  const authoritativeItems = normalizeGoldLoanItems(input.items);

  const totals = calculateGoldLoanItemTotals(authoritativeItems);

  const eligibleAmount = calculateGoldEligibleAmount(
    totals.totalAssessedValue,
    maxLtvPercentage,
  );

  const requestedAmount = normalizeGoldLoanNumber(input.requestedAmount);

  const sanctionedAmount = normalizeGoldLoanNumber(input.sanctionedAmount);

  if (eligibleAmount <= 0) {
    errors.push({
      field: "eligibleAmount",

      message: "Gold valuation must produce a positive eligible amount.",
    });
  }

  if (requestedAmount <= 0) {
    errors.push({
      field: "requestedAmount",

      message: "Requested amount must be greater than zero.",
    });
  } else if (requestedAmount > eligibleAmount) {
    errors.push({
      field: "requestedAmount",

      message: "Requested amount cannot exceed Gold Loan eligibility.",
    });
  }

  if (sanctionedAmount <= 0) {
    errors.push({
      field: "sanctionedAmount",

      message: "Sanctioned amount must be greater than zero.",
    });
  } else if (sanctionedAmount > eligibleAmount) {
    errors.push({
      field: "sanctionedAmount",

      message: "Sanctioned amount cannot exceed Gold Loan eligibility.",
    });
  }

  const valuationDate = normalizeGoldLoanString(input.valuationDate);

  if (valuationDate && !isValidGoldLoanDate(valuationDate)) {
    errors.push({
      field: "valuationDate",

      message: "Valuation date must use YYYY-MM-DD format.",
    });
  }

  return {
    valid: errors.length === 0,

    errors,
  };
}

/* ===========================================================
   PREPARE GOLD STEP-1

   IMPORTANT:

   UI-provided:
      assessed value
      eligible amount

   are intentionally NOT accepted.

   Both are regenerated here from authoritative Gold Items.
=========================================================== */

export function prepareGoldLoanStepOne(
  input: GoldLoanStepOneServiceInput,
): GoldLoanPreparationResult {
  const normalizedItems = normalizeGoldLoanItems(input.items);

  const normalizedInput: GoldLoanStepOneServiceInput = {
    ...input,

    customer: normalizeGoldLoanCustomer(input.customer),

    items: normalizedItems,
  };

  const validation = validateGoldLoanStepOne(normalizedInput);

  if (!validation.valid) {
    return {
      success: false,

      validation,

      error:
        validation.errors[0]?.message ?? "Gold Loan Step 1 validation failed.",
    };
  }

  const bagNumber = parseGoldLoanBagNumber(normalizedInput.bagNumber);

  if (bagNumber === null) {
    return {
      success: false,

      validation: {
        valid: false,

        errors: [
          {
            field: "bagNumber",

            message: "Bag / Packet number is invalid.",
          },
        ],
      },

      error: "Bag / Packet number is invalid.",
    };
  }

  const totals = calculateGoldLoanItemTotals(normalizedItems);

  const maxLtvPercentage = roundGoldLoanPercentage(
    normalizedInput.maxLtvPercentage,
  );

  const eligibleAmount = roundGoldLoanMoney(
    calculateGoldEligibleAmount(totals.totalAssessedValue, maxLtvPercentage),
  );

  const requestedAmount = roundGoldLoanMoney(normalizedInput.requestedAmount);

  const sanctionedAmount = roundGoldLoanMoney(normalizedInput.sanctionedAmount);

  const eligibilityBuffer = roundGoldLoanMoney(
    Math.max(0, eligibleAmount - sanctionedAmount),
  );

  const prepared: GoldLoanPreparedStepOne = {
    entryMode: "GOLD",

    customer: normalizedInput.customer,

    items: normalizedItems,

    totals,

    valuation: {
      assessedValue: roundGoldLoanMoney(totals.totalAssessedValue),

      maxLtvPercentage,

      eligibleAmount,
    },

    amounts: {
      requestedAmount,

      sanctionedAmount,

      eligibilityBuffer,
    },

    custody: {
      roomId: normalizedInput.roomId,

      lockerId: normalizedInput.lockerId,

      rackId: normalizedInput.rackId,

      bagNumber,

      packetReference: normalizeGoldLoanString(normalizedInput.packetReference),

      sealReference: normalizeGoldLoanString(normalizedInput.sealReference),
    },

    valuer: {
      name: normalizeGoldLoanString(normalizedInput.valuerName),

      licenseNumber: normalizeGoldLoanString(
        normalizedInput.valuerLicenseNumber,
      ),

      valuationDate: normalizeGoldLoanString(normalizedInput.valuationDate),

      remarks: normalizeGoldLoanString(normalizedInput.valuationRemarks),
    },

    preparedAt: new Date().toISOString(),
  };

  return {
    success: true,

    value: prepared,

    validation: {
      valid: true,

      errors: [],
    },
  };
}

/* ===========================================================
   BUILD STORAGE ALLOCATION REQUEST
=========================================================== */

export function buildGoldLoanStorageAllocationRequest(
  stepOne: GoldLoanPreparedStepOne,

  identity: GoldLoanPersistenceIdentity,
): GoldStorageAllocationRequest {
  return {
    loanId: normalizeGoldLoanString(identity.loanId),

    loanNumber: normalizeGoldLoanString(identity.loanNumber),

    customerId: stepOne.customer.customerId,

    customerName: stepOne.customer.customerName,

    customerPhone: stepOne.customer.phoneNumber,

    roomId: stepOne.custody.roomId,

    lockerId: stepOne.custody.lockerId,

    rackId: stepOne.custody.rackId,

    requestedBagNumber: stepOne.custody.bagNumber,

    allocatedBy: normalizeGoldLoanString(identity.allocatedBy),

    remarks: buildGoldCustodyRemarks(stepOne),
  };
}

/* ===========================================================
   CUSTODY REMARKS
=========================================================== */

function buildGoldCustodyRemarks(stepOne: GoldLoanPreparedStepOne): string {
  const values = [
    stepOne.custody.packetReference
      ? `Packet: ${stepOne.custody.packetReference}`
      : "",

    stepOne.custody.sealReference
      ? `Seal: ${stepOne.custody.sealReference}`
      : "",
  ].filter(Boolean);

  return values.join(" | ");
}

/* ===========================================================
   COMMIT GOLD CUSTODY

   The Gold Storage Service performs final hierarchy and
   capacity validation.

   Even when Step-1 UI previously showed available capacity,
   this function can still fail if another allocation consumed
   the last Bag before save.
=========================================================== */

export function commitGoldLoanCustody(
  storageState: GoldStorageState,

  stepOne: GoldLoanPreparedStepOne,

  identity: GoldLoanPersistenceIdentity,
): GoldLoanCustodyCommitResult {
  const loanId = normalizeGoldLoanString(identity.loanId);

  const loanNumber = normalizeGoldLoanString(identity.loanNumber);

  const allocatedBy = normalizeGoldLoanString(identity.allocatedBy);

  if (!loanId || !loanNumber || !allocatedBy) {
    const failedStorage: GoldStorageAllocationMutationResult = {
      success: false,

      state: storageState,

      rooms: [],

      error:
        "Loan identity and allocating user are required before Gold custody allocation.",
    };

    return {
      success: false,

      storage: failedStorage,

      error: failedStorage.error,
    };
  }

  const request = buildGoldLoanStorageAllocationRequest(stepOne, {
    loanId,
    loanNumber,
    allocatedBy,
  });

  const storageResult = allocateGoldStorage(storageState, request);

  if (!storageResult.success) {
    return {
      success: false,

      storage: storageResult,

      error: storageResult.error ?? "Unable to allocate Gold physical custody.",
    };
  }

  return {
    success: true,

    storage: storageResult,
  };
}

/* ===========================================================
   BUILD STEP-2 HANDOFF

   Existing Loan Studio can consume:

   handoff.loanAmount

   as Step-2 principal.

   It does NOT need to know Gold formulas.

   Gold metadata remains attached separately under goldStepOne.
=========================================================== */

export function buildGoldLoanStepTwoHandoff(
  stepOne: GoldLoanPreparedStepOne,
): GoldLoanStudioStepTwoHandoff {
  return {
    entryMode: "GOLD",

    targetStep: 2,

    customer: stepOne.customer,

    loanAmount: stepOne.amounts.sanctionedAmount,

    goldStepOne: stepOne,
  };
}

/* ===========================================================
   PREPARE COMPLETE GOLD STEP-1 HANDOFF
=========================================================== */

export function prepareGoldLoanStepTwoHandoff(
  input: GoldLoanStepOneServiceInput,
): {
  success: boolean;

  preparation: GoldLoanPreparationResult;

  handoff?: GoldLoanStudioStepTwoHandoff;

  error?: string;
} {
  const preparation = prepareGoldLoanStepOne(input);

  if (!preparation.success || !preparation.value) {
    return {
      success: false,

      preparation,

      error: preparation.error ?? "Unable to prepare Gold Loan Step 1.",
    };
  }

  return {
    success: true,

    preparation,

    handoff: buildGoldLoanStepTwoHandoff(preparation.value),
  };
}

/* ===========================================================
   SINGLETON SERVICE
=========================================================== */

export const goldLoanService = {
  normalizeGoldLoanItems,

  validateGoldLoanStepOne,

  prepareGoldLoanStepOne,

  prepareGoldLoanStepTwoHandoff,

  buildGoldLoanStepTwoHandoff,

  buildGoldLoanStorageAllocationRequest,

  commitGoldLoanCustody,
};

/* ===========================================================
   END
=========================================================== */
