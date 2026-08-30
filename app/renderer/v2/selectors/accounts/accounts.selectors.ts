/* ===========================================================
   FINORA ENTERPRISE OS™
   ACCOUNTS ENGINE™

   ACCOUNTS SELECTORS

   RESPONSIBILITY:
   - Filter Accounts ledger entries
   - Resolve Today / Yesterday
   - Resolve exact date
   - Resolve month / year
   - Resolve custom From → To range
   - Filter activity
   - Filter Gold / Standard Loan
   - Filter customer
   - Filter payment method
   - Search financial references
   - Sort visible Accounts rows
   - Build final Accounts Ledger View
   - Build owner-facing period labels

   IMPORTANT:
   - No React.
   - No styles.
   - No persistence.
   - No repository access.
   - No mutation.
   - No currency formatting.
   - No theme logic.
   - No responsive logic.

   DATE RULE:
   - Accounts follows local calendar dates.
   - Date ranges are inclusive.
   - YYYY-MM-DD string comparison is safe after normalization.

   VERSION : 1.0
=========================================================== */

import { calculateAccountsSummary } from "../../calculations/accounts/accountsTotals";

import type {
  AccountEntry,
  AccountPeriodPreset,
  AccountsFilterState,
  AccountsLedgerView,
} from "../../types/accounts/accounts.types";

/* ===========================================================
   SAFE TEXT
=========================================================== */

function safeText(value: unknown): string {
  return String(value ?? "").trim();
}

/* ===========================================================
   NORMALIZED SEARCH TEXT
=========================================================== */

function normalizeSearchText(value: unknown): string {
  return safeText(value).toLocaleLowerCase().replace(/\s+/g, " ");
}

/* ===========================================================
   PAD 2
=========================================================== */

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/* ===========================================================
   LOCAL DATE KEY
=========================================================== */

export function getAccountsLocalDateKey(date: Date): string {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("-");
}

/* ===========================================================
   TODAY DATE KEY
=========================================================== */

export function getAccountsTodayDateKey(now = new Date()): string {
  return getAccountsLocalDateKey(now);
}

/* ===========================================================
   YESTERDAY DATE KEY
=========================================================== */

export function getAccountsYesterdayDateKey(now = new Date()): string {
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );

  return getAccountsLocalDateKey(yesterday);
}

/* ===========================================================
   CURRENT MONTH KEY
=========================================================== */

export function getAccountsCurrentMonthKey(now = new Date()): string {
  return [now.getFullYear(), pad2(now.getMonth() + 1)].join("-");
}

/* ===========================================================
   CURRENT YEAR KEY
=========================================================== */

export function getAccountsCurrentYearKey(now = new Date()): string {
  return String(now.getFullYear());
}

/* ===========================================================
   VALID DATE KEY
=========================================================== */

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");

  const year = Number(yearText);

  const month = Number(monthText);

  const day = Number(dayText);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/* ===========================================================
   VALID MONTH KEY
=========================================================== */

function isValidMonthKey(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText] = value.split("-");

  const year = Number(yearText);

  const month = Number(monthText);

  return (
    Number.isInteger(year) &&
    year >= 1 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

/* ===========================================================
   VALID YEAR KEY
=========================================================== */

function isValidYearKey(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/* ===========================================================
   PERIOD MATCH
=========================================================== */

function matchesAccountPeriod(
  entry: AccountEntry,
  filters: AccountsFilterState,
  now: Date,
): boolean {
  const dateKey = safeText(entry.dateKey);

  if (!isValidDateKey(dateKey)) {
    return false;
  }

  switch (filters.period) {
    case "TODAY":
      return dateKey === getAccountsTodayDateKey(now);

    case "YESTERDAY":
      return dateKey === getAccountsYesterdayDateKey(now);

    case "SELECT_DATE": {
      const selectedDate = safeText(filters.selectedDate);

      return isValidDateKey(selectedDate) && dateKey === selectedDate;
    }

    case "THIS_MONTH":
      return dateKey.startsWith(`${getAccountsCurrentMonthKey(now)}-`);

    case "SELECT_MONTH": {
      const selectedMonth = safeText(filters.selectedMonth);

      return (
        isValidMonthKey(selectedMonth) &&
        dateKey.startsWith(`${selectedMonth}-`)
      );
    }

    case "THIS_YEAR":
      return dateKey.startsWith(`${getAccountsCurrentYearKey(now)}-`);

    case "SELECT_YEAR": {
      const selectedYear = safeText(filters.selectedYear);

      return (
        isValidYearKey(selectedYear) && dateKey.startsWith(`${selectedYear}-`)
      );
    }

    case "CUSTOM_RANGE": {
      const fromDate = safeText(filters.fromDate);

      const toDate = safeText(filters.toDate);

      if (!isValidDateKey(fromDate) || !isValidDateKey(toDate)) {
        return false;
      }

      const rangeStart = fromDate <= toDate ? fromDate : toDate;

      const rangeEnd = fromDate <= toDate ? toDate : fromDate;

      return dateKey >= rangeStart && dateKey <= rangeEnd;
    }

    case "ALL_TIME":
      return true;

    default:
      return true;
  }
}

/* ===========================================================
   ACTIVITY MATCH
=========================================================== */

function matchesAccountActivity(
  entry: AccountEntry,
  filters: AccountsFilterState,
): boolean {
  if (filters.activity === "ALL") {
    return true;
  }

  return entry.activity === filters.activity;
}

/* ===========================================================
   LOAN TYPE MATCH

   IMPORTANT:

   When filter = ALL:
   even historical Collections with unresolved Loan metadata
   remain visible.

   When owner explicitly selects Gold / Standard:
   only entries with authoritative matching Loan type appear.
=========================================================== */

function matchesAccountLoanType(
  entry: AccountEntry,
  filters: AccountsFilterState,
): boolean {
  if (filters.loanType === "ALL") {
    return true;
  }

  return entry.loanType === filters.loanType;
}

/* ===========================================================
   CUSTOMER MATCH
=========================================================== */

function matchesAccountCustomer(
  entry: AccountEntry,
  filters: AccountsFilterState,
): boolean {
  const customerId = safeText(filters.customerId);

  if (!customerId) {
    return true;
  }

  return entry.customerId === customerId;
}

/* ===========================================================
   PAYMENT METHOD MATCH
=========================================================== */

function matchesAccountPaymentMethod(
  entry: AccountEntry,
  filters: AccountsFilterState,
): boolean {
  if (filters.paymentMethod === "ALL") {
    return true;
  }

  return entry.paymentMethod === filters.paymentMethod;
}

/* ===========================================================
   SEARCH MATCH

   Searchable:
   - Customer
   - Phone
   - Loan number
   - Receipt number
   - Source reference
   - Activity description
   - Payment method
   - Remarks
=========================================================== */

function matchesAccountSearch(
  entry: AccountEntry,
  filters: AccountsFilterState,
): boolean {
  const query = normalizeSearchText(filters.searchText);

  if (!query) {
    return true;
  }

  const searchableValues = [
    entry.customerName,
    entry.customerPhone,
    entry.loanNumber,
    entry.receiptNumber,
    entry.sourceReference,
    entry.description,
    entry.paymentMethodLabel,
    entry.remarks,
  ];

  const searchableText = searchableValues
    .map(normalizeSearchText)
    .filter(Boolean)
    .join(" ");

  return searchableText.includes(query);
}

/* ===========================================================
   ENTRY MATCHES FILTERS
=========================================================== */

export function accountEntryMatchesFilters(
  entry: AccountEntry,
  filters: AccountsFilterState,
  now = new Date(),
): boolean {
  return (
    matchesAccountPeriod(entry, filters, now) &&
    matchesAccountActivity(entry, filters) &&
    matchesAccountLoanType(entry, filters) &&
    matchesAccountCustomer(entry, filters) &&
    matchesAccountPaymentMethod(entry, filters) &&
    matchesAccountSearch(entry, filters)
  );
}

/* ===========================================================
   OCCURRED AT TIME
=========================================================== */

function getOccurredAtTime(entry: AccountEntry): number {
  const time = new Date(entry.occurredAt).getTime();

  return Number.isFinite(time) ? time : 0;
}

/* ===========================================================
   SORT NEWEST FIRST

   Screen register intentionally shows latest movement first.

   Original array is never mutated.
=========================================================== */

export function sortAccountEntriesNewestFirst(
  entries: readonly AccountEntry[],
): AccountEntry[] {
  return [...entries].sort((left, right) => {
    const timeDifference = getOccurredAtTime(right) - getOccurredAtTime(left);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return right.id.localeCompare(left.id);
  });
}

/* ===========================================================
   FILTER ACCOUNT ENTRIES
=========================================================== */

export function filterAccountEntries(
  entries: readonly AccountEntry[],
  filters: AccountsFilterState,
  now = new Date(),
): AccountEntry[] {
  const filtered = entries.filter((entry) =>
    accountEntryMatchesFilters(entry, filters, now),
  );

  return sortAccountEntriesNewestFirst(filtered);
}

/* ===========================================================
   UNIQUE CUSTOMER COUNT
=========================================================== */

export function countAccountCustomers(
  entries: readonly AccountEntry[],
): number {
  const customerIds = new Set<string>();

  for (const entry of entries) {
    const customerId = safeText(entry.customerId);

    if (customerId) {
      customerIds.add(customerId);
    }
  }

  return customerIds.size;
}

/* ===========================================================
   DATE LABEL
=========================================================== */

function formatAccountsDateLabel(dateKey: string): string {
  if (!isValidDateKey(dateKey)) {
    return dateKey || "--";
  }

  const [yearText, monthText, dayText] = dateKey.split("-");

  const date = new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
  );

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  });
}

