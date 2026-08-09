// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 APPLICATION ENTRY
//
// RESPONSIBILITY:
//
// - Render the FINORA V2 application
// - Manage authentication lifecycle for V2
// - Establish Business Context after successful authentication
// - Establish REAL / DEMO data context after authentication
// - Clear Business Context during logout
// - Manage top-level page navigation
// - Route Reception departments to their V2 pages
// - Enforce authenticated session inactivity protection
//
// IMPORTANT:
//
// - Storage initialization is handled by
//   app/renderer/main.tsx before React mounts.
// - This file does NOT initialize storage.
// - This file does NOT access localStorage directly.
// - This file does NOT access filesystem.
// - This file does NOT use Electron IPC.
// - Authentication implementation remains inside authStore.
// - Business Context is established explicitly after authentication.
// - BusinessContextProvider remains independent from authStore.
//
// ARCHITECTURE:
//
// main.tsx
//      ↓
// storageBootstrap
//      ↓
// V2 App
//      ↓
// BusinessContextProvider
//      ↓
// AuthenticatedApplication
//      ↓
// SessionGuard
//      ↓
// Authenticated V2 Application
//
// AUTHENTICATED DATA CONTEXT:
//
// REAL
//      ↓
// ownerId
//      ↓
// production owner storage
//
// DEMO
//      ↓
// demoId
//      ↓
// isolated demonstration storage
//
// VERSION : 2.2
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import AppShell
  from "../layouts/AppShell";

import ReceptionPage
  from "../pages/reception";

import DashboardPage
  from "../pages/dashboard/DashboardPage";

import CustomersPage
  from "../pages/customers/CustomersPage";

import CustomerDepartmentPage
  from "../pages/customers/CustomerDepartmentPage";

import LoansPage
  from "../pages/loans/LoansPage";

import CollectionsPage
  from "../pages/collections/CollectionsPage";

import ReportsPage
  from "../pages/reports/ReportsPage";

import Login
  from "../../pages/auth/Login";

import {
  getSession,
  logout,
} from "../../store/authStore";

import {
  BusinessContextProvider,
  useBusinessContext,
} from "../context/BusinessContext";

import type {
  AuthSession,
} from "../../components/auth/types";

import type {
  DepartmentId,
} from "../pages/reception/types";

import SessionGuard
  from "../../components/auth/SessionGuard";

// ============================================================
// TYPES
// ============================================================

type Page =
  | "reception"
  | "dashboard"
  | "customers"
  | "customerDepartment"
  | "loans"
  | "collections"
  | "reports";

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE: Page =
  "reception";

// ============================================================
// LOADING SCREEN
// ============================================================
//
// Used while the authenticated session is being converted
// into the active V2 Business Context.
//
// V2 domain pages must not render before the business context
// has been successfully established.
//

function ContextLoadingScreen() {

  return (

    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#ffffff",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >

      <div
        style={{
          textAlign: "center",
        }}
      >

        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          FINORA Enterprise
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          Establishing secure business context...
        </div>

      </div>

    </div>
  );
}

// ============================================================
// AUTHENTICATED APPLICATION
// ============================================================
//
// This component is deliberately separated from the provider.
//
// It can safely use useBusinessContext() because the parent
// BusinessContextProvider has already been mounted.
//

