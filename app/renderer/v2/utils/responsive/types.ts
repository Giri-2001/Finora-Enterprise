/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   TYPES
=========================================================== */


/* ===========================================================
   DEVICE TYPE
=========================================================== */

export type DeviceType =
  | "desktop"
  | "tablet"
  | "mobile";


/* ===========================================================
   RESPONSIVE BREAKPOINT
=========================================================== */

export interface ResponsiveBreakpoint {

  minWidth:
    number;

  maxWidth?:
    number;

}


/* ===========================================================
   RESPONSIVE SIZE
=========================================================== */

export interface ResponsiveSize {

  width:
    number | string;

  height?:
    number | string;

}


/* ===========================================================
   RESPONSIVE SPACING
=========================================================== */

export interface ResponsiveSpacing {

  page:
    number;

  section:
    number;

  card:
    number;

  control:
    number;

  inline:
    number;

}


/* ===========================================================
   RESPONSIVE TYPOGRAPHY
=========================================================== */

export interface ResponsiveTypography {

  title:
    number;

  heading:
    number;

  body:
    number;

  small:
    number;

  label:
    number;

}


/* ===========================================================
   RESPONSIVE BORDER
=========================================================== */

export interface ResponsiveBorder {

  width:
    number;

  radius:
    number;

}


/* ===========================================================
   RESPONSIVE CONTROL
=========================================================== */

export interface ResponsiveControl {

  height:
    number;

  minHeight:
    number;

  radius:
    number;

}


/* ===========================================================
   RESPONSIVE CONTAINER
=========================================================== */

export interface ResponsiveContainer {

  width:
    number | string;

  maxWidth:
    number | string;

  padding:
    number;

}


/* ===========================================================
   END
=========================================================== */