/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™
   
   DEPARTMENT DOOR™
   
   STYLES
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
   RESPONSIVE STYLE FACTORY
   -----------------------------------------------------------
   IMPORTANT
   -----------------------------------------------------------
   All responsive dimensions are consumed from the
   CENTRAL RESPONSIVE ENGINE.

   Department Door uses ONLY the dedicated
   tokens.door.* responsive token group for
   door-specific visual dimensions.
=========================================================== */

export function createDepartmentDoorStyles(
  tokens: ResponsiveTokens,
) {


  /* =========================================================
     ROOT
     ---------------------------------------------------------
     Department Door geometry comes exclusively from
     the dedicated Responsive Engine door tokens.
  ========================================================= */

  const containerStyle: CSSProperties = {

    width:
      tokens.door.width,

    height:
      `${tokens.door.height}px`,

    minHeight:
      `${tokens.door.height}px`,

    borderRadius:
      `${tokens.door.radius}px`,

    padding:
      `${tokens.door.padding}px`,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    boxSizing:
      "border-box",

    cursor:
      "pointer",

    userSelect:
      "none",

    transition:
      "all 220ms ease",

  };


  /* =========================================================
     ICON
     ---------------------------------------------------------
     All Department Door icon dimensions come from
     the dedicated door token group.
  ========================================================= */

  const iconStyle: CSSProperties = {

    width:
      `${tokens.door.iconSize}px`,

    height:
      `${tokens.door.iconSize}px`,

    borderRadius:
      `${tokens.door.iconRadius}px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontSize:
      `${tokens.door.iconSize}px`,

    flexShrink:
      0,

  };


  /* =========================================================
     CONTENT
  ========================================================= */

  const contentStyle: CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    gap:
      `${tokens.door.gap}px`,

    textAlign:
      "center",

    width:
      "100%",

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle: CSSProperties = {

    margin:
      0,

    fontSize:
      `${tokens.door.titleSize}px`,

    lineHeight:
      tokens.lineHeight.heading,

    fontWeight:
      700,

    textAlign:
      "center",

    color:
      "#F3E4C2",

  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle: CSSProperties = {

    margin:
      0,

    fontSize:
      `${tokens.door.subtitleSize}px`,

    lineHeight:
      tokens.lineHeight.compact,

    textAlign:
      "center",

    color:
     "rgba(255,255,255,.72)",  

  };


  /* =========================================================
     STATUS
     ---------------------------------------------------------
     Status dimensions are Department Door dimensions.
     They must NOT borrow generic control tokens.
  ========================================================= */

  const statusStyle: CSSProperties = {

    padding:
      `${tokens.door.statusPaddingY}px ${tokens.door.statusPaddingX}px`,

    borderRadius:
      "999px",

    background:
      "#FFFFFF",

    fontSize:
      `${tokens.door.statusSize}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.compact,

    whiteSpace:
      "nowrap",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minHeight:
      `${tokens.door.statusMinHeight}px`,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    iconStyle,

    contentStyle,

    titleStyle,

    subtitleStyle,

    statusStyle,

  };

}


/* ===========================================================
   END
=========================================================== */