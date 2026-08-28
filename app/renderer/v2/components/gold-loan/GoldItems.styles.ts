/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD ITEMS STYLES

   MODULE  : Gold Loan
   LAYER   : Presentation Styles
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Style pledged Gold Items section
   - Style dynamic item cards
   - Style premium field controls
   - Style custom dropdown controls
   - Style weight / purity / valuation fields
   - Style Add Item / Remove Item actions
   - Style derived-value fields
   - Style Gold Items summary metrics
   - Preserve FINORA five-theme compatibility
   - Preserve four-device responsive geometry

   IMPORTANT:

   - No business calculations.
   - No component state.
   - No persistence.
   - No breakpoint logic.
   - No hardcoded theme palette.
   - No browser-default visual controls.
   - Inter is mandatory.

   GOLD ITEM MODEL:

   Gross Weight
      ↓
   Stone Weight
      ↓
   Other Deduction
      ↓
   Net Weight
      ↓
   Purity
      ↓
   Fine Gold Weight
      ↓
   Assessed Value

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type {
  GoldLoanItemsLayout,
  GoldLoanModuleTokens,
} from "../../utils/responsive/goldloan/goldLoan.index";

/* ===========================================================
   STYLE INPUT
=========================================================== */

export interface GoldItemsStylesInput {
  moduleTokens: GoldLoanModuleTokens;

  itemsLayout: GoldLoanItemsLayout;

  formFieldColumns: number;

  isMobile: boolean;

  isTablet: boolean;
}

/* ===========================================================
   FIELD STATE
=========================================================== */

export interface GoldItemFieldStateStyleInput {
  focused: boolean;

  invalid: boolean;

  readOnly: boolean;
}

/* ===========================================================
   DROPDOWN OPTION STATE
=========================================================== */

export interface GoldItemDropdownOptionStateInput {
  selected: boolean;

  disabled: boolean;
}

/* ===========================================================
   REMOVE BUTTON STATE
=========================================================== */

export interface GoldItemRemoveButtonStateInput {
  disabled: boolean;
}

/* ===========================================================
   STYLE RESULT
=========================================================== */

export interface GoldItemsStyles {
  root: CSSProperties;

  header: CSSProperties;

  headingGroup: CSSProperties;

  headingIcon: CSSProperties;

  headingTextGroup: CSSProperties;

  title: CSSProperties;

  subtitle: CSSProperties;

  headerActions: CSSProperties;

  itemCountBadge: CSSProperties;

  addItemButton: CSSProperties;

  itemsGrid: CSSProperties;

  itemCard: CSSProperties;

  itemHeader: CSSProperties;

  itemIdentity: CSSProperties;

  itemIcon: CSSProperties;

  itemTitleGroup: CSSProperties;

  itemTitle: CSSProperties;

  itemSubtitle: CSSProperties;

  itemHeaderActions: CSSProperties;

  itemNumberBadge: CSSProperties;

  removeButton: CSSProperties;

  fieldsGrid: CSSProperties;

  field: CSSProperties;

  fieldWide: CSSProperties;

  fieldLabelRow: CSSProperties;

  fieldLabel: CSSProperties;

  fieldRequired: CSSProperties;

  fieldHelper: CSSProperties;

  controlShell: CSSProperties;

  controlIcon: CSSProperties;

  input: CSSProperties;

  inputWithIcon: CSSProperties;

  inputSuffix: CSSProperties;

  readOnlyInput: CSSProperties;

  selectControl: CSSProperties;

  selectButton: CSSProperties;

  selectButtonContent: CSSProperties;

  selectValueGroup: CSSProperties;

  selectPrimary: CSSProperties;

  selectSecondary: CSSProperties;

  selectChevron: CSSProperties;

  dropdown: CSSProperties;

  dropdownOption: CSSProperties;

  dropdownOptionIdentity: CSSProperties;

  dropdownOptionTextGroup: CSSProperties;

