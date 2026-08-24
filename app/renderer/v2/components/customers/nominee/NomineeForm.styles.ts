/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER NOMINEE FORM
   PRESENTATION STYLES

   Theme:
   - FINORA V2 Theme Engine
   - All visual colors come from FinoraTheme
   - No hardcoded theme colors
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

export interface NomineeFormStyles {

  wrapperStyle: CSSProperties;

  headerStyle: CSSProperties;

  headerIconStyle: CSSProperties;

  titleStyle: CSSProperties;

  subtitleStyle: CSSProperties;

  sectionDividerStyle: CSSProperties;

  gridStyle: CSSProperties;

  fieldStyle: CSSProperties;

  labelStyle: CSSProperties;

  inputWrapperStyle: CSSProperties;

  inputIconStyle: CSSProperties;

  inputStyle: CSSProperties;

  readonlyInputStyle: CSSProperties;

  selectStyle: CSSProperties;

  helperStyle: CSSProperties;
}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createNomineeFormStyles(

  theme:
    FinoraTheme,

):
  NomineeFormStyles {


  return {


    /* =======================================================
       WRAPPER
    ======================================================= */

    wrapperStyle: {

      minWidth: 0,

      minHeight: 0,

      width: "100%",

      boxSizing: "border-box",

      display: "flex",

      flexDirection: "column",

      padding: "13px 15px",

      borderRadius: "16px",

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

      flexShrink: 0,

      display: "flex",

      alignItems: "center",

      gap: "9px",

      minHeight: "32px",
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

      borderRadius: "9px",

      color:
        theme.colors.brand.accent,

      border:
        `1px solid ${theme.colors.border.default}`,

      background:
        theme.colors.background.surfaceMuted,
    },


    /* =======================================================
       TITLE
    ======================================================= */

    titleStyle: {

      margin: 0,

      color:
        theme.typography.heading,

      fontSize: "15px",

      lineHeight: 1.2,

      fontWeight: 850,

      letterSpacing: ".1px",
    },


    /* =======================================================
       SUBTITLE
    ======================================================= */

    subtitleStyle: {

      margin: "3px 0 0",

      color:
        theme.typography.caption,

      fontSize: "9px",

      lineHeight: 1.3,

      fontWeight: 550,
    },


    /* =======================================================
       DIVIDER
    ======================================================= */

    sectionDividerStyle: {

      width: "100%",

      height: "1px",

      flexShrink: 0,

      margin:
        "7px 0 10px",

      background:
        theme.colors.border.subtle,
    },


    /* =======================================================
       FORM GRID
    ======================================================= */

    gridStyle: {

      width: "100%",

      minWidth: 0,

      minHeight: 0,

      display: "grid",

      gridTemplateColumns:
        "repeat(2,minmax(0,1fr))",

      columnGap: "12px",

      rowGap: "9px",

      alignContent: "start",
    },


    /* =======================================================
       FIELD
    ======================================================= */

    fieldStyle: {

      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "4px",
    },


    /* =======================================================
       LABEL
    ======================================================= */

    labelStyle: {

      color:
        theme.typography.label,

      fontSize: "9.5px",

      lineHeight: 1.1,

      fontWeight: 850,

      letterSpacing: ".35px",

      textTransform: "uppercase",
    },


    /* =======================================================
       INPUT WRAPPER
    ======================================================= */

    inputWrapperStyle: {

      position: "relative",

      width: "100%",

      minWidth: 0,
    },


    /* =======================================================
       INPUT ICON
    ======================================================= */

    inputIconStyle: {

      position: "absolute",

      left: "11px",

      top: "50%",

      transform:
        "translateY(-50%)",

      zIndex: 1,

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      color:
        theme.colors.brand.accent,

      pointerEvents: "none",
    },


    /* =======================================================
       INPUT
    ======================================================= */

    inputStyle: {

      width: "100%",

      height: "39px",

      boxSizing: "border-box",

      padding:
        "0 12px 0 34px",

      borderRadius: "10px",

      border:
        `1.5px solid ${theme.components.input.border}`,

      outline: "none",

      background:
        theme.components.input.background,

      color:
        theme.components.input.text,

      fontSize: "12px",

      fontWeight: 650,

      boxShadow:
        theme.components.card.shadow,
    },


    /* =======================================================
       READONLY INPUT
    ======================================================= */

    readonlyInputStyle: {

      width: "100%",

      height: "39px",

      boxSizing: "border-box",

      padding:
        "0 12px 0 34px",

      borderRadius: "10px",

      border:
        `1.5px solid ${theme.components.input.border}`,

      outline: "none",

      background:
        theme.components.input.disabledBackground,

      color:
        theme.components.input.text,

      fontSize: "12px",

      fontWeight: 650,

      cursor: "default",
    },


    /* =======================================================
       SELECT
    ======================================================= */

    selectStyle: {

      width: "100%",

      height: "39px",

      boxSizing: "border-box",

      padding:
        "0 34px",

      borderRadius: "10px",

      border:
        `1.5px solid ${theme.components.input.border}`,

      outline: "none",

      background:
        theme.components.input.background,

      color:
        theme.components.input.text,

      fontSize: "12px",

      fontWeight: 650,

      cursor: "pointer",
    },


    /* =======================================================
       HELPER
    ======================================================= */

    helperStyle: {

      marginTop: 0,

      color:
        theme.typography.caption,

      fontSize: "7.5px",

      lineHeight: 1.2,

      fontWeight: 550,

      whiteSpace: "nowrap",

      overflow: "hidden",

      textOverflow: "ellipsis",
    },

  };

}


/* ===========================================================
   END
=========================================================== */