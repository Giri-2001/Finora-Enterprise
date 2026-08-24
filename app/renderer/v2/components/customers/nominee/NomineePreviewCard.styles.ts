/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER NOMINEE PREVIEW
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Preview card layout
   - Nominee data rows
   - Semantic preview icons
   - Linked customer status
   - Preview typography
   - FINORA Theme Engine visual integration

   THEME CONTRACT:
   - No local theme palette
   - No hard-coded theme colours
   - All visual colours come from the active FinoraTheme
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
   STYLE FACTORY
=========================================================== */

export function createNomineePreviewCardStyles(
  theme: FinoraTheme,
) {


  /* =========================================================
     CARD
  ========================================================= */

  const cardStyle:
    CSSProperties = {

    minWidth: 0,

    minHeight: 0,

    width: "100%",

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    padding: "14px 15px",

    borderRadius: "16px",

    border:
      `1.5px solid ${theme.components.card.border}`,

    background:
      theme.components.card.background,

    overflow: "hidden",
  };


  /* =========================================================
     HEADER
  ========================================================= */

  const headerStyle:
    CSSProperties = {

    minWidth: 0,

    display: "flex",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: "10px",
  };


  /* =========================================================
     HEADER CONTENT
  ========================================================= */

  const headerContentStyle:
    CSSProperties = {

    minWidth: 0,

    display: "flex",

    alignItems: "flex-start",

    gap: "10px",
  };


  /* =========================================================
     HEADER ICON WRAPPER
  ========================================================= */

  const headerIconWrapperStyle:
    CSSProperties = {

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    width: "36px",

    height: "36px",

    borderRadius: "8px",

    border:
      `1px solid ${theme.colors.border.default}`,

    background:
  theme.colors.background.surfaceMuted,

    color:
      theme.colors.brand.accent,
  };


  /* =========================================================
     HEADER ICON
  ========================================================= */

  const headerIconStyle:
    CSSProperties = {

    width: "24px",

    height: "24px",

    strokeWidth: 1.9,

    color:
      theme.colors.brand.accent,
  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle:
    CSSProperties = {

    margin: 0,

    color:
      theme.colors.text.primary,

    fontSize: "19px",

    lineHeight: 1.3,

    fontWeight: 850,
  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle:
    CSSProperties = {

    margin: "5px 0 0",

    color:
      theme.colors.text.secondary,

    fontSize: "13px",

    lineHeight: 1.3,

    fontWeight: 550,
  };


  /* =========================================================
     LINKED BADGE
  ========================================================= */

  const linkedBadgeStyle:
    CSSProperties = {

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    padding: "5px 9px",

    borderRadius: "999px",

    border:
      `1px solid ${theme.colors.status.success}`,

    background:
      theme.colors.status.successSoft,

    color:
      theme.colors.status.success,

    fontSize: "8px",

    fontWeight: 850,

    letterSpacing: ".2px",
  };


  /* =========================================================
     DIVIDER
  ========================================================= */

  const dividerStyle:
    CSSProperties = {

    width: "100%",

    height: "1px",

    flexShrink: 0,

    margin: "10px 0 10px",

    background:
      theme.colors.border.subtle,
  };


  /* =========================================================
     ROW
  ========================================================= */

  const rowStyle:
    CSSProperties = {

    minWidth: 0,

    display: "grid",

    gridTemplateColumns:
      "18px 82px minmax(0,1fr)",

    alignItems: "center",

    gap: "10px",

    minHeight: "38px",

    borderBottom:
      `1px solid ${theme.colors.border.subtle}`,
  };


  /* =========================================================
     ROW ICON WRAPPER
  ========================================================= */

  const rowIconWrapperStyle:
    CSSProperties = {

    width: "18px",

    height: "18px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    color:
      theme.colors.brand.accent,
  };


  /* =========================================================
     ROW ICON
  ========================================================= */

  const rowIconStyle:
    CSSProperties = {

    width: "18px",

    height: "18px",

    flexShrink: 0,

    strokeWidth: 1.8,

    color:
      theme.colors.brand.accent,
  };


  /* =========================================================
     LABEL
  ========================================================= */

  const labelStyle:
    CSSProperties = {

    color:
      theme.colors.text.primary,

    fontSize: "11px",

    lineHeight: 1.2,

    fontWeight: 750,

    textTransform: "uppercase",

    letterSpacing: ".3px",
  };


  /* =========================================================
     VALUE
  ========================================================= */

  const valueStyle:
    CSSProperties = {

    minWidth: 0,

    color:
      theme.colors.text.primary,

    fontSize: "15px",

    lineHeight: 1.2,

    fontWeight: 750,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",
  };


  /* =========================================================
     EMPTY VALUE
  ========================================================= */

  const emptyValueStyle:
    CSSProperties = {

    color:
      theme.colors.text.disabled,

    fontSize: "10px",

    fontWeight: 650,
  };


  /* =========================================================
     FOOTER
  ========================================================= */

  const footerStyle:
    CSSProperties = {

    marginTop: "12px",

    color:
      theme.colors.text.muted,

    fontSize: "12px",

    lineHeight: 1.35,

    fontWeight: 550,
  };


  /* =========================================================
     RETURN STYLE CONTRACT
  ========================================================= */

  return {

    cardStyle,

    headerStyle,

    headerContentStyle,

    headerIconWrapperStyle,

    headerIconStyle,

    titleStyle,

    subtitleStyle,

    linkedBadgeStyle,

    dividerStyle,

    rowStyle,

    rowIconWrapperStyle,

    rowIconStyle,

    labelStyle,

    valueStyle,

    emptyValueStyle,

    footerStyle,

  };

}


/* ===========================================================
   END OF FILE
=========================================================== */