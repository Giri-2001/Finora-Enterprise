/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET THEME TOKENS

   RESPONSIBILITY:
   - Map FINORA Theme Engine colors into Wallet semantics
   - Preserve ThemeProvider as the single color authority
   - Support all registered FINORA application themes
   - Keep Wallet styles free from duplicate theme palettes

   IMPORTANT:
   - No responsive dimensions.
   - No viewport logic.
   - No local theme registry.
   - No hard-coded theme selection.
   - No React.
============================================================ */

import type {
  FinoraTheme,
} from "../../themes/core/types";

/* ============================================================
   WALLET THEME CONTRACT
============================================================ */

export interface WalletThemeTokens {
  page:
    string;

  surface:
    string;

  surfaceElevated:
    string;

  surfaceMuted:
    string;

  surfaceStrong:
    string;

  brand:
    string;

  brandSecondary:
    string;

  brandAccent:
    string;

  brandSoft:
    string;

  textPrimary:
    string;

  textSecondary:
    string;

  textMuted:
    string;

  textInverse:
    string;

  border:
    string;

  borderSubtle:
    string;

  borderStrong:
    string;

  focus:
    string;

  credit:
    string;

  creditSoft:
    string;

  debit:
    string;

  debitSoft:
    string;

  warning:
    string;

  warningSoft:
    string;

  info:
    string;

  infoSoft:
    string;

  hover:
    string;

  active:
    string;

  selected:
    string;

  disabled:
    string;

  overlay:
    string;

  shadow:
    string;
}

/* ============================================================
   WALLET TOKEN FACTORY
============================================================ */

export function createWalletThemeTokens(
  theme: FinoraTheme,
): WalletThemeTokens {
  return {
    page:
      theme.colors.background.page,

    surface:
      theme.colors.background.surface,

    surfaceElevated:
      theme.colors.background.surfaceElevated,

    surfaceMuted:
      theme.colors.background.surfaceMuted,

    surfaceStrong:
      theme.colors.background.surfaceStrong,

    brand:
      theme.colors.brand.primary,

    brandSecondary:
      theme.colors.brand.secondary,

    brandAccent:
      theme.colors.brand.accent,

    brandSoft:
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

    borderSubtle:
      theme.colors.border.subtle,

    borderStrong:
      theme.colors.border.strong,

    focus:
      theme.colors.border.focus,

    credit:
      theme.colors.status.success,

    creditSoft:
      theme.colors.status.successSoft,

    debit:
      theme.colors.status.danger,

    debitSoft:
      theme.colors.status.dangerSoft,

    warning:
      theme.colors.status.warning,

    warningSoft:
      theme.colors.status.warningSoft,

    info:
      theme.colors.status.info,

    infoSoft:
      theme.colors.status.infoSoft,

    hover:
      theme.colors.interactive.hover,

    active:
      theme.colors.interactive.active,

    selected:
      theme.colors.interactive.selected,

    disabled:
      theme.colors.interactive.disabled,

    overlay:
      theme.colors.overlay.backdrop,

    shadow:
      theme.colors.overlay.shadow,
  };
}

/* ============================================================
   END
============================================================ */
