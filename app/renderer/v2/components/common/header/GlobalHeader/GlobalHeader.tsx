/* ===========================================================
   FINORA ENTERPRISE OS™
   GLOBAL HEADER™

   COMPONENT
=========================================================== */

import type {
  GlobalHeaderProps,
} from "./types";

import {
  buildDepartmentTitle,
} from "./helpers";

import ReceptionLogo
  from "../../navigation/ReceptionLogo";

import NotificationBell
  from "../../navigation/NotificationBell";

import AdminProfile
  from "../../navigation/AdminProfile";

import {
  containerStyle,
  leftStyle,
  centerStyle,
  departmentStyle,
  rightStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GlobalHeader({

  department,

}: GlobalHeaderProps) {

  return (

    <header style={containerStyle}>

      {/* ==========================================
          LEFT
      ========================================== */}

      <div style={leftStyle}>

        <ReceptionLogo

          onClick={() => {

            /* TODO:
               Navigate to Reception
            */

          }}

        />

      </div>

      {/* ==========================================
          CENTER
      ========================================== */}

      <div style={centerStyle}>

        <div style={departmentStyle}>

          {buildDepartmentTitle(

            department,

          )}

        </div>

      </div>

      {/* ==========================================
          RIGHT
      ========================================== */}

      <div style={rightStyle}>

        <NotificationBell

          unreadCount={5}

          onClick={() => {

            /* TODO:
               Open Notifications
            */

          }}

        />

        <AdminProfile

          adminName="Girish"

          onClick={() => {

            /* TODO:
               Open Admin Menu
            */

          }}

        />

      </div>

    </header>

  );

}
