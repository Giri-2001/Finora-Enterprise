// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION ENTRY STYLES — STEP 4
//
// RESPONSIBILITY
//
// - Collection Entry geometry
// - EMI schedule presentation
// - Manual collection presentation
// - Collection value presentation
// - EMI total row presentation
// - FINORA Theme Engine token consumption
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No business logic
// - No second colour palette
// - Geometry remains presentation-only
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",

  danger: "var(--finora-theme-danger, #C24141)",

  dangerSoft: "var(--finora-theme-danger-soft, rgba(194, 65, 65, 0.10))",

  info: "var(--finora-theme-info, #2563EB)",

  infoSoft: "var(--finora-theme-info-soft, rgba(37, 99, 235, 0.08))",
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
  // ==========================================================

  panel: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: 0,
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
    gap: "10px",
    paddingBottom: "8px",
    borderBottom: `1px solid ${THEME.border}`,
  },

  step: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "30px",
    flexShrink: 0,
    boxSizing: "border-box",
    border: "none",
    borderRadius: 0,
    color: THEME.brand,
    fontFamily: INTER_FONT,
    fontSize: "16px",
    fontWeight: 800,
    lineHeight: 1,
  },

  titleGroup: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: "1px",
  },

  title: {
    margin: 0,
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: "0.01em",
    textTransform: "uppercase",
  },

  subtitle: {
    margin: 0,
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: 1.3,
  },

  // ==========================================================
  // MODE
  // ==========================================================

  modeRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "50px",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 0 7px 0",
  },

  radioOption: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minHeight: "20px",
    boxSizing: "border-box",
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
  },

  radioOptionActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minHeight: "20px",
    boxSizing: "border-box",
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    userSelect: "none",
  },

  modeRadio: {
    width: "14px",
    height: "14px",
    margin: 0,
    accentColor: THEME.brand,
    cursor: "pointer",
  },

  // ==========================================================
  // EMI DROPDOWN
  // ==========================================================

  emiDropdown: {
    position: "relative",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },

  emiDropdownTrigger: {
    width: "100%",
    minWidth: 0,
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    boxSizing: "border-box",
    padding: "8px 11px",
    border: `1px solid ${THEME.border}`,
    borderRadius: "5px",
    outline: "none",
    background: THEME.surface,
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },

  emiDropdownTriggerText: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  emiDropdownArrow: {
    flexShrink: 0,
    color: THEME.brand,
    fontFamily: INTER_FONT,
    fontSize: "14px",
    fontWeight: 800,
  },

  // ==========================================================
  // EMI DROPDOWN PANEL
  // ==========================================================

  emiDropdownPanel: {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    right: 0,
    zIndex: 50,
    width: "100%",
    maxHeight: "330px",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "auto",
    background: THEME.surface,
    border: `1px solid ${THEME.borderStrong}`,
    borderRadius: "5px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
  },

  // ==========================================================
  // DROPDOWN HEADER
  // ==========================================================

  emiDropdownHeader: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: INTER_FONT,
    gap: "10px",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 10px",
    background: THEME.surfaceSoft,
    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // DROPDOWN LIST
  // ==========================================================

  emiDropdownList: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  // ==========================================================
  // DROPDOWN ROW
  // ==========================================================

  emiDropdownRow: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns:
      "minmax(55px, 0.7fr) minmax(82px, 1fr) minmax(90px, 1fr) minmax(65px, 0.75fr) 34px",
    alignItems: "center",
    columnGap: "10px",
    minHeight: "38px",
    boxSizing: "border-box",
    padding: "5px 10px",
    background: THEME.surface,
    borderBottom: `1px solid ${THEME.border}`,
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    cursor: "pointer",
  },

  emiDropdownRowSelected: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns:
      "minmax(55px, 0.7fr) minmax(82px, 1fr) minmax(90px, 1fr) minmax(65px, 0.75fr) 34px",
    alignItems: "center",
    columnGap: "10px",
    minHeight: "38px",
    boxSizing: "border-box",
    padding: "5px 10px",
    background: THEME.brandSoft,
    borderBottom: `1px solid ${THEME.border}`,
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    cursor: "pointer",
  },

  emiDropdownRowLocked: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns:
      "minmax(55px, 0.7fr) minmax(82px, 1fr) minmax(90px, 1fr) minmax(65px, 0.75fr) 34px",
    alignItems: "center",
    columnGap: "10px",
    minHeight: "38px",
    boxSizing: "border-box",
    padding: "5px 10px",
    background: THEME.surfaceSoft,
    borderBottom: `1px solid ${THEME.border}`,
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    cursor: "default",
    opacity: 0.72,
  },

  // ==========================================================
  // EMI TOTAL ROW
  // ==========================================================

  emiTotalRow: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns:
      "minmax(55px, 0.7fr) minmax(82px, 1fr) minmax(90px, 1fr) minmax(65px, 0.75fr) 34px",
    alignItems: "center",
    columnGap: "7px",
    minHeight: "34px",
    boxSizing: "border-box",
    padding: "5px 10px",
    background: THEME.surfaceSoft,
    borderTop: `1px solid ${THEME.borderStrong}`,
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
  },

  emiTotalLabel: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    lineHeight: 1.2,
    textTransform: "uppercase",
  },

  emiTotalSpacer: {
    minWidth: 0,
  },

  emiTotalAmount: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.2,
  },

  emiTotalStatus: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
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
    borderRadius: "4px",
    overflow: "hidden",
    background: THEME.surface,
  },

  scheduleHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
    padding: "7px 10px",
    background: THEME.surfaceSoft,
    borderBottom: `1px solid ${THEME.border}`,
  },

  scheduleHeader: {
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    lineHeight: 1.2,
    textTransform: "uppercase",
  },

  scheduleCount: {
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  scheduleTable: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    fontFamily: INTER_FONT,
  },

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
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    lineHeight: 1.2,
    textTransform: "uppercase",
  },

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
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: 1.2,
  },

  scheduleTableCell: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 600,
  },

  emiName: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "13px",
    fontWeight: 700,
  },

  emiAmount: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "14px",
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
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "7px 15px",
    borderRadius: "999px",
    fontFamily: INTER_FONT,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  statusPaid: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "7px 15px",
    borderRadius: "999px",
    border: `1px solid ${THEME.success}`,
    background: THEME.successSoft,
    color: THEME.success,
    fontFamily: INTER_FONT,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  statusPreclosed: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "7px 15px",
    borderRadius: "999px",
    border: `1px solid ${THEME.info}`,
    background: THEME.infoSoft,
    color: THEME.info,
    fontFamily: INTER_FONT,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  statusPending: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "7px 15px",
    borderRadius: "999px",
    border: `1px solid ${THEME.borderStrong}`,
    background: THEME.surfaceSoft,
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    lineHeight: 1.1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  // ==========================================================
  // SELECTION
  // ==========================================================

  selectCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    minWidth: 0,
  },

  selectControl: {
    width: "14px",
    height: "14px",
    margin: 0,
    flexShrink: 0,
    accentColor: THEME.brand,
    cursor: "pointer",
  },

  lockIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "13px",
    height: "13px",
    flexShrink: 0,
    fontFamily: INTER_FONT,
    fontSize: "9px",
    lineHeight: 1,
    opacity: 0.78,
  },

  selectedRow: {
    background: THEME.brandSoft,
  },

  lockedRow: {
    opacity: 0.72,
    background: THEME.surfaceSoft,
  },

  // ==========================================================
  // LOAD / ERROR / EMPTY
  // ==========================================================

  loadingSchedule: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    background: THEME.surface,
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "10px",
    fontWeight: 600,
    lineHeight: 1.35,
    textAlign: "center",
  },

  errorSchedule: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    background: THEME.dangerSoft,
    color: THEME.danger,
    fontFamily: INTER_FONT,
    fontSize: "10px",
    fontWeight: 650,
    lineHeight: 1.35,
    textAlign: "center",
  },

  emptySchedule: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    background: THEME.surface,
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: 1.3,
  },

  // ==========================================================
  // MANUAL COLLECTION
  // ==========================================================

  manualSection: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    marginTop: "0px",
    padding: "6px",
    background: THEME.surfaceSoft,
    border: `1px solid ${THEME.border}`,
    borderRadius: "4px",
  },

  manualHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginBottom: "0px",
  },

  manualTitle: {
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.05em",
    lineHeight: 1.2,
    textTransform: "uppercase",
  },

  manualHint: {
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "8px",
    fontWeight: 500,
    lineHeight: 1.3,
  },

  manualInputGrid: {
    width: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    boxSizing: "border-box",
  },

  manualField: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  manualFieldLabel: {
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "10px",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "0.03em",
  },

  manualInput: {
    width: "100%",
    minWidth: 0,
    minHeight: "34px",
    boxSizing: "border-box",
    padding: "7px 9px",
    border: `1px solid ${THEME.border}`,
    borderRadius: "4px",
    outline: "none",
    background: THEME.surface,
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "15px",
    fontWeight: 700,
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

  valueCard: {
    minWidth: 0,
    height: "38px",
    minHeight: "38px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "6px 10px",
    background: THEME.surface,
    border: `1px solid ${THEME.border}`,
    borderRadius: "4px",
    textAlign: "left",
  },

  valueCardActive: {
    minWidth: 0,
    height: "38px",
    minHeight: "38px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "6px 10px",
    background: THEME.brandSoft,
    border: `1px solid ${THEME.brand}`,
    borderRadius: "4px",
    textAlign: "left",
  },

  valueLabel: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textSecondary,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.2,
  },

  value: {
    flexShrink: 0,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "17px",
    fontWeight: 700,
    lineHeight: 1,
  },

  valueHint: {
    flexShrink: 0,
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  },
};

// ============================================================
// END
// ============================================================
