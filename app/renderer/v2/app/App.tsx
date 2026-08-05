  /* ===========================================================
    FINORA OS V2
    APPLICATION ENTRY
  =========================================================== */

  import { useState } from "react";

  import AppShell from "../layouts/AppShell";

  import DashboardPage from "../pages/dashboard/DashboardPage";
  import CustomersPage from "../pages/customers/CustomersPage";
  import CustomerDepartmentPage
    from "../pages/customers/CustomerDepartmentPage";
  import LoansPage from "../pages/loans/LoansPage";

  import CollectionsPage from "../pages/collections/CollectionsPage";
  import ReportsPage from "../pages/reports/ReportsPage";

  /* ===========================================================
    TYPES
  =========================================================== */

  type Page =
    | "dashboard"
    | "customers"
    | "customerDepartment"
    | "loans"
    | "collections"
    | "reports";

  const DEFAULT_PAGE: Page = "customerDepartment";

  /* ===========================================================
    COMPONENT
  =========================================================== */

  export default function App() {

    const [page, setPage] = useState<Page>(DEFAULT_PAGE);

    return (
      <AppShell
        page={page}
        onNavigate={setPage}
      >
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
    );
  }
