/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   DEPARTMENTS

   IMPORTANT
   -----------------------------------------------------------
   - Reception department definitions only.
   - Responsive geometry belongs to Responsive Engine.
   - Theme definitions belong to Theme Engine.
   - Premium icons are resolved by DepartmentDoor component.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  DepartmentDoor,
} from "./types";


/* ===========================================================
   DEPARTMENTS
=========================================================== */

export const DEPARTMENTS:
  DepartmentDoor[] = [

  /* =========================================================
     CUSTOMERS
  ========================================================= */

  {
    id:
      "customers",

    title:
      "Customers",

    subtitle:
      "Customer Department",

    icon:
      "users",

    path:
      "/customers",

    enabled:
      true,

    status:
      "ready",

  },


  /* =========================================================
     LOANS
  ========================================================= */

  {
    id:
      "loans",

    title:
      "Loans",

    subtitle:
      "Loan Office",

    icon:
      "banknote",

    path:
      "/loans",

    enabled:
      true,

    status:
      "ready",

  },


  /* =========================================================
     COLLECTIONS
  ========================================================= */

  {
    id:
      "collections",

    title:
      "Collections",

    subtitle:
      "Collection Office",

    icon:
      "credit-card",

    path:
      "/collections",

    enabled:
      true,

    status:
      "ready",

  },


  /* =========================================================
     ACCOUNTS
  ========================================================= */

  {
    id:
      "accounts",

    title:
      "Accounts",

    subtitle:
      "Accounts Office",

    icon:
      "notebook-tabs",

    path:
      "/accounts",

    enabled:
      false,

    status:
      "comingSoon",

  },


  /* =========================================================
     REPORTS
  ========================================================= */

  {
    id:
      "reports",

    title:
      "Reports",

    subtitle:
      "Business Reports",

    icon:
      "chart",

    path:
      "/reports",

    enabled:
      true,

    status:
      "ready",

  },


  /* =========================================================
     SETTINGS
  ========================================================= */

  {
    id:
      "settings",

    title:
      "Settings",

    subtitle:
      "Enterprise Settings",

    icon:
      "settings",

    path:
      "/settings",

    enabled:
      true,

    status:
      "ready",

  },

];


/* ===========================================================
   END
=========================================================== */