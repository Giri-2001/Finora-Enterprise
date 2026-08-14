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
// - Maintain FINORA navigation history
// - Preserve current page across browser/app refresh
// - Route Reception departments to their V2 pages
// - Enforce authenticated session inactivity protection
//
// IMPORTANT:
//
// - Storage initialization is handled by
//   app/renderer/main.tsx before React mounts.
// - This file does NOT initialize storage.
// - This file does NOT access localStorage.
// - This file does NOT access filesystem.
// - This file does NOT use Electron IPC.
// - Authentication implementation remains inside authStore.
// - Business Context is established explicitly after authentication.
// - BusinessContextProvider remains independent from authStore.
//
// NAVIGATION:
//
// - Top-level FINORA pages are owned here.
// - Navigation history is maintained separately from
//   React page rendering.
// - Browser History API is used only to survive refresh.
// - Domain repositories and storage remain untouched.
//
// VERSION : 2.3
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

const NAVIGATION_STATE_KEY =
  "finora-navigation";

const NAVIGATION_EVENT =
  "finora-navigation-change";

// ============================================================
// CUSTOMER WIZARD NAVIGATION EVENTS
// ============================================================
//
// Customer Wizard remains a nested workflow inside
// Customer Department.
//
// It is intentionally NOT added to the top-level Page type.
//
// These events create a small navigation bridge between:
//
// App.tsx
//     ↓
// CustomerDepartment
//     ↓
// CustomerWizard
//
// This allows the single GlobalHeader Back button to close
// the Wizard before popping the top-level navigation history.
// ============================================================

const CUSTOMER_WIZARD_OPEN_EVENT =
  "FINORA_CUSTOMER_WIZARD_OPEN";

const CUSTOMER_WIZARD_CLOSE_EVENT =
  "FINORA_CUSTOMER_WIZARD_CLOSE";

const CUSTOMER_WIZARD_GLOBAL_BACK_EVENT =
  "FINORA_CUSTOMER_WIZARD_GLOBAL_BACK";

// ============================================================
// NAVIGATION STATE
// ============================================================
//
// This state is intentionally stored in the browser history
// rather than localStorage.
//
// Reason:
//
// - Ctrl + R must preserve the active page.
// - FINORA should not create another application storage
//   responsibility just for UI navigation.
// - Browser refresh naturally restores history.state.
//
// ============================================================

interface NavigationState {

  page:
    Page;

  stack:
    Page[];

}

// ============================================================
// PAGE VALIDATION
// ============================================================

function isValidPage(
  value: unknown,
): value is Page {

  return (
    value === "reception" ||
    value === "dashboard" ||
    value === "customers" ||
    value === "customerDepartment" ||
    value === "loans" ||
    value === "collections" ||
    value === "reports"
  );

}

// ============================================================
// DEFAULT NAVIGATION STATE
// ============================================================

function createDefaultNavigationState():
  NavigationState {

  return {

    page:
      DEFAULT_PAGE,

    stack: [],

  };

}

// ============================================================
// READ BROWSER NAVIGATION STATE
// ============================================================

function readNavigationState():
  NavigationState {

  const state =
    window.history.state;

  if (
    !state ||
    state[NAVIGATION_STATE_KEY] === undefined
  ) {

    return createDefaultNavigationState();

  }

  const navigation =
    state[NAVIGATION_STATE_KEY] as
      Partial<NavigationState>;

  if (
    !isValidPage(
      navigation.page,
    )
  ) {

    return createDefaultNavigationState();

  }

  const stack =
    Array.isArray(
      navigation.stack,
    )
      ? navigation.stack.filter(
          isValidPage,
        )
      : [];

  return {

    page:
      navigation.page,

    stack,

  };

}

// ============================================================
// WRITE BROWSER NAVIGATION STATE
// ============================================================

function writeNavigationState(
  navigation: NavigationState,
  replace = false,
): void {

  const state = {

    ...window.history.state,

    [NAVIGATION_STATE_KEY]:
      navigation,

  };

  if (replace) {

    window.history.replaceState(
      state,
      "",
      window.location.href,
    );

    return;

  }

  window.history.pushState(
    state,
    "",
    window.location.href,
  );

}

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

      if (!session) {

        if (active) {

          await clearContext();

          setContextReady(true);

          setContextError(null);

        }

        return;

      }

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

      if (active) {

        setContextReady(false);

        setContextError(null);

      }

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
  //
  // IMPORTANT:
  //
  // customerWizardOpen belongs to
  // AuthenticatedV2Application().
  //
  // It must NOT be accessed here.
  //
  // When logout occurs, AuthenticatedV2Application unmounts
  // automatically because session becomes null, so its local
  // Customer Wizard state is naturally destroyed.
  //
  // ==========================================================

  function handleLogout(): void {

    logout();

    void clearContext();

    setSession(null);

    setContextReady(true);

    setContextError(null);

    // --------------------------------------------------------
    // Clear FINORA navigation history.
    // --------------------------------------------------------

    const navigation =
      createDefaultNavigationState();

    writeNavigationState(
      navigation,
      true,
    );

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
  // AUTHENTICATED APPLICATION
  // ==========================================================

  return (

    <AuthenticatedV2Application
      session={session}
      onLogout={handleLogout}
    />

  );

}

// ============================================================
// AUTHENTICATED V2 APPLICATION
// ============================================================

interface AuthenticatedV2ApplicationProps {

  session:
    AuthSession;

