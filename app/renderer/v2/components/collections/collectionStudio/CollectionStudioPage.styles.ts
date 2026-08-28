/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   PAGE STYLES

   RESPONSIBILITY
   - Collection Studio page geometry
   - Customer selection
   - Customer loan selection
   - Selected loan summary
   - Premium three-card collection workspace
   - EMI Collection presentation boundary
   - System Generated presentation boundary
   - Manual Collection presentation boundary
   - Full-width Payment Details section
   - Full-width Loan Documents section
   - Full-width Collection History section
   - FINORA theme-token consumption

   IMPORTANT
   - No local theme engine
   - No local breakpoint system
   - No business logic
   - No persistence logic
   - No component-level responsive logic
   - No inline colour palette
   - All text and numbers use FINORA Inter contract
   - Customer + Customer Loans top geometry remains unchanged

   COLLECTION WORKSPACE CONTRACT

   DESKTOP

   ┌────────────── 40% ──────────────┬──── 20% ────┬────────────── 40% ──────────────┐
   │ EMI COLLECTION                  │ SYSTEM      │ MANUAL COLLECTION               │
   │                                 │ GENERATED   │                                 │
   └─────────────────────────────────┴─────────────┴─────────────────────────────────┘

   All three cards:
   - Same row
   - Same height
   - Stretch together

   FOLLOWING SECTIONS

   Payment Details      → 100% width
   Loan Documents       → 100% width
   Collection History   → 100% width

=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   THEME VARIABLE HELPER
=========================================================== */

const cssVar = (name: string, fallback: string): string =>
  `var(${name}, ${fallback})`;

/* ===========================================================
   FINORA THEME TOKENS
=========================================================== */

const COLORS = {
  pageBackground: cssVar(
    "--finora-theme-background-page",
    "var(--finora-theme-page, #eef1f5)",
  ),

  surface: cssVar(
    "--finora-theme-background-surface",
    "var(--finora-theme-surface, #ffffff)",
  ),

  surfaceSoft: cssVar(
    "--finora-theme-background-surface-muted",
    "var(--finora-theme-surface-muted, #f5f7fa)",
  ),

  surfaceStrong: cssVar("--finora-theme-surface-strong", "#e7eaf0"),

  border: cssVar("--finora-theme-border-default", "#d5dce5"),

  borderStrong: cssVar("--finora-theme-border-strong", "#b8c0cc"),

  text: cssVar("--finora-theme-text-primary", "#111827"),

  textInverse: cssVar("--finora-theme-text-inverse", "#ffffff"),

  muted: cssVar("--finora-theme-text-muted", "#6b7280"),

  accent: cssVar(
    "--finora-theme-brand-accent",
    "var(--finora-theme-brand-primary, #c69214)",
  ),

  accentSoft: cssVar(
    "--finora-theme-brand-accent-soft",
    "rgba(198, 146, 20, 0.10)",
  ),

  success: cssVar("--finora-theme-success", "#23865a"),

  successSoft: cssVar("--finora-theme-success-soft", "rgba(35, 134, 90, 0.10)"),

  danger: cssVar("--finora-theme-danger", "#c24141"),

  dangerSoft: cssVar("--finora-theme-danger-soft", "rgba(194, 65, 65, 0.10)"),

  info: cssVar("--finora-theme-info", "#3b82f6"),

  infoSoft: cssVar("--finora-theme-info-soft", "rgba(59, 130, 246, 0.10)"),

  shadow: cssVar("--finora-theme-overlay-shadow", "rgba(15, 23, 42, 0.08)"),
};

/* ===========================================================
   TYPOGRAPHY

   FINORA COLLECTION STUDIO LOCK:

   Every visible text / number uses:

   Inter, ui-sans-serif, system-ui, sans-serif
=========================================================== */

