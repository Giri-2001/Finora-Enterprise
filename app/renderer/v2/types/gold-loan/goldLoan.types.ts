/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN TYPES

   MODULE  : Gold Loan
   LAYER   : Domain Contracts
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define Gold Loan Step-1 domain contracts
   - Define pledged Gold Item contracts
   - Define valuation contracts
   - Define purity contracts
   - Define Gold Loan amount contracts
   - Define selected custody-location contract
   - Define Step-1 draft / validation contracts

   IMPORTANT:

   - No React.
   - No UI.
   - No persistence.
   - No calculations.
   - No StorageManager.
   - No repository access.
   - No hardcoded market rates.
   - No hardcoded LTV percentage.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  GoldBagId,
  GoldLockerId,
  GoldRackId,
  GoldRoomId,
  GoldStorageLocationCode,
} from "./goldStorage.types";

/* ===========================================================
   GOLD LOAN ID
=========================================================== */

export type GoldLoanDraftId = string;

/* ===========================================================
   GOLD ITEM ID
=========================================================== */

export type GoldItemId = string;

/* ===========================================================
   GOLD LOAN STEP MODE
=========================================================== */

export type GoldLoanStepMode = "CREATE" | "EDIT" | "VIEW";

/* ===========================================================
   GOLD LOAN DRAFT STATUS
=========================================================== */

export type GoldLoanDraftStatus = "DRAFT" | "READY" | "COMPLETED";

/* ===========================================================
   GOLD ITEM TYPE

   "OTHER" keeps the form flexible for local jewellery
   terminology without forcing unsupported classifications.
=========================================================== */

export type GoldItemType =
  | "CHAIN"
  | "NECKLACE"
  | "BANGLES"
  | "BRACELET"
  | "RING"
  | "EARRINGS"
  | "PENDANT"
  | "ANKLET"
  | "COIN"
  | "BISCUIT"
  | "BAR"
  | "MANGALSUTRA"
  | "WAIST_BELT"
  | "NOSE_PIN"
  | "OTHER";

/* ===========================================================
   GOLD PURITY / KARAT
=========================================================== */

export type GoldPurityKarat =
  | 24
  | 23
  | 22
  | 21
  | 20
  | 18
  | 16
  | 14
  | 12
  | 10
  | 9
  | 8;

/* ===========================================================
   HALLMARK STATUS
=========================================================== */

export type GoldHallmarkStatus = "HALLMARKED" | "NOT_HALLMARKED" | "UNKNOWN";

/* ===========================================================
   VALUATION SOURCE
=========================================================== */

export type GoldValuationSource = "MANUAL" | "SETTINGS_RATE" | "EXTERNAL_RATE";

/* ===========================================================
   GOLD ITEM
=========================================================== */

export interface GoldLoanItem {
  id: GoldItemId;

  itemType: GoldItemType;

  itemName: string;

  description: string;

  quantity: number;

  /* ---------------------------------------------------------
     WEIGHT
  --------------------------------------------------------- */

  grossWeightGrams: number;

  stoneWeightGrams: number;

  otherDeductionWeightGrams: number;

  netWeightGrams: number;

  /* ---------------------------------------------------------
     PURITY
  --------------------------------------------------------- */

  purityKarat: GoldPurityKarat;

  purityPercentage: number;

  fineGoldWeightGrams: number;

  /* ---------------------------------------------------------
     HALLMARK
  --------------------------------------------------------- */

  hallmarkStatus: GoldHallmarkStatus;

  hallmarkReference: string;

  /* ---------------------------------------------------------
     VALUATION
  --------------------------------------------------------- */

  marketRatePerGram: number;

  assessedValue: number;

  /* ---------------------------------------------------------
     OPTIONAL INTERNAL NOTE
  --------------------------------------------------------- */

  remarks: string;
}

/* ===========================================================
   GOLD ITEM TOTALS

   These values are derived from GoldLoanItem[].

   Calculation belongs to goldCalculations.ts.
=========================================================== */

export interface GoldLoanItemTotals {
  itemCount: number;

  totalQuantity: number;

  totalGrossWeightGrams: number;

  totalStoneWeightGrams: number;

  totalOtherDeductionWeightGrams: number;

  totalNetWeightGrams: number;

  totalFineGoldWeightGrams: number;

  totalAssessedValue: number;
}

/* ===========================================================
   GOLD MARKET VALUATION
=========================================================== */

export interface GoldMarketValuation {
  valuationSource: GoldValuationSource;

  valuationDate: string;

  marketRatePerGram: number;

  defaultPurityKarat: GoldPurityKarat;

  /* ---------------------------------------------------------
     CONFIGURABLE LTV

     Owner / business settings provide this value.

     Example:
       75
       80

     The Gold Loan Engine must NOT hardcode a percentage.
  --------------------------------------------------------- */

  maxLoanToValuePercentage: number;

  /* ---------------------------------------------------------
     AGGREGATED VALUES
  --------------------------------------------------------- */

  grossWeightGrams: number;

  stoneWeightGrams: number;

  otherDeductionWeightGrams: number;

  netWeightGrams: number;

  fineGoldWeightGrams: number;

  marketValue: number;

  eligibleLoanAmount: number;
}

/* ===========================================================
   GOLD LOAN AMOUNTS
=========================================================== */

export interface GoldLoanAmounts {
  requestedAmount: number;

  eligibleAmount: number;

  sanctionedAmount: number;

  /* ---------------------------------------------------------
     Difference between eligibility and sanctioned value.

     Informational only.
  --------------------------------------------------------- */

  eligibilityBuffer: number;
}

/* ===========================================================
   GOLD VALUER / APPRAISER
=========================================================== */

