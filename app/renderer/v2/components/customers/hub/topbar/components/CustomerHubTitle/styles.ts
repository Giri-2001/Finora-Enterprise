/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HUB TITLE

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",

  gap: "6px",

};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "32px",

  fontWeight: 700,

  lineHeight: 1.2,

  color: "#0F172A",

  letterSpacing: "-0.6px",

};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: 0,

  fontSize: "15px",

  fontWeight: 500,

  color: "#64748B",

  letterSpacing: "0.3px",

};

/* ===========================================================
   VERSION
=========================================================== */

export const versionStyle: CSSProperties = {

  marginTop: "6px",

  fontSize: "12px",

  fontWeight: 600,

  color: "#94A3B8",

  textTransform: "uppercase",

  letterSpacing: "1px",

};
