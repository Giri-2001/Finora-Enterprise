/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SEARCH HOOK™
=========================================================== */

import { useMemo, useState } from "react";

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import filterCustomers
  from "../selectors/filterCustomers";

/* ===========================================================
   HOOK
=========================================================== */

export default function useCustomerSearch(
  customers: OfficeCustomer[],
) {

  /* ==========================================
     STATE
  ========================================== */

  const [
    searchText,
    setSearchText,
  ] = useState("");

  /* ==========================================
     FILTERED CUSTOMERS
  ========================================== */

  const filteredCustomers =
    useMemo(() => {

      return filterCustomers(
        customers,
        searchText,
      );

    }, [
      customers,
      searchText,
    ]);

  /* ==========================================
     EXPORT
  ========================================== */

  return {

    searchText,

    setSearchText,

    filteredCustomers,

  };

}
