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
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BranchId,
  BusinessId,
  OwnerId,
} from "../business/business.identity.types";

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
