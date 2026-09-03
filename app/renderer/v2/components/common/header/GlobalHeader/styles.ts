/* ===========================================================
   FINORA ENTERPRISE OS™

   GLOBAL HEADER™

   RESPONSIVE THEME SELECTOR STYLES

   IMPORTANT:
   - Responsive geometry comes only from ResponsiveTokens.
   - Theme values come only from FINORA Theme Engine.
   - No local theme definitions.
   - No hard-coded theme color mapping.
   - Theme colors are resolved from FinoraTheme.
   - Five theme swatches use the central theme registry.
   - Dark themes automatically use high-contrast inverse text.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../utils/responsive";

import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface GlobalHeaderStyles {

  containerStyle:
    CSSProperties;

  leftStyle:
    CSSProperties;

  logoStyle:
    CSSProperties;

  centerStyle:
    CSSProperties;

  departmentStyle:
    CSSProperties;

  rightStyle:
    CSSProperties;

  mobileSecondRowStyle:
    CSSProperties;

  loginDateStyle:
    CSSProperties;

  actionStyle:
    CSSProperties;

  backButtonStyle:
    CSSProperties;

  backIconStyle:
    CSSProperties;

  logoutButtonStyle:
    CSSProperties;

  themePickerStyle:
    CSSProperties;

  themeButtonStyle:
    (
      theme:
        FinoraTheme,

      active:
        boolean,
    ) => CSSProperties;

}


/* ===========================================================
   THEME SWATCH RESOLVER

   Swatch color comes directly from the selected FinoraTheme.

   No local theme-color mapping exists here.
=========================================================== */

function getThemeSwatch(
  theme:
    FinoraTheme,
): string {

  return (
    theme.selectorSwatch ??
    theme
      .colors
      .brand
      .primary
  );

}


/* ===========================================================
   CONTRAST COLOR RESOLVER

   LIGHT THEMES
   -----------------------------------------------------------
   Use the semantic brand/text colors.

   DARK THEMES
   -----------------------------------------------------------
   Use the inverse token for important global-header content.

   This guarantees that Royal Navy / Obsidian / future dark
   themes do not inherit a low-contrast accent color for:

   - Reception
   - Back arrow
   - Logout
   - Header actions
=========================================================== */

function getHeaderContentColor(
  theme:
    FinoraTheme,
): string {

  return theme.mode === "dark"
    ? theme.colors.text.secondary
    : theme.colors.text.primary;

}



/* ===========================================================
   PRIMARY ACTION COLOR

   LIGHT
   -----------------------------------------------------------
   Brand primary remains the visual accent.

   DARK
   -----------------------------------------------------------
   Important global actions use inverse/high-contrast text.
=========================================================== */

function getHeaderActionColor(
  theme:
    FinoraTheme,
): string {

  return theme
    .colors
    .text
    .secondary;

}

