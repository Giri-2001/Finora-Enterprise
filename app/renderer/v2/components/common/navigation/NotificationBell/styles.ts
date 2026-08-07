/* ===========================================================
   FINORA ENTERPRISE OS™
   NOTIFICATION BELL™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

export const containerStyle: CSSProperties = {
  position: "relative",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  width: "42px",
  height: "42px",

  borderRadius: "50%",

  cursor: "pointer",

  transition: "all .25s ease",
};

export const bellStyle: CSSProperties = {
  color: "#FFFFFF",

  filter: "drop-shadow(0 0 4px rgba(212,175,55,.18))",

  transition: "all .25s ease",
};

export const badgeStyle: CSSProperties = {
  position: "absolute",

  top: "2px",
  right: "1px",

  minWidth: "18px",
  height: "18px",

  borderRadius: "999px",

  background: "#DC2626",

  color: "#FFFFFF",

  fontSize: "11px",
  fontWeight: 700,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  padding: "0 4px",

  border: "2px solid #2B1810",

  boxShadow: "0 0 8px rgba(220,38,38,.35)",
};
