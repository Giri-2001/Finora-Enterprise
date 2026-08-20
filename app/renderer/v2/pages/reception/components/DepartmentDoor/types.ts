/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   DEPARTMENT DOOR™

   TYPES

   IMPORTANT
   -----------------------------------------------------------
   - DepartmentDoor data type is owned by Reception types.
   - This file must NOT duplicate DepartmentDoor.
   - DepartmentDoor component props are defined here.
   - No responsive geometry.
   - No theme definitions.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  DepartmentDoor,
} from "../../types";


/* ===========================================================
   DEPARTMENT DOOR PROPS
=========================================================== */

export interface DepartmentDoorProps {

  door:
    DepartmentDoor;

  onClick?: (
    door:
      DepartmentDoor,
  ) => void;

}


/* ===========================================================
   END
=========================================================== */