export interface GoldLoanValuer {
  valuerId: string;

  valuerName: string;

  valuationDate: string;

  remarks: string;
}

/* ===========================================================
   GOLD STORAGE SELECTION

   This is the Step-1 selected physical custody destination.

   Final persisted allocation will be owned by
   GoldCustodyAllocation in goldStorage.types.ts.
=========================================================== */

export interface GoldLoanStorageSelection {
  roomId: GoldRoomId;

  roomNumber: number;

  roomName: string;

  lockerId: GoldLockerId;

  lockerNumber: number;

  lockerName: string;

  rackId: GoldRackId;

  rackNumber: number;

  rackName: string;

  /* ---------------------------------------------------------
     Bag number can be suggested automatically or selected
     manually if storage policy allows it.
  --------------------------------------------------------- */

  bagId: GoldBagId;

  bagNumber: number;

  locationCode: GoldStorageLocationCode;

  /* ---------------------------------------------------------
     Snapshot of available rack capacity at selection time.

     Final save must always re-check capacity.
  --------------------------------------------------------- */

  rackCapacity: number;

  rackOccupied: number;

  rackAvailable: number;

  isAutoSuggested: boolean;
}

/* ===========================================================
   CUSTOMER SNAPSHOT

   IMPORTANT:

   Gold Loan Step-1 will reuse the existing Loans Office
   customer selector.

   This contract stores only the customer identity required
   by the Gold Loan draft.

   It does NOT create a second Customer model.
=========================================================== */

export interface GoldLoanCustomerSnapshot {
  customerId: string;

  customerName: string;

  mobileNumber: string;

  profilePhoto: string;
}

/* ===========================================================
   GOLD LOAN FORM INFORMATION
=========================================================== */

export interface GoldLoanInformation {
  purpose: string;

  remarks: string;

  packetDescription: string;

  sealReference: string;
}

/* ===========================================================
   GOLD LOAN STEP-1 DRAFT

   This is the complete Gold-specific Step-1 payload.

   Step 2 onward will reuse the existing FINORA Loan Studio.
=========================================================== */

export interface GoldLoanStepOneDraft {
  id: GoldLoanDraftId;

  mode: GoldLoanStepMode;

  status: GoldLoanDraftStatus;

  /* ---------------------------------------------------------
     CUSTOMER
  --------------------------------------------------------- */

  customer: GoldLoanCustomerSnapshot | null;

  /* ---------------------------------------------------------
     PLEDGED ITEMS
  --------------------------------------------------------- */

  items: GoldLoanItem[];

  itemTotals: GoldLoanItemTotals;

  /* ---------------------------------------------------------
     VALUATION
  --------------------------------------------------------- */

  valuation: GoldMarketValuation;

  amounts: GoldLoanAmounts;

  valuer: GoldLoanValuer;

  /* ---------------------------------------------------------
     PHYSICAL CUSTODY
  --------------------------------------------------------- */

  storageSelection: GoldLoanStorageSelection | null;

  /* ---------------------------------------------------------
     ADDITIONAL GOLD-SPECIFIC INFORMATION
  --------------------------------------------------------- */

  information: GoldLoanInformation;

  /* ---------------------------------------------------------
     AUDIT
  --------------------------------------------------------- */

  createdAt: string;

  updatedAt: string;
}

/* ===========================================================
   GOLD LOAN SETTINGS

   Owner-configurable Gold valuation behaviour.

   Physical Room / Locker / Rack settings remain owned by
   GoldStorageSettings.
=========================================================== */

export interface GoldLoanSettings {
  defaultPurityKarat: GoldPurityKarat;

  defaultMarketRatePerGram: number;

  maxLoanToValuePercentage: number;

  valuationSource: GoldValuationSource;

  allowManualMarketRate: boolean;

  allowManualRackSelection: boolean;

  allowManualBagNumber: boolean;

  updatedAt: string;

  updatedBy: string;
}

/* ===========================================================
   FIELD VALIDATION
=========================================================== */

export type GoldLoanValidationField =
  | "customer"
  | "items"
  | "grossWeight"
  | "netWeight"
  | "purity"
  | "marketRate"
  | "marketValue"
  | "eligibleAmount"
  | "requestedAmount"
  | "sanctionedAmount"
  | "valuer"
  | "valuationDate"
  | "room"
  | "locker"
  | "rack"
  | "bag";

/* ===========================================================
   VALIDATION ERROR
=========================================================== */

export interface GoldLoanValidationError {
  field: GoldLoanValidationField;

  message: string;
}

/* ===========================================================
   VALIDATION RESULT
=========================================================== */

export interface GoldLoanValidationResult {
  valid: boolean;

  errors: GoldLoanValidationError[];
}

/* ===========================================================
   GOLD STEP-1 COMPLETION PAYLOAD

   This will later become the bridge:

   GoldLoanForm
        ↓
   Existing Loan Studio Step 2
=========================================================== */

export interface GoldLoanStepOneCompletionPayload {
  draft: GoldLoanStepOneDraft;

  customerId: string;

  sanctionedAmount: number;

  goldMarketValue: number;

  goldEligibleAmount: number;

  storageLocationCode: string;
}

/* ===========================================================
   GOLD ITEM OPTION

   Used later by GoldItems UI dropdown/control.

   UI does not need to hardcode labels repeatedly.
=========================================================== */

export interface GoldItemTypeOption {
  value: GoldItemType;

  label: string;
}

/* ===========================================================
   PURITY OPTION
=========================================================== */

export interface GoldPurityOption {
  karat: GoldPurityKarat;

  label: string;

  purityPercentage: number;
}

/* ===========================================================
   END
=========================================================== */
