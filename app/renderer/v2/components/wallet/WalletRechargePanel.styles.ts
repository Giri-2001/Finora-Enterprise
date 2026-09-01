/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET RECHARGE PANEL STYLES

   RESPONSIBILITY:
   - Recharge form presentation
   - Amount input layout
   - Payment method selector layout
   - Primary recharge action presentation
   - Consume FINORA Theme Engine CSS variables
   - Consume central FINORA Responsive Engine tokens

   IMPORTANT:
   - No payment execution.
   - No balance mutation.
   - No gateway logic.
   - No breakpoint definitions.
============================================================ */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../utils/responsive/tokens";

import {
  createWalletResponsiveTokens,
} from "./walletResponsive.tokens";

/* ============================================================
   STYLE CONTRACT
============================================================ */

export interface WalletRechargePanelStyles {
  section:
    CSSProperties;

  header:
    CSSProperties;

  headingGroup:
    CSSProperties;

  title:
    CSSProperties;

  subtitle:
    CSSProperties;

  form:
    CSSProperties;

  field:
    CSSProperties;

  label:
    CSSProperties;

  input:
    CSSProperties;

  paymentGrid:
    CSSProperties;

  paymentButton:
    CSSProperties;

  paymentButtonSelected:
    CSSProperties;

  actions:
    CSSProperties;

  rechargeButton:
    CSSProperties;

  helper:
    CSSProperties;
}

/* ============================================================
   STYLE FACTORY
============================================================ */

export function createWalletRechargePanelStyles(
  tokens: ResponsiveTokens,
): WalletRechargePanelStyles {
  const wallet =
    createWalletResponsiveTokens(tokens);

  return {
    section: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.summary.gap,

      padding:
        wallet.summary.cardPadding,

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        wallet.summary.cardRadius,

      background:
        "var(--finora-theme-background-surface)",

      boxShadow:
        "0 8px 24px var(--finora-theme-overlay-shadow)",

      boxSizing:
        "border-box",
    },

    header: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "flex",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap:
        wallet.summary.gap,
    },

    headingGroup: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.history.gap,
    },

    title: {
      margin:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        wallet.balanceCard.titleSize,

      fontWeight:
        800,

      lineHeight:
        1.2,
    },

    subtitle: {
      margin:
        0,

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        500,

      lineHeight:
        1.45,
    },

    form: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.summary.gap,
    },

    field: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.history.gap,
    },

    label: {
      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        700,

      lineHeight:
        1.3,
    },

    input: {
      width:
        "100%",

      minWidth:
        0,

      minHeight:
        wallet.actions.buttonHeight,

      padding:
        `0 ${wallet.actions.buttonPaddingX}px`,

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        wallet.actions.buttonRadius,

      outline:
        "none",

      background:
        "var(--finora-theme-background-surface-muted)",

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        wallet.actions.buttonFontSize,

      fontWeight:
        700,

      boxSizing:
        "border-box",
    },

    paymentGrid: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "grid",

      gridTemplateColumns:
        `repeat(${wallet.summary.columns}, minmax(0, 1fr))`,

      gap:
        wallet.actions.gap,
    },

    paymentButton: {
      minWidth:
        0,

      minHeight:
        wallet.actions.buttonHeight,

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        wallet.actions.gap,

      padding:
        `0 ${wallet.actions.buttonPaddingX}px`,

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        wallet.actions.buttonRadius,

      background:
        "var(--finora-theme-background-surface-muted)",

      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        wallet.actions.buttonFontSize,

      fontWeight:
        750,

      cursor:
        "pointer",

      boxSizing:
        "border-box",
    },

    paymentButtonSelected: {
      minWidth:
        0,

      minHeight:
        wallet.actions.buttonHeight,

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        wallet.actions.gap,

      padding:
        `0 ${wallet.actions.buttonPaddingX}px`,

      border:
        "1px solid var(--finora-theme-brand-primary)",

      borderRadius:
        wallet.actions.buttonRadius,

      background:
        "var(--finora-theme-brand-soft)",

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        wallet.actions.buttonFontSize,

      fontWeight:
        750,

      cursor:
        "pointer",

      boxSizing:
        "border-box",
    },

    actions: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "flex",

      justifyContent:
        "flex-end",

      gap:
        wallet.actions.gap,
    },

    rechargeButton: {
      minHeight:
        wallet.actions.buttonHeight,

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        wallet.actions.gap,

      padding:
        `0 ${wallet.actions.buttonPaddingX}px`,

      border:
        "1px solid var(--finora-theme-brand-primary)",

      borderRadius:
        wallet.actions.buttonRadius,

      background:
        "var(--finora-theme-brand-primary)",

      color:
        "var(--finora-theme-text-inverse)",

      fontSize:
        wallet.actions.buttonFontSize,

      fontWeight:
        800,

      cursor:
        "pointer",

      boxSizing:
        "border-box",
    },

    helper: {
      margin:
        0,

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        500,

      lineHeight:
        1.4,
    },
  };
}

/* ============================================================
   END
============================================================ */

