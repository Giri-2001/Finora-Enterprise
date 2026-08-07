/* ===========================================================
   FINORA ENTERPRISE OS™
   ADMIN PROFILE™

   COMPONENT
=========================================================== */

import {
  ChevronDown,
  CircleUserRound,
} from "lucide-react";

import type {
  AdminProfileProps,
} from "./types";

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
      title="Admin Menu"
    >

      <CircleUserRound
        size={22}
        style={iconStyle}
      />

      <span style={nameStyle}>

        {buildAdminName(adminName)}

      </span>

      <ChevronDown
        size={16}
        style={arrowStyle}
      />

    </div>

  );

}
