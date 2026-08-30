/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS RESPONSIVE LAYOUT

   MODULE  : Accounts
   LAYER   : Responsive Layout Resolver
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Convert Accounts module tokens into structural geometry
   - Resolve summary-grid columns
   - Resolve filter-grid columns
   - Resolve document-action layout
   - Resolve physical register visibility
   - Resolve mobile transaction-card visibility
   - Resolve pagination geometry
   - Consume canonical FINORA responsive tokens

   IMPORTANT:

   - No breakpoint boundaries.
   - No viewport classification.
   - No @media queries.
   - No theme colors.
   - No React.
   - No financial calculations.
   - No repository access.
   - Global FINORA Responsive Engine remains authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { getAccountsModuleTokens } from "./accounts.tokens";

import type {
  AccountsFiltersLayout,
  AccountsHeaderLayout,
  AccountsLayout,
  AccountsLayoutInput,
  AccountsMobileCardLayout,
  AccountsPageLayout,
  AccountsRegisterLayout,
  AccountsRegisterSectionLayout,
  AccountsResponsiveDevice,
  AccountsSearchLayout,
  AccountsSummaryLayout,
  AccountsDocumentActionsLayout,
  AccountsPaginationLayout,
  AccountsEmptyStateLayout,
} from "./accounts.types";

/* ===========================================================
   CONSTANTS
=========================================================== */

const FULL_WIDTH = "100%";

/* ===========================================================
   SAFE POSITIVE NUMBER
=========================================================== */

function safePositiveNumber(value: unknown, fallback: number): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return numericValue;
}

/* ===========================================================
   SUMMARY COLUMNS
=========================================================== */

function resolveSummaryColumns(device: AccountsResponsiveDevice): number {
  switch (device) {
    case "mobile":
      return 1;

    case "tablet":
      return 2;

    case "laptop":
    case "desktop":
      return 4;

    default:
      return 1;
  }
}

/* ===========================================================
   FILTER COLUMNS
=========================================================== */

function resolveFilterColumns(device: AccountsResponsiveDevice): number {
  switch (device) {
    case "mobile":
      return 1;

    case "tablet":
      return 2;

    case "laptop":
      return 4;

    case "desktop":
      return 5;

    default:
      return 1;
  }
}

/* ===========================================================
   FILTER ACTION COLUMNS
=========================================================== */

function resolveFilterActionColumns(device: AccountsResponsiveDevice): number {
  switch (device) {
    case "mobile":
      return 1;

    case "tablet":
    case "laptop":
    case "desktop":
      return 2;

    default:
      return 1;
  }
}

/* ===========================================================
   DOCUMENT ACTION COLUMNS
=========================================================== */

function resolveDocumentActionColumns(
  device: AccountsResponsiveDevice,
): number {
  switch (device) {
    case "mobile":
      return 1;

    case "tablet":
      return 3;

    case "laptop":
    case "desktop":
      return 3;

    default:
      return 1;
  }
}

/* ===========================================================
   MOBILE MONEY COLUMNS
=========================================================== */

function resolveMobileMoneyColumns(device: AccountsResponsiveDevice): number {
  return device === "mobile" ? 2 : 2;
}

/* ===========================================================
   MOBILE METADATA COLUMNS
=========================================================== */

function resolveMobileMetadataColumns(
  device: AccountsResponsiveDevice,
): number {
  return device === "mobile" ? 1 : 2;
}

/* ===========================================================
   PAGE
=========================================================== */

function resolvePageLayout(input: AccountsLayoutInput): AccountsPageLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  const globalMaxWidth = safePositiveNumber(
    input.tokens.layout.maxContentWidth,
    1600,
  );

  return {
    width: FULL_WIDTH,

    maxWidth: globalMaxWidth,

    paddingX: moduleTokens.spacing.pageX,

    paddingTop: moduleTokens.spacing.pageTop,

    paddingBottom: moduleTokens.spacing.pageBottom,

    sectionGap: moduleTokens.spacing.sectionGap,

    contentGap: moduleTokens.spacing.contentGap,
  };
}

/* ===========================================================
   HEADER
=========================================================== */

function resolveHeaderLayout(input: AccountsLayoutInput): AccountsHeaderLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  const isStacked = input.device === "mobile";

  return {
    minHeight: moduleTokens.header.minHeight,

    gap: moduleTokens.spacing.contentGap,

    contentGap: moduleTokens.spacing.compactGap,

    actionGap: moduleTokens.header.actionGap,

    actionColumns: resolveDocumentActionColumns(input.device),

    isStacked,

    iconContainerSize: moduleTokens.header.iconContainerSize,
  };
}

/* ===========================================================
   SUMMARY
=========================================================== */

function resolveSummaryLayout(
  input: AccountsLayoutInput,
): AccountsSummaryLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  return {
    columns: resolveSummaryColumns(input.device),

    gap: moduleTokens.spacing.cardGap,

    cardMinHeight: moduleTokens.summary.cardMinHeight,

    cardPadding: moduleTokens.summary.cardPadding,

    cardRadius: moduleTokens.summary.cardRadius,

    iconSize: moduleTokens.summary.iconSize,

    iconContainerSize: moduleTokens.summary.iconContainerSize,
  };
}

/* ===========================================================
   FILTERS
=========================================================== */

function resolveFiltersLayout(
  input: AccountsLayoutInput,
): AccountsFiltersLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  const isStacked = input.device === "mobile";

  return {
    columns: resolveFilterColumns(input.device),

    gap: moduleTokens.spacing.fieldGap,

    rowGap: moduleTokens.spacing.rowGap,

    panelPadding: moduleTokens.filters.panelPadding,

    panelRadius: moduleTokens.filters.panelRadius,

    controlHeight: moduleTokens.filters.controlHeight,

    actionHeight: moduleTokens.filters.actionHeight,

    actionColumns: resolveFilterActionColumns(input.device),

    actionGap: moduleTokens.spacing.compactGap,

    isStacked,
  };
}

