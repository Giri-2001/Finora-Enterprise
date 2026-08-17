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
// - Login presentation only
// - Consume the central FINORA Responsive Engine
// - Provide complete Login style API
// - Preserve existing Login.tsx style contracts
//
// IMPORTANT:
//
// - No responsive breakpoint logic here.
// - No device-specific responsive numbers here.
// - No responsive magic numbers here.
// - Responsive dimensions come only from:
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


// ============================================================
// STATIC PRESENTATION COLORS
//
// These values are visual identity values.
// Responsive dimensions are NOT defined here.
// ============================================================

const COLORS = {

  background:
    "#0F172A",

  surface:
    "#111827",

  surfaceSoft:
    "#1E293B",

  border:
    "#334155",

  borderStrong:
    "#475569",

  text:
    "#FFFFFF",

  textMuted:
    "#CBD5E1",

  textSoft:
    "#94A3B8",

  textFaint:
    "#64748B",

  primary:
    "#2563EB",

  primaryHover:
    "#3B82F6",

  success:
    "#22C55E",

  successBackground:
    "rgba(22,101,52,0.18)",

  successBorder:
    "rgba(34,197,94,0.45)",

  successBorderStrong:
    "rgba(34,197,94,0.55)",

  successText:
    "#BBF7D0",

  warning:
    "#F59E0B",

  warningBackground:
    "rgba(245,158,11,0.12)",

  warningBorder:
    "rgba(245,158,11,0.35)",

  danger:
    "#F87171",

  dangerBackground:
    "rgba(239,68,68,0.12)",

  shadow:
    "rgba(0,0,0,0.35)",

} as const;


// ============================================================
// FONT FAMILY
// ============================================================

const FONT_FAMILY =
  "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";


// ============================================================
// LOGIN STYLE CONTRACT
// ============================================================

export interface LoginStyles {

  container:
    CSSProperties;

  card:
    CSSProperties;

  title:
    CSSProperties;

  subtitle:
    CSSProperties;

  usbStatusRow:
    CSSProperties;

  usbMessage:
    CSSProperties;

  startupMessage:
    CSSProperties;

  usbLoginButton:
    CSSProperties;

  usbLoginButtonDisabled:
    CSSProperties;

  normalLoginButton:
    CSSProperties;

  helperText:
    CSSProperties;

  helperTextWithMargin:
    CSSProperties;

  chooserError:
    CSSProperties;

  modeNoticeUsb:
    CSSProperties;

  modeNoticeNormal:
    CSSProperties;

  modeNoticeSubtext:
    CSSProperties;

  input:
    CSSProperties;

  error:
    CSSProperties;

  primaryButton:
    CSSProperties;

  secondaryButton:
    CSSProperties;

  developmentAccount:
    CSSProperties;

}


