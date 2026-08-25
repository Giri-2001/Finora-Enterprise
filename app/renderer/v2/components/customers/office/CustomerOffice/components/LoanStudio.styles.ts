/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™
   PRESENTATION STYLE ENGINE

   RESPONSIBILITY:
   - Shared Loan Studio shell
   - Wizard navigation presentation
   - Theme-aware visual presentation
   - Responsive-token compatibility adapter

   THEME CONTRACT:
   - Theme values come ONLY from the central FINORA Theme Engine.
   - Responsive geometry comes ONLY from ResponsiveTokens.
   - No local theme definitions are created here.
   - Theme CSS variables are propagated from the active
     FinoraTheme so all nested Loan Studio modules resolve
     the same selected application theme.

   NOTE:
   Step 1 geometry now lives in:
   ./views/LoanStudioStep1.styles.ts

   Existing imports are preserved through compatibility exports
   so no feature is removed while the split is being completed.
=========================================================== */

import type { CSSProperties } from "react";
import type { ResponsiveTokens } from "../../../../../utils/responsive";
import { LAPTOP_TOKENS } from "../../../../../utils/responsive/tokens";
import type { FinoraTheme } from "../../../../../themes/core/types";


/* ===========================================================
   THEME STYLE TYPE
=========================================================== */

export type LoanStudioThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   THEME VISUAL CONTRACT
=========================================================== */

function getThemeVisuals(
  theme?: FinoraTheme,
) {

  if (theme) {

    return {

      page:
        theme.colors.background.page,

      surface:
        theme.colors.background.surface,

      surfaceMuted:
        theme.colors.background.surfaceMuted,

      surfaceStrong:
        theme.colors.background.surfaceStrong,

      primary:
        theme.colors.brand.primary,

      primaryHover:
        theme.colors.brand.secondary,

      primarySoft:
        theme.colors.brand.accentSoft,

      textPrimary:
        theme.colors.text.primary,

      textSecondary:
        theme.colors.text.secondary,

      textMuted:
        theme.colors.text.muted,

      textInverse:
        theme.colors.text.inverse,

      border:
        theme.colors.border.default,

      borderStrong:
        theme.colors.border.strong,

      borderSubtle:
        theme.colors.border.subtle,

      success:
        theme.colors.status.success,

      successSoft:
        theme.colors.status.successSoft,

      successBorder:
        theme.colors.border.strong,

      warning:
        theme.colors.status.warning,

      warningSoft:
        theme.colors.status.warningSoft,

      danger:
        theme.colors.status.danger,

      dangerSoft:
        theme.colors.status.dangerSoft,

      info:
        theme.colors.status.info,

      infoSoft:
        theme.colors.status.infoSoft,

      overlayShadow:
        theme.colors.overlay.shadow,

      overlayBackdrop:
        theme.colors.overlay.backdrop,

    };

  }


  return {

    page:
      "var(--finora-theme-background-page, var(--finora-theme-page, #0B1220))",

    surface:
      "var(--finora-theme-background-surface, var(--finora-theme-surface, #111C2E))",

    surfaceMuted:
      "var(--finora-theme-background-surface-muted, var(--finora-theme-surface-muted, #142238))",

    surfaceStrong:
      "var(--finora-theme-surface-strong, #17263D)",

    primary:
      "var(--finora-theme-brand-primary, #2563EB)",

    primaryHover:
      "var(--finora-theme-brand-secondary, var(--finora-theme-brand-primary, #1D4ED8))",

    primarySoft:
      "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.14))",

    textPrimary:
      "var(--finora-theme-text-primary, #FFFFFF)",

    textSecondary:
      "var(--finora-theme-text-secondary, #CBD5E1)",

    textMuted:
      "var(--finora-theme-text-muted, #94A3B8)",

    textInverse:
      "var(--finora-theme-text-inverse, #FFFFFF)",

    border:
      "var(--finora-theme-border-default, rgba(148,163,184,.16))",

    borderStrong:
      "var(--finora-theme-border-strong, rgba(37,99,235,.42))",

    borderSubtle:
      "var(--finora-theme-border-subtle, rgba(148,163,184,.10))",

    success:
      "var(--finora-theme-success, #34D399)",

    successSoft:
      "var(--finora-theme-success-soft, rgba(16,185,129,.10))",

    successBorder:
      "var(--finora-theme-success-border, var(--finora-theme-border-strong, rgba(16,185,129,.35)))",

    warning:
      "var(--finora-theme-warning, #F59E0B)",

    warningSoft:
      "var(--finora-theme-warning-soft, rgba(245,158,11,.10))",

    danger:
      "var(--finora-theme-danger, #EF4444)",

    dangerSoft:
      "var(--finora-theme-danger-soft, rgba(239,68,68,.10))",

    info:
      "var(--finora-theme-info, #60A5FA)",

    infoSoft:
      "var(--finora-theme-info-soft, rgba(96,165,250,.10))",

    overlayShadow:
      "var(--finora-theme-overlay-shadow, rgba(0,0,0,.24))",

    overlayBackdrop:
      "var(--finora-theme-overlay-backdrop, rgba(15,23,42,.48))",

  };

}


