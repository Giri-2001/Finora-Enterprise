/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD RACKS STYLES

   MODULE  : Gold Loan
   LAYER   : Presentation Styles
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Style Gold Rack grid
   - Style Gold Rack cards
   - Style occupancy states
   - Style selected Rack state
   - Style allocation controls
   - Style always-available VIEW controls
   - Style Rack occupancy progress
   - Preserve FINORA theme compatibility
   - Preserve responsive geometry

   IMPORTANT:

   - No React component logic.
   - No business calculations.
   - No storage access.
   - No inline component styling.
   - No breakpoint logic.
   - No hardcoded theme palette.
   - All colors come from FINORA semantic CSS variables.

   OCCUPANCY BEHAVIOUR:

   AVAILABLE / PARTIAL
     → selectable

   HIGH
     → selectable with warning emphasis

   FULL
     → allocation disabled
     → VIEW remains enabled

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type { GoldOccupancyStatus } from "../../types/gold-loan/goldStorage.types";

import type {
  GoldLoanModuleTokens,
  GoldLoanRackCardLayout,
  GoldLoanRackGridLayout,
} from "../../utils/responsive/goldloan/goldLoan.index";

/* ===========================================================
   STYLE INPUT
=========================================================== */

export interface GoldRacksStylesInput {
  moduleTokens: GoldLoanModuleTokens;

  rackGrid: GoldLoanRackGridLayout;

  rackCard: GoldLoanRackCardLayout;

  isMobile: boolean;
}

/* ===========================================================
   RACK CARD STATE INPUT
=========================================================== */

export interface GoldRackCardStateStyleInput {
  occupancyStatus: GoldOccupancyStatus;

  selected: boolean;

  canAllocate: boolean;
}

/* ===========================================================
   PROGRESS STYLE INPUT
=========================================================== */

export interface GoldRackProgressStyleInput {
  occupancyStatus: GoldOccupancyStatus;

  occupancyPercentage: number;
}

/* ===========================================================
   ALLOCATION BUTTON STYLE INPUT
=========================================================== */

export interface GoldRackAllocationButtonStyleInput {
  selected: boolean;

  canAllocate: boolean;
}

/* ===========================================================
   STYLE RESULT
=========================================================== */

export interface GoldRacksStyles {
  root: CSSProperties;

  header: CSSProperties;

  headingGroup: CSSProperties;

  headingIcon: CSSProperties;

  headingTextGroup: CSSProperties;

  title: CSSProperties;

  subtitle: CSSProperties;

  rackCountBadge: CSSProperties;

  grid: CSSProperties;

  rackCard: CSSProperties;

  rackHeader: CSSProperties;

  rackIdentity: CSSProperties;

  rackIcon: CSSProperties;

  rackTitleGroup: CSSProperties;

  rackTitle: CSSProperties;

  rackCode: CSSProperties;

  statusBadge: CSSProperties;

  occupancyBlock: CSSProperties;

  occupancyRow: CSSProperties;

  occupancyLabel: CSSProperties;

  occupancyValue: CSSProperties;

  availableText: CSSProperties;

  progressTrack: CSSProperties;

  capacityMeta: CSSProperties;

  capacityMetaItem: CSSProperties;

  capacityMetaLabel: CSSProperties;

  capacityMetaValue: CSSProperties;

  actions: CSSProperties;

  allocateButton: CSSProperties;

  viewButton: CSSProperties;

  emptyState: CSSProperties;

  emptyIcon: CSSProperties;

  emptyTitle: CSSProperties;

  emptyDescription: CSSProperties;
}

/* ===========================================================
   BASE STYLES
=========================================================== */

