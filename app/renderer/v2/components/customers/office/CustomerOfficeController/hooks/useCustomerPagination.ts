/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PAGINATION HOOK™
=========================================================== */

import { useMemo, useState } from "react";

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import paginateCustomers
  from "../selectors/paginateCustomers";

/* ===========================================================
   CONSTANTS
=========================================================== */

const CUSTOMERS_PER_PAGE = 7;

/* ===========================================================
   HOOK
=========================================================== */

export default function useCustomerPagination(
  customers: OfficeCustomer[],
) {

  /* ==========================================
     STATE
  ========================================== */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /* ==========================================
     PAGINATION
  ========================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      customers.length /
      CUSTOMERS_PER_PAGE,
    ),
  );

  const paginatedCustomers =
    useMemo(() => {

      return paginateCustomers(
        customers,
        currentPage,
        CUSTOMERS_PER_PAGE,
      );

    }, [
      customers,
      currentPage,
    ]);

  /* ==========================================
     ACTIONS
  ========================================== */

  function nextPage() {

    setCurrentPage((page) =>
      Math.min(
        page + 1,
        totalPages,
      ),
    );

  }

  function previousPage() {

    setCurrentPage((page) =>
      Math.max(
        page - 1,
        1,
      ),
    );

  }

  function resetPage() {

    setCurrentPage(1);

  }

  /* ==========================================
     EXPORT
  ========================================== */

  return {

    currentPage,

    totalPages,

    paginatedCustomers,

    nextPage,

    previousPage,

    resetPage,

    customersPerPage:
      CUSTOMERS_PER_PAGE,

  };

}
