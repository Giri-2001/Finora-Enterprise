/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   FINORA COMMISSION CHART MODAL STYLES
============================================================ */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../utils/responsive/tokens";

export interface FinoraCommissionChartModalStyles {
  backdrop:
    CSSProperties;

  panel:
    CSSProperties;

  header:
    CSSProperties;

  headingGroup:
    CSSProperties;

  title:
    CSSProperties;

  subtitle:
    CSSProperties;

  iconButton:
    CSSProperties;

  table:
    CSSProperties;

  tableHeader:
    CSSProperties;

  tableHeaderLabel:
    CSSProperties;

  tableHeaderValue:
    CSSProperties;

  tableRow:
    CSSProperties;

  rowLabel:
    CSSProperties;

  rowValue:
    CSSProperties;
}

export function createFinoraCommissionChartModalStyles(
  tokens: ResponsiveTokens,
): FinoraCommissionChartModalStyles {
  const isMobile =
    tokens.meta.viewport === "mobile";

  return {
    backdrop: {
      position:
        "fixed",

      inset:
        0,

      zIndex:
        1650,

      padding:
        isMobile
          ? 12
          : 20,

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      boxSizing:
        "border-box",

      background:
        "var(--finora-theme-overlay-backdrop, rgba(15, 23, 42, 0.58))",

      backdropFilter:
        "blur(4px)",
    },

    panel: {
      width:
        isMobile
          ? "min(100%, 460px)"
          : "min(100%, 560px)",

      maxHeight:
        "min(88vh, 720px)",

      overflowY:
        "auto",

      padding:
        isMobile
          ? 16
          : 20,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        14,

      boxSizing:
        "border-box",

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        14,

      background:
        "var(--finora-theme-background-surface)",

      color:
        "var(--finora-theme-text-primary)",

      boxShadow:
        "0 22px 58px var(--finora-theme-overlay-shadow)",

      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",
    },

    header: {
      display:
        "flex",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    headingGroup: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        5,
    },

    title: {
      margin:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        isMobile
          ? 18
          : 19,

      lineHeight:
        1.3,

      fontWeight:
        750,
    },

    subtitle: {
      margin:
        0,

      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        13,

      lineHeight:
        1.5,

      fontWeight:
        550,
    },

    iconButton: {
      width:
        38,

      height:
        38,

      flexShrink:
        0,

      padding:
        0,

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        999,

      background:
        "var(--finora-theme-background-surface-muted)",

      color:
        "var(--finora-theme-text-secondary)",

      cursor:
        "pointer",

      boxSizing:
        "border-box",
    },

    table: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      overflow:
        "hidden",

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        10,

      background:
        "var(--finora-theme-background-surface-muted)",
    },

    tableHeader: {
      minHeight:
        42,

      padding:
        isMobile
          ? "0 11px"
          : "0 14px",

      display:
        "grid",

      gridTemplateColumns:
        isMobile
          ? "minmax(0, 1.45fr) minmax(110px, 0.85fr)"
          : "minmax(0, 1.6fr) minmax(150px, 0.8fr)",

      alignItems:
        "center",

      gap:
        10,

      borderBottom:
        "1px solid var(--finora-theme-border-default)",

      background:
        "var(--finora-theme-background-surface)",

      boxSizing:
        "border-box",
    },

    tableHeaderLabel: {
      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        12,

      lineHeight:
        1.35,

      fontWeight:
        700,
    },

    tableHeaderValue: {
      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        12,

      lineHeight:
        1.35,

      fontWeight:
        700,

      textAlign:
        "right",
    },

    tableRow: {
      minHeight:
        isMobile
          ? 54
          : 50,

      padding:
        isMobile
          ? "8px 11px"
          : "8px 14px",

      display:
        "grid",

      gridTemplateColumns:
        isMobile
          ? "minmax(0, 1.45fr) minmax(110px, 0.85fr)"
          : "minmax(0, 1.6fr) minmax(150px, 0.8fr)",

      alignItems:
        "center",

      gap:
        10,

      borderBottom:
        "1px solid var(--finora-theme-border-default)",

      boxSizing:
        "border-box",
    },

    rowLabel: {
      minWidth:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        isMobile
          ? 12.5
          : 13,

      lineHeight:
        1.4,

      fontWeight:
        600,
    },

    rowValue: {
      minWidth:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        isMobile
          ? 12.5
          : 13,

      lineHeight:
        1.4,

      fontWeight:
        700,

      textAlign:
        "right",

      whiteSpace:
        isMobile
          ? "normal"
          : "nowrap",
    },
  };
}