import type { UserRole } from "../components/auth/types";

export type Permission =
  | "CUSTOMERS_VIEW"
  | "CUSTOMERS_EDIT"
  | "LOANS_VIEW"
  | "LOANS_EDIT"
  | "COLLECTIONS_VIEW"
  | "COLLECTIONS_EDIT"
  | "REPORTS_VIEW"
  | "EXPORT_REPORTS"
  | "USER_MANAGEMENT";

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "CUSTOMERS_VIEW",

    "CUSTOMERS_EDIT",

    "LOANS_VIEW",

    "LOANS_EDIT",

    "COLLECTIONS_VIEW",

    "COLLECTIONS_EDIT",

    "REPORTS_VIEW",

    "EXPORT_REPORTS",

    "USER_MANAGEMENT",
  ],

  MANAGER: [
    "CUSTOMERS_VIEW",

    "CUSTOMERS_EDIT",

    "LOANS_VIEW",

    "LOANS_EDIT",

    "COLLECTIONS_VIEW",

    "REPORTS_VIEW",

    "EXPORT_REPORTS",
  ],

  COLLECTOR: [
    "CUSTOMERS_VIEW",

    "LOANS_VIEW",

    "COLLECTIONS_VIEW",

    "COLLECTIONS_EDIT",
  ],

  VIEWER: ["REPORTS_VIEW"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function getPermissions(role: UserRole): Permission[] {
  return [...rolePermissions[role]];
}
