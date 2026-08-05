/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE CONTROLLER™

   ASSEMBLY HOOK
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import useCustomerSelection
  from "./useCustomerSelection";

import useCustomerSearch
  from "./useCustomerSearch";

import useCustomerPagination
  from "./useCustomerPagination";

import smartWallMapper
  from "../mappers/smartWallMapper";

/* ===========================================================
   HOOK
=========================================================== */

export default function useCustomerOfficeController(

  customers: OfficeCustomer[],

) {

  /* ==========================================
     SEARCH
  ========================================== */

  const search =
    useCustomerSearch(
      customers,
    );

  /* ==========================================
     PAGINATION
  ========================================== */

  const pagination =
    useCustomerPagination(
      search.filteredCustomers,
    );

  /* ==========================================
     SELECTION
  ========================================== */

  const selection =
    useCustomerSelection(
      pagination.paginatedCustomers,
    );

  /* ==========================================
     SMART WALL
  ========================================== */

  const smartWallCustomers =
    smartWallMapper(
      pagination.paginatedCustomers,
    );

  /* ==========================================
     EXPORT
  ========================================== */

  return {

    /* Selection */

    selectedCustomer:
      selection.selectedCustomer,

    selectCustomer:
      selection.selectCustomer,

    clearSelection:
      selection.clearSelection,

    /* Search */

    searchText:
      search.searchText,

    setSearchText:
      search.setSearchText,

    filteredCustomers:
      search.filteredCustomers,

    /* Pagination */

    currentPage:
      pagination.currentPage,

    totalPages:
      pagination.totalPages,

    customersPerPage:
      pagination.customersPerPage,

    paginatedCustomers:
      pagination.paginatedCustomers,

    nextPage:
      pagination.nextPage,

    previousPage:
      pagination.previousPage,

    resetPage:
      pagination.resetPage,

    /* Smart Wall */

    smartWallCustomers,

  };

}
