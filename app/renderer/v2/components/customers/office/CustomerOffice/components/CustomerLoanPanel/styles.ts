/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   CONTAINER
=========================================================== */

export const containerStyle: CSSProperties = {

  background: "#FFFFFF",

  border: "1px solid #E2E8F0",

  borderRadius: "24px",

  padding: "18px",

  boxShadow:
    "0 16px 40px rgba(15,23,42,.08)",

  display:"flex",

  flexDirection:"column",

  gap:"14px",

  height:"100%",

  boxSizing:"border-box",

  overflow:"hidden",

};

/* ===========================================================
   HEADER
=========================================================== */

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 700,
  color: "#0F172A",
};

export const subtitleStyle: CSSProperties = {
  marginTop: "6px",
  color: "#64748B",
  fontSize: "14px",
};

/* ===========================================================
   STATISTICS
=========================================================== */

export const statisticsGridStyle: CSSProperties = {

 display:"grid",

 gridTemplateColumns:"repeat(4,1fr)",

 gap:"10px",

};

export const statisticCardStyle: CSSProperties = {

 borderRadius:"14px",

 border:"1px solid #D6B36A",

 background:
 "linear-gradient(180deg,#FFFDF8,#FFF6E6)",

 padding:"12px",

};

export const statisticLabelStyle: CSSProperties = {
  color: "#7C5A2C",
  fontSize: "13px",
  fontWeight: 600,
};

export const runningValueStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "22px",
  fontWeight: 700,
  color: "#15803D",
};

export const closedValueStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "22px",
  fontWeight: 700,
  color: "#B91C1C",
};

export const amountValueStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "22px",
  fontWeight: 700,
  color: "#8B5E34",
};

/* ===========================================================
   LOANS
=========================================================== */

export const loansSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  marginTop: "4px",
};

/* ===========================================================
   LOAN SECTION HEADER
=========================================================== */

export const sectionTitleStyle: CSSProperties = {

  margin: 0,

  fontSize: "16px",

  fontWeight: 700,

  color: "#0F172A",

};


export const emptyStateStyle: CSSProperties = {

  padding: "24px",

  textAlign: "center",

  borderRadius: "16px",

  border: "1px dashed #D6B36A",

  background:
    "linear-gradient(180deg,#FFFDF8,#FFF8EC)",

  color: "#7C5A2C",

  fontSize: "14px",

};
