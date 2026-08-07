/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   HELPERS
=========================================================== */

import type {
  DepartmentDoor,
  DepartmentStatus,
} from "./types";

/* ===========================================================
   STATUS LABEL
=========================================================== */

export function getStatusLabel(
  status: DepartmentStatus,
): string {

  switch (status) {

    case "ready":
      return "Ready";

    case "comingSoon":
      return "Coming Soon";

    case "locked":
      return "Locked";

    default:
      return "";

  }

}

/* ===========================================================
   STATUS COLOR
=========================================================== */

export function getStatusColor(
  status: DepartmentStatus,
): string {

  switch (status) {

    case "ready":
      return "#16A34A";

    case "comingSoon":
      return "#D97706";

    case "locked":
      return "#DC2626";

    default:
      return "#64748B";

  }

}

/* ===========================================================
   DOOR ENABLED
=========================================================== */

export function isDoorEnabled(
  door: DepartmentDoor,
): boolean {

  return door.status !== "locked";

}
