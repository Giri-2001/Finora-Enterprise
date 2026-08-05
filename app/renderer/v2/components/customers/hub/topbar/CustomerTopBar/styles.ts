/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  gap: "24px",

  padding: "20px 24px",

  background: "#ffffff",

  borderRadius: "20px",

  border: "1px solid #E5E7EB",

  boxShadow:
    "0 10px 30px rgba(15,23,42,0.06)",

  marginBottom: "24px",
};

/* ===========================================================
   LEFT
=========================================================== */

export const leftSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",

  gap: "6px",

  flex: 1,
};

/* ===========================================================
   CENTER
=========================================================== */

export const centerSectionStyle: CSSProperties = {
  flex: 1.4,

  display: "flex",

  justifyContent: "center",
};

/* ===========================================================
   RIGHT
=========================================================== */

export const rightSectionStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "flex-end",

  gap: "16px",

  flex: 1,
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {
  margin: 0,

  fontSize: "28px",

  fontWeight: 700,

  color: "#0F172A",
};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {
  margin: 0,

  fontSize: "14px",

  color: "#64748B",
};
