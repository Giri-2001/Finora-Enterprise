/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS RESPONSIVE CSS VARIABLE BRIDGE

   MODULE  : Accounts
   LAYER   : Responsive CSS Bridge
   VERSION : 1.0

   RESPONSIBILITY:

   - Convert resolved Accounts responsive values into
     namespaced CSS custom properties
   - Allow Accounts JSX to remain className-only
   - Preserve Accounts TS tokens as the single geometry source
   - Publish the resolved Accounts device for diagnostics
   - Support live viewport/device changes

   IMPORTANT:

   - No breakpoint values.
   - No @media queries.
   - No theme colors.
   - No financial calculations.
   - No repository access.
   - No React component.
   - No duplicated responsive values in CSS.

   FLOW:

   FINORA Responsive Engine
          ↓
   Accounts Responsive Engine
          ↓
   AccountsResponsiveValue
          ↓
   --finora-accounts-*
          ↓
   Accounts CSS classes
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { getAccountsModuleTokens } from "./accounts.tokens";

import type { AccountsResponsiveValue } from "./accounts.types";

/* ===========================================================
   CSS VARIABLE CONTRACT
=========================================================== */

export type AccountsResponsiveCssVariableMap = Record<
  `--finora-accounts-${string}`,
  string
>;

/* ===========================================================
   PIXEL VALUE
=========================================================== */

