import type { ReactNode } from "react";

import type { Page } from "../types/page";
import type { UserRole } from "./auth/types";

import {
  BrandLogo,
  DashboardIcon,
  CustomerIcon,
  LoanIcon,
  CollectionIcon,
  ReportIcon,
} from "./icons";

import { hasPermission } from "../utils/permissions";

import "../styles/layout.css";
type AppShellProps = {
  currentPage: Page;

  onNavigate: (page: Page) => void;

  onLogout: () => void;

  userRole: UserRole;

  sidebarOpen: boolean;

  setSidebarOpen: (open: boolean) => void;

  children: ReactNode;
};

export default function AppShell({
  currentPage,

  onNavigate,

  onLogout,

  userRole,

  sidebarOpen,

  setSidebarOpen,

  children,
}: AppShellProps) {
  function handleNavigate(page: Page) {
    onNavigate(page);

    setSidebarOpen(false);
  }

  if (currentPage === "projector") {
    return (
      <div
        style={{
          width: "100vw",

          height: "100vh",

          overflow: "hidden",

          background: "var(--bg)",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        <h1
          style={{
            margin: 0,

            color: "var(--text)",

            fontSize: 20,

            fontWeight: 800,
          }}
        >
          {currentPage
            .toString()
            .replace(/([A-Z])/g, " $1")
            .toUpperCase()}
        </h1>
      </header>

      <aside
        className={sidebarOpen ? "app-sidebar mobile-open" : "app-sidebar"}
      >
        <div className="sidebar-brand">
          <BrandLogo />
        </div>

        <p
          style={{
            color: "var(--text-muted)",

            fontSize: 12,
          }}
        >
          {userRole}
        </p>

        <nav
          style={{
            marginTop: 30,

            display: "flex",

            flexDirection: "column",

            gap: 10,
          }}
        >
          <button onClick={() => handleNavigate("dashboard")}>Dashboard</button>

          {hasPermission(userRole, "CUSTOMERS_VIEW") && (
            <button onClick={() => handleNavigate("customers")}>
              Customers
            </button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button onClick={() => handleNavigate("loans")}>Loans</button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button onClick={() => handleNavigate("interest")}>
              Interest Engine
            </button>
          )}

          {hasPermission(userRole, "COLLECTIONS_VIEW") && (
            <button onClick={() => handleNavigate("collections")}>
              Collections
            </button>
          )}

          {hasPermission(userRole, "COLLECTIONS_VIEW") && (
            <button onClick={() => handleNavigate("payments")}>Payments</button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button onClick={() => handleNavigate("goldLoan")}>
              Gold Loan
            </button>
          )}

          {hasPermission(userRole, "REPORTS_VIEW") && (
            <button onClick={() => handleNavigate("reports")}>Reports</button>
          )}

          {hasPermission(userRole, "USER_MANAGEMENT") && (
            <button onClick={() => handleNavigate("users")}>Users</button>
          )}

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button onClick={() => handleNavigate("audit")}>Audit Logs</button>
          )}

          {hasPermission(userRole, "BACKUP_MANAGEMENT") && (
            <button onClick={() => handleNavigate("backup")}>Backup</button>
          )}

          {hasPermission(userRole, "SECURITY_VIEW") && (
            <button onClick={() => handleNavigate("security")}>Security</button>
          )}

          <button onClick={() => handleNavigate("projector")}>
            Projector Mode
          </button>

          <button onClick={() => handleNavigate("businessSettings")}>
            Business Settings
          </button>

          <button onClick={() => handleNavigate("themeSettings")}>
            Theme Settings
          </button>

          <button onClick={() => handleNavigate("subscriptionControl")}>
            Subscription Control
          </button>

          <button onClick={() => handleNavigate("advancedConfiguration")}>
            Advanced Configuration
          </button>

          <hr />

          <button
            onClick={onLogout}
            style={{
              background:
                "linear-gradient(135deg,var(--finora-accent),var(--finora-accent-hover))",

              color: "var(--button-text)",

              border: "none",
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}
