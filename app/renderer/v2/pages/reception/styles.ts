/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™
   
   PAGE STYLES
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


/* ===========================================================
   PAGE BACKGROUND
=========================================================== */

/*
  Reception owns ONE continuous visual surface.

  Header
      ↓
  Reception Page
      ↓
  Reception Hall
      ↓
  Reception Footer

  The Hall and Footer must never expose the application/body
  background between them.

  The Reception page therefore owns the same base background
  used by the Reception Hall.
*/

const RECEPTION_PAGE_BACKGROUND =
  "radial-gradient(circle at top, rgba(212,175,55,.18), transparent 35%), linear-gradient(180deg,#1B0E05,#5A3418)";


/* ===========================================================
   PAGE
=========================================================== */

/*
  Reception page owns the vertical layout.

  IMPORTANT:
  - width stays inside the application viewport.
  - overflow-x is hidden so no right-side visual strip can
    appear from horizontal overflow.
  - background is continuous across Hall + Footer.
  - no artificial viewport height is introduced.
*/

export const pageStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  display:
    "flex",

  flex:
    "1 1 auto",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

  overflowX:
    "hidden",

  overflowY:
    "visible",

  background:
    RECEPTION_PAGE_BACKGROUND,

};


/* ===========================================================
   END
=========================================================== */
