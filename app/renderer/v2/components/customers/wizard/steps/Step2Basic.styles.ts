/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 2 — BASIC DETAILS

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

  display: "flex",
  flexDirection: "column",

  boxSizing: "border-box",

  /*
   * No top page heading here.
   * Step 2 directly presents the three premium sections.
   */

  padding:
    "10px 18px 4px",

  overflow: "hidden",

  color: "#F8FAFC",

  /* =========================================================
     FINORA MASTER SMART WALL BACKGROUND

     Exact background from CustomerSmartWall.
     Shared FINORA enterprise background.
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
   PAGE HEADER
   Kept for compatibility.
   Step2Basic no longer renders this header.
=========================================================== */

export const pageHeaderStyle: CSSProperties = {
  display: "none",
};

/* ===========================================================
   PAGE TITLE
=========================================================== */

export const pageTitleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "18px",

  lineHeight: 1.2,

  fontWeight: 600,
};

/* ===========================================================
   PAGE SUBTITLE
=========================================================== */

export const pageSubtitleStyle: CSSProperties = {
  margin:
    "4px 0 0",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  lineHeight: 1.4,
};

/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle: CSSProperties = {
  flex: 1,

  minHeight: 0,

  width: "100%",

  display: "grid",

  gridTemplateRows:
    "repeat(3,minmax(0,1fr))",

  gap: "14px",

  padding: "0 0 0",

  margin: 0,

  boxSizing: "border-box",

  overflow: "hidden",
};

/* ===========================================================
   PREMIUM SECTION
=========================================================== */

export const sectionStyle: CSSProperties = {
  minHeight: 0,

  width: "100%",

  display: "flex",

  flexDirection: "column",

  boxSizing: "border-box",

  padding:
    "13px 14px 12px",

  borderRadius: "17px",

  border:
    "1.5px solid rgba(214,176,106,.34)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))",

  boxShadow:
    "0 10px 28px rgba(0,0,0,.12)",

  overflow: "hidden",
};

/* ===========================================================
   SECTION HEADER
=========================================================== */

export const sectionHeaderStyle: CSSProperties = {
  flexShrink: 0,

  minHeight: "45px",

  display: "flex",

  alignItems: "center",

  gap: "12px",

  paddingBottom: "10px",

  marginBottom: "11px",

  borderBottom:
    "1px solid rgba(214,176,106,.20)",

  boxSizing: "border-box",
};

/* ===========================================================
   SECTION ICON
=========================================================== */

export const sectionIconStyle: CSSProperties = {
  width: "38px",

  height: "38px",

  flexShrink: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  borderRadius: "50%",

  border:
    "1.5px solid rgba(214,176,106,.72)",

  background:
    "rgba(0,0,0,.20)",

  boxShadow:
    "0 4px 12px rgba(0,0,0,.18)",

  fontSize: "17px",

  lineHeight: 1,
};

/* ===========================================================
   SECTION TITLE
=========================================================== */

export const sectionTitleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "18px",

  lineHeight: 1.2,

  fontWeight: 700,

  letterSpacing: ".25px",
};

/* ===========================================================
   SECTION SUBTITLE
=========================================================== */

export const sectionSubtitleStyle: CSSProperties = {
  margin:
    "3px 0 0",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "12px",

  lineHeight: 1.35,
};

/* ===========================================================
   FIELD AREA
=========================================================== */

export const fieldAreaStyle: CSSProperties = {
  flex: 1,

  minHeight: 0,

  width: "100%",

  display: "flex",

  alignItems: "center",

  boxSizing: "border-box",

  overflow: "hidden",
};

/* ===========================================================
   FOUR COLUMN GRID

   Personal Information
   Occupation Profile
=========================================================== */

export const fourColumnGridStyle: CSSProperties = {
  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(4,minmax(0,1fr))",

  gap: "14px",

  alignItems: "center",

  boxSizing: "border-box",
};

/* ===========================================================
   THREE COLUMN GRID

   Family & Emergency
=========================================================== */

export const threeColumnGridStyle: CSSProperties = {
  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(3,minmax(0,1fr))",

  gap: "14px",

  alignItems: "center",

  boxSizing: "border-box",
};

/* ===========================================================
   GOLD ACCENT

   Intentionally disabled.
=========================================================== */

export const sectionAccentStyle: CSSProperties = {
  display: "none",
};
