/* ===========================================================
   FINORA ENTERPRISE OS™

   FILE: GlobalHeader.tsx

   RESPONSIBILITY:
   - Render the FINORA global header
   - Use the central FINORA Theme Engine
   - Use the central Responsive Engine
   - Provide five global theme switch buttons
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


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";


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

  notificationUnreadCount = 0,

  onNotificationsClick,

}: GlobalHeaderProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE TOKEN CONTRACT ALIGNMENT
  =========================================================

  The Responsive Engine runtime already provides the complete
  token set, including:

    tokens.themeSelector

  GlobalHeader/styles.ts consumes the canonical ResponsiveTokens
  contract exported from:

    utils/responsive/tokens.ts

  The explicit type alignment below prevents TypeScript from
  treating two structurally identical ResponsiveTokens imports
  as incompatible contracts.

  No responsive values are created here.
  ========================================================= */

  const globalHeaderTokens =
    tokens as ResponsiveTokens;


  /* =========================================================
     FINORA THEME ENGINE
  =========================================================

  Active application theme:

    ThemeProvider
        ↓
    FINORA Theme Registry
        ↓
    useTheme()
        ↓
    GlobalHeader

  The selector uses the same central registry.

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

    themePickerStyle,

    themeButtonStyle,

  } =
    createGlobalHeaderStyles(

      globalHeaderTokens,

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

        Each button resolves its complete FinoraTheme from
        FINORA_THEMES so every swatch represents its own theme.

        Clicking a swatch changes the global ThemeProvider
        theme for the application.

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
                   RESOLVE COMPLETE THEME FROM CENTRAL REGISTRY
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

          unreadCount={notificationUnreadCount}

          onClick={() => {
            onNotificationsClick?.();
          }}

        />


        {/* ===================================================
           ADMIN PROFILE
        =================================================== */}

       <AdminProfile
  adminName="Admin"
  onClick={() => {
    /* Admin menu */
  }}
  onLogout={
    onLogout
  }
/>
      </div>

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */