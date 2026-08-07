/* ===========================================================
   FINORA ENTERPRISE OS™
   GLOBAL HEADER™
   PREMIUM DARK ENTERPRISE STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1000,

  width: "100%",
  height: "72px",

  display: "grid",
  gridTemplateColumns: "360px 1fr 300px",
  alignItems: "center",

  padding: "0 28px",
  boxSizing: "border-box",

  background: `
    linear-gradient(
      180deg,
      #3B2418 0%,
      #2B1810 100%
    )
  `,

  borderBottom: "1px solid rgba(212,175,55,.45)",

  boxShadow: `
    0 10px 30px rgba(0,0,0,.45),
    0 1px 0 rgba(212,175,55,.25)
  `,
};

/* ===========================================================
   LEFT
=========================================================== */

export const leftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",

  cursor: "pointer",
};

/* ===========================================================
   LOGO
=========================================================== */

export const logoStyle: CSSProperties = {
  fontSize: "24px",
  fontWeight: 900,

  color: "#FFFFFF",

  letterSpacing: "1px",

  userSelect: "none",
};

/* ===========================================================
   CENTER
=========================================================== */

export const centerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

/* ===========================================================
   DEPARTMENT
=========================================================== */

export const departmentStyle: CSSProperties = {
  fontSize: "21px",
  fontWeight: 800,

  color: "#F4D27A",

  letterSpacing: ".5px",

  whiteSpace: "nowrap",

  textShadow: "0 2px 8px rgba(0,0,0,.35)",
};

/* ===========================================================
   RIGHT
=========================================================== */

export const rightStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",

  gap: "20px",
};

/* ===========================================================
   ACTION
=========================================================== */

export const actionStyle: CSSProperties = {
  cursor: "pointer",

  fontSize: "20px",

  userSelect: "none",

  color: "#FFFFFF",

  transition: "all .25s ease",
};
