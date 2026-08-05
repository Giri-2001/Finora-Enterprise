/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS™
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

export function selectCustomer(
  customer: OfficeCustomer,
  onSelect: (
    customer: OfficeCustomer,
  ) => void,
) {

  onSelect(customer);

}
