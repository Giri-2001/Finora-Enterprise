/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WORKSPACE™

   STYLES

   RESPONSIBILITY:
   - Provide Customer Workspace styles
   - Consume Responsive Engine tokens
   - Keep responsive dimensions centralized
   - No breakpoint logic
   - No viewport calculations
   - No hard-coded responsive sizing
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive";


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createCustomerWorkspaceStyles(

  tokens: ResponsiveTokens,

) {


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    display: "grid",

    gridTemplateColumns:

      tokens.sidebar.width > 0

        ? `${tokens.sidebar.width}px minmax(0, 1fr)`

        : "minmax(0, 1fr)",

    gap:
      tokens.card.gap,

    width: "100%",

    height: "100%",

    minHeight: 0,

    minWidth: 0,

    boxSizing: "border-box",

    overflow: "hidden",

  };


  /* =========================================================
     SIDEBAR
  ========================================================= */

  const sidebarStyle: CSSProperties = {

    display: "flex",

    flexDirection: "column",

    gap:
      tokens.card.gap,

    width: "100%",

    minWidth: 0,

    minHeight: 0,

    height: "100%",

    boxSizing: "border-box",

    overflow: "hidden",

  };


  /* =========================================================
     CONTENT
  ========================================================= */

  const contentStyle: CSSProperties = {

    display: "flex",

    flexDirection: "column",

    gap:
      tokens.card.gap,

    width: "100%",

    minWidth: 0,

    minHeight: 0,

    height: "100%",

    boxSizing: "border-box",

    overflow: "hidden",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    sidebarStyle,

    contentStyle,

  };

}


/* ===========================================================
   END
=========================================================== */