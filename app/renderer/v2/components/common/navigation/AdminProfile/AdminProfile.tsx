/* ===========================================================
   FINORA ENTERPRISE OS™

   ADMIN PROFILE™

   COMPONENT

   RESPONSIBILITY:
   - Render admin profile button
   - Render admin dropdown menu
   - Preserve existing profile presentation
   - Provide Logout inside profile dropdown
   - Consume central FINORA Theme Engine
   - Consume Admin Profile styles
   - No responsive geometry
   - No inline CSS
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useState,
} from "react";

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
  useTheme,
} from "../../../../themes/provider";

import {
  createAdminProfileStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function AdminProfile({

  adminName,

  onClick,

  onLogout,

}: AdminProfileProps) {


  /* =========================================================
     FINORA THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     DROPDOWN STATE
  ========================================================= */

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);


  /* =========================================================
     THEMED STYLES
  ========================================================= */

  const {

    wrapperStyle,

    containerStyle,

    iconStyle,

    nameStyle,

    arrowStyle,

    dropdownStyle,

    logoutButtonStyle,

  } =
    createAdminProfileStyles(
      theme,
    );


  /* =========================================================
     PROFILE CLICK
  ========================================================= */

  function handleProfileClick(): void {

    setIsOpen(
      (previous) =>
        !previous,
    );

    onClick?.();

  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout(): void {

    setIsOpen(
      false,
    );

    onLogout?.();

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={
        wrapperStyle
      }
    >

      {/* =====================================================
          ADMIN PROFILE BUTTON
      ===================================================== */}

      <div

        style={
          containerStyle
        }

        onClick={
          handleProfileClick
        }

        title="Admin Menu"

        role="button"

        tabIndex={0}

        aria-haspopup="menu"

        aria-expanded={
          isOpen
        }

      >

        <CircleUserRound

          size={
            22
          }

          style={
            iconStyle
          }

        />


        <span
          style={
            nameStyle
          }
        >

          {
            buildAdminName(
              adminName,
            )
          }

        </span>


        <ChevronDown

          size={
            16
          }

          style={
            arrowStyle
          }

        />

      </div>


      {/* =====================================================
          ADMIN DROPDOWN
      ===================================================== */}

      {
        isOpen && (

          <div

            role="menu"

            aria-label="Admin menu"

            style={
              dropdownStyle
            }

          >

            {/* ===============================================
                LOGOUT
            =============================================== */}

            <button

              type="button"

              role="menuitem"

              onClick={
                handleLogout
              }

              title="Logout"

              aria-label="Logout"

              style={
                logoutButtonStyle
              }

            >

              Logout

            </button>

          </div>

        )
      }

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */