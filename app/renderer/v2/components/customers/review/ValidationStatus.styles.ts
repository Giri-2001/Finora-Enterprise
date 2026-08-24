/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER VALIDATION STATUS
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Validation card layout
   - Validation row presentation
   - Complete / pending states
   - FINORA Theme Engine integration

   IMPORTANT:
   - No hardcoded theme colours.
   - All visual colours come from FinoraTheme.
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
   STYLE CONTRACT
=========================================================== */

export interface ValidationStatusStyles {

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

  rowStyle:
    CSSProperties;

  rowIconStyle:
    CSSProperties;

  labelStyle:
    CSSProperties;

  statusIconCompleteStyle:
    CSSProperties;

  statusIconPendingStyle:
    CSSProperties;

  statusCompleteStyle:
    CSSProperties;

  statusPendingStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createValidationStatusStyles(

  theme:
    FinoraTheme,

):
  ValidationStatusStyles {

  return {

    /* =======================================================
       CARD
    ======================================================= */

    cardStyle: {

      minWidth: 0,

      minHeight: 0,

      width: "100%",

      boxSizing: "border-box",

      display: "flex",

      flexDirection: "column",

      padding:
        "13px 14px",

      borderRadius:
        "16px",

      border:
        `1.5px solid ${theme.colors.border.default}`,

      background:
        theme.components.card.background,

      overflow:
        "hidden",
    },


    /* =======================================================
       HEADER
    ======================================================= */

    headerStyle: {

      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap:
        "9px",
    },


    /* =======================================================
       HEADER ICON
    ======================================================= */

    headerIconStyle: {

      width:
        "36px",

      height:
        "36px",

      flexShrink:
        0,

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      boxSizing:
        "border-box",

      borderRadius:
        "9px",

      color:
        theme.colors.brand.accent,

      border:
        `1px solid ${theme.colors.border.default}`,

      background:
        theme.colors.background.surfaceMuted,
    },


    /* =======================================================
       HEADER TEXT
    ======================================================= */

    headerTextStyle: {

      minWidth:
        0,

      flex:
        1,
    },


    /* =======================================================
       TITLE
    ======================================================= */

    titleStyle: {

      margin:
        0,

      color:
        theme.typography.heading,

      fontSize:
        "18px",

      lineHeight:
        1.2,

      fontWeight:
        750,

      letterSpacing:
        ".1px",
    },


    /* =======================================================
       SUBTITLE
    ======================================================= */

    subtitleStyle: {

      margin:
        "4px 0 0",

      color:
        theme.typography.caption,

      fontSize:
        "13px",

      lineHeight:
        1.3,

      fontWeight:
        550,
    },


    /* =======================================================
       DIVIDER
    ======================================================= */

    dividerStyle: {

      width:
        "100%",

      height:
        "1px",

      flexShrink:
        0,

      margin:
        "8px 0 3px",

      background:
        theme.colors.border.subtle,
    },


    /* =======================================================
       ROW
    ======================================================= */

    rowStyle: {

      minWidth:
        0,

      minHeight:
        "40px",

      display:
        "grid",

      gridTemplateColumns:
        "22px minmax(0,1fr) 13px auto",

      alignItems:
        "center",

      columnGap:
        "10px",

      borderBottom:
        `1px solid ${theme.colors.border.subtle}`,
    },


    /* =======================================================
       ROW ICON
    ======================================================= */

    rowIconStyle: {

      width:
        "24px",

      height:
        "24px",

      flexShrink:
        0,

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      boxSizing:
        "border-box",

      borderRadius:
        "7px",

      color:
        theme.colors.brand.accent,

      border: "none",

      background: "transparent",
    },


    /* =======================================================
       LABEL
    ======================================================= */

    labelStyle: {

      minWidth:
        0,

      color:
        theme.typography.label,

      fontSize:
        "14px",

      lineHeight:
        1.2,

      fontWeight:
        700,

      letterSpacing:
        ".15px",

      whiteSpace:
        "nowrap",

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",
    },


    /* =======================================================
       COMPLETE STATUS ICON
    ======================================================= */

    statusIconCompleteStyle: {

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      color:
        theme.colors.brand.accent,
    },


    /* =======================================================
       PENDING STATUS ICON
    ======================================================= */

    statusIconPendingStyle: {

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      color:
        theme.colors.brand.accent,
    },


    /* =======================================================
       COMPLETE STATUS
    ======================================================= */

    statusCompleteStyle: {

      flexShrink:
        0,

      color:
        theme.colors.brand.accent,

      fontSize:
        "13px",

      lineHeight:
        1,

      fontWeight:
        750,

      letterSpacing:
        ".15px",

      whiteSpace:
        "nowrap",
    },


    /* =======================================================
       PENDING STATUS
    ======================================================= */

    statusPendingStyle: {

      flexShrink:
        0,

      color:
        theme.colors.brand.accent,

      fontSize:
        "13px",

      lineHeight:
        1,

      fontWeight:
        750,

      letterSpacing:
        ".15px",

      whiteSpace:
        "nowrap",
    },

  };

}


/* ===========================================================
   END
=========================================================== */