/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   HELPERS

   RESPONSIBILITY:
   - Pure Customer Hanger Rail helper functions
   - Text normalization only
   - No responsive logic
   - No viewport detection
   - No UI styling
=========================================================== */


/* ===========================================================
   BUILD TITLE
=========================================================== */

export function buildTitle(
  title: string,
): string {

  return title.trim();

}


/* ===========================================================
   BUILD TOTAL CUSTOMERS
=========================================================== */

export function buildTotalCustomers(
  totalCustomers: number,
): number {

  if (
    !Number.isFinite(
      totalCustomers,
    )
  ) {

    return 0;

  }


  return Math.max(
    0,
    Math.floor(
      totalCustomers,
    ),
  );

}


/* ===========================================================
   END
=========================================================== */