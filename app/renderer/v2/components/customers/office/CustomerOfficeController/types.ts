/* ===========================================================
   FINORA ENTERPRISE OSâ„¢

   CUSTOMER OFFICE CONTROLLERâ„¢

   TYPES
=========================================================== */

import type { OfficeCustomer } from "../CustomerOffice/types";

/* ===========================================================
   PROPS
=========================================================== */

export interface CustomerOfficeControllerProps {
  customers: OfficeCustomer[];

  companyName?: string;

  branchName?: string;

  addCustomerDisabled?: boolean;

  addCustomerTitle?: string;

  /**
   * Opens the Customer Wizard from the Customer Hub.
   */
  onOpenCustomerWizard?: () => void;

  /**
   * Opens the Customer Wizard in Edit Mode
   * for the currently selected customer.
   */
  onEditCustomer?: (customer: OfficeCustomer) => void;
}

