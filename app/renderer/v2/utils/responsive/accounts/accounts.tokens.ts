/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS RESPONSIVE TOKENS

   MODULE  : Accounts
   LAYER   : Responsive Module Tokens
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define Accounts typography sizing
   - Define Accounts spacing sizing
   - Define control sizing
   - Define summary-card sizing
   - Define register sizing
   - Define mobile transaction-card sizing
   - Define document-action sizing
   - Resolve module tokens from the already-resolved
     FINORA device tier

   IMPORTANT:

   - No breakpoint boundaries.
   - No viewport classification.
   - No @media queries.
   - No theme colors.
   - No React.
   - No repository access.
   - No financial calculations.
   - Global FINORA Responsive Engine remains authoritative.

   FONT:

   Inter, ui-sans-serif, system-ui, sans-serif
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { ACCOUNTS_FONT_FAMILY } from "../../../constants/accounts/accounts.constants";

import type { AccountsResponsiveDevice } from "./accounts.types";

/* ===========================================================
   TYPOGRAPHY TOKENS
=========================================================== */

export interface AccountsTypographyTokens {
  pageTitle: number;

  pageSubtitle: number;

  sectionTitle: number;

  sectionSubtitle: number;

  summaryLabel: number;

  summaryValue: number;

  summaryHint: number;

  filterLabel: number;

  filterControl: number;

  registerTitle: number;

  registerSubtitle: number;

  tableHeader: number;

  tableBody: number;

  tableSecondary: number;

  tableMoney: number;

  mobileCardTitle: number;

  mobileCardSecondary: number;

  mobileMoney: number;

  button: number;

  pagination: number;

  emptyTitle: number;

  emptySubtitle: number;
}

/* ===========================================================
   SPACING TOKENS
=========================================================== */

export interface AccountsSpacingTokens {
  pageX: number;

  pageTop: number;

  pageBottom: number;

  sectionGap: number;

  contentGap: number;

  panelGap: number;

  cardGap: number;

  fieldGap: number;

  rowGap: number;

  compactGap: number;
}

/* ===========================================================
   CONTROL TOKENS
=========================================================== */

export interface AccountsControlTokens {
  inputHeight: number;

  buttonHeight: number;

  compactButtonHeight: number;

  inputRadius: number;

  buttonRadius: number;

  inputPaddingX: number;

  buttonPaddingX: number;

  iconSize: number;

  compactIconSize: number;
}

/* ===========================================================
   PANEL TOKENS
=========================================================== */

export interface AccountsPanelTokens {
  radius: number;

  compactRadius: number;

  borderWidth: number;

  padding: number;

  compactPadding: number;
}

/* ===========================================================
   HEADER TOKENS
=========================================================== */

export interface AccountsHeaderTokens {
  minHeight: number;

  iconContainerSize: number;

  iconSize: number;

  actionGap: number;
}

/* ===========================================================
   SUMMARY TOKENS
=========================================================== */

export interface AccountsSummaryTokens {
  cardMinHeight: number;

  cardPadding: number;

  cardRadius: number;

  iconSize: number;

  iconContainerSize: number;
}

/* ===========================================================
   FILTER TOKENS
=========================================================== */

export interface AccountsFilterTokens {
  panelPadding: number;

  panelRadius: number;

  controlHeight: number;

  actionHeight: number;
}

/* ===========================================================
   REGISTER TOKENS
=========================================================== */

export interface AccountsRegisterTokens {
  sectionMinHeight: number;

  sectionPadding: number;

  sectionRadius: number;

  minWidth: number;

  headerHeight: number;

  rowMinHeight: number;

  cellPaddingX: number;

  cellPaddingY: number;

  borderWidth: number;

  radius: number;

  serialColumnWidth: number;

  dateColumnWidth: number;

  customerColumnWidth: number;

  activityColumnWidth: number;

  moneyColumnWidth: number;

  methodColumnWidth: number;

  referenceColumnWidth: number;
}

/* ===========================================================
   MOBILE CARD TOKENS
=========================================================== */

export interface AccountsMobileCardTokens {
  minHeight: number;

  padding: number;

  radius: number;

  gap: number;

  sectionGap: number;

  moneyGap: number;

  metadataGap: number;

  iconSize: number;
}

/* ===========================================================
   DOCUMENT ACTION TOKENS
=========================================================== */

export interface AccountsDocumentActionTokens {
  buttonHeight: number;

  buttonMinWidth: number;

  iconSize: number;

  gap: number;
}

/* ===========================================================
   PAGINATION TOKENS
=========================================================== */

export interface AccountsPaginationTokens {
  minHeight: number;

  gap: number;

  controlGap: number;

  controlHeight: number;
}

/* ===========================================================
   EMPTY STATE TOKENS
=========================================================== */

export interface AccountsEmptyStateTokens {
  minHeight: number;

