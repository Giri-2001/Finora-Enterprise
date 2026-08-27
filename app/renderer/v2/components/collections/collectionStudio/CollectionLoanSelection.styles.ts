// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// CUSTOMER LOAN SELECTION — PREMIUM STYLES
//
// RESPONSIBILITY
//
// - Customer Loans card presentation
// - Header typography
// - Lucide icon presentation
// - Selected loan presentation
// - Loan card presentation
// - Status badge presentation
// - Dropdown presentation
// - FINORA Theme Engine integration
//
// IMPORTANT
//
// - No business logic
// - No persistence logic
// - No local theme definitions
// - No hard-coded theme palette
// - Theme colours come from active FinoraTheme
// - Geometry remains presentation-only
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import type { FinoraTheme } from "../../../themes/core/types";

// ============================================================
// TYPES
// ============================================================

export interface CollectionLoanSelectionStyles extends Record<
  string,
  CSSProperties | number
> {
  iconSize: number;

  loansCard: CSSProperties;

  loansHeader: CSSProperties;

  headingGroup: CSSProperties;

  sectionHeading: CSSProperties;

  sectionIcon: CSSProperties;

  sectionTitle: CSSProperties;

  sectionSubtitle: CSSProperties;

  loanDropdownWrapper: CSSProperties;

  loanDropdown: CSSProperties;

  loanDropdownArrow: CSSProperties;

  loanCardsGrid: CSSProperties;

  loanCard: CSSProperties;

  loanCardSelected: CSSProperties;

  loanCardTopRow: CSSProperties;

  loanCardNumber: CSSProperties;

  loanCardAmount: CSSProperties;

  loanCardType: CSSProperties;

  loanStatus: CSSProperties;

  loanStatusSelected: CSSProperties;

  emptyState: CSSProperties;

  emptyStateTitle: CSSProperties;

  emptyStateMessage: CSSProperties;
}

// ============================================================
// THEME VISUAL CONTRACT
// ============================================================
//
// Theme is owned centrally by FINORA Theme Engine.
//
// ThemeProvider
//      ↓
// active FinoraTheme
//      ↓
// theme.colors
//      ↓
// this presentation layer
//
// ============================================================

function getThemeVisuals(theme: FinoraTheme) {
  return {
    page: theme.colors.background.page,

    surface: theme.colors.background.surface,

    surfaceMuted: theme.colors.background.surfaceMuted,

    surfaceStrong: theme.colors.background.surfaceStrong,

    brand: theme.colors.brand.primary,

    brandSecondary: theme.colors.brand.secondary,

    accent: theme.colors.brand.accent,

    accentSoft: theme.colors.brand.accentSoft,

    textPrimary: theme.colors.text.primary,

    textSecondary: theme.colors.text.secondary,

    textMuted: theme.colors.text.muted,

    textInverse: theme.colors.text.inverse,

    border: theme.colors.border.default,

    borderStrong: theme.colors.border.strong,

    borderSubtle: theme.colors.border.subtle,

    focus: theme.colors.border.focus,

    success: theme.colors.status.success,

    successSoft: theme.colors.status.successSoft,

    warning: theme.colors.status.warning,

    warningSoft: theme.colors.status.warningSoft,

    shadow: theme.colors.overlay.shadow,
  };
}

// ============================================================
// TYPOGRAPHY
// ============================================================

const FONTS = {
  ui: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  serif: "Georgia, 'Times New Roman', serif",
} as const;

// ============================================================
// STYLE FACTORY
// ============================================================

