/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ID CARD™

   PREMIUM PRESENTATION STYLES
=========================================================== */


import type {
  CSSProperties,
} from "react";



/* ===========================================================
   ROOT
=========================================================== */

export const cardStyle: CSSProperties = {

  width: "180px",

  height: "350px",

  background:
  `
  linear-gradient(
    135deg,
    rgba(255,255,255,.65),
    transparent 35%
  ),
  linear-gradient(
    180deg,
    #FFFDF9 0%,
    #FEFBF5 60%,
    #FCF5E8 100%
  )
  `,

  paddingBottom:"8px",


  borderRadius: "22px",


  overflow:"hidden",


  border:
"1px solid rgba(180,145,82,.35)",


 boxShadow:
`
0 25px 55px rgba(0,0,0,.30),
0 8px 20px rgba(180,145,82,.25)
`,


  position:"relative",


  display:"flex",

  flexDirection:"column",

};


/* ===========================================================
   STATUS HEADER
=========================================================== */

export const statusHeaderStyle: CSSProperties = {

  height: "5px",

};



/* ===========================================================
   COMPANY BRAND
=========================================================== */

export const companyStyle: CSSProperties = {

textAlign:"center",

marginTop:"8px",

fontSize:"13px",

fontWeight:700,

letterSpacing:"1.2px",

lineHeight:1.1,

color:"#8A612B",

textTransform:"uppercase",

};


/* ===========================================================
   CARD TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  textAlign: "center",

  fontSize: "12px",

  fontWeight: 600,

  color:"#7C7C7C",

  letterSpacing:"2px",

  marginTop:"2px",

  textTransform:"uppercase",

};



/* ===========================================================
   PHOTO
=========================================================== */

export const photoStyle: CSSProperties = {

width:"82px",

height:"82px",

margin:"14px auto 10px",

borderRadius:"50%",

background:
`
linear-gradient(
180deg,
#FFFFFF,
#E8EEF7
)
`,

border:
"4px solid rgba(255,255,255,.9)",

boxShadow:
`
0 12px 35px rgba(0,0,0,.25),
inset 0 0 10px rgba(255,255,255,.8)
`,

display:"flex",

alignItems:"center",

justifyContent:"center",

overflow:"hidden",

};

/* ===========================================================
   NAME
=========================================================== */

export const nameStyle: CSSProperties = {

  textAlign:"center",

  fontSize:"16px",

  fontWeight:700,

  color:"#1E293B",

  marginTop:"2px",

};


/* ===========================================================
   CUSTOMER ID
=========================================================== */

export const customerIdStyle: CSSProperties = {

  textAlign:"center",

  margin:"12px auto 0",

  padding:"5px 12px",

  borderRadius:"999px",

  background:
  "linear-gradient(180deg,#F8E8C5,#EACB8B)",


  border:
  "1px solid rgba(180,145,82,.45)",


  fontSize:"11px",

  fontWeight:700,

  color:"#5A3B16",

  width:"fit-content",

};


/* ===========================================================
   KYC
=========================================================== */

export const kycStyle: CSSProperties = {

  display:"inline-flex",

  alignItems:"center",

  justifyContent:"center",

  margin:"8px auto 0",

  padding:"4px 12px",

  borderRadius:"999px",

  background:"#ECFDF3",

  fontSize:"10px",

  fontWeight:700,

};



/* ===========================================================
   BRANCH
=========================================================== */

export const branchStyle: CSSProperties = {

  textAlign:"center",

  marginTop:"8px",

  fontSize:"11px",

  color:"#6B7280",

};



/* ===========================================================
   QR REMOVED FROM FRONT FACE

   BACK SIDE / DIGITAL VIEW LO USE CHEYYALI
=========================================================== */

export const qrStyle: CSSProperties = {

  display:"none",

};