  padding: number;

  gap: number;

  iconSize: number;
}

/* ===========================================================
   COMPLETE MODULE TOKENS
=========================================================== */

export interface AccountsModuleTokens {
  fontFamily: string;

  typography: AccountsTypographyTokens;

  spacing: AccountsSpacingTokens;

  control: AccountsControlTokens;

  panel: AccountsPanelTokens;

  header: AccountsHeaderTokens;

  summary: AccountsSummaryTokens;

  filters: AccountsFilterTokens;

  register: AccountsRegisterTokens;

  mobileCard: AccountsMobileCardTokens;

  documentActions: AccountsDocumentActionTokens;

  pagination: AccountsPaginationTokens;

  emptyState: AccountsEmptyStateTokens;
}

/* ===========================================================
   MOBILE TOKENS
=========================================================== */

const MOBILE_TOKENS: AccountsModuleTokens = {
  fontFamily: ACCOUNTS_FONT_FAMILY,

  typography: {
    pageTitle: 22,

    pageSubtitle: 12,

    sectionTitle: 16,

    sectionSubtitle: 11,

    summaryLabel: 12,

    summaryValue: 23,

    summaryHint: 11,

    filterLabel: 12,

    filterControl: 13,

    registerTitle: 16,

    registerSubtitle: 11,

    tableHeader: 11,

    tableBody: 12,

    tableSecondary: 11,

    tableMoney: 14,

    mobileCardTitle: 14,

    mobileCardSecondary: 11,

    mobileMoney: 18,

    button: 13,

    pagination: 12,

    emptyTitle: 15,

    emptySubtitle: 12,
  },

  spacing: {
    pageX: 14,

    pageTop: 16,

    pageBottom: 24,

    sectionGap: 18,

    contentGap: 14,

    panelGap: 12,

    cardGap: 10,

    fieldGap: 10,

    rowGap: 10,

    compactGap: 6,
  },

  control: {
    inputHeight: 46,

    buttonHeight: 46,

    compactButtonHeight: 42,

    inputRadius: 10,

    buttonRadius: 10,

    inputPaddingX: 12,

    buttonPaddingX: 14,

    iconSize: 18,

    compactIconSize: 16,
  },

  panel: {
    radius: 14,

    compactRadius: 12,

    borderWidth: 1,

    padding: 14,

    compactPadding: 12,
  },

  header: {
    minHeight: 76,

    iconContainerSize: 44,

    iconSize: 22,

    actionGap: 8,
  },

  summary: {
    cardMinHeight: 112,

    cardPadding: 14,

    cardRadius: 14,

    iconSize: 20,

    iconContainerSize: 38,
  },

  filters: {
    panelPadding: 14,

    panelRadius: 14,

    controlHeight: 46,

    actionHeight: 46,
  },

  register: {
    sectionMinHeight: 220,

    sectionPadding: 12,

    sectionRadius: 14,

    minWidth: 900,

    headerHeight: 44,

    rowMinHeight: 54,

    cellPaddingX: 10,

    cellPaddingY: 9,

    borderWidth: 1,

    radius: 12,

    serialColumnWidth: 54,

    dateColumnWidth: 132,

    customerColumnWidth: 170,

    activityColumnWidth: 170,

    moneyColumnWidth: 116,

    methodColumnWidth: 112,

    referenceColumnWidth: 150,
  },

  mobileCard: {
    minHeight: 166,

    padding: 14,

    radius: 14,

    gap: 10,

    sectionGap: 12,

    moneyGap: 8,

    metadataGap: 8,

    iconSize: 18,
  },

  documentActions: {
    buttonHeight: 44,

    buttonMinWidth: 112,

    iconSize: 17,

    gap: 8,
  },

  pagination: {
    minHeight: 52,

    gap: 10,

    controlGap: 8,

    controlHeight: 40,
  },

  emptyState: {
    minHeight: 220,

    padding: 22,

    gap: 10,

    iconSize: 38,
  },
};

/* ===========================================================
   TABLET TOKENS
=========================================================== */

