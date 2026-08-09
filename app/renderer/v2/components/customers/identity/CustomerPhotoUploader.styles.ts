/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER PHOTO UPLOADER™

   PREMIUM IDENTITY PHOTO STUDIO STYLES

   Responsibility:
   - Photo upload presentation
   - Preview presentation
   - Upload / remove controls
   - No state
   - No file handling
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  display: "flex",
  alignItems: "center",

  gap: "16px",

  boxSizing: "border-box",
};

/* ===========================================================
   PHOTO PREVIEW
=========================================================== */

export const previewStyle: CSSProperties = {
  width: "68px",
  height: "68px",

  flexShrink: 0,

  borderRadius: "14px",

  border:
    "1px dashed rgba(232,199,120,.65)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.035))",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  overflow: "hidden",

  boxSizing: "border-box",

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,.06), 0 6px 16px rgba(0,0,0,.12)",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",
  fontWeight: 700,

  textTransform: "uppercase",
  letterSpacing: ".6px",
};

/* ===========================================================
   IMAGE
=========================================================== */

export const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",

  objectFit: "cover",
  objectPosition: "center",

  display: "block",
};

/* ===========================================================
   PHOTO INFORMATION AREA
=========================================================== */

export const infoStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",
  flexDirection: "column",

  gap: "4px",

  flex: 1,
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "10px",
  fontWeight: 800,

  letterSpacing: ".65px",

  textTransform: "uppercase",
};

/* ===========================================================
   DESCRIPTION
=========================================================== */

export const descriptionStyle: CSSProperties = {
  margin: 0,

  color:
    "rgba(255,255,255,.48)",

  fontSize: "8px",

  lineHeight: 1.45,
};

/* ===========================================================
   BUTTON ROW
=========================================================== */

export const buttonRowStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "7px",

  flexWrap: "wrap",

  marginTop: "3px",
};

/* ===========================================================
   BASE BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {
  minHeight: "27px",

  padding:
    "0 11px",

  borderRadius: "8px",

  border:
    "1px solid rgba(214,176,106,.55)",

  background:
    "linear-gradient(180deg,rgba(214,176,106,.18),rgba(138,97,43,.12))",

  color: "#E8C778",

  cursor: "pointer",

  display: "inline-flex",

  alignItems: "center",
  justifyContent: "center",

  boxSizing: "border-box",

  fontSize: "9px",
  fontWeight: 700,

  letterSpacing: ".2px",

  transition:
    "all .2s ease",

  whiteSpace: "nowrap",
};

/* ===========================================================
   REMOVE BUTTON
=========================================================== */

export const removeButtonStyle: CSSProperties = {
  ...buttonStyle,

  border:
    "1px solid rgba(220,38,38,.38)",

  background:
    "rgba(220,38,38,.08)",

  color:
    "#FCA5A5",
};

/* ===========================================================
   HIDDEN FILE INPUT
=========================================================== */

export const hiddenInputStyle: CSSProperties = {
  display: "none",
};

/* ===========================================================
   EMPTY PHOTO MARK
=========================================================== */

export const emptyPhotoStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",
  justifyContent: "center",

  width: "100%",
  height: "100%",

  color:
    "rgba(232,199,120,.75)",

  fontSize: "9px",
  fontWeight: 800,

  letterSpacing: ".5px",

  textTransform: "uppercase",
};
