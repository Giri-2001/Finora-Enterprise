/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   TYPES
=========================================================== */

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

  id: DepartmentId;

  title: string;

  subtitle: string;

  icon: string;

  path: string;

  enabled: boolean;

  status: DepartmentStatus;

}

/* ===========================================================
   RECEPTION
=========================================================== */

export interface ReceptionProps {

  onNavigate?: (
    department: DepartmentId,
  ) => void;

}
