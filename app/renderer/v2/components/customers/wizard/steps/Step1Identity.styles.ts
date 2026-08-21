/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 1 — IDENTITY STUDIO™

   PRESENTATION STYLES

   Version : 3.0
   Status  : Production
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

import type {
  FinoraTheme,
} from "../../../../themes/core/types";

/* ===========================================================
   TYPES
=========================================================== */

export interface Step1IdentityStyles {

  pageStyle:
    CSSProperties;

  formPanelStyle:
    CSSProperties;

  formHeaderStyle:
    CSSProperties;

  formTitleStyle:
    CSSProperties;

  formSubtitleStyle:
    CSSProperties;

  photoSectionStyle:
    CSSProperties;

  formBodyStyle:
    CSSProperties;
}

/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createStep1IdentityStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): Step1IdentityStyles {

  /* =========================================================
     TOKEN GROUPS
  ========================================================= */

  const spacing =
    tokens.spacing;

  const border =
    tokens.border;

  const input =
    tokens.input;

  const wizard =
    tokens.wizard;

  const layout =
    tokens.layout;

  /* =========================================================
     THEME
  ========================================================= */

  const pageBackground =
    theme
      .colors
      .background
      .page;

  const surface =
    theme
      .colors
      .background
      .surface;

  const surfaceMuted =
    theme
      .colors
      .background
      .surfaceMuted;

  const borderSubtle =
    theme
      .colors
      .border
      .subtle;

  const textPrimary =
    theme
      .colors
      .text
      .primary;

  const textSecondary =
    theme
      .colors
      .text
      .secondary;

  const shadow =
    theme
      .colors
      .overlay
      .shadow;

  /* =========================================================
     PAGE
  ========================================================= */

  const pageStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    height:
      "100%",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    boxSizing:
      "border-box",

    overflow:
      "auto",

    padding:
      `${wizard.padding}px ${layout.pageGutter}px ${spacing.large}px`,

    background:
      pageBackground,

    color:
      textPrimary,
  };

/* ===========================================================
   IDENTITY CARD / FORM PANEL
=========================================================== */

const formPanelStyle: CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  minWidth:
    0,

  maxWidth:
    "100%",

  boxSizing:
    "border-box",

  display:
    "flex",

  flexDirection:
    "column",

  alignSelf:
    "stretch",

minHeight:
  0,

  flex:
  1,

  /* =========================================================
     FINORA CUSTOMER IDENTITY CARD
  ========================================================= */

  padding:
    "18px 20px",

  border:
  `${border.width + 1}px solid ${borderSubtle}`,

  borderRadius:
    "16px",

  background:
  `linear-gradient(145deg, ${surfaceMuted}, ${surface})`,

  boxShadow:
    "0 10px 28px rgba(0,0,0,.12)",

};

  /* =========================================================
     FORM HEADER
  ========================================================= */

  const formHeaderStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    flexShrink:
      0,

    margin:
      0,

    marginBottom:
      spacing.medium,

    paddingBottom:
      spacing.medium,

    borderBottom:
      `${border.width}px solid ${borderSubtle}`,

    boxSizing:
      "border-box",
  };

  /* =========================================================
     FORM TITLE
  ========================================================= */

  const formTitleStyle:
    CSSProperties = {

    margin:
      0,

    color:
      textPrimary,

    fontSize:
      `${tokens.typography.heading}px`,

    fontWeight:
      800,

    lineHeight:
      tokens.lineHeight.heading,

    letterSpacing:
      ".1px",
  };

  /* =========================================================
     FORM SUBTITLE
  ========================================================= */

  const formSubtitleStyle:
    CSSProperties = {

    margin:
      `${spacing.small}px 0 0`,

    color:
      textSecondary,

    fontSize:
      `${tokens.typography.body}px`,

    lineHeight:
      tokens.lineHeight.body,

    fontWeight:
      500,
  };

  /* =========================================================
     PHOTO SECTION
  ========================================================= */

  const photoSectionStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      `${input.height + spacing.large + spacing.small}px`,

    flexShrink:
      0,

    marginBottom:
      spacing.medium,

    padding:
      `${spacing.small}px`,

    boxSizing:
      "border-box",

    display:
      "flex",

    alignItems:
      "stretch",

    overflow:
      "visible",
  };

  /* =========================================================
     FORM BODY
  ========================================================= */

  const formBodyStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    boxSizing:
      "border-box",

    overflow:
      "visible",
  };

  return {

    pageStyle,

    formPanelStyle,

    formHeaderStyle,

    formTitleStyle,

    formSubtitleStyle,

    photoSectionStyle,

    formBodyStyle,

  };

}

/* ===========================================================
   DEFAULT STYLES
=========================================================== */

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

  flexDirection:
    "column",

  alignItems:
    "center",

    padding:
  "10px 18px 4px",

};

export const formPanelStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

};

export const formHeaderStyle:
  CSSProperties = {

  width:
    "100%",

  flexShrink:
    0,

};

export const formTitleStyle:
  CSSProperties = {

  margin:
    0,

};

export const formSubtitleStyle:
  CSSProperties = {

  margin:
    0,

};

export const photoSectionStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

};

export const formBodyStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

};

/* ===========================================================
   END
=========================================================== */