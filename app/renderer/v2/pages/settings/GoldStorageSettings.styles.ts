// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD STORAGE SETTINGS STYLES
//
// RESPONSIBILITY:
//
// - Gold Storage Settings presentation.
// - FINORA semantic Theme Engine token consumption.
// - FINORA Responsive Engine token consumption.
// - Room / Locker / Rack configuration workspace.
// - Capacity configuration presentation.
// - Status / validation / persistence feedback presentation.
//
// THEME CONTRACT:
//
// This module does NOT own a local theme engine.
//
// All active FINORA themes flow through semantic variables:
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
// --finora-theme-warning
// --finora-theme-warning-soft
// --finora-theme-danger
// --finora-theme-danger-soft
// --finora-theme-overlay-shadow
//
// RESPONSIVE CONTRACT:
//
// Mobile   : canonical FINORA mobile
// Tablet   : canonical FINORA tablet
// Laptop   : canonical FINORA laptop
// Desktop  : canonical FINORA desktop
//
// Device classification is supplied by useResponsive().
//
// IMPORTANT:
//
// - Presentation only.
// - No React.
// - No persistence.
// - No repository access.
// - No Gold occupancy calculations.
// - No local breakpoints.
// - No CSS media queries.
// - No window.innerWidth.
// - No hardcoded Room / Locker / Rack counts.
// - No hardcoded Rack capacity.
// - Inter only.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type { CSSProperties } from "react";

import type { ResponsiveTokens } from "../../utils/responsive/tokens";

/* ============================================================
   THEME
============================================================ */

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

  warning: "var(--finora-theme-warning, #B7791F)",

  warningSoft: "var(--finora-theme-warning-soft, rgba(183, 121, 31, 0.10))",

  danger: "var(--finora-theme-danger, #C24141)",

  dangerSoft: "var(--finora-theme-danger-soft, rgba(194, 65, 65, 0.10))",

  shadow: "var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
} as const;

/* ============================================================
   FONT
============================================================ */

const INTER = "Inter, ui-sans-serif, system-ui, sans-serif";

/* ============================================================
   RESPONSIVE INPUT
============================================================ */

export interface GoldStorageSettingsResponsiveInput {
  tokens: ResponsiveTokens;

  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;
}

/* ============================================================
   STYLE CONTRACT
============================================================ */

export type GoldStorageSettingsStyles = Record<string, CSSProperties>;

/* ============================================================
   STYLE FACTORY
============================================================ */

