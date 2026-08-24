/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 4 — KYC STUDIO™
   PRESENTATION STYLES

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:
   - KYC workspace presentation
   - Identity panel presentation
   - KYC preview presentation
   - Theme variable bridge

   IMPORTANT:
   - Responsive geometry comes ONLY from KYC responsive tokens.
   - No breakpoint logic.
   - No media queries.
   - No business logic.
   - No verification state logic.
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  KycResponsiveTokens,
} from "../../../../utils/responsive/customers/kyc/kyc.tokens";

import type {
  FinoraTheme,
} from "../../../../themes/core/types";

export interface KycThemeVariables {
  "--finora-theme-brand-primary": string;
  "--finora-theme-brand-secondary": string;
  "--finora-theme-brand-accent": string;
  "--finora-theme-brand-accent-soft": string;
  "--finora-theme-surface": string;
  "--finora-theme-surface-muted": string;
  "--finora-theme-surface-strong": string;
  "--finora-theme-text-primary": string;
  "--finora-theme-text-secondary": string;
  "--finora-theme-text-muted": string;
  "--finora-theme-border-default": string;
  "--finora-theme-border-strong": string;
  "--finora-theme-border-subtle": string;
  "--finora-theme-success": string;
  "--finora-theme-success-soft": string;
}

const THEME = {
  pageBackground:
    "var(--finora-theme-background, var(--finora-theme-surface-muted, #EEF1F5))",
  panel:
    "var(--finora-theme-surface, #FFFFFF)",
  panelSoft:
    "var(--finora-theme-surface-muted, #F1F3F6)",
  panelStrong:
    "var(--finora-theme-surface-strong, #E8ECF1)",
  text:
    "var(--finora-theme-text-primary, #171A21)",
  textSecondary:
    "var(--finora-theme-text-secondary, #4B5563)",
  textMuted:
    "var(--finora-theme-text-muted, #7A8494)",
  brand:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",
  brandPrimary:
    "var(--finora-theme-brand-primary, #B8860B)",
  brandSoft:
    "var(--finora-theme-brand-accent-soft, #F7E7B0)",
  border:
    "var(--finora-theme-border-default, #D7DDE6)",
  borderStrong:
    "var(--finora-theme-border-strong, #C4CBD7)",
  borderSubtle:
    "var(--finora-theme-border-subtle, #E8EBF0)",
  success:
    "var(--finora-theme-success, #16845B)",
  successSoft:
    "var(--finora-theme-success-soft, #E7F6EF)",
} as const;

