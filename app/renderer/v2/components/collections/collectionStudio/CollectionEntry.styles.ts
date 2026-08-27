// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION ENTRY STYLES
//
// RESPONSIBILITY
//
// - Collection entry geometry
// - Collection mode selection
// - EMI schedule presentation
// - Manual collection presentation
// - Collection value presentation
// - Selection summaries
// - FINORA Theme Engine token consumption
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No business logic
// - No inline responsive dimensions
// - No second colour palette
// - Theme values come from FINORA Theme Engine variables
// - Responsive geometry belongs to Responsive Engine
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  // ==========================================================
  // SURFACES
  // ==========================================================

  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  surfaceStrong: "var(--finora-theme-surface-strong, #E7EAF0)",

  // ==========================================================
  // TEXT
  // ==========================================================

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  // ==========================================================
  // BRAND
  // ==========================================================

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  // ==========================================================
  // BORDER
  // ==========================================================

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  // ==========================================================
  // STATUS
  // ==========================================================

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",

  // ==========================================================
  // WARNING
  // ==========================================================

  warning: "var(--finora-theme-warning, #C69214)",

  warningSoft: "var(--finora-theme-warning-soft, rgba(198, 146, 20, 0.10))",
} as const;

// ============================================================
// FONT CONTRACTS
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

const GEORGIA_FONT = "Georgia, 'Times New Roman', serif";

// ============================================================
// EXPORT
// ============================================================

