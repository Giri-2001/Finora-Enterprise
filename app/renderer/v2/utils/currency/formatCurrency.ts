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


  if (!Number.isFinite(value)) {

    return "0";

  }


  return Math.round(

    value,

  ).toLocaleString(

    "en-IN",

    {

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,

    },

  );


}


/* ===========================================================
   FORMAT INDIAN RUPEE

   UI DISPLAY AUTHORITY:

   1000   -> ₹1,000
   9999   -> ₹9,999
   10000  -> ₹10,000
   100000 -> ₹1,00,000

   Financial precision remains unchanged outside presentation.
=========================================================== */

export function formatRupee(

  value: number,

): string {

  return `₹${formatCurrency(value)}`;

}