const FONTS = {
  ui: "Inter, ui-sans-serif, system-ui, sans-serif",

  /*
   * Kept only as a compatibility alias for existing
   * style-key references.
   *
   * It intentionally resolves to Inter.
   */

  serif: "Inter, ui-sans-serif, system-ui, sans-serif",
};

/* ===========================================================
   EXPORT
=========================================================== */

export const collectionStudioStyles: Record<string, CSSProperties> = {
  /* =========================================================
     PAGE
  ========================================================= */

  page: {
    width: "100%",

    minHeight: "100%",

    boxSizing: "border-box",

    background: COLORS.pageBackground,

    color: COLORS.text,

    overflowX: "hidden",

    fontFamily: FONTS.ui,
  },

  pageInner: {
    width: "100%",

    maxWidth: "1800px",

    margin: "0 auto",

    boxSizing: "border-box",

    padding: "5px 12px 18px",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     PAGE HEADER
  ========================================================= */

  pageHeader: {
    width: "100%",

    boxSizing: "border-box",

    padding: "6px 10px 24px",

    fontFamily: FONTS.ui,
  },

  pageTitle: {
    margin: 0,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "clamp(28px, 2.2vw, 38px)",

    fontWeight: 800,

    lineHeight: 1.15,

    letterSpacing: "-0.02em",
  },

  pageSubtitle: {
    margin: "12px 0 0",

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "15px",

    lineHeight: 1.5,
  },

  /* =========================================================
     CUSTOMER + LOAN SELECTION

     IMPORTANT:
     GEOMETRY UNCHANGED.
  ========================================================= */

  selectionRow: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "minmax(360px, 0.95fr) minmax(620px, 2.05fr)",

    gap: "5px",

    alignItems: "stretch",

    boxSizing: "border-box",
  },

  /* =========================================================
     CUSTOMER CARD

     IMPORTANT:
     GEOMETRY UNCHANGED.
  ========================================================= */

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

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  customerSelectionArea: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    fontFamily: FONTS.ui,
  },

  fieldLabel: {
    display: "block",

    marginBottom: "10px",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "16px",

    fontWeight: 700,
  },

  selectWrapper: {
    position: "relative",

    width: "100%",
  },

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

    fontFamily: FONTS.ui,

    fontSize: "13px",

    fontWeight: 700,

    cursor: "pointer",
  },

  selectArrow: {
    position: "absolute",

    right: "13px",

    top: "50%",

    transform: "translateY(-50%)",

    pointerEvents: "none",

    color: COLORS.accent,

    fontFamily: FONTS.ui,

    fontSize: "14px",

    fontWeight: 800,
  },

  customerDetails: {
    display: "flex",

    flexDirection: "column",

    gap: "8px",

    marginTop: "12px",

    fontFamily: FONTS.ui,
  },

  customerDetailLine: {
    display: "grid",

    gridTemplateColumns: "72px minmax(0, 1fr)",

    gap: "4px",

    alignItems: "center",

    minWidth: 0,
  },

  detailLabel: {
    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 700,

    letterSpacing: "0.04em",
  },

  detailValue: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 700,
  },

  /* =========================================================
     CUSTOMER PHOTO

     GEOMETRY UNCHANGED.
  ========================================================= */

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

  customerPhoto: {
    width: "100%",

    height: "100%",

    objectFit: "cover",

    display: "block",
  },

  photoPlaceholder: {
    width: "100%",

    height: "100%",

    minHeight: "116px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    fontFamily: FONTS.ui,
  },

  photoPlaceholderMark: {
    color: COLORS.accent,

    fontFamily: FONTS.ui,

    fontSize: "30px",

    fontWeight: 800,

    lineHeight: 1,
  },

  photoPlaceholderText: {
    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.18em",
  },

  /* =========================================================
     CUSTOMER LOANS CARD

     GEOMETRY UNCHANGED.
  ========================================================= */

  loansCard: {
    minWidth: 0,

    minHeight: "142px",

    boxSizing: "border-box",

    padding: "12px 14px",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  loansHeader: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "14px",

    marginBottom: "10px",
  },

  sectionTitle: {
    margin: 0,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "17px",

    fontWeight: 700,
  },

  sectionSubtitle: {
    margin: "4px 0 0",

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "11px",
  },

  loanDropdownWrapper: {
    position: "relative",

    width: "170px",

    minWidth: "170px",
  },

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

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 700,

    cursor: "pointer",
  },

  loanDropdownArrow: {
    position: "absolute",

    right: "12px",

    top: "50%",

    transform: "translateY(-50%)",

    pointerEvents: "none",

    color: COLORS.accent,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    fontWeight: 800,
  },

  /* =========================================================
     LOAN CARDS

     GEOMETRY UNCHANGED.
  ========================================================= */

  loanCardsGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "8px",

    boxSizing: "border-box",
  },

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

    fontFamily: FONTS.ui,

    transition:
      "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
  },

  loanCardSelected: {
    border: `1.5px solid ${COLORS.accent}`,

    boxShadow: `0 3px 12px ${COLORS.accentSoft}`,

    transform: "translateY(-1px)",
  },

  loanCardNumber: {
    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.04em",
  },

  loanCardAmount: {
    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "13px",

    fontWeight: 800,
  },

  loanCardType: {
    minWidth: 0,

    maxWidth: "100%",

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 600,
  },

  loanStatus: {
    marginTop: "2px",

    color: COLORS.success,

    fontFamily: FONTS.ui,

    fontSize: "8px",

    fontWeight: 800,

    textTransform: "uppercase",

    letterSpacing: "0.06em",
  },

  loanStatusSelected: {
    color: COLORS.accent,
  },

  /* =========================================================
     SELECTED LOAN
  ========================================================= */

  selectedLoanCard: {
    width: "100%",

    marginTop: "12px",

    padding: "15px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  selectedLoanHeader: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingBottom: "12px",

    borderBottom: `1px solid ${COLORS.border}`,
  },

  selectedLoanEyebrow: {
    display: "block",

    color: COLORS.accent,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",
  },

  selectedLoanTitle: {
    margin: "4px 0 0",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "21px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  selectedLoanStatus: {
    flexShrink: 0,

    padding: "6px 11px",

    borderRadius: "999px",

    background: COLORS.successSoft,

    color: COLORS.success,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.06em",

    textTransform: "uppercase",
  },

  selectedLoanGrid: {
    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "10px",

    marginTop: "12px",
  },

  selectedLoanMetric: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "5px",

    padding: "10px 12px",

    boxSizing: "border-box",

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    fontFamily: FONTS.ui,
  },

  metricLabel: {
    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "10px",

    fontWeight: 600,
  },

  metricValue: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "14px",

    fontWeight: 800,
  },

  /* =========================================================
     PREMIUM COLLECTION WORKSPACE

     40% | 20% | 40%

     ROW 1
     EMI | SYSTEM | MANUAL

     ROW 2
     PAYMENT DETAILS 100%

     IMPORTANT:
     Exact component order is established by
     CollectionStudioPage.tsx / CollectionEntry.tsx.
  ========================================================= */

  collectionWorkspace: {
    width: "100%",

    minWidth: 0,

    marginTop: "10px",

    display: "grid",

    gridTemplateColumns: "minmax(0, 2fr) minmax(210px, 1fr) minmax(0, 2fr)",

    gridAutoRows: "auto",

    gap: "10px",

    boxSizing: "border-box",

    alignItems: "stretch",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     EMI COLLECTION COLUMN
  ========================================================= */

  emiCollectionColumn: {
    gridColumn: "1",

    gridRow: "1",

    minWidth: 0,

    width: "100%",

    height: "100%",

    display: "flex",

    boxSizing: "border-box",

    alignSelf: "stretch",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     SYSTEM GENERATED COLUMN
  ========================================================= */

  systemGeneratedColumn: {
    gridColumn: "2",

    gridRow: "1",

    minWidth: 0,

    width: "100%",

    height: "100%",

    display: "flex",

    boxSizing: "border-box",

    alignSelf: "stretch",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     MANUAL COLLECTION COLUMN
  ========================================================= */

  manualCollectionColumn: {
    gridColumn: "3",

    gridRow: "1",

    minWidth: 0,

    width: "100%",

    height: "100%",

    display: "flex",

    boxSizing: "border-box",

    alignSelf: "stretch",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     COLLECTION ENTRY COMPATIBILITY CONTAINER
  ========================================================= */

  collectionEntryColumn: {
    minWidth: 0,

    width: "100%",

    boxSizing: "border-box",

    fontFamily: FONTS.ui,
  },

  collectionEntryBlock: {
    minWidth: 0,

    width: "100%",

    boxSizing: "border-box",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     PAYMENT DETAILS

     Full width.
  ========================================================= */

  paymentDetailsSection: {
    gridColumn: "1 / -1",

    width: "100%",

    minWidth: 0,

    marginTop: 0,

    boxSizing: "border-box",

    background: "transparent",

    border: "none",

    borderRadius: 0,

    boxShadow: "none",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     LEGACY WORKSPACE CONTRACT
  ========================================================= */

  workspacePlaceholder: {
    width: "100%",

    marginTop: "12px",

    display: "grid",

    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",

    gap: "1px",

    boxSizing: "border-box",

    background: COLORS.border,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    overflow: "hidden",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  workspaceColumn: {
    minWidth: 0,

    minHeight: "220px",

    padding: "18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    fontFamily: FONTS.ui,
  },

  workspaceEyebrow: {
    display: "block",

    color: COLORS.accent,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",
  },

  workspaceTitle: {
    margin: "6px 0 16px",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "18px",

    fontWeight: 700,

    lineHeight: 1.25,
  },

  workspaceContent: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    padding: "11px 12px",

    marginBottom: "8px",

    boxSizing: "border-box",

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "12px",

    fontWeight: 600,
  },

  collectionActions: {
    display: "flex",

    flexWrap: "wrap",

    gap: "10px",

    marginTop: "20px",
  },

  primaryAction: {
    minHeight: "42px",

    padding: "0 18px",

    boxSizing: "border-box",

    border: `1px solid ${COLORS.accent}`,

    borderRadius: "9px",

    background: COLORS.accent,

    color: COLORS.textInverse,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    cursor: "pointer",
  },

  secondaryAction: {
    minHeight: "42px",

    padding: "0 18px",

    boxSizing: "border-box",

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    background: COLORS.surfaceSoft,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    cursor: "pointer",
  },

  /* =========================================================
     WORKFLOW SECTION SHELL
  ========================================================= */

  workflowSection: {
    width: "100%",

    marginTop: "12px",

    padding: "16px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  workflowSectionHeader: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "14px",

    marginBottom: "14px",
  },

  workflowSectionHeading: {
    display: "flex",

    flexDirection: "column",

    gap: "3px",

    minWidth: 0,

    fontFamily: FONTS.ui,
  },

  workflowSectionEyebrow: {
    color: COLORS.accent,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",

    textTransform: "uppercase",
  },

  workflowSectionTitle: {
    margin: 0,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "18px",

    fontWeight: 700,

    lineHeight: 1.25,
  },

  workflowSectionSubtitle: {
    margin: 0,

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    lineHeight: 1.45,
  },

  /* =========================================================
     SYSTEM GENERATED + COLLECTION ENTRY LEGACY PANELS
  ========================================================= */

  systemGeneratedPanel: {
    minWidth: 0,

    height: "100%",

    padding: "16px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  collectionEntryPanel: {
    minWidth: 0,

    height: "100%",

    padding: "16px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     COLLECTION SUMMARY
  ========================================================= */

  collectionSummary: {
    width: "100%",

    marginTop: "12px",

    padding: "15px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  collectionSummaryGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "9px",

    marginTop: "12px",
  },

  collectionSummaryMetric: {
    minWidth: 0,

    padding: "10px 12px",

    boxSizing: "border-box",

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    fontFamily: FONTS.ui,
  },

  collectionSummaryMetricAccent: {
    background: COLORS.accentSoft,

    border: `1px solid ${COLORS.accent}`,
  },

  collectionSummaryLabel: {
    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 700,

    textTransform: "uppercase",

    letterSpacing: "0.06em",
  },

  collectionSummaryValue: {
    marginTop: "5px",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "15px",

    fontWeight: 800,
  },

  collectionSummaryFinal: {
    minWidth: 0,

    padding: "10px 14px",

    boxSizing: "border-box",

    background: COLORS.successSoft,

    border: `1px solid ${COLORS.success}`,

    borderRadius: "9px",

    fontFamily: FONTS.ui,
  },

  collectionSummaryFinalLabel: {
    color: COLORS.success,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 800,

    textTransform: "uppercase",

    letterSpacing: "0.06em",
  },

  collectionSummaryFinalValue: {
    marginTop: "4px",

    color: COLORS.success,

    fontFamily: FONTS.ui,

    fontSize: "18px",

    fontWeight: 900,
  },

  /* =========================================================
     PAYMENT DETAILS LEGACY STYLE CONTRACT
  ========================================================= */

  paymentDetailsGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "12px",

    marginTop: "12px",

    fontFamily: FONTS.ui,
  },

  paymentDetailsField: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "6px",

    fontFamily: FONTS.ui,
  },

  paymentDetailsFieldFull: {
    minWidth: 0,

    gridColumn: "1 / -1",

    display: "flex",

    flexDirection: "column",

    gap: "6px",

    fontFamily: FONTS.ui,
  },

  paymentDetailsLabel: {
    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "10px",

    fontWeight: 700,
  },

  paymentDetailsInput: {
    width: "100%",

    minHeight: "40px",

    padding: "0 11px",

    boxSizing: "border-box",

    appearance: "none",

    WebkitAppearance: "none",

    color: COLORS.text,

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "8px",

    outline: "none",

    fontFamily: FONTS.ui,

    fontSize: "12px",
  },

  paymentDetailsActions: {
    display: "flex",

    alignItems: "center",

    justifyContent: "flex-end",

    flexWrap: "wrap",

    gap: "9px",

    marginTop: "14px",
  },

  saveCollectionAction: {
    minHeight: "40px",

    padding: "0 16px",

    boxSizing: "border-box",

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    background: COLORS.surface,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "10px",

    fontWeight: 800,

    cursor: "pointer",
  },

  saveReceiptAction: {
    minHeight: "40px",

    padding: "0 16px",

    boxSizing: "border-box",

    border: `1px solid ${COLORS.accent}`,

    borderRadius: "9px",

    background: COLORS.accent,

    color: COLORS.textInverse,

    fontFamily: FONTS.ui,

    fontSize: "10px",

    fontWeight: 800,

    cursor: "pointer",
  },

  /* =========================================================
     DOCUMENTS + HISTORY

     PREMIUM STACK:

     DOCUMENTS
     100%

     ↓

     COLLECTION HISTORY
     100%
  ========================================================= */

  documentsHistoryRow: {
    width: "100%",

    minWidth: 0,

    marginTop: "10px",

    display: "flex",

    flexDirection: "column",

    gap: "10px",

    boxSizing: "border-box",

    fontFamily: FONTS.ui,
  },

  /* =========================================================
     LOAN DOCUMENTS
  ========================================================= */

  lowerWorkflowGrid: {
    width: "100%",

    minWidth: 0,

    marginTop: "10px",

    display: "flex",

    flexDirection: "column",

    gap: "10px",

    boxSizing: "border-box",

    fontFamily: FONTS.ui,
  },

  loanDocumentsColumn: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    fontFamily: FONTS.ui,
  },

  loanDocumentsSection: {
    width: "100%",

    minWidth: 0,

    padding: "15px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "14px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  documentThumbnailGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",

    gap: "9px",

    marginTop: "12px",
  },

  documentThumbnail: {
    minWidth: 0,

    aspectRatio: "1 / 1",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    background: COLORS.surfaceSoft,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",

    overflow: "hidden",

    cursor: "pointer",
  },

  documentThumbnailImage: {
    width: "100%",

    height: "100%",

    objectFit: "cover",

    display: "block",
  },

  documentsViewAll: {
    width: "100%",

    minHeight: "38px",

    marginTop: "10px",

    boxSizing: "border-box",

    border: `1px solid ${COLORS.border}`,

    borderRadius: "8px",

    background: COLORS.surfaceSoft,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "10px",

    fontWeight: 800,

    cursor: "pointer",
  },

  /* =========================================================
     COLLECTION HISTORY

     FULL WIDTH.
  ========================================================= */

  collectionHistoryColumn: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    fontFamily: FONTS.ui,
  },

  collectionHistorySection: {
    width: "100%",

    minWidth: 0,

    padding: "15px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "14px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    overflow: "hidden",

    fontFamily: FONTS.ui,
  },

  historyTableWrapper: {
    width: "100%",

    marginTop: "12px",

    overflowX: "auto",

    border: `1px solid ${COLORS.border}`,

    borderRadius: "9px",
  },

  historyTable: {
    width: "100%",

    minWidth: "760px",

    borderCollapse: "collapse",

    fontFamily: FONTS.ui,

    fontSize: "10px",
  },

  historyTableHeader: {
    padding: "9px 10px",

    background: COLORS.surfaceSoft,

    borderBottom: `1px solid ${COLORS.border}`,

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "8px",

    fontWeight: 800,

    textTransform: "uppercase",

    letterSpacing: "0.06em",

    textAlign: "left",

    whiteSpace: "nowrap",
  },

  historyTableCell: {
    padding: "9px 10px",

    borderBottom: `1px solid ${COLORS.border}`,

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 600,

    whiteSpace: "nowrap",
  },

  historyTableLastCell: {
    padding: "9px 10px",

    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "9px",

    fontWeight: 600,

    whiteSpace: "nowrap",
  },

  historyModeBadge: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "4px 7px",

    borderRadius: "999px",

    background: COLORS.successSoft,

    color: COLORS.success,

    fontFamily: FONTS.ui,

    fontSize: "8px",

    fontWeight: 800,
  },

  historyEmptyState: {
    width: "100%",

    padding: "28px 16px",

    boxSizing: "border-box",

    textAlign: "center",

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "11px",
  },

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  emptyState: {
    width: "100%",

    minHeight: "180px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "8px",

    padding: "28px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    textAlign: "center",

    fontFamily: FONTS.ui,
  },

  emptyStateTitle: {
    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "17px",

    fontWeight: 700,
  },

  emptyStateMessage: {
    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    lineHeight: 1.5,
  },

  /* =========================================================
     LEGACY / FUTURE SECTION CONTRACT
  ========================================================= */

  futureSection: {
    width: "100%",

    marginTop: "12px",

    padding: "16px 18px",

    boxSizing: "border-box",

    background: COLORS.surface,

    border: `1px solid ${COLORS.border}`,

    borderRadius: "16px",

    boxShadow: `0 4px 18px ${COLORS.shadow}`,

    fontFamily: FONTS.ui,
  },

  futureSectionTitle: {
    color: COLORS.text,

    fontFamily: FONTS.ui,

    fontSize: "15px",

    fontWeight: 700,

    letterSpacing: "0.02em",
  },

  futureSectionText: {
    marginTop: "7px",

    color: COLORS.muted,

    fontFamily: FONTS.ui,

    fontSize: "11px",

    lineHeight: 1.5,
  },
};

/* ===========================================================
   END
=========================================================== */
