/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER WIZARD
   STEP 3 — ADDRESS
   PREMIUM FINORA WARM BROWN / GOLD THEME
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   PAGE
=========================================================== */

export const pageStyle: CSSProperties = {
  width: "100%",

  height: "80vh",
  minHeight: "80vh",
  maxHeight: "80vh",

  boxSizing: "border-box",

  padding: "8px 18px 6px",

  display: "flex",
  flexDirection: "column",

  gap: "9px",

  overflow: "hidden",

 background:
  `
  linear-gradient(
    rgba(18,12,8,.35),
    rgba(18,12,8,.35)
  ),

  linear-gradient(
    90deg,
    #3A2115 0%,
    #5B3420 25%,
    #402417 50%,
    #5B3420 75%,
    #321B12 100%
  )
  `,

  color: "#ffffff",
};

/* ===========================================================
   PAGE HEADER
=========================================================== */

export const pageHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  flexShrink: 0,

  minHeight: "28px",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,

  color: "#ffffff",

  fontSize: "22px",

  fontWeight: 900,

  letterSpacing: "-0.25px",
};

export const pageSubtitleStyle: CSSProperties = {
  margin: "2px 0 0",

  color: "rgba(255,255,255,.72)",

  fontSize: "11px",

  lineHeight: 1.3,

  fontWeight: 600,
};

/* ===========================================================
   MAIN CONTENT
=========================================================== */

export const contentStyle: CSSProperties = {
  flex: "1 1 auto",

  width: "100%",

  minHeight: 0,

  display: "grid",

  /*
    Address Information
    40%

    Address Verification
    60%
  */

  gridTemplateRows:
    "minmax(0, 40fr) minmax(0, 60fr)",

  gap: "9px",

  overflow: "hidden",
};

/* ===========================================================
   MAIN SECTION
=========================================================== */

export const sectionStyle: CSSProperties = {
  position: "relative",

  width: "100%",

  minWidth: 0,
  minHeight: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  padding: "11px 14px 12px",

  borderRadius: "17px",

  border:
    "1.5px solid rgba(190,139,52,.65)",

  background:
    "linear-gradient(145deg, #482719 0%, #3d2117 55%, #351c14 100%)",

  boxShadow:
    "0 7px 18px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06)",

  overflow: "hidden",
};

/* ===========================================================
   SECTION HEADER
=========================================================== */

export const sectionHeaderStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "11px",

  flexShrink: 0,

  minHeight: "38px",

  paddingBottom: "8px",

  borderBottom:
    "1px solid rgba(214,166,76,.30)",
};

/* ===========================================================
   SECTION ICON
=========================================================== */

export const sectionIconStyle: CSSProperties = {
  width: "36px",
  height: "36px",

  minWidth: "36px",

  display: "flex",

  alignItems: "center",
  justifyContent: "center",

  borderRadius: "50%",

  color: "#ffffff",

  fontSize: "17px",

  fontWeight: 900,

  background:
    "linear-gradient(145deg, #e9b83e 0%, #c98920 55%, #9e6514 100%)",

  border:
    "1px solid rgba(255,220,125,.78)",

  boxShadow:
    "0 4px 10px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.35)",
};

/* ===========================================================
   SECTION TITLE
=========================================================== */

export const sectionTitleStyle: CSSProperties = {
  margin: 0,

  color: "#ffffff",

  fontSize: "17px",

  lineHeight: 1.15,

  fontWeight: 900,

  letterSpacing: "-0.1px",
};

/* ===========================================================
   SECTION SUBTITLE
=========================================================== */

export const sectionSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",

  color: "rgba(255,255,255,.68)",

  fontSize: "10px",

  lineHeight: 1.3,

  fontWeight: 600,
};

/* ===========================================================
   FIELD AREA
=========================================================== */

export const fieldAreaStyle: CSSProperties = {
  flex: "1 1 auto",

  minHeight: 0,

  display: "flex",

  flexDirection: "column",

  justifyContent: "space-evenly",

  paddingTop: "6px",

  overflow: "hidden",
};

/* ===========================================================
   ADDRESS GRID
=========================================================== */

export const addressGridStyle: CSSProperties = {
  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  columnGap: "12px",

  rowGap: "8px",

  minWidth: 0,
};

/* ===========================================================
   FULL ADDRESS FIELD
=========================================================== */

export const fullAddressFieldStyle: CSSProperties = {
  gridColumn: "span 2",

  minWidth: 0,
};

/* ===========================================================
   FIELD
=========================================================== */

export const fieldStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "5px",
};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {
  color: "#ffffff",

  fontSize: "10px",

  lineHeight: 1.1,

  fontWeight: 900,

  letterSpacing: "0.35px",

  textTransform: "uppercase",
};

/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle: CSSProperties = {
  width: "100%",

  height: "45px",

  boxSizing: "border-box",

  padding: "0 14px",

  borderRadius: "10px",

  border:
    "1.5px solid rgba(187,137,53,.62)",

  outline: "none",

  color: "#ffffff",

  background:
    "linear-gradient(145deg, rgba(111,67,43,.70), rgba(77,43,29,.82))",

  fontSize: "13px",

  fontWeight: 650,

  boxShadow:
    "inset 0 1px 2px rgba(0,0,0,.18), 0 2px 7px rgba(0,0,0,.10)",

  transition:
    "border-color .18s ease, box-shadow .18s ease, background .18s ease",
};

