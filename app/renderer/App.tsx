import { useEffect, useMemo, useState } from "react";

import type { Page } from "./types/page";

import AppShell from "./components/AppShell";

import SessionGuard from "./components/auth/SessionGuard";

import Login from "./pages/auth/Login";

import { getSession, logout } from "./store/authStore";

import AuditArchive from "./pages/audit/AuditArchive";
import AuditLogs from "./pages/audit/AuditLogs";
import AuditRetention from "./pages/audit/AuditRetention";

import Compliance from "./pages/compliance/Compliance";

import Interest from "./pages/interest/Interest";

import Payments from "./pages/payments/Payments";

import GoldLoan from "./pages/goldLoan/GoldLoan";

import Backup from "./pages/backup/Backup";

import Collections from "./pages/collections/Collections";

import Customers from "./pages/Customers";

import Dashboard from "./pages/Dashboard";

import Loans from "./pages/loans/Loans";

import Reports from "./pages/reports/Reports";

import Users from "./pages/users/Users";

import Security from "./pages/security/Security";

import ProjectorDashboard from "./pages/projector/ProjectorDashboard";

import BusinessSettings from "./pages/settings/BusinessSettings";

import ThemeSettings from "./pages/settings/ThemeSettings";

import SubscriptionControl from "./pages/subscription/SubscriptionControl";

import AdvancedConfiguration from "./pages/settings/advanced/AdvancedConfiguration";

import {
  applyTheme,
  getSavedAccent,
  getSavedTheme,
} from "./utils/themeManager";

import { runAuditRetentionEngine } from "./utils/auditRetentionEngine";

export default function App() {
  const [session, setSession] = useState(getSession());

  const [page, setPage] = useState<Page>("dashboard");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    runAuditRetentionEngine();

    const theme = getSavedTheme();

    const accent = getSavedAccent();

    applyTheme(theme, accent);
  }, []);

  function handleLogin() {
    setSession(getSession());
  }

  function handleLogout() {
    logout();

    setSession(null);
  }

  function handleNavigate(nextPage: Page) {
    setPage(nextPage);

    setSidebarOpen(false);
  }

  const currentPage = useMemo(() => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;

      case "customers":
        return <Customers />;

      case "loans":
        return <Loans />;

      case "interest":
        return <Interest />;

      case "collections":
        return <Collections />;

      case "payments":
        return <Payments />;

      case "goldLoan":
        return <GoldLoan />;

      case "reports":
        return <Reports />;

      case "users":
        return <Users />;

      case "audit":
        return <AuditLogs />;

      case "auditArchive":
        return <AuditArchive />;

      case "auditRetention":
        return <AuditRetention />;

      case "compliance":
        return <Compliance />;

      case "backup":
        return <Backup />;

      case "security":
        return <Security />;


      case "businessSettings":
        return <BusinessSettings />;

      case "themeSettings":
        return <ThemeSettings />;

      case "subscriptionControl":
        return <SubscriptionControl />;

      case "advancedConfiguration":
        return <AdvancedConfiguration />;

      default:
        return <Dashboard />;
    }
  }, [page]);

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
  <SessionGuard>
    <AppShell
      currentPage={page}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      userRole={session.role}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}

      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      {currentPage}
    </AppShell>
  </SessionGuard>
);
}