export function createStep4KycStyles(
  tokens: KycResponsiveTokens,
): {
  pageStyle: CSSProperties;
  contentStyle: CSSProperties;
  panelStyle: CSSProperties;
  panelHeaderStyle: CSSProperties;
  panelTitleStyle: CSSProperties;
  panelSubtitleStyle: CSSProperties;
  fieldGridStyle: CSSProperties;
  fieldStyle: CSSProperties;
  labelStyle: CSSProperties;
  requiredStyle: CSSProperties;
  inputWrapperStyle: CSSProperties;
  inputStyle: CSSProperties;
  inputIconStyle: CSSProperties;
  previewCardStyle: CSSProperties;
  previewHeaderStyle: CSSProperties;
  previewIconStyle: CSSProperties;
  previewTitleStyle: CSSProperties;
  previewSubtitleStyle: CSSProperties;
  previewRowsStyle: CSSProperties;
  previewRowStyle: CSSProperties;
  previewLabelStyle: CSSProperties;
  previewValueStyle: CSSProperties;
  previewStatusStyle: CSSProperties;
} {
  return {
    pageStyle: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      padding:
  `${tokens.pagePaddingTop}px ${tokens.pagePaddingX}px ${tokens.pagePaddingBottom}px 0`,
      background: "transparent",
      color: THEME.text,
      overflow: "hidden",
    },

    contentStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns:
        tokens.contentColumns === 1
          ? "minmax(0, 1fr)"
          : "minmax(0, 1fr) minmax(0, 1fr)",
      gap: `${tokens.contentGap}px`,
      alignItems: "stretch",
    },

    panelStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      padding: `${tokens.panelPaddingY}px ${tokens.panelPaddingX}px`,
      borderRadius: `${tokens.panelRadius}px`,
      border: `1px solid ${THEME.border}`,
      background: THEME.panel,
      boxShadow: "0 5px 16px rgba(34,44,58,.08)",
      overflow: "hidden",
    },

    panelHeaderStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: `${tokens.panelHeaderHeight}px`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "flex-start",
      gap: `${tokens.panelHeaderGap}px`,
      paddingBottom: `${tokens.panelHeaderPaddingBottom}px`,
      marginBottom: `${tokens.fieldRowGap}px`,
      borderBottom: `1px solid ${THEME.borderSubtle}`,
      flexShrink: 0,
    },

    panelTitleStyle: {
      margin: 0,
      color: THEME.text,
      fontSize: `${Math.max(tokens.previewTitleSize + 4, 11)}px`,
      lineHeight: 1.15,
      fontWeight: 700,
      letterSpacing: ".05px",
    },

    panelSubtitleStyle: {
  margin: "3px 0 0",
  color: THEME.textSecondary,
  fontSize: `${tokens.previewSubtitleSize + 3}px`,
  lineHeight: 1.25,
  fontWeight: 550,
},

    fieldGridStyle: {
      width: "100%",
      minWidth: 0,
      display: "grid",
      gridTemplateColumns:
        tokens.fieldColumns === 1
          ? "minmax(0, 1fr)"
          : "minmax(0, 1fr) minmax(0, 1fr)",
      columnGap: `${tokens.fieldColumnGap}px`,
      rowGap: `${tokens.fieldRowGap}px`,
      alignContent: "start",
    },

    fieldStyle: {
      minWidth: 0,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: `${tokens.labelGap}px`,
    },

    labelStyle: {
      minWidth: 0,
      color: THEME.text,
      fontFamily:
  "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",
      fontSize: `${tokens.labelFontSize}px`,
      fontWeight: tokens.labelFontWeight,
      lineHeight: 1.2,
      letterSpacing: `${tokens.labelLetterSpacing}px`,
      textTransform: "uppercase",
    },

    requiredStyle: {
      color: THEME.brandPrimary,
      marginLeft: "3px",
      fontWeight: 900,
    },

    inputWrapperStyle: {
      position: "relative",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    inputStyle: {
      width: "100%",
      minWidth: 0,
      height: `${tokens.inputHeight}px`,
      boxSizing: "border-box",
      padding: `0 ${tokens.inputPaddingX}px 0 ${tokens.inputPaddingX + tokens.inputIconOffset + tokens.inputIconSize}px`,
      borderRadius: `${tokens.inputRadius}px`,
      border: `1px solid ${THEME.borderStrong}`,
      outline: "none",
      background: THEME.panelSoft,
      color: THEME.text,
      fontSize: `${tokens.inputFontSize}px`,
      fontWeight: tokens.inputFontWeight,
      fontFamily:
  "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",
    },

    inputIconStyle: {
      position: "absolute",
      left: `${tokens.inputIconOffset}px`,
      top: "50%",
      transform: "translateY(-50%)",
      width: `${tokens.inputIconSize}px`,
      height: `${tokens.inputIconSize}px`,
      color: THEME.brand,
      pointerEvents: "none",
      zIndex: 1,
    },

    previewCardStyle: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      background: THEME.panel,
      display: "flex",
      flexDirection: "column",
      gap: `${tokens.previewGap}px`,
      overflow: "hidden",
    },

    previewHeaderStyle: {
      width: "100%",
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: `${tokens.previewGap}px`,
    },

    previewIconStyle: {
  width: `${tokens.previewIconSize + 10}px`,
  height: `${tokens.previewIconSize + 10}px`,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  borderRadius: `${tokens.previewIconRadius}px`,

  background: "transparent",

  color:
    "var(--finora-theme-brand-accent, #4D82E6)",

  border:
    "1px solid var(--finora-theme-brand-accent, #4D82E6)",

  boxSizing: "border-box",
},
    previewTitleStyle: {
      margin: 0,
      color: THEME.text,
      fontSize: `${tokens.previewTitleSize}px`,
      lineHeight: 1.15,
      fontWeight: 850,
    },

    previewSubtitleStyle: {
      margin: "6px 0 0",
      color: THEME.textSecondary,
      fontSize: `${tokens.previewSubtitleSize + 2}px`,
      lineHeight: 1.25,
      fontWeight: 550,
    },

    previewRowsStyle: {
      width: "100%",
      minWidth: 0,
      display: "grid",
      gridTemplateColumns:
        tokens.previewColumns === 1
          ? "minmax(0, 1fr)"
          : "repeat(2,minmax(0,1fr))",
      gap: `${tokens.previewRowGap}px`,
    },

    previewRowStyle: {
      minWidth: 0,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "2px",
      padding: `${tokens.previewRowPaddingY}px ${tokens.previewPaddingX}px`,
      borderRadius: `${Math.max(tokens.previewRadius - 2, 8)}px`,
      border: `1px solid ${THEME.borderSubtle}`,
      background:
  "var(--finora-theme-surface-muted, #F1F3F6)",
    },

    previewLabelStyle: {
      minWidth: 0,
      color: THEME.textMuted,
      fontSize: `${tokens.previewLabelSize}px`,
      lineHeight: 1.15,
      fontWeight: 750,
      letterSpacing: ".25px",
      textTransform: "uppercase",
    },

    previewValueStyle: {
      minWidth: 0,
      color: THEME.text,
      fontSize: `${tokens.previewValueSize}px`,
      lineHeight: 1.2,
      fontWeight: 650,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    previewStatusStyle: {
  alignSelf: "flex-start",

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  minHeight:
    `${tokens.inputHeight - 12}px`,

  padding:
    "0 10px",

  borderRadius:
    "999px",

  border:
  "var(--finora-theme-border-width, 1.5px) solid var(--finora-theme-brand-accent, #D4AF37)",

  background: "transparent",

   color:
  "var(--finora-theme-brand-accent, #D4AF37)",

  fontSize:
    `${tokens.previewStatusSize}px`,

  lineHeight:
    1.1,

  fontWeight:
    800,

  whiteSpace:
    "nowrap",
},
  };
}

export function createStep4ThemeVariables(
  theme:
    FinoraTheme,
): KycThemeVariables {
  return {
    "--finora-theme-brand-primary":
      theme.colors.brand.primary,
    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,
    "--finora-theme-brand-accent":
      theme.colors.brand.accent,
    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,
    "--finora-theme-surface":
      theme.colors.background.surface,
    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,
    "--finora-theme-surface-strong":
      theme.colors.background.surfaceStrong,
    "--finora-theme-text-primary":
      theme.colors.text.primary,
    "--finora-theme-text-secondary":
      theme.colors.text.secondary,
    "--finora-theme-text-muted":
      theme.colors.text.muted,
    "--finora-theme-border-default":
      theme.colors.border.default,
    "--finora-theme-border-strong":
      theme.colors.border.strong,
    "--finora-theme-border-subtle":
      theme.colors.border.subtle,
    "--finora-theme-success":
      theme.colors.status.success,
    "--finora-theme-success-soft":
      theme.colors.status.successSoft,
  };
}


/* ===========================================================
   END
=========================================================== */
