/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET DOMAIN CONTRACTS

   RESPONSIBILITY:
   - Define the canonical FINORA Wallet domain contract
   - Define Wallet identity and business scope
   - Define Wallet account state
   - Define Wallet transaction direction
   - Define Wallet transaction types
   - Define Wallet transaction status
   - Define recharge metadata
   - Define automatic debit metadata
   - Define owner-facing transaction details

   IMPORTANT:
   - TYPES / CONTRACTS ONLY.
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No payment gateway calls.
   - No provider calls.
   - No balance calculations.
   - No storage access.
   - No UI formatting.
   - No direct localStorage access.
   - Wallet does not support withdrawal.
   - Wallet does not support transfer.
   - Wallet does not support cash-out.

   WALLET MODEL:

   RECHARGE
       ↓
   MONEY IN
       ↓
   WALLET BALANCE
       ↓
   FINORA PAID ACTION
       ↓
   MONEY OUT
       ↓
   UPDATED WALLET BALANCE

   VERSION : 1.0
   STATUS  : Production Foundation
============================================================ */

/* ============================================================
   IDENTIFIERS
============================================================ */

/**
 * Stable FINORA Wallet identifier.
 *
 * One Wallet belongs to one Owner / Business / Branch scope.
 */
export type WalletId = string;

/**
 * Stable FINORA Wallet Transaction identifier.
 */
export type WalletTransactionId = string;

/**
 * Optional durable payment reference created by the
 * payment / recharge layer.
 */
export type WalletPaymentReference = string;

/* ============================================================
   ENTITY MARKER
============================================================ */

export const WALLET_ENTITY =
  "WALLET" as const;

export const WALLET_TRANSACTION_ENTITY =
  "WALLET_TRANSACTION" as const;

/* ============================================================
   WALLET STATUS
============================================================ */

/**
 * Wallet availability lifecycle.
 *
 * ACTIVE:
 *   Wallet may receive Recharge and Debit transactions.
 *
 * BLOCKED:
 *   Wallet exists but financial operations are not allowed.
 *
 * CLOSED:
 *   Wallet is permanently inactive.
 */
export type WalletStatus =
  | "ACTIVE"
  | "BLOCKED"
  | "CLOSED";

/* ============================================================
   TRANSACTION DIRECTION
============================================================ */

export type WalletTransactionDirection =
  | "CREDIT"
  | "DEBIT";

/* ============================================================
   MONEY FLOW
============================================================ */

/**
 * Owner-facing financial movement label.
 *
 * CREDIT:
 *   Money added to Wallet.
 *
 * DEBIT:
 *   Money deducted from Wallet.
 */
export type WalletMoneyFlow =
  | "MONEY_IN"
  | "MONEY_OUT";

/* ============================================================
   TRANSACTION TYPES
============================================================ */

export type WalletTransactionType =
  | "WALLET_RECHARGE"
  | "LOAN_DISBURSEMENT_PLATFORM_FEE"
  | "LOAN_NUMBER_GENERATION_FEE"
  | "CUSTOMER_NUMBER_GENERATION_FEE"
  | "COLLECTION_PROCESSING_FEE"
  | "RECEIPT_PROCESSING_FEE"
  | "CUSTOMER_ID_CARD_GENERATION_FEE"
  | "OTHER_PLATFORM_FEE";

/* ============================================================
   TRANSACTION STATUS
============================================================ */

export type WalletTransactionStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REVERSED";

/* ============================================================
   RECHARGE PAYMENT METHOD
============================================================ */

/**
 * Payment methods supported by Wallet Recharge.
 *
 * These are payment-channel identities only.
 * Actual provider execution belongs to the Payment Engine.
 */
export type WalletRechargePaymentMethod =
  | "UPI"
  | "PHONEPE"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "RAZORPAY"
  | "BANK_TRANSFER"
  | "OTHER";

/* ============================================================
   PAYMENT SOURCE
============================================================ */

/**
 * Identifies where a payment reference originated.
 */
export type WalletPaymentSource =
  | "PHONEPE"
  | "RAZORPAY"
  | "UPI"
  | "GOOGLE_PAY"
  | "PAYTM"
  | "BANK_TRANSFER"
  | "MANUAL";

/* ============================================================
   WALLET SCOPE
============================================================ */

/**
 * Authoritative FINORA ownership boundary.
 *
 * Every Wallet record must remain inside this scope.
 */
export interface WalletScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

/* ============================================================
   WALLET IDENTITY
============================================================ */

/**
 * Canonical Wallet identity.
 */
export interface WalletIdentity
  extends WalletScope {
  walletId: WalletId;

  entity: typeof WALLET_ENTITY;
}

/* ============================================================
   WALLET ACCOUNT
============================================================ */

/**
 * Canonical persisted Wallet account.
 *
 * IMPORTANT:
 * - balance is the current authoritative persisted Wallet
 *   balance snapshot.
 * - Wallet services own balance mutation rules.
 * - UI must never mutate balance directly.
 */
