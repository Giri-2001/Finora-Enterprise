/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HALL™

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
   TYPES
=========================================================== */

export interface ReceptionHallStyles {

  containerStyle:
    CSSProperties;

  wallStyle:
    CSSProperties;

  doorGridStyle:
    CSSProperties;

  floorStyle:
    CSSProperties;

  wallLogoStyle:
    CSSProperties;

  wallTitleStyle:
    CSSProperties;

  wallDividerStyle:
    CSSProperties;

  wallSubtitleStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionHallStyles(
  tokens: ResponsiveTokens,
): ReceptionHallStyles {


  /* =========================================================
     ROOT

     IMPORTANT
     ---------------------------------------------------------
     Hall consumes the remaining vertical space.

     Footer remains below the Hall.

     No responsive width is decided here manually.
     All visual dimensions continue to come from the
     CENTRAL RESPONSIVE ENGINE.
  ========================================================= */

  const containerStyle: CSSProperties = {

    width:
      "100%",

    flex:
      "1 1 auto",

    minHeight:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "flex-start",

    alignItems:
      "center",

    padding:
      `${tokens.spacing.small}px ${tokens.spacing.large}px`,

    boxSizing:
      "border-box",

    background:
      "transparent",

    position:
      "relative",

    overflow:
      "visible",

    borderBottom:
      `${tokens.border.width}px solid rgba(212,175,55,.45)`,

    boxShadow:
      "none",

  };


  /* =========================================================
     FEATURE WALL
  ========================================================= */

  const wallStyle: CSSProperties = {

    width:
      "100%",

    maxWidth:
      `${tokens.layout.maxContentWidth}px`,

    minWidth:
      0,

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.panel.radius}px`,

    padding:
      `${tokens.reception.wallPadding}px ${tokens.spacing.medium}px ${tokens.spacing.large}px`,

    background:
      "linear-gradient(180deg,#4A260F 0%,#6B3F1F 50%,#2A1408 100%)",

    border:
      `${tokens.border.width}px solid rgba(212,175,55,.45)`,

    borderBottom:
      `${tokens.border.strongWidth}px solid rgba(212,175,55,.55)`,

    boxShadow:
      "0 40px 90px rgba(0,0,0,.35), 0 10px 30px rgba(0,0,0,.35)",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

  };


  /* =========================================================
     DEPARTMENT DOOR GRID
     
     IMPORTANT FIX
     ---------------------------------------------------------
     Previous implementation forced the number of columns
     directly from tokens.grid.columns.

     That created a problem because Department Doors have
     their own fixed responsive width.

     Example:
       Tablet  = 300px door
       Laptop  = 320px door
       Desktop = 340px door

     When the forced column count could not physically fit,
     cards overflowed / disappeared outside the visible area.

     NEW BEHAVIOUR
     ---------------------------------------------------------
     - Grid calculates how many Door tracks physically fit.
     - Minimum track width is the Department Door width.
     - Cards remain centered inside their tracks.
     - Gap comes from the CENTRAL RESPONSIVE ENGINE.
     - No horizontal overflow.
     - No uneven "3 visible + 2 pushed" behaviour.

     Reception uses the Department Door geometry as the
     minimum packing requirement.
  ========================================================= */

  const doorGridStyle: CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      `repeat(auto-fit, minmax(${tokens.door.width}px, 1fr))`,

    justifyItems:
      "center",

    justifyContent:
      "center",

    alignItems:
      "start",

    columnGap:
      `${tokens.door.gap}px`,

    rowGap:
      `${tokens.spacing.large}px`,

    marginTop:
      `${tokens.spacing.large}px`,

  };


  /* =========================================================
     FLOOR
  ========================================================= */

  const floorStyle: CSSProperties = {

    width:
      "95%",

    maxWidth:
      `${tokens.layout.maxContentWidth}px`,

    height:
      `${tokens.spacing.xlarge}px`,

    flexShrink:
      0,

    marginTop:
      `-${tokens.spacing.large}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    background:
      "radial-gradient(circle,#E8E8E8 0%,#CFCFCF 45%,transparent 85%)",

    backgroundImage:
      "linear-gradient(180deg, transparent 65%, rgba(255,220,150,.12))",

    opacity:
      0.45,

  };


  /* =========================================================
     WALL LOGO
  ========================================================= */

  const wallLogoStyle: CSSProperties = {

    width:
      `${tokens.reception.wallLogoSize}px`,

    marginBottom:
      `${tokens.reception.wallGap}px`,

    objectFit:
      "contain",

  };


  /* =========================================================
     WALL TITLE
  ========================================================= */

  const wallTitleStyle: CSSProperties = {

    color:
      "#F8FAFC",

    fontSize:
      `${tokens.reception.titleSize}px`,

    margin:
      0,

    fontWeight:
      800,

    letterSpacing:
      "1px",

    lineHeight:
      tokens.lineHeight.title,

    textAlign:
      "center",

  };


  /* =========================================================
     WALL DIVIDER
  ========================================================= */

  const wallDividerStyle: CSSProperties = {

    width:
      `${tokens.spacing.xxlarge * 10}px`,

    maxWidth:
      "80%",

    height:
      `${tokens.border.strongWidth}px`,

    background:
      "linear-gradient(90deg,transparent,#D4AF37,transparent)",

    marginTop:
      `${tokens.spacing.small}px`,

  };


  /* =========================================================
     WALL SUBTITLE
  ========================================================= */

  const wallSubtitleStyle: CSSProperties = {

    color:
      "#E5E7EB",

    margin:
      0,

    marginTop:
      `${tokens.spacing.small}px`,

    fontSize:
      `${tokens.typography.caption}px`,

    lineHeight:
      tokens.lineHeight.body,

    textAlign:
      "center",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    wallStyle,

    doorGridStyle,

    floorStyle,

    wallLogoStyle,

    wallTitleStyle,

    wallDividerStyle,

    wallSubtitleStyle,

  };

}


/* ===========================================================
   END
=========================================================== */