/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   ACCOUNTS DOMAIN CONTRACTS

   RESPONSIBILITY:
   - Define Accounts Engine domain contracts
   - Define ledger entry contracts
   - Define owner-facing account classifications
   - Define filter contracts
   - Define summary contracts
   - Define printable period contracts

   IMPORTANT:
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No service access.
   - No calculations.
   - No source-record mutation.
   - No UI formatting.
   - No hardcoded business records.

   ACCOUNTING DISPLAY MODEL:

   MONEY OUT
     =
   DEBIT
     =
   Money physically / financially moving out of business.

   MONEY IN
     =
   CREDIT
     =
   Money physically / financially coming into business.

   CURRENT FINORA SOURCES:

   Loan Disbursement
       ↓
   MONEY OUT / DEBIT

   Collection Received
       ↓
   MONEY IN / CREDIT

   VERSION : 1.0
=========================================================== */

/* ===========================================================
   ACCOUNT DIRECTION
=========================================================== */

export type AccountDirection = "DEBIT" | "CREDIT";

/* ===========================================================
   OWNER-FACING MONEY FLOW
=========================================================== */

export type AccountMoneyFlow = "MONEY_OUT" | "MONEY_IN";

/* ===========================================================
   ACCOUNT SOURCE
=========================================================== */

export type AccountSourceType = "LOAN" | "COLLECTION";

/* ===========================================================
   ACCOUNT ACTIVITY
=========================================================== */

export type AccountActivity = "LOAN_DISBURSEMENT" | "COLLECTION_RECEIVED";

/* ===========================================================
   LOAN TYPE
=========================================================== */

export type AccountLoanType = "STANDARD" | "GOLD";

/* ===========================================================
   PAYMENT METHOD

   UNKNOWN is intentionally supported because historical
   records may contain older / missing payment metadata.
=========================================================== */

export type AccountPaymentMethod =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "CARD"
  | "OTHER"
  | "UNKNOWN";

/* ===========================================================
   PERIOD PRESET

   These values belong to Accounts filtering only.
   Actual date calculations belong to selectors/helpers.
=========================================================== */

export type AccountPeriodPreset =
  | "TODAY"
  | "YESTERDAY"
  | "SELECT_DATE"
  | "THIS_MONTH"
  | "SELECT_MONTH"
  | "THIS_YEAR"
  | "SELECT_YEAR"
  | "CUSTOM_RANGE"
  | "ALL_TIME";

/* ===========================================================
   ACTIVITY FILTER
=========================================================== */

export type AccountActivityFilter = "ALL" | AccountActivity;

/* ===========================================================
   LOAN TYPE FILTER
=========================================================== */

export type AccountLoanTypeFilter = "ALL" | AccountLoanType;

/* ===========================================================
   PAYMENT METHOD FILTER
=========================================================== */

export type AccountPaymentMethodFilter = "ALL" | AccountPaymentMethod;

/* ===========================================================
   ACCOUNT LEDGER ENTRY

   IMPORTANT:

   - amount must represent the actual financial movement.
   - moneyOut and moneyIn are display-ready numeric sides.
   - Only one side should contain a positive amount.
   - The opposite side should be zero.
   - No derived totals belong here.
=========================================================== */

export interface AccountEntry {
  /**
   * Stable Accounts read-model identifier.
   *
   * Example:
   * LOAN:<loanId>
   * COLLECTION:<collectionId>
   */
  id: string;

  /**
   * Authoritative source entity.
   */
  sourceType: AccountSourceType;

  /**
   * Authoritative source entity identifier.
   */
  sourceId: string;

  /**
   * Human-readable authoritative reference.
   *
   * Loan:
   * FIN-LOAN-...
   *
   * Collection:
   * RCPT-...
   */
  sourceReference: string;

  /**
   * Exact financial movement timestamp.
   */
  occurredAt: string;

  /**
   * Normalized local ledger date key.
   *
   * YYYY-MM-DD
   */
  dateKey: string;

  /**
   * Owner-facing ledger classification.
   */
  direction: AccountDirection;

  /**
   * Simplified owner-facing flow.
   */
  moneyFlow: AccountMoneyFlow;

  /**
   * Nature of transaction.
   */
  activity: AccountActivity;

  /**
   * Actual financial movement amount.
   *
   * Always expected to be >= 0.
   */
  amount: number;

  /**
   * Debit-side display value.
   *
   * MONEY OUT:
   * positive amount.
   *
   * MONEY IN:
   * zero.
   */
  moneyOut: number;

  /**
   * Credit-side display value.
   *
   * MONEY IN:
   * positive amount.
   *
   * MONEY OUT:
   * zero.
   */
  moneyIn: number;

  /**
   * Customer identity.
   */
  customerId: string;

  customerName: string;

  customerPhone?: string;

  /**
   * Loan relationship.
   */
  loanId?: string;

  loanNumber?: string;

  loanType?: AccountLoanType;

  /**
   * Collection relationship.
   */
  collectionId?: string;

  receiptNumber?: string;

