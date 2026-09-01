/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET BALANCE CARD STYLES

   RESPONSIBILITY:
   - Wallet balance card presentation only
   - Consume central FINORA Responsive Engine tokens
   - Consume FINORA Theme Engine CSS variables
   - Keep component JSX free from style definitions

   IMPORTANT:
   - No breakpoint definitions.
   - No viewport detection.
   - No local color palette.
   - No business logic.
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

export interface WalletBalanceCardStyles {
  card:
    CSSProperties;

  header:
    CSSProperties;

  identity:
    CSSProperties;

  eyebrow:
    CSSProperties;

  title:
    CSSProperties;

  status:
    CSSProperties;

  balanceGroup:
    CSSProperties;

  balanceLabel:
    CSSProperties;

  balance:
    CSSProperties;

  footer:
    CSSProperties;

  footerText:
    CSSProperties;
}

/* ============================================================
   STYLE FACTORY
============================================================ */

export function createWalletBalanceCardStyles(
  tokens: ResponsiveTokens,
): WalletBalanceCardStyles {
  const wallet =
    createWalletResponsiveTokens(tokens);

  return {
    card: {
      width:
        "100%",

      minWidth:
        0,

      minHeight:
        wallet.balanceCard.minHeight,

      display:
        "flex",

      flexDirection:
        "column",

      justifyContent:
        "space-between",

      gap:
        wallet.summary.gap,

      padding:
        wallet.balanceCard.padding,

      border:
        "1px solid var(--finora-theme-border-default)",

      borderRadius:
        wallet.balanceCard.radius,

      background:
        "linear-gradient(135deg, var(--finora-theme-brand-soft), var(--finora-theme-background-surface))",

      boxShadow:
        "0 10px 28px var(--finora-theme-overlay-shadow)",

      boxSizing:
        "border-box",

      overflow:
        "hidden",
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

    identity: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.history.gap,
    },

    eyebrow: {
      margin:
        0,

      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        wallet.balanceCard.captionSize,

      fontWeight:
        700,

      lineHeight:
        1.3,

      letterSpacing:
        "0.04em",

      textTransform:
        "uppercase",
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

    status: {
      flexShrink:
        0,

      display:
        "inline-flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      minHeight:
        wallet.actions.buttonHeight,

      padding:
        `0 ${wallet.actions.buttonPaddingX}px`,

      border:
        "1px solid var(--finora-theme-status-success)",

      borderRadius:
        wallet.actions.buttonRadius,

      background:
        "var(--finora-theme-status-success-soft)",

      color:
        "var(--finora-theme-status-success)",

      fontSize:
        wallet.balanceCard.captionSize,

      fontWeight:
        800,

      lineHeight:
        1,
    },

    balanceGroup: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.history.gap,
    },

    balanceLabel: {
      margin:
        0,

      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        wallet.balanceCard.captionSize,

      fontWeight:
        700,

      lineHeight:
        1.3,
    },

    balance: {
      margin:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        wallet.balanceCard.balanceSize,

      fontWeight:
        900,

      lineHeight:
        1.05,

      letterSpacing:
        "-0.03em",

      overflowWrap:
        "anywhere",
    },

    footer: {
      width:
        "100%",

      minWidth:
        0,

      paddingTop:
        wallet.history.gap,

      borderTop:
        "1px solid var(--finora-theme-border-subtle)",
    },

    footerText: {
      margin:
        0,

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        wallet.balanceCard.captionSize,

      fontWeight:
        600,

      lineHeight:
        1.4,
    },
  };
}

/* ============================================================
   END
============================================================ */
