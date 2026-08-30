/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS SUMMARY STYLE CONTRACT

   MODULE  : Accounts
   LAYER   : Summary CSS Class Contract
   VERSION : 1.0

   RESPONSIBILITY:

   - Centralize Accounts Summary CSS class names
   - Define summary-card semantic variants
   - Preserve Money Out / Money In visual meaning
   - Keep AccountsSummary.tsx free from inline styles
   - Keep responsive geometry inside CSS variables

   SUMMARY:

   01. Money Out
       Debit
       Red semantic

   02. Money In
       Credit
       Green semantic

   03. Net Movement
       Money In - Money Out

   04. Transactions
       Total financial movements

   IMPORTANT:

   - No CSSProperties.
   - No inline style objects.
   - No theme calculations.
   - No responsive calculations.
   - No financial calculations.
   - No repository access.
=========================================================== */

/* ===========================================================
   ROOT
=========================================================== */

export const ACCOUNTS_SUMMARY_CLASSES = {
  root: "finora-accounts-summary",

  grid: "finora-accounts-summary__grid",

  card: "finora-accounts-summary__card",

  cardHeader: "finora-accounts-summary__card-header",

  identity: "finora-accounts-summary__identity",

  icon: "finora-accounts-summary__icon",

  headingGroup: "finora-accounts-summary__heading-group",

  titleRow: "finora-accounts-summary__title-row",

  title: "finora-accounts-summary__title",

  accountingLabel: "finora-accounts-summary__accounting-label",

  value: "finora-accounts-summary__value",

  subtitle: "finora-accounts-summary__subtitle",

  footer: "finora-accounts-summary__footer",

  count: "finora-accounts-summary__count",
} as const;

/* ===========================================================
   CARD VARIANTS
=========================================================== */

export const ACCOUNTS_SUMMARY_VARIANT_CLASSES = {
  moneyOut:
    "finora-accounts-summary__card finora-accounts-summary__card--money-out",

  moneyIn:
    "finora-accounts-summary__card finora-accounts-summary__card--money-in",

  netPositive:
    "finora-accounts-summary__card finora-accounts-summary__card--net-positive",

  netNegative:
    "finora-accounts-summary__card finora-accounts-summary__card--net-negative",

  netNeutral:
    "finora-accounts-summary__card finora-accounts-summary__card--net-neutral",

  transactions:
    "finora-accounts-summary__card finora-accounts-summary__card--transactions",
} as const;

/* ===========================================================
   VALUE VARIANTS
=========================================================== */

export const ACCOUNTS_SUMMARY_VALUE_CLASSES = {
  moneyOut:
    "finora-accounts-summary__value finora-accounts-summary__value--money-out",

  moneyIn:
    "finora-accounts-summary__value finora-accounts-summary__value--money-in",

  netPositive:
    "finora-accounts-summary__value finora-accounts-summary__value--net-positive",

  netNegative:
    "finora-accounts-summary__value finora-accounts-summary__value--net-negative",

  netNeutral:
    "finora-accounts-summary__value finora-accounts-summary__value--net-neutral",

  transactions:
    "finora-accounts-summary__value finora-accounts-summary__value--transactions",
} as const;

/* ===========================================================
   ICON VARIANTS
=========================================================== */

export const ACCOUNTS_SUMMARY_ICON_CLASSES = {
  base: "finora-accounts-summary__icon-symbol",

  moneyOut:
    "finora-accounts-summary__icon-symbol finora-accounts-summary__icon-symbol--money-out",

  moneyIn:
    "finora-accounts-summary__icon-symbol finora-accounts-summary__icon-symbol--money-in",

  netPositive:
    "finora-accounts-summary__icon-symbol finora-accounts-summary__icon-symbol--net-positive",

  netNegative:
    "finora-accounts-summary__icon-symbol finora-accounts-summary__icon-symbol--net-negative",

  netNeutral:
    "finora-accounts-summary__icon-symbol finora-accounts-summary__icon-symbol--net-neutral",

  transactions:
    "finora-accounts-summary__icon-symbol finora-accounts-summary__icon-symbol--transactions",
} as const;

/* ===========================================================
   NET MOVEMENT SEMANTIC STATE
=========================================================== */

export type AccountsNetMovementTone = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

/* ===========================================================
   NET MOVEMENT TONE RESOLVER

   NOTE:
   This resolves presentation semantics only.

   Net Movement calculation itself belongs to
   accountsTotals.ts.
=========================================================== */

export function resolveAccountsNetMovementTone(
  netMovement: number,
): AccountsNetMovementTone {
  if (netMovement > 0) {
    return "POSITIVE";
  }

  if (netMovement < 0) {
    return "NEGATIVE";
  }

  return "NEUTRAL";
}

/* ===========================================================
   NET CARD CLASS
=========================================================== */

export function getAccountsNetCardClassName(
  tone: AccountsNetMovementTone,
): string {
  switch (tone) {
    case "POSITIVE":
      return ACCOUNTS_SUMMARY_VARIANT_CLASSES.netPositive;

    case "NEGATIVE":
      return ACCOUNTS_SUMMARY_VARIANT_CLASSES.netNegative;

    case "NEUTRAL":
    default:
      return ACCOUNTS_SUMMARY_VARIANT_CLASSES.netNeutral;
  }
}

/* ===========================================================
   NET VALUE CLASS
=========================================================== */

export function getAccountsNetValueClassName(
  tone: AccountsNetMovementTone,
): string {
  switch (tone) {
    case "POSITIVE":
      return ACCOUNTS_SUMMARY_VALUE_CLASSES.netPositive;

    case "NEGATIVE":
      return ACCOUNTS_SUMMARY_VALUE_CLASSES.netNegative;

    case "NEUTRAL":
    default:
      return ACCOUNTS_SUMMARY_VALUE_CLASSES.netNeutral;
  }
}

/* ===========================================================
   NET ICON CLASS
=========================================================== */

export function getAccountsNetIconClassName(
  tone: AccountsNetMovementTone,
): string {
  switch (tone) {
    case "POSITIVE":
      return ACCOUNTS_SUMMARY_ICON_CLASSES.netPositive;

    case "NEGATIVE":
      return ACCOUNTS_SUMMARY_ICON_CLASSES.netNegative;

    case "NEUTRAL":
    default:
      return ACCOUNTS_SUMMARY_ICON_CLASSES.netNeutral;
  }
}

/* ===========================================================
   END
=========================================================== */
