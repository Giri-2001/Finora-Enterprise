import type { ReactNode } from "react";

import type { UserRole } from "./auth/types";

import type { Page } from "../types/page";

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
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          {currentPage.toUpperCase()}
        </h1>
      </header>

      <aside
        className={sidebarOpen ? "app-sidebar mobile-open" : "app-sidebar"}
      >
        <h2>FINORA</h2>

        <p
          style={{
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          {userRole}
        </p>

        <nav
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            gap: 14,
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

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button onClick={() => handleNavigate("auditArchive")}>
              Audit Archive
            </button>
          )}

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button onClick={() => handleNavigate("auditRetention")}>
              Audit Retention
            </button>
          )}

          {hasPermission(userRole, "BACKUP_MANAGEMENT") && (
            <button onClick={() => handleNavigate("backup")}>Backup</button>
          )}

          {hasPermission(userRole, "SECURITY_VIEW") && (
            <button onClick={() => handleNavigate("security")}>Security</button>
          )}

          <hr />

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              padding: "10px",
              borderRadius: 6,
              cursor: "pointer",
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
