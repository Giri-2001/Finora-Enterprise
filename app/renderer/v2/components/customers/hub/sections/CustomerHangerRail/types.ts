/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   TYPES

   RESPONSIBILITY:
   - Customer Hanger Rail type contract
   - Customer collection input
   - Customer selection callback
   - No responsive logic
   - No viewport detection
   - No presentation logic
=========================================================== */


/* ===========================================================
   CUSTOMER ITEM
=========================================================== */

export interface CustomerRailItem {

  id: string;

  name: string;

  phone?: string;


  active: boolean;

  kycVerified: boolean;

  outstandingAmount: number;

  nextCollectionDate: string;

  photo?: string;

}


/* ===========================================================
   COMPONENT PROPS
=========================================================== */

export interface CustomerHangerRailProps {

  customers: CustomerRailItem[];

  companyName?: string;

  branchName?: string;

  selectedCustomerId?: string;

  onCustomerSelect?: (
    customer: CustomerRailItem,
  ) => void;

}


/* ===========================================================
   END
=========================================================== */