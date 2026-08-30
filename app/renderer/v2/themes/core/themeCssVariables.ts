/* ===========================================================
   FINORA ENTERPRISE OS™

   THEME ENGINE

   GLOBAL THEME CSS VARIABLE BRIDGE

   LAYER   : Theme Infrastructure
   VERSION : 1.0

   RESPONSIBILITY:

   - Convert the active FinoraTheme into global CSS variables
   - Allow class-based modules to consume the Theme Engine
   - Eliminate per-page theme-variable duplication
   - Support all registered FINORA themes
   - Preserve ThemeProvider as the single theme authority

   IMPORTANT:

   - No responsive dimensions.
   - No breakpoint values.
   - No React component.
   - No Accounts-specific colors.
   - No duplicate theme palette.
   - No localStorage.
   - No sessionStorage.

   CSS VARIABLES:

   ThemeProvider
        ↓
   FinoraTheme
        ↓
   applyFinoraThemeCssVariables()
        ↓
   :root --finora-theme-*
        ↓
   CSS classes / stylesheets
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { FinoraTheme } from "./types";

import { DEFAULT_THEME_COLORS } from "./tokens";

/* ===========================================================
   CSS VARIABLE MAP
=========================================================== */

type FinoraThemeCssVariableMap = Record<`--finora-theme-${string}`, string>;

/* ===========================================================
   BUILD VARIABLE MAP

   Pure function.

   Can be tested without writing to the DOM.
=========================================================== */

