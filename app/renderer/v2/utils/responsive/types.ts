/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   TYPES
=========================================================== */

export type DeviceType =

  | "desktop"

  | "tablet"

  | "mobile";



export interface ResponsiveBreakpoint {

  minWidth: number;

  maxWidth?: number;

}
