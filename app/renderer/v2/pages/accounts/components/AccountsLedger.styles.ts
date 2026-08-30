/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS LEDGER STYLE CONTRACT

   MODULE  : Accounts
   LAYER   : Ledger CSS Class Contract
   VERSION : 1.0

   RESPONSIBILITY:

   - Centralize physical Accounts Register CSS classes
   - Define table / row / cell class contracts
   - Preserve Money Out red semantics
   - Preserve Money In green semantics
   - Define Standard / Gold activity presentation
   - Keep AccountsLedger.tsx and AccountsLedgerRow.tsx
     completely free from inline styles

   REGISTER COLUMNS:

   S.No
   Date & Time
   Customer
   Activity
   Money Out
   Money In
   Method
   Reference

   IMPORTANT:

   - No CSSProperties.
   - No inline style objects.
   - No calculations.
   - No repository access.
   - No filtering.
   - No pagination calculations.
   - No theme calculations.
   - No responsive calculations.
=========================================================== */

/* ===========================================================
   REGISTER SECTION
=========================================================== */

export const ACCOUNTS_LEDGER_CLASSES = {
  section: "finora-accounts-ledger",

  header: "finora-accounts-ledger__header",

  headerIdentity: "finora-accounts-ledger__header-identity",

  headerIcon: "finora-accounts-ledger__header-icon",

  headingGroup: "finora-accounts-ledger__heading-group",

  title: "finora-accounts-ledger__title",

  subtitle: "finora-accounts-ledger__subtitle",

  period: "finora-accounts-ledger__period",

  periodIcon: "finora-accounts-ledger__period-icon",

  periodText: "finora-accounts-ledger__period-text",

  wrapper: "finora-accounts-ledger__wrapper",

  table: "finora-accounts-ledger__table",

  head: "finora-accounts-ledger__head",

  body: "finora-accounts-ledger__body",

  row: "finora-accounts-ledger__row",

  rowMoneyOut:
    "finora-accounts-ledger__row finora-accounts-ledger__row--money-out",

  rowMoneyIn:
    "finora-accounts-ledger__row finora-accounts-ledger__row--money-in",
} as const;

/* ===========================================================
   HEADER CELLS
=========================================================== */

export const ACCOUNTS_LEDGER_HEADER_CLASSES = {
  cell: "finora-accounts-ledger__header-cell",

  serial:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--serial",

  dateTime:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--date",

  customer:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--customer",

  activity:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--activity",

  moneyOut:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--money finora-accounts-ledger__header-cell--money-out",

  moneyIn:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--money finora-accounts-ledger__header-cell--money-in",

  method:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--method",

  reference:
    "finora-accounts-ledger__header-cell finora-accounts-ledger__header-cell--reference",
} as const;

/* ===========================================================
   BODY CELLS
=========================================================== */

export const ACCOUNTS_LEDGER_CELL_CLASSES = {
  cell: "finora-accounts-ledger__cell",

  serial: "finora-accounts-ledger__cell finora-accounts-ledger__cell--serial",

  dateTime: "finora-accounts-ledger__cell finora-accounts-ledger__cell--date",

  customer:
    "finora-accounts-ledger__cell finora-accounts-ledger__cell--customer",

  activity:
    "finora-accounts-ledger__cell finora-accounts-ledger__cell--activity",

  moneyOut:
    "finora-accounts-ledger__cell finora-accounts-ledger__cell--money finora-accounts-ledger__cell--money-out",

  moneyIn:
    "finora-accounts-ledger__cell finora-accounts-ledger__cell--money finora-accounts-ledger__cell--money-in",

  method: "finora-accounts-ledger__cell finora-accounts-ledger__cell--method",

  reference:
    "finora-accounts-ledger__cell finora-accounts-ledger__cell--reference",
} as const;

/* ===========================================================
   DATE / TIME
=========================================================== */

export const ACCOUNTS_LEDGER_DATE_CLASSES = {
  root: "finora-accounts-ledger__date-time",

  date: "finora-accounts-ledger__date",

  time: "finora-accounts-ledger__time",
} as const;

/* ===========================================================
   CUSTOMER
=========================================================== */

export const ACCOUNTS_LEDGER_CUSTOMER_CLASSES = {
  root: "finora-accounts-ledger__customer",

  name: "finora-accounts-ledger__customer-name",

  phone: "finora-accounts-ledger__customer-phone",
} as const;

/* ===========================================================
   ACTIVITY
=========================================================== */

export const ACCOUNTS_LEDGER_ACTIVITY_CLASSES = {
  root: "finora-accounts-ledger__activity",

  icon: "finora-accounts-ledger__activity-icon",

  content: "finora-accounts-ledger__activity-content",

  label: "finora-accounts-ledger__activity-label",

  loan: "finora-accounts-ledger__activity-loan",

  goldBadge:
    "finora-accounts-ledger__loan-badge finora-accounts-ledger__loan-badge--gold",

  standardBadge:
    "finora-accounts-ledger__loan-badge finora-accounts-ledger__loan-badge--standard",
} as const;

/* ===========================================================
   MONEY
=========================================================== */

export const ACCOUNTS_LEDGER_MONEY_CLASSES = {
  amount: "finora-accounts-ledger__money",

  moneyOut: "finora-accounts-ledger__money finora-accounts-ledger__money--out",

  moneyIn: "finora-accounts-ledger__money finora-accounts-ledger__money--in",

  empty: "finora-accounts-ledger__money-empty",
} as const;

/* ===========================================================
   METHOD
=========================================================== */

export const ACCOUNTS_LEDGER_METHOD_CLASSES = {
  badge: "finora-accounts-ledger__method-badge",

  unknown:
    "finora-accounts-ledger__method-badge finora-accounts-ledger__method-badge--unknown",
} as const;

