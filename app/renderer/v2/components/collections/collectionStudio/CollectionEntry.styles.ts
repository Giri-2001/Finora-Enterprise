// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION ENTRY STYLES — STEP 4
//
// RESPONSIBILITY
//
// - Premium EMI Collection card presentation
// - Premium System Generated middle-slot geometry
// - Premium Manual Collection card presentation
// - Exact 40 / 20 / 40 collection workspace
// - Lucide icon header presentation
// - Collection mode visual hierarchy
// - EMI schedule dropdown presentation
// - Manual amount field presentation
// - Collection value presentation
// - FINORA Theme Engine token consumption
//
// IMPORTANT
//
// - Presentation only
// - No business logic
// - No persistence logic
// - No local theme engine
// - No local breakpoint engine
// - No second colour palette
// - All text / numbers use FINORA Inter contract
//
// WORKSPACE CONTRACT
//
// EMI COLLECTION        40%
// SYSTEM GENERATED      20%
// MANUAL COLLECTION     40%
//
// VERSION : 2.4
// STATUS  : Production
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  surfaceStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #EEF2F7))",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  textInverse: "var(--finora-theme-text-inverse, #FFFFFF)",

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

  shadow: "var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
} as const;

// ============================================================
// FONT CONTRACT
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// EXPORT
// ============================================================

