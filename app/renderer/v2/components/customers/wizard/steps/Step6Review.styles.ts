/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW STUDIO
   PRESENTATION STYLES

   RESPONSIBILITY:

   - Step 6 viewport layout
   - Final 2 × 2 review workspace
   - Customer Summary + Validation Status
   - Review Checklist + Action Panel
   - Full viewport height usage
   - Header / footer breathing space
   - No bottom wasted space

   IMPORTANT:

   - Step 6 only
   - Do NOT modify shared StudioLayout
   - Do NOT modify shared TwoColumnStudio
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   WORKSPACE

   FINAL GRID:

   ┌──────────────────────┬──────────────────────┐
   │ Customer Summary     │ Validation Status    │
   ├──────────────────────┼──────────────────────┤
   │ Review Checklist     │ Draft + Actions      │
   └──────────────────────┴──────────────────────┘

   The workspace occupies the complete available
   Step 6 content area between header and footer.
=========================================================== */
export const workspaceStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  minWidth: 0,

  minHeight: 0,

  flex: "1 1 auto",

  display: "grid",

  gridTemplateColumns:
    "minmax(0,1.25fr) minmax(0,.95fr)",

  gridTemplateRows:
    "minmax(0,1fr) minmax(0,1fr)",

  columnGap: "10px",

  rowGap: "10px",

  boxSizing: "border-box",

  padding:
    "10px 18px",

  overflowY: "auto",

  overflowX: "hidden",

  alignItems: "stretch",

  justifyItems: "stretch",

  alignSelf: "stretch",

};

/* ===========================================================
   LEFT COLUMN

   IMPORTANT:

   This wrapper must NOT consume a grid cell.

   Its children participate directly in the
   parent workspace grid.

   Child 1:
   Customer Summary

   Child 2:
   Review Checklist
=========================================================== */

export const leftColumnStyle: CSSProperties = {

  display: "contents",
};

/* ===========================================================
   RIGHT COLUMN

   IMPORTANT:

   This wrapper must NOT consume a grid cell.

   Its children participate directly in the
   parent workspace grid.

   Child 1:
   Validation Status

   Child 2:
   Action Panel
=========================================================== */

export const rightColumnStyle: CSSProperties = {

  display: "contents",
};

/* ===========================================================
   ACTION PANEL

   Bottom-right area:

   Save Customer
   ↓
   Edit Details
   ↓
   Cancel
=========================================================== */

export const actionPanelStyle: CSSProperties = {

  minWidth: 0,

  minHeight: 0,

  width: "100%",

  height: "100%",

  display: "flex",

  flexDirection: "column",

  gap: "8px",

  boxSizing: "border-box",

  overflow: "hidden",

  alignSelf: "stretch",

  justifySelf: "stretch",
};

/* ===========================================================
   ACTION AREA

   The three buttons are handled vertically by
   ReviewActions.styles.ts.

   This area fills the remaining bottom-right
   available space.
=========================================================== */

export const actionAreaStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  flex: "1 1 auto",

  display: "flex",

  flexDirection: "column",

  boxSizing: "border-box",

  overflow: "hidden",
};

/* ===========================================================
   RESPONSIVE
=========================================================== */

export const responsiveStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  minWidth: 0,

  minHeight: 0,

  boxSizing: "border-box",
};
