import type {
  CSSProperties,
} from "react";


// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {

  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.48))",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.14))",

};


// ============================================================
// CARD
// ============================================================

export const cardStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  minWidth: 0,

  minHeight: 0,

  display: "flex",

  alignItems: "center",

  boxSizing: "border-box",

  padding: "7px 9px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius: "10px",

  background:
    THEME.panel,

  color:
    THEME.text,

  boxShadow:
  "none",

  overflow: "hidden",

};


// ============================================================
// STATISTICS GRID
// ============================================================

export const statisticsGridStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  gap: "7px",

  width: "100%",

  height: "108px",

  minWidth: 0,

  minHeight: "108px",

  boxSizing: "border-box",

};


// ============================================================
// STATISTIC ITEM
// ============================================================

export const statisticItemStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",

  alignItems: "flex-start",

  gap: "10px",

  width: "100%",

  height: "108px",

  minWidth: 0,

  minHeight: "108px",

  padding: "12px 13px",

  boxSizing: "border-box",

  border:
    `1px solid ${THEME.border}`,

  borderRadius: "9px",

  background:
    THEME.panelSoft,

  overflow: "hidden",

};


// ============================================================
// STATISTIC LABEL
// ============================================================

export const statisticLabelStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  color:
    THEME.textMuted,

  fontSize: "15px",

  fontWeight: 650,

  lineHeight: "15px",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

};


// ============================================================
// STATISTIC VALUE
// ============================================================

export const statisticValueStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  color:
    THEME.text,

  fontSize: "25px",

  fontWeight: 750,

  lineHeight: "27px",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

};


// ============================================================
// PRIMARY STATISTIC
// ============================================================

export const primaryStatisticItemStyle: CSSProperties = {

  ...statisticItemStyle,

  border:
    `1px solid ${THEME.borderStrong}`,

  background:
    `linear-gradient(
      135deg,
      ${THEME.primarySoft},
      ${THEME.panelSoft}
    )`,

    boxShadow:
    "none",

};


// ============================================================
// PRIMARY VALUE
// ============================================================

export const primaryValueStyle: CSSProperties = {

  ...statisticValueStyle,

  color:
    THEME.text,

};