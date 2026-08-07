/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PAGINATION™

   HELPERS
=========================================================== */

import {

  IDS_PER_PAGE,

} from "./constants";

/* ===========================================================
   BUILD RANGE
=========================================================== */

export function buildRange(

  currentPage: number,

  customersPerPage = IDS_PER_PAGE,

) {

  const start =

    (currentPage - 1) * customersPerPage + 1;

  const end =

    currentPage * customersPerPage;

  return {

    start,

    end,

  };

}

/* ===========================================================
   TOTAL PAGES
=========================================================== */

export function buildTotalPages(

  totalCustomers: number,

  customersPerPage = IDS_PER_PAGE,

): number {

  return Math.max(

    1,

    Math.ceil(

      totalCustomers /

      customersPerPage,

    ),

  );

}

/* ===========================================================
   PAGE DOT BUILDER
=========================================================== */

export function getPageDots(
  totalPages: number,
) {

  return Array.from(
    {
      length: totalPages,
    },
    (_, index) => index + 1,
  );

}
