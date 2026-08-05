/* ===========================================================
   FINORA ENTERPRISE OS™
   ADMIN PROFILE™

   COMPONENT
=========================================================== */

import type {
  AdminProfileProps,
} from "./types";

import {
  PROFILE_ICON,
} from "./constants";

import {
  buildAdminName,
} from "./helpers";

import {
  containerStyle,
  iconStyle,
  nameStyle,
  arrowStyle,
} from "./styles";

export default function AdminProfile({

  adminName,

  onClick,

}: AdminProfileProps) {

  return (

    <div
      style={containerStyle}
      onClick={onClick}
    >

      <span style={iconStyle}>

        {PROFILE_ICON}

      </span>

      <span style={nameStyle}>

        {buildAdminName(adminName)}

      </span>

      <span style={arrowStyle}>

        ▼

      </span>

    </div>

  );

}
