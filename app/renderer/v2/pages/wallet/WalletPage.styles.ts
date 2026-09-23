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
  cancelDialogBackdrop:
    CSSProperties;

  cancelDialogPanel:
    CSSProperties;

  cancelDialogTitle:
    CSSProperties;

  cancelDialogDescription:
    CSSProperties;

  cancelDialogTextarea:
    CSSProperties;

  cancelDialogCounter:
    CSSProperties;

  cancelDialogActions:
    CSSProperties;

  cancelDialogKeepButton:
    CSSProperties;

  cancelDialogConfirmButton:
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
    8;

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
        "none",

      margin:
        "0 auto",

      padding:
        pagePadding,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        8,

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
        "flex-end",

      gap:
        wallet.summary.gap,
    },

    headingGroup: {
      minWidth:
        0,

      display:
        "none",

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
        8,
    },

    primaryColumn: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        8,
    },

    secondaryColumn: {
      minWidth:
        0,

      display:
        "flex",

      flexDirection:
        "column",

      gap:
        8,
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
    cancelDialogBackdrop: {
      position:
        "fixed",
      inset:
        0,
      zIndex:
        1600,
      display:
        "flex",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding:
        pagePadding,
      background:
        "color-mix(in srgb, var(--finora-theme-text-primary) 32%, transparent)",
      boxSizing:
        "border-box",
    },

    cancelDialogPanel: {
      width:
        "100%",
      maxWidth:
        560,
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
        wallet.actions.buttonRadius,
      background:
        "var(--finora-theme-background-surface)",
      color:
        "var(--finora-theme-text-primary)",
      boxSizing:
        "border-box",
    },

    cancelDialogTitle: {
      margin:
        0,
      color:
        "var(--finora-theme-text-primary)",
      fontSize:
        tokens.typography.subheading,
      fontWeight:
        800,
      lineHeight:
        1.25,
    },

    cancelDialogDescription: {
      margin:
        0,
      color:
        "var(--finora-theme-text-muted)",
      fontSize:
        tokens.typography.body,
      lineHeight:
        1.5,
    },

    cancelDialogTextarea: {
      width:
        "100%",
      minHeight:
        116,
      padding:
        tokens.spacing.medium,
      border:
        "1px solid var(--finora-theme-border-default)",
      borderRadius:
        wallet.actions.buttonRadius,
      background:
        "var(--finora-theme-background-page)",
      color:
        "var(--finora-theme-text-primary)",
      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize:
        tokens.typography.body,
      lineHeight:
        1.5,
      resize:
        "vertical",
      outline:
        "none",
      boxSizing:
        "border-box",
    },

    cancelDialogCounter: {
      color:
        "var(--finora-theme-text-muted)",
      fontSize:
        wallet.history.detailSize,
      fontWeight:
        650,
      textAlign:
        "right",
    },

    cancelDialogActions: {
      display:
        "flex",
      flexDirection:
        isMobile ? "column-reverse" : "row",
      justifyContent:
        "flex-end",
      gap:
        wallet.actions.gap,
    },

    cancelDialogKeepButton: {
      minHeight:
        wallet.actions.buttonHeight,
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
      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize:
        wallet.actions.buttonFontSize,
      fontWeight:
        750,
      boxSizing:
        "border-box",
    },

    cancelDialogConfirmButton: {
      minHeight:
        wallet.actions.buttonHeight,
      padding:
        `0 ${wallet.actions.buttonPaddingX}px`,
      border:
        "1px solid var(--finora-theme-brand-primary)",
      borderRadius:
        wallet.actions.buttonRadius,
      background:
        "var(--finora-theme-background-surface)",
      color:
        "var(--finora-theme-brand-primary)",
      fontFamily:
        "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize:
        wallet.actions.buttonFontSize,
      fontWeight:
        800,
      boxSizing:
        "border-box",
    },

  };
}

/* ============================================================
   END
============================================================ */

