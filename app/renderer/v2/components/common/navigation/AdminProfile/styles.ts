/* ===========================================================
   FINORA ENTERPRISE OS™
   ADMIN PROFILE™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

export const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",

  cursor: "pointer",
  userSelect: "none",

  transition: "all .25s ease",
};

export const iconStyle: CSSProperties = {
  color: "#FFFFFF",

  flexShrink: 0,

  filter: "drop-shadow(0 0 4px rgba(212,175,55,.18))",
};

export const nameStyle: CSSProperties = {
  fontSize: "15px",

  fontWeight: 700,

  color: "#FFFFFF",

  letterSpacing: ".35px",

  whiteSpace: "nowrap",

  textShadow: "0 1px 6px rgba(0,0,0,.35)",
};

export const arrowStyle: CSSProperties = {
  color: "#D4AF37",

  flexShrink: 0,
};
