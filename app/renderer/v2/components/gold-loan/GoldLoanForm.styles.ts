/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN FORM STYLES

   MODULE  : Gold Loan
   LAYER   : Presentation Styles
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Style complete Gold Loan Step-1 page
   - Style 30% Customer / 70% Locker workspace
   - Preserve equal top-panel height
   - Style existing-style Customer selector shell
   - Style selected customer profile
   - Style Gold Valuation section
   - Style Loan Amount section
   - Style Valuer / Appraiser section
   - Style Custody locator section
   - Style Gold loan information section
   - Style Step navigation footer
   - Preserve FINORA five-theme compatibility
   - Preserve four-device responsive geometry
   - Preserve Inter typography

   IMPORTANT:

   - No React component logic.
   - No business calculations.
   - No persistence.
   - No breakpoint logic.
   - No hardcoded theme palette.
   - No JSX inline style objects.
   - Colors come only from FINORA semantic CSS variables.
   - Layout comes only from Gold Loan Responsive Engine.

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type {
  GoldLoanFormLayout,
  GoldLoanModuleTokens,
  GoldLoanStorageAllocationLayout,
  GoldLoanTopWorkspaceLayout,
  GoldLoanValuationLayout,
} from "../../utils/responsive/goldloan/goldLoan.index";

/* ===========================================================
   STYLE INPUT
=========================================================== */

export interface GoldLoanFormStylesInput {
  moduleTokens: GoldLoanModuleTokens;

  topWorkspace: GoldLoanTopWorkspaceLayout;

  formLayout: GoldLoanFormLayout;

  valuationLayout: GoldLoanValuationLayout;

  storageLayout: GoldLoanStorageAllocationLayout;

  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

/* ===========================================================
   FIELD STATE
=========================================================== */

export interface GoldLoanFieldStateStyleInput {
  focused: boolean;

  invalid: boolean;

  readOnly: boolean;
}

/* ===========================================================
   CUSTOMER OPTION STATE
=========================================================== */

export interface GoldLoanCustomerOptionStateStyleInput {
  selected: boolean;
}

/* ===========================================================
   ACTION BUTTON STATE
=========================================================== */

export interface GoldLoanPrimaryActionStateStyleInput {
  disabled: boolean;
}

/* ===========================================================
   LOCATOR STATE
=========================================================== */

export interface GoldLoanLocatorStateStyleInput {
  ready: boolean;
}

/* ===========================================================
   STYLE RESULT
=========================================================== */

export interface GoldLoanFormStyles {
  page: CSSProperties;

  pageInner: CSSProperties;

  pageHeader: CSSProperties;

  pageHeadingGroup: CSSProperties;

  pageIcon: CSSProperties;

  pageHeadingText: CSSProperties;

  pageTitleRow: CSSProperties;

  pageTitle: CSSProperties;

  stepBadge: CSSProperties;

  pageSubtitle: CSSProperties;

  pageStatus: CSSProperties;

  pageStatusDot: CSSProperties;

  pageStatusText: CSSProperties;

  topWorkspace: CSSProperties;

  customerPanel: CSSProperties;

  lockerPanel: CSSProperties;

  customerPanelHeader: CSSProperties;

  customerHeadingGroup: CSSProperties;

  customerHeadingIcon: CSSProperties;

  customerHeadingText: CSSProperties;

  customerTitle: CSSProperties;

  customerSubtitle: CSSProperties;

  customerSelector: CSSProperties;

  customerSelectorButton: CSSProperties;

  customerSelectorContent: CSSProperties;

  customerSelectorIcon: CSSProperties;

  customerSelectorTextGroup: CSSProperties;

  customerSelectorPrimary: CSSProperties;

  customerSelectorSecondary: CSSProperties;

  customerSelectorChevron: CSSProperties;

  customerDropdown: CSSProperties;

  customerOption: CSSProperties;

  customerOptionIdentity: CSSProperties;

  customerOptionPhoto: CSSProperties;

  customerOptionPhotoFallback: CSSProperties;

  customerOptionTextGroup: CSSProperties;

  customerOptionName: CSSProperties;

  customerOptionMeta: CSSProperties;

  customerOptionCheck: CSSProperties;

  selectedCustomer: CSSProperties;

