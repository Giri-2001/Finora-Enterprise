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

  cursor: "pointer",

};

export const bellStyle: CSSProperties = {

  fontSize: "20px",

};

export const badgeStyle: CSSProperties = {

  position: "absolute",

  top: "4px",

  right: "2px",

  minWidth: "18px",

  height: "18px",

  borderRadius: "999px",

  background: "#EF4444",

  color: "#FFFFFF",

  fontSize: "11px",

  fontWeight: 700,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "0 4px",

};
