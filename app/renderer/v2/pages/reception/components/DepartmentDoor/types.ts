/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   DEPARTMENT DOOR™

   TYPES
=========================================================== */

import type {
  DepartmentDoor,
} from "../../types";

/* ===========================================================
   PROPS
=========================================================== */

export interface DepartmentDoorProps {

  door: DepartmentDoor;

  onClick?: (
    door: DepartmentDoor,
  ) => void;

}