/* ===========================================================
   MONTH LABEL
=========================================================== */

function formatAccountsMonthLabel(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    return monthKey || "--";
  }

  const [yearText, monthText] = monthKey.split("-");

  const date = new Date(Number(yearText), Number(monthText) - 1, 1);

  return date.toLocaleDateString("en-IN", {
    month: "long",

    year: "numeric",
  });
}

/* ===========================================================
   PERIOD LABEL
=========================================================== */

export function getAccountsPeriodLabel(
  filters: AccountsFilterState,
  now = new Date(),
): string {
  const period: AccountPeriodPreset = filters.period;

  switch (period) {
    case "TODAY":
      return `Today • ${formatAccountsDateLabel(getAccountsTodayDateKey(now))}`;

    case "YESTERDAY":
      return `Yesterday • ${formatAccountsDateLabel(
        getAccountsYesterdayDateKey(now),
      )}`;

    case "SELECT_DATE": {
      const selectedDate = safeText(filters.selectedDate);

      return isValidDateKey(selectedDate)
        ? formatAccountsDateLabel(selectedDate)
        : "Select Date";
    }

    case "THIS_MONTH":
      return `This Month • ${formatAccountsMonthLabel(
        getAccountsCurrentMonthKey(now),
      )}`;

    case "SELECT_MONTH": {
      const selectedMonth = safeText(filters.selectedMonth);

      return isValidMonthKey(selectedMonth)
        ? formatAccountsMonthLabel(selectedMonth)
        : "Select Month";
    }

    case "THIS_YEAR":
      return `This Year • ${getAccountsCurrentYearKey(now)}`;

    case "SELECT_YEAR": {
      const selectedYear = safeText(filters.selectedYear);

      return isValidYearKey(selectedYear) ? selectedYear : "Select Year";
    }

    case "CUSTOM_RANGE": {
      const fromDate = safeText(filters.fromDate);

      const toDate = safeText(filters.toDate);

      if (!isValidDateKey(fromDate) || !isValidDateKey(toDate)) {
        return "Select From Date - To Date";
      }

      const rangeStart = fromDate <= toDate ? fromDate : toDate;

      const rangeEnd = fromDate <= toDate ? toDate : fromDate;

      return `${formatAccountsDateLabel(
        rangeStart,
      )} - ${formatAccountsDateLabel(rangeEnd)}`;
    }

    case "ALL_TIME":
      return "All Time";

    default:
      return "Accounts";
  }
}

/* ===========================================================
   BUILD ACCOUNTS LEDGER VIEW

   One selector used by Accounts Office.

   Entries
      ↓
   Filters
      ↓
   Visible Ledger
      ↓
   Summary
=========================================================== */

export function buildAccountsLedgerView(
  entries: readonly AccountEntry[],
  filters: AccountsFilterState,
  now = new Date(),
): AccountsLedgerView {
  const visibleEntries = filterAccountEntries(entries, filters, now);

  return {
    entries: visibleEntries,

    summary: calculateAccountsSummary(visibleEntries),

    customerCount: countAccountCustomers(visibleEntries),

    periodLabel: getAccountsPeriodLabel(filters, now),
  };
}

/* ===========================================================
   END
=========================================================== */