  selectedCustomerPhoto: CSSProperties;

  selectedCustomerPhotoFallback: CSSProperties;

  selectedCustomerBody: CSSProperties;

  selectedCustomerName: CSSProperties;

  selectedCustomerMeta: CSSProperties;

  selectedCustomerId: CSSProperties;

  customerEmpty: CSSProperties;

  customerEmptyIcon: CSSProperties;

  customerEmptyTitle: CSSProperties;

  customerEmptySubtitle: CSSProperties;

  formBody: CSSProperties;

  section: CSSProperties;

  sectionHeader: CSSProperties;

  sectionHeadingGroup: CSSProperties;

  sectionIcon: CSSProperties;

  sectionHeadingText: CSSProperties;

  sectionTitle: CSSProperties;

  sectionSubtitle: CSSProperties;

  eligibilitySectionSubtitle: CSSProperties;

  custodySectionSubtitle: CSSProperties;

  custodySectionBadge: CSSProperties;

  custodyFieldsGrid: CSSProperties;

  custodyFieldLabel: CSSProperties;

  custodyRemarksField: CSSProperties;

  sectionBadge: CSSProperties;

  fieldsGrid: CSSProperties;

  eligibilityFieldsGrid: CSSProperties;

  field: CSSProperties;

  fieldWide: CSSProperties;

  fieldFull: CSSProperties;

  fieldLabelRow: CSSProperties;

  fieldLabel: CSSProperties;

  eligibilityFieldLabel: CSSProperties;

  fieldRequired: CSSProperties;

  fieldHelper: CSSProperties;

  eligibilityFieldHelper: CSSProperties;

  controlShell: CSSProperties;

  controlIcon: CSSProperties;

  controlInput: CSSProperties;

  controlSuffix: CSSProperties;

  readOnlyControl: CSSProperties;

  textarea: CSSProperties;

  metricGrid: CSSProperties;

  metricCard: CSSProperties;

  metricHeader: CSSProperties;

  metricIcon: CSSProperties;

  metricLabel: CSSProperties;

  metricValue: CSSProperties;

  metricSubtext: CSSProperties;

  amountSummary: CSSProperties;

  amountSummaryGrid: CSSProperties;

  amountMetric: CSSProperties;

  amountMetricLabel: CSSProperties;

  amountMetricValue: CSSProperties;

  amountMetricSubtext: CSSProperties;

  locator: CSSProperties;

  locatorHeader: CSSProperties;

  locatorHeadingGroup: CSSProperties;

  locatorIcon: CSSProperties;

  locatorTitle: CSSProperties;

  locatorSubtitle: CSSProperties;

  locatorCode: CSSProperties;

  locatorGrid: CSSProperties;

  locatorCell: CSSProperties;

  locatorCellLabel: CSSProperties;

  locatorCellValue: CSSProperties;

  locatorHint: CSSProperties;

  documentsHint: CSSProperties;

  documentsHintIcon: CSSProperties;

  documentsHintBody: CSSProperties;

  documentsHintTitle: CSSProperties;

  documentsHintText: CSSProperties;

  actions: CSSProperties;

  actionsLeft: CSSProperties;

  actionsRight: CSSProperties;

  secondaryButton: CSSProperties;

  primaryButton: CSSProperties;

  primaryButtonContent: CSSProperties;

  validationBanner: CSSProperties;

  validationIcon: CSSProperties;

  validationBody: CSSProperties;

  validationTitle: CSSProperties;

  validationList: CSSProperties;
}

/* ===========================================================
   BASE STYLES
=========================================================== */

export function getGoldLoanFormStyles(
  input: GoldLoanFormStylesInput,
): GoldLoanFormStyles {
  const {
    moduleTokens,
    topWorkspace,
    formLayout,
    valuationLayout,
    storageLayout,
    isMobile,
    isTablet,
  } = input;

  const compact = isMobile || isTablet;

  return {
    /* =======================================================
       PAGE
    ======================================================= */

    page: {
      width: "100%",

      minWidth: 0,

      minHeight: "100%",

      margin: 0,

      padding: 0,

      background: "var(--finora-theme-background-page)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",
    },

    pageInner: {
      width: "100%",

      minWidth: 0,

      maxWidth: "none",

      display: "flex",

      flexDirection: "column",

      gap: formLayout.sectionGap,

      padding: `6px ${moduleTokens.spacing.pageX}px ${moduleTokens.spacing.pageY}px`,

      margin: 0,

      boxSizing: "border-box",
    },

    /* =======================================================
       PAGE HEADER
    ======================================================= */

    pageHeader: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.cardGap,

      boxSizing: "border-box",
    },

    pageHeadingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.cardGap,
    },

