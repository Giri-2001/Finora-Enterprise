/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE CONTROLLER™

   TYPES
=========================================================== */

import type {
  OfficeCustomer,
} from "../CustomerOffice/types";

/* ===========================================================
   PROPS
=========================================================== */

export interface CustomerOfficeControllerProps {

  customers: OfficeCustomer[];

  /**
   * Opens the Customer Wizard from the Customer Hub.
   */
  onOpenCustomerWizard?: () => void;

  /**
   * Opens the Customer Wizard in Edit Mode
   * for the currently selected customer.
   */
  onEditCustomer?: (
    customer: OfficeCustomer,
  ) => void;

}
