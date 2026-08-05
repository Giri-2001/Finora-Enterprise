/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   HELPERS
=========================================================== */

/* ===========================================================
   FORMAT CUSTOMER COUNT
=========================================================== */

export function formatCustomerCount(
  count: number,
): string {
  return count.toLocaleString("en-IN");
}

/* ===========================================================
   BUILD SUBTITLE
=========================================================== */

export function buildSubtitle(
  subtitle?: string,
): string {
  return subtitle?.trim() || "Digital Finance Office";
}
