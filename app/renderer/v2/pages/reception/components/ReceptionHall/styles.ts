/* ===========================================================
   FINORA ENTERPRISE OSâ„¢
   RECEPTIONâ„¢

   RECEPTION HALLâ„¢

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

     IMPORTANT:
     - Hall must consume ONLY the remaining vertical space.
     - Footer belongs below the Hall.
     - Do NOT use minHeight: 100%.
     - flex: 1 allows the Hall to fill available height
       while still leaving the footer at the bottom.
     - Content can grow naturally when required.
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

    background: "transparent",

    position:
      "relative",

    overflow:
      "visible",

    borderBottom:
      `${tokens.border.width}px solid rgba(212,175,55,.45)`,

    boxShadow: "none",

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

     Column count comes ONLY from Responsive Engine tokens.

     Mobile:
       1 column

     Tablet:
       2 columns

     Laptop/Desktop:
       Engine-controlled columns
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
      `repeat(${tokens.grid.columns}, minmax(0, 1fr))`,

    justifyItems:
      "center",

    justifyContent:
      "center",

    alignItems:
      "start",

    columnGap:
      `${tokens.grid.gap}px`,

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
