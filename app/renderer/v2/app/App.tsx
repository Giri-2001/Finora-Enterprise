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
// - Open / close Loan Studio from Loans Office
// - Enforce authenticated session inactivity protection
//
// IMPORTANT:
//
// - Storage initialization is handled by
//   app/renderer/v2/main.tsx before React mounts.
// - This file does NOT initialize storage.
// - This file does NOT access localStorage.
// - This file does NOT access filesystem.
// - This file does NOT use Electron IPC.
// - Authentication implementation remains inside authStore.
// - Business Context is established explicitly after authentication.
// - BusinessContextProvider remains independent from authStore.
//
// THEME CONTRACT:
//
// - All visual colours come from FINORA Theme Engine.
// - No local colour palette is defined here.
//
// RESPONSIVE CONTRACT:
//
// - Responsive dimensions come from Responsive Engine.
// - No local responsive dimensions are defined here.
//
// NAVIGATION:
//
// - Top-level FINORA pages are owned here.
// - Navigation history is maintained separately from
//   React page rendering.
// - Browser History API is used only to survive refresh.
// - Domain repositories and storage remain untouched.
//
// VERSION : 2.4
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useEffect, useState } from "react";

import type { CSSProperties, ReactNode } from "react";

import AppShell from "../layouts/AppShell";

import ReceptionPage from "../pages/reception";

import DashboardPage from "../pages/dashboard/DashboardPage";

import CustomersPage from "../pages/customers/CustomersPage";

import CustomerDepartmentPage from "../pages/customers/CustomerDepartmentPage";

import LoansPage from "../pages/loans/LoansPage";

import CollectionStudioPage from "../components/collections/collectionStudio/CollectionStudioPage";

import CollectionsOffice from "../pages/collections/CollectionsOffice";

import AccountsOffice from "../pages/accounts/AccountsOffice";

import ReportsPage from "../pages/reports/ReportsPage";

import NotificationsPage from "../pages/notifications/NotificationsPage";

import SettingsPage from "../pages/settings/SettingsPage";

import WalletPage from "../pages/wallet/WalletPage";

import LoanStudio from "../components/customers/office/CustomerOffice/components/LoanStudio";

import Login from "../pages/auth/Login";

import {
  scheduledLoanNotificationSchedulerLifecycle,
} from "../services/notifications/scheduler/scheduledLoanNotificationSchedulerLifecycle";

import {
  notificationDeliveryLifecycle,
} from "../services/notifications/delivery/productionNotificationDeliveryRuntime";

import {
  notificationCenterService,
} from "../services/notifications/center/notificationCenterService";

import {
  notificationDataChangeMatchesScope,
  subscribeNotificationDataChanged,
} from "../services/notifications/notificationDataChangeSignal";

import BranchActivationRequired from "../pages/auth/BranchActivationRequired";

import {
  hasActiveFinoraStorageEntitlement,
  loadFinoraBranchActivation,
  loadFinoraInstallationIdentity,
} from "../services/activation/activationService";

import {
  getSession,
  invalidateSession,
  logout,
} from "../store/authStore";

import { storageManager } from "../storage/storageManager";

import { StorageMode } from "../storage/storage.types";

import {
  BusinessContextProvider,
  useBusinessContext,
} from "../context/BusinessContext";

import type { AuthSession } from "../components/auth/types";

import type { DepartmentId } from "../pages/reception/types";

import SessionGuard from "../components/auth/SessionGuard";

import { useTheme } from "../themes/provider";

import { useResponsive } from "../utils/responsive";

// ============================================================
// AUTHENTICATED STORAGE MODE
//
// Login persists the selected storage adapter in sessionStorage.
//
// This must be restored before any authenticated page can read
// repositories after Ctrl + R / renderer refresh.
// ============================================================

const FINORA_STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

function getAuthenticatedStorageMode():
  StorageMode | null {

  try {
    const storedMode =
      window.sessionStorage.getItem(
        FINORA_STORAGE_MODE_SESSION_KEY,
      );

    if (storedMode === StorageMode.LOCAL) {
      return StorageMode.LOCAL;
    }

    if (storedMode === StorageMode.USB) {
      return StorageMode.USB;
    }

    return null;
  } catch (error) {
    console.error(
      "FINORA STORAGE MODE RESTORE READ FAILED:",
      error,
    );

    return null;
  }
}

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
  | "accounts"
  | "reports"
  | "notifications"
  | "settings"
  | "wallet";

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE: Page = "reception";

