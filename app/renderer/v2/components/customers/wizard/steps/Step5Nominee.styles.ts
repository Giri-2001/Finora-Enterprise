/* ===========================================================
   FINORA ENTERPRISE OS™

   STEP 5 — NOMINEE STUDIO
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Step 5 page sizing
   - Two-column composition
   - Nominee information container
   - Relationship container

   IMPORTANT:
   - No business logic
   - No component logic
   - No global header styles
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   PAGE
=========================================================== */

export const pageStyle: CSSProperties = {
  width: "100%",

  height: "100%",

  minHeight: 0,

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",

  background:
    "linear-gradient(145deg,#321B12 0%,#402417 48%,#2A170F 100%)",

  color: "#FFFFFF",
};

/* ===========================================================
   LEFT COLUMN
=========================================================== */

export const leftColumnStyle: CSSProperties = {
  minWidth: 0,

  minHeight: 0,

  height: "100%",

  display: "grid",

  gridTemplateRows:
    "minmax(0,1fr) minmax(108px,auto)",

  gap: "10px",

  overflow: "hidden",
};

/* ===========================================================
   RIGHT COLUMN
=========================================================== */

export const rightColumnStyle: CSSProperties = {
  minWidth: 0,

  minHeight: 0,

  height: "100%",

  display: "grid",

  gridTemplateRows:
    "minmax(0,1.65fr) minmax(105px,.65fr) minmax(74px,.42fr)",

  gap: "10px",

  overflow: "hidden",
};

/* ===========================================================
   SECTION
=========================================================== */

export const sectionStyle: CSSProperties = {
  minWidth: 0,

  minHeight: 0,

  width: "100%",

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  padding: "13px 14px",

  borderRadius: "16px",

  border:
    "1.5px solid rgba(214,176,106,.34)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))",

  boxShadow:
    "0 9px 24px rgba(0,0,0,.14)",

  overflow: "hidden",
};

/* ===========================================================
   SECTION HEADER
=========================================================== */

export const sectionHeaderStyle: CSSProperties = {
  flexShrink: 0,

  minWidth: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  paddingBottom: "8px",

  marginBottom: "9px",

  borderBottom:
    "1px solid rgba(214,176,106,.17)",
};

/* ===========================================================
   SECTION TITLE
=========================================================== */

export const sectionTitleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "15px",

  lineHeight: 1.2,

  fontWeight: 900,
};

/* ===========================================================
   SECTION SUBTITLE
=========================================================== */

export const sectionSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "8.5px",

  lineHeight: 1.3,

  fontWeight: 550,
};

/* ===========================================================
   RELATIONSHIP SECTION
=========================================================== */

export const relationshipSectionStyle: CSSProperties = {
  justifyContent: "center",
};
