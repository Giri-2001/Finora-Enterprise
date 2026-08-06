/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD™

   PREMIUM PRESENTATION STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const cardStyle: CSSProperties = {

  width: "170px",

  height: "290px",

  background:
  "linear-gradient(180deg,#FFFDF9 0%,#FEFBF5 55%,#FCF5E8 100%)",

  borderRadius: "22px",

  overflow: "hidden",

  border: "1px solid rgba(180,145,82,.35)",

 boxShadow:
`
0 24px 50px rgba(0,0,0,.24),
0 8px 18px rgba(139,99,41,.20),
inset 0 1px 0 rgba(255,255,255,.90)
`,

  display: "flex",

  flexDirection: "column",

  transition:
    "all .28s ease",

};
/* ===========================================================
   STATUS HEADER
=========================================================== */

export const statusHeaderStyle: CSSProperties = {

  height: "8px",

};

/* ===========================================================
   COMPANY
=========================================================== */

export const companyStyle: CSSProperties = {

  textAlign: "center",

  marginTop: "12px",

  fontSize: "20px",

  fontWeight: 800,

  letterSpacing: "1px",

  lineHeight: 1.1,

  color: "#8A612B",

  textTransform: "uppercase",

  textShadow:
    "0 1px 0 rgba(255,255,255,.9)",

};

/* ===========================================================
   CARD TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  textAlign: "center",

  fontSize: "10px",

  fontWeight: 600,

  color: "#7C7C7C",

  letterSpacing: "2px",

  marginTop: "2px",

  textTransform: "uppercase",

};

/* ===========================================================
   PHOTO
=========================================================== */

export const photoStyle: CSSProperties = {

  width: "96px",

  height: "96px",

  margin: "12px auto 6px",

  borderRadius: "20px",

  background:
    "linear-gradient(180deg,#F8FBFF,#E8F1FC)",

  border: "3px solid #FFFFFF",

  boxShadow:
`
0 14px 28px rgba(15,23,42,.24),
inset 0 1px rgba(255,255,255,.95)
`,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  overflow: "hidden",

};
/* ===========================================================
   NAME
=========================================================== */

export const nameStyle: CSSProperties = {

  textAlign: "center",

  fontSize: "16px",

  fontWeight: 700,

  color: "#1E293B",

  marginTop: "6px",

  letterSpacing: ".2px",

};

/* ===========================================================
   CUSTOMER ID
=========================================================== */

export const customerIdStyle: CSSProperties = {

  textAlign: "center",

  marginTop: "6px",

  fontSize: "11px",

  fontWeight: 600,

  color: "#5B6473",

};

/* ===========================================================
   KYC
=========================================================== */

export const kycStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  margin: "10px auto 0",

  padding: "4px 12px",

  borderRadius: "999px",

  background: "#ECFDF3",

  fontSize: "10px",

  fontWeight: 700,

  boxShadow:
    "0 2px 6px rgba(34,197,94,.16)",

};

/* ===========================================================
   BRANCH
=========================================================== */

export const branchStyle: CSSProperties = {

  textAlign: "center",

  marginTop: "10px",

  fontSize: "11px",

  color: "#6B7280",

};

/* ===========================================================
   QR
=========================================================== */

export const qrStyle: CSSProperties = {

  width: "50px",

  height: "50px",

  margin: "14px auto 18px",

  borderRadius: "12px",

  background: "#FFFFFF",

  border:
    "2px solid rgba(180,145,82,.45)",

  padding: "5px",

  boxSizing: "border-box",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  boxShadow:
    "0 4px 12px rgba(15,23,42,.18)",

};
