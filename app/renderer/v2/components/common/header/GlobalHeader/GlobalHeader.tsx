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
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

import {
  Maximize2,
  WalletCards,
} from "lucide-react";
interface FinoraFullscreenNativePlugin {
  toggleFullscreen():
    Promise<{
      fullscreen: boolean;
    }>;
}

const finoraFullscreenNative =
  registerPlugin<FinoraFullscreenNativePlugin>(
    "FinoraFullscreen",
  );

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
  FINORA_BUSINESS_DATE_CHANGED_EVENT,
  getSession,
} from "../../../../store/authStore";

import {
  formatBusinessDateForDisplay,
} from "../../../../services/business/businessDateService";

import {
  getBusinessContext,
} from "../../../../services/business/businessContextService";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  formatRupee,
} from "../../../../utils/currency/formatCurrency";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";


import { getFinoraServerWalletBridge } from "../../../../services/wallet/finoraServerWalletBridge";
import {
  isFinoraAndroidWallet,
  getFinoraAndroidWalletBalance,
} from "../../../../services/wallet/finoraAndroidWalletBridge";

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

  onRefreshCurrentPage,

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

  const isTablet =
    tokens.meta.viewport === "tablet";

  const useTwoRowHeader =
    isMobile || isTablet;


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

  const [
    businessDateRevision,
    setBusinessDateRevision,
  ] = useState(0);

  useEffect(() => {
    const refreshBusinessDate = () => {
      setBusinessDateRevision(
        (revision) => revision + 1,
      );
    };

    window.addEventListener(
      FINORA_BUSINESS_DATE_CHANGED_EVENT,
      refreshBusinessDate,
    );

    return () => {
      window.removeEventListener(
        FINORA_BUSINESS_DATE_CHANGED_EVENT,
        refreshBusinessDate,
      );
    };
  }, []);

  const authenticatedSession =
    getSession();

  void businessDateRevision;

  const loginDateDisplay =
    formatBusinessDateForDisplay(
      authenticatedSession
        ?.businessDate,
    ) || "--";

  const businessContext =
    getBusinessContext();

  const businessName =
    String(
      businessContext
        ?.businessProfile
        ?.businessName ?? "",
    ).trim();
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

    // FINORA_P1_582F_VERIFIED_HEADER
    // Never use a workspace balance as a substitute for PostgreSQL.
    let requestNumber = 0;
    setWalletBalance(null);

    async function refreshHeaderWalletBalance(): Promise<void> {
      const thisRequest = ++requestNumber;
      // FINORA_P1_722T_ANDROID_HEADER
      // Read-only authenticated PostgreSQL Wallet balance.
      const android = isFinoraAndroidWallet();
      const bridge = android ? null : getFinoraServerWalletBridge();

      if (!android && !bridge) {
        if (!cancelled && thisRequest === requestNumber) {
          setWalletBalance(null);
        }
        return;
      }

      try {
        const result = android
          ? await getFinoraAndroidWalletBalance()
          : await bridge!.balance();
        if (cancelled || thisRequest !== requestNumber) return;

        if (!result.success) {
          setWalletBalance(null);
          return;
        }

        const value = result.data;
        if (
          value.source !== "POSTGRESQL_WALLETS" ||
          value.currency !== "INR" ||
          !/^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(value.balanceInr) ||
          !/^[0-9]{8,12}$/.test(value.walletId)
        ) {
          setWalletBalance(null);
          return;
        }

        const amount = Number(value.balanceInr);
        setWalletBalance(
          Number.isFinite(amount) && amount >= 0 ? amount : null
        );
      } catch {
        if (!cancelled && thisRequest === requestNumber) {
          setWalletBalance(null);
        }
      }
    }

    const onVerifiedBalanceRefresh = () => {
      void refreshHeaderWalletBalance();
    };

    window.addEventListener(
      "finora:verified-wallet-balance-refresh",
      onVerifiedBalanceRefresh,
    );

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
      window.removeEventListener(
        "finora:verified-wallet-balance-refresh",
        onVerifiedBalanceRefresh,
      );
    };
  }, [
    walletOwnerId,
    walletBusinessId,
    walletBranchId,
  ]);

  const walletBalanceDisplay =
    walletBalance === null
      ? "₹--"
      : formatRupee(
          walletBalance,
        );


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
        isTablet
          ? {
              ...containerStyle,
              height: "102px",
              minHeight: "102px",
              paddingTop: "8px",
              gridTemplateColumns:
                "minmax(0, 1fr) auto minmax(0, 1fr)",
              gridTemplateRows:
                "44px 34px",
              rowGap: "4px",
              alignItems: "center",
              overflow: "visible",
              boxSizing: "border-box",
            }
          : containerStyle
      }
    >


      {/* =====================================================
         LEFT
      ===================================================== */}

      <div
        style={
          useTwoRowHeader
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
          onClick={onRefreshCurrentPage}
          title="Refresh current page"
        brandTitle={businessName}
        />

        {isTablet && businessName ? (
          <span
            style={{
              minWidth: 0,
              maxWidth: "220px",
              overflow: "visible",
              textOverflow: "clip",
              flexShrink: 0,
              whiteSpace: "nowrap",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: departmentStyle.color,
            }}
            title={businessName}
          >
            {businessName}
          </span>
        ) : null}

      </div>


      {/* =====================================================
         CENTER
      ===================================================== */}

      <div
        style={
          useTwoRowHeader
            ? {
                ...centerStyle,
                gridColumn: "2",
                gridRow: "2",
                width: "auto",
                maxWidth: "none",
                justifySelf: "center",
                overflow: "visible",
              }
            : centerStyle
        }
      >

        <div
          style={
            isTablet
              ? {
                  ...departmentStyle,
                  maxWidth: "none",
                  overflow: "visible",
                  textOverflow: "clip",
                }
              : departmentStyle
          }
        >

          {
            isMobile &&
            buildDepartmentTitle(
              department,
            ) === "Customer Department"
              ? "Customers"
              : isMobile &&
                  buildDepartmentTitle(
                    department,
                  ) === "Notification Center"
                ? "Notifications"
                : buildDepartmentTitle(
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
          useTwoRowHeader
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
            useTwoRowHeader
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
            useTwoRowHeader
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

        <div
          style={
            useTwoRowHeader
              ? {
                  gridColumn: "3",
                  gridRow: "2",
                  justifySelf: "end",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minWidth: 0,
                }
              : {
                  display: "contents",
                }
          }
        >

        <button

          type="button"

          onClick={() => {
            onWalletClick?.();
          }}

          aria-label="Open FINORA Wallet"

          title="FINORA Wallet"

          style={
            useTwoRowHeader
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

                  width:
                    "max-content",

                  maxWidth:
                    "none",

                  flexShrink:
                    0,

                  overflow:
                    "visible",

                  textOverflow:
                    "clip",

                  color:
                    departmentStyle.color,
                }
              : {
                  ...actionStyle,

                  width:
                    "max-content",

                  maxWidth:
                    "none",

                  flexShrink:
                    0,

                  overflow:
                    "visible",

                  textOverflow:
                    "clip",

                  color:
                    departmentStyle.color,
                }
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

          <span
            style={{
              fontWeight:
                isMobile
                  ? 750
                  : 750,

              fontSize:
                isMobile
                  ? "calc(1em + 1px)"
                  : undefined,

              fontFamily:
                isMobile
                  ? "Inter, ui-sans-serif, system-ui, sans-serif"
                  : undefined,

              letterSpacing:
                isMobile
                  ? ".04em"
                  : undefined,

              fontVariantNumeric:
                isMobile
                  ? "tabular-nums"
                  : undefined,
            }}
          >
            {
              walletBalanceDisplay.replace(
                /^₹\s*/,
                "₹ ",
              )
            }
          </span>

        </button>

        {(
          Capacitor.getPlatform() !== "android" && Boolean(window.finora?.windowControls?.toggleFullscreen)
        ) ? (
          <button
            type="button"
            onClick={() => {
              if (
                Capacitor.getPlatform() === "android"
              ) {
                void finoraFullscreenNative
                  .toggleFullscreen();

                return;
              }

              if (
                window.finora
                  ?.windowControls
                  ?.toggleFullscreen
              ) {
                void window.finora
                  .windowControls
                  .toggleFullscreen();
              }
            }}
            aria-label="Toggle Full Screen"
            title="Toggle Full Screen"
            style={{
              ...actionStyle,
              width: "42px",
              minWidth: "42px",
              maxWidth: "42px",
              padding: 0,
              flexShrink: 0,
              justifyContent: "center",
              color:
                departmentStyle.color,
            }}
          >
            <Maximize2
              aria-hidden="true"
              size={
                globalHeaderTokens
                  .icon
                  .md
              }
              strokeWidth={2}
            />
          </button>
        ) : null}

        </div>

      </div>

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */
