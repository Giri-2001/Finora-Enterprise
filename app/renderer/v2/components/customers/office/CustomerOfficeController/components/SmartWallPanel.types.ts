/* ===========================================================
   FINORA ENTERPRISE OS™

   SMART WALL PANEL™

   TYPES
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CustomerRailItem } from "../../../hub/sections/CustomerHangerRail/types";

import type { SmartWallItem } from "../../../smartwall/CustomerSmartWall/types";

import type { OfficeCustomer } from "../../CustomerOffice/types";

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface SmartWallPanelProps {
  title?: string;

  /* =========================================================
     SMART WALL
  ========================================================= */

  smartWallCustomers: SmartWallItem[];

  /* =========================================================
     CUSTOMER RAIL
  ========================================================= */

  railCustomers: CustomerRailItem[];

  companyName?: string;

  /* =========================================================
     CUSTOMER SELECTION
  ========================================================= */

  selectedCustomerId?: string;

  selectedCustomer?: OfficeCustomer;

  onCustomerSelect?: (customer: CustomerRailItem) => void;

  /* =========================================================
     CUSTOMER OFFICE SEARCH
     
     Search is restricted by the Customer Office
     filter selector to approved customer identifiers.
  ========================================================= */

  searchText: string;

  /* =========================================================
     SEARCH CHANGE
  ========================================================= */

  onSearchChange: (value: string) => void;

  /* =========================================================
     CUSTOMER WIZARD
     
     Opens the Customer Wizard.
  ========================================================= */

  onOpenCustomerWizard?: () => void;

  /* =========================================================
     EDIT CUSTOMER
     
     Opens the Customer Wizard for the selected customer
     in Edit Mode.
  ========================================================= */

  onEditCustomer?: (customer: OfficeCustomer) => void;

  /* =========================================================
     WORK DESK
     
     Opens the existing Customer Work Desk.
     
     Navigation only.
     No new page is created here.
  ========================================================= */

  onOpenWorkspace?: () => void;

  /* =========================================================
     CUSTOMER DATA
     
     Opens the existing Customer Data destination.
     
     Navigation only.
     No new page is created here.
  ========================================================= */

  onOpenCustomerData?: () => void;

  /* =========================================================
     CLEAR SELECTION
  ========================================================= */

  onClearSelection?: () => void;

  /* =========================================================
     PAGINATION
  ========================================================= */

  currentPage: number;

  totalCustomers: number;

  customersPerPage: number;

  onPrevious: () => void;

  onNext: () => void;
}

/* ===========================================================
   END
=========================================================== */