  onLogout():
    void;

}

function AuthenticatedV2Application({
  session: _session,
  onLogout,
}: AuthenticatedV2ApplicationProps) {

  // ==========================================================
  // INITIAL NAVIGATION
  // ==========================================================

  const [
    navigation,
    setNavigation,
  ] = useState<NavigationState>(
    () => {

      const current =
        readNavigationState();

      writeNavigationState(
        current,
        true,
      );

      return current;

    },
  );

  const page =
    navigation.page;

  // ==========================================================
  // CUSTOMER WIZARD NAVIGATION STATE
  // ==========================================================
  //
  // Customer Wizard remains a nested Customer Department
  // workflow.
  //
  // It is intentionally NOT promoted to a top-level Page.
  //
  // This state allows the centralized GlobalHeader Back
  // operation to close the Wizard before popping the
  // top-level navigation history.
  //
  const [
    customerWizardOpen,
    setCustomerWizardOpen,
  ] = useState<boolean>(
    false,
  );

  // ==========================================================
  // CUSTOMER WIZARD NAVIGATION BRIDGE
  // ==========================================================

  useEffect(() => {

    function handleWizardOpen(): void {

      setCustomerWizardOpen(
        true,
      );

    }

    function handleWizardClose(): void {

      setCustomerWizardOpen(
        false,
      );

    }

    window.addEventListener(
      CUSTOMER_WIZARD_OPEN_EVENT,
      handleWizardOpen,
    );

    window.addEventListener(
      CUSTOMER_WIZARD_CLOSE_EVENT,
      handleWizardClose,
    );

    return () => {

      window.removeEventListener(
        CUSTOMER_WIZARD_OPEN_EVENT,
        handleWizardOpen,
      );

      window.removeEventListener(
        CUSTOMER_WIZARD_CLOSE_EVENT,
        handleWizardClose,
      );

    };

  }, []);

  // ==========================================================
  // NAVIGATION CHANGE EVENT
  // ==========================================================
  //
  // GlobalHeader / other shell-level controls can trigger
  // browser history navigation.
  //
  // The React page state follows browser history.
  //
  // ==========================================================

  useEffect(() => {

    function handlePopState(): void {

      const next =
        readNavigationState();

      setNavigation(
        next,
      );

      window.dispatchEvent(
        new CustomEvent(
          NAVIGATION_EVENT,
        ),
      );

    }

    window.addEventListener(
      "popstate",
      handlePopState,
    );

    return () => {

      window.removeEventListener(
        "popstate",
        handlePopState,
      );

    };

  }, []);

  // ==========================================================
  // TOP-LEVEL NAVIGATION
  // ==========================================================

  function handleNavigate(
    nextPage: Page,
  ): void {

    if (
      !isValidPage(
        nextPage,
      )
    ) {

      return;

    }

    if (
      nextPage ===
      navigation.page
    ) {

      return;

    }

    const nextNavigation:
      NavigationState = {

      page:
        nextPage,

      stack: [
        ...navigation.stack,
        navigation.page,
      ],

    };

    writeNavigationState(
      nextNavigation,
    );

    setNavigation(
      nextNavigation,
    );

    window.dispatchEvent(
      new CustomEvent(
        NAVIGATION_EVENT,
      ),
    );

  }

  // ==========================================================
  // BACK NAVIGATION
  // ==========================================================
  //
  // This is the single top-level FINORA Back operation.
  //
  // Customer Wizard is checked first because it is a nested
  // workflow inside Customer Department.
  //
  // Example:
  //
  // Reception
  //   ↓
  // Customer Department
  //   ↓
  // Customer Wizard
  //
  // Global Back:
  //
  // Customer Wizard → Customer Department
  //
  // Global Back:
  //
  // Customer Department → Reception
  //
  // ==========================================================

  function handleBack(): void {

    // ========================================================
    // CUSTOMER WIZARD FIRST
    // ========================================================

    if (
      customerWizardOpen
    ) {

      window.dispatchEvent(
        new CustomEvent(
          CUSTOMER_WIZARD_GLOBAL_BACK_EVENT,
        ),
      );

      return;

    }

    // ========================================================
    // NORMAL TOP-LEVEL BACK
    // ========================================================

    if (
      navigation.stack.length === 0
    ) {

      return;

    }

    const previousPage =
      navigation.stack[
        navigation.stack.length - 1
      ];

    const remainingStack =
      navigation.stack.slice(
        0,
        -1,
      );

    const nextNavigation:
      NavigationState = {

      page:
        previousPage,

      stack:
        remainingStack,

    };

    writeNavigationState(
      nextNavigation,
      true,
    );

    setNavigation(
      nextNavigation,
    );

    window.dispatchEvent(
      new CustomEvent(
        NAVIGATION_EVENT,
      ),
    );

  }

  // ==========================================================
  // RECEPTION NAVIGATION
  // ==========================================================

  function handleReceptionNavigation(
    department: DepartmentId,
  ): void {

    switch (department) {

      case "customers":

        handleNavigate(
          "customerDepartment",
        );

        break;

      case "loans":

        handleNavigate(
          "loans",
        );

        break;

      case "collections":

        handleNavigate(
          "collections",
        );

        break;

      case "reports":

        handleNavigate(
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
        onNavigate={
          handleNavigate
        }
        onBack={
          handleBack
        }
        canGoBack={
          customerWizardOpen ||
          navigation.stack.length > 0
        }
        onLogout={
          onLogout
        }
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
