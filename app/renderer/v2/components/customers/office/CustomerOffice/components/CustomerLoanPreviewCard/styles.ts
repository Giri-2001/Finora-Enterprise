/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PREVIEW CARD™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  width: "100%",

  height: "190px",

  background: "#FFFDF9",

  border: "1px solid #D8C7A4",

  borderRadius: "22px",

  overflow: "hidden",

  display: "flex",

  flexDirection: "column",

  boxShadow:
    "0 10px 24px rgba(15,23,42,.08)",

};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  background:
    "linear-gradient(180deg,#6F4A23,#8A6135)",

  padding: "10px 14px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

};

export const titleStyle: CSSProperties = {

  color: "#F8E7B2",

  fontSize: "17px",

  fontWeight: 700,

};
/* ===========================================================
   BODY
=========================================================== */

export const bodyStyle: CSSProperties = {

  flex: 1,

  padding: "12px",

  display: "flex",

  flexDirection: "column",

};

/* ===========================================================
   GRID
=========================================================== */

export const gridStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "1fr 1fr",

  gap: "10px",

  flex: 1,

};


/* ===========================================================
   RUNNING CARD
=========================================================== */



/* ===========================================================
   CLOSED CARD
=========================================================== */



/* ===========================================================
   OUTSTANDING CARD
=========================================================== */


/* ===========================================================
   EMI CARD
=========================================================== */



/* ===========================================================
   STAT CARD
=========================================================== */

export const statCardStyle: CSSProperties = {

  background: "#FFF8EA",

  border: "1px solid #D9B66C",

  borderRadius: "14px",

  padding: "10px",

  textAlign: "center",

};

export const statLabelStyle: CSSProperties = {

  fontSize: "12px",

  fontWeight: 600,

  color: "#8B5E34",

};

export const statValueStyle: CSSProperties = {

  marginTop: "6px",

  fontSize: "20px",

  fontWeight: 700,

  color: "#8A612B",

};

export const runningCardStyle: CSSProperties = {

  ...statCardStyle,

};

export const closedCardStyle: CSSProperties = {

  ...statCardStyle,

};

export const outstandingCardStyle: CSSProperties = {

  ...statCardStyle,

};

export const emiCardStyle: CSSProperties = {

  ...statCardStyle,

};


/* ===========================================================
   VALUES
=========================================================== */

export const runningValueStyle: CSSProperties = {

  ...statValueStyle,

  color: "#15803D",

};

export const closedValueStyle: CSSProperties = {

  ...statValueStyle,

  color: "#B91C1C",

};

export const moneyValueStyle: CSSProperties = {

  ...statValueStyle,

  fontSize: "18px",

  color: "#8A612B",

};

export const emiValueStyle: CSSProperties = {

  ...statValueStyle,

  color: "#8A612B",

};

/* ===========================================================
   FOOTER
=========================================================== */

export const footerStyle: CSSProperties = {

  borderTop: "1px solid #E7D6B3",

  background: "#FFFCF6",

  padding: "10px 14px",

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

};

export const footerLabelStyle: CSSProperties = {

  color: "#7C5A2C",

  fontSize: "13px",

  fontWeight: 600,

};

export const footerArrowStyle: CSSProperties = {

  color: "#8A6135",

  fontSize: "18px",

  fontWeight: 700,

  cursor: "pointer",

};

/* ===========================================================
   BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {

  width: "100%",

  height: "34px",

  border: "1px solid #C9A45C",

  borderRadius: "10px",

  background:
    "linear-gradient(180deg,#A67C38,#7A5625)",

  color: "#FFFFFF",

  fontSize: "11px",

  fontWeight: 700,

  cursor: "pointer",

};
