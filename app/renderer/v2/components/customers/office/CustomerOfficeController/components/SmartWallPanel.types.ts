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

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface SmartWallPanelProps {

  title?: string;

  smartWallCustomers: SmartWallItem[];

  railCustomers: CustomerRailItem[];

  selectedCustomerId?: string;

  selectedCustomer?: OfficeCustomer;

  onCustomerSelect?: (
    customer: CustomerRailItem,
  ) => void;

  /**
   * Opens the Customer Wizard.
   */
  onOpenCustomerWizard?: () => void;

  /**
   * Opens the Customer Wizard
   * for the selected customer in Edit Mode.
   */
  onEditCustomer?: (
    customer: OfficeCustomer,
  ) => void;

  onClearSelection?: () => void;

  currentPage: number;

  totalCustomers: number;

  customersPerPage: number;

  onPrevious: () => void;

  onNext: () => void;

}
