/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET TRANSACTION ROW STYLES

   RESPONSIBILITY:
   - Wallet transaction history row presentation
   - CREDIT / DEBIT semantic presentation
   - Consume FINORA Theme Engine CSS variables
   - Consume central FINORA Responsive Engine tokens

   IMPORTANT:
   - No transaction calculations.
   - No persistence.
   - No local colour palette.
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

export interface WalletTransactionRowStyles {
  row:
    CSSProperties;

  main:
    CSSProperties;

  identity:
    CSSProperties;

  title:
    CSSProperties;

  subtitle:
    CSSProperties;

  amountGroup:
    CSSProperties;

  creditAmount:
    CSSProperties;

  debitAmount:
    CSSProperties;

  balance:
    CSSProperties;

  status:
    CSSProperties;
}

/* ============================================================
   STYLE FACTORY
============================================================ */

export function createWalletTransactionRowStyles(
  tokens: ResponsiveTokens,
): WalletTransactionRowStyles {
  const wallet =
    createWalletResponsiveTokens(tokens);

  return {
    row: {
      width:
        "100%",

      minWidth:
        0,

      minHeight:
        wallet.history.rowMinHeight,

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        wallet.history.gap,

      padding:
        `${wallet.history.rowPaddingY}px ${wallet.history.rowPaddingX}px`,

      border:
        "1px solid var(--finora-theme-border-subtle)",

      borderRadius:
        wallet.summary.cardRadius,

      background:
        "var(--finora-theme-background-surface)",

      boxSizing:
        "border-box",
    },

    main: {
      minWidth:
        0,

      flex:
        1,

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        wallet.summary.gap,
    },

    identity: {
      minWidth:
        0,

      flex:
        1,

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
        wallet.history.titleSize,

      fontWeight:
        750,

      lineHeight:
        1.3,

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",

      whiteSpace:
        "nowrap",
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

      overflowWrap:
        "anywhere",
    },

    amountGroup: {
      flexShrink:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      alignItems:
        "flex-end",

      gap:
        wallet.history.gap,

      textAlign:
        "right",
    },

    creditAmount: {
      margin:
        0,

      color:
        "var(--finora-theme-status-success)",

      fontSize:
        wallet.history.amountSize,

      fontWeight:
        850,

      lineHeight:
        1.2,

      whiteSpace:
        "nowrap",
    },

    debitAmount: {
      margin:
        0,

      color:
        "var(--finora-theme-status-danger)",

      fontSize:
        wallet.history.amountSize,

      fontWeight:
        850,

      lineHeight:
        1.2,

      whiteSpace:
        "nowrap",
    },

    balance: {
      margin:
        0,

      color:
        "var(--finora-theme-text-secondary)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        650,

      lineHeight:
        1.3,

      whiteSpace:
        "nowrap",
    },

    status: {
      margin:
        0,

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        650,

      lineHeight:
        1.3,

      textTransform:
        "capitalize",
    },
  };
}

/* ============================================================
   END
============================================================ */
