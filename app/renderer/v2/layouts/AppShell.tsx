/* ===========================================================
   FINORA ENTERPRISE OS™
   APPLICATION SHELL™

   GLOBAL SHELL
=========================================================== */

import type {
  ReactNode,
} from "react";

/* ===========================================================
   PAGE TYPE
=========================================================== */

export type AppPage =
  | "reception"
  | "dashboard"
  | "customers"
  | "customerDepartment"
  | "loans"
  | "collections"
  | "reports";

/* ===========================================================
   PROPS
=========================================================== */

interface AppShellProps {

  children: ReactNode;

  page: AppPage;

  onNavigate: (
    page: AppPage,
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
