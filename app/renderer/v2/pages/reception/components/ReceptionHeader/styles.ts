/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HEADER™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  gap: "12px",

  padding: "48px 24px 24px",

};

/* ===========================================================
   LOGO
=========================================================== */

export const logoStyle: CSSProperties = {

  width: "120px",

  height: "120px",

  objectFit: "contain",

};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "42px",

  fontWeight: 800,

  color: "#111827",

  letterSpacing: "1px",

  textAlign: "center",

};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: 0,

  fontSize: "20px",

  fontWeight: 600,

  color: "#6B7280",

  textAlign: "center",

};

/* ===========================================================
   DESCRIPTION
=========================================================== */

export const descriptionStyle: CSSProperties = {

  maxWidth: "700px",

  margin: 0,

  fontSize: "15px",

  lineHeight: 1.7,

  color: "#94A3B8",

  textAlign: "center",

};

/* ===========================================================
   VERSION
=========================================================== */

export const versionStyle: CSSProperties = {

  marginTop: "8px",

  padding: "6px 14px",

  borderRadius: "999px",

  background: "#FFFFFF",

  border: "1px solid #E2E8F0",

  fontSize: "12px",

  fontWeight: 700,

  color: "#6F4A23",

};