  dropdownOptionPrimary: CSSProperties;

  dropdownOptionSecondary: CSSProperties;

  dropdownOptionCheck: CSSProperties;

  derivedSection: CSSProperties;

  derivedHeader: CSSProperties;

  derivedHeadingGroup: CSSProperties;

  derivedIcon: CSSProperties;

  derivedTitle: CSSProperties;

  derivedSubtitle: CSSProperties;

  derivedGrid: CSSProperties;

  derivedMetric: CSSProperties;

  derivedMetricLabel: CSSProperties;

  derivedMetricValue: CSSProperties;

  derivedMetricUnit: CSSProperties;

  remarksArea: CSSProperties;

  summary: CSSProperties;

  summaryHeader: CSSProperties;

  summaryHeadingGroup: CSSProperties;

  summaryIcon: CSSProperties;

  summaryTitle: CSSProperties;

  summarySubtitle: CSSProperties;

  summaryGrid: CSSProperties;

  summaryMetric: CSSProperties;

  summaryMetricLabel: CSSProperties;

  summaryMetricValue: CSSProperties;

  summaryMetricUnit: CSSProperties;

  emptyState: CSSProperties;

  emptyIcon: CSSProperties;

  emptyTitle: CSSProperties;

  emptyDescription: CSSProperties;

  emptyAddButton: CSSProperties;
}

/* ===========================================================
   BASE STYLES
=========================================================== */

