/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE CONTROLLER™

   HELPERS
=========================================================== */

export function getPageSlice(

  page: number,

  pageSize: number,

) {

  const start =

    (page - 1) * pageSize;

  const end =

    start + pageSize;

  return {

    start,

    end,

  };

}
