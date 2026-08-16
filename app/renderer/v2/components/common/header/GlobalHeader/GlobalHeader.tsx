/* ===========================================================
   FINORA ENTERPRISE OS™
   GLOBAL HEADER™

   COMPONENT

   RESPONSIBILITY:
   - Render the single application-wide header
   - Provide centralized Back navigation
   - Preserve Reception navigation entry
   - Display department title
   - Display notifications
   - Display admin profile
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

  onBack,

  canGoBack,

  onLogout,

}: GlobalHeaderProps) {

  return (

    <header style={containerStyle}>

      {/* ==========================================
          LEFT
      ========================================== */}

      <div
        style={{
          ...leftStyle,

          display: "flex",

          alignItems: "center",

          gap: 12,
        }}
      >

        {/* ==========================================
            GLOBAL BACK BUTTON

            IMPORTANT:

            - This is the ONE application-wide Back
              button.
            - Navigation is handled by AppShell.
            - No page-specific navigation logic exists
              here.
            - Disabled automatically when there is no
              navigation history.
        ========================================== */}

       <button

  type="button"

  aria-label="Go back"

  title={
    canGoBack
      ? "Back"
      : "No previous page"
  }

  disabled={!canGoBack}

  onClick={onBack}

  style={{
    width: 40,

    height: 40,

    minWidth: 40,

    borderRadius: 10,

    border:
      "1px solid rgba(212, 175, 55, 0.45)",

    background:
      canGoBack
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(255, 255, 255, 0.03)",

    color:
      canGoBack
        ? "#F4D27A"
        : "rgba(244, 210, 122, 0.30)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    cursor:
      canGoBack
        ? "pointer"
        : "default",

    opacity:
      canGoBack
        ? 1
        : 0.55,

    transition:
      "all 160ms ease",

    padding: 0,

    flexShrink: 0,

    boxSizing: "border-box",
  }}

>

  <span

    aria-hidden="true"

    style={{
      fontSize: 22,

      lineHeight: 1,

      fontWeight: 700,

      transform:
        "translateY(-1px)",
    }}

  >

    ←

  </span>

</button>

        {/* ==========================================
            RECEPTION LOGO
        ========================================== */}

        <ReceptionLogo

          onClick={() => {

            /* TODO:
               Navigate to Reception

               Reception navigation remains controlled
               by the authenticated application.
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

        <button

  type="button"

  onClick={onLogout}

  title="Logout"

  aria-label="Logout"

  style={{
    height: 40,

    padding: "0 16px",

    borderRadius: 10,

    border:
      "1px solid rgba(212, 175, 55, 0.45)",

    background:
      "rgba(255, 255, 255, 0.08)",

    color:
      "#F4D27A",

    cursor:
      "pointer",

    fontWeight: 700,

    fontSize: 13,

    transition:
      "all 160ms ease",

    flexShrink: 0,
  }}

>

  Logout

</button>

      </div>

    </header>

  );

}