export const collectionEntryStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // ROOT PANEL
  //
  // Designed to sit directly inside the Collection Workspace.
  // ==========================================================

  panel: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    padding: "0",

    margin: 0,

    background: "transparent",

    border: "none",

    borderRadius: 0,

    boxShadow: "none",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    display: "flex",

    alignItems: "flex-start",

    gap: "8px",

    width: "100%",

    boxSizing: "border-box",

    padding: "0 0 9px 0",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // STEP
  // ==========================================================

  step: {
    flexShrink: 0,

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "15px",

    fontWeight: 400,

    lineHeight: 1.2,
  },

  // ==========================================================
  // TITLE GROUP
  // ==========================================================

  titleGroup: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "2px",
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "20px",

    fontWeight: 700,

    lineHeight: 1.15,

    textTransform: "uppercase",
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    display: "block",

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "13px",

    fontWeight: 400,

    lineHeight: 1.25,
  },

  // ==========================================================
  // COLLECTION MODE ROW
  // ==========================================================

  modeRow: {
    display: "flex",

    alignItems: "center",

    flexWrap: "wrap",

    gap: "16px",

    width: "100%",

    boxSizing: "border-box",

    padding: "9px 0 7px 0",
  },

  // ==========================================================
  // RADIO OPTION
  // ==========================================================

  radioOption: {
    display: "inline-flex",

    alignItems: "center",

    gap: "6px",

    minHeight: "22px",

    boxSizing: "border-box",

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "13px",

    fontWeight: 400,

    cursor: "pointer",

    userSelect: "none",
  },

  // ==========================================================
  // ACTIVE RADIO OPTION
  // ==========================================================

  radioOptionActive: {
    color: THEME.textPrimary,

    fontWeight: 700,
  },

  // ==========================================================
  // RADIO
  // ==========================================================

  modeRadio: {
    width: "14px",

    height: "14px",

    margin: 0,

    accentColor: THEME.brand,

    cursor: "pointer",
  },

  // ==========================================================
  // EMI SCHEDULE
  // ==========================================================

  schedule: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    margin: 0,

    border: `1px solid ${THEME.border}`,

    borderRadius: "0",

    overflow: "hidden",

    background: THEME.surface,
  },

  // ==========================================================
  // SCHEDULE HEADER
  // ==========================================================

  scheduleHeader: {
    width: "100%",

    boxSizing: "border-box",

    padding: "7px 10px",

    background: THEME.surfaceSoft,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textMuted,

    fontFamily: GEORGIA_FONT,

    fontSize: "9px",

    fontWeight: 700,

    letterSpacing: "0.05em",

    lineHeight: 1.2,

    textTransform: "uppercase",
  },

  // ==========================================================
  // SCHEDULE TABLE
  // ==========================================================

  scheduleTable: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    fontFamily: GEORGIA_FONT,
  },

  // ==========================================================
  // TABLE HEADER
  // ==========================================================

  scheduleTableHeader: {
    width: "100%",

    boxSizing: "border-box",

    display: "grid",

    gridTemplateColumns:
      "minmax(70px, 1fr) minmax(100px, 1.15fr) minmax(110px, 1.15fr) minmax(80px, 0.8fr) 55px",

    alignItems: "center",

    columnGap: "8px",

    padding: "7px 10px",

    background: THEME.surface,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    lineHeight: 1.2,

    textTransform: "uppercase",
  },

  // ==========================================================
  // TABLE ROW
  // ==========================================================

  scheduleTableRow: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "grid",

    gridTemplateColumns:
      "minmax(70px, 1fr) minmax(100px, 1.15fr) minmax(110px, 1.15fr) minmax(80px, 0.8fr) 55px",

    alignItems: "center",

    columnGap: "8px",

    minHeight: "31px",

    padding: "5px 10px",

    background: THEME.surface,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    fontWeight: 400,

    lineHeight: 1.2,
  },

  // ==========================================================
  // TABLE CELL
  // ==========================================================

  scheduleTableCell: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    fontWeight: 400,
  },

  // ==========================================================
  // EMI NAME
  // ==========================================================

  emiName: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    fontWeight: 700,
  },

  // ==========================================================
  // EMI AMOUNT
  // ==========================================================

  emiAmount: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    fontWeight: 700,
  },

  // ==========================================================
  // STATUS
  // ==========================================================

  status: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    width: "fit-content",

    boxSizing: "border-box",

    padding: "3px 6px",

    borderRadius: "999px",

    fontFamily: INTER_FONT,

    fontSize: "7px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    lineHeight: 1.1,

    textTransform: "uppercase",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // PAID STATUS
  // ==========================================================

  statusPaid: {
    border: `1px solid ${THEME.success}`,

    background: THEME.successSoft,

    color: THEME.success,
  },

  // ==========================================================
  // PENDING STATUS
  // ==========================================================

  statusPending: {
    border: `1px solid ${THEME.borderStrong}`,

    background: THEME.surfaceSoft,

    color: THEME.textMuted,
  },

  // ==========================================================
  // SELECT CONTROL
  // ==========================================================

  selectControl: {
    width: "14px",

    height: "14px",

    margin: 0,

    justifySelf: "center",

    accentColor: THEME.brand,

    cursor: "pointer",
  },

  // ==========================================================
  // SELECTED ROW
  // ==========================================================

  selectedRow: {
    background: THEME.brandSoft,
  },

  // ==========================================================
  // LOCKED ROW
  // ==========================================================

  lockedRow: {
    opacity: 0.72,
  },

  // ==========================================================
  // EMPTY SCHEDULE
  // ==========================================================

  emptySchedule: {
    width: "100%",

    boxSizing: "border-box",

    padding: "10px 12px",

    background: THEME.surface,

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "12px",

    fontWeight: 400,

    lineHeight: 1.3,
  },

  // ==========================================================
  // MANUAL COLLECTION
  // ==========================================================

  manualSection: {
    width: "100%",

    boxSizing: "border-box",

    marginTop: "8px",

    padding: "10px",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "4px",
  },

  // ==========================================================
  // MANUAL MESSAGE
  // ==========================================================

  manualMessage: {
    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "11px",

    fontWeight: 400,

    lineHeight: 1.3,
  },

  // ==========================================================
  // VALUE GRID
  // ==========================================================

  valueGrid: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "8px",

    boxSizing: "border-box",

    marginTop: "9px",
  },

  // ==========================================================
  // VALUE CARD
  // ==========================================================

  valueCard: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    minHeight: "58px",

    padding: "8px 10px",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "4px",

    textAlign: "center",
  },

  // ==========================================================
  // ACTIVE VALUE CARD
  // ==========================================================

  valueCardActive: {
    borderColor: THEME.brand,

    background: THEME.brandSoft,
  },

  // ==========================================================
  // VALUE LABEL
  // ==========================================================

  valueLabel: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 700,

    lineHeight: 1.2,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // VALUE
  // ==========================================================

  value: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "16px",

    fontWeight: 700,

    lineHeight: 1.15,
  },

  // ==========================================================
  // VALUE HINT
  // ==========================================================

  valueHint: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "7px",

    fontWeight: 500,

    lineHeight: 1.2,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // INFO NOTE
  // ==========================================================

  infoNote: {
    display: "flex",

    alignItems: "flex-start",

    gap: "8px",

    marginTop: "8px",

    padding: "8px 10px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    background: THEME.surfaceSoft,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // WARNING NOTE
  // ==========================================================

  warningNote: {
    borderColor: THEME.warning,

    background: THEME.warningSoft,

    color: THEME.textSecondary,
  },

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    minHeight: "70px",

    padding: "12px",

    boxSizing: "border-box",

    border: `1px dashed ${THEME.borderStrong}`,

    borderRadius: "4px",

    background: THEME.surfaceSoft,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 600,

    textAlign: "center",
  },

  // ==========================================================
  // LEGACY / COMPATIBILITY CONTRACTS
  // ==========================================================

  card: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    background: "transparent",

    border: "none",

    borderRadius: 0,

    boxShadow: "none",
  },

  headerContent: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "3px",
  },

  eyebrow: {
    display: "block",

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",

    lineHeight: 1.2,

    textTransform: "uppercase",
  },

  modeSection: {
    display: "flex",

    flexDirection: "column",

    gap: "8px",

    marginTop: "8px",
  },

  modeLabel: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    textTransform: "uppercase",
  },

  modeGroup: {
    display: "flex",

    alignItems: "center",

    gap: "10px",

    flexWrap: "wrap",
  },

  modeOption: {
    display: "inline-flex",

    alignItems: "center",

    gap: "6px",

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 700,

    cursor: "pointer",

    userSelect: "none",
  },

  modeOptionActive: {
    color: THEME.textPrimary,
  },

  emiSection: {
    width: "100%",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    background: THEME.surface,

    overflow: "hidden",
  },

  sectionHeader: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "12px",

    padding: "7px 10px",

    background: THEME.surfaceSoft,

    borderBottom: `1px solid ${THEME.border}`,
  },

  sectionTitle: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.05em",

    textTransform: "uppercase",
  },

  scheduleList: {
    width: "100%",

    display: "flex",

    flexDirection: "column",
  },

  scheduleRow: {
    width: "100%",

    minHeight: "30px",

    display: "grid",

    gridTemplateColumns:
      "minmax(70px, 1fr) minmax(100px, 1.15fr) minmax(110px, 1.15fr) minmax(80px, 0.8fr) 55px",

    alignItems: "center",

    gap: "8px",

    padding: "5px 10px",

    boxSizing: "border-box",

    borderBottom: `1px solid ${THEME.border}`,

    background: THEME.surface,

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",
  },

  table: {
    width: "100%",

    borderCollapse: "collapse",

    fontFamily: INTER_FONT,
  },

  row: {
    borderBottom: `1px solid ${THEME.border}`,
  },

  cell: {
    padding: "7px 8px",

    color: THEME.textSecondary,

    fontSize: "9px",

    fontWeight: 600,
  },

  amount: {
    color: THEME.textPrimary,

    fontSize: "10px",

    fontWeight: 800,
  },

  selectControlLegacy: {
    width: "14px",

    height: "14px",

    margin: 0,

    accentColor: THEME.brand,

    cursor: "pointer",
  },

  // ==========================================================
  // LEGACY VALUE CONTRACTS
  // ==========================================================

  selectionSummary: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "8px",

    marginTop: "8px",
  },

  summaryCard: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "4px",

    padding: "8px 10px",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "4px",
  },

  summaryLabel: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 600,

    lineHeight: 1.25,
  },

  summaryValue: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "13px",

    fontWeight: 800,

    lineHeight: 1.25,
  },

  selectedSummary: {
    borderColor: THEME.brand,

    background: THEME.brandSoft,
  },

  container: {
    width: "100%",

    boxSizing: "border-box",
  },

  body: {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: "8px",
  },

  radioGroup: {
    display: "flex",

    alignItems: "center",

    gap: "10px",

    flexWrap: "wrap",
  },

  radioLabel: {
    display: "inline-flex",

    alignItems: "center",

    gap: "6px",

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 700,

    cursor: "pointer",
  },

  inputGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

    gap: "8px",
  },

  inputGroup: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "4px",
  },

  inputLabel: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 700,
  },

  input: {
    width: "100%",

    minHeight: "34px",

    padding: "7px 9px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "4px",

    outline: "none",

    background: THEME.surface,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 600,
  },

  inputEmphasis: {
    borderColor: THEME.brand,

    background: THEME.brandSoft,
  },
};

// ============================================================
// END
// ============================================================
