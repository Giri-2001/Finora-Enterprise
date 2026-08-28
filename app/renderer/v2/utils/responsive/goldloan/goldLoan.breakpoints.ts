/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE BREAKPOINTS

   MODULE  : Gold Loan
   LAYER   : Responsive Boundaries
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Expose Gold Loan responsive viewport boundaries
   - Keep Gold Loan aligned with FINORA global device system
   - Provide width classification helpers
   - Provide viewport validation helpers

   FINORA DEVICE SYSTEM:

   MOBILE
   0px - 767px

   TABLET
   768px - 1023px

   LAPTOP
   1024px - 1599px

   DESKTOP
   1600px+

   IMPORTANT:

   - No visual values.
   - No layout calculations.
   - No React.
   - No theme logic.
   - No component logic.
   - These boundaries MUST remain aligned with the
     canonical FINORA Responsive Engine.
=========================================================== */

/* ===========================================================
   MOBILE
=========================================================== */

export const GOLD_LOAN_MOBILE_MIN_WIDTH = 0;

export const GOLD_LOAN_MOBILE_MAX_WIDTH = 767;

/* ===========================================================
   TABLET
=========================================================== */

export const GOLD_LOAN_TABLET_MIN_WIDTH = 768;

export const GOLD_LOAN_TABLET_MAX_WIDTH = 1023;

/* ===========================================================
   LAPTOP
=========================================================== */

export const GOLD_LOAN_LAPTOP_MIN_WIDTH = 1024;

export const GOLD_LOAN_LAPTOP_MAX_WIDTH = 1599;

/* ===========================================================
   DESKTOP
=========================================================== */

export const GOLD_LOAN_DESKTOP_MIN_WIDTH = 1600;

/* ===========================================================
   BREAKPOINT NAMES
=========================================================== */

export const GOLD_LOAN_MOBILE = "mobile" as const;

export const GOLD_LOAN_TABLET = "tablet" as const;

export const GOLD_LOAN_LAPTOP = "laptop" as const;

export const GOLD_LOAN_DESKTOP = "desktop" as const;

/* ===========================================================
   VALID VIEWPORT WIDTH
=========================================================== */

export function isValidGoldLoanViewportWidth(width: number): boolean {
  return Number.isFinite(width) && width >= 0;
}

/* ===========================================================
   MOBILE WIDTH
=========================================================== */

export function isGoldLoanMobileWidth(width: number): boolean {
  if (!isValidGoldLoanViewportWidth(width)) {
    return true;
  }

  return (
    width >= GOLD_LOAN_MOBILE_MIN_WIDTH && width <= GOLD_LOAN_MOBILE_MAX_WIDTH
  );
}

/* ===========================================================
   TABLET WIDTH
=========================================================== */

export function isGoldLoanTabletWidth(width: number): boolean {
  if (!isValidGoldLoanViewportWidth(width)) {
    return false;
  }

  return (
    width >= GOLD_LOAN_TABLET_MIN_WIDTH && width <= GOLD_LOAN_TABLET_MAX_WIDTH
  );
}

/* ===========================================================
   LAPTOP WIDTH
=========================================================== */

export function isGoldLoanLaptopWidth(width: number): boolean {
  if (!isValidGoldLoanViewportWidth(width)) {
    return false;
  }

  return (
    width >= GOLD_LOAN_LAPTOP_MIN_WIDTH && width <= GOLD_LOAN_LAPTOP_MAX_WIDTH
  );
}

/* ===========================================================
   DESKTOP WIDTH
=========================================================== */

export function isGoldLoanDesktopWidth(width: number): boolean {
  if (!isValidGoldLoanViewportWidth(width)) {
    return false;
  }

  return width >= GOLD_LOAN_DESKTOP_MIN_WIDTH;
}

/* ===========================================================
   MOBILE OR TABLET WIDTH
=========================================================== */

export function isGoldLoanCompactWidth(width: number): boolean {
  return isGoldLoanMobileWidth(width) || isGoldLoanTabletWidth(width);
}

/* ===========================================================
   LAPTOP OR DESKTOP WIDTH
=========================================================== */

export function isGoldLoanLargeWidth(width: number): boolean {
  return isGoldLoanLaptopWidth(width) || isGoldLoanDesktopWidth(width);
}

/* ===========================================================
   BREAKPOINT BOUNDARY

   Useful for diagnostics and responsive testing.

   Returns true only at exact device transition widths.
=========================================================== */

export function isGoldLoanBreakpointBoundary(width: number): boolean {
  return (
    width === GOLD_LOAN_TABLET_MIN_WIDTH ||
    width === GOLD_LOAN_LAPTOP_MIN_WIDTH ||
    width === GOLD_LOAN_DESKTOP_MIN_WIDTH
  );
}

/* ===========================================================
   WIDTH BETWEEN
=========================================================== */

export function isGoldLoanWidthBetween(
  width: number,

  minimum: number,

  maximum: number,
): boolean {
  if (!isValidGoldLoanViewportWidth(width)) {
    return false;
  }

  const safeMinimum = Math.max(0, Number.isFinite(minimum) ? minimum : 0);

  const safeMaximum = Number.isFinite(maximum)
    ? Math.max(safeMinimum, maximum)
    : Number.POSITIVE_INFINITY;

  return width >= safeMinimum && width <= safeMaximum;
}

/* ===========================================================
   END
=========================================================== */
