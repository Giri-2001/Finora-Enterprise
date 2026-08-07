/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HALL™

   TYPES
=========================================================== */

import type {

  DepartmentDoor,

} from "../../types";

/* ===========================================================
   PROPS
=========================================================== */

export interface ReceptionHallProps {

  doors: DepartmentDoor[];

  onDoorClick?: (
    door: DepartmentDoor,
  ) => void;

}
