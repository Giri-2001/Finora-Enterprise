// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// NUMBERING DOMAIN TYPES
//
// RESPONSIBILITY:
//
// - Define FINORA human-readable numbering contracts
// - Define the locked Customer Series configuration
// - Define Customer / Loan / Collection / Receipt number parts
// - Keep owner-controlled and system-controlled values separate
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No number generation logic.
// - No sequence mutation logic.
// - No persistence.
// - No React.
// - No StorageManager access.
// - Internal database IDs are NOT defined here.
//
// VERSION : 1.3
// STATUS  : Production Foundation
// ============================================================

import type {
  BranchId,
  BusinessId,
  OwnerId,
} from "../business/business.scope.types";

// ============================================================
// NUMBERING ENTITY
// ============================================================

export type FinoraNumberingEntity =
  | "CUSTOMER"
  | "LOAN"
  | "COLLECTION"
  | "RECEIPT";

// ============================================================
// CUSTOMER SERIES STATUS
// ============================================================

export type CustomerSeriesStatus =
  | "UNCONFIGURED"
  | "LOCKED";

// ============================================================
// NUMBERING SCOPE
//
// businessCode and branchCode are resolved by FINORA.
// They are not owner-editable series controls.
// ============================================================

export interface FinoraNumberingScope {
  ownerId: OwnerId;

  businessId: BusinessId;

  branchId: BranchId;

  businessCode: string;

  branchCode: string;
}

// ============================================================
// CUSTOMER SERIES SETUP INPUT
//
// This is the ONLY owner-controlled numbering value.
//
// Example:
// startingCustomerNumber = 100001
// ============================================================

export interface CustomerSeriesSetupInput {
  startingCustomerNumber: number;
}

// ============================================================
// CUSTOMER SERIES CONFIGURATION
//
// Once status becomes LOCKED:
//
// - startingCustomerNumber cannot be changed by normal Settings.
// - businessCode cannot be changed by normal Settings.
// - branchCode cannot be changed by normal Settings.
// - lastIssuedCustomerNumber is system-owned.
//
// lastIssuedCustomerNumber:
//
// null
//   No Customer number has been issued yet.
//
// number
//   Last permanently issued Customer root number.
// ============================================================

export interface CustomerSeriesConfiguration
  extends FinoraNumberingScope {

  startingCustomerNumber: number;

  lastIssuedCustomerNumber:
    number | null;

  status:
    CustomerSeriesStatus;

  lockedAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
}

// ============================================================
// NUMBER PARTS
//
// Customer:
// FIN-CUS-{BUSINESS}-{BRANCH}-{CUSTOMER}
//
// Loan:
// FIN-LOAN-{BUSINESS}-{BRANCH}-{CUSTOMER}-{LOAN}
//
// Collection:
// FIN-COL-{BUSINESS}-{BRANCH}-{CUSTOMER}-{LOAN}-{COLLECTION}
//
// Receipt:
// FIN-RCP-{BUSINESS}-{BRANCH}-{CUSTOMER}-{LOAN}-{COLLECTION}
//
// Receipt intentionally mirrors the Collection transaction
// sequence. It does not own a separate receipt sequence.
// ============================================================

export interface FinoraNumberParts {
  businessCode: string;

  branchCode: string;

  customerNumber: number;

  loanSequence?:
    number;

  collectionSequence?:
    number;
}

// ============================================================
// GENERATED REFERENCE
// ============================================================

export interface FinoraNumberReference {
  entity:
    FinoraNumberingEntity;

  value:
    string;

  parts:
    FinoraNumberParts;
}

// ============================================================
// CUSTOMER NUMBER PREVIEW
//
// Preview does NOT permanently consume a sequence.
// ============================================================

export interface CustomerNumberPreview {
  customerNumber:
    number;

  customerId:
    string;
}

// ============================================================
// CUSTOMER SERIES SETUP PREVIEW
//
// Used by Settings before the Customer Series is permanently
// locked.
//
// Business / Branch codes are sanitized immutable numbering
// codes resolved by the Numbering Service from trusted FINORA
// provisioning.
// ============================================================

export interface CustomerSeriesSetupPreview
  extends CustomerNumberPreview {

  businessCode:
    string;

  branchCode:
    string;
}

