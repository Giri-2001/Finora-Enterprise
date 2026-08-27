// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// CUSTOMER + LOAN SELECTION STYLES
//
// RESPONSIBILITY
//
// - Customer selection card geometry
// - Customer information layout
// - Customer photo area
// - Customer loan selection area
// - Loan cards
// - Selected loan state
// - FINORA theme CSS variable consumption
// - No inline responsive system
// - No local theme system
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME VARIABLE HELPER
// ============================================================

const cssVar = (name: string, fallback: string): string =>
  `var(${name}, ${fallback})`;

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const COLORS = {
  pageBackground: cssVar("--page-bg", "#eef1f5"),

  surface: cssVar("--surface", "#ffffff"),

  surfaceSoft: cssVar("--surface-soft", "#f5f7fa"),

  border: cssVar("--border", "#d5dce5"),

  text: cssVar("--text", "#111827"),

  muted: cssVar("--text-muted", "#6b7280"),

  accent: cssVar("--finora-accent", "#c69214"),

  accentStrong: cssVar("--accent", "#c69214"),

  navy: cssVar("--finora-navy", "#10233f"),

  success: cssVar("--success", "#23865a"),
};

// ============================================================
// SHADOW TOKENS
// ============================================================

const SHADOWS = {
  card: "0 4px 18px rgba(15, 23, 42, 0.07)",

  selected: "0 3px 12px rgba(198, 146, 20, 0.16)",
};

// ============================================================
// EXPORT
// ============================================================

