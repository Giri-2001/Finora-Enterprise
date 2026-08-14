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
//
// IMPORTANT:
//
// - Does NOT access authStore directly.
// - Does NOT access localStorage.
// - Does NOT initialize storage.
// - Does NOT access filesystem.
// - Does NOT use Electron IPC.
// - Navigation is delegated to the authenticated application.
//
// VERSION : 2.3
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  ReactNode,
} from "react";

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
  | "reports";

// ============================================================
// PROPS
// ============================================================

interface AppShellProps {

  children:
    ReactNode;

  page:
    AppPage;

  onNavigate: (
    page:
      AppPage,
  ) => void;

  onBack:
    () => void;

  canGoBack:
    boolean;

  onLogout:
    () => void;
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

  onLogout: _onLogout,

}: AppShellProps) {

  return (

    <main
      style={{
        // ----------------------------------------------------
        // EXACT VIEWPORT
        // ----------------------------------------------------

        width: "100vw",

        height: "100vh",

        minHeight: 0,

        minWidth: 0,

        boxSizing: "border-box",

        // ----------------------------------------------------
        // LAYOUT
        // ----------------------------------------------------

        display: "flex",

        flexDirection: "column",

        // ----------------------------------------------------
        // OVERFLOW
        // ----------------------------------------------------

        overflow: "hidden",

        // ----------------------------------------------------
        // GLOBAL BACKGROUND
        // ----------------------------------------------------

        background: "#321B12",

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

        department={
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
                      : page === "reports"
                        ? "Reports"
                        : "Reception"
        }

        onBack={
          onBack
        }

        canGoBack={
          canGoBack
        }

      />

      {/* =====================================================
          ACTIVE V2 PAGE

          Child pages receive the exact remaining viewport
          height below the GlobalHeader.
      ===================================================== */}

      <div
        style={{
          width: "100%",

          flex: "1 1 auto",

          minWidth: 0,

          minHeight: 0,

          boxSizing: "border-box",

          overflow: "hidden",

          display: "flex",

          flexDirection: "column",
        }}
      >

        {children}

      </div>

    </main>
  );
}

// ============================================================
// END
// ============================================================
