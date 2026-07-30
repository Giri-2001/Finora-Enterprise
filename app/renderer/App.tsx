import { useMemo, useState } from "react";

import type { Page } from "./types/page";

import AppShell from "./components/AppShell";

import SessionGuard from "./components/auth/SessionGuard";

import Login from "./pages/auth/Login";

import { getSession, logout } from "./store/authStore";

import AuditArchive from "./pages/audit/AuditArchive";
import AuditLogs from "./pages/audit/AuditLogs";
import AuditRetention from "./pages/audit/AuditRetention";

import Backup from "./pages/backup/Backup";
import Collections from "./pages/collections/Collections";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Loans from "./pages/loans/Loans";
import Reports from "./pages/reports/Reports";
import Users from "./pages/users/Users";

export default function App() {
  const [session, setSession] = useState(getSession());

  const [page, setPage] = useState<Page>("dashboard");

  function handleLogin() {
    setSession(getSession());
  }

  function handleLogout() {
    logout();

    setSession(null);
  }

  const currentPage = useMemo(() => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;

      case "customers":
        return <Customers />;

      case "loans":
        return <Loans />;

      case "collections":
        return <Collections />;

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

      case "backup":
        return <Backup />;

      case "security":
        return <Dashboard />;

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
        onNavigate={setPage}
        onLogout={handleLogout}
        userRole={session.role}
      >
        {currentPage}
      </AppShell>
    </SessionGuard>
  );
}
