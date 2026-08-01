import type { ReactNode } from "react";

import type { Page } from "../types/page";
import type { UserRole } from "./auth/types";

import { BrandLogo } from "./icons";

import {
  DashboardIcon,
  CustomersIcon,
  LoansIcon,
  InterestEngineIcon,
  CollectionsIcon,
  PaymentsIcon,
  GoldLoanIcon,
  ReportsIcon,
  UsersIcon,
  AuditLogsIcon,
  BackupIcon,
  SecurityIcon,
  BusinessSettingsIcon,
  ThemeSettingsIcon,
  SubscriptionIcon,
  AdvancedConfigurationIcon,
} from "../assets/icons";

import { hasPermission } from "../utils/permissions";

import "../styles/layout.css";
type AppShellProps = {
  currentPage: Page;

  onNavigate: (page: Page) => void;

  onLogout: () => void;

  userRole: UserRole;

  sidebarOpen: boolean;

  setSidebarOpen: (open: boolean) => void;

  sidebarCollapsed: boolean;

setSidebarCollapsed: (collapsed: boolean) => void;

  children: ReactNode;
};

export default function AppShell({
  currentPage,
  onNavigate,
  onLogout,
  userRole,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  children,
}: AppShellProps) {
  function handleNavigate(page: Page) {
    onNavigate(page);

    setSidebarOpen(false);
  }

  return (
  <div
    className={`app-shell ${
      sidebarCollapsed ? "sidebar-collapsed" : ""
    }`}
  >
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
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          FINORA Enterprise Dashboard
        </h1>
      </header>

     <aside
  className={`app-sidebar ${
    sidebarCollapsed ? "collapsed" : ""
  } ${sidebarOpen ? "mobile-open" : ""}`}
>
       <div
  className="sidebar-brand"
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
>
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
<button onClick={() => handleNavigate("dashboard")}>
  <img
    src={DashboardIcon}
    alt="Dashboard"
    className="sidebar-icon"
  />

  <span>Dashboard</span>
</button>
          {hasPermission(userRole, "CUSTOMERS_VIEW") && (
            <button
  onClick={() => {
    console.log("Customers clicked");
    handleNavigate("customers");
  }}
>
  <img
    src={CustomersIcon}
    alt="Customers"
    className="sidebar-icon"
  />

  <span>Customers</span>
</button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
<button onClick={() => handleNavigate("loans")}>
  <img
    src={LoansIcon}
    alt="Loans"
    className="sidebar-icon"
  />
  <span>Loans</span>
</button>          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button onClick={() => handleNavigate("interest")}>
  <img
    src={InterestEngineIcon}
    alt="Interest Engine"
    className="sidebar-icon"
  />
  <span>Interest Engine</span>
</button>
          )}

          {hasPermission(userRole, "COLLECTIONS_VIEW") && (
            <button onClick={() => handleNavigate("collections")}>
  <img
    src={CollectionsIcon}
    alt="Collections"
    className="sidebar-icon"
  />
  <span>Collections</span>
</button>
          )}

          {hasPermission(userRole, "COLLECTIONS_VIEW") && (
            <button onClick={() => handleNavigate("payments")}>
  <img
    src={PaymentsIcon}
    alt="Payments"
    className="sidebar-icon"
  />
  <span>Payments</span>
</button>
          )}

          {hasPermission(userRole, "LOANS_VIEW") && (
            <button onClick={() => handleNavigate("goldLoan")}>
  <img
    src={GoldLoanIcon}
    alt="Gold Loan"
    className="sidebar-icon"
  />
  <span>Gold Loan</span>
</button>
          )}

          {hasPermission(userRole, "REPORTS_VIEW") && (
            <button onClick={() => handleNavigate("reports")}>
  <img
    src={ReportsIcon}
    alt="Reports"
    className="sidebar-icon"
  />
  <span>Reports</span>
</button>
          )}

          {hasPermission(userRole, "USER_MANAGEMENT") && (
            <button onClick={() => handleNavigate("users")}>
  <img
    src={UsersIcon}
    alt="Users"
    className="sidebar-icon"
  />
  <span>Users</span>
</button>
          )}

          {hasPermission(userRole, "AUDIT_VIEW") && (
            <button onClick={() => handleNavigate("audit")}>
  <img
    src={AuditLogsIcon}
    alt="Audit Logs"
    className="sidebar-icon"
  />
  <span>Audit Logs</span>
</button>
          )}

          {hasPermission(userRole, "BACKUP_MANAGEMENT") && (
            <button onClick={() => handleNavigate("backup")}>
  <img
    src={BackupIcon}
    alt="Backup"
    className="sidebar-icon"
  />
  <span>Backup</span>
</button>
          )}

          {hasPermission(userRole, "SECURITY_VIEW") && (
            <button onClick={() => handleNavigate("security")}>
  <img
    src={SecurityIcon}
    alt="Security"
    className="sidebar-icon"
  />
  <span>Security</span>
</button>
          )}


          <button onClick={() => handleNavigate("businessSettings")}>
  <img
    src={BusinessSettingsIcon}
    alt="Business Settings"
    className="sidebar-icon"
  />
  <span>Business</span>
</button>

          <button onClick={() => handleNavigate("themeSettings")}>
  <img
    src={ThemeSettingsIcon}
    alt="Theme Settings"
    className="sidebar-icon"
  />
  <span>Theme</span>
</button>

          <button onClick={() => handleNavigate("subscriptionControl")}>
  <img
    src={SubscriptionIcon}
    alt="Subscription"
    className="sidebar-icon"
  />
  <span>Subscription</span>
</button>

          <button onClick={() => handleNavigate("advancedConfiguration")}>
  <img
    src={AdvancedConfigurationIcon}
    alt="Advanced Configuration"
    className="sidebar-icon"
  />
  <span>Advanced</span>
</button>

       <button
  onClick={onLogout}
  className="logout-button"
>
  <span>Logout</span>
</button>
        </nav>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}