function AuthenticatedApplication() {

  const {
    context,
    setContext,
    clearContext,
  } = useBusinessContext();

  const [
    session,
    setSession,
  ] = useState<AuthSession | null>(
    () => getSession(),
  );

  const [
    contextReady,
    setContextReady,
  ] = useState<boolean>(
    false,
  );

  const [
    contextError,
    setContextError,
  ] = useState<string | null>(
    null,
  );

  // ==========================================================
  // ESTABLISH BUSINESS CONTEXT
  // ==========================================================

  useEffect(() => {

    let active = true;

    async function establishContext(): Promise<void> {

      // ------------------------------------------------------
      // NO SESSION
      // ------------------------------------------------------

      if (!session) {

        if (active) {

          await clearContext();

          setContextReady(true);

          setContextError(null);
        }

        return;
      }

      // ------------------------------------------------------
      // SESSION REQUIRES COMPLETE BUSINESS CONTEXT
      // ------------------------------------------------------

      if (
        !session.ownerId ||
        !session.businessId ||
        !session.branchId
      ) {

        if (active) {

          await clearContext();

          setContextReady(false);

          setContextError(
            "The authenticated user does not have a complete FINORA business context.",
          );
        }

        return;
      }

      // ------------------------------------------------------
      // DEMO SESSION SAFETY
      //
      // DEMO sessions must carry a demoId.
      //
      // A DEMO session without demoId must never be allowed
      // to establish a business/storage context.
      // ------------------------------------------------------

      if (
        session.dataContext === "DEMO" &&
        !session.demoId
      ) {

        if (active) {

          await clearContext();

          setContextReady(false);

          setContextError(
            "The authenticated DEMO session does not contain a valid Demo ID.",
          );
        }

        return;
      }

      // ------------------------------------------------------
      // BEGIN CONTEXT INITIALIZATION
      // ------------------------------------------------------

      if (active) {

        setContextReady(false);

        setContextError(null);
      }

      // ------------------------------------------------------
      // ESTABLISH BUSINESS + DATA CONTEXT
      //
      // REAL:
      // - ownerId is used by StorageManager.
      //
      // DEMO:
      // - demoId is used by StorageManager.
      //
      // BusinessId and BranchId remain application/business
      // boundary identifiers.
      // ------------------------------------------------------

      const result =
        await setContext({

          ownerId:
            session.ownerId,

          businessId:
            session.businessId,

          branchId:
            session.branchId,

          dataContext:
            session.dataContext,

          demoId:
            session.demoId,

        });

      if (!active) {
        return;
      }

      if (!result.success) {

        setContextReady(false);

        setContextError(
          result.error ??
          "Unable to establish FINORA business context.",
        );

        return;
      }

      setContextReady(true);

      setContextError(null);
    }

    void establishContext();

    return () => {

      active = false;
    };

  }, [
    session,
    setContext,
    clearContext,
  ]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  function handleLogin(): void {

    const nextSession =
      getSession();

    setSession(
      nextSession,
    );
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout(): void {

    logout();

    void clearContext();

    setSession(null);

    setContextReady(true);

    setContextError(null);
  }

  // ==========================================================
  // AUTHENTICATION GATE
  // ==========================================================

  if (!session) {

    return (

      <Login
        onLogin={
          handleLogin
        }
      />

    );
  }

  // ==========================================================
  // BUSINESS CONTEXT ERROR
  // ==========================================================

  if (contextError) {

    return (

      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#ffffff",
          fontFamily: "Segoe UI, sans-serif",
          padding: 24,
          boxSizing: "border-box",
        }}
      >

        <div
          style={{
            width: 480,
            maxWidth: "100%",
            padding: 28,
            borderRadius: 14,
            background: "#111827",
            border: "1px solid #334155",
            textAlign: "center",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            FINORA Business Context Error
          </h2>

          <p
            style={{
              marginBottom: 24,
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            {contextError}
          </p>

          <button
            type="button"
            onClick={
              handleLogout
            }
            style={{
              padding: "11px 22px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Return to Login
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // CONTEXT INITIALIZATION
  // ==========================================================

  if (
    !contextReady ||
    !context
  ) {

    return (
      <ContextLoadingScreen />
    );
  }

  // ==========================================================
  // PAGE STATE
  // ==========================================================

  return (
    <AuthenticatedV2Application
      session={session}
      onLogout={handleLogout}
    />
  );
}

// ============================================================
// AUTHENTICATED V2 APPLICATION SHELL
// ============================================================
//
// SessionGuard is intentionally mounted only around the
// authenticated application.
//
// Login page is therefore outside SessionGuard.
//

interface AuthenticatedV2ApplicationProps {

  session:
    AuthSession;

  onLogout():
    void;
}

function AuthenticatedV2Application({
  session,
  onLogout,
}: AuthenticatedV2ApplicationProps) {

  const [
    page,
    setPage,
  ] = useState<Page>(
    DEFAULT_PAGE,
  );

  // ==========================================================
  // RECEPTION NAVIGATION
  // ==========================================================

  function handleReceptionNavigation(
    department: DepartmentId,
  ): void {

    switch (department) {

      case "customers":

        setPage(
          "customerDepartment",
        );

        break;

      case "loans":

        setPage(
          "loans",
        );

        break;

      case "collections":

        setPage(
          "collections",
        );

        break;

      case "reports":

        setPage(
          "reports",
        );

        break;

      case "accounts":

        // ----------------------------------------------------
        // Coming Soon
        // ----------------------------------------------------

        break;

      case "settings":

        // ----------------------------------------------------
        // Coming Soon
        // ----------------------------------------------------

        break;

      default:

        break;
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <SessionGuard>

      <AppShell
        page={page}
        onNavigate={setPage}
        onLogout={onLogout}
      >

        {page === "reception" && (

          <ReceptionPage
            onNavigate={
              handleReceptionNavigation
            }
          />

        )}

        {page === "dashboard" && (

          <DashboardPage />

        )}

        {page === "customers" && (

          <CustomersPage />

        )}

        {page === "customerDepartment" && (

          <CustomerDepartmentPage />

        )}

        {page === "loans" && (

          <LoansPage />

        )}

        {page === "collections" && (

          <CollectionsPage />

        )}

        {page === "reports" && (

          <ReportsPage />

        )}

      </AppShell>

    </SessionGuard>
  );
}

// ============================================================
// ROOT V2 APPLICATION
// ============================================================

export default function App() {

  return (

    <BusinessContextProvider>

      <AuthenticatedApplication />

    </BusinessContextProvider>
  );
}

// ============================================================
// END
// ============================================================
