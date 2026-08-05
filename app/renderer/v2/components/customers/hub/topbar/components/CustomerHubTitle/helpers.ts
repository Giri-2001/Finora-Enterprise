/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HUB TITLE

   HELPERS
=========================================================== */

/* ===========================================================
   BUILD SUBTITLE
=========================================================== */

export function buildSubtitle(
  subtitle?: string,
): string {

  if (!subtitle) {

    return "Digital Finance Office";

  }

  const value = subtitle.trim();

  return value.length > 0
    ? value
    : "Digital Finance Office";

}

/* ===========================================================
   BUILD TITLE
=========================================================== */

export function buildTitle(
  title?: string,
): string {

  if (!title) {

    return "Customer Hub™";

  }

  const value = title.trim();

  return value.length > 0
    ? value
    : "Customer Hub™";

}
