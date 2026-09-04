// ============================================================
// FINORA ENTERPRISE OS™
//
// RESPONSIVE LOGIN STYLES
//
// MODULE  : Authentication
// LAYER   : Renderer / Login
// VERSION : 3.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Premium FINORA Enterprise Login presentation
// - Consume the central FINORA Responsive Engine
// - Consume loginDefaultTheme as the visual source of truth
// - Provide complete Login style API
// - Support Lucide icon based login controls
//
// IMPORTANT:
//
// - No breakpoint logic here.
// - No viewport detection here.
// - No independent responsive dimensions.
// - Responsive dimensions come from:
//   app/renderer/v2/utils/responsive/
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveState,
} from "../../utils/responsive/types";

import {
  loginDefaultTheme,
} from "../../themes/login/default";


// ============================================================
// LOGIN THEME OPTIONS
// ============================================================

export type LoginThemeId =
  | "imperial-gold"
  | "royal-navy"
  | "amethyst"
  | "emerald"
  | "obsidian";


export interface LoginThemeOption {

  id:
    LoginThemeId;

  name:
    string;

  swatch:
    string;

}


// IMPORTANT:
// loginDefaultTheme is intentionally exported as a readonly / literal
// theme object.  The Login theme switcher needs a widened, mutable view
// of those same theme keys so alternate theme values can be supplied
// without changing the central theme contract.
type LoginTheme = {

  -readonly [Key in keyof typeof loginDefaultTheme]:
    string;

};


type LoginThemeOverrides =
  Partial<LoginTheme>;


const LOGIN_THEME_OVERRIDES:
  Record<
    LoginThemeId,
    LoginThemeOverrides
  > = {

  "imperial-gold": {},

  "royal-navy": {
    background: "#0D1728",
    surface: "#15233A",
    surfaceSoft: "#1B2D49",
    text: "#F4F7FC",
    textSoft: "#AEBBD0",
    textFaint: "#71819A",
    primary: "#4D82E6",
    border: "#2C4262",
    borderStrong: "#405B80",
    shadow: "rgba(3, 10, 22, 0.48)",
    warning: "#D8A83E",
    warningBorder: "#6D5727",
    warningBackground: "#211C12",
    success: "#4DBB89",
    successBorder: "#2E6D52",
    successBackground: "#11251C",
    successText: "#8BD6B1",
    danger: "#E06A76",
  },

  amethyst: {
    background: "#171022",
    surface: "#241834",
    surfaceSoft: "#302044",
    text: "#F8F3FF",
    textSoft: "#C0B3D2",
    textFaint: "#827397",
    primary: "#A46BE5",
    border: "#44305B",
    borderStrong: "#5B4275",
    shadow: "rgba(8, 3, 16, 0.50)",
    warning: "#D7A13D",
    warningBorder: "#6B5427",
    warningBackground: "#241D12",
    success: "#55C18D",
    successBorder: "#327154",
    successBackground: "#12271D",
    successText: "#91DAB7",
    danger: "#E37483",
  },

  emerald: {
    background: "#0C1B17",
    surface: "#142822",
    surfaceSoft: "#1B342C",
    text: "#F1FAF6",
    textSoft: "#A9C2B8",
    textFaint: "#6F8A80",
    primary: "#35A878",
    border: "#29493D",
    borderStrong: "#396452",
    shadow: "rgba(2, 13, 9, 0.50)",
    warning: "#D5A03B",
    warningBorder: "#6C5427",
    warningBackground: "#211B11",
    success: "#59C895",
    successBorder: "#34785A",
    successBackground: "#12281E",
    successText: "#92DEBA",
    danger: "#E46F7D",
  },

  obsidian: {
    background: "#0B0D12",
    surface: "#151820",
    surfaceSoft: "#1D212B",
    text: "#F5F2EA",
    textSoft: "#B9B5AC",
    textFaint: "#77756F",
    primary: "#D7B56A",
    border: "#30343E",
    borderStrong: "#474C58",
    shadow: "rgba(0, 0, 0, 0.48)",
    warning: "#D7A33D",
    warningBorder: "#725A2A",
    warningBackground: "#211C12",
    success: "#4EBB88",
    successBorder: "#2F6E52",
    successBackground: "#11251C",
    successText: "#8BD6B1",
    danger: "#E06A76",
  },

};