// ============================================================
// CUSTOMER NUMBERING BINDING
//
// Compatibility bridge for historical / non-canonical Customer
// IDs created before the FINORA Numbering Engine.
//
// IMPORTANT:
//
// - legacyCustomerId remains the visible historical Customer ID.
// - canonicalCustomerId is a hidden numbering root reference.
// - customerNumber is reserved permanently from the branch
//   Customer master series.
// - Historical Customer records are NOT rewritten.
// - No timestamp / suffix guessing is permitted.
// - One immutable binding exists per historical Customer.
// ============================================================

export interface CustomerNumberingBinding
  extends FinoraNumberingScope {

  legacyCustomerId:
    string;

  canonicalCustomerId:
    string;

  customerNumber:
    number;

  createdAt:
    string;
}

// ============================================================
// LOAN SEQUENCE STATE
//
// Loan numbering is NOT a branch-level master series.
//
// Each Customer owns an independent system-controlled
// subordinate Loan sequence:
//
// Customer 100001:
//   001, 002, 003...
//
// Customer 100002:
//   001, 002, 003...
//
// No owner-editable starting value exists.
//
// lastIssuedLoanSequence:
//
// null
//   No Loan number has been permanently issued yet.
//
// number
//   Last permanently issued Loan sequence for this Customer.
//
// customerId is retained as the human-readable Customer
// reference associated with customerNumber.
//
// Internal database Customer IDs are not used here.
// ============================================================

export interface LoanSequenceState
  extends FinoraNumberingScope {

  customerId:
    string;

  customerNumber:
    number;

  lastIssuedLoanSequence:
    number | null;

  createdAt:
    string;

  updatedAt:
    string;
}

// ============================================================
// LOAN NUMBER PREVIEW
// ============================================================

export interface LoanNumberPreview {
  customerNumber:
    number;

  loanSequence:
    number;

  loanNumber:
    string;
}

// ============================================================
// LOAN NUMBERING BINDING
//
// Compatibility bridge for historical / non-canonical Loan
// Numbers created before the FINORA Numbering Engine.
//
// IMPORTANT:
//
// - legacyLoanNumber remains the visible historical Loan Number.
// - canonicalLoanNumber is a hidden hierarchical numbering root.
// - customerId is the visible Customer reference associated
//   with the historical Loan.
// - customerNumber + loanSequence define the hidden canonical
//   Loan hierarchy.
// - Historical Loan records are NOT rewritten.
// - No timestamp / suffix guessing is permitted.
// - One immutable binding exists per historical Loan.
// ============================================================

export interface LoanNumberingBinding
  extends FinoraNumberingScope {

  customerId:
    string;

  legacyLoanNumber:
    string;

  canonicalLoanNumber:
    string;

  customerNumber:
    number;

  loanSequence:
    number;

  createdAt:
    string;
}

// ============================================================
// COLLECTION SEQUENCE STATE
//
// Collection numbering is NOT a branch-level master series.
//
// Each canonical Loan owns an independent system-controlled
// subordinate Collection sequence:
//
// Loan ...-001:
//   001, 002, 003...
//
// Loan ...-002:
//   001, 002, 003...
//
// Receipt owns no separate sequence. It mirrors the exact
// Collection sequence.
//
// canonicalLoanNumber:
//
// - Current-format Loans use their visible Loan Number.
// - Historical Loans use the immutable hidden Loan Number
//   resolved through LoanNumberingBinding.
//
// lastIssuedCollectionSequence:
//
// null
//   No Collection number has been permanently issued yet.
//
// number
//   Last permanently issued Collection sequence for this Loan.
// ============================================================

export interface CollectionSequenceState
  extends FinoraNumberingScope {

  canonicalLoanNumber:
    string;

  customerNumber:
    number;

  loanSequence:
    number;

  lastIssuedCollectionSequence:
    number | null;

  createdAt:
    string;

  updatedAt:
    string;
}

// ============================================================
// COLLECTION / RECEIPT PAIR
//
// One Collection transaction produces one matching Receipt
// reference using the same collectionSequence.
// ============================================================

export interface CollectionReceiptNumberPair {
  customerNumber:
    number;

  loanSequence:
    number;

  collectionSequence:
    number;

  collectionNumber:
    string;

  receiptNumber:
    string;
}

// ============================================================
// END
// ============================================================
