// ============================================================
// FINORA ENTERPRISE OS™
//
// REPORTS ENGINE™
//
// REPORTS PAGE STYLES
//
// RESPONSIBILITY:
//
// - Reports workspace presentation
// - FINORA semantic theme-token consumption
// - FINORA Responsive Engine token consumption
// - Mobile / Tablet / Laptop / Desktop layouts
// - Report selection cards
// - Report preview metrics
// - Export / Print / Share actions
//
// THEME CONTRACT:
//
// Reports does NOT own a local theme engine.
//
// All FINORA themes are consumed through semantic variables:
//
// --finora-theme-background-page
// --finora-theme-background-surface
// --finora-theme-background-surface-muted
// --finora-theme-text-primary
// --finora-theme-text-muted
// --finora-theme-text-inverse
// --finora-theme-border-default
// --finora-theme-border-strong
// --finora-theme-brand-primary
// --finora-theme-brand-accent-soft
// --finora-theme-success
// --finora-theme-success-soft
// --finora-theme-overlay-shadow
//
// Therefore all configured FINORA themes automatically apply
// to Reports without duplicating theme palettes here.
//
// RESPONSIVE CONTRACT:
//
// Mobile   : 0 - 767
// Tablet   : 768 - 1023
// Laptop   : 1024 - 1599
// Desktop  : 1600+
//
// Breakpoint classification is NOT performed here.
// ReportsPage passes the canonical device flags from
// useResponsive().
//
// IMPORTANT:
//
// - Presentation only
// - No business logic
// - No persistence logic
// - No local theme engine
// - No local breakpoint engine
// - No CSS media queries
// - No window.innerWidth
// - Inter only
//
// VERSION : 2.0
// STATUS  : Production Responsive
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import type { ResponsiveTokens } from "../../utils/responsive/tokens";

// ============================================================
// THEME
// ============================================================

const THEME = {
  page: "var(--finora-theme-background-page, var(--finora-theme-page, #EEF1F5))",

  surface:
    "var(--finora-theme-background-surface, var(--finora-theme-surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-background-surface-muted, var(--finora-theme-surface-muted, #F5F7FA))",

  text: "var(--finora-theme-text-primary, #111827)",

  muted: "var(--finora-theme-text-muted, #6B7280)",

  inverse: "var(--finora-theme-text-inverse, #FFFFFF)",

  border: "var(--finora-theme-border-default, #D5DCE5)",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  brand: "var(--finora-theme-brand-primary, #C69214)",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  success: "var(--finora-theme-success, #23865A)",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",

  shadow: "var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
} as const;

// ============================================================
// FONT
// ============================================================

const INTER = "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// RESPONSIVE INPUT
// ============================================================