export const LOGIN_THEME_OPTIONS:
  LoginThemeOption[] = [

  {
    id: "imperial-gold",
    name: "Imperial Gold",
    swatch: "#C58A08",
  },

  {
    id: "royal-navy",
    name: "Royal Navy",
    swatch: "#4D82E6",
  },

  {
    id: "amethyst",
    name: "Amethyst",
    swatch: "#A46BE5",
  },

  {
    id: "emerald",
    name: "Emerald",
    swatch: "#35A878",
  },

  {
    id: "obsidian",
    name: "Obsidian",
    swatch: "#161922",
  },

];


export function getLoginTheme(
  themeId:
    LoginThemeId,
): LoginTheme {

  return {
    ...loginDefaultTheme,
    ...LOGIN_THEME_OVERRIDES[themeId],
  };

}


// ============================================================
// LOGIN STYLE CONTRACT
// ============================================================

export interface LoginStyles {

  container:
    CSSProperties;

  card:
    CSSProperties;

  header:
    CSSProperties;

  logo:
    CSSProperties;

  logoImage:
    CSSProperties;

  title:
    CSSProperties;

  subtitle:
    CSSProperties;

  titleAccent:
    CSSProperties;

  themePicker:
    CSSProperties;

  themeOption:
    CSSProperties;

  themeOptionActive:
    CSSProperties;

  themeSwatch:
    CSSProperties;

  themeOptionLabel:
    CSSProperties;

  usbStatus:
    CSSProperties;

  usbStatusRow:
    CSSProperties;

  usbStatusText:
    CSSProperties;

  usbMessage:
    CSSProperties;

  startupMessage:
    CSSProperties;

  chooserOption:
    CSSProperties;

  chooserOptionDisabled:
    CSSProperties;

  chooserOptionContent:
    CSSProperties;

  chooserOptionIcon:
    CSSProperties;

  chooserOptionText:
    CSSProperties;

  chooserOptionTitle:
    CSSProperties;

  chooserOptionSubtitle:
    CSSProperties;

  chooserOptionChevron:
    CSSProperties;

  fieldSection:
    CSSProperties;

  fieldSectionCompact:
    CSSProperties;

  fieldLabel:
    CSSProperties;

  customSelect:
    CSSProperties;

  customSelectButton:
    CSSProperties;

  customSelectValue:
    CSSProperties;

  customSelectIcon:
    CSSProperties;

  customSelectChevron:
    CSSProperties;

  customSelectMenu:
    CSSProperties;

  customSelectOption:
    CSSProperties;

  customSelectOptionActive:
    CSSProperties;

  helperText:
    CSSProperties;

  helperTextWithMargin:
    CSSProperties;

  chooserError:
    CSSProperties;

  modeNoticeUsb:
    CSSProperties;

  modeNoticeCloud:
    CSSProperties;

  modeNoticeNormal:
    CSSProperties;

  modeNoticeHeader:
    CSSProperties;

  modeNoticeSubtext:
    CSSProperties;

  inputGroup:
    CSSProperties;

  inputWrapper:
    CSSProperties;

  inputIcon:
    CSSProperties;

  input:
    CSSProperties;

  inputDisabled:
    CSSProperties;

  passwordToggle:
    CSSProperties;

  disabledPasswordIcon:
    CSSProperties;

  forgotPassword:
    CSSProperties;

  error:
    CSSProperties;

  primaryButton:
    CSSProperties;

  primaryButtonContent:
    CSSProperties;

