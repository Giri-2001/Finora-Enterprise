// ============================================================
// FINORA ENTERPRISE OS™
// REPAYMENT STUDIO™
// REPAYMENT PREVIEW CARD RESPONSIVE STYLES
//
// RESPONSIBILITY:
// - RepaymentPreviewCard presentation only.
// - Consume FINORA Responsive Engine tokens.
// - Compact two-column desktop/laptop presentation.
// - Two-column tablet presentation.
// - Single-column mobile presentation.
//
// IMPORTANT:
// - No business logic.
// - No calculations.
// - No viewport detection.
// - No local media queries.
// - Theme appearance comes from FINORA Theme CSS variables.
// ============================================================

import type { CSSProperties } from "react";

import type { ResponsiveTokens } from "../../../utils/responsive";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.38))",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",
} as const;

// ============================================================
// RESPONSIVE STYLE CONTRACT
// ============================================================

export interface RepaymentPreviewCardStyles {
  cardStyle: CSSProperties;
  previewGridStyle: CSSProperties;
  rowStyle: CSSProperties;
  highlightRowStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;
  primaryValueStyle: CSSProperties;
  fullWidthRowStyle: CSSProperties;
}

// ============================================================
// STYLE FACTORY
// ============================================================

export function createRepaymentPreviewCardStyles(
  tokens: ResponsiveTokens,
): RepaymentPreviewCardStyles {
  const mobile =
    tokens.meta.viewport === "mobile";

  const gridColumns =
    mobile
      ? "minmax(0, 1fr)"
      : "repeat(2, minmax(0, 1fr))";

  const gap =
    Math.max(6, tokens.spacing.small);

  return {
    cardStyle: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",

      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    previewGridStyle: {
      display: "grid",
      gridTemplateColumns: gridColumns,
      gap: `${gap}px ${Math.max(8, gap)}px`,
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      alignItems: "stretch",
    },

    rowStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      minWidth: 0,
      minHeight: mobile ? "40px" : "37px",
      padding: "6px 8px",
      boxSizing: "border-box",
      border: `1px solid ${THEME.border}`,
      borderRadius: "6px",
      background: THEME.panel,
      color: THEME.textMuted,
      fontSize: mobile ? "11px" : "12px",
      fontWeight: 500,
      lineHeight: 1.25,
    },

    highlightRowStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      minWidth: 0,
      minHeight: mobile ? "40px" : "37px",
      padding: "6px 8px",
      boxSizing: "border-box",
      border: `1px solid ${THEME.borderStrong}`,
      borderRadius: "6px",
      background: `linear-gradient(90deg, ${THEME.primarySoft}, ${THEME.panel})`,
      color: THEME.textMuted,
      fontSize: mobile ? "11px" : "12px",
      fontWeight: 500,
      lineHeight: 1.25,
    },

    labelStyle: {
      minWidth: 0,
      flex: "1 1 auto",
      color: THEME.textMuted,
      fontSize: mobile ? "11px" : "12px",
      fontWeight: 500,
      lineHeight: 1.25,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: mobile ? "normal" : "nowrap",
    },

    valueStyle: {
      minWidth: 0,
      flex: "0 1 auto",
      color: THEME.text,
      fontSize: mobile ? "12px" : "13px",
      fontWeight: 650,
      lineHeight: 1.25,
      textAlign: "right",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    primaryValueStyle: {
      minWidth: 0,
      flex: "0 1 auto",
      color: THEME.text,
      fontSize: mobile ? "13px" : "14px",
      fontWeight: 700,
      lineHeight: 1.25,
      textAlign: "right",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    fullWidthRowStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      minWidth: 0,
      minHeight: mobile ? "40px" : "37px",
      padding: "6px 8px",
      boxSizing: "border-box",
      border: `1px solid ${THEME.border}`,
      borderRadius: "6px",
      background: THEME.panel,
      color: THEME.textMuted,
      fontSize: mobile ? "11px" : "12px",
      fontWeight: 500,
      lineHeight: 1.25,
      gridColumn: "1 / -1",
    },
  };
}

// ============================================================
// END
// ============================================================
