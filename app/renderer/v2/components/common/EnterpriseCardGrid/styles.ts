/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE CARD GRID™

   STYLES

   RESPONSIBILITY:
   - Shared card-grid presentation
   - Responsive grid geometry
   - No device detection
   - No hard-coded responsive column count

   IMPORTANT:
   - Responsive column count comes from the caller.
   - Customer responsive values are resolved by the
     Customer Responsive Engine before reaching this grid.
   - This shared component remains reusable for other
     Enterprise card-grid consumers.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  GRID_WIDTH,
  GRID_ALIGNMENT,
} from "./constants";


/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display:
    "grid",

  width:
    GRID_WIDTH,

  /*
   * IMPORTANT:
   *
   * EnterpriseCardGrid.tsx injects:
   *
   *   gridTemplateColumns
   *
   *   gap
   *
   * at render time.
   *
   * The grid must consume the COMPLETE available width.
   *
   * "stretch" allows the resolved grid to occupy the
   * complete available width without introducing additional
   * distribution behavior.
   */

  justifyContent:
    "stretch",

  alignItems:
    GRID_ALIGNMENT,

  /*
   * Each grid item owns its complete grid track.
   *
   * This keeps every customer card aligned consistently
   * without changing the actual Customer ID Card geometry.
   */

  justifyItems:
    "stretch",

  boxSizing:
    "border-box",

  /*
   * The final responsive:
   *
   * - column count
   * - gap
   *
   * are injected by EnterpriseCardGrid.tsx.
   */

};


/* ===========================================================
   ITEM
=========================================================== */

export const itemStyle: CSSProperties = {

  /*
   * Fill the complete grid track.
   *
   * CustomerHanger itself keeps the actual Customer ID Card
   * width fixed through Customer Responsive Engine tokens.
   */

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

};


/* ===========================================================
   END
=========================================================== */