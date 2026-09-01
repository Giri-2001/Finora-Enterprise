// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
//
// NOTIFICATIONS PAGE STYLES
//
// RESPONSIBILITY:
//
// - Notification Center workspace presentation.
// - Owner Notification list presentation.
// - Customer Delivery status presentation.
// - Read / unread visual state.
// - Delivery lifecycle status presentation.
// - Manual resend action presentation.
// - Loading / empty / error state presentation.
// - FINORA semantic theme-token consumption.
// - FINORA Responsive Engine token consumption.
//
// THEME CONTRACT:
//
// Notifications does NOT own a local theme engine.
//
// All visual colours are consumed through FINORA semantic
// variables with safe fallbacks.
//
// RESPONSIVE CONTRACT:
//
// Device classification is supplied by useResponsive().
// No breakpoint classification is performed in this file.
//
// IMPORTANT:
//
// - Presentation only.
// - No React state.
// - No repository access.
// - No service access.
// - No persistence logic.
// - No provider logic.
// - No local theme engine.
// - No local breakpoint engine.
// - No CSS media queries.
// - No window.innerWidth.
// - Inter only.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../utils/responsive/tokens";

// ============================================================
// THEME
// ============================================================

const THEME = {
  page:
    "var(--finora-theme-background-page, var(--finora-theme-page, #EEF1F5))",

  surface:
    "var(--finora-theme-background-surface, var(--finora-theme-surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-background-surface-muted, var(--finora-theme-surface-muted, #F5F7FA))",

  text:
    "var(--finora-theme-text-primary, #111827)",

  muted:
    "var(--finora-theme-text-muted, #6B7280)",

  inverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",

  border:
    "var(--finora-theme-border-default, #D5DCE5)",

  borderStrong:
    "var(--finora-theme-border-strong, #B8C0CC)",

  brand:
    "var(--finora-theme-brand-primary, #C69214)",

  brandSoft:
    "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  success:
    "var(--finora-theme-success, #23865A)",

  successSoft:
    "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",

  warning:
    "var(--finora-theme-warning, #B7791F)",

  warningSoft:
    "var(--finora-theme-warning-soft, rgba(183, 121, 31, 0.10))",

  danger:
    "var(--finora-theme-danger, #C43B3B)",

  dangerSoft:
    "var(--finora-theme-danger-soft, rgba(196, 59, 59, 0.10))",

  info:
    "var(--finora-theme-info, #2F6FB3)",

  infoSoft:
    "var(--finora-theme-info-soft, rgba(47, 111, 179, 0.10))",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
} as const;

// ============================================================
// FONT
// ============================================================

const INTER =
  "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// RESPONSIVE INPUT
// ============================================================

export interface NotificationsPageResponsiveInput {
  tokens:
    ResponsiveTokens;

  isMobile:
    boolean;

  isTablet:
    boolean;

  isLaptop:
    boolean;

  isDesktop:
    boolean;
}

// ============================================================
// STYLE CONTRACT
// ============================================================

export type NotificationsPageStyles =
  Record<
    string,
    CSSProperties
  >;

// ============================================================
// STYLE FACTORY
// ============================================================

