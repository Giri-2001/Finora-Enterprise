/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET TRANSACTION CONTRACTS

   RESPONSIBILITY:
   - Define Wallet transaction source contracts
   - Define FINORA platform charge metadata
   - Define Wallet transaction query contracts
   - Define transaction date grouping
   - Define owner-facing transaction read metadata

   IMPORTANT:
   - TYPES / CONTRACTS ONLY.
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No payment gateway calls.
   - No balance calculations.
   - No transaction mutation.
============================================================ */

import type {
  WalletTransaction,
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletTransactionType,
} from "./wallet.types";

/* ============================================================
   SOURCE TYPE
============================================================ */

export type WalletTransactionSourceType =
  | "WALLET"
  | "CUSTOMER"
  | "LOAN"
  | "COLLECTION"
  | "RECEIPT"
  | "PAYMENT"
  | "SYSTEM";

/* ============================================================
   PLATFORM CHARGE CODE
============================================================ */

/**
 * Stable machine-readable charge identity.
 *
 * Display labels belong to constants / formatter layers.
 */
export type WalletPlatformChargeCode =
  | "LOAN_DISBURSEMENT"
  | "LOAN_NUMBER_GENERATION"
  | "CUSTOMER_NUMBER_GENERATION"
  | "COLLECTION_PROCESSING"
  | "RECEIPT_PROCESSING"
  | "CUSTOMER_ID_CARD_GENERATION"
  | "OTHER_PLATFORM_FEE";

/* ============================================================
   TRANSACTION SOURCE REFERENCE
============================================================ */

export interface WalletTransactionSourceReference {
  sourceType:
    WalletTransactionSourceType;

  sourceId?: string;

  referenceId?: string;

  /**
   * Optional human-readable canonical business reference.
   *
   * Examples:
   * FIN-LOAN-RGG-BR1-100001-001
   * FIN-CUS-RGG-BR1-100002
   * RCPT-...
   */
  referenceNumber?: string;
}

/* ============================================================
   PLATFORM CHARGE METADATA
============================================================ */

export interface WalletPlatformChargeMetadata {
  chargeCode:
    WalletPlatformChargeCode;

  source:
    WalletTransactionSourceReference;

  /**
   * Owner-facing single-line reason.
   *
   * Example:
   * Loan number generated: FIN-LOAN-RGG-BR1-100001-001
   */
  remarks: string;
}

/* ============================================================
   TRANSACTION FILTER
============================================================ */

export type WalletTransactionDirectionFilter =
  | "ALL"
  | WalletTransactionDirection;

export type WalletTransactionStatusFilter =
  | "ALL"
  | WalletTransactionStatus;

export type WalletTransactionTypeFilter =
  | "ALL"
  | WalletTransactionType;

/* ============================================================
   TRANSACTION QUERY
============================================================ */

/**
 * Owner-facing transaction-history query.
 *
 * Date strings use YYYY-MM-DD.
 * Empty string means no explicit date selection.
 */
export interface WalletTransactionQuery {
  direction:
    WalletTransactionDirectionFilter;

  status:
    WalletTransactionStatusFilter;

  type:
    WalletTransactionTypeFilter;

  fromDate:
    string;

  toDate:
    string;

  searchText:
    string;
}

/* ============================================================
   DATE GROUP
============================================================ */

/**
 * Transaction group consumed by the Wallet history UI.
 *
 * Formatting of dateLabel belongs to formatter/helper code.
 */
export interface WalletTransactionDateGroup {
  dateKey:
    string;

  dateLabel:
    string;

  transactions:
    WalletTransaction[];
}

/* ============================================================
   HISTORY READ MODEL
============================================================ */

export interface WalletTransactionHistory {
  transactions:
    WalletTransaction[];

  groups:
    WalletTransactionDateGroup[];

  totalCount:
    number;
}

/* ============================================================
   TRANSACTION DATA ISSUE
============================================================ */

/**
 * Represents a transaction record that cannot be safely
 * presented or processed without corrupting Wallet state.
 */
export interface WalletTransactionDataIssue {
  transactionId:
    string;

  message:
    string;
}

/* ============================================================
   END
============================================================ */