function px(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${safeValue}px`;
}

/* ===========================================================
   CSS DIMENSION

   Numeric dimensions become px.

   Existing valid CSS strings such as:
   - 100%
   - 1600px
   - auto

   remain unchanged.
=========================================================== */

function dimension(value: number | string): string {
  if (typeof value === "number") {
    return px(value);
  }

  return String(value).trim();
}

/* ===========================================================
   BOOLEAN CSS VALUE
=========================================================== */

function cssBoolean(value: boolean): string {
  return value ? "1" : "0";
}

/* ===========================================================
   BUILD RESPONSIVE CSS VARIABLES

   PURE FUNCTION

   No DOM access occurs here.
=========================================================== */

export function buildAccountsResponsiveCssVariables(
  responsive: AccountsResponsiveValue,
): AccountsResponsiveCssVariableMap {
  const moduleTokens = getAccountsModuleTokens(responsive.device);

  const {
    page,
    header,
    summary,
    filters,
    search,
    registerSection,
    register,
    mobileCard,
    documentActions,
    pagination,
    emptyState,
  } = responsive.layout;

  return {
    /* =======================================================
       DEVICE
    ======================================================= */

    "--finora-accounts-device": responsive.device,

    /* =======================================================
       FONT
    ======================================================= */

    "--finora-accounts-font-family": moduleTokens.fontFamily,

    /* =======================================================
       TYPOGRAPHY
    ======================================================= */

    "--finora-accounts-font-page-title": px(moduleTokens.typography.pageTitle),

    "--finora-accounts-font-page-subtitle": px(
      moduleTokens.typography.pageSubtitle,
    ),

    "--finora-accounts-font-section-title": px(
      moduleTokens.typography.sectionTitle,
    ),

    "--finora-accounts-font-section-subtitle": px(
      moduleTokens.typography.sectionSubtitle,
    ),

    "--finora-accounts-font-summary-label": px(
      moduleTokens.typography.summaryLabel,
    ),

    "--finora-accounts-font-summary-value": px(
      moduleTokens.typography.summaryValue,
    ),

    "--finora-accounts-font-summary-hint": px(
      moduleTokens.typography.summaryHint,
    ),

    "--finora-accounts-font-filter-label": px(
      moduleTokens.typography.filterLabel,
    ),

    "--finora-accounts-font-filter-control": px(
      moduleTokens.typography.filterControl,
    ),

    "--finora-accounts-font-register-title": px(
      moduleTokens.typography.registerTitle,
    ),

    "--finora-accounts-font-register-subtitle": px(
      moduleTokens.typography.registerSubtitle,
    ),

    "--finora-accounts-font-table-header": px(
      moduleTokens.typography.tableHeader,
    ),

    "--finora-accounts-font-table-body": px(moduleTokens.typography.tableBody),

    "--finora-accounts-font-table-secondary": px(
      moduleTokens.typography.tableSecondary,
    ),

    "--finora-accounts-font-table-money": px(
      moduleTokens.typography.tableMoney,
    ),

    "--finora-accounts-font-mobile-card-title": px(
      moduleTokens.typography.mobileCardTitle,
    ),

    "--finora-accounts-font-mobile-card-secondary": px(
      moduleTokens.typography.mobileCardSecondary,
    ),

    "--finora-accounts-font-mobile-money": px(
      moduleTokens.typography.mobileMoney,
    ),

    "--finora-accounts-font-button": px(moduleTokens.typography.button),

    "--finora-accounts-font-pagination": px(moduleTokens.typography.pagination),

    "--finora-accounts-font-empty-title": px(
      moduleTokens.typography.emptyTitle,
    ),

    "--finora-accounts-font-empty-subtitle": px(
      moduleTokens.typography.emptySubtitle,
    ),

    /* =======================================================
       PAGE
    ======================================================= */

    "--finora-accounts-page-width": dimension(page.width),

    "--finora-accounts-page-max-width": dimension(page.maxWidth),

    "--finora-accounts-page-padding-x": px(page.paddingX),

    "--finora-accounts-page-padding-top": px(page.paddingTop),

    "--finora-accounts-page-padding-bottom": px(page.paddingBottom),

    "--finora-accounts-section-gap": px(page.sectionGap),

    "--finora-accounts-content-gap": px(page.contentGap),

    /* =======================================================
       GENERAL SPACING
    ======================================================= */

    "--finora-accounts-panel-gap": px(moduleTokens.spacing.panelGap),

    "--finora-accounts-card-gap": px(moduleTokens.spacing.cardGap),

    "--finora-accounts-field-gap": px(moduleTokens.spacing.fieldGap),

    "--finora-accounts-row-gap": px(moduleTokens.spacing.rowGap),

    "--finora-accounts-compact-gap": px(moduleTokens.spacing.compactGap),

    /* =======================================================
       GENERAL CONTROLS
    ======================================================= */

    "--finora-accounts-input-height": px(moduleTokens.control.inputHeight),

    "--finora-accounts-button-height": px(moduleTokens.control.buttonHeight),

    "--finora-accounts-compact-button-height": px(
      moduleTokens.control.compactButtonHeight,
    ),

    "--finora-accounts-input-radius": px(moduleTokens.control.inputRadius),

    "--finora-accounts-button-radius": px(moduleTokens.control.buttonRadius),

    "--finora-accounts-input-padding-x": px(moduleTokens.control.inputPaddingX),

    "--finora-accounts-button-padding-x": px(
      moduleTokens.control.buttonPaddingX,
    ),

    "--finora-accounts-icon-size": px(moduleTokens.control.iconSize),

    "--finora-accounts-compact-icon-size": px(
      moduleTokens.control.compactIconSize,
    ),

    /* =======================================================
       PANEL
    ======================================================= */

    "--finora-accounts-panel-radius": px(moduleTokens.panel.radius),

    "--finora-accounts-panel-compact-radius": px(
      moduleTokens.panel.compactRadius,
    ),

    "--finora-accounts-panel-border-width": px(moduleTokens.panel.borderWidth),

    "--finora-accounts-panel-padding": px(moduleTokens.panel.padding),

    "--finora-accounts-panel-compact-padding": px(
      moduleTokens.panel.compactPadding,
    ),

    /* =======================================================
       HEADER
    ======================================================= */

    "--finora-accounts-header-min-height": px(header.minHeight),

    "--finora-accounts-header-gap": px(header.gap),

    "--finora-accounts-header-content-gap": px(header.contentGap),

    "--finora-accounts-header-action-gap": px(header.actionGap),

    "--finora-accounts-header-action-columns": String(header.actionColumns),

    "--finora-accounts-header-icon-container-size": px(
      header.iconContainerSize,
    ),

    "--finora-accounts-header-stacked": cssBoolean(header.isStacked),

    "--finora-accounts-header-direction": header.isStacked ? "column" : "row",

    /* =======================================================
       SUMMARY
    ======================================================= */

    "--finora-accounts-summary-columns": String(summary.columns),

    "--finora-accounts-summary-gap": px(summary.gap),

    "--finora-accounts-summary-card-min-height": px(summary.cardMinHeight),

    "--finora-accounts-summary-card-padding": px(summary.cardPadding),

    "--finora-accounts-summary-card-radius": px(summary.cardRadius),

    "--finora-accounts-summary-icon-size": px(summary.iconSize),

    "--finora-accounts-summary-icon-container-size": px(
      summary.iconContainerSize,
    ),

    /* =======================================================
       FILTERS
    ======================================================= */

    "--finora-accounts-filter-columns": String(filters.columns),

    "--finora-accounts-filter-gap": px(filters.gap),

    "--finora-accounts-filter-row-gap": px(filters.rowGap),

    "--finora-accounts-filter-panel-padding": px(filters.panelPadding),

    "--finora-accounts-filter-panel-radius": px(filters.panelRadius),

    "--finora-accounts-filter-control-height": px(filters.controlHeight),

    "--finora-accounts-filter-action-height": px(filters.actionHeight),

    "--finora-accounts-filter-action-columns": String(filters.actionColumns),

    "--finora-accounts-filter-action-gap": px(filters.actionGap),

    "--finora-accounts-filter-stacked": cssBoolean(filters.isStacked),

    /* =======================================================
       SEARCH
    ======================================================= */

    "--finora-accounts-search-width": dimension(search.width),

    "--finora-accounts-search-min-height": px(search.minHeight),

    "--finora-accounts-search-icon-size": px(search.iconSize),

    "--finora-accounts-search-gap": px(search.gap),

    /* =======================================================
       REGISTER SECTION
    ======================================================= */

    "--finora-accounts-register-section-min-height": px(
      registerSection.minHeight,
    ),

    "--finora-accounts-register-section-padding": px(
      registerSection.panelPadding,
    ),

    "--finora-accounts-register-section-radius": px(
      registerSection.panelRadius,
    ),

    "--finora-accounts-register-section-header-gap": px(
      registerSection.headerGap,
    ),

    "--finora-accounts-register-section-content-gap": px(
      registerSection.contentGap,
    ),

    /* =======================================================
       PHYSICAL REGISTER
    ======================================================= */

    "--finora-accounts-register-display": register.visible ? "table" : "none",

    "--finora-accounts-register-wrapper-display": register.visible
      ? "block"
      : "none",

    "--finora-accounts-register-min-width": px(register.minWidth),

    "--finora-accounts-register-header-height": px(register.headerHeight),

    "--finora-accounts-register-row-min-height": px(register.rowMinHeight),

    "--finora-accounts-register-cell-padding-x": px(register.cellPaddingX),

    "--finora-accounts-register-cell-padding-y": px(register.cellPaddingY),

    "--finora-accounts-register-border-width": px(register.borderWidth),

    "--finora-accounts-register-radius": px(register.radius),

    "--finora-accounts-register-overflow-x": register.horizontalScroll
      ? "auto"
      : "visible",

    "--finora-accounts-register-serial-width": px(register.serialColumnWidth),

    "--finora-accounts-register-date-width": px(register.dateColumnWidth),

    "--finora-accounts-register-customer-width": px(
      register.customerColumnWidth,
    ),

    "--finora-accounts-register-activity-width": px(
      register.activityColumnWidth,
    ),

    "--finora-accounts-register-money-width": px(register.moneyColumnWidth),

    "--finora-accounts-register-method-width": px(register.methodColumnWidth),

    "--finora-accounts-register-reference-width": px(
      register.referenceColumnWidth,
    ),

    /* =======================================================
       MOBILE TRANSACTION CARDS
    ======================================================= */

    "--finora-accounts-mobile-card-display": mobileCard.visible
      ? "flex"
      : "none",

    "--finora-accounts-mobile-card-min-height": px(mobileCard.minHeight),

    "--finora-accounts-mobile-card-padding": px(mobileCard.padding),

    "--finora-accounts-mobile-card-radius": px(mobileCard.radius),

    "--finora-accounts-mobile-card-gap": px(mobileCard.gap),

    "--finora-accounts-mobile-card-section-gap": px(mobileCard.sectionGap),

    "--finora-accounts-mobile-money-columns": String(mobileCard.moneyColumns),

    "--finora-accounts-mobile-money-gap": px(mobileCard.moneyGap),

    "--finora-accounts-mobile-metadata-columns": String(
      mobileCard.metadataColumns,
    ),

    "--finora-accounts-mobile-metadata-gap": px(mobileCard.metadataGap),

    "--finora-accounts-mobile-card-icon-size": px(mobileCard.iconSize),

    /* =======================================================
       DOCUMENT ACTIONS
    ======================================================= */

    "--finora-accounts-document-action-columns": String(
      documentActions.columns,
    ),

    "--finora-accounts-document-action-gap": px(documentActions.gap),

    "--finora-accounts-document-action-height": px(
      documentActions.buttonHeight,
    ),

    "--finora-accounts-document-action-min-width": px(
      documentActions.buttonMinWidth,
    ),

    "--finora-accounts-document-action-icon-size": px(documentActions.iconSize),

    "--finora-accounts-document-action-stacked": cssBoolean(
      documentActions.isStacked,
    ),

    /* =======================================================
       PAGINATION
    ======================================================= */

    "--finora-accounts-pagination-min-height": px(pagination.minHeight),

    "--finora-accounts-pagination-gap": px(pagination.gap),

    "--finora-accounts-pagination-control-gap": px(pagination.controlGap),

    "--finora-accounts-pagination-control-height": px(pagination.controlHeight),

    "--finora-accounts-pagination-stacked": cssBoolean(pagination.isStacked),

    "--finora-accounts-pagination-direction": pagination.isStacked
      ? "column"
      : "row",

    /* =======================================================
       EMPTY STATE
    ======================================================= */

    "--finora-accounts-empty-min-height": px(emptyState.minHeight),

    "--finora-accounts-empty-padding": px(emptyState.padding),

    "--finora-accounts-empty-gap": px(emptyState.gap),

    "--finora-accounts-empty-icon-size": px(emptyState.iconSize),
  };
}

/* ===========================================================
   APPLY RESPONSIVE VARIABLES

   Variables are intentionally namespaced to Accounts.

   No JSX inline styles are required.
=========================================================== */

export function applyAccountsResponsiveCssVariables(
  responsive: AccountsResponsiveValue,
): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  const variables = buildAccountsResponsiveCssVariables(responsive);

  for (const [property, value] of Object.entries(variables)) {
    root.style.setProperty(property, value);
  }

  /* =========================================================
     DEVICE IDENTITY

     Diagnostics only.

     Device classification itself remains owned by the global
     FINORA Responsive Engine.
  ========================================================= */

  root.dataset.finoraAccountsDevice = responsive.device;
}

/* ===========================================================
   END
=========================================================== */
