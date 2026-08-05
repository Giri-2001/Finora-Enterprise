/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PAGINATION SELECTOR™
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

export default function paginateCustomers(
  customers: OfficeCustomer[],
  currentPage: number,
  customersPerPage: number,
): OfficeCustomer[] {

  const start =
    (currentPage - 1) *
    customersPerPage;

  return customers.slice(
    start,
    start + customersPerPage,
  );

}