  /**
   * Payment / disbursement method.
   *
   * Normalized value is used by filters.
   */
  paymentMethod: AccountPaymentMethod;

  /**
   * Original persisted method text.
   *
   * Preserved for owner display when available.
   */
  paymentMethodLabel: string;

  /**
   * Optional source description.
   *
   * Examples:
   * Gold Loan Disbursed
   * Standard Loan Collection
   */
  description: string;

  /**
   * Optional source remarks.
   */
  remarks?: string;
}

/* ===========================================================
   CUSTOMER FILTER OPTION
=========================================================== */

export interface AccountsCustomerOption {
  customerId: string;

  customerName: string;

  customerPhone?: string;
}

/* ===========================================================
   ACCOUNTS FILTER STATE

   IMPORTANT:
   - Dates use YYYY-MM-DD.
   - Month uses YYYY-MM.
   - Year uses YYYY.
   - Empty string means not selected.
=========================================================== */

export interface AccountsFilterState {
  /**
   * Main date-period mode.
   */
  period: AccountPeriodPreset;

  /**
   * Used by SELECT_DATE.
   */
  selectedDate: string;

  /**
   * Used by CUSTOM_RANGE.
   */
  fromDate: string;

  toDate: string;

  /**
   * Used by SELECT_MONTH.
   */
  selectedMonth: string;

  /**
   * Used by SELECT_YEAR.
   */
  selectedYear: string;

  /**
   * Financial activity.
   */
  activity: AccountActivityFilter;

  /**
   * Standard / Gold filtering.
   */
  loanType: AccountLoanTypeFilter;

  /**
   * Customer filtering.
   *
   * Empty string means all customers.
   */
  customerId: string;

  /**
   * Payment-method filtering.
   */
  paymentMethod: AccountPaymentMethodFilter;

  /**
   * Free-text ledger search.
   *
   * Intended for:
   * customer name
   * phone
   * loan number
   * receipt number
   * reference
   */
  searchText: string;
}

/* ===========================================================
   ACCOUNTS SUMMARY

   FORMULA OWNERSHIP:
   Actual calculation belongs to accountsTotals.ts.

   Net Movement:
   Money In - Money Out
=========================================================== */

export interface AccountsSummary {
  /**
   * Total debit / outgoing movement.
   */
  totalMoneyOut: number;

  /**
   * Total credit / incoming movement.
   */
  totalMoneyIn: number;

  /**
   * totalMoneyIn - totalMoneyOut
   */
  netMovement: number;

  /**
   * Number of visible ledger transactions.
   */
  transactionCount: number;

  /**
   * Number of debit transactions.
   */
  moneyOutCount: number;

  /**
   * Number of credit transactions.
   */
  moneyInCount: number;
}

/* ===========================================================
   ACCOUNTS LEDGER VIEW

   Final read-model consumed by Accounts Office.
=========================================================== */

export interface AccountsLedgerView {
  entries: AccountEntry[];

  summary: AccountsSummary;

  /**
   * Unique customers represented in current result.
   */
  customerCount: number;

  /**
   * Human-readable selected period.
   *
   * Example:
   * Today
   * 30 Aug 2026
   * August 2026
   * 01 Aug 2026 - 30 Aug 2026
   * All Time
   */
  periodLabel: string;
}

/* ===========================================================
   ACCOUNTS DOCUMENT PERIOD

   Used by PDF / PRINT / SHARE layer.

   This is intentionally independent from JSX.
=========================================================== */

export interface AccountsDocumentPeriod {
  preset: AccountPeriodPreset;

  label: string;

  fromDate?: string;

  toDate?: string;

  selectedDate?: string;

  selectedMonth?: string;

  selectedYear?: string;
}

/* ===========================================================
   ACCOUNTS DOCUMENT REQUEST

   Snapshot of the currently filtered Accounts view.

   PDF builders consume this contract instead of reaching
   into UI state directly.
=========================================================== */

export interface AccountsDocumentRequest {
  title: string;

  period: AccountsDocumentPeriod;

  filters: AccountsFilterState;

  entries: AccountEntry[];

  summary: AccountsSummary;

  generatedAt: string;
}

/* ===========================================================
   ACCOUNT ENTRY GROUP

   Useful for date-wise owner register rendering.

   Example:

   30 AUG 2026
   -----------------
   entries...
=========================================================== */

export interface AccountsDateGroup {
  dateKey: string;

  dateLabel: string;

  entries: AccountEntry[];

  summary: AccountsSummary;
}

/* ===========================================================
   ACCOUNT DATA ISSUE

   Accounts is a derived read model.

   Source records that cannot safely become ledger movements
   can be reported without corrupting the visible totals.
=========================================================== */

export interface AccountDataIssue {
  sourceType: AccountSourceType;

  sourceId: string;

  message: string;
}

/* ===========================================================
   ACCOUNTS DATA RESULT

   Service-level result before UI filtering.
=========================================================== */

export interface AccountsDataResult {
  entries: AccountEntry[];

  customers: AccountsCustomerOption[];

  issues: AccountDataIssue[];
}

/* ===========================================================
   END
=========================================================== */