const NAVIGATION_STATE_KEY = "finora-navigation";

const NAVIGATION_EVENT = "finora-navigation-change";

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

const CUSTOMER_WIZARD_OPEN_EVENT = "FINORA_CUSTOMER_WIZARD_OPEN";

const CUSTOMER_WIZARD_CLOSE_EVENT = "FINORA_CUSTOMER_WIZARD_CLOSE";

const CUSTOMER_WIZARD_GLOBAL_BACK_EVENT = "FINORA_CUSTOMER_WIZARD_GLOBAL_BACK";

// ============================================================
// LOAN STUDIO NAVIGATION EVENTS
// ============================================================
//
// Loans Office owns the Create New Loan button.
//
// Loans Office intentionally does NOT own Loan Studio state.
//
// The bridge is:
//
// Loans Office
//     ↓
// FINORA_V2_OPEN_LOAN_STUDIO
//     ↓
// App.tsx
//     ↓
// Loan Studio
//
// This keeps Loan Studio as the single existing workflow and
// avoids creating a second Loan Studio implementation.
// ============================================================

const LOAN_STUDIO_OPEN_EVENT = "FINORA_V2_OPEN_LOAN_STUDIO";

const LOAN_WORKFLOW_COMPLETED_EVENT =
  "FINORA_V2_LOAN_WORKFLOW_COMPLETED";

const COLLECTION_STUDIO_OPEN_EVENT = "FINORA_V2_OPEN_COLLECTION_STUDIO";

// ============================================================
// NAVIGATION STATE
// ============================================================
//
// This state is intentionally stored in browser history
// rather than localStorage.
//
// Reason:
//
// - Ctrl + R must preserve the active page.
// - FINORA should not create another application storage
//   responsibility just for UI navigation.
// - Browser refresh naturally restores history.state.
// ============================================================

interface NavigationState {
  page: Page;

  stack: Page[];
}

// ============================================================
// PAGE VALIDATION
// ============================================================

function isValidPage(value: unknown): value is Page {
  return (
    value === "reception" ||
    value === "dashboard" ||
    value === "customers" ||
    value === "customerDepartment" ||
    value === "loans" ||
    value === "collections" ||
    value === "accounts" ||
    value === "reports" ||
    value === "notifications" ||
    value === "settings" ||
    value === "wallet"
  );
}

// ============================================================
// DEFAULT NAVIGATION STATE
// ============================================================

function createDefaultNavigationState(): NavigationState {
  return {
    page: DEFAULT_PAGE,

    stack: [],
  };
}

// ============================================================
// READ BROWSER NAVIGATION STATE
// ============================================================

