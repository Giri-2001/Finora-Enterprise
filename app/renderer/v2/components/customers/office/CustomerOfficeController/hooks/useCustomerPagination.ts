/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PAGINATION HOOK™
=========================================================== */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import paginateCustomers
  from "../selectors/paginateCustomers";

import {
  getCustomerCardsPerPage,
} from "../../../../../utils/responsive";

import useResponsive
  from "../../../../../utils/responsive/useResponsive";

/* ===========================================================
   HOOK
=========================================================== */

export default function useCustomerPagination(
  customers: OfficeCustomer[],
) {

  /* ==========================================
     RESPONSIVE
  ========================================== */

  const responsive =
    useResponsive();

  const customersPerPage =
    getCustomerCardsPerPage(
      responsive.width,
    );

    /* ==========================================
   RESPONSIVE RESET
========================================== */

useEffect(() => {

  setCurrentPage(1);

}, [

  customersPerPage,

]);

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
      customersPerPage,
    ),
  );

  const paginatedCustomers =
    useMemo(() => {

      return paginateCustomers(
        customers,
        currentPage,
        customersPerPage,
      );

    }, [
      customers,
      currentPage,
      customersPerPage,
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

    customersPerPage,

  };

}
