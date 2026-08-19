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

    const result =
      filterCustomers(
        customers,
        searchText,
      );

    console.log(
      "FINORA CUSTOMER SEARCH:",
      searchText,
      result.length,
    );

    return result;

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