export function getGoldItemsStyles(
  input: GoldItemsStylesInput,
): GoldItemsStyles {
  const { moduleTokens, itemsLayout, formFieldColumns, isMobile, isTablet } =
    input;

  const compactDevice = isMobile || isTablet;

  return {
    /* =======================================================
       ROOT
    ======================================================= */

    root: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",
    },

    /* =======================================================
       HEADER
    ======================================================= */

    header: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.cardGap,

      boxSizing: "border-box",
    },

    headingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    headingIcon: {
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

    headingTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    title: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionTitle,

      fontWeight: 780,

      lineHeight: 1.2,

      letterSpacing: "-0.018em",
    },

    subtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionSubtitle,

      fontWeight: 500,

      lineHeight: 1.45,
    },

    headerActions: {
      width: isMobile ? "100%" : "auto",

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: isMobile ? "space-between" : "flex-end",

      gap: moduleTokens.spacing.compactGap,
    },

    itemCountBadge: {
      minHeight: 30,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 10px",

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

    addItemButton: {
      minWidth: isMobile ? 124 : 132,

      height: moduleTokens.control.buttonHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,

      padding: "0 14px",

      border: "1px solid var(--finora-theme-brand-primary)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-brand-primary)",

      color: "var(--finora-theme-text-inverse)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 760,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
    },

    /* =======================================================
       ITEMS GRID
    ======================================================= */

    itemsGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${itemsLayout.columns}, minmax(0, 1fr))`,

      gap: itemsLayout.gap,

      alignItems: "start",

      boxSizing: "border-box",
    },

    /* =======================================================
       ITEM CARD
    ======================================================= */

    itemCard: {
      width: "100%",

      minWidth: 0,

      minHeight: itemsLayout.itemCardMinHeight,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      padding: itemsLayout.itemCardPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: itemsLayout.itemCardRadius,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",
    },

    itemHeader: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    itemIdentity: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    itemIcon: {
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

    itemTitleGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 1,
    },

    itemTitle: {
      margin: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 780,

      lineHeight: 1.25,
    },

    itemSubtitle: {
      margin: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.3,
    },

    itemHeaderActions: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    itemNumberBadge: {
      minWidth: 28,

      height: 28,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 8px",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: 999,

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 760,

      boxSizing: "border-box",
    },

    removeButton: {
      width: moduleTokens.item.removeButtonSize,

      height: moduleTokens.item.removeButtonSize,

      flexShrink: 0,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: 0,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-danger)",

      fontFamily: moduleTokens.fontFamily,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, border-color 160ms ease, color 160ms ease, opacity 160ms ease",
    },

    /* =======================================================
       FIELD GRID
    ======================================================= */

    fieldsGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${formFieldColumns}, minmax(0, 1fr))`,

      gap: moduleTokens.spacing.fieldGap,

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

      gridColumn: compactDevice ? "auto" : "span 2",

      display: "flex",

      flexDirection: "column",

      gap: 5,
    },

    fieldLabelRow: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    fieldLabel: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel,

      fontWeight: 700,

      lineHeight: 1.3,
    },

    fieldRequired: {
      color: "var(--finora-theme-danger)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel,

      fontWeight: 800,
    },

    fieldHelper: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.35,
    },

    /* =======================================================
       CONTROL SHELL

       Native browser appearance is intentionally removed
       from internal input controls. Visual ownership belongs
       completely to FINORA.
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

    input: {
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

    inputWithIcon: {
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

    inputSuffix: {
      flexShrink: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 700,

      whiteSpace: "nowrap",
    },

    readOnlyInput: {
      width: "100%",

      minWidth: 0,

      height: moduleTokens.control.inputHeight,

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

    /* =======================================================
       CUSTOM SELECT
    ======================================================= */

    selectControl: {
      width: "100%",

      minWidth: 0,

      position: "relative",
    },

    selectButton: {
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

      textAlign: "left",

      boxSizing: "border-box",

      transition:
        "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    },

    selectButtonContent: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    selectValueGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 1,
    },

    selectPrimary: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 650,

      lineHeight: 1.2,
    },

    selectSecondary: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.2,
    },

    selectChevron: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-text-muted)",
    },

    dropdown: {
      width: "100%",

      maxHeight: 240,

      overflowY: "auto",

      position: "absolute",

      top: `calc(100% + ${moduleTokens.spacing.compactGap}px)`,

      left: 0,

      zIndex: 80,

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

    dropdownOption: {
      width: "100%",

      minHeight: 42,

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

    dropdownOptionIdentity: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    dropdownOptionTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 1,
    },

    dropdownOptionPrimary: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "inherit",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 660,

      lineHeight: 1.2,
    },

    dropdownOptionSecondary: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.25,
    },

    dropdownOptionCheck: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-success)",
    },

    /* =======================================================
       DERIVED VALUES
    ======================================================= */

    derivedSection: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.compactGap,

      padding: moduleTokens.spacing.compactPadding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    derivedHeader: {
      width: "100%",

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    derivedHeadingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    derivedIcon: {
      width: 28,

      height: 28,

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

    derivedTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 760,

      lineHeight: 1.25,
    },

    derivedSubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.35,
    },

    derivedGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",

      gap: moduleTokens.spacing.compactGap,
    },

    derivedMetric: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,

      padding: moduleTokens.spacing.compactPadding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      boxSizing: "border-box",
    },

    derivedMetricLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricLabel,

      fontWeight: 700,

      lineHeight: 1.25,

      textTransform: "uppercase",

      letterSpacing: "0.03em",
    },

    derivedMetricValue: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricValue,

      fontWeight: 800,

      lineHeight: 1.2,
    },

    derivedMetricUnit: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,
    },

    /* =======================================================
       REMARKS
    ======================================================= */

    remarksArea: {
      width: "100%",

      minHeight: 76,

      resize: "vertical",

      padding: 10,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      outline: "none",

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.inputText,

      fontWeight: 550,

      lineHeight: 1.45,

      appearance: "none",

      WebkitAppearance: "none",

      boxSizing: "border-box",
    },

    /* =======================================================
       GOLD ITEMS TOTAL SUMMARY
    ======================================================= */

    summary: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      padding: moduleTokens.spacing.panelPadding,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.radius,

      background: "var(--finora-theme-brand-soft)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    summaryHeader: {
      width: "100%",

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    summaryHeadingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    summaryIcon: {
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

    summaryTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 780,

      lineHeight: 1.25,
    },

    summarySubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.35,
    },

    summaryGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${itemsLayout.summaryColumns}, minmax(0, 1fr))`,

      gap: moduleTokens.spacing.compactGap,

      alignItems: "stretch",
    },

    summaryMetric: {
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

    summaryMetricLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricLabel,

      fontWeight: 700,

      lineHeight: 1.25,

      textTransform: "uppercase",

      letterSpacing: "0.03em",
    },

    summaryMetricValue: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricValue,

      fontWeight: 820,

      lineHeight: 1.15,
    },

    summaryMetricUnit: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,
    },

    /* =======================================================
       EMPTY STATE
    ======================================================= */

    emptyState: {
      width: "100%",

      minHeight: 190,

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center",

      gap: moduleTokens.spacing.compactGap,

      padding: moduleTokens.spacing.panelPadding,

      border: "1px dashed var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.radius,

      background: "var(--finora-theme-background-muted)",

      textAlign: "center",

      boxSizing: "border-box",
    },

    emptyIcon: {
      width: 42,

      height: 42,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    emptyTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 780,

      lineHeight: 1.3,
    },

    emptyDescription: {
      margin: 0,

      maxWidth: 470,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardSubtitle,

      fontWeight: 500,

      lineHeight: 1.5,
    },

    emptyAddButton: {
      minWidth: 142,

      height: moduleTokens.control.buttonHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 7,

      marginTop: 4,

      padding: "0 14px",

      border: "1px solid var(--finora-theme-brand-primary)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-brand-primary)",

      color: "var(--finora-theme-text-inverse)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 760,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",
    },
  };
}

/* ===========================================================
   FIELD STATE

   Focus / invalid / calculated-readonly visual state is kept
   out of JSX.
=========================================================== */

export function getGoldItemFieldStateStyle(
  input: GoldItemFieldStateStyleInput,
): CSSProperties {
  if (input.invalid) {
    return {
      borderColor: "var(--finora-theme-danger)",

      boxShadow: "0 0 0 2px var(--finora-theme-danger-soft)",
    };
  }

  if (input.focused) {
    return {
      borderColor: "var(--finora-theme-brand-primary)",

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
   DROPDOWN OPTION STATE
=========================================================== */

export function getGoldItemDropdownOptionStateStyle(
  input: GoldItemDropdownOptionStateInput,
): CSSProperties {
  if (input.disabled) {
    return {
      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-muted)",

      cursor: "not-allowed",

      opacity: 0.58,
    };
  }

  if (input.selected) {
    return {
      borderColor: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-text-primary)",

      cursor: "pointer",

      opacity: 1,
    };
  }

  return {
    borderColor: "transparent",

    background: "transparent",

    color: "var(--finora-theme-text-primary)",

    cursor: "pointer",

    opacity: 1,
  };
}

/* ===========================================================
   REMOVE BUTTON STATE
=========================================================== */

export function getGoldItemRemoveButtonStateStyle(
  input: GoldItemRemoveButtonStateInput,
): CSSProperties {
  if (input.disabled) {
    return {
      borderColor: "var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-muted)",

      cursor: "not-allowed",

      opacity: 0.55,
    };
  }

  return {
    borderColor: "var(--finora-theme-danger)",

    background: "var(--finora-theme-danger-soft)",

    color: "var(--finora-theme-danger)",

    cursor: "pointer",

    opacity: 1,
  };
}

/* ===========================================================
   MONEY EMPHASIS
=========================================================== */

export function getGoldItemMoneyValueStyle(): CSSProperties {
  return {
    color: "var(--finora-theme-brand-primary)",
  };
}

/* ===========================================================
   POSITIVE VALUE EMPHASIS
=========================================================== */

export function getGoldItemPositiveValueStyle(): CSSProperties {
  return {
    color: "var(--finora-theme-success)",
  };
}

/* ===========================================================
   END
=========================================================== */
