// ============================================================
// FINORA ENTERPRISE OS™
// REPAYMENT STUDIO™
// REPAYMENT SUMMARY RESPONSIVE STYLES
//
// RESPONSIBILITY:
// - RepaymentSummary presentation only.
// - Consume FINORA Responsive Engine tokens.
// - Keep mobile / tablet / laptop / desktop geometry centralized.
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

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.38))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

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

export interface RepaymentSummaryStyles {
  cardStyle: CSSProperties;
  summaryGridStyle: CSSProperties;
  rowStyle: CSSProperties;
  highlightRowStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;
}

// ============================================================
// STYLE FACTORY
// ============================================================

export function createRepaymentSummaryStyles(
  tokens: ResponsiveTokens,
): RepaymentSummaryStyles {
  const compact =
    tokens.meta.viewport === "mobile" ||
    tokens.meta.viewport === "tablet";

  const mobile =
    tokens.meta.viewport === "mobile";

  const gridColumns =
    mobile
      ? "minmax(0, 1fr)"
      : compact
        ? "repeat(2, minmax(0, 1fr))"
        : "repeat(3, minmax(0, 1fr))";

  const gap =
    mobile
      ? Math.max(6, tokens.spacing.small)
      : Math.max(6, tokens.spacing.small);

  const rowPaddingY =
    mobile ? 6 : 6;

  const rowPaddingX =
    mobile ? 8 : 8;

  const labelFontSize =
    mobile ? 11 : 12;

  const valueFontSize =
    mobile ? 12 : 12;

  return {
    cardStyle: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",

      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    summaryGridStyle: {
      display: "grid",
      gridTemplateColumns: gridColumns,
      gap: `${gap}px`,
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
      minHeight: mobile ? "34px" : "31px",
      padding: `${rowPaddingY}px ${rowPaddingX}px`,
      boxSizing: "border-box",
      border: `1px solid ${THEME.border}`,
      borderRadius: "6px",
      background: THEME.panel,
      color: THEME.textMuted,
      fontSize: `${labelFontSize}px`,
      fontWeight: 500,
      lineHeight: 1.25,
    },

    highlightRowStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      minWidth: 0,
      minHeight: mobile ? "34px" : "31px",
      padding: `${rowPaddingY}px ${rowPaddingX}px`,
      boxSizing: "border-box",
      border: `1px solid ${THEME.borderStrong}`,
      borderRadius: "6px",
      background: `linear-gradient(90deg, ${THEME.primarySoft}, ${THEME.panel})`,
      color: THEME.textMuted,
      fontSize: `${labelFontSize}px`,
      fontWeight: 500,
      lineHeight: 1.25,
    },

    labelStyle: {
      minWidth: 0,
      flex: "1 1 auto",
      color: THEME.textMuted,
      fontSize: `${labelFontSize}px`,
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
      fontSize: `${valueFontSize + 1}px`,
      fontWeight: 650,
      lineHeight: 1.25,
      textAlign: "right",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  };
}

// ============================================================
// END
// ============================================================