/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createGlobalHeaderStyles(

  tokens:
    ResponsiveTokens,

  canGoBack:
    boolean,

  activeTheme:
    FinoraTheme,

): GlobalHeaderStyles {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const header =
    tokens.header;

  const button =
    tokens.button;

  const viewport =
    tokens.meta.viewport;

  const isMobile =
    viewport === "mobile";


  /* =========================================================
     SEMANTIC HEADER COLORS
  ========================================================= */

  const headerContentColor =
    getHeaderContentColor(
      activeTheme,
    );

  const headerActionColor =
    getHeaderActionColor(
      activeTheme,
    );


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    position:
      "relative",

    top:
      0,

    zIndex: 1000,

    width:
      "100%",

    minWidth:
      0,

    maxWidth:
      "100%",

    height:
      `${header.height}px`,

    minHeight:
      `${header.height}px`,

    display:
      "grid",

    gridTemplateColumns:
  isMobile
      ? "minmax(0, 1fr) auto minmax(0, 1fr)"
    : "auto minmax(0, 1fr) auto",

    gridTemplateRows:
      isMobile
        ? "auto auto"
        : "1fr",

    alignItems:
      "center",

    padding:
      `0 ${header.paddingX}px`,

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    background:
      `
        linear-gradient(
          180deg,
          ${activeTheme
            .colors
            .background
            .surface} 0%,
          ${activeTheme
            .colors
            .background
            .page} 100%
        )
      `,

    borderBottom:
      `${tokens.border.width}px solid ${
        activeTheme
          .colors
          .border
          .strong
      }`,

    boxShadow: "none",

    overflow:
  "visible",

  };


  /* =========================================================
     LEFT
  ========================================================= */

  const leftStyle:
  CSSProperties = {

  minWidth:
    0,

  width:
    "auto",

  maxWidth:
    "100%",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "flex-start",

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };


  /* =========================================================
     LOGO
  ========================================================= */

  const logoStyle:
    CSSProperties = {

    minWidth:
      0,

    maxWidth:
      "100%",

    display:
      "flex",

    alignItems:
      "center",

    flexShrink:
      1,

    overflow:
      "hidden",

  };


  /* =========================================================
     CENTER
  ========================================================= */

  const centerStyle:
  CSSProperties = {

  minWidth:
    0,

  width:
    "100%",

  maxWidth:
    "100%",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gridColumn:
      isMobile
        ? "2"
        : "2",

    gridRow:
      isMobile
        ? "2"
        : "1",

    boxSizing:
      "border-box",

    overflow:
      isMobile ? "visible" : "hidden",

  };


  /* =========================================================
     DEPARTMENT
=========================================================== */

  const departmentStyle:
    CSSProperties = {

    minWidth:
      0,

    maxWidth:
      "100%",

    fontSize:
      `${header.titleSize}px`,

    fontWeight:
      800,

    color:
      headerContentColor,

    letterSpacing:
      ".5px",

    whiteSpace:
      "nowrap",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    textAlign:
      "center",

    textShadow:
      `0 2px 8px ${
        activeTheme
          .colors
          .overlay
          .shadow
      }`,


    transform:
      isMobile ? "translateY(-6px)" : "none",

  };


  /* =========================================================
     RIGHT
  ========================================================= */

  const rightStyle:
  CSSProperties = {

  minWidth:
    0,

  width:
    "auto",

  maxWidth:
    "100%",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "flex-end",

    gap:
      `${tokens.spacing.small}px`,

    gridColumn:
      isMobile
        ? "2"
        : "3",

    gridRow:
      "1",

    boxSizing:
      "border-box",

    overflow:
      "visible",

  };


  /* =========================================================
     MOBILE SECOND ROW
  ========================================================= */

  const mobileSecondRowStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    display:
      isMobile
        ? "grid"
        : "none",

    gridTemplateColumns:
      "minmax(0, 1fr) auto minmax(0, 1fr)",

    alignItems:
      "center",

    columnGap:
      `${tokens.spacing.small}px`,

    gridColumn:
      "1 / -1",

    gridRow:
      "2",

    boxSizing:
      "border-box",

  };


  /* =========================================================
     ACTION
  ========================================================= */

  const actionStyle:
    CSSProperties = {

    minWidth:
      `${button.minHeight}px`,

    maxWidth:
      "100%",

    height:
      `${button.height}px`,

    minHeight:
      `${button.height}px`,

    padding:
      `0 ${tokens.spacing.small}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      `${tokens.border.width}px solid ${
        activeTheme
          .colors
          .border
          .default
      }`,

    background:
      activeTheme
        .colors
        .background
        .surfaceMuted,

    color:
      headerActionColor,

    display:
      "flex",

    gap:
      `${tokens.spacing.small}px`,

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      "pointer",

    fontSize:
      `${button.fontSize}px`,

    fontWeight:
      700,

    lineHeight:
      1,

    whiteSpace:
      "nowrap",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    userSelect:
      "none",

    appearance:
      "none",

    WebkitAppearance:
      "none",

    transition:
      "all 160ms ease",

    boxSizing:
      "border-box",

    flexShrink:
      1,

  };


  /* =========================================================
     BACK BUTTON
  ========================================================= */

  const backButtonStyle:
    CSSProperties = {

    width:
      "auto",

    height:
      `${button.height}px`,

    minWidth:
      `${button.minHeight + tokens.spacing.medium}px`,

    minHeight:
      `${button.height}px`,

    padding:
      `0 ${tokens.spacing.small}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      `${tokens.border.width}px solid ${
        activeTheme
          .colors
          .border
          .default
      }`,

    background:
      activeTheme
        .colors
        .background
        .surfaceMuted,

    color:
      headerActionColor,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      canGoBack
        ? "pointer"
        : "default",

    opacity:
      canGoBack
        ? 1
        : 0.55,

    transition:
      "all 160ms ease",

    flexShrink:
      0,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     BACK ICON
  ========================================================= */

  const backIconStyle:
    CSSProperties = {

    fontSize:
      `${button.fontSize + tokens.icon.xs}px`,

    lineHeight:
      1,

    fontWeight:
      600,

    color:
  activeTheme.colors.text.secondary,

    transform:
      "translateY(-1px)",

    userSelect:
      "none",

  };


  /* =========================================================
     LOGIN DATE DISPLAY

     Read-only operational Business Date preview.
     Geometry comes from ResponsiveTokens.
  ========================================================= */

  const loginDateStyle:
    CSSProperties = {

    minWidth:
      0,

    minHeight:
      `${tokens.themeSelector.buttonSize}px`,

    padding:
      `0 ${tokens.spacing.small}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      "none",

    background:
      isMobile
        ? "transparent"
        : activeTheme
            .colors
            .background
            .surfaceMuted,
    color:
      headerContentColor,

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontSize:
      `${isMobile ? button.fontSize + 2 : button.fontSize}px`,

    fontWeight:
      800,

    lineHeight:
      1,

    letterSpacing:
      ".04em",

    fontVariantNumeric:
      "tabular-nums",

    whiteSpace:
      "nowrap",

    userSelect:
      "none",

    flexShrink:
      0,

    transform:
      isMobile ? "translateY(3px)" : "none",

    boxSizing:
      "border-box",

  };

  /* =========================================================
     THEME PICKER

     Geometry remains entirely responsive-token driven.

     Actual theme colors come from the registered FinoraTheme.
  ========================================================= */

  const themePickerStyle:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${tokens.themeSelector.gap}px`,

      padding:
    `0 ${tokens.spacing.small}px`,

  overflow:
    "visible",

    minWidth:
      0,

    flexShrink:
      0,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     THEME BUTTON
  ========================================================= */

  const themeButtonStyle = (

    themeOption:
      FinoraTheme,

    active:
      boolean,

  ): CSSProperties => {

    const swatch =
      getThemeSwatch(
        themeOption,
      );

    const themeSize =
      tokens.themeSelector.buttonSize;

    return {

      width:
        `${themeSize}px`,

      height:
        `${themeSize}px`,

      minWidth:
        `${themeSize}px`,

      minHeight:
        `${themeSize}px`,

      padding:
        0,

      margin:
        0,

      borderRadius:
        "50%",

     border:
  `${tokens.border.width}px solid ${
    active
      ? themeOption
          .colors
          .border
          .strong
      : themeOption
          .colors
          .border
          .default
  }`,

background:
  swatch,

boxShadow:
  active
    ? `
        0 0 0
        ${tokens.border.width}px
        ${themeOption
          .colors
          .background
          .surface},
        0 0 0
        ${tokens.border.width * 2 + 1}px
        ${themeOption
          .colors
          .brand
          .primary}
      `
    : "none",

      cursor:
        "pointer",

      opacity:
        active
          ? 1
          : 0.92,

      transform:
        "none",

      transition:
        "opacity 140ms ease, box-shadow 140ms ease, border-color 140ms ease",

      flexShrink:
        0,

      boxSizing:
        "border-box",

      outline:
        "none",

      appearance:
        "none",

      WebkitAppearance:
        "none",

    };

  };


  /* =========================================================
     LOGOUT BUTTON
  ========================================================= */

  const logoutButtonStyle:
    CSSProperties = {

    height:
      `${button.height}px`,

    minHeight:
      `${button.height}px`,

    minWidth:
      `${button.minHeight}px`,

    maxWidth:
      "100%",

    padding:
      `0 ${tokens.spacing.medium}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      `${tokens.border.width}px solid ${
        activeTheme
          .colors
          .border
          .default
      }`,

    background:
      activeTheme
        .colors
        .background
        .surfaceMuted,

    color:
      headerActionColor,

    cursor:
      "pointer",

    fontWeight:
      700,

    fontSize:
      `${button.fontSize}px`,

    transition:
      "all 160ms ease",

    flexShrink:
      0,

    boxSizing:
      "border-box",

    whiteSpace:
      "nowrap",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    leftStyle,

    logoStyle,

    centerStyle,

    departmentStyle,

    rightStyle,

    mobileSecondRowStyle,

    loginDateStyle,

    actionStyle,

    backButtonStyle,

    backIconStyle,

    logoutButtonStyle,

    themePickerStyle,

    themeButtonStyle,

  };

}


/* ===========================================================
   END
=========================================================== */