export function getGoldStorageSettingsStyles(
  input: GoldStorageSettingsResponsiveInput,
): GoldStorageSettingsStyles {
  const { tokens, isMobile, isTablet, isLaptop, isDesktop } = input;

  /* ==========================================================
     DEVICE GROUPS
  ========================================================== */

  const isCompact = isMobile || isTablet;

  /* ==========================================================
     PAGE GEOMETRY
  ========================================================== */

  const pagePadding = tokens.spacing.medium;

  const panelPadding = isMobile
    ? tokens.spacing.medium
    : isTablet
      ? tokens.spacing.medium
      : tokens.panel.padding;

  const workspaceGap = isMobile
    ? tokens.spacing.medium
    : tokens.layout.contentGap;

  /* ==========================================================
     HEADER
  ========================================================== */

  const headerDirection = isMobile ? "column" : "row";

  /* ==========================================================
     SUMMARY GRID
  ========================================================== */

  const summaryColumns = isMobile ? 2 : isTablet ? 4 : 4;

  /* ==========================================================
     WORKSPACE GRID

     Laptop / Desktop:
       Configuration Navigator | Editor

     Mobile / Tablet:
       Stacked
  ========================================================== */

  const workspaceColumns = isCompact
    ? "minmax(0, 1fr)"
    : isLaptop
      ? "minmax(240px, 0.78fr) minmax(0, 2.22fr)"
      : "minmax(280px, 0.72fr) minmax(0, 2.28fr)";

  /* ==========================================================
     CARD GRIDS
  ========================================================== */

  const roomColumns = isMobile ? 1 : isTablet ? 2 : isLaptop ? 3 : 4;

  const lockerColumns = isMobile ? 1 : isTablet ? 2 : isLaptop ? 3 : 4;

  const rackColumns = isMobile ? 1 : isTablet ? 2 : isLaptop ? 3 : 4;

  /* ==========================================================
     FORM GRID
  ========================================================== */

  const formColumns = isMobile
    ? "minmax(0, 1fr)"
    : isTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(3, minmax(0, 1fr))";

  /* ==========================================================
     TYPOGRAPHY
  ========================================================== */

  const titleSize = isMobile
    ? tokens.typography.subheading
    : Math.min(tokens.typography.heading, 24);

  const sectionTitleSize = isMobile
    ? tokens.typography.label
    : tokens.typography.subheading - 3;

  /* ==========================================================
     STYLES
  ========================================================== */

  return {
    /* ========================================================
       PAGE
    ======================================================== */

    page: {
      width: "100%",

      minHeight: "100%",

      boxSizing: "border-box",

      background: THEME.page,

      color: THEME.text,

      fontFamily: INTER,
    },

    pageInner: {
      width: "100%",

      maxWidth: isCompact ? `${tokens.layout.maxContentWidth}px` : "none",

      margin: "0 auto",

      padding: `${pagePadding}px`,

      boxSizing: "border-box",

      fontFamily: INTER,
    },

    /* ========================================================
       HEADER
    ======================================================== */

    header: {
      width: "100%",

      display: "flex",

      flexDirection: headerDirection,

      alignItems: isMobile ? "stretch" : "flex-start",

      justifyContent: "space-between",

      gap: `${tokens.spacing.medium}px`,

      marginBottom: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",
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

      maxWidth: isMobile ? "100%" : "820px",

      color: THEME.muted,

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 500,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    headerActions: {
      width: isMobile ? "100%" : "auto",

      display: "flex",

      flexDirection: isMobile ? "column" : "row",

      alignItems: "center",

      justifyContent: "flex-end",

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    /* ========================================================
       SUMMARY
    ======================================================== */

    summaryGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: `repeat(${summaryColumns}, minmax(0, 1fr))`,

      gap: `${tokens.spacing.inline}px`,

      marginBottom: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",
    },

    summaryCard: {
      minWidth: 0,

      minHeight: isMobile ? "72px" : "82px",

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      gap: `${Math.max(3, tokens.spacing.small / 2)}px`,

      padding: `${
        isMobile ? tokens.spacing.small + 2 : tokens.spacing.inline
      }px`,

      boxSizing: "border-box",

      background: THEME.surface,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius + 2}px`,

      boxShadow: `0 3px 14px ${THEME.shadow}`,

      fontFamily: INTER,
    },

    summaryLabel: {
      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: THEME.muted,

      fontSize: `${isMobile ? 9 : tokens.typography.caption}px`,

      fontWeight: 750,

      textTransform: "uppercase",

      letterSpacing: "0.04em",

      fontFamily: INTER,
    },

    summaryValue: {
      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: THEME.text,

      fontSize: `${
        isMobile ? tokens.typography.label : tokens.typography.body
      }px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    /* ========================================================
       STATUS / FEEDBACK
    ======================================================== */

    statusBanner: {
      width: "100%",

      display: "flex",

      alignItems: "flex-start",

      gap: `${tokens.spacing.inline}px`,

      padding: `${tokens.spacing.inline}px`,

      marginBottom: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",

      background: THEME.brandSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.brand}`,

      borderRadius: `${tokens.control.radius}px`,

      fontFamily: INTER,
    },

    successBanner: {
      background: THEME.successSoft,

      borderColor: THEME.success,
    },

    warningBanner: {
      background: THEME.warningSoft,

      borderColor: THEME.warning,
    },

    dangerBanner: {
      background: THEME.dangerSoft,

      borderColor: THEME.danger,
    },

    statusIcon: {
      width: `${tokens.icon.md}px`,

      height: `${tokens.icon.md}px`,

      minWidth: `${tokens.icon.md}px`,

      flexShrink: 0,

      color: THEME.brand,
    },

    statusContent: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "2px",
    },

    statusTitle: {
      color: THEME.text,

      fontSize: `${tokens.typography.small}px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    statusText: {
      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    /* ========================================================
       MAIN WORKSPACE
    ======================================================== */

    workspace: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: workspaceColumns,

      gap: `${workspaceGap}px`,

      alignItems: "start",

      boxSizing: "border-box",
    },

    /* ========================================================
       NAVIGATOR PANEL
    ======================================================== */

    navigator: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: `${tokens.spacing.inline}px`,

      padding: `${panelPadding}px`,

      boxSizing: "border-box",

      background: THEME.surface,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.panel.radius}px`,

      boxShadow: `0 4px 18px ${THEME.shadow}`,

      position: isCompact ? "relative" : "sticky",

      top: isCompact ? undefined : `${tokens.spacing.medium}px`,

      fontFamily: INTER,
    },

    navigatorHeader: {
      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    navigatorTitle: {
      margin: 0,

      color: THEME.text,

      fontSize: `${tokens.typography.label}px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    navigatorSubtitle: {
      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    navigatorList: {
      width: "100%",

      display: "flex",

      flexDirection: "column",

      gap: `${tokens.spacing.small}px`,

      boxSizing: "border-box",
    },

    navigatorItem: {
      width: "100%",

      minWidth: 0,

      minHeight: `${Math.max(44, tokens.control.minHeight)}px`,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      padding: `0 ${tokens.spacing.inline}px`,

      boxSizing: "border-box",

      background: THEME.surfaceSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius}px`,

      cursor: "pointer",

      textAlign: "left",

      fontFamily: INTER,
    },

    navigatorItemActive: {
      background: THEME.brandSoft,

      border: `${Math.max(
        1.5,
        tokens.border.strongWidth,
      )}px solid ${THEME.brand}`,
    },

    navigatorItemLabel: {
      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      fontSize: `${tokens.typography.small}px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    navigatorItemCount: {
      flexShrink: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      fontWeight: 750,

      fontFamily: INTER,
    },

    /* ========================================================
       EDITOR PANEL
    ======================================================== */

    editor: {
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

    editorHeader: {
      width: "100%",

      display: "flex",

      flexDirection: isMobile ? "column" : "row",

      alignItems: isMobile ? "stretch" : "center",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      paddingBottom: `${tokens.spacing.medium}px`,

      borderBottom: `${tokens.border.width}px solid ${THEME.border}`,

      boxSizing: "border-box",
    },

    editorHeading: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "2px",
    },

    editorTitle: {
      margin: 0,

      color: THEME.text,

      fontSize: `${sectionTitleSize}px`,

      fontWeight: 850,

      lineHeight: tokens.lineHeight.compact,

      fontFamily: INTER,
    },

    editorSubtitle: {
      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    editorActions: {
      width: isMobile ? "100%" : "auto",

      display: "flex",

      flexDirection: isMobile ? "column" : "row",

      alignItems: "center",

      justifyContent: "flex-end",

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    /* ========================================================
       SECTION
    ======================================================== */

    section: {
      width: "100%",

      marginTop: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",

      fontFamily: INTER,
    },

    sectionHeader: {
      width: "100%",

      display: "flex",

      flexDirection: isMobile ? "column" : "row",

      alignItems: isMobile ? "stretch" : "center",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      marginBottom: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    sectionHeading: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "2px",
    },

    sectionTitle: {
      margin: 0,

      color: THEME.text,

      fontSize: `${tokens.typography.label}px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    sectionSubtitle: {
      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    /* ========================================================
       ROOM / LOCKER / RACK GRIDS
    ======================================================== */

    roomGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: `repeat(${roomColumns}, minmax(0, 1fr))`,

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    lockerGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: `repeat(${lockerColumns}, minmax(0, 1fr))`,

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    rackGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: `repeat(${rackColumns}, minmax(0, 1fr))`,

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    /* ========================================================
       CONFIGURATION CARD
    ======================================================== */

    configurationCard: {
      minWidth: 0,

      width: "100%",

      display: "flex",

      flexDirection: "column",

      gap: `${tokens.spacing.inline}px`,

      padding: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",

      background: THEME.surfaceSoft,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius + 2}px`,

      fontFamily: INTER,
    },

    configurationCardSelected: {
      background: THEME.brandSoft,

      border: `${Math.max(
        1.5,
        tokens.border.strongWidth,
      )}px solid ${THEME.brand}`,
    },

    configurationCardHeader: {
      minWidth: 0,

      width: "100%",

      display: "flex",

      alignItems: "flex-start",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    configurationCardIdentity: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "2px",
    },

    configurationCardTitle: {
      margin: 0,

      minWidth: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: THEME.text,

      fontSize: `${tokens.typography.small}px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    configurationCardSubtitle: {
      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    configurationMeta: {
      width: "100%",

      display: "flex",

      flexWrap: "wrap",

      alignItems: "center",

      gap: `${tokens.spacing.small}px`,

      boxSizing: "border-box",
    },

    configurationMetric: {
      display: "inline-flex",

      alignItems: "center",

      gap: "4px",

      minHeight: "28px",

      padding: `0 ${tokens.spacing.small + 2}px`,

      boxSizing: "border-box",

      background: THEME.surface,

      color: THEME.muted,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: "999px",

      fontSize: `${tokens.typography.caption}px`,

      fontWeight: 750,

      fontFamily: INTER,
    },

    /* ========================================================
       STATUS CHIP
    ======================================================== */

    statusChip: {
      minHeight: "26px",

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: `0 ${tokens.spacing.small + 2}px`,

      boxSizing: "border-box",

      borderRadius: "999px",

      background: THEME.successSoft,

      color: THEME.success,

      border: `${tokens.border.width}px solid ${THEME.success}`,

      fontSize: `${tokens.typography.caption}px`,

      fontWeight: 850,

      whiteSpace: "nowrap",

      fontFamily: INTER,
    },

    inactiveStatusChip: {
      background: THEME.surface,

      color: THEME.muted,

      borderColor: THEME.borderStrong,
    },

    maintenanceStatusChip: {
      background: THEME.warningSoft,

      color: THEME.warning,

      borderColor: THEME.warning,
    },

    /* ========================================================
       FORM
    ======================================================== */

    formGrid: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: formColumns,

      gap: `${tokens.spacing.medium}px`,

      boxSizing: "border-box",
    },

    field: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: `${tokens.form.labelGap}px`,

      fontFamily: INTER,
    },

    fieldFull: {
      gridColumn: "1 / -1",
    },

    label: {
      color: THEME.text,

      fontSize: `${tokens.typography.caption}px`,

      fontWeight: 750,

      fontFamily: INTER,
    },

    requiredMark: {
      color: THEME.danger,

      fontWeight: 850,

      marginLeft: "3px",
    },

    input: {
      width: "100%",

      minWidth: 0,

      height: `${tokens.input.height}px`,

      minHeight: `${tokens.input.minHeight}px`,

      padding: `0 ${tokens.input.paddingX}px`,

      boxSizing: "border-box",

      outline: "none",

      background: THEME.surfaceSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.input.radius}px`,

      fontSize: `${tokens.input.fontSize}px`,

      fontWeight: 650,

      fontFamily: INTER,
    },

    select: {
      width: "100%",

      minWidth: 0,

      height: `${tokens.input.height}px`,

      minHeight: `${tokens.input.minHeight}px`,

      padding: `0 ${tokens.input.paddingX}px`,

      boxSizing: "border-box",

      outline: "none",

      background: THEME.surfaceSoft,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.input.radius}px`,

      fontSize: `${tokens.input.fontSize}px`,

      fontWeight: 650,

      fontFamily: INTER,
    },

    helperText: {
      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    /* ========================================================
       BUTTONS
    ======================================================== */

    primaryButton: {
      minHeight: `${Math.max(40, tokens.button.minHeight)}px`,

      padding: `0 ${tokens.button.paddingX}px`,

      boxSizing: "border-box",

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: `${tokens.spacing.small}px`,

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

    secondaryButton: {
      minHeight: `${Math.max(40, tokens.button.minHeight)}px`,

      padding: `0 ${tokens.button.paddingX}px`,

      boxSizing: "border-box",

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: `${tokens.spacing.small}px`,

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

    dangerButton: {
      minHeight: `${Math.max(40, tokens.button.minHeight)}px`,

      padding: `0 ${tokens.button.paddingX}px`,

      boxSizing: "border-box",

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: `${tokens.spacing.small}px`,

      background: THEME.dangerSoft,

      color: THEME.danger,

      border: `${tokens.border.width}px solid ${THEME.danger}`,

      borderRadius: `${tokens.button.radius}px`,

      cursor: "pointer",

      fontSize: `${
        isMobile ? tokens.typography.caption : tokens.typography.small
      }px`,

      fontWeight: 800,

      fontFamily: INTER,
    },

    iconButton: {
      width: `${Math.max(36, tokens.control.minHeight)}px`,

      height: `${Math.max(36, tokens.control.minHeight)}px`,

      minWidth: `${Math.max(36, tokens.control.minHeight)}px`,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: 0,

      boxSizing: "border-box",

      background: THEME.surface,

      color: THEME.text,

      border: `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius: `${tokens.control.radius}px`,

      cursor: "pointer",

      fontFamily: INTER,
    },

    disabledButton: {
      opacity: 0.48,

      cursor: "not-allowed",
    },

    mobileFullButton: {
      width: isMobile ? "100%" : undefined,
    },

    /* ========================================================
       EMPTY / LOADING
    ======================================================== */

    emptyState: {
      width: "100%",

      minHeight: isMobile ? "130px" : "170px",

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center",

      gap: `${tokens.spacing.small}px`,

      padding: `${tokens.spacing.large}px`,

      boxSizing: "border-box",

      background: THEME.surfaceSoft,

      color: THEME.muted,

      border: `${tokens.border.width}px dashed ${THEME.borderStrong}`,

      borderRadius: `${tokens.control.radius + 2}px`,

      textAlign: "center",

      fontFamily: INTER,
    },

    emptyStateIcon: {
      width: `${tokens.icon.lg}px`,

      height: `${tokens.icon.lg}px`,

      color: THEME.brand,
    },

    emptyStateTitle: {
      margin: 0,

      color: THEME.text,

      fontSize: `${tokens.typography.label}px`,

      fontWeight: 850,

      fontFamily: INTER,
    },

    emptyStateText: {
      margin: 0,

      maxWidth: isMobile ? "100%" : "480px",

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    loadingState: {
      width: "100%",

      minHeight: "180px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: THEME.muted,

      fontSize: `${tokens.typography.small}px`,

      fontWeight: 650,

      fontFamily: INTER,
    },

    /* ========================================================
       SAVE FOOTER
    ======================================================== */

    saveFooter: {
      width: "100%",

      display: "flex",

      flexDirection: isMobile ? "column" : "row",

      alignItems: isMobile ? "stretch" : "center",

      justifyContent: "space-between",

      gap: `${tokens.spacing.inline}px`,

      marginTop: `${tokens.spacing.large}px`,

      paddingTop: `${tokens.spacing.medium}px`,

      borderTop: `${tokens.border.width}px solid ${THEME.border}`,

      boxSizing: "border-box",
    },

    saveFooterText: {
      minWidth: 0,

      margin: 0,

      color: THEME.muted,

      fontSize: `${tokens.typography.caption}px`,

      lineHeight: tokens.lineHeight.body,

      fontFamily: INTER,
    },

    saveFooterActions: {
      width: isMobile ? "100%" : "auto",

      display: "flex",

      flexDirection: isMobile ? "column" : "row",

      alignItems: "center",

      justifyContent: "flex-end",

      gap: `${tokens.spacing.inline}px`,

      boxSizing: "border-box",
    },

    /* ========================================================
       RESPONSIVE DEBUG META
    ======================================================== */

    responsiveMeta: {
      display: "none",

      width: isDesktop ? "4px" : isLaptop ? "3px" : isTablet ? "2px" : "1px",
    },
  };
}

// ============================================================
// END
// ============================================================
