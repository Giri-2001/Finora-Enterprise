/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   COMPONENT
=========================================================== */


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../../../utils/responsive/useResponsive";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../../../themes/provider/ThemeProvider";


/* ===========================================================
   COMPONENT CONTRACT
=========================================================== */

import type {
  CustomerTopBarProps,
} from "./types";


/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  DEFAULT_SUBTITLE,
  DEFAULT_TITLE,
} from "./constants";


/* ===========================================================
   HELPERS
=========================================================== */

import {
  buildSubtitle,
} from "./helpers";


/* ===========================================================
   RESPONSIVE + THEME STYLES
=========================================================== */

import {
  createCustomerTopBarStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerTopBar({

  title =
    DEFAULT_TITLE,

  subtitle =
    DEFAULT_SUBTITLE,

}: CustomerTopBarProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     THEME ENGINE
     ---------------------------------------------------------
     Theme controls visual appearance only.

     No responsive dimensions are controlled here.
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     RESPONSIVE + THEME STYLES
  ========================================================= */

  const {

    containerStyle,

    leftSectionStyle,

    centerSectionStyle,

    rightSectionStyle,

    titleStyle,

    subtitleStyle,

  } =
    createCustomerTopBarStyles(
      tokens,
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <header
      style={
        containerStyle
      }
    >

      {/* ==========================================
          LEFT
      ========================================== */}

      <div
        style={
          leftSectionStyle
        }
      >

        <h1
          style={
            titleStyle
          }
        >

          {title}

        </h1>


        <p
          style={
            subtitleStyle
          }
        >

          {buildSubtitle(
            subtitle,
          )}

        </p>

      </div>


      {/* ==========================================
          CENTER
      ========================================== */}

      <div
        style={
          centerSectionStyle
        }
      >

        {/* Universal Search Component */}

      </div>


      {/* ==========================================
          RIGHT
      ========================================== */}

      <div
        style={
          rightSectionStyle
        }
      >

        {/* Add Customer */}

        {/* Notifications */}

        {/* Admin Profile */}

      </div>

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */