/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW CHECKLIST
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Checklist card layout
   - Checklist item presentation
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

export interface ReviewChecklistStyles {

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

  itemStyle:
    CSSProperties;

  itemIconStyle:
    CSSProperties;

  itemLabelStyle:
    CSSProperties;

  completeStyle:
    CSSProperties;

  pendingStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReviewChecklistStyles(

  theme:
    FinoraTheme,

):
  ReviewChecklistStyles {

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

      boxShadow:
        theme.components.card.shadow,

      overflow: "hidden",
    },


    /* =======================================================
       HEADER
    ======================================================= */

    headerStyle: {

      minWidth: 0,

      display: "flex",

      alignItems: "center",

      gap: "9px",
    },


    /* =======================================================
       HEADER ICON
    ======================================================= */

    headerIconStyle: {

      width: "30px",

      height: "30px",

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      boxSizing: "border-box",

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

      minWidth: 0,

      flex: 1,
    },


    /* =======================================================
       TITLE
    ======================================================= */

    titleStyle: {

      margin: 0,

      color:
        theme.typography.heading,

      fontSize:
        "15px",

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
        "3px 0 0",

      color:
        theme.typography.caption,

      fontSize:
        "11px",

      lineHeight:
        1.3,

      fontWeight:
        550,
    },


    /* =======================================================
       DIVIDER
    ======================================================= */

    dividerStyle: {

      width: "100%",

      height: "1px",

      flexShrink: 0,

      margin:
        "8px 0 3px",

      background:
        theme.colors.border.subtle,
    },


    /* =======================================================
       ITEM
    ======================================================= */

    itemStyle: {

      minWidth: 0,

      minHeight:
        "42px",

      display: "grid",

      gridTemplateColumns:
        "22px minmax(0,1fr) auto",

      alignItems: "center",

      columnGap:
        "7px",

      borderBottom:
        `1px solid ${theme.colors.border.subtle}`,
    },


    /* =======================================================
       ITEM ICON
    ======================================================= */

    itemIconStyle: {

      width: "22px",

      height: "22px",

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      boxSizing: "border-box",

      borderRadius:
        "7px",

      color:
        theme.colors.brand.accent,

      border:
        `1px solid ${theme.colors.border.default}`,

      background:
        theme.colors.background.surfaceMuted,
    },


    /* =======================================================
       ITEM LABEL
    ======================================================= */

    itemLabelStyle: {

      minWidth: 0,

      color:
        theme.typography.label,

      fontSize:
        "12px",

      lineHeight:
        1.2,

      fontWeight:
        700,

      letterSpacing:
        ".12px",

      whiteSpace:
        "nowrap",

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",
    },


    /* =======================================================
       COMPLETE
    ======================================================= */

    completeStyle: {

      flexShrink: 0,

      color:
        theme.colors.brand.accent,

      fontSize:
        "10px",

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
       PENDING
    ======================================================= */

    pendingStyle: {

      flexShrink: 0,

      color:
        theme.colors.brand.accent,

      fontSize:
        "10px",

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