export const collectionLoanSelectionStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // MAIN SELECTION ROW
  // ==========================================================

  selectionRow: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "minmax(360px, 0.95fr) minmax(620px, 2.05fr)",

    gap: "12px",

    alignItems: "stretch",

    boxSizing: "border-box",
  },

  // ==========================================================
  // CUSTOMER CARD
  // ==========================================================

  customerCard: {
    minWidth: 0,

    minHeight: "142px",

    display: "grid",

    gridTemplateColumns: "minmax(0, 1fr) 104px",

    gap: "18px",

    alignItems: "stretch",

    padding: "12px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: SHADOWS.card,
  },

  // ==========================================================
  // CUSTOMER SELECTION AREA
  // ==========================================================

  customerSelectionArea: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    boxSizing: "border-box",
  },

  // ==========================================================
  // FIELD LABEL
  // ==========================================================

  fieldLabel: {
    display: "block",

    marginBottom: "8px",

    color: COLORS.text,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    fontSize: "13px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  // ==========================================================
  // SELECT WRAPPER
  // ==========================================================

  selectWrapper: {
    position: "relative",

    width: "100%",

    minWidth: 0,
  },

  // ==========================================================
  // CUSTOMER SELECT
  // ==========================================================

  select: {
    width: "100%",

    height: "44px",

    appearance: "none",

    WebkitAppearance: "none",

    boxSizing: "border-box",

    padding: "0 36px 0 14px",

    color: COLORS.text,

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    outline: "none",

    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },

  // ==========================================================
  // SELECT ARROW
  // ==========================================================

  selectArrow: {
    position: "absolute",

    right: "13px",

    top: "50%",

    transform: "translateY(-50%)",

    pointerEvents: "none",

    color: COLORS.accentStrong,

    fontSize: "14px",

    fontWeight: 800,

    lineHeight: 1,
  },

  // ==========================================================
  // CUSTOMER DETAILS
  // ==========================================================

  customerDetails: {
    display: "flex",

    flexDirection: "column",

    gap: "8px",

    marginTop: "12px",

    minWidth: 0,
  },

  // ==========================================================
  // CUSTOMER DETAIL LINE
  // ==========================================================

  customerDetailLine: {
    display: "grid",

    gridTemplateColumns: "72px minmax(0, 1fr)",

    gap: "4px",

    alignItems: "center",

    minWidth: 0,
  },

  // ==========================================================
  // DETAIL LABEL
  // ==========================================================

  detailLabel: {
    color: COLORS.muted,

    fontFamily: "Georgia, 'Times New Roman', serif",

    fontSize: "12px",

    fontWeight: 700,

    letterSpacing: "0.04em",

    lineHeight: 1.2,
  },

  // ==========================================================
  // DETAIL VALUE
  // ==========================================================

  detailValue: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.text,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    fontSize: "12px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  // ==========================================================
  // CUSTOMER PHOTO FRAME
  // ==========================================================

  customerPhotoFrame: {
    width: "104px",

    minWidth: "104px",

    height: "100%",

    minHeight: "116px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    overflow: "hidden",
  },

  // ==========================================================
  // CUSTOMER PHOTO
  // ==========================================================

  customerPhoto: {
    width: "100%",

    height: "100%",

    objectFit: "cover",

    display: "block",
  },

  // ==========================================================
  // PHOTO PLACEHOLDER
  // ==========================================================

  photoPlaceholder: {
    width: "100%",

    height: "100%",

    minHeight: "116px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    boxSizing: "border-box",
  },

  // ==========================================================
  // PHOTO PLACEHOLDER MARK
  // ==========================================================

  photoPlaceholderMark: {
    color: COLORS.accentStrong,

    fontFamily: "Georgia, 'Times New Roman', serif",

    fontSize: "30px",

    fontWeight: 800,

    lineHeight: 1,
  },

  // ==========================================================
  // PHOTO PLACEHOLDER TEXT
  // ==========================================================

  photoPlaceholderText: {
    color: COLORS.muted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.18em",

    lineHeight: 1,
  },

  // ==========================================================
  // LOANS CARD
  //
  // REFERENCE LOCK
  //
  // Customer card and Loans card use the same minimum
  // height so both selection panels align horizontally.
  // ==========================================================

  loansCard: {
    minWidth: 0,

    minHeight: "142px",

    boxSizing: "border-box",

    padding: "12px 14px",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: SHADOWS.card,
  },

  // ==========================================================
  // LOANS HEADER
  //
  // REFERENCE LOCK
  //
  // Heading/subtitle on the left.
  // Loan dropdown on the top-right.
  // Both occupy the SAME horizontal row.
  // ==========================================================

  loansHeader: {
    width: "100%",

    display: "flex",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: "14px",

    marginBottom: "10px",

    minWidth: 0,

    boxSizing: "border-box",
  },

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  sectionTitle: {
    margin: 0,

    color: COLORS.text,

    fontFamily: "Georgia, 'Times New Roman', serif",

    fontSize: "17px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  // ==========================================================
  // SECTION SUBTITLE
  // ==========================================================

  sectionSubtitle: {
    margin: "4px 0 0",

    color: COLORS.muted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    lineHeight: 1.3,
  },

  // ==========================================================
  // LOAN DROPDOWN WRAPPER
  //
  // REFERENCE LOCK
  //
  // Fixed compact width.
  // Remains at the right side of the header.
  // ==========================================================

  loanDropdownWrapper: {
    position: "relative",

    width: "170px",

    minWidth: "170px",

    height: "38px",

    flexShrink: 0,

    boxSizing: "border-box",
  },

  // ==========================================================
  // LOAN DROPDOWN
  //
  // REFERENCE LOCK
  //
  // Custom FINORA dropdown.
  // No native browser arrow.
  // Compact 38px height.
  // ==========================================================

  loanDropdown: {
    width: "100%",

    height: "38px",

    appearance: "none",

    WebkitAppearance: "none",

    boxSizing: "border-box",

    padding: "0 32px 0 11px",

    color: COLORS.text,

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "8px",

    outline: "none",

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    fontWeight: 700,

    lineHeight: 1,

    cursor: "pointer",
  },

  // ==========================================================
  // LOAN DROPDOWN ARROW
  // ==========================================================

  loanDropdownArrow: {
    position: "absolute",

    right: "11px",

    top: "50%",

    transform: "translateY(-50%)",

    pointerEvents: "none",

    color: COLORS.accentStrong,

    fontSize: "12px",

    fontWeight: 800,

    lineHeight: 1,
  },

  // ==========================================================
  // LOAN CARDS GRID
  // ==========================================================

  loanCardsGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "8px",

    minWidth: 0,

    boxSizing: "border-box",
  },

  // ==========================================================
  // LOAN CARD
  // ==========================================================

  loanCard: {
    minWidth: 0,

    minHeight: "74px",

    display: "flex",

    flexDirection: "column",

    alignItems: "flex-start",

    justifyContent: "center",

    gap: "3px",

    padding: "9px 11px",

    boxSizing: "border-box",

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "10px",

    color: COLORS.text,

    textAlign: "left",

    cursor: "pointer",

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    transition:
      "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
  },

  // ==========================================================
  // LOAN CARD SELECTED
  // ==========================================================

  loanCardSelected: {
    border: `1.5px solid ${COLORS.accentStrong}`,

    boxShadow: SHADOWS.selected,

    transform: "translateY(-1px)",
  },

  // ==========================================================
  // LOAN CARD NUMBER
  // ==========================================================

  loanCardNumber: {
    minWidth: 0,

    maxWidth: "100%",

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.text,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    lineHeight: 1.2,
  },

  // ==========================================================
  // LOAN CARD AMOUNT
  // ==========================================================

  loanCardAmount: {
    minWidth: 0,

    maxWidth: "100%",

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.text,

    fontSize: "13px",

    fontWeight: 800,

    lineHeight: 1.2,
  },

  // ==========================================================
  // LOAN CARD TYPE
  // ==========================================================

  loanCardType: {
    minWidth: 0,

    maxWidth: "100%",

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.muted,

    fontSize: "9px",

    fontWeight: 600,

    lineHeight: 1.2,
  },

  // ==========================================================
  // LOAN STATUS
  // ==========================================================

  loanStatus: {
    marginTop: "2px",

    color: COLORS.success,

    fontSize: "8px",

    fontWeight: 800,

    textTransform: "uppercase",

    letterSpacing: "0.06em",

    lineHeight: 1.2,
  },

  // ==========================================================
  // SELECTED LOAN STATUS
  // ==========================================================

  loanStatusSelected: {
    color: COLORS.accentStrong,
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    width: "100%",

    minHeight: "142px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "8px",

    padding: "24px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: SHADOWS.card,

    textAlign: "center",
  },

  // ==========================================================
  // EMPTY STATE TITLE
  // ==========================================================

  emptyStateTitle: {
    color: COLORS.text,

    fontFamily: "Georgia, 'Times New Roman', serif",

    fontSize: "17px",

    fontWeight: 700,
  },

  // ==========================================================
  // EMPTY STATE MESSAGE
  // ==========================================================

  emptyStateMessage: {
    color: COLORS.muted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    lineHeight: 1.5,
  },
};

// ============================================================
// END
// ============================================================
