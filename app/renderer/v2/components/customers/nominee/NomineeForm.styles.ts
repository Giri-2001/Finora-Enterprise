/* ===========================================================
   FINORA ENTERPRISE OSâ„¢

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

import type {
  ResponsiveTokens,
} from "../../../utils/responsive";

import type {
  NomineeResponsiveTokens,
} from "../../../utils/responsive/customers/nominee/nominee.tokens";


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

  tokens:
    ResponsiveTokens,

  nomineeTokens:
    NomineeResponsiveTokens,

  theme:
    FinoraTheme,

):

  NomineeFormStyles {

      /* =======================================================
     RESPONSIVE TOKEN GROUPS
  ======================================================= */

  const typography =
    tokens.typography;

  const lineHeight =
    tokens.lineHeight;

  const input =
    tokens.input;

  const spacing =
    tokens.spacing;


  return { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",


    /* =======================================================
       WRAPPER
    ======================================================= */

    wrapperStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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

      overflow: "hidden",
    },


    /* =======================================================
       HEADER
    ======================================================= */

    headerStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      width: "38px",

      height: "38px",

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


  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  margin: 0,

  color:
    theme.typography.heading,

  fontSize:
    `${typography.heading - 5}px`,

  lineHeight:
    lineHeight.heading,

  fontWeight:
    750,

  letterSpacing:
    ".1px",
},

    /* =======================================================
       SUBTITLE
    ======================================================= */

subtitleStyle: {


  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  margin:
    `${spacing.small - 5}px 0 0`,

  color:
      theme.colors.text.secondary,

  fontSize:
    `${typography.body - 2.5}px`,

  lineHeight:
    lineHeight.body,

  fontWeight:
    550,
},


    /* =======================================================
       DIVIDER
    ======================================================= */

    sectionDividerStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      width: "100%",

      height: "1px",

      flexShrink: 0,

      margin:
        "10px 0 20px",

      background:
        theme.colors.border.subtle,
    },


    /* =======================================================
       FORM GRID
    ======================================================= */

    gridStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      width: "100%",

      minWidth: 0,

      minHeight: 0,

      display: "grid",

     gridTemplateColumns:
  nomineeTokens.form.gridTemplateColumns,

columnGap:
  `${nomineeTokens.form.columnGap}px`,

rowGap:
  `${nomineeTokens.form.rowGap}px`,

      alignContent: "start",
    },


    /* =======================================================
       FIELD
    ======================================================= */

    fieldStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      minWidth: 0,

      display: "flex",

      flexDirection: "column",

      gap: "4px",
    },


    /* =======================================================
       LABEL
    ======================================================= */

labelStyle: {


  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  color:
    theme.typography.label,

  fontSize:
    "10px",

  lineHeight:
    1.1,

  fontWeight:
    700,

  letterSpacing:
    ".35px",

  textTransform:
    "uppercase",

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
},


    /* =======================================================
       INPUT WRAPPER
    ======================================================= */

    inputWrapperStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      position: "relative",

      width: "100%",

      minWidth: 0,
    },


    /* =======================================================
       INPUT ICON
    ======================================================= */

    inputIconStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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


  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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

  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

  fontWeight: 650,
},


    /* =======================================================
       READONLY INPUT
    ======================================================= */

    readonlyInputStyle: {


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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


      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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
