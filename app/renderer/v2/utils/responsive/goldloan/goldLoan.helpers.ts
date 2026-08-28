/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE HELPERS

   MODULE  : Gold Loan
   LAYER   : Responsive Helpers
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Normalize viewport dimensions
   - Resolve Gold Loan device tier
   - Resolve device flags
   - Build safe Gold Loan viewport records
   - Provide structural responsive helpers

   IMPORTANT:

   - No React.
   - No window access.
   - No DOM access.
   - No theme logic.
   - No visual token values.
   - No component state.
   - No layout geometry calculations.

   The React hook will receive live viewport information
   from the canonical FINORA Responsive Engine and use
   these helpers only for Gold Loan-specific classification.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  GOLD_LOAN_DESKTOP,
  GOLD_LOAN_LAPTOP,
  GOLD_LOAN_MOBILE,
  GOLD_LOAN_TABLET,
  isGoldLoanDesktopWidth,
  isGoldLoanLaptopWidth,
  isGoldLoanMobileWidth,
  isGoldLoanTabletWidth,
  isValidGoldLoanViewportWidth,
} from "./goldLoan.breakpoints";

import type {
  GoldLoanDeviceFlags,
  GoldLoanResponsiveDevice,
  GoldLoanViewport,
} from "./goldLoan.types";

/* ===========================================================
   FALLBACK VIEWPORT
=========================================================== */

export const GOLD_LOAN_FALLBACK_WIDTH = 0;

export const GOLD_LOAN_FALLBACK_HEIGHT = 0;

/* ===========================================================
   SAFE VIEWPORT DIMENSION
=========================================================== */

