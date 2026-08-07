/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE TOOLBAR™

   HELPERS
=========================================================== */

/* ===========================================================
   COUNTER
=========================================================== */

export function buildCounterLabel(

  label: string,

  value: number | string,

): string {

  return `${label}: ${value}`;

}

/* ===========================================================
   SEARCH
=========================================================== */

export function normalizeSearchValue(

  value?: string,

): string {

  return value ?? "";

}

/* ===========================================================
   ACTION
=========================================================== */

export function hasAction(

  label: string,

): boolean {

  return label.trim().length > 0;

}