export function getGoldRacksStyles(
  input: GoldRacksStylesInput,
): GoldRacksStyles {
  const { moduleTokens, rackGrid, rackCard, isMobile } = input;

  return {
    /* =======================================================
       ROOT
    ======================================================= */

    root: {
      width: "100%",

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: moduleTokens.spacing.cardGap,

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",
    },

    /* =======================================================
       HEADER
    ======================================================= */

    header: {
      width: "100%",

      display: "flex",

      alignItems: isMobile ? "flex-start" : "center",

      justifyContent: "space-between",

      flexDirection: isMobile ? "column" : "row",

      gap: moduleTokens.spacing.compactGap,

      minWidth: 0,

      boxSizing: "border-box",
    },

    headingGroup: {
      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,

      minWidth: 0,
    },

    headingIcon: {
      width: 32,

      height: 32,

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

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 760,

      lineHeight: 1.25,

      letterSpacing: "-0.015em",
    },

    subtitle: {
      margin: 0,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardSubtitle,

      fontWeight: 500,

      lineHeight: 1.45,
    },

    rackCountBadge: {
      minHeight: 28,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 10px",

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

    /* =======================================================
       RACK GRID
    ======================================================= */

    grid: {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: `repeat(${rackGrid.columns}, minmax(0, 1fr))`,

      gap: rackGrid.gap,

      alignItems: "stretch",

      boxSizing: "border-box",
    },

    /* =======================================================
       RACK CARD
    ======================================================= */

    rackCard: {
      width: "100%",

      minWidth: 0,

      minHeight: rackGrid.cardMinHeight,

      display: "flex",

      flexDirection: "column",

      gap: rackCard.gap,

      padding: rackCard.padding,

      borderRadius: rackCard.radius,

      border: "1px solid var(--finora-theme-border-default)",

      background: "var(--finora-theme-background-surface)",

      boxShadow: "var(--finora-theme-shadow-soft)",

      fontFamily: moduleTokens.fontFamily,

      boxSizing: "border-box",

      transition:
        "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease",
    },

    rackHeader: {
      width: "100%",

      display: "flex",

      alignItems: "flex-start",

      justifyContent: "space-between",

      gap: moduleTokens.spacing.compactGap,

      minWidth: 0,
    },

    rackIdentity: {
      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: moduleTokens.spacing.compactGap,
    },

    rackIcon: {
      width: 30,

      height: 30,

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-brand-primary)",

      border: "1px solid var(--finora-theme-border-subtle)",

      boxSizing: "border-box",
    },

    rackTitleGroup: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 1,
    },

    rackTitle: {
      margin: 0,

      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardTitle,

      fontWeight: 760,

      lineHeight: 1.25,
    },

    rackCode: {
      overflow: "hidden",

      textOverflow: "ellipsis",

      whiteSpace: "nowrap",

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,

      lineHeight: 1.3,
    },

    statusBadge: {
      flexShrink: 0,

      minHeight: 24,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "0 8px",

      borderRadius: 999,

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.badgeText,

      fontWeight: 760,

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

      marginTop: 2,
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

      fontWeight: 780,

      whiteSpace: "nowrap",
    },

    availableText: {
      color: "var(--finora-theme-text-secondary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText + 2,

      fontWeight: 650,

      lineHeight: 1.35,
    },

    progressTrack: {
      width: "100%",

      height: rackCard.progressHeight,

      overflow: "hidden",

      borderRadius: 999,

      background: "var(--finora-theme-background-muted)",

      border: "1px solid var(--finora-theme-border-subtle)",

      boxSizing: "border-box",
    },

    /* =======================================================
       CAPACITY META
    ======================================================= */

    capacityMeta: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: moduleTokens.spacing.compactGap,

      marginTop: 2,
    },

    capacityMetaItem: {
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: 2,

      padding: moduleTokens.spacing.compactPadding,

      borderRadius: moduleTokens.panel.compactRadius,

      background: "var(--finora-theme-background-muted)",

      border: "1px solid var(--finora-theme-border-subtle)",

      boxSizing: "border-box",
    },

    capacityMetaLabel: {
      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.helperText,

      fontWeight: 600,

      lineHeight: 1.25,
    },

    capacityMetaValue: {
      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.fieldValue,

      fontWeight: 780,

      lineHeight: 1.25,
    },

    /* =======================================================
       ACTIONS
    ======================================================= */

    actions: {
      width: "100%",

      display: "grid",

      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

      gap: moduleTokens.spacing.compactGap,

      marginTop: "auto",

      paddingTop: 2,
    },

    allocateButton: {
      width: "100%",

      height: rackCard.actionHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 6,

      border: "1px solid transparent",

      borderRadius: moduleTokens.control.buttonRadius,

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 760,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, border-color 160ms ease, color 160ms ease, opacity 160ms ease",
    },

    viewButton: {
      width: "100%",

      height: rackCard.actionHeight,

      display: "inline-flex",

      alignItems: "center",

      justifyContent: "center",

      gap: 6,

      border: "1px solid var(--finora-theme-border-default)",

      borderRadius: moduleTokens.control.buttonRadius,

      background: "var(--finora-theme-background-surface)",

      color: "var(--finora-theme-text-primary)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.buttonText,

      fontWeight: 760,

      cursor: "pointer",

      outline: "none",

      boxSizing: "border-box",

      transition:
        "background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease",
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

      textAlign: "center",

      gap: moduleTokens.spacing.compactGap,

      padding: moduleTokens.spacing.panelPadding,

      borderRadius: moduleTokens.panel.radius,

      border: "1px dashed var(--finora-theme-border-default)",

      background: "var(--finora-theme-background-muted)",

      boxSizing: "border-box",
    },

    emptyIcon: {
      width: 38,

      height: 38,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      borderRadius: moduleTokens.panel.compactRadius,

      color: "var(--finora-theme-text-muted)",

      background: "var(--finora-theme-background-surface)",

      border: "1px solid var(--finora-theme-border-subtle)",
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

      maxWidth: 420,

      color: "var(--finora-theme-text-muted)",

      fontFamily: moduleTokens.fontFamily,

      fontSize: moduleTokens.typography.cardSubtitle,

      fontWeight: 500,

      lineHeight: 1.5,
    },
  };
}

