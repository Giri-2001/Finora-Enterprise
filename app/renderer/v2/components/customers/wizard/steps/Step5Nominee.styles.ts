/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 3 — NOMINEE + FINAL REVIEW WORKSPACE

   VERSION     : 3.0
   PHASE       : Phase 2
   ARCHITECTURE: Enterprise
   STATUS      : Production

   RESPONSIBILITY:

   - Step 3 workspace geometry
   - Three-row final review composition
   - Responsive workspace spacing
   - Theme-aware presentation
   - Responsive typography
   - No business logic
   - No viewport detection
   - No local breakpoints

   RESPONSIVE CONTRACT:

   Mobile:
     1 form per row

   Tablet:
     2 forms per row

   Laptop / Desktop:
     2 forms per row

   IMPORTANT:

   - Responsive values come from FINORA Responsive Engine.
   - Theme colours come from FINORA Theme Engine CSS variables.
   - This file does NOT decide breakpoints.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";


/* ===========================================================
   THEME VARIABLES
=========================================================== */

export type Step3ThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   THEME VARIABLE FACTORY
=========================================================== */

export function createStep3ThemeVariables(): Step3ThemeStyle {

  return {

    "--finora-theme-page":
      "var(--finora-theme-background-page, #0B1220)",

    "--finora-theme-surface":
      "var(--finora-theme-background-surface, #111827)",

    "--finora-theme-surface-muted":
      "var(--finora-theme-background-surface-muted, #172033)",

    "--finora-theme-text-primary":
      "var(--finora-theme-text-primary, #FFFFFF)",

    "--finora-theme-text-secondary":
      "var(--finora-theme-text-secondary, #D1D5DB)",

    "--finora-theme-text-muted":
      "var(--finora-theme-text-muted, rgba(255,255,255,.55))",

    "--finora-theme-border-default":
      "var(--finora-theme-border-default, rgba(212,175,55,.30))",

    "--finora-theme-border-subtle":
      "var(--finora-theme-border-subtle, rgba(255,255,255,.10))",

    "--finora-theme-brand-accent":
      "var(--finora-theme-brand-accent, #D4AF37)",

  };

}


/* ===========================================================
   ROOT PAGE
=========================================================== */

export function createPageStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    height:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    boxSizing:
      "border-box",

    padding:
      `${tokens.wizard.padding}px`,

    gap:
      `${tokens.wizard.contentGap}px`,

    overflow:
      "hidden",

    background:
      "var(--finora-theme-page)",

    color:
      "var(--finora-theme-text-primary)",

  };

}


/* ===========================================================
   THREE-ROW WORKSPACE
=========================================================== */

export function createWorkspaceStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    height:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    flex:
      "1 1 0",

    display:
      "grid",

    /*
     * Each row contains the forms supplied by Step 3.
     *
     * The actual number of columns is controlled by the
     * central Responsive Engine.
     */

    gridTemplateColumns:
      `repeat(${tokens.grid.columns >= 2 ? 2 : 1}, minmax(0, 1fr))`,

    columnGap:
      `${tokens.spacing.small}px`,

    rowGap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    overflow:
      "auto",

    alignItems:
      "stretch",

  };

}


/* ===========================================================
   FORM / CARD CONTAINER
=========================================================== */

export function createSectionStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    padding:
      `${tokens.card.padding}px`,

    gap:
      `${tokens.spacing.small}px`,

    border:
      "var(--finora-theme-border-default)",

    borderRadius:
      `${tokens.card.radius}px`,

    background:
      "var(--finora-theme-surface)",

    color:
      "var(--finora-theme-text-primary)",

    overflow:
      "hidden",

  };

}


/* ===========================================================
   SECTION HEADER
=========================================================== */

export function createSectionHeaderStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    flexShrink:
      0,

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "center",

    gap:
      `${tokens.spacing.small}px`,

    paddingBottom:
      `${tokens.spacing.small}px`,

    borderBottom:
      "1px solid var(--finora-theme-border-subtle)",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   SECTION TITLE
=========================================================== */

export function createSectionTitleStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    margin:
      0,

    color:
      "var(--finora-theme-text-primary)",

    fontSize:
      `${tokens.typography.heading}px`,

    lineHeight:
      tokens.lineHeight.heading,

    fontWeight:
      700,

  };

}


/* ===========================================================
   SECTION SUBTITLE
=========================================================== */

export function createSectionSubtitleStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    margin:
      0,

    color:
      "var(--finora-theme-text-muted)",

    fontSize:
      `${tokens.typography.small}px`,

    lineHeight:
      tokens.lineHeight.compact,

    fontWeight:
      400,

  };

}


/* ===========================================================
   ACTION PANEL
=========================================================== */

export function createActionPanelStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };

}


/* ===========================================================
   RESPONSIVE CONTRACT
=========================================================== */

export function createResponsiveStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   END
=========================================================== */