const TABLET_TOKENS: AccountsModuleTokens = {
  fontFamily: ACCOUNTS_FONT_FAMILY,

  typography: {
    pageTitle: 24,

    pageSubtitle: 12,

    sectionTitle: 17,

    sectionSubtitle: 11,

    summaryLabel: 12,

    summaryValue: 24,

    summaryHint: 11,

    filterLabel: 12,

    filterControl: 13,

    registerTitle: 17,

    registerSubtitle: 11,

    tableHeader: 11,

    tableBody: 12,

    tableSecondary: 11,

    tableMoney: 13,

    mobileCardTitle: 14,

    mobileCardSecondary: 11,

    mobileMoney: 18,

    button: 13,

    pagination: 12,

    emptyTitle: 16,

    emptySubtitle: 12,
  },

  spacing: {
    pageX: 18,

    pageTop: 18,

    pageBottom: 28,

    sectionGap: 20,

    contentGap: 16,

    panelGap: 14,

    cardGap: 12,

    fieldGap: 12,

    rowGap: 12,

    compactGap: 7,
  },

  control: {
    inputHeight: 44,

    buttonHeight: 44,

    compactButtonHeight: 40,

    inputRadius: 10,

    buttonRadius: 10,

    inputPaddingX: 12,

    buttonPaddingX: 14,

    iconSize: 18,

    compactIconSize: 16,
  },

  panel: {
    radius: 14,

    compactRadius: 12,

    borderWidth: 1,

    padding: 16,

    compactPadding: 12,
  },

  header: {
    minHeight: 76,

    iconContainerSize: 46,

    iconSize: 23,

    actionGap: 8,
  },

  summary: {
    cardMinHeight: 112,

    cardPadding: 15,

    cardRadius: 14,

    iconSize: 20,

    iconContainerSize: 40,
  },

  filters: {
    panelPadding: 16,

    panelRadius: 14,

    controlHeight: 44,

    actionHeight: 44,
  },

  register: {
    sectionMinHeight: 260,

    sectionPadding: 14,

    sectionRadius: 14,

    minWidth: 980,

    headerHeight: 46,

    rowMinHeight: 56,

    cellPaddingX: 10,

    cellPaddingY: 10,

    borderWidth: 1,

    radius: 12,

    serialColumnWidth: 56,

    dateColumnWidth: 138,

    customerColumnWidth: 180,

    activityColumnWidth: 180,

    moneyColumnWidth: 120,

    methodColumnWidth: 116,

    referenceColumnWidth: 154,
  },

  mobileCard: {
    minHeight: 160,

    padding: 15,

    radius: 14,

    gap: 10,

    sectionGap: 12,

    moneyGap: 10,

    metadataGap: 10,

    iconSize: 18,
  },

  documentActions: {
    buttonHeight: 42,

    buttonMinWidth: 118,

    iconSize: 17,

    gap: 8,
  },

  pagination: {
    minHeight: 52,

    gap: 10,

    controlGap: 8,

    controlHeight: 40,
  },

  emptyState: {
    minHeight: 240,

    padding: 24,

    gap: 10,

    iconSize: 40,
  },
};

/* ===========================================================
   LAPTOP TOKENS

   Laptop readability is intentionally generous because
   Accounts is a financial register used for long sessions.
=========================================================== */

const LAPTOP_TOKENS: AccountsModuleTokens = {
  fontFamily: ACCOUNTS_FONT_FAMILY,

  typography: {
    pageTitle: 26,

    pageSubtitle: 13,

    sectionTitle: 18,

    sectionSubtitle: 12,

    summaryLabel: 13,

    summaryValue: 27,

    summaryHint: 12,

    filterLabel: 13,

    filterControl: 14,

    registerTitle: 18,

    registerSubtitle: 12,

    tableHeader: 12,

    tableBody: 13,

    tableSecondary: 12,

    tableMoney: 14,

    mobileCardTitle: 15,

    mobileCardSecondary: 12,

    mobileMoney: 19,

    button: 14,

    pagination: 13,

    emptyTitle: 17,

    emptySubtitle: 13,
  },

  spacing: {
    pageX: 22,

    pageTop: 20,

    pageBottom: 30,

    sectionGap: 22,

    contentGap: 18,

    panelGap: 16,

    cardGap: 14,

    fieldGap: 12,

    rowGap: 12,

    compactGap: 8,
  },

  control: {
    inputHeight: 46,

    buttonHeight: 46,

    compactButtonHeight: 42,

    inputRadius: 10,

    buttonRadius: 10,

    inputPaddingX: 14,

    buttonPaddingX: 16,

    iconSize: 19,

    compactIconSize: 17,
  },

  panel: {
    radius: 15,

    compactRadius: 12,

    borderWidth: 1,

    padding: 18,

    compactPadding: 14,
  },

  header: {
    minHeight: 82,

    iconContainerSize: 48,

    iconSize: 24,

    actionGap: 9,
  },

  summary: {
    cardMinHeight: 118,

    cardPadding: 17,

    cardRadius: 15,

    iconSize: 21,

    iconContainerSize: 42,
  },

  filters: {
    panelPadding: 18,

    panelRadius: 15,

    controlHeight: 46,

    actionHeight: 46,
  },

  register: {
    sectionMinHeight: 300,

    sectionPadding: 16,

    sectionRadius: 15,

    minWidth: 1080,

    headerHeight: 48,

    rowMinHeight: 58,

    cellPaddingX: 12,

    cellPaddingY: 10,

    borderWidth: 1,

    radius: 12,

    serialColumnWidth: 58,

    dateColumnWidth: 146,

    customerColumnWidth: 194,

    activityColumnWidth: 194,

    moneyColumnWidth: 128,

    methodColumnWidth: 124,

    referenceColumnWidth: 164,
  },

  mobileCard: {
    minHeight: 166,

    padding: 16,

    radius: 15,

    gap: 11,

    sectionGap: 13,

    moneyGap: 10,

    metadataGap: 10,

    iconSize: 19,
  },

  documentActions: {
    buttonHeight: 44,

    buttonMinWidth: 124,

    iconSize: 18,

    gap: 9,
  },

  pagination: {
    minHeight: 54,

    gap: 12,

    controlGap: 9,

    controlHeight: 42,
  },

  emptyState: {
    minHeight: 260,

    padding: 28,

    gap: 12,

    iconSize: 42,
  },
};

