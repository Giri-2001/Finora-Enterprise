/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE TOKENS

   MODULE  : Gold Loan
   LAYER   : Responsive Visual Tokens
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Centralize Gold Loan typography
   - Centralize Inter font family
   - Centralize spacing and panel density
   - Centralize input / button geometry
   - Centralize locker / rack card geometry
   - Centralize Gold Items geometry
   - Resolve values for four FINORA device tiers

   IMPORTANT:

   - No colors.
   - No theme values.
   - No React.
   - No window access.
   - No calculations from business data.
   - No component state.
   - No CSS media queries.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { GoldLoanResponsiveDevice } from "./goldLoan.types";

/* ===========================================================
   FONT FAMILY

   Mandatory across Gold Loan Engine.
=========================================================== */

export const GOLD_LOAN_FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, sans-serif";

/* ===========================================================
   TYPOGRAPHY TOKENS
=========================================================== */

export interface GoldLoanTypographyTokens {
  pageTitle: number;

  pageSubtitle: number;

  sectionTitle: number;

  sectionSubtitle: number;

  cardTitle: number;

  cardSubtitle: number;

  fieldLabel: number;

  fieldValue: number;

  inputText: number;

  buttonText: number;

  metricLabel: number;

  metricValue: number;

  helperText: number;

  badgeText: number;

  tableHeader: number;

  tableValue: number;
}

/* ===========================================================
   SPACING TOKENS
=========================================================== */

export interface GoldLoanSpacingTokens {
  pageX: number;

  pageY: number;

  sectionGap: number;

  panelGap: number;

  cardGap: number;

  fieldGap: number;

  rowGap: number;

  compactGap: number;

  panelPadding: number;

  cardPadding: number;

  compactPadding: number;
}

/* ===========================================================
   CONTROL TOKENS
=========================================================== */

export interface GoldLoanControlTokens {
  inputHeight: number;

  compactInputHeight: number;

  buttonHeight: number;

  compactButtonHeight: number;

  iconButtonSize: number;

  inputRadius: number;

  buttonRadius: number;

  controlGap: number;

  inputPaddingX: number;

  inputIconSize: number;

  buttonIconSize: number;
}

/* ===========================================================
   PANEL TOKENS
=========================================================== */

export interface GoldLoanPanelTokens {
  radius: number;

  compactRadius: number;

  borderWidth: number;

  headerMinHeight: number;

  topWorkspaceMinHeight: number;
}

/* ===========================================================
   CUSTOMER SELECTOR TOKENS

   Exact Loans / Collections selector geometry will be
   matched in the layout/UI layer using existing production
   geometry.

   These values only provide Gold Loan-safe defaults.
=========================================================== */

export interface GoldLoanCustomerSelectorTokens {
  photoSize: number;

  selectedPhotoSize: number;

  optionHeight: number;

  maxDropdownHeight: number;

  customerGap: number;
}

/* ===========================================================
   LOCKER TOKENS
=========================================================== */

export interface GoldLoanLockerTokens {
  cardMinHeight: number;

  cardPadding: number;

  cardRadius: number;

  statusHeight: number;

  progressHeight: number;

  viewButtonHeight: number;

  iconSize: number;
}

/* ===========================================================
   RACK TOKENS
=========================================================== */

export interface GoldLoanRackTokens {
  cardMinWidth: number;

  cardMinHeight: number;

  cardPadding: number;

  cardRadius: number;

  progressHeight: number;

  actionHeight: number;

  iconSize: number;
}

/* ===========================================================
   GOLD ITEM TOKENS
=========================================================== */

export interface GoldLoanItemTokens {
  cardMinHeight: number;

  cardPadding: number;

  cardRadius: number;

  summaryMinHeight: number;

  removeButtonSize: number;

  itemIconSize: number;
}

/* ===========================================================
   METRIC TOKENS
=========================================================== */

export interface GoldLoanMetricTokens {
  minHeight: number;

  padding: number;

  radius: number;

  iconSize: number;
}

/* ===========================================================
   COMPLETE MODULE TOKENS
=========================================================== */

export interface GoldLoanModuleTokens {
  fontFamily: string;

  typography: GoldLoanTypographyTokens;

  spacing: GoldLoanSpacingTokens;

  control: GoldLoanControlTokens;

  panel: GoldLoanPanelTokens;

  customer: GoldLoanCustomerSelectorTokens;

  locker: GoldLoanLockerTokens;

  rack: GoldLoanRackTokens;

  item: GoldLoanItemTokens;

  metric: GoldLoanMetricTokens;
}

/* ===========================================================
   MOBILE TOKENS
=========================================================== */