  secondaryButton:
    CSSProperties;

  secondaryButtonContent:
    CSSProperties;

  defaultAccount:
    CSSProperties;

  defaultAccountIcon:
    CSSProperties;

  defaultAccountTitle:
    CSSProperties;

  defaultAccountCredentials:
    CSSProperties;

}


// ============================================================
// LOGIN THEME SWATCH STYLE
// ============================================================

export function getLoginThemeSwatchStyle(
  swatch:
    string,
  active:
    boolean,
  theme:
    LoginTheme =
    loginDefaultTheme,
): CSSProperties {

  return {

    ...getBoxSizing(),

    width:
      "1.55em",

    height:
      "1.55em",

    minWidth:
      "1.55em",

    minHeight:
      "1.55em",

    borderRadius:
      "50%",

    border:
      `2px solid ${
        active
          ? theme.primary
          : theme.border
      }`,

    background:
      swatch,

    boxShadow:
  active
    ? `0 0 0 2px ${theme.surface}, 0 0 0 3px ${theme.primary}`
    : "0 4px 12px rgba(0, 0, 0, 0.10)",

    transform:
      active
        ? "translateY(-1px)"
        : "none",

    transition:
      "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",

  };

}


// ============================================================
// BOX SIZING
// ============================================================

function getBoxSizing():
  CSSProperties {

  return {

    boxSizing:
      "border-box",

  };

}


// ============================================================
// LOGIN STYLES
// ============================================================

export function getLoginStyles(
  responsive: ResponsiveState,
  theme:
    LoginTheme =
    loginDefaultTheme,
): LoginStyles {

  const COLORS =
    theme;

  const tokens =
    responsive.tokens;


  // ==========================================================
  // RESPONSIVE TOKEN GROUPS
  // ==========================================================

  const loginTokens =
    tokens.login;

  const typographyTokens =
    tokens.typography;

  const spacingTokens =
    tokens.spacing;

  const borderTokens =
    tokens.border;

  const controlTokens =
    tokens.control;

  const inputTokens =
    tokens.input;

  const buttonTokens =
    tokens.button;

  const lineHeightTokens =
    tokens.lineHeight;


  // ==========================================================
  // CONTAINER
  // ==========================================================

  const container:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    minHeight:
      "100vh",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      loginTokens.pagePadding,

    background:
      COLORS.background,

    color:
      COLORS.text,

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    overflow:
      "auto",

  };


  // ==========================================================
  // LOGIN CARD
  // ==========================================================

  const card:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      loginTokens.cardWidth,

    maxWidth:
      loginTokens.cardMaxWidth,

    minWidth:
      0,

    paddingTop:
      spacingTokens.small,

    paddingRight:
      loginTokens.cardPadding,

    paddingBottom:
      loginTokens.cardPadding,

    paddingLeft:
      loginTokens.cardPadding,

    background:
      COLORS.surface,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      loginTokens.cardRadius,

    boxShadow:
      `0 20px 60px ${COLORS.shadow}`,

  };


  // ==========================================================
  // HEADER
  // ==========================================================

  const header:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    textAlign:
      "center",

  };


  // ==========================================================
  // LOGO
  //
  // Relative sizing keeps the presentation tied to the
  // responsive typography scale rather than introducing a
  // separate viewport-specific dimension.
  // ==========================================================

  const logo:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    marginBottom:
      0,

    fontSize:
      loginTokens.titleSize,

  };


  const logoImage:
  CSSProperties = {

  display:
    "block",

  width:
    "4em",

  height:
    "4em",

  maxWidth:
    "100%",

  objectFit:
    "contain",

};

  // ==========================================================
  // TITLE
  // ==========================================================

  const title:
    CSSProperties = {

    margin:
      0,

    color:
      COLORS.text,

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
  loginTokens.titleSize * 0.72,

    fontWeight:
      800,

    lineHeight:
      lineHeightTokens.title,

    letterSpacing:
      "1px",

    textAlign:
      "center",

  };


  // ==========================================================
  // SUBTITLE
  // ==========================================================

  const subtitle:
    CSSProperties = {

    marginTop:
      spacingTokens.small,

    marginBottom:
      0,

    color:
      COLORS.textSoft,

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      loginTokens.subtitleSize,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

    textAlign:
      "center",

  };


  // ==========================================================
  // GOLD HEADER ACCENT
  // ==========================================================

  const titleAccent:
    CSSProperties = {

    width:
      "5em",

    maxWidth:
      "100%",

    height:
      borderTokens.width,

    marginTop:
      spacingTokens.small,

    marginBottom:
      spacingTokens.small,

    borderRadius:
      borderTokens.width,

    background:
      COLORS.primary,

  };


  // ==========================================================
  // LOGIN THEME PICKER
  //
  // Five small circular selectors.
  // The control itself is compact and flex-wraps so it remains
  // safe on narrow responsive viewports.
  // ==========================================================

  const themePicker:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "center",

    gap:
  spacingTokens.small,

