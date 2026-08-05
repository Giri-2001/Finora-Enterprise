/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  overflow: "visible",

}

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  padding: "24px",

  borderBottom: "1px solid #E2E8F0",

  background:
    "linear-gradient(180deg,#FFFFFF,#F8FAFC)",

};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "22px",

  fontWeight: 700,

  color: "#0F172A",

};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  marginTop: "6px",

  color: "#64748B",

  fontSize: "14px",

};

/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "16px",

  width: "100%",

};

/* ===========================================================
   WORKSPACE
=========================================================== */

export const workspaceStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "460px 1fr",

  gap: "16px",

  padding: "8px 0 0",

  alignItems: "stretch",

  width: "100%",

  minHeight: "0px",

  boxSizing: "border-box",

};

/* ===========================================================
   LEFT COLUMN
=========================================================== */

export const leftColumnStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "20px",

  height: "100%",

};
/* ===========================================================
   RIGHT COLUMN
=========================================================== */

export const rightColumnStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "20px",

  height: "100%",

};

/* ===========================================================
   PANEL
=========================================================== */

export const panelStyle: CSSProperties = {

  background: "#FFFFFF",

  border: "1px solid #E5E7EB",

  borderRadius: "24px",

  padding: "28px",

  boxShadow: "0 16px 40px rgba(15,23,42,.08)",

  boxSizing: "border-box",

};
