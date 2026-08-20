// ============================================================
// FINORA ENTERPRISE OS™
//
// LOGIN DEFAULT THEME
//
// MODULE  : Authentication
// LAYER   : Renderer / Theme
// VERSION : 3.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Define the default visual identity for the FINORA Login
// - Use the verified FINORA Enterprise white/gold theme
// - Keep login visual colors centralized
// - Provide no responsive dimensions
//
// IMPORTANT:
//
// - Responsive dimensions belong exclusively to:
//   app/renderer/v2/utils/responsive/
//
// - This file contains visual theme values only.
// - Login.styles.ts must consume this theme.
// - No blue/navy login identity is permitted here.
//
// ============================================================


// ============================================================
// DEFAULT LOGIN THEME
// ============================================================

export const loginDefaultTheme = {

  // ----------------------------------------------------------
  // PAGE / SURFACE
  // ----------------------------------------------------------

  background:
    "#F7F8FA",

  surface:
    "#FFFFFF",

  surfaceSoft:
    "#F1F3F6",


  // ----------------------------------------------------------
  // BORDERS
  // ----------------------------------------------------------

  border:
    "#D9DEE7",

  borderStrong:
    "#B8C0CC",


  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  text:
    "#171A21",

  textMuted:
    "#4B5563",

  textSoft:
    "#7A8494",

  textFaint:
    "#9AA3B2",


  // ----------------------------------------------------------
  // PRIMARY / BRAND
  //
  // FINORA default enterprise identity:
  // Gold / Dark Gold
  // ----------------------------------------------------------

  primary:
    "#B8860B",

  primaryHover:
    "#8C6A00",


  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  success:
    "#16845B",

  successBackground:
    "rgba(22,132,91,0.10)",

  successBorder:
    "rgba(22,132,91,0.30)",

  successBorderStrong:
    "rgba(22,132,91,0.45)",

  successText:
    "#16845B",


  // ----------------------------------------------------------
  // WARNING
  // ----------------------------------------------------------

  warning:
    "#B7791F",

  warningBackground:
    "rgba(183,121,31,0.10)",

  warningBorder:
    "rgba(183,121,31,0.30)",


  // ----------------------------------------------------------
  // DANGER
  // ----------------------------------------------------------

  danger:
    "#C0392B",

  dangerBackground:
    "rgba(192,57,43,0.10)",


  // ----------------------------------------------------------
  // SHADOW
  // ----------------------------------------------------------

  shadow:
    "rgba(15,23,42,0.12)",

} as const;


// ============================================================
// END
// ============================================================