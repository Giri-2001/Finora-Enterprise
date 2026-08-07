/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION LOGO™

   COMPONENT
=========================================================== */

import type { ReceptionLogoProps } from "./types";

import {
  LOGO_IMAGE,
  LOGO_TITLE,
} from "./constants";

import {
  containerStyle,
  logoStyle,
  titleStyle,
} from "./styles";

export default function ReceptionLogo({
  onClick,
}: ReceptionLogoProps) {
  return (
    <div
      style={containerStyle}
      onClick={onClick}
      title="Go to Reception"
    >
      <img
        src={LOGO_IMAGE}
        alt={LOGO_TITLE}
        style={logoStyle}
      />

      <span style={titleStyle}>
        {LOGO_TITLE}
      </span>
    </div>
  );
}
