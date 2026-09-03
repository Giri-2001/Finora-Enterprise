/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOCKER ROOM STYLES

   MODULE  : Gold Loan
   LAYER   : Presentation Styles
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Style Gold Locker Room panel
   - Style Room selection control
   - Style Locker cards
   - Style Locker occupancy states
   - Style Locker progress
   - Style Locker allocation action
   - Style always-active Locker VIEW action
   - Style selected Locker state
   - Style empty states
   - Preserve FINORA 5-theme compatibility
   - Preserve Gold Loan responsive geometry

   IMPORTANT:

   - No React component logic.
   - No persistence.
   - No storage mutation.
   - No business calculations.
   - No breakpoint logic.
   - No hardcoded theme palette.
   - No native HTML input styling dependency.
   - Custom controls consume these styles.

   LOCKER RULE:

   AVAILABLE
      → selectable
      → VIEW enabled

   FULL
      → allocation disabled
      → VIEW enabled

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type { GoldOccupancyStatus } from "../../types/gold-loan/goldStorage.types";

import type {
  GoldLoanLockerCardLayout,
  GoldLoanLockerRoomLayout,
  GoldLoanModuleTokens,
} from "../../utils/responsive/goldloan/goldLoan.index";

/* ===========================================================
   STYLE INPUT
=========================================================== */

export interface GoldLockerRoomStylesInput {
  moduleTokens: GoldLoanModuleTokens;

  lockerRoom: GoldLoanLockerRoomLayout;

  lockerCard: GoldLoanLockerCardLayout;

  isMobile: boolean;
}

/* ===========================================================
   LOCKER CARD STATE INPUT
=========================================================== */

export interface GoldLockerCardStateStyleInput {
  occupancyStatus: GoldOccupancyStatus;

  selected: boolean;

  canAllocate: boolean;
}

/* ===========================================================
   LOCKER PROGRESS INPUT
=========================================================== */

export interface GoldLockerProgressStyleInput {
  occupancyStatus: GoldOccupancyStatus;

  occupancyPercentage: number;
}

/* ===========================================================
   LOCKER ALLOCATION BUTTON INPUT
=========================================================== */

export interface GoldLockerAllocationButtonStyleInput {
  selected: boolean;

  canAllocate: boolean;
}

/* ===========================================================
   ROOM OPTION STATE
=========================================================== */

export interface GoldRoomOptionStateStyleInput {
  selected: boolean;

  disabled: boolean;
}

/* ===========================================================
   STYLE RESULT
=========================================================== */

export interface GoldLockerRoomStyles {
  root: CSSProperties;

  header: CSSProperties;

  headingGroup: CSSProperties;

  headingIcon: CSSProperties;

  headingTextGroup: CSSProperties;

  title: CSSProperties;

  subtitle: CSSProperties;

  roomControlArea: CSSProperties;

  lockerControlArea: CSSProperties;

  controlLabel: CSSProperties;

  roomSelector: CSSProperties;

  roomSelectorButton: CSSProperties;

  roomSelectorButtonContent: CSSProperties;

  roomSelectorIcon: CSSProperties;

  roomSelectorTextGroup: CSSProperties;

  roomSelectorPrimary: CSSProperties;

  roomSelectorSecondary: CSSProperties;

  roomSelectorChevron: CSSProperties;

  roomMenu: CSSProperties;

  lockerMenu: CSSProperties;

  roomOption: CSSProperties;

  roomOptionIdentity: CSSProperties;

  roomOptionIcon: CSSProperties;

  roomOptionTextGroup: CSSProperties;

  roomOptionName: CSSProperties;

  roomOptionMeta: CSSProperties;

  roomOptionCheck: CSSProperties;

  overview: CSSProperties;

  overviewMetric: CSSProperties;

  overviewMetricLabel: CSSProperties;

  overviewMetricValue: CSSProperties;

  overviewMetricSubtext: CSSProperties;

  lockerSection: CSSProperties;

  lockerSectionHeader: CSSProperties;

  lockerSectionTitleGroup: CSSProperties;

  lockerSectionTitle: CSSProperties;

  lockerSectionSubtitle: CSSProperties;

  lockerCountBadge: CSSProperties;

  lockerGrid: CSSProperties;

