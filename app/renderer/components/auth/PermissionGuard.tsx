import type { ReactNode } from "react";

import type { Permission } from "../../utils/permissions";

import { hasPermission } from "../../utils/permissions";

import type { UserRole } from "./types";

type PermissionGuardProps = {
  role: UserRole;

  permission: Permission;

  children: ReactNode;

  fallback?: ReactNode;
};

export default function PermissionGuard({
  role,
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const allowed = hasPermission(role, permission);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
