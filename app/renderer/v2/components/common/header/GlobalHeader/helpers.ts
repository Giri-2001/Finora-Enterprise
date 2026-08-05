/* ===========================================================
   FINORA ENTERPRISE OS™
   GLOBAL HEADER™

   HELPERS
=========================================================== */

import {
  DEFAULT_DEPARTMENT,
} from "./constants";

/* ===========================================================
   BUILD DEPARTMENT TITLE
=========================================================== */

export function buildDepartmentTitle(

  department?: string,

): string {

  if (

    !department ||

    department.trim().length === 0

  ) {

    return DEFAULT_DEPARTMENT;

  }

  return department.trim();

}
