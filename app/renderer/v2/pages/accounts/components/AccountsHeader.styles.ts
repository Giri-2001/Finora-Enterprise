/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS HEADER STYLE CONTRACT

   MODULE  : Accounts
   LAYER   : Header CSS Class Contract
   VERSION : 1.0

   RESPONSIBILITY:

   - Centralize Accounts Header CSS class names
   - Preserve Gold Loan-style icon + heading hierarchy
   - Define document-action class contracts
   - Keep AccountsHeader.tsx free from inline styles
   - Keep visual geometry in CSS / responsive variables

   HEADER STRUCTURE:

   [ Landmark ]
       Accounts Office
       See every rupee that came in and went out.

                    [ Print ] [ Download PDF ] [ Share ]

   IMPORTANT:

   - No CSSProperties.
   - No style objects.
   - No theme calculations.
   - No responsive calculations.
   - No breakpoint values.
   - No financial calculations.
   - No repository access.
=========================================================== */

/* ===========================================================
   ROOT
=========================================================== */

export const ACCOUNTS_HEADER_CLASSES = {
  root: "finora-accounts-header",

  identity: "finora-accounts-header__identity",

  icon: "finora-accounts-header__icon",

  headingGroup: "finora-accounts-header__heading-group",

  titleRow: "finora-accounts-header__title-row",

  title: "finora-accounts-header__title",

  subtitle: "finora-accounts-header__subtitle",

  registerBadge: "finora-accounts-header__register-badge",

  registerBadgeIcon: "finora-accounts-header__register-badge-icon",

  registerBadgeText: "finora-accounts-header__register-badge-text",
} as const;

/* ===========================================================
   DOCUMENT ACTIONS
=========================================================== */

export const ACCOUNTS_HEADER_ACTION_CLASSES = {
  root: "finora-accounts-header__actions",

  button: "finora-accounts-header__action-button",

  primaryButton:
    "finora-accounts-header__action-button finora-accounts-header__action-button--primary",

  secondaryButton:
    "finora-accounts-header__action-button finora-accounts-header__action-button--secondary",

  icon: "finora-accounts-header__action-icon",

  label: "finora-accounts-header__action-label",

  disabled: "finora-accounts-header__action-button--disabled",
} as const;

/* ===========================================================
   ICON IDENTITY

   Semantic mapping for AccountsHeader.tsx:

   Landmark
     →
   Accounts Office identity

   BookOpen
     →
   Accounts Register

   Printer
     →
   Print

   Download
     →
   Download PDF

   Share2
     →
   Share
=========================================================== */

export const ACCOUNTS_HEADER_ICON_CLASSES = {
  office: "finora-accounts-header__office-icon",

  register: "finora-accounts-header__register-icon",

  print: "finora-accounts-header__print-icon",

  download: "finora-accounts-header__download-icon",

  share: "finora-accounts-header__share-icon",
} as const;

/* ===========================================================
   STATE CLASSES
=========================================================== */

export const ACCOUNTS_HEADER_STATE_CLASSES = {
  busy: "finora-accounts-header--busy",

  actionsDisabled: "finora-accounts-header__actions--disabled",
} as const;

/* ===========================================================
   CLASS COMPOSER
=========================================================== */

export function joinAccountsHeaderClassNames(
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
   ACTION BUTTON CLASS RESOLVER
=========================================================== */

export type AccountsHeaderActionVariant = "PRIMARY" | "SECONDARY";

export function getAccountsHeaderActionClassName(
  variant: AccountsHeaderActionVariant,

  disabled = false,
): string {
  const baseClass =
    variant === "PRIMARY"
      ? ACCOUNTS_HEADER_ACTION_CLASSES.primaryButton
      : ACCOUNTS_HEADER_ACTION_CLASSES.secondaryButton;

  return joinAccountsHeaderClassNames(
    baseClass,

    disabled && ACCOUNTS_HEADER_ACTION_CLASSES.disabled,
  );
}

/* ===========================================================
   END
=========================================================== */