export function getNotificationsPageStyles(
  input:
    NotificationsPageResponsiveInput,
): NotificationsPageStyles {
  const {
    tokens,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
  } = input;

  // ==========================================================
  // DEVICE GROUPS
  // ==========================================================

  const isCompact =
    isMobile ||
    isTablet;

  // ==========================================================
  // GEOMETRY
  // ==========================================================

  const pagePadding =
    tokens.spacing.medium;

  const sectionGap =
    isMobile
      ? tokens.spacing.medium
      : tokens.layout.contentGap;

  const panelPadding =
    isMobile
      ? tokens.spacing.medium
      : tokens.panel.padding;

  const metricColumns =
    isMobile
      ? 2
      : isTablet
        ? 3
        : 4;

  const workspaceColumns =
    isCompact
      ? "minmax(0, 1fr)"
      : isLaptop
        ? "minmax(0, 1.05fr) minmax(0, 1.35fr)"
        : "minmax(0, 1fr) minmax(0, 1.45fr)";

  const metadataColumns =
    isMobile
      ? "minmax(0, 1fr)"
      : "repeat(2, minmax(0, 1fr))";

  const toolbarColumns =
    isMobile
      ? "minmax(0, 1fr)"
      : "minmax(0, 1fr) auto";

  // ==========================================================
  // TYPOGRAPHY
  // ==========================================================

  const titleSize =
    isMobile
      ? tokens.typography.subheading
      : Math.min(
          tokens.typography.heading,
          24,
        );

  const sectionTitleSize =
    isMobile
      ? tokens.typography.label + 1
      : tokens.typography.subheading - 3;

  // ==========================================================
  // STYLES
  // ==========================================================

  return {
    // ========================================================
    // PAGE
    // ========================================================

    page: {
      width:
        "100%",

      minHeight:
        "100%",

      boxSizing:
        "border-box",

      background:
        THEME.page,

      color:
        THEME.text,

      fontFamily:
        INTER,
    },

    pageInner: {
      width:
        "100%",

      maxWidth:
        isCompact
          ? `${tokens.layout.maxContentWidth}px`
          : "none",

      margin:
        "0 auto",

      padding:
        `${pagePadding}px`,

      boxSizing:
        "border-box",

      fontFamily:
        INTER,
    },

    // ========================================================
    // PAGE HEADER
    // ========================================================

    header: {
      width:
        "100%",

      display:
        "flex",

      alignItems:
        isMobile
          ? "stretch"
          : "flex-start",

      justifyContent:
        "space-between",

      flexDirection:
        isMobile
          ? "column"
          : "row",

      gap:
        `${tokens.spacing.inline}px`,

      marginBottom:
        `${tokens.spacing.medium}px`,

      boxSizing:
        "border-box",
    },

    headerContent: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${Math.max(
          3,
          tokens.spacing.small / 2,
        )}px`,
    },

    eyebrow: {
      color:
        THEME.brand,

      fontSize:
        `${
          isMobile
            ? tokens.typography.caption
            : tokens.typography.small
        }px`,

      fontWeight:
        850,

      letterSpacing:
        "0.10em",

      textTransform:
        "uppercase",

      fontFamily:
        INTER,
    },

    title: {
      margin:
        0,

      color:
        THEME.text,

      fontSize:
        `${titleSize}px`,

      fontWeight:
        850,

      lineHeight:
        tokens.lineHeight.title,

      letterSpacing:
        "-0.015em",

      fontFamily:
        INTER,
    },

    subtitle: {
      margin:
        0,

      maxWidth:
        isMobile
          ? "100%"
          : "780px",

      color:
        THEME.muted,

      fontSize:
        `${
          isMobile
            ? tokens.typography.caption
            : tokens.typography.small
        }px`,

      fontWeight:
        500,

      lineHeight:
        tokens.lineHeight.body,

      fontFamily:
        INTER,
    },

    headerActions: {
      display:
        "flex",

      flexDirection:
        isMobile
          ? "column"
          : "row",

      alignItems:
        "stretch",

      gap:
        `${tokens.spacing.small}px`,

      flexShrink:
        0,
    },

    // ========================================================
    // BUTTONS
    // ========================================================

    primaryButton: {
      minHeight:
        `${Math.max(
          40,
          tokens.button.minHeight,
        )}px`,

      padding:
        `0 ${tokens.button.paddingX}px`,

      boxSizing:
        "border-box",

      background:
        THEME.brand,

      color:
        THEME.inverse,

      border:
        `${tokens.border.width}px solid ${THEME.brand}`,

      borderRadius:
        `${tokens.button.radius}px`,

      cursor:
        "pointer",

      fontSize:
        `${
          isMobile
            ? tokens.typography.caption
            : tokens.typography.small
        }px`,

      fontWeight:
        800,

      fontFamily:
        INTER,
    },

    secondaryButton: {
      minHeight:
        `${Math.max(
          40,
          tokens.button.minHeight,
        )}px`,

      padding:
        `0 ${tokens.button.paddingX}px`,

      boxSizing:
        "border-box",

      background:
        THEME.surfaceSoft,

      color:
        THEME.text,

      border:
        `${tokens.border.width}px solid ${THEME.borderStrong}`,

      borderRadius:
        `${tokens.button.radius}px`,

      cursor:
        "pointer",

      fontSize:
        `${
          isMobile
            ? tokens.typography.caption
            : tokens.typography.small
        }px`,

      fontWeight:
        800,

      fontFamily:
        INTER,
    },

    dangerButton: {
      minHeight:
        `${Math.max(
          36,
          tokens.button.minHeight,
        )}px`,

      padding:
        `0 ${tokens.button.paddingX}px`,

      boxSizing:
        "border-box",

      background:
        THEME.dangerSoft,

      color:
        THEME.danger,

      border:
        `${tokens.border.width}px solid ${THEME.danger}`,

      borderRadius:
        `${tokens.button.radius}px`,

      cursor:
        "pointer",

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        800,

      fontFamily:
        INTER,
    },

    disabledButton: {
      opacity:
        0.55,

      cursor:
        "not-allowed",
    },

    // ========================================================
    // METRICS
    // ========================================================

    metricGrid: {
      width:
        "100%",

      display:
        "grid",

      gridTemplateColumns:
        `repeat(${metricColumns}, minmax(0, 1fr))`,

      gap:
        `${tokens.spacing.inline}px`,

      marginBottom:
        `${sectionGap}px`,

      boxSizing:
        "border-box",
    },

    metricCard: {
      minWidth:
        0,

      minHeight:
        isMobile
          ? "72px"
          : "82px",

      display:
        "flex",

      flexDirection:
        "column",

      justifyContent:
        "center",

      gap:
        `${Math.max(
          3,
          tokens.spacing.small / 2,
        )}px`,

      padding:
        `${
          isMobile
            ? tokens.spacing.small + 2
            : tokens.spacing.inline
        }px`,

      boxSizing:
        "border-box",

      background:
        THEME.surface,

      border:
        `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius:
        `${tokens.control.radius + 2}px`,

      boxShadow:
        `0 4px 16px ${THEME.shadow}`,

      fontFamily:
        INTER,
    },

    metricLabel: {
      minWidth:
        0,

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",

      color:
        THEME.muted,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        750,

      textTransform:
        "uppercase",

      letterSpacing:
        "0.04em",

      lineHeight:
        tokens.lineHeight.compact,

      fontFamily:
        INTER,
    },

    metricValue: {
      minWidth:
        0,

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",

      whiteSpace:
        "nowrap",

      color:
        THEME.text,

      fontSize:
        `${
          isMobile
            ? tokens.typography.label
            : tokens.typography.body
        }px`,

      fontWeight:
        850,

      fontFamily:
        INTER,
    },

    metricUnread: {
      background:
        THEME.brandSoft,

      border:
        `${tokens.border.width}px solid ${THEME.brand}`,
    },

    metricFailed: {
      background:
        THEME.dangerSoft,

      border:
        `${tokens.border.width}px solid ${THEME.danger}`,
    },

    metricDelivered: {
      background:
        THEME.successSoft,

      border:
        `${tokens.border.width}px solid ${THEME.success}`,
    },

    // ========================================================
    // TOOLBAR
    // ========================================================

    toolbar: {
      width:
        "100%",

      display:
        "grid",

      gridTemplateColumns:
        toolbarColumns,

      gap:
        `${tokens.spacing.inline}px`,

      alignItems:
        "center",

      marginBottom:
        `${tokens.spacing.medium}px`,

      padding:
        `${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",

      background:
        THEME.surface,

      border:
        `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius:
        `${tokens.control.radius + 2}px`,

      boxShadow:
        `0 4px 16px ${THEME.shadow}`,
    },

    filterGroup: {
      minWidth:
        0,

      display:
        "flex",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        `${tokens.spacing.small}px`,
    },

    filterButton: {
      minHeight:
        `${Math.max(
          34,
          tokens.control.minHeight,
        )}px`,

      padding:
        `0 ${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",

      background:
        THEME.surfaceSoft,

      color:
        THEME.text,

      border:
        `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius:
        `${tokens.control.radius}px`,

      cursor:
        "pointer",

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        750,

      fontFamily:
        INTER,
    },

    filterButtonActive: {
      background:
        THEME.brandSoft,

      color:
        THEME.text,

      border:
        `${Math.max(
          1.5,
          tokens.border.strongWidth,
        )}px solid ${THEME.brand}`,
    },

    toolbarMeta: {
      color:
        THEME.muted,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        650,

      textAlign:
        isMobile
          ? "left"
          : "right",

      fontFamily:
        INTER,
    },

    // ========================================================
    // WORKSPACE
    // ========================================================

    workspace: {
      width:
        "100%",

      display:
        "grid",

      gridTemplateColumns:
        workspaceColumns,

      gap:
        `${sectionGap}px`,

      alignItems:
        "start",

      boxSizing:
        "border-box",
    },

    panel: {
      minWidth:
        0,

      width:
        "100%",

      padding:
        `${panelPadding}px`,

      boxSizing:
        "border-box",

      background:
        THEME.surface,

      border:
        `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius:
        `${tokens.panel.radius}px`,

      boxShadow:
        `0 4px 18px ${THEME.shadow}`,

      fontFamily:
        INTER,
    },

    panelHeader: {
      width:
        "100%",

      display:
        "flex",

      alignItems:
        isMobile
          ? "flex-start"
          : "center",

      justifyContent:
        "space-between",

      flexDirection:
        isMobile
          ? "column"
          : "row",

      gap:
        `${tokens.spacing.inline}px`,

      paddingBottom:
        `${tokens.spacing.medium}px`,

      marginBottom:
        `${tokens.spacing.medium}px`,

      borderBottom:
        `${tokens.border.width}px solid ${THEME.border}`,

      boxSizing:
        "border-box",
    },

    panelHeading: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        "2px",
    },

    panelTitle: {
      margin:
        0,

      color:
        THEME.text,

      fontSize:
        `${sectionTitleSize}px`,

      fontWeight:
        850,

      lineHeight:
        tokens.lineHeight.compact,

      fontFamily:
        INTER,
    },

    panelSubtitle: {
      margin:
        0,

      color:
        THEME.muted,

      fontSize:
        `${tokens.typography.caption}px`,

      lineHeight:
        tokens.lineHeight.body,

      fontFamily:
        INTER,
    },

    countBadge: {
      minWidth:
        "30px",

      minHeight:
        "28px",

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        `0 ${tokens.spacing.small}px`,

      boxSizing:
        "border-box",

      background:
        THEME.surfaceSoft,

      color:
        THEME.text,

      border:
        `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius:
        "999px",

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        850,

      fontFamily:
        INTER,
    },

    // ========================================================
    // LIST
    // ========================================================

    list: {
      width:
        "100%",

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",
    },

    listItem: {
      minWidth:
        0,

      width:
        "100%",

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${tokens.spacing.inline}px`,

      padding:
        `${
          isMobile
            ? tokens.spacing.inline
            : tokens.spacing.medium
        }px`,

      boxSizing:
        "border-box",

      background:
        THEME.surfaceSoft,

      border:
        `${tokens.border.width}px solid ${THEME.border}`,

      borderRadius:
        `${tokens.control.radius + 2}px`,

      fontFamily:
        INTER,
    },

    unreadListItem: {
      background:
        THEME.brandSoft,

      border:
        `${Math.max(
          1.5,
          tokens.border.strongWidth,
        )}px solid ${THEME.brand}`,
    },

    listItemTop: {
      minWidth:
        0,

      width:
        "100%",

      display:
        "flex",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      flexDirection:
        isMobile
          ? "column"
          : "row",

      gap:
        `${tokens.spacing.inline}px`,
    },

    listItemContent: {
      minWidth:
        0,

      flex:
        1,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${Math.max(
          3,
          tokens.spacing.small / 2,
        )}px`,
    },

    listItemTitle: {
      margin:
        0,

      minWidth:
        0,

      overflowWrap:
        "anywhere",

      color:
        THEME.text,

      fontSize:
        `${tokens.typography.small}px`,

      fontWeight:
        850,

      lineHeight:
        tokens.lineHeight.compact,

      fontFamily:
        INTER,
    },

    listItemMessage: {
      margin:
        0,

      minWidth:
        0,

      overflowWrap:
        "anywhere",

      whiteSpace:
        "pre-wrap",

      color:
        THEME.muted,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        500,

      lineHeight:
        tokens.lineHeight.body,

      fontFamily:
        INTER,
    },

    listItemActions: {
      display:
        "flex",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      justifyContent:
        isMobile
          ? "flex-start"
          : "flex-end",

      gap:
        `${tokens.spacing.small}px`,

      flexShrink:
        0,
    },

    compactActionButton: {
      minHeight:
        "34px",

      padding:
        `0 ${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",

      background:
        THEME.surface,

      color:
        THEME.text,

      border:
        `${tokens.border.width}px solid ${THEME.borderStrong}`,

      borderRadius:
        `${tokens.control.radius}px`,

      cursor:
        "pointer",

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        800,

      fontFamily:
        INTER,
    },

    // ========================================================
    // META
    // ========================================================

    metadataGrid: {
      width:
        "100%",

      display:
        "grid",

      gridTemplateColumns:
        metadataColumns,

      gap:
        `${tokens.spacing.small}px ${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",
    },

    metadataItem: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        "2px",
    },

    metadataLabel: {
      minWidth:
        0,

      color:
        THEME.muted,

      fontSize:
        `${Math.max(
          9,
          tokens.typography.caption - 1,
        )}px`,

      fontWeight:
        750,

      textTransform:
        "uppercase",

      letterSpacing:
        "0.04em",

      fontFamily:
        INTER,
    },

    metadataValue: {
      minWidth:
        0,

      overflowWrap:
        "anywhere",

      color:
        THEME.text,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        650,

      lineHeight:
        tokens.lineHeight.compact,

      fontFamily:
        INTER,
    },

    failureText: {
      margin:
        0,

      padding:
        `${tokens.spacing.small}px ${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",

      background:
        THEME.dangerSoft,

      color:
        THEME.danger,

      border:
        `${tokens.border.width}px solid ${THEME.danger}`,

      borderRadius:
        `${tokens.control.radius}px`,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        650,

      lineHeight:
        tokens.lineHeight.body,

      overflowWrap:
        "anywhere",

      fontFamily:
        INTER,
    },

    // ========================================================
    // BADGES
    // ========================================================

    badge: {
      minHeight:
        "26px",

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        `0 ${tokens.spacing.small}px`,

      boxSizing:
        "border-box",

      borderRadius:
        "999px",

      fontSize:
        `${Math.max(
          9,
          tokens.typography.caption - 1,
        )}px`,

      fontWeight:
        850,

      letterSpacing:
        "0.03em",

      textTransform:
        "uppercase",

      whiteSpace:
        "nowrap",

      fontFamily:
        INTER,
    },

    badgeNeutral: {
      background:
        THEME.surface,

      color:
        THEME.muted,

      border:
        `${tokens.border.width}px solid ${THEME.borderStrong}`,
    },

    badgeBrand: {
      background:
        THEME.brandSoft,

      color:
        THEME.text,

      border:
        `${tokens.border.width}px solid ${THEME.brand}`,
    },

    badgeInfo: {
      background:
        THEME.infoSoft,

      color:
        THEME.info,

      border:
        `${tokens.border.width}px solid ${THEME.info}`,
    },

    badgeSuccess: {
      background:
        THEME.successSoft,

      color:
        THEME.success,

      border:
        `${tokens.border.width}px solid ${THEME.success}`,
    },

    badgeWarning: {
      background:
        THEME.warningSoft,

      color:
        THEME.warning,

      border:
        `${tokens.border.width}px solid ${THEME.warning}`,
    },

    badgeDanger: {
      background:
        THEME.dangerSoft,

      color:
        THEME.danger,

      border:
        `${tokens.border.width}px solid ${THEME.danger}`,
    },

    // ========================================================
    // LOADING / EMPTY / ERROR
    // ========================================================

    stateBox: {
      width:
        "100%",

      minHeight:
        isMobile
          ? "120px"
          : "160px",

      display:
        "flex",

      flexDirection:
        "column",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        `${tokens.spacing.small}px`,

      padding:
        `${tokens.spacing.large}px`,

      boxSizing:
        "border-box",

      textAlign:
        "center",

      color:
        THEME.muted,

      fontFamily:
        INTER,
    },

    stateTitle: {
      margin:
        0,

      color:
        THEME.text,

      fontSize:
        `${tokens.typography.label}px`,

      fontWeight:
        850,

      fontFamily:
        INTER,
    },

    stateText: {
      margin:
        0,

      maxWidth:
        isMobile
          ? "100%"
          : "460px",

      color:
        THEME.muted,

      fontSize:
        `${tokens.typography.caption}px`,

      lineHeight:
        tokens.lineHeight.body,

      fontFamily:
        INTER,
    },

    errorBox: {
      width:
        "100%",

      marginBottom:
        `${tokens.spacing.medium}px`,

      padding:
        `${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",

      background:
        THEME.dangerSoft,

      color:
        THEME.danger,

      border:
        `${tokens.border.width}px solid ${THEME.danger}`,

      borderRadius:
        `${tokens.control.radius}px`,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        650,

      lineHeight:
        tokens.lineHeight.body,

      overflowWrap:
        "anywhere",

      fontFamily:
        INTER,
    },

    successBox: {
      width:
        "100%",

      marginBottom:
        `${tokens.spacing.medium}px`,

      padding:
        `${tokens.spacing.inline}px`,

      boxSizing:
        "border-box",

      background:
        THEME.successSoft,

      color:
        THEME.success,

      border:
        `${tokens.border.width}px solid ${THEME.success}`,

      borderRadius:
        `${tokens.control.radius}px`,

      fontSize:
        `${tokens.typography.caption}px`,

      fontWeight:
        650,

      lineHeight:
        tokens.lineHeight.body,

      overflowWrap:
        "anywhere",

      fontFamily:
        INTER,
    },

    // ========================================================
    // RESPONSIVE META
    // ========================================================

    responsiveMeta: {
      display:
        "none",

      width:
        isDesktop
          ? "4px"
          : isLaptop
            ? "3px"
            : isTablet
              ? "2px"
              : "1px",
    },
  };
}

// ============================================================
// END
// ============================================================