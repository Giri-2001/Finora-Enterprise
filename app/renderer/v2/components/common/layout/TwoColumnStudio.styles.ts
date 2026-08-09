/* ===========================================================
   FINORA ENTERPRISE OS™

   REUSABLE TWO COLUMN STUDIO
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Two-column grid
   - Responsive width distribution
   - Content-based height distribution
   - Height containment
   - Overflow control

   IMPORTANT:
   - No business logic
   - No module-specific styling
   - No scrolling inside columns
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   CONTAINER
=========================================================== */

export const containerStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  minHeight: 0,

  minWidth: 0,

  boxSizing: "border-box",

  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1.28fr) minmax(320px, .72fr)",

  gap: "12px",

  alignItems: "start",

  overflow: "hidden",
};

/* ===========================================================
   LEFT WORKSPACE
=========================================================== */

export const leftStyle: CSSProperties = {

  minWidth: 0,

  minHeight: 0,

  width: "100%",

  height: "100%",

  boxSizing: "border-box",

  display: "grid",

  /*
   * Each module container keeps its natural content height.
   * This prevents large empty stretched panels.
   */
  gridTemplateRows:
    "auto auto",

  gap: "10px",

  alignContent: "start",

  overflow: "hidden",
};

/* ===========================================================
   RIGHT INTELLIGENCE PANEL
=========================================================== */

export const rightStyle: CSSProperties = {

  minWidth: 0,

  minHeight: 0,

  width: "100%",

  height: "100%",

  boxSizing: "border-box",

  display: "grid",

  /*
   * Preview, Summary and Draft Status use only the
   * height their content actually requires.
   */
  gridTemplateRows:
    "auto auto auto",

  gap: "10px",

  alignContent: "start",

  overflow: "hidden",
};