export function createCollectionLoanSelectionStyles(
  theme: FinoraTheme,
): CollectionLoanSelectionStyles {
  const colors = getThemeVisuals(theme);

  // ==========================================================
  // ROOT CARD
  // ==========================================================

  const loansCard: CSSProperties = {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    padding: "12px 14px 13px",

    background: colors.surface,

    border: `1px solid ${colors.border}`,

    borderRadius: "15px",

    boxShadow: `0 7px 22px ${colors.shadow}`,

    color: colors.textPrimary,

    overflow: "visible",
  };

  // ==========================================================
  // HEADER
  // ==========================================================

  const loansHeader: CSSProperties = {
    width: "100%",

    minWidth: 0,

    display: "flex",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: "16px",

    paddingBottom: "10px",

    borderBottom: `1px solid ${colors.borderSubtle}`,

    boxSizing: "border-box",
  };

  // ==========================================================
  // HEADING GROUP
  // ==========================================================

  const headingGroup: CSSProperties = {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    flexDirection: "column",

    gap: "2px",
  };

  // ==========================================================
  // SECTION HEADING
  // ==========================================================

  const sectionHeading: CSSProperties = {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: "8px",

    boxSizing: "border-box",
  };

  // ==========================================================
  // LUCIDE ICON
  // ==========================================================

  const sectionIcon: CSSProperties = {
    flexShrink: 0,

    color: colors.brand,

    display: "block",
  };

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  const sectionTitle: CSSProperties = {
    margin: 0,

    padding: 0,

    color: colors.textPrimary,

    fontFamily: FONTS.serif,

    fontSize: "19px",

    fontWeight: 700,

    lineHeight: 1.3,

    letterSpacing: "-0.01em",
  };

  // ==========================================================
  // SECTION SUBTITLE
  // ==========================================================

  const sectionSubtitle: CSSProperties = {
    margin: 0,

    padding: 0,

    color: colors.textSecondary,

    fontFamily: FONTS.ui,

    fontSize: "14px",

    fontWeight: 500,

    lineHeight: 1.3,
  };

  // ==========================================================
  // DROPDOWN WRAPPER
  // ==========================================================

  const loanDropdownWrapper: CSSProperties = {
    position: "relative",

    flex: "0 0 235px",

    width: "235px",

    minWidth: "190px",

    boxSizing: "border-box",
  };

  // ==========================================================
  // DROPDOWN
  // ==========================================================

  const loanDropdown: CSSProperties = {
    width: "100%",

    height: "41px",

    minHeight: "41px",

    appearance: "none",

    WebkitAppearance: "none",

    boxSizing: "border-box",

    padding: "0 36px 0 13px",

    border: `1px solid ${colors.border}`,

    borderRadius: "9px",

    outline: "none",

    background: colors.surfaceMuted,

    color: colors.textPrimary,

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 750,

    lineHeight: 1,

    cursor: "pointer",

    transition:
      "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
  };

  // ==========================================================
  // DROPDOWN ARROW
  // ==========================================================

  const loanDropdownArrow: CSSProperties = {
    position: "absolute",

    right: "13px",

    top: "50%",

    transform: "translateY(-50%)",

    pointerEvents: "none",

    color: colors.brand,

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 800,

    lineHeight: 1,
  };

  // ==========================================================
  // LOAN CARDS GRID
  // ==========================================================
  //
  // Four cards per row.
  //
  // If more loans exist:
  //
  // Card 1 | Card 2 | Card 3 | Card 4
  // Card 5 | Card 6 | Card 7 | Card 8
  //
  // ==========================================================

  const loanCardsGrid: CSSProperties = {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "9px",

    alignItems: "stretch",

    paddingTop: "9px",

    boxSizing: "border-box",
  };

  // ==========================================================
  // LOAN CARD
  // ==========================================================
  //
  // IMPORTANT
  //
  // The JSX already has the correct two-row structure:
  //
  // ROW 1
  // ┌─────────────────────────────────┐
  // │ LOAN NUMBER              ACTIVE │
  // └─────────────────────────────────┘
  //
  // ROW 2
  // ┌─────────────────────────────────┐
  // │ ₹ 20,000                MONTHLY │
  // └─────────────────────────────────┘
  //
  // Therefore DO NOT use CSS Grid inside the card.
  //
  // Flex column keeps the existing JSX structure intact.
  //
  // ==========================================================

  const loanCard: CSSProperties = {
    width: "100%",

    minWidth: 0,

    minHeight: "82px",

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    alignItems: "stretch",

    justifyContent: "space-between",

    gap: "5px",

    padding: "10px 12px",

    border: `1px solid ${colors.border}`,

    borderRadius: "11px",

    background: colors.surfaceMuted,

    color: colors.textPrimary,

    textAlign: "left",

    fontFamily: FONTS.ui,

    cursor: "pointer",

    outline: "none",

    boxShadow: "none",

    transition:
      "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease",

    overflow: "hidden",
  };

  // ==========================================================
  // SELECTED LOAN CARD
  // ==========================================================

  const loanCardSelected: CSSProperties = {
    border: `1.5px solid ${colors.brand}`,

    background: colors.accentSoft,

    boxShadow: `0 5px 15px ${colors.shadow}`,

    transform: "translateY(-1px)",
  };

  // ==========================================================
  // LOAN NUMBER + STATUS ROW
  // ==========================================================
  //
  // TOP ROW
  //
  // Loan number = LEFT
  // Active badge = RIGHT
  //
  // ==========================================================

  const loanCardTopRow: CSSProperties = {
    minWidth: 0,

    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "10px",

    boxSizing: "border-box",

    flex: "0 0 auto",
  };

  // ==========================================================
  // LOAN NUMBER
  // ==========================================================
  //
  // TOP LEFT
  // ==========================================================

  const loanCardNumber: CSSProperties = {
    minWidth: 0,

    flex: "1 1 auto",

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: colors.textPrimary,

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 700,

    lineHeight: 1.2,

    letterSpacing: "0.01em",
  };

  // ==========================================================
  // LOAN AMOUNT
  // ==========================================================
  //
  // BOTTOM LEFT
  //
  // Same left alignment as loan number.
  //
  // ==========================================================

  const loanCardAmount: CSSProperties = {
    minWidth: 0,

    color: colors.textPrimary,

    fontFamily: FONTS.ui,

    fontSize: "17px",

    fontWeight: 700,

    lineHeight: 1.15,

    letterSpacing: "-0.01em",

    whiteSpace: "nowrap",
  };

  // ==========================================================
  // REPAYMENT TYPE
  // ==========================================================
  //
  // BOTTOM RIGHT
  //
  // Example:
  //
  // MONTHLY
  //
  // ==========================================================

  const loanCardType: CSSProperties = {
    alignSelf: "flex-end",

    minWidth: 0,

    maxWidth: "100%",

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: colors.textMuted,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    fontWeight: 650,

    lineHeight: 1.2,

    letterSpacing: "0.04em",

    textTransform: "uppercase",

    textAlign: "right",
  };

  // ==========================================================
  // STATUS BADGE
  // ==========================================================
  //
  // TOP RIGHT
  //
  // IMPORTANT:
  //
  // justify-content on loanCardTopRow places this badge
  // on the right side.
  //
  // ==========================================================

  const loanStatus: CSSProperties = {
    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    minHeight: "20px",

    padding: "0px 5px",

    boxSizing: "border-box",

    border: `1px solid ${colors.success}`,

    borderRadius: "999px",

    background: colors.successSoft,

    color: colors.success,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 800,

    lineHeight: 1,

    letterSpacing: "0.05em",

    textTransform: "uppercase",

    whiteSpace: "nowrap",
  };

  // ==========================================================
  // SELECTED STATUS
  // ==========================================================

  const loanStatusSelected: CSSProperties = {
    borderColor: colors.brand,

    background: colors.accentSoft,

    color: colors.brand,
  };

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  const emptyState: CSSProperties = {
    width: "100%",

    minHeight: "82px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    padding: "12px",

    boxSizing: "border-box",

    background: colors.surfaceMuted,

    border: `1px dashed ${colors.border}`,

    borderRadius: "10px",

    marginTop: "10px",

    textAlign: "center",
  };

  // ==========================================================
  // EMPTY TITLE
  // ==========================================================

  const emptyStateTitle: CSSProperties = {
    color: colors.textPrimary,

    fontFamily: FONTS.ui,

    fontSize: "13px",

    fontWeight: 750,

    lineHeight: 1.2,
  };

  // ==========================================================
  // EMPTY MESSAGE
  // ==========================================================

  const emptyStateMessage: CSSProperties = {
    maxWidth: "520px",

    color: colors.textMuted,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    fontWeight: 500,

    lineHeight: 1.35,
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    iconSize: 20,

    loansCard,

    loansHeader,

    headingGroup,

    sectionHeading,

    sectionIcon,

    sectionTitle,

    sectionSubtitle,

    loanDropdownWrapper,

    loanDropdown,

    loanDropdownArrow,

    loanCardsGrid,

    loanCard,

    loanCardSelected,

    loanCardTopRow,

    loanCardNumber,

    loanCardAmount,

    loanCardType,

    loanStatus,

    loanStatusSelected,

    emptyState,

    emptyStateTitle,

    emptyStateMessage,
  };
}

// ============================================================
// END
// ============================================================
