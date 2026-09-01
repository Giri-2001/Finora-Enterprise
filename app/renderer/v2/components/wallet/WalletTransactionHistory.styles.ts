/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET TRANSACTION HISTORY STYLES

   RESPONSIBILITY:
   - Wallet history section presentation
   - History header / list / empty state layout
   - Consume FINORA Theme Engine CSS variables
   - Consume central FINORA Responsive Engine tokens

   IMPORTANT:
   - No persistence.
   - No transaction filtering.
   - No business logic.
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

export interface WalletTransactionHistoryStyles {
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

  count:
    CSSProperties;

  list:
    CSSProperties;

  empty:
    CSSProperties;

  emptyTitle:
    CSSProperties;

  emptyText:
    CSSProperties;
}

/* ============================================================
   STYLE FACTORY
============================================================ */

export function createWalletTransactionHistoryStyles(
  tokens: ResponsiveTokens,
): WalletTransactionHistoryStyles {
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
        wallet.history.gap,

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
        "center",

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
        1.4,
    },

    count: {
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
        "1px solid var(--finora-theme-border-subtle)",

      borderRadius:
        wallet.actions.buttonRadius,

      background:
        "var(--finora-theme-background-surface-muted)",

      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        750,

      lineHeight:
        1,
    },

    list: {
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

    empty: {
      width:
        "100%",

      minHeight:
        wallet.history.rowMinHeight,

      display:
        "flex",

      flexDirection:
        "column",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        wallet.history.gap,

      padding:
        wallet.summary.cardPadding,

      border:
        "1px dashed var(--finora-theme-border-subtle)",

      borderRadius:
        wallet.summary.cardRadius,

      background:
        "var(--finora-theme-background-surface-muted)",

      textAlign:
        "center",

      boxSizing:
        "border-box",
    },

    emptyTitle: {
      margin:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        wallet.history.titleSize,

      fontWeight:
        750,

      lineHeight:
        1.3,
    },

    emptyText: {
      margin:
        0,

      maxWidth:
        "48ch",

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        500,

      lineHeight:
        1.5,
    },
  };
}

/* ============================================================
   END
============================================================ */
