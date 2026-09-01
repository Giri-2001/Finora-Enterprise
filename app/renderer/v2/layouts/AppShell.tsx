// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 APPLICATION SHELL™
//
// RESPONSIBILITY:
//
// - Provide the global authenticated application shell
// - Provide centralized application navigation
// - Provide global Back navigation
// - Provide global logout access
// - Host the active V2 page
// - Establish the exact viewport height
// - Allow child Studio layouts to consume remaining height
// - Provide the global page scrolling boundary
//
// IMPORTANT:
//
// - Does NOT access authStore directly.
// - Does NOT access localStorage.
// - Does NOT initialize storage.
// - Does NOT access filesystem.
// - Does NOT use Electron IPC.
// - Navigation is delegated to the authenticated application.
// - Responsive dimensions remain owned by the Responsive Engine.
//
// VERSION : 2.6
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { ReactNode } from "react";

import { useTheme } from "../themes/provider";

import GlobalHeader from "../components/common/header/GlobalHeader";

// ============================================================
// PAGE TYPE
// ============================================================

export type AppPage =
  | "reception"
  | "dashboard"
  | "customers"
  | "customerDepartment"
  | "loans"
  | "collections"
  | "accounts"
  | "reports"
  | "notifications"
  | "settings";

// ============================================================
// PROPS
// ============================================================

interface AppShellProps {
  children: ReactNode;

  page: AppPage;

  onNavigate: (page: AppPage) => void;

  onBack: () => void;

  canGoBack: boolean;

  onLogout: () => void;

  notificationUnreadCount?: number;

  onNotificationsClick?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AppShell({
  children,

  page,

  onNavigate: _onNavigate,

  onBack,

  canGoBack,

  onLogout,

  notificationUnreadCount = 0,

  onNotificationsClick,
}: AppShellProps) {
  // ==========================================================
  // DEPARTMENT TITLE
  // ==========================================================

  const { theme } = useTheme();

  const department =
    page === "reception"
      ? "Reception"
      : page === "dashboard"
        ? "Dashboard"
        : page === "customers"
          ? "Customers"
          : page === "customerDepartment"
            ? "Customer Department"
            : page === "loans"
              ? "Loans"
              : page === "collections"
                ? "Collections"
                : page === "accounts"
                  ? "Accounts"
                  : page === "reports"
                    ? "Reports"
                    : page === "notifications"
                      ? "Notification Center"
                      : "Reception";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      style={{
        // ----------------------------------------------------
        // VIEWPORT
        // ----------------------------------------------------

        width: "100%",

        height: "100%",

        minWidth: 0,

        minHeight: 0,

        boxSizing: "border-box",

        // ----------------------------------------------------
        // APPLICATION LAYOUT
        // ----------------------------------------------------

        display: "flex",

        flexDirection: "column",

        // ----------------------------------------------------
        // IMPORTANT
        //
        // AppShell remains the viewport shell.
        //
        // The page area below the header owns the single
        // scrolling boundary.
        // ----------------------------------------------------

        overflow: "hidden",

        // ----------------------------------------------------
        // GLOBAL BACKGROUND
        // ----------------------------------------------------

        background: theme.colors.background.page,

        position: "relative",
      }}
    >
      {/* =====================================================
          GLOBAL HEADER

          AppShell owns the single global header.

          This prevents StudioLayout from creating duplicate
          headers and keeps Back navigation centralized.
      ===================================================== */}

      <GlobalHeader
        department={department}
        onBack={onBack}
        canGoBack={canGoBack}
        onLogout={onLogout}
        notificationUnreadCount={notificationUnreadCount}
        onNotificationsClick={onNotificationsClick}
      />

      {/* =====================================================
          ACTIVE V2 PAGE SCROLL AREA

          IMPORTANT:

          - Header remains outside this scrolling boundary.
          - This is the ONLY outer page scrolling boundary.
          - Short pages receive the remaining viewport height.
          - Long pages are allowed to grow naturally.
      ===================================================== */}

      <div
        style={{
          width: "100%",

          minWidth: 0,

          minHeight: 0,

          flex: "1 1 auto",

          boxSizing: "border-box",

          display: "flex",

          flexDirection: "column",

          overflowX: "hidden",

          overflowY: "auto",

          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* =================================================
            PAGE CONTENT HOST

            RESPONSIBILITY:

            - Host the active V2 page.
            - Consume remaining viewport height when the
              page content is shorter than the viewport.
            - Grow naturally when page content becomes taller
              than the available viewport.
            - Never create an artificial minHeight: "100%".
            - Never introduce another scrolling boundary.

            IMPORTANT:

            flex: "1 0 auto"

            means:

            flex-grow  = 1
            flex-shrink = 0
            flex-basis = auto

            Therefore:

            SHORT PAGE
              → consumes remaining available height

            LONG PAGE
              → retains its natural content height
              → outer page area scrolls

            This is required for ReceptionFooter to remain
            at the bottom of a short Reception page while
            staying after all Reception content on a long
            mobile page.
        ================================================= */}

        <div
          style={{
            width: "100%",

            minWidth: 0,

            minHeight: 0,

            boxSizing: "border-box",

            display: "flex",

            flexDirection: "column",

            flex: "1 0 auto",
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}

// ============================================================
// END
// ============================================================
