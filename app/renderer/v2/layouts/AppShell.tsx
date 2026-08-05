/* ===========================================================
   FINORA ENTERPRISE OS™
   APPLICATION SHELL™

   GLOBAL SHELL
=========================================================== */

import type {
  ReactNode,
} from "react";

interface AppShellProps {

  children: ReactNode;

  page:
    | "dashboard"
    | "customers"
    | "customerDepartment"
    | "loans"
    | "collections"
    | "reports";

  onNavigate: (
    page:
      | "dashboard"
      | "customers"
      | "customerDepartment"
      | "loans"
      | "collections"
      | "reports"
  ) => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AppShell({

  children,

}: AppShellProps) {

  return (

    <main

      style={{

        width: "100vw",

        minHeight: "100vh",

        overflowY: "auto",

        overflowX: "hidden",

        background: "#F8FAFC",

      }}

    >

      {children}

    </main>

  );

}