export function getSafeGoldLoanViewportDimension(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

/* ===========================================================
   SAFE VIEWPORT WIDTH
=========================================================== */

export function getSafeGoldLoanViewportWidth(width: unknown): number {
  const safeWidth = getSafeGoldLoanViewportDimension(width);

  if (!isValidGoldLoanViewportWidth(safeWidth)) {
    return GOLD_LOAN_FALLBACK_WIDTH;
  }

  return safeWidth;
}

/* ===========================================================
   SAFE VIEWPORT HEIGHT
=========================================================== */

export function getSafeGoldLoanViewportHeight(height: unknown): number {
  return getSafeGoldLoanViewportDimension(height);
}

/* ===========================================================
   RESOLVE DEVICE
=========================================================== */

export function resolveGoldLoanDevice(width: number): GoldLoanResponsiveDevice {
  const safeWidth = getSafeGoldLoanViewportWidth(width);

  if (isGoldLoanDesktopWidth(safeWidth)) {
    return GOLD_LOAN_DESKTOP;
  }

  if (isGoldLoanLaptopWidth(safeWidth)) {
    return GOLD_LOAN_LAPTOP;
  }

  if (isGoldLoanTabletWidth(safeWidth)) {
    return GOLD_LOAN_TABLET;
  }

  if (isGoldLoanMobileWidth(safeWidth)) {
    return GOLD_LOAN_MOBILE;
  }

  return GOLD_LOAN_MOBILE;
}

/* ===========================================================
   DEVICE FLAGS
=========================================================== */

export function resolveGoldLoanDeviceFlags(
  device: GoldLoanResponsiveDevice,
): GoldLoanDeviceFlags {
  return {
    isMobile: device === GOLD_LOAN_MOBILE,

    isTablet: device === GOLD_LOAN_TABLET,

    isLaptop: device === GOLD_LOAN_LAPTOP,

    isDesktop: device === GOLD_LOAN_DESKTOP,
  };
}

/* ===========================================================
   DEVICE FLAGS FROM WIDTH
=========================================================== */

export function resolveGoldLoanDeviceFlagsFromWidth(
  width: number,
): GoldLoanDeviceFlags {
  return resolveGoldLoanDeviceFlags(resolveGoldLoanDevice(width));
}

/* ===========================================================
   BUILD VIEWPORT
=========================================================== */

export function createGoldLoanViewport(
  width: unknown,

  height: unknown,
): GoldLoanViewport {
  const safeWidth = getSafeGoldLoanViewportWidth(width);

  const safeHeight = getSafeGoldLoanViewportHeight(height);

  return {
    width: safeWidth,

    height: safeHeight,

    device: resolveGoldLoanDevice(safeWidth),
  };
}

/* ===========================================================
   COMPACT DEVICE

   Mobile + Tablet
=========================================================== */

export function isGoldLoanCompactDevice(
  device: GoldLoanResponsiveDevice,
): boolean {
  return device === GOLD_LOAN_MOBILE || device === GOLD_LOAN_TABLET;
}

/* ===========================================================
   LARGE DEVICE

   Laptop + Desktop
=========================================================== */

export function isGoldLoanLargeDevice(
  device: GoldLoanResponsiveDevice,
): boolean {
  return device === GOLD_LOAN_LAPTOP || device === GOLD_LOAN_DESKTOP;
}

/* ===========================================================
   CUSTOMER / LOCKER STACKING

   MOBILE:
   stacked

   TABLET:
   stacked

   LAPTOP:
   30 / 70

   DESKTOP:
   30 / 70
=========================================================== */

export function shouldStackGoldLoanTopWorkspace(
  device: GoldLoanResponsiveDevice,
): boolean {
  return isGoldLoanCompactDevice(device);
}

/* ===========================================================
   FORM FIELD COLUMN COUNT

   Structural helper only.

   Exact spacing / sizing belongs to responsive tokens
   and layout resolver.
=========================================================== */

export function resolveGoldLoanFormFieldColumns(
  device: GoldLoanResponsiveDevice,
): number {
  switch (device) {
    case GOLD_LOAN_DESKTOP:
      return 4;

    case GOLD_LOAN_LAPTOP:
      return 3;

    case GOLD_LOAN_TABLET:
      return 2;

    case GOLD_LOAN_MOBILE:
    default:
      return 1;
  }
}

/* ===========================================================
   GOLD ITEM GRID COLUMN COUNT
=========================================================== */

export function resolveGoldLoanItemColumns(
  device: GoldLoanResponsiveDevice,
): number {
  switch (device) {
    case GOLD_LOAN_DESKTOP:
      return 2;

    case GOLD_LOAN_LAPTOP:
      return 2;

    case GOLD_LOAN_TABLET:
      return 1;

    case GOLD_LOAN_MOBILE:
    default:
      return 1;
  }
}

/* ===========================================================
   RACK GRID COLUMN COUNT

   Desired:

   Desktop = 5
   Laptop  = 5
   Tablet  = 3
   Mobile  = 1

   Locker room itself remains horizontally comfortable
   while preserving readable occupancy/status information.
=========================================================== */

export function resolveGoldLoanRackColumns(
  device: GoldLoanResponsiveDevice,
): number {
  switch (device) {
    case GOLD_LOAN_DESKTOP:
      return 5;

    case GOLD_LOAN_LAPTOP:
      return 5;

    case GOLD_LOAN_TABLET:
      return 3;

    case GOLD_LOAN_MOBILE:
    default:
      return 1;
  }
}

/* ===========================================================
   LOCKER GRID COLUMN COUNT
=========================================================== */

export function resolveGoldLoanLockerColumns(
  device: GoldLoanResponsiveDevice,
): number {
  switch (device) {
    case GOLD_LOAN_DESKTOP:
      return 4;

    case GOLD_LOAN_LAPTOP:
      return 3;

    case GOLD_LOAN_TABLET:
      return 2;

    case GOLD_LOAN_MOBILE:
    default:
      return 1;
  }
}

/* ===========================================================
   SUMMARY GRID COLUMN COUNT
=========================================================== */

export function resolveGoldLoanSummaryColumns(
  device: GoldLoanResponsiveDevice,
): number {
  switch (device) {
    case GOLD_LOAN_DESKTOP:
      return 4;

    case GOLD_LOAN_LAPTOP:
      return 3;

    case GOLD_LOAN_TABLET:
      return 2;

    case GOLD_LOAN_MOBILE:
    default:
      return 1;
  }
}

/* ===========================================================
   ACTION COLUMN COUNT
=========================================================== */

export function resolveGoldLoanActionColumns(
  device: GoldLoanResponsiveDevice,
): number {
  return device === GOLD_LOAN_MOBILE ? 1 : 3;
}

/* ===========================================================
   RESPONSIVE VALUE CLAMP
=========================================================== */

export function clampGoldLoanResponsiveValue(
  value: number,

  minimum: number,

  maximum: number,
): number {
  const safeMinimum = Number.isFinite(minimum) ? minimum : 0;

  const safeMaximum = Number.isFinite(maximum)
    ? Math.max(safeMinimum, maximum)
    : safeMinimum;

  const safeValue = Number.isFinite(value) ? value : safeMinimum;

  return Math.min(safeMaximum, Math.max(safeMinimum, safeValue));
}

/* ===========================================================
   END
=========================================================== */
