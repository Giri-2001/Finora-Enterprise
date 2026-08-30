/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   ACCOUNTS CONSTANTS

   RESPONSIBILITY:
   - Define owner-facing Accounts labels
   - Define filter option metadata
   - Define default Accounts filter state
   - Define register headings
   - Define semantic transaction labels
   - Keep UI wording centralized

   IMPORTANT:
   - No React.
   - No Lucide icons.
   - No styles.
   - No calculations.
   - No persistence.
   - No repository access.
   - No service access.
   - No date calculations.
   - No currency formatting.
   - No hardcoded business records.

   OWNER UX RULE:

   Technical accounting terminology is preserved,
   but always paired with simple language:

   DEBIT
     =
   MONEY OUT

   CREDIT
     =
   MONEY IN

   VERSION : 1.0
=========================================================== */

import type {
  AccountActivity,
  AccountLoanType,
  AccountPaymentMethod,
  AccountPeriodPreset,
  AccountsFilterState,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   PRODUCT COPY
=========================================================== */

export const ACCOUNTS_PAGE_TITLE = "Accounts Office";

export const ACCOUNTS_PAGE_SUBTITLE =
  "See every rupee that came in and went out.";

/* ===========================================================
   REGISTER COPY
=========================================================== */

export const ACCOUNTS_REGISTER_TITLE = "Daily Accounts Register";

export const ACCOUNTS_REGISTER_SUBTITLE =
  "Loans given and collections received in one simple register.";

/* ===========================================================
   SUMMARY COPY
=========================================================== */

export const ACCOUNTS_MONEY_OUT_TITLE = "Money Out";

export const ACCOUNTS_MONEY_OUT_ACCOUNTING_LABEL = "Debit";

export const ACCOUNTS_MONEY_OUT_SUBTITLE = "Loans and disbursements";

export const ACCOUNTS_MONEY_IN_TITLE = "Money In";

export const ACCOUNTS_MONEY_IN_ACCOUNTING_LABEL = "Credit";

export const ACCOUNTS_MONEY_IN_SUBTITLE = "Collections received";

export const ACCOUNTS_NET_MOVEMENT_TITLE = "Net Movement";

export const ACCOUNTS_NET_MOVEMENT_SUBTITLE = "Money In minus Money Out";

export const ACCOUNTS_TRANSACTIONS_TITLE = "Transactions";

export const ACCOUNTS_TRANSACTIONS_SUBTITLE =
  "Total movements in selected period";

/* ===========================================================
   EMPTY STATE
=========================================================== */

export const ACCOUNTS_EMPTY_TITLE = "No account entries found";

export const ACCOUNTS_EMPTY_SUBTITLE =
  "No money movement matches the selected filters.";

/* ===========================================================
   FILTER SECTION
=========================================================== */

export const ACCOUNTS_FILTERS_TITLE = "Find Accounts";

export const ACCOUNTS_FILTERS_SUBTITLE =
  "Choose a date, customer or transaction type.";

export const ACCOUNTS_FILTER_RESET_LABEL = "Reset Filters";

export const ACCOUNTS_FILTER_APPLY_LABEL = "Apply Filters";

/* ===========================================================
   SEARCH
=========================================================== */

export const ACCOUNTS_SEARCH_LABEL = "Search";

export const ACCOUNTS_SEARCH_PLACEHOLDER =
  "Customer, loan number or receipt number";

/* ===========================================================
   PERIOD OPTIONS
=========================================================== */

export interface AccountsPeriodOption {
  value: AccountPeriodPreset;

  label: string;

  description: string;
}

export const ACCOUNTS_PERIOD_OPTIONS: readonly AccountsPeriodOption[] = [
  {
    value: "TODAY",
    label: "Today",
    description: "Only today's accounts",
  },

  {
    value: "YESTERDAY",
    label: "Yesterday",
    description: "Only yesterday's accounts",
  },

  {
    value: "SELECT_DATE",
    label: "Select Date",
    description: "Choose one exact date",
  },

  {
    value: "THIS_MONTH",
    label: "This Month",
    description: "Current month accounts",
  },

  {
    value: "SELECT_MONTH",
    label: "Select Month",
    description: "Choose any month",
  },

  {
    value: "THIS_YEAR",
    label: "This Year",
    description: "Current year accounts",
  },

  {
    value: "SELECT_YEAR",
    label: "Select Year",
    description: "Choose any year",
  },

  {
    value: "CUSTOM_RANGE",
    label: "From Date - To Date",
    description: "Choose a custom date range",
  },

  {
    value: "ALL_TIME",
    label: "All Time",
    description: "Show complete account history",
  },
];

/* ===========================================================
   ACTIVITY OPTIONS
=========================================================== */

export interface AccountsActivityOption {
  value: "ALL" | AccountActivity;

  label: string;

  description: string;
}

export const ACCOUNTS_ACTIVITY_OPTIONS: readonly AccountsActivityOption[] = [
  {
    value: "ALL",
    label: "All Accounts",
    description: "Money Out and Money In",
  },

  {
    value: "LOAN_DISBURSEMENT",
    label: "Loan Disbursements",
    description: "Only money given as loans",
  },

  {
    value: "COLLECTION_RECEIVED",
    label: "Collections",
    description: "Only money collected",
  },
];

/* ===========================================================
   LOAN TYPE OPTIONS
=========================================================== */

export interface AccountsLoanTypeOption {
  value: "ALL" | AccountLoanType;

  label: string;

  description: string;
}

export const ACCOUNTS_LOAN_TYPE_OPTIONS: readonly AccountsLoanTypeOption[] = [
  {
    value: "ALL",
    label: "All Loans",
    description: "Standard and Gold Loans",
  },

  {
    value: "STANDARD",
    label: "Standard Loans",
    description: "Only Standard Loan transactions",
  },

  {
    value: "GOLD",
    label: "Gold Loans",
    description: "Only Gold Loan transactions",
  },
];

/* ===========================================================
   PAYMENT METHOD OPTIONS
=========================================================== */

export interface AccountsPaymentMethodOption {
  value: "ALL" | AccountPaymentMethod;

  label: string;
}

export const ACCOUNTS_PAYMENT_METHOD_OPTIONS: readonly AccountsPaymentMethodOption[] =
  [
    {
      value: "ALL",
      label: "All Methods",
    },

    {
      value: "CASH",
      label: "Cash",
    },

    {
      value: "UPI",
      label: "UPI",
    },

    {
      value: "BANK_TRANSFER",
      label: "Bank Transfer",
    },

    {
      value: "CHEQUE",
      label: "Cheque",
    },

    {
      value: "CARD",
      label: "Card",
    },

    {
      value: "OTHER",
      label: "Other",
    },

    {
      value: "UNKNOWN",
      label: "Not Available",
    },
  ];

/* ===========================================================
   ACTIVITY DISPLAY LABELS
=========================================================== */

export const ACCOUNT_ACTIVITY_LABELS: Readonly<
  Record<AccountActivity, string>
> = {
  LOAN_DISBURSEMENT: "Loan Disbursed",

  COLLECTION_RECEIVED: "Collection Received",
};

/* ===========================================================
   LOAN TYPE DISPLAY LABELS
=========================================================== */

export const ACCOUNT_LOAN_TYPE_LABELS: Readonly<
  Record<AccountLoanType, string>
> = {
  STANDARD: "Standard Loan",

  GOLD: "Gold Loan",
};

/* ===========================================================
   PAYMENT METHOD DISPLAY LABELS
=========================================================== */

export const ACCOUNT_PAYMENT_METHOD_LABELS: Readonly<
  Record<AccountPaymentMethod, string>
> = {
  CASH: "Cash",

  UPI: "UPI",

  BANK_TRANSFER: "Bank Transfer",

  CHEQUE: "Cheque",

  CARD: "Card",

  OTHER: "Other",

  UNKNOWN: "--",
};

/* ===========================================================
   OWNER-FACING ACTIVITY DESCRIPTIONS

   These labels will be used in register rows.

   Example combinations:

   Gold Loan + LOAN_DISBURSEMENT
     =
   Gold Loan Disbursed

   Standard Loan + COLLECTION_RECEIVED
     =
   Standard Loan Collection
=========================================================== */

export const ACCOUNT_ACTIVITY_DESCRIPTIONS = {
  STANDARD_LOAN_DISBURSEMENT: "Standard Loan Disbursed",

  GOLD_LOAN_DISBURSEMENT: "Gold Loan Disbursed",

  STANDARD_LOAN_COLLECTION: "Standard Loan Collection",

  GOLD_LOAN_COLLECTION: "Gold Loan Collection",
} as const;

/* ===========================================================
   REGISTER COLUMN LABELS
=========================================================== */

export const ACCOUNTS_LEDGER_COLUMNS = {
  SERIAL: "S.No",

  DATE_TIME: "Date & Time",

  CUSTOMER: "Customer",

  ACTIVITY: "Activity",

  MONEY_OUT: "Money Out",

  MONEY_IN: "Money In",

  METHOD: "Method",

  REFERENCE: "Reference",
} as const;

/* ===========================================================
   SECONDARY ACCOUNTING LABELS
=========================================================== */

export const ACCOUNTS_DEBIT_HELP_TEXT = "Debit • Money given out";

export const ACCOUNTS_CREDIT_HELP_TEXT = "Credit • Money received";

/* ===========================================================
   DATE FIELD LABELS
=========================================================== */

export const ACCOUNTS_SELECTED_DATE_LABEL = "Date";

export const ACCOUNTS_FROM_DATE_LABEL = "From Date";

export const ACCOUNTS_TO_DATE_LABEL = "To Date";

export const ACCOUNTS_MONTH_LABEL = "Month";

export const ACCOUNTS_YEAR_LABEL = "Year";

/* ===========================================================
   FILTER FIELD LABELS
=========================================================== */

export const ACCOUNTS_PERIOD_LABEL = "Period";

export const ACCOUNTS_ACTIVITY_LABEL = "Activity";

export const ACCOUNTS_LOAN_TYPE_LABEL = "Loan Type";

export const ACCOUNTS_CUSTOMER_LABEL = "Customer";

export const ACCOUNTS_PAYMENT_METHOD_LABEL = "Payment Method";

/* ===========================================================
   CUSTOMER OPTION
=========================================================== */

export const ACCOUNTS_ALL_CUSTOMERS_LABEL = "All Customers";

/* ===========================================================
   DOCUMENT ACTION LABELS
=========================================================== */

export const ACCOUNTS_DOWNLOAD_LABEL = "Download PDF";

export const ACCOUNTS_PRINT_LABEL = "Print";

export const ACCOUNTS_SHARE_LABEL = "Share";

/* ===========================================================
   DOCUMENT COPY
=========================================================== */

export const ACCOUNTS_DOCUMENT_TITLE = "FINORA Accounts Register";

export const ACCOUNTS_DOCUMENT_FILE_PREFIX = "FINORA_Accounts_Register";

export const ACCOUNTS_DOCUMENT_SHARE_TITLE = "FINORA Accounts Register";

export const ACCOUNTS_DOCUMENT_SHARE_DIALOG_TITLE = "Share Accounts Register";

/* ===========================================================
   FALLBACK DISPLAY
=========================================================== */

export const ACCOUNTS_EMPTY_VALUE = "--";

/* ===========================================================
   DEFAULT FILTER STATE

   Accounts opens with TODAY intentionally.

   Owner sees today's business immediately without having
   to understand accounting filters first.
=========================================================== */

export const DEFAULT_ACCOUNTS_FILTERS: Readonly<AccountsFilterState> = {
  period: "TODAY",

  selectedDate: "",

  fromDate: "",

  toDate: "",

  selectedMonth: "",

  selectedYear: "",

  activity: "ALL",

  loanType: "ALL",

  customerId: "",

  paymentMethod: "ALL",

  searchText: "",
};

/* ===========================================================
   PAGINATION

   Desktop register will paginate large histories.
   Mobile presentation can consume the same page data.
=========================================================== */

export const ACCOUNTS_DEFAULT_PAGE_SIZE = 25;

export const ACCOUNTS_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

/* ===========================================================
   FORMATTING POLICY

   Actual formatter implementation does NOT belong here.

   These constants document the Accounts presentation rule.

   48000
     →
   48,000

   1250000
     →
   12,50,000

   Decimal .00 is not displayed.
=========================================================== */

export const ACCOUNTS_NUMBER_LOCALE = "en-IN";

export const ACCOUNTS_AMOUNT_MAXIMUM_FRACTION_DIGITS = 0;

/* ===========================================================
   TYPOGRAPHY POLICY

   Actual styles belong to styles / responsive tokens.

   This centralized family prevents Accounts components from
   introducing a different visual identity.
=========================================================== */

export const ACCOUNTS_FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, sans-serif";

/* ===========================================================
   END
=========================================================== */