// ============================================================
// COMMON BOX FOUNDATION
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
): LoginStyles {

  // ==========================================================
  // CENTRAL RESPONSIVE ENGINE
  // ==========================================================

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
      FONT_FAMILY,

    overflow:
      "auto",

  };


  // ==========================================================
  // CARD
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

    padding:
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
  // TITLE
  // ==========================================================

  const title:
    CSSProperties = {

    margin:
      0,

    textAlign:
      "center",

    color:
      COLORS.text,

    fontFamily:
      FONT_FAMILY,

    fontSize:
      loginTokens.titleSize,

    fontWeight:
      800,

    lineHeight:
      lineHeightTokens.title,

    letterSpacing:
      "1px",

  };


  // ==========================================================
  // SUBTITLE
  // ==========================================================

  const subtitle:
    CSSProperties = {

    marginTop:
      spacingTokens.inline,

    marginBottom:
      loginTokens.sectionGap,

    textAlign:
      "center",

    color:
      COLORS.textSoft,

    fontFamily:
      FONT_FAMILY,

    fontSize:
      loginTokens.subtitleSize,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

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
      COLORS.textMuted,

    fontSize:
      typographyTokens.label,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

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

    paddingTop:
      spacingTokens.small,

    color:
      COLORS.textFaint,

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
  // USB LOGIN BUTTON
  // ==========================================================

  const usbLoginButton:
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
      `${borderTokens.width}px solid ${COLORS.successBorderStrong}`,

    borderRadius:
      buttonTokens.radius,

    background:
      COLORS.successBackground,

    color:
      COLORS.text,

    cursor:
      "pointer",

    fontFamily:
      FONT_FAMILY,

    fontSize:
      buttonTokens.fontSize,

    fontWeight:
      800,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // USB LOGIN BUTTON — DISABLED
  // ==========================================================

  const usbLoginButtonDisabled:
    CSSProperties = {

    ...usbLoginButton,

    borderColor:
      COLORS.border,

    background:
      COLORS.surfaceSoft,

    cursor:
      "not-allowed",

    opacity:
      0.65,

  };


  // ==========================================================
  // NORMAL LOGIN BUTTON
  // ==========================================================

  const normalLoginButton:
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
      `${borderTokens.width}px solid ${COLORS.borderStrong}`,

    borderRadius:
      buttonTokens.radius,

    background:
      COLORS.surfaceSoft,

    color:
      COLORS.text,

    cursor:
      "pointer",

    fontFamily:
      FONT_FAMILY,

    fontSize:
      buttonTokens.fontSize,

    fontWeight:
      800,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // HELPER TEXT
  // ==========================================================

  const helperText:
    CSSProperties = {

    textAlign:
      "center",

    color:
      COLORS.textFaint,

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
      COLORS.background,

    color:
      COLORS.textMuted,

    fontSize:
      typographyTokens.small,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

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

    padding:
      `${inputTokens.paddingY}px ${inputTokens.paddingX}px`,

    marginTop:
      spacingTokens.control,

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
      FONT_FAMILY,

    fontSize:
      inputTokens.fontSize,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

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
      COLORS.text,

    cursor:
      "pointer",

    fontFamily:
      FONT_FAMILY,

    fontSize:
      buttonTokens.fontSize,

    fontWeight:
      700,

    lineHeight:
      lineHeightTokens.compact,

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
      "transparent",

    color:
      COLORS.textSoft,

    cursor:
      "pointer",

    fontFamily:
      FONT_FAMILY,

    fontSize:
      typographyTokens.button,

    fontWeight:
      600,

    lineHeight:
      lineHeightTokens.compact,

  };


  // ==========================================================
  // DEVELOPMENT ACCOUNT
  // ==========================================================

  const developmentAccount:
    CSSProperties = {

    marginTop:
      spacingTokens.large,

    marginBottom:
      0,

    color:
      COLORS.textFaint,

    textAlign:
      "center",

    fontSize:
      typographyTokens.small,

    fontWeight:
      500,

    lineHeight:
      lineHeightTokens.body,

    opacity:
      0.75,

  };


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    container,

    card,

    title,

    subtitle,

    usbStatusRow,

    usbMessage,

    startupMessage,

    usbLoginButton,

    usbLoginButtonDisabled,

    normalLoginButton,

    helperText,

    helperTextWithMargin,

    chooserError,

    modeNoticeUsb,

    modeNoticeNormal,

    modeNoticeSubtext,

    input,

    error,

    primaryButton,

    secondaryButton,

    developmentAccount,

  };

}


// ============================================================
// USB STATUS CONTAINER
//
// State-dependent styling only.
// ============================================================

export function getUsbStatusStyle(
  usbAvailable: boolean,
): CSSProperties {

  return {

    width:
      "100%",

    boxSizing:
      "border-box",

    marginBottom:
      0,

    padding:
      "inherit",

    border:
      `1px solid ${
        usbAvailable
          ? COLORS.successBorder
          : COLORS.border
      }`,

    borderRadius:
      "inherit",

    background:
      usbAvailable
        ? COLORS.successBackground
        : COLORS.background,

  };

}


// ============================================================
// USB STATUS INDICATOR
//
// State-dependent visual styling only.
// ============================================================

export function getUsbStatusIndicatorStyle(
  usbChecking: boolean,
  usbAvailable: boolean,
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
        ? COLORS.warning
        : usbAvailable
          ? COLORS.success
          : COLORS.textFaint,

  };

}


// ============================================================
// END
// ============================================================