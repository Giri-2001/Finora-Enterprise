/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW SUMMARY
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Summary card layout
   - Customer information rows
   - Specific semantic icons
   - KYC status presentation
   - Central FINORA Theme Engine integration

   IMPORTANT:
   - NO local theme palette
   - NO hard-coded theme colours
   - NO inline CSS
   - Theme colours come directly from FinoraTheme
   - Responsive geometry remains outside this file
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  FinoraTheme,
} from "../../../themes/core/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface CustomerSummaryStyles {

  cardStyle: CSSProperties;

  headerStyle: CSSProperties;

  headerIconStyle: CSSProperties;

  headerTextStyle: CSSProperties;

  titleStyle: CSSProperties;

  subtitleStyle: CSSProperties;

  statusStyle: CSSProperties;

  dividerStyle: CSSProperties;

  rowStyle: CSSProperties;

  rowIconStyle: CSSProperties;

  labelStyle: CSSProperties;

  valueStyle: CSSProperties;

  emptyValueStyle: CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createCustomerSummaryStyles(

  theme: FinoraTheme,

  kycVerified: boolean,

): CustomerSummaryStyles {


  /* =========================================================
     CENTRAL THEME TOKENS
  ========================================================= */

  const textPrimary =
    theme.colors.text.primary;

  const textSecondary =
    theme.colors.text.secondary;

  const textMuted =
    theme.colors.text.muted;

  const brandAccent =
    theme.colors.brand.accent;

  const brandAccentSoft =
    theme.colors.brand.accentSoft;

  const brandPrimary =
    theme.colors.brand.primary;

  const borderDefault =
    theme.colors.border.default;

  const borderSubtle =
    theme.colors.border.subtle;

  const surfaceMuted =
    theme.colors.background.surfaceMuted;

  const success =
    theme.colors.status.success;

  const successSoft =
    theme.colors.status.successSoft;

  const statusColor =
    kycVerified
      ? success
      : brandAccent;

  const statusBackground =
    kycVerified
      ? successSoft
      : brandAccentSoft;


  /* =========================================================
     CARD

     SAME THEME SOURCE AS NOMINEE FORM
  ========================================================= */

  const cardStyle: CSSProperties = {

    minWidth: 0,

    minHeight: 0,

    width: "100%",

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    padding: "14px 15px",

    borderRadius: "16px",

    border:
      `1.5px solid ${borderDefault}`,

    background:
      theme.components.card.background,

    overflow: "hidden",
  };


  /* =========================================================
     HEADER
  ========================================================= */

  const headerStyle: CSSProperties = {

    minWidth: 0,

    display: "flex",

    alignItems: "flex-start",

    gap: "10px",
  };


  /* =========================================================
     HEADER ICON
  ========================================================= */

  const headerIconStyle: CSSProperties = {

    flexShrink: 0,

    width: "36px",

    height: "36px",

    boxSizing: "border-box",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: "8px",

    border:
      `1px solid ${borderDefault}`,

    background:
      surfaceMuted,

    color:
        theme.colors.brand.accent,

    marginTop: "1px",
  };


  /* =========================================================
     HEADER TEXT
  ========================================================= */

  const headerTextStyle: CSSProperties = {

    minWidth: 0,

    flex: 1,

    display: "flex",

    flexDirection: "column",

    gap: "4px",
  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle: CSSProperties = {

    margin: 0,

    padding: 0,

    color:
      textPrimary,

    fontSize: "18px",

    lineHeight: 1.3,

    fontWeight: 800,

    letterSpacing: ".1px",
  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle: CSSProperties = {

    margin: 0,

    padding: 0,

    color:
      textSecondary,

    fontSize: "12px",

    lineHeight: 1.3,

    fontWeight: 550,
  };


  /* =========================================================
     STATUS
  ========================================================= */

  const statusStyle: CSSProperties = {

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    minHeight: "27px",

    padding: "0 9px",

    boxSizing: "border-box",

    borderRadius: "999px",

    border:
      `1px solid ${statusColor}`,

    background:
        theme.colors.background.surfaceMuted,

    color:
      textPrimary,

    fontSize: "12px",

    lineHeight: 1,

    fontWeight: 800,

    letterSpacing: ".15px",

    whiteSpace: "nowrap",
  };


  /* =========================================================
     DIVIDER
  ========================================================= */

  const dividerStyle: CSSProperties = {

    width: "100%",

    height: "1px",

    flexShrink: 0,

    margin: "9px 0 8px",

    background:
      borderSubtle,
  };


  /* =========================================================
     ROW
  ========================================================= */

  const rowStyle: CSSProperties = {

    minWidth: 0,

    display: "grid",

    gridTemplateColumns:
      "30px 112px minmax(0,1fr)",

    alignItems: "center",

    gap: "12px",

    minHeight: "40px",

    borderBottom:
      `1px solid ${borderSubtle}`,

  };


  /* =========================================================
     ROW ICON
  ========================================================= */

  const rowIconStyle: CSSProperties = {

    width: "36px",

    height: "36px",

    boxSizing: "border-box",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: "7px",

    border: "none",

    background: "transparent",

    color:
        theme.colors.brand.accent,
  };


  /* =========================================================
     LABEL
  ========================================================= */

  const labelStyle: CSSProperties = {

    minWidth: 0,

    color:
      textPrimary,

    fontSize: "11px",

    lineHeight: 1.2,

    fontWeight: 750,

    textTransform: "uppercase",

    letterSpacing: ".3px",
  };


  /* =========================================================
     VALUE
  ========================================================= */

  const valueStyle: CSSProperties = {

    minWidth: 0,

    color:
      textPrimary,

    fontSize: "13px",

    lineHeight: 1.25,

    fontWeight: 750,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",
  };


  /* =========================================================
     EMPTY VALUE
  ========================================================= */

  const emptyValueStyle: CSSProperties = {

    minWidth: 0,

    color:
      textMuted,

    fontSize: "11px",

    lineHeight: 1.25,

    fontWeight: 650,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",
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

    statusStyle,

    dividerStyle,

    rowStyle,

    rowIconStyle,

    labelStyle,

    valueStyle,

    emptyValueStyle,

  };

}


/* ===========================================================
   END
=========================================================== */