/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS FILTERS STYLE CONTRACT

   MODULE  : Accounts
   LAYER   : Filters CSS Class Contract
   VERSION : 1.0

   RESPONSIBILITY:

   - Centralize Accounts Filters CSS class names
   - Define filter-field visual contracts
   - Define conditional period-field contracts
   - Define Search / Reset / Apply action contracts
   - Keep AccountsFilters.tsx className-only

   FILTER WORKSPACE:

   Period
   Activity
   Loan Type
   Customer
   Payment Method
   Search

   CONDITIONAL PERIOD FIELDS:

   SELECT_DATE
     → selectedDate

   SELECT_MONTH
     → selectedMonth

   SELECT_YEAR
     → selectedYear

   CUSTOM_RANGE
     → fromDate + toDate

   IMPORTANT:

   - No CSSProperties.
   - No inline style objects.
   - No theme calculations.
   - No responsive calculations.
   - No date calculations.
   - No filtering logic.
   - No repository access.
=========================================================== */

/* ===========================================================
   ROOT
=========================================================== */

export const ACCOUNTS_FILTERS_CLASSES = {
  root: "finora-accounts-filters",

  header: "finora-accounts-filters__header",

  headerIdentity: "finora-accounts-filters__header-identity",

  headerIcon: "finora-accounts-filters__header-icon",

  headingGroup: "finora-accounts-filters__heading-group",

  title: "finora-accounts-filters__title",

  subtitle: "finora-accounts-filters__subtitle",

  body: "finora-accounts-filters__body",

  grid: "finora-accounts-filters__grid",

  periodDetails: "finora-accounts-filters__period-details",

  periodDetailsSingle:
    "finora-accounts-filters__period-details finora-accounts-filters__period-details--single",

  periodDetailsRange:
    "finora-accounts-filters__period-details finora-accounts-filters__period-details--range",

  actions: "finora-accounts-filters__actions",
} as const;

/* ===========================================================
   FIELD
=========================================================== */

export const ACCOUNTS_FILTER_FIELD_CLASSES = {
  root: "finora-accounts-filter-field",

  rootWide: "finora-accounts-filter-field finora-accounts-filter-field--wide",

  label: "finora-accounts-filter-field__label",

  labelRow: "finora-accounts-filter-field__label-row",

  labelIcon: "finora-accounts-filter-field__label-icon",

  controlShell: "finora-accounts-filter-field__control-shell",

  control: "finora-accounts-filter-field__control",

  select:
    "finora-accounts-filter-field__control finora-accounts-filter-field__select",

  input:
    "finora-accounts-filter-field__control finora-accounts-filter-field__input",

  dateInput:
    "finora-accounts-filter-field__control finora-accounts-filter-field__input finora-accounts-filter-field__date",

  searchInput:
    "finora-accounts-filter-field__control finora-accounts-filter-field__input finora-accounts-filter-field__search-input",

  helper: "finora-accounts-filter-field__helper",
} as const;

/* ===========================================================
   SEARCH
=========================================================== */

export const ACCOUNTS_FILTER_SEARCH_CLASSES = {
  root: "finora-accounts-filter-search",

  icon: "finora-accounts-filter-search__icon",

  input: "finora-accounts-filter-search__input",

  clearButton: "finora-accounts-filter-search__clear-button",

  clearIcon: "finora-accounts-filter-search__clear-icon",
} as const;

/* ===========================================================
   ACTIONS
=========================================================== */

export const ACCOUNTS_FILTER_ACTION_CLASSES = {
  reset: "finora-accounts-filter-action finora-accounts-filter-action--reset",

  apply: "finora-accounts-filter-action finora-accounts-filter-action--apply",

  icon: "finora-accounts-filter-action__icon",

  label: "finora-accounts-filter-action__label",

  disabled: "finora-accounts-filter-action--disabled",
} as const;

/* ===========================================================
   SEMANTIC ICON CLASSES
=========================================================== */

export const ACCOUNTS_FILTER_ICON_CLASSES = {
  filters: "finora-accounts-filters__filters-icon",

  period: "finora-accounts-filter-icon--period",

  activity: "finora-accounts-filter-icon--activity",

  loanType: "finora-accounts-filter-icon--loan-type",

  customer: "finora-accounts-filter-icon--customer",

  paymentMethod: "finora-accounts-filter-icon--payment-method",

  search: "finora-accounts-filter-icon--search",

  reset: "finora-accounts-filter-icon--reset",

  apply: "finora-accounts-filter-icon--apply",
} as const;

/* ===========================================================
   CONDITIONAL PERIOD MODE
=========================================================== */

export type AccountsFilterPeriodDetailMode = "NONE" | "SINGLE" | "RANGE";

/* ===========================================================
   PERIOD DETAIL MODE RESOLVER

   Presentation structure only.

   Date filtering itself remains in accounts.selectors.ts.
=========================================================== */

export function resolveAccountsFilterPeriodDetailMode(
  period: string,
): AccountsFilterPeriodDetailMode {
  switch (period) {
    case "SELECT_DATE":
    case "SELECT_MONTH":
    case "SELECT_YEAR":
      return "SINGLE";

    case "CUSTOM_RANGE":
      return "RANGE";

    default:
      return "NONE";
  }
}

/* ===========================================================
   PERIOD DETAIL CLASS
=========================================================== */

export function getAccountsPeriodDetailsClassName(
  mode: AccountsFilterPeriodDetailMode,
): string {
  switch (mode) {
    case "RANGE":
      return ACCOUNTS_FILTERS_CLASSES.periodDetailsRange;

    case "SINGLE":
      return ACCOUNTS_FILTERS_CLASSES.periodDetailsSingle;

    case "NONE":
    default:
      return ACCOUNTS_FILTERS_CLASSES.periodDetails;
  }
}

/* ===========================================================
   CLASS NAME COMPOSER
=========================================================== */

export function joinAccountsFilterClassNames(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames
    .filter(
      (className): className is string =>
        typeof className === "string" && className.trim().length > 0,
    )
    .join(" ");
}

/* ===========================================================
   ACTION CLASS RESOLVER
=========================================================== */

export type AccountsFilterActionVariant = "RESET" | "APPLY";

export function getAccountsFilterActionClassName(
  variant: AccountsFilterActionVariant,

  disabled = false,
): string {
  const baseClass =
    variant === "APPLY"
      ? ACCOUNTS_FILTER_ACTION_CLASSES.apply
      : ACCOUNTS_FILTER_ACTION_CLASSES.reset;

  return joinAccountsFilterClassNames(
    baseClass,

    disabled && ACCOUNTS_FILTER_ACTION_CLASSES.disabled,
  );
}

/* ===========================================================
   END
=========================================================== */
