/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER RAIL™

   TYPES
=========================================================== */

/* ===========================================================
   CUSTOMER MODEL
=========================================================== */

export interface CustomerRailItem {

  id: string;

  name: string;

  branch: string;

  active: boolean;

  kycVerified: boolean;

  outstandingAmount: number;

  nextCollectionDate: string;

}

/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface CustomerHangerRailProps {

  title?: string;

  totalCustomers?: number;

  customers: CustomerRailItem[];

  selectedCustomerId?: string;

  onCustomerSelect?: (

    customer: CustomerRailItem,

  ) => void;

}