/* ===========================================================
   REFERENCE
=========================================================== */

export const ACCOUNTS_LEDGER_REFERENCE_CLASSES = {
  root: "finora-accounts-ledger__reference",

  primary: "finora-accounts-ledger__reference-primary",

  secondary: "finora-accounts-ledger__reference-secondary",
} as const;

/* ===========================================================
   ICONS
=========================================================== */

export const ACCOUNTS_LEDGER_ICON_CLASSES = {
  register: "finora-accounts-ledger__register-icon",

  period: "finora-accounts-ledger__calendar-icon",

  moneyOut: "finora-accounts-ledger__money-out-icon",

  moneyIn: "finora-accounts-ledger__money-in-icon",

  gold: "finora-accounts-ledger__gold-icon",

  standard: "finora-accounts-ledger__standard-icon",
} as const;

/* ===========================================================
   ROW CLASS RESOLVER
=========================================================== */

export function getAccountsLedgerRowClassName(
  moneyFlow: "MONEY_OUT" | "MONEY_IN",
): string {
  return moneyFlow === "MONEY_OUT"
    ? ACCOUNTS_LEDGER_CLASSES.rowMoneyOut
    : ACCOUNTS_LEDGER_CLASSES.rowMoneyIn;
}

/* ===========================================================
   LOAN BADGE CLASS RESOLVER
=========================================================== */

export function getAccountsLedgerLoanBadgeClassName(
  loanType: "STANDARD" | "GOLD",
): string {
  return loanType === "GOLD"
    ? ACCOUNTS_LEDGER_ACTIVITY_CLASSES.goldBadge
    : ACCOUNTS_LEDGER_ACTIVITY_CLASSES.standardBadge;
}

/* ===========================================================
   MONEY CLASS RESOLVER
=========================================================== */

export function getAccountsLedgerMoneyClassName(
  moneyFlow: "MONEY_OUT" | "MONEY_IN",
): string {
  return moneyFlow === "MONEY_OUT"
    ? ACCOUNTS_LEDGER_MONEY_CLASSES.moneyOut
    : ACCOUNTS_LEDGER_MONEY_CLASSES.moneyIn;
}

/* ===========================================================
   MOBILE TRANSACTION CARD
=========================================================== */

export const ACCOUNTS_LEDGER_MOBILE_CLASSES = {
  list: "finora-accounts-mobile-ledger",

  card: "finora-accounts-mobile-card",

  cardMoneyOut:
    "finora-accounts-mobile-card finora-accounts-mobile-card--money-out",

  cardMoneyIn:
    "finora-accounts-mobile-card finora-accounts-mobile-card--money-in",

  header: "finora-accounts-mobile-card__header",

  identity: "finora-accounts-mobile-card__identity",

  activityIcon: "finora-accounts-mobile-card__activity-icon",

  headingGroup: "finora-accounts-mobile-card__heading-group",

  activity: "finora-accounts-mobile-card__activity",

  customer: "finora-accounts-mobile-card__customer",

  moneySection: "finora-accounts-mobile-card__money-section",

  moneyLabel: "finora-accounts-mobile-card__money-label",

  moneyValue: "finora-accounts-mobile-card__money-value",

  moneyOutValue:
    "finora-accounts-mobile-card__money-value finora-accounts-mobile-card__money-value--out",

  moneyInValue:
    "finora-accounts-mobile-card__money-value finora-accounts-mobile-card__money-value--in",

  details: "finora-accounts-mobile-card__details",

  detail: "finora-accounts-mobile-card__detail",

  detailLabel: "finora-accounts-mobile-card__detail-label",

  detailValue: "finora-accounts-mobile-card__detail-value",

  footer: "finora-accounts-mobile-card__footer",

  dateTime: "finora-accounts-mobile-card__date-time",

  date: "finora-accounts-mobile-card__date",

  time: "finora-accounts-mobile-card__time",

  loanBadge: "finora-accounts-mobile-card__loan-badge",

  goldBadge:
    "finora-accounts-mobile-card__loan-badge finora-accounts-mobile-card__loan-badge--gold",

  standardBadge:
    "finora-accounts-mobile-card__loan-badge finora-accounts-mobile-card__loan-badge--standard",

  reference: "finora-accounts-mobile-card__reference",

  referenceLabel: "finora-accounts-mobile-card__reference-label",

  referenceValue: "finora-accounts-mobile-card__reference-value",

  method: "finora-accounts-mobile-card__method",

  methodLabel: "finora-accounts-mobile-card__method-label",

  methodValue: "finora-accounts-mobile-card__method-value",
} as const;

/* ===========================================================
   MOBILE CARD CLASS RESOLVER
=========================================================== */

export function getAccountsLedgerMobileCardClassName(
  moneyFlow: "MONEY_OUT" | "MONEY_IN",
): string {
  return moneyFlow === "MONEY_OUT"
    ? ACCOUNTS_LEDGER_MOBILE_CLASSES.cardMoneyOut
    : ACCOUNTS_LEDGER_MOBILE_CLASSES.cardMoneyIn;
}

/* ===========================================================
   MOBILE LOAN BADGE CLASS RESOLVER
=========================================================== */

export function getAccountsLedgerMobileLoanBadgeClassName(
  loanType: "STANDARD" | "GOLD",
): string {
  return loanType === "GOLD"
    ? ACCOUNTS_LEDGER_MOBILE_CLASSES.goldBadge
    : ACCOUNTS_LEDGER_MOBILE_CLASSES.standardBadge;
}

/* ===========================================================
   END
=========================================================== */
