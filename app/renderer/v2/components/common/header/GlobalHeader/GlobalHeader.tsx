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
   - Consume Responsive Engine
   - Keep responsive values out of inline styles
=========================================================== */


/* ===========================================================
   IMPORTS
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
  useResponsive,
} from "../../../../utils/responsive";

import {
  createGlobalHeaderStyles,
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


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const {

    containerStyle,

    leftStyle,

    centerStyle,

    departmentStyle,

    rightStyle,

    backButtonStyle,

    backIconStyle,

    logoutButtonStyle,

  } =
    createGlobalHeaderStyles(
      tokens,
      canGoBack,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <header style={containerStyle}>


      {/* ==========================================
          LEFT
      ========================================== */}

      <div style={leftStyle}>


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

          style={backButtonStyle}

        >

          <span

            aria-hidden="true"

            style={backIconStyle}

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


        {/* ==========================================
            NOTIFICATIONS
        ========================================== */}

        <NotificationBell

          unreadCount={5}

          onClick={() => {

            /* TODO:
               Open Notifications
            */

          }}

        />


        {/* ==========================================
            ADMIN PROFILE
        ========================================== */}

        <AdminProfile

          adminName="Girish"

          onClick={() => {

            /* TODO:
               Open Admin Menu
            */

          }}

        />


        {/* ==========================================
            LOGOUT
        ========================================== */}

        <button

          type="button"

          onClick={onLogout}

          title="Logout"

          aria-label="Logout"

          style={logoutButtonStyle}

        >

          Logout

        </button>


      </div>

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */