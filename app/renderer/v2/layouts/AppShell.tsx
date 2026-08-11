// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 APPLICATION SHELL
//
// RESPONSIBILITY:
//
// - Provide the global authenticated application shell
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
// - Logout is delegated to the authenticated application.
//
// VERSION : 2.2
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  ReactNode,
} from "react";

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

  onLogout:
    () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AppShell({

  children,

  onLogout,

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
          GLOBAL LOGOUT CONTROL

          Kept as the application-level fallback control.
      ===================================================== */}

      <button
        type="button"
        onClick={onLogout}
        aria-label="Logout from FINORA Enterprise"
        style={{
          position: "fixed",

          top: 18,

          right: 18,

          zIndex: 1000,

          padding:
            "9px 16px",

          borderRadius: 8,

          border:
            "1px solid rgba(255,255,255,0.18)",

          background:
            "rgba(15,23,42,0.92)",

          color:
            "#ffffff",

          cursor:
            "pointer",

          fontSize:
            13,

          fontWeight:
            600,

          letterSpacing:
            0.2,

          boxShadow:
            "0 6px 20px rgba(15,23,42,0.18)",

          backdropFilter:
            "blur(8px)",
        }}
      >
        Logout
      </button>

      {/* =====================================================
          ACTIVE V2 PAGE

          Child pages now receive the exact remaining
          viewport height because AppShell is a definite
          100vh flex container.
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