/* ===========================================================
   ADDRESS INPUT
=========================================================== */

export const addressInputStyle: CSSProperties = {
  ...inputStyle,

  height: "46px",

  padding: "0 15px",

  borderRadius: "11px",

  fontSize: "13.5px",

  fontWeight: 650,
};

/* ===========================================================
   NUMBER / PIN INPUT
=========================================================== */

export const numberInputStyle: CSSProperties = {
  ...inputStyle,

  height: "45px",

  fontSize: "13px",

  fontWeight: 700,
};

/* ===========================================================
   VERIFICATION GRID
=========================================================== */

export const secondaryGridStyle: CSSProperties = {
  flex: "1 1 auto",

  minHeight: 0,

  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  gap: "12px",

  paddingTop: "9px",

  overflow: "hidden",
};

/* ===========================================================
   VERIFICATION CARD
=========================================================== */

export const secondaryCardStyle: CSSProperties = {
  minWidth: 0,

  minHeight: 0,

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  padding: "13px",

  borderRadius: "14px",

  border:
    "1.5px solid rgba(187,137,53,.50)",

  background:
    "linear-gradient(145deg, #51301f 0%, #47271b 55%, #3b2117 100%)",

  boxShadow:
    "0 5px 15px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.045)",

  overflow: "hidden",
};

/* ===========================================================
   VERIFICATION CARD TITLE
=========================================================== */

export const secondaryTitleStyle: CSSProperties = {
  margin: 0,

  color: "#ffffff",

  fontSize: "14px",

  lineHeight: 1.2,

  fontWeight: 900,

  letterSpacing: "-0.1px",
};

/* ===========================================================
   VERIFICATION CARD TEXT
=========================================================== */

export const secondaryTextStyle: CSSProperties = {
  margin: 0,

  color: "rgba(255,255,255,.72)",

  fontSize: "10.5px",

  lineHeight: 1.45,

  fontWeight: 600,
};

/* ===========================================================
   STATUS BADGE
=========================================================== */

export const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  minHeight: "25px",

  padding: "0 9px",

  borderRadius: "999px",

  color: "#ffe39a",

  background:
    "rgba(208,153,46,.15)",

  border:
    "1px solid rgba(211,160,61,.50)",

  fontSize: "9.5px",

  fontWeight: 850,

  whiteSpace: "nowrap",

  boxShadow:
    "0 2px 6px rgba(0,0,0,.10)",
};

/* ===========================================================
   SECTION ACCENT
=========================================================== */

export const sectionAccentStyle: CSSProperties = {
  position: "absolute",

  left: "18px",

  bottom: "7px",

  width: "70px",

  height: "3px",

  borderRadius: "999px",

  background:
    "linear-gradient(90deg, #c98b20 0%, #f1c55d 58%, rgba(241,197,93,0) 100%)",

  opacity: 0.9,
};

/* ===========================================================
   VERIFICATION INFO
=========================================================== */

export const verificationInfoStyle: CSSProperties = {
  marginTop: "8px",

  padding: "9px 11px",

  borderRadius: "9px",

  border:
    "1px solid rgba(190,139,52,.25)",

  background:
    "rgba(255,255,255,.045)",

  color: "rgba(255,255,255,.72)",

  fontSize: "10px",

  lineHeight: 1.4,

  fontWeight: 600,
};

/* ===========================================================
   PREVIEW VALUE
=========================================================== */

export const previewValueStyle: CSSProperties = {
  color: "#ffffff",

  fontSize: "12.5px",

  lineHeight: 1.35,

  fontWeight: 750,
};

/* ===========================================================
   META LABEL
=========================================================== */

export const metaLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,.62)",

  fontSize: "8.5px",

  lineHeight: 1.1,

  fontWeight: 900,

  letterSpacing: "0.45px",

  textTransform: "uppercase",
};

/* ===========================================================
   HIGH CONTRAST TEXT
=========================================================== */

export const highContrastTextStyle: CSSProperties = {
  color: "#ffffff",

  fontWeight: 800,
};

/* ===========================================================
   GLOBAL ADDRESS INPUT CSS
=========================================================== */

export const addressGlobalStyle = `
  .finora-address-input {
    color: #ffffff !important;
    caret-color: #f1c55d;
  }

  .finora-address-input::placeholder {
    color: rgba(255,255,255,.72) !important;
    opacity: 1 !important;
    font-weight: 550;
  }

  .finora-address-input:hover {
    border-color: rgba(220,171,76,.78) !important;
  }

  .finora-address-input:focus {
    border-color: #f1c55d !important;

    background:
      linear-gradient(
        145deg,
        rgba(125,77,47,.82),
        rgba(82,46,30,.90)
      ) !important;

    box-shadow:
      0 0 0 3px rgba(241,197,93,.13),
      0 5px 14px rgba(0,0,0,.16) !important;

    outline: none !important;
  }

  .finora-address-input:disabled {
    color: rgba(255,255,255,.72) !important;
    opacity: .82;
  }

  input,
  textarea,
  select {
    font-family: inherit;
  }
`;
