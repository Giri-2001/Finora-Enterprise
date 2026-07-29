import { useMemo, useState } from "react";

import AppShell from "./components/AppShell";

import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Loans from "./pages/loans/Loans";
import Collections from "./pages/collections/Collections";


export type Page =
  | "dashboard"
  | "customers"
  | "loans"
  | "collections";


export default function App() {
  const [page, setPage] =
    useState<Page>("dashboard");


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


      default:
        return <Dashboard />;
    }
  }, [page]);


  return (
    <AppShell
      currentPage={page}
      onNavigate={setPage}
    >
      {currentPage}
    </AppShell>
  );
}