export const collectionEntryStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // ROOT
  // ==========================================================

  panel: {
    width: "100%",

    minWidth: 0,

    height: "100%",

    boxSizing: "border-box",

    margin: 0,

    padding: 0,

    background: "transparent",

    border: "none",

    borderRadius: 0,

    boxShadow: "none",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // 40 / 20 / 40 WORKSPACE
  // ==========================================================

  modeWorkspace: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "minmax(0, 2fr) minmax(210px, 1fr) minmax(0, 2fr)",

    gap: "10px",

    alignItems: "stretch",

    boxSizing: "border-box",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // CARD
  // ==========================================================

  modeCard: {
    width: "100%",

    minWidth: 0,

    height: "100%",

    minHeight: "100%",

    display: "flex",

    flexDirection: "column",

    boxSizing: "border-box",

    padding: "15px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: `0 4px 18px ${THEME.shadow}`,

    overflow: "visible",

    fontFamily: INTER_FONT,

    transition:
      "border-color 160ms ease, box-shadow 160ms ease, background 160ms ease",
  },

  modeCardActive: {
    border: `1.5px solid ${THEME.brand}`,

    boxShadow: `0 5px 20px ${THEME.shadow}`,
  },

  modeCardInactive: {
    border: `1px solid ${THEME.border}`,

    background: THEME.surface,

    opacity: 0.96,
  },

  // ==========================================================
  // MIDDLE SLOT
  // ==========================================================

  middleSlot: {
    width: "100%",

    minWidth: 0,

    height: "100%",

    minHeight: "100%",

    display: "flex",

    alignItems: "stretch",

    boxSizing: "border-box",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // PREMIUM CARD HEADER
  // ==========================================================

  modeCardHeader: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: "14px",

    boxSizing: "border-box",

    paddingBottom: "13px",

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // ICON + TEXT GROUP
  // ==========================================================

  modeCardHeaderMain: {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    alignItems: "flex-start",

    gap: "11px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // LUCIDE ICON
  // ==========================================================

  modeCardIcon: {
    width: "25px",

    height: "25px",

    minWidth: "25px",

    flexShrink: 0,

    marginTop: "9px",

    color: THEME.brand,

    strokeWidth: 2,
  },

  // ==========================================================
  // HEADING GROUP
  // ==========================================================

  modeCardHeadingGroup: {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "2px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // STEP
  // ==========================================================

  modeCardEyebrow: {
    display: "block",

    margin: 0,

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 850,

    lineHeight: 1.15,

    letterSpacing: "0.075em",

    textTransform: "uppercase",
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  modeCardTitle: {
    margin: "2px 0 0",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "16px",

    fontWeight: 800,

    lineHeight: 1.25,

    letterSpacing: "0.015em",

    textTransform: "uppercase",
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  modeCardSubtitle: {
    margin: "3px 0 0",

    maxWidth: "100%",

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // TOP-RIGHT MODE SELECTOR
  // ==========================================================

  modeCardSelector: {
    width: "28px",

    height: "28px",

    minWidth: "28px",

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    marginTop: "1px",

    padding: 0,

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "999px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 850,

    lineHeight: 1,

    cursor: "pointer",

    transition:
      "border-color 150ms ease, background 150ms ease, color 150ms ease, box-shadow 150ms ease",
  },

  modeCardSelectorActive: {
    border: `1px solid ${THEME.brand}`,

    background: THEME.brandSoft,

    color: THEME.brand,

    boxShadow: `0 2px 8px ${THEME.shadow}`,
  },

  // ==========================================================
  // BODY
  // ==========================================================

  modeCardBody: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    flex: "1 1 auto",

    flexDirection: "column",

    boxSizing: "border-box",

    paddingTop: "12px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // LEGACY HEADER CONTRACT
  // ==========================================================

  header: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: "9px",

    boxSizing: "border-box",

    paddingBottom: "11px",

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
  },

  step: {
    width: "27px",

    height: "27px",

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "8px",

    background: THEME.brandSoft,

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 850,

    lineHeight: 1,
  },

  titleGroup: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "2px",

    fontFamily: INTER_FONT,
  },

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 800,

    lineHeight: 1.25,

    letterSpacing: "0.035em",

    textTransform: "uppercase",
  },

  subtitle: {
    margin: 0,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 500,

    lineHeight: 1.35,
  },

  // ==========================================================
  // LEGACY MODE ROW
  // ==========================================================

  modeRow: {
    display: "flex",

    alignItems: "center",

    flexWrap: "wrap",

    gap: "18px",

    width: "100%",

    boxSizing: "border-box",

    padding: "10px 0",

    fontFamily: INTER_FONT,
  },

  radioOption: {
    display: "inline-flex",

    alignItems: "center",

    gap: "7px",

    minHeight: "28px",

    boxSizing: "border-box",

    padding: "0 10px",

    border: `1px solid ${THEME.border}`,

    borderRadius: "999px",

    background: THEME.surfaceSoft,

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 700,

    cursor: "pointer",

    userSelect: "none",
  },

  radioOptionActive: {
    display: "inline-flex",

    alignItems: "center",

    gap: "7px",

    minHeight: "28px",

    boxSizing: "border-box",

    padding: "0 10px",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "999px",

    background: THEME.brandSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,

    cursor: "pointer",

    userSelect: "none",
  },

  modeRadio: {
    width: "13px",

    height: "13px",

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

    fontFamily: INTER_FONT,
  },

  emiDropdownTrigger: {
    width: "100%",

    minWidth: 0,

    minHeight: "42px",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "10px",

    boxSizing: "border-box",

    padding: "0 12px",

    appearance: "none",

    WebkitAppearance: "none",

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 700,

    cursor: "pointer",

    textAlign: "left",

    transition:
      "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
  },

  emiDropdownTriggerText: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    fontFamily: INTER_FONT,
  },

  emiDropdownArrow: {
    flexShrink: 0,

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "13px",

    fontWeight: 850,
  },

  // ==========================================================
  // EMI DROPDOWN PANEL
  // ==========================================================

  emiDropdownPanel: {
    position: "absolute",

    top: "calc(100% + 6px)",

    left: 0,

    zIndex: 60,

    width: "max(100%, 520px)",

    maxHeight: "340px",

    minWidth: "430px",

    boxSizing: "border-box",

    overflow: "auto",

    background: THEME.surface,

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "10px",

    boxShadow: `0 14px 34px ${THEME.shadow}`,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // DROPDOWN HEADER
  // ==========================================================

  emiDropdownHeader: {
    position: "sticky",

    top: 0,

    zIndex: 2,

    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "10px",

    boxSizing: "border-box",

    padding: "10px 12px",

    background: THEME.surfaceStrong,

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
  },

  scheduleHeader: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 700,

    letterSpacing: "0.06em",

    lineHeight: 1.2,

    textTransform: "uppercase",
  },

  scheduleCount: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 700,

    letterSpacing: "0.04em",

    lineHeight: 1.2,

    textTransform: "uppercase",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // EMI LIST
  // ==========================================================

  emiDropdownList: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    boxSizing: "border-box",

    fontFamily: INTER_FONT,
  },

  emiDropdownRow: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns:
      "minmax(55px, 0.7fr) minmax(90px, 1fr) minmax(95px, 1fr) minmax(70px, 0.8fr) 36px",

    alignItems: "center",

    columnGap: "9px",

    minHeight: "42px",

    boxSizing: "border-box",

    padding: "6px 12px",

    background: THEME.surface,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    cursor: "pointer",
  },

  emiDropdownRowSelected: {
    background: THEME.brandSoft,
  },

  emiDropdownRowLocked: {
    background: THEME.surfaceSoft,

    opacity: 0.72,

    cursor: "default",
  },

  selectedRow: {
    background: THEME.brandSoft,
  },

  lockedRow: {
    background: THEME.surfaceSoft,

    opacity: 0.72,

    cursor: "not-allowed",
  },

  // ==========================================================
  // EMI TOTAL
  // ==========================================================

  emiTotalRow: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns:
      "minmax(55px, 0.7fr) minmax(90px, 1fr) minmax(95px, 1fr) minmax(70px, 0.8fr) 36px",

    alignItems: "center",

    columnGap: "9px",

    minHeight: "42px",

    boxSizing: "border-box",

    padding: "6px 12px",

    background: THEME.surfaceStrong,

    borderTop: `1px solid ${THEME.borderStrong}`,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,
  },

  emiTotalLabel: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,

    letterSpacing: "0.035em",

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

    fontSize: "12px",

    fontWeight: 800,

    lineHeight: 1.2,
  },

  emiTotalStatus: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    lineHeight: 1.2,

    textTransform: "uppercase",

    textAlign: "center",
  },

  // ==========================================================
  // SCHEDULE COMPATIBILITY
  // ==========================================================

  schedule: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    margin: 0,

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    overflow: "hidden",

    background: THEME.surface,

    fontFamily: INTER_FONT,
  },

  scheduleHeaderRow: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "8px",

    width: "100%",

    boxSizing: "border-box",

    padding: "9px 11px",

    background: THEME.surfaceStrong,

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
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

    padding: "8px 10px",

    background: THEME.surfaceStrong,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

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

    minHeight: "36px",

    padding: "6px 10px",

    background: THEME.surface,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  scheduleTableCell: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 700,
  },

  emiName: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,
  },

  emiAmount: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

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

    minHeight: "22px",

    boxSizing: "border-box",

    padding: "0 8px",

    borderRadius: "999px",

    fontFamily: INTER_FONT,

    fontSize: "7px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    lineHeight: 1,

    textTransform: "uppercase",

    whiteSpace: "nowrap",
  },

  statusPaid: {
    border: `1px solid ${THEME.success}`,

    background: THEME.successSoft,

    color: THEME.success,
  },

  statusPreclosed: {
    border: `1px solid ${THEME.info}`,

    background: THEME.infoSoft,

    color: THEME.info,
  },

  statusPending: {
    border: `1px solid ${THEME.borderStrong}`,

    background: THEME.surfaceSoft,

    color: THEME.textMuted,
  },

  statusOverdue: {
    border: `1px solid ${THEME.danger}`,

    background: THEME.dangerSoft,

    color: THEME.danger,

    fontWeight: 700,
  },

  // ==========================================================
  // SELECTION
  // ==========================================================

  selectCell: {
    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    minWidth: 0,

    fontFamily: INTER_FONT,
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

    width: "12px",

    height: "12px",

    flexShrink: 0,

    fontFamily: INTER_FONT,

    fontSize: "13px",

    lineHeight: 1,

    opacity: 0.78,
  },

  // ==========================================================
  // LOAD / ERROR / EMPTY
  // ==========================================================

  loadingSchedule: {
    width: "100%",

    boxSizing: "border-box",

    padding: "14px",

    background: THEME.surface,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 600,

    lineHeight: 1.4,

    textAlign: "center",
  },

  errorSchedule: {
    width: "100%",

    boxSizing: "border-box",

    padding: "14px",

    background: THEME.dangerSoft,

    color: THEME.danger,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 700,

    lineHeight: 1.4,

    textAlign: "center",
  },

  emptySchedule: {
    width: "100%",

    boxSizing: "border-box",

    padding: "14px",

    background: THEME.surface,

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // MANUAL COLLECTION
  // ==========================================================

  manualSection: {
    width: "100%",

    minWidth: 0,

    flex: "1 1 auto",

    boxSizing: "border-box",

    margin: 0,

    padding: 0,

    background: "transparent",

    border: "none",

    borderRadius: 0,

    fontFamily: INTER_FONT,
  },

  manualHeader: {
    display: "flex",

    flexDirection: "column",

    gap: "3px",

    marginBottom: "11px",

    fontFamily: INTER_FONT,
  },

  manualTitle: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 700,

    letterSpacing: "0.045em",

    lineHeight: 1.2,

    textTransform: "uppercase",
  },

  manualHint: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.35,
  },

  manualInputGrid: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "9px",

    boxSizing: "border-box",

    fontFamily: INTER_FONT,
  },

  manualField: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "6px",

    fontFamily: INTER_FONT,
  },

  manualFieldLabel: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    marginTop: "5px",

    fontWeight: 700,

    lineHeight: 1.2,

    letterSpacing: "0.035em",
  },

  manualInput: {
    width: "100%",

    minWidth: 0,

    minHeight: "42px",

    boxSizing: "border-box",

    marginTop: "1px",

    padding: "0 12px",

    appearance: "none",

    WebkitAppearance: "none",

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 750,

    lineHeight: 1.2,

    transition:
      "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
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

    marginTop: "10px",

    fontFamily: INTER_FONT,
  },

  valueCard: {
    minWidth: 0,

    minHeight: "54px",

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    alignItems: "flex-start",

    justifyContent: "center",

    gap: "3px",

    padding: "8px 10px",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    textAlign: "left",

    fontFamily: INTER_FONT,
  },

  valueCardActive: {
    background: THEME.brandSoft,

    border: `1px solid ${THEME.brand}`,
  },

  valueLabel: {
    width: "100%",

    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 750,

    lineHeight: 1.2,
  },

  value: {
    width: "100%",

    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 750,

    lineHeight: 1.1,

    letterSpacing: "-0.015em",
  },

  valueHint: {
    width: "100%",

    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "7px",

    fontWeight: 600,

    lineHeight: 1.2,
  },

  // ==========================================================
  // SELECTED EMI VALUE
  // ==========================================================

  compactValueCard: {
    width: "100%",

    minWidth: 0,

    minHeight: "58px",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "10px",

    boxSizing: "border-box",

    marginTop: "10px",

    padding: "10px 12px",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    fontFamily: INTER_FONT,
  },

  compactValueCardActive: {
    background: THEME.brandSoft,

    border: `1px solid ${THEME.brand}`,
  },

  compactValueContent: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "3px",

    fontFamily: INTER_FONT,
  },

  compactValueLabel: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 750,

    lineHeight: 1.2,
  },

  compactValueValue: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "16px",

    marginTop: "8px",

    fontWeight: 700,

    lineHeight: 1.1,

    letterSpacing: "-0.02em",

    whiteSpace: "nowrap",
  },

  compactValueHint: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "7px",

    fontWeight: 600,

    lineHeight: 1.25,
  },
};

// ============================================================
// END
// ============================================================
