/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE CARD GRID™

   TYPES
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   PROPS
=========================================================== */

export interface EnterpriseCardGridProps {

  /* Cards */

  children: ReactNode;

  /* Optional */

  columns?: number;

  gap?: number;

  style?: CSSProperties;

}
