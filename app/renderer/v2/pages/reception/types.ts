/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   TYPES
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ReactNode,
} from "react";


/* ===========================================================
   DEPARTMENT
=========================================================== */

export type DepartmentId =

  | "customers"

  | "loans"

  | "collections"

  | "accounts"

  | "reports"

  | "settings";


/* ===========================================================
   DEPARTMENT STATUS
=========================================================== */

export type DepartmentStatus =

  | "ready"

  | "comingSoon"

  | "locked";


/* ===========================================================
   DOOR
=========================================================== */

export interface DepartmentDoor {

  id:
    DepartmentId;

  title:
    string;

  subtitle:
    string;

  /*
   * Premium department icons are rendered as React nodes.
   *
   * This allows the Reception department configuration
   * to use the existing Lucide icon package instead of
   * plain Unicode / emoji characters.
   */
  icon:
    ReactNode;

  path:
    string;

  enabled:
    boolean;

  status:
    DepartmentStatus;

}


/* ===========================================================
   RECEPTION
=========================================================== */

export interface ReceptionProps {

  onNavigate?: (

    department:
      DepartmentId,

  ) => void;

}


/* ===========================================================
   END
=========================================================== */