    pageIcon: {
      width: isMobile ? 40 : 44,

      height: isMobile ? 40 : 44,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.radius,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    pageHeadingText: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 3,
    },

    pageTitleRow: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      flexWrap: "wrap",

      gap: moduleTokens.spacing.compactGap,
    },

    pageTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.pageTitle,

      fontWeight: 820,

      lineHeight: 1.15,

      letterSpacing: "-0.025em",
    },

    stepBadge: {
      minHeight: 26,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 9px",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 780,

      textTransform: "uppercase",

      letterSpacing: "0.035em",

      whiteSpace: "nowrap",

      boxSizing: "border-box",
    },

    pageSubtitle: {
      margin: 0,

      maxWidth: 760,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.pageSubtitle,

      fontWeight: 500,

      lineHeight: 1.5,
    },

    pageStatus: {
      flexShrink: 0,

      minHeight: 34,

      display: "inline-flex",

      alignItems: "center",

      gap: 7,

      padding: "0 11px",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    pageStatusDot: {
      width: 8,

      height: 8,

      flexShrink: 0,

      borderRadius: 999,

      background: "var(--finora-theme-success)",

      boxShadow: "0 0 0 3px var(--finora-theme-success-soft)",
    },

    pageStatusText: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText + 4,

      fontWeight: 720,

      whiteSpace: "nowrap",
    },

    /* =======================================================
       TOP WORKSPACE

       LAPTOP / DESKTOP:
       30% CUSTOMER
       70% LOCKER

       TABLET / MOBILE:
       STACKED
    ======================================================= */

    topWorkspace: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: topWorkspace.isStacked
        ? "minmax(0, 1fr)"
        : "minmax(0, 3fr) minmax(0, 7fr)",

      gap: topWorkspace.isStacked ? topWorkspace.gap : 6,

      alignItems: "stretch",

      boxSizing: "border-box",
    },

    /* =======================================================
       CUSTOMER PANEL
    ======================================================= */

    customerPanel: {
      width: "100%",

      minWidth: 0,

      minHeight: topWorkspace.customerPanelHeight,

      height: "auto",

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      padding: moduleTokens.spacing.panelPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.radius,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      overflow: "visible",

      boxSizing: "border-box",
    },

    lockerPanel: {
      width: "100%",

      minWidth: 0,

      minHeight: topWorkspace.lockerPanelHeight,

      height: "auto",

      display: "flex",

      flexDirection: "column",

      overflow: "visible",

      boxSizing: "border-box",
    },

    customerPanelHeader: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    customerHeadingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    customerHeadingIcon: {
      width: 32,

      height: 32,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    customerHeadingText: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    customerTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 780,

      lineHeight: 1.25,
    },

    customerSubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.35,
    },

    /* =======================================================
       CUSTOMER SELECTOR
    ======================================================= */

    customerSelector: {
      width: "100%",

      minWidth: 0,

      position: "relative",
    },

    customerSelectorButton: {
      width: "100%",

      minWidth: 0,

      height: moduleTokens.control.inputHeight,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.control.controlGap,

      padding: `0 ${moduleTokens.control.inputPaddingX}px`,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    },

    customerSelectorContent: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    customerSelectorIcon: {
      width: 28,

      height: 28,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    customerSelectorTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      alignItems: "flex-start",

      gap: 1,
    },

    customerSelectorPrimary: {
      maxWidth: "100%",

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 680,

      lineHeight: 1.2,
    },

    customerSelectorSecondary: {
      maxWidth: "100%",

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.2,
    },

    customerSelectorChevron: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-text-muted)",
    },

    /* =======================================================
       CUSTOMER DROPDOWN
    ======================================================= */

    customerDropdown: {
      width: "100%",

      maxHeight: moduleTokens.customer.maxDropdownHeight,

      overflowY: "auto",

      position: "absolute",

      top: `calc(100% + ${moduleTokens.spacing.compactGap}px)`,

      left: 0,

      zIndex: 120,

      display: "flex",

      flexDirection: "column",

      gap: 4,

      padding: 6,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    customerOption: {
      width: "100%",

      minWidth: 0,

      minHeight: moduleTokens.customer.optionHeight,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,

      padding: "7px 9px",

      border: "1px solid transparent",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "transparent",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      cursor: "pointer",

      outline: "none",

      textAlign: "left",

      boxSizing: "border-box",
    },

    customerOptionIdentity: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.customer.customerGap,
    },

    customerOptionPhoto: {
      width: moduleTokens.customer.photoSize,

      height: moduleTokens.customer.photoSize,

      flexShrink: 0,

      display: "block",

      objectFit: "cover",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    customerOptionPhotoFallback: {
      width: moduleTokens.customer.photoSize,

      height: moduleTokens.customer.photoSize,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    customerOptionTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    customerOptionName: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "inherit",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 720,

      lineHeight: 1.2,
    },

    customerOptionMeta: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.25,
    },

    customerOptionCheck: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-success)",
    },

    /* =======================================================
       SELECTED CUSTOMER
    ======================================================= */

    selectedCustomer: {
      width: "100%",

      minWidth: 0,

      flex: 1,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.cardGap,

      padding: moduleTokens.spacing.cardPadding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    selectedCustomerPhoto: {
      width: moduleTokens.customer.selectedPhotoSize,

      height: moduleTokens.customer.selectedPhotoSize,

      flexShrink: 0,

      display: "block",

      objectFit: "cover",

      border: "2px solid var(--finora-theme-brand-primary)",

      borderRadius: 999,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "0 0 0 3px var(--finora-theme-brand-soft)",

      boxSizing: "border-box",
    },

    selectedCustomerPhotoFallback: {
      width: moduleTokens.customer.selectedPhotoSize,

      height: moduleTokens.customer.selectedPhotoSize,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "2px solid var(--finora-theme-brand-primary)",

      borderRadius: 999,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      boxShadow: "0 0 0 3px var(--finora-theme-brand-soft)",

      boxSizing: "border-box",
    },

    selectedCustomerBody: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 3,
    },

    selectedCustomerName: {
      margin: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 800,

      lineHeight: 1.2,
    },

    selectedCustomerMeta: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 600,

      lineHeight: 1.3,
    },

    selectedCustomerId: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 560,

      lineHeight: 1.3,
    },

    /* =======================================================
       CUSTOMER EMPTY
    ======================================================= */

    customerEmpty: {
      width: "100%",

      minWidth: 0,

      flex: 1,

      minHeight: 80,

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center",

      gap: 5,

      padding: moduleTokens.spacing.compactPadding,

      border: "1px dashed var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      textAlign: "center",

      boxSizing: "border-box",
    },

    customerEmptyIcon: {
      width: 30,

      height: 30,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-muted)",
    },

    customerEmptyTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 720,

      lineHeight: 1.25,
    },

    customerEmptySubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.35,
    },

    /* =======================================================
       FORM BODY
    ======================================================= */

    formBody: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: formLayout.sectionGap,

      marginTop: 6 - formLayout.sectionGap,

      boxSizing: "border-box",
    },

    /* =======================================================
       FORM SECTION
    ======================================================= */

    section: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      padding: formLayout.sectionPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: formLayout.sectionRadius,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    sectionHeader: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.compactGap,
    },

    sectionHeadingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    sectionIcon: {
      width: 34,

      height: 34,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    sectionHeadingText: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    sectionTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionTitle,

      fontWeight: 790,

      lineHeight: 1.2,

      letterSpacing: "-0.015em",
    },

    sectionSubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionSubtitle,

      fontWeight: 500,

      lineHeight: 1.45,
    },
    eligibilitySectionSubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionSubtitle + 1,

      fontWeight: 500,

      lineHeight: 1.45,
    },
    custodySectionSubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionSubtitle + 1,

      fontWeight: 500,

      lineHeight: 1.45,
    },

    sectionBadge: {
      minHeight: 28,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 9px",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 720,

      whiteSpace: "nowrap",

      boxSizing: "border-box",
    },
    custodySectionBadge: {
      minHeight: 28,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 9px",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText + 1,

      fontWeight: 720,

      whiteSpace: "nowrap",

      boxSizing: "border-box",
    },

    /* =======================================================
       FIELDS
    ======================================================= */

    fieldsGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${valuationLayout.columns}, minmax(0, 1fr))`,

      gap: valuationLayout.gap,

      alignItems: "start",

      boxSizing: "border-box",
    },
    eligibilityFieldsGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${
        valuationLayout.columns >= 3 ? 4 : valuationLayout.columns
      }, minmax(0, 1fr))`,

      gap: valuationLayout.gap,

      alignItems: "start",

      boxSizing: "border-box",
    },
    custodyFieldsGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${
        valuationLayout.columns >= 3 ? 4 : valuationLayout.columns
      }, minmax(0, 1fr))`,

      gap: valuationLayout.gap,

      alignItems: "start",

      boxSizing: "border-box",
    },

    field: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 5,
    },

    fieldWide: {
      minWidth: 0,

      gridColumn: compact ? "auto" : "span 2",

      display: "flex",

      flexDirection: "column",

      gap: 5,
    },

    fieldFull: {
      minWidth: 0,

      gridColumn: "1 / -1",

      display: "flex",

      flexDirection: "column",

      gap: 5,
    },
    custodyRemarksField: {
      minWidth: 0,

      gridColumn:
        valuationLayout.columns >= 3
          ? "span 2"
          : "auto",

      display: "flex",

      flexDirection: "column",

      gap: 5,
    },

    fieldLabelRow: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "flex-start",

      gap: 4,
    },

    fieldLabel: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel,

      fontWeight: 700,

      lineHeight: 1.3,
    },
    eligibilityFieldLabel: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel + 1,

      fontWeight: 700,

      lineHeight: 1.3,
    },
    custodyFieldLabel: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel + 1,

      fontWeight: 700,

      lineHeight: 1.3,
    },

    fieldRequired: {
      color: "var(--finora-theme-danger)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel + 2,

      fontWeight: 800,
    },

    fieldHelper: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.35,
    },
    eligibilityFieldHelper: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText + 1,

      fontWeight: 520,

      lineHeight: 1.35,
    },

    /* =======================================================
       CONTROL
    ======================================================= */

    controlShell: {
      width: "100%",

      minWidth: 0,

      height: moduleTokens.control.inputHeight,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.control.controlGap,

      padding: `0 ${moduleTokens.control.inputPaddingX}px`,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      boxSizing: "border-box",

      transition:
        "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    },

    controlIcon: {
      width: moduleTokens.control.inputIconSize,

      height: moduleTokens.control.inputIconSize,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-text-muted)",
    },

    controlInput: {
      width: "100%",

      minWidth: 0,

      height: "100%",

      margin: 0,

      padding: 0,

      border: "none",

      outline: "none",

      background: "transparent",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 600,

      lineHeight: 1.2,

      appearance: "none",

      WebkitAppearance: "none",

      boxSizing: "border-box",
    },

    controlSuffix: {
      flexShrink: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 700,

      whiteSpace: "nowrap",
    },

    readOnlyControl: {
      width: "100%",

      minWidth: 0,

      minHeight: moduleTokens.control.inputHeight,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.control.controlGap,

      padding: `0 ${moduleTokens.control.inputPaddingX}px`,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.control.inputRadius,

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 680,

      boxSizing: "border-box",
    },

    textarea: {
      width: "100%",

      minHeight: 88,

      resize: "vertical",

      margin: 0,

      padding: 11,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      outline: "none",

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 540,

      lineHeight: 1.5,

      appearance: "none",

      WebkitAppearance: "none",

      boxSizing: "border-box",
    },

    /* =======================================================
       VALUATION METRICS
    ======================================================= */

    metricGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${valuationLayout.summaryColumns}, minmax(0, 1fr))`,

      gap: moduleTokens.spacing.compactGap,

      boxSizing: "border-box",
    },

    metricCard: {
      minWidth: 0,

      minHeight: moduleTokens.metric.minHeight,

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      gap: 3,

      padding: moduleTokens.metric.padding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.metric.radius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    metricHeader: {
      display: "flex",

      alignItems: "center",

      gap: 6,
    },

    metricIcon: {
      width: moduleTokens.metric.iconSize,

      height: moduleTokens.metric.iconSize,

      flexShrink: 0,

      color: "var(--finora-theme-brand-primary)",
    },

    metricLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricLabel,

      fontWeight: 700,

      lineHeight: 1.2,

      textTransform: "uppercase",

      letterSpacing: "0.03em",
    },

    metricValue: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricValue,

      fontWeight: 820,

      lineHeight: 1.15,
    },

    metricSubtext: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.3,
    },

    /* =======================================================
       AMOUNT SUMMARY
    ======================================================= */

    amountSummary: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      padding: moduleTokens.spacing.cardPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-brand-soft)",

      boxSizing: "border-box",
    },

    amountSummaryGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",

      gap: moduleTokens.spacing.compactGap,

      boxSizing: "border-box",
    },

    amountMetric: {
      minWidth: 0,

      minHeight: moduleTokens.metric.minHeight,

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      gap: 3,

      padding: moduleTokens.metric.padding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.metric.radius,

      background: "var(--finora-theme-background-surface)",

      boxSizing: "border-box",
    },

    amountMetricLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricLabel,

      fontWeight: 720,

      textTransform: "uppercase",

      letterSpacing: "0.03em",

      lineHeight: 1.2,
    },

    amountMetricValue: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-brand-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricValue,

      fontWeight: 840,

      lineHeight: 1.15,
    },

    amountMetricSubtext: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.3,
    },

    /* =======================================================
       STORAGE LOCATOR
    ======================================================= */

    locator: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      padding: moduleTokens.spacing.cardPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    locatorHeader: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.compactGap,
    },

    locatorHeadingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    locatorIcon: {
      width: 32,

      height: 32,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    locatorTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle + 2,

      fontWeight: 780,

      lineHeight: 1.2,
    },

    locatorSubtitle: {
      margin: "4px 0 0",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText + 2,

      fontWeight: 520,

      lineHeight: 1.35,
    },

    locatorCode: {
      minHeight: 30,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 10px",

      border: "1px solid var(--finora-theme-brand-primary)",

      borderRadius: 999,

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-brand-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 800,

      letterSpacing: "0.035em",

      whiteSpace: "nowrap",

      boxSizing: "border-box",
    },

    locatorGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${
        storageLayout.locatorColumns >= 3
          ? 4
          : storageLayout.locatorColumns
      }, minmax(0, 1fr))`,

      gap: storageLayout.gap,

      boxSizing: "border-box",
    },

    locatorCell: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 3,

      padding: moduleTokens.spacing.compactPadding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      boxSizing: "border-box",
    },

    locatorCellLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricLabel,

      fontWeight: 700,

      textTransform: "uppercase",

      letterSpacing: "0.03em",

      lineHeight: 1.2,
    },

    locatorCellValue: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 780,

      lineHeight: 1.25,
    },

    locatorHint: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText + 1,

      fontWeight: 520,

      lineHeight: 1.45,
    },

    /* =======================================================
       DOCUMENTS HINT
    ======================================================= */

    documentsHint: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "flex-start",

      gap: moduleTokens.spacing.compactGap,

      padding: moduleTokens.spacing.cardPadding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    documentsHintIcon: {
      width: 30,

      height: 30,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    documentsHintBody: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    documentsHintTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue + 1,

      fontWeight: 740,

      lineHeight: 1.25,
    },

    documentsHintText: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 520,

      lineHeight: 1.45,
    },

    /* =======================================================
       ACTION FOOTER
    ======================================================= */

    actions: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: isMobile ? "stretch" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.cardGap,

      padding: moduleTokens.spacing.panelPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.radius,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    actionsLeft: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    actionsRight: {
      width: isMobile ? "100%" : "auto",

      display: "flex",

      alignItems: "center",

      justifyContent: "flex-end",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.compactGap,
    },

    secondaryButton: {
      width: isMobile ? "100%" : "auto",

      minWidth: 118,

      height: moduleTokens.control.buttonHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,

      padding: "0 14px",

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 750,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",
    },

    primaryButton: {
      width: isMobile ? "100%" : "auto",

      minWidth: 160,

      height: moduleTokens.control.buttonHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,

      padding: "0 16px",

      border: "1px solid var(--finora-theme-brand-primary)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-brand-primary)",

      color: "var(--finora-theme-text-inverse)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 780,

      cursor: "pointer",

      outline: "none",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, border-color 160ms ease, opacity 160ms ease, box-shadow 160ms ease",
    },

    primaryButtonContent: {
      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,
    },

    /* =======================================================
       VALIDATION
    ======================================================= */

    validationBanner: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "flex-start",

      gap: moduleTokens.spacing.compactGap,

      padding: moduleTokens.spacing.cardPadding,

      border: "1px solid var(--finora-theme-danger)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-danger-soft)",

      boxSizing: "border-box",
    },

    validationIcon: {
      width: 30,

      height: 30,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-danger)",
    },

    validationBody: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 4,
    },

    validationTitle: {
      margin: 0,

      color: "var(--finora-theme-danger)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 780,

      lineHeight: 1.25,
    },

    validationList: {
      margin: 0,

      paddingLeft: 18,

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 540,

      lineHeight: 1.55,
    },
  };
}

/* ===========================================================
   FIELD STATE
=========================================================== */

export function getGoldLoanFieldStateStyle(
  input: GoldLoanFieldStateStyleInput,
): CSSProperties {
  if (input.invalid) {
    return {
      borderColor: "var(--finora-theme-danger)",

      background: "var(--finora-theme-background-surface)",

      boxShadow: "0 0 0 2px var(--finora-theme-danger-soft)",
    };
  }

  if (input.focused) {
    return {
      borderColor: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-background-surface)",

      boxShadow: "0 0 0 2px var(--finora-theme-brand-soft)",
    };
  }

  if (input.readOnly) {
    return {
      borderColor: "var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      boxShadow: "none",
    };
  }

  return {
    borderColor: "var(--finora-theme-border-default)",

    background: "var(--finora-theme-background-surface)",

    boxShadow: "none",
  };
}

/* ===========================================================
   CUSTOMER OPTION STATE
=========================================================== */

export function getGoldLoanCustomerOptionStateStyle(
  input: GoldLoanCustomerOptionStateStyleInput,
): CSSProperties {
  if (input.selected) {
    return {
      borderColor: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-text-primary)",
    };
  }

  return {
    borderColor: "transparent",

    background: "transparent",

    color: "var(--finora-theme-text-primary)",
  };
}

/* ===========================================================
   PRIMARY ACTION STATE
=========================================================== */

export function getGoldLoanPrimaryActionStateStyle(
  input: GoldLoanPrimaryActionStateStyleInput,
): CSSProperties {
  if (input.disabled) {
    return {
      borderColor: "var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-muted)",

      cursor: "not-allowed",

      opacity: 0.65,

      boxShadow: "none",
    };
  }

  return {
    borderColor: "var(--finora-theme-brand-primary)",

    background: "var(--finora-theme-brand-primary)",

    color: "var(--finora-theme-text-inverse)",

    cursor: "pointer",

    opacity: 1,
  };
}

/* ===========================================================
   LOCATOR STATE
=========================================================== */

export function getGoldLoanLocatorStateStyle(
  input: GoldLoanLocatorStateStyleInput,
): CSSProperties {
  if (input.ready) {
    return {
      borderColor: "var(--finora-theme-success)",

      background: "var(--finora-theme-brand-soft)",
    };
  }

  return {
    borderColor: "var(--finora-theme-border-default)",

    background: "var(--finora-theme-background-muted)",
  };
}

/* ===========================================================
   MONEY VALUE
=========================================================== */

export function getGoldLoanMoneyValueStyle(): CSSProperties {
  return {
    color: "var(--finora-theme-brand-primary)",
  };
}

/* ===========================================================
   POSITIVE VALUE
=========================================================== */

export function getGoldLoanPositiveValueStyle(): CSSProperties {
  return {
    color: "var(--finora-theme-success)",
  };
}

/* ===========================================================
   WARNING VALUE
=========================================================== */

export function getGoldLoanWarningValueStyle(): CSSProperties {
  return {
    color: "var(--finora-theme-warning)",
  };
}

/* ===========================================================
   END
=========================================================== */
