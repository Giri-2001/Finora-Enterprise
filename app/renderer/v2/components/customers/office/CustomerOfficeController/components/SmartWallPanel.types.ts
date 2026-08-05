/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PANEL™

   TYPES
=========================================================== */

import type {
  CustomerRailItem,
} from "../../../hub/sections/CustomerHangerRail/types";

import type {
  SmartWallItem,
} from "../../../smartwall/CustomerSmartWall/types";

import type { OfficeCustomer } from "../../CustomerOffice/types";

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface SmartWallPanelProps {

  title?: string;

  smartWallCustomers: SmartWallItem[];

  railCustomers: CustomerRailItem[];

  selectedCustomerId?: string;

  onCustomerSelect?: (
    customer: CustomerRailItem,
  ) => void;

   currentPage: number;

  totalCustomers: number;

  customersPerPage: number;

  selectedCustomer?: OfficeCustomer;

  onPrevious: () => void;

  onNext: () => void;

}