export interface ReportsPageResponsiveInput {
  tokens: ResponsiveTokens;

  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

// ============================================================
// STYLE CONTRACT
// ============================================================

export type ReportsPageStyles = Record<string, CSSProperties>;

// ============================================================
// STYLE FACTORY
// ============================================================

export function getReportsPageStyles(
  input: ReportsPageResponsiveInput,
): ReportsPageStyles {
  const { tokens, isMobile, isTablet, isLaptop, isDesktop } = input;

  // ==========================================================
  // DEVICE GROUPS
  // ==========================================================

  const isCompact = isMobile || isTablet;

  // ==========================================================
  // PAGE GEOMETRY
  // ==========================================================

  const pagePadding = tokens.spacing.medium;

  const workspaceGap = isMobile
    ? tokens.spacing.medium
    : isTablet
      ? tokens.spacing.medium
      : tokens.layout.contentGap;

  const panelPadding = isMobile
    ? tokens.spacing.medium
    : isTablet
      ? tokens.spacing.medium
      : tokens.panel.padding;

  // ==========================================================
  // WORKSPACE
  // ==========================================================

  const workspaceColumns = isCompact
    ? "minmax(0, 1fr)"
    : isLaptop
      ? "minmax(220px, 0.80fr) minmax(0, 2.20fr)"
      : "minmax(260px, 0.78fr) minmax(0, 2.42fr)";

  // ==========================================================
  // REPORT MENU
  // ==========================================================

  const reportMenuColumns =
  isMobile
    ? "minmax(0, 1fr)"
    : isTablet
      ? "repeat(3, minmax(0, 1fr))"
      : undefined;

  // ==========================================================
  // CONTROLS
  // ==========================================================

  const controlColumns = isMobile
    ? "minmax(0, 1fr)"
    : "minmax(0, 2fr) minmax(0, 1fr)";

  // ==========================================================
  // METRICS
  // ==========================================================

  const metricColumns =
  isMobile
    ? 1
    : isTablet
      ? 2
      : isLaptop
        ? 3
        : 4;

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const actionColumns = isMobile ? 1 : 3;

  // ==========================================================
  // TYPOGRAPHY
  // ==========================================================

  const titleSize = isMobile
    ? tokens.typography.subheading
    : Math.min(tokens.typography.heading, 24);

  const panelTitleSize = isMobile
    ? tokens.typography.label + 1
    : tokens.typography.subheading - 3;

  const metricValueSize = isMobile
    ? tokens.typography.label
    : tokens.typography.body;

  // ==========================================================
  // STYLES
  // ==========================================================

  return {
    page: {
      width: "100%",

      minHeight: "100%",

      boxSizing: "border-box",

      background: THEME.page,

      color: THEME.text,

      fontFamily: INTER,
    },

    // ========================================================
    // PAGE INNER
    // ========================================================

    pageInner: {
      width: "100%",

      maxWidth:
  isMobile || isTablet
    ? `${tokens.layout.maxContentWidth}px`
    : "none",

      margin: "0 auto",

      boxSizing: "border-box",

      padding: `${pagePadding}px`,

      fontFamily: INTER,
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      width: "100%",

      display: "flex",

      alignItems: "flex-start",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",

      marginBottom: `${tokens.spacing.medium}px`,

      fontFamily: INTER,
    },

    headerContent: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: `${Math.max(3, tokens.spacing.small / 2)}px`,
    },

    eyebrow: {
      color: THEME.brand,

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 850,

      letterSpacing: "0.10em",

      textTransform: "uppercase",

      fontFamily: INTER,
    },

    title: {
      margin: 0,

      color: THEME.text,

      fontSize: `${titleSize}px`,

      fontWeight: 850,

      lineHeight: tokens.lineHeight.title,

      letterSpacing: "-0.015em",

      fontFamily: INTER,
    },

    subtitle: {
      margin: 0,

      maxWidth: isMobile ? "100%" : "760px",

      color: THEME.muted,

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 500,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    // ========================================================
    // WORKSPACE
    // ========================================================

    workspace: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: workspaceColumns,

      gap: `${workspaceGap}px`,

      alignItems: "start",

      boxSizing: "border-box",
    },

    // ========================================================
    // REPORT MENU
    // ========================================================

    reportMenu: {
      minWidth: 0,

      width: "100%",

      display: isCompact ? "grid" : "flex",

      gridTemplateColumns: reportMenuColumns,

      flexDirection: isCompact ? undefined : "column",

      gap: `${isMobile ? tokens.spacing.small : tokens.spacing.inline}px`,

      padding: `${isMobile ? tokens.spacing.small + 2 : panelPadding}px`,

      boxSizing: "border-box",

      background: THEME.surface,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.panel.radius}px`,

      boxShadow: `0 4px 18px ${THEME.shadow}`,

      fontFamily: INTER,

      position: isCompact ? "relative" : "sticky",

      top: isCompact ? undefined : `${tokens.spacing.medium}px`,
    },

    reportMenuTitle: {
      margin: 0,

      gridColumn: isCompact ? "1 / -1" : undefined,

      color: THEME.text,

      fontSize: `${tokens.typography.label}px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    reportOption: {
      width: "100%",

      minWidth: 0,

      minHeight: `${isMobile ? 46 : Math.max(50, tokens.control.minHeight)}px`,

      display: "flex",

      alignItems: "center",

      gap: `${tokens.spacing.inline}px`,

      padding: isMobile
        ? `${tokens.spacing.small}px`
        : `${tokens.spacing.small + 1}px ${tokens.spacing.inline}px`,

      boxSizing: "border-box",

      textAlign: "left",

      background: THEME.surfaceSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius + 1}px`,

      cursor: "pointer",

      fontFamily: INTER,

      overflow: "hidden",
    },

    reportOptionActive: {
      background: THEME.brandSoft,

      border: `${Math.max(
        1.5,
        tokens.border.strongWidth,
      )}px solid ${THEME.brand}`,
    },

    reportOptionIcon: {
      width: `${isMobile ? tokens.icon.md : tokens.icon.lg}px`,

      height: `${isMobile ? tokens.icon.md : tokens.icon.lg}px`,

      minWidth: `${isMobile ? tokens.icon.md : tokens.icon.lg}px`,

      flexShrink: 0,

      color: THEME.brand,
    },

    reportOptionText: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "2px",

      fontFamily: INTER,
    },

    reportOptionTitle: {
      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: THEME.text,

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    reportOptionSubtitle: {
      display: isMobile ? "none" : "block",

      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.compact,

      fontFamily: INTER,
    },

    // ========================================================
    // REPORT PANEL
    // ========================================================

    reportPanel: {
      minWidth: 0,

      width: "100%",

      padding: `${panelPadding}px`,

      boxSizing: "border-box",

      background: THEME.surface,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.panel.radius}px`,

      boxShadow: `0 4px 18px ${THEME.shadow}`,

      fontFamily: INTER,
    },

