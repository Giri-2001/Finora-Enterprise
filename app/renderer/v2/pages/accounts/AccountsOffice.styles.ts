/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS OFFICE STYLE CONTRACT

   MODULE  : Accounts
   LAYER   : CSS Class Contract
   VERSION : 2.0

   RESPONSIBILITY:

   - Centralize Accounts Office CSS class names
   - Keep JSX free from raw repeated class strings
   - Prevent inline-style architecture from returning
   - Provide semantic Money Out / Money In class helpers

   IMPORTANT:

   - No CSSProperties.
   - No React style objects.
   - No theme calculations.
   - No responsive calculations.
   - No breakpoint values.
   - No repository access.
   - No financial calculations.
   - Actual visual rules live in AccountsOffice.css.

   THEME:
   --finora-theme-*

   RESPONSIVE:
   --finora-accounts-*
=========================================================== */

/* ===========================================================
   PAGE CLASSES
=========================================================== */

export const ACCOUNTS_OFFICE_CLASSES = {
  page: "finora-accounts-office",

  content: "finora-accounts-office__content",

  section: "finora-accounts-office__section",
} as const;

/* ===========================================================
   STATE PANEL CLASSES
=========================================================== */

export const ACCOUNTS_STATE_CLASSES = {
  panel: "finora-accounts-state-panel",

  loadingPanel:
    "finora-accounts-state-panel finora-accounts-state-panel--loading",

  errorPanel: "finora-accounts-state-panel finora-accounts-state-panel--error",

  title: "finora-accounts-state-panel__title",

  text: "finora-accounts-state-panel__text",

  retryButton: "finora-accounts-retry-button",
} as const;

/* ===========================================================
   MONEY SEMANTIC CLASSES
=========================================================== */

export const ACCOUNTS_MONEY_CLASSES = {
  moneyOut: "finora-accounts-money-out",

  moneyOutSurface: "finora-accounts-money-out-surface",

  moneyIn: "finora-accounts-money-in",

  moneyInSurface: "finora-accounts-money-in-surface",

  number: "finora-accounts-number",
} as const;

/* ===========================================================
   ACCESSIBILITY
=========================================================== */

export const ACCOUNTS_ACCESSIBILITY_CLASSES = {
  screenReaderOnly: "finora-accounts-sr-only",
} as const;

/* ===========================================================
   CLASS NAME COMPOSER

   Useful when semantic classes need to be combined without
   constructing style objects in JSX.
=========================================================== */

export function joinAccountsClassNames(
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
   MONEY CLASS RESOLVER
=========================================================== */

export function getAccountsMoneyClassName(
  direction: "MONEY_OUT" | "MONEY_IN",
): string {
  return direction === "MONEY_OUT"
    ? ACCOUNTS_MONEY_CLASSES.moneyOut
    : ACCOUNTS_MONEY_CLASSES.moneyIn;
}

/* ===========================================================
   MONEY SURFACE CLASS RESOLVER
=========================================================== */

export function getAccountsMoneySurfaceClassName(
  direction: "MONEY_OUT" | "MONEY_IN",
): string {
  return direction === "MONEY_OUT"
    ? ACCOUNTS_MONEY_CLASSES.moneyOutSurface
    : ACCOUNTS_MONEY_CLASSES.moneyInSurface;
}

/* ===========================================================
   END
=========================================================== */
