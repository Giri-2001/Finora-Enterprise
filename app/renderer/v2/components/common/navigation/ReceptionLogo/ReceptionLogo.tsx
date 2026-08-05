/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION LOGO™

   COMPONENT
=========================================================== */

import type {
  ReceptionLogoProps,
} from "./types";

import {
  LOGO_ICON,
} from "./constants";

import {
  buildLogoTitle,
} from "./helpers";

import {
  containerStyle,
  iconStyle,
  titleStyle,
} from "./styles";

export default function ReceptionLogo({

  onClick,

}: ReceptionLogoProps) {

  return (

    <div
      style={containerStyle}
      onClick={onClick}
    >

      <span style={iconStyle}>

        {LOGO_ICON}

      </span>

      <span style={titleStyle}>

        {buildLogoTitle()}

      </span>

    </div>

  );

}
