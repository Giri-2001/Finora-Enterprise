import type { ReactNode } from "react";

import type { UserRole } from "./auth/types";

import type { Page } from "../types/page";

import { hasPermission } from "../utils/permissions";

type AppShellProps = {
  currentPage: Page;

  onNavigate: (page: Page) => void;

  onLogout: () => void;

  userRole: UserRole;

  children: ReactNode;
};

export default function AppShell({
  currentPage,
  onNavigate,
  onLogout,
  userRole,
  children,
}: AppShellProps) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: "260px 1fr",

        gridTemplateRows: "64px 1fr",

        width: "100vw",

        height: "100vh",

        background: "#0f172a",

        color: "#ffffff",

        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <aside
        style={{
          gridRow: "1 / 3",

          background: "#111827",

          padding: "24px",

          borderRight: "1px solid #1f2937",
        }}
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
          <button type="button" onClick={() => onNavigate("dashboard")}>
            Dashboard
          </button>

          {hasPermission(userRole, "CUSTOMERS_VIEW") && (
            <button type="button" onClick={() => onNavigate("customers")}>
              Customers
            </button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button type="button" onClick={() => onNavigate("loans")}>
              Loans
            </button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button type="button" onClick={() => onNavigate("interest")}>
              Interest Engine
            </button>
          )}

          {hasPermission(userRole, "COLLECTIONS_VIEW") && (
            <button type="button" onClick={() => onNavigate("collections")}>
              Collections
            </button>
          )}

          {hasPermission(userRole, "COLLECTIONS_VIEW") && (
            <button type="button" onClick={() => onNavigate("payments")}>
              Payments
            </button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button type="button" onClick={() => onNavigate("goldLoan")}>
              Gold Loan
            </button>
          )}

          {hasPermission(userRole, "REPORTS_VIEW") && (
            <button type="button" onClick={() => onNavigate("reports")}>
              Reports
            </button>
          )}

          {hasPermission(userRole, "USER_MANAGEMENT") && (
            <button type="button" onClick={() => onNavigate("users")}>
              Users
            </button>
          )}

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button type="button" onClick={() => onNavigate("audit")}>
              Audit Logs
            </button>
          )}

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button type="button" onClick={() => onNavigate("auditArchive")}>
              Audit Archive
            </button>
          )}

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button type="button" onClick={() => onNavigate("auditRetention")}>
              Audit Retention
            </button>
          )}

          {hasPermission(userRole, "BACKUP_MANAGEMENT") && (
            <button type="button" onClick={() => onNavigate("backup")}>
              Backup
            </button>
          )}

          {hasPermission(userRole, "SECURITY_VIEW") && (
            <button type="button" onClick={() => onNavigate("security")}>
              Security
            </button>
          )}

          <hr
            style={{
              width: "100%",

              borderColor: "#334155",

              marginTop: 20,
            }}
          />

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "#dc2626",

              color: "#ffffff",

              border: "none",

              padding: "8px",

              borderRadius: 6,

              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      <header
        style={{
          background: "#111827",

          borderBottom: "1px solid #1f2937",

          display: "flex",

          alignItems: "center",

          padding: "0 24px",

          fontSize: 20,

          fontWeight: 600,
        }}
      >
        {currentPage.toUpperCase()}
      </header>

      <main
        style={{
          padding: 24,

          overflow: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