/* ===========================================================
   THEME CSS VARIABLE BRIDGE
=========================================================== */

export function createLoanStudioThemeVariables(
  theme: FinoraTheme,
): LoanStudioThemeStyle {

  return {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,

    "--finora-theme-page":
      theme.colors.background.page,

    "--finora-theme-background-page":
      theme.colors.background.page,

    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-background-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong":
      theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-body":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    "--finora-theme-text-inverse":
      theme.colors.text.inverse,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-focus":
      theme.colors.border.focus,

    "--finora-theme-success":
      theme.colors.status.success,

    "--finora-theme-success-soft":
      theme.colors.status.successSoft,

    "--finora-theme-success-border":
      theme.colors.border.strong,

    "--finora-theme-warning":
      theme.colors.status.warning,

    "--finora-theme-warning-soft":
      theme.colors.status.warningSoft,

    "--finora-theme-danger":
      theme.colors.status.danger,

    "--finora-theme-danger-soft":
      theme.colors.status.dangerSoft,

    "--finora-theme-info":
      theme.colors.status.info,

    "--finora-theme-info-soft":
      theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

    "--finora-theme-overlay-backdrop":
      theme.colors.overlay.backdrop,

  };

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export interface LoanStudioStyles {

  shellStyle:
    LoanStudioThemeStyle;

  contentStyle:
    CSSProperties;

  footerStyle:
    CSSProperties;

  stepListStyle:
    CSSProperties;

  stepItemStyle:
    CSSProperties;

  activeStepNumberStyle:
    CSSProperties;

  activeStepTitleStyle:
    CSSProperties;

  completedStepNumberStyle:
    CSSProperties;

  completedStepTitleStyle:
    CSSProperties;

  pendingStepNumberStyle:
    CSSProperties;

  pendingStepTitleStyle:
    CSSProperties;

  stepSubtitleStyle:
    CSSProperties;

  stepTextStyle:
    CSSProperties;

  navigationStyle:
    CSSProperties;

  navigationButtonStyle:
    CSSProperties;

  disabledNavigationButtonStyle:
    CSSProperties;

  primaryNavigationButtonStyle:
    CSSProperties;

  step6FormStyle:
    CSSProperties;

}


export function createLoanStudioStyles(
  tokens: ResponsiveTokens,
  theme?: FinoraTheme,
): LoanStudioStyles {

  const colors =
    getThemeVisuals(theme);

  const spacing =
    tokens.spacing;

  const border =
    tokens.border;

  const button =
    tokens.button;

  const themeVariables =
    theme
      ? createLoanStudioThemeVariables(theme)
      : {};


  const stepNumberStyle:
    CSSProperties = {

    width:
      "29px",

    height:
      "29px",

    flexShrink:
      0,

    borderRadius:
      "50%",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    boxSizing:
      "border-box",

    fontSize:
      tokens.typography.navigation,

    fontWeight:
      700,

  };


  const stepTextStyle:
    CSSProperties = {

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "2px",

  };


  const stepTitleStyle:
    CSSProperties = {

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    fontSize:
      tokens.typography.navigation,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.compact,

  };


  const navigationButtonStyle:
    CSSProperties = {

    minWidth:
      "92px",

    height:
      `${button.height}px`,

    padding:
      `0 ${button.paddingX}px`,

    boxSizing:
      "border-box",

    borderRadius:
      `${button.radius}px`,

    border:
      `${border.width}px solid ${colors.border}`,

    background:
      colors.surfaceMuted,

    color:
      colors.textPrimary,

    fontSize:
      button.fontSize,

    fontWeight:
      600,

    cursor:
      "pointer",

  };


  return {

    shellStyle: {

      ...themeVariables,

      width:
        "100%",

      height:
        "100%",

      minWidth:
        0,

      minHeight:
        0,

      maxWidth:
        "100%",

      flex:
        "1 1 auto",

      boxSizing:
        "border-box",

      padding:
        `${spacing.small}px ${spacing.medium}px ${spacing.small}px`,

      border:
        `${border.width}px solid ${colors.border}`,

      borderRadius:
        `${border.radius}px`,

      background:
        colors.page,

      color:
        colors.textPrimary,

      boxShadow:
        `0 12px 34px ${colors.overlayShadow}`,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${spacing.small}px`,

      overflow:
        "hidden",

    },

    contentStyle: {

      width:
        "100%",

      minWidth:
        0,

      minHeight:
        0,

      flex:
        "1 1 auto",

      boxSizing:
        "border-box",

      overflow:
        "auto",

      scrollbarWidth:
        "thin",

    },

    footerStyle: {

      position:
        "relative",

      zIndex:
        50,

      width:
        "100%",

      minWidth:
        0,

      flexShrink:
        0,

      boxSizing:
        "border-box",

      display:
        "flex",

      alignItems:
        "center",

      gap:
        `${spacing.medium}px`,

      padding:
        `${spacing.small}px ${spacing.medium}px`,

      border:
        `${border.width}px solid ${colors.borderStrong}`,

      borderRadius:
        `${border.radius}px`,

      background:
        colors.surface,

      color:
        colors.textPrimary,

      boxShadow:
        `0 8px 24px ${colors.overlayShadow}`,

    },

    stepListStyle: {

      flex:
        "1 1 auto",

      minWidth:
        0,

      display:
        "grid",

      gridTemplateColumns:
        "repeat(6, minmax(0, 1fr))",

      gap:
        `${spacing.small}px`,

      alignItems:
        "center",

    },

    stepItemStyle: {

      minWidth:
        0,

      display:
        "flex",

      alignItems:
        "center",

      gap:
        `${spacing.small}px`,

      padding:
        `${spacing.small}px`,

      borderRadius:
        `${border.radius}px`,

      boxSizing:
        "border-box",

      cursor:
        "pointer",

      transition:
        "background 0.16s ease",

    },

    activeStepNumberStyle: {

      ...stepNumberStyle,

      background:
        colors.primary,

      color:
        colors.textInverse,

      border:
        `${border.width}px solid ${colors.primaryHover}`,

      boxShadow:
        `0 0 16px ${colors.primarySoft}`,

    },

    activeStepTitleStyle: {

      ...stepTitleStyle,

      color:
        colors.textPrimary,

    },

    completedStepNumberStyle: {

      ...stepNumberStyle,

      background:
        colors.primarySoft,

      border:
        `${border.width}px solid ${colors.borderStrong}`,

      color:
        colors.primary,

    },

    completedStepTitleStyle: {

      ...stepTitleStyle,

      color:
        colors.textPrimary,

    },

    pendingStepNumberStyle: {

      ...stepNumberStyle,

      background:
        colors.surfaceMuted,

      border:
        `${border.width}px solid ${colors.border}`,

      color:
        colors.textMuted,

    },

    pendingStepTitleStyle: {

      ...stepTitleStyle,

      color:
        colors.textSecondary,

    },

    stepSubtitleStyle: {

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",

      whiteSpace:
        "nowrap",

      fontSize:
        tokens.typography.caption,

      fontWeight:
        500,

      lineHeight:
        tokens.lineHeight.compact,

      color:
        colors.textMuted,

    },

    stepTextStyle,

    navigationStyle: {

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "flex-end",

      gap:
        `${spacing.small}px`,

      flexShrink:
        0,

    },

    navigationButtonStyle,

    disabledNavigationButtonStyle: {

      ...navigationButtonStyle,

      opacity:
        0.38,

      cursor:
        "not-allowed",

    },

    primaryNavigationButtonStyle: {

      ...navigationButtonStyle,

      minWidth:
        "102px",

      borderColor:
        colors.primary,

      background:
        colors.primary,

      color:
        colors.textInverse,

      boxShadow:
        `0 6px 16px ${colors.primarySoft}`,

    },

    step6FormStyle: {

      width:
        "100%",

      minWidth:
        0,

      height:
        "fit-content",

      minHeight:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        `${spacing.small}px`,

      alignItems:
        "stretch",

      alignSelf:
        "start",

      boxSizing:
        "border-box",

      overflow:
        "visible",

    },

  };

}


/* ===========================================================
   STEP 1 COMPATIBILITY EXPORTS
=========================================================== */

export {
  step1WorkspaceStyle,
  step1TopStyle,
  step1BottomStyle,
  step1CustomerStyle,
  step1OverviewStyle,
  step1FormStyle,
  step1PreviewStyle,
} from "./views/LoanStudioStep1.styles";


/* ===========================================================
   LEGACY DIRECT STYLE EXPORTS
=========================================================== */

const DEFAULT_STYLES =
  createLoanStudioStyles(
    LAPTOP_TOKENS,
  );


export const shellStyle =
  DEFAULT_STYLES.shellStyle;

export const contentStyle =
  DEFAULT_STYLES.contentStyle;

export const footerStyle =
  DEFAULT_STYLES.footerStyle;

export const stepListStyle =
  DEFAULT_STYLES.stepListStyle;

export const stepItemStyle =
  DEFAULT_STYLES.stepItemStyle;

export const activeStepNumberStyle =
  DEFAULT_STYLES.activeStepNumberStyle;

export const activeStepTitleStyle =
  DEFAULT_STYLES.activeStepTitleStyle;

export const completedStepNumberStyle =
  DEFAULT_STYLES.completedStepNumberStyle;

export const completedStepTitleStyle =
  DEFAULT_STYLES.completedStepTitleStyle;

export const pendingStepNumberStyle =
  DEFAULT_STYLES.pendingStepNumberStyle;

export const pendingStepTitleStyle =
  DEFAULT_STYLES.pendingStepTitleStyle;

export const stepSubtitleStyle =
  DEFAULT_STYLES.stepSubtitleStyle;

export const stepTextStyle =
  DEFAULT_STYLES.stepTextStyle;

export const navigationStyle =
  DEFAULT_STYLES.navigationStyle;

export const navigationButtonStyle =
  DEFAULT_STYLES.navigationButtonStyle;

export const disabledNavigationButtonStyle =
  DEFAULT_STYLES.disabledNavigationButtonStyle;

export const primaryNavigationButtonStyle =
  DEFAULT_STYLES.primaryNavigationButtonStyle;

export const step6FormStyle =
  DEFAULT_STYLES.step6FormStyle;


/* ===========================================================
   END
=========================================================== */