/* ===========================================================
   SEARCH
=========================================================== */

function resolveSearchLayout(input: AccountsLayoutInput): AccountsSearchLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  return {
    width: FULL_WIDTH,

    minHeight: moduleTokens.control.inputHeight,

    iconSize: moduleTokens.control.iconSize,

    gap: moduleTokens.spacing.compactGap,
  };
}

/* ===========================================================
   REGISTER SECTION
=========================================================== */

function resolveRegisterSectionLayout(
  input: AccountsLayoutInput,
): AccountsRegisterSectionLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  return {
    minHeight: moduleTokens.register.sectionMinHeight,

    panelPadding: moduleTokens.register.sectionPadding,

    panelRadius: moduleTokens.register.sectionRadius,

    headerGap: moduleTokens.spacing.compactGap,

    contentGap: moduleTokens.spacing.contentGap,
  };
}

/* ===========================================================
   PHYSICAL REGISTER

   Mobile:
   - hide table
   - show transaction cards

   Tablet:
   - compact table
   - horizontal scroll allowed

   Laptop / Desktop:
   - full register
=========================================================== */

function resolveRegisterLayout(
  input: AccountsLayoutInput,
): AccountsRegisterLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  const visible = input.device !== "mobile";

  const horizontalScroll = input.device === "tablet";

  return {
    visible,

    minWidth: moduleTokens.register.minWidth,

    headerHeight: moduleTokens.register.headerHeight,

    rowMinHeight: moduleTokens.register.rowMinHeight,

    cellPaddingX: moduleTokens.register.cellPaddingX,

    cellPaddingY: moduleTokens.register.cellPaddingY,

    borderWidth: moduleTokens.register.borderWidth,

    radius: moduleTokens.register.radius,

    horizontalScroll,

    serialColumnWidth: moduleTokens.register.serialColumnWidth,

    dateColumnWidth: moduleTokens.register.dateColumnWidth,

    customerColumnWidth: moduleTokens.register.customerColumnWidth,

    activityColumnWidth: moduleTokens.register.activityColumnWidth,

    moneyColumnWidth: moduleTokens.register.moneyColumnWidth,

    methodColumnWidth: moduleTokens.register.methodColumnWidth,

    referenceColumnWidth: moduleTokens.register.referenceColumnWidth,
  };
}

/* ===========================================================
   MOBILE TRANSACTION CARD
=========================================================== */

function resolveMobileCardLayout(
  input: AccountsLayoutInput,
): AccountsMobileCardLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  return {
    visible: input.device === "mobile",

    minHeight: moduleTokens.mobileCard.minHeight,

    padding: moduleTokens.mobileCard.padding,

    radius: moduleTokens.mobileCard.radius,

    gap: moduleTokens.mobileCard.gap,

    sectionGap: moduleTokens.mobileCard.sectionGap,

    moneyColumns: resolveMobileMoneyColumns(input.device),

    moneyGap: moduleTokens.mobileCard.moneyGap,

    metadataColumns: resolveMobileMetadataColumns(input.device),

    metadataGap: moduleTokens.mobileCard.metadataGap,

    iconSize: moduleTokens.mobileCard.iconSize,
  };
}

/* ===========================================================
   DOCUMENT ACTIONS
=========================================================== */

function resolveDocumentActionsLayout(
  input: AccountsLayoutInput,
): AccountsDocumentActionsLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  const isStacked = input.device === "mobile";

  return {
    columns: resolveDocumentActionColumns(input.device),

    gap: moduleTokens.documentActions.gap,

    buttonHeight: moduleTokens.documentActions.buttonHeight,

    buttonMinWidth: moduleTokens.documentActions.buttonMinWidth,

    isStacked,

    iconSize: moduleTokens.documentActions.iconSize,
  };
}

/* ===========================================================
   PAGINATION
=========================================================== */

function resolvePaginationLayout(
  input: AccountsLayoutInput,
): AccountsPaginationLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  return {
    minHeight: moduleTokens.pagination.minHeight,

    gap: moduleTokens.pagination.gap,

    controlGap: moduleTokens.pagination.controlGap,

    controlHeight: moduleTokens.pagination.controlHeight,

    isStacked: input.device === "mobile",
  };
}

/* ===========================================================
   EMPTY STATE
=========================================================== */

function resolveEmptyStateLayout(
  input: AccountsLayoutInput,
): AccountsEmptyStateLayout {
  const moduleTokens = getAccountsModuleTokens(input.device);

  return {
    minHeight: moduleTokens.emptyState.minHeight,

    padding: moduleTokens.emptyState.padding,

    gap: moduleTokens.emptyState.gap,

    iconSize: moduleTokens.emptyState.iconSize,
  };
}

/* ===========================================================
   CREATE COMPLETE ACCOUNTS LAYOUT
=========================================================== */

export function createAccountsLayout(
  input: AccountsLayoutInput,
): AccountsLayout {
  return {
    device: input.device,

    page: resolvePageLayout(input),

    header: resolveHeaderLayout(input),

    summary: resolveSummaryLayout(input),

    filters: resolveFiltersLayout(input),

    search: resolveSearchLayout(input),

    registerSection: resolveRegisterSectionLayout(input),

    register: resolveRegisterLayout(input),

    mobileCard: resolveMobileCardLayout(input),

    documentActions: resolveDocumentActionsLayout(input),

    pagination: resolvePaginationLayout(input),

    emptyState: resolveEmptyStateLayout(input),
  };
}

/* ===========================================================
   END
=========================================================== */