export interface WalletAccount
  extends WalletIdentity {
  /**
   * Current available Wallet balance.
   *
   * Expected to be >= 0.
   */
  balance: number;

  /**
   * Wallet lifecycle state.
   */
  status: WalletStatus;

  /**
   * Number of successful Wallet transactions.
   *
   * This is informational metadata.
   * Services remain responsible for authoritative transaction
   * persistence.
   */
  transactionCount: number;

  /**
   * Last successful transaction timestamp.
   */
  lastTransactionAt?: string;

  /**
   * Wallet creation timestamp.
   */
  createdAt: string;

  /**
   * Last Wallet account update timestamp.
   */
  updatedAt: string;

  /**
   * Current schema version.
   */
  schemaVersion: 1;
}

/* ============================================================
   TRANSACTION BASE
============================================================ */

/**
 * Common transaction contract shared by Recharge and Debit.
 */
export interface WalletTransactionBase
  extends WalletScope {
  /**
   * Stable transaction identifier.
   */
  id: WalletTransactionId;

  /**
   * Entity marker.
   */
  entity: typeof WALLET_TRANSACTION_ENTITY;

  /**
   * Wallet that owns this transaction.
   */
  walletId: WalletId;

  /**
   * Transaction classification.
   */
  type: WalletTransactionType;

  /**
   * Financial direction.
   */
  direction: WalletTransactionDirection;

  /**
   * Owner-facing movement.
   */
  moneyFlow: WalletMoneyFlow;

  /**
   * Transaction lifecycle.
   */
  status: WalletTransactionStatus;

  /**
   * Actual transaction amount.
   *
   * Always positive.
   *
   * Direction determines whether it is presented as:
   * +amount or -amount.
   */
  amount: number;

  /**
   * Human-readable transaction heading.
   *
   * Example:
   * Loan Disbursement Platform Fee
   */
  title: string;

  /**
   * Owner-facing single-line transaction remarks.
   *
   * Example:
   * Loan number generated: FIN-LOAN-RGG-BR1-100001-001
   */
  remarks: string;

  /**
   * Exact transaction timestamp.
   *
   * UI formatting belongs outside this contract.
   */
  occurredAt: string;

  /**
   * Available Wallet balance immediately after this
   * successful transaction.
   */
  availableBalance: number;

  /**
   * Optional source business reference.
   *
   * Examples:
   * FIN-LOAN-...
   * FIN-CUS-...
   * RCPT-...
   */
  referenceId?: string;

  /**
   * Optional source entity identifier.
   */
  sourceId?: string;

  /**
   * Optional source entity type.
   *
   * Examples:
   * LOAN
   * CUSTOMER
   * COLLECTION
   */
  sourceType?: string;

  /**
   * Optional payment reference.
   *
   * Primarily used by successful Wallet Recharge records.
   */
  paymentReference?: WalletPaymentReference;

  /**
   * Creation timestamp.
   */
  createdAt: string;

  /**
   * Last transaction record update timestamp.
   */
  updatedAt: string;

  /**
   * Current schema version.
   */
  schemaVersion: 1;
}

/* ============================================================
   RECHARGE TRANSACTION
============================================================ */

/**
 * Successful / pending Wallet Recharge transaction.
 */
export interface WalletRechargeTransaction
  extends WalletTransactionBase {
  type: "WALLET_RECHARGE";

  direction: "CREDIT";

  moneyFlow: "MONEY_IN";

  /**
   * Recharge channel used by the owner.
   */
  paymentMethod: WalletRechargePaymentMethod;

  /**
   * Payment provider/source identity.
   */
  paymentSource: WalletPaymentSource;
}

/* ============================================================
   DEBIT TRANSACTION
============================================================ */

/**
 * Automatic FINORA platform debit.
 *
 * There is deliberately no withdrawal transaction type.
 */
export interface WalletDebitTransaction
  extends WalletTransactionBase {
  direction: "DEBIT";

  moneyFlow: "MONEY_OUT";

  /**
   * Human-readable platform charge reason.
   *
   * Examples:
   * Loan Disbursement Platform Fee
   * Collection Processing Fee
   */
  chargeReason: string;
}

/* ============================================================
   CANONICAL TRANSACTION UNION
============================================================ */

export type WalletTransaction =
  | WalletRechargeTransaction
  | WalletDebitTransaction;

/* ============================================================
   TRANSACTION SUMMARY
============================================================ */

/**
 * Lightweight owner-facing Wallet summary.
 *
 * Calculation logic belongs to Wallet balance helpers/services.
 */
export interface WalletTransactionSummary {
  totalTransactions: number;

  totalCredits: number;

  totalDebits: number;

  currentBalance: number;
}

/* ============================================================
   WALLET VIEW
============================================================ */

/**
 * Owner-facing Wallet read model.
 *
 * UI consumes this contract but does not calculate or mutate
 * financial state.
 */
export interface WalletView {
  wallet: WalletAccount;

  transactions: WalletTransaction[];

  summary: WalletTransactionSummary;
}

/* ============================================================
   END
============================================================ */
