/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER DEPARTMENT HEADER™

   HELPERS
=========================================================== */

/* ===========================================================
   BUILD GREETING
=========================================================== */

export function buildGreeting(
  adminName?: string,
): string {

  if (!adminName) {

    return "Good Morning.";

  }

  return `Good Morning, ${adminName}.`;

}