    panelHeader: {
      width: "100%",

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      gap: `${tokens.spacing.inline}px`,

      paddingBottom: `${tokens.spacing.medium}px`,

      borderBottom: `${tokens.border.width}px solid ${THEME.border}`,

      boxSizing: "border-box",
    },

    panelIcon: {
      width: `${tokens.icon.lg}px`,

      height: `${tokens.icon.lg}px`,

      minWidth: `${tokens.icon.lg}px`,

      flexShrink: 0,

      color: THEME.brand,
    },

    panelHeading: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "2px",
    },

    panelTitle: {
      margin: 0,

      color: THEME.text,

      fontSize: `${panelTitleSize}px`,

      fontWeight: 850,

      lineHeight: tokens.lineHeight.compact,

      fontFamily: INTER,
    },

    panelSubtitle: {
      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    // ========================================================
    // CONTROLS
    // ========================================================

    controlGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: controlColumns,

      gap: `${tokens.spacing.medium}px`,

      marginTop: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",
    },

    field: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: `${tokens.form.labelGap}px`,

      fontFamily: INTER,
    },

    label: {
      color: THEME.text,

      fontSize: `${tokens.typography.caption}px`,

      fontWeight: 750,

      fontFamily: INTER,
    },

    select: {
      width: "100%",

      minWidth: 0,

      height: `${tokens.input.height}px`,

      minHeight: `${tokens.input.minHeight}px`,

      boxSizing: "border-box",

      padding: `0 ${tokens.input.paddingX}px`,

      outline: "none",

      background: THEME.surfaceSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.input.radius}px`,

      fontSize: `${tokens.input.fontSize}px`,

      fontWeight: 650,

      fontFamily: INTER,
    },

    // ========================================================
    // PREVIEW
    // ========================================================

    preview: {
      width: "100%",

      marginTop: `${tokens.spacing.medium}px`,

      padding: `${
        isMobile ? tokens.spacing.small + 2 : tokens.spacing.medium
      }px`,

      boxSizing: "border-box",

      background: THEME.surfaceSoft,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius + 2}px`,

      fontFamily: INTER,
    },

    previewTitle: {
      margin: 0,

      minWidth: 0,

      overflowWrap: "anywhere",

      color: THEME.text,

      fontSize: `${tokens.typography.small}px`,

      fontWeight: 800,

      lineHeight: tokens.lineHeight.compact,

      fontFamily: INTER,
    },

    // ========================================================
    // METRICS
    // ========================================================

    metricGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: `repeat(${metricColumns}, minmax(0, 1fr))`,

      gap: `${isMobile ? tokens.spacing.small : tokens.spacing.inline}px`,

      marginTop: `${tokens.spacing.inline}px`,
    },

    metric: {
      minWidth: 0,

      minHeight: isMobile ? "64px" : "68px",

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      gap: `${Math.max(3, tokens.spacing.small / 2)}px`,

      padding: `${
        isMobile ? tokens.spacing.small + 1 : tokens.spacing.inline
      }px`,

      boxSizing: "border-box",

      background: THEME.surface,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius}px`,

      fontFamily: INTER,
    },

    metricLabel: {
      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      color: THEME.muted,

      fontSize: `${isMobile ? 9 : tokens.typography.caption}px`,

      fontWeight: 700,

      textTransform: "uppercase",

      letterSpacing: "0.04em",

      lineHeight: tokens.lineHeight.compact,

      fontFamily: INTER,
    },

    metricValue: {
      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: THEME.text,

      fontSize: `${metricValueSize}px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    outstandingMetric: {
      background: THEME.successSoft,

      border: `${tokens.border.width}px solid ${THEME.success}`,
    },

    outstandingValue: {
      color: THEME.success,
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actions: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: `repeat(${actionColumns}, minmax(0, 1fr))`,

      gap: `${tokens.spacing.inline}px`,

      marginTop: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",
    },

    secondaryButton: {
      width: "100%",

      minHeight: `${Math.max(40, tokens.button.minHeight)}px`,

      padding: `0 ${tokens.button.paddingX}px`,

      boxSizing: "border-box",

      background: THEME.surfaceSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.borderStrong}`,

      borderRadius: `${tokens.button.radius}px`,

      cursor: "pointer",

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    primaryButton: {
      width: "100%",

      minHeight: `${Math.max(40, tokens.button.minHeight)}px`,

      padding: `0 ${tokens.button.paddingX}px`,

      boxSizing: "border-box",

      background: THEME.brand,

      color: THEME.inverse,

      border: `${tokens.border.width}px solid ${THEME.brand}`,

      borderRadius: `${tokens.button.radius}px`,

      cursor: "pointer",

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    // ========================================================
    // EMPTY / LOADING
    // ========================================================

    emptyState: {
      width: "100%",

      minHeight: `${isMobile ? 120 : 160}px`,

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center",

      gap: `${tokens.spacing.small}px`,

      padding: `${tokens.spacing.large}px`,

      boxSizing: "border-box",

      textAlign: "center",

      color: THEME.muted,

      fontFamily: INTER,
    },

    emptyStateTitle: {
      color: THEME.text,

      fontSize: `${tokens.typography.label}px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    emptyStateText: {
      maxWidth: isMobile ? "100%" : "420px",

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    loadingText: {
      color: THEME.muted,

      fontSize: `${tokens.typography.small}px`,

      fontWeight: 600,

      fontFamily: INTER,
    },

    // ========================================================
    // DEVICE INFORMATION
    //
    // Not rendered visually. These properties are useful only
    // for debugging through React DevTools if required.
    // ========================================================

    responsiveMeta: {
      display: "none",

      width: isDesktop ? "4px" : isLaptop ? "3px" : isTablet ? "2px" : "1px",
    },
  };
}

// ============================================================
// END
// ============================================================
