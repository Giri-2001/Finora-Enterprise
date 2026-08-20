/* ===========================================================
   FINORA ENTERPRISE OS™

   FILE: GlobalHeader.tsx

   RESPONSIBILITY:
   - Render the FINORA global header
   - Use the central FINORA Theme Engine
   - Use the central Responsive Engine
   - Provide global theme switching
   - Preserve existing navigation / notification /
     profile / logout behavior

   IMPORTANT:
   - Theme values come ONLY from ThemeProvider / Theme Registry.
   - Responsive geometry comes ONLY from Responsive Engine.
   - No local theme definitions.
   - No local theme storage.
   - Theme selector resolves each swatch from FINORA_THEMES.
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
  useTheme,
} from "../../../../themes/provider";


import {
  FINORA_THEMES,
} from "../../../../themes/definitions";


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
     FINORA THEME ENGINE
  =========================================================

  The GlobalHeader does NOT own a separate theme system.

  Active application theme:

    ThemeProvider
        ↓
    FINORA Theme Registry
        ↓
    useTheme()
        ↓
    GlobalHeader

  The theme selector uses the same central registry so every
  swatch represents its actual FINORA theme.

  No local theme definitions are created here.
  ========================================================= */

  const {

    theme,

    themeId,

    setTheme,

    themes,

  } = useTheme();


  /* =========================================================
     STYLES
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

    themePickerStyle,

    themeButtonStyle,

  } =
    createGlobalHeaderStyles(

      tokens,

      canGoBack,

      theme,

    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <header
      style={
        containerStyle
      }
    >


      {/* =====================================================
         LEFT
      ===================================================== */}

      <div
        style={
          leftStyle
        }
      >

        <button

          type="button"

          aria-label="Go back"

          title={
            canGoBack
              ? "Back"
              : "No previous page"
          }

          disabled={
            !canGoBack
          }

          onClick={
            onBack
          }

          style={
            backButtonStyle
          }

        >

          <span

            aria-hidden="true"

            style={
              backIconStyle
            }

          >
            ←
          </span>

        </button>


        <ReceptionLogo

          onClick={() => {
            /* Reception navigation */
          }}

        />

      </div>


      {/* =====================================================
         CENTER
      ===================================================== */}

      <div
        style={
          centerStyle
        }
      >

        <div
          style={
            departmentStyle
          }
        >

          {
            buildDepartmentTitle(
              department,
            )
          }

        </div>

      </div>


      {/* =====================================================
         RIGHT
      ===================================================== */}

      <div
        style={
          rightStyle
        }
      >


        {/* ===================================================
           FINORA THEME SELECTOR
        ===================================================

        Theme order comes directly from the central registry.

          Imperial Gold
          Royal Navy
          Amethyst
          Emerald
          Obsidian

        IMPORTANT:

        `option` is only a ThemeOption.

        The style engine requires the complete FinoraTheme.

        Therefore:

          FINORA_THEMES[option.id]

        is passed to themeButtonStyle().

        This prevents all five swatches from incorrectly using
        the currently active theme.

        =================================================== */}

        <div

          style={
            themePickerStyle
          }

          role="group"

          aria-label="Theme selector"

        >

          {
            themes.map(
              (
                option,
              ) => {

                const active =
                  option.id ===
                  themeId;


                /* =================================================
                   RESOLVE FULL THEME FROM CENTRAL REGISTRY
                ================================================= */

                const optionTheme =
                  FINORA_THEMES[
                    option.id
                  ] ??
                  theme;


                return (

                  <button

                    key={
                      option.id
                    }

                    type="button"

                    title={
                      option.name
                    }

                    aria-label={
                      `Use ${option.name} theme`
                    }

                    aria-pressed={
                      active
                    }

                    onClick={() => {

                      setTheme(
                        option.id,
                      );

                    }}

                    style={
                      themeButtonStyle(

                        optionTheme,

                        active,

                      )
                    }

                  />

                );

              },
            )
          }

        </div>


        {/* ===================================================
           NOTIFICATIONS
        =================================================== */}

        <NotificationBell

          onClick={() => {
            /* Notifications */
          }}

        />


        {/* ===================================================
           ADMIN PROFILE
        =================================================== */}

        <AdminProfile

          adminName="Girish"

          onClick={() => {
            /* Admin menu */
          }}

        />


        {/* ===================================================
           LOGOUT
        =================================================== */}

        <button

          type="button"

          onClick={
            onLogout
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

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */
