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

import {
  useEffect,
  useState,
} from "react";

import {
  WalletCards,
} from "lucide-react";

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
  getSession,
} from "../../../../store/authStore";

import {
  formatBusinessDateForDisplay,
} from "../../../../services/business/businessDateService";

import {
  useResponsive,
} from "../../../../utils/responsive";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";


import {
  loadWalletBalance,
} from "../../../../services/wallet/walletWorkspaceService";

import {
  subscribeWalletBalanceUpdates,
} from "../../../../services/wallet/walletBalanceEvent";

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

  onWalletClick,
}: GlobalHeaderProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
    isMobile,
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
  // =========================================================
  // ACTIVE LOGIN BUSINESS DATE
  // =========================================================
  //
  // Display only. Changing the operational date requires a
  // fresh authenticated Login session.
  // =========================================================

  const authenticatedSession =
    getSession();

  const loginDateDisplay =
    formatBusinessDateForDisplay(
      authenticatedSession
        ?.businessDate,
    ) || "--";
  // =========================================================
  // LIVE FINORA WALLET BALANCE
  // =========================================================

  const [
    walletBalance,
    setWalletBalance,
  ] = useState<number | null>(
    null,
  );

  const walletOwnerId =
    String(
      authenticatedSession
        ?.ownerId ?? "",
    ).trim();

  const walletBusinessId =
    String(
      authenticatedSession
        ?.businessId ?? "",
    ).trim();

  const walletBranchId =
    String(
      authenticatedSession
        ?.branchId ?? "",
    ).trim();

  useEffect(() => {
    let cancelled =
      false;

    if (
      !walletOwnerId ||
      !walletBusinessId ||
      !walletBranchId
    ) {
      setWalletBalance(
        null,
      );

      return;
    }

    const walletScope = {
      ownerId:
        walletOwnerId,

      businessId:
        walletBusinessId,

      branchId:
        walletBranchId,
    };

    async function refreshHeaderWalletBalance(): Promise<void> {
      const result =
        await loadWalletBalance(
          walletScope,
        );

      if (cancelled) {
        return;
      }

      if (!result.success) {
        console.error(
          "FINORA GLOBAL HEADER WALLET ERROR:",
          result.error,
        );

        setWalletBalance(
          null,
        );

        return;
      }

      setWalletBalance(
        result.data.availableBalance,
      );
    }

    const unsubscribe =
      subscribeWalletBalanceUpdates(
        () => {
          void refreshHeaderWalletBalance();
        },
      );

    void refreshHeaderWalletBalance();

    return () => {
      cancelled =
        true;

      unsubscribe();
    };
  }, [
    walletOwnerId,
    walletBusinessId,
    walletBranchId,
  ]);

  const walletBalanceDisplay =
    walletBalance === null
      ? "₹--"
      : `₹ ${walletBalance.toLocaleString(
          "en-IN",
          {
            maximumFractionDigits:
              2,
          },
        )}`;


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

    mobileSecondRowStyle,

    loginDateStyle,

    actionStyle,
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
          isMobile
            ? {
                ...leftStyle,

                gridColumn:
                  "1",

                gridRow:
                  "1",

                alignSelf:
                  "center",

                justifySelf:
                  "start",

                overflow:
                  "visible",

                zIndex:
                  2,
              }
            : leftStyle
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
          isMobile
            ? {
                ...rightStyle,

                width: "100%",

                display: "grid",

                gridTemplateColumns:
                  "minmax(0, 1fr) auto minmax(0, 1fr)",

                gridTemplateRows:
                  "auto auto",

                gridColumn:
                  "1 / -1",

                gridRow:
                  "1 / 3",

                alignItems:
                  "center",

                pointerEvents:
                  "none",
              }
            : rightStyle
        }
      >

        {/* ===================================================
           ACTIVE LOGIN DATE — DISPLAY ONLY
        =================================================== */}

        <span
          style={
            isMobile
              ? {
                  ...loginDateStyle,

                  gridColumn:
                    "1",

                  gridRow:
                    "2",

                  justifySelf:
                    "start",

                  pointerEvents:
                    "auto",
                }
              : loginDateStyle
          }
          aria-label="Active FINORA Login Date"
          title="Active FINORA Login Date"
        >
          {loginDateDisplay}
        </span>


        {/* ===================================================
           TOP CONTROLS
        =================================================== */}

        <div
          style={
            isMobile
              ? {
                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "flex-end",

                  gap:
                    `${globalHeaderTokens.spacing.small}px`,

                  gridColumn:
                    "2 / 4",

                  gridRow:
                    "1",

                  justifySelf:
                    "end",

                  pointerEvents:
                    "auto",
                }
              : {
                  display:
                    "contents",
                }
          }
        >

          {/* =================================================
             FINORA THEME SELECTOR
          ================================================= */}

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


          {/* =================================================
             NOTIFICATIONS
          ================================================= */}

          <NotificationBell

            unreadCount={notificationUnreadCount}

            onClick={() => {
              onNotificationsClick?.();
            }}

          />


          {/* =================================================
             ADMIN PROFILE
          ================================================= */}

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


        {/* ===================================================
           FINORA WALLET
        =================================================== */}

        <button

          type="button"

          onClick={() => {
            onWalletClick?.();
          }}

          aria-label="Open FINORA Wallet"

          title="FINORA Wallet"

          style={
            isMobile
              ? {
                  ...actionStyle,

                  gridColumn:
                    "3",

                  gridRow:
                    "2",

                  justifySelf:
                    "end",

                  pointerEvents:
                    "auto",
                }
              : actionStyle
          }

        >
          <WalletCards
            aria-hidden="true"
            size={
              globalHeaderTokens
                .icon
                .md
            }
            strokeWidth={
              2
            }
          />

          <span>
            {walletBalanceDisplay}
          </span>

        </button>

      </div>

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */
