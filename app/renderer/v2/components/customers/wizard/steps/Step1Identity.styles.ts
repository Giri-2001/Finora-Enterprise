/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 1 — IDENTITY STUDIO™

   PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   PAGE
=========================================================== */

export const pageStyle: CSSProperties = {
  width: "100%",
  height: "100%",

  display: "grid",

  gridTemplateColumns:
    "minmax(180px, 20%) minmax(0, 60%) minmax(180px, 20%)",

  gap: "18px",

  alignItems: "stretch",

  boxSizing: "border-box",

  overflow: "hidden",

  padding:
    "14px 10px 0px",

  /* =========================================================
     FINORA MASTER SMART WALL BACKGROUND

     Exact background from CustomerSmartWall.
     This is now the locked FINORA page background.
  ========================================================= */

  background:
    `
    linear-gradient(
      rgba(18,12,8,.35),
      rgba(18,12,8,.35)
    ),

    linear-gradient(
      90deg,
      #3A2115 0%,
      #5B3420 25%,
      #402417 50%,
      #5B3420 75%,
      #321B12 100%
    )
    `,
};

/* ===========================================================
   LEFT — CUSTOMER IDENTITY CARD
=========================================================== */

export const leftPanelStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "flex-start",

  justifyContent: "center",

  paddingTop: "12px",

  boxSizing: "border-box",

  overflow: "visible",
};

/* ===========================================================
   ID CARD HOLDER
=========================================================== */

export const idCardHolderStyle: CSSProperties = {
  width: "180px",

  height: "350px",

  flexShrink: 0,

  display: "flex",

  alignItems: "flex-start",

  justifyContent: "center",

  position: "relative",

  overflow: "visible",
};

/* ===========================================================
   CENTER — FORM PANEL
=========================================================== */

export const formPanelStyle: CSSProperties = {
  minWidth: 0,

  minHeight: 0,

  height: "100%",

  display: "flex",

  flexDirection: "column",

  boxSizing: "border-box",

  padding:
    "18px 20px",

  borderRadius: "18px",

  border:
    "1px solid rgba(214,176,106,.24)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))",

  boxShadow:
    "0 16px 40px rgba(0,0,0,.16)",

  overflow: "hidden",
};

/* ===========================================================
   FORM HEADER
=========================================================== */

export const formHeaderStyle: CSSProperties = {
  flexShrink: 0,

  marginBottom: "12px",

  paddingBottom: "10px",

  borderBottom:
    "1px solid rgba(214,176,106,.16)",
};

/* ===========================================================
   FORM TITLE
=========================================================== */

export const formTitleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "18px",

  fontWeight: 800,

  letterSpacing: ".2px",
};

/* ===========================================================
   FORM SUBTITLE
=========================================================== */

export const formSubtitleStyle: CSSProperties = {
  margin:
    "4px 0 0",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  lineHeight: 1.45,
};

/* ===========================================================
   PHOTO AREA
=========================================================== */

export const photoSectionStyle: CSSProperties = {
  flexShrink: 0,

  marginBottom: "12px",
};

/* ===========================================================
   FORM BODY
=========================================================== */

export const formBodyStyle: CSSProperties = {
  minHeight: 0,

  flex: 1,

  overflow: "hidden",

  display: "flex",

  flexDirection: "column",
};

/* ===========================================================
   RIGHT — LIVE PREVIEW
=========================================================== */

export const rightPanelStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "flex-start",

  justifyContent: "center",

  paddingTop: "12px",

  boxSizing: "border-box",

  overflow: "hidden",
};

/* ===========================================================
   RIGHT PREVIEW HOLDER
=========================================================== */

export const previewHolderStyle: CSSProperties = {
  width: "100%",

  maxWidth: "250px",

  display: "flex",

  justifyContent: "center",

  boxSizing: "border-box",
};

/* ===========================================================
   DESKTOP SAFETY
=========================================================== */

export const desktopCardStyle: CSSProperties = {
  flexShrink: 0,

  width: "180px",

  height: "350px",

  overflow: "visible",
};

/* ===========================================================
   RESPONSIVE NOTE
=========================================================== */

/*
  The global FINORA shell controls viewport responsiveness.

  We intentionally do not introduce page scrolling here.
  Narrow layouts should compress the presentation rather
  than create an independent page scroll.
*/
