import { useMemo, useState } from "react";

import AppShell from "./components/AppShell";

import Login from "./pages/auth/Login";

import { getSession, logout } from "./store/authStore";

import AuditLogs from "./pages/audit/AuditLogs";
import Collections from "./pages/collections/Collections";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Loans from "./pages/loans/Loans";
import Reports from "./pages/reports/Reports";
import Users from "./pages/users/Users";

export type Page =
  | "dashboard"
  | "customers"
  | "loans"
  | "collections"
  | "reports"
  | "users"
  | "audit";

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

      default:
        return <Dashboard />;
    }
  }, [page]);

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppShell
      currentPage={page}
      onNavigate={setPage}
      onLogout={handleLogout}
      userRole={session.role}
    >
      {currentPage}
    </AppShell>
  );
}
