/* ===========================================================
   FINORA ENTERPRISE OS™
   GLOBAL HEADER™

   PREMIUM DARK ENTERPRISE STYLES
   RESPONSIVE ENGINE CONSUMER

   R04 RESPONSIVE FIX

   IMPORTANT:
   - No viewport-specific values are decided here.
   - All responsive dimensions come from ResponsiveTokens.
   - GlobalHeader.tsx contains no visual dimension values.
   - Header layout must remain inside the viewport.
   - Narrow/mobile layouts must not create horizontal overflow.
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

export interface GlobalHeaderStyles {

  containerStyle:
    CSSProperties;

  leftStyle:
    CSSProperties;

  logoStyle:
    CSSProperties;

  centerStyle:
    CSSProperties;

  departmentStyle:
    CSSProperties;

  rightStyle:
    CSSProperties;

  actionStyle:
    CSSProperties;

  backButtonStyle:
    CSSProperties;

  backIconStyle:
    CSSProperties;

  logoutButtonStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createGlobalHeaderStyles(

  tokens:
    ResponsiveTokens,

  canGoBack:
    boolean,

): GlobalHeaderStyles {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const header =
    tokens.header;

  const button =
    tokens.button;


  /* =========================================================
     VIEWPORT
     
     ResponsiveViewport is defined by the Responsive Engine.
     
     Supported viewport contract:
       mobile
       tablet
       laptop
       desktop
  ========================================================= */

  const viewport =
    tokens.meta.viewport;


  const isMobile =
    viewport ===
      "mobile";


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    position:
      "sticky",

    top:
      0,

    zIndex:
      1000,

    width:
      "100%",

    minWidth:
      0,

    maxWidth:
      "100%",

    height:
      `${header.height}px`,

    minHeight:
      `${header.height}px`,

    display:
      "grid",

    gridTemplateColumns:
      isMobile

        ? "minmax(0, 1fr) auto"

        : "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",

    gridTemplateRows:
      isMobile

        ? "auto auto"

        : "1fr",

    alignItems:
      "center",

    padding:
      `0 ${header.paddingX}px`,

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    background:
      `
        linear-gradient(
          180deg,
          #3B2418 0%,
          #2B1810 100%
        )
      `,

    borderBottom:
      "1px solid rgba(212,175,55,.45)",

    boxShadow:
      `
        0 10px 30px rgba(0,0,0,.45),
        0 1px 0 rgba(212,175,55,.25)
      `,

    overflow:
      "hidden",

  };


  /* =========================================================
     LEFT
  ========================================================= */

  const leftStyle: CSSProperties = {

    minWidth:
      0,

    width:
      "100%",

    maxWidth:
      "100%",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "flex-start",

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    overflow:
      "hidden",

    flexShrink:
      1,

    gridColumn:
      isMobile

        ? "1"

        : undefined,

    gridRow:
      isMobile

        ? "1"

        : undefined,

  };


  /* =========================================================
     LOGO
  ========================================================= */

  const logoStyle: CSSProperties = {

    display:
      header.brandVisible
        ? "block"
        : "none",

    minWidth:
      0,

    maxWidth:
      "100%",

    fontSize:
      `${header.titleSize}px`,

    fontWeight:
      900,

    color:
      "#FFFFFF",

    letterSpacing:
      "1px",

    userSelect:
      "none",

    whiteSpace:
      "nowrap",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    flexShrink:
      1,

  };


  /* =========================================================
     CENTER
  ========================================================= */

  const centerStyle: CSSProperties = {

    minWidth:
      0,

    width:
      "100%",

    maxWidth:
      "100%",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    boxSizing:
      "border-box",

    overflow:
      "hidden",

    flexShrink:
      1,

    gridColumn:
      isMobile

        ? "1 / -1"

        : undefined,

    gridRow:
      isMobile

        ? "2"

        : undefined,

  };


  /* =========================================================
     DEPARTMENT
  ========================================================= */

  const departmentStyle: CSSProperties = {

    minWidth:
      0,

    maxWidth:
      "100%",

    fontSize:
      `${header.titleSize}px`,

    fontWeight:
      700,

    color:
      "#F4D27A",

    letterSpacing:
      ".5px",

    marginBottom:
      "6px",

    whiteSpace:
      "nowrap",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    textAlign:
      "center",

    textShadow:
      "0 2px 8px rgba(0,0,0,.35)",

  };


  /* =========================================================
     RIGHT
  ========================================================= */

  const rightStyle: CSSProperties = {

    minWidth:
      0,

    width:
      "auto",

    maxWidth:
      "100%",

    display:
      "flex",

    justifyContent:
      "flex-end",

    alignItems:
      "center",

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    overflow:
      "hidden",

    flexShrink:
      1,

    gridColumn:
      isMobile

        ? "2"

        : undefined,

    gridRow:
      isMobile

        ? "1"

        : undefined,

  };


  /* =========================================================
     ACTION
  ========================================================= */

  const actionStyle: CSSProperties = {

    minWidth:
      `${button.minHeight}px`,

    height:
      `${button.height}px`,

    cursor:
      "pointer",

    fontSize:
      `${button.fontSize}px`,

    userSelect:
      "none",

    color:
      "#FFFFFF",

    transition:
      "all .25s ease",

    boxSizing:
      "border-box",

    flexShrink:
      1,

  };


  /* =========================================================
     BACK BUTTON
  ========================================================= */

  const backButtonStyle: CSSProperties = {

    width:
      `${button.minHeight}px`,

    height:
      `${button.height}px`,

    minWidth:
      `${button.minHeight}px`,

    minHeight:
      `${button.height}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      "1px solid rgba(212,175,55,.45)",

    background:
      canGoBack

        ? "rgba(255,255,255,.08)"

        : "rgba(255,255,255,.03)",

    color:
      canGoBack

        ? "#F4D27A"

        : "rgba(244,210,122,.30)",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      canGoBack

        ? "pointer"

        : "default",

    opacity:
      canGoBack

        ? 1

        : 0.55,

    transition:
      "all 160ms ease",

    padding:
      0,

    flexShrink:
      0,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     BACK ICON
  ========================================================= */

  const backIconStyle: CSSProperties = {

    fontSize:
      `${button.fontSize + 8}px`,

    lineHeight:
      1,

    fontWeight:
      600,

    transform:
      "translateY(-1px)",

    userSelect:
      "none",

  };


  /* =========================================================
     LOGOUT BUTTON
  ========================================================= */

  const logoutButtonStyle: CSSProperties = {

    height:
      `${button.height}px`,

    minHeight:
      `${button.height}px`,

    minWidth:
      `${button.minHeight}px`,

    maxWidth:
      "100%",

    padding:
      `0 ${tokens.spacing.medium}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      "1px solid rgba(212,175,55,.45)",

    background:
      "rgba(255,255,255,.08)",

    color:
      "#F4D27A",

    cursor:
      "pointer",

    fontWeight:
      700,

    fontSize:
      `${button.fontSize}px`,

    transition:
      "all 160ms ease",

    flexShrink:
      0,

    boxSizing:
      "border-box",

    whiteSpace:
      "nowrap",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    leftStyle,

    logoStyle,

    centerStyle,

    departmentStyle,

    rightStyle,

    actionStyle,

    backButtonStyle,

    backIconStyle,

    logoutButtonStyle,

  };

}


/* ===========================================================
   END
=========================================================== */