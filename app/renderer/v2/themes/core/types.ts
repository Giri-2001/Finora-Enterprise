/* ===========================================================
   FINORA ENTERPRISE OS™

   THEME ENGINE

   CORE THEME TYPES

   PURPOSE
   -----------------------------------------------------------
   Central contract for the FINORA V2 Theme Engine.

   IMPORTANT
   -----------------------------------------------------------
   Theme tokens control visual appearance only.

   Responsive dimensions such as:
   - width
   - height
   - padding
   - gap
   - radius
   - font sizing
   - layout geometry

   MUST continue to come from:

   app/renderer/v2/utils/responsive/

   Theme definitions must NOT become a second
   Responsive Engine.
=========================================================== */


/* ===========================================================
   THEME IDENTIFIER
=========================================================== */

export type ThemeId =
  | "imperial-gold"
  | "royal-navy"
  | "amethyst"
  | "emerald"
  | "obsidian";


/* ===========================================================
   THEME MODE
=========================================================== */

export type ThemeMode =
  | "light"
  | "dark";


/* ===========================================================
   THEME COLOR TOKENS
=========================================================== */

export interface ThemeColors {

  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brand: {
    primary: string;
    secondary: string;
    accent: string;
    accentSoft: string;
  };


  /* ---------------------------------------------------------
     BACKGROUND / SURFACE
  --------------------------------------------------------- */

  background: {
    page: string;
    surface: string;
    surfaceElevated: string;
    surfaceMuted: string;
    surfaceStrong: string;
  };


  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    disabled: string;
    link: string;
  };


  /* ---------------------------------------------------------
     BORDER
  --------------------------------------------------------- */

  border: {
    default: string;
    subtle: string;
    strong: string;
    focus: string;
  };


  /* ---------------------------------------------------------
     STATUS
  --------------------------------------------------------- */

  status: {
    success: string;
    successSoft: string;

    warning: string;
    warningSoft: string;

    danger: string;
    dangerSoft: string;

    info: string;
    infoSoft: string;
  };


  /* ---------------------------------------------------------
     INTERACTIVE
  --------------------------------------------------------- */

  interactive: {
    hover: string;
    active: string;
    selected: string;
    focus: string;
    disabled: string;
  };


  /* ---------------------------------------------------------
     OVERLAY
  --------------------------------------------------------- */

  overlay: {
    backdrop: string;
    shadow: string;
  };
}


/* ===========================================================
   THEME TYPOGRAPHIC COLOR TOKENS
=========================================================== */

export interface ThemeTypography {

  heading: string;
  body: string;
  label: string;
  caption: string;
  placeholder: string;
  link: string;
  inverse: string;
}


/* ===========================================================
   THEME COMPONENT TOKENS
=========================================================== */

export interface ThemeComponents {

  /* ---------------------------------------------------------
     CARD
  --------------------------------------------------------- */

  card: {
    background: string;
    border: string;
    shadow: string;
  };


  /* ---------------------------------------------------------
     INPUT
  --------------------------------------------------------- */

  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
    focusBorder: string;
    focusBackground: string;
    disabledBackground: string;
  };


  /* ---------------------------------------------------------
     BUTTON
  --------------------------------------------------------- */

  button: {
    primaryBackground: string;
    primaryText: string;
    primaryHover: string;

    secondaryBackground: string;
    secondaryText: string;
    secondaryBorder: string;
    secondaryHover: string;

    dangerBackground: string;
    dangerText: string;
    dangerHover: string;
  };


  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */

  navigation: {
    background: string;
    text: string;
    activeBackground: string;
    activeText: string;
    hoverBackground: string;
  };


  /* ---------------------------------------------------------
     HEADER
  --------------------------------------------------------- */

  header: {
    background: string;
    text: string;
    border: string;
  };


  /* ---------------------------------------------------------
     PANEL
  --------------------------------------------------------- */

  panel: {
    background: string;
    border: string;
    shadow: string;
  };


  /* ---------------------------------------------------------
     TABLE
  --------------------------------------------------------- */

  table: {
    headerBackground: string;
    headerText: string;
    rowBackground: string;
    rowAlternateBackground: string;
    rowHoverBackground: string;
    border: string;
  };


  /* ---------------------------------------------------------
     MODAL
  --------------------------------------------------------- */

  modal: {
    background: string;
    border: string;
    backdrop: string;
    shadow: string;
  };
}


/* ===========================================================
   COMPLETE THEME CONTRACT
=========================================================== */

export interface FinoraTheme {

  /* ---------------------------------------------------------
     IDENTITY
  --------------------------------------------------------- */

  id: ThemeId;

  name: string;

  mode: ThemeMode;


  /* ---------------------------------------------------------
     DESCRIPTION
  --------------------------------------------------------- */

  description: string;


  /* ---------------------------------------------------------
     THEME SELECTOR SWATCH
     
     PURPOSE
     -------------------------------------------------------
     Defines the small color shown in the global theme
     selector.

     This is intentionally separate from brand.primary.

     Example:
     Obsidian may use a silver/gold brand accent throughout
     the application while its selector identity remains
     a near-black swatch.

     This prevents the theme selector from changing the
     semantic meaning of brand.primary.
     
     OPTIONAL
     -------------------------------------------------------
     Existing themes that do not define a dedicated selector
     swatch may safely fall back to brand.primary.
  --------------------------------------------------------- */

  selectorSwatch?: string;


  /* ---------------------------------------------------------
     TOKEN GROUPS
  --------------------------------------------------------- */

  colors: ThemeColors;

  typography: ThemeTypography;

  components: ThemeComponents;
}


/* ===========================================================
   THEME OPTION
   Used by theme selector UI.
=========================================================== */

export interface ThemeOption {

  id: ThemeId;

  name: string;

  mode: ThemeMode;

  description: string;
}


/* ===========================================================
   THEME CONTEXT CONTRACT
=========================================================== */

export interface ThemeContextValue {

  /* ---------------------------------------------------------
     CURRENT THEME
  --------------------------------------------------------- */

  theme: FinoraTheme;

  themeId: ThemeId;


  /* ---------------------------------------------------------
     THEME CONTROL
  --------------------------------------------------------- */

  setTheme: (
    themeId: ThemeId,
  ) => void;


  /* ---------------------------------------------------------
     AVAILABLE THEMES
  --------------------------------------------------------- */

  themes: ThemeOption[];


  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */

  isThemeReady: boolean;
}


/* ===========================================================
   END
=========================================================== */