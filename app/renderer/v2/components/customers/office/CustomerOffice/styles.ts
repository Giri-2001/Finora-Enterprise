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

  width: "100%",

  height: "100vh",

  overflow: "hidden",

  boxSizing: "border-box",

};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  padding: "16px 24px",

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

  alignItems: "flex-start",

  justifyContent: "center",

  padding: "8px 16px",

  width: "100%",

  flex: 1,

  overflow: "hidden",

  boxSizing: "border-box",

};

/* ===========================================================
   WORKSPACE
=========================================================== */

export const workspaceStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "380px 1fr",

  gap: "18px",

  padding: "0px 0 0",

  alignItems: "stretch",

  width: "100%",

  flex: 1,

  minHeight: 0,

  height: "100%",

  boxSizing: "border-box",

  overflow:"hidden",

};

/* ===========================================================
   LEFT COLUMN
=========================================================== */

export const leftColumnStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "12px",

  height: "100%",

};

/* ===========================================================
   RIGHT COLUMN
=========================================================== */

export const rightColumnStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "12px",

  height: "100%",

  minHeight:0,

};

/* ===========================================================
   PANEL
=========================================================== */

export const panelStyle: CSSProperties = {

  background:"#FFFFFF",

  border:"1px solid #E5E7EB",

  borderRadius:"24px",

  padding:"18px",

  height:"100%",

  overflow:"hidden",

  boxSizing:"border-box",

  boxShadow:"0 16px 40px rgba(15,23,42,.08)",

};
