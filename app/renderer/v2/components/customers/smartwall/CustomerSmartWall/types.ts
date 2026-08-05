/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SMART WALL™

   TYPES
=========================================================== */

import type { ReactNode } from "react";

/* ===========================================================
   SMART WALL ITEM
=========================================================== */

export interface SmartWallItem {

  id: string;

  customerName: string;

  active: boolean;

}

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface CustomerSmartWallProps {

  title?: string;

  customers?: SmartWallItem[];

  children?: ReactNode;

}