const MOBILE_TOKENS: GoldLoanModuleTokens = {
  fontFamily: GOLD_LOAN_FONT_FAMILY,

  typography: {
    pageTitle: 22,

    pageSubtitle: 12,

    sectionTitle: 16,

    sectionSubtitle: 11,

    cardTitle: 14,

    cardSubtitle: 11,

    fieldLabel: 11,

    fieldValue: 13,

    inputText: 13,

    buttonText: 12,

    metricLabel: 10,

    metricValue: 17,

    helperText: 10,

    badgeText: 10,

    tableHeader: 10,

    tableValue: 11,
  },

  spacing: {
    pageX: 12,

    pageY: 14,

    sectionGap: 14,

    panelGap: 12,

    cardGap: 10,

    fieldGap: 10,

    rowGap: 10,

    compactGap: 6,

    panelPadding: 12,

    cardPadding: 12,

    compactPadding: 8,
  },

  control: {
    inputHeight: 44,

    compactInputHeight: 40,

    buttonHeight: 44,

    compactButtonHeight: 38,

    iconButtonSize: 38,

    inputRadius: 10,

    buttonRadius: 10,

    controlGap: 8,

    inputPaddingX: 12,

    inputIconSize: 16,

    buttonIconSize: 16,
  },

  panel: {
    radius: 14,

    compactRadius: 10,

    borderWidth: 1,

    headerMinHeight: 44,

    topWorkspaceMinHeight: 220,
  },

  customer: {
    photoSize: 36,

    selectedPhotoSize: 50,

    optionHeight: 52,

    maxDropdownHeight: 260,

    customerGap: 8,
  },

  locker: {
    cardMinHeight: 132,

    cardPadding: 12,

    cardRadius: 12,

    statusHeight: 24,

    progressHeight: 6,

    viewButtonHeight: 36,

    iconSize: 18,
  },

  rack: {
    cardMinWidth: 0,

    cardMinHeight: 118,

    cardPadding: 12,

    cardRadius: 12,

    progressHeight: 6,

    actionHeight: 34,

    iconSize: 17,
  },

  item: {
    cardMinHeight: 0,

    cardPadding: 12,

    cardRadius: 12,

    summaryMinHeight: 72,

    removeButtonSize: 34,

    itemIconSize: 18,
  },

  metric: {
    minHeight: 76,

    padding: 12,

    radius: 12,

    iconSize: 18,
  },
};

/* ===========================================================
   TABLET TOKENS
=========================================================== */

const TABLET_TOKENS: GoldLoanModuleTokens = {
  fontFamily: GOLD_LOAN_FONT_FAMILY,

  typography: {
    pageTitle: 24,

    pageSubtitle: 12,

    sectionTitle: 17,

    sectionSubtitle: 11,

    cardTitle: 14,

    cardSubtitle: 11,

    fieldLabel: 11,

    fieldValue: 13,

    inputText: 13,

    buttonText: 12,

    metricLabel: 10,

    metricValue: 18,

    helperText: 10,

    badgeText: 10,

    tableHeader: 10,

    tableValue: 11,
  },

  spacing: {
    pageX: 16,

    pageY: 16,

    sectionGap: 16,

    panelGap: 14,

    cardGap: 12,

    fieldGap: 12,

    rowGap: 12,

    compactGap: 7,

    panelPadding: 14,

    cardPadding: 14,

    compactPadding: 9,
  },

  control: {
    inputHeight: 44,

    compactInputHeight: 40,

    buttonHeight: 44,

    compactButtonHeight: 38,

    iconButtonSize: 38,

    inputRadius: 10,

    buttonRadius: 10,

    controlGap: 8,

    inputPaddingX: 12,

    inputIconSize: 16,

    buttonIconSize: 16,
  },

  panel: {
    radius: 14,

    compactRadius: 10,

    borderWidth: 1,

    headerMinHeight: 46,

    topWorkspaceMinHeight: 230,
  },

  customer: {
    photoSize: 38,

    selectedPhotoSize: 54,

    optionHeight: 54,

    maxDropdownHeight: 280,

    customerGap: 8,
  },

  locker: {
    cardMinHeight: 138,

    cardPadding: 13,

    cardRadius: 12,

    statusHeight: 24,

    progressHeight: 6,

    viewButtonHeight: 36,

    iconSize: 18,
  },

  rack: {
    cardMinWidth: 150,

    cardMinHeight: 122,

    cardPadding: 12,

    cardRadius: 12,

    progressHeight: 6,

    actionHeight: 34,

    iconSize: 17,
  },

  item: {
    cardMinHeight: 0,

    cardPadding: 14,

    cardRadius: 12,

    summaryMinHeight: 76,

    removeButtonSize: 34,

    itemIconSize: 18,
  },

  metric: {
    minHeight: 78,

    padding: 13,

    radius: 12,

    iconSize: 18,
  },
};

/* ===========================================================
   LAPTOP TOKENS
=========================================================== */