width:
  "100%",

flexWrap:
  "wrap",

marginBottom:
  spacingTokens.small,

  };


  const themeOption:
    CSSProperties = {

    ...getBoxSizing(),

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "flex-start",

    gap:
      spacingTokens.small,

    padding:
      0,

    border:
      "none",

    background:
      "transparent",

    color:
      COLORS.textSoft,

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      typographyTokens.small,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

  };


  const themeOptionActive:
    CSSProperties = {

    ...themeOption,

    color:
      COLORS.text,

    fontWeight:
      800,

  };


  const themeSwatch:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "1.55em",

    height:
      "1.55em",

    minWidth:
      "1.55em",

    minHeight:
      "1.55em",

    borderRadius:
      "50%",

    border:
      `2px solid ${COLORS.border}`,

    boxShadow:
      "0 4px 12px rgba(0, 0, 0, 0.10)",

    transition:
      "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",

  };


  const themeOptionLabel:
  CSSProperties = {

  display:
    "none",

};


  // ==========================================================
  // USB STATUS
  // ==========================================================

  const usbStatus:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    padding:
      spacingTokens.control,

    marginBottom:
      spacingTokens.medium,

    border:
      `${borderTokens.width}px solid ${COLORS.warningBorder}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.warningBackground,

  };


  // ==========================================================
  // USB STATUS ROW
  // ==========================================================

  const usbStatusRow:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      controlTokens.gap,

    minWidth:
      0,

    color:
      COLORS.text,

    fontSize:
      typographyTokens.label,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // USB STATUS TEXT
  // ==========================================================

  const usbStatusText:
    CSSProperties = {

    minWidth:
      0,

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

  };


  // ==========================================================
  // USB MESSAGE
  // ==========================================================

  const usbMessage:
    CSSProperties = {

    marginTop:
      spacingTokens.small,

    color:
      COLORS.textSoft,

    fontSize:
      typographyTokens.small,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // STARTUP MESSAGE
  // ==========================================================

  const startupMessage:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      controlTokens.gap,

    paddingTop:
      spacingTokens.small,

    color:
      COLORS.textSoft,

    textAlign:
      "center",

    fontSize:
      typographyTokens.small,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // CHOOSER OPTION
  // ==========================================================

  const chooserOption:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    minHeight:
      buttonTokens.height,

    padding:
      `${buttonTokens.paddingY}px ${buttonTokens.paddingX}px`,

    marginTop:
      spacingTokens.medium,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      buttonTokens.radius,

    background:
      COLORS.surface,

    color:
      COLORS.text,

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    textAlign:
      "left",

    transition:
      "border-color 120ms ease, background 120ms ease, box-shadow 120ms ease",

  };


  // ==========================================================
  // CHOOSER OPTION DISABLED
  // ==========================================================

  const chooserOptionDisabled:
    CSSProperties = {

    ...chooserOption,

    borderColor:
      COLORS.border,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.textSoft,

    cursor:
      "not-allowed",

    opacity:
      0.72,

  };


  // ==========================================================
  // CHOOSER OPTION CONTENT
  // ==========================================================

  const chooserOptionContent:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      controlTokens.gap,

    minWidth:
      0,

  };


  // ==========================================================
  // CHOOSER OPTION ICON
  // ==========================================================

  const chooserOptionIcon:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    fontSize:
      typographyTokens.button,

    color:
      COLORS.primary,

  };


  // ==========================================================
  // CHOOSER OPTION TEXT
  // ==========================================================

  const chooserOptionText:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    minWidth:
      0,

    flex:
      1,

  };


  // ==========================================================
  // CHOOSER OPTION TITLE
  // ==========================================================

  const chooserOptionTitle:
    CSSProperties = {

    color:
      COLORS.text,

    fontSize:
      typographyTokens.button,

    fontWeight:
      800,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // CHOOSER OPTION SUBTITLE
  // ==========================================================

  const chooserOptionSubtitle:
    CSSProperties = {

    marginTop:
      spacingTokens.small,

    color:
      COLORS.textSoft,

    fontSize:
      typographyTokens.small,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // CHOOSER OPTION CHEVRON
  // ==========================================================

  const chooserOptionChevron:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    color:
      COLORS.textSoft,

    fontSize:
      typographyTokens.button,

  };


  // ==========================================================
  // FIELD SECTION
  // ==========================================================

  const fieldSection:
    CSSProperties = {

    ...getBoxSizing(),

    position:
      "relative",

    width:
      "100%",

    marginTop:
      spacingTokens.small,

  };


  // ==========================================================
  // FIELD SECTION — COMPACT
  // ==========================================================

  const fieldSectionCompact:
    CSSProperties = {

    ...fieldSection,

    marginTop:
      spacingTokens.small,

  };


  // ==========================================================
  // FIELD LABEL
  // ==========================================================

  const fieldLabel:
    CSSProperties = {

    marginBottom:
      spacingTokens.small,

    color:
      COLORS.textSoft,

    fontSize:
      typeof typographyTokens.small === "number"
        ? typographyTokens.small + 1
        : `calc(${typographyTokens.small} + 1px)`,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // CUSTOM SELECT
  // ==========================================================

  const customSelect:
    CSSProperties = {

    ...getBoxSizing(),

    position:
      "relative",

    width:
      "100%",

  };


  // ==========================================================
  // CUSTOM SELECT BUTTON
  // ==========================================================

  const customSelectButton:
    CSSProperties = {

    ...getBoxSizing(),

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      controlTokens.gap,

    width:
      "100%",

    minHeight:
      controlTokens.height,

    padding:
      `${controlTokens.paddingY}px ${controlTokens.paddingX}px`,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.text,

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      typographyTokens.button,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

    textAlign:
      "left",

    outline:
      "none",

    transition:
      "border-color 120ms ease, background 120ms ease, box-shadow 120ms ease",

  };


  // ==========================================================
  // CUSTOM SELECT VALUE
  // ==========================================================

  const customSelectValue:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      controlTokens.gap,

    minWidth:
      0,

    flex:
      1,

  };


  // ==========================================================
  // CUSTOM SELECT ICON
  // ==========================================================

  const customSelectIcon:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    color:
      COLORS.primary,

  };


  // ==========================================================
  // CUSTOM SELECT CHEVRON
  // ==========================================================

  const customSelectChevron:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    color:
      COLORS.textSoft,

  };


  // ==========================================================
  // CUSTOM SELECT MENU
  // ==========================================================

  const customSelectMenu:
    CSSProperties = {

    ...getBoxSizing(),

    position:
      "absolute",

    top:
      "calc(100% + 6px)",

    left:
      0,

    right:
      0,

    zIndex:
      100,

    padding:
      spacingTokens.small,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.surface,

    boxShadow:
      `0 14px 34px ${COLORS.shadow}`,

  };


  // ==========================================================
  // CUSTOM SELECT OPTION
  // ==========================================================

  const customSelectOption:
    CSSProperties = {

    ...getBoxSizing(),

    display:
      "flex",

    alignItems:
      "center",

    gap:
      controlTokens.gap,

    width:
      "100%",

    minHeight:
      controlTokens.height,

    padding:
      `${controlTokens.paddingY}px ${controlTokens.paddingX}px`,

    border:
      "none",

    borderRadius:
      controlTokens.radius,

    background:
      "transparent",

    color:
      COLORS.text,

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      typographyTokens.button,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

    textAlign:
      "left",

  };


  // ==========================================================
  // CUSTOM SELECT OPTION — ACTIVE
  // ==========================================================

  const customSelectOptionActive:
    CSSProperties = {

    ...customSelectOption,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.text,

    fontWeight:
      800,

    boxShadow:
      `inset 3px 0 0 ${COLORS.primary}`,

  };


  // ==========================================================
  // HELPER TEXT
  // ==========================================================

  const helperText:
    CSSProperties = {

    textAlign:
      "center",

    color:
      COLORS.textSoft,

    fontSize:
      typographyTokens.small,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // HELPER TEXT WITH MARGIN
  // ==========================================================

  const helperTextWithMargin:
    CSSProperties = {

    ...helperText,

    marginTop:
      spacingTokens.small,

    marginBottom:
      spacingTokens.small,

  };


  // ==========================================================
  // CHOOSER ERROR
  // ==========================================================

  const chooserError:
    CSSProperties = {

    marginTop:
      spacingTokens.control,

    marginBottom:
      0,

    color:
      COLORS.danger,

    textAlign:
      "center",

    fontSize:
      typographyTokens.small,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // MODE NOTICE — USB
  // ==========================================================

  const modeNoticeUsb:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    padding:
      spacingTokens.control,

    marginBottom:
      spacingTokens.control,

    border:
      `${borderTokens.width}px solid ${COLORS.successBorder}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.successBackground,

    color:
      COLORS.successText,

    fontSize:
      typographyTokens.small,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // MODE NOTICE — CLOUD
  // ==========================================================

  const modeNoticeCloud:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    padding:
      spacingTokens.control,

    marginBottom:
      spacingTokens.control,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.text,

    fontSize:
      typographyTokens.small,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // MODE NOTICE — NORMAL
  // ==========================================================

  const modeNoticeNormal:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    padding:
      spacingTokens.control,

    marginBottom:
      spacingTokens.control,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.text,

    fontSize:
      typographyTokens.small,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // MODE NOTICE HEADER
  // ==========================================================

  const modeNoticeHeader:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      controlTokens.gap,

    color:
      COLORS.text,

    fontSize:
      typographyTokens.button,

    fontWeight:
      800,

  };


  // ==========================================================
  // MODE NOTICE SUBTEXT
  // ==========================================================

  const modeNoticeSubtext:
    CSSProperties = {

    marginTop:
      spacingTokens.small,

    color:
      COLORS.textSoft,

    fontSize:
      typographyTokens.small,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // INPUT GROUP
  // ==========================================================

  const inputGroup:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      spacingTokens.control,

  };


  // ==========================================================
  // INPUT WRAPPER
  // ==========================================================

  const inputWrapper:
    CSSProperties = {

    ...getBoxSizing(),

    position:
      "relative",

    width:
      "100%",

  };


  // ==========================================================
  // INPUT ICON
  // ==========================================================

  const inputIcon:
    CSSProperties = {

    position:
      "absolute",

    left:
      inputTokens.paddingX,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    color:
      COLORS.textSoft,

    pointerEvents:
      "none",

    fontSize:
      typographyTokens.button,

  };


  // ==========================================================
  // INPUT
  // ==========================================================

  const input:
    CSSProperties = {

    ...getBoxSizing(),

    display:
      "block",

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      inputTokens.minHeight,

    height:
      inputTokens.height,

    paddingTop:
      `${inputTokens.paddingY}px`,

    paddingBottom:
      `${inputTokens.paddingY}px`,

    paddingLeft:
  `${inputTokens.paddingX + inputTokens.iconSize + controlTokens.gap}px`,

paddingRight:
  `${inputTokens.paddingX + inputTokens.iconSize + controlTokens.gap}px`,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      inputTokens.radius,

    outline:
      "none",

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.text,

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      inputTokens.fontSize,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

  };


  // ==========================================================
  // PASSWORD TOGGLE
  // ==========================================================

  const passwordToggle:
    CSSProperties = {

    position:
      "absolute",

    right:
      inputTokens.paddingX,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      0,

    border:
      "none",

    background:
      "transparent",

    color:
      COLORS.textSoft,

    cursor:
      "pointer",

  };


  // ==========================================================
  // DISABLED / PLACEHOLDER INPUT
  // ==========================================================

  const inputDisabled:
    CSSProperties = {

    ...input,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.textSoft,

    cursor:
      "not-allowed",

    opacity:
      0.82,

  };


  // ==========================================================
  // DISABLED PASSWORD ICON
  // ==========================================================

  const disabledPasswordIcon:
    CSSProperties = {

    position:
      "absolute",

    right:
      inputTokens.paddingX,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    color:
      COLORS.textSoft,

    pointerEvents:
      "none",

  };


  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  const forgotPassword:
    CSSProperties = {

    display:
      "block",

    width:
      "100%",

    marginTop:
      spacingTokens.small,

    padding:
      0,

    border:
      "none",

    background:
      "transparent",

    color:
      COLORS.textSoft,

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      typographyTokens.small,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

    textAlign:
      "center",

  };


  // ==========================================================
  // ERROR
  // ==========================================================

  const error:
    CSSProperties = {

    marginTop:
      spacingTokens.control,

    marginBottom:
      0,

    color:
      COLORS.danger,

    fontSize:
      typographyTokens.small,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.body,

    textAlign:
      "center",

  };


  // ==========================================================
  // PRIMARY BUTTON
  // ==========================================================

  const primaryButton:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    minHeight:
      buttonTokens.height,

    padding:
      `${buttonTokens.paddingY}px ${buttonTokens.paddingX}px`,

    marginTop:
      spacingTokens.medium,

    border:
      "none",

    borderRadius:
      buttonTokens.radius,

    background:
      COLORS.primary,

    color:
      "#FFFFFF",

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      buttonTokens.fontSize,

    fontWeight:
      800,

    lineHeight:
      lineHeightTokens.compact,

    boxShadow:
      "none",

  };


  // ==========================================================
  // PRIMARY BUTTON CONTENT
  // ==========================================================

  const primaryButtonContent:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      controlTokens.gap,

  };


  // ==========================================================
  // SECONDARY BUTTON
  // ==========================================================

  const secondaryButton:
    CSSProperties = {

    ...getBoxSizing(),

    width:
      "100%",

    minHeight:
      controlTokens.height,

    padding:
      `${controlTokens.paddingY}px ${controlTokens.paddingX}px`,

    marginTop:
      spacingTokens.control,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.surface,

    color:
      COLORS.textSoft,

    cursor:
      "pointer",

    fontFamily:
      "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

    fontSize:
      typographyTokens.button,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // SECONDARY BUTTON CONTENT
  // ==========================================================

  const secondaryButtonContent:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      controlTokens.gap,

  };


  // ==========================================================
  // DEFAULT ACCOUNT
  // ==========================================================

  const defaultAccount:
    CSSProperties = {

    ...getBoxSizing(),

    display:
      "flex",

    alignItems:
      "center",

    gap:
      controlTokens.gap,

    width:
      "100%",

    marginTop:
      loginTokens.sectionGap,

    padding:
      spacingTokens.control,

    border:
      `${borderTokens.width}px solid ${COLORS.border}`,

    borderRadius:
      controlTokens.radius,

    background:
      COLORS.surfaceSoft,

  };


  // ==========================================================
  // DEFAULT ACCOUNT ICON
  // ==========================================================

  const defaultAccountIcon:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    color:
      COLORS.primary,

    fontSize:
      typographyTokens.button,

  };


  // ==========================================================
  // DEFAULT ACCOUNT TITLE
  // ==========================================================

  const defaultAccountTitle:
    CSSProperties = {

    color:
      COLORS.textSoft,

    fontSize:
      typographyTokens.small,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // DEFAULT ACCOUNT CREDENTIALS
  // ==========================================================

  const defaultAccountCredentials:
    CSSProperties = {

    marginTop:
      spacingTokens.small,

    color:
      COLORS.text,

    fontSize:
      typographyTokens.small,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    container,

    card,

    header,

    logo,

    logoImage,

    title,

    subtitle,

    titleAccent,

    themePicker,

    themeOption,

    themeOptionActive,

    themeSwatch,

    themeOptionLabel,

    usbStatus,

    usbStatusRow,

    usbStatusText,

    usbMessage,

    startupMessage,

    chooserOption,

    chooserOptionDisabled,

    chooserOptionContent,

    chooserOptionIcon,

    chooserOptionText,

    chooserOptionTitle,

    chooserOptionSubtitle,

    chooserOptionChevron,

    fieldSection,

    fieldSectionCompact,

    fieldLabel,

    customSelect,

    customSelectButton,

    customSelectValue,

    customSelectIcon,

    customSelectChevron,

    customSelectMenu,

    customSelectOption,

    customSelectOptionActive,

    helperText,

    helperTextWithMargin,

    chooserError,

    modeNoticeUsb,

    modeNoticeCloud,

    modeNoticeNormal,

    modeNoticeHeader,

    modeNoticeSubtext,

    inputGroup,

    inputWrapper,

    inputIcon,

    input,

    inputDisabled,

    passwordToggle,

    disabledPasswordIcon,

    forgotPassword,

    error,

    primaryButton,

    primaryButtonContent,

    secondaryButton,

    secondaryButtonContent,

    defaultAccount,

    defaultAccountIcon,

    defaultAccountTitle,

    defaultAccountCredentials,

  };

}


