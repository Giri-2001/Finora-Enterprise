/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION LOGO™

   COMPONENT

   RESPONSIBILITY:
   - Render Reception logo
   - Render Reception brand title when responsive token allows
   - Consume Responsive Engine
   - Keep responsive visibility out of static styles
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
  containerStyle,
  logoStyle,
  titleStyle,
} from "./styles";

import {
  useResponsive,
} from "../../../../utils/responsive";


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
  } = useResponsive();


  /* =========================================================
     HEADER BRAND VISIBILITY
  ========================================================= */

  const {
    brandVisible,
  } = tokens.header;


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={containerStyle}
      onClick={onClick}
      title="Go to Reception"
    >

      {/* ==========================================
          RECEPTION LOGO
      ========================================== */}

      <img
        src={LOGO_IMAGE}
        alt={LOGO_TITLE}
        style={logoStyle}
      />


      {/* ==========================================
          RECEPTION BRAND TITLE

          Responsive Engine controls visibility.
      ========================================== */}

      {brandVisible && (

        <span style={titleStyle}>
          {LOGO_TITLE}
        </span>

      )}

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */