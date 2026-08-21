/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 2 — BASIC DETAILS

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Presentation styling for Step 2 sections
   - Theme-driven visual presentation
   - No local breakpoints
   - No viewport detection
   - No emoji styling
   - No business logic
   - No responsive geometry decisions
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


/* ===========================================================
   PAGE
=========================================================== */

export const pageStyle:
  CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

  padding:
    "var(--finora-step2-page-padding, 10px 18px 4px)",

  overflow:
    "hidden",

  color:
    "var(--finora-theme-text-primary, #F8FAFC)",

  background:
    "var(--finora-theme-page-background)",

};


/* ===========================================================
   PAGE HEADER

   Kept for compatibility.
   Step2Basic currently does not render this header.
=========================================================== */

export const pageHeaderStyle:
  CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   PAGE TITLE
=========================================================== */

export const pageTitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    "var(--finora-theme-text-heading, #F3E4C2)",

  fontSize:
    "var(--finora-step2-page-title-size, 18px)",

  lineHeight:
    "var(--finora-theme-line-height-tight, 1.2)",

  fontWeight:
    600,

};


/* ===========================================================
   PAGE SUBTITLE
=========================================================== */

export const pageSubtitleStyle:
  CSSProperties = {

  margin:
    "var(--finora-step2-page-subtitle-margin, 4px 0 0)",

  color:
    "var(--finora-theme-text-muted, rgba(255,255,255,.48))",

  fontSize:
    "var(--finora-step2-page-subtitle-size, 9px)",

  lineHeight:
    "var(--finora-theme-line-height-normal, 1.4)",

};


/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle:
  CSSProperties = {

  flex:
    1,

  minHeight:
    0,

  width:
    "100%",

  display:
    "grid",

  gridTemplateRows:
    "repeat(3, minmax(0, 1fr))",

  gap:
    "var(--finora-step2-section-gap, 14px)",

  padding:
    0,

  margin:
    0,

  boxSizing:
    "border-box",

  overflow:
    "hidden",

};


/* ===========================================================
   PREMIUM SECTION
=========================================================== */

export const sectionStyle:
  CSSProperties = {

  minHeight:
    0,

    height:
  "100%",

alignSelf:
  "stretch",

  width:
    "100%",

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

  padding:
    "var(--finora-step2-section-padding, 13px 14px 12px)",

  borderRadius:
    "var(--finora-theme-radius-card, 17px)",

  border:
    "var(--finora-theme-border-width, 1.5px) solid var(--finora-theme-border-default, rgba(214,176,106,.34))",

  background:
    "var(--finora-theme-surface-card, linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018)))",

  boxShadow:
    "var(--finora-theme-shadow-card, 0 10px 28px rgba(0,0,0,.12))",

  overflow:
    "hidden",

};


/* ===========================================================
   SECTION HEADER
=========================================================== */

export const sectionHeaderStyle:
  CSSProperties = {

  flexShrink:
    0,

  minHeight:
    "var(--finora-step2-header-min-height, 45px)",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "var(--finora-step2-header-gap, 12px)",

  paddingBottom:
    "var(--finora-step2-header-padding-bottom, 10px)",

  marginBottom:
    "var(--finora-step2-header-margin-bottom, 11px)",

  borderBottom:
    "var(--finora-theme-border-width, 1px) solid var(--finora-theme-border-subtle, rgba(214,176,106,.20))",

  boxSizing:
    "border-box",

};


/* ===========================================================
   SECTION ICON
=========================================================== */

export const sectionIconStyle:
  CSSProperties = {

  width:
    "var(--finora-step2-section-icon-size, 38px)",

  height:
    "var(--finora-step2-section-icon-size, 38px)",

  flexShrink:
    0,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  borderRadius:
    "50%",

  border:
    "var(--finora-theme-border-width, 1.5px) solid var(--finora-theme-brand-accent, #D4AF37)",

  background:
    "var(--finora-theme-surface-icon, rgba(0,0,0,.20))",

  boxShadow:
    "var(--finora-theme-shadow-icon, 0 4px 12px rgba(0,0,0,.18))",

  color:
    "var(--finora-theme-brand-accent, #D4AF37)",

  lineHeight:
    1,

};


/* ===========================================================
   SECTION TITLE
=========================================================== */

export const sectionTitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    "var(--finora-theme-text-heading, #F3E4C2)",

  fontSize:
    "var(--finora-step2-section-title-size, 18px)",

  lineHeight:
    "var(--finora-theme-line-height-tight, 1.2)",

  fontWeight:
    700,

  letterSpacing:
    "var(--finora-step2-section-title-spacing, .25px)",

};


/* ===========================================================
   SECTION SUBTITLE
=========================================================== */

export const sectionSubtitleStyle:
  CSSProperties = {

  margin:
    "var(--finora-step2-section-subtitle-margin, 3px 0 0)",

  color:
    "var(--finora-theme-text-muted, rgba(255,255,255,.48))",

  fontSize:
    "var(--finora-step2-section-subtitle-size, 12px)",

  lineHeight:
    "var(--finora-theme-line-height-normal, 1.35)",

};


/* ===========================================================
   FIELD AREA
=========================================================== */

export const fieldAreaStyle:
  CSSProperties = {

  flex:
    1,

  minHeight:
    0,

  width:
    "100%",

  display:
    "flex",

  alignItems:
    "center",

  boxSizing:
    "border-box",

  overflow:
    "hidden",

};


/* ===========================================================
   FOUR COLUMN GRID

   Compatibility export only.

   Actual field geometry is owned by:
   - BasicForm
   - OccupationCard

   Those components consume the Responsive Engine.
=========================================================== */

export const fourColumnGridStyle:
  CSSProperties = {

  width:
    "100%",

  display:
    "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap:
    "var(--finora-form-gap)",

  alignItems:
    "center",

  boxSizing:
    "border-box",

};


/* ===========================================================
   THREE COLUMN GRID

   Compatibility export only.

   Actual FamilyDetails geometry is owned by
   FamilyDetails Responsive Engine.
=========================================================== */

export const threeColumnGridStyle:
  CSSProperties = {

  width:
    "100%",

  display:
    "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  gap:
    "var(--finora-form-gap)",

  alignItems:
    "center",

  boxSizing:
    "border-box",

};


/* ===========================================================
   GOLD ACCENT

   Intentionally disabled.
=========================================================== */

export const sectionAccentStyle:
  CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   END
=========================================================== */