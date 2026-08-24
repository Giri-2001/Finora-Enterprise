/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW ACTIONS
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Review actions card
   - Premium action header
   - Save customer button
   - Edit details button
   - Cancel button
   - Theme-aware visual presentation

   IMPORTANT:
   - NO hard-coded theme colours
   - NO local theme palette
   - NO inline CSS
   - Theme colours come directly from FinoraTheme
   - Responsive geometry comes directly from ResponsiveTokens
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../utils/responsive";


import type {
  FinoraTheme,
} from "../../../themes/core/types";


/* ===========================================================
   STYLE CONTRACT
=========================================================== */

export interface ReviewActionsStyles {

  cardStyle:
    CSSProperties;

  headerStyle:
    CSSProperties;

  headerIconStyle:
    CSSProperties;

  headerTextStyle:
    CSSProperties;

  titleStyle:
    CSSProperties;

  subtitleStyle:
    CSSProperties;

  dividerStyle:
    CSSProperties;

  actionListStyle:
    CSSProperties;

  primaryButtonStyle:
    CSSProperties;

  secondaryButtonStyle:
    CSSProperties;

  dangerButtonStyle:
    CSSProperties;
}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReviewActionsStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

):
  ReviewActionsStyles {


  /* =========================================================
     THEME TOKENS
  ========================================================= */

  const surface =
    theme
      .colors
      .background
      .surface;


  const surfaceMuted =
    theme
      .colors
      .background
      .surfaceMuted;


  const textPrimary =
    theme
      .colors
      .text
      .primary;


  const textSecondary =
    theme
      .colors
      .text
      .secondary;


  const textInverse =
    theme
      .colors
      .text
      .inverse;


  const brandPrimary =
    theme
      .colors
      .brand
      .primary;


  const brandAccent =
    theme
      .colors
      .brand
      .accent;


  const danger =
    theme
      .colors
      .status
      .danger;


  const dangerSoft =
    theme
      .colors
      .status
      .dangerSoft;


  const borderDefault =
    theme
      .colors
      .border
      .default;


  const borderStrong =
    theme
      .colors
      .border
      .strong;


  const borderSubtle =
    theme
      .colors
      .border
      .subtle;


  const shadow =
    theme
      .colors
      .overlay
      .shadow;


  /* =========================================================
     CARD
  ========================================================= */

  const cardStyle:
    CSSProperties = {

    minWidth:
      0,

    minHeight:
      0,

    width:
      "100%",

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    padding:
      `${tokens.spacing.small}px ${tokens.spacing.medium}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    border:
      `${tokens.border.width}px solid ${borderDefault}`,

    background:
      surface,

    boxShadow:
      `0 8px 22px ${shadow}`,

    overflow:
      "hidden",

  };


  /* =========================================================
     HEADER
  ========================================================= */

  const headerStyle:
    CSSProperties = {

    minWidth:
      0,

    display:
      "flex",

    alignItems:
      "center",

    gap:
      `${tokens.spacing.small}px`,

  };


  /* =========================================================
     HEADER ICON
  ========================================================= */

  const headerIconStyle:
    CSSProperties = {

    width:
      `${Math.max(tokens.icon.md, 20)}px`,

    height:
      `${Math.max(tokens.icon.md, 20)}px`,

    flexShrink:
      0,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    borderRadius:
      `${Math.max(tokens.border.radius - 6, 8)}px`,

    border:
      `${tokens.border.width}px solid ${borderDefault}`,

    background:
      surfaceMuted,

    color:
      brandAccent,

  };


  /* =========================================================
     HEADER TEXT
  ========================================================= */

  const headerTextStyle:
    CSSProperties = {

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "center",

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle:
    CSSProperties = {

    margin:
      0,

    color:
      textPrimary,

    fontSize:
      `${tokens.typography.heading - 10}px`,

    lineHeight:
      tokens.lineHeight.compact,

    fontWeight:
      800,

    letterSpacing:
      ".1px",

  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle:
    CSSProperties = {

    margin:
      `${Math.max(tokens.spacing.small - 5, 2)}px 0 0`,

    color:
      textSecondary,

    fontSize:
      `${Math.max(tokens.typography.caption, 9)}px`,

    lineHeight:
      tokens.lineHeight.compact,

    fontWeight:
      550,

  };


  /* =========================================================
     DIVIDER
  ========================================================= */

  const dividerStyle:
    CSSProperties = {

    width:
      "100%",

    height:
      `${tokens.border.width}px`,

    flexShrink:
      0,

    margin:
      `${Math.max(tokens.spacing.small - 1, 4)}px 0 ${Math.max(tokens.spacing.small, 6)}px`,

    background:
      borderSubtle,

  };


  /* =========================================================
     ACTION LIST
  ========================================================= */

  const actionListStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${Math.max(tokens.spacing.small, 6)}px`,

  };


  /* =========================================================
     PRIMARY BUTTON
  ========================================================= */

  const primaryButtonStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    height:
      `${tokens.button.height}px`,

    minHeight:
      `${tokens.button.minHeight}px`,

    boxSizing:
      "border-box",

    padding:
      `0 ${tokens.button.paddingX}px`,

    borderRadius:
      `${tokens.button.radius}px`,

    border:
      `${tokens.border.width}px solid ${brandPrimary}`,

    background:
      brandPrimary,

    color:
      textInverse,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${Math.max(tokens.spacing.small - 2, 5)}px`,

    fontSize:
      `${tokens.button.fontSize}px`,

    lineHeight:
      tokens.lineHeight.compact,

    fontWeight:
      750,

    cursor:
      "pointer",

    boxShadow:
      `0 8px 18px ${shadow}`,

    transition:
      "opacity 160ms ease, transform 160ms ease, box-shadow 160ms ease",

    outline:
      "none",

    appearance:
      "none",

  };


  /* =========================================================
     SECONDARY BUTTON
  ========================================================= */

  const secondaryButtonStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    height:
      `${tokens.button.height}px`,

    minHeight:
      `${tokens.button.minHeight}px`,

    boxSizing:
      "border-box",

    padding:
      `0 ${tokens.button.paddingX}px`,

    borderRadius:
      `${tokens.button.radius}px`,

    border:
  `${tokens.border.width}px solid ${theme.components.button.secondaryBorder}`,

    background:
  `linear-gradient(
    180deg,
    ${theme.components.input.background},
    ${theme.colors.background.surfaceMuted}
  )`,

    color:
  theme.components.button.secondaryText,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${Math.max(tokens.spacing.small - 2, 5)}px`,

    fontSize:
      `${tokens.button.fontSize}px`,

    lineHeight:
      tokens.lineHeight.compact,

    fontWeight:
      700,

    cursor:
      "pointer",

    transition:
      "opacity 160ms ease, transform 160ms ease, border-color 160ms ease",

    outline:
      "none",

    appearance:
      "none",

  };


  /* =========================================================
     DANGER BUTTON
  ========================================================= */

  const dangerButtonStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    height:
      `${tokens.button.height}px`,

    minHeight:
      `${tokens.button.minHeight}px`,

    boxSizing:
      "border-box",

    padding:
      `0 ${tokens.button.paddingX}px`,

    borderRadius:
      `${tokens.button.radius}px`,

    border:
      `${tokens.border.width}px solid ${danger}`,

    background:
      dangerSoft,

    color:
      danger,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${Math.max(tokens.spacing.small - 2, 5)}px`,

    fontSize:
      `${tokens.button.fontSize}px`,

    lineHeight:
      tokens.lineHeight.compact,

    fontWeight:
      700,

    cursor:
      "pointer",

    transition:
      "opacity 160ms ease, transform 160ms ease, border-color 160ms ease",

    outline:
      "none",

    appearance:
      "none",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    cardStyle,

    headerStyle,

    headerIconStyle,

    headerTextStyle,

    titleStyle,

    subtitleStyle,

    dividerStyle,

    actionListStyle,

    primaryButtonStyle,

    secondaryButtonStyle,

    dangerButtonStyle,

  };

}


/* ===========================================================
   END
=========================================================== */