  lockerCard: CSSProperties;

  lockerHeader: CSSProperties;

  lockerIdentity: CSSProperties;

  lockerIcon: CSSProperties;

  lockerTitleGroup: CSSProperties;

  lockerTitle: CSSProperties;

  lockerCode: CSSProperties;

  lockerHeaderActions: CSSProperties;

  lockerViewButton: CSSProperties;

  lockerStatusBadge: CSSProperties;

  occupancyBlock: CSSProperties;

  occupancyRow: CSSProperties;

  occupancyLabel: CSSProperties;

  occupancyValue: CSSProperties;

  progressTrack: CSSProperties;

  availabilityText: CSSProperties;

  lockerMetrics: CSSProperties;

  lockerMetric: CSSProperties;

  lockerMetricLabel: CSSProperties;

  lockerMetricValue: CSSProperties;

  lockerFooter: CSSProperties;

  selectLockerButton: CSSProperties;

  selectedIndicator: CSSProperties;

  emptyState: CSSProperties;

  emptyIcon: CSSProperties;

  emptyTitle: CSSProperties;

  emptyDescription: CSSProperties;
}

/* ===========================================================
   BASE STYLES
=========================================================== */

export function getGoldLockerRoomStyles(
  input: GoldLockerRoomStylesInput,
): GoldLockerRoomStyles {
  const { moduleTokens, lockerRoom, lockerCard, isMobile } = input;

  return {
    /* =======================================================
       ROOT
    ======================================================= */

    root: {
      width: "100%",

      minWidth: 0,

      minHeight: lockerRoom.minHeight,

      display: "flex",

      flexDirection: "column",

      gap: lockerRoom.headerGap,

      padding: lockerRoom.padding,

      borderRadius: lockerRoom.radius,

      border: "1px solid var(--finora-theme-border-default)",

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",
    },

    /* =======================================================
       HEADER
    ======================================================= */

    header: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.cardGap,

      boxSizing: "border-box",
    },

    headingGroup: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    headingIcon: {
      width: 34,

      height: 34,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      color: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",

      border: "1px solid var(--finora-theme-border-subtle)",

      boxSizing: "border-box",
    },

    headingTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    title: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionTitle,

      fontWeight: 780,

      lineHeight: 1.2,

      letterSpacing: "-0.018em",
    },

    subtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.sectionSubtitle,

      fontWeight: 500,

      lineHeight: 1.45,
    },

    /* =======================================================
       ROOM CONTROL
    ======================================================= */

    roomControlArea: {
      minWidth: isMobile ? "100%" : 230,

      display: "flex",

      flexDirection: "column",

      gap: 5,
    },

    lockerControlArea: {
      minWidth: isMobile ? "100%" : 230,

      display: "flex",
      flexDirection: "column",

      gap: 5,

      position: "relative",

      zIndex: 500,

      isolation: "isolate",
    },

    controlLabel: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldLabel,

      fontWeight: 700,

      lineHeight: 1.3,
    },

    roomSelector: {
      width: "100%",

      minWidth: 0,

      position: "relative",
    },

    roomSelectorButton: {
      width: "100%",

      minWidth: 0,

      height: moduleTokens.control.inputHeight,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.control.controlGap,

      padding: `0 ${moduleTokens.control.inputPaddingX}px`,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    },

    roomSelectorButtonContent: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    roomSelectorIcon: {
      width: 28,

      height: 28,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      color: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",
    },

    roomSelectorTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      alignItems: "flex-start",

      gap: 1,
    },

    roomSelectorPrimary: {
      maxWidth: "100%",

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 740,

      lineHeight: 1.25,
    },

    roomSelectorSecondary: {
      maxWidth: "100%",

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.2,
    },

    roomSelectorChevron: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-text-muted)",
    },

    roomMenu: {
      width: "100%",

      maxHeight: 260,

      overflowY: "auto",

      position: "absolute",

      top: `calc(100% + ${moduleTokens.spacing.compactGap}px)`,

      left: 0,

      zIndex: 50,

      display: "flex",

      flexDirection: "column",

      gap: 4,

      padding: 6,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      boxSizing: "border-box",
    },

    lockerMenu: {
      width: isMobile ? "100%" : 420,

      maxWidth: isMobile
        ? "100%"
        : "min(420px, calc(100vw - 48px))",

      maxHeight: isMobile ? 380 : 400,

      overflowY: "auto",
      overflowX: "hidden",

      position: "absolute",

      top: `calc(100% + ${moduleTokens.spacing.compactGap}px)`,

      right: 0,
      left: "auto",

      zIndex: 1000,

      display: "flex",
      flexDirection: "column",

      gap: moduleTokens.spacing.compactGap,

      padding: 10,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.inputRadius,

      backgroundColor: "var(--finora-theme-background-muted)",

      backgroundImage: "none",

      opacity: 1,

      boxShadow:
        "0 24px 60px rgba(15, 23, 42, 0.30), 0 8px 24px rgba(15, 23, 42, 0.16)",

      isolation: "isolate",

      boxSizing: "border-box",
    },

    roomOption: {
      width: "100%",

      minHeight: 46,

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,

      padding: "7px 9px",

      border: "1px solid transparent",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "transparent",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      cursor: "pointer",

      textAlign: "left",

      outline: "none",

      boxSizing: "border-box",
    },

    roomOptionIdentity: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    roomOptionIcon: {
      width: 28,

      height: 28,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      color: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",
    },

    roomOptionTextGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 1,
    },

    roomOptionName: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "inherit",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 700,
    },

    roomOptionMeta: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,
    },

    roomOptionCheck: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color: "var(--finora-theme-success)",
    },

    /* =======================================================
       ROOM OVERVIEW
    ======================================================= */

    overview: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",

      gap: moduleTokens.spacing.compactGap,
    },

    overviewMetric: {
      minWidth: 0,

      minHeight: moduleTokens.metric.minHeight,

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      gap: 3,

      padding: moduleTokens.metric.padding,

      borderRadius: moduleTokens.metric.radius,

      border: "1px solid var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    overviewMetricLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricLabel,

      fontWeight: 700,

      lineHeight: 1.25,

      textTransform: "uppercase",

      letterSpacing: "0.035em",
    },

    overviewMetricValue: {
      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.metricValue,

      fontWeight: 800,

      lineHeight: 1.15,
    },

    overviewMetricSubtext: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 550,

      lineHeight: 1.3,
    },

    /* =======================================================
       LOCKER SECTION
    ======================================================= */

    lockerSection: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      background: "var(--finora-theme-background-primary)",

    },

    lockerSectionHeader: {
      width: "100%",

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    lockerSectionTitleGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,
    },

    lockerSectionTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 760,

      lineHeight: 1.25,
    },

    lockerSectionSubtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardSubtitle,

      fontWeight: 500,

      lineHeight: 1.4,
    },

    lockerCountBadge: {
      minHeight: 27,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 9px",

      borderRadius: 999,

      border: "1px solid var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 700,

      whiteSpace: "nowrap",

      boxSizing: "border-box",
    },

    lockerGrid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${lockerRoom.lockerGridColumns}, minmax(0, 1fr))`,

      gap: lockerRoom.lockerGap,

      alignItems: "stretch",

      boxSizing: "border-box",
    },

    /* =======================================================
       LOCKER CARD
    ======================================================= */

    lockerCard: {
      width: "100%",

      minWidth: 0,

      minHeight: lockerCard.minHeight,

      display: "flex",

      flexDirection: "column",

      gap: lockerCard.gap,

      padding: lockerCard.padding,

      borderRadius: lockerCard.radius,

      border: "1px solid var(--finora-theme-border-default)",

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",

      transition:
        "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    },

    lockerHeader: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      alignItems: "flex-start",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    lockerIdentity: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    lockerIcon: {
      width: 31,

      height: 31,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      border: "1px solid var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-brand-primary)",

      boxSizing: "border-box",
    },

    lockerTitleGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 1,
    },

    lockerTitle: {
      margin: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 780,

      lineHeight: 1.2,
    },

    lockerCode: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,

      lineHeight: 1.25,
    },

    lockerHeaderActions: {
      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      gap: 5,
    },

    /* =======================================================
       LOCKER VIEW BUTTON

       IMPORTANT:

       This style has NO disabled state.

       FULL Locker can always be inspected.
    ======================================================= */

    lockerViewButton: {
      height: lockerCard.viewButtonHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 5,

      padding: "0 9px",

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 750,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease",
    },

    lockerStatusBadge: {
      minHeight: lockerCard.statusHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      alignSelf: "flex-start",

      padding: "0 8px",

      borderRadius: 999,

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 760,

      lineHeight: 1,

      textTransform: "uppercase",

      letterSpacing: "0.035em",

      boxSizing: "border-box",
    },

    /* =======================================================
       OCCUPANCY
    ======================================================= */

    occupancyBlock: {
      width: "100%",

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.compactGap,
    },

    occupancyRow: {
      width: "100%",

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,
    },

    occupancyLabel: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,
    },

    occupancyValue: {
      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 790,

      whiteSpace: "nowrap",
    },

    progressTrack: {
      width: "100%",

      height: lockerCard.progressHeight,

      overflow: "hidden",

      borderRadius: 999,

      border: "1px solid var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    availabilityText: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 650,

      lineHeight: 1.35,
    },

    /* =======================================================
       LOCKER METRICS
    ======================================================= */

    lockerMetrics: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

      gap: moduleTokens.spacing.compactGap,
    },

    lockerMetric: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,

      padding: moduleTokens.spacing.compactPadding,

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    lockerMetricLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,

      lineHeight: 1.2,
    },

    lockerMetricValue: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 780,

      lineHeight: 1.2,
    },

    /* =======================================================
       FOOTER
    ======================================================= */

    lockerFooter: {
      width: "100%",

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,

      marginTop: "auto",

      paddingTop: 2,
    },

    selectLockerButton: {
      minWidth: 110,

      height: moduleTokens.control.compactButtonHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 6,

      padding: "0 12px",

      border: "1px solid transparent",

      borderRadius: moduleTokens.control.buttonRadius,

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 760,

      outline: "none",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, color 160ms ease, border-color 160ms ease, opacity 160ms ease",
    },

    selectedIndicator: {
      minHeight: 26,

      display: "inline-flex",

      alignItems: "center",

      gap: 5,

      color: "var(--finora-theme-success)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 760,
    },

    /* =======================================================
       EMPTY STATE
    ======================================================= */

    emptyState: {
      width: "100%",

      minHeight: 150,

      display: "flex",

      flexDirection: "column",

      alignItems: "center",

      justifyContent: "center",

      gap: moduleTokens.spacing.compactGap,

      padding: moduleTokens.spacing.panelPadding,

      textAlign: "center",

      border: "1px dashed var(--finora-theme-border-default)",

      borderRadius: moduleTokens.panel.radius,

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    emptyIcon: {
      width: 40,

      height: 40,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      border: "1px solid var(--finora-theme-border-subtle)",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-muted)",
    },

    emptyTitle: {
      margin: 0,

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 760,
    },

    emptyDescription: {
      margin: 0,

      maxWidth: 440,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardSubtitle,

      fontWeight: 500,

      lineHeight: 1.5,
    },
  };
}

/* ===========================================================
   LOCKER CARD STATE
=========================================================== */

export function getGoldLockerCardStateStyle(
  input: GoldLockerCardStateStyleInput,
): CSSProperties {
  if (input.selected) {
    return {
      borderColor: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",

      boxShadow:
        "0 0 0 2px var(--finora-theme-brand-soft), var(--finora-theme-shadow-soft)",
    };
  }

  if (!input.canAllocate || input.occupancyStatus === "FULL") {
    return {
      borderColor: "var(--finora-theme-danger)",

      background: "var(--finora-theme-danger-soft)",

      boxShadow: "var(--finora-theme-shadow-soft)",
    };
  }

  if (input.occupancyStatus === "HIGH") {
    return {
      borderColor: "var(--finora-theme-warning)",

      background: "var(--finora-theme-warning-soft)",

      boxShadow: "var(--finora-theme-shadow-soft)",
    };
  }

  return {
    borderColor: "var(--finora-theme-success)",

    background: "var(--finora-theme-background-surface)",

    boxShadow: "var(--finora-theme-shadow-soft)",
  };
}

/* ===========================================================
   LOCKER STATUS BADGE
=========================================================== */

export function getGoldLockerStatusBadgeStyle(
  occupancyStatus: GoldOccupancyStatus,
): CSSProperties {
  if (occupancyStatus === "FULL") {
    return {
      color: "var(--finora-theme-danger)",

      border: "1px solid var(--finora-theme-danger)",

      background: "var(--finora-theme-danger-soft)",
    };
  }

  if (occupancyStatus === "HIGH") {
    return {
      color: "var(--finora-theme-warning)",

      border: "1px solid var(--finora-theme-warning)",

      background: "var(--finora-theme-warning-soft)",
    };
  }

  return {
    color: "var(--finora-theme-success)",

    border: "1px solid var(--finora-theme-success)",

    background: "var(--finora-theme-success-soft)",
  };
}

/* ===========================================================
   LOCKER AVAILABILITY TEXT
=========================================================== */

export function getGoldLockerAvailabilityTextStyle(
  occupancyStatus: GoldOccupancyStatus,
): CSSProperties {
  if (occupancyStatus === "FULL") {
    return {
      color: "var(--finora-theme-danger)",

      fontWeight: 760,
    };
  }

  if (occupancyStatus === "HIGH") {
    return {
      color: "var(--finora-theme-warning)",

      fontWeight: 760,
    };
  }

  return {
    color: "var(--finora-theme-success)",

    fontWeight: 760,
  };
}

/* ===========================================================
   LOCKER PROGRESS
=========================================================== */

export function getGoldLockerProgressFillStyle(
  input: GoldLockerProgressStyleInput,
): CSSProperties {
  const safePercentage = Math.max(
    0,
    Math.min(
      100,
      Number.isFinite(input.occupancyPercentage)
        ? input.occupancyPercentage
        : 0,
    ),
  );

  let background = "var(--finora-theme-success)";

  if (input.occupancyStatus === "FULL") {
    background = "var(--finora-theme-danger)";
  } else if (input.occupancyStatus === "HIGH") {
    background = "var(--finora-theme-warning)";
  }

  return {
    width: `${safePercentage}%`,

    height: "100%",

    borderRadius: 999,

    background,

    transition: "width 220ms ease, background 160ms ease",
  };
}

/* ===========================================================
   LOCKER SELECTION BUTTON

   FULL locker:
   allocation disabled.

   VIEW button does not consume this state.
=========================================================== */

export function getGoldLockerAllocationButtonStyle(
  input: GoldLockerAllocationButtonStyleInput,
): CSSProperties {
  if (!input.canAllocate) {
    return {
      borderColor: "var(--finora-theme-border-subtle)",

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-muted)",

      cursor: "not-allowed",

      opacity: 0.72,
    };
  }

  if (input.selected) {
    return {
      borderColor: "var(--finora-theme-success)",

      background: "var(--finora-theme-success)",

      color: "var(--finora-theme-text-inverse)",

      cursor: "pointer",

      opacity: 1,
    };
  }

  return {
    borderColor: "var(--finora-theme-brand-primary)",

    background: "var(--finora-theme-brand-primary)",

    color: "var(--finora-theme-text-inverse)",

    cursor: "pointer",

    opacity: 1,
  };
}

/* ===========================================================
   ROOM OPTION STATE
=========================================================== */

export function getGoldRoomOptionStateStyle(
  input: GoldRoomOptionStateStyleInput,
): CSSProperties {
  if (input.disabled) {
    return {
      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-muted)",

      cursor: "not-allowed",

      opacity: 0.62,
    };
  }

  if (input.selected) {
    return {
      borderColor: "var(--finora-theme-brand-primary)",

      background: "var(--finora-theme-brand-soft)",

      color: "var(--finora-theme-text-primary)",

      cursor: "pointer",

      opacity: 1,
    };
  }

  return {
    borderColor: "transparent",

    background: "transparent",

    color: "var(--finora-theme-text-primary)",

    cursor: "pointer",

    opacity: 1,
  };
}

/* ===========================================================
   LOCKER CARD CURSOR
=========================================================== */

export function getGoldLockerCardCursorStyle(
  canAllocate: boolean,
): CSSProperties {
  return {
    cursor: canAllocate ? "pointer" : "default",
  };
}

/* ===========================================================
   END
=========================================================== */