function readNavigationState(): NavigationState {
  const state = window.history.state;

  if (!state || state[NAVIGATION_STATE_KEY] === undefined) {
    return createDefaultNavigationState();
  }

  const navigation = state[NAVIGATION_STATE_KEY] as Partial<NavigationState>;

  if (!isValidPage(navigation.page)) {
    return createDefaultNavigationState();
  }

  const stack = Array.isArray(navigation.stack)
    ? navigation.stack.filter(isValidPage)
    : [];

  return {
    page: navigation.page,

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

    [NAVIGATION_STATE_KEY]: navigation,
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
// CONTEXT LOADING SCREEN
// ============================================================
//
// IMPORTANT:
//
// This screen does NOT own visual tokens.
//
// Theme:
//   useTheme()
//
// Responsive:
//   useResponsive()
//
// Therefore the loading screen remains fully compatible
// with every FINORA registered theme and viewport profile.
// ============================================================

function ContextLoadingScreen() {
  const { theme } = useTheme();

  const { tokens } = useResponsive();

  const loadingStyle: CSSProperties = {
    width: "100%",

    height: "100%",

    minWidth: 0,

    minHeight: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: `${tokens.spacing.page}px`,

    boxSizing: "border-box",

    background: theme.colors.background.page,

    color: theme.colors.text.primary,

    fontFamily: "Segoe UI, sans-serif",
  };

  const contentStyle: CSSProperties = {
    maxWidth: "100%",

    textAlign: "center",
  };

  const titleStyle: CSSProperties = {
    margin: 0,

    fontSize: `${tokens.typography.heading}px`,

    lineHeight: tokens.lineHeight.heading,

    fontWeight: 700,

    letterSpacing: ".5px",

    color: theme.colors.text.primary,
  };

  const messageStyle: CSSProperties = {
    marginTop: `${tokens.spacing.small}px`,

    marginBottom: 0,

    fontSize: `${tokens.typography.body}px`,

    lineHeight: tokens.lineHeight.body,

    color: theme.colors.text.secondary,
  };

  return (
    <div style={loadingStyle}>
      <div style={contentStyle}>
        <div style={titleStyle}>FINORA Enterprise</div>

        <div style={messageStyle}>Establishing secure business context...</div>
      </div>
    </div>
  );
}

// ============================================================
// BUSINESS CONTEXT ERROR SCREEN
// ============================================================
//
// Theme and responsive geometry are resolved centrally.
//
// No hard-coded palette.
// No local breakpoint values.
// No local responsive dimensions.
// ============================================================

function BusinessContextErrorScreen({
  message,

  onReturn,
}: {
  message: string;

  onReturn(): void;
}) {
  const { theme } = useTheme();

  const { tokens } = useResponsive();

  const rootStyle: CSSProperties = {
    width: "100%",

    height: "100%",

    minWidth: 0,

    minHeight: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    padding: `${tokens.spacing.page}px`,

    boxSizing: "border-box",

    background: theme.colors.background.page,

    color: theme.colors.text.primary,

    fontFamily: "Segoe UI, sans-serif",
  };

  const cardStyle: CSSProperties = {
    width: "100%",

    maxWidth: `${tokens.card.maxWidth}px`,

    padding: `${tokens.card.padding}px`,

    borderRadius: `${tokens.card.radius}px`,

    background: theme.components.card.background,

    border: `${tokens.border.width}px solid ${theme.components.card.border}`,

    boxShadow: theme.components.card.shadow,

    boxSizing: "border-box",

    textAlign: "center",
  };

  const titleStyle: CSSProperties = {
    margin: 0,

    marginBottom: `${tokens.spacing.small}px`,

    fontSize: `${tokens.typography.heading}px`,

    lineHeight: tokens.lineHeight.heading,

    fontWeight: 700,

    color: theme.typography.heading,
  };

  const messageStyle: CSSProperties = {
    margin: 0,

    marginBottom: `${tokens.spacing.medium}px`,

    fontSize: `${tokens.typography.body}px`,

    lineHeight: tokens.lineHeight.body,

    color: theme.typography.body,
  };

  const buttonStyle: CSSProperties = {
    minWidth: `${tokens.button.minHeight}px`,

    height: `${tokens.button.height}px`,

    padding: `0 ${tokens.button.paddingX}px`,

    borderRadius: `${tokens.button.radius}px`,

    border: `${tokens.border.width}px solid ${
      theme.components.button.primaryBackground
    }`,

    background: theme.components.button.primaryBackground,

    color: theme.components.button.primaryText,

    cursor: "pointer",

    fontSize: `${tokens.button.fontSize}px`,

    fontWeight: 600,

    boxSizing: "border-box",
  };

  return (
    <div style={rootStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>FINORA Business Context Error</h2>

        <p style={messageStyle}>{message}</p>

        <button type="button" onClick={onReturn} style={buttonStyle}>
          Return to Login
        </button>
      </div>
    </div>
  );
}

// ============================================================
// GLOBAL BRANCH ACTIVATION GATE
// ============================================================
//
// STARTUP ORDER:
//
// App Start
//   ↓
// Secure Installation Identity
//   ↓
// Branch Activation
//   ↓
// Existing Login / Authenticated Application
//
// IMPORTANT:
//
// AuthenticatedApplication is not mounted until FINORA branch
// activation is securely confirmed ACTIVE.
// ============================================================

type ActivationGateState =
  | "CHECKING"
  | "ACTIVE"
  | "REQUIRED";

function BranchActivationGate({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] =
    useState<ActivationGateState>(
      "CHECKING",
    );

  const [message, setMessage] =
    useState<string>(
      "Checking secure FINORA branch activation...",
    );

  const [retryNonce, setRetryNonce] =
    useState<number>(
      0,
    );

  useEffect(() => {
    let active = true;

    async function verifyActivation():
      Promise<void> {

      if (active) {
        setState(
          "CHECKING",
        );

        setMessage(
          "Checking secure FINORA branch activation...",
        );
      }

      const installationResult =
        await loadFinoraInstallationIdentity();

      if (!active) {
        return;
      }

      if (!installationResult.success) {
        setState(
          "REQUIRED",
        );

        setMessage(
          installationResult.error ??
            "FINORA secure installation identity could not be verified.",
        );

        return;
      }

      const installation =
        installationResult.data;

      if (!installation) {
        setState(
          "REQUIRED",
        );

        setMessage(
          "This FINORA installation has not yet been provisioned for a registered business branch.",
        );

        return;
      }

      const activationResult =
        await loadFinoraBranchActivation(
          installation.ownerId,
          installation.businessId,
          installation.branchId,
        );

      if (!active) {
        return;
      }

      if (!activationResult.success) {
        setState(
          "REQUIRED",
        );

        setMessage(
          activationResult.error ??
            "FINORA branch activation could not be verified.",
        );

        return;
      }

      const activation =
        activationResult.data;

      if (
        !activation ||
        activation.status !== "ACTIVE"
      ) {
        setState(
          "REQUIRED",
        );

        if (!activation) {
          setMessage(
            "This FINORA installation does not have an active branch activation.",
          );

          return;
        }

        setMessage(
          `FINORA branch activation status is ${activation.status}. An ACTIVE branch activation is required before signing in.`,
        );

        return;
      }

      setState(
        "ACTIVE",
      );

      setMessage(
        "",
      );
    }

    void verifyActivation();

    return () => {
      active = false;
    };
  }, [retryNonce]);

  function handleRetry(): void {
    setRetryNonce(
      (current) =>
        current + 1,
    );
  }

  if (state === "CHECKING") {
    return (
      <ContextLoadingScreen />
    );
  }

  if (state === "REQUIRED") {
    return (
      <BranchActivationRequired
        message={message}
        onRetry={handleRetry}
      />
    );
  }

  return children;
}

// ============================================================
// AUTHENTICATED APPLICATION
// ============================================================

function AuthenticatedApplication() {
  const { context, setContext, clearContext } = useBusinessContext();

  const [session, setSession] = useState<AuthSession | null>(() =>
    getSession(),
  );

  const [contextReady, setContextReady] = useState<boolean>(false);

  const [contextError, setContextError] = useState<string | null>(null);

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
        !session.userId ||
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

      if (session.dataContext === "DEMO" && !session.demoId) {
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

      // ======================================================
      // RESTORE AUTHENTICATED STORAGE MODE
      //
      // StorageManager defaults to USB after renderer reload.
      //
      // Therefore LOCAL / USB must be restored from the
      // authenticated login session BEFORE repositories or
      // Business Context can expose application data.
      //
      // SECURITY:
      //
      // Revalidate the selected per-user storage entitlement
      // before restoring storage or exposing business data.
      // Suspended/revoked entitlement must invalidate an
      // already-persisted authenticated session.
      // ======================================================

      const storageMode =
        getAuthenticatedStorageMode();

      if (!storageMode) {
        console.warn(
          "FINORA AUTHENTICATED STORAGE MODE INVALID OR MISSING.",
        );

        invalidateSession();

        try {
          window.sessionStorage.removeItem(
            FINORA_STORAGE_MODE_SESSION_KEY,
          );
        } catch (storageSessionError) {
          console.error(
            "FINORA STORAGE MODE SESSION CLEAR FAILED:",
            storageSessionError,
          );
        }

        await clearContext();

        if (!active) {
          return;
        }

        setSession(null);

        setContextReady(true);

        setContextError(null);

        return;
      }

      const entitlementStorageMode =
        storageMode === StorageMode.USB
          ? "USB"
          : "LOCAL";

      const entitlementResult =
        await hasActiveFinoraStorageEntitlement(
          session.userId,
          session.ownerId,
          session.businessId,
          session.branchId,
          entitlementStorageMode,
        );

      if (!active) {
        return;
      }

      if (
        !entitlementResult.success ||
        entitlementResult.data !== true
      ) {
        console.warn(
          "FINORA AUTHENTICATED STORAGE ENTITLEMENT INVALID:",
          entitlementResult.error ??
            `No active ${entitlementStorageMode} entitlement.`,
        );

        invalidateSession();

        try {
          window.sessionStorage.removeItem(
            FINORA_STORAGE_MODE_SESSION_KEY,
          );
        } catch (storageSessionError) {
          console.error(
            "FINORA STORAGE MODE SESSION CLEAR FAILED:",
            storageSessionError,
          );
        }

        await clearContext();

        if (!active) {
          return;
        }

        setSession(null);

        setContextReady(true);

        setContextError(null);

        return;
      }

      const storageResult =
        await storageManager.selectStorageMode(
          storageMode,
        );

      if (!active) {
        return;
      }

      if (!storageResult.success) {
        setContextReady(false);

        setContextError(
          storageResult.error ??
            "Unable to restore the authenticated FINORA storage mode.",
        );

        return;
      }

      // ======================================================
      // ESTABLISH BUSINESS / DATA CONTEXT
      // ======================================================

      const result = await setContext({
        ownerId: session.ownerId,

        businessId: session.businessId,

        branchId: session.branchId,

        dataContext: session.dataContext,

        demoId: session.demoId,
      });

      if (!active) {
        return;
      }

      if (!result.success) {
        setContextReady(false);

        setContextError(
          result.error ?? "Unable to establish FINORA business context.",
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
  }, [session, setContext, clearContext]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  function handleLogin(): void {
    const nextSession = getSession();

    setSession(nextSession);
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

    const navigation = createDefaultNavigationState();

    writeNavigationState(navigation, true);
  }

  // ==========================================================
  // AUTHENTICATION GATE
  // ==========================================================

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  // ==========================================================
  // BUSINESS CONTEXT ERROR
  // ==========================================================

  if (contextError) {
    return (
      <BusinessContextErrorScreen
        message={contextError}
        onReturn={handleLogout}
      />
    );
  }

  // ==========================================================
  // CONTEXT INITIALIZATION
  // ==========================================================

  if (!contextReady || !context) {
    return <ContextLoadingScreen />;
  }

  // ==========================================================
  // AUTHENTICATED APPLICATION
  // ==========================================================

  return (
    <AuthenticatedV2Application session={session} onLogout={handleLogout} />
  );
}

// ============================================================
// AUTHENTICATED V2 APPLICATION
// ============================================================

interface AuthenticatedV2ApplicationProps {
  session: AuthSession;

  onLogout(): void;
}

function AuthenticatedV2Application({
  session,

  onLogout,
}: AuthenticatedV2ApplicationProps) {
  // ==========================================================
  // INITIAL NAVIGATION
  // ==========================================================

  const [navigation, setNavigation] = useState<NavigationState>(() => {
    const current = readNavigationState();

    writeNavigationState(current, true);

    return current;
  });

  const page = navigation.page;

  // ==========================================================
  // OWNER NOTIFICATION UNREAD COUNT
  // ==========================================================

  const [
    notificationUnreadCount,
    setNotificationUnreadCount,
  ] = useState<number>(0);

  // ==========================================================
  // OWNER NOTIFICATION UNREAD LIFECYCLE
  //
  // The authenticated App boundary owns the authoritative
  // Owner / Business / Branch scope.
  //
  // Initial load reads persisted Owner unread state.
  // Notification-domain changes refresh only the matching
  // authenticated scope.
  //
  // Delivery-only changes do not affect the global unread badge.
  // ==========================================================

  useEffect(() => {
    let active =
      true;

    let loadGeneration =
      0;

    const notificationScope = {
      ownerId:
        session.ownerId ?? "",

      businessId:
        session.businessId ?? "",

      branchId:
        session.branchId ?? "",
    };

    setNotificationUnreadCount(
      0,
    );

    if (
      !notificationScope.ownerId ||
      !notificationScope.businessId ||
      !notificationScope.branchId
    ) {
      return () => {
        active =
          false;
      };
    }

    async function refreshUnreadCount():
      Promise<void> {
      const generation =
        ++loadGeneration;

      const result =
        await notificationCenterService
          .loadUnreadCount(
            notificationScope,
          );

      if (
        !active ||
        generation !==
          loadGeneration
      ) {
        return;
      }

      if (!result.success) {
        console.warn(
          "FINORA Notification unread count refresh failed:",
          result.error,
        );

        return;
      }

      setNotificationUnreadCount(
        result.count,
      );
    }

    const unsubscribe =
      subscribeNotificationDataChanged(
        (detail) => {
          if (
            detail.resource !==
              "NOTIFICATION" ||
            !notificationDataChangeMatchesScope(
              detail,

              notificationScope,
            )
          ) {
            return;
          }

          void refreshUnreadCount();
        },
      );

    void refreshUnreadCount();

    return () => {
      active =
        false;

      loadGeneration +=
        1;

      unsubscribe();
    };
  }, [
    session.ownerId,
    session.businessId,
    session.branchId,
  ]);
  // ==========================================================
  // SCHEDULED NOTIFICATION LIFECYCLE
  //
  // AuthenticatedV2Application mounts only after:
  //
  // - authenticated session validation
  // - storage mode restoration
  // - storage entitlement validation
  // - Business / Data Context establishment
  //
  // Therefore this is the stable application boundary for the
  // scheduled Notification lifecycle.
  //
  // Page navigation does not remount this component.
  // Logout / authenticated scope replacement stops the lifecycle.
  // ==========================================================

  useEffect(() => {
    const notificationScope = {
      ownerId:
        session.ownerId ?? "",

      businessId:
        session.businessId ?? "",

      branchId:
        session.branchId ?? "",
    };

    scheduledLoanNotificationSchedulerLifecycle.start({
      scope:
        notificationScope,
    });

    notificationDeliveryLifecycle.start({
      scope:
        notificationScope,
    });

    return () => {
      scheduledLoanNotificationSchedulerLifecycle.stop();

      notificationDeliveryLifecycle.stop();
    };
  }, [
    session.ownerId,
    session.businessId,
    session.branchId,
  ]);

  // ==========================================================
  // CUSTOMER WIZARD NAVIGATION STATE
  // ==========================================================

  const [customerWizardOpen, setCustomerWizardOpen] = useState<boolean>(false);

  // ==========================================================
  // LOAN STUDIO NAVIGATION STATE
  // ==========================================================

  const [loanStudioOpen, setLoanStudioOpen] = useState<boolean>(false);

  const [collectionStudioOpen, setCollectionStudioOpen] =
    useState<boolean>(false);

  // ==========================================================
  // CUSTOMER WIZARD NAVIGATION BRIDGE
  // ==========================================================

  useEffect(() => {
    function handleWizardOpen(): void {
      setCustomerWizardOpen(true);
    }

    function handleWizardClose(): void {
      setCustomerWizardOpen(false);
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
  // LOAN STUDIO NAVIGATION BRIDGE
  // ==========================================================

  useEffect(() => {
    function handleLoanStudioOpen(): void {
      setLoanStudioOpen(
        true,
      );
    }

    function handleLoanWorkflowCompleted(): void {
      try {
        sessionStorage.setItem(
          "FINORA_LOANS_ACTIVE_WORKSPACE",

          "LOANS_OFFICE",
        );
      } catch (error) {
        console.error(
          "FINORA LOANS WORKSPACE SESSION RESET ERROR:",
          error,
        );
      }

      setLoanStudioOpen(
        false,
      );
    }

    window.addEventListener(
      LOAN_STUDIO_OPEN_EVENT,

      handleLoanStudioOpen,
    );

    window.addEventListener(
      LOAN_WORKFLOW_COMPLETED_EVENT,

      handleLoanWorkflowCompleted,
    );

    return () => {
      window.removeEventListener(
        LOAN_STUDIO_OPEN_EVENT,

        handleLoanStudioOpen,
      );

      window.removeEventListener(
        LOAN_WORKFLOW_COMPLETED_EVENT,

        handleLoanWorkflowCompleted,
      );
    };
  }, []);

  useEffect(() => {
    function handleCollectionStudioOpen(): void {
      setCollectionStudioOpen(true);
    }

    window.addEventListener(
      COLLECTION_STUDIO_OPEN_EVENT,
      handleCollectionStudioOpen,
    );

    return () => {
      window.removeEventListener(
        COLLECTION_STUDIO_OPEN_EVENT,
        handleCollectionStudioOpen,
      );
    };
  }, []);

  // ==========================================================
  // NAVIGATION CHANGE EVENT
  // ==========================================================

  useEffect(() => {
    function handlePopState(): void {
      const next = readNavigationState();

      setNavigation(next);

      setLoanStudioOpen(false);

      setCollectionStudioOpen(false);

      window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT));
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ==========================================================
  // TOP-LEVEL NAVIGATION
  // ==========================================================

  function handleNavigate(nextPage: Page): void {
    if (!isValidPage(nextPage)) {
      return;
    }

    setLoanStudioOpen(false);

    setCollectionStudioOpen(false);

    if (nextPage === navigation.page) {
      return;
    }

    const nextNavigation: NavigationState = {
      page: nextPage,

      stack: [...navigation.stack, navigation.page],
    };

    writeNavigationState(nextNavigation);

    setNavigation(nextNavigation);

    window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT));
  }

  // ==========================================================
  // BACK NAVIGATION
  // ==========================================================

  function handleBack(): void {
    // ========================================================
    // LOAN STUDIO FIRST
    // ========================================================

    if (loanStudioOpen) {
      setLoanStudioOpen(false);

      return;
    }

    if (collectionStudioOpen) {
      setCollectionStudioOpen(false);

      return;
    }

    // ========================================================
    // CUSTOMER WIZARD SECOND
    // ========================================================

    if (customerWizardOpen) {
      window.dispatchEvent(new CustomEvent(CUSTOMER_WIZARD_GLOBAL_BACK_EVENT));

      return;
    }

    // ========================================================
    // NORMAL TOP-LEVEL BACK
    // ========================================================

    if (navigation.stack.length === 0) {
      return;
    }

    const previousPage = navigation.stack[navigation.stack.length - 1];

    const remainingStack = navigation.stack.slice(0, -1);

    const nextNavigation: NavigationState = {
      page: previousPage,

      stack: remainingStack,
    };

    writeNavigationState(
      nextNavigation,

      true,
    );

    setNavigation(nextNavigation);

    window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT));
  }

  // ==========================================================
  // RECEPTION NAVIGATION
  // ==========================================================

  function handleReceptionNavigation(department: DepartmentId): void {
    switch (department) {
      case "customers":
        handleNavigate("customerDepartment");

        break;

      case "loans":
        handleNavigate("loans");

        break;

      case "collections":
        handleNavigate("collections");

        break;

      case "reports":
        handleNavigate("reports");

        break;

      case "accounts":
        handleNavigate("accounts");

        break;

      case "settings":
        handleNavigate("settings");

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
        onNavigate={handleNavigate}
        onBack={handleBack}
        canGoBack={
          loanStudioOpen ||
          collectionStudioOpen ||
          customerWizardOpen ||
          navigation.stack.length > 0
        }
        onLogout={onLogout}
        notificationUnreadCount={notificationUnreadCount}
        onNotificationsClick={() => {
          handleNavigate("notifications");
        }}
          onWalletClick={() => {
            handleNavigate("wallet");
          }}
      >
        {/* ==================================================
            RECEPTION
        ================================================== */}

        {page === "reception" && (
          <ReceptionPage onNavigate={handleReceptionNavigation} />
        )}

        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {page === "dashboard" && <DashboardPage />}

        {/* ==================================================
            CUSTOMERS
        ================================================== */}

        {page === "customers" && <CustomersPage />}

        {/* ==================================================
            CUSTOMER DEPARTMENT
        ================================================== */}

        {page === "customerDepartment" && (
          <CustomerDepartmentPage
            businessId={session.businessId ?? ""}
          />
        )}

        {/* ==================================================
            LOANS
        ================================================== */}

        {page === "loans" && !loanStudioOpen && <LoansPage />}

        {page === "loans" && loanStudioOpen && <LoanStudio />}

        {/* ==================================================
            COLLECTIONS
        ================================================== */}

        {page === "collections" && !collectionStudioOpen && (
          <CollectionsOffice />
        )}

        {page === "collections" && collectionStudioOpen && (
          <CollectionStudioPage />
        )}

        {/* ==================================================
            ACCOUNTS
        ================================================== */}

        {page === "accounts" && <AccountsOffice />}

        {/* ==================================================
    REPORTS
================================================== */}

        {page === "reports" && <ReportsPage />}

        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        {page === "notifications" && (
          <NotificationsPage
            scope={{
              ownerId: session.ownerId ?? "",
              businessId: session.businessId ?? "",
              branchId: session.branchId ?? "",
            }}
          />
        )}

        {/* ==================================================
            SETTINGS
        ================================================== */}

        {page === "settings" && <SettingsPage />}

        {/* ==================================================
            FINORA WALLET
        ================================================== */}

        {page === "wallet" && (
          <WalletPage
            scope={{
              ownerId: session.ownerId ?? "",
              businessId: session.businessId ?? "",
              branchId: session.branchId ?? "",
            }}
          />
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
    <BranchActivationGate>
      <BusinessContextProvider>
        <AuthenticatedApplication />
      </BusinessContextProvider>
    </BranchActivationGate>
  );
}

// ============================================================
// END
// ============================================================

