// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 APPLICATION ENTRY
//
// RESPONSIBILITY:
//
// - Render the FINORA V2 application
// - Manage top-level page navigation
// - Route Reception departments to their V2 pages
//
// IMPORTANT:
//
// - Storage initialization is handled by
//   app/renderer/main.tsx before React mounts.
// - This file must NOT initialize storage.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No business logic.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useState } from "react";

import AppShell from "../layouts/AppShell";

import ReceptionPage from "../pages/reception";

import DashboardPage from "../pages/dashboard/DashboardPage";

import CustomersPage from "../pages/customers/CustomersPage";

import CustomerDepartmentPage
  from "../pages/customers/CustomerDepartmentPage";

import LoansPage from "../pages/loans/LoansPage";

import CollectionsPage
  from "../pages/collections/CollectionsPage";

import ReportsPage from "../pages/reports/ReportsPage";

import type {
  DepartmentId,
} from "../pages/reception/types";


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
  | "reports";


// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE: Page =
  "reception";


// ============================================================
// COMPONENT
// ============================================================

export default function App() {

  const [page, setPage] =
    useState<Page>(
      DEFAULT_PAGE,
    );


  // ==========================================================
  // RECEPTION NAVIGATION
  // ==========================================================

  function handleReceptionNavigation(
    department: DepartmentId,
  ): void {

    switch (department) {

      case "customers":

        setPage(
          "customerDepartment",
        );

        break;


      case "loans":

        setPage(
          "loans",
        );

        break;


      case "collections":

        setPage(
          "collections",
        );

        break;


      case "reports":

        setPage(
          "reports",
        );

        break;


      case "accounts":

        // ----------------------------------------------------
        // Coming Soon
        // ----------------------------------------------------

        break;


      case "settings":

        // ----------------------------------------------------
        // Coming Soon
        // ----------------------------------------------------

        break;


      default:

        break;
    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <AppShell
      page={page}
      onNavigate={setPage}
    >

      {page === "reception" && (

        <ReceptionPage
          onNavigate={
            handleReceptionNavigation
          }
        />

      )}


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
