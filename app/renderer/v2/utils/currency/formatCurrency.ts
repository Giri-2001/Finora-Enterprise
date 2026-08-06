/* ===========================================================
   FINORA ENTERPRISE OS™

   CURRENCY FORMATTER™

   GLOBAL MONEY DISPLAY
=========================================================== */


/* ===========================================================
   FORMAT CURRENCY
=========================================================== */

export function formatCurrency(

  value: number,

): string {


  if (

    isNaN(value)

  ) {

    return "0";

  }


  return Math.round(

    value,

  ).toLocaleString(

    "en-IN",

  );


}