/* ===========================================================
   RACK CARD STATE STYLE

   IMPORTANT:

   FULL Rack:
   - visually blocked for allocation
   - card remains inspectable
   - VIEW remains active
=========================================================== */

export function getGoldRackCardStateStyle(
  input: GoldRackCardStateStyleInput,
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
   STATUS BADGE STYLE
=========================================================== */

export function getGoldRackStatusBadgeStyle(
  occupancyStatus: GoldOccupancyStatus,
): CSSProperties {
  if (occupancyStatus === "FULL") {
    return {
      color: "var(--finora-theme-danger)",

      background: "var(--finora-theme-danger-soft)",

      border: "1px solid var(--finora-theme-danger)",
    };
  }

  if (occupancyStatus === "HIGH") {
    return {
      color: "var(--finora-theme-warning)",

      background: "var(--finora-theme-warning-soft)",

      border: "1px solid var(--finora-theme-warning)",
    };
  }

  return {
    color: "var(--finora-theme-success)",

    background: "var(--finora-theme-success-soft)",

    border: "1px solid var(--finora-theme-success)",
  };
}

/* ===========================================================
   AVAILABLE TEXT STYLE
=========================================================== */

export function getGoldRackAvailableTextStyle(
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
   PROGRESS FILL STYLE

   Percentage normalization belongs here instead of JSX.
=========================================================== */

export function getGoldRackProgressFillStyle(
  input: GoldRackProgressStyleInput,
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
   ALLOCATION BUTTON STATE

   Allocation is disabled when Rack is FULL.

   VIEW button does NOT use this function and therefore stays
   active independently.
=========================================================== */

export function getGoldRackAllocationButtonStyle(
  input: GoldRackAllocationButtonStyleInput,
): CSSProperties {
  if (!input.canAllocate) {
    return {
      background: "var(--finora-theme-background-muted)",

      color: "var(--finora-theme-text-muted)",

      borderColor: "var(--finora-theme-border-subtle)",

      cursor: "not-allowed",

      opacity: 0.72,
    };
  }

  if (input.selected) {
    return {
      background: "var(--finora-theme-success)",

      color: "var(--finora-theme-text-inverse)",

      borderColor: "var(--finora-theme-success)",

      cursor: "pointer",

      opacity: 1,
    };
  }

  return {
    background: "var(--finora-theme-brand-primary)",

    color: "var(--finora-theme-text-inverse)",

    borderColor: "var(--finora-theme-brand-primary)",

    cursor: "pointer",

    opacity: 1,
  };
}

/* ===========================================================
   RACK CARD CURSOR

   Full Rack cannot be allocated by clicking the card.

   Inspection remains available through VIEW.
=========================================================== */

export function getGoldRackCardCursorStyle(
  canAllocate: boolean,
): CSSProperties {
  return {
    cursor: canAllocate ? "pointer" : "default",
  };
}

/* ===========================================================
   END
=========================================================== */
