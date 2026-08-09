/* ===========================================================
   FINORA ENTERPRISE V2
   STEP 4 — KYC STUDIO
   PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   MASTER FINORA SMART WALL BACKGROUND
=========================================================== */

const smartWallBackground = `
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
`;

/* ===========================================================
   PAGE
=========================================================== */

export const pageStyle: CSSProperties = {
  width: "100%",
  height: "80vh",
  minHeight: "80vh",
  maxHeight: "80vh",

  boxSizing: "border-box",

  padding: "9px 18px 6px",

  display: "flex",
  flexDirection: "column",

  gap: "9px",

  overflow: "hidden",

  background:
    smartWallBackground,

  color: "#FFFFFF",
};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {
  flexShrink: 0,

  minHeight: "43px",

  display: "flex",
  alignItems: "center",

  gap: "12px",

  paddingBottom: "8px",

  borderBottom:
    "1px solid rgba(214,176,106,.22)",
};

export const headerIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",

  flexShrink: 0,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  borderRadius: "50%",

  background:
    "linear-gradient(145deg,#E9B83E,#A86D16)",

  border:
    "1px solid rgba(255,220,125,.75)",

  boxShadow:
    "0 4px 12px rgba(0,0,0,.24)",

  fontSize: "18px",
};

export const headerTextStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",
  flexDirection: "column",
};

export const titleStyle: CSSProperties = {
  margin: 0,

  color: "#FFFFFF",

  fontSize: "20px",

  lineHeight: 1.15,

  fontWeight: 900,

  letterSpacing: ".05px",
};

export const subtitleStyle: CSSProperties = {
  margin: "3px 0 0",

  color:
    "rgba(255,255,255,.68)",

  fontSize: "10.5px",

  lineHeight: 1.35,

  fontWeight: 600,
};

/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle: CSSProperties = {
  flex: "1 1 auto",

  minHeight: 0,

  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1.28fr) minmax(320px, .72fr)",

  gap: "12px",

  overflow: "hidden",
};

/* ===========================================================
   LEFT COLUMN
=========================================================== */

export const leftColumnStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 0,

  display: "grid",

  /*
    CONTENT-FIT LEFT WORKSPACE

    Identity Information:
    Enough height for the complete 2x2 KYC form.

    Document Upload:
    Increased enough for title, upload card and helper text.

    Verification Status:
    Increased enough for the complete status row and note.

    The three panels intentionally consume almost the
    complete available left-side workspace.
  */

  gridTemplateRows:
    "200px 155px 155px",

  gap: "9px",

  alignContent: "start",

  overflow: "hidden",
};

/* ===========================================================
   RIGHT COLUMN
=========================================================== */

export const rightColumnStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 0,

  display: "grid",

  /*
    Give KYC Preview more vertical space so the complete
    preview card and status remain visible.
  */

  gridTemplateRows:
    "minmax(0, 1.35fr) 135px 100px",

  gap: "9px",

  overflow: "hidden",
};

/* ===========================================================
   PANEL
=========================================================== */

export const panelStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 0,

  display: "flex",
  flexDirection: "column",

  boxSizing: "border-box",

  padding: "12px 14px",

  borderRadius: "16px",

  border:
    "1.5px solid rgba(214,176,106,.34)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))",

  boxShadow:
    "0 10px 28px rgba(0,0,0,.14)",

  overflow: "hidden",
};

/* ===========================================================
   PANEL HEADER
=========================================================== */

export const panelHeaderStyle: CSSProperties = {
  flexShrink: 0,

  display: "flex",
  alignItems: "center",

  minHeight: "34px",

  paddingBottom: "7px",

  marginBottom: "8px",

  borderBottom:
    "1px solid rgba(214,176,106,.17)",
};

export const panelTitleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "15px",

  lineHeight: 1.2,

  fontWeight: 850,

  letterSpacing: ".1px",
};

export const panelSubtitleStyle: CSSProperties = {
  margin: "2px 0 0",

  color:
    "rgba(255,255,255,.50)",

  fontSize: "9.5px",

  lineHeight: 1.3,
};

/* ===========================================================
   STATUS ROW
=========================================================== */

export const statusRowStyle: CSSProperties = {
  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(3,minmax(0,1fr))",

  gap: "9px",

  minHeight: 0,
};

export const statusItemStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",
  flexDirection: "column",

  alignItems: "center",
  justifyContent: "center",

  gap: "5px",

  padding: "9px 7px",

  borderRadius: "11px",

  border:
    "1px solid rgba(214,176,106,.20)",

  background:
    "rgba(0,0,0,.15)",
};

export const statusLabelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.55)",

  fontSize: "9px",

  fontWeight: 700,

  textTransform: "uppercase",

  letterSpacing: ".4px",
};

export const statusValueStyle: CSSProperties = {
  color: "#F0C75E",

  fontSize: "12px",

  fontWeight: 850,
};

/* ===========================================================
   FOOTER NOTE
=========================================================== */

export const footerNoteStyle: CSSProperties = {
  margin: "19px 0 0",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  lineHeight: 1.4,

  fontWeight: 550,
};
