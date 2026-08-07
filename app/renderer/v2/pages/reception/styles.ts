/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  minHeight: "100vh",

  width: "100%",

  display: "flex",

  flexDirection: "column",

  justifyContent: "space-between",

  alignItems: "center",

  padding: "48px",

  background:
    "linear-gradient(180deg,#F8FAFC 0%,#EEF2F7 100%)",

  boxSizing: "border-box",

};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  gap: "10px",

};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "38px",

  fontWeight: 800,

  color: "#111827",

  letterSpacing: "1px",

};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: 0,

  fontSize: "18px",

  color: "#6B7280",

};

/* ===========================================================
   DESCRIPTION
=========================================================== */

export const descriptionStyle: CSSProperties = {

  marginTop: "6px",

  fontSize: "14px",

  color: "#94A3B8",

  textAlign: "center",

};

/* ===========================================================
   DOOR GRID
=========================================================== */

export const doorGridStyle: CSSProperties = {

  width: "100%",

  maxWidth: "1200px",

  display: "grid",

  gridTemplateColumns:
    "repeat(3,minmax(280px,1fr))",

  gap: "32px",

  marginTop: "60px",

  marginBottom: "60px",

};

/* ===========================================================
   FOOTER
=========================================================== */

export const footerStyle: CSSProperties = {

  fontSize: "13px",

  color: "#94A3B8",

  textAlign: "center",

};