/* ===========================================================
   DESKTOP TOKENS
=========================================================== */

const DESKTOP_TOKENS: AccountsModuleTokens = {
  fontFamily: ACCOUNTS_FONT_FAMILY,

  typography: {
    pageTitle: 28,

    pageSubtitle: 14,

    sectionTitle: 19,

    sectionSubtitle: 13,

    summaryLabel: 13,

    summaryValue: 29,

    summaryHint: 12,

    filterLabel: 13,

    filterControl: 14,

    registerTitle: 19,

    registerSubtitle: 13,

    tableHeader: 12,

    tableBody: 14,

    tableSecondary: 12,

    tableMoney: 15,

    mobileCardTitle: 15,

    mobileCardSecondary: 12,

    mobileMoney: 20,

    button: 14,

    pagination: 13,

    emptyTitle: 18,

    emptySubtitle: 13,
  },

  spacing: {
    pageX: 28,

    pageTop: 24,

    pageBottom: 34,

    sectionGap: 24,

    contentGap: 20,

    panelGap: 18,

    cardGap: 16,

    fieldGap: 14,

    rowGap: 14,

    compactGap: 8,
  },

  control: {
    inputHeight: 48,

    buttonHeight: 48,

    compactButtonHeight: 44,

    inputRadius: 11,

    buttonRadius: 11,

    inputPaddingX: 15,

    buttonPaddingX: 18,

    iconSize: 20,

    compactIconSize: 18,
  },

  panel: {
    radius: 16,

    compactRadius: 13,

    borderWidth: 1,

    padding: 20,

    compactPadding: 15,
  },

  header: {
    minHeight: 86,

    iconContainerSize: 50,

    iconSize: 25,

    actionGap: 10,
  },

  summary: {
    cardMinHeight: 124,

    cardPadding: 19,

    cardRadius: 16,

    iconSize: 22,

    iconContainerSize: 44,
  },

  filters: {
    panelPadding: 20,

    panelRadius: 16,

    controlHeight: 48,

    actionHeight: 48,
  },

  register: {
    sectionMinHeight: 320,

    sectionPadding: 18,

    sectionRadius: 16,

    minWidth: 1160,

    headerHeight: 50,

    rowMinHeight: 60,

    cellPaddingX: 13,

    cellPaddingY: 11,

    borderWidth: 1,

    radius: 13,

    serialColumnWidth: 60,

    dateColumnWidth: 154,

    customerColumnWidth: 210,

    activityColumnWidth: 206,

    moneyColumnWidth: 136,

    methodColumnWidth: 132,

    referenceColumnWidth: 176,
  },

  mobileCard: {
    minHeight: 170,

    padding: 18,

    radius: 16,

    gap: 12,

    sectionGap: 14,

    moneyGap: 12,

    metadataGap: 12,

    iconSize: 20,
  },

  documentActions: {
    buttonHeight: 46,

    buttonMinWidth: 132,

    iconSize: 18,

    gap: 10,
  },

  pagination: {
    minHeight: 56,

    gap: 12,

    controlGap: 10,

    controlHeight: 44,
  },

  emptyState: {
    minHeight: 280,

    padding: 30,

    gap: 12,

    iconSize: 44,
  },
};

/* ===========================================================
   TOKEN MAP
=========================================================== */

const ACCOUNTS_TOKEN_MAP: Readonly<
  Record<AccountsResponsiveDevice, AccountsModuleTokens>
> = {
  mobile: MOBILE_TOKENS,

  tablet: TABLET_TOKENS,

  laptop: LAPTOP_TOKENS,

  desktop: DESKTOP_TOKENS,
};

/* ===========================================================
   TOKEN RESOLVER
=========================================================== */

export function getAccountsModuleTokens(
  device: AccountsResponsiveDevice,
): AccountsModuleTokens {
  return ACCOUNTS_TOKEN_MAP[device] ?? MOBILE_TOKENS;
}

/* ===========================================================
   END
=========================================================== */
