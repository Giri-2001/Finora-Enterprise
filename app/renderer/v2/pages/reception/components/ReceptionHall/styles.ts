/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HALL™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  width: "100%",

  height: "calc(100vh - 70px)",

  display: "flex",

  flexDirection: "column",

  justifyContent: "flex-start",

  alignItems: "center",

  padding: "12px 18px",

  boxSizing: "border-box",

  background:
"radial-gradient(circle at top, rgba(212,175,55,.18), transparent 35%), linear-gradient(180deg,#1B0E05,#5A3418)",

position:
"relative",

overflow:
"hidden",

borderBottom:
"1px solid rgba(212,175,55,.45)",

boxShadow:
"0 10px 30px rgba(0,0,0,.35)",

};

/* ===========================================================
   FEATURE WALL
=========================================================== */

export const wallStyle: CSSProperties = {

  width: "100%",

  maxWidth: "1320px",

  borderRadius: "32px",

  padding:
"20px 18px 22px",

  background:
"linear-gradient(180deg,#4A260F 0%,#6B3F1F 50%,#2A1408 100%)",

  border:
"1px solid rgba(212,175,55,.45)",

borderBottom:
"2px solid rgba(212,175,55,.55)",

  boxShadow:
"0 40px 90px rgba(0,0,0,.35), 0 10px 30px rgba(0,0,0,.35)",

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

};

/* ===========================================================
   DOOR GRID
=========================================================== */

export const doorGridStyle: CSSProperties = {

  width: "100%",

  display: "grid",

  gridTemplateColumns:
"repeat(3,260px)",

  justifyItems: "center",

  justifyContent:
"center",

  alignItems: "center",

  columnGap: "60px",

rowGap: "24px",

  marginTop: "22px",

};

/* ===========================================================
   FLOOR
=========================================================== */

export const floorStyle: CSSProperties = {

  width: "95%",

  height: "45px",

  marginTop: "-30px",

  borderRadius: "100%",

  background:
    "radial-gradient(circle,#E8E8E8 0%,#CFCFCF 45%,transparent 85%)",

    backgroundImage:
"linear-gradient(180deg, transparent 65%, rgba(255,220,150,.12))",

  opacity: .45,

  filter: "blur(12px)",

};
