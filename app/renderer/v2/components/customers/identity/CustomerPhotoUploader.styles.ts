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

   THEME CONTRACT:
   - All visual colours come from FINORA Theme Engine.
   - No hard-coded yellow/gold theme colours.
   - Existing layout/design is preserved.
=========================================================== */

import type {
  CSSProperties,
} from "react";


/* ===========================================================
   ROOT
=========================================================== */

export const wrapperStyle: CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "16px",

  boxSizing:
    "border-box",

};


/* ===========================================================
   PHOTO PREVIEW
=========================================================== */

export const previewStyle: CSSProperties = {

  width:
    "72px",

  height:
    "72px",

  flexShrink:
    0,

  borderRadius:
    "14px",

  border:
    "1px dashed var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

  background:
    "linear-gradient(145deg, var(--finora-theme-surface-muted, rgba(255,255,255,.10)), var(--finora-theme-surface, rgba(255,255,255,.035)))",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  overflow:
    "hidden",

  boxSizing:
    "border-box",

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,.06), 0 6px 16px rgba(0,0,0,.12)",

  color:
  "var(--finora-theme-text-muted, var(--finora-theme-text-secondary))",

  fontSize:
    "10px",

  fontWeight:
    700,

  textTransform:
    "uppercase",

  letterSpacing:
    ".6px",

};


/* ===========================================================
   IMAGE
=========================================================== */

export const imageStyle: CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  objectFit:
    "cover",

  objectPosition:
    "center",

  display:
    "block",

};


/* ===========================================================
   PHOTO INFORMATION AREA
=========================================================== */

export const infoStyle: CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "4px",

  flex:
    1,

};


/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin:
    0,

  color:
  "var(--finora-theme-brand-accent)",

fontSize:
  "12px",

  fontWeight:
    800,

  letterSpacing:
    ".65px",

  textTransform:
    "uppercase",

};


/* ===========================================================
   DESCRIPTION
=========================================================== */

export const descriptionStyle: CSSProperties = {

  margin:
    0,

 color:
  "var(--finora-theme-text-muted, var(--finora-theme-text-secondary))",

  fontSize:
    "11px",

  lineHeight:
    1.45,

};


/* ===========================================================
   BUTTON ROW
=========================================================== */

export const buttonRowStyle: CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "7px",

  flexWrap:
    "wrap",

  marginTop:
    "3px",

};


/* ===========================================================
   BASE BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {

  minHeight:
    "29px",

  padding:
    "0 11px",

  borderRadius:
    "8px",

  border:
  "1px solid color-mix(in srgb, var(--finora-theme-brand-accent) 55%, transparent)",

background:
  "color-mix(in srgb, var(--finora-theme-brand-accent-soft) 8%, transparent)",

color:
  "var(--finora-theme-brand-accent)",

  cursor:
    "pointer",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  boxSizing:
    "border-box",

  fontSize:
    "10px",

  fontWeight:
    700,

  letterSpacing:
    ".2px",

  transition:
    "all .2s ease",

  whiteSpace:
    "nowrap",

};


/* ===========================================================
   REMOVE BUTTON
=========================================================== */

export const removeButtonStyle: CSSProperties = {

  ...buttonStyle,

  border:
    "1px solid color-mix(in srgb, var(--finora-theme-danger, #DC2626) 38%, transparent)",

  background:
    "color-mix(in srgb, var(--finora-theme-danger-soft, #FDECEC) 45%, transparent)",

  color:
    "var(--finora-theme-danger, #DC2626)",

};


/* ===========================================================
   HIDDEN FILE INPUT
=========================================================== */

export const hiddenInputStyle: CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   EMPTY PHOTO MARK
=========================================================== */

export const emptyPhotoStyle: CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  width:
    "100%",

  height:
    "100%",

  color:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

  fontSize:
    "10px",

  fontWeight:
    800,

  letterSpacing:
    ".5px",

  textTransform:
    "uppercase",

};