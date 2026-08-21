/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   RESPONSIVE + THEME STYLES

   RESPONSIBILITY:
   - Customer Top Bar presentation only
   - Responsive Engine token consumption
   - FINORA Theme Engine visual token consumption
   - No breakpoint pixel values
   - No business logic
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/tokens";

import type {
  FinoraTheme,
} from "../../../../../themes/core/types";


/* ===========================================================
   RESPONSIVE STYLE FACTORY
=========================================================== */

export function createCustomerTopBarStyles(
  tokens: ResponsiveTokens,
  theme: FinoraTheme,
) {


  /* =========================================================
     VIEWPORT CONTRACT
     
     Responsive Engine supported values:
       mobile
       tablet
       laptop
       desktop

     This component consumes the resolved viewport only.
     It does not define breakpoint values.
  ========================================================= */

  const isMobile =
    tokens.meta.viewport ===
      "mobile";


  const isTablet =
    tokens.meta.viewport ===
      "tablet";


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      isMobile
        ? "column"
        : "row",

    alignItems:
      isMobile
        ? "stretch"
        : "center",

    justifyContent:
      "space-between",

    flexWrap:
      isMobile
        ? "nowrap"
        : "wrap",

    gap:
      tokens.spacing.control,

    width:
      "100%",

    minWidth:
      0,

    padding:
      `${tokens.spacing.section}px ${tokens.spacing.page}px`,

    background:
      theme.components.header.background,

    border:
      `${tokens.border.width}px solid ${theme.components.header.border}`,

    borderRadius:
      `${tokens.border.radius}px`,

    boxShadow:
      `0 10px 30px ${theme.colors.overlay.shadow}`,

    marginBottom:
      tokens.spacing.section,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     LEFT
  ========================================================= */

  const leftSectionStyle:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      tokens.spacing.small,

    flex:
      isMobile
        ? "0 0 auto"
        : "1 1 0",

    minWidth:
      0,

    maxWidth:
      "100%",

    boxSizing:
      "border-box",

  };


  /* =========================================================
     CENTER
  ========================================================= */

  const centerSectionStyle:
    CSSProperties = {

    flex:
      isMobile
        ? "0 0 auto"
        : isTablet
          ? "1 1 100%"
          : "1.4 1 0",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      isMobile
        ? "stretch"
        : "center",

    width:
      isMobile
        ? "100%"
        : "auto",

    minWidth:
      0,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     RIGHT
  ========================================================= */

  const rightSectionStyle:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      isMobile
        ? "stretch"
        : "flex-end",

    flexWrap:
      "wrap",

    gap:
      tokens.spacing.inline,

    flex:
      isMobile
        ? "0 0 auto"
        : "1 1 0",

    width:
      isMobile
        ? "100%"
        : "auto",

    minWidth:
      0,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle:
    CSSProperties = {

    margin:
      0,

    minWidth:
      0,

    fontSize:
      `${tokens.typography.title}px`,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.title,

    color:
      theme.components.header.text,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      isMobile
        ? "normal"
        : "nowrap",

    boxSizing:
      "border-box",

  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle:
    CSSProperties = {

    margin:
      0,

    minWidth:
      0,

    fontSize:
      `${tokens.typography.subheading}px`,

    lineHeight:
      tokens.lineHeight.body,

    color:
      theme.colors.text.muted,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      isMobile
        ? "normal"
        : "nowrap",

    boxSizing:
      "border-box",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    leftSectionStyle,

    centerSectionStyle,

    rightSectionStyle,

    titleStyle,

    subtitleStyle,

  };

}


/* ===========================================================
   END
=========================================================== */