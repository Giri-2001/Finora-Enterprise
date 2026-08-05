/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   COMPONENT
=========================================================== */

import type { CustomerTopBarProps } from "./types";

import {
  DEFAULT_SUBTITLE,
  DEFAULT_TITLE,
} from "./constants";

import {
  buildSubtitle,
} from "./helpers";

import {
  containerStyle,
  leftSectionStyle,
  centerSectionStyle,
  rightSectionStyle,
  titleStyle,
  subtitleStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerTopBar({

  title = DEFAULT_TITLE,

  subtitle = DEFAULT_SUBTITLE,

}: CustomerTopBarProps) {

  return (

    <header style={containerStyle}>

      {/* ==========================================
          LEFT
      ========================================== */}

      <div style={leftSectionStyle}>

        <h1 style={titleStyle}>

          {title}

        </h1>

        <p style={subtitleStyle}>

          {buildSubtitle(subtitle)}

        </p>

      </div>

      {/* ==========================================
          CENTER
      ========================================== */}

      <div style={centerSectionStyle}>

        {/* Universal Search Component */}

      </div>

      {/* ==========================================
          RIGHT
      ========================================== */}

      <div style={rightSectionStyle}>

        {/* Add Customer */}

        {/* Notifications */}

        {/* Admin Profile */}

      </div>

    </header>

  );

}
