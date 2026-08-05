/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER FILTER SELECTOR™
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

export default function filterCustomers(
  customers: OfficeCustomer[],
  searchText: string,
): OfficeCustomer[] {

  const keyword =
    searchText.trim().toLowerCase();

  if (!keyword) {

    return customers;

  }

  return customers.filter((customer) =>
    customer.name
      .toLowerCase()
      .includes(keyword),
  );

}
