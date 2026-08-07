/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   DEPARTMENT DOOR™

   HELPERS
=========================================================== */

import {
  getStatusColor,
  getStatusLabel,
  isDoorEnabled,
} from "../../helpers";

import type {
  DepartmentDoor,
} from "../../types";

/* ===========================================================
   STATUS
=========================================================== */

export function buildDoorStatus(
  door: DepartmentDoor,
) {

  return {

    label: getStatusLabel(
      door.status,
    ),

    color: getStatusColor(
      door.status,
    ),

    enabled: isDoorEnabled(
      door,
    ),

  };

}
