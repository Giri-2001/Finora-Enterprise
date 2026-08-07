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



  currentPage: number;


  totalCustomers: number;


  customersPerPage: number;


  onPrevious: () => void;


  onNext: () => void;


}