export function buildFinoraThemeCssVariables(
  theme: FinoraTheme,
): FinoraThemeCssVariableMap {
  return {
    /* =======================================================
       BRAND
    ======================================================= */

    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    /* =======================================================
       BACKGROUND / SURFACE
    ======================================================= */

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface-elevated": theme.colors.background.surfaceElevated,

    "--finora-theme-background-surface-elevated":
      theme.colors.background.surfaceElevated,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong": theme.colors.background.surfaceStrong,

    "--finora-theme-background-surface-strong":
      theme.colors.background.surfaceStrong,

    /* =======================================================
       TEXT
    ======================================================= */

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-body": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-text-disabled": theme.colors.text.disabled,

    "--finora-theme-text-link": theme.colors.text.link,

    /* =======================================================
       TYPOGRAPHY COLORS
    ======================================================= */

    "--finora-theme-typography-heading": theme.typography.heading,

    "--finora-theme-typography-body": theme.typography.body,

    "--finora-theme-typography-label": theme.typography.label,

    "--finora-theme-typography-caption": theme.typography.caption,

    "--finora-theme-typography-placeholder": theme.typography.placeholder,

    "--finora-theme-typography-link": theme.typography.link,

    "--finora-theme-typography-inverse": theme.typography.inverse,

    /* =======================================================
       BORDER
    ======================================================= */

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-focus": theme.colors.border.focus,

    /*
     * Compatibility alias already consumed by existing
     * FINORA modules.
     */
    "--finora-theme-focus": theme.colors.border.focus,

    /* =======================================================
       STATUS
    ======================================================= */

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-danger": theme.colors.status.danger,

    "--finora-theme-danger-soft": theme.colors.status.dangerSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    /* =======================================================
   FINANCIAL SEMANTICS

   IMPORTANT:

   These colors represent accounting meaning rather than
   general theme status meaning.

   Credit / Money In must remain green.
   Debit / Money Out must remain red.

   Reuse the FINORA core semantic palette instead of
   duplicating hardcoded colors.
======================================================= */

"--finora-theme-financial-credit":
  DEFAULT_THEME_COLORS.status.success,

"--finora-theme-financial-credit-soft":
  DEFAULT_THEME_COLORS.status.successSoft,

"--finora-theme-financial-debit":
  DEFAULT_THEME_COLORS.status.danger,

"--finora-theme-financial-debit-soft":
  DEFAULT_THEME_COLORS.status.dangerSoft,

    /* =======================================================
       INTERACTIVE
    ======================================================= */

    "--finora-theme-interactive-hover": theme.colors.interactive.hover,

    "--finora-theme-interactive-active": theme.colors.interactive.active,

    "--finora-theme-interactive-selected": theme.colors.interactive.selected,

    "--finora-theme-interactive-focus": theme.colors.interactive.focus,

    "--finora-theme-interactive-disabled": theme.colors.interactive.disabled,

    /* =======================================================
       OVERLAY
    ======================================================= */

    "--finora-theme-overlay-backdrop": theme.colors.overlay.backdrop,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    /* =======================================================
       CARD
    ======================================================= */

    "--finora-theme-card-background": theme.components.card.background,

    "--finora-theme-card-border": theme.components.card.border,

    "--finora-theme-card-shadow": theme.components.card.shadow,

    /* =======================================================
       INPUT
    ======================================================= */

    "--finora-theme-input-background": theme.components.input.background,

    "--finora-theme-input-border": theme.components.input.border,

    "--finora-theme-input-text": theme.components.input.text,

    "--finora-theme-input-placeholder": theme.components.input.placeholder,

    "--finora-theme-input-focus-border": theme.components.input.focusBorder,

    "--finora-theme-input-focus-background":
      theme.components.input.focusBackground,

    "--finora-theme-input-disabled-background":
      theme.components.input.disabledBackground,

    /* =======================================================
       BUTTON
    ======================================================= */

    "--finora-theme-button-primary-background":
      theme.components.button.primaryBackground,

    "--finora-theme-button-primary-text": theme.components.button.primaryText,

    "--finora-theme-button-primary-hover": theme.components.button.primaryHover,

    "--finora-theme-button-secondary-background":
      theme.components.button.secondaryBackground,

    "--finora-theme-button-secondary-text":
      theme.components.button.secondaryText,

    "--finora-theme-button-secondary-border":
      theme.components.button.secondaryBorder,

    "--finora-theme-button-secondary-hover":
      theme.components.button.secondaryHover,

    "--finora-theme-button-danger-background":
      theme.components.button.dangerBackground,

    "--finora-theme-button-danger-text": theme.components.button.dangerText,

    "--finora-theme-button-danger-hover": theme.components.button.dangerHover,

    /* =======================================================
       NAVIGATION
    ======================================================= */

    "--finora-theme-navigation-background":
      theme.components.navigation.background,

    "--finora-theme-navigation-text": theme.components.navigation.text,

    "--finora-theme-navigation-active-background":
      theme.components.navigation.activeBackground,

    "--finora-theme-navigation-active-text":
      theme.components.navigation.activeText,

    "--finora-theme-navigation-hover-background":
      theme.components.navigation.hoverBackground,

    /* =======================================================
       HEADER
    ======================================================= */

    "--finora-theme-header-background": theme.components.header.background,

    "--finora-theme-header-text": theme.components.header.text,

    "--finora-theme-header-border": theme.components.header.border,

    /* =======================================================
       PANEL
    ======================================================= */

    "--finora-theme-panel-background": theme.components.panel.background,

    "--finora-theme-panel-border": theme.components.panel.border,

    "--finora-theme-panel-shadow": theme.components.panel.shadow,

    /* =======================================================
       TABLE / REGISTER
    ======================================================= */

    "--finora-theme-table-header-background":
      theme.components.table.headerBackground,

    "--finora-theme-table-header-text": theme.components.table.headerText,

    "--finora-theme-table-row-background": theme.components.table.rowBackground,

    "--finora-theme-table-row-alternate-background":
      theme.components.table.rowAlternateBackground,

    "--finora-theme-table-row-hover-background":
      theme.components.table.rowHoverBackground,

    "--finora-theme-table-border": theme.components.table.border,

    /* =======================================================
       MODAL
    ======================================================= */

    "--finora-theme-modal-background": theme.components.modal.background,

    "--finora-theme-modal-border": theme.components.modal.border,

    "--finora-theme-modal-backdrop": theme.components.modal.backdrop,

    "--finora-theme-modal-shadow": theme.components.modal.shadow,
  };
}

/* ===========================================================
   APPLY VARIABLES TO ROOT

   Browser/Electron renderer only.

   Safe guard prevents failures if this utility is imported
   in an environment where document is unavailable.
=========================================================== */

export function applyFinoraThemeCssVariables(theme: FinoraTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  const variables = buildFinoraThemeCssVariables(theme);

  for (const [property, value] of Object.entries(variables)) {
    root.style.setProperty(property, value);
  }

  /* =========================================================
     THEME IDENTITY ATTRIBUTES

     Useful for diagnostics and future CSS-only theme checks.

     No visual values are defined here.
  ========================================================= */

  root.dataset.finoraTheme = theme.id;

  root.dataset.finoraThemeMode = theme.mode;
}

/* ===========================================================
   END
=========================================================== */