const LAPTOP_TOKENS: GoldLoanModuleTokens = {
  fontFamily: GOLD_LOAN_FONT_FAMILY,

  typography: {
    pageTitle: 25,

    pageSubtitle: 12,

    sectionTitle: 17,

    sectionSubtitle: 11,

    cardTitle: 14,

    cardSubtitle: 11,

    fieldLabel: 11,

    fieldValue: 13,

    inputText: 13,

    buttonText: 12,

    metricLabel: 10,

    metricValue: 18,

    helperText: 10,

    badgeText: 10,

    tableHeader: 10,

    tableValue: 11,
  },

  spacing: {
    pageX: 18,

    pageY: 18,

    sectionGap: 16,

    panelGap: 14,

    cardGap: 12,

    fieldGap: 12,

    rowGap: 12,

    compactGap: 7,

    panelPadding: 15,

    cardPadding: 14,

    compactPadding: 9,
  },

  control: {
    inputHeight: 42,

    compactInputHeight: 38,

    buttonHeight: 42,

    compactButtonHeight: 36,

    iconButtonSize: 36,

    inputRadius: 9,

    buttonRadius: 9,

    controlGap: 8,

    inputPaddingX: 12,

    inputIconSize: 15,

    buttonIconSize: 15,
  },

  panel: {
    radius: 14,

    compactRadius: 10,

    borderWidth: 1,

    headerMinHeight: 44,

    topWorkspaceMinHeight: 220,
  },

  customer: {
    photoSize: 36,

    selectedPhotoSize: 52,

    optionHeight: 50,

    maxDropdownHeight: 270,

    customerGap: 8,
  },

  locker: {
    cardMinHeight: 132,

    cardPadding: 12,

    cardRadius: 11,

    statusHeight: 22,

    progressHeight: 6,

    viewButtonHeight: 34,

    iconSize: 17,
  },

  rack: {
    cardMinWidth: 118,

    cardMinHeight: 116,

    cardPadding: 11,

    cardRadius: 11,

    progressHeight: 6,

    actionHeight: 32,

    iconSize: 16,
  },

  item: {
    cardMinHeight: 0,

    cardPadding: 14,

    cardRadius: 12,

    summaryMinHeight: 74,

    removeButtonSize: 32,

    itemIconSize: 17,
  },

  metric: {
    minHeight: 74,

    padding: 12,

    radius: 11,

    iconSize: 17,
  },
};

/* ===========================================================
   DESKTOP TOKENS
=========================================================== */

const DESKTOP_TOKENS: GoldLoanModuleTokens = {
  fontFamily: GOLD_LOAN_FONT_FAMILY,

  typography: {
    pageTitle: 27,

    pageSubtitle: 13,

    sectionTitle: 18,

    sectionSubtitle: 12,

    cardTitle: 15,

    cardSubtitle: 11,

    fieldLabel: 11,

    fieldValue: 13,

    inputText: 13,

    buttonText: 12,

    metricLabel: 10,

    metricValue: 19,

    helperText: 10,

    badgeText: 10,

    tableHeader: 10,

    tableValue: 11,
  },

  spacing: {
    pageX: 20,

    pageY: 20,

    sectionGap: 18,

    panelGap: 16,

    cardGap: 14,

    fieldGap: 12,

    rowGap: 12,

    compactGap: 8,

    panelPadding: 16,

    cardPadding: 14,

    compactPadding: 10,
  },

  control: {
    inputHeight: 42,

    compactInputHeight: 38,

    buttonHeight: 42,

    compactButtonHeight: 36,

    iconButtonSize: 36,

    inputRadius: 9,

    buttonRadius: 9,

    controlGap: 8,

    inputPaddingX: 12,

    inputIconSize: 15,

    buttonIconSize: 15,
  },

  panel: {
    radius: 14,

    compactRadius: 10,

    borderWidth: 1,

    headerMinHeight: 46,

    topWorkspaceMinHeight: 224,
  },

  customer: {
    photoSize: 38,

    selectedPhotoSize: 54,

    optionHeight: 52,

    maxDropdownHeight: 290,

    customerGap: 8,
  },

  locker: {
    cardMinHeight: 134,

    cardPadding: 13,

    cardRadius: 11,

    statusHeight: 22,

    progressHeight: 6,

    viewButtonHeight: 34,

    iconSize: 17,
  },

  rack: {
    cardMinWidth: 126,

    cardMinHeight: 118,

    cardPadding: 12,

    cardRadius: 11,

    progressHeight: 6,

    actionHeight: 32,

    iconSize: 16,
  },

  item: {
    cardMinHeight: 0,

    cardPadding: 14,

    cardRadius: 12,

    summaryMinHeight: 76,

    removeButtonSize: 32,

    itemIconSize: 17,
  },

  metric: {
    minHeight: 76,

    padding: 13,

    radius: 11,

    iconSize: 17,
  },
};

/* ===========================================================
   TOKEN MAP
=========================================================== */

const GOLD_LOAN_TOKEN_MAP: Record<
  GoldLoanResponsiveDevice,
  GoldLoanModuleTokens
> = {
  mobile: MOBILE_TOKENS,

  tablet: TABLET_TOKENS,

  laptop: LAPTOP_TOKENS,

  desktop: DESKTOP_TOKENS,
};

/* ===========================================================
   RESOLVE GOLD LOAN TOKENS
=========================================================== */

export function getGoldLoanModuleTokens(
  device: GoldLoanResponsiveDevice,
): GoldLoanModuleTokens {
  return GOLD_LOAN_TOKEN_MAP[device] ?? MOBILE_TOKENS;
}

/* ===========================================================
   END
=========================================================== */
