/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION LOGO™

   COMPONENT

   RESPONSIBILITY:
   - Render Reception logo
   - Render Reception brand title when responsive token allows
   - Consume Responsive Engine
   - Consume Theme Engine
   - Keep responsive visibility and geometry centralized
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ReceptionLogoProps,
} from "./types";

import {
  LOGO_IMAGE,
  LOGO_TITLE,
} from "./constants";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/provider";

import {
  createReceptionLogoStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionLogo({

  onClick,

}: ReceptionLogoProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     HEADER BRAND VISIBILITY
  ========================================================= */

  const {
    brandVisible,
  } =
    tokens.header;


  /* =========================================================
     RESOLVED STYLES
  ========================================================= */

  const {

    containerStyle,

    logoStyle,

    titleStyle,

  } =
    createReceptionLogoStyles(

      tokens,

      theme,

    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={
        containerStyle
      }

      onClick={
        onClick
      }

      title="Go to Reception"
    >

      {/* ==========================================
          RECEPTION LOGO
      ========================================== */}

      <img
        src={
          LOGO_IMAGE
        }

        alt={
          LOGO_TITLE
        }

        style={
          logoStyle
        }
      />


      {/* ==========================================
          RECEPTION BRAND TITLE

          Responsive Engine controls visibility.
      ========================================== */}

      {
        brandVisible && (

          <span
            style={
              titleStyle
            }
          >
            {
              LOGO_TITLE
            }
          </span>

        )
      }

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */