/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   DEPARTMENTS
=========================================================== */

import type {
  DepartmentDoor,
} from "./types";

/* ===========================================================
   DEPARTMENTS
=========================================================== */

export const DEPARTMENTS: DepartmentDoor[] = [

  {
    id: "customers",

    title: "Customers",

    subtitle: "Customer Department",

    icon: "👥",

    path: "/customers",

    enabled: true,

    status: "ready",
  },

  {
    id: "loans",

    title: "Loans",

    subtitle: "Loan Office",

    icon: "💰",

    path: "/loans",

    enabled: true,

    status: "ready",
  },

  {
    id: "collections",

    title: "Collections",

    subtitle: "Collection Office",

    icon: "💳",

    path: "/collections",

    enabled: true,

    status: "ready",
  },

  {
    id: "accounts",

    title: "Accounts",

    subtitle: "Accounts Office",

    icon: "📒",

    path: "/accounts",

    enabled: false,

    status: "comingSoon",
  },

  {
    id: "reports",

    title: "Reports",

    subtitle: "Business Reports",

    icon: "📊",

    path: "/reports",

    enabled: true,

    status: "ready",
  },

  {
    id: "settings",

    title: "Settings",

    subtitle: "Enterprise Settings",

    icon: "⚙️",

    path: "/settings",

    enabled: true,

    status: "ready",
  },

];
