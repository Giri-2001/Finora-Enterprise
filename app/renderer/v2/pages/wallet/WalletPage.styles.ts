/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET PAGE STYLES

   RESPONSIBILITY:
   - FINORA Wallet workspace presentation
   - Mobile / Tablet / Laptop / Desktop composition
   - Wallet balance / recharge / history workspace layout
   - Consume FINORA semantic theme variables
   - Consume canonical FINORA Responsive Engine tokens

   RESPONSIVE CONTRACT:
   - Device classification comes from useResponsive().
   - No local breakpoint engine.
   - No CSS media queries.
   - No window.innerWidth.

   IMPORTANT:
   - Presentation only.
   - No wallet calculations.
   - No persistence.
   - No payment execution.
   - No local colour palette.
============================================================ */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../utils/responsive/tokens";

import {
  createWalletResponsiveTokens,
} from "../../components/wallet/walletResponsive.tokens";

/* ============================================================
   RESPONSIVE INPUT
============================================================ */

export interface WalletPageResponsiveInput {
  tokens:
    ResponsiveTokens;

  isMobile:
    boolean;

  isTablet:
    boolean;

  isLaptop:
    boolean;

  isDesktop:
    boolean;
}

/* ============================================================
   STYLE CONTRACT
============================================================ */

export interface WalletPageStyles {
  page:
    CSSProperties;

  pageInner:
    CSSProperties;

  header:
    CSSProperties;

  headingGroup:
    CSSProperties;

  eyebrow:
    CSSProperties;

  title:
    CSSProperties;

  subtitle:
    CSSProperties;

  workspace:
    CSSProperties;

  primaryColumn:
    CSSProperties;

  secondaryColumn:
    CSSProperties;

  refreshButton:
    CSSProperties;

  stateCard:
    CSSProperties;

  stateText:
    CSSProperties;

  retryButton:
    CSSProperties;
}

/* ============================================================
   STYLE FACTORY
============================================================ */

export function getWalletPageStyles(
  input: WalletPageResponsiveInput,
): WalletPageStyles {
  const {
    tokens,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
  } = input;

  const wallet =
    createWalletResponsiveTokens(tokens);

  const isCompact =
    isMobile ||
    isTablet;

  const pagePadding =
    isMobile
      ? tokens.spacing.medium
      : tokens.spacing.page;

  const workspaceColumns =
    isCompact
      ? "minmax(0, 1fr)"
      : isLaptop
        ? "minmax(0, 0.90fr) minmax(0, 1.10fr)"
        : isDesktop
          ? "minmax(0, 0.82fr) minmax(0, 1.18fr)"
          : "minmax(0, 1fr)";

  const titleSize =
    isMobile
      ? tokens.typography.subheading
      : Math.min(
          tokens.typography.heading,
          28,
        );

  return {
    page: {
      width:
        "100%",

      minHeight:
        "100%",

      boxSizing:
        "border-box",

      background:
        "var(--finora-theme-background-page)",

      color:
        "var(--finora-theme-text-primary)",

      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",
    },

    pageInner: {
      width:
        "100%",

      maxWidth:
        wallet.page.maxWidth,

      margin:
        "0 auto",

      padding:
        pagePadding,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.page.sectionGap,

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
        isMobile
          ? "flex-start"
          : "center",

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

    eyebrow: {
      margin:
        0,

      color:
        "var(--finora-theme-brand-primary)",

      fontSize:
        wallet.history.detailSize,

      fontWeight:
        800,

      lineHeight:
        1.2,

      letterSpacing:
        "0.08em",

      textTransform:
        "uppercase",
    },

    title: {
      margin:
        0,

      color:
        "var(--finora-theme-text-primary)",

      fontSize:
        titleSize,

      fontWeight:
        850,

      lineHeight:
        1.15,
    },

    subtitle: {
      margin:
        0,

      maxWidth:
        "72ch",

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        tokens.typography.body,

      fontWeight:
        500,

      lineHeight:
        1.5,
    },

    workspace: {
      width:
        "100%",

      minWidth:
        0,

      display:
        "grid",

      gridTemplateColumns:
        workspaceColumns,

      alignItems:
        "start",

      gap:
        wallet.summary.gap,
    },

    primaryColumn: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.summary.gap,
    },

    secondaryColumn: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        wallet.summary.gap,
    },

    refreshButton: {
      flexShrink:
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
        "var(--finora-theme-background-surface)",

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

    stateCard: {
      width:
        "100%",

      minHeight:
        wallet.summary.cardMinHeight,

      display:
        "flex",

      flexDirection:
        "column",

      alignItems:
        "center",

      justifyContent:
        "center",

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

      textAlign:
        "center",

      boxSizing:
        "border-box",
    },

    stateText: {
      margin:
        0,

      maxWidth:
        "56ch",

      color:
        "var(--finora-theme-text-muted)",

      fontSize:
        tokens.typography.body,

      fontWeight:
        500,

      lineHeight:
        1.5,
    },

    retryButton: {
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
  };
}

/* ============================================================
   END
============================================================ */

