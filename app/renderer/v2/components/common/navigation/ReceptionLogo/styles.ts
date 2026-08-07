/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION LOGO™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

export const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",

  cursor: "pointer",
  userSelect: "none",

  transition: "all .25s ease",
};

export const logoStyle: CSSProperties = {
  width: "52px",
  height: "52px",

  objectFit: "contain",

  flexShrink: 0,

  filter: "drop-shadow(0 0 6px rgba(212,175,55,.20))",
};

export const titleStyle: CSSProperties = {
  color: "#FFFFFF",

  fontSize: "20px",

  fontWeight: 800,

  letterSpacing: ".8px",

  whiteSpace: "nowrap",

  textShadow: "0 1px 8px rgba(0,0,0,.35)",

  fontFamily:
    '"Segoe UI", Inter, system-ui, sans-serif',
};