// ============================================================
// USB STATUS CONTAINER
//
// IMPORTANT:
//
// This function previously used a hard-coded dark navy
// background. That was why the Login screenshot still showed
// the old dark USB panel after the theme change.
//
// It now consumes the FINORA Login theme.
// ============================================================

export function getUsbStatusStyle(
  usbAvailable: boolean,
  theme:
    LoginTheme =
    loginDefaultTheme,
): CSSProperties {

  return {

    width:
      "100%",

    boxSizing:
      "border-box",

    border:
      `1px solid ${
        usbAvailable
          ? theme.successBorder
          : theme.warningBorder
      }`,

    borderRadius:
      "inherit",

    background:
      usbAvailable
        ? theme.successBackground
        : theme.warningBackground,

  };

}


// ============================================================
// USB STATUS INDICATOR
// ============================================================

export function getUsbStatusIndicatorStyle(
  usbChecking: boolean,
  usbAvailable: boolean,
  theme:
    LoginTheme =
    loginDefaultTheme,
): CSSProperties {

  return {

    width:
      "0.65em",

    height:
      "0.65em",

    minWidth:
      "0.65em",

    minHeight:
      "0.65em",

    borderRadius:
      "50%",

    flexShrink:
      0,

    background:
      usbChecking
        ? theme.warning
        : usbAvailable
          ? theme.success
          : theme.textFaint,

  };

}


// ============================================================
// END
// ============================================================