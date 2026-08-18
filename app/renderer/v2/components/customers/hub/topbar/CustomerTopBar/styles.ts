/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   RESPONSIVE STYLES

   RESPONSIBILITY:
   - Customer Top Bar presentation only
   - Responsive Engine token consumption
   - No breakpoint pixel values
   - No business logic
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/tokens";

/* ===========================================================
   COLORS
=========================================================== */

const COLORS = {

  background:
    "#FFFFFF",

  border:
    "#E5E7EB",

  text:
    "#0F172A",

  muted:
    "#64748B",

  shadow:
    "rgba(15,23,42,0.06)",

} as const;


/* ===========================================================
   RESPONSIVE STYLE FACTORY
=========================================================== */

export function createCustomerTopBarStyles(
  tokens: ResponsiveTokens,
) {

  const isMobile =
    tokens.meta.viewport === "verySmallMobile" ||
    tokens.meta.viewport === "mobile" ||
    tokens.meta.viewport === "largeMobile";


  const isTablet =
    tokens.meta.viewport === "tablet";


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
      COLORS.background,

    border:
      `${tokens.border.width}px solid ${COLORS.border}`,

    borderRadius:
      `${tokens.border.radius}px`,

    boxShadow:
      `0 10px 30px ${COLORS.shadow}`,

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
  ============================================================ */

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
      COLORS.text,

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
  ============================================================ */

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
      COLORS.muted,

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
  ============